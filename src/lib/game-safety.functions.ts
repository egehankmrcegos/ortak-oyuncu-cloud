import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireRoomCode } from './room-code';
const auth = z.object({ code: z.string().transform(requireRoomCode), playerId: z.string().uuid(), token: z.string().uuid() });
async function authorize(data: z.infer<typeof auth>) {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const { data: room } = await db.from('rooms').select('id').eq('code',data.code).single();
  if (!room) throw new Error('Oda bulunamadı');
  const { data: player } = await db.from('players').select('id').eq('room_id',room.id).eq('id',data.playerId).eq('token',data.token).is('deleted_at',null).single();
  if (!player) throw new Error('Oyuncu doğrulanamadı');
  return { db, room };
}
export const reportPlayer = createServerFn({method:'POST'})
  .inputValidator(i => auth.extend({targetId:z.string().uuid(),reason:z.enum(['nickname','answer','harassment']),block:z.boolean()}).parse(i))
  .handler(async ({data}) => {
    const {db,room} = await authorize(data);
    if(data.targetId===data.playerId) throw new Error('Kendini bildiremezsin');
    const {data:target} = await db.from('players').select('id').eq('id',data.targetId).eq('room_id',room.id).single();
    if(!target) throw new Error('Oyuncu bulunamadı');
    const {error} = await db.from('game_reports').insert({room_id:room.id,reporter_id:data.playerId,target_id:data.targetId,reason:data.reason});
    if(error) throw new Error('Bildirim gönderilemedi');
    if(data.block) {
      const {error:e} = await db.from('game_blocks').upsert({room_id:room.id,blocker_id:data.playerId,blocked_id:data.targetId});
      if(e) throw new Error('Engelleme kaydedilemedi');
    }
    return {ok:true};
  });
export const erasePlayer = createServerFn({method:'POST'}).inputValidator(i => auth.parse(i)).handler(async ({data}) => {
  const {db,room} = await authorize(data);
  const {error} = await db.rpc('erase_game_player',{p_room:room.id,p_player:data.playerId,p_token:data.token});
  if(error) throw new Error('Veriler silinemedi');
  return {ok:true};
});