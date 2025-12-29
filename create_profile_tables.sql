-- Script para criar as tabelas de perfil caso não existam
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- 1. Criar ENUM para user_type se não existir
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN
        CREATE TYPE user_type_enum AS ENUM ('musician', 'contractor');
    END IF;
END $$;

-- ============================================
-- 2. Criar tabela profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type user_type_enum NOT NULL,
    display_name TEXT,
    phone_e164 TEXT,
    city TEXT,
    state TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Criar tabela musician_profiles
-- ============================================
CREATE TABLE IF NOT EXISTS musician_profiles (
    user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
    bio TEXT,
    instruments TEXT[] DEFAULT '{}',
    genres TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    setup TEXT[] DEFAULT '{}',
    portfolio_links TEXT[] DEFAULT '{}',
    avg_rating NUMERIC(3, 2),
    rating_count INTEGER DEFAULT 0,
    attendance_rate NUMERIC(5, 4),
    response_time_seconds_avg INTEGER,
    is_trusted BOOLEAN DEFAULT FALSE,
    trusted_since DATE,
    strengths_counts JSONB,
    weaknesses_counts JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Criar tabela contractor_profiles
-- ============================================
CREATE TABLE IF NOT EXISTS contractor_profiles (
    user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
    project_name TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Criar função para atualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Criar triggers para updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_musician_profiles_updated_at ON musician_profiles;
CREATE TRIGGER update_musician_profiles_updated_at
    BEFORE UPDATE ON musician_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contractor_profiles_updated_at ON contractor_profiles;
CREATE TRIGGER update_contractor_profiles_updated_at
    BEFORE UPDATE ON contractor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Habilitar RLS (Row Level Security)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE musician_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. Políticas RLS para profiles
-- ============================================
-- Política para SELECT: usuários podem ver seus próprios perfis
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Política para INSERT: usuários podem criar seus próprios perfis
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar seus próprios perfis
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 9. Políticas RLS para musician_profiles
-- ============================================
-- Política para SELECT: usuários podem ver seus próprios perfis de músico
DROP POLICY IF EXISTS "Users can view their own musician profile" ON musician_profiles;
CREATE POLICY "Users can view their own musician profile"
    ON musician_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Política para INSERT: usuários podem criar seus próprios perfis de músico
DROP POLICY IF EXISTS "Users can insert their own musician profile" ON musician_profiles;
CREATE POLICY "Users can insert their own musician profile"
    ON musician_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar seus próprios perfis de músico
DROP POLICY IF EXISTS "Users can update their own musician profile" ON musician_profiles;
CREATE POLICY "Users can update their own musician profile"
    ON musician_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 10. Políticas RLS para contractor_profiles
-- ============================================
-- Política para SELECT: usuários podem ver seus próprios perfis de contratante
DROP POLICY IF EXISTS "Users can view their own contractor profile" ON contractor_profiles;
CREATE POLICY "Users can view their own contractor profile"
    ON contractor_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Política para INSERT: usuários podem criar seus próprios perfis de contratante
DROP POLICY IF EXISTS "Users can insert their own contractor profile" ON contractor_profiles;
CREATE POLICY "Users can insert their own contractor profile"
    ON contractor_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar seus próprios perfis de contratante
DROP POLICY IF EXISTS "Users can update their own contractor profile" ON contractor_profiles;
CREATE POLICY "Users can update their own contractor profile"
    ON contractor_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Após executar este script, as tabelas estarão criadas e configuradas
-- com as políticas de segurança necessárias.

