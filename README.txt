# Portal Berita v6 — Analytics + Backend Auth/API

## Analytics (GA4 / Plausible)
Edit `config.js`:
- `GA_MEASUREMENT_ID`: isi "G-XXXX" (GA4)
- `PLAUSIBLE_DOMAIN`: isi domain kamu (tanpa https)

## Backend hardening (real)
Folder `server/`:
- Express + SQLite + bcrypt (hash password) + JWT
- Endpoint:
  - POST `/api/auth/login`
  - POST `/api/auth/me`
  - GET `/api/articles` (public)
  - GET `/api/articles/:slug` (public)
  - POST/PUT/DELETE `/api/articles` (editor/admin; delete admin only)
  - POST `/api/users` (admin only)

### Jalankan
1) `cd server`
2) `npm install`
3) copy `.env.example` -> `.env`, ganti `JWT_SECRET`
4) `npm run seed`
5) `npm run dev`

Frontend:
- `USE_BACKEND_AUTH: true` (di `config.js`)
- Login di `login.html` akan minta token ke backend dan simpan JWT di localStorage.
- Admin di `admin.html` akan cek JWT via `/api/auth/me`.

Catatan:
- Admin UI saat ini masih mengelola berita di localStorage (mode lama). API CRUD sudah tersedia di server; kalau kamu mau, aku bisa sambungkan form admin ke API supaya CRUD-nya benar-benar server-side.


## Troubleshoot Login
- Kalau login gagal dengan pesan tidak bisa terhubung, pastikan backend jalan: `cd server && npm run dev`.
- Pastikan `config.js` -> `API_BASE` sama dengan URL backend.
- Jalankan `npm run seed` minimal 1x untuk membuat user admin.


## Publish & Auto Generate Static SEO
Di admin ada tombol **Publish & Auto Generate Static SEO**.
- Memanggil API: `POST /api/articles/publish`
- Backend akan simpan ke DB (status published) lalu generate file: `berita/<slug>.html`


## Error 'Cannot GET /berita/<slug>.html'
Itu biasanya karena kamu membuka link preview dari origin backend yang belum serve file statis.
Sekarang backend sudah serve folder project root (termasuk /berita). Jadi buka ulang backend setelah update.


### OUTPUT_ROOT (opsional)
Kalau folder project kamu beda dengan folder server, set `OUTPUT_ROOT` di `server/.env` ke path folder project (yang dipakai Live Server).
Contoh Windows:
OUTPUT_ROOT=C:\\path\\ke\\project

Dengan ini, generator akan menulis `berita/<slug>.html` ke folder tersebut.
