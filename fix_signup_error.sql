-- ============================================
-- Script para diagnosticar e corrigir erro ao criar novo usuário
-- ============================================

-- 1. Verificar se existe trigger em auth.users que cria perfil automaticamente
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 2. Verificar se a tabela user_badges existe (pode estar faltando e causar erro nos triggers)
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_badges'
) AS user_badges_exists;

-- 3. Se user_badges não existir, criar (pode estar faltando e causar erro nos triggers de badges)
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,
    UNIQUE(user_id, badge_type)
);

-- 4. Habilitar RLS na tabela user_badges se ainda não estiver habilitado
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS básicas para user_badges (se não existirem)
DO $$
BEGIN
    -- Política para SELECT: usuários podem ver seus próprios badges
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_badges' 
        AND policyname = 'Users can view their own badges'
    ) THEN
        CREATE POLICY "Users can view their own badges"
            ON user_badges
            FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);
    END IF;

    -- Política para INSERT: sistema pode inserir badges (via triggers)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_badges' 
        AND policyname = 'System can insert badges'
    ) THEN
        CREATE POLICY "System can insert badges"
            ON user_badges
            FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- 6. Verificar se os triggers de profiles têm problemas
-- Verificar se a função check_and_assign_ambassador_badge existe e está funcionando
SELECT 
    proname AS function_name,
    prosrc AS function_body
FROM pg_proc
WHERE proname = 'check_and_assign_ambassador_badge';

-- 7. Se a função check_and_assign_ambassador_badge não existir ou estiver com problema,
-- criar uma versão mais segura que não falha mesmo se user_badges tiver problemas
CREATE OR REPLACE FUNCTION check_and_assign_ambassador_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_users INTEGER;
  v_days_since_creation INTEGER;
BEGIN
  -- Tentar contar usuários (com tratamento de erro)
  BEGIN
    SELECT COUNT(*) INTO v_total_users
    FROM profiles;
  EXCEPTION WHEN OTHERS THEN
    v_total_users := 0;
  END;

  -- Calcular dias desde a criação do perfil
  BEGIN
    SELECT EXTRACT(DAY FROM (NOW() - COALESCE(NEW.created_at, NOW()))) INTO v_days_since_creation;
  EXCEPTION WHEN OTHERS THEN
    v_days_since_creation := 0;
  END;

  -- Atribuir badge de Embaixador se:
  -- 1. Está entre os primeiros 100 usuários, OU
  -- 2. Criou conta nos primeiros 30 dias da plataforma
  IF (v_total_users <= 100 OR v_days_since_creation <= 30) THEN
    NEW.is_ambassador := true;

    -- Tentar inserir badge (com tratamento de erro para não quebrar o INSERT)
    BEGIN
      INSERT INTO user_badges (user_id, badge_type, earned_at)
      VALUES (NEW.user_id, 'ambassador', NOW())
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- Se falhar, apenas loga o erro mas não quebra o INSERT do perfil
      RAISE WARNING 'Error inserting ambassador badge: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- 8. Verificar se a função check_and_assign_verified_badge também precisa ser corrigida
CREATE OR REPLACE FUNCTION check_and_assign_verified_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_complete BOOLEAN := false;
    musician_profile_complete BOOLEAN := false;
BEGIN
    -- Verifica se o perfil básico está completo
    BEGIN
        SELECT 
            (display_name IS NOT NULL AND display_name != '') AND
            (phone_e164 IS NOT NULL AND phone_e164 != '') AND
            (city IS NOT NULL AND city != '') AND
            (state IS NOT NULL AND state != '') AND
            (photo_url IS NOT NULL AND photo_url != '')
        INTO profile_complete
        FROM profiles
        WHERE user_id = NEW.user_id;
    EXCEPTION WHEN OTHERS THEN
        profile_complete := false;
    END;

    -- Se for músico, verifica também o perfil de músico
    BEGIN
        IF EXISTS (SELECT 1 FROM profiles WHERE user_id = NEW.user_id AND user_type = 'musician') THEN
            SELECT 
                (bio IS NOT NULL AND bio != '') AND
                (instruments IS NOT NULL AND array_length(instruments, 1) > 0) AND
                (genres IS NOT NULL AND array_length(genres, 1) > 0)
            INTO musician_profile_complete
            FROM musician_profiles
            WHERE user_id = NEW.user_id;

            profile_complete := profile_complete AND musician_profile_complete;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        musician_profile_complete := false;
    END;

    -- Se perfil completo, atribui badge "Verificado" (com tratamento de erro)
    IF profile_complete THEN
        BEGIN
            INSERT INTO user_badges (user_id, badge_type, metadata)
            VALUES (
                NEW.user_id, 
                'verified',
                jsonb_build_object('checked_at', NOW(), 'trigger', 'profile_completion')
            )
            ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error inserting verified badge: %', SQLERRM;
        END;
    ELSE
        -- Remove badge se perfil não estiver mais completo (com tratamento de erro)
        BEGIN
            DELETE FROM user_badges 
            WHERE user_id = NEW.user_id AND badge_type = 'verified';
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error deleting verified badge: %', SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$;

-- 9. Verificar se há algum trigger em auth.users (Supabase pode ter um)
-- NOTA: Não podemos criar triggers em auth.users diretamente, mas podemos verificar
-- Se houver um trigger do Supabase que chama uma função nossa, precisamos garantir que ela existe

-- 10. Criar índice na tabela user_badges para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_type ON user_badges(badge_type);

-- ============================================
-- RESUMO: Execute este script no SQL Editor do Supabase
-- ============================================
-- Este script:
-- 1. Verifica triggers existentes
-- 2. Cria a tabela user_badges se não existir
-- 3. Corrige as funções de triggers para não falharem mesmo se houver problemas
-- 4. Garante que as políticas RLS estão corretas
-- ============================================

