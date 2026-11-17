CREATE OR REPLACE FUNCTION public.set_random_teams(p_room uuid,p_player uuid,p_token uuid,p_round integer,p_a text,p_b text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.rooms%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.rooms WHERE id=p_room FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.players WHERE id=p_player AND room_id=p_room AND token=p_token) THEN RAISE EXCEPTION 'Oyuncu doğrulanamadı'; END IF;
 IF r.status<>'picking' OR r.round_no<>p_round OR r.team_mode<>'random' THEN RETURN false; END IF;
 IF coalesce(p_a,'')='' OR coalesce(p_b,'')='' THEN UPDATE public.rooms SET random_exhausted=true WHERE id=p_room; RETURN false; END IF;
 IF p_a=p_b OR EXISTS(SELECT 1 FROM public.picks WHERE room_id=p_room AND round_no>=r.match_start_round AND round_no<r.round_no AND team IN (p_a,p_b)) THEN RETURN false; END IF;
 INSERT INTO public.picks(room_id,round_no,player_id,team) VALUES(p_room,r.round_no,r.chooser_a,p_a),(p_room,r.round_no,r.chooser_b,p_b) ON CONFLICT(room_id,round_no,player_id) DO UPDATE SET team=EXCLUDED.team;
 UPDATE public.rooms SET status='answering',team_a=p_a,team_b=p_b,random_exhausted=false,updated_at=clock_timestamp() WHERE id=p_room;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.set_random_teams(uuid,uuid,uuid,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_random_teams(uuid,uuid,uuid,integer,text,text) TO service_role;