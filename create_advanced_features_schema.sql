-- ============================================
-- SCHEMA COMPLETO - Funcionalidades Avançadas
-- Confiança & Reputação, Matching por Localização, Relacionamento, Growth & Identidade
-- ============================================

-- ============================================
-- 0. FUNÇÕES AUXILIARES
-- ============================================

-- Função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. SISTEMA DE AVALIAÇÃO BILATERAL EXPANDIDO
-- ============================================

-- Criar ENUM para tipos de comentários pré-definidos (positivos e negativos)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rating_comment_type_enum') THEN
        CREATE TYPE rating_comment_type_enum AS ENUM (
            -- Positivos
            'canta_bem', 'toca_bem', 'pontual', 'roupas_adequadas', 'profissional', 
            'comunicativo', 'flexivel', 'criativo', 'energico', 'organizado',
            -- Negativos
            'atrasado', 'desorganizado', 'nao_comunicativo', 'roupas_inadequadas', 
            'pouco_profissional', 'inflexivel', 'pouca_energia', 'nao_pontual'
        );
    END IF;
END $$;

-- Expandir tabela ratings para suportar avaliação bilateral
ALTER TABLE ratings 
ADD COLUMN IF NOT EXISTS rater_type TEXT CHECK (rater_type IN ('contractor', 'musician')),
ADD COLUMN IF NOT EXISTS rated_type TEXT CHECK (rated_type IN ('contractor', 'musician')),
ADD COLUMN IF NOT EXISTS predefined_comments rating_comment_type_enum[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_comment TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ratings_rater_type ON ratings(rater_type);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_type ON ratings(rated_type);
CREATE INDEX IF NOT EXISTS idx_ratings_gig_id ON ratings(gig_id);

-- ============================================
-- 2. SISTEMA DE BADGES
-- ============================================

-- Criar ENUM para tipos de badges
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badge_type_enum') THEN
        CREATE TYPE badge_type_enum AS ENUM ('verified', 'active', 'top_rated', 'reliable', 'popular');
    END IF;
END $$;

-- Tabela de badges dos usuários
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    badge_type badge_type_enum NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL = permanente
    metadata JSONB DEFAULT '{}', -- Dados adicionais sobre como o badge foi conquistado
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_type, earned_at)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_type ON user_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_user_badges_expires_at ON user_badges(expires_at) WHERE expires_at IS NOT NULL;
-- NOTA: Removido índice com NOW() pois NOW() não é IMMUTABLE
-- Para buscar badges ativos, use: WHERE expires_at IS NULL OR expires_at > NOW() na query

-- Função para verificar e atribuir badge "Verificado" (perfil completo)
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
            (bio IS NOT NULL AND bio != '') AND
            (instruments IS NOT NULL AND array_length(instruments, 1) > 0) AND
            (genres IS NOT NULL AND array_length(genres, 1) > 0)
        INTO musician_profile_complete
        FROM musician_profiles
        WHERE user_id = NEW.user_id;

        profile_complete := profile_complete AND musician_profile_complete;
    END IF;

    -- Se perfil completo, atribui badge "Verificado"
    IF profile_complete THEN
        INSERT INTO user_badges (user_id, badge_type, metadata)
        VALUES (
            NEW.user_id, 
            'verified',
            jsonb_build_object('checked_at', NOW(), 'trigger', 'profile_completion')
        )
        ON CONFLICT DO NOTHING;
    ELSE
        -- Remove badge se perfil não estiver mais completo
        DELETE FROM user_badges 
        WHERE user_id = NEW.user_id AND badge_type = 'verified';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para verificar badge "Verificado"
DROP TRIGGER IF EXISTS trigger_check_verified_badge_profiles ON profiles;
CREATE TRIGGER trigger_check_verified_badge_profiles
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_and_assign_verified_badge();

DROP TRIGGER IF EXISTS trigger_check_verified_badge_musician ON musician_profiles;
CREATE TRIGGER trigger_check_verified_badge_musician
    AFTER INSERT OR UPDATE ON musician_profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_and_assign_verified_badge();

-- Função para verificar e atribuir badge "Ativo" (4 gigs nos últimos 30 dias)
CREATE OR REPLACE FUNCTION check_and_assign_active_badge()
RETURNS void AS $$
BEGIN
    -- Remove badges "Ativo" expirados
    UPDATE user_badges
    SET expires_at = NOW()
    WHERE badge_type = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
    AND user_id NOT IN (
        SELECT DISTINCT musician_id
        FROM invites
        WHERE status = 'accepted'
        AND accepted_at >= NOW() - INTERVAL '30 days'
        GROUP BY musician_id
        HAVING COUNT(*) >= 4
    );

    -- Atribui badge "Ativo" para músicos com 4+ gigs aceitas nos últimos 30 dias
    INSERT INTO user_badges (user_id, badge_type, expires_at, metadata)
    SELECT 
        musician_id,
        'active',
        NOW() + INTERVAL '30 days',
        jsonb_build_object(
            'gigs_count', COUNT(*),
            'period_start', NOW() - INTERVAL '30 days',
            'earned_at', NOW()
        )
    FROM invites
    WHERE status = 'accepted'
    AND accepted_at >= NOW() - INTERVAL '30 days'
    GROUP BY musician_id
    HAVING COUNT(*) >= 4
    ON CONFLICT (user_id, badge_type, earned_at) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. SISTEMA DE DENÚNCIAS
-- ============================================

-- Criar ENUM para categorias de denúncia
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_category_enum') THEN
        CREATE TYPE report_category_enum AS ENUM (
            'inappropriate_behavior', 'fake_profile', 'spam', 'harassment',
            'fraud', 'no_show', 'unprofessional', 'other'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status_enum') THEN
        CREATE TYPE report_status_enum AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');
    END IF;
END $$;

-- Tabela de denúncias
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
    invite_id UUID REFERENCES invites(id) ON DELETE SET NULL,
    category report_category_enum NOT NULL,
    description TEXT NOT NULL,
    status report_status_enum DEFAULT 'pending',
    moderator_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (reporter_id != reported_user_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. MATCHING POR LOCALIZAÇÃO
-- ============================================

-- Adicionar campos de raio configurável para músicos e contratantes
ALTER TABLE musician_profiles
ADD COLUMN IF NOT EXISTS max_radius_km INTEGER DEFAULT 50 CHECK (max_radius_km > 0 AND max_radius_km <= 500),
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS municipality TEXT;

ALTER TABLE contractor_profiles
ADD COLUMN IF NOT EXISTS preferred_radius_km INTEGER DEFAULT 50 CHECK (preferred_radius_km > 0 AND preferred_radius_km <= 500);

-- Adicionar índices para geolocalização
CREATE INDEX IF NOT EXISTS idx_musician_profiles_location ON musician_profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Função para calcular distância em km usando fórmula de Haversine
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 NUMERIC, lon1 NUMERIC,
    lat2 NUMERIC, lon2 NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
    earth_radius_km NUMERIC := 6371;
    dlat NUMERIC;
    dlon NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;

    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    a := sin(dlat/2) * sin(dlat/2) +
         cos(radians(lat1)) * cos(radians(lat2)) *
         sin(dlon/2) * sin(dlon/2);
    
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN earth_radius_km * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para obter tempo estimado de chegada (simplificado - pode ser integrado com APIs de roteamento)
CREATE OR REPLACE FUNCTION estimate_travel_time_minutes(
    distance_km NUMERIC
)
RETURNS INTEGER AS $$
BEGIN
    IF distance_km IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Estimativa simples: 40 km/h em média (considerando trânsito urbano)
    -- Pode ser melhorado com integração de APIs de roteamento (Google Maps, etc)
    RETURN ROUND((distance_km / 40.0) * 60);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função RPC para buscar músicos por localização com ordenação
CREATE OR REPLACE FUNCTION rpc_search_musicians_by_location(
    p_gig_latitude NUMERIC,
    p_gig_longitude NUMERIC,
    p_max_radius_km INTEGER DEFAULT 50,
    p_instrument TEXT DEFAULT NULL,
    p_order_by TEXT DEFAULT 'distance' -- 'distance', 'rating', 'active_badge', 'comments'
)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    photo_url TEXT,
    city TEXT,
    state TEXT,
    neighborhood TEXT,
    municipality TEXT,
    instruments TEXT[],
    avg_rating NUMERIC,
    rating_count INTEGER,
    distance_km NUMERIC,
    estimated_travel_time_minutes INTEGER,
    has_active_badge BOOLEAN,
    has_verified_badge BOOLEAN,
    top_comments TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mp.user_id,
        p.display_name,
        p.photo_url,
        p.city,
        p.state,
        mp.neighborhood,
        mp.municipality,
        mp.instruments,
        mp.avg_rating,
        mp.rating_count,
        calculate_distance_km(p_gig_latitude, p_gig_longitude, mp.latitude, mp.longitude) as distance_km,
        estimate_travel_time_minutes(
            calculate_distance_km(p_gig_latitude, p_gig_longitude, mp.latitude, mp.longitude)
        ) as estimated_travel_time_minutes,
        EXISTS(
            SELECT 1 FROM user_badges ub 
            WHERE ub.user_id = mp.user_id 
            AND ub.badge_type = 'active' 
            AND (ub.expires_at IS NULL OR ub.expires_at > NOW())
        ) as has_active_badge,
        EXISTS(
            SELECT 1 FROM user_badges ub 
            WHERE ub.user_id = mp.user_id 
            AND ub.badge_type = 'verified' 
            AND (ub.expires_at IS NULL OR ub.expires_at > NOW())
        ) as has_verified_badge,
        ARRAY(
            SELECT DISTINCT unnest(r.predefined_comments::TEXT[])
            FROM ratings r
            WHERE r.musician_id = mp.user_id
            AND r.is_public = true
            AND r.rating >= 4
            LIMIT 5
        ) as top_comments
    FROM musician_profiles mp
    INNER JOIN profiles p ON p.user_id = mp.user_id
    WHERE 
        mp.latitude IS NOT NULL 
        AND mp.longitude IS NOT NULL
        AND calculate_distance_km(p_gig_latitude, p_gig_longitude, mp.latitude, mp.longitude) <= p_max_radius_km
        AND (p_instrument IS NULL OR p_instrument = ANY(mp.instruments))
        AND p.user_type = 'musician'
    ORDER BY
        CASE 
            WHEN p_order_by = 'distance' THEN 
                calculate_distance_km(p_gig_latitude, p_gig_longitude, mp.latitude, mp.longitude)
            WHEN p_order_by = 'rating' THEN 
                -COALESCE(mp.avg_rating, 0) -- Negativo para ordenar DESC
            WHEN p_order_by = 'active_badge' THEN 
                CASE WHEN EXISTS(
                    SELECT 1 FROM user_badges ub 
                    WHERE ub.user_id = mp.user_id 
                    AND ub.badge_type = 'active' 
                    AND (ub.expires_at IS NULL OR ub.expires_at > NOW())
                ) THEN 0 ELSE 1 END
            ELSE 
                calculate_distance_km(p_gig_latitude, p_gig_longitude, mp.latitude, mp.longitude)
        END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. RELACIONAMENTO - FAVORITOS E RECONVITE
-- ============================================

-- Tabela favorites já existe, vamos apenas adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_favorites_contractor ON favorites(contractor_id);
CREATE INDEX IF NOT EXISTS idx_favorites_musician ON favorites(musician_id);
CREATE INDEX IF NOT EXISTS idx_favorites_unique ON favorites(contractor_id, musician_id);

-- Função RPC para reconvite rápido a partir de favoritos
CREATE OR REPLACE FUNCTION rpc_quick_reinvite_from_favorites(
    p_contractor_id UUID,
    p_gig_id UUID,
    p_gig_role_id UUID,
    p_musician_ids UUID[] DEFAULT NULL -- Se NULL, reconvida todos os favoritos
)
RETURNS TABLE (
    musician_id UUID,
    invite_id UUID,
    status TEXT,
    message TEXT
) AS $$
DECLARE
    musician_uuid UUID;
    new_invite_id UUID;
    existing_invite_id UUID;
BEGIN
    -- Se não especificou músicos, busca todos os favoritos
    IF p_musician_ids IS NULL THEN
        FOR musician_uuid IN 
            SELECT musician_id 
            FROM favorites 
            WHERE contractor_id = p_contractor_id
        LOOP
            -- Verifica se já existe invite para este músico nesta gig/role
            SELECT id INTO existing_invite_id
            FROM invites
            WHERE gig_id = p_gig_id
            AND gig_role_id = p_gig_role_id
            AND musician_id = musician_uuid
            LIMIT 1;

            IF existing_invite_id IS NULL THEN
                -- Cria novo invite
                INSERT INTO invites (
                    gig_id,
                    gig_role_id,
                    contractor_id,
                    musician_id,
                    status,
                    invited_at
                ) VALUES (
                    p_gig_id,
                    p_gig_role_id,
                    p_contractor_id,
                    musician_uuid,
                    'pending',
                    NOW()
                ) RETURNING id INTO new_invite_id;

                RETURN QUERY SELECT musician_uuid, new_invite_id, 'created'::TEXT, 'Convite criado com sucesso'::TEXT;
            ELSE
                RETURN QUERY SELECT musician_uuid, existing_invite_id, 'exists'::TEXT, 'Convite já existe'::TEXT;
            END IF;
        END LOOP;
    ELSE
        -- Reconvida apenas os músicos especificados
        FOREACH musician_uuid IN ARRAY p_musician_ids
        LOOP
            -- Verifica se é favorito
            IF EXISTS (SELECT 1 FROM favorites WHERE contractor_id = p_contractor_id AND musician_id = musician_uuid) THEN
                -- Verifica se já existe invite
                SELECT id INTO existing_invite_id
                FROM invites
                WHERE gig_id = p_gig_id
                AND gig_role_id = p_gig_role_id
                AND musician_id = musician_uuid
                LIMIT 1;

                IF existing_invite_id IS NULL THEN
                    INSERT INTO invites (
                        gig_id,
                        gig_role_id,
                        contractor_id,
                        musician_id,
                        status,
                        invited_at
                    ) VALUES (
                        p_gig_id,
                        p_gig_role_id,
                        p_contractor_id,
                        musician_uuid,
                        'pending',
                        NOW()
                    ) RETURNING id INTO new_invite_id;

                    RETURN QUERY SELECT musician_uuid, new_invite_id, 'created'::TEXT, 'Convite criado com sucesso'::TEXT;
                ELSE
                    RETURN QUERY SELECT musician_uuid, existing_invite_id, 'exists'::TEXT, 'Convite já existe'::TEXT;
                END IF;
            ELSE
                RETURN QUERY SELECT musician_uuid, NULL::UUID, 'not_favorite'::TEXT, 'Músico não está nos favoritos'::TEXT;
            END IF;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. GROWTH & IDENTIDADE - PERFIL PÚBLICO
-- ============================================

-- Adicionar campo de slug único para perfil público
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_public_profile BOOLEAN DEFAULT true;

-- Criar índice para busca rápida por slug
CREATE INDEX IF NOT EXISTS idx_profiles_public_slug ON profiles(public_slug) WHERE public_slug IS NOT NULL;

-- Função para gerar slug único baseado no nome
CREATE OR REPLACE FUNCTION generate_public_slug(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Busca display_name
    SELECT LOWER(REGEXP_REPLACE(display_name, '[^a-z0-9]+', '-', 'g'))
    INTO base_slug
    FROM profiles
    WHERE user_id = p_user_id;

    -- Remove hífens no início e fim
    base_slug := TRIM(BOTH '-' FROM base_slug);

    -- Se vazio, usa ID
    IF base_slug IS NULL OR base_slug = '' THEN
        base_slug := SUBSTRING(p_user_id::TEXT, 1, 8);
    END IF;

    final_slug := base_slug;

    -- Verifica se já existe e adiciona número se necessário
    WHILE EXISTS (SELECT 1 FROM profiles WHERE public_slug = final_slug AND user_id != p_user_id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar slug automaticamente quando perfil é criado/atualizado
CREATE OR REPLACE FUNCTION auto_generate_public_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.public_slug IS NULL OR NEW.public_slug = '' THEN
        NEW.public_slug := generate_public_slug(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_slug ON profiles;
CREATE TRIGGER trigger_auto_generate_slug
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    WHEN (NEW.is_public_profile = true)
    EXECUTE FUNCTION auto_generate_public_slug();

-- ============================================
-- 7. SISTEMA DE INDICAÇÃO
-- ============================================

-- Tabela de códigos de indicação
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    max_uses INTEGER, -- NULL = ilimitado
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Tabela de indicações realizadas
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
    referrer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    user_type TEXT CHECK (user_type IN ('musician', 'contractor')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referral_code_id, referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_referrer ON referral_codes(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);

-- Função para gerar código de indicação único
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    counter INTEGER := 0;
BEGIN
    -- Gera código baseado no ID do usuário (primeiros 8 caracteres) + timestamp
    new_code := UPPER(SUBSTRING(p_user_id::TEXT, 1, 8) || SUBSTRING(MD5(NOW()::TEXT), 1, 4));

    -- Verifica se já existe e gera novo se necessário
    WHILE EXISTS (SELECT 1 FROM referral_codes WHERE code = new_code) LOOP
        counter := counter + 1;
        new_code := UPPER(SUBSTRING(p_user_id::TEXT, 1, 8) || SUBSTRING(MD5(NOW()::TEXT || counter::TEXT), 1, 4));
    END LOOP;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Função RPC para criar código de indicação
CREATE OR REPLACE FUNCTION rpc_create_referral_code(
    p_user_id UUID,
    p_max_uses INTEGER DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
BEGIN
    new_code := generate_referral_code(p_user_id);

    INSERT INTO referral_codes (referrer_id, code, max_uses, expires_at)
    VALUES (p_user_id, new_code, p_max_uses, p_expires_at);

    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Função RPC para registrar indicação
CREATE OR REPLACE FUNCTION rpc_register_referral(
    p_code TEXT,
    p_referred_user_id UUID,
    p_user_type TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    referral_id UUID
) AS $$
DECLARE
    v_referral_code_id UUID;
    v_referrer_id UUID;
    v_max_uses INTEGER;
    v_usage_count INTEGER;
    v_expires_at TIMESTAMPTZ;
    v_new_referral_id UUID;
BEGIN
    -- Busca código de indicação
    SELECT id, referrer_id, max_uses, usage_count, expires_at
    INTO v_referral_code_id, v_referrer_id, v_max_uses, v_usage_count, v_expires_at
    FROM referral_codes
    WHERE code = p_code
    AND is_active = true;

    -- Verifica se código existe
    IF v_referral_code_id IS NULL THEN
        RETURN QUERY SELECT false, 'Código de indicação inválido'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Verifica se não expirou
    IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
        RETURN QUERY SELECT false, 'Código de indicação expirado'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Verifica se atingiu limite de usos
    IF v_max_uses IS NOT NULL AND v_usage_count >= v_max_uses THEN
        RETURN QUERY SELECT false, 'Código de indicação atingiu o limite de usos'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Verifica se não está se auto-indicando
    IF v_referrer_id = p_referred_user_id THEN
        RETURN QUERY SELECT false, 'Não é possível usar seu próprio código de indicação'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Verifica se já foi indicado por este código
    IF EXISTS (SELECT 1 FROM referrals WHERE referral_code_id = v_referral_code_id AND referred_user_id = p_referred_user_id) THEN
        RETURN QUERY SELECT false, 'Este código já foi usado por este usuário'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Registra indicação
    INSERT INTO referrals (referral_code_id, referrer_id, referred_user_id, user_type)
    VALUES (v_referral_code_id, v_referrer_id, p_referred_user_id, p_user_type)
    RETURNING id INTO v_new_referral_id;

    -- Atualiza contador de usos
    UPDATE referral_codes
    SET usage_count = usage_count + 1
    WHERE id = v_referral_code_id;

    RETURN QUERY SELECT true, 'Indicação registrada com sucesso'::TEXT, v_new_referral_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. RLS (Row Level Security) POLICIES
-- ============================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Políticas para user_badges
DROP POLICY IF EXISTS "Anyone can view active badges" ON user_badges;
CREATE POLICY "Anyone can view active badges"
    ON user_badges FOR SELECT
    USING (expires_at IS NULL OR expires_at > NOW());

DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
CREATE POLICY "Users can view their own badges"
    ON user_badges FOR SELECT
    USING (auth.uid() = user_id);

-- Políticas para reports
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports"
    ON reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
CREATE POLICY "Users can view their own reports"
    ON reports FOR SELECT
    USING (auth.uid() = reporter_id OR auth.uid() = reported_user_id);

-- Políticas para referral_codes
DROP POLICY IF EXISTS "Users can view their own referral codes" ON referral_codes;
CREATE POLICY "Users can view their own referral codes"
    ON referral_codes FOR SELECT
    USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users can create their own referral codes" ON referral_codes;
CREATE POLICY "Users can create their own referral codes"
    ON referral_codes FOR INSERT
    WITH CHECK (auth.uid() = referrer_id);

-- Políticas para referrals
DROP POLICY IF EXISTS "Users can view their own referrals" ON referrals;
CREATE POLICY "Users can view their own referrals"
    ON referrals FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- ============================================
-- 9. COMENTÁRIOS E FUNÇÕES AUXILIARES
-- ============================================

-- Comentário sobre o sistema
COMMENT ON TABLE user_badges IS 'Sistema de badges para reconhecer conquistas e comportamentos positivos dos usuários';
COMMENT ON TABLE reports IS 'Sistema de denúncias para manter a integridade da plataforma';
COMMENT ON TABLE referral_codes IS 'Códigos de indicação para crescimento orgânico da plataforma';
COMMENT ON TABLE referrals IS 'Registro de indicações realizadas pelos usuários';

COMMENT ON FUNCTION calculate_distance_km IS 'Calcula distância em km entre duas coordenadas usando fórmula de Haversine';
COMMENT ON FUNCTION estimate_travel_time_minutes IS 'Estima tempo de viagem em minutos baseado na distância (pode ser melhorado com APIs de roteamento)';
COMMENT ON FUNCTION rpc_search_musicians_by_location IS 'Busca músicos por localização com ordenação por distância, avaliação, badges ou comentários';
COMMENT ON FUNCTION rpc_quick_reinvite_from_favorites IS 'Cria convites rapidamente para músicos da lista de favoritos';

