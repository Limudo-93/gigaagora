-- ============================================
-- CORREÇÃO: Permitir múltiplos músicos aceitarem a mesma gig
-- ============================================
-- Problema: A lógica atual bloqueia múltiplos aceites
-- Solução: Permitir que vários músicos aceitem, mas apenas um seja confirmado pelo contratante
-- ============================================

-- ============================================
-- 1. ATUALIZAR rpc_accept_invite
--    Remover bloqueio de múltiplos aceites
--    Não criar confirmação automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION rpc_accept_invite(p_invite_id UUID)
RETURNS JSON AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
BEGIN
  -- Obter o ID do usuário logado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Usuário não autenticado'
    );
  END IF;

  -- Buscar o invite
  SELECT i.* INTO v_invite
  FROM invites i
  WHERE i.id = p_invite_id;

  -- Verificar se o invite existe
  IF v_invite IS NULL THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Convite não encontrado'
    );
  END IF;

  -- Verificar se o invite pertence ao usuário logado
  IF v_invite.musician_id != v_user_id THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Você não tem permissão para aceitar este convite'
    );
  END IF;

  -- Verificar se o invite está pendente
  IF v_invite.status != 'pending' THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Este convite já foi respondido'
    );
  END IF;

  -- Atualizar o invite para aceito
  -- NÃO criamos confirmação automaticamente - isso será feito pelo contratante
  UPDATE invites
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    responded_at = NOW()
  WHERE id = p_invite_id;

  RETURN json_build_object(
    'ok', true,
    'message', 'Convite aceito com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION rpc_accept_invite(UUID) TO authenticated;

-- Comentário
COMMENT ON FUNCTION rpc_accept_invite(UUID) IS 'Aceita um convite pendente. Múltiplos músicos podem aceitar a mesma gig. O contratante escolhe qual confirmar.';

-- ============================================
-- 2. ATUALIZAR trigger check_single_confirmation_per_role
--    Permitir múltiplas confirmações, mas apenas uma com confirmed = true
--    Quando uma nova confirmação é marcada como true, desconfirma as outras da mesma role
-- ============================================

CREATE OR REPLACE FUNCTION check_single_confirmation_per_role()
RETURNS TRIGGER AS $$
DECLARE
  v_gig_role_id UUID;
  v_existing_confirmation UUID;
BEGIN
  -- Obter o gig_role_id do invite
  SELECT gig_role_id INTO v_gig_role_id
  FROM invites
  WHERE id = NEW.invite_id;

  -- Se está confirmando (confirmed = true), verificar se já existe outra confirmação confirmada para esta role
  IF NEW.confirmed = true THEN
    SELECT c.id INTO v_existing_confirmation
    FROM confirmations c
    INNER JOIN invites i ON i.id = c.invite_id
    WHERE i.gig_role_id = v_gig_role_id
      AND c.confirmed = true
      AND c.id != NEW.id
    LIMIT 1;

    -- Se já existe uma confirmação confirmada, desconfirmar a anterior
    IF v_existing_confirmation IS NOT NULL THEN
      UPDATE confirmations
      SET confirmed = false,
          confirmed_at = NULL
      WHERE id = v_existing_confirmation;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_check_single_confirmation_per_role ON confirmations;
CREATE TRIGGER trigger_check_single_confirmation_per_role
  BEFORE INSERT OR UPDATE ON confirmations
  FOR EACH ROW
  EXECUTE FUNCTION check_single_confirmation_per_role();

-- ============================================
-- 3. REMOVER índice único que bloqueia múltiplas confirmações
-- ============================================

-- O índice único estava impedindo múltiplas confirmações
-- Agora permitimos múltiplas confirmações, mas apenas uma com confirmed = true
DROP INDEX IF EXISTS unique_confirmed_per_role;

-- ============================================
-- 4. CRIAR função para o contratante confirmar um músico
-- ============================================

CREATE OR REPLACE FUNCTION rpc_confirm_musician(p_invite_id UUID, p_confirmed BOOLEAN DEFAULT true)
RETURNS JSON AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
  v_gig RECORD;
BEGIN
  -- Obter o ID do usuário logado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Usuário não autenticado'
    );
  END IF;

  -- Buscar o invite com informações da gig
  SELECT i.*, g.contractor_id INTO v_invite
  FROM invites i
  INNER JOIN gigs g ON g.id = i.gig_id
  WHERE i.id = p_invite_id;

  -- Verificar se o invite existe
  IF v_invite IS NULL THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Convite não encontrado'
    );
  END IF;

  -- Verificar se o usuário é o contratante da gig
  IF v_invite.contractor_id != v_user_id THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Apenas o contratante pode confirmar músicos'
    );
  END IF;

  -- Verificar se o invite foi aceito
  IF v_invite.status != 'accepted' THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'O músico precisa aceitar o convite primeiro'
    );
  END IF;

  -- Criar ou atualizar confirmação
  INSERT INTO confirmations (
    invite_id,
    musician_id,
    confirmed,
    confirmed_at
  ) VALUES (
    p_invite_id,
    v_invite.musician_id,
    p_confirmed,
    CASE WHEN p_confirmed THEN NOW() ELSE NULL END
  )
  ON CONFLICT (invite_id) DO UPDATE
  SET 
    confirmed = p_confirmed,
    confirmed_at = CASE WHEN p_confirmed THEN NOW() ELSE NULL END;

  RETURN json_build_object(
    'ok', true,
    'message', CASE WHEN p_confirmed THEN 'Músico confirmado com sucesso' ELSE 'Confirmação removida' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION rpc_confirm_musician(UUID, BOOLEAN) TO authenticated;

-- Comentário
COMMENT ON FUNCTION rpc_confirm_musician(UUID, BOOLEAN) IS 'Permite ao contratante confirmar ou desconfirmar um músico. Apenas um músico pode ser confirmado por role.';

-- ============================================
-- 5. VERIFICAÇÕES
-- ============================================

-- Verificar se a função foi atualizada
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname IN ('rpc_accept_invite', 'rpc_confirm_musician', 'check_single_confirmation_per_role')
ORDER BY proname;

-- Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_check_single_confirmation_per_role';

