-- ============================================
-- Políticas RLS para a tabela ratings
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Habilitar RLS na tabela ratings (se ainda não estiver habilitado)
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can insert their own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can view ratings" ON ratings;
DROP POLICY IF EXISTS "Users can view their own ratings" ON ratings;
DROP POLICY IF EXISTS "Anyone can view public ratings" ON ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON ratings;

-- 3. Política para INSERT: usuários podem criar avaliações onde são o avaliador
-- Permite inserir se o usuário autenticado é o músico OU o contratante que está avaliando
CREATE POLICY "Users can insert their own ratings"
ON ratings
FOR INSERT
TO authenticated
WITH CHECK (
  -- Se está avaliando como músico, deve ser o musician_id
  (rater_type = 'musician' AND auth.uid() = musician_id)
  OR
  -- Se está avaliando como contratante, deve ser o contractor_id
  (rater_type = 'contractor' AND auth.uid() = contractor_id)
);

-- 4. Política para SELECT: usuários podem ver avaliações públicas
CREATE POLICY "Anyone can view public ratings"
ON ratings
FOR SELECT
TO authenticated
USING (is_public = true);

-- 5. Política para SELECT: usuários podem ver suas próprias avaliações (mesmo que não sejam públicas)
CREATE POLICY "Users can view their own ratings"
ON ratings
FOR SELECT
TO authenticated
USING (
  -- Pode ver se é o avaliador
  (auth.uid() = musician_id AND rater_type = 'musician')
  OR
  (auth.uid() = contractor_id AND rater_type = 'contractor')
  OR
  -- Ou se é o avaliado
  (auth.uid() = musician_id AND rated_type = 'musician')
  OR
  (auth.uid() = contractor_id AND rated_type = 'contractor')
);

-- 6. Política para UPDATE: usuários podem atualizar suas próprias avaliações (se necessário)
CREATE POLICY "Users can update their own ratings"
ON ratings
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = musician_id AND rater_type = 'musician')
  OR
  (auth.uid() = contractor_id AND rater_type = 'contractor')
)
WITH CHECK (
  (auth.uid() = musician_id AND rater_type = 'musician')
  OR
  (auth.uid() = contractor_id AND rater_type = 'contractor')
);

-- 7. Verificar se as políticas foram criadas corretamente
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
WHERE tablename = 'ratings'
ORDER BY cmd, policyname;

