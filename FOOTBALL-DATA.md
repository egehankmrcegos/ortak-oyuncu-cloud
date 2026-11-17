# Ücretsiz futbol verisi — ilk pilot

## Kaynak ve lisans

Wikidata yapılandırılmış verisi CC0-1.0 lisanslıdır: https://www.wikidata.org/wiki/Wikidata:Licensing
Bu pilot herhangi bir Wikipedia metni, oyuncu fotoğrafı veya kulüp logosu içermez.
İndirilen kaynak kayıtları `data/football/wikidata-pilot.json` içinde tutulur; her kayıt kaynak bağlantısını taşır.

## Kapsam

- 14 Kasım 2026 tarihinde 7 ülkeden 13 kulüp için kulüp başına en fazla 150 kariyer bildirimi toplandı; bilinen bazı futbolcu kayıtları ayrıca eklendi.
- Snapshot: 1.810 futbolcu, 1.951 kariyer kaydı. Bu bir örneklem; tüm liglerin veya güncel sezonun kapsandığı anlamına gelmez. Sorgular sırasız ve sınırlıdır; sayılar kapsam oranı değildir.
- Lovable Cloud kataloğuna ilk 17 futbolcu ve 21 kariyer kaydı aktarıldı; tamamı inceleme bekliyor. Geri kalan snapshot henüz Cloud'a aktarılmadı.
- Kulüp kimlikleri kaynak etiketleri ve kulüp türleri kontrol edilerek seçildi; milli takımlar ve aynı isimli yerleşimler kapsam dışı bırakıldı.

## Katalog öncelikli hakem — 14 Kasım 2026

- 1.951 pilot kariyer kaydı DBpedia'nın takım, başlangıç yılı ve resmi lig maçı sayısı içeren kariyer dönemleriyle karşılaştırıldı. Kesin kulüp kimliği, 1985 ve sonrası başlangıç ve iki kaynakta aynı pozitif maç sayısı olan **550 kayıt / 501 futbolcu** kullanılabilir olarak ayrıldı. **16 kulüp çifti** için en az bir ortak futbolcu doğrulandı; bu sayı tüm olası eşleşmelerin kapsam oranı değildir.
- 1.401 kayıt hâlâ inceleme bekliyor: eksik veya uyuşmayan kanıtlar var. Son denemede 45 oyuncunun kaynak isteği tamamlanamadı. Bu kayıtlar yanlış cevap anlamına gelmez. Bu işlem manuel kulüp/federasyon incelemesi değil, iki yapılandırılmış kaynak arasında güvenli pozitif karşılaştırmadır.
- Denetim: `data/football/verified-catalog.json`; çalışma kopyası: `src/lib/data/football-reviewed.json` (yalnız sunucu modülünden yüklenir). Tam 1.810 oyuncu isim listesi belirsiz soyadlarını tespit etmek için korunur. Cloud'daki eski pilot kayıtları ayrı durur; 550 kayıt Cloud'a aktarılmış gibi raporlanmaz.
- Cevaplar önce katalogdan kontrol edilir; bulunamayan veya belirsiz cevaplar mevcut kaynaklı canlı AI hakemine gider. Yalnız kaynaklı doğru sonuçlar tam aynı cevap + takım çifti için Cloud'da saklanır. Yanlış sonuçlar saklanmaz. Takım çiftinin kaynaklı önerileri varsa tur sonunda AI çağrısı yapılmaz; en fazla üç isim gösterilir, üçe tamamlamak için ek AI kullanılmaz.
- Bilinen takım doğrulaması zaten yereldir; bilinmeyen takımlarda kaynaklı doğrulama korunur. Rastgele takım havuzu ve oyun kuralları değişmedi. AI kullanım azalması ölçülmüş bir yüzde olarak iddia edilmez; veri kapsamı hâlâ sınırlıdır.

### Kaynak, lisans ve tekrar üretim

DBpedia yapılandırılmış kariyer verisi: https://www.dbpedia.org/resources/ ve https://creativecommons.org/licenses/by-sa/3.0/ — DBpedia ve Wikipedia katkıda bulunanlara atıfla CC-BY-SA-3.0. Wikidata kayıtları CC0-1.0. Üretilen denetim lisans/atıf ve tam kaynak satırlarını taşır; oyuncu fotoğrafı, logo veya makale metni kullanılmaz. `python3 scripts/verify-football-catalog.py` ağ erişimi gerektirir; başarısız gruplar raporlanır, kaynak eksikliği otomatik doğrulama sayılmaz.

## Eksik kayıt neden yanlış sayılmaz?

Wikidata'nın takım üyeliği ve maç sayısı alanları çoğu zaman lig maçlarını belirtir; yalnızca üyelik resmî A takım maçına çıkıldığını kanıtlamaz. Tarihler yalnızca yıl hassasiyetinde olabilir (1 Ocak gerçek transfer tarihi değildir). Eksik kayıt yanlış cevap anlamına gelmez.

Bu yüzden aktarım, cevap değerlendirmesinden ayrıdır. Yalnız kanıtı karşılaştırılmış pozitif kayıtlar AI olmadan kullanılır. Herhangi bir AI maliyetinin sıfırlandığı iddia edilmez; açık veri ücretsiz olsa da Cloud kullanımı mevcut kota ve ücretlendirmeye tabidir.

## Doğrulama ve sonraki geçiş

`bun scripts/audit-football-catalog.ts` kaynak snapshot'ının referanslarını ve doğrulanmış iki-kulüp kapsamını ölçer. `bunx vitest run src/test/football-catalog.test.ts` doğrulanmamış kayıt, 1985 sınırı, sıfır maç, gelecek transfer ve iki-kulüp kanıt kurallarını denetler.

Tam AI'sız geçiş için sınırlandırılmış örnekleme yerine tüm hedef kulüpler sayfalanmalı ve eksik kariyerler kulüp/federasyon maç kaynaklarıyla incelenmelidir. Otomatik günlük güncelleme kurulmadı. Katalog yokluğu negatif karar üretemez.
## 15 Kasım genişletmesi
142 kulüp (7 lig + mevcut İtalyan kulüpleri), 15.803 futbolcu, 29.655 kariyer. `scripts/build-football-catalog.py`: DBpedia kariyer istasyonu ile Wikidata P54 (P580 başlangıç yılı + P1350 maç sayısı) aynı kulüp, aynı başlangıç yılı (≥1985) ve aynı pozitif maç sayısında birleşirse kayıt kullanılır. Çıktı `src/lib/data/football-catalog.json` (sıkıştırılmış satırlar). Çok yeni transferler kaynaklarda maç sayısı yoksa yer almaz; bu cevaplar yanlış sayılmaz.

## Güncel ücretsiz kaynakların denemesi — 15 Kasım 2026

- API-Football Free: günlük 100 istek; `/players?season=2026` hesabın yalnız 2022–2024 sezonlarına erişebildiğini bildirdi. Bu hizmet güncel sezon için kullanılmadı.
- `felipeall/transfermarkt-api`: `/players/454567/stats` canlı denemesinde HTTP 503, kaynak erişim reddi (403). Test sunucusu üretim bağımlılığı yapılmadı. MIT lisansı yalnız kodu kapsar; Transfermarkt verilerinin kullanım hakkını vermez.
- `urazakgul/datafc` kapsam incelemesi: Sofascore araması HTTP 403 döndürdü. TFF maç sayfaları erişilebilir; ancak TFF tüm hakları saklı tutar. Açık lisans/kullanım izni henüz doğrulanmadı.
- TFF için `scripts/sync-football-sources.ts --weeks=1-11` tamamlanmış erkekler Süper Lig maçlarından ilk 11 ve açıkça oyuna giren oyuncuları toplar. Kullanılmayan yedekler, gelecek maçlar ve genç takımlar dahil edilmez. Toplama tarihi, kaynak maç URL'si, federasyon oyuncu/kulüp kimlikleri korunur. Türkçe Windows-1254 kaynak metni doğru çözümlenir.
- `data/football/tff-staging.json` ve Cloud'daki `football_careers` **inceleme havuzudur, hakem girdisi değildir**. Kaynak kimlikleri mevcut oyuncu/kulüplerle doğrulanmadan ve kullanım hakkı netleşmeden yeni kayıtlar otomatik doğru sayılmaz. Maç kanıtı yalnız gözlenen bir maçı belirtir; toplam kariyer maç sayısı gibi sunulmaz.
- İlk toplu tarama: 1–11. haftalar, 99 tamamlanmış maç, 18 kulüp, 429 farklı futbolcu, 3.108 maçta oynama kanıtı; kaynak hatası yok. Aynı 3.108 kayıt Cloud inceleme havuzuna aktarıldı ve sayıları okunarak doğrulandı; tamamı `pending`. Bu sayılar yeni doğrulanmış kariyer sayısı değildir.
- `/api/public/football-sync` yalnız yönetilen zamanlayıcı kimliğiyle çalışır; günlük sınırlı iki maç sayfasını sezon haftaları arasında döndürerek inceleme havuzuna ekler. Bütün sezonun her gün yenilendiği iddia edilmez. İlk toplu tarama ayrı komutla yapılır. Yeni endpoint yayınlanmadan yayın adresindeki zamanlayıcı başarılı olamaz.
- Hatalı/boş güncelleme eski kayıtları silmez; oyun her cevapta dış servislere bağlanmaz, mevcut AI'sız katalog çalışmaya devam eder. Güncelleme henüz yedi ligi tamamlamaz. Transfermarkt/Sofascore erişimi ve kaynak hakları çözülmeden bu kaynaklar üretim hakemine açılmaz.
- Yönetilen görev: `football-sources-staging-daily`, günlük 04:00 UTC (07:00 Türkiye), yaklaşık 30 saniyelik dağıtım toleransı. Yerel test: yetkisiz çağrı 401, yönetilen kimlikle çağrı 200. 114 otomatik test ve antrenmanda takım seçimi/cevap değerlendirmesi geçti. Yayınlama bu çalışmada yapılmadı.

Önceki bölümlerdeki AI fallback ifadeleri tarihsel pilotu anlatır; güncel hakem AI çağırmaz.
