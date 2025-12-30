-- ============================================
-- Correção: Erro ao criar gig - "record new has no field confirmed"
-- ============================================

-- O problema está na função update_gig_challenges() que está tentando acessar
-- NEW.confirmed quando a tabela é 'gigs', mas gigs não tem campo 'confirmed'

-- 1. Corrigir função update_gig_challenges para verificar TG_TABLE_NAME antes de acessar confirmed
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
    ELSE
        -- Se não for nenhuma das tabelas esperadas, retornar sem fazer nada
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF v_user_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Contar gigs criadas (para contratantes) - APENAS quando a tabela é 'gigs'
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
        
        -- IMPORTANTE: Retornar aqui para não executar a lógica de confirmations
        RETURN NEW;
    END IF;

    -- Contar gigs completadas (para músicos) - APENAS quando a tabela é 'confirmations'
    -- E APENAS se NEW.confirmed existe (ou seja, quando TG_TABLE_NAME = 'confirmations')
    IF TG_TABLE_NAME = 'confirmations' THEN
        -- Verificar se confirmed = true antes de processar
        IF NEW.confirmed = true THEN
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
        
        RETURN NEW;
    END IF;

    -- Para invites, apenas retornar sem processar (não há lógica específica para invites)
    IF TG_TABLE_NAME = 'invites' THEN
        RETURN NEW;
    END IF;

    -- Fallback: retornar o registro
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 2. Verificar se os triggers estão corretos
-- O trigger em gigs deve ser AFTER INSERT, não deve acessar confirmed
-- O trigger em confirmations deve verificar confirmed antes de executar

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

-- 3. Comentário explicativo
COMMENT ON FUNCTION update_gig_challenges() IS 'Atualiza desafios relacionados a gigs. IMPORTANTE: Verifica TG_TABLE_NAME antes de acessar campos específicos de cada tabela para evitar erros de campo inexistente.';

