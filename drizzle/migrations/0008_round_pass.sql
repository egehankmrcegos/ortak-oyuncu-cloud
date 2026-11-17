ALTER TABLE public.rooms ADD COLUMN pass_round integer, ADD COLUMN passed_players uuid[] NOT NULL DEFAULT '{}';
CREATE OR REPLACE FUNCTION public.pass_round(p_room uuid, p_player uuid, p_token uuid, p_round integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.rooms%ROWTYPE; passed uuid[]; total integer;
BEGIN
 SELECT * INTO r FROM public.rooms WHERE id=p_room FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.players WHERE id=p_player AND room_id=p_room AND token=p_token) THEN RAISE EXCEPTION 'Oyuncu doğrulanamadı'; END IF;
 IF r.status<>'answering' OR r.round_no<>p_round THEN RAISE EXCEPTION 'Şu an pas geçilemez'; END IF;
 passed := CASE WHEN r.pass_round=p_round THEN r.passed_players ELSE '{}'::uuid[] END;
 IF NOT (p_player=ANY(passed)) THEN passed := array_append(passed,p_player); END IF;
 UPDATE public.rooms SET pass_round=p_round, passed_players=passed, updated_at=clock_timestamp() WHERE id=p_room;
 SELECT count(*) INTO total FROM public.players WHERE room_id=p_room;
 RETURN cardinality(passed)>=total;
END; $$;
REVOKE ALL ON FUNCTION public.pass_round(uuid,uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pass_round(uuid,uuid,uuid,integer) TO service_role;