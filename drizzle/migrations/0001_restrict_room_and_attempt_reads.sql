DROP POLICY IF EXISTS "rooms readable" ON public.rooms;
DROP POLICY IF EXISTS "attempts readable" ON public.attempts;
REVOKE SELECT ON public.rooms FROM anon, authenticated;
REVOKE SELECT ON public.attempts FROM anon, authenticated;
ALTER PUBLICATION supabase_realtime DROP TABLE public.rooms;
ALTER PUBLICATION supabase_realtime DROP TABLE public.attempts;