-- ============================================
-- Tabela de notificações de cancelamento
-- ============================================

CREATE TABLE IF NOT EXISTS cancellation_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  invite_id UUID REFERENCES invites(id) ON DELETE SET NULL,
  musician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  musician_name TEXT,
  gig_title TEXT,
  instrument TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cancellation_notifications_contractor ON cancellation_notifications(contractor_id, read_at);
CREATE INDEX IF NOT EXISTS idx_cancellation_notifications_gig ON cancellation_notifications(gig_id);

-- RLS Policies
ALTER TABLE cancellation_notifications ENABLE ROW LEVEL SECURITY;

-- Política: Contratantes podem ver suas próprias notificações
CREATE POLICY "Contractors can view their own cancellation notifications"
  ON cancellation_notifications
  FOR SELECT
  USING (contractor_id = auth.uid());

-- Política: Sistema pode criar notificações (via SECURITY DEFINER function)
CREATE POLICY "System can create cancellation notifications"
  ON cancellation_notifications
  FOR INSERT
  WITH CHECK (true);

-- Política: Contratantes podem marcar suas notificações como lidas
CREATE POLICY "Contractors can update their own cancellation notifications"
  ON cancellation_notifications
  FOR UPDATE
  USING (contractor_id = auth.uid())
  WITH CHECK (contractor_id = auth.uid());

-- ============================================
-- Função RPC para criar notificação de cancelamento
-- ============================================

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

-- Comentário
COMMENT ON FUNCTION rpc_create_cancellation_notification(UUID, UUID, UUID, UUID) IS 'Cria uma notificação de cancelamento para o contratante quando um músico cancela uma gig confirmada';

