# Mağaza öncesi inceleme — 14 Kasım 2026

## Kanıt sınırı

Tarayıcıda iPhone ekran boyutlarıyla yapılan kontroller, gerçek iPhone/WKWebView veya TestFlight testi değildir. Bu ortamda macOS, Xcode, imzalı uygulama ve fiziksel iPhone bulunmadığı için mağaza ekran görüntüleri ve birleştirilmiş Xcode Privacy Report üretilemez. Bu kontroller tamamlanmadan gönderim engeli kaldırılmaz.

## Görsel kaynak dökümü

| Kullanım | Projedeki kaynak | Kaynak kanıtı ve durum |
| --- | --- | --- |
| Oyun arka planı | `src/assets/football-night.jpg` | Önceki tasarım çalışmasında oluşturulduğu proje görüşmesinde kayıtlıdır; resmî kulüp arması veya oyuncu fotoğrafı kullanılmaz. Bu kayıt hukuki hak sahipliği belgesi değildir. |
| Uygulama simgesi | `src/assets/app-icon.jpg` | Proje için üretilen futbol simgesi; native/assets ve iOS simgeleri bunun türevleridir. Hak sahibi nihai kullanım teyidini vermelidir. |
| Kulüp işaretleri | `ClubMark` ve kulüp renkleri | Resmî arma görseli değil, renkler ve adın baş harfleri. Resmî işbirliği ima edilmez. |
| Eski tasarım | `football-paper.jpg`, `football-stadium.jpg`, eski `.asset.json` dosyaları | Artık ekranda kullanılmayan tasarım kalıntılarıdır. CSS içindeki eski görsel referansları kaldırılarak yeni pakete taşınmaları önlenmiştir. |

Görsellerin yapay zekâyla üretilmesi tek başına münhasır telif veya üçüncü kişi hakları bakımından garanti sağlamaz. Görsel hakları onayı bu nedenle otomatik olarak verilmez. Kullanıcı tarafından onaylanan kaynak/üretim koşulları nihai gönderim dosyasında tutulmalıdır.

## Veri akışı incelemesi

- Hesap ve sosyal giriş yoktur. Oyuncu UUID ve gizli oda anahtarı cihazdaki oyun önekli yerel depolamada tutulur. İşlemler HTTPS ile Lovable Cloud'a gider; native taşıma `credentials: omit` kullanır.
- Takma ad, kulüp seçimi, futbolcu cevabı, puan, maç geçmişi ve güvenlik bildirimleri oyuncu kimliğiyle bağlantılı işlenir. Takma ad anonimlik garantisi değildir; gerçek ad yazılabilir.
- AI çağrısı, reklam, ödeme, üçüncü taraf takip SDK'sı ve kamera/mikrofon/konum izni oyun akışında yoktur.
- Yayın web sitesinde Lovable ziyaret ve tıklama ölçümü açıktır. Native giriş dosyası ziyaret ölçümü betiğini veya Google Fonts'u yüklemez. Web ziyaret ölçümü ile uygulama verileri birbirinden ayrılmalıdır.
- Web Google Fonts yükler; standart bağlantı bilgileri Google'a ulaşabilir. E-posta desteği Google üzerinden işletmeciye iletilir. Mesaj ve adresi destek talebini yanıtlamak için işlenir.
- Oyun kayıtları 30 gün, bildirimler 90 gün sonrasında günlük silmeye tabidir; en fazla bir gün ek gecikme olabilir. Yerel temizlik sunucu silmesi değildir. Sunucu silmesi erişimi iptal eder, metinleri anonimleştirir ve maçı bitirir.

## App Privacy ve manifest incelemesi

Uygulama manifestinde oyuncu kimliği, takma ad için ad kategorisi, kullanıcı metinleri ve oyun içeriği uygulama işlevselliği amacıyla, oyuncuyla bağlantılı ve takip yapılmadan beyan edilir. “Veri toplanmıyor” seçilmez.

Kurulu Capacitor çekirdeğinin manifesti incelendi; bildirilen required-reason API listesi boştur. Uygulama WebView localStorage kullanır; bu tek başına UserDefaults API gerekçesi değildir. Nihai imzalı Archive tüm transitif SDK'lar için Xcode Privacy Report ile tekrar incelenmelidir; kaynak incelemesi bunun yerine geçmez. Sunucu sağlayıcısının teşhis kayıtları ve saklama koşulları nihai App Store beyanına dahil edilmeden ayrıca doğrulanmalıdır. Destek e-postasının isteğe bağlı açıklama istisnasına uyup uymadığı son gönderim akışına göre değerlendirilmelidir.

Politika teknik veri akışına göre gözden geçirilmiştir; hukuki uygunluk veya Apple kabul garantisi değildir. İşletmeci bölgesel gizlilik yükümlülüklerini, destek taleplerinin saklama süresini ve güvenlik bildirimlerine müdahale sürecini nihai olarak belirlemelidir.

## Gerçek cihazda zorunlu kabul kontrolü

## Bu oturumdaki test sonucu

- 95 otomatik test / 11 test dosyası geçti; güncel web derlemesi hatasız.
- İki gerçek oyuncu oturumuyla oda kurma, katılma, Barcelona/PSG seçimi, bilinmeyen cevabın puanlanmaması, Messi cevabının 1 puan kazandırması, oyuncu bildirimi ve sunucu silmesinden ana sayfaya dönüş doğrulandı.
- 320×568, 390×844, 430×932, 844×390 ve 1280×1800 ana sayfalarında yatay/dikey sayfa taşması yok. Gizlilik açıldı ve yerel temizliğin ardından gizlilik onayı yeniden istendi; bu tarayıcı kontrolünde çalışma zamanı hatası yok.
- Uygulama ve Capacitor çekirdek gizlilik dosyaları geçerli plist olarak okundu. Gönderim kontrolü gerçek cihaz, nihai Archive gizlilik raporu ve görsel hak onayı eksik olduğu için beklendiği gibi engel verdi.
- Mevcut native paketin yayın adresindeki oyun API'si 404 döndürdü. Bu nedenle bu oturumda native paketle oda kurma tamamlanamadı. Yeni sunucu sürümü yayınlanmadan üretim bağlantısı doğrulanmış sayılamaz; otomatik yayın yapılmadı.
- Tarayıcı test görüntüleri `/tmp/browser/final-review` altında geçici kanıttır, mağaza yükleme görseli değildir. Güncel CSS değişikliklerinin native pakete yansıması sonraki `ios:sync` sırasında gerçekleşir.

## Gerçek cihazda zorunlu kabul kontrolü (devam)

- İmzalı paket: küçük ve büyük iPhone, çentik, klavye, yatay yön, yazı büyütme.
- İki ve altı oyuncu: katılma, gizli seçim, doğru/doğrulanamayan cevap, pas, sonraki tur, 3/5 hedefi, maç raporu.
- Arka plana alma/geri dönüş, uçak modu ve bağlantı geri dönüşü, paylaşım ve paylaşımı iptal.
- Bildirme/oda içi engelleme, sunucu silmesi, yerel temizliğin ilgisiz verileri koruması.
- TestFlight sürümünden App Store Connect'in istediği boyutlarda gerçek ekran görüntüleri; tarayıcı görüntülerini mağazaya yüklemeyin.
- Archive Privacy Report, nihai App Privacy cevapları ve hak sahibinin görsel onayı.