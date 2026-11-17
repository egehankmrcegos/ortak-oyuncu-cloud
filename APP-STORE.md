# O mu Bu mu? — App Store hazırlığı

## Durum: gönderime hazır değil

14 Kasım son kontrolü: görsel kaynak dökümü, web/native veri akışı ayrımı ve manifest incelemesi `STORE-REVIEW.md` içinde kayıtlıdır. Gerçek iPhone/TestFlight ekran görüntüleri, imzalı Xcode Privacy Report ve hak sahibinin görsel onayı olmadan gönderim engeli korunur.

14 Kasım 2026. Apple kabulü garanti edilemez. Mevcut oyun sunucuda çalışan TanStack Start uygulamasıdır; yalnızca internet sitesini açan iOS kabı nihai çözüm değildir. Capacitor `server.url` seçeneğini geliştirme içindir diye belgeler; Apple 4.2 kapsamında site sarmalayıcılarını reddedebilir. Yerel oyun ekranları, görseller ve etkileşimler artık ayrı bir pakette bulunur; oyun işlemleri HTTPS üzerinden token doğrulamalı sunucuya gider. İki oyunculu paket testi tarayıcıda geçti; bu gerçek iPhone/TestFlight testi değildir. Gönderim kontrolü gerçek cihaz ve nihai gizlilik incelemesi tamamlanana kadar başarısız kalır.

## Eklenenler

- Capacitor 8 tabanlı iOS/Xcode projesi; iOS 15 ve üzeri, iPhone hedefi, Xcode 26 ve üzeri.
- Önerilen uygulama kimliği: `com.egehankomurcu.omubumu`. App Store Connect'te oluşturmadan önce uygunluğu kontrol edin; Apple kaydı açıldıktan sonra aynı kimlik korunmalı.
- 1024×1024 opak simge, iOS açılış görselleri, web simgeleri.
- Kamera, mikrofon, fotoğraf, kişi veya konum izinleri yok; HTTP erişimi ve yayın WebView hata ayıklaması kapalı, yakınlaştırma açık.
- Web/iOS paylaşım köprüsü, bağlantı uyarısı, uygulama içinden gizlilik ve desteğe erişim.
- AI çağrıları kaldırıldı. Kaynaklı katalog/cache pozitif cevapları kullanılır; bilinmeyen cevap yanlış sayılmaz. Rastgele eşleşmelerde doğrulanmış ortak futbolcu gerekir.
- Sunucu tarafı metin filtresi, oyun içi bildirim, oda içi engelleme ve token doğrulamalı veri silme.
- Günlük temizlik: oyun kayıtları 30 gün, bildirimler 90 gün (en fazla 1 gün gecikme); yayınlanan yeni callback ile çalışır.
- `PrivacyInfo.xcprivacy` proje kaynağına bağlı. Oyuncu kimliği, kullanıcı içeriği ve oyun verileri için uygulama beyanı eklendi; nihai Xcode SDK raporuyla birleştirilmesi gerekir.

## Geliştirici testi — mağazaya gönderilmez

```sh
bun install
NATIVE_DEV_SERVER_URL=https://ortak-oyuncu.lovable.app bun run ios:sync
bun run ios:open
```

Oyun değişiklikleri ayrıca web üzerinde yayınlanmalıdır. Yayındaki sürüm eskiyse test kabı eski oyunu açar. Bu ortamda üretilen Swift paket yolları sandbox bağımlılık konumunu gösterebilir: kaynak Mac'e alındığında mutlaka `bun install` ardından `ios:sync` çalıştırın; üretilen `Package.swift` dosyasını elle değiştirmeyin. Sertifika, özel anahtar veya provisioning dosyalarını projeye koymayın.

## Gönderimden önce zorunlu işler

1. **Gerçek paketlenmiş oyun istemcisi:** oyun ekranları ve görseller uygulama içinde paketlenmeli; mevcut token korumalı sunucu fonksiyonlarına güvenli HTTPS erişimi sağlanmalı. Sunucu sırları cihaz paketine konmamalı. İstemci uygulandı ve yerel paketle iki oyunculu oyun doğrulandı. Gerçek iPhone ve yayın sunucusu bağlantısı henüz doğrulanmadı.
2. **Apple hesabı ve imzalama:** Egehan Kömürcü'nün Apple Developer üyeliği, App Store Connect kaydı, Team seçimi ve Xcode Archive işlemi.
3. **Gerçek iPhone/TestFlight:** küçük/büyük ekran, çentik, klavye, yatay yön, arka plandan dönüş, uçak modu, bağlantı geri gelmesi, iki/altı oyunculu oyun, paylaşma/iptal, yanlış/doğru cevap, tur geçişi, maç sonu ve izin geri alma.
4. **İçerik güvenliği:** özel oda olması otomatik istisna değildir. Apple 1.2 değerlendirmesi için uygunsuz takma ad/cevap filtreleme, uygulama içi raporlama ve kullanıcı engelleme gereksinimi son tasarıma göre ele alınmalı. Filtre, uygulama içi bildirim ve oda içinde ad/cevap gizleyen engelleme eklendi. Bildirimler korumalı game_reports kayıtlarında incelenebilir. İşletmecinin düzenli inceleme, müdahale ve yanıt sürecini yürütmesi gerekir; cihazlar arası kalıcı engelleme henüz yok.
5. **Görsel hakları:** resmî armalar kaldırıldı; kulüpler yalnız renkleriyle gösteriliyor. Diğer görsellerin kullanım hakları teyit edilmeli; Apple/lig/kulüp bağlantısı ima edilmemeli. Üretilen simgede resmî kulüp arması yok.
6. **Veri saklama:** 30/90 günlük günlük temizlik ve oyuncunun kendi verilerini silme işlemi uygulandı; silme maçı sonlandırır. Politika güncellendi. Yeni sunucu sürümü yayınlanmadan günlük HTTP temizliği çalışmaz.
7. **App Privacy:** “Veri toplanmıyor” seçilmemeli. Takma ad, oyuncu kimliği, kullanıcı metinleri, oyun etkileşimi, ölçüm ve hata verileri değerlendirilmelidir. Her kategoride kullanım amacı, kullanıcıyla bağlantı ve takip sorularını nihai iOS veri akışına göre yanıtlayın. AI kullanılmıyor; AI veri aktarımı beyan etmeyin. Xcode Privacy Report ile tüm SDK beyanlarını birleştirin; taslak manifesti güncelleyin. Cihazda WebView yerel depolama kullanımı tek başına UserDefaults gerekçe beyanı değildir; gerçekten kullanılan API'leri esas alın.
8. **Ölçüm izni:** mevcut yayın sitesinde çerezsiz ziyaret ve tıklama ölçümü açık. Hakem izni ölçüm izni değildir. Nihai iOS sürümünde Apple’ın veri izni beklentisi ayrıca ele alınmalı; mevcut politika hukuki uygunluk garantisi değildir.
9. **Mağaza bilgileri:** yaş derecelendirme soruları dürüstçe doldurulmalı, bir yaş sınırı tahmin edilmemeli. Nihai cihaz görüntüleri Xcode/TestFlight sürümünden alınmalı; tarayıcı görüntüleri iPhone uygulaması kanıtı olarak kullanılmamalı. O gün App Store Connect'in istediği ekran boyutlarına göre yüklenmeli.

`native/release-status.json` değerleri yalnız doğrulama gerçekten tamamlandığında güncellenir. `bun run ios:review-check` eksikler varsa çıkış kodu 1 verir; geçmesi Apple kabul garantisi değildir.

## App Store metin taslağı

**Ad:** O mu Bu mu?

**Alt başlık:** İki takım. Tek oyuncu.

**Kategori:** Oyunlar; uygun alt kategori olarak Trivia/Knowledge (App Store Connect'teki güncel seçeneklere göre).

**Açıklama:** Arkadaşlarınla futbol bilgini yarıştır. Oda oluştur, davet bağlantısını paylaş ve iki farklı takımda oynamış futbolcuyu bul. Takımları kendiniz seçin veya rastgele takım modunu deneyin. 3 ya da 5 doğru cevap hedefine ulaş, maçın sonunda turları ve cevapları incele. Hesap gerekmez; takma adınla katıl. İnternet bağlantısı ve en az iki oyuncu gerekir. Cevaplar kaynaklı futbol kayıtlarıyla değerlendirilir; yapay zekâ kullanılmaz. Veri kapsamı sınırlıdır, kayıt dışı cevaplar yanlış sayılmaz. Kulüplerle veya liglerle resmî bağlantısı bulunmaz.

**Destek:** https://ortak-oyuncu.lovable.app/destek

**Gizlilik:** https://ortak-oyuncu.lovable.app/gizlilik

Bu bağlantılar yeni sayfalar yayınlandıktan sonra kullanılabilir; göndermeden önce dışarıdan açıldığını doğrulayın.

## İnceleme notu taslağı — nihai sürüm doğrulandıktan sonra

“This is an invitation-based multiplayer football trivia game. No account or sign-in is required. Internet access and two devices/players are required. On the first device, accept the game privacy notice, enter a nickname and create a room. On the second device, enter another nickname and join using the room code. The host starts the game. Each assigned player selects a club; both clubs are revealed together. Submit the name of a footballer who played for both clubs. Answers are checked against sourced football records without AI calls. Unverified answers are not scored as wrong. Reporting, room-scoped blocking and server data deletion are available in the Player Safety dialog. The app does not request camera, microphone, contacts or location access. Support and privacy information are accessible from the top-right help control.”

Tek cihaz inceleme yolu: ana sayfadaki "Tek başına antrenman yap" bağlantısı. İnceleme notuna ekle: "For single-device review, tap 'Tek başına antrenman yap' on the home screen, choose Barcelona, then answer Messi for Barcelona × Paris Saint-Germain." (Rakip rastgele gelir; farklı rakipte 'Yeni rakip' kullanılabilir.)

## Referanslar

- https://developer.apple.com/app-store/review/guidelines/ — 1.2, 4.2, 5.1
- https://capacitorjs.com/docs/ios
- https://capacitorjs.com/docs/config
- https://developer.apple.com/documentation/bundleresources/privacy_manifest_files
## Paket ve mağaza dosyaları

`bun run ios:sync` önce ayrı yerel oyun paketini oluşturur, sonra iOS'a kopyalar. Varsayılan API adresi yayın oyunudur. Yeni API yayınlanmadan mağaza sürümü çalışmaz. `NATIVE_DEV_SERVER_URL` mağaza sürümünde kullanılamaz. Native paket Google Fonts ve ziyaret ölçümü betiği yüklemez; sistem yazı tipi kullanır.

Mağaza açıklaması ve inceleme notları yukarıdadır. Gerçek iPhone ekran görüntüleri bu ortamda üretilemez; tarayıcı test görüntüleri mağaza görüntüsü olarak sunulmadı.

**Anahtar kelimeler:** futbol,bilgi,arkadaşlar,çok oyunculu,takım,oyuncu,quiz
**Promosyon metni:** İki takımda da oynamış futbolcuyu bul. Arkadaşlarınla özel odada yarış, 3 veya 5 doğru cevapla kazan.
**Telif alanı:** 2026 Egehan Kömürcü (hak sahipliği teyidiyle).

**App Privacy taslağı:** ad (serbest takma ad gerçek ad içerebilir), kullanıcı kimliği (oyuncu UUID), diğer kullanıcı içeriği (cevap/bildirim), oyun içeriği (puan/tur) — uygulama işlevselliği, oyuncu kimliğiyle bağlantılı, takip için kullanılmaz. Destek e-posta iletişim bilgileri ve sunucu teşhis verileri nihai beyanda ayrıca değerlendirilmelidir. Web ziyaret ölçümü native pakete taşınmaz. “Veri toplanmıyor” işaretlenmez.
