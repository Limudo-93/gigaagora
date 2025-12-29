-- ============================================
-- Script completo para configurar upload de flyers
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Adiciona a coluna flyer_url na tabela gigs
ALTER TABLE gigs 
ADD COLUMN IF NOT EXISTS flyer_url TEXT;

-- Comentário na coluna para documentação
COMMENT ON COLUMN gigs.flyer_url IS 'URL do flyer/poster do evento armazenado no Supabase Storage';

-- 2. Cria o bucket 'gig-flyers' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('gig-flyers', 'gig-flyers', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Remove políticas antigas se existirem (para evitar conflitos)
DROP POLICY IF EXISTS "Users can upload gig flyers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view gig flyers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own gig flyers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own gig flyers" ON storage.objects;

-- 4. Política para permitir upload de flyers (apenas usuários autenticados podem fazer upload)
CREATE POLICY "Users can upload gig flyers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gig-flyers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Política para permitir leitura pública dos flyers
CREATE POLICY "Public can view gig flyers"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'gig-flyers');

-- 6. Política para permitir que usuários atualizem seus próprios flyers
CREATE POLICY "Users can update their own gig flyers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gig-flyers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Política para permitir que usuários deletem seus próprios flyers
CREATE POLICY "Users can delete their own gig flyers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'gig-flyers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verificação final
SELECT 
  'Coluna flyer_url criada com sucesso!' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'gigs' AND column_name = 'flyer_url'
);

SELECT 
  'Bucket gig-flyers criado com sucesso!' as status
WHERE EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'gig-flyers'
);

