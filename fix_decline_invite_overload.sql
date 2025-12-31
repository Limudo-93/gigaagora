-- ============================================
-- CORREÇÃO: Conflito de sobrecarga na função rpc_decline_invite
-- ============================================
-- Este script resolve o erro de ambiguidade ao chamar rpc_decline_invite
-- removendo a versão antiga e garantindo que apenas a versão nova exista

-- 1. Remover todas as versões existentes da função
DROP FUNCTION IF EXISTS rpc_decline_invite(UUID);
DROP FUNCTION IF EXISTS rpc_decline_invite(UUID, TEXT);

-- 2. Criar a função única com parâmetro opcional
CREATE OR REPLACE FUNCTION rpc_decline_invite(
  p_invite_id UUID,
  p_decline_reason TEXT DEFAULT NULL
)
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
      'message', 'Você não tem permissão para recusar este convite'
    );
  END IF;

  -- Verificar se o invite está pendente
  IF v_invite.status != 'pending' THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Este convite já foi respondido'
    );
  END IF;

  -- Validar motivo de recusa (se fornecido)
  IF p_decline_reason IS NOT NULL AND p_decline_reason NOT IN (
    'low_value', 
    'distance', 
    'unavailable', 
    'schedule_conflict', 
    'not_interested', 
    'other'
  ) THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Motivo de recusa inválido'
    );
  END IF;

  -- Atualizar o invite para recusado com motivo
  UPDATE invites
  SET 
    status = 'declined',
    decline_reason = p_decline_reason,
    responded_at = NOW()
  WHERE id = p_invite_id;

  RETURN json_build_object(
    'ok', true,
    'message', 'Convite recusado com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION rpc_decline_invite(UUID, TEXT) TO authenticated;

-- Comentário
COMMENT ON FUNCTION rpc_decline_invite(UUID, TEXT) IS 'Recusa um convite pendente, atualizando o status para declined, armazenando o motivo de recusa (opcional) e definindo responded_at. Pode ser chamada com apenas o invite_id (motivo será NULL) ou com ambos os parâmetros.';

