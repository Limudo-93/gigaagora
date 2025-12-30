-- ============================================
-- Sistema de Gamificação - Desafios e Rankings
-- ============================================

-- 1. Criar ENUM para níveis de desafio
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_difficulty_enum') THEN
        CREATE TYPE challenge_difficulty_enum AS ENUM ('easy', 'medium', 'hard', 'expert');
    END IF;
END $$;

-- 2. Criar ENUM para rankings
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ranking_tier_enum') THEN
        CREATE TYPE ranking_tier_enum AS ENUM ('bronze', 'silver', 'gold', 'platinum');
    END IF;
END $$;

-- 3. Tabela de desafios
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty challenge_difficulty_enum NOT NULL,
    points INTEGER NOT NULL CHECK (points > 0),
    category TEXT NOT NULL, -- 'profile', 'gigs', 'ratings', 'social', 'streak', etc.
    icon_name TEXT, -- Nome do ícone do lucide-react
    requirement_type TEXT NOT NULL, -- 'count', 'streak', 'rating', 'custom'
    requirement_value INTEGER, -- Valor necessário para completar
    requirement_metadata JSONB DEFAULT '{}', -- Dados adicionais específicos do desafio
    is_active BOOLEAN DEFAULT true,
    is_repeatable BOOLEAN DEFAULT false, -- Se pode ser completado múltiplas vezes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de conquistas dos usuários
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0, -- Progresso atual (0 a requirement_value)
    completed_at TIMESTAMPTZ, -- NULL = não completado
    times_completed INTEGER DEFAULT 0, -- Quantas vezes completou (para desafios repetíveis)
    metadata JSONB DEFAULT '{}', -- Dados adicionais sobre a conquista
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- 5. Tabela de ranking dos usuários
CREATE TABLE IF NOT EXISTS user_rankings (
    user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    completed_challenges INTEGER DEFAULT 0,
    current_tier ranking_tier_enum DEFAULT 'bronze',
    tier_points INTEGER DEFAULT 0, -- Pontos no tier atual
    tier_progress_percentage NUMERIC(5, 2) DEFAULT 0, -- Progresso % no tier atual
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Índices
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_challenge_id ON user_achievements(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(user_id, completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_user_rankings_points ON user_rankings(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_rankings_tier ON user_rankings(current_tier, total_points DESC);

-- 7. Função para calcular ranking baseado em pontos
CREATE OR REPLACE FUNCTION calculate_user_tier(p_total_points INTEGER)
RETURNS ranking_tier_enum AS $$
BEGIN
    IF p_total_points >= 10000 THEN
        RETURN 'platinum';
    ELSIF p_total_points >= 5000 THEN
        RETURN 'gold';
    ELSIF p_total_points >= 1000 THEN
        RETURN 'silver';
    ELSE
        RETURN 'bronze';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. Função para atualizar ranking do usuário
CREATE OR REPLACE FUNCTION update_user_ranking(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_points INTEGER;
    v_completed_count INTEGER;
    v_new_tier ranking_tier_enum;
    v_tier_points INTEGER;
    v_tier_progress NUMERIC;
BEGIN
    -- Calcular pontos totais e desafios completados
    SELECT 
        COALESCE(SUM(c.points), 0),
        COUNT(DISTINCT ua.challenge_id) FILTER (WHERE ua.completed_at IS NOT NULL)
    INTO v_total_points, v_completed_count
    FROM user_achievements ua
    INNER JOIN challenges c ON c.id = ua.challenge_id
    WHERE ua.user_id = p_user_id
        AND ua.completed_at IS NOT NULL;

    -- Calcular tier
    v_new_tier := calculate_user_tier(v_total_points);

    -- Calcular pontos e progresso no tier atual
    CASE v_new_tier
        WHEN 'bronze' THEN
            v_tier_points := v_total_points;
            v_tier_progress := (v_tier_points::NUMERIC / 1000.0 * 100);
        WHEN 'silver' THEN
            v_tier_points := v_total_points - 1000;
            v_tier_progress := (v_tier_points::NUMERIC / 4000.0 * 100);
        WHEN 'gold' THEN
            v_tier_points := v_total_points - 5000;
            v_tier_progress := (v_tier_points::NUMERIC / 5000.0 * 100);
        WHEN 'platinum' THEN
            v_tier_points := v_total_points - 10000;
            v_tier_progress := 100; -- Máximo no platinum
    END CASE;

    -- Garantir que progresso não ultrapasse 100%
    IF v_tier_progress > 100 THEN
        v_tier_progress := 100;
    END IF;

    -- Atualizar ou inserir ranking
    INSERT INTO user_rankings (user_id, total_points, completed_challenges, current_tier, tier_points, tier_progress_percentage, last_updated)
    VALUES (p_user_id, v_total_points, v_completed_count, v_new_tier, v_tier_points, v_tier_progress, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET 
        total_points = EXCLUDED.total_points,
        completed_challenges = EXCLUDED.completed_challenges,
        current_tier = EXCLUDED.current_tier,
        tier_points = EXCLUDED.tier_points,
        tier_progress_percentage = EXCLUDED.tier_progress_percentage,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- 9. Função para verificar e atualizar progresso de desafios
CREATE OR REPLACE FUNCTION check_challenge_progress(
    p_user_id UUID,
    p_challenge_id UUID,
    p_progress_value INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_challenge RECORD;
    v_achievement RECORD;
    v_completed BOOLEAN := false;
BEGIN
    -- Buscar desafio
    SELECT * INTO v_challenge
    FROM challenges
    WHERE id = p_challenge_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Buscar ou criar conquista
    SELECT * INTO v_achievement
    FROM user_achievements
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id;

    IF NOT FOUND THEN
        -- Criar nova conquista
        INSERT INTO user_achievements (user_id, challenge_id, progress)
        VALUES (p_user_id, p_challenge_id, LEAST(p_progress_value, v_challenge.requirement_value))
        RETURNING * INTO v_achievement;
    ELSE
        -- Atualizar progresso existente
        UPDATE user_achievements
        SET progress = LEAST(p_progress_value, v_challenge.requirement_value),
            updated_at = NOW()
        WHERE id = v_achievement.id
        RETURNING * INTO v_achievement;
    END IF;

    -- Verificar se completou
    IF v_achievement.progress >= v_challenge.requirement_value AND v_achievement.completed_at IS NULL THEN
        -- Marcar como completado
        UPDATE user_achievements
        SET 
            completed_at = NOW(),
            times_completed = times_completed + 1
        WHERE id = v_achievement.id;

        -- Atualizar ranking
        PERFORM update_user_ranking(p_user_id);

        v_completed := true;
    END IF;

    RETURN v_completed;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger para atualizar updated_at
CREATE TRIGGER update_challenges_updated_at
    BEFORE UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at
    BEFORE UPDATE ON user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Inserir desafios iniciais
INSERT INTO challenges (title, description, difficulty, points, category, icon_name, requirement_type, requirement_value) VALUES
-- FÁCEIS (Bronze)
('Primeiro Passo', 'Complete seu perfil básico', 'easy', 50, 'profile', 'User', 'custom', 1),
('Foto Perfeita', 'Adicione uma foto ao seu perfil', 'easy', 50, 'profile', 'Camera', 'custom', 1),
('Primeira Gig', 'Crie sua primeira gig', 'easy', 100, 'gigs', 'Music', 'count', 1),
('Primeiro Convite', 'Aceite seu primeiro convite', 'easy', 100, 'gigs', 'Mail', 'count', 1),
('Estrela Brilhante', 'Receba sua primeira avaliação 5 estrelas', 'easy', 150, 'ratings', 'Star', 'rating', 5),
('Social Media', 'Adicione pelo menos um link de rede social', 'easy', 50, 'profile', 'Share2', 'count', 1),

-- MÉDIOS (Prata)
('Músico Ativo', 'Complete 5 gigs', 'medium', 200, 'gigs', 'Music2', 'count', 5),
('Bem Avaliado', 'Tenha uma média de avaliações acima de 4.5', 'medium', 250, 'ratings', 'Star', 'rating', 4),
('Perfil Completo', 'Complete 100% do seu perfil', 'medium', 200, 'profile', 'CheckCircle', 'custom', 1),
('Confiável', 'Receba 10 avaliações positivas', 'medium', 300, 'ratings', 'ThumbsUp', 'count', 10),
('Semana Produtiva', 'Complete 3 gigs em uma semana', 'medium', 250, 'gigs', 'Calendar', 'streak', 3),
('Primeiro Mês', 'Use a plataforma por 30 dias consecutivos', 'medium', 300, 'streak', 'Flame', 'streak', 30),

-- DIFÍCEIS (Ouro)
('Gig Master', 'Complete 20 gigs', 'hard', 500, 'gigs', 'Award', 'count', 20),
('Perfeição', 'Mantenha média de 5 estrelas em 10 avaliações', 'hard', 600, 'ratings', 'Star', 'rating', 5),
('Mês Dourado', 'Complete 10 gigs em um mês', 'hard', 700, 'gigs', 'Trophy', 'count', 10),
('Recomendado', 'Seja favoritado por 5 contratantes diferentes', 'hard', 600, 'social', 'Heart', 'count', 5),
('Estrela do Mês', 'Seja o músico mais bem avaliado do mês', 'hard', 800, 'ratings', 'Crown', 'custom', 1),
('Semana Perfeita', 'Complete 7 gigs em 7 dias', 'hard', 750, 'gigs', 'Zap', 'streak', 7),

-- EXPERT (Platina)
('Lenda', 'Complete 50 gigs', 'expert', 1500, 'gigs', 'Medal', 'count', 50),
('Ícone', 'Tenha 50 avaliações com média acima de 4.8', 'expert', 2000, 'ratings', 'Gem', 'rating', 4),
('Influenciador', 'Tenha 20 contratantes favoritando você', 'expert', 1800, 'social', 'Users', 'count', 20),
('Mestre', 'Complete 100 gigs', 'expert', 3000, 'gigs', 'Crown', 'count', 100),
('Lendário', 'Seja o músico mais bem avaliado por 3 meses consecutivos', 'expert', 2500, 'ratings', 'Trophy', 'custom', 1),
('100 Dias', 'Use a plataforma por 100 dias consecutivos', 'expert', 2000, 'streak', 'Flame', 'streak', 100)
ON CONFLICT DO NOTHING;

-- 12. Adicionar badge de ranking ao enum badge_type_enum
DO $$
BEGIN
  -- Verificar se já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel IN ('ranking_bronze', 'ranking_silver', 'ranking_gold', 'ranking_platinum')
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'badge_type_enum')
  ) THEN
    -- Adicionar badges de ranking ao enum
    ALTER TYPE badge_type_enum ADD VALUE IF NOT EXISTS 'ranking_bronze';
    ALTER TYPE badge_type_enum ADD VALUE IF NOT EXISTS 'ranking_silver';
    ALTER TYPE badge_type_enum ADD VALUE IF NOT EXISTS 'ranking_gold';
    ALTER TYPE badge_type_enum ADD VALUE IF NOT EXISTS 'ranking_platinum';
  END IF;
END $$;

-- 13. Função para sincronizar badge de ranking com tier atual
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
$$ LANGUAGE plpgsql;

-- 14. Trigger para atualizar badge quando ranking muda
CREATE OR REPLACE FUNCTION trigger_sync_ranking_badge()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.current_tier IS DISTINCT FROM NEW.current_tier THEN
        PERFORM sync_ranking_badge(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_ranking_badge ON user_rankings;
CREATE TRIGGER trigger_sync_ranking_badge
    AFTER UPDATE OF current_tier ON user_rankings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_ranking_badge();

-- 15. Comentários
COMMENT ON TABLE challenges IS 'Desafios gamificados para engajar usuários';
COMMENT ON TABLE user_achievements IS 'Progresso dos usuários nos desafios';
COMMENT ON TABLE user_rankings IS 'Ranking e tier dos usuários baseado em pontos';
COMMENT ON FUNCTION calculate_user_tier(INTEGER) IS 'Calcula o tier baseado em pontos totais';
COMMENT ON FUNCTION update_user_ranking(UUID) IS 'Atualiza o ranking completo do usuário';
COMMENT ON FUNCTION check_challenge_progress(UUID, UUID, INTEGER) IS 'Verifica e atualiza progresso de um desafio específico';

