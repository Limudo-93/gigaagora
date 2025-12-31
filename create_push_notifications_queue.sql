-- ============================================
-- Push notification queue + triggers
-- ============================================

-- Ensure notification_type enum has gig_published
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'new_invite',
      'invite_accepted',
      'invite_declined',
      'gig_confirmed',
      'musician_chosen',
      'gig_cancelled',
      'new_message',
      'gig_reminder',
      'invite_expiring',
      'rating_pending',
      'profile_completion',
      'daily_reminder',
      'gig_published'
    );
  ELSE
    BEGIN
      ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'gig_published';
    EXCEPTION WHEN duplicate_object THEN
      -- already exists
      NULL;
    END;
  END IF;
END $$;

-- Queue table
CREATE TABLE IF NOT EXISTS push_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  last_error TEXT,
  event_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_notification_queue_status
  ON push_notification_queue(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_push_notification_queue_user
  ON push_notification_queue(user_id);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_push_notification_queue_event'
  ) THEN
    ALTER TABLE push_notification_queue
      ADD CONSTRAINT uq_push_notification_queue_event UNIQUE (user_id, event_key);
  END IF;
END $$;

ALTER TABLE push_notification_queue ENABLE ROW LEVEL SECURITY;

-- No policies: only service role should access the queue.

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_push_notification_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_push_notification_queue_updated_at ON push_notification_queue;
CREATE TRIGGER trg_update_push_notification_queue_updated_at
  BEFORE UPDATE ON push_notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_push_notification_queue_updated_at();

-- Enqueue helper
CREATE OR REPLACE FUNCTION try_notify_queue_processor()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_net BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'net'
      AND p.proname = 'http_post'
  ) INTO v_has_net;

  IF v_has_net THEN
    PERFORM net.http_post(
      url := 'https://www.chamaomusico.com.br/api/notifications/process',
      headers := jsonb_build_object('content-type', 'application/json'),
      body := '{}'::jsonb
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION enqueue_push_notification(
  p_user_id UUID,
  p_type notification_type,
  p_payload JSONB,
  p_event_key TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO push_notification_queue (
    user_id,
    notification_type,
    payload,
    event_key,
    status,
    next_attempt_at
  )
  VALUES (
    p_user_id,
    p_type,
    p_payload,
    p_event_key,
    'pending',
    NOW()
  )
  ON CONFLICT (user_id, event_key)
  DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_id;

  -- Best-effort immediate dispatch if pg_net is available
  PERFORM try_notify_queue_processor();

  RETURN v_id;
END;
$$;

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

-- Invite created -> notify musician
CREATE OR REPLACE FUNCTION trg_invite_created_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_gig_title TEXT;
BEGIN
  IF NEW.musician_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT title INTO v_gig_title FROM gigs WHERE id = NEW.gig_id;

  PERFORM enqueue_push_notification(
    NEW.musician_id,
    'new_invite',
    jsonb_build_object(
      'title', 'Novo convite recebido',
      'body', COALESCE('Voce recebeu convite para: ' || v_gig_title, 'Voce recebeu um novo convite'),
      'tag', 'new_invite',
      'data', jsonb_build_object('type', 'new_invite', 'url', '/dashboard')
    ),
    'invite:' || NEW.id::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invite_created_notify ON invites;
CREATE TRIGGER trg_invite_created_notify
  AFTER INSERT ON invites
  FOR EACH ROW
  EXECUTE FUNCTION trg_invite_created_notify();

-- Invite status change -> notify contractor
CREATE OR REPLACE FUNCTION trg_invite_status_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_gig_title TEXT;
  v_title TEXT;
  v_body TEXT;
  v_type notification_type;
BEGIN
  IF NEW.contractor_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS NULL OR NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'accepted' THEN
    v_type := 'invite_accepted';
    v_title := 'Convite aceito';
    v_body := 'Um musico aceitou seu convite';
  ELSIF NEW.status = 'declined' THEN
    v_type := 'invite_declined';
    v_title := 'Convite recusado';
    v_body := 'Um musico recusou seu convite';
  ELSE
    RETURN NEW;
  END IF;

  SELECT title INTO v_gig_title FROM gigs WHERE id = NEW.gig_id;
  IF v_gig_title IS NOT NULL THEN
    v_body := v_body || ' para: ' || v_gig_title;
  END IF;

  PERFORM enqueue_push_notification(
    NEW.contractor_id,
    v_type,
    jsonb_build_object(
      'title', v_title,
      'body', v_body,
      'tag', NEW.status,
      'data', jsonb_build_object('type', NEW.status, 'url', '/dashboard/gigs')
    ),
    'invite_status:' || NEW.id::text || ':' || NEW.status
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invite_status_notify ON invites;
CREATE TRIGGER trg_invite_status_notify
  AFTER UPDATE ON invites
  FOR EACH ROW
  EXECUTE FUNCTION trg_invite_status_notify();

-- Confirmation created -> notify both
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
  END IF;

  IF NEW.musician_id IS NOT NULL THEN
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

-- Gig published -> notify contractor + all musicians
CREATE OR REPLACE FUNCTION trg_gig_published_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_body TEXT;
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    v_body := COALESCE('Nova gig publicada: ' || NEW.title, 'Nova gig publicada');

    IF NEW.contractor_id IS NOT NULL THEN
      PERFORM enqueue_push_notification(
        NEW.contractor_id,
        'gig_published',
        jsonb_build_object(
          'title', 'Gig publicada',
          'body', v_body,
          'tag', 'gig_published',
          'data', jsonb_build_object('type', 'gig_published', 'url', '/dashboard/gigs')
        ),
        'gig_published:contractor:' || NEW.id::text
      );
    END IF;

    INSERT INTO push_notification_queue (
      user_id,
      notification_type,
      payload,
      event_key
    )
    SELECT
      p.user_id,
      'gig_published',
      jsonb_build_object(
        'title', 'Gig publicada',
        'body', v_body,
        'tag', 'gig_published',
        'data', jsonb_build_object('type', 'gig_published', 'url', '/dashboard/gigs')
      ),
      'gig_published:' || NEW.id::text || ':' || p.user_id::text
    FROM profiles p
    WHERE p.user_type = 'musician'
      AND p.user_id IS NOT NULL
    ON CONFLICT (user_id, event_key) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gig_published_notify ON gigs;
CREATE TRIGGER trg_gig_published_notify
  AFTER INSERT OR UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION trg_gig_published_notify();

-- Gig cancelled -> notify contractor + invited musicians
CREATE OR REPLACE FUNCTION trg_gig_cancelled_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_body TEXT;
BEGIN
  IF NEW.status = 'cancelled' AND (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    v_body := COALESCE('Gig cancelada: ' || NEW.title, 'Gig cancelada');

    IF NEW.contractor_id IS NOT NULL THEN
      PERFORM enqueue_push_notification(
        NEW.contractor_id,
        'gig_cancelled',
        jsonb_build_object(
          'title', 'Gig cancelada',
          'body', v_body,
          'tag', 'gig_cancelled',
          'data', jsonb_build_object('type', 'gig_cancelled', 'url', '/dashboard')
        ),
        'gig_cancelled:contractor:' || NEW.id::text
      );
    END IF;

    INSERT INTO push_notification_queue (
      user_id,
      notification_type,
      payload,
      event_key
    )
    SELECT DISTINCT
      i.musician_id,
      'gig_cancelled',
      jsonb_build_object(
        'title', 'Gig cancelada',
        'body', v_body,
        'tag', 'gig_cancelled',
        'data', jsonb_build_object('type', 'gig_cancelled', 'url', '/dashboard')
      ),
      'gig_cancelled:' || NEW.id::text || ':' || i.musician_id::text
    FROM invites i
    WHERE i.gig_id = NEW.id
      AND i.musician_id IS NOT NULL
    ON CONFLICT (user_id, event_key) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gig_cancelled_notify ON gigs;
CREATE TRIGGER trg_gig_cancelled_notify
  AFTER UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION trg_gig_cancelled_notify();

-- Profile completion reminders (once per day)
CREATE OR REPLACE FUNCTION rpc_enqueue_profile_completion()
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
    p.user_id,
    'profile_completion',
    jsonb_build_object(
      'title', 'Complete seu perfil',
      'body', 'Complete seu perfil para receber mais convites.',
      'tag', 'profile_completion',
      'data', jsonb_build_object('type', 'profile_completion', 'url', '/dashboard/perfil/edit')
    ),
    'profile_completion:' || p.user_id::text || ':' || to_char(now(), 'YYYYMMDD')
  FROM profiles p
  WHERE p.user_id IS NOT NULL
    AND (
      p.display_name IS NULL OR
      p.phone_e164 IS NULL OR
      p.city IS NULL OR
      p.photo_url IS NULL
    )
  ON CONFLICT (user_id, event_key) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Daily reminder (once per day) for pending invites or upcoming gigs
CREATE OR REPLACE FUNCTION rpc_enqueue_daily_reminder()
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
  SELECT DISTINCT
    u.user_id,
    'daily_reminder',
    jsonb_build_object(
      'title', 'Novidades na plataforma',
      'body', 'Confira seus convites e atualizacoes no app.',
      'tag', 'daily_reminder',
      'data', jsonb_build_object('type', 'daily_reminder', 'url', '/dashboard')
    ),
    'daily_reminder:' || u.user_id::text || ':' || to_char(now(), 'YYYYMMDD')
  FROM (
    SELECT musician_id AS user_id
    FROM invites
    WHERE status = 'pending'
    UNION
    SELECT contractor_id AS user_id
    FROM invites
    WHERE status = 'pending'
    UNION
    SELECT i.musician_id AS user_id
    FROM confirmations c
    JOIN invites i ON i.id = c.invite_id
    JOIN gigs g ON g.id = i.gig_id
    WHERE g.start_time >= NOW()
      AND g.start_time <= NOW() + interval '7 days'
  ) u
  WHERE u.user_id IS NOT NULL
  ON CONFLICT (user_id, event_key) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

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
