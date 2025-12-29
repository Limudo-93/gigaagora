-- Script para criar o bucket de storage para flyers de gigs
-- Execute este script no SQL Editor do Supabase

-- Cria o bucket 'gig-flyers' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('gig-flyers', 'gig-flyers', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de flyers (apenas usuários autenticados podem fazer upload)
CREATE POLICY "Users can upload gig flyers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gig-flyers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir leitura pública dos flyers
CREATE POLICY "Public can view gig flyers"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'gig-flyers');

-- Política para permitir que usuários atualizem seus próprios flyers
CREATE POLICY "Users can update their own gig flyers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gig-flyers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir que usuários deletem seus próprios flyers
CREATE POLICY "Users can delete their own gig flyers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'gig-flyers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

