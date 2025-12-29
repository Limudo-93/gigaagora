-- ============================================
-- Fix: Garantir que theme_preference existe e tem permissões corretas
-- ============================================

-- 1. Adicionar coluna se não existir
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'default';

-- 2. Atualizar constraint para incluir 'dark'
DO $$ 
BEGIN
    -- Remover constraint antiga se existir
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_theme_preference_check;
    
    -- Adicionar nova constraint com 'dark'
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_theme_preference_check 
    CHECK (theme_preference IN ('default', 'ocean', 'sunset', 'forest', 'royal', 'dark'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. Garantir que todos os perfis existentes tenham um valor padrão
UPDATE profiles 
SET theme_preference = 'default' 
WHERE theme_preference IS NULL;

-- 4. Verificar RLS - garantir que usuários podem atualizar seu próprio perfil
-- (Isso deve já existir, mas vamos garantir)

-- Verificar se a política de UPDATE existe
DO $$
BEGIN
    -- Se não existir política de UPDATE, criar uma
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Comentário atualizado
COMMENT ON COLUMN profiles.theme_preference IS 'Preferência de tema do usuário: default, ocean, sunset, forest, royal, dark';

