# O mu Bu mu? Futbol

TanStack Start + Supabase uygulaması. Web sürümü Cloudflare Workers üzerinde çalışacak şekilde yapılandırılmıştır. Mevcut Lovable yayını bu projeden bağımsızdır ve çalışmaya devam eder.

## Yerelde çalıştırma

Node.js 22.12 veya üzeri gerekir.

1. `npm install`
2. `.env.example` dosyasını `.env` olarak kopyalayıp Supabase proje URL'si ve publishable key değerlerini girin.
3. `.dev.vars.example` dosyasını `.dev.vars` olarak kopyalayıp sunucuya özel `SUPABASE_SERVICE_ROLE_KEY` değerini girin.
4. `npm run dev`

`SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucu tarafında tutulmalı; istemciye, kaynak koda veya Git deposuna eklenmemelidir.

## Cloudflare Workers yayını

Cloudflare hesabında Workers & Pages bölümünde yeni bir Worker oluşturun. Bu proje için `npm run deploy` komutu derler ve Worker'ı yükler. Yayından önce Worker ayarlarında `SUPABASE_URL` değişkenini ve `SUPABASE_SERVICE_ROLE_KEY` gizli değerini tanımlayın. Web istemcisinin derlenmesi için `VITE_SUPABASE_URL` ve `VITE_SUPABASE_PUBLISHABLE_KEY` değerleri de derleme ortamında bulunmalıdır.

Veritabanı Supabase'te kalır; Cloudflare yalnızca web uygulamasını ve sunucu işlevlerini barındırır. Oda/veri tabloları, RPC fonksiyonları ve Supabase erişim politikaları aynı projede korunmalıdır.

Yeni oda zaman sayacı ve API aday havuzu için `drizzle/migrations/0015_round_countdown_and_api_candidates.sql` dosyasını Supabase SQL Editor'da uygulamadan yeni sürümü yayınlamayın. TheSportsDB'den bulunan oyuncu-kulüp ilişkileri `football_api_candidates` tablosuna `pending` olarak yazılır; inceleme ve doğrulama olmadan oyun cevabını doğru saymaz.

## Komutlar

- `npm run dev` — yerel geliştirme
- `npm run build` — Cloudflare için derleme
- `npm run deploy` — derle ve Cloudflare'a yükle
- `npm run cf-typegen` — Cloudflare Worker tiplerini üret
