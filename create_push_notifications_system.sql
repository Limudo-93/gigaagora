-- ============================================
-- Sistema de Notificações Push para PWA
-- ============================================

-- Tabela para armazenar push subscriptions dos usuários
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver suas próprias subscriptions
CREATE POLICY "Users can view their own push subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Política: Usuários podem inserir suas próprias subscriptions
CREATE POLICY "Users can insert their own push subscriptions"
  ON push_subscriptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Política: Usuários podem atualizar suas próprias subscriptions
CREATE POLICY "Users can update their own push subscriptions"
  ON push_subscriptions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Política: Usuários podem deletar suas próprias subscriptions
CREATE POLICY "Users can delete their own push subscriptions"
  ON push_subscriptions
  FOR DELETE
  USING (user_id = auth.uid());

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER trigger_update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- ============================================
-- Tipos de notificações
-- ============================================
-- Tipo ENUM para tipos de notificação
CREATE TYPE notification_type AS ENUM (
  'new_invite',
  'invite_accepted',
  'invite_declined',
  'gig_confirmed',
  'musician_chosen',
  'gig_cancelled',
  'new_message',
  'gig_reminder',
  'invite_expiring',
  'rating_pending',
  'profile_completion',
  'daily_reminder'
);

-- ============================================
-- Função RPC para registrar/atualizar push subscription
-- ============================================
CREATE OR REPLACE FUNCTION rpc_register_push_subscription(
  p_endpoint TEXT,
  p_p256dh TEXT,
  p_auth TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Obter user_id atual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Tentar encontrar subscription existente
  SELECT id INTO v_subscription_id
  FROM push_subscriptions
  WHERE user_id = v_user_id AND endpoint = p_endpoint;

  IF v_subscription_id IS NOT NULL THEN
    -- Atualizar subscription existente
    UPDATE push_subscriptions
    SET 
      p256dh = p_p256dh,
      auth = p_auth,
      user_agent = COALESCE(p_user_agent, user_agent),
      device_info = COALESCE(p_device_info, device_info),
      updated_at = NOW()
    WHERE id = v_subscription_id;
    RETURN v_subscription_id;
  ELSE
    -- Criar nova subscription
    INSERT INTO push_subscriptions (
      user_id,
      endpoint,
      p256dh,
      auth,
      user_agent,
      device_info
    )
    VALUES (
      v_user_id,
      p_endpoint,
      p_p256dh,
      p_auth,
      p_user_agent,
      p_device_info
    )
    RETURNING id INTO v_subscription_id;
    RETURN v_subscription_id;
  END IF;
END;
$$;

-- ============================================
-- Função RPC para remover push subscription
-- ============================================
CREATE OR REPLACE FUNCTION rpc_remove_push_subscription(
  p_endpoint TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  DELETE FROM push_subscriptions
  WHERE user_id = v_user_id AND endpoint = p_endpoint;

  RETURN FOUND;
END;
$$;

-- ============================================
-- Função para obter todas as subscriptions de um usuário
-- (Para uso em server-side/backend)
-- ============================================
CREATE OR REPLACE FUNCTION get_user_push_subscriptions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  user_agent TEXT,
  device_info JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.endpoint,
    ps.p256dh,
    ps.auth,
    ps.user_agent,
    ps.device_info
  FROM push_subscriptions ps
  WHERE ps.user_id = p_user_id;
END;
$$;

-- ============================================
-- Comentários
-- ============================================
COMMENT ON TABLE push_subscriptions IS 'Armazena push subscriptions dos usuários para notificações PWA';
COMMENT ON FUNCTION rpc_register_push_subscription IS 'Registra ou atualiza uma push subscription do usuário autenticado';
COMMENT ON FUNCTION rpc_remove_push_subscription IS 'Remove uma push subscription do usuário autenticado';
COMMENT ON FUNCTION get_user_push_subscriptions IS 'Obtém todas as push subscriptions de um usuário (para uso server-side)';

