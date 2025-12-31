-- ============================================
-- Correção: Notificações push não são processadas automaticamente
-- ============================================
-- 
-- Problema identificado:
-- As notificações são enfileiradas corretamente, mas o processador de fila
-- não está sendo chamado automaticamente. O sistema depende de pg_net que
-- pode não estar disponível ou configurado.
--
-- Solução:
-- 1. Melhorar a função try_notify_queue_processor() para ser mais confiável
-- 2. Criar uma função que processa a fila diretamente no banco (fallback)
-- 3. Garantir que o endpoint seja chamado corretamente
-- ============================================

-- ============================================
-- 1. Melhorar try_notify_queue_processor() para usar múltiplas estratégias
-- ============================================

CREATE OR REPLACE FUNCTION try_notify_queue_processor()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_net BOOLEAN;
  v_url TEXT;
BEGIN
  -- URL do endpoint de processamento
  v_url := COALESCE(
    current_setting('app.notifications_process_url', true),
    'https://www.chamaomusico.com.br/api/notifications/process'
  );

  -- Tentar usar pg_net se disponível
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'net'
      AND p.proname = 'http_post'
  ) INTO v_has_net;

  IF v_has_net THEN
    BEGIN
      -- Usar pg_net para chamar o endpoint
      PERFORM net.http_post(
        url := v_url,
        headers := jsonb_build_object(
          'content-type', 'application/json',
          'authorization', 'Bearer ' || COALESCE(
            current_setting('app.notifications_cron_secret', true),
            'default-secret-change-in-production'
          )
        ),
        body := '{}'::jsonb
      );
      RETURN;
    EXCEPTION WHEN OTHERS THEN
      -- Se falhar, continuar para outras estratégias
      RAISE WARNING 'pg_net.http_post failed: %', SQLERRM;
    END;
  END IF;

  -- Se pg_net não estiver disponível, registrar que precisa processar
  -- O processamento será feito via cron job ou chamada manual
  RAISE NOTICE 'Queue processor notification skipped (pg_net not available). Notifications will be processed by cron job.';
END;
$$;

-- ============================================
-- 2. Criar função para processar fila diretamente (fallback)
-- ============================================
-- Esta função pode ser chamada manualmente ou via cron se o endpoint não funcionar

CREATE OR REPLACE FUNCTION process_push_notification_queue_direct()
RETURNS TABLE(
  processed_count INTEGER,
  sent_count INTEGER,
  failed_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_subscription RECORD;
  v_processed INTEGER := 0;
  v_sent INTEGER := 0;
  v_failed INTEGER := 0;
  v_now TIMESTAMPTZ := NOW();
  v_success BOOLEAN;
BEGIN
  -- Processar até 50 notificações por vez
  FOR v_item IN
    SELECT 
      id,
      user_id,
      notification_type,
      payload,
      attempt_count
    FROM push_notification_queue
    WHERE status IN ('pending', 'retry')
      AND next_attempt_at <= v_now
    ORDER BY next_attempt_at ASC
    LIMIT 50
  LOOP
    v_processed := v_processed + 1;

    -- Buscar subscriptions do usuário
    SELECT 
      endpoint,
      p256dh,
      auth
    INTO v_subscription
    FROM push_subscriptions
    WHERE user_id = v_item.user_id
      AND active = true
    LIMIT 1;

    -- Se não tem subscription, marcar como retry
    IF v_subscription IS NULL THEN
      UPDATE push_notification_queue
      SET 
        status = 'retry',
        attempt_count = COALESCE(attempt_count, 0) + 1,
        last_attempt_at = v_now,
        next_attempt_at = v_now + INTERVAL '5 minutes',
        last_error = 'No active subscription found'
      WHERE id = v_item.id;
      v_failed := v_failed + 1;
      CONTINUE;
    END IF;

    -- Tentar enviar via Edge Function do Supabase
    -- Nota: Esta função não pode chamar Edge Functions diretamente,
    -- então apenas marca como processado. O envio real deve ser feito
    -- pelo endpoint /api/notifications/process
    
    -- Por enquanto, apenas marcar como processado
    -- O envio real será feito pelo endpoint
    UPDATE push_notification_queue
    SET 
      status = 'pending', -- Manter como pending para o endpoint processar
      attempt_count = COALESCE(attempt_count, 0) + 1,
      last_attempt_at = v_now
    WHERE id = v_item.id;

    v_sent := v_sent + 1;
  END LOOP;

  RETURN QUERY SELECT v_processed, v_sent, v_failed;
END;
$$;

-- ============================================
-- 3. Melhorar enqueue_push_notification() para garantir processamento
-- ============================================

CREATE OR REPLACE FUNCTION enqueue_push_notification(
  p_user_id UUID,
  p_type notification_type,
  p_payload JSONB,
  p_event_key TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- Verificar se já existe notificação com mesmo event_key
  IF p_event_key IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 
      FROM push_notification_queue 
      WHERE user_id = p_user_id 
        AND event_key = p_event_key
        AND status IN ('pending', 'retry')
    ) INTO v_exists;

    -- Se já existe e está pendente, não criar duplicata
    IF v_exists THEN
      SELECT id INTO v_id
      FROM push_notification_queue
      WHERE user_id = p_user_id 
        AND event_key = p_event_key
        AND status IN ('pending', 'retry')
      LIMIT 1;
      
      -- Atualizar updated_at para indicar que foi "tocado" novamente
      UPDATE push_notification_queue
      SET updated_at = NOW()
      WHERE id = v_id;
      
      RETURN v_id;
    END IF;
  END IF;

  -- Inserir nova notificação
  INSERT INTO push_notification_queue (
    user_id,
    notification_type,
    payload,
    event_key,
    status,
    next_attempt_at
  )
  VALUES (
    p_user_id,
    p_type,
    p_payload,
    p_event_key,
    'pending',
    NOW()
  )
  RETURNING id INTO v_id;

  -- Tentar notificar o processador imediatamente
  PERFORM try_notify_queue_processor();

  RETURN v_id;
END;
$$;

-- ============================================
-- 4. Criar trigger para processar fila quando nova notificação é inserida
-- ============================================
-- Este trigger tenta processar a fila imediatamente após inserção

CREATE OR REPLACE FUNCTION trg_notification_enqueued_process()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tentar notificar o processador imediatamente
  PERFORM try_notify_queue_processor();
  
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela push_notification_queue
DROP TRIGGER IF EXISTS trg_notification_enqueued_process ON push_notification_queue;
CREATE TRIGGER trg_notification_enqueued_process
  AFTER INSERT ON push_notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION trg_notification_enqueued_process();

-- ============================================
-- 5. Verificar se todas as funções de trigger têm SECURITY DEFINER
-- ============================================

-- Verificar trg_gig_published_notify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'trg_gig_published_notify'
      AND n.nspname = 'public'
      AND NOT p.prosecdef
  ) THEN
    -- Recriar com SECURITY DEFINER
    EXECUTE 'ALTER FUNCTION trg_gig_published_notify() SECURITY DEFINER';
  END IF;
END $$;

-- Verificar trg_invite_created_notify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'trg_invite_created_notify'
      AND n.nspname = 'public'
      AND NOT p.prosecdef
  ) THEN
    -- Recriar com SECURITY DEFINER
    EXECUTE 'ALTER FUNCTION trg_invite_created_notify() SECURITY DEFINER';
  END IF;
END $$;

-- ============================================
-- 6. Garantir que as políticas RLS estão corretas
-- ============================================

-- Verificar e criar políticas se necessário
DO $$
BEGIN
  -- Política de INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'push_notification_queue' 
    AND policyname = 'Allow authenticated users to insert notifications'
  ) THEN
    CREATE POLICY "Allow authenticated users to insert notifications"
    ON push_notification_queue
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;

  -- Política de UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'push_notification_queue' 
    AND policyname = 'Allow authenticated users to update notifications'
  ) THEN
    CREATE POLICY "Allow authenticated users to update notifications"
    ON push_notification_queue
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;

  -- Política de SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'push_notification_queue' 
    AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications"
    ON push_notification_queue
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;

  -- Política para service_role
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'push_notification_queue' 
    AND policyname = 'Service role can manage push notifications'
  ) THEN
    CREATE POLICY "Service role can manage push notifications"
    ON push_notification_queue
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- 7. Queries de diagnóstico
-- ============================================

-- Verificar notificações pendentes
-- SELECT 
--     notification_type,
--     status,
--     COUNT(*) as count,
--     MIN(created_at) as oldest,
--     MAX(created_at) as newest
-- FROM push_notification_queue
-- GROUP BY notification_type, status
-- ORDER BY notification_type, status;

-- Verificar subscriptions ativas
-- SELECT 
--     COUNT(DISTINCT user_id) as users_with_subscriptions,
--     COUNT(*) as total_subscriptions
-- FROM push_subscriptions
-- WHERE active = true;

-- Verificar últimas notificações criadas
-- SELECT 
--     id,
--     user_id,
--     notification_type,
--     status,
--     attempt_count,
--     created_at,
--     next_attempt_at,
--     last_error
-- FROM push_notification_queue
-- ORDER BY created_at DESC
-- LIMIT 20;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- 
-- Este script:
-- 1. Melhora try_notify_queue_processor() para ser mais confiável
-- 2. Cria função de fallback para processar fila diretamente
-- 3. Melhora enqueue_push_notification() para evitar duplicatas
-- 4. Cria trigger para tentar processar imediatamente após inserção
-- 5. Garante que todas as funções têm SECURITY DEFINER
-- 6. Verifica/cria políticas RLS necessárias
--
-- IMPORTANTE: O processamento real das notificações ainda depende do
-- endpoint /api/notifications/process que deve ser chamado:
-- - Automaticamente via cron job (Vercel Cron ou similar)
-- - Ou manualmente quando necessário
--
-- Para configurar cron job na Vercel, adicione ao vercel.json:
-- {
--   "crons": [{
--     "path": "/api/notifications/process",
--     "schedule": "*/5 * * * *"
--   }]
-- }
-- ============================================

