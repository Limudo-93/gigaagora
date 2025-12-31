-- ============================================
-- Correção: Notificações push não são enviadas quando uma nova gig é criada
-- ============================================
-- 
-- Problema identificado:
-- A função trg_gig_published_notify() está fazendo INSERT direto na tabela
-- push_notification_queue, que tem RLS habilitado. Isso pode estar bloqueando
-- as inserções mesmo com políticas RLS configuradas.
--
-- Solução:
-- Modificar a função para usar enqueue_push_notification() que tem SECURITY DEFINER
-- e lida corretamente com RLS, além de chamar o processador de fila imediatamente.
-- ============================================

-- ============================================
-- 1. Verificar se as políticas RLS estão corretas
-- ============================================

-- Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'push_notification_queue';

-- ============================================
-- 2. Garantir que as políticas RLS estejam configuradas
-- ============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Allow insert to push notification queue" ON push_notification_queue;
DROP POLICY IF EXISTS "Allow update to push notification queue" ON push_notification_queue;
DROP POLICY IF EXISTS "Users can view their own notifications" ON push_notification_queue;
DROP POLICY IF EXISTS "Service role can manage push notifications" ON push_notification_queue;
DROP POLICY IF EXISTS "Allow authenticated users to insert notifications" ON push_notification_queue;
DROP POLICY IF EXISTS "Allow authenticated users to update notifications" ON push_notification_queue;

-- Política para permitir inserção na fila de notificações
-- As funções SECURITY DEFINER executam com privilégios elevados mas ainda precisam passar pelo RLS
CREATE POLICY "Allow authenticated users to insert notifications"
ON push_notification_queue
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para permitir atualização na fila de notificações
CREATE POLICY "Allow authenticated users to update notifications"
ON push_notification_queue
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para permitir leitura da fila de notificações
-- Usuários podem ver apenas suas próprias notificações
CREATE POLICY "Users can view their own notifications"
ON push_notification_queue
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política adicional para service_role (caso seja necessário)
-- Service role pode fazer tudo
CREATE POLICY "Service role can manage push notifications"
ON push_notification_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 3. Corrigir a função trg_gig_published_notify()
-- ============================================
-- 
-- A função atual faz INSERT direto, o que pode falhar por RLS.
-- Vamos modificá-la para usar enqueue_push_notification() que tem SECURITY DEFINER.
-- 
-- IMPORTANTE: A função precisa ter SECURITY DEFINER para que as chamadas
-- a enqueue_push_notification() funcionem corretamente com RLS.

CREATE OR REPLACE FUNCTION trg_gig_published_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_body TEXT;
  v_musician_record RECORD;
BEGIN
  -- Verificar se a gig foi publicada
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    v_body := COALESCE('Nova gig publicada: ' || NEW.title, 'Nova gig publicada');

    -- Notificar o contratante
    IF NEW.contractor_id IS NOT NULL THEN
      PERFORM enqueue_push_notification(
        NEW.contractor_id,
        'gig_published',
        jsonb_build_object(
          'title', 'Gig publicada',
          'body', v_body,
          'tag', 'gig_published',
          'data', jsonb_build_object('type', 'gig_published', 'url', '/dashboard/gigs')
        ),
        'gig_published:contractor:' || NEW.id::text
      );
    END IF;

    -- Notificar todos os músicos usando enqueue_push_notification()
    -- Isso garante que cada notificação seja inserida corretamente com SECURITY DEFINER
    -- e que o processador de fila seja notificado imediatamente
    FOR v_musician_record IN
      SELECT p.user_id
      FROM profiles p
      WHERE p.user_type = 'musician'
        AND p.user_id IS NOT NULL
    LOOP
      -- Usar enqueue_push_notification() em vez de INSERT direto
      -- Isso garante que:
      -- 1. RLS seja contornado corretamente (SECURITY DEFINER)
      -- 2. O processador de fila seja notificado imediatamente
      -- 3. ON CONFLICT funcione corretamente
      PERFORM enqueue_push_notification(
        v_musician_record.user_id,
        'gig_published',
        jsonb_build_object(
          'title', 'Gig publicada',
          'body', v_body,
          'tag', 'gig_published',
          'data', jsonb_build_object('type', 'gig_published', 'url', '/dashboard/gigs')
        ),
        'gig_published:' || NEW.id::text || ':' || v_musician_record.user_id::text
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- 4. Verificar se o trigger está ativo
-- ============================================

-- Verificar se o trigger existe e está habilitado
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'gigs'
  AND trigger_name = 'trg_gig_published_notify';

-- Garantir que o trigger está criado
DROP TRIGGER IF EXISTS trg_gig_published_notify ON gigs;
CREATE TRIGGER trg_gig_published_notify
  AFTER INSERT OR UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION trg_gig_published_notify();

-- ============================================
-- 5. Verificar se a função enqueue_push_notification está correta
-- ============================================

-- Verificar se a função existe e tem SECURITY DEFINER
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'enqueue_push_notification'
  AND n.nspname = 'public';

-- ============================================
-- 6. Teste: Verificar se as notificações estão sendo criadas
-- ============================================
-- 
-- Após criar uma nova gig, execute:
-- 
-- SELECT 
--     id,
--     user_id,
--     notification_type,
--     status,
--     created_at,
--     payload->>'title' as title
-- FROM push_notification_queue
-- WHERE notification_type = 'gig_published'
-- ORDER BY created_at DESC
-- LIMIT 10;
--
-- Isso mostrará se as notificações estão sendo criadas na fila.
-- ============================================

-- ============================================
-- 7. Verificar se há subscriptions de push registradas
-- ============================================
-- 
-- Para que as notificações sejam enviadas, os músicos precisam ter
-- subscriptions de push registradas. Verifique com:
--
-- SELECT 
--     p.user_id,
--     p.display_name,
--     COUNT(ps.id) as subscription_count
-- FROM profiles p
-- LEFT JOIN push_subscriptions ps ON ps.user_id = p.user_id
-- WHERE p.user_type = 'musician'
-- GROUP BY p.user_id, p.display_name
-- ORDER BY subscription_count DESC;
--
-- Isso mostrará quantos músicos têm subscriptions registradas.
-- ============================================

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- 
-- Execute este script no SQL Editor do Supabase.
-- Ele irá:
-- 1. Verificar e criar políticas RLS corretas
-- 2. Modificar a função trg_gig_published_notify() para usar enqueue_push_notification()
-- 3. Garantir que o trigger está ativo
-- 4. Fornecer queries de teste para verificar se está funcionando
--
-- Após executar, teste criando uma nova gig e verifique se as notificações
-- aparecem na tabela push_notification_queue.
-- ============================================

