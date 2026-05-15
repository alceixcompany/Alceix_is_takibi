# Alceix Panel - Firebase Edition

Next.js 15 App Router, TypeScript, TailwindCSS ve Firebase ile hazırlanmış Alceix Group ajans yönetim paneli.

## Özellikler

- Firebase Auth ile gerçek kullanıcı girişi
- Firestore koleksiyonları: `users`, `firms`, `activities`, `sales`, `production_tasks`
- Admin ekip yönetimi, rol atama, mail değiştirme, aktif/pasif yapma
- Ortak aranacaklar havuzu ve hızlı durum güncelleme
- Satış kapatma, ödeme/prim takibi
- Üretim/görev yönetimi
- Detaylı raporlar, Excel/PDF/CSV indirme
- Mobil uyumlu ve taşmaları azaltılmış arayüz

## Firebase kurulumu

Firebase Console'da:

1. Authentication > Sign-in method > Email/Password etkinleştir.
2. Firestore Database oluştur.
3. Project settings > Service accounts > Generate new private key ile Admin SDK anahtarını indir.
4. `firestore.rules` dosyasını Firebase rules olarak deploy et.

## Env ayarları

`.env.local` oluştur:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ekiplist.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ekiplist
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ekiplist.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=45408157762
NEXT_PUBLIC_FIREBASE_APP_ID=1:45408157762:web:1cf895d4852fcc3706eddb

FIREBASE_PROJECT_ID=ekiplist
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

NEXT_PUBLIC_ENABLE_DEMO_MODE=false
DEMO_LOGIN_PASSWORD=Demo1234!
```

`FIREBASE_PRIVATE_KEY` ve `FIREBASE_CLIENT_EMAIL` sadece server-side env olarak kullanılmalıdır. Client tarafına koymayın.

## Kurulum

```bash
npm install
npm run seed
npm run dev
```

Seed script demo kullanıcıları Firebase Auth'a ve Firestore koleksiyonlarına yazar. Varsayılan şifre:

```text
Demo1234!
```

## Build kontrolü

```bash
npm run typecheck
npm run lint
npm run build
```

## Vercel deploy

Vercel Project Settings > Environment Variables kısmına `.env.local` değerlerini ekle. Production'da `NEXT_PUBLIC_APP_URL` canlı domain olmalı ve `NEXT_PUBLIC_ENABLE_DEMO_MODE=false` kalmalı.

## Notlar

- Supabase bağlantısı kaldırıldı; uygulama Firebase Auth + Firestore + Firebase Admin SDK kullanır.
- Middleware hızlı yönlendirme için session cookie var/yok kontrolü yapar; gerçek kullanıcı doğrulaması server tarafındaki `requireUser()` ile yapılır.
- Rapor export route'u mevcut filtrelere göre Excel/PDF/CSV çıktı üretir.
