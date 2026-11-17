import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal-layout";
import { SUPPORT_EMAIL } from "@/lib/app-privacy";

export const Route = createFileRoute("/gizlilik")({
  head: () => ({ meta: [
    { title: "Gizlilik Politikası — O mu Bu mu?" },
    { name: "description", content: "O mu Bu mu? oyun verileri, kayıt tabanlı hakem ve veri talepleri." },
    { property: "og:title", content: "O mu Bu mu? — Gizlilik Politikası" },
    { property: "og:description", content: "Oyunda hangi bilgilerin işlendiğini ve gizlilik haklarını öğren." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: PrivacyPage,
});

function PrivacyPage() {
  return <LegalLayout title="Gizlilik Politikası">
    <p className="text-muted-foreground">Son güncelleme: 14 Kasım 2026</p>
    <p>O mu Bu mu?, Egehan Kömürcü tarafından sunulan çevrimiçi bir futbol bilgi oyunudur. İletişim: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    <h2>Oyun verileri</h2>
    <p>Hesap açman gerekmez. Takma adın, oda ve oyuncu kimliklerin, takım seçimlerin, cevapların, puanların ve maç geçmişin Supabase veritabanında saklanır. Takma adlar herkese açık sorgularda görülebilir; gerçek adını veya iletişim bilgilerini kullanma. Oda içeriği oda erişim anahtarıyla korunur. Gizli takım seçimleri iki taraf da seçene kadar diğer oyunculara gösterilmez.</p>
    <p>Odaya geri dönebilmen için oda koduna bağlı oyuncu kimliği ve gizli erişim anahtarı cihazının yerel depolamasında tutulur. Gizlilik tercihin de burada saklanır. Bunlar çerez değildir; sen temizleyene veya uygulamayı kaldırana kadar kalabilir.</p>
    <h2>Yapay zekâ kullanılmaz</h2>
    <p>Takım ve futbolcu doğrulaması kaynaklı futbol kayıtlarıyla yapılır. Oyun sırasında OpenAI veya başka bir yapay zekâ hizmetine istek gönderilmez. Bir futbolcu cevabı yerel katalogda bulunamazsa, yalnızca yazılan futbolcu adı ücretsiz TheSportsDB futbol API'sinde aranabilir. API'den alınan oyuncu ve kulüp adları, kaynak bağlantısıyla Supabase'te bekleyen aday kaydı olarak saklanır. Bu kayıtlar ayrıca doğrulanana kadar oyunda doğru cevap sayılmaz. Kayıtlardan doğrulanamayan cevaplar yanlış sayılmaz; veri kapsamı eksik olabilir.</p>
    <h2>Güvenlik bildirimleri ve engelleme</h2><p>Oyun içinden oyuncu bildirimi gönderebilir ve o odada adını ve cevaplarını gizleyebilirsin. Engelleme yeni kimlikle açılan odalara taşınmaz. Bildirimde oda ve oyuncu kimlikleri, neden ve tarih saklanır; yalnız işletmeci erişebilir. Bildirimleri destek üzerinden takip edebilirsin.</p>
    <h2>Site ölçümü ve barındırma</h2>
    <p>Bu bağımsız web sürümü Lovable ziyaret ölçümü betiği yüklemez. Uygulama Cloudflare Workers üzerinde barındırılır; Cloudflare ve Supabase hizmeti sunmak, güvenliği sağlamak ve teknik sorunları incelemek için bağlantı ve sistem verilerini işleyebilir. Oyun verileri Supabase'te saklanır.</p>
    <h2>Diğer hizmetler ve cihaz izinleri</h2>
    <p>Yazı tipleri Google Fonts üzerinden yüklenir; bu bağlantıda Google IP adresi ve tarayıcı gibi standart bağlantı bilgilerini alabilir. <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google gizlilik politikası</a> geçerlidir. Resmî kulüp armaları kullanılmaz; kulüpler renkleriyle gösterilir. Reklam, ödeme ve herkese açık sohbet özelliği yoktur.</p>
    <p>Google Fonts bağlantısı internet sitesinde kullanılır; paketlenmiş iPhone uygulaması cihazın yazı tiplerini kullanır ve Google Fonts isteği göndermez. Sunucuya bağlantıda IP adresi ve standart istek bilgileri hizmetin çalıştırılması ve güvenliği için barındırma sağlayıcısı tarafından işlenebilir.</p>
    <p>Davet paylaşımı telefonunun paylaşım menüsünü açar. Bağlantıyı kime göndereceğini sen seçersin. Kamera, mikrofon, kişiler, fotoğraf arşivi veya konum izni istenmez. Destek e-postası gönderirsen adresin ve mesajın destek talebini yanıtlamak için Egehan Kömürcü ve e-posta hizmeti Google tarafından işlenir.</p>
    <h2>Saklama, silme ve izni geri alma</h2>
    <p>Oyun kayıtları oda oluşturulduktan 30 gün, güvenlik bildirimleri 90 gün sonra günlük temizlikte kaldırılır (en fazla bir günlük ek süre). Oyun içindeki Oyuncu güvenliği menüsünden sunucudaki kendi kayıtlarını silebilirsin: takma adın ve cevapların anonimleştirilir, oda erişimin iptal edilir ve devam eden maç bitirilir. Destek sayfasındaki cihaz temizliği yalnız yerel bilgileri kaldırır.</p>
    <p>Sunucudaki bilgilerin silinmesi, erişim veya düzeltme talepleri için <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> adresine oda kodun ve takma adınla yaz. Gizli erişim anahtarını paylaşma. Talebin başkasının kayıtlarını etkilememesi için kimlik doğrulaması gerekebilir. Diğer oyuncuların maç kayıtları ve yasal saklama yükümlülükleri ayrıca değerlendirilir.</p>
    <h2>Çocuklar ve değişiklikler</h2>
    <p>Çocuklardan bilerek kişisel bilgi istemeyiz. Veliysen çocuğuna ait verilerin kaldırılması için bize ulaşabilirsin. Politika, kullanılan hizmetler değiştiğinde güncellenir.</p>
  </LegalLayout>;
}
