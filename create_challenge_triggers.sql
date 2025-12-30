-- ============================================
-- Triggers e Funções para Atualizar Progresso de Desafios Automaticamente
-- ============================================

-- 1. Função para atualizar desafios relacionados a perfil
CREATE OR REPLACE FUNCTION update_profile_challenges()
RETURNS TRIGGER AS $$
DECLARE
    v_has_photo BOOLEAN;
    v_profile_complete BOOLEAN;
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

    -- Atualizar desafio "Foto Perfeita"
    IF v_has_photo THEN
        PERFORM check_challenge_progress(
            NEW.user_id,
            (SELECT id FROM challenges WHERE title = 'Foto Perfeita' LIMIT 1),
            1
        );
    END IF;

    -- Atualizar desafio "Perfil Completo"
    IF v_profile_complete THEN
        PERFORM check_challenge_progress(
            NEW.user_id,
            (SELECT id FROM challenges WHERE title = 'Perfil Completo' LIMIT 1),
            1
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger para atualizar desafios quando perfil é atualizado
DROP TRIGGER IF EXISTS trigger_update_profile_challenges ON profiles;
CREATE TRIGGER trigger_update_profile_challenges
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_challenges();

-- 3. Função para atualizar desafios relacionados a gigs
CREATE OR REPLACE FUNCTION update_gig_challenges()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_gig_count INTEGER;
    v_completed_gigs INTEGER;
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

        -- Atualizar desafios de criação de gigs
        IF v_gig_count = 1 THEN
            PERFORM check_challenge_progress(
                v_user_id,
                (SELECT id FROM challenges WHERE title = 'Primeira Gig' LIMIT 1),
                1
            );
        END IF;

        IF v_gig_count >= 5 THEN
            PERFORM check_challenge_progress(
                v_user_id,
                (SELECT id FROM challenges WHERE title = 'Músico Ativo' LIMIT 1),
                5
            );
        END IF;

        IF v_gig_count >= 20 THEN
            PERFORM check_challenge_progress(
                v_user_id,
                (SELECT id FROM challenges WHERE title = 'Gig Master' LIMIT 1),
                20
            );
        END IF;

        IF v_gig_count >= 50 THEN
            PERFORM check_challenge_progress(
                v_user_id,
                (SELECT id FROM challenges WHERE title = 'Lenda' LIMIT 1),
                50
            );
        END IF;
    END IF;

    -- Contar gigs completadas (para músicos)
    IF TG_TABLE_NAME = 'confirmations' AND NEW.confirmed = true THEN
        SELECT COUNT(*) INTO v_completed_gigs
        FROM confirmations c
        INNER JOIN invites i ON i.id = c.invite_id
        INNER JOIN gigs g ON g.id = i.gig_id
        WHERE c.musician_id = v_user_id
            AND c.confirmed = true
            AND g.end_time < NOW();

        -- Atualizar desafios de gigs completadas
        IF v_completed_gigs >= 5 THEN
            PERFORM check_challenge_progress(
                v_user_id,
                (SELECT id FROM challenges WHERE title = 'Músico Ativo' LIMIT 1),
                5
            );
        END IF;

        IF v_completed_gigs >= 20 THEN
            PERFORM check_challenge_progress(
                v_user_id,
                (SELECT id FROM challenges WHERE title = 'Gig Master' LIMIT 1),
                20
            );
        END IF;

        IF v_completed_gigs >= 50 THEN
            PERFORM check_challenge_progress(
                v_user_id,
                (SELECT id FROM challenges WHERE title = 'Lenda' LIMIT 1),
                50
            );
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Triggers para atualizar desafios de gigs
DROP TRIGGER IF EXISTS trigger_update_gig_challenges ON gigs;
CREATE TRIGGER trigger_update_gig_challenges
    AFTER INSERT ON gigs
    FOR EACH ROW
    EXECUTE FUNCTION update_gig_challenges();

DROP TRIGGER IF EXISTS trigger_update_invite_challenges ON invites;
CREATE TRIGGER trigger_update_invite_challenges
    AFTER UPDATE OF status ON invites
    FOR EACH ROW
    WHEN (NEW.status = 'accepted' AND OLD.status != 'accepted')
    EXECUTE FUNCTION update_gig_challenges();

DROP TRIGGER IF EXISTS trigger_update_confirmation_challenges ON confirmations;
CREATE TRIGGER trigger_update_confirmation_challenges
    AFTER INSERT OR UPDATE ON confirmations
    FOR EACH ROW
    WHEN (NEW.confirmed = true)
    EXECUTE FUNCTION update_gig_challenges();

-- 5. Função para atualizar desafios relacionados a avaliações
CREATE OR REPLACE FUNCTION update_rating_challenges()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_rating_count INTEGER;
    v_avg_rating NUMERIC;
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

    -- Contar avaliações e calcular média
    SELECT 
        COUNT(*),
        AVG(rating)
    INTO v_rating_count, v_avg_rating
    FROM ratings
    WHERE (rated_type = 'musician' AND musician_id = v_user_id)
       OR (rated_type = 'contractor' AND contractor_id = v_user_id)
    AND is_public = true
    AND rating IS NOT NULL;

    -- Atualizar desafios de avaliações
    IF v_rating_count >= 1 AND v_avg_rating >= 5 THEN
        PERFORM check_challenge_progress(
            v_user_id,
            (SELECT id FROM challenges WHERE title = 'Estrela Brilhante' LIMIT 1),
            1
        );
    END IF;

    IF v_rating_count >= 10 THEN
        PERFORM check_challenge_progress(
            v_user_id,
            (SELECT id FROM challenges WHERE title = 'Confiável' LIMIT 1),
            10
        );
    END IF;

    IF v_avg_rating >= 4.5 THEN
        PERFORM check_challenge_progress(
            v_user_id,
            (SELECT id FROM challenges WHERE title = 'Bem Avaliado' LIMIT 1),
            ROUND(v_avg_rating * 10)::INTEGER
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para atualizar desafios quando avaliação é criada
DROP TRIGGER IF EXISTS trigger_update_rating_challenges ON ratings;
CREATE TRIGGER trigger_update_rating_challenges
    AFTER INSERT OR UPDATE ON ratings
    FOR EACH ROW
    WHEN (NEW.is_public = true)
    EXECUTE FUNCTION update_rating_challenges();

-- 7. Função para inicializar ranking de usuários existentes
CREATE OR REPLACE FUNCTION initialize_user_rankings()
RETURNS VOID AS $$
DECLARE
    v_user RECORD;
BEGIN
    FOR v_user IN SELECT user_id FROM profiles LOOP
        PERFORM update_user_ranking(v_user.user_id);
        PERFORM sync_ranking_badge(v_user.user_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. Comentários
COMMENT ON FUNCTION update_profile_challenges() IS 'Atualiza desafios relacionados a perfil quando perfil é modificado';
COMMENT ON FUNCTION update_gig_challenges() IS 'Atualiza desafios relacionados a gigs quando gigs são criadas ou completadas';
COMMENT ON FUNCTION update_rating_challenges() IS 'Atualiza desafios relacionados a avaliações quando avaliações são criadas';

