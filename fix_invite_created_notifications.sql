-- ============================================
-- Correção: Notificações push não são enviadas quando um novo convite é criado
-- ============================================
-- 
-- Problema identificado:
-- A função trg_invite_created_notify() não tem SECURITY DEFINER, o que pode
-- causar problemas com RLS ao chamar enqueue_push_notification().
--
-- Solução:
-- Adicionar SECURITY DEFINER à função para garantir que ela possa inserir
-- notificações na fila mesmo com RLS habilitado.
-- ============================================

-- ============================================
-- 1. Verificar se o trigger está ativo
-- ============================================

-- Verificar se o trigger existe e está habilitado
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'invites'
  AND trigger_name = 'trg_invite_created_notify';

-- ============================================
-- 2. Corrigir a função trg_invite_created_notify()
-- ============================================
-- 
-- A função atual não tem SECURITY DEFINER, o que pode causar problemas
-- ao chamar enqueue_push_notification() quando RLS está habilitado.
-- Vamos adicionar SECURITY DEFINER para garantir que funcione corretamente.

CREATE OR REPLACE FUNCTION trg_invite_created_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gig_title TEXT;
BEGIN
  -- Verificar se há um musician_id válido
  IF NEW.musician_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar o título da gig
  SELECT title INTO v_gig_title FROM gigs WHERE id = NEW.gig_id;

  -- Enfileirar notificação push usando enqueue_push_notification()
  -- que tem SECURITY DEFINER e lida corretamente com RLS
  PERFORM enqueue_push_notification(
    NEW.musician_id,
    'new_invite',
    jsonb_build_object(
      'title', 'Novo convite recebido',
      'body', COALESCE('Você recebeu convite para: ' || v_gig_title, 'Você recebeu um novo convite'),
      'tag', 'new_invite',
      'data', jsonb_build_object('type', 'new_invite', 'url', '/dashboard')
    ),
    'invite:' || NEW.id::text
  );

  RETURN NEW;
END;
$$;

-- ============================================
-- 3. Garantir que o trigger está criado e ativo
-- ============================================

DROP TRIGGER IF EXISTS trg_invite_created_notify ON invites;
CREATE TRIGGER trg_invite_created_notify
  AFTER INSERT ON invites
  FOR EACH ROW
  EXECUTE FUNCTION trg_invite_created_notify();

-- ============================================
-- 4. Verificar se as políticas RLS estão corretas
-- ============================================

-- Verificar políticas existentes na tabela push_notification_queue
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

-- Se as políticas não existirem, criar (já devem estar criadas pelo fix_gig_published_notifications.sql)
-- Mas vamos garantir que existam:

-- Política para permitir inserção na fila de notificações
DO $$
BEGIN
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
END $$;

-- Política para permitir atualização na fila de notificações
DO $$
BEGIN
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
END $$;

-- Política para permitir leitura da fila de notificações
DO $$
BEGIN
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
END $$;

-- Política para service_role
DO $$
BEGIN
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
-- 5. Verificar se a função enqueue_push_notification está correta
-- ============================================

-- Verificar se a função existe e tem SECURITY DEFINER
SELECT 
    p.proname AS function_name,
    p.prosecdef AS is_security_definer,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'enqueue_push_notification'
  AND n.nspname = 'public';

-- ============================================
-- 6. Teste: Verificar se as notificações estão sendo criadas
-- ============================================
-- 
-- Após criar um novo convite, execute:
-- 
-- SELECT 
--     id,
--     user_id,
--     notification_type,
--     status,
--     created_at,
--     payload->>'title' as title,
--     payload->>'body' as body
-- FROM push_notification_queue
-- WHERE notification_type = 'new_invite'
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
-- 8. Verificar se o processador de fila está funcionando
-- ============================================
-- 
-- Verifique se há notificações pendentes na fila:
--
-- SELECT 
--     notification_type,
--     status,
--     COUNT(*) as count
-- FROM push_notification_queue
-- GROUP BY notification_type, status
-- ORDER BY notification_type, status;
--
-- Se houver muitas notificações com status 'pending', o processador
-- pode não estar rodando ou pode haver um problema.
-- ============================================

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- 
-- Execute este script no SQL Editor do Supabase.
-- Ele irá:
-- 1. Adicionar SECURITY DEFINER à função trg_invite_created_notify()
-- 2. Garantir que o trigger está ativo
-- 3. Verificar/criar políticas RLS necessárias
-- 4. Fornecer queries de teste para verificar se está funcionando
--
-- Após executar, teste criando um novo convite e verifique se as notificações
-- aparecem na tabela push_notification_queue.
-- ============================================

