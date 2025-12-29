-- ============================================
-- Sistema de Temas - Adicionar campo de preferência
-- ============================================

-- Adicionar coluna de preferência de tema na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'default' 
CHECK (theme_preference IN ('default', 'ocean', 'sunset', 'forest', 'royal', 'dark'));

-- Comentário
COMMENT ON COLUMN profiles.theme_preference IS 'Preferência de tema do usuário: default, ocean, sunset, forest, royal';

-- Índice para performance (se necessário)
CREATE INDEX IF NOT EXISTS idx_profiles_theme_preference ON profiles(theme_preference);

