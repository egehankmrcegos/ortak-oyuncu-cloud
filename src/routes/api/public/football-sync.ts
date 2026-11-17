import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/football-sync")({ server: { handlers: {
  POST: async ({ request }) => {
    const denied = await authenticateCronRequest(request);
    if (denied) return denied;
    const [{ supabaseAdmin }, { syncFootballSources }] = await Promise.all([
      import("@/integrations/supabase/client.server"), import("@/lib/football-sync.server"),
    ]);
    try { return Response.json(await syncFootballSources(supabaseAdmin)); }
    catch { return Response.json({ ok: false, judgingChanged: false, error: "Football source update failed; existing catalogue retained" }, { status: 502 }); }
  },
} } });