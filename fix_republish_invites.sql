-- ============================================
-- CORREÇÃO: Quando uma gig é republicada, criar novos invites
-- para todos os músicos compatíveis
-- ============================================

-- ============================================
-- 1. ATUALIZAR função auto_create_invites_for_gig
--    Para criar novos invites quando uma gig é republicada,
--    mesmo que já existam invites antigos (recusados/cancelados)
-- ============================================

CREATE OR REPLACE FUNCTION auto_create_invites_for_gig()
RETURNS TRIGGER AS $$
DECLARE
  role_record RECORD;
  musician_record RECORD;
  v_invite_id UUID;
  v_existing_status TEXT;
BEGIN
  -- Só processa se a gig está publicada
  IF NEW.status != 'published' THEN
    RETURN NEW;
  END IF;

  -- Se a gig foi atualizada de um status diferente para 'published',
  -- isso significa que está sendo republicada
  -- Nesse caso, precisamos criar novos invites ou resetar os antigos

  -- Para cada role da gig
  FOR role_record IN 
    SELECT id, instrument, desired_genres, quantity
    FROM gig_roles
    WHERE gig_id = NEW.id
  LOOP
    -- Busca músicos que tocam o instrumento necessário
    FOR musician_record IN
      SELECT DISTINCT mp.user_id
      FROM musician_profiles mp
      INNER JOIN profiles p ON p.user_id = mp.user_id
      WHERE 
        -- Músico toca o instrumento necessário
        role_record.instrument = ANY(mp.instruments)
        -- E tem perfil ativo
        AND p.user_type = 'musician'
        -- E não é o próprio contratante
        AND mp.user_id != NEW.contractor_id
        -- E não está bloqueado (se houver tabela de blocks)
        AND NOT EXISTS (
          SELECT 1 FROM blocks b
          WHERE b.musician_id = mp.user_id
          AND b.starts_at <= NEW.start_time
          AND b.ends_at >= NEW.start_time
        )
    LOOP
      -- Verifica se já existe um invite e qual é o status
      SELECT id, status INTO v_invite_id, v_existing_status
      FROM invites
      WHERE gig_id = NEW.id
        AND gig_role_id = role_record.id
        AND musician_id = musician_record.user_id
      LIMIT 1;

      -- Se não existe invite, cria um novo
      IF v_invite_id IS NULL THEN
        INSERT INTO invites (
          gig_id,
          gig_role_id,
          contractor_id,
          musician_id,
          status,
          invited_at
        ) VALUES (
          NEW.id,
          role_record.id,
          NEW.contractor_id,
          musician_record.user_id,
          'pending',
          NOW()
        );
      -- Se existe um invite mas está recusado, cancelado ou declinado,
      -- resetar para 'pending' e atualizar invited_at
      ELSIF v_existing_status IN ('declined', 'cancelled', 'rejected') THEN
        UPDATE invites
        SET 
          status = 'pending',
          invited_at = NOW(),
          declined_at = NULL,
          cancelled_at = NULL,
          responded_at = NULL,
          accepted_at = NULL
        WHERE id = v_invite_id;
      -- Se o invite já está como 'pending' ou 'accepted', não faz nada
      -- (não queremos resetar invites que já foram aceitos ou que ainda estão pendentes)
      END IF;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Garantir que o trigger está configurado corretamente
DROP TRIGGER IF EXISTS trigger_auto_create_invites ON gigs;

CREATE TRIGGER trigger_auto_create_invites
  AFTER INSERT OR UPDATE ON gigs
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION auto_create_invites_for_gig();

-- ============================================
-- 2. CRIAR função RPC para republicar uma gig manualmente
--    Útil para quando o contratante quer forçar a criação de novos invites
-- ============================================

CREATE OR REPLACE FUNCTION rpc_republish_gig(p_gig_id UUID)
RETURNS JSON AS $$
DECLARE
  v_gig RECORD;
  role_record RECORD;
  musician_record RECORD;
  v_invite_id UUID;
  v_existing_status TEXT;
  v_invites_created INTEGER := 0;
  v_invites_reset INTEGER := 0;
BEGIN
  -- Buscar a gig
  SELECT * INTO v_gig
  FROM gigs
  WHERE id = p_gig_id;

  IF v_gig IS NULL THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Gig não encontrada'
    );
  END IF;

  -- Verificar se o usuário é o contratante
  IF v_gig.contractor_id != auth.uid() THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Apenas o contratante pode republicar a gig'
    );
  END IF;

  -- Atualizar status para published (se não estiver)
  IF v_gig.status != 'published' THEN
    UPDATE gigs
    SET status = 'published'
    WHERE id = p_gig_id;
  END IF;

  -- Para cada role da gig
  FOR role_record IN 
    SELECT id, instrument, desired_genres, quantity
    FROM gig_roles
    WHERE gig_id = p_gig_id
  LOOP
    -- Busca músicos que tocam o instrumento necessário
    FOR musician_record IN
      SELECT DISTINCT mp.user_id
      FROM musician_profiles mp
      INNER JOIN profiles p ON p.user_id = mp.user_id
      WHERE 
        role_record.instrument = ANY(mp.instruments)
        AND p.user_type = 'musician'
        AND mp.user_id != v_gig.contractor_id
        AND NOT EXISTS (
          SELECT 1 FROM blocks b
          WHERE b.musician_id = mp.user_id
          AND b.starts_at <= v_gig.start_time
          AND b.ends_at >= v_gig.start_time
        )
    LOOP
      -- Verifica se já existe um invite
      SELECT id, status INTO v_invite_id, v_existing_status
      FROM invites
      WHERE gig_id = p_gig_id
        AND gig_role_id = role_record.id
        AND musician_id = musician_record.user_id
      LIMIT 1;

      -- Se não existe, cria um novo
      IF v_invite_id IS NULL THEN
        INSERT INTO invites (
          gig_id,
          gig_role_id,
          contractor_id,
          musician_id,
          status,
          invited_at
        ) VALUES (
          p_gig_id,
          role_record.id,
          v_gig.contractor_id,
          musician_record.user_id,
          'pending',
          NOW()
        );
        v_invites_created := v_invites_created + 1;
      -- Se existe mas está recusado/cancelado, reseta
      ELSIF v_existing_status IN ('declined', 'cancelled', 'rejected') THEN
        UPDATE invites
        SET 
          status = 'pending',
          invited_at = NOW(),
          declined_at = NULL,
          cancelled_at = NULL,
          responded_at = NULL,
          accepted_at = NULL
        WHERE id = v_invite_id;
        v_invites_reset := v_invites_reset + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN json_build_object(
    'ok', true,
    'message', format('Gig republicada com sucesso. %s novos invites criados, %s invites resetados.', 
                      v_invites_created, v_invites_reset),
    'invites_created', v_invites_created,
    'invites_reset', v_invites_reset
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION rpc_republish_gig(UUID) TO authenticated;

-- Comentário
COMMENT ON FUNCTION rpc_republish_gig(UUID) IS 'Republica uma gig, criando novos invites para músicos compatíveis e resetando invites recusados/cancelados';

-- ============================================
-- 3. VERIFICAÇÕES
-- ============================================

-- Verificar se a função foi atualizada
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname IN ('auto_create_invites_for_gig', 'rpc_republish_gig')
ORDER BY proname;

-- Verificar se o trigger está ativo
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_create_invites';

