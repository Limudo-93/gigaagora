-- Script unificado para corrigir políticas RLS de todos os buckets de storage
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- 1. BUCKET: gig-flyers (Flyers de Gigs)
-- ============================================

-- Remove políticas antigas
DROP POLICY IF EXISTS "Users can upload gig flyers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view gig flyers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own gig flyers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own gig flyers" ON storage.objects;

-- Cria o bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('gig-flyers', 'gig-flyers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Política para INSERT (upload)
CREATE POLICY "Users can upload gig flyers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gig-flyers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para SELECT (leitura pública)
CREATE POLICY "Public can view gig flyers"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'gig-flyers');

-- Política para UPDATE
CREATE POLICY "Users can update their own gig flyers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gig-flyers' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'gig-flyers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para DELETE
CREATE POLICY "Users can delete their own gig flyers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'gig-flyers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 2. BUCKET: profile-photos (Fotos de Perfil)
-- ============================================

-- Remove políticas antigas
DROP POLICY IF EXISTS "Users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;

-- Cria o bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Política para INSERT (upload)
CREATE POLICY "Users can upload profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para SELECT (leitura pública)
CREATE POLICY "Public can view profile photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Política para UPDATE
CREATE POLICY "Users can update their own profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para DELETE
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Verificação Final
-- ============================================
-- Verifica se os buckets foram criados
SELECT 
  id as "Bucket ID",
  name as "Nome",
  public as "Público"
FROM storage.buckets 
WHERE id IN ('gig-flyers', 'profile-photos')
ORDER BY id;

-- Lista todas as políticas criadas para os buckets
SELECT 
  policyname as "Nome da Política",
  cmd as "Operação",
  CASE 
    WHEN qual IS NOT NULL THEN qual::text
    ELSE 'N/A'
  END as "USING",
  CASE 
    WHEN with_check IS NOT NULL THEN with_check::text
    ELSE 'N/A'
  END as "WITH CHECK"
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%gig flyers%' OR policyname LIKE '%profile photos%')
ORDER BY policyname;

