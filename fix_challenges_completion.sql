-- ============================================
-- Correção: Desafios aparecendo como completos incorretamente
-- ============================================

-- 1. Limpar conquistas que foram marcadas como completas incorretamente
-- (onde progress >= requirement_value mas requirement_value é NULL ou 0)
UPDATE user_achievements ua
SET 
    completed_at = NULL,
    times_completed = 0,
    progress = 0
FROM challenges c
WHERE ua.challenge_id = c.id
    AND ua.completed_at IS NOT NULL
    AND (c.requirement_value IS NULL OR c.requirement_value = 0);

-- 2. Corrigir função check_challenge_progress para validar melhor
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

    -- Validar que requirement_value existe e é maior que 0
    IF v_challenge.requirement_value IS NULL OR v_challenge.requirement_value <= 0 THEN
        RETURN false;
    END IF;

    -- Validar que p_progress_value é válido
    IF p_progress_value IS NULL OR p_progress_value < 0 THEN
        RETURN false;
    END IF;

    -- Buscar ou criar conquista
    SELECT * INTO v_achievement
    FROM user_achievements
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id;

    IF NOT FOUND THEN
        -- Criar nova conquista apenas se houver progresso
        IF p_progress_value > 0 THEN
            INSERT INTO user_achievements (user_id, challenge_id, progress)
            VALUES (p_user_id, p_challenge_id, LEAST(p_progress_value, v_challenge.requirement_value))
            RETURNING * INTO v_achievement;
        ELSE
            RETURN false;
        END IF;
    ELSE
        -- Atualizar progresso existente apenas se o novo valor for maior
        IF p_progress_value > v_achievement.progress THEN
            UPDATE user_achievements
            SET progress = LEAST(p_progress_value, v_challenge.requirement_value),
                updated_at = NOW()
            WHERE id = v_achievement.id
            RETURNING * INTO v_achievement;
        END IF;
    END IF;

    -- Verificar se completou (apenas se achievement foi criado/atualizado)
    IF v_achievement.id IS NOT NULL 
       AND v_achievement.progress >= v_challenge.requirement_value 
       AND v_achievement.completed_at IS NULL THEN
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

-- 3. Corrigir trigger de perfil para não marcar como completo se não houver progresso real
CREATE OR REPLACE FUNCTION update_profile_challenges()
RETURNS TRIGGER AS $$
DECLARE
    v_has_photo BOOLEAN;
    v_profile_complete BOOLEAN;
    v_challenge_id UUID;
BEGIN
    -- Verificar se tem foto
    v_has_photo := (NEW.photo_url IS NOT NULL AND NEW.photo_url != '');

    -- Verificar se perfil está completo
    v_profile_complete := (
        (NEW.display_name IS NOT NULL AND NEW.display_name != '') AND
        (NEW.phone_e164 IS NOT NULL AND NEW.phone_e164 != '') AND
        (NEW.city IS NOT NULL AND NEW.city != '') AND
        (NEW.state IS NOT NULL AND NEW.state != '') AND
        v_has_photo
    );

    -- Atualizar desafio "Foto Perfeita" apenas se realmente tem foto
    IF v_has_photo THEN
        SELECT id INTO v_challenge_id
        FROM challenges 
        WHERE title = 'Foto Perfeita' AND is_active = true
        LIMIT 1;
        
        IF v_challenge_id IS NOT NULL THEN
            PERFORM check_challenge_progress(
                NEW.user_id,
                v_challenge_id,
                1
            );
        END IF;
    END IF;

    -- Atualizar desafio "Perfil Completo" apenas se realmente está completo
    IF v_profile_complete THEN
        SELECT id INTO v_challenge_id
        FROM challenges 
        WHERE title = 'Perfil Completo' AND is_active = true
        LIMIT 1;
        
        IF v_challenge_id IS NOT NULL THEN
            PERFORM check_challenge_progress(
                NEW.user_id,
                v_challenge_id,
                1
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Corrigir trigger de gigs para validar melhor
CREATE OR REPLACE FUNCTION update_gig_challenges()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_gig_count INTEGER;
    v_completed_gigs INTEGER;
    v_challenge_id UUID;
BEGIN
    -- Determinar user_id baseado no tipo de operação
    IF TG_TABLE_NAME = 'gigs' THEN
        v_user_id := NEW.contractor_id;
    ELSIF TG_TABLE_NAME = 'invites' THEN
        -- Buscar contractor_id da gig
        SELECT contractor_id INTO v_user_id
        FROM gigs
        WHERE id = NEW.gig_id;
    ELSIF TG_TABLE_NAME = 'confirmations' THEN
        -- Buscar musician_id do invite
        SELECT musician_id INTO v_user_id
        FROM invites
        WHERE id = NEW.invite_id;
    END IF;

    IF v_user_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Contar gigs criadas (para contratantes)
    IF TG_TABLE_NAME = 'gigs' AND TG_OP = 'INSERT' THEN
        SELECT COUNT(*) INTO v_gig_count
        FROM gigs
        WHERE contractor_id = v_user_id;

        -- Atualizar desafios de criação de gigs apenas se realmente tem gigs
        IF v_gig_count >= 1 THEN
            SELECT id INTO v_challenge_id
            FROM challenges 
            WHERE title = 'Primeira Gig' AND is_active = true
            LIMIT 1;
            
            IF v_challenge_id IS NOT NULL THEN
                PERFORM check_challenge_progress(
                    v_user_id,
                    v_challenge_id,
                    v_gig_count
                );
            END IF;
        END IF;

        IF v_gig_count >= 5 THEN
            SELECT id INTO v_challenge_id
            FROM challenges 
            WHERE title = 'Músico Ativo' AND is_active = true
            LIMIT 1;
            
            IF v_challenge_id IS NOT NULL THEN
                PERFORM check_challenge_progress(
                    v_user_id,
                    v_challenge_id,
                    v_gig_count
                );
            END IF;
        END IF;

        IF v_gig_count >= 20 THEN
            SELECT id INTO v_challenge_id
            FROM challenges 
            WHERE title = 'Gig Master' AND is_active = true
            LIMIT 1;
            
            IF v_challenge_id IS NOT NULL THEN
                PERFORM check_challenge_progress(
                    v_user_id,
                    v_challenge_id,
                    v_gig_count
                );
            END IF;
        END IF;

        IF v_gig_count >= 50 THEN
            SELECT id INTO v_challenge_id
            FROM challenges 
            WHERE title = 'Lenda' AND is_active = true
            LIMIT 1;
            
            IF v_challenge_id IS NOT NULL THEN
                PERFORM check_challenge_progress(
                    v_user_id,
                    v_challenge_id,
                    v_gig_count
                );
            END IF;
        END IF;
    END IF;

    -- Contar gigs completadas (para músicos) apenas se realmente completou
    IF TG_TABLE_NAME = 'confirmations' AND NEW.confirmed = true THEN
        SELECT COUNT(*) INTO v_completed_gigs
        FROM confirmations c
        INNER JOIN invites i ON i.id = c.invite_id
        INNER JOIN gigs g ON g.id = i.gig_id
        WHERE c.musician_id = v_user_id
            AND c.confirmed = true
            AND g.end_time < NOW();

        -- Atualizar desafios de gigs completadas apenas se realmente tem gigs completadas
        IF v_completed_gigs >= 5 THEN
            SELECT id INTO v_challenge_id
            FROM challenges 
            WHERE title = 'Músico Ativo' AND is_active = true
            LIMIT 1;
            
            IF v_challenge_id IS NOT NULL THEN
                PERFORM check_challenge_progress(
                    v_user_id,
                    v_challenge_id,
                    v_completed_gigs
                );
            END IF;
        END IF;

        IF v_completed_gigs >= 20 THEN
            SELECT id INTO v_challenge_id
            FROM challenges 
            WHERE title = 'Gig Master' AND is_active = true
            LIMIT 1;
            
            IF v_challenge_id IS NOT NULL THEN
                PERFORM check_challenge_progress(
                    v_user_id,
                    v_challenge_id,
                    v_completed_gigs
                );
            END IF;
        END IF;

        IF v_completed_gigs >= 50 THEN
            SELECT id INTO v_challenge_id
            FROM challenges 
            WHERE title = 'Lenda' AND is_active = true
            LIMIT 1;
            
            IF v_challenge_id IS NOT NULL THEN
                PERFORM check_challenge_progress(
                    v_user_id,
                    v_challenge_id,
                    v_completed_gigs
                );
            END IF;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. Corrigir trigger de avaliações para validar melhor
CREATE OR REPLACE FUNCTION update_rating_challenges()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_rating_count INTEGER;
    v_avg_rating NUMERIC;
    v_challenge_id UUID;
BEGIN
    -- Determinar user_id (quem foi avaliado)
    IF NEW.rated_type = 'musician' THEN
        v_user_id := NEW.musician_id;
    ELSE
        v_user_id := NEW.contractor_id;
    END IF;

    IF v_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Contar avaliações e calcular média apenas de avaliações válidas
    SELECT 
        COUNT(*),
        AVG(rating)
    INTO v_rating_count, v_avg_rating
    FROM ratings
    WHERE (rated_type = 'musician' AND musician_id = v_user_id)
       OR (rated_type = 'contractor' AND contractor_id = v_user_id)
    AND is_public = true
    AND rating IS NOT NULL
    AND rating > 0;

    -- Atualizar desafios de avaliações apenas se realmente tem avaliações válidas
    IF v_rating_count >= 1 AND NEW.rating >= 5 THEN
        SELECT id INTO v_challenge_id
        FROM challenges 
        WHERE title = 'Estrela Brilhante' AND is_active = true
        LIMIT 1;
        
        IF v_challenge_id IS NOT NULL THEN
            PERFORM check_challenge_progress(
                v_user_id,
                v_challenge_id,
                1
            );
        END IF;
    END IF;

    IF v_rating_count >= 10 THEN
        SELECT id INTO v_challenge_id
        FROM challenges 
        WHERE title = 'Confiável' AND is_active = true
        LIMIT 1;
        
        IF v_challenge_id IS NOT NULL THEN
            PERFORM check_challenge_progress(
                v_user_id,
                v_challenge_id,
                v_rating_count
            );
        END IF;
    END IF;

    IF v_rating_count > 0 AND v_avg_rating >= 4.5 THEN
        SELECT id INTO v_challenge_id
        FROM challenges 
        WHERE title = 'Bem Avaliado' AND is_active = true
        LIMIT 1;
        
        IF v_challenge_id IS NOT NULL THEN
            -- Converter média para valor inteiro para progresso
            PERFORM check_challenge_progress(
                v_user_id,
                v_challenge_id,
                ROUND(v_avg_rating * 10)::INTEGER
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Recalcular rankings de todos os usuários
SELECT update_user_ranking(user_id) FROM profiles;

-- 7. Verificar resultados
SELECT 
    COUNT(*) as total_achievements,
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_achievements,
    COUNT(*) FILTER (WHERE progress > 0 AND completed_at IS NULL) as in_progress,
    COUNT(*) FILTER (WHERE progress = 0) as not_started
FROM user_achievements;

