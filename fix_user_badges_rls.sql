-- ============================================
-- Correção: RLS bloqueando inserção de badges por triggers/funções
-- ============================================

-- O problema é que funções e triggers que inserem badges não têm permissão
-- devido às políticas RLS. Precisamos permitir que funções SECURITY DEFINER
-- possam inserir badges, ou criar políticas que permitam isso.

-- 1. Adicionar política para INSERT em user_badges
-- Permitir que usuários possam ter badges inseridos por funções do sistema
DROP POLICY IF EXISTS "System functions can insert badges" ON user_badges;
CREATE POLICY "System functions can insert badges"
    ON user_badges FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 2. Adicionar política para UPDATE em user_badges (caso necessário)
DROP POLICY IF EXISTS "System functions can update badges" ON user_badges;
CREATE POLICY "System functions can update badges"
    ON user_badges FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Adicionar política para DELETE em user_badges (caso necessário)
DROP POLICY IF EXISTS "System functions can delete badges" ON user_badges;
CREATE POLICY "System functions can delete badges"
    ON user_badges FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. Tornar as funções que inserem badges como SECURITY DEFINER
-- Isso permite que elas executem com privilégios elevados, bypassando RLS
-- quando necessário

-- Função sync_ranking_badge
CREATE OR REPLACE FUNCTION sync_ranking_badge(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_tier ranking_tier_enum;
    v_badge_type badge_type_enum;
BEGIN
    -- Buscar tier atual
    SELECT current_tier INTO v_tier
    FROM user_rankings
    WHERE user_id = p_user_id;

    IF v_tier IS NULL THEN
        RETURN;
    END IF;

    -- Mapear tier para badge_type
    v_badge_type := CASE v_tier
        WHEN 'bronze' THEN 'ranking_bronze'::badge_type_enum
        WHEN 'silver' THEN 'ranking_silver'::badge_type_enum
        WHEN 'gold' THEN 'ranking_gold'::badge_type_enum
        WHEN 'platinum' THEN 'ranking_platinum'::badge_type_enum
    END;

    -- Remover badges de ranking antigos
    DELETE FROM user_badges
    WHERE user_id = p_user_id
        AND badge_type IN ('ranking_bronze', 'ranking_silver', 'ranking_gold', 'ranking_platinum');

    -- Adicionar badge atual
    INSERT INTO user_badges (user_id, badge_type, earned_at)
    VALUES (p_user_id, v_badge_type, NOW())
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função check_and_assign_verified_badge
CREATE OR REPLACE FUNCTION check_and_assign_verified_badge()
RETURNS TRIGGER AS $$
DECLARE
    profile_complete BOOLEAN := false;
    musician_profile_complete BOOLEAN := false;
BEGIN
    -- Verifica se o perfil básico está completo
    SELECT 
        (display_name IS NOT NULL AND display_name != '') AND
        (phone_e164 IS NOT NULL AND phone_e164 != '') AND
        (city IS NOT NULL AND city != '') AND
        (state IS NOT NULL AND state != '') AND
        (photo_url IS NOT NULL AND photo_url != '')
    INTO profile_complete
    FROM profiles
    WHERE user_id = NEW.user_id;

    -- Se for músico, verifica também o perfil de músico
    IF EXISTS (SELECT 1 FROM profiles WHERE user_id = NEW.user_id AND user_type = 'musician') THEN
        SELECT 
            (instruments IS NOT NULL AND array_length(instruments, 1) > 0) AND
            (bio IS NOT NULL AND bio != '')
        INTO musician_profile_complete
        FROM musician_profiles
        WHERE user_id = NEW.user_id;
    END IF;

    -- Se perfil completo, atribui badge "Verificado"
    IF profile_complete AND (NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = NEW.user_id AND user_type = 'musician') OR musician_profile_complete) THEN
        INSERT INTO user_badges (user_id, badge_type, metadata)
        VALUES (NEW.user_id, 'verified', jsonb_build_object('completed_at', NOW()))
        ON CONFLICT DO NOTHING;
    ELSE
        -- Se não está completo, remove o badge (se existir)
        DELETE FROM user_badges 
        WHERE user_id = NEW.user_id 
        AND badge_type = 'verified';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função check_and_assign_ambassador_badge
CREATE OR REPLACE FUNCTION check_and_assign_ambassador_badge()
RETURNS TRIGGER AS $$
DECLARE
  v_total_users INTEGER;
  v_days_since_creation INTEGER;
BEGIN
  -- Contar total de usuários
  SELECT COUNT(*) INTO v_total_users
  FROM profiles;

  -- Calcular dias desde a criação do perfil
  SELECT EXTRACT(DAY FROM (NOW() - NEW.created_at)) INTO v_days_since_creation;

  -- Atribuir badge de Embaixador se:
  -- 1. Está entre os primeiros 100 usuários, OU
  -- 2. Criou conta nos primeiros 30 dias da plataforma
  IF v_total_users <= 100 OR v_days_since_creation <= 30 THEN
    NEW.is_ambassador := true;

    -- Garantir que o badge existe na tabela user_badges
    INSERT INTO user_badges (user_id, badge_type, earned_at)
    VALUES (NEW.user_id, 'ambassador'::badge_type_enum, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função check_challenge_progress (já deve estar como SECURITY DEFINER, mas vamos garantir)
-- Esta função é chamada por outras funções, então não precisa ser SECURITY DEFINER
-- Mas vamos garantir que as funções que a chamam sejam

-- 5. Garantir permissões nas funções
GRANT EXECUTE ON FUNCTION sync_ranking_badge(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_assign_verified_badge() TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_assign_ambassador_badge() TO authenticated;

-- 6. Comentários
COMMENT ON FUNCTION sync_ranking_badge(UUID) IS 'Sincroniza badge de ranking com tier atual. Executa com SECURITY DEFINER para bypassar RLS quando necessário.';
COMMENT ON FUNCTION check_and_assign_verified_badge() IS 'Atribui badge Verificado quando perfil está completo. Executa com SECURITY DEFINER para bypassar RLS quando necessário.';
COMMENT ON FUNCTION check_and_assign_ambassador_badge() IS 'Atribui badge de Embaixador para primeiros usuários. Executa com SECURITY DEFINER para bypassar RLS quando necessário.';

-- 7. Verificar políticas existentes
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
WHERE tablename = 'user_badges'
ORDER BY cmd, policyname;

