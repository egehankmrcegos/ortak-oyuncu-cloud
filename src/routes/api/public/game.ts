import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { nativeCors } from '@/lib/native-api-security';

export const Route = createFileRoute('/api/public/game')({server:{handlers:{
  OPTIONS: async ({request}) => { const headers=nativeCors(request.headers.get('origin')); return new Response(null,{status:headers?204:403,headers:headers??{}}); },
  POST: async ({request}) => {
    const headers=nativeCors(request.headers.get('origin'));
    if(!headers) return Response.json({error:'İzin verilmeyen kaynak'},{status:403});
    if(Number(request.headers.get('content-length')??0)>8192) return Response.json({error:'İstek çok büyük'},{status:413,headers});
    try {
      const raw=await request.text();
      if(raw.length>8192) return Response.json({error:'İstek çok büyük'},{status:413,headers});
      const input=z.object({action:z.enum(['createRoom','joinRoom','getRoomState','startRound','submitPick','submitAnswer','passRound','skipRound','useManualTeams','reportPlayer','erasePlayer','startTraining','checkTraining']),data:z.record(z.unknown())}).parse(JSON.parse(raw));
      const game=await import('@/lib/game.functions');
      const safety=await import('@/lib/game-safety.functions');
      const training=await import('@/lib/training.functions');
      const actions={...game,...safety,...training};
      // Every action validates input; room actions verify the per-player token.
      // Creation and joining are intentionally public, as in the web game.
      const action=actions[input.action] as (options:{data:unknown})=>Promise<unknown>;
      const result=await action({data:input.data});
      return Response.json({result},{headers});
    } catch(e) { return Response.json({error:e instanceof Error?e.message:'İşlem tamamlanamadı'},{status:400,headers}); }
  }
}}});