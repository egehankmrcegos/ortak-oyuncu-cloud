import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AI_CONSENT_KEY, AI_CONSENT_VERSION, hasAIConsent } from "@/lib/app-privacy";

export function GamePrivacy() {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(!hasAIConsent(window.localStorage)); }, []);
  return <Dialog open={open} onOpenChange={() => {}}>
    <DialogContent className="privacy-consent" onEscapeKeyDown={e => e.preventDefault()} onPointerDownOutside={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}>
      <ShieldCheck className="text-primary" aria-hidden="true" />
      <DialogTitle>Oyuna katılmadan önce</DialogTitle>
      <DialogDescription>Oyun yapay zekâ kullanmaz. Takma adın, takım seçimlerin ve cevapların Supabase veritabanında işlenir ve odadaki oyuncularla paylaşılır. Kayıtlarda bulunmayan futbolcu adları ücretsiz TheSportsDB API'sinde aranabilir; bulunan kariyer bilgileri doğrulanmak üzere Supabase'e kaydedilir ve onaylanana kadar cevap puanlamaz. Oyun kayıtları 30 gün içinde günlük temizlikle kaldırılır. Uygunsuz içerik ve kişisel bilgi paylaşma.</DialogDescription>
      <p className="text-sm text-muted-foreground">Oyuncuları bildirebilir, oda içinde engelleyebilir ve oyun menüsünden verilerini silebilirsin.</p>
      <div className="flex flex-wrap gap-2 text-sm"><Link className="text-primary underline" to="/gizlilik">Gizlilik</Link><Link className="text-primary underline" to="/destek">Destek</Link></div>
      <Button onClick={() => {
        try { window.localStorage.setItem(AI_CONSENT_KEY, AI_CONSENT_VERSION); setOpen(false); }
        catch { /* Keep consent visible if storage is unavailable. */ }
      }}>Kabul et ve oyna</Button>
      <Button variant="ghost" asChild><Link to="/destek">Şimdi değil</Link></Button>
    </DialogContent>
  </Dialog>;
}
