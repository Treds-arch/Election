# Bilik Suara — siap deploy ke Vercel

## Isi folder ini
- `index.html` — seluruh tampilan (surat suara, dashboard panitia)
- `api/*.js` — backend (serverless functions), otomatis kedeteksi Vercel
- `lib/store.js` — logika database, dipakai bersama oleh semua `api/*.js`
- `package.json` — daftar dependency (`@vercel/kv`)

Tidak ada langkah build. Tidak ada framework. Vercel akan mendeteksi
`index.html` sebagai halaman statis dan folder `api/` sebagai serverless
functions secara otomatis.

## Langkah deploy (bisa dari HP)

### 1. Unggah ke GitHub
- Buka github.com lewat browser HP, buat repository baru (boleh privat).
- Klik "uploading an existing file", pilih semua isi folder ini
  (`index.html`, `package.json`, folder `api/`, folder `lib/`), commit.

### 2. Import ke Vercel
- Buka vercel.com, login/daftar (bisa pakai akun GitHub yang sama).
- "Add New" → "Project" → pilih repository yang barusan dibuat.
- Framework Preset biarkan "Other". Tidak perlu ubah Build Command apa pun.
- Klik **Deploy**. Tunggu sampai selesai (1-2 menit), abaikan dulu kalau
  ada peringatan soal `@vercel/kv` belum konek — itu wajar di step ini.

### 3. Tambahkan database (Vercel KV)
- Di dashboard project yang baru dibuat, buka tab **Storage**.
- Klik **Create Database** → pilih **KV** (Redis, gratis di paket Hobby).
- Beri nama, pilih region (terdekat dengan Indonesia: Singapore kalau ada).
- Setelah dibuat, klik **Connect Project**, pilih project ini, konfirmasi.
  Ini otomatis menambahkan environment variable yang dibutuhkan
  (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) — tidak perlu isi manual.

### 4. Redeploy
- Balik ke tab **Deployments**, klik titik tiga di deployment terakhir →
  **Redeploy**. Ini supaya environment variable KV yang baru ditambahkan
  ke-load.

### 5. Selesai
- Buka domain yang diberikan Vercel (`nama-project.vercel.app`).
- Pertama kali dibuka, akan muncul layar setup — isi judul, kandidat, PIN.
- Link itulah yang dibagikan ke maba. Sama-sama dari domain itu juga,
  panitia masuk lewat "Panitia? Buka dashboard" + PIN.

## Yang berbeda dari versi sebelumnya (artifact Claude)
- Datanya sekarang beneran tersimpan di database (Vercel KV / Redis),
  bukan `window.storage` yang cuma jalan di dalam Claude.
- Pemeriksaan "satu NIM satu suara" sekarang atomic di server — sudah
  diuji tahan terhadap puluhan submit bersamaan dari NIM yang sama.
- PIN panitia tidak pernah dikirim ke browser siapa pun (dulu di
  `window.storage` semua orang bisa baca PIN-nya kalau mau).
- Jalan normal di HP, laptop, browser apa pun — tidak ada batasan
  "harus web/desktop" seperti artifact Claude.

## Kalau mau reset total (pemilihan baru dari nol)
Buka tab **Storage** → KV database → **Data Browser**, hapus semua key.
Atau paling gampang: buat project Vercel baru + KV database baru.
