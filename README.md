# Panduan Deployment ke Cloudflare Pages

Dokumen ini berisi langkah-langkah untuk mendeploy aplikasi LPH Al-Ghazali ke **Cloudflare Pages**.

## Persyaratan
1. Akun [GitHub](https://github.com/).
2. Akun [Cloudflare](https://dash.cloudflare.com/).

## Langkah-langkah Deployment

### 1. Persiapan Repositori
Unggah kode sumber aplikasi Anda ke repositori GitHub.

### 2. Konfigurasi Cloudflare Pages
1. Masuk ke dashboard Cloudflare.
2. Navigasi ke **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Pilih repositori GitHub Anda.
4. Pada bagian **Build settings**, gunakan konfigurasi berikut:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Klik **Save and Deploy**.

### 3. Penanganan Routing SPA (Single Page Application)
Karena aplikasi ini menggunakan React Router (Vite), Anda perlu menambahkan file `_redirects` agar routing berfungsi dengan benar saat halaman direfresh atau diakses langsung lewat URL tertentu.

Kami telah menyediakan file `public/_redirects` untuk Anda. Pastikan file tersebut terikut saat Anda melakukan build.

### 4. Variabel Lingkungan (Environment Variables)
Aplikasi ini menggunakan konfigurasi Firebase yang tersimpan di `firebase-applet-config.json`. Pastikan file tersebut tersedia di repositori Anda atau pindahkan nilainya ke variabel lingkungan di dashboard Cloudflare Pages jika Anda ingin menyembunyikannya dari repositori publik.

Untuk menambahkan variabel di Cloudflare Pages:
1. Buka proyek Anda di Cloudflare Pages.
2. Navigasi ke **Settings** > **Environment variables**.
3. Klik **Add variables**.

## Pemeliharaan
Setiap kali Anda melakukan `push` ke branch utama di GitHub, Cloudflare Pages akan secara otomatis melakukan build ulang dan mendeploy versi terbaru aplikasi Anda.
