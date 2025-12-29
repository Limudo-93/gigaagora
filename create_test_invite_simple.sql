-- Script SIMPLIFICADO para criar um convite pendente
-- Use este script se você já tem os IDs necessários

-- ============================================
-- INSTRUÇÕES:
-- ============================================
-- 1. Substitua os valores abaixo pelos seus IDs reais:
--    - :gig_id - ID de uma gig existente
--    - :gig_role_id - ID de uma role existente dessa gig
--    - :contractor_id - ID do usuário que está criando o convite
--    - :musician_id - ID do usuário que receberá o convite
--
-- 2. Para encontrar seus IDs, execute:
--    SELECT id, title FROM gigs WHERE contractor_id = auth.uid();
--    SELECT id, instrument FROM gig_roles WHERE gig_id = 'SEU_GIG_ID';
--    SELECT id, email FROM auth.users;

-- ============================================
-- SCRIPT:
-- ============================================

INSERT INTO invites (
  gig_id,
  gig_role_id,
  contractor_id,
  musician_id,
  status,
  invited_at,
  warned_short_gap,
  warned_short_gap_minutes
) VALUES (
  'SUBSTITUA_PELO_GIG_ID',           -- gig_id: UUID da gig
  'SUBSTITUA_PELO_GIG_ROLE_ID',      -- gig_role_id: UUID da role
  'SUBSTITUA_PELO_CONTRACTOR_ID',    -- contractor_id: UUID do contractor
  'SUBSTITUA_PELO_MUSICIAN_ID',      -- musician_id: UUID do músico
  'pending',                          -- status: 'pending', 'accepted', 'declined', 'cancelled'
  NOW(),                              -- invited_at: timestamp atual
  false,                              -- warned_short_gap: boolean
  NULL                                -- warned_short_gap_minutes: integer ou NULL
)
RETURNING *;

-- ============================================
-- EXEMPLO COM IDs REAIS:
-- ============================================
-- (Descomente e substitua pelos seus IDs reais)

/*
INSERT INTO invites (
  gig_id,
  gig_role_id,
  contractor_id,
  musician_id,
  status,
  invited_at,
  warned_short_gap,
  warned_short_gap_minutes
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',  -- gig_id
  '223e4567-e89b-12d3-a456-426614174000',  -- gig_role_id
  '323e4567-e89b-12d3-a456-426614174000',  -- contractor_id
  '423e4567-e89b-12d3-a456-426614174000',   -- musician_id
  'pending',
  NOW(),
  false,
  NULL
)
RETURNING *;
*/

-- ============================================
-- VERIFICAR CONVITES PENDENTES:
-- ============================================

SELECT 
  i.id,
  i.status,
  i.invited_at,
  g.title as gig_title,
  gr.instrument,
  u_musician.email as musician_email
FROM invites i
JOIN gigs g ON g.id = i.gig_id
JOIN gig_roles gr ON gr.id = i.gig_role_id
JOIN auth.users u_musician ON u_musician.id = i.musician_id
WHERE i.status = 'pending'
ORDER BY i.invited_at DESC;

