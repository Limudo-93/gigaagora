-- Script para corrigir políticas RLS da tabela profiles
-- Execute este script no SQL Editor do Supabase

-- 1. Remover TODAS as políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- 2. Garantir que RLS está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Política para SELECT: usuários autenticados podem ver todos os perfis
-- (necessário para visualização pública de perfis)
CREATE POLICY "Users can view profiles"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- 4. Política para INSERT: usuários podem criar seus próprios perfis
-- IMPORTANTE: A cláusula WITH CHECK valida o user_id antes de inserir
CREATE POLICY "Users can insert their own profile"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 5. Política para UPDATE: usuários podem atualizar seus próprios perfis
-- IMPORTANTE: 
--   - USING: verifica se o usuário pode atualizar a linha existente
--   - WITH CHECK: valida os dados após a atualização (essencial para UPSERT)
CREATE POLICY "Users can update their own profile"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Verificar se as políticas foram criadas corretamente
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
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

