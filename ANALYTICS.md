# Sahobalar — tashriflar analitikasi

Saytga kirgan odamlarning **davlati**, **viloyati/hududi**, **qurilma modeli**, sahifasi va
manbasi yig'iladi. Har kuni **Gmail** orqali hisobot keladi. Qo'shimcha ravishda veb-dashboard
mavjud.

## Nimalar yig'iladi?

| Ma'lumot | Manba |
|---|---|
| Davlat | Vercel `x-vercel-ip-country` (IP geolokatsiya) |
| Viloyat / hudud | Vercel `x-vercel-ip-country-region` + nomlar jadvali |
| Shahar | Vercel `x-vercel-ip-city` |
| Qurilma modeli | Brauzerdagi User-Agent Client Hints (`navigator.userAgentData`) |
| Platforma, brauzer | Client Hints + User-Agent zaxira tahlili |
| Sahifa, tashqi manba | `location`, `document.referrer` |
| Noyob tashrifchi | `localStorage` dagi tasodifiy ID (cookie emas) |

**IP manzil saqlanmaydi.** `Do Not Track` va `Global Privacy Control` yoqilgan brauzerlar
kuzatilmaydi. Ma'lumotlar 45 kun saqlanadi. Botlar/filtrlar hisobga olinmaydi.

> Cheklov: iPhone/Safari ba'zan qurilma modelini bermaydi — u holda «iPhone» yoki
> «Model aniqlanmadi» ko'rinadi. Android Chrome odatda aniq modelni beradi
> (masalan, `Pixel 7`, `SM-S918B`).

## 1. Lokal sinash

```bash
cd sahobalar
npm install
node server.js
```

So'ngra `http://localhost:4173` ni oching. Lokal rejimda IP geolokatsiya ishlamaydi
(localhost), lekin tashriflar Upstash sozlangan bo'lsa saqlanadi.

Dashboard:

```
http://localhost:4173/api/report
```

## 2. Upstash Redis ulash (saqlash uchun)

Vercel dashboardida:

1. **Storage** → **Create Database** → **Upstash Redis** (Marketplace).
2. Loyihaga (`sahobalar`) ulang.
3. Vercel avtomatik `KV_REST_API_URL`, `KV_REST_API_TOKEN` yoki
   `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` qo'shadi.
   Kod ikkala nomni ham tushunadi.
4. **Redeploy** qiling.

Upstash bepul tarifi bu sayt uchun yetarli.

## 3. Gmail App Password

Oddiy Gmail paroli SMTP uchun ishlamaydi.

1. Google hisobingizda **2 bosqichli tasdiqlash** (2-Step Verification) yoqilgan bo'lsin.
2. https://myaccount.google.com/apppasswords sahifasiga o'ting.
3. Nomi: `Sahobalar analytics` → **Create**.
4. Chiqqan 16 belgili parolni nusxalang (probellar bilan ham bo'ladi).

## 4. Vercel Environment Variables

Vercel → loyiha → **Settings** → **Environment Variables**:

| Nomi | Qiymati |
|---|---|
| `GMAIL_USER` | hisobingiz@gmail.com |
| `GMAIL_APP_PASSWORD` | 16 belgili App Password |
| `REPORT_TO` | hisobot keladigan manzil (odatda o'sha Gmail) |
| `REPORT_KEY` | dashboard uchun uzun tasodifiy kalit |
| `CRON_SECRET` | cron uchun yana bir uzun tasodifiy kalit |
| `SITE_URL` | `https://sahobalar.vercel.app` (ixtiyoriy) |

`REPORT_KEY` va `CRON_SECRET` ni taxmin qilib bo'lmaydigan qilib yarating, masalan:

```bash
openssl rand -hex 24
```

So'ngra **Deployments → Redeploy** qiling.

## 5. Dashboard va qo'lda hisobot

Dashboard (brauzerda):

```
https://sahobalar.vercel.app/api/report?key=REPORT_KEY
```

- `?days=1`, `?days=7`, `?days=30` — davr.
- `?format=json` — JSON ko'rinishida.
- `?send=1` — hozirgi 24 soatlik hisobotni emailga yuborish.

Dashboarddagi **📧 Emailga yuborish** tugmasi ham shu ishni qiladi.

## 6. Kunlik avtomatik hisobot

`vercel.json` ichida cron bor:

```json
{ "path": "/api/cron", "schedule": "0 5 * * *" }
```

Bu **har kuni 05:00 UTC = 10:00 Toshkent** degani. Vercel Hobby tarifida cron kuniga
bir marta ishlaydi. `CRON_SECRET` o'rnatilgan bo'lsa, Vercel cron so'roviga avtomatik
`Authorization: Bearer ...` qo'shadi.

Agar oxirgi 24 soatda tashrif bo'lmasa, bo'sh xat yuborilmaydi.

## 7. Fayllar

```
api/
  track.js      — tashrifni qabul qilish va saqlash
  report.js     — dashboard + qo'lda email
  cron.js       — kunlik email (Vercel Cron)
lib/
  analytics.js  — geolokatsiya, qurilma, Redis, jamlash
  regions.js    — viloyat nomlari (ISO 3166-2)
  email.js      — Gmail SMTP
  report.js     — email HTML/matn va dashboard
js/
  analytics.js  — brauzerdagi yig'uvchi
vercel.json     — cron jadvali
```

## 8. Muammolar

**Dashboardda «Saqlash sozlanmagan» chiqadi** — Upstash ulanmagan yoki env nomlari
noto'g'ri. `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` yoki
`KV_REST_API_URL` / `KV_REST_API_TOKEN` bo'lishi kerak.

**Email kelmayapti** — `GMAIL_USER` va `GMAIL_APP_PASSWORD` to'g'riligini tekshiring.
Gmail App Password 2FA yoqilganda yaratiladi. Vercel **Logs** bo'limida
`[report]` yozuvlarini ko'ring.

**Davlat noto'g'ri** — lokal testda IP geolokatsiya ishlamaydi. Vercelda ishlaydi.
Ba'zi VPN foydalanuvchilari VPN davlatini ko'rsatadi.

**Model «Model aniqlanmadi»** — iPhone/Safari yoki eski brauzer. Bu brauzer cheklovi,
xato emas.
