-- ============================================
-- Sistema de Cálculo Automático de Avaliações
-- Atualiza avg_rating e rating_count automaticamente
-- ============================================

-- Função para atualizar estatísticas de avaliação de músicos
CREATE OR REPLACE FUNCTION update_musician_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_musician_id UUID;
  v_rated_type TEXT;
BEGIN
  -- Determinar qual músico precisa ter as estatísticas atualizadas
  IF TG_OP = 'DELETE' THEN
    v_musician_id := OLD.musician_id;
    v_rated_type := OLD.rated_type;
  ELSE
    v_musician_id := NEW.musician_id;
    v_rated_type := NEW.rated_type;
  END IF;

  -- Só atualizar se for uma avaliação de músico
  IF v_rated_type = 'musician' AND v_musician_id IS NOT NULL THEN
    UPDATE musician_profiles
    SET 
      avg_rating = COALESCE((
        SELECT AVG(rating)
        FROM ratings
        WHERE musician_id = v_musician_id
          AND rated_type = 'musician'
          AND is_public = true
      ), 0),
      rating_count = (
        SELECT COUNT(*)
        FROM ratings
        WHERE musician_id = v_musician_id
          AND rated_type = 'musician'
          AND is_public = true
      ),
      updated_at = NOW()
    WHERE user_id = v_musician_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas de avaliação de contratantes
CREATE OR REPLACE FUNCTION update_contractor_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_contractor_id UUID;
  v_rated_type TEXT;
BEGIN
  -- Determinar qual contratante precisa ter as estatísticas atualizadas
  IF TG_OP = 'DELETE' THEN
    v_contractor_id := OLD.contractor_id;
    v_rated_type := OLD.rated_type;
  ELSE
    v_contractor_id := NEW.contractor_id;
    v_rated_type := NEW.rated_type;
  END IF;

  -- Só atualizar se for uma avaliação de contratante
  IF v_rated_type = 'contractor' AND v_contractor_id IS NOT NULL THEN
    UPDATE contractor_profiles
    SET 
      avg_rating = COALESCE((
        SELECT AVG(rating)
        FROM ratings
        WHERE contractor_id = v_contractor_id
          AND rated_type = 'contractor'
          AND is_public = true
      ), 0),
      rating_count = (
        SELECT COUNT(*)
        FROM ratings
        WHERE contractor_id = v_contractor_id
          AND rated_type = 'contractor'
          AND is_public = true
      ),
      updated_at = NOW()
    WHERE user_id = v_contractor_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Remover triggers antigos se existirem
DROP TRIGGER IF EXISTS trigger_update_musician_rating_stats ON ratings;
DROP TRIGGER IF EXISTS trigger_update_contractor_rating_stats ON ratings;

-- Criar triggers para atualizar estatísticas automaticamente
-- A verificação de rated_type é feita dentro das funções, não na cláusula WHEN
CREATE TRIGGER trigger_update_musician_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_musician_rating_stats();

CREATE TRIGGER trigger_update_contractor_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_contractor_rating_stats();

-- Função para recalcular todas as estatísticas (útil para corrigir dados existentes)
CREATE OR REPLACE FUNCTION recalculate_all_rating_stats()
RETURNS void AS $$
BEGIN
  -- Recalcular estatísticas de músicos
  UPDATE musician_profiles mp
  SET 
    avg_rating = COALESCE((
      SELECT AVG(rating)
      FROM ratings r
      WHERE r.musician_id = mp.user_id
        AND r.rated_type = 'musician'
        AND r.is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*)
      FROM ratings r
      WHERE r.musician_id = mp.user_id
        AND r.rated_type = 'musician'
        AND r.is_public = true
    ),
    updated_at = NOW();

  -- Recalcular estatísticas de contratantes
  UPDATE contractor_profiles cp
  SET 
    avg_rating = COALESCE((
      SELECT AVG(rating)
      FROM ratings r
      WHERE r.contractor_id = cp.user_id
        AND r.rated_type = 'contractor'
        AND r.is_public = true
    ), 0),
    rating_count = (
      SELECT COUNT(*)
      FROM ratings r
      WHERE r.contractor_id = cp.user_id
        AND r.rated_type = 'contractor'
        AND r.is_public = true
    ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Verificar se contractor_profiles tem os campos de rating
DO $$
BEGIN
  -- Adicionar campos se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contractor_profiles' 
    AND column_name = 'avg_rating'
  ) THEN
    ALTER TABLE contractor_profiles
    ADD COLUMN avg_rating NUMERIC(3, 2) DEFAULT 0,
    ADD COLUMN rating_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Executar recálculo inicial de todas as estatísticas
SELECT recalculate_all_rating_stats();

-- Comentários
COMMENT ON FUNCTION update_musician_rating_stats() IS 'Atualiza automaticamente avg_rating e rating_count de músicos quando uma avaliação é inserida/atualizada/deletada';
COMMENT ON FUNCTION update_contractor_rating_stats() IS 'Atualiza automaticamente avg_rating e rating_count de contratantes quando uma avaliação é inserida/atualizada/deletada';
COMMENT ON FUNCTION recalculate_all_rating_stats() IS 'Recalcula todas as estatísticas de avaliação (útil para corrigir dados existentes)';

