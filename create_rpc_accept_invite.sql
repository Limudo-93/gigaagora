-- ============================================
-- Função RPC para aceitar um convite
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
  SELECT * INTO v_invite
  FROM invites
  WHERE id = p_invite_id;

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
COMMENT ON FUNCTION rpc_accept_invite(UUID) IS 'Aceita um convite pendente, atualizando o status para accepted e definindo accepted_at';

