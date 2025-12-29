-- Script para corrigir políticas RLS do bucket de fotos de perfil
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- 1. Remove políticas antigas (se existirem)
-- ============================================
DROP POLICY IF EXISTS "Users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;

-- ============================================
-- 2. Cria o bucket 'profile-photos' se não existir
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================
-- 3. Criar novas políticas RLS para storage.objects
-- ============================================

-- Política para permitir upload de fotos de perfil (qualquer usuário autenticado pode fazer upload)
-- O caminho é: profile-photos/{userId}/{fileName}
-- A política verifica se o segundo folder (índice 1) é o user_id
CREATE POLICY "Users can upload profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir leitura pública das fotos de perfil
CREATE POLICY "Public can view profile photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Política para permitir que usuários atualizem suas próprias fotos
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

-- Política para permitir que usuários deletem suas próprias fotos
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Verificação
-- ============================================
-- Verifica se o bucket foi criado
SELECT 
  'Bucket profile-photos criado com sucesso!' as status
WHERE EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'profile-photos'
);

-- Lista as políticas criadas
SELECT 
  policyname as "Nome da Política",
  cmd as "Operação",
  qual as "USING",
  with_check as "WITH CHECK"
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%profile photos%';

