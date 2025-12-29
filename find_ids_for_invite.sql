-- Script para encontrar os IDs necessários para criar um convite
-- Execute este script para ver seus IDs disponíveis

-- ============================================
-- 1. SEU USUÁRIO ATUAL (Contractor)
-- ============================================
SELECT 
  id as contractor_id,
  email,
  created_at
FROM auth.users
WHERE id = auth.uid();

-- ============================================
-- 2. SUAS GIGS (para usar como gig_id)
-- ============================================
SELECT 
  g.id as gig_id,
  g.title,
  g.status,
  g.start_time,
  g.location_name,
  COUNT(gr.id) as num_roles
FROM gigs g
LEFT JOIN gig_roles gr ON gr.gig_id = g.id
WHERE g.contractor_id = auth.uid()
GROUP BY g.id, g.title, g.status, g.start_time, g.location_name
ORDER BY g.start_time DESC;

-- ============================================
-- 3. ROLES DAS SUAS GIGS (para usar como gig_role_id)
-- ============================================
SELECT 
  gr.id as gig_role_id,
  g.id as gig_id,
  g.title as gig_title,
  gr.instrument,
  gr.quantity,
  gr.desired_genres,
  gr.desired_skills
FROM gig_roles gr
JOIN gigs g ON g.id = gr.gig_id
WHERE g.contractor_id = auth.uid()
ORDER BY g.start_time DESC, gr.instrument;

-- ============================================
-- 4. OUTROS USUÁRIOS (para usar como musician_id)
-- ============================================
-- Nota: Esta query pode não funcionar dependendo das permissões RLS
-- Se não funcionar, você precisará usar o ID de outro usuário que você conhece

SELECT 
  id as musician_id,
  email,
  created_at
FROM auth.users
WHERE id != auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 5. CONVITES EXISTENTES (para referência)
-- ============================================
SELECT 
  i.id as invite_id,
  i.status,
  i.invited_at,
  g.title as gig_title,
  gr.instrument,
  u_musician.email as musician_email
FROM invites i
JOIN gigs g ON g.id = i.gig_id
JOIN gig_roles gr ON gr.id = i.gig_role_id
JOIN auth.users u_musician ON u_musician.id = i.musician_id
WHERE i.contractor_id = auth.uid()
ORDER BY i.invited_at DESC
LIMIT 10;

-- ============================================
-- 6. CONVITES PENDENTES RECEBIDOS (se você for músico)
-- ============================================
SELECT 
  i.id as invite_id,
  i.status,
  i.invited_at,
  g.title as gig_title,
  g.start_time,
  gr.instrument,
  u_contractor.email as contractor_email
FROM invites i
JOIN gigs g ON g.id = i.gig_id
JOIN gig_roles gr ON gr.id = i.gig_role_id
JOIN auth.users u_contractor ON u_contractor.id = i.contractor_id
WHERE i.musician_id = auth.uid()
  AND i.status = 'pending'
ORDER BY i.invited_at DESC;

