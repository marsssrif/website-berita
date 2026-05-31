# Portal Berita Lokal — Berita Krian

> **Tugas Akhir Mata Kuliah Praktikum Pemrograman Website**  
> Sebuah aplikasi web portal berita lokal dinamis berbasis Client-Server dengan arsitektur RESTful API, autentikasi berbasis Token (JWT), manajemen basis data relasional SQLite, dan notifikasi email otomatis (SMTP).

---

## 🚀 Fitur Utama

### 1. Halaman Publik (Frontend Portal)
* **Desain Responsif & Premium**: Layout modern dua kolom dengan *sticky sidebar* (Trending & Komentar) dan desain kartu berita yang lega.
* **Breaking News Ticker**: Jalur teks berjalan (*marquee*) interaktif yang memuat berita utama terbaru.
* **Fitur Bookmark**: Menyimpan berita favorit secara lokal (*localStorage*) lengkap dengan notifikasi Toast interaktif.
* **Pencarian Real-time**: Fitur pencarian berita instan di beranda dan halaman kategori.
* **Kategori Dinamis**: Navigasi kategori berita terintegrasi dengan filter pencarian.

### 2. Panel Admin & Dashboard Konten (`/admin.html`)
* **Autentikasi JWT (JSON Web Token)**: Autentikasi aman terintegrasi dengan backend menggunakan token yang disimpan di *localStorage*.
* **Manajemen Berita (CRUD)**: Pembuatan, pembacaan, penyuntingan, dan penghapusan artikel berita secara dinamis.
* **Statistik Dashboard**: Informasi visual jumlah total berita, kategori aktif, berita tersimpan, total komentar, serta pesan masuk.
* **Kotak Masuk (Inbox) Press Release & Pesan**:
  * Menampung kiriman naskah siaran pers dan lampiran gambar dari pembaca.
  * **Notifikasi Email Otomatis**: Tombol **Terima** & **Tolak** terintegrasi dengan SMTP Gmail (Nodemailer) untuk mengirim email balasan otomatis secara langsung tanpa membuka *email client*.
  * **Sistem Fallback Cerdas**: Jika koneksi SMTP belum diatur, sistem otomatis membuka jendela email manual (`mailto:`).
  * Fitur hapus pesan dan ekspor/impor seluruh data artikel dalam format JSON.

### 3. Generator Halaman Statis (SEO/OG Friendly)
* Mempublikasikan artikel berita dari database menjadi file HTML statis secara otomatis pada folder `/berita`.
* File statis ini ter-render lengkap dengan tag meta OpenGraph (OG) dan JSON-LD agar ramah SEO dan mudah dibaca oleh bot mesin pencari maupun media sosial.

---

## 🛠️ Spesifikasi Teknologi (Tech Stack)

### Client-Side (Frontend)
* **HTML5**: Struktur halaman semantik.
* **Vanilla CSS3**: Desain kustom menggunakan flexbox, CSS grid, variabel token warna, efek transisi, dan animasi hover premium.
* **Vanilla JavaScript (ES6)**: Manipulasi DOM, AJAX/Fetch API untuk konsumsi REST API, manajemen *state* lokal, dan logika tab/modal interaktif.

### Server-Side (Backend)
* **Node.js & Express.js**: Server runtime dan framework RESTful API.
* **SQLite3**: DBMS relasional ringan tanpa server eksternal untuk menyimpan data pengguna dan artikel.
* **bcryptjs**: Pustaka hashing password satu arah (*salted hashing*) untuk keamanan kredensial.
* **jsonwebtoken (JWT)**: Pembuatan dan verifikasi token akses sesi login.
* **Nodemailer**: Driver pengiriman email otomatis via protokol SMTP.
* **Morgan & Helmet**: Pustaka pencatatan log aktivitas HTTP dan pengerasan keamanan header HTTP server.

---

## 📁 Struktur Direktori Proyek

```text
website-berita/
├── berita/               # Folder output halaman artikel statis (SEO)
├── server/               # Backend Server Node.js
│   ├── node_modules/     # Dependensi backend
│   ├── auth.js           # Middleware JWT & otorisasi role
│   ├── db.js             # Koneksi basis data SQLite
│   ├── init.js           # Inisialisasi skema tabel DB
│   ├── seed.js           # Seeding data pengguna & artikel bawaan
│   ├── server.js         # Entry point Express API Server & router
│   ├── staticGenerator.js# Generator template artikel HTML statis
│   ├── util.js           # Fungsi pembantu (utility)
│   ├── package.json      # Konfigurasi dependensi npm backend
│   └── .env              # Konfigurasi SMTP & port server (diabaikan git)
├── .gitignore            # Konfigurasi pengabaian file rahasia Git
├── admin.html / admin.js # Halaman & logika dashboard admin
├── app.js / styles.css   # Logika utama portal & lembar gaya (CSS)
├── config.js             # Konfigurasi client-side (base API & backend auth toggle)
├── login.html            # Halaman login administrator
├── news.json             # Dataset artikel berita awal untuk seeder
└── README.md             # Dokumentasi proyek
```

---

## ⚙️ Petunjuk Instalasi & Menjalankan Aplikasi

### Langkah 1: Kloning Repositori
```bash
git clone https://github.com/marsssrif/website-berita.git
cd website-berita
```

### Langkah 2: Konfigurasi & Instalasi Dependensi Backend
Masuk ke folder server dan pasang semua library yang dibutuhkan:
```bash
cd server
npm install
```

### Langkah 3: Konfigurasi File Environment (`.env`)
Salin file `.env.example` menjadi `.env` lalu sesuaikan konfigurasi SMTP Gmail Anda untuk mengaktifkan fitur email otomatis:
```bash
cp .env.example .env
```
Isi konfigurasi pada `.env` seperti berikut:
```env
PORT=5175
JWT_SECRET=rahasia_jwt_sangat_panjang_dan_acak
CORS_ORIGIN=http://127.0.0.1:5500

# Konfigurasi SMTP Gmail (Gunakan Sandi Aplikasi 16-Karakter dari Google Akun)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=emailanda@gmail.com
SMTP_PASS=kodesandiaplikasigmail16karakter
SMTP_FROM="Redaksi Berita Krian <emailanda@gmail.com>"
```

### Langkah 4: Seeding Database Awal
Jalankan perintah berikut untuk menginisialisasi database SQLite dan mengisi akun default serta artikel awal dari `news.json`:
```bash
npm run seed
```

### Langkah 5: Jalankan Server Backend
Mulai jalankan server lokal:
```bash
npm run dev
```
Server backend akan aktif pada alamat **`http://localhost:5175`** sekaligus menyajikan file frontend secara statis. Anda dapat langsung membuka alamat tersebut di browser Anda.

---

## 🔐 Kredensial Akun Pengguna Default (Hasil Seeding)

Anda dapat masuk ke halaman **`http://localhost:5175/login.html`** menggunakan kredensial bawaan berikut:

| Role | Username | Password | Otoritas Akses |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Akses Penuh (CRUD Berita, Kelola User, Hapus Inbox) |
| **Editor** | `editor` | `editor123` | Akses Konten (CRUD Berita, Proses Terima/Tolak Inbox) |
| **Viewer** | `viewer` | `viewer123` | Read-Only (Hanya melihat dashboard & statistik) |

---

## 👤 Anggota Tim / Identitas Mahasiswa
* **Nama**: [Nama Lengkap Anda]  
* **NIM**: [Nomor Induk Mahasiswa]  
* **Program Studi**: [Teknik Informatika / Sistem Informasi / dll.]  
* **Mata Kuliah**: Praktikum Pemrograman Website  
