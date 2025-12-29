-- ============================================
-- Corrigir funções de criação automática de convites
-- para não enviar convites ao contractor_id (quem criou a gig)
-- ============================================

-- Função para criar invites automaticamente para músicos compatíveis
CREATE OR REPLACE FUNCTION auto_create_invites_for_gig()
RETURNS TRIGGER AS $$
DECLARE
  role_record RECORD;
  musician_record RECORD;
  v_invite_id UUID;
BEGIN
  -- Só processa se a gig está publicada
  IF NEW.status != 'published' THEN
    RETURN NEW;
  END IF;

  -- Para cada role da gig
  FOR role_record IN 
    SELECT id, instrument, desired_genres, quantity
    FROM gig_roles
    WHERE gig_id = NEW.id
  LOOP
    -- Busca músicos que tocam o instrumento necessário
    FOR musician_record IN
      SELECT DISTINCT mp.user_id
      FROM musician_profiles mp
      INNER JOIN profiles p ON p.user_id = mp.user_id
      WHERE 
        -- Músico toca o instrumento necessário
        role_record.instrument = ANY(mp.instruments)
        -- E tem perfil ativo
        AND p.user_type = 'musician'
        -- E NÃO é o contractor que criou a gig
        AND mp.user_id != NEW.contractor_id
        -- E não está bloqueado (se houver tabela de blocks)
        AND NOT EXISTS (
          SELECT 1 FROM blocks b
          WHERE b.musician_id = mp.user_id
          AND b.starts_at <= NEW.start_time
          AND b.ends_at >= NEW.start_time
        )
    LOOP
      -- Verifica se já existe um invite para evitar duplicatas
      SELECT id INTO v_invite_id
      FROM invites
      WHERE gig_id = NEW.id
        AND gig_role_id = role_record.id
        AND musician_id = musician_record.user_id
      LIMIT 1;

      -- Se não existe, cria o invite
      IF v_invite_id IS NULL THEN
        INSERT INTO invites (
          gig_id,
          gig_role_id,
          contractor_id,
          musician_id,
          status,
          invited_at
        ) VALUES (
          NEW.id,
          role_record.id,
          NEW.contractor_id,
          musician_record.user_id,
          'pending',
          NOW()
        );
      END IF;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar invites quando roles são adicionadas a uma gig já publicada
CREATE OR REPLACE FUNCTION auto_create_invites_for_role()
RETURNS TRIGGER AS $$
DECLARE
  gig_record RECORD;
  musician_record RECORD;
  v_invite_id UUID;
BEGIN
  -- Busca a gig associada
  SELECT * INTO gig_record
  FROM gigs
  WHERE id = NEW.gig_id;

  -- Só processa se a gig está publicada
  IF gig_record.status != 'published' THEN
    RETURN NEW;
  END IF;

  -- Busca músicos que tocam o instrumento necessário
  FOR musician_record IN
    SELECT DISTINCT mp.user_id
    FROM musician_profiles mp
    INNER JOIN profiles p ON p.user_id = mp.user_id
    WHERE 
      -- Músico toca o instrumento necessário
      NEW.instrument = ANY(mp.instruments)
      -- E tem perfil ativo
      AND p.user_type = 'musician'
      -- E NÃO é o contractor que criou a gig
      AND mp.user_id != gig_record.contractor_id
      -- E não está bloqueado
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE b.musician_id = mp.user_id
        AND b.starts_at <= gig_record.start_time
        AND b.ends_at >= gig_record.start_time
      )
  LOOP
    -- Verifica se já existe um invite
    SELECT id INTO v_invite_id
    FROM invites
    WHERE gig_id = NEW.gig_id
      AND gig_role_id = NEW.id
      AND musician_id = musician_record.user_id
    LIMIT 1;

    -- Se não existe, cria o invite
    IF v_invite_id IS NULL THEN
      INSERT INTO invites (
        gig_id,
        gig_role_id,
        contractor_id,
        musician_id,
        status,
        invited_at
      ) VALUES (
        NEW.gig_id,
        NEW.id,
        gig_record.contractor_id,
        musician_record.user_id,
        'pending',
        NOW()
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comentários para documentação
-- ============================================
COMMENT ON FUNCTION auto_create_invites_for_gig() IS 'Cria invites automaticamente para músicos compatíveis quando uma gig é publicada. Exclui o contractor que criou a gig.';
COMMENT ON FUNCTION auto_create_invites_for_role() IS 'Cria invites automaticamente quando uma role é adicionada a uma gig publicada. Exclui o contractor que criou a gig.';

