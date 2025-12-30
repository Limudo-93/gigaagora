-- ============================================
-- Sistema de Embaixadores - Reconhecimento para Primeiros Usuários
-- ============================================
-- IMPORTANTE: Execute este script em DUAS ETAPAS separadas
-- ETAPA 1: Execute apenas o bloco abaixo (linhas 6-18) e faça COMMIT
-- ETAPA 2: Depois execute o resto do script

-- ============================================
-- ETAPA 1: Adicionar 'ambassador' ao enum (EXECUTE PRIMEIRO E FAÇA COMMIT)
-- ============================================
DO $$
BEGIN
  -- Verificar se 'ambassador' já existe no enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'ambassador' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'badge_type_enum')
  ) THEN
    -- Adicionar 'ambassador' ao enum
    ALTER TYPE badge_type_enum ADD VALUE 'ambassador';
  END IF;
END $$;

-- ⚠️ IMPORTANTE: FAÇA COMMIT AQUI ANTES DE CONTINUAR!
-- No Supabase SQL Editor, clique em "Run" para executar apenas este bloco acima
-- Depois, execute o resto do script abaixo

-- ============================================
-- ETAPA 2: Resto do script (EXECUTE DEPOIS DO COMMIT)
-- ============================================

-- 1. Adicionar coluna para controlar se o card de boas-vindas foi mostrado
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS welcome_card_shown BOOLEAN DEFAULT false;

-- 2. Adicionar coluna para marcar usuários como embaixadores
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_ambassador BOOLEAN DEFAULT false;

-- 3. Função para verificar e atribuir badge de Embaixador automaticamente
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
    VALUES (NEW.user_id, 'ambassador', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para atribuir badge automaticamente quando perfil é criado
DROP TRIGGER IF EXISTS trigger_assign_ambassador_badge ON profiles;
CREATE TRIGGER trigger_assign_ambassador_badge
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_and_assign_ambassador_badge();

-- 5. Atualizar usuários existentes que são embaixadores
-- (Primeiros 100 usuários ou criados nos primeiros 30 dias)
DO $$
DECLARE
  v_platform_start_date TIMESTAMP;
  v_ambassador_cutoff_date TIMESTAMP;
BEGIN
  -- Encontrar a data do primeiro usuário (início da plataforma)
  SELECT MIN(created_at) INTO v_platform_start_date
  FROM profiles;

  -- Se não houver usuários, sair
  IF v_platform_start_date IS NULL THEN
    RETURN;
  END IF;

  -- Data de corte: 30 dias após o início
  v_ambassador_cutoff_date := v_platform_start_date + INTERVAL '30 days';

  -- Marcar como embaixador:
  -- 1. Primeiros 100 usuários (por ordem de criação)
  UPDATE profiles
  SET is_ambassador = true
  WHERE user_id IN (
    SELECT user_id
    FROM profiles
    ORDER BY created_at ASC
    LIMIT 100
  );

  -- 2. Usuários criados nos primeiros 30 dias
  UPDATE profiles
  SET is_ambassador = true
  WHERE created_at <= v_ambassador_cutoff_date;

  -- Adicionar badge de embaixador para todos os embaixadores
  -- Usar uma subquery para evitar o problema do enum não commitado
  INSERT INTO user_badges (user_id, badge_type, earned_at)
  SELECT user_id, 'ambassador'::badge_type_enum, NOW()
  FROM profiles
  WHERE is_ambassador = true
    AND NOT EXISTS (
      SELECT 1 FROM user_badges ub
      WHERE ub.user_id = profiles.user_id
        AND ub.badge_type = 'ambassador'::badge_type_enum
    );
END $$;

-- 6. Comentários
COMMENT ON COLUMN profiles.welcome_card_shown IS 'Indica se o card de boas-vindas já foi mostrado ao usuário';
COMMENT ON COLUMN profiles.is_ambassador IS 'Indica se o usuário é um Embaixador (primeiro usuário ou criado nos primeiros 30 dias)';
COMMENT ON FUNCTION check_and_assign_ambassador_badge() IS 'Atribui automaticamente o badge de Embaixador para primeiros usuários';

-- 7. Verificar resultados
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_ambassador = true) as ambassadors,
  COUNT(*) FILTER (WHERE welcome_card_shown = false) as users_not_seen_welcome
FROM profiles;
