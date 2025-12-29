-- Script para verificar as foreign keys da tabela profiles
-- Execute este script para entender a estrutura

-- Verificar a foreign key constraint
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'profiles'
  AND kcu.column_name = 'user_id';

-- Verificar se existe uma tabela 'users' no schema público
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'users';

-- Verificar se o usuário existe em auth.users
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94';

