-- ============================================
-- Ajustar Constraint Única da Tabela Ratings
-- Permite que músico e contratante avaliem separadamente
-- ============================================

-- 1. Verificar constraints existentes na tabela ratings
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ratings'::regclass
AND contype = 'u'; -- 'u' = unique constraint

-- 2. Remover constraint única antiga se existir (que impede múltiplas avaliações)
-- Ajuste o nome da constraint conforme o resultado da query acima
DO $$
BEGIN
    -- Tenta remover a constraint se existir
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'ratings'::regclass 
        AND conname = 'ratings_one_per_invite'
    ) THEN
        ALTER TABLE ratings DROP CONSTRAINT ratings_one_per_invite;
        RAISE NOTICE 'Constraint ratings_one_per_invite removida';
    END IF;
END $$;

-- 3. Remover índice antigo se existir
DROP INDEX IF EXISTS ratings_one_per_invite_per_rater;

-- 4. Criar nova constraint que permite uma avaliação por invite POR TIPO DE AVALIADOR
-- Isso permite que músico e contratante avaliem separadamente
-- Usamos índices parciais separados para cada tipo
CREATE UNIQUE INDEX IF NOT EXISTS ratings_one_per_invite_musician 
ON ratings(invite_id, musician_id) 
WHERE rater_type = 'musician';

CREATE UNIQUE INDEX IF NOT EXISTS ratings_one_per_invite_contractor 
ON ratings(invite_id, contractor_id) 
WHERE rater_type = 'contractor';

-- Alternativa: Se preferir uma constraint mais simples que permite apenas uma avaliação total por invite
-- (comentado, use apenas se a abordagem acima não funcionar)
-- CREATE UNIQUE INDEX IF NOT EXISTS ratings_one_per_invite 
-- ON ratings(invite_id) 
-- WHERE rater_type IS NOT NULL;

-- 5. Verificar se os novos índices foram criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'ratings'
AND indexname IN ('ratings_one_per_invite_musician', 'ratings_one_per_invite_contractor');

