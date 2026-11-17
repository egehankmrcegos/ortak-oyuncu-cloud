ALTER TABLE public.rooms
  ADD COLUMN round_seconds integer NOT NULL DEFAULT 0 CHECK (round_seconds IN (0, 10, 15, 20, 30, 60)),
  ADD COLUMN round_deadline timestamptz;

CREATE TABLE public.football_api_candidates (
  provider text NOT NULL,
  external_id text NOT NULL,
  player_name text NOT NULL,
  player_key text NOT NULL,
  club_names text[] NOT NULL DEFAULT '{}',
  source_url text NOT NULL,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'verified', 'rejected')),
  PRIMARY KEY (provider, external_id)
);
GRANT ALL ON public.football_api_candidates TO service_role;
ALTER TABLE public.football_api_candidates ENABLE ROW LEVEL SECURITY;
CREATE INDEX football_api_candidates_player_key_idx ON public.football_api_candidates(player_key);

CREATE OR REPLACE FUNCTION public.start_room_round_countdown() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'answering' THEN
    NEW.round_deadline := CASE WHEN NEW.round_seconds > 0
      THEN clock_timestamp() + make_interval(secs => NEW.round_seconds)
      ELSE NULL END;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'answering' AND OLD.status <> 'answering' THEN
    NEW.round_deadline := CASE WHEN NEW.round_seconds > 0
      THEN clock_timestamp() + make_interval(secs => NEW.round_seconds)
      ELSE NULL END;
  ELSIF NEW.status <> 'answering' THEN
    NEW.round_deadline := NULL;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER start_room_round_countdown
  BEFORE INSERT OR UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.start_room_round_countdown();

CREATE OR REPLACE FUNCTION public.expire_room_round(p_room uuid, p_player uuid, p_token uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.rooms%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.rooms WHERE id=p_room FOR UPDATE;
  IF NOT EXISTS(SELECT 1 FROM public.players WHERE id=p_player AND room_id=p_room AND token=p_token) THEN
    RAISE EXCEPTION 'Oyuncu doğrulanamadı';
  END IF;
  IF r.status <> 'answering' OR r.round_deadline IS NULL OR clock_timestamp() < r.round_deadline THEN RETURN false; END IF;
  IF EXISTS(SELECT 1 FROM public.answer_submissions WHERE room_id=p_room AND round_no=r.round_no AND NOT resolved) THEN RETURN false; END IF;
  UPDATE public.rooms SET status='round_result', round_winner_id=NULL, round_answer=NULL,
    round_suggestions=NULL, final_deadline=NULL, final_players=NULL, updated_at=clock_timestamp()
    WHERE id=p_room AND status='answering' AND round_no=r.round_no;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.expire_room_round(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.expire_room_round(uuid,uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_round_deadline() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
DECLARE r public.rooms%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.rooms WHERE id=NEW.room_id;
  IF r.round_no <> NEW.round_no OR r.status <> 'answering' THEN RAISE EXCEPTION 'Tur değişti'; END IF;
  IF r.round_deadline IS NOT NULL AND clock_timestamp() >= r.round_deadline THEN RAISE EXCEPTION 'Tur süresi doldu'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER enforce_round_deadline
  BEFORE INSERT ON public.answer_submissions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_round_deadline();
