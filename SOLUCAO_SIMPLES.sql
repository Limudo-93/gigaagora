-- ============================================
-- SOLUÇÃO SIMPLES - Atualizar o convite existente
-- ============================================
-- Esta é a forma mais simples: apenas atualizar o musician_id do convite existente
-- Isso evita problemas com foreign keys

-- Primeiro, verificar o convite existente
SELECT 
  i.id,
  i.musician_id as current_musician_id,
  i.status,
  g.title as gig_title
FROM invites i
JOIN gigs g ON g.id = i.gig_id
WHERE i.id = '1f82dd3a-e1da-425b-9507-5be7bda24edc';

-- Atualizar o convite para o seu usuário
-- NOTA: Isso só funciona se o convite existente já tiver um perfil válido
-- Se der erro, você precisa criar o perfil primeiro

UPDATE invites
SET musician_id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94'  -- Seu ID
WHERE id = '1f82dd3a-e1da-425b-9507-5be7bda24edc'
  AND status = 'pending';

-- Verificar se funcionou
SELECT 
  i.id,
  i.musician_id,
  u.email as musician_email,
  g.title as gig_title,
  CASE 
    WHEN i.musician_id = '328557ea-2ce8-4c43-ad97-f1c29cc28e94' THEN '✅ Agora é seu convite!'
    ELSE '❌ Ainda não é seu convite'
  END as status
FROM invites i
JOIN auth.users u ON u.id = i.musician_id
JOIN gigs g ON g.id = i.gig_id
WHERE i.id = '1f82dd3a-e1da-425b-9507-5be7bda24edc';

