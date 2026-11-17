ALTER TABLE public.rooms ADD COLUMN final_deadline timestamptz, ADD COLUMN final_players uuid[];
CREATE TABLE public.answer_submissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE, round_no integer NOT NULL, player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE, is_final boolean NOT NULL DEFAULT false, resolved boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT clock_timestamp());
GRANT ALL ON public.answer_submissions TO service_role;
ALTER TABLE public.answer_submissions ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.reserve_answer(p_room uuid, p_player uuid, p_token uuid, p_round integer) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.rooms%ROWTYPE; last_wrong uuid; submission uuid;
BEGIN
 SELECT * INTO r FROM public.rooms WHERE id=p_room FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.players WHERE id=p_player AND room_id=p_room AND token=p_token) THEN RAISE EXCEPTION 'Oyuncu doğrulanamadı'; END IF;
 IF r.status <> 'answering' OR r.round_no <> p_round THEN RAISE EXCEPTION 'Şu an cevap verilemez'; END IF;
 IF EXISTS(SELECT 1 FROM public.answer_submissions WHERE room_id=p_room AND round_no=p_round AND player_id=p_player AND NOT resolved) THEN RAISE EXCEPTION 'Hakem cevabını kontrol ediyor'; END IF;
 IF r.final_deadline IS NOT NULL THEN
  IF clock_timestamp() >= r.final_deadline OR NOT (p_player=ANY(r.final_players)) THEN RAISE EXCEPTION 'Son cevap süresi doldu'; END IF;
  IF EXISTS(SELECT 1 FROM public.answer_submissions WHERE room_id=p_room AND round_no=p_round AND player_id=p_player AND is_final) THEN RAISE EXCEPTION 'Son cevap hakkını kullandın'; END IF;
 ELSE
  SELECT player_id INTO last_wrong FROM public.attempts WHERE room_id=p_room AND round_no=p_round AND NOT correct ORDER BY created_at DESC,id DESC LIMIT 1;
  IF last_wrong=p_player THEN RAISE EXCEPTION 'Başka bir oyuncu yanlış cevap verene kadar beklemelisin'; END IF;
 END IF;
 INSERT INTO public.answer_submissions(room_id,round_no,player_id,is_final) VALUES(p_room,p_round,p_player,r.final_deadline IS NOT NULL) RETURNING id INTO submission;
 RETURN submission;
END; $$;
REVOKE ALL ON FUNCTION public.reserve_answer(uuid,uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_answer(uuid,uuid,uuid,integer) TO service_role;
CREATE OR REPLACE FUNCTION public.enforce_answer_wait() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE current_room public.rooms%ROWTYPE; last_wrong uuid;
BEGIN
 SELECT * INTO current_room FROM public.rooms WHERE id=NEW.room_id FOR UPDATE;
 IF current_room.round_no <> NEW.round_no OR current_room.status NOT IN ('answering','round_result','finished') THEN RAISE EXCEPTION 'Şu an cevap verilemez'; END IF;
 IF current_room.status='answering' AND current_room.final_deadline IS NULL THEN
  SELECT player_id INTO last_wrong FROM public.attempts WHERE room_id=NEW.room_id AND round_no=NEW.round_no AND NOT correct ORDER BY created_at DESC,id DESC LIMIT 1;
  IF last_wrong=NEW.player_id THEN RAISE EXCEPTION 'Başka bir oyuncu yanlış cevap verene kadar beklemelisin'; END IF;
 END IF;
 NEW.created_at:=clock_timestamp(); RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.record_answer(p_submission uuid,p_correct boolean,p_answer text,p_explanation text,p_name text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.answer_submissions%ROWTYPE; r public.rooms%ROWTYPE; wrong_players uuid[]; new_score integer;
BEGIN
 SELECT * INTO s FROM public.answer_submissions WHERE id=p_submission;
 IF s.id IS NULL THEN RAISE EXCEPTION 'Cevap bulunamadı'; END IF;
 SELECT * INTO r FROM public.rooms WHERE id=s.room_id FOR UPDATE;
 IF s.resolved THEN RETURN; END IF;
 IF r.round_no<>s.round_no THEN RAISE EXCEPTION 'Tur değişti'; END IF;
 INSERT INTO public.attempts(room_id,round_no,player_id,nickname,answer,correct,explanation) SELECT s.room_id,s.round_no,s.player_id,nickname,p_answer,p_correct,p_explanation FROM public.players WHERE id=s.player_id;
 UPDATE public.answer_submissions SET resolved=true WHERE id=s.id;
 IF p_correct AND r.status='answering' THEN
  UPDATE public.players SET score=score+1 WHERE id=s.player_id RETURNING score INTO new_score;
  UPDATE public.rooms SET status=CASE WHEN new_score>=r.target_score THEN 'finished' ELSE 'round_result' END,round_winner_id=s.player_id,round_answer=p_name,winner_player_id=CASE WHEN new_score>=r.target_score THEN s.player_id ELSE NULL END,updated_at=clock_timestamp() WHERE id=r.id;
 ELSIF NOT p_correct AND r.status='answering' AND r.final_deadline IS NULL THEN
  SELECT array_agg(player_id ORDER BY first_wrong) INTO wrong_players FROM (SELECT player_id,min(created_at) first_wrong FROM public.attempts WHERE room_id=r.id AND round_no=r.round_no AND NOT correct GROUP BY player_id ORDER BY min(created_at) LIMIT 2) w;
  IF cardinality(wrong_players)=2 THEN UPDATE public.rooms SET final_players=wrong_players,final_deadline=clock_timestamp()+interval '5 seconds',updated_at=clock_timestamp() WHERE id=r.id; END IF;
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.record_answer(uuid,boolean,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_answer(uuid,boolean,text,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.advance_final_round(p_room uuid,p_player uuid,p_token uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.rooms%ROWTYPE; ids uuid[]; ring uuid[]; pairs uuid[]:=ARRAY[]::uuid[]; a uuid; b uuid; tail uuid; n integer; i integer; day integer; pair_index integer; final_count integer;
BEGIN
 SELECT * INTO r FROM public.rooms WHERE id=p_room FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.players WHERE id=p_player AND room_id=p_room AND token=p_token) THEN RAISE EXCEPTION 'Oyuncu doğrulanamadı'; END IF;
 IF r.status<>'answering' OR r.final_deadline IS NULL THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.answer_submissions WHERE room_id=p_room AND round_no=r.round_no AND NOT resolved) THEN RETURN false; END IF;
 SELECT count(DISTINCT player_id) INTO final_count FROM public.answer_submissions WHERE room_id=p_room AND round_no=r.round_no AND is_final AND resolved;
 IF clock_timestamp()<r.final_deadline AND final_count<2 THEN RETURN false; END IF;
 SELECT array_agg(id ORDER BY created_at,id) INTO ids FROM public.players WHERE room_id=p_room;
 ring:=ids; IF cardinality(ring)%2=1 THEN ring:=array_append(ring,NULL::uuid); END IF; n:=cardinality(ring);
 FOR day IN 1..n-1 LOOP
  FOR i IN 1..n/2 LOOP a:=ring[i]; b:=ring[n+1-i]; IF a IS NOT NULL AND b IS NOT NULL THEN pairs:=pairs||ARRAY[a,b]; END IF; END LOOP;
  tail:=ring[n]; ring:=ARRAY[ring[1],tail]||ring[2:n-1];
 END LOOP;
 pair_index:=(r.round_no%(cardinality(pairs)/2))*2+1;
 UPDATE public.rooms SET status='picking',round_no=r.round_no+1,chooser_a=pairs[pair_index],chooser_b=pairs[pair_index+1],team_a=NULL,team_b=NULL,round_winner_id=NULL,round_answer=NULL,round_suggestions=NULL,final_deadline=NULL,final_players=NULL,updated_at=clock_timestamp() WHERE id=p_room;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.advance_final_round(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.advance_final_round(uuid,uuid,uuid) TO service_role;