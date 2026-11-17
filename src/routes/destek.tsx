import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LegalLayout } from "@/components/legal-layout";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL, forgetLocalGameData } from "@/lib/app-privacy";

export const Route = createFileRoute("/destek")({
  head: () => ({ meta: [
    { title: "Destek ve Veri Talepleri — O mu Bu mu?" },
    { name: "description", content: "O mu Bu mu? için yardım al, hata bildir ve veri silme talebi ilet." },
    { property: "og:title", content: "O mu Bu mu? — Oyuncu Desteği" },
    { property: "og:description", content: "Destek, gizlilik ve oyun verilerinle ilgili talepler için iletişim." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: SupportPage,
});

function SupportPage() {
  const [confirm, setConfirm] = useState(false);
  return <LegalLayout title="Oyuncu desteği">
    <p>Hata, hakem kararı, uygunsuz takma ad veya veri silme talebin için Egehan Kömürcü’ye ulaş.</p>
    <Button asChild><a href={`mailto:${SUPPORT_EMAIL}?subject=O%20mu%20Bu%20mu%3F%20Destek`}><Mail />E-posta gönder</a></Button>
    <p className="break-all"><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
    <h2>Hata ve uygunsuz içerik bildirimi</h2>
    <p>Oda kodunu, yaklaşık saati, takma adını ve sorunun açıklamasını ekle. Gizli erişim anahtarını gönderme. Oyun yalnızca davetli odalarda oynanır; tanımadığın kişilerle oda bağlantını paylaşma. Uygunsuz içerik bildirimlerini inceleriz.</p>
    <h2>Sunucudan veri silme talebi</h2>
    <p>E-posta konusuna “Veri silme” yaz; oda kodunu ve takma adını ekle. Talebin doğrulanmasının ardından ilgili kayıtlar değerlendirilir. Oyun içindeki Oyuncu güvenliği menüsünden sunucudaki kendi verilerini hemen silebilirsin. Aşağıdaki cihaz temizliği sunucu kayıtlarını silmez.</p>
    <h2>Cihazdaki bilgileri temizle</h2>
    <p>Gizlilik tercihin ve bu cihazdaki oda erişimlerin kaldırılır. Önce veri silme talebin için oda kodlarını not et. Eski odalara aynı oyuncu olarak dönemeyebilirsin.</p>
    {!confirm ? <Button variant="outline" onClick={() => setConfirm(true)}><Trash2 />Cihazdaki oyun bilgilerini temizle</Button> : <div className="flex flex-wrap gap-3">
      <Button variant="destructive" onClick={() => {
        try { forgetLocalGameData(window.localStorage); setConfirm(false); toast.success("Cihazdaki oyun bilgileri ve gizlilik tercihi temizlendi"); }
        catch { toast.error("Bilgiler temizlenemedi; cihaz ayarlarından site verilerini temizleyebilirsin."); }
      }}>Evet, cihazı temizle</Button><Button variant="ghost" onClick={() => setConfirm(false)}>Vazgeç</Button>
    </div>}
    <h2>Bağlantı ve oyun</h2><p>İnternet bağlantısı ve en az iki oyuncu gerekir. Tek kişilik antrenman henüz bulunmuyor. Bağlantın kesilirse internetini kontrol et ve aynı cihazdan aynı oda bağlantısını aç.</p>
  </LegalLayout>;
}