-- Script para criar o perfil antes de criar o convite
-- Execute este script primeiro se receber erro de foreign key

-- ============================================
-- PASSO 1: Verificar se o perfil existe
-- ============================================
SELECT 
  u.id as user_id,
  u.email,
  CASE 
    WHEN p.user_id IS NOT NULL THEN '✅ Perfil existe'
    ELSE '❌ Perfil NÃO existe'
  END as profile_status,
  p.user_type
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94';  -- Seu ID

-- ============================================
-- PASSO 2: Criar o perfil se não existir
-- ============================================
INSERT INTO profiles (user_id, user_type, display_name)
VALUES (
  '328557ea-2ce8-4c43-ad97-f1c29cc28e94',  -- Seu ID
  'musician',  -- ou 'contractor' se você for contractor
  'Usuário de Teste'
)
ON CONFLICT (user_id) DO UPDATE 
SET user_type = COALESCE(profiles.user_type, EXCLUDED.user_type);

-- ============================================
-- PASSO 3: Verificar novamente
-- ============================================
SELECT 
  u.id as user_id,
  u.email,
  p.user_type,
  p.display_name,
  CASE 
    WHEN p.user_id IS NOT NULL THEN '✅ Perfil criado com sucesso!'
    ELSE '❌ Erro ao criar perfil'
  END as status
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94';

-- ============================================
-- AGORA você pode executar o create_invite_quick.sql
-- ============================================

