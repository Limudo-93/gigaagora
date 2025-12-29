-- Script para criar a tabela de mensagens
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- 1. Criar tabela messages
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Garantir que sender e receiver sejam diferentes
    CONSTRAINT different_users CHECK (sender_id != receiver_id)
);

-- ============================================
-- 2. Criar tabela conversations
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_id UUID REFERENCES invites(id) ON DELETE SET NULL,
    gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Garantir que user1 e user2 sejam diferentes
    CONSTRAINT different_users CHECK (user1_id != user2_id),
    -- Garantir ordem consistente (user1_id < user2_id)
    CONSTRAINT ordered_users CHECK (user1_id < user2_id),
    -- Garantir unicidade da conversa entre dois usuários
    UNIQUE(user1_id, user2_id)
);

-- ============================================
-- 3. Criar índices para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- ============================================
-- 4. Criar função para atualizar last_message_at
-- ============================================
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Criar trigger para atualizar last_message_at
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- ============================================
-- 6. Habilitar Row Level Security (RLS)
-- ============================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. Criar políticas RLS para messages
-- ============================================
-- Usuários podem ver mensagens onde são sender ou receiver
CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Usuários podem inserir mensagens como sender
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Usuários podem atualizar suas próprias mensagens (para marcar como lida)
CREATE POLICY "Users can update their received messages"
    ON messages FOR UPDATE
    USING (auth.uid() = receiver_id);

-- ============================================
-- 8. Criar políticas RLS para conversations
-- ============================================
-- Usuários podem ver conversas onde participam
CREATE POLICY "Users can view their conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Usuários podem criar conversas onde são participantes
CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================
-- 9. Criar função helper para obter ou criar conversa
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_user1_id UUID,
    p_user2_id UUID,
    p_invite_id UUID DEFAULT NULL,
    p_gig_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
    v_user1 UUID;
    v_user2 UUID;
BEGIN
    -- Garantir ordem: user1_id < user2_id
    IF p_user1_id < p_user2_id THEN
        v_user1 := p_user1_id;
        v_user2 := p_user2_id;
    ELSE
        v_user1 := p_user2_id;
        v_user2 := p_user1_id;
    END IF;
    
    -- Tentar encontrar conversa existente
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE user1_id = v_user1 AND user2_id = v_user2;
    
    -- Se não existir, criar
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (user1_id, user2_id, invite_id, gig_id)
        VALUES (v_user1, v_user2, p_invite_id, p_gig_id)
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

