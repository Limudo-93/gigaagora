-- ============================================
-- CORREÇÃO: Trigger para compute_region_label
-- Problema: Trigger INSERT não pode referenciar OLD
-- Solução: Separar triggers ou verificar TG_OP na função
-- ============================================

-- 1. Remover trigger problemático
DROP TRIGGER IF EXISTS gigs_region_label_trigger ON gigs;

-- 2. Atualizar a função para lidar com INSERT e UPDATE corretamente
CREATE OR REPLACE FUNCTION compute_region_label(
    p_state TEXT,
    p_city TEXT,
    p_latitude NUMERIC,
    p_longitude NUMERIC
)
RETURNS TEXT AS $$
DECLARE
    v_region_label TEXT;
BEGIN
    -- Se temos coordenadas, usar região baseada em coordenadas
    IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
        -- Regiões do Brasil baseadas em coordenadas aproximadas
        -- Norte
        IF p_latitude >= -5 AND p_latitude <= 5 AND p_longitude >= -75 AND p_longitude <= -45 THEN
            v_region_label := 'Região Norte';
        -- Nordeste
        ELSIF p_latitude >= -15 AND p_latitude <= -2 AND p_longitude >= -50 AND p_longitude <= -34 THEN
            v_region_label := 'Região Nordeste';
        -- Centro-Oeste
        ELSIF p_latitude >= -20 AND p_latitude <= -8 AND p_longitude >= -60 AND p_longitude <= -45 THEN
            v_region_label := 'Região Centro-Oeste';
        -- Sudeste
        ELSIF p_latitude >= -25 AND p_latitude <= -15 AND p_longitude >= -50 AND p_longitude <= -39 THEN
            v_region_label := 'Região Sudeste';
        -- Sul
        ELSIF p_latitude >= -34 AND p_latitude <= -22 AND p_longitude >= -58 AND p_longitude <= -47 THEN
            v_region_label := 'Região Sul';
        ELSE
            v_region_label := 'Região não identificada';
        END IF;
    -- Se temos estado, usar estado
    ELSIF p_state IS NOT NULL AND p_state != '' THEN
        v_region_label := p_state;
    -- Se temos cidade, usar cidade
    ELSIF p_city IS NOT NULL AND p_city != '' THEN
        v_region_label := p_city;
    -- Fallback
    ELSE
        v_region_label := 'Localização não especificada';
    END IF;
    
    RETURN v_region_label;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Função trigger que funciona tanto para INSERT quanto UPDATE
CREATE OR REPLACE FUNCTION trigger_compute_region_label()
RETURNS TRIGGER AS $$
BEGIN
    -- Em INSERT, sempre calcular
    IF TG_OP = 'INSERT' THEN
        NEW.region_label := compute_region_label(
            NEW.state,
            NEW.city,
            NEW.latitude,
            NEW.longitude
        );
    -- Em UPDATE, calcular apenas se algum campo relevante mudou
    ELSIF TG_OP = 'UPDATE' THEN
        IF (
            NEW.state IS DISTINCT FROM OLD.state OR
            NEW.city IS DISTINCT FROM OLD.city OR
            NEW.latitude IS DISTINCT FROM OLD.latitude OR
            NEW.longitude IS DISTINCT FROM OLD.longitude
        ) THEN
            NEW.region_label := compute_region_label(
                NEW.state,
                NEW.city,
                NEW.latitude,
                NEW.longitude
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger que funciona para INSERT e UPDATE
-- Não usar cláusula WHEN com OLD, pois OLD não existe em INSERT
-- A verificação é feita dentro da função usando TG_OP
CREATE TRIGGER gigs_region_label_trigger
    BEFORE INSERT OR UPDATE ON gigs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_compute_region_label();

-- 5. Adicionar default para region_label em novos inserts
-- O trigger já garante que sempre será preenchido, mas podemos adicionar um default de segurança
ALTER TABLE gigs
ALTER COLUMN region_label SET DEFAULT 'Localização não especificada';

-- 6. Atualizar registros existentes que não têm region_label
UPDATE gigs
SET region_label = compute_region_label(state, city, latitude, longitude)
WHERE region_label IS NULL OR region_label = '';

-- === FIM DO SCRIPT ===

-- A função compute_region_label está criada e o trigger está ativo. 
-- Toda vez que uma gig for inserida ou atualizada, o region_label será calculado automaticamente.
-- O trigger agora funciona corretamente tanto para INSERT quanto para UPDATE.

