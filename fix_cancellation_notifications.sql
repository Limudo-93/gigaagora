-- ============================================
-- Corrigir função rpc_create_cancellation_notification
-- O erro indica que está tentando usar ON CONFLICT sem constraint única
-- ============================================

-- 1. Verificar se há constraint única na tabela
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'cancellation_notifications'::regclass
AND contype = 'u';

-- 2. Criar constraint única se não existir
-- Previne notificações duplicadas para o mesmo invite não lido
CREATE UNIQUE INDEX IF NOT EXISTS idx_cancellation_notifications_unique 
ON cancellation_notifications(contractor_id, gig_id, invite_id) 
WHERE read_at IS NULL;

-- 3. Recriar a função sem ON CONFLICT (já usa IF NOT EXISTS logic)
-- A função atual já verifica antes de inserir, então não precisa de ON CONFLICT
-- Mas vamos garantir que está correta

CREATE OR REPLACE FUNCTION rpc_create_cancellation_notification(
  p_contractor_id UUID,
  p_gig_id UUID,
  p_invite_id UUID,
  p_musician_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_musician_name TEXT;
  v_gig_title TEXT;
  v_instrument TEXT;
BEGIN
  -- Buscar informações do músico
  SELECT display_name INTO v_musician_name
  FROM profiles
  WHERE user_id = p_musician_id;

  -- Buscar informações da gig
  SELECT title INTO v_gig_title
  FROM gigs
  WHERE id = p_gig_id;

  -- Buscar instrumento do invite
  SELECT gr.instrument INTO v_instrument
  FROM invites i
  INNER JOIN gig_roles gr ON gr.id = i.gig_role_id
  WHERE i.id = p_invite_id;

  -- Verificar se já existe notificação não lida para este invite
  SELECT id INTO v_notification_id
  FROM cancellation_notifications
  WHERE contractor_id = p_contractor_id
    AND gig_id = p_gig_id
    AND invite_id = p_invite_id
    AND read_at IS NULL
  LIMIT 1;

  -- Se não existe, criar notificação
  IF v_notification_id IS NULL THEN
    INSERT INTO cancellation_notifications (
      contractor_id,
      gig_id,
      invite_id,
      musician_id,
      musician_name,
      gig_title,
      instrument
    ) VALUES (
      p_contractor_id,
      p_gig_id,
      p_invite_id,
      p_musician_id,
      v_musician_name,
      v_gig_title,
      v_instrument
    )
    RETURNING id INTO v_notification_id;
  END IF;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION rpc_create_cancellation_notification(UUID, UUID, UUID, UUID) TO authenticated;

