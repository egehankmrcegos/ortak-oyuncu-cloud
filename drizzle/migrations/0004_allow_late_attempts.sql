CREATE OR REPLACE FUNCTION public.enforce_answer_wait()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE current_room public.rooms%ROWTYPE; last_wrong uuid;
BEGIN
 SELECT * INTO current_room FROM public.rooms WHERE id = NEW.room_id FOR UPDATE;
 IF current_room.round_no <> NEW.round_no OR current_room.status NOT IN ('answering', 'round_result', 'finished') THEN
  RAISE EXCEPTION 'Şu an cevap verilemez';
 END IF;
 IF current_room.status = 'answering' THEN
  SELECT player_id INTO last_wrong FROM public.attempts WHERE room_id = NEW.room_id AND round_no = NEW.round_no AND NOT correct ORDER BY created_at DESC, id DESC LIMIT 1;
  IF last_wrong = NEW.player_id THEN
   RAISE EXCEPTION 'Başka bir oyuncu yanlış cevap verene kadar beklemelisin';
  END IF;
 END IF;
 NEW.created_at := clock_timestamp();
 RETURN NEW;
END;
$function$;