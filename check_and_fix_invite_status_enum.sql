-- ============================================
-- Verificar e corrigir enum de invite_status
-- ============================================

-- Verificar valores atuais do enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'invite_status'
)
ORDER BY enumsortorder;

-- Adicionar 'confirmed' se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'confirmed' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'invite_status')
  ) THEN
    ALTER TYPE invite_status ADD VALUE 'confirmed';
  END IF;
END $$;

