import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Flag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { GameDetails } from './game-details';
import { reportPlayer, erasePlayer } from '@/lib/game-safety.functions';

export function PlayerSafety({auth,players}: {auth:{code:string;playerId:string;token:string};players:{id:string;nickname:string}[]}) {
  const report=useServerFn(reportPlayer), erase=useServerFn(erasePlayer);
  const [target,setTarget]=useState(''), [reason,setReason]=useState<'nickname'|'answer'|'harassment'>('nickname');
  const [block,setBlock]=useState(true), [busy,setBusy]=useState(false), [confirm,setConfirm]=useState(false);
  return <GameDetails title="Oyuncu güvenliği">
    <label className="block mb-3">Oyuncu<select aria-label="Bildirilecek oyuncu" className="game-input w-full" value={target} onChange={e=>setTarget(e.target.value)}><option value="">Oyuncu seç</option>{players.filter(p=>p.id!==auth.playerId).map(p=><option key={p.id} value={p.id}>{p.nickname}</option>)}</select></label>
    <label className="block mb-3">Neden<select aria-label="Bildirim nedeni" className="game-input w-full" value={reason} onChange={e=>setReason(e.target.value as typeof reason)}><option value="nickname">Uygunsuz takma ad</option><option value="answer">Uygunsuz cevap</option><option value="harassment">Rahatsız edici davranış</option></select></label>
    <label className="flex gap-2 mb-3"><input type="checkbox" checked={block} onChange={e=>setBlock(e.target.checked)} />Bu odada adını ve cevaplarını gizle</label>
    <Button disabled={busy||!target} onClick={async()=>{setBusy(true);try{await report({data:{...auth,targetId:target,reason,block}});toast.success('Bildirim alındı; oda içi engelleme tercihin kaydedildi.');}catch(e){toast.error((e as Error).message);}finally{setBusy(false);}}}><Flag />Bildir</Button>
    <hr className="my-5 border-border" />
    <p className="mb-3 text-sm text-muted-foreground">Verilerini silmek bu maçı bitirir ve oda erişimini kaldırır. Diğer oyuncuların puanları korunur.</p>
    {!confirm?<Button variant="outline" onClick={()=>setConfirm(true)}><Trash2 />Sunucudaki verilerimi sil</Button>:<div className="flex gap-2"><Button disabled={busy} variant="destructive" onClick={async()=>{setBusy(true);try{await erase({data:auth});localStorage.removeItem(`omubumu:${auth.code}`);window.location.assign('/');}catch(e){toast.error((e as Error).message);setBusy(false);}}}>Evet, sil</Button><Button variant="ghost" onClick={()=>setConfirm(false)}>Vazgeç</Button></div>}
  </GameDetails>;
}