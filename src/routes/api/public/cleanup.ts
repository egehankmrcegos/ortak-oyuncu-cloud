import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';
export const Route=createFileRoute('/api/public/cleanup')({server:{handlers:{POST:async({request})=>{
  const denied=await authenticateCronRequest(request); if(denied) return denied;
  const {supabaseAdmin:db}=await import('@/integrations/supabase/client.server');
  const {error}=await db.rpc('cleanup_game_data');
  return Response.json({ok:!error},{status:error?500:200});
}}}});