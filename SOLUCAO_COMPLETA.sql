-- ============================================
-- SOLUÇÃO COMPLETA - Diagnóstico e Correção
-- ============================================

-- PASSO 1: Verificar a estrutura real do banco
SELECT 
  'Verificando estrutura...' as passo;

-- Ver todas as tabelas que contêm 'user'
SELECT 
  table_schema,
  table_name
FROM information_schema.tables
WHERE table_name LIKE '%user%' OR table_name = 'users' OR table_name = 'profiles'
ORDER BY table_schema, table_name;

-- PASSO 2: Verificar se o usuário existe em auth.users
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94') 
    THEN '✅ Usuário existe em auth.users'
    ELSE '❌ Usuário NÃO existe em auth.users'
  END as status_auth_users;

-- PASSO 3: Verificar se existe tabela 'users' no schema público
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
    THEN '✅ Tabela users existe no schema público'
    ELSE '❌ Tabela users NÃO existe no schema público'
  END as status_users_table;

-- PASSO 4: Verificar foreign keys da tabela profiles
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'profiles'
  AND kcu.column_name = 'user_id';

-- ============================================
-- SOLUÇÃO: Atualizar o convite existente (mais simples)
-- ============================================
-- Esta é a forma mais segura - apenas atualizar o musician_id
-- do convite que já existe, sem precisar criar perfil novo

-- Verificar o convite atual
SELECT 
  'Convite atual:' as info,
  i.id,
  i.musician_id as current_musician,
  i.status,
  g.title as gig_title
FROM invites i
JOIN gigs g ON g.id = i.gig_id
WHERE i.id = '1f82dd3a-e1da-425b-9507-5be7bda24edc';

-- Verificar se o seu ID tem perfil (do convite original)
SELECT 
  'Perfil do músico original:' as info,
  p.user_id,
  p.user_type,
  p.display_name
FROM profiles p
WHERE p.user_id = (
  SELECT musician_id FROM invites WHERE id = '1f82dd3a-e1da-425b-9507-5be7bda24edc'
);

-- SOLUÇÃO FINAL: Copiar o perfil do músico original para você
-- Primeiro, verificar se você já tem perfil
INSERT INTO profiles (user_id, user_type, display_name)
SELECT 
  '328557ea-2ce8-4c43-ad97-f1c29cc28e94' as user_id,
  COALESCE(
    (SELECT user_type FROM profiles WHERE user_id = (
      SELECT musician_id FROM invites WHERE id = '1f82dd3a-e1da-425b-9507-5be7bda24edc'
    )),
    'musician'
  ) as user_type,
  'Usuário de Teste' as display_name
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE user_id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94'
);

-- Agora atualizar o convite
UPDATE invites
SET musician_id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94'
WHERE id = '1f82dd3a-e1da-425b-9507-5be7bda24edc'
  AND status = 'pending';

-- Verificar resultado final
SELECT 
  '✅ RESULTADO FINAL:' as status,
  i.id as invite_id,
  i.musician_id,
  u.email as musician_email,
  g.title as gig_title,
  CASE 
    WHEN i.musician_id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94' THEN '✅ Agora é seu convite!'
    ELSE '❌ Ainda não é seu convite'
  END as confirmacao
FROM invites i
JOIN auth.users u ON u.id = i.musician_id
JOIN gigs g ON g.id = i.gig_id
WHERE i.id = '1f82dd3a-e1da-425b-9507-5be7bda24edc';

