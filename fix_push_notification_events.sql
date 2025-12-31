-- Expand push notification coverage for messages, reminders, and ratings

-- Ensure enum values exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    BEGIN
      ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_message';
      ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'gig_reminder';
      ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invite_expiring';
      ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'rating_pending';
      ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'musician_chosen';
      ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'gig_published';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- Message created -> notify receiver
CREATE OR REPLACE FUNCTION trg_message_created_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_sender_name TEXT;
  v_gig_title TEXT;
  v_body TEXT;
BEGIN
  SELECT display_name INTO v_sender_name FROM profiles WHERE user_id = NEW.sender_id;
  SELECT g.title INTO v_gig_title
  FROM conversations c
  JOIN gigs g ON g.id = c.gig_id
  WHERE c.id = NEW.conversation_id;

  v_body := COALESCE(v_sender_name, 'Nova mensagem') || ': ' || left(NEW.content, 120);

  PERFORM enqueue_push_notification(
    NEW.receiver_id,
    'new_message',
    jsonb_build_object(
      'title', COALESCE(v_sender_name, 'Nova mensagem'),
      'body', v_body,
      'tag', 'new_message',
      'data', jsonb_build_object('type', 'new_message', 'url', '/dashboard/messages')
    ),
    'message:' || NEW.id::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_created_notify ON messages;
CREATE TRIGGER trg_message_created_notify
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trg_message_created_notify();

-- Confirmation created -> add musician_chosen + gig_confirmed
CREATE OR REPLACE FUNCTION trg_confirmation_created_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_contractor_id UUID;
  v_gig_id UUID;
  v_gig_title TEXT;
  v_body TEXT;
BEGIN
  SELECT contractor_id, gig_id INTO v_contractor_id, v_gig_id
  FROM invites WHERE id = NEW.invite_id;

  SELECT title INTO v_gig_title FROM gigs WHERE id = v_gig_id;
  v_body := COALESCE('Gig confirmada: ' || v_gig_title, 'Gig confirmada');

  IF NEW.musician_id IS NOT NULL THEN
    PERFORM enqueue_push_notification(
      NEW.musician_id,
      'musician_chosen',
      jsonb_build_object(
        'title', 'Voce foi escolhido',
        'body', COALESCE('Voce foi escolhido para: ' || v_gig_title, 'Voce foi escolhido para uma gig'),
        'tag', 'musician_chosen',
        'data', jsonb_build_object('type', 'musician_chosen', 'url', '/dashboard')
      ),
      'musician_chosen:' || NEW.invite_id::text
    );

    PERFORM enqueue_push_notification(
      NEW.musician_id,
      'gig_confirmed',
      jsonb_build_object(
        'title', 'Gig confirmada',
        'body', v_body,
        'tag', 'gig_confirmed',
        'data', jsonb_build_object('type', 'gig_confirmed', 'url', '/dashboard')
      ),
      'gig_confirmed:musician:' || NEW.invite_id::text
    );
  END IF;

  IF v_contractor_id IS NOT NULL THEN
    PERFORM enqueue_push_notification(
      v_contractor_id,
      'gig_confirmed',
      jsonb_build_object(
        'title', 'Gig confirmada',
        'body', v_body,
        'tag', 'gig_confirmed',
        'data', jsonb_build_object('type', 'gig_confirmed', 'url', '/dashboard')
      ),
      'gig_confirmed:contractor:' || NEW.invite_id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_confirmation_created_notify ON confirmations;
CREATE TRIGGER trg_confirmation_created_notify
  AFTER INSERT ON confirmations
  FOR EACH ROW
  EXECUTE FUNCTION trg_confirmation_created_notify();

-- Invite expiring (within 24h) -> notify musician
CREATE OR REPLACE FUNCTION rpc_enqueue_invite_expiring()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO push_notification_queue (
    user_id,
    notification_type,
    payload,
    event_key
  )
  SELECT
    i.musician_id,
    'invite_expiring',
    jsonb_build_object(
      'title', 'Convite prestes a expirar',
      'body', COALESCE('Responda o convite para: ' || g.title, 'Voce tem um convite pendente'),
      'tag', 'invite_expiring',
      'data', jsonb_build_object('type', 'invite_expiring', 'url', '/dashboard')
    ),
    'invite_expiring:' || i.id::text || ':' || to_char(now(), 'YYYYMMDD')
  FROM invites i
  JOIN gigs g ON g.id = i.gig_id
  WHERE i.status = 'pending'
    AND i.musician_id IS NOT NULL
    AND g.start_time IS NOT NULL
    AND g.start_time BETWEEN NOW() AND NOW() + interval '24 hours'
  ON CONFLICT (user_id, event_key) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Gig reminder (within 24h) -> notify musician + contractor
CREATE OR REPLACE FUNCTION rpc_enqueue_gig_reminder()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO push_notification_queue (
    user_id,
    notification_type,
    payload,
    event_key
  )
  SELECT
    i.musician_id,
    'gig_reminder',
    jsonb_build_object(
      'title', 'Lembrete de gig',
      'body', COALESCE('Sua gig esta chegando: ' || g.title, 'Sua gig esta chegando'),
      'tag', 'gig_reminder',
      'data', jsonb_build_object('type', 'gig_reminder', 'url', '/dashboard')
    ),
    'gig_reminder:musician:' || c.invite_id::text || ':' || to_char(now(), 'YYYYMMDD')
  FROM confirmations c
  JOIN invites i ON i.id = c.invite_id
  JOIN gigs g ON g.id = i.gig_id
  WHERE i.musician_id IS NOT NULL
    AND g.start_time IS NOT NULL
    AND g.start_time BETWEEN NOW() AND NOW() + interval '24 hours'
  ON CONFLICT (user_id, event_key) DO NOTHING;

  INSERT INTO push_notification_queue (
    user_id,
    notification_type,
    payload,
    event_key
  )
  SELECT
    i.contractor_id,
    'gig_reminder',
    jsonb_build_object(
      'title', 'Lembrete de gig',
      'body', COALESCE('Sua gig esta chegando: ' || g.title, 'Sua gig esta chegando'),
      'tag', 'gig_reminder',
      'data', jsonb_build_object('type', 'gig_reminder', 'url', '/dashboard')
    ),
    'gig_reminder:contractor:' || c.invite_id::text || ':' || to_char(now(), 'YYYYMMDD')
  FROM confirmations c
  JOIN invites i ON i.id = c.invite_id
  JOIN gigs g ON g.id = i.gig_id
  WHERE i.contractor_id IS NOT NULL
    AND g.start_time IS NOT NULL
    AND g.start_time BETWEEN NOW() AND NOW() + interval '24 hours'
  ON CONFLICT (user_id, event_key) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Rating pending (gigs ended in last 7 days) -> notify both sides
CREATE OR REPLACE FUNCTION rpc_enqueue_rating_pending()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO push_notification_queue (
    user_id,
    notification_type,
    payload,
    event_key
  )
  SELECT
    i.musician_id,
    'rating_pending',
    jsonb_build_object(
      'title', 'Avalie sua gig',
      'body', COALESCE('Deixe sua avaliacao sobre: ' || g.title, 'Deixe sua avaliacao da gig'),
      'tag', 'rating_pending',
      'data', jsonb_build_object('type', 'rating_pending', 'url', '/dashboard')
    ),
    'rating_pending:musician:' || c.invite_id::text || ':' || to_char(now(), 'YYYYMMDD')
  FROM confirmations c
  JOIN invites i ON i.id = c.invite_id
  JOIN gigs g ON g.id = i.gig_id
  LEFT JOIN ratings r ON r.invite_id = c.invite_id
    AND r.rater_type = 'musician'
    AND r.musician_id = i.musician_id
  WHERE i.musician_id IS NOT NULL
    AND g.end_time IS NOT NULL
    AND g.end_time BETWEEN NOW() - interval '7 days' AND NOW() - interval '2 hours'
    AND r.id IS NULL
  ON CONFLICT (user_id, event_key) DO NOTHING;

  INSERT INTO push_notification_queue (
    user_id,
    notification_type,
    payload,
    event_key
  )
  SELECT
    i.contractor_id,
    'rating_pending',
    jsonb_build_object(
      'title', 'Avalie sua gig',
      'body', COALESCE('Deixe sua avaliacao sobre: ' || g.title, 'Deixe sua avaliacao da gig'),
      'tag', 'rating_pending',
      'data', jsonb_build_object('type', 'rating_pending', 'url', '/dashboard')
    ),
    'rating_pending:contractor:' || c.invite_id::text || ':' || to_char(now(), 'YYYYMMDD')
  FROM confirmations c
  JOIN invites i ON i.id = c.invite_id
  JOIN gigs g ON g.id = i.gig_id
  LEFT JOIN ratings r ON r.invite_id = c.invite_id
    AND r.rater_type = 'contractor'
    AND r.contractor_id = i.contractor_id
  WHERE i.contractor_id IS NOT NULL
    AND g.end_time IS NOT NULL
    AND g.end_time BETWEEN NOW() - interval '7 days' AND NOW() - interval '2 hours'
    AND r.id IS NULL
  ON CONFLICT (user_id, event_key) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
