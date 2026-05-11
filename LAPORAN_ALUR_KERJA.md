# Laporan Analisis Alur Kerja dan Logika Bisnis (Workflow & Logic)
## Sistem LPH Al-Ghazali Portal Cloud

**Tujuan Dokumen:** 
Dokumen ini disusun sebagai panduan teknis dan fungsional untuk **Tim Internal LPH Al-Ghazali** dan bahan presentasi ke **Ketua BPJPH**, guna memaparkan alur sistem, keamanan, perlindungan data, dan kesesuaian operasional sertifikasi halal berbasis digitalisasi.

---

### 1. Pendahuluan & Filosofi Sistem
Aplikasi LPH Al-Ghazali Portal dirancang sebagai sistem terpadu (SaaS/Software as a Service) yang berbasis Cloud. Portal ini bertugas menjembatani tiga entitas utama (Trilogi Sertifikasi Halal):
1. **Pelaku Usaha (PU):** Masyarakat atau perusahaan yang mengajukan sertifikasi.
2. **LPH Al-Ghazali (Admin & Auditor):** Lembaga Pemeriksa Halal yang melakukan audit lapangan dan pemberkasan.
3. **Regulator (BPJPH & Fatwa UI):** Tujuan akhir laporan hasil tes dan sertifikasi.

Sistem diciptakan **100% digital, paperless, dan real-time**.

### 2. Role-Based Access Control (Logika Hak Akses)
Sistem ini menggunakan logika keamanan bertingkat (*Multi-Tier Security*), dengan batasan akses sesuai profil pengguna:

*   **Pengguna Publik (Guest)**
    *   **Logika Akses:** Bebas eksplorasi pada portal depan tanpa perlu Login.
    *   **Fitur:** Informasi Profil, Sejarah, Regulasi, Berita, dan Direktori Dokumen. Modul 'Regulasi' menampilkan komitmen lembaga terhadap standar (UU Halal, PP, KMA, BPOM, SNI) agar Pelaku Usaha memahami syarat sebelum mendaftar.
*   **Pelaku Usaha (Self-Service Dashboard)**
    *   **Logika Akses:** Harus melakukan Autentikasi (Sign Up/Login). Data diisolasi secara ketat; satu Pelaku Usaha **hanya dapat melihat data pengajuannya sendiri** (berbasis `User ID / UID`).
    *   **Fitur:** Form Pengajuan Sertifikasi Halal secara online dan tracking status *real-time* (Dashboard Pelaku Usaha).
*   **Admin LPH & Auditor (Manajemen Terpusat)**
    *   **Logika Akses:** Kredensial khusus. Admin memiliki hak prerogatif membaca dan mengupdate seluruh data operasional sistem.
    *   **Fitur:** Verifikasi berkas, Update Status Pengajuan, Penugasan tim Auditor, serta manajemen informasi Berita/Kegiatan.

### 3. Alur Kerja Sertifikasi (Core Workflow Analysis)
Proses bisnis yang dikodekan ke dalam aplikasi adalah sebagai berikut:

#### Fase 1: Edukasi dan Registrasi (Onboarding)
1. Pelaku Usaha membuka portal. Mereka membaca pilar-pilar regulasi (ikon *Undang-Undang RI, Peraturan Pemerintah, Keputusan Menag, Keputusan Kepala BPJPH, Peraturan BPOM, SNI*) melalui *modal popup* dinamis. Ini memastikan Pelaku Usaha teredukasi tanpa diarahkan (redirect) ke halaman luar.
2. Pelaku usaha meregistrasikan akun di menu **Login/Pendaftaran** dengan peran sebagai `Pelaku Usaha`.

#### Fase 2: Pengajuan Sertifikasi (Submission)
1. Pelaku Usaha masuk ke **Dashboard Pelaku Usaha** dan mengisi *Form Pengajuan Terpadu*. Data ini memuat administrasi perusahaan, material bahan dasar, dan dokumen legalitas.
2. **Logika Sistem:** Setelah formulir di-submit, Payload data dikirimkan ke database Firestore Cloud dan diberi status inisial `Menunggu Konfirmasi` (Pending). Notifikasi (state) di dashboard otomatis diperbarui secara reaktif tanpa perlu *refresh* halaman.

#### Fase 3: Review dan Audit (Processing)
1. **Admin LPH** login dan melihat **Dashboard LPH**. Di dalamnya terdapat kumpulan matriks pengajuan seluruh Pelaku Usaha.
2. Admin LPH mengubah status data yang diajukan. Alur status mencakup:
    *   `Verifikasi Berkas`: Tahap awal pengecekan dokumen form pendaftaran.
    *   `Penjadwalan Audit`: Menugaskan Auditor berdasarkan kompetensinya.
    *   `Proses Audit Lapangan`: Tahap kunjungan fisik / digital dan verifikasi sampel.
3. Selama proses ini, setiap kali **Admin LPH** menekan tombol '*Update Status*', logika database akan menyinkronisasikan perubahan tersebut sehingga **Pelaku Usaha** yang membuka dashboardnya akan segera melihat status terbarunya detik itu juga (*real-time DB listener*).

#### Fase 4: Laporan Hasil Pemeriksaan (LHP) & Keputusan
Setelah audit dikonfirmasi kebenarannya dan memenuhi skema SNI ISO/IEC 17065:2012 serta KMA:
1. Status diubah menjadi `Selesai` atau `Dokumen Diteruskan`.
2. Admin LPH menerbitkan Laporan Hasil Pemeriksaan (LHP) secara digital yang akan dijadikan landasan objektif oleh tim Majelis Ulama (Sidang Fatwa) dan penerbitan nomor reguler rilis dari **BPJPH**.

### 4. Integritas Keamanan dan Skalabilitas (Untuk Tim BPJPH/Asesor)
*   **Ketidakberpihakan & Transparansi:** Karena semuanya terekam *(logged)* di Cloud Server, jejak pengajuan tidak bisa dihapus atau disembunyikan oleh satu belah pihak. Hal ini menjawab klausul transparansi mutu audit.
*   **Firebase Security Rules (Anti Kebocoran Data):** 
    Logika aplikasi secara fundamental mensyaratkan `isOwner()` untuk setiap data kerahasiaan pabrik/pelaku usaha (seperti komposisi bahan). Audit BPJPH dapat diyakinkan bahwa kompetitor (sesama Pelaku Usaha) tidak bisa saling meretas atau melihat resep bahan pendaftar lainnya.
*   **Konektivitas Fleksibel:** Bisa diakses penuh lewat Smartphone Android/iOS (Responsive Design), menjawab kemudahan birokrasi dan akselerasi 10 juta produk halal yang didorong pemerintah bersama BPJPH.

---

### Kesimpulan
Secara fundamental logis, **Portal LPH Al-Ghazali** bukan sekadar website Company Profile, melainkan murni **Aplikasi Sistem Manajemen Data Audit**. Integrasi Modul Regulasi, Dashboard Pelaku Usaha, Dashboard Admin LPH, hingga fitur Audit Lapangan *(upcoming/development)* merepresentasikan ekosistem utuh yang selaras dengan **Undang-Undang Nomor 33 Tahun 2014 & Perppu Cipta Kerja.**
