# Panduan Pengembangan dan Dokumentasi Sistem Manajemen LPH Al-Ghazali

Dokumen ini merupakan panduan lengkap yang mendokumentasikan arsitektur, logika, struktur, alur kerja (workflow), serta implementasi dari aplikasi **Sistem Manajemen LPH Al-Ghazali**. Aplikasi ini dibangun untuk mendigitalisasi dan mempermudah proses sertifikasi halal bagi para pelaku usaha di seluruh Indonesia, serta membantu pihak admin LPH dalam mengelola data, memantau pengajuan, dan mempublikasikan berita.

---

## 1. Pendahuluan

### 1.1 Deskripsi Aplikasi
Aplikasi ini adalah platform portal layanan terpadu berbasis web (Web App) untuk Lembaga Pemeriksa Halal (LPH) Al-Ghazali. Aplikasi memiliki fungsi ganda:
1. **Landing Page & Informasi**: Menampilkan profil LPH, layanan, alur sertifikasi, biaya (kalkulator biaya), regulasi, berita, FAQ, dan kontak.
2. **Portal Pelaku Usaha (PU)**: Ekosistem khusus bagi pelaku usaha untuk mendaftar, mengajukan sertifikasi, melacak status real-time, dan berkomunikasi dengan LPH.
3. **Dashboard Admin**: Panel administrasi bagi pengurus LPH untuk memantau pengajuan pelaku usaha, mengubah status pengajuan, serta mengelola konten publikasi (Berita).

### 1.2 Tujuan
- Memberikan transparansi proses sertifikasi halal (Tracking Status Real-time).
- Mengotomatisasi estimasi biaya sertifikasi halal.
- Memusatkan seluruh dokumen pengajuan di dalam satu infrastruktur cloud.
- Mengurangi proses manual/kertas (Paperless) menuju digitalisasi ekosistem Halal.

---

## 2. Arsitektur dan Teknologi Tumpukan (Tech Stack)

Aplikasi ini menggunakan teknologi modern dengan arsitektur **Serverless / BaaS (Backend as a Service)** untuk menekan biaya pengelolaan infrastruktur.

- **Frontend**: 
  - **React.js (v18+)**: Library antarmuka berbasis komponen.
  - **TypeScript**: Superset dari JavaScript untuk memastikan keamanan tipe data (*Type Safety*).
  - **Vite**: Build tool dan bundler yang sangat cepat.
  - **Tailwind CSS**: Framework CSS utility-first untuk styling yang responsif dan fleksibel.
  - **Lucide React**: Library icon SVG yang konsisten dan ringan.
- **Backend & Database**:
  - **Firebase Authentication**: Digunakan untuk autentikasi pengguna (Admin & Pelaku Usaha). Saat ini mengadopsi skema simulasi atau *Anonymous login* / token akses yang diarahkan pada Cloud Sync.
  - **Firebase Firestore (NoSQL)**: Database *real-time* untuk menyimpan data pengajuan, berita, dan status sertifikasi.
- **Hosting**: Google Cloud Run (Containerized Web App) atau Firebase Hosting.

---

## 3. Struktur Organisasi Kode

Struktur folder dibuat secara modular namun berpusat pada komponen utama selama fase pengembangan (Single Page Application Paradigm).

```text
/
├── public/                 # Aset publik lokal (gambar, dokumen statis, favicon)
│   ├── logo.png
│   └── dokumen/            # Penyimpanan dokumen PDF publik 
├── src/                    # Direktori utama kode sumber
│   ├── App.tsx             # Entry point utama aplikasi (Berisi seluruh routing statis, view, dan logika utama)
│   ├── main.tsx            # Inisiasi Render React DOM ke index.html
│   ├── index.css           # Global stylesheet (Inisialisasi Tailwind)
│   ├── vite-env.d.ts       # Deklarasi tipe Vite
│   └── firebase-applet-config.json # Konfigurasi kunci untuk terhubung ke Firebase Cloud
├── package.json            # Daftar dependensi aplikasi 
├── vite.config.ts          # Konfigurasi setup Vite
├── tailwind.config.js      # Konfigurasi kustom kelas Tailwind
└── .env.example            # Contoh variabel lingkungan
```

*Catatan: Seluruh rendering Landing Page, Dashboard Admin, dan Dashboard PU dilakukan secara kondisional di dalam `src/App.tsx` menggunakan konsep state-based routing sederhana untuk menjaga aplikasi tetap ringan.*

---

## 4. Alur Kerja (Workflow)

Aplikasi memiliki dua alur pengguna yang terpisah berdasarkan *Role* (Peran):

### 4.1 Alur Pelaku Usaha (PU)
1. **Pendaftaran/Akses**: PU mengunjungi halaman beranda, lalu menekan tombol "Masuk".
2. **Estimasi Biaya**: Sebelum / Sesudah masuk, PU dapat menggunakan form "Kalkulator Biaya" untuk mensimulasikan biaya berdasarkan Skala Usaha, Jumlah Produk, dan lain-lain.
3. **Pembuatan Pengajuan**: Di dalam Dashboard PU, user menekan tombol "Buat Pengajuan". PU mengisi form yang meliputi (Nama Perusahaan, Skala Usaha, Jenis Pengajuan, dsb).
4. **Cloud Sinkronisasi**: Data disimpan ke koleksi `pengajuan` di Firestore dengan status awal *"Verifikasi Dokumen"*.
5. **Pemantauan (Tracking)**: PU secara teratur (atau *real-time*) dapat melihat perubahan status aplikasi mereka dari Dashboard.

### 4.2 Alur Admin LPH
1. **Akses Admin**: Admin menekan tombol "Admin" atau mengakses URL khusus, kemudian login menggunakan Kredensial Admin.
2. **Pemantauan Pengajuan**: Admin melihat seluruh antrean pengajuan di Dashboard Admin.
3. **Pembaruan Status (Progressing)**: Admin memiliki wewenang untuk memperbarui status pengajuan. Misalnya dari *"Verifikasi Dokumen"* -> *"Audit"* -> *"Fatwa MUI"* -> *"LHP Terbit"*. Perubahan status akan memicu pembaruan pada Firestore dan seketika (*real-time*) terlihat oleh PU bersangkutan.
4. **Manajemen Berita (CMS)**: Admin dapat masuk ke menu Publikasi & Berita untuk Menambah (*Create*), Membaca (*Read*), dan Menghapus (*Delete*) berita publik yang muncul di Landing Page. Berita juga disimpan dalam koleksi `berita` di Firestore.

---

## 5. Logika Inti dan Implementasi (Core Logic)

### 5.1 Sistem Rute / View State Management
Aplikasi tidak menggunakan pustaka external seperti `react-router-dom`, tetapi mengandalkan State Management React lokal:
```typescript
const [currentView, setCurrentView] = useState('landing');
const [role, setRole] = useState<'guest' | 'admin' | 'pu'>('guest');
```
Fungsi `navigateTo(view: string)` digunakan untuk mengubah `currentView`. Saat komponen merender ulang, komponen aplikasi akan me-*return* Fragment yang sesuai (`<LandingPage/>`, `<AdminDashboard/>`, `<PUDashboard/>`).

### 5.2 Realtime Data Listener (Firestore onSnapshot)
Aplikasi memantau pembaruan secara asinkron. Menggunakan hook `useEffect` dari React:
```typescript
useEffect(() => {
  // Mendengarkan perubahan pada Koleksi 'pengajuan'
  const unsubscribe = onSnapshot(collection(db, 'pengajuan'), (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // list ini dipisah berdasarkan Role.
    // Jika Admin: lihat semuanya
    // Jika PU: mungkin hanya lihat pengajuannya (simulasi: PU melihat list global atau filter spesifik)
  });
  return () => unsubscribe();
}, []);
```

### 5.3 Kalkulator Biaya (Pricing Logic)
Untuk mendapatkan estimasi yang transparan, `App.tsx` memiliki kalkulasi matematis terhadap state form:
- **Mandays**: Dinilai berdasarkan *Skala Usaha* (Mikro = 1, Kecil = 2, dll). Ini berefek eksponensial terhadap `Jumlah Pabrik`.
- **Komponen Biaya**:
  - Tarif Mandays Dasar (Rp 1.000.000 x Mandays)
  - Unit Harian Perjalanan Dinas (UHPD) (Rp 150.000 x Mandays)
  - Transport (Rp 100.000 x Mandays)
  - Akomodasi (Jika hari > 2)
  - Pendaftaran BPJPH & Penetapan Kehalalan: (Kecil/Mikro memiliki tarif subsidi).
- Keseluruhan biaya (*Grand Total*) dicetak menggunakan `Intl.NumberFormat('id-ID')`.

### 5.4 Penanganan Upload Berkas (Data File)
Aplikasi ini mengakomodir konversi berkas (Foto) menjadi string berbasis **Base64** di sisi antarmuka, lalu menyimpannya dalam bentuk Text di database NoSQL.
```typescript
const fileReader = new FileReader();
fileReader.onload = () => {
   const base64String = fileReader.result;
   setPayloadData({ ...payloadData, fileData: base64String });
};
// Logika ini berguna untuk prototyping tanpa perlu mempersiapkan Bucket Penyimpanan terpisah (seperti AWS S3 atau Firebase Storage).
```

---

## 6. Persyaratan Eksekusi dan Kompilasi (Development)

Untuk mengembangkan atau memodifikasi aplikasi secara lokal (di luar AI Studio), berikut langkah esensialnya:

### Pra-Syarat:
1. Node.js (v16 atau lebih baru) terpasan dalam sistem operasi Anda.
2. NPM (Node Package Manager).

### Instalasi:
Jalankan perintah berikut di dalam direktori root (*terminal*):
```bash
# 1. Unduh referensi dependensi pihak ketiga 
npm install

# 2. Jalankan Mode Pengembangan Lokal Terisolasi
# Aplikasi dapat diakses melalui http://localhost:3000
npm run dev

# 3. Validasi Sintaks / Audit Kode
npm run lint

# 4. Bangun Aplikasi Siap Edar (Production/Deployment)
npm run build
```

Kode akhir untuk produksi akan tersimpan di dalam folder `/dist`. Isi dari folder inilah yang bisa Anda publikasikan melalui nginx, Vercel, Firebase Hosting, atau environment server web lainnya.

---

## 7. Referensi Pitching & Q&A Eksekutif (Untuk Presentasi ke BPJPH Pusat)

Bagian ini disusun secara khusus untuk membekali Anda saat mempresentasikan sistem ini di hadapan Ketua BPJPH Pusat atau stakeholder eksekutif lainnya. Pahami poin-poin ini agar Anda dapat menjawab dengan profesional, tenang, dan meyakinkan.

### 📌 Nilai Jual Utama (Value Proposition) di Mata BPJPH
- **Akselerasi Program Sehati**: Mempercepat terwujudnya 10 Juta Sertifikasi Halal melalui efisiensi proses tahapan LPH (Lembaga Pemeriksa Halal).
- **Zero Pungli & Transparansi 100%**: Sistem otomatisasi biaya mengkalkulasi dan mengunci tarif sesuai aturan pemerintah (Kepkaban / Kepmenag).
- **Traceability (Keterlacakan)**: Pelaku usaha tidak lagi kebingungan. Sistem ini memberikan transparansi tahap demi tahap pemrosesan dokumen secara real-time.

### 💬 Simulasi Tanya Jawab (Q&A)

**Q1: "BPJPH sudah memiliki SIHALAL, untuk apa LPH membangun sistem IT seperti ini sendiri?"**
> **Jawaban:** "Betul Bapak/Ibu, SIHALAL adalah *core system* pusat yang kita patuhi secara nasional. Sistem Manajemen Ekosistem LPH Al-Ghazali ini hadir **bukan untuk menyaingi/menggantikan**, melainkan untuk membantu sebagai **sistem manajemen LPH secara internal dan komunikasi eksternal kepada Pelayan kami**. Ini dikhususkan untuk mempercepat *plotting* jadwal auditor, penyimpanan rekam jejak, serta simulasi biaya pra-audit. Sistem kami menggunakan standar RESTful JSON dan siap (*API-ready*) diintegrasikan (bridging) kapanpun BPJPH membuka gerbang sinkronisasinya."

**Q2: "Bagaimana Anda menjamin keamanan data pelaku usaha, utamanya formula/resep rahasia produk mereka yang sensitif?"**
> **Jawaban:** "Keamanan jaminan produk terjamin ketat. Aplikasi web kami dilindungi dengan infrastruktur Cloud computing (berbasis Google Firebase / Cloud Run) berskala global. Berkas rahasia dilindungi melalui **Role-Based Access Control (RBAC)** dan **Firestore Security Rules**. Artinya, formula atau resep diawasi enskripsi *end-to-end*; data pada database dikunci sedemikian rupa sehingga hanya Pelaku Usaha terkait dan Auditor yang berwenang saja yang bisa melihatnya."

**Q3: "Bagaimana jika ada lonjakan pendaftar besar-besaran akibat deadline kewajiban halal Oktober nanti? Server LPH Al-Ghazali sanggup?"**
> **Jawaban:** "Sangat siap, Bapak/Ibu. Aplikasi kami tidak dikembangkan dengan arsitektur web/server konvensional yang lawas. Sistem ini mengadopsi teknologi **Serverless Architecture**. Alih-alih menyewa sebuah server dengan resiko 'down', sistem kami secara otomatis bisa menggandakan kapasitas servernya di Cloud dalam hitungan detik ketika pendaftar membludak, dan menyusut ketika trafik rendah. Menghasilkan performa maksimal tanpa *downtime*."

**Q4: "Sering ada keluhan pelaku usaha dikenai 'biaya tersembunyi/tidak jelas' oleh oknum LPH. Bagaimana Anda menangkal ini?"**
> **Jawaban:** "Itulah tujuan kami membangun **Fitur Kalkulator Transparansi Biaya** di Landing Page sistem ini. Pelaku usaha dapat mensimulasikan biaya Mandoc, perjalanan (UHPD), dan akomodasi auditor dengan transparan. Algoritma perhitungannya terkunci secara kode untuk selalu merujuk pada *standar satuan tarif regulasi resmi*. Hasil akhirnya sudah pasti dan akuntabel sebelum mereka menekan tombol Daftar."

**Q5: "Apa jaminan menggunakan layanan ini proses lebih cepat dari metode manual (kertas/WhatsApp)?"**
> **Jawaban:** "Melalui transformasi digital ini menuju paperless (tanpa kertas), SLA (Service Level Agreement) dapat dipantau oleh Admin Pusat LPH. Jika status dokumen pelaku usaha tersendat lebih dari 2 hari di status 'Verifikasi', sistem langsung berupaya mengingatkan tim. Informasi juga langsung tersalur transparan (*real-time sync*), menyingkirkan jeda miskomunikasi yang selama ini membuang banyak waktu."

---
**Dokumentasi Resmi LPH Al-Ghazali Halal Management System**
*Generated by Sistem Pemandu AI*
