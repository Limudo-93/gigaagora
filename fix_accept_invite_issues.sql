-- ============================================
-- CORREÇÃO: Problemas com aceitar convites
-- ============================================
-- Problema 1: Músico aceita mas não aparece como confirmado
-- Problema 2: Dois músicos podem aceitar o mesmo convite (para a mesma role)
-- ============================================

-- ============================================
-- 1. ATUALIZAR rpc_accept_invite
--    Criar confirmação automaticamente quando músico aceita
-- ============================================

CREATE OR REPLACE FUNCTION rpc_accept_invite(p_invite_id UUID)
RETURNS JSON AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
  v_gig_role_id UUID;
  v_existing_confirmation UUID;
BEGIN
  -- Obter o ID do usuário logado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Usuário não autenticado'
    );
  END IF;

  -- Buscar o invite com informações da role
  SELECT i.*, i.gig_role_id INTO v_invite
  FROM invites i
  WHERE i.id = p_invite_id;

  -- Verificar se o invite existe
  IF v_invite IS NULL THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Convite não encontrado'
    );
  END IF;

  -- Verificar se o invite pertence ao usuário logado
  IF v_invite.musician_id != v_user_id THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Você não tem permissão para aceitar este convite'
    );
  END IF;

  -- Verificar se o invite está pendente
  IF v_invite.status != 'pending' THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Este convite já foi respondido'
    );
  END IF;

  v_gig_role_id := v_invite.gig_role_id;

  -- Verificar se já existe uma confirmação para esta role (outro músico já foi confirmado)
  SELECT c.id INTO v_existing_confirmation
  FROM confirmations c
  INNER JOIN invites i2 ON i2.id = c.invite_id
  WHERE i2.gig_role_id = v_gig_role_id
    AND c.confirmed = true
  LIMIT 1;

  IF v_existing_confirmation IS NOT NULL THEN
    RETURN json_build_object(
      'ok', false,
      'message', 'Esta vaga já foi preenchida por outro músico'
    );
  END IF;

  -- Atualizar o invite para aceito
  UPDATE invites
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    responded_at = NOW()
  WHERE id = p_invite_id;

  -- Criar confirmação automaticamente quando músico aceita
  -- Isso faz com que apareça na lista de confirmados imediatamente
  INSERT INTO confirmations (
    invite_id,
    musician_id,
    confirmed,
    confirmed_at
  ) VALUES (
    p_invite_id,
    v_user_id,
    true,
    NOW()
  )
  ON CONFLICT (invite_id) DO UPDATE
  SET 
    musician_id = v_user_id,
    confirmed = true,
    confirmed_at = NOW();

  -- Cancelar outros invites aceitos para a mesma role (mas não confirmados ainda)
  -- Isso previne que múltiplos músicos fiquem "aceitos" para a mesma vaga
  UPDATE invites
  SET 
    status = 'declined',
    responded_at = NOW()
  WHERE gig_role_id = v_gig_role_id
    AND id != p_invite_id
    AND status = 'accepted'
    AND NOT EXISTS (
      SELECT 1 FROM confirmations c2
      WHERE c2.invite_id = invites.id
      AND c2.confirmed = true
    );

  RETURN json_build_object(
    'ok', true,
    'message', 'Convite aceito com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION rpc_accept_invite(UUID) TO authenticated;

-- Comentário
COMMENT ON FUNCTION rpc_accept_invite(UUID) IS 'Aceita um convite pendente, cria confirmação automaticamente e cancela outros invites aceitos para a mesma role';

-- ============================================
-- 2. ADICIONAR CONSTRAINT para prevenir múltiplas confirmações por role
-- ============================================

-- Criar índice único parcial para garantir apenas uma confirmação ativa por role
CREATE UNIQUE INDEX IF NOT EXISTS unique_confirmed_per_role
ON confirmations(invite_id)
WHERE confirmed = true;

-- Mas precisamos garantir que apenas uma confirmação por gig_role_id
-- Criar função para verificar isso antes de inserir
CREATE OR REPLACE FUNCTION check_single_confirmation_per_role()
RETURNS TRIGGER AS $$
DECLARE
  v_gig_role_id UUID;
  v_existing_confirmation UUID;
BEGIN
  -- Obter o gig_role_id do invite
  SELECT gig_role_id INTO v_gig_role_id
  FROM invites
  WHERE id = NEW.invite_id;

  -- Se está confirmando, verificar se já existe outra confirmação para esta role
  IF NEW.confirmed = true THEN
    SELECT c.id INTO v_existing_confirmation
    FROM confirmations c
    INNER JOIN invites i ON i.id = c.invite_id
    WHERE i.gig_role_id = v_gig_role_id
      AND c.confirmed = true
      AND c.id != NEW.id
    LIMIT 1;

    IF v_existing_confirmation IS NOT NULL THEN
      RAISE EXCEPTION 'Esta vaga já foi preenchida por outro músico';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_check_single_confirmation_per_role ON confirmations;
CREATE TRIGGER trigger_check_single_confirmation_per_role
  BEFORE INSERT OR UPDATE ON confirmations
  FOR EACH ROW
  EXECUTE FUNCTION check_single_confirmation_per_role();

-- ============================================
-- 3. ADICIONAR CONSTRAINT na tabela invites
--    Prevenir múltiplos invites aceitos para a mesma role
-- ============================================

-- Nota: Não podemos usar EXISTS em índices únicos parciais
-- A lógica de cancelar outros invites será feita na função rpc_accept_invite
-- e no trigger check_single_confirmation_per_role

-- ============================================
-- 4. VERIFICAÇÕES
-- ============================================

-- Verificar se os índices foram criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'confirmations'
  AND indexname = 'unique_confirmed_per_role';

-- Verificar se a função foi atualizada
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'rpc_accept_invite';

