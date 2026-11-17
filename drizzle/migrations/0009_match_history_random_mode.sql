ALTER TABLE public.rooms ADD COLUMN team_mode text NOT NULL DEFAULT 'manual' CHECK (team_mode IN ('manual','random')), ADD COLUMN difficulty text NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')), ADD COLUMN random_exhausted boolean NOT NULL DEFAULT false;
CREATE TABLE public.match_rounds (room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE, round_no integer NOT NULL, match_start_round integer NOT NULL, team_a text, team_b text, winner_player_id uuid, answer text, suggestions jsonb, outcome text NOT NULL, PRIMARY KEY(room_id,round_no));
GRANT ALL ON public.match_rounds TO service_role;
ALTER TABLE public.match_rounds ENABLE ROW LEVEL SECURITY;
CREATE INDEX match_rounds_match_idx ON public.match_rounds(room_id,match_start_round,round_no);
CREATE OR REPLACE FUNCTION public.capture_match_round() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF OLD.round_no>0 AND NEW.round_no<>OLD.round_no THEN
  INSERT INTO public.match_rounds(room_id,round_no,match_start_round,team_a,team_b,winner_player_id,answer,suggestions,outcome) VALUES(OLD.id,OLD.round_no,OLD.match_start_round,OLD.team_a,OLD.team_b,OLD.round_winner_id,OLD.round_answer,OLD.round_suggestions,CASE WHEN OLD.round_winner_id IS NOT NULL THEN 'correct' ELSE 'skipped' END) ON CONFLICT(room_id,round_no) DO UPDATE SET team_a=EXCLUDED.team_a,team_b=EXCLUDED.team_b,winner_player_id=EXCLUDED.winner_player_id,answer=EXCLUDED.answer,suggestions=EXCLUDED.suggestions,outcome=EXCLUDED.outcome;
 END IF;
 IF NEW.round_no>0 AND NEW.status IN ('round_result','finished') THEN
  INSERT INTO public.match_rounds(room_id,round_no,match_start_round,team_a,team_b,winner_player_id,answer,suggestions,outcome) VALUES(NEW.id,NEW.round_no,NEW.match_start_round,NEW.team_a,NEW.team_b,NEW.round_winner_id,NEW.round_answer,NEW.round_suggestions,CASE WHEN NEW.round_winner_id IS NOT NULL THEN 'correct' ELSE 'skipped' END) ON CONFLICT(room_id,round_no) DO UPDATE SET team_a=EXCLUDED.team_a,team_b=EXCLUDED.team_b,winner_player_id=EXCLUDED.winner_player_id,answer=EXCLUDED.answer,suggestions=EXCLUDED.suggestions,outcome=EXCLUDED.outcome;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.capture_match_round() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER capture_match_round AFTER UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.capture_match_round();
INSERT INTO public.match_rounds(room_id,round_no,match_start_round,team_a,team_b,winner_player_id,answer,suggestions,outcome) SELECT id,round_no,match_start_round,team_a,team_b,round_winner_id,round_answer,round_suggestions,CASE WHEN round_winner_id IS NOT NULL THEN 'correct' ELSE 'skipped' END FROM public.rooms WHERE round_no>0 AND status IN ('round_result','finished');
CREATE OR REPLACE FUNCTION public.set_random_teams(p_room uuid,p_player uuid,p_token uuid,p_round integer,p_a text,p_b text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.rooms%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.rooms WHERE id=p_room FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.players WHERE id=p_player AND room_id=p_room AND token=p_token) THEN RAISE EXCEPTION 'Oyuncu doğrulanamadı'; END IF;
 IF r.status<>'picking' OR r.round_no<>p_round OR r.team_mode<>'random' THEN RETURN false; END IF;
 IF p_a IS NULL OR p_b IS NULL THEN UPDATE public.rooms SET random_exhausted=true WHERE id=p_room; RETURN false; END IF;
 IF p_a=p_b OR EXISTS(SELECT 1 FROM public.picks WHERE room_id=p_room AND round_no>=r.match_start_round AND round_no<r.round_no AND team IN (p_a,p_b)) THEN RETURN false; END IF;
 INSERT INTO public.picks(room_id,round_no,player_id,team) VALUES(p_room,r.round_no,r.chooser_a,p_a),(p_room,r.round_no,r.chooser_b,p_b) ON CONFLICT(room_id,round_no,player_id) DO UPDATE SET team=EXCLUDED.team;
 UPDATE public.rooms SET status='answering',team_a=p_a,team_b=p_b,random_exhausted=false,updated_at=clock_timestamp() WHERE id=p_room;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.set_random_teams(uuid,uuid,uuid,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_random_teams(uuid,uuid,uuid,integer,text,text) TO service_role;