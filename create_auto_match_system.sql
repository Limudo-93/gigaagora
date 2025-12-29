-- ============================================
-- Sistema de Match Automático
-- Cria invites automaticamente quando uma gig é criada
-- ============================================

-- Função para criar invites automaticamente para músicos compatíveis
CREATE OR REPLACE FUNCTION auto_create_invites_for_gig()
RETURNS TRIGGER AS $$
DECLARE
  role_record RECORD;
  musician_record RECORD;
  v_invite_id UUID;
BEGIN
  -- Só processa se a gig está publicada
  IF NEW.status != 'published' THEN
    RETURN NEW;
  END IF;

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
      -- Verifica se já existe um invite para evitar duplicatas
      SELECT id INTO v_invite_id
      FROM invites
      WHERE gig_id = NEW.id
        AND gig_role_id = role_record.id
        AND musician_id = musician_record.user_id
      LIMIT 1;

      -- Se não existe, cria o invite
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
      END IF;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar automaticamente quando uma gig é criada ou atualizada para published
DROP TRIGGER IF EXISTS trigger_auto_create_invites ON gigs;

CREATE TRIGGER trigger_auto_create_invites
  AFTER INSERT OR UPDATE ON gigs
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION auto_create_invites_for_gig();

-- Função para criar invites quando roles são adicionadas a uma gig já publicada
CREATE OR REPLACE FUNCTION auto_create_invites_for_role()
RETURNS TRIGGER AS $$
DECLARE
  gig_record RECORD;
  musician_record RECORD;
  v_invite_id UUID;
BEGIN
  -- Busca a gig associada
  SELECT * INTO gig_record
  FROM gigs
  WHERE id = NEW.gig_id;

  -- Só processa se a gig está publicada
  IF gig_record.status != 'published' THEN
    RETURN NEW;
  END IF;

  -- Busca músicos que tocam o instrumento necessário
  FOR musician_record IN
    SELECT DISTINCT mp.user_id
    FROM musician_profiles mp
    INNER JOIN profiles p ON p.user_id = mp.user_id
    WHERE 
      -- Músico toca o instrumento necessário
      NEW.instrument = ANY(mp.instruments)
      -- E tem perfil ativo
      AND p.user_type = 'musician'
      -- E não é o próprio contratante
      AND mp.user_id != gig_record.contractor_id
      -- E não está bloqueado
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE b.musician_id = mp.user_id
        AND b.starts_at <= gig_record.start_time
        AND b.ends_at >= gig_record.start_time
      )
  LOOP
    -- Verifica se já existe um invite
    SELECT id INTO v_invite_id
    FROM invites
    WHERE gig_id = NEW.gig_id
      AND gig_role_id = NEW.id
      AND musician_id = musician_record.user_id
    LIMIT 1;

    -- Se não existe, cria o invite
    IF v_invite_id IS NULL THEN
      INSERT INTO invites (
        gig_id,
        gig_role_id,
        contractor_id,
        musician_id,
        status,
        invited_at
      ) VALUES (
        NEW.gig_id,
        NEW.id,
        gig_record.contractor_id,
        musician_record.user_id,
        'pending',
        NOW()
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar quando uma role é adicionada
DROP TRIGGER IF EXISTS trigger_auto_create_invites_for_role ON gig_roles;

CREATE TRIGGER trigger_auto_create_invites_for_role
  AFTER INSERT ON gig_roles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_invites_for_role();

-- ============================================
-- RPC para listar músicos que aceitaram uma gig
-- ============================================
CREATE OR REPLACE FUNCTION rpc_list_accepted_musicians_for_gig(p_gig_id UUID)
RETURNS TABLE (
  invite_id UUID,
  musician_id UUID,
  musician_name TEXT,
  musician_photo_url TEXT,
  instrument TEXT,
  gig_role_id UUID,
  accepted_at TIMESTAMPTZ,
  avg_rating NUMERIC,
  rating_count INTEGER,
  city TEXT,
  state TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as invite_id,
    i.musician_id,
    p.display_name as musician_name,
    p.photo_url as musician_photo_url,
    gr.instrument,
    i.gig_role_id,
    i.accepted_at,
    mp.avg_rating,
    mp.rating_count,
    p.city,
    p.state
  FROM invites i
  INNER JOIN gig_roles gr ON gr.id = i.gig_role_id
  INNER JOIN profiles p ON p.user_id = i.musician_id
  LEFT JOIN musician_profiles mp ON mp.user_id = i.musician_id
  WHERE 
    i.gig_id = p_gig_id
    AND i.status = 'accepted'
  ORDER BY i.accepted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões para a função de listagem
GRANT EXECUTE ON FUNCTION rpc_list_accepted_musicians_for_gig(UUID) TO authenticated, anon;

-- ============================================
-- Comentários para documentação
-- ============================================
COMMENT ON FUNCTION auto_create_invites_for_gig() IS 'Cria invites automaticamente para músicos compatíveis quando uma gig é publicada';
COMMENT ON FUNCTION auto_create_invites_for_role() IS 'Cria invites automaticamente quando uma role é adicionada a uma gig publicada';
COMMENT ON FUNCTION rpc_list_accepted_musicians_for_gig(UUID) IS 'Lista todos os músicos que aceitaram uma gig específica';

