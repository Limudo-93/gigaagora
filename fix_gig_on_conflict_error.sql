-- ============================================
-- Correção: Erro "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- ao criar uma nova gig
-- ============================================

-- Este erro geralmente ocorre quando:
-- 1. Um trigger ou função está usando ON CONFLICT sem a constraint correspondente
-- 2. Uma função RPC está usando ON CONFLICT incorretamente

-- Vamos verificar e corrigir possíveis problemas:

-- ============================================
-- 1. Verificar se há triggers problemáticos
-- ============================================

-- Listar todos os triggers relacionados a gigs
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('gigs', 'gig_roles')
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 2. Verificar funções que podem estar usando ON CONFLICT incorretamente
-- ============================================

-- Buscar funções que contêm ON CONFLICT
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%ON CONFLICT%'
    AND routine_schema = 'public';

-- ============================================
-- 3. Verificar se há constraints únicas necessárias
-- ============================================

-- Verificar constraints na tabela gig_roles
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'gig_roles'::regclass;

-- Verificar constraints na tabela gigs
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'gigs'::regclass;

-- ============================================
-- 4. Corrigir possível problema no trigger de auto-invites
-- ============================================

-- Se o problema estiver no trigger auto_create_invites_for_gig,
-- vamos garantir que ele não use ON CONFLICT sem constraint

-- Primeiro, vamos verificar se a função existe e seu conteúdo
DO $$
BEGIN
    -- Verificar se a função auto_create_invites_for_gig existe
    IF EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'auto_create_invites_for_gig'
    ) THEN
        RAISE NOTICE 'Função auto_create_invites_for_gig existe';
    ELSE
        RAISE NOTICE 'Função auto_create_invites_for_gig NÃO existe';
    END IF;
END $$;

-- ============================================
-- 5. Verificar se há problema com a inserção de gig_roles
-- ============================================

-- Se o erro ocorre ao inserir gig_roles, pode ser que algum trigger
-- esteja tentando usar ON CONFLICT sem constraint

-- Verificar se há constraint única em invites que possa estar causando problema
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'invites'::regclass
    AND contype IN ('u', 'p'); -- unique ou primary key

-- ============================================
-- 6. Solução: Garantir que triggers não usem ON CONFLICT sem constraint
-- ============================================

-- Se o problema estiver no trigger auto_create_invites_for_role,
-- vamos recriá-lo sem ON CONFLICT (usando IF NOT EXISTS logic)

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
    -- Verifica se já existe um invite (SEM usar ON CONFLICT)
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

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_auto_create_invites_for_role ON gig_roles;

CREATE TRIGGER trigger_auto_create_invites_for_role
  AFTER INSERT ON gig_roles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_invites_for_role();

-- ============================================
-- 7. Verificar e corrigir função auto_create_invites_for_gig também
-- ============================================

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
    SELECT * FROM gig_roles WHERE gig_id = NEW.id
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
        -- E não está bloqueado
        AND NOT EXISTS (
          SELECT 1 FROM blocks b
          WHERE b.musician_id = mp.user_id
          AND b.starts_at <= NEW.start_time
          AND b.ends_at >= NEW.start_time
        )
    LOOP
      -- Verifica se já existe um invite (SEM usar ON CONFLICT)
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

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_auto_create_invites ON gigs;

CREATE TRIGGER trigger_auto_create_invites
  AFTER INSERT OR UPDATE ON gigs
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION auto_create_invites_for_gig();

-- ============================================
-- 8. Verificar se há outras funções RPC que possam estar causando o problema
-- ============================================

-- Listar todas as funções RPC que podem estar relacionadas
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name LIKE '%gig%'
    OR routine_name LIKE '%invite%'
ORDER BY routine_name;

-- ============================================
-- 9. Corrigir função enqueue_push_notification que também usa ON CONFLICT
-- ============================================

-- A função enqueue_push_notification está usando ON CONFLICT na linha 141
-- Vamos recriá-la sem usar ON CONFLICT

CREATE OR REPLACE FUNCTION enqueue_push_notification(
  p_user_id UUID,
  p_type notification_type,
  p_payload JSONB,
  p_event_key TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_existing_id UUID;
BEGIN
  -- Se event_key foi fornecido, verificar se já existe notificação
  IF p_event_key IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM push_notification_queue
    WHERE user_id = p_user_id
      AND event_key = p_event_key
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
      -- Atualizar notificação existente
      UPDATE push_notification_queue
      SET updated_at = NOW(),
          payload = p_payload,
          notification_type = p_type
      WHERE id = v_existing_id
      RETURNING id INTO v_id;
      
      -- Best-effort immediate dispatch if pg_net is available
      PERFORM try_notify_queue_processor();
      
      RETURN v_id;
    END IF;
  END IF;
  
  -- Se não existe, criar nova notificação
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

  -- Best-effort immediate dispatch if pg_net is available
  PERFORM try_notify_queue_processor();

  RETURN v_id;
END;
$$;

-- ============================================
-- 10. Verificar e corrigir função de notificações push
-- ============================================

-- A função trg_gig_published_notify está usando ON CONFLICT na linha 345
-- Vamos recriá-la sem usar ON CONFLICT

CREATE OR REPLACE FUNCTION trg_gig_published_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_body TEXT;
  v_event_key TEXT;
  v_existing_id UUID;
  v_profile_record RECORD;
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    v_body := COALESCE('Nova gig publicada: ' || NEW.title, 'Nova gig publicada');

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

    -- Notificar músicos (SEM usar ON CONFLICT)
    FOR v_profile_record IN
      SELECT user_id
      FROM profiles
      WHERE user_type = 'musician'
        AND user_id IS NOT NULL
    LOOP
      v_event_key := 'gig_published:' || NEW.id::text || ':' || v_profile_record.user_id::text;
      
      -- Verificar se já existe notificação (SEM usar ON CONFLICT)
      SELECT id INTO v_existing_id
      FROM push_notification_queue
      WHERE user_id = v_profile_record.user_id
        AND event_key = v_event_key
      LIMIT 1;
      
      -- Se não existe, criar notificação
      IF v_existing_id IS NULL THEN
        INSERT INTO push_notification_queue (
          user_id,
          notification_type,
          payload,
          event_key
        ) VALUES (
          v_profile_record.user_id,
          'gig_published',
          jsonb_build_object(
            'title', 'Gig publicada',
            'body', v_body,
            'tag', 'gig_published',
            'data', jsonb_build_object('type', 'gig_published', 'url', '/dashboard/gigs')
          ),
          v_event_key
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Recriar trigger
DROP TRIGGER IF EXISTS trg_gig_published_notify ON gigs;

CREATE TRIGGER trg_gig_published_notify
  AFTER INSERT OR UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION trg_gig_published_notify();

-- ============================================
-- 10. Verificar função de notificação de cancelamento
-- ============================================

-- A função trg_gig_cancelled_notify está usando ON CONFLICT na linha 402
-- Vamos recriá-la sem usar ON CONFLICT

CREATE OR REPLACE FUNCTION trg_gig_cancelled_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_body TEXT;
  v_event_key TEXT;
  v_existing_id UUID;
  v_invite_record RECORD;
BEGIN
  IF NEW.status = 'cancelled' AND (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    v_body := COALESCE('Gig cancelada: ' || NEW.title, 'Gig cancelada');

    IF NEW.contractor_id IS NOT NULL THEN
      PERFORM enqueue_push_notification(
        NEW.contractor_id,
        'gig_cancelled',
        jsonb_build_object(
          'title', 'Gig cancelada',
          'body', v_body,
          'tag', 'gig_cancelled',
          'data', jsonb_build_object('type', 'gig_cancelled', 'url', '/dashboard')
        ),
        'gig_cancelled:contractor:' || NEW.id::text
      );
    END IF;

    -- Notificar músicos convidados (SEM usar ON CONFLICT)
    FOR v_invite_record IN
      SELECT DISTINCT musician_id
      FROM invites
      WHERE gig_id = NEW.id
        AND musician_id IS NOT NULL
    LOOP
      v_event_key := 'gig_cancelled:' || NEW.id::text || ':' || v_invite_record.musician_id::text;
      
      -- Verificar se já existe notificação (SEM usar ON CONFLICT)
      SELECT id INTO v_existing_id
      FROM push_notification_queue
      WHERE user_id = v_invite_record.musician_id
        AND event_key = v_event_key
      LIMIT 1;
      
      -- Se não existe, criar notificação
      IF v_existing_id IS NULL THEN
        INSERT INTO push_notification_queue (
          user_id,
          notification_type,
          payload,
          event_key
        ) VALUES (
          v_invite_record.musician_id,
          'gig_cancelled',
          jsonb_build_object(
            'title', 'Gig cancelada',
            'body', v_body,
            'tag', 'gig_cancelled',
            'data', jsonb_build_object('type', 'gig_cancelled', 'url', '/dashboard')
          ),
          v_event_key
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Recriar trigger
DROP TRIGGER IF EXISTS trg_gig_cancelled_notify ON gigs;

CREATE TRIGGER trg_gig_cancelled_notify
  AFTER UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION trg_gig_cancelled_notify();

-- ============================================
-- 11. Verificar se há constraint única em push_notification_queue
-- ============================================

-- Garantir que existe constraint única para user_id + event_key
-- Se já existe, apenas confirma; se não existe, cria
DO $$
BEGIN
    -- Verificar se a constraint já existe pelo nome
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'push_notification_queue'::regclass
            AND conname = 'uq_push_notification_queue_event'
    ) THEN
        RAISE NOTICE 'Constraint única uq_push_notification_queue_event já existe - OK';
    ELSE
        -- Tentar criar a constraint
        BEGIN
            ALTER TABLE push_notification_queue
            ADD CONSTRAINT uq_push_notification_queue_event UNIQUE (user_id, event_key);
            
            RAISE NOTICE 'Constraint única criada em push_notification_queue';
        EXCEPTION
            WHEN duplicate_table THEN
                RAISE NOTICE 'Constraint única já existe (duplicate_table)';
            WHEN duplicate_object THEN
                RAISE NOTICE 'Constraint única já existe (duplicate_object)';
            WHEN OTHERS THEN
                -- Se der erro, pode ser que já existe com outro nome ou estrutura diferente
                RAISE NOTICE 'Não foi possível criar constraint (pode já existir): %', SQLERRM;
        END;
    END IF;
END $$;

-- ============================================
-- 12. Corrigir políticas RLS da tabela push_notification_queue
-- ============================================

-- A tabela push_notification_queue tem RLS habilitado mas sem políticas de INSERT
-- Isso impede que as funções SECURITY DEFINER insiram notificações
-- Vamos criar políticas que permitam inserção via funções SECURITY DEFINER

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Service role can manage push notifications" ON push_notification_queue;
DROP POLICY IF EXISTS "Functions can insert push notifications" ON push_notification_queue;
DROP POLICY IF EXISTS "Users can view their own notifications" ON push_notification_queue;

-- Política para permitir inserção na fila de notificações
-- Como a tabela é apenas para uso interno do sistema, permitimos inserção para authenticated
-- As funções SECURITY DEFINER executam com privilégios elevados mas ainda precisam passar pelo RLS
CREATE POLICY "Allow insert to push notification queue"
ON push_notification_queue
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para permitir atualização na fila de notificações
CREATE POLICY "Allow update to push notification queue"
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

-- Alternativa: Se as políticas acima não funcionarem, podemos desabilitar RLS temporariamente
-- ou criar uma política mais permissiva para service_role
-- Mas primeiro vamos tentar com as políticas acima

-- ============================================
-- 13. Desabilitar temporariamente triggers para teste
-- ============================================

-- Se o erro persistir, você pode desabilitar temporariamente os triggers
-- para identificar qual está causando o problema:

-- ALTER TABLE gigs DISABLE TRIGGER ALL;
-- ALTER TABLE gig_roles DISABLE TRIGGER ALL;

-- Depois de identificar, reabilite:
-- ALTER TABLE gigs ENABLE TRIGGER ALL;
-- ALTER TABLE gig_roles ENABLE TRIGGER ALL;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- 
-- Execute este script no SQL Editor do Supabase.
-- Ele irá:
-- 1. Verificar triggers e funções problemáticas
-- 2. Recriar funções de auto-invites sem usar ON CONFLICT
-- 3. Recriar funções de notificações sem usar ON CONFLICT
-- 4. Garantir que os triggers estejam corretos
-- 5. Criar constraint única se não existir
--
-- Após executar, tente criar/editar uma gig novamente.
-- ============================================

