// data.js (seed) — Portal Berita Krian
window.CATEGORIES = [
  { key: "berita-utama",           label: "BERITA UTAMA" },
  { key: "krian",                  label: "KRIAN" },
  { key: "ekonomi-bisnis",         label: "EKONOMI & BISNIS" },
  { key: "nasional",               label: "NASIONAL" },
  { key: "properti-infrastruktur", label: "PROPERTI & INFRASTRUKTUR" },
];

window.OTHERS = [
  { key: "teknologi",     label: "TEKNOLOGI" },
  { key: "olahraga",     label: "OLAHRAGA" },
  { key: "hiburan",      label: "HIBURAN" },
  { key: "gaya-hidup",   label: "GAYA HIDUP" },
  { key: "pendidikan",   label: "PENDIDIKAN" },
  { key: "internasional",label: "INTERNASIONAL" },
];

window.SEED_NEWS = [

  // ═══════════════════════════════════════════
  //  BERITA KRIAN, SIDOARJO — MEI 2026
  // ═══════════════════════════════════════════

  {
    id: 101,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "infrastruktur", "jalan", "sidoarjo"],
    title: "Perbaikan Jalan Raya Krian Dimulai, Pemkab Sidoarjo Targetkan Rampung Sebelum Lebaran 2027",
    excerpt: "Dinas PUPR Sidoarjo resmi memulai proyek perbaikan Jalan Raya Krian sepanjang 4,2 km yang rusak akibat genangan dan volume kendaraan berat dari kawasan industri.",
    date: "20 Mei 2026",
    author: "Redaksi Krian",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=75",
    body: "Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Sidoarjo resmi memulai proyek perbaikan Jalan Raya Krian sepanjang 4,2 kilometer, Selasa (20/5/2026).\n\nKepala PUPR Sidoarjo, Ir. Bambang Haryadi, menyatakan kerusakan jalan disebabkan kombinasi genangan air musim hujan dan beban kendaraan berat dari kawasan industri sekitar.\n\n\"Kami menargetkan pekerjaan selesai dalam empat bulan ke depan, sebelum Idul Fitri 2027. Anggaran yang disiapkan sebesar Rp 12,3 miliar dari APBD Kabupaten,\" ujar Bambang.\n\nSelama proses perbaikan, pengendara diminta menggunakan jalur alternatif melalui Desa Jeruk Gamping dan Jalan Lingkar Timur Krian. Petugas dishub disiagakan di titik-titik rawan kemacetan.\n\nWarga sekitar mengapresiasi langkah pemerintah, meski meminta perbaikan dilakukan menyeluruh dan tidak hanya tambal sulam seperti tahun-tahun sebelumnya."
  },
  {
    id: 102,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "banjir", "drainase", "sidoarjo"],
    title: "Banjir Rendam Permukiman Warga Krian Usai Hujan Deras 4 Jam, BPBD Sidoarjo Turunkan Tim",
    excerpt: "Ratusan rumah di Kecamatan Krian terendam setelah hujan lebat mengguyur kawasan tersebut selama empat jam tanpa henti Selasa malam.",
    date: "14 Mei 2026",
    author: "Redaksi Krian",
    image: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1600&q=75",
    body: "Ratusan rumah di Kecamatan Krian, Sidoarjo terendam banjir setinggi 40-80 cm setelah hujan deras mengguyur wilayah tersebut selama empat jam pada Selasa malam (13/5/2026).\n\nBPBD Kabupaten Sidoarjo langsung menurunkan tim evakuasi dan mendirikan posko darurat di Balai Desa Krian. Sedikitnya 312 kepala keluarga terdampak.\n\n\"Saluran drainase di kawasan ini belum mampu menampung debit air saat hujan ekstrem. Kami akan koordinasikan dengan dinas terkait untuk perbaikan permanen,\" kata Kepala BPBD Sidoarjo, Drs. Agus Salim.\n\nWarga yang rumahnya terendam dievakuasi ke gedung SDN Krian 1 yang dijadikan tempat pengungsian sementara. Bantuan logistik berupa makanan siap saji dan selimut telah disalurkan.\n\nBanjir mulai surut sekitar pukul 05.00 WIB hari Rabu. Warga diminta waspada karena prakiraan cuaca menunjukkan potensi hujan lebat masih berlanjut hingga akhir pekan."
  },
  {
    id: 103,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "industri", "kawasan industri", "tenaga kerja"],
    title: "Kawasan Industri Krian Serap 2.800 Tenaga Kerja Baru di Triwulan Pertama 2026",
    excerpt: "Lima perusahaan manufaktur di Kawasan Industri Krian membuka rekrutmen besar-besaran dan menyerap ribuan pekerja lokal Sidoarjo.",
    date: "8 Mei 2026",
    author: "Desk Ekonomi",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=75",
    body: "Lima perusahaan manufaktur yang beroperasi di Kawasan Industri Krian (KIK) berhasil menyerap 2.800 tenaga kerja baru sepanjang Januari-Maret 2026, menurut data Dinas Tenaga Kerja Kabupaten Sidoarjo.\n\nSektor yang paling banyak menyerap tenaga kerja adalah elektronik, tekstil, dan komponen otomotif. Mayoritas pekerja baru berasal dari wilayah Sidoarjo, Mojokerto, dan Gresik.\n\nKepala Disnaker Sidoarjo, Hj. Siti Aminah, menyebut angka ini melampaui target awal sebesar 2.000 pekerja. \"Kami berharap investasi terus meningkat sehingga angka pengangguran di Sidoarjo terus turun,\" ujarnya.\n\nBeberapa perusahaan juga menjalin kerjasama dengan SMK di Krian untuk program magang dan rekrutmen lulusan langsung. Investasi baru di KIK pada 2026 diperkirakan mencapai Rp 450 miliar."
  },
  {
    id: 104,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "pasar", "umkm", "ekonomi lokal"],
    title: "Revitalisasi Pasar Krian Resmi Dimulai, Pedagang Dipindah ke Tempat Sementara",
    excerpt: "Proyek revitalisasi Pasar Krian dengan anggaran Rp 28 miliar akhirnya dimulai. Ratusan pedagang dipindahkan ke lokasi penampungan sementara.",
    date: "5 Mei 2026",
    author: "Metro Krian",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=75",
    body: "Proyek revitalisasi Pasar Krian yang telah lama ditunggu-tunggu akhirnya resmi dimulai pada Senin (5/5/2026). Bupati Sidoarjo hadir langsung memimpin seremonial peletakan batu pertama.\n\nTotal anggaran yang disiapkan mencapai Rp 28 miliar dari kombinasi APBD Kabupaten dan Dana Alokasi Khusus (DAK) pemerintah pusat.\n\nSebanyak 487 pedagang dipindahkan ke tiga lokasi penampungan sementara di sekitar kawasan pasar. Pemkab menjamin fasilitas listrik dan air bersih tersedia di semua lokasi.\n\n\"Pasar baru akan memiliki dua lantai dengan sistem pengelolaan air limbah modern, area parkir terpisah motor dan mobil, serta zona kuliner yang nyaman,\" kata Kepala Dinas Perdagangan Sidoarjo.\n\nPembangunan ditargetkan selesai Desember 2026 dan pasar baru beroperasi awal 2027."
  },
  {
    id: 105,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "pendidikan", "olimpiade sains", "prestasi"],
    title: "SMAN 1 Krian Raih Juara Nasional Olimpiade Sains, Dua Siswa Wakili Indonesia ke Asia",
    excerpt: "Dua siswa SMAN 1 Krian berhasil meraih emas di Olimpiade Sains Nasional dan akan mewakili Indonesia pada kompetisi tingkat Asia di Singapura.",
    date: "3 Mei 2026",
    author: "Desk Pendidikan",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=75",
    body: "Dua siswa SMAN 1 Krian, Fadhil Ramadhan (kelas XII IPA) dan Naura Fitria (kelas XI IPA), berhasil meraih medali emas dalam Olimpiade Sains Nasional (OSN) 2026 bidang Matematika dan Fisika yang digelar di Yogyakarta.\n\nPrestasi gemilang ini membuat keduanya terpilih untuk mewakili Indonesia pada Asia Pacific Mathematics and Science Olympiad (APMSO) yang akan digelar di Singapura, Agustus mendatang.\n\nKepala SMAN 1 Krian, Drs. Sugiyono, M.Pd., mengaku bangga. \"Ini hasil kerja keras mereka selama dua tahun. Kami berharap mereka bisa membawa pulang medali untuk Indonesia.\"\n\nFadhil dan Naura berlatih intensif selama enam bulan dengan bimbingan guru dan mentor dari Universitas Airlangga. Pemkab Sidoarjo memberikan penghargaan berupa beasiswa pendidikan.\n\nPrestasi ini menjadikan SMAN 1 Krian sebagai sekolah terbaik di Sidoarjo untuk kelima kalinya berturut-turut dalam kompetisi sains tingkat nasional."
  },
  {
    id: 106,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "pertanian", "padi", "ketahanan pangan"],
    title: "Petani Krian Panen Raya Padi Varietas Baru, Produktivitas Naik 35 Persen",
    excerpt: "Kelompok tani di Krian memanen padi varietas Inpari 48 yang lebih tahan hama dan menghasilkan 8,2 ton per hektare, jauh melampaui varietas sebelumnya.",
    date: "18 Mei 2026",
    author: "Agro Sidoarjo",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=75",
    body: "Kelompok tani Mekar Jaya di Desa Ponokawan, Kecamatan Krian menggelar panen raya padi varietas Inpari 48, Minggu (18/5/2026). Varietas baru ini menghasilkan 8,2 ton per hektare, meningkat 35 persen dibanding varietas sebelumnya.\n\nKepala Dinas Pertanian Sidoarjo, Ir. Susanto, menyebut keberhasilan ini sebagai contoh nyata program intensifikasi pertanian yang digalakkan sejak awal tahun.\n\n\"Inpari 48 memiliki ketahanan lebih baik terhadap hama wereng dan penyakit blast. Dengan teknik tanam jajar legowo dan pemupukan berimbang, hasilnya sangat memuaskan,\" jelas Susanto.\n\nDinas Pertanian akan mereplikasi program ini ke 12 desa lain di Krian dan kecamatan sekitarnya pada musim tanam berikutnya."
  },
  {
    id: 107,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "olahraga", "futsal", "turnamen"],
    title: "Turnamen Futsal Piala Bupati Sidoarjo 2026 Dibuka di Krian, 64 Tim Bertanding",
    excerpt: "Turnamen futsal terbesar se-Sidoarjo resmi dibuka di GOR Krian. Sebanyak 64 tim dari berbagai kecamatan bersaing memperebutkan trofi bergengsi.",
    date: "10 Mei 2026",
    author: "Sport Krian",
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&q=75",
    body: "Turnamen Futsal Piala Bupati Sidoarjo 2026 resmi dibuka di Gedung Olahraga (GOR) Krian, Sabtu (10/5/2026). Total 64 tim dari 18 kecamatan di Sidoarjo mendaftar dan siap bertanding.\n\nWakil Bupati Sidoarjo, H. Subandi, membuka turnamen secara simbolis dengan tendangan bola pertama. Ia berharap event ini menjadi ajang pembinaan atlet muda Sidoarjo.\n\nTim unggulan yang difavoritkan adalah Krian FC, Taman All Star, Porong United, dan Gedangan Warriors. Total hadiah yang diperebutkan mencapai Rp 75 juta.\n\nPartai final dijadwalkan berlangsung pada 1 Juni 2026. Masyarakat dapat menyaksikan pertandingan secara gratis di GOR Krian setiap hari mulai pukul 08.00-21.00 WIB."
  },
  {
    id: 108,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "umkm", "batik", "ekspor", "ekonomi kreatif"],
    title: "Batik Krian Tembus Pasar Ekspor, Pengrajin Lokal Kantongi Order dari Malaysia dan Belanda",
    excerpt: "Pengrajin batik tulis Krian berhasil menembus pasar internasional setelah tampil di Pameran Batik Nusantara. Order ekspor senilai Rp 320 juta sudah diterima.",
    date: "7 Mei 2026",
    author: "Ekbis Sidoarjo",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=75",
    body: "Kerajinan batik tulis khas Krian berhasil menembus pasar ekspor setelah tampil memukau di Pameran Batik Nusantara 2026 yang digelar di Jakarta Convention Center.\n\nKelompok pengrajin Batik Krian Indah yang beranggotakan 23 pengrajin perempuan mendapatkan pesanan dari pembeli Malaysia dan Belanda senilai total Rp 320 juta.\n\n\"Motif batik kami memadukan corak khas Sidoarjo dengan elemen alam mangrove delta Brantas. Unik dan tidak ada di tempat lain,\" ungkap Ketua Kelompok, Siti Rahayu (46).\n\nDinas Perindustrian dan Perdagangan Sidoarjo memberikan dukungan berupa fasilitasi sertifikasi HAKI, pelatihan packaging, dan pendampingan standar ekspor.\n\nPemerintah Kecamatan Krian berencana membangun Kampung Batik sebagai destinasi wisata edukatif yang memadukan produksi, galeri, dan workshop terbuka untuk umum."
  },
  {
    id: 109,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "kesehatan", "puskesmas", "layanan publik"],
    title: "Puskesmas Krian Kini Buka Layanan 24 Jam, Dilengkapi Unit Gawat Darurat Baru",
    excerpt: "Puskesmas Krian resmi beroperasi 24 jam setelah penambahan tenaga medis dan peresmian unit gawat darurat baru berkapasitas 6 bed.",
    date: "2 Mei 2026",
    author: "Health Desk",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=75",
    body: "Puskesmas Krian, Sidoarjo kini resmi membuka layanan 24 jam mulai 1 Mei 2026 setelah mendapatkan penguatan tenaga medis dan infrastruktur dari Dinas Kesehatan Kabupaten Sidoarjo.\n\nPeresmian dilakukan oleh Kepala Dinas Kesehatan Sidoarjo, dr. Windu Kuncoro, yang juga meresmikan unit gawat darurat (UGD) baru berkapasitas 6 tempat tidur.\n\n\"Dengan layanan 24 jam, warga Krian tidak perlu jauh ke RSUD Sidoarjo untuk penanganan darurat awal,\" jelas dr. Windu.\n\nFasilitas baru meliputi alat EKG digital, USG portable, dan laboratorium mini. Masyarakat dapat mengakses layanan dengan BPJS Kesehatan atau membayar sesuai tarif Perda. Antrian bisa dilakukan online melalui aplikasi e-Puskesmas Sidoarjo."
  },
  {
    id: 110,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "transportasi", "bus", "angkutan umum"],
    title: "Rute Bus Trans Sidoarjo Diperluas Hingga Terminal Krian, Warga Sambut Antusias",
    excerpt: "Pemkab Sidoarjo memperpanjang rute Bus Trans Sidoarjo hingga menjangkau Terminal Krian. Layanan beroperasi setiap 20 menit sekali.",
    date: "15 Mei 2026",
    author: "Metro Transportasi",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=75",
    body: "Pemkab Sidoarjo resmi memperpanjang rute Bus Trans Sidoarjo (BTS) hingga menjangkau Terminal Krian mulai Kamis (15/5/2026). Langkah ini disambut antusias oleh warga yang selama ini kesulitan akses transportasi umum.\n\nRute baru menghubungkan Terminal Krian - Pasar Krian - Bundaran Porong - Terminal Larangan dengan frekuensi setiap 20 menit pada jam sibuk.\n\n\"Tarif tetap Rp 4.000 untuk umum dan Rp 2.000 untuk pelajar dengan kartu pelajar Sidoarjo. Pembayaran bisa menggunakan uang tunai atau dompet digital,\" jelasnya.\n\nDi hari pertama operasi, bus sudah penuh sejak pagi. Warga berharap frekuensi ditingkatkan terutama di jam berangkat dan pulang kerja."
  },
  {
    id: 111,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "lingkungan", "bank sampah", "daur ulang"],
    title: "Bank Sampah Krian Berhasil Olah 12 Ton Sampah per Bulan, Jadi Percontohan Nasional",
    excerpt: "Bank Sampah Induk Krian berhasil mengolah 12 ton sampah per bulan dan mendapat kunjungan dari 15 kabupaten/kota yang ingin mereplikasi programnya.",
    date: "12 Mei 2026",
    author: "Green Sidoarjo",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1600&q=75",
    body: "Bank Sampah Induk (BSI) Krian kini menjadi percontohan nasional pengelolaan sampah berbasis komunitas setelah berhasil mengolah rata-rata 12 ton sampah per bulan.\n\nProgram yang berjalan sejak 2022 ini kini memiliki 47 bank sampah unit di seluruh Kecamatan Krian dengan 3.200 nasabah aktif.\n\n\"Nasabah bisa menukarkan sampah pilah dengan uang, kebutuhan pokok, atau poin untuk membayar tagihan listrik,\" kata Direktur BSI Krian, Dewi Sartika.\n\nBSI Krian juga mengolah sampah organik menjadi kompos yang dijual ke petani lokal. Selama Mei 2026, 15 delegasi dari berbagai kabupaten/kota berkunjung untuk mempelajari model pengelolaan BSI Krian."
  },
  {
    id: 112,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "kuliner", "festival", "umkm", "wisata"],
    title: "Festival Jajanan Krian 2026 Hadirkan 150 Tenant, Transaksi UMKM Capai Rp 2,1 Miliar",
    excerpt: "Festival Jajanan Krian 2026 berlangsung meriah di Alun-Alun Krian selama tiga hari. Lebih dari 10.000 pengunjung memadati area festival.",
    date: "4 Mei 2026",
    author: "Lifestyle Sidoarjo",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=75",
    body: "Festival Jajanan Krian 2026 sukses digelar selama tiga hari, 2-4 Mei 2026, di Alun-Alun Kecamatan Krian. Event tahunan ini menghadirkan 150 tenant makanan dan minuman.\n\nTotal pengunjung selama tiga hari mencapai lebih dari 10.000 orang. Transaksi UMKM yang tercatat mencapai Rp 2,1 miliar, naik 40 persen dibanding festival tahun lalu.\n\nMenu andalan yang paling diminati antara lain lontong balap, bandeng asap, petis udang, sate klopo, dan es dawet Krian yang legendaris.\n\nPemkab Sidoarjo berencana menjadikan Festival Jajanan Krian sebagai agenda wisata tahunan resmi dalam kalender pariwisata Jawa Timur mulai 2027."
  },
  {
    id: 113,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "digitalisasi", "smart city", "pelayanan publik"],
    title: "Kecamatan Krian Luncurkan Aplikasi Layanan Warga, Urus Surat Tak Perlu Antre",
    excerpt: "Kecamatan Krian meluncurkan aplikasi 'Krian Cerdas' yang memungkinkan warga mengurus dokumen kependudukan dan pengaduan secara digital.",
    date: "6 Mei 2026",
    author: "Tech Sidoarjo",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1600&q=75",
    body: "Kecamatan Krian meluncurkan aplikasi 'Krian Cerdas' pada Selasa (6/5/2026), sebuah platform digital yang memungkinkan warga mengurus berbagai dokumen dan layanan administratif tanpa harus datang ke kantor kecamatan.\n\nAplikasi tersedia untuk Android dan iOS, dan bisa diakses gratis oleh seluruh warga ber-KTP Krian.\n\nFitur yang tersedia meliputi permohonan surat keterangan domisili, pengantar SKCK, pengaduan masyarakat, cek status permohonan, dan informasi layanan publik.\n\nPada hari peluncuran, lebih dari 500 warga langsung mengunduh aplikasi. Tim IT Kecamatan siap membantu warga yang kesulitan melalui posko bantuan digital di kantor kecamatan."
  },
  {
    id: 114,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "keamanan", "kamtibmas", "polisi"],
    title: "Polsek Krian Catat Penurunan Angka Kriminalitas 28 Persen, Program Satu Polisi Satu Desa Berhasil",
    excerpt: "Data Polsek Krian menunjukkan penurunan signifikan angka kejahatan berkat program Satu Polisi Satu Desa dan patroli malam di 12 titik rawan.",
    date: "21 Mei 2026",
    author: "Hukum & Keamanan",
    image: "https://images.unsplash.com/photo-1604537466608-109fa2f16c3b?auto=format&fit=crop&w=1600&q=75",
    body: "Polsek Krian mencatat penurunan angka kriminalitas sebesar 28 persen sepanjang Januari-April 2026 dibanding periode yang sama tahun sebelumnya.\n\nKapolsek Krian, AKP Budi Santoso, menyebut keberhasilan ini berkat implementasi program 'Satu Polisi Satu Desa' yang mulai berjalan sejak Januari 2026.\n\n\"Setiap desa di Krian kini memiliki satu anggota polisi yang bertugas sebagai penghubung, mediator konflik warga, dan sumber informasi keamanan,\" jelas AKP Budi.\n\nPolsek juga mengintensifkan patroli malam di 12 titik rawan. Hasilnya, kasus pencurian kendaraan bermotor turun 45 persen. Masyarakat bisa melapor melalui aplikasi LAPOR! yang terintegrasi dengan Polsek Krian."
  },
  {
    id: 115,
    category: "KRIAN",
    navKey: "krian",
    tags: ["krian", "pertanian", "pupuk", "ketahanan pangan"],
    title: "Pemkab Sidoarjo Subsidi Pupuk untuk 1.200 Petani Krian, Daftar via Online",
    excerpt: "Program subsidi pupuk organik dan anorganik dari Pemkab Sidoarjo menyasar 1.200 petani di Kecamatan Krian. Pendaftaran dilakukan secara online.",
    date: "16 Mei 2026",
    author: "Agro Sidoarjo",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1600&q=75",
    body: "Pemerintah Kabupaten Sidoarjo meluncurkan program subsidi pupuk untuk 1.200 petani di Kecamatan Krian sebagai bagian dari program ketahanan pangan 2026.\n\nSubsidi mencakup pupuk urea, NPK, dan pupuk organik dengan kuota 50 kg per petani per musim tanam. Nilai subsidi per petani diperkirakan Rp 350.000 per musim.\n\nPendaftaran dilakukan secara online melalui website Dinas Pertanian Sidoarjo atau datang langsung ke kantor UPTD Pertanian Krian dengan membawa KTP dan kartu tani.\n\nKepala Dinas Pertanian Sidoarjo menegaskan bahwa program ini menyasar petani kecil dengan lahan di bawah 2 hektare yang selama ini paling terdampak kenaikan harga pupuk. Distribusi akan dimulai awal Juni 2026."
  },

  // ═══════════════════════════════════════════
  //  BERITA UMUM
  // ═══════════════════════════════════════════

  {
    id: 1,
    category: "LINGKUNGAN HIDUP",
    navKey: "berita-utama",
    tags: ["lingkungan", "konservasi", "komunitas"],
    title: "Tanam 2000 Bibit Pohon, Komunitas Dorong Konservasi Berbasis Masyarakat",
    excerpt: "Kegiatan penanaman pohon melibatkan warga setempat untuk menjaga daerah resapan dan menumbuhkan kebiasaan merawat lingkungan.",
    date: "21 Januari 2026",
    author: "Redaksi",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=70",
    body: "Kegiatan penanaman pohon dilakukan di beberapa titik dan melibatkan warga setempat.\n\nPanitia menyebut tujuan utama adalah menjaga daerah resapan air, mengurangi risiko longsor, dan membangun kebiasaan merawat lingkungan.\n\nProgram lanjutan akan mencakup pemantauan pertumbuhan bibit, edukasi sekolah, dan pelibatan UMKM lokal."
  },
  {
    id: 2,
    category: "EKONOMI & BISNIS",
    navKey: "ekonomi-bisnis",
    tags: ["ekonomi", "pangan", "umkm"],
    title: "Harga Pangan Stabil, Pedagang Catat Permintaan Naik Menjelang Akhir Bulan",
    excerpt: "Permintaan naik di pasar tradisional, sementara pasokan dinilai aman dan distribusi lebih lancar menjelang akhir bulan.",
    date: "27 Januari 2026",
    author: "Ekbis",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1600&q=70",
    body: "Sejumlah pasar tradisional mencatat permintaan naik dalam dua hari terakhir.\n\nPasokan dinilai aman dan distribusi lebih lancar. Pedagang berharap stabilitas terjaga hingga pekan depan.\n\nAnalis menilai harga yang stabil membantu UMKM makanan mengatur biaya produksi."
  },
  {
    id: 3,
    category: "TEKNOLOGI",
    navKey: "teknologi",
    tags: ["ai", "startup", "umkm"],
    title: "Startup Lokal Rilis Asisten AI untuk UMKM, Fokus Chat Pelanggan",
    excerpt: "Asisten AI ini membantu UMKM menyusun katalog dan menjawab pertanyaan pelanggan lebih cepat dengan analitik sederhana.",
    date: "25 Januari 2026",
    author: "Tech Desk",
    image: "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?auto=format&fit=crop&w=1600&q=70",
    body: "Produk ini menargetkan pemilik toko online untuk menyusun katalog otomatis dan menjawab pertanyaan pelanggan lebih cepat.\n\nFitur termasuk ringkasan produk, rekomendasi upsell, serta analisis pertanyaan yang paling sering muncul."
  },
  {
    id: 7,
    category: "OLAHRAGA",
    navKey: "olahraga",
    tags: ["sepakbola", "timnas", "olahraga"],
    title: "Timnas U-23 Raih Kemenangan Dramatis, Pelatih Soroti Disiplin Bertahan",
    excerpt: "Timnas U-23 menang dramatis. Pelatih meminta pemain memperbaiki transisi bertahan dan disiplin di area berbahaya.",
    date: "26 Januari 2026",
    author: "Desk Bola",
    image: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1600&q=70",
    body: "Laga berjalan ketat dengan intensitas tinggi sejak menit awal.\n\nPelatih mengingatkan pemain agar lebih rapat saat transisi bertahan dan meminimalkan pelanggaran di area berbahaya."
  },
  {
    id: 9,
    category: "GAYA HIDUP",
    navKey: "gaya-hidup",
    tags: ["kuliner", "umkm", "festival"],
    title: "Festival Kuliner Digelar Akhir Pekan, UMKM Catat Transaksi Meningkat",
    excerpt: "Festival kuliner menghadirkan ratusan tenant. UMKM melaporkan transaksi meningkat terutama saat jam makan siang dan akhir pekan.",
    date: "22 Januari 2026",
    author: "Lifestyle",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=70",
    body: "Festival kuliner menampilkan ratusan tenant dari berbagai daerah.\n\nUMKM melaporkan peningkatan transaksi, terutama pada jam makan siang dan akhir pekan.\n\nPanitia menambah sistem pembayaran digital dan area tempat duduk."
  }
];

window.TRENDING = [
  { id: 101, title: "Perbaikan Jalan Raya Krian Dimulai, Pemkab Targetkan Rampung Sebelum Lebaran", date: "20 Mei 2026",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=60" },
  { id: 102, title: "Banjir Rendam Permukiman Warga Krian Usai Hujan Deras 4 Jam", date: "14 Mei 2026",
    image: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=60" },
  { id: 105, title: "SMAN 1 Krian Raih Juara Nasional OSN, Dua Siswa Wakili Indonesia ke Asia", date: "3 Mei 2026",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=60" }
];

window.COMMENTS = [
  { id: 101, title: "Komentar: Semoga jalan Krian cepat selesai diperbaiki!", date: "Baru saja",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=60" },
  { id: 103, title: "Komentar: Alhamdulillah ada lapangan kerja baru di Krian.", date: "10 menit lalu",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=60" }
];
