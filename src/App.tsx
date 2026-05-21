import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, onAuthStateChanged, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, initializeFirestore, collection, onSnapshot, getDoc, addDoc, updateDoc, doc, serverTimestamp, deleteDoc, setDoc, query, where } from 'firebase/firestore';
import { Leaf, Home, FileText, LogOut, PlusCircle, Settings, CheckCircle, Clock, Search, Briefcase, FileSignature, UploadCloud, ArrowLeft, ArrowRight, ShieldCheck, Zap, MonitorSmartphone, UserCheck, Newspaper, Edit, Trash2, X, Image as ImageIcon, Route, Coins, ChevronDown, ChevronRight, Calculator, Receipt, CalendarDays, Activity, Video, Link, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin, History, Target, Award, Network, Users, BookOpen, Handshake, Menu, Scale, Landmark, CheckCircle2, FlaskConical, FileEdit, Globe, Key, Download } from 'lucide-react';
import CryptoJS from 'crypto-js';

const OrgCard = ({ title, name, list, className = "", noHover = false, allowUpload = false, defaultImages = {}, onImageChange }: any) => {
    const [images, setImages] = useState<Record<string, string>>({});

    const getImage = (identifier: string) => images[identifier] || defaultImages[identifier];

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, itemIdentifier: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImages(prev => ({ ...prev, [itemIdentifier]: url }));
            
            if (onImageChange) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    onImageChange(itemIdentifier, reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.style.display = 'none';
    };

    return (
        <div className={`flex flex-col bg-white border-2 border-emerald-700 rounded-xl shadow-lg shadow-emerald-900/5 overflow-hidden ring-1 ring-emerald-500/20 ${!noHover ? 'hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-900/10 hover:border-emerald-600 transition-all duration-300' : ''} ${className}`}>
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 p-2.5">
                <h3 className="font-extrabold text-white text-[11px] text-center leading-tight uppercase tracking-widest drop-shadow-sm">{title}</h3>
            </div>
            {(name || list) && (
                <div className="p-3.5 flex-grow flex flex-col justify-center bg-gradient-to-br from-white to-emerald-50/50">
                    {name && (
                        <div className="flex flex-col items-center mb-2 last:mb-0 group relative">
                            {getImage(name) && <img src={getImage(name)} alt={name} onError={handleImageError} className="w-12 h-12 rounded-full object-cover mb-1 border border-emerald-200" />}
                            <p className="text-[11px] font-bold text-gray-800 text-center uppercase tracking-wide">{name}</p>
                            {allowUpload && (
                                <label className="text-[8px] text-emerald-600 cursor-pointer mt-0.5 hover:underline flex items-center bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <UploadCloud className="w-2.5 h-2.5 mr-0.5" /> Foto Profil
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, name)} />
                                </label>
                            )}
                        </div>
                    )}
                    {list && (
                        <ol className="text-[10px] font-semibold text-gray-700 text-left list-decimal pl-4 space-y-3 m-0 marker:text-emerald-600">
                            {list.map((item: string, i: number) => (
                                <li key={i} className="pl-1 group relative">
                                    <div className="flex flex-col items-start w-full">
                                        <span>{item}</span>
                                        {getImage(item) && <img src={getImage(item)} alt={item} onError={handleImageError} className="mt-1 w-12 h-12 rounded-full object-cover border border-emerald-200" />}
                                        {allowUpload && (
                                            <label className="text-[8px] text-emerald-600 cursor-pointer mt-1 hover:underline flex items-center bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <UploadCloud className="w-2.5 h-2.5 mr-0.5" /> Foto Profil
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, item)} />
                                            </label>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            )}
        </div>
    );
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // If we catch a permission error here, we should probably set an error state instead of crashing.
}

import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  forceLongPolling: true,
} as any, firebaseConfig.firestoreDatabaseId);
// @ts-ignore
const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'lph-alghazali-app';

const REKAP_REGULASI_DATA = [
  {
    id: 'uu-33-2014',
    nomor: 'Undang-Undang Nomor 33 Tahun 2014',
    kategori: 'Undang-Undang',
    tentang: 'Jaminan Produk Halal (JPH)',
    deskripsi: 'Dasar hukum utama penyelenggaraan Jaminan Produk Halal di Indonesia. Mewajibkan seluruh produk yang masuk, beredar, dan diperdagangkan wajib bersertifikat halal secara bertahap.',
    tahun: '2014',
    referensiUrl: 'https://bpjph.halal.go.id/',
    pasalPenting: [
      { pasal: 'Pasal 4', isi: 'Produk yang masuk, beredar, dan diperdagangkan di wilayah Indonesia wajib bersertifikat halal.' },
      { pasal: 'Pasal 13', isi: 'LPH menyelenggarakan pemeriksaan dan/atau pengujian kehalalan Produk setelah memperoleh akreditasi dari BPJPH.' },
      { pasal: 'Pasal 26', isi: 'Pelaku Usaha wajib menjaga konsistensi kehalalan produk yang telah bersertifikat.' }
    ],
    isiLengkap: `UNDANG-UNDANG REPUBLIK INDONESIA NOMOR 33 TAHUN 2014 TENTANG JAMINAN PRODUK HALAL

Menimbang:
Bahwa untuk menjamin kemerdekaan tiap-tiap penduduk untuk memeluk agamanya masing-masing dan untuk beribadat menurut agamanya dan kepercayaannya itu, negara berkewajiban memberikan perlindungan dan jaminan tentang kehalalan produk yang dikonsumsi dan digunakan masyarakat.

BAB I: KETENTUAN UMUM
Pasal 1:
1. Produk adalah barang dan/atau jasa yang terkait dengan makanan, minuman, obat, kosmetik, produk kimiawi, produk biologi, produk rekayasa genetik, serta barang gunaan yang dipakai, digunakan, atau dimanfaatkan oleh masyarakat.
2. Jaminan Produk Halal (JPH) adalah kepastian hukum terhadap kehalalan suatu produk yang dibuktikan dengan Sertifikat Halal.

BAB II: PENYELENGGARAAN JAMINAN PRODUK HALAL
Pasal 4:
Produk yang masuk, beredar, dan diperdagangkan di wilayah Indonesia wajib bersertifikat halal.

BAB III: LEMBAGA PEMERIKSA HALAL (LPH)
Pasal 13:
LPH menyelenggarakan pemeriksaan dan/atau pengujian kehalalan Produk setelah memperoleh akreditasi dari BPJPH dan bekerja sama dengan MUI.`
  },
  {
    id: 'uu-6-2023',
    nomor: 'Undang-Undang Nomor 6 Tahun 2023',
    kategori: 'Undang-Undang',
    tentang: 'Penetapan Perpu Cipta Kerja Menjadi UU (Klaster JPH)',
    deskripsi: 'Mengubah beberapa ketentuan dalam Undang-Undang JPH demi mempermudah dan mendeformalkan proses sertifikasi bagi UMK, memperkenalkan skema pernyataan pelaku usaha (Self Declare) secara legal.',
    tahun: '2023',
    referensiUrl: 'https://bpjph.halal.go.id/',
    pasalPenting: [
      { pasal: 'Pasal 4A', isi: 'Bagi Pelaku Usaha Mikro dan Kecil (UMK), kewajiban bersertifikat halal didasarkan atas pernyataan pelaku usaha (Self Declare).' },
      { pasal: 'Pasal 48', isi: 'Sertifikat Halal kini berlaku untuk selamanya (seumur hidup) sepanjang pelaku usaha memelihara konsistensi kehalalan bahan dan proses.' }
    ],
    isiLengkap: `UNDANG-UNDANG REPUBLIK INDONESIA NOMOR 6 TAHUN 2023 TENTANG PENETAPAN PERATURAN PEMERINTAH PENGGANTI UNDANG-UNDANG NOMOR 2 TAHUN 2022 TENTANG CIPTA KERJA MENJADI UNDANG-UNDANG

KLASTER JAMINAN PRODUK HALAL (Penyederhanaan & Akselerasi Sertifikasi):

Mengubah beberapa ketentuan utama dalam Undang-Undang Nomor 33 Tahun 2014 tentang Jaminan Produk Halal:

1. Penyataan Halal Pelaku Usaha (Self Declare):
Untuk mempermudah kelompok Usaha Mikro dan Kecil (UMK), kewajiban sertifikasi halal dapat dilakukan berdasarkan Pernyataan Halal Pelaku Usaha demi akselerasi kewajiban sertifikasi halal.

2. Masa Berlaku Sertifikat Halal:
Sertifikat Halal kini berlaku untuk selamanya (seumur hidup) sepanjang Pelaku Usaha memelihara konsistensi kehalalan bahan dan proses produk halal yang disepakati.`
  },
  {
    id: 'pp-39-2021',
    nomor: 'Peraturan Pemerintah Nomor 39 Tahun 2021',
    kategori: 'Peraturan Pemerintah',
    tentang: 'Penyelenggaraan Bidang Jaminan Produk Halal',
    deskripsi: 'Aturan turunan UU JPH yang merinci penahapan kewajiban bersertifikat halal bagi berbagai kategori produk, serta tugas operasional BPJPH, LPH, dan auditor halal.',
    tahun: '2021',
    referensiUrl: 'https://bpjph.halal.go.id/',
    pasalPenting: [
      { pasal: 'Pasal 2', isi: 'Penahapan pertama kewajiban bersertifikat halal bagi produk makanan, minuman serta hasil sembelihan dimulai 17 Oktober 2019 s.d. 17 Oktober 2024.' },
      { pasal: 'Pasal 72', isi: 'Auditor Halal diangkat, diberhentikan, dan diawasi kinerjanya oleh BPJPH dengan syarat memiliki kompetensi syariah dan sains.' }
    ],
    isiLengkap: `PERATURAN PEMERINTAH NOMOR 39 TAHUN 2021 TENTANG PENYELENGGARAAN BIDANG JAMINAN PRODUK HALAL

BAB I: KETENTUAN UMUM
Pasal 1:
Penyelenggaraan Jaminan Produk Halal (JPH) mencakup perencanaan, penetapan standar, pendaftaran, pemeriksaan, pengujian, penetapan kehalalan, pengawasan, pembiayaan, serta pembinaan pelaku usaha.

BAB II: TAHAPAN KEWAJIBAN BERSERTIFIKAT HALAL
Pasal 2:
1. Tahapan pertama kewajiban bersertifikat halal bagi produk makanan, minuman serta hasil sembelihan dan jasa penyembelihan berlangsung hingga 17 Oktober 2024.
2. Penahapan berikutnya diatur lebih rinci bagi obat tradisional, kosmetik, alat kesehatan, dan produk gunaan lainnya.`
  },
  {
    id: 'kma-748-2021',
    nomor: 'Keputusan Menteri Agama Nomor 748 Tahun 2021',
    kategori: 'Keputusan Menteri Agama',
    tentang: 'Jenis Produk yang Wajib Bersertifikat Halal',
    deskripsi: 'Keputusan definitif menteri yang merinci ratusan klasifikasi barang komoditas dan jasa industri yang wajib mengantongi sertifikat halal di Indonesia.',
    tahun: '2021',
    referensiUrl: 'https://bpjph.halal.go.id/',
    pasalPenting: [
      { pasal: 'Keputusan Kesatu', isi: 'Menetapkan jenis produk wajib bersertifikasi halal yang dikelompokkan ke dalam kategori barang (pangan, obat, kosmetik) dan jasa.' },
      { pasal: 'Kategori Jasa', isi: 'Jasa penyembelihan, pengolahan, penyimpanan, pengemasan, pendistribusian, penjualan, dan penyajian wajib bersertifikat halal.' }
    ],
    isiLengkap: `KEPUTUSAN MENTERI AGAMA REPUBLIK INDONESIA NOMOR 748 TAHUN 2021 TENTANG JENIS PRODUK YANG WAJIB BERSERTIFIKAT HALAL

Menetapkan:
Menetapkan kelompok jenis produk yang wajib bersertifikat halal meliputi:
A. Barang:
   1. Makanan dan minuman
   2. Obat tradisional, suplemen kesehatan, obat bebas, kosmetika
   3. Produk kimia, biologi, rekayasa genetika
   4. Barang gunaan (sandang, penutup kepala, aksesoris, dll)
B. Jasa:
   1. Jasa penyembelihan hewan
   2. Jasa pengolahan pangan
   3. Jasa penyimpanan, pengangkutan, pendistribusian, penyajian`
  },
  {
    id: 'kma-1360-2021',
    nomor: 'Keputusan Menteri Agama Nomor 1360 Tahun 2021',
    kategori: 'Keputusan Menteri Agama',
    tentang: 'Bahan yang Dikecualikan dari Kewajiban Bersertifikat Halal',
    deskripsi: 'Menyediakan daftar putih (positive list/white list) bahan alamiah murni non-titik kritis yang terbebas dari tuntutan sertifikasi halal, sehingga tidak perlu diaudit detail bahannya.',
    tahun: '2021',
    referensiUrl: 'https://bpjph.halal.go.id/',
    pasalPenting: [
      { pasal: 'Diktum Kesatu', isi: 'Bahan dari alam murni tanpa perlakuan pengolahan kimiawi dikecualikan dari kewajiban bersertifikat halal.' },
      { pasal: 'Lampiran', isi: 'Mencakup air murni, sayuran segar, buah-buahan organik tanpa pengawet sintetis, serta bahan mineral alamiah murni.' }
    ],
    isiLengkap: `KEPUTUSAN MENTERI AGAMA REPUBLIK INDONESIA NOMOR 1360 TAHUN 2021 TENTANG BAHAN YANG DIKECUALIKAN DARI KEWAJIBAN BERSERTIFIKAT HALAL

Diktum Kesatu:
Menetapkan bahan yang dikecualikan dari kewajiban bersertifikat halal demi memberikan kepastian hukum dan kemudahan bagi Pelaku Usaha.

Kategori yang dikecualikan meliputi:
1. Bahan yang berasal dari alam berupa tumbuhan, hewan segar non-sembelihan yang halal, mikroorganisme, atau air tanah tanpa proses penambahan formulasi kimia.
2. Bahan yang tidak memiliki potensi kontaminasi najis atau zat non-halal (positive list).`
  },
  {
    id: 'per-bpjph-1-2023',
    nomor: 'Peraturan BPJPH Nomor 1 Tahun 2023',
    kategori: 'Keputusan Kepala BPJPH',
    tentang: 'Tata Cara Sertifikasi Halal dengan Pernyataan Pelaku Usaha (Self Declare)',
    deskripsi: 'Mengatur regulasi operasional serta standarisasi persyaratan, kriteria bahan, dan proses pendampingan PPH dalam menerbitkan sertifikat halal berbasis Self Declare.',
    tahun: '2023',
    referensiUrl: 'https://bpjph.halal.go.id/',
    pasalPenting: [
      { pasal: 'Pasal 3', isi: 'Kriteria bahan harus positif list (tidak berisiko) dan proses pengolahan sederhana secara manual.' },
      { pasal: 'Pasal 9', isi: 'Pendamping PPH melakukan verifikasi dan validasi langsung ke lokasi produksi sebelum diteruskan ke Komisi/Komite Fatwa.' }
    ],
    isiLengkap: `PERATURAN BADAN PENYELENGGARA JAMINAN PRODUK HALAL NOMOR 1 TAHUN 2023 TENTANG TATA CARA SERTIFIKASI HALAL DENGAN PERNYATAAN PELAKU USAHA (SELF DECLARE)

Mengatur tata kelola dan operasional pelaksanaan Program Sehati (Sertifikasi Halal Gratis) skema self declare:

1. Pelaku Usaha Mikro & Kecil berhak mengajukan permohonan melalui akun Sihalal.
2. Harus ada Pendamping PPH yang terdaftar resmi untuk melakukan verifikasi ke lapangan.
3. Seluruh bahan baku wajib bermerek halal atau tergolong positive list bersertifikasi.`
  },
  {
    id: 'kep-bpjph-150-2022',
    nomor: 'Keputusan Kepala BPJPH Nomor 150 Tahun 2022',
    kategori: 'Keputusan Kepala BPJPH',
    tentang: 'Pedoman Penyelenggaraan Sertifikasi Halal Reguler',
    deskripsi: 'Petunjuk teknis dan administratif pendaftaran skema reguler (non-self declare) lewat portal Sihalal, penugasan LPH, audit lapangan, hingga penerbitan sertifikat.',
    tahun: '2022',
    referensiUrl: 'https://bpjph.halal.go.id/',
    pasalPenting: [
      { pasal: 'Poin V', isi: 'Alur penetapan pilihan LPH oleh Pelaku Usaha melalui sistem Sihalal secara transparan.' },
      { pasal: 'Poin VIII', isi: 'Waktu maksimal pemrosesan pemeriksaan berkas oleh LPH hingga penerbitan laporan LHP.' }
    ],
    isiLengkap: `KEPUTUSAN KEPALA BADAN PENYELENGGARA JAMINAN PRODUK HALAL NOMOR 150 TAHUN 2022 TENTANG PEDOMAN PENYELENGGARAAN SERTIFIKASI HALAL

Menetapkan aturan teknis terstruktur mengenai:
- Tata cara pendaftaran sertifikasi skema reguler.
- Standarisasi pelaporan hasil audit oleh LPH ke BPJPH Melalui Sihalal.
- Validitas penugasan auditor halal di lokasi usaha.`
  },
  {
    id: 'bpom-8-2021',
    nomor: 'Peraturan BPOM Nomor 8 Tahun 2021',
    kategori: 'Peraturan BPOM',
    tentang: 'Pengawasan Penggunaan Label Halal pada Pangan Olahan',
    deskripsi: 'Kerjasama integratif BPOM dan BPJPH pasca perubahan logo halal nasional untuk memastikan label kemasan beredar sesuai ketentuan regulasi kesehatan dan syariat.',
    tahun: '2021',
    referensiUrl: 'https://bpjph.halal.go.id/',
    pasalPenting: [
      { pasal: 'Pasal 5', isi: 'Pangan olahan yang bersertifikat wajib mencantumkan logo kemasan Halal Indonesia beserta nomor registrasi pendaftaran.' },
      { pasal: 'Pasal 12', isi: 'Sanksi pencantuman klaim halal sepihak tanpa sertifikasi resmi dari BPJPH mulai dari teguran hingga penarikan izin edar.' }
    ],
    isiLengkap: `PERATURAN BADAN PENGAWAS OBAT DAN MAKANAN NOMOR 8 TAHUN 2021 TENTANG PENGAWASAN PENGGUNAAN LABEL HALAL

Mengatur pengawasan post-market terhadap produk makanan dan minuman yang beredar di pasaran:
1. Label halal wajib dicetak pada posisi yang mudah terlihat dan terbaca di kemasan utama.
2. Integrasi data sinkron antara BPOM, BPJPH dan produsen pangan olahan.`
  },
  {
    id: 'sni-17065-2012',
    nomor: 'SNI ISO/IEC 17065:2012',
    kategori: 'SNI',
    tentang: 'Persyaratan untuk Lembaga Sertifikasi Produk, Proses, dan Jasa',
    deskripsi: 'Standar baku internasional yang diadopsi sebagai syarat mutlak akreditasi operasional LPH Al-Ghazali demi memelihara integritas pengujian dan kepatuhan sistem sertifikasi.',
    tahun: '2012',
    referensiUrl: 'https://bpjph.halal.go.id/',
    pasalPenting: [
      { pasal: 'Klausul 4.2', isi: 'Ketidakberpihakan mutlak: LPH tidak boleh terafiliasi secara komersial dengan pelaku usaha yang diaudit.' },
      { pasal: 'Klausul 7.4', isi: 'Prosedur evaluasi dan verifikasi data hasil uji laboratorium secara ilmiah sebelum penetapan keputusan.' }
    ],
    isiLengkap: `STANDAR NASIONAL INDONESIA SNI ISO/IEC 17065:2012

Menetapkan kriteria operasional ketat bagi Lembaga Pemeriksa Halal (LPH):
- Menjaga independensi audit.
- Menyusun manajemen risiko ketidakberpihakan.
- Menjamin kompetensi teknis seluruh personel auditor.`
  },
  {
    id: 'sni-99001-2016',
    nomor: 'SNI 99001:2016',
    kategori: 'SNI',
    tentang: 'Sistem Manajemen Halal',
    deskripsi: 'Standar sertifikasi komitmen internal perusahaan dalam mengelola pasokan bahan, fasilitas produksi, proses sanitasi, dan edukasi karyawan secara bersih dan syariah.',
    tahun: '2016',
    referensiUrl: 'https://bpjph.halal.go.id/',
    pasalPenting: [
      { pasal: 'Bagian 5', isi: 'Tanggung jawab manajemen puncak dalam membentuk tim manajemen halal internal.' },
      { pasal: 'Bagian 8', isi: 'Pengendalian bahan kritis dan jaminan keterlacakan agar tidak terkontaminasi najis.' }
    ],
    isiLengkap: `STANDAR NASIONAL INDONESIA SNI 99001:2016 SISTEM MANAJEMEN HALAL

Mengatur penyusunan standardisasi internal industri produk halal:
- Penetapan Kebijakan Halal manajemen.
- Penelusuran bahan baku bersertifikat halal dari pemasok (supplying trace).
- Pencegahan pencemaran silang dari fasilitas non-halal.`
  }
];

export default function LPHApp() {
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState('landing');
  const [userRole, setUserRole] = useState('pu');
  const [pengajuanList, setPengajuanList] = useState<any[]>([]);
  const [beritaList, setBeritaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Connection Test - Removed to avoid potential race conditions and SDK assertion failures
  useEffect(() => {
    // Basic initialization log
    if (firebaseConfig.projectId !== 'mock-project') {
       console.log("Firebase initialized for project:", firebaseConfig.projectId);
    }
  }, []);

  // ==========================================
  // DYNAMIC SEO MANAGEMENT
  // ==========================================
  useEffect(() => {
    let title = 'LPH Al-Ghazali UNUGHA - Lembaga Pemeriksa Halal Terpercaya';
    let metaDescription = 'Portal Cloud LPH Al-Ghazali. Pengajuan sertifikasi halal secara online, transparan, dan profesional sesuai standar regulasi BPJPH dan SNI.';

    switch (currentView) {
      case 'landing':
        title = 'Beranda | LPH Al-Ghazali UNUGHA - Registrasi & Sertifikasi Halal Online';
        metaDescription = 'Portal Utama LPH Al-Ghazali. Menjamin kehalalan produk Anda dengan sertifikasi yang diakui BPJPH dan MUI. Sistem layanan paperless dan terintegrasi SNI.';
        break;
      case 'login':
      case 'login-staff':
        title = 'Masuk Portal | LPH Al-Ghazali UNUGHA';
        metaDescription = 'Masuk ke Dashboard LPH Al-Ghazali untuk memantau status pengajuan sertifikat halal Anda secara real-time.';
        break;
      case 'pu-dashboard':
        title = 'Dashboard Pelaku Usaha | LPH Al-Ghazali';
        metaDescription = 'Pantau progress sertifikasi halal produk Anda secara live melalui dashboard pintar LPH Al-Ghazali.';
        break;
      case 'pu-pengajuan':
        title = 'Form Pengajuan Sertifikasi Halal | LPH Al-Ghazali';
        metaDescription = 'Isi form pengajuan sertifikasi halal secara online. Langkah mudah dan cepat untuk produk Anda mendapatkan sertifikat halal BPJPH.';
        break;
      case 'pu-settings':
        title = 'Pengaturan Akun | LPH Al-Ghazali';
        break;
      case 'admin-dashboard':
      case 'admin-berita':
      case 'admin-kegiatan':
      case 'admin-auditor':
      case 'admin-settings':
        title = 'Administrator Platform | LPH Al-Ghazali';
        metaDescription = 'Control panel untuk internal LPH Al-Ghazali mengelola data, berita, auditor, dan pengajuan secara terpusat.';
        break;
      case 'auditor-dashboard':
        title = 'Auditor Platform | LPH Al-Ghazali';
        metaDescription = 'Panel kerja Auditor LPH Al-Ghazali untuk memeriksa dan memvalidasi data pengajuan halal.';
        break;
      default:
        break;
    }

    document.title = title;
    
    // Update or create meta description tag
    let metaDescTag = document.querySelector('meta[name="description"]');
    if (!metaDescTag) {
      metaDescTag = document.createElement('meta');
      metaDescTag.setAttribute('name', 'description');
      document.head.appendChild(metaDescTag);
    }
    metaDescTag.setAttribute('content', metaDescription);

    // Update or create meta title tag
    let metaTitleTag = document.querySelector('meta[name="title"]');
    if (!metaTitleTag) {
      metaTitleTag = document.createElement('meta');
      metaTitleTag.setAttribute('name', 'title');
      document.head.appendChild(metaTitleTag);
    }
    metaTitleTag.setAttribute('content', title);
    
    // Check for OG Title
    let ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) {
      ogTitleTag.setAttribute('content', title);
    }
    
    // Check for OG Description
    let ogDescTag = document.querySelector('meta[property="og:description"]');
    if (ogDescTag) {
      ogDescTag.setAttribute('content', metaDescription);
    }
  }, [currentView]);

  // ==========================================
  // 2. AUTHENTICATION & DATA FETCHING
  // ==========================================
  useEffect(() => {
    setIsLoading(true);

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        let role = 'pu';
        if (firebaseConfig.projectId !== 'mock-project') {
           try {
             const userDocRef = doc(db, 'users', currentUser.uid);
             let userDocSnap = null;
             try {
               userDocSnap = await getDoc(userDocRef);
             } catch (getErr) {
               console.warn("Permission restricted or document missing on user doc fetch:", getErr);
             }
             
             if (userDocSnap && userDocSnap.exists()) {
               role = userDocSnap.data().role || 'pu';
               // Explicit staff upgrade check: Only upgrade if email is staff but role is PU
               const staffEmails = ['admin@lphalghazali.com', 'auditor@lphalghazali.com', 'editor@lphalghazali.com', 'staf@lphalghazali.com', 'asngad@mhs.unugha.ac.id'];
               if (role === 'pu' && currentUser.email && staffEmails.includes(currentUser.email)) {
                  role = currentUser.email.split('@')[0] === 'asngad' ? 'admin' : currentUser.email.split('@')[0];
                  await updateDoc(userDocRef, { role: role });
               }
             } else {
               // Determine initial role
               const staffEmails = ['admin@lphalghazali.com', 'auditor@lphalghazali.com', 'editor@lphalghazali.com', 'staf@lphalghazali.com', 'asngad@mhs.unugha.ac.id'];
               role = (currentUser.email && staffEmails.includes(currentUser.email)) 
                 ? (currentUser.email.split('@')[0] === 'asngad' ? 'admin' : currentUser.email.split('@')[0]) 
                 : 'pu';
                  
               await setDoc(userDocRef, {
                 name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
                 email: currentUser.email,
                 role: role,
                 createdAt: serverTimestamp()
               });
             }
           } catch(e) {
             console.error("Error fetching/syncing user profile:", e);
             // Safety fallback roles based on email
             if (currentUser.email === 'admin@lphalghazali.com') role = 'admin';
             else if (currentUser.email === 'auditor@lphalghazali.com') role = 'auditor';
             else if (currentUser.email === 'editor@lphalghazali.com') role = 'editor';
             else if (currentUser.email === 'staf@lphalghazali.com') role = 'staf';
             else role = 'pu';
           }
        }
        setUserRole(role);
        setUser(currentUser);
      } else {
        setUserRole('pu');
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Load mock data for UI visualization
    setBeritaList([
      {
        id: '1',
        title: 'LPH Al-Ghazali Siap Layani Sertifikasi Halal Tahun 2026',
        category: 'Berita',
        content: 'Kami siap memberikan pelayanan terbaik untuk pelaku usaha dalam mendapatkan sertifikat halal.',
        createdAt: Date.now() - 86400000,
      }
    ]);
    
    setPengajuanList([
      {
        id: '1',
        userId: 'mock-user-123',
        nomorRegistrasi: 'REG-202605-1234',
        companyName: 'PT. Makmur Sentosa',
        productName: 'Keripik Pisang',
        jenisPengajuan: 'Baru',
        status: 'Proses Audit',
        createdAt: Date.now() - 86400000,
      }
    ]);

    if (firebaseConfig.projectId !== 'mock-project') {
      // Fetch Pengajuan
      const pengajuanRef = collection(db, 'artifacts', currentAppId, 'public', 'data', 'pengajuan_halal');
      let q = pengajuanRef as any;
      if (userRole === 'pu') {
        q = query(pengajuanRef, where('userId', '==', user.uid));
      }

      const unsubscribeData = onSnapshot(q, (snapshot: any) => {
        const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as any[];
        data.sort((a, b) => b.createdAt - a.createdAt);
        setPengajuanList(data);
      }, (error: any) => {
        handleFirestoreError(error, OperationType.GET, `artifacts/${currentAppId}/public/data/pengajuan_halal`);
      });

      // Fetch Berita & Artikel
      const beritaRef = collection(db, 'artifacts', currentAppId, 'public', 'data', 'berita');
      const unsubscribeBerita = onSnapshot(beritaRef, (snapshot) => {
        const bData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        bData.sort((a, b) => b.createdAt - a.createdAt);
        setBeritaList(bData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `artifacts/${currentAppId}/public/data/berita`);
      });

      return () => {
          unsubscribeData();
          unsubscribeBerita();
      };
    }
  }, [user, userRole]);

  // ==========================================
  // 3. CLOUD ACTIONS (WRITE TO FIRESTORE)
  // ==========================================
  const handleSubmitPengajuan = async (formData: any) => {
    if (!user) return;
    try {
      const newPengajuan = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.uid,
        nomorRegistrasi: `REG-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${Math.floor(Math.random() * 10000)}`,
        companyName: formData.companyName,
        productName: formData.productName,
        skalaUsaha: formData.skalaUsaha || 'Mikro',
        jenisPengajuan: formData.jenisPengajuan || 'Baru',
        jenisLayanan: formData.jenisLayanan || 'Reguler',
        jenisProduk: formData.jenisProduk || 'Makanan',
        jumlahProduk: formData.jumlahProduk || 1,
        jumlahPabrik: formData.jumlahPabrik || 1,
        tiketPesawat: formData.tiketPesawat || 0,
        estimasiBiaya: formData.grandTotal || 0,
        fileName: formData.file ? formData.file.name : 'dokumen_legalitas.pdf',
        status: 'Verifikasi Dokumen',
        createdAt: Date.now(),
        history: [{ status: 'Verifikasi Dokumen', timestamp: Date.now(), catatan: 'Pengajuan telah dikirim secara online dan menunggu Verifikasi Dokumen oleh LPH Al-Ghazali.' }]
      };
      
      if (firebaseConfig.projectId !== 'mock-project') {
        const pengajuanRef = doc(db, 'artifacts', currentAppId, 'public', 'data', 'pengajuan_halal', newPengajuan.id);
        await setDoc(pengajuanRef, newPengajuan);
      } else {
        setPengajuanList([newPengajuan, ...pengajuanList]);
      }
      
      setCurrentView('pu-dashboard');
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Gagal menyimpan ke cloud.");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, catatan: string = '') => {
    if (!user) return;
    try {
      const existingPengajuan = pengajuanList.find(p => p.id === id);
      const newHistoryEntry = { status: newStatus, timestamp: Date.now(), catatan: catatan || `Status diubah menjadi ${newStatus}` };
      const updatedHistory = existingPengajuan?.history ? [...existingPengajuan.history, newHistoryEntry] : [newHistoryEntry];

      if (firebaseConfig.projectId !== 'mock-project') {
        const docRef = doc(db, 'artifacts', currentAppId, 'public', 'data', 'pengajuan_halal', id);
        await updateDoc(docRef, { status: newStatus, history: updatedHistory });
      } else {
        setPengajuanList(pengajuanList.map(p => p.id === id ? { ...p, status: newStatus, history: updatedHistory } : p));
      }
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  // --- CRUD BERITA ACTIONS ---
  const handleAddBerita = async (formData: any) => {
    if (!user) return;
    try {
      const newBerita = { ...formData, createdAt: Date.now(), id: Math.random().toString(36).substr(2, 9) };
      setBeritaList([newBerita, ...beritaList]);
      const beritaRef = collection(db, 'artifacts', currentAppId, 'public', 'data', 'berita');
      await addDoc(beritaRef, { ...formData, createdAt: Date.now() });
    } catch (error) {
      console.error("Error adding berita: ", error);
      alert("Gagal menyimpan berita ke cloud.");
    }
  };

  const handleUpdateBerita = async (id: string, formData: any) => {
    if (!user) return;
    try {
      setBeritaList(beritaList.map(b => b.id === id ? { ...b, ...formData, updatedAt: Date.now() } : b));
      const docRef = doc(db, 'artifacts', currentAppId, 'public', 'data', 'berita', id);
      await updateDoc(docRef, { ...formData, updatedAt: Date.now() });
    } catch (error) {
      console.error("Error updating berita: ", error);
      alert("Gagal memperbarui berita.");
    }
  };

  const handleDeleteBerita = async (id: string) => {
    if (!user) return;
    if (window.confirm("Apakah Anda yakin ingin menghapus berita ini?")) {
        try {
          setBeritaList(beritaList.filter(b => b.id !== id));
          const docRef = doc(db, 'artifacts', currentAppId, 'public', 'data', 'berita', id);
          await deleteDoc(docRef);
        } catch (error) {
        console.error("Error deleting berita: ", error);
        alert("Gagal menghapus berita.");
        }
    }
  };

  const handleLogout = () => {
    setCurrentView('landing');
  };

  const navigateTo = (view: string) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // ==========================================
  // 4. VIEWS RENDERING (ROUTER SIMULATION)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {currentView === 'landing' && <LandingView navigateTo={navigateTo} beritaList={beritaList} />}
      {currentView === 'login' && <AuthView navigateTo={navigateTo} setRole={setUserRole} roleType="pu" />}
      {currentView === 'login-staff' && <AuthView navigateTo={navigateTo} setRole={setUserRole} roleType="staff" />}
      
      {currentView === 'pu-dashboard' && (
        <DashboardLayout role="pu" navigateTo={navigateTo} logout={handleLogout} currentView={currentView}>
          <PUDashboard data={pengajuanList.filter(p => p.userId === user?.uid)} navigateTo={navigateTo} />
        </DashboardLayout>
      )}
      
      {currentView === 'pu-pengajuan' && (
        <DashboardLayout role="pu" navigateTo={navigateTo} logout={handleLogout} currentView={currentView}>
          <PUFormPengajuan submit={handleSubmitPengajuan} navigateTo={navigateTo} />
        </DashboardLayout>
      )}

      {currentView === 'pu-settings' && (
        <DashboardLayout role="pu" navigateTo={navigateTo} logout={handleLogout} currentView={currentView}>
          <PUSettings navigateTo={navigateTo} />
        </DashboardLayout>
      )}

      {currentView === 'pu-kalkulator' && (
        <DashboardLayout role="pu" navigateTo={navigateTo} logout={handleLogout} currentView={currentView}>
          <PUKalkulatorView navigateTo={navigateTo} />
        </DashboardLayout>
      )}

      {currentView === 'admin-dashboard' && (
        <DashboardLayout role={userRole} navigateTo={navigateTo} logout={handleLogout} currentView={currentView}>
          <AdminDashboard data={pengajuanList} updateStatus={handleUpdateStatus} role={userRole} />
        </DashboardLayout>
      )}

      {currentView === 'auditor-dashboard' && (
        <DashboardLayout role={userRole} navigateTo={navigateTo} logout={handleLogout} currentView={currentView}>
          <AuditorDashboard data={pengajuanList.filter(p => p.status === 'Proses Audit')} updateStatus={handleUpdateStatus} />
        </DashboardLayout>
      )}

      {currentView === 'admin-berita' && (
        <DashboardLayout role={userRole} navigateTo={navigateTo} logout={handleLogout} currentView={currentView}>
          <AdminBerita data={beritaList} addData={handleAddBerita} updateData={handleUpdateBerita} deleteData={handleDeleteBerita} />
        </DashboardLayout>
      )}

      {currentView === 'admin-kegiatan' && (
        <DashboardLayout role={userRole} navigateTo={navigateTo} logout={handleLogout} currentView={currentView}>
          <AdminKegiatan addData={handleAddBerita} updateData={handleUpdateBerita} />
        </DashboardLayout>
      )}

      {currentView === 'admin-auditor' && (
        <DashboardLayout role={userRole} navigateTo={navigateTo} logout={handleLogout} currentView={currentView}>
          <AdminAuditor data={pengajuanList} />
        </DashboardLayout>
      )}

      {currentView === 'admin-settings' && (
        <DashboardLayout role={userRole} navigateTo={navigateTo} logout={handleLogout} currentView={currentView}>
          <AdminSettings />
        </DashboardLayout>
      )}
    </div>
  );
}

// ==========================================
// VIEW COMPONENTS
// ==========================================

function LandingView({ navigateTo, beritaList }: any) {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    // Fetch settings to display dynamic structure and images
    const settingsRef = doc(db, 'artifacts', currentAppId, 'public', 'system_settings');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      try {
        if (docSnap && docSnap.exists()) {
          setSettings(docSnap.data());
        }
      } catch (err) {
        console.error("Error in settings snapshot listener:", err);
      }
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, `artifacts/${currentAppId}/public/system_settings`);
    });
    return () => unsubscribe();
  }, []);

  const profilInfo = settings?.profil || {
      noWa: '085802494252',
      email: 'lphalghazali@gmail.com',
      alamat: 'Jl. Kemerdekaan Barat No.12, Kesugihan, Cilacap, Jawa Tengah 53274'
  };

  const [formData, setFormData] = useState({
    provinsi: 'Jawa Tengah',
    kabKota: '',
    kecamatan: '',
    kelurahanDesa: '',
    jenisLayanan: 'Reguler',
    jenisProduk: '',
    skalaUsaha: '',
    jumlahProduk: 0,
    jumlahPabrik: 0,
    tiketPesawat: 0
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [appealForm, setAppealForm] = useState({
    noRegistrasi: '',
    namaUsaha: '',
    email: '',
    alasanKeberatan: '',
    persetujuanBiaya: false,
  });
  const [appealSubmitStatus, setAppealSubmitStatus] = useState<null | 'success' | 'loading'>(null);
  const [isVisiMisiPdfOpen, setIsVisiMisiPdfOpen] = useState(false);
  const [isSejarahPdfOpen, setIsSejarahPdfOpen] = useState(false);
  const [isKebijakanPdfOpen, setIsKebijakanPdfOpen] = useState(false);
  const [isStrukturOrganisasiOpen, setIsStrukturOrganisasiOpen] = useState(false);
  const [isUndangUndangOpen, setIsUndangUndangOpen] = useState(false);
  const [isPeraturanPemerintahOpen, setIsPeraturanPemerintahOpen] = useState(false);
  const [isKeputusanMenagOpen, setIsKeputusanMenagOpen] = useState(false);
  const [isKeputusanBpjphOpen, setIsKeputusanBpjphOpen] = useState(false);
  const [isPeraturanBpomOpen, setIsPeraturanBpomOpen] = useState(false);
  const [isSniOpen, setIsSniOpen] = useState(false);

  const [isMenuRegulasiOpen, setIsMenuRegulasiOpen] = useState(false);
  const [selectedRegulasiCategory, setSelectedRegulasiCategory] = useState('Semua');
  const [searchRegulasiQuery, setSearchRegulasiQuery] = useState('');
  const [activeRegulasiDoc, setActiveRegulasiDoc] = useState<any | null>(null);

  const openRegulasiWithCategory = (category: string) => {
    setSelectedRegulasiCategory(category);
    setIsMenuRegulasiOpen(true);
    setSearchRegulasiQuery('');
    setActiveRegulasiDoc(null);
  };

  const handleDownloadRegulasiDocument = (doc: any) => {
    const textContent = `--------------------------------------------------------
DOKUMEN REGULASI RESMI - SINKRONISASI PORTAL BPJPH RI
Referensi Utama: https://bpjph.halal.go.id/
Diunduh Melalui: Portal Cloud LPH Al-Ghazali (UNUGHA)
Terakhir Diperbarui: 20 Mei 2026 (Waktu Sinkronisasi BPJPH)
--------------------------------------------------------

NOMOR DOKUMEN: ${doc.nomor}
KATEGORI: ${doc.kategori}
TENTANG: ${doc.tentang}
TAHUN: ${doc.tahun}

DESKRIPSI:
${doc.deskripsi}

PASAL-PASAL PENTING:
${doc.pasalPenting.map((p: any) => `- ${p.pasal}: ${p.isi}`).join('\n')}

--------------------------------------------------------
ISI LENGKAP REGULASI DOKUMEN:
--------------------------------------------------------
${doc.isiLengkap}

--------------------------------------------------------
Disinkronkan secara sah dari pangkalan data BPJPH RI.
LPH Al-Ghazali Universitas Nahdlatul Ulama Al Ghazali
Kesugihan, Cilacap, Jawa Tengah.
`;
    const element = document.createElement("a");
    const file = new Blob([textContent], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `${doc.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
    const [isAuditorPdfOpen, setIsAuditorPdfOpen] = useState(false);
  const [isSdmPdfOpen, setIsSdmPdfOpen] = useState(false);
  const [isKerjasamaPdfOpen, setIsKerjasamaPdfOpen] = useState(false);
  const [isPencarianPdfOpen, setIsPencarianPdfOpen] = useState(false);
  const [isDaftarAuditPdfOpen, setIsDaftarAuditPdfOpen] = useState(false);
  const [isAgendaPdfOpen, setIsAgendaPdfOpen] = useState(false);
  const [isKegiatanPdfOpen, setIsKegiatanPdfOpen] = useState(false);

  const handleDownloadPksPdf = () => {
    const text = `SURAT PERJANJIAN KERJASAMA (PKS)
LPH AL-GHAZALI (UNUGHA) DENGAN ASOSIASI PEMOTONG HEWAN JAWA TENGAH

Nomor Dokumen: LPH-AG/PKS-UMK/006/2026
Tentang: Kemitraan Sosialisasi & Deteksi Halal Bahan Baku bagi Pelaku Usaha Mikro dan Kecil (UMK)

Pada hari ini tanggal Dua Puluh bulan Mei tahun Dua ribu dua puluh enam (20-05-2026), bertempat di Kesugihan, Kabupaten Cilacap, Jawa Tengah, para pihak yang bertandatangan di bawah ini secara resmi menyepakati kemitraan strategis spesifik pendampingan UMK:

1. Christian Soolany, S.TP., M.Si. bertindak selaku Manajer Operasional LPH AL-GHAZALI (UNUGHA) yang berkedudukan di Cilacap, Jawa Tengah. Bertindak atas nama LPH AL-GHAZALI, selanjutnya disebut PIHAK PERTAMA.
2. Perwakilan Pengurus Asosiasi Pemotong Hewan Jawa Tengah, selanjutnya disebut PIHAK KEDUA.

PARA PIHAK bersepakat atas ketentuan ringkas sebagai berikut demi mendukung kemudahan sertifikasi halal draf reguler UMK:

PASAL 1: RUANG LINGKUP KHUSUS UMK
Kerjasama ini difokuskan sepenuhnya untuk mempermudah pendaftaran sertifikasi halal bagi kelompok Usaha Mikro dan Kecil (UMK) melalui:
a. Sosialisasi Kolektif: Menyelenggaraan sosialisasi wajib sertifikasi halal reguler bersama instansi, yayasan, ormas, dan kampus mitra bagi para UMK binaan secara meluas di Jawa Tengah.
b. Integrasi Bahan Baku Halal: Penyediaan akses data hulu RPH (Rumah Potong Hewan) yang sah dan amanah dari PIHAK KEDUA demi memudahkan pemeriksaan bahan hewani milik UMK oleh PIHAK PERTAMA.
c. Kebijakan Tunggal: LPH Al-Ghazali menegakkan profesionalisme tinggi dan hanya menyetujui kemitraan teknis dari Asosiasi Pemotong Hewan ini, serta meniadakan kerjasama pengujian laboratorium komersial atau kerjasama lain di luar skema ini demi keandalan.

PASAL 2: FASILITAS & BIAYA RINGKAS
Pelaksanaan program sosialisasi bersama dikoordinasikan secara fungsional berdasarkan asas kepedulian terhadap pemberdayaan pelaku usaha kecil (UMK), sehingga dirancang seringkas mungkin tanpa adanya instrumen pembiayaan ganda yang memberatkan mereka.

PASAL 3: MASA BERLAKU
Surat Perjanjian Kerjasama ini berlaku untuk jangka waktu 2 (dua) tahun terhitung sejak disahkan dan ditandatangani oleh Manajer Operasional dari PIHAK PERTAMA.

Ditandatangani secara elektronik & sah oleh:

PIHAK PERTAMA,
LPH AL-GHAZALI (UNUGHA)
[Signed Electronically] 
Christian Soolany, S.TP., M.Si.
(Manajer Operasional LPH)

PIHAK KEDUA,
ASOSIASI PEMOTONG HEWAN JAWA TENGAH
[Signed Electronically]
Perwakilan Asosiasi
(Mitra Teknis Jawa Tengah)

---------------------------------------------------------
Diunduh secara resmi dari portal web LPH Al-Ghazali.
SHA-256 Verified Secure Archive File`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PKS_LPH_Al_Ghazali_UMK.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFormChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: (name === 'jumlahProduk' || name === 'jumlahPabrik' || name === 'tiketPesawat') ? Number(value) : value
    }));
  };

  // Kalkulasi biaya
  let mandays = 0;
  if (formData.skalaUsaha === 'Mikro') mandays = 1;
  else if (formData.skalaUsaha === 'Kecil') mandays = 2;
  else if (formData.skalaUsaha === 'Menengah') mandays = 4;
  else if (formData.skalaUsaha === 'Besar') mandays = 8;
  
  if (formData.jumlahPabrik > 1 && mandays > 0) {
    mandays += (formData.jumlahPabrik - 1);
  }

  const unitCost = Math.max(1000000, 0); // Keep it safe
  const hargaMandoc = mandays * unitCost;

  const operasional = formData.skalaUsaha ? 200000 : 0;
  
  const unitUhpd = 150000;
  const hargaUhpd = mandays * unitUhpd;

  const unitTransport = 100000;
  const hargaTransport = mandays * unitTransport;

  const dDays = mandays > 2 ? mandays - 2 : 0;
  const unitAkomodasi = 200000;
  const hargaAkomodasi = dDays * unitAkomodasi;

  const pendaftaran = (formData.skalaUsaha === 'Mikro' || formData.skalaUsaha === 'Kecil') ? 300000 : (formData.skalaUsaha ? 1500000 : 0);
  const penetapanKH = (formData.skalaUsaha === 'Mikro' || formData.skalaUsaha === 'Kecil') ? 150000 : (formData.skalaUsaha ? 300000 : 0);

  const grandTotal = hargaMandoc + operasional + hargaUhpd + hargaTransport + hargaAkomodasi + formData.tiketPesawat + pendaftaran + penetapanKH;

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  const changeLanguage = (lang: string) => {
    if (lang === 'id') {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
      window.location.reload();
      return;
    }
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
    } else {
      document.cookie = `googtrans=/id/${lang}; path=/`;
      document.cookie = `googtrans=/id/${lang}; path=/; domain=${window.location.hostname}`;
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col min-h-screen scroll-smooth" style={{ scrollPaddingTop: '160px' }}>
      {/* Navbar */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50">
        {/* Top Row */}
        <div className="border-b border-gray-100 bg-emerald-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-24 sm:h-32 py-2">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Logo className="h-16 w-16 sm:h-24 sm:w-24 drop-shadow-md" />
                <div className="flex flex-col">
                  <span className="font-bold text-2xl sm:text-3xl tracking-tight text-gray-900 leading-none mb-1">LPH AL-GHAZALI</span>
                  <span className="text-sm sm:text-base font-semibold text-emerald-700 tracking-wider">HALAL INDONESIA</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4 text-sm mt-1 sm:mt-0">
                <a href={`https://wa.me/62${profilInfo.noWa.replace(/^0+/, '')}`} target="_blank" rel="noopener noreferrer" className="hidden lg:flex items-center font-medium text-emerald-700 hover:text-emerald-800 transition-colors bg-emerald-100/50 px-3 py-2 rounded-full">
                  <Phone className="w-4 h-4 mr-1.5" /> {profilInfo.noWa}
                </a>
                <div className="relative hidden md:block">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-emerald-600" />
                  </div>
                  <input id="lph-alghazali-app-search" type="text" placeholder="Cari di LPH Al-Ghazali..." className="pl-9 pr-4 py-2 w-48 sm:w-56 border border-emerald-200 rounded-full text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white transition-all shadow-sm" />
                </div>
                <button className="md:hidden text-emerald-700 p-2 hover:bg-emerald-100 rounded-full transition-colors">
                  <Search className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-2 mr-2 bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full border border-emerald-100">
                  <button onClick={() => changeLanguage('id')} className="p-1 rounded-full hover:bg-emerald-100 transition-colors shadow-sm bg-white border border-gray-100" title="Bahasa Indonesia">
                    <img src="https://flagcdn.com/w40/id.png" alt="ID" className="w-5 h-5 object-cover rounded-full" />
                  </button>
                  <button onClick={() => changeLanguage('en')} className="p-1 rounded-full hover:bg-emerald-100 transition-colors shadow-sm bg-white border border-gray-100" title="English">
                    <img src="https://flagcdn.com/w40/gb.png" alt="EN" className="w-5 h-5 object-cover rounded-full" />
                  </button>
                </div>
                <button onClick={() => navigateTo('login')} className="flex items-center bg-emerald-600 text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all text-sm">
                  <LogOut className="w-4 h-4 sm:mr-1.5 rotate-180" /> <span className="hidden sm:inline">Masuk Portal</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-100">
          <div className="flex justify-between h-14 items-center">
            {/* Desktop Navigation */}
            <div className="hidden xl:flex space-x-6 items-center text-sm font-medium">
              <a href="#beranda" className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center shrink-0">
                <Home className="w-4 h-4 mr-1" /> Beranda
              </a>
              <div className="relative group shrink-0">
                <button className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center py-4">
                  <UserCheck className="w-4 h-4 mr-1" /> Profil <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-[80%] left-0 w-72 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <button onClick={() => setIsSejarahPdfOpen(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <History className="w-4 h-4 mr-2" /> Sejarah dan Latar Belakang
                  </button>
                  <button onClick={() => setIsVisiMisiPdfOpen(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Target className="w-4 h-4 mr-2" /> Visi Misi
                  </button>
                  <button onClick={() => setIsKebijakanPdfOpen(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Award className="w-4 h-4 mr-2" /> Kebijakan Mutu & Sasaran Mutu
                  </button>
                  <button onClick={() => setIsStrukturOrganisasiOpen(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Network className="w-4 h-4 mr-2" /> Struktur Organisasi
                  </button>
                  <button onClick={() => setIsAuditorPdfOpen(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Users className="w-4 h-4 mr-2" /> Auditor Halal
                  </button>
                  <button onClick={() => setIsSdmPdfOpen(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <BookOpen className="w-4 h-4 mr-2" /> SDM Syariah
                  </button>
                  <button onClick={() => setIsKerjasamaPdfOpen(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center">
                    <Handshake className="w-4 h-4 mr-2" /> Kerjasama
                  </button>
                </div>
              </div>
              <div className="relative group shrink-0">
                <button className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center py-4">
                  <Briefcase className="w-4 h-4 mr-1" /> Layanan <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-[80%] left-0 w-80 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <a href="#pendaftaran" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <FileSignature className="w-4 h-4 mr-2" /> Pendaftaran Sertifikasi Halal
                  </a>
                  <a href="#ruang-lingkup" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Search className="w-4 h-4 mr-2" /> Ruang Lingkup dan Layanan Pemeriksaan Halal
                  </a>
                  <button onClick={() => setIsPencarianPdfOpen(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <CheckCircle className="w-4 h-4 mr-2" /> Pencarian Sertifikasi Halal
                  </button>
                  <button onClick={() => setIsDaftarAuditPdfOpen(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center">
                    <FileText className="w-4 h-4 mr-2" /> Daftar Audit
                  </button>
                </div>
              </div>
              <div className="relative group shrink-0">
                <button className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center py-4">
                  <FileSignature className="w-4 h-4 mr-1" /> Proses <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-[80%] left-0 w-52 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <a href="#alur-sertifikasi" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Route className="w-4 h-4 mr-2" /> Alur Sertifikasi
                  </a>
                  <a href="#tanggung-gugat" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Scale className="w-4 h-4 mr-2" /> Prosedur Tanggung Gugat
                  </a>
                  <div className="relative group/nested">
                    <a href="#tarif-layanan" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-between">
                      <div className="flex items-center"><Coins className="w-4 h-4 mr-2" /> Tarif Layanan</div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </a>
                    <div className="absolute top-0 left-full -ml-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover/nested:opacity-100 group-hover/nested:visible group-hover/nested:ml-0 transition-all duration-200 overflow-hidden">
                      <a href="#form-perhitungan-biaya" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                        <Calculator className="w-4 h-4 mr-2" /> Form Perhitungan Biaya
                      </a>
                      <a href="#detail-hasil-perhitungan" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center">
                        <Receipt className="w-4 h-4 mr-2" /> Detail Hasil Perhitungan
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative group shrink-0">
                <button className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center py-4">
                  <Scale className="w-4 h-4 mr-1" /> Regulasi <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-[80%] left-0 w-72 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50">
                  <button onClick={() => openRegulasiWithCategory('Undang-Undang')} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Scale className="w-4 h-4 mr-2 shrink-0" /> <span className="truncate">Undang-undang RI</span>
                  </button>
                  <button onClick={() => openRegulasiWithCategory('Peraturan Pemerintah')} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Landmark className="w-4 h-4 mr-2 shrink-0" /> <span className="truncate">Peraturan Pemerintah</span>
                  </button>
                  <button onClick={() => openRegulasiWithCategory('Keputusan Menteri Agama')} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <BookOpen className="w-4 h-4 mr-2 shrink-0" /> <span className="truncate">Keputusan Menteri Agama</span>
                  </button>
                  <button onClick={() => openRegulasiWithCategory('Keputusan Kepala BPJPH')} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <FileSignature className="w-4 h-4 mr-2 shrink-0" /> <span className="truncate">Keputusan Kepala BPJPH</span>
                  </button>
                  <button onClick={() => openRegulasiWithCategory('Peraturan BPOM')} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <ShieldCheck className="w-4 h-4 mr-2 shrink-0" /> <span className="truncate">Peraturan BPOM</span>
                  </button>
                  <button onClick={() => openRegulasiWithCategory('SNI')} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center">
                    <Award className="w-4 h-4 mr-2 shrink-0" /> <span className="truncate">SNI</span>
                  </button>
                </div>
              </div>
              <div className="relative group shrink-0">
                <button className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center py-4">
                  <Newspaper className="w-4 h-4 mr-1" /> Berita <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-[80%] left-0 w-48 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <a href="#berita" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Newspaper className="w-4 h-4 mr-2" /> Berita Utama
                  </a>
                  <button onClick={() => setIsKegiatanPdfOpen(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Activity className="w-4 h-4 mr-2" /> Kegiatan
                  </button>
                  <button onClick={() => setIsAgendaPdfOpen(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center">
                    <CalendarDays className="w-4 h-4 mr-2" /> Agenda
                  </button>
                </div>
              </div>
              <a href="#faq" className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center shrink-0">
                <Search className="w-4 h-4 mr-1" /> FAQ
              </a>
              <a href="#kontak" className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center shrink-0">
                <Phone className="w-4 h-4 mr-1" /> Kontak
              </a>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 ml-auto xl:ml-0">
              <button onClick={() => navigateTo('login-staff')} className="hidden sm:flex opacity-0 hover:opacity-100 focus:opacity-100 text-emerald-600 transition-opacity items-center" title="Staf LPH">
                <ShieldCheck className="w-5 h-5 mr-1" />
                <span className="font-medium text-sm">Staf LPH</span>
              </button>
              <span className="xl:hidden border-l border-gray-200 h-6 mx-1"></span>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="xl:hidden flex items-center text-gray-600 hover:text-emerald-600 transition-colors bg-gray-50 border border-gray-100 p-1.5 rounded-lg shadow-sm">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                <span className="hidden sm:block ml-2 text-sm font-medium">Menu</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg max-h-[80vh] overflow-y-auto">
            <a href="#beranda" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-md">
              <div className="flex items-center"><Home className="w-4 h-4 mr-2" /> Beranda</div>
            </a>
            
            <div className="px-3 py-2">
              <div className="text-sm font-bold text-emerald-600 mb-1 flex items-center"><UserCheck className="w-4 h-4 mr-2" /> Profil</div>
              <div className="ml-6 space-y-1 border-l-2 border-emerald-100 pl-3">
                <button onClick={() => { setIsSejarahPdfOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left py-1 text-sm text-gray-600 hover:text-emerald-600">Sejarah dan Latar Belakang</button>
                <button onClick={() => { setIsVisiMisiPdfOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left py-1 text-sm text-gray-600 hover:text-emerald-600">Visi Misi</button>
                <button onClick={() => { setIsKebijakanPdfOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left py-1 text-sm text-gray-600 hover:text-emerald-600">Kebijakan Mutu & Sasaran Mutu</button>
                <button onClick={() => { setIsStrukturOrganisasiOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left py-1 text-sm text-gray-600 hover:text-emerald-600">Struktur Organisasi</button>
                <button onClick={() => { setIsAuditorPdfOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left py-1 text-sm text-gray-600 hover:text-emerald-600">Auditor Halal</button>
                <button onClick={() => { setIsSdmPdfOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left py-1 text-sm text-gray-600 hover:text-emerald-600">SDM Syariah</button>
                <button onClick={() => { setIsKerjasamaPdfOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left py-1 text-sm text-gray-600 hover:text-emerald-600">Kerjasama</button>
              </div>
            </div>

            <div className="px-3 py-2">
              <div className="text-sm font-bold text-emerald-600 mb-1 flex items-center"><Briefcase className="w-4 h-4 mr-2" /> Layanan</div>
              <div className="ml-6 space-y-1 border-l-2 border-emerald-100 pl-3">
                <a href="#pendaftaran" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Pendaftaran Sertifikasi Halal</a>
                <a href="#ruang-lingkup" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Ruang Lingkup dan Layanan Pemeriksaan Halal</a>
                <button onClick={() => { setIsPencarianPdfOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left py-1 text-sm text-gray-600 hover:text-emerald-600">Pencarian Sertifikasi Halal</button>
                <button onClick={() => { setIsDaftarAuditPdfOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left py-1 text-sm text-gray-600 hover:text-emerald-600">Daftar Audit</button>
              </div>
            </div>

            <div className="px-3 py-2">
              <div className="text-sm font-bold text-emerald-600 mb-1 flex items-center"><FileSignature className="w-4 h-4 mr-2" /> Proses</div>
              <div className="ml-6 space-y-1 border-l-2 border-emerald-100 pl-3">
                <a href="#alur-sertifikasi" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Alur Sertifikasi</a>
                <a href="#tanggung-gugat" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Prosedur Tanggung Gugat</a>
                <a href="#tarif-layanan" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Tarif Layanan</a>
                <a href="#form-perhitungan-biaya" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Form Perhitungan Biaya</a>
                <a href="#detail-hasil-perhitungan" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Detail Hasil Perhitungan</a>
              </div>
            </div>

            <div className="px-3 py-2">
              <div className="text-sm font-bold text-emerald-600 mb-1 flex items-center"><Scale className="w-4 h-4 mr-2" /> Regulasi</div>
              <div className="ml-6 space-y-1 border-l-2 border-emerald-100 pl-3">
                <button onClick={() => { openRegulasiWithCategory('Undang-Undang'); setIsMobileMenuOpen(false); }} className="w-full text-left flex items-center py-1.5 text-sm text-gray-600 hover:text-emerald-600"><Scale className="w-4 h-4 mr-2 shrink-0" /> Undang-undang RI</button>
                <button onClick={() => { openRegulasiWithCategory('Peraturan Pemerintah'); setIsMobileMenuOpen(false); }} className="w-full text-left flex items-center py-1.5 text-sm text-gray-600 hover:text-emerald-600"><Landmark className="w-4 h-4 mr-2 shrink-0" /> Peraturan Pemerintah</button>
                <button onClick={() => { openRegulasiWithCategory('Keputusan Menteri Agama'); setIsMobileMenuOpen(false); }} className="w-full text-left flex items-center py-1.5 text-sm text-gray-600 hover:text-emerald-600"><BookOpen className="w-4 h-4 mr-2 shrink-0" /> Keputusan Menteri Agama</button>
                <button onClick={() => { openRegulasiWithCategory('Keputusan Kepala BPJPH'); setIsMobileMenuOpen(false); }} className="w-full text-left flex items-center py-1.5 text-sm text-gray-600 hover:text-emerald-600"><FileSignature className="w-4 h-4 mr-2 shrink-0" /> Keputusan Kepala BPJPH</button>
                <button onClick={() => { openRegulasiWithCategory('Peraturan BPOM'); setIsMobileMenuOpen(false); }} className="w-full text-left flex items-center py-1.5 text-sm text-gray-600 hover:text-emerald-600"><ShieldCheck className="w-4 h-4 mr-2 shrink-0" /> Peraturan BPOM</button>
                <button onClick={() => { openRegulasiWithCategory('SNI'); setIsMobileMenuOpen(false); }} className="w-full text-left flex items-center py-1.5 text-sm text-gray-600 hover:text-emerald-600"><Award className="w-4 h-4 mr-2 shrink-0" /> SNI</button>
              </div>
            </div>

            <div className="px-3 py-2">
              <div className="text-sm font-bold text-emerald-600 mb-1 flex items-center"><Newspaper className="w-4 h-4 mr-2" /> Berita</div>
              <div className="ml-6 space-y-1 border-l-2 border-emerald-100 pl-3">
                <a href="#berita" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Berita Utama</a>
                <button onClick={() => { setIsKegiatanPdfOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left py-1 text-sm text-gray-600 hover:text-emerald-600">Kegiatan</button>
                <button onClick={() => { setIsAgendaPdfOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left py-1 text-sm text-gray-600 hover:text-emerald-600">Agenda</button>
              </div>
            </div>

            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-md">
              <div className="flex items-center"><Search className="w-4 h-4 mr-2" /> FAQ</div>
            </a>
            
            <a href="#kontak" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-md">
              <div className="flex items-center"><Phone className="w-4 h-4 mr-2" /> Kontak</div>
            </a>
            
            <div className="px-3 pt-4 pb-2 border-t border-gray-100 mt-2">
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo('login-staff');
                }} 
                className="w-full flex justify-center items-center px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-medium border border-emerald-100"
              >
                <ShieldCheck className="w-4 h-4 mr-2" /> Login Staf LPH
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="beranda" className="pt-48 sm:pt-56 pb-20 bg-emerald-600 text-white flex-1 flex items-center relative overflow-hidden">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center lg:text-left flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 lg:pr-12">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-800/50 border border-emerald-400/30 text-emerald-100 text-sm font-semibold mb-6">
                    <ShieldCheck className="w-4 h-4 mr-2 text-emerald-400" /> Terakreditasi BPJPH & MUI Terintegrasi Cloud
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                    Sistem Cerdas <br/> <span className="text-emerald-200">Sertifikasi Halal.</span>
                </h1>
                <p className="text-lg text-emerald-50 mb-8 max-w-2xl leading-relaxed">
                    Ajukan sertifikasi, unggah dokumen, dan pantau status secara real-time dari mana saja dengan infrastruktur Cloud LPH Al-Ghazali.
                </p>
                <button onClick={() => navigateTo('login')} className="bg-white text-emerald-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-50 shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center mx-auto lg:mx-0">
                    Mulai Pengajuan <ArrowRight className="ml-2 w-5 h-5" />
                </button>
            </div>
            <div className="lg:w-1/2 mt-16 lg:mt-0 hidden md:block">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl relative">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600"><CheckCircle /></div>
                        <div>
                            <h3 className="font-bold text-white">Sinkronisasi Cloud Aktif</h3>
                            <p className="text-emerald-200 text-sm">Data aman & terenkripsi</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-3 bg-emerald-400/50 rounded w-full animate-pulse"></div>
                        <div className="h-3 bg-emerald-400/50 rounded w-5/6 animate-pulse" style={{animationDelay: '150ms'}}></div>
                        <div className="h-3 bg-emerald-400/50 rounded w-4/6 animate-pulse" style={{animationDelay: '300ms'}}></div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Profil Section */}
      <section id="profil" className="py-20 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="md:w-1/2">
                    <Logo className="w-full max-w-sm mx-auto drop-shadow-xl border-4 border-white rounded-3xl bg-white p-8" />
                </div>
                <div className="md:w-1/2">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Profil LPH Al-Ghazali</h2>
                    <p className="text-gray-600 text-lg mb-4 leading-relaxed">
                        Lembaga Pemeriksa Halal (LPH) Al-Ghazali didirikan dengan tujuan mulia untuk memberikan kemudahan dan kepastian hukum bagi pelaku usaha dalam mendapatkan sertifikasi halal dari BPJPH dan fatwa MUI.
                    </p>
                    <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                        Dengan dukungan auditor halal yang kompeten, berintegritas, dan bersertifikasi BNSP, kami berkomitmen untuk menjadi pionir dalam ekosistem halal Indonesia yang terintegrasi dengan teknologi digital cloud.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                            <h4 className="font-bold text-emerald-700 text-2xl mb-1">100+</h4>
                            <p className="text-gray-500 text-sm">Auditor Berpengalaman</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                            <h4 className="font-bold text-emerald-700 text-2xl mb-1">1000+</h4>
                            <p className="text-gray-500 text-sm">Sertifikat Terbit</p>
                        </div>
                    </div>
                    
                    <button 
                      onClick={() => setIsSdmPdfOpen(true)}
                      className="w-full flex items-center justify-between bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm group cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-5 h-5" /> Lihat Profil SDM Syariah (Kepala Manajer Operasional)
                      </span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
      </section>





      {/* Keunggulan / Layanan Section */}
      <section id="layanan" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Mengapa Memilih LPH Al-Ghazali?</h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg">Komitmen kami adalah memberikan pelayanan pemeriksaan halal yang terintegrasi, objektif, dan berorientasi pada kepuasan Pelaku Usaha.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="p-8 border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-shadow bg-gray-50/50">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                        <Zap className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Proses Cepat & Tepat</h3>
                    <p className="text-gray-600">SLA (Service Level Agreement) yang terukur. Plotting auditor dilakukan maksimal 2x24 jam setelah pembayaran invoice terkonfirmasi.</p>
                </div>
                <div className="p-8 border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-shadow bg-gray-50/50">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                        <MonitorSmartphone className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Sistem 100% Digital</h3>
                    <p className="text-gray-600">Pantau proses pengajuan Anda secara real-time melalui Dashboard Pelaku Usaha. Terintegrasi penuh dengan infrastruktur Cloud.</p>
                </div>
                <div className="p-8 border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-shadow bg-gray-50/50">
                    <div className="w-14 h-14 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center mb-6">
                        <UserCheck className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Auditor Berpengalaman</h3>
                    <p className="text-gray-600">Memiliki ratusan Auditor Halal bersertifikasi BNSP yang tersebar di seluruh Indonesia dengan latar belakang keilmuan relevan.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Pendaftaran Sertifikasi Halal Section */}
      <section id="pendaftaran" className="py-20 bg-emerald-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-emerald-600 p-6 md:p-8 text-white text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">Buat Akun SiHalal</h2>
                    <p className="text-emerald-100">Silahkan buat akun menggunakan fitur web SiHalal</p>
                </div>
                <div className="p-6 md:p-8">
                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Ini adalah simulasi form pendaftaran akun SiHalal.'); }}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Pengguna</label>
                            <select required className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700">
                                <option value="">Pilih Tipe Pengguna</option>
                                <option value="pelaku_usaha">Pelaku Usaha</option>
                                <option value="penyelia_halal">Penyelia Halal</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                            <input required type="text" placeholder="Masukan Nama" className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input required type="email" placeholder="Masukan Email" className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Handphone</label>
                            <div className="flex">
                                <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                    +62
                                </span>
                                <input required type="tel" placeholder="Masukan Nomor Handphone" className="flex-1 min-w-0 block w-full px-3 py-3 rounded-none rounded-r-md border border-gray-300 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi</label>
                            <input required type="password" placeholder="Masukan kata sandi" className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Kata Sandi</label>
                            <input required type="password" placeholder="Masukan konfirmasi kata sandi" className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700" />
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors">
                                Daftar
                            </button>
                        </div>
                        <div className="text-center mt-4">
                            <p className="text-sm text-gray-600">
                                Sudah punya akun? <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">Masuk di sini</a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      </section>

      {/* Ruang Lingkup Section */}
      <section id="ruang-lingkup" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ruang Lingkup & Layanan Pemeriksaan Halal</h2>
                <h3 className="text-xl md:text-2xl font-semibold text-emerald-600">LPH Al ghazali Halal Indonesia</h3>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700 bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm leading-relaxed">
                <p className="mb-6 text-justify">
                    LPH Al-Ghazali memiliki fokus layanan terbatas yang disesuaikan secara khusus demi mengawal kesuksesan sertifikasi halal secara menyeluruh dengan parameter ruang lingkup sebagai berikut:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center justify-center text-emerald-700 font-medium shadow-sm">
                       <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" /> 1. Makanan & Minuman
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center justify-center text-emerald-700 font-medium shadow-sm">
                       <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" /> 2. Barang Gunaan
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center justify-center text-emerald-700 font-medium shadow-sm">
                       <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" /> 3. Jasa Pendistribusian
                    </div>
                </div>
                <div className="space-y-4 text-justify mt-6 border-b border-gray-200 pb-8">
                    <div className="flex items-start gap-2.5">
                        <span className="font-bold text-emerald-600 shrink-0">📍 Wilayah Klien:</span>
                        <span>Seluruh wilayah <strong>Provinsi Jawa Tengah</strong>, mencakup secara komprehensif mulai dari tingkat <strong>Kabupaten, Kecamatan, Kelurahan, hingga tingkat Desa</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                        <span className="font-bold text-emerald-600 shrink-0">👥 Jenis Usaha:</span>
                        <span>Hanya untuk pelaku usaha skala <strong>Mikro dan Kecil</strong> (Usaha menengah dan besar tidak dilayani).</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                        <span className="font-bold text-emerald-600 shrink-0">🛠️ Jenis Layanan:</span>
                        <span>Dikhususkan hanya untuk layanan pemeriksaan skema <strong>Reguler</strong> saja.</span>
                    </div>
                </div>

                {/* Layanan Pra-Audit Block */}
                <div className="mt-8 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100/70 shadow-xs">
                    <h4 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        Layanan Pra-Audit (Opsional)
                    </h4>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        Kami menyediakan Layanan Pra-Audit opsional untuk membantu kesiapan pelaku usaha melakukan sertifikasi. Layanan konsultasi umum ditiadakan, yang tersedia kini hanyalah pengecekan teknis pra-audit.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-3xs">
                            <span className="font-bold text-emerald-800 text-sm block mb-1">🔍 Pemeriksaan Dokumen</span>
                            <span className="text-xs text-gray-600 leading-relaxed block">Pengecekan kesiapan berkas dokumen, legalitas pendaftaran, dan struktur Sistem Jaminan Produk Halal (SJPH).</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-3xs">
                            <span className="font-bold text-emerald-800 text-sm block mb-1">🌾 Pemeriksaan Bahan Baku</span>
                            <span className="text-xs text-gray-600 leading-relaxed block">Verifikasi dan pengecekan awal asal-usul bahan baku serta kesesuaian sertifikat halal pendukung masing-masing bahan.</span>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-dashed border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                        <span className="font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider shrink-0 mt-0.5">Catatan Biaya</span>
                        <span>Biaya pelaksanaan Layanan Pra-Audit ini sepenuhnya terpisah dan independen dari biaya sertifikasi reguler BPJPH.</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Proses Sertifikasi Section */}
      <section id="alur-sertifikasi" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-sans">Alur Layanan Reguler (Ringkas)</h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg">Alur terstandarisasi yang ringkas dan spesifik untuk pendampingan kemudahan sertifikasi halal draf reguler bagi UMK di Jawa Tengah.</p>
            </div>
            
            <div className="relative">
                <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-emerald-200"></div>
                <div className="space-y-12">
                    {/* Alur 1 */}
                    <div className="relative flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 md:pr-12 md:text-right text-center mb-4 md:mb-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">1. Registrasi Klien (UMK Jateng)</h3>
                            <p className="text-gray-650 text-sm">Pelaku usaha mikro dan kecil (UMK) wilayah Jawa Tengah melakukan pendaftaran di portal sistem layanan LPH Al-Ghazali.</p>
                            <div className="mt-3 text-xs bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 inline-block text-left shadow-sm">
                                <span className="font-bold text-emerald-950 uppercase tracking-wide bg-emerald-200 px-1.5 py-0.5 rounded text-[10px] mr-2">Edukasi Wilayah</span>
                                Registrasi diarahkan khusus bagi UMK Jawa Tengah agar memperoleh bimbingan teknis yang optimal sesuai standar operasional yang dikoordinasikan secara kedaerahan.
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl relative z-10 mx-auto md:mx-0 shadow-lg border-4 border-gray-50 shrink-0">1</div>
                        <div className="md:w-1/2 md:pl-12 hidden md:block"></div>
                    </div>

                    {/* Alur 2 */}
                    <div className="relative flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 md:pr-12 hidden md:block"></div>
                        <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl relative z-10 mx-auto md:mx-0 mb-4 md:mb-0 shadow-lg border-4 border-gray-50 shrink-0">2</div>
                        <div className="md:w-1/2 md:pl-12 text-center md:text-left">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">2. Pilih Layanan: Reguler</h3>
                            <p className="text-gray-650 text-sm">Klien memilih skema Layanan Reguler untuk proses audit mandiri yang komprehensif.</p>
                            <div className="mt-3 text-xs bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 inline-block text-left shadow-sm">
                                <span className="font-bold text-emerald-950 uppercase tracking-wide bg-emerald-200 px-1.5 py-0.5 rounded text-[10px] mr-2">Edukasi Skema</span>
                                Sertifikasi jalur Reguler ini memproses pemeriksaan kehalalan produk secara saksama untuk memberikan tingkat kepercayaan dan jaminan mutu tertinggi bagi konsumen.
                            </div>
                        </div>
                    </div>

                    {/* Alur 3 */}
                    <div className="relative flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 md:pr-12 md:text-right text-center mb-4 md:mb-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">3. Upload Dokumen Persyaratan</h3>
                            <p className="text-gray-650 text-sm">Unggah dokumen pelengkap secara digital sesuai dengan jenis produk spesifik yang didaftarkan.</p>
                            <div className="mt-3 text-xs bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 inline-block text-left shadow-sm">
                                <span className="font-bold text-emerald-950 uppercase tracking-wide bg-emerald-200 px-1.5 py-0.5 rounded text-[10px] mr-2">Edukasi Dokumen</span>
                                Persyaratan mencakup data profil, formulasi bahan, serta bagan alir proses. Dokumen yang diunggah secara lengkap di awal akan mempercepat verifikasi berkas tanpa kendala revisi.
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl relative z-10 mx-auto md:mx-0 shadow-lg border-4 border-gray-50 shrink-0">3</div>
                        <div className="md:w-1/2 md:pl-12 hidden md:block"></div>
                    </div>

                    {/* Alur 4 */}
                    <div className="relative flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 md:pr-12 hidden md:block"></div>
                        <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl relative z-10 mx-auto md:mx-0 mb-4 md:mb-0 shadow-lg border-4 border-gray-50 shrink-0">4</div>
                        <div className="md:w-1/2 md:pl-12 text-center md:text-left">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">4. Pembayaran (Pra-Audit Mandiri)</h3>
                            <p className="text-gray-650 text-sm">Pelaku usaha melakukan penyelesaian administrasi biaya pra-audit jika dikenakan biaya pendampingan mandiri.</p>
                            <div className="mt-3 text-xs bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 inline-block text-left shadow-sm">
                                <span className="font-bold text-emerald-950 uppercase tracking-wide bg-emerald-200 px-1.5 py-0.5 rounded text-[10px] mr-2">Edukasi Biaya</span>
                                Sesuai asas nirlaba draf kemitraan UMK, nilai biaya pra-audit atau bimbingan teknis dijaga seminimal mungkin dan dijabarkan transparan demi mencegah adanya biaya ganda tersembunyi.
                             </div>
                        </div>
                    </div>

                    {/* Alur 5 */}
                    <div className="relative flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 md:pr-12 md:text-right text-center mb-4 md:mb-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">5. Penjadwalan Audit (Dalam 1 Hari)</h3>
                            <p className="text-emerald-700 font-bold text-sm mb-2 font-sans">Penjadwalan diverifikasi langsung selesai dalam waktu 1 (satu) hari.</p>
                            <p className="text-gray-650 text-sm">Penetapan tanggal kunjungan verifikasi lapangan dikonfirmasi secara instan oleh admin LPH Al-Ghazali.</p>
                            <div className="mt-3 text-xs bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 inline-block text-left shadow-sm">
                                <span className="font-bold text-emerald-950 uppercase tracking-wide bg-emerald-200 px-1.5 py-0.5 rounded text-[10px] mr-2">Edukasi Waktu</span>
                                Sebagai bentuk kepedulian terhadap efisiensi operasional UMK, penugasan Tim Auditor Halal ditetapkan secara tanggap paling lambat dalam 24 jam setelah verifikasi berkas.
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl relative z-10 mx-auto md:mx-0 shadow-lg border-4 border-gray-50 shrink-0">5</div>
                        <div className="md:w-1/2 md:pl-12 hidden md:block"></div>
                    </div>

                    {/* Alur 6 */}
                    <div className="relative flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 md:pr-12 hidden md:block"></div>
                        <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl relative z-10 mx-auto md:mx-0 mb-4 md:mb-0 shadow-lg border-4 border-gray-50 shrink-0">6</div>
                        <div className="md:w-1/2 md:pl-12 text-center md:text-left">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">6. Audit & Pemeriksaan Spesifik</h3>
                            <p className="text-amber-700 font-bold text-sm mb-2 font-sans">Pemeriksaan difokuskan pada bahan baku tanpa validasi penyembelihan eksternal.</p>
                            <p className="text-gray-650 text-sm">Auditor melakukan tinjauan teknis dan pencocokan bahan baku serta kebersihan fasilitas produksi secara terfokus.</p>
                            <div className="mt-3 text-xs bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 inline-block text-left shadow-sm">
                                <span className="font-bold text-emerald-950 uppercase tracking-wide bg-emerald-200 px-1.5 py-0.5 rounded text-[10px] mr-2">Edukasi Audit</span>
                                Berdasarkan kemitraan teknis draf PKS ringkas UMK terbaru, hambatan verifikasi disederhanakan dengan memangkas validasi audit hulu sembelih rumit di luar kendali UMK, berfokus murni pada penjaminan mutu internal pelaku usaha kecil.
                            </div>
                        </div>
                    </div>

                    {/* Alur 7 */}
                    <div className="relative flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 md:pr-12 md:text-right text-center mb-4 md:mb-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">7. Keputusan Hasil LPH</h3>
                            <p className="text-emerald-700 font-bold text-sm mb-2 font-sans font-medium">Keputusan penetapan laporan audit diterbitkan maksimal pada hari ke-3.</p>
                            <p className="text-gray-650 text-sm">Penyusunan laporan akhir pemeriksaan halal dan perumusan keputusan rekomendasi kehalalan oleh Tim Ahli LPH.</p>
                            <div className="mt-3 text-xs bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 inline-block text-left shadow-sm">
                                <span className="font-bold text-emerald-950 uppercase tracking-wide bg-emerald-200 px-1.5 py-0.5 rounded text-[10px] mr-2">Edukasi Fatwa</span>
                                LPH Al-Ghazali mendukung penyelesaian laporan dalam hari ke-3 secara presisi untuk langsung diteruskan ke Komisi Fatwa MUI demi pengesahan Ketetapan Halal.
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl relative z-10 mx-auto md:mx-0 shadow-lg border-4 border-gray-50 shrink-0">7</div>
                        <div className="md:w-1/2 md:pl-12 hidden md:block"></div>
                    </div>

                    {/* Alur 8 */}
                    <div className="relative flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 md:pr-12 hidden md:block"></div>
                        <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl relative z-10 mx-auto md:mx-0 mb-4 md:mb-0 shadow-lg border-4 border-gray-50 shrink-0">8</div>
                        <div className="md:w-1/2 md:pl-12 text-center md:text-left">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">8. Terbit Sertifikat (Digital)</h3>
                            <p className="text-gray-650 text-sm">Sertifikat Halal resmi berbasis format digital diterbitkan oleh BPJPH dan dapat diunduh kapan saja oleh pelaku usaha.</p>
                            <div className="mt-3 text-xs bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 inline-block text-left shadow-sm">
                                <span className="font-bold text-emerald-950 uppercase tracking-wide bg-emerald-200 px-1.5 py-0.5 rounded text-[10px] mr-2">Edukasi Regulasi</span>
                                Sesuai regulasi UU No. 6 Tahun 2023, Sertifikat Halal digital yang terbit kini berlaku penuh seumur hidup (selamanya) selama pelaku usaha tidak merubah bahan baku atau proses pengolahan yang disepakati.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Perkiraan Waktu Proses Halal Block */}
            <div className="mt-16 bg-white rounded-2xl p-8 border border-emerald-100 shadow-sm max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-100 pb-6 mb-6">
                    <div className="mb-4 md:mb-0">
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Clock className="w-6 h-6 text-emerald-600" /> Perkiraan Waktu Proses Halal
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">Komitmen efisiensi dan transparansi waktu pemeriksaan oleh LPH Al-Ghazali</p>
                    </div>
                    <div className="bg-emerald-100 text-emerald-800 font-extrabold px-4 py-2 rounded-xl text-lg flex items-center gap-2 border border-emerald-200">
                        <span>Standar Proses:</span>
                        <span className="text-emerald-950 font-mono">1-3 Hari Kerja</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    {/* Step Card 1 */}
                    <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100/50 flex flex-col justify-between relative">
                        <div>
                            <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider block mb-2 font-mono">Hari 1</span>
                            <h4 className="font-bold text-gray-900 text-base mb-2">Verifikasi Awal & Jadwal</h4>
                            <p className="text-gray-650 text-xs leading-relaxed">Pemeriksaan kelengkapan berkas administrasi dan penetapan jadwal kunjungan audit lapangan.</p>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-emerald-600 font-semibold gap-1">
                            <CheckCircle className="w-4 h-4 shrink-0" /> Dokumen Disiapkan
                        </div>
                    </div>

                    {/* Step Card 2 */}
                    <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100/50 flex flex-col justify-between relative">
                        <div>
                            <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider block mb-2 font-mono">Hari 2</span>
                            <h4 className="font-bold text-gray-900 text-base mb-2">Audit Lapangan & Dokumen</h4>
                            <p className="text-gray-650 text-xs leading-relaxed">Auditor Halal melakukan konfirmasi validitas bahan baku dan proses produksi langsung di lokasi fasilitas usaha.</p>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-emerald-600 font-semibold gap-1">
                            <CheckCircle className="w-4 h-4 shrink-0" /> Auditor Bertugas
                        </div>
                    </div>

                    {/* Step Card 3 */}
                    <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100/50 flex flex-col justify-between relative">
                        <div>
                            <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider block mb-2 font-mono">Hari 3</span>
                            <h4 className="font-bold text-gray-900 text-base mb-2">Keputusan Halal Sementara</h4>
                            <p className="text-gray-650 text-xs leading-relaxed">Keluarnya keputusan halal sementara dari LPH Al-Ghazali (selanjutnya diteruskan menunggu penetapan fatwa resmi MUI).</p>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-emerald-600 font-semibold gap-1">
                            <CheckCircle className="w-4 h-4 shrink-0" /> Hasil Audit Selesai
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-xs text-justify bg-amber-50 text-amber-900 p-4 rounded-xl border border-amber-100 leading-relaxed shadow-xs flex items-start gap-2.5">
                    <span className="font-bold bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider shrink-0 mt-0.5">Catatan Penting</span>
                    <span>Proses 1-3 Hari Kerja ini berlaku penuh setelah invoice biaya administrasi diselesaikan secara sah, serta seluruh berkas portofolio SJPH (Sistem Jaminan Produk Halal) tidak memerlukan revisi lanjutan administratif. Keputusan akhir sertifikat halal diterbitkan resmi oleh BPJPH RI setelah rekomendasi sidang Fatwa Komisi MUI terlaksana.</span>
                </div>
            </div>
        </div>
      </section>

      {/* Tarif Layanan Section */}
      <section id="tarif-layanan" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tarif Layanan Sertifikasi Halal (Khusus UMK)</h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg">Biaya layanan pemeriksaan halal LPH Al-Ghazali transparan dan dibatasi untuk Usaha Mikro dan Kecil saja sesuai regulasi BPJPH.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-100 shadow-sm text-center">
                    <h3 className="font-bold text-gray-900 text-xl mb-2">Usaha Mikro (UMK-1)</h3>
                    <p className="text-gray-600 text-sm mb-6">Reguler (Khusus wilayah Jawa Tengah)</p>
                    <div className="text-emerald-600 font-extrabold text-3xl mb-6">Mulai Rp 300rb</div>
                    <ul className="text-left text-sm text-gray-600 space-y-3 mb-8">
                        <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Pemeriksaan dokumen dasar</li>
                        <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Audit lapangan standar (1 lokasi)</li>
                        <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Durasi audit terhitung sederhana (1 Mandays)</li>
                    </ul>
                </div>
                <div className="bg-white rounded-2xl p-8 border-2 border-emerald-500 shadow-xl text-center relative">
                    <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full absolute -top-3 left-1/2 transform -translate-x-1/2">Pilihan Populer</div>
                    <h3 className="font-bold text-gray-900 text-xl mb-2">Usaha Kecil (UMK-2)</h3>
                    <p className="text-gray-600 text-sm mb-6">Reguler (Khusus wilayah Jawa Tengah)</p>
                    <div className="text-emerald-700 font-extrabold text-3xl mb-6">Mulai Rp 300rb</div>
                    <ul className="text-left text-sm text-gray-600 space-y-3 mb-8">
                        <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Pemeriksaan dokumen lanjutan</li>
                        <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Audit lapangan komprehensif (s/d 2 lokasi)</li>
                        <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Durasi audit terstruktur (2 Mandays)</li>
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* Simulasi Perhitungan Biaya Section */}
      <section id="form-perhitungan-biaya" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Simulasi Perhitungan Biaya</h2>
                <p className="text-gray-500">Silakan lengkapi form berikut untuk estimasi biaya sertifikasi halal.</p>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Form Input Container */}
                <div className="lg:w-1/2 w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <form className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi (Fokus Layanan)</label>
                                <input type="text" name="provinsi" value="Jawa Tengah" readOnly className="w-full border-gray-300 rounded-lg border p-3 bg-gray-100 text-gray-600 focus:ring-emerald-500 focus:border-emerald-500 cursor-not-allowed font-medium shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten / Kota</label>
                                <input type="text" name="kabKota" value={formData.kabKota} onChange={handleFormChange} placeholder="Contoh: Cilacap, Banyumas" className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700 shadow-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
                                <input type="text" name="kecamatan" value={formData.kecamatan || ''} onChange={handleFormChange} placeholder="Contoh: Kesugihan" className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700 shadow-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kelurahan / Desa</label>
                                <input type="text" name="kelurahanDesa" value={formData.kelurahanDesa || ''} onChange={handleFormChange} placeholder="Contoh: Kesugihan Kidul" className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700 shadow-sm" required />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Layanan</label>
                                <input type="text" name="jenisLayanan" value="Reguler" readOnly className="w-full border-gray-300 rounded-lg border p-3 bg-gray-100 text-gray-600 focus:ring-emerald-500 focus:border-emerald-500 cursor-not-allowed font-medium shadow-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Produk</label>
                                <select name="jenisProduk" value={formData.jenisProduk} onChange={handleFormChange} className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700 shadow-sm">
                                    <option value="">Pilih Jenis Produk</option>
                                    <option value="Makanan & Minuman">Makanan & Minuman</option>
                                    <option value="Barang Gunaan">Barang Gunaan</option>
                                    <option value="Jasa Pendistribusian">Jasa Pendistribusian</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Skala Usaha</label>
                                <select name="skalaUsaha" value={formData.skalaUsaha} onChange={handleFormChange} className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700 shadow-sm">
                                    <option value="">Pilih Skala Usaha...</option>
                                    <option value="Mikro">Mikro</option>
                                    <option value="Kecil">Kecil</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Produk</label>
                                <input name="jumlahProduk" type="number" min="0" value={formData.jumlahProduk || ''} onChange={handleFormChange} placeholder="Isi jumlah produk" className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pabrik / Cabang</label>
                                <input name="jumlahPabrik" type="number" min="0" value={formData.jumlahPabrik || ''} onChange={handleFormChange} placeholder="Isi jumlah pabrik / cabang" className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lembaga Pemeriksa Halal (LPH)</label>
                                <input type="text" value="LPH ALGHAZALI" readOnly className="w-full border-gray-300 rounded-lg border p-3 bg-gray-100 text-gray-600 focus:ring-emerald-500 focus:border-emerald-500 cursor-not-allowed" />
                            </div>
                            <div className="md:col-span-2 pt-4">
                                <button type="button" onClick={() => {
                                    const el = document.getElementById('detail-hasil-perhitungan');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }} className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors flex items-center justify-center">
                                    <Calculator className="w-5 h-5 mr-2" />
                                    Hitung
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Detail Hasil Perhitungan Container */}
                <div className="lg:w-1/2 w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100" id="detail-hasil-perhitungan">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Detail Hasil Perhitungan</h3>
                        <p className="text-sm text-gray-500">Rincian estimasi biaya sertifikasi halal Anda.</p>
                    </div>

                    <div className="space-y-6">
                        {/* Mandays */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mandays</h4>
                            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                <div className="flex items-center gap-2"><span className="font-semibold bg-white px-2 py-1 rounded border border-gray-200 min-w-[2rem] text-center">{mandays}</span> <span className="text-gray-400">×</span></div>
                                <div className="flex items-center gap-2 flex-grow justify-between"><span className="text-gray-500 whitespace-nowrap">Unit Cost</span> <span className="font-medium bg-white px-2 py-1 rounded border border-gray-200">{formatRp(unitCost)}</span></div>
                                <div className="flex items-center gap-2 min-w-[6rem] justify-end"><span className="text-gray-500 hidden sm:inline">Harga</span> <span className="font-bold text-gray-900">{formatRp(hargaMandoc)}</span></div>
                            </div>
                        </div>

                        {/* Operasional */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Operasional</h4>
                            <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                <div className="flex items-center justify-between text-gray-700">
                                    <span className="font-medium">Operasional</span>
                                    <div className="flex items-center gap-3">
                                        <span>{formatRp(operasional)}</span>
                                        <span className="font-bold text-gray-900 min-w-[3rem] text-right">{formatRp(operasional)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-gray-700 border-t border-gray-200 pt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold bg-white px-2 py-0.5 rounded border border-gray-200 min-w-[1.5rem] text-center text-xs">{mandays}</span>
                                            <span className="text-gray-400 text-xs">×</span>
                                        </div>
                                        <span className="text-gray-600">UHPD</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span>{formatRp(unitUhpd)}</span>
                                        <span className="font-bold text-gray-900 min-w-[3rem] text-right">{formatRp(hargaUhpd)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-gray-700 border-t border-gray-200 pt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold bg-white px-2 py-0.5 rounded border border-gray-200 min-w-[1.5rem] text-center text-xs">{mandays}</span>
                                            <span className="text-gray-400 text-xs">×</span>
                                        </div>
                                        <span className="text-gray-600">Transportasi</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span>{formatRp(unitTransport)}</span>
                                        <span className="font-bold text-gray-900 min-w-[3rem] text-right">{formatRp(hargaTransport)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-gray-700 border-t border-gray-200 pt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold bg-white px-2 py-0.5 rounded border border-gray-200 min-w-[1.5rem] text-center text-xs">{dDays}</span>
                                            <span className="text-gray-400 text-xs">×</span>
                                        </div>
                                        <span className="text-gray-600">Akomodasi</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span>{formatRp(unitAkomodasi)}</span>
                                        <span className="font-bold text-gray-900 min-w-[3rem] text-right">{formatRp(hargaAkomodasi)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Costs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Tiket Pesawat */}
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tiket Pesawat</h4>
                                <div className="flex justify-between items-center text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                    <select name="tiketPesawat" value={formData.tiketPesawat} onChange={handleFormChange} className="bg-transparent border-none p-0 focus:ring-0 text-xs font-medium w-full min-w-0 pr-1 text-gray-600">
                                        <option value={0}>Tidak memerlukan tiket</option>
                                        <option value={1000000}>Dalam Pulau (Rp 1 jt)</option>
                                        <option value={3000000}>Luar Pulau (Rp 3 jt)</option>
                                    </select>
                                    <span className="font-bold text-gray-900 whitespace-nowrap">{formatRp(formData.tiketPesawat)}</span>
                                </div>
                            </div>

                            {/* Pendaftaran, dsb */}
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 truncate" title="Pendaftaran, Verifikasi, Penerbitan SH">Pendaftaran & Penerbitan SH</h4>
                                <div className="flex justify-between items-center text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                    <span className="font-medium text-xs text-gray-600">{formatRp(pendaftaran)}</span>
                                    <span className="font-bold text-gray-900">{formatRp(pendaftaran)}</span>
                                </div>
                            </div>

                            {/* Penetapan KH */}
                            <div className="sm:col-span-2">
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Penetapan KH</h4>
                                <div className="flex justify-between items-center text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                    <span className="font-medium text-xs text-gray-600">{formatRp(penetapanKH)}</span>
                                    <span className="font-bold text-gray-900">{formatRp(penetapanKH)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Grand Total */}
                        <div className="mt-6 border-t border-gray-200 border-dashed pt-4 flex justify-between items-center bg-emerald-50/50 p-4 rounded-xl">
                            <span className="text-lg font-bold text-gray-900">Grand Total</span>
                            <div className="flex items-center text-xl font-extrabold text-emerald-600">
                                {formatRp(grandTotal)}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-xs text-emerald-800 flex gap-2 items-start">
                        <span className="font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded shrink-0">Catatan</span>
                        <span className="leading-relaxed">Perhitungan biaya mengacu pada Kep Kaban No. 22 Tahun 2024 sebagai tarif batas atas. LPH dapat menyesuaikan biaya sesuai kebijakan masing-masing.</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Berita & Edukasi Section */}
      <section id="berita" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Berita & Edukasi Halal</h2>
                    <p className="text-gray-500 max-w-2xl text-lg">Update seputar regulasi halal, kegiatan LPH Al-Ghazali, dan edukasi sertifikasi untuk masyarakat.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {beritaList && beritaList.length > 0 ? (
                    beritaList.slice(0, 3).map((berita: any) => (
                        <div key={berita.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                            <div className="h-48 bg-gray-200 relative overflow-hidden flex items-center justify-center">
                                {berita.fileType && berita.fileType.includes('image') && berita.fileData ? (
                                    <img src={berita.fileData} alt={berita.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : berita.fileType && berita.fileType.includes('video') && berita.fileData ? (
                                    <video src={berita.fileData} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" controls muted />
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center">
                                        <Newspaper className="w-12 h-12 mb-2" />
                                        <span className="text-xs">Media tidak tersedia</span>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">{berita.category}</div>
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="text-xs text-gray-500 mb-3 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" /> {new Date(berita.createdAt).toLocaleDateString('id-ID')}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors line-clamp-2">{berita.title}</h3>
                                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{berita.content}</p>
                                
                                {berita.fileType && berita.fileType.includes('pdf') && (
                                    <div className="mt-2 mb-4 p-2 bg-red-50 text-red-600 rounded text-xs flex items-center border border-red-100">
                                        <FileText className="w-4 h-4 mr-2" /> Lampiran PDF Tersedia
                                    </div>
                                )}
                                {berita.socialMediaLink && (
                                     <a href={berita.socialMediaLink} target="_blank" rel="noreferrer" className="mt-2 mb-4 p-2 bg-blue-50 text-blue-600 rounded text-xs flex items-center border border-blue-100 hover:underline">
                                         <Link className="w-4 h-4 mr-2" /> Lihat Tautan Sosial Media
                                     </a>
                                )}
                                
                                <a href="#" className="mt-auto inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700">Baca selengkapnya &rarr;</a>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-3 text-center py-12 text-gray-500">
                        <Newspaper className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Belum ada artikel yang dipublikasikan.</p>
                    </div>
                )}
            </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tanya Jawab (FAQ)</h2>
                <p className="text-gray-500 text-lg">Pertanyaan yang sering diajukan terkait layanan sertifikasi halal.</p>
            </div>
            <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 cursor-pointer hover:bg-emerald-50 transition-colors">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center justify-between">
                        Berapa lama proses sertifikasi halal berlangsung?
                        <ArrowRight className="w-5 h-5 text-emerald-600" />
                    </h3>
                    <div className="text-gray-650 text-sm space-y-2">
                        <p>LPH Al-Ghazali berkomitmen mewujudkan efisiensi tinggi dengan <strong>Standar Proses: 1-3 Hari Kerja</strong> sejak pembayaran administrasi diselesaikan secara sah:</p>
                        <ul className="list-disc list-inside space-y-1 pl-2 text-gray-600">
                            <li><strong>Hari 1:</strong> Verifikasi awal berkas administrasi dan penetapan jadwal kunjungan audit lapangan.</li>
                            <li><strong>Hari 2:</strong> Pemeriksaan/audit lapangan serta pengecekan dokumen pendukung kehalalan oleh Auditor Halal.</li>
                            <li><strong>Hari 3:</strong> Keluarnya keputusan rilis status halal sementara di tingkat LPH (selanjutnya dikirim ke Komisi Fatwa MUI jika diperlukan).</li>
                        </ul>
                    </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 cursor-pointer hover:bg-emerald-50 transition-colors">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center justify-between">
                        Apakah data perusahaan saya aman?
                        <ArrowRight className="w-5 h-5 text-emerald-600" />
                    </h3>
                    <p className="text-gray-600">Ya, LPH Al-Ghazali menggunakan infrastruktur Cloud modern yang memastikan setiap dokumen pengajuan dan data perusahaan terenkripsi serta hanya dapat diakses oleh pihak yang berwenang.</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 cursor-pointer hover:bg-emerald-50 transition-colors">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center justify-between">
                        Bagaimana cara melacak status pengajuan saya?
                        <ArrowRight className="w-5 h-5 text-emerald-600" />
                    </h3>
                    <p className="text-gray-600">Pelaku usaha dapat masuk (login) ke Portal Cloud menggunakan akun yang terdaftar untuk melihat perkembangan dan status pengajuan secara real-time pada Dashboard.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Prosedur Tanggung Gugat Section */}
      <section id="tanggung-gugat" className="py-20 bg-gray-50 border-t border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-100/70 px-3 py-1 rounded-full text-center inline-block">Keadilan & Transparansi</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-4">Prosedur Tanggung Gugat</h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg">Mekanisme resmi pengajuan keberatan pelaku usaha atas hasil pemeriksaan/audit kehalalan dari LPH Al-Ghazali.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                
                {/* Left Side: 5 Key Procedural Rules */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Scale className="w-5 h-5 text-emerald-600" /> Regulasi & Ketentuan Penyelesaian
                        </h3>
                        
                        <div className="space-y-6">
                            
                            {/* Clause 1 */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold font-mono shrink-0">1</div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-base mb-1">Batas Waktu Pengajuan (3x24 Jam)</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">Klien pelaku usaha dapat secara sah mengajukan keberatan resmi atas hasil keputusan audit dalam jangka waktu paling lambat <strong>3x24 jam (tiga hari kalender)</strong> sejak hasil penilaian diumumkan atau dirilis.</p>
                                </div>
                            </div>

                            {/* Clause 2 */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold font-mono shrink-0">2</div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-base mb-1">Pengajuan via Formulir Online Resmi</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">Keberatan wajib diajukan secara tertulis dengan melampirkan berkas bukti pendukung secara mandiri melalui <strong>formulir online interaktif</strong> yang disediakan di portal resmi LPH Al-Ghazali.</p>
                                </div>
                            </div>

                            {/* Clause 3 */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold font-mono shrink-0">3</div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-base mb-1">Verifikasi Ulang Cepat (2 Hari Kerja)</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">Komite Teknis dan Tim Auditor LPH Al-Ghazali diwajibkan untuk meneliti kembali berkas dan melakukan <strong>verifikasi ulang dalam waktu maksimal 2 (dua) hari kerja</strong> setelah permohonan keberatan diterima dengan lengkap.</p>
                                </div>
                            </div>

                            {/* Clause 4 */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold font-mono shrink-0">4</div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-base mb-1">Tanggung Gugat & Pembebanan Biaya</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">Jika setelah diverifikasi ulang hasil akhir audit dinyatakan <strong>tetap tidak halal/tidak memenuhi syarat</strong>, maka seluruh biaya operasional verifikasi ulang menjadi tanggung gugat yang <strong>ditanggung sepenuhnya oleh pemohon</strong>.</p>
                                </div>
                            </div>

                            {/* Clause 5 */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold font-mono shrink-0">5</div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-base mb-1">Keputusan Bersifat Final</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">Hasil peninjauan kembali oleh Komite Teknis LPH Al-Ghazali pasca verifikasi ulang bersifat <strong>mutlak, mengikat secara hukum, serta final</strong>.</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                
                {/* Right Side: Interactive Online Form */}
                <div className="lg:col-span-5">
                    <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8"></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <FileSignature className="w-5 h-5 text-emerald-600" /> Formulir Keberatan Online
                        </h3>
                        <p className="text-xs text-gray-500 mb-6">Gunakan formulir elektronik ini untuk mengajukan sanggahan resmi atas hasil keputusan audit.</p>
                        
                        {appealSubmitStatus === 'success' ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center animate-fadeIn">
                                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                                <h4 className="font-bold text-emerald-950 text-base mb-2">Sanggahan Berhasil Terkirim</h4>
                                <p className="text-xs text-emerald-800 leading-relaxed mb-4">
                                    Pengajuan Tanggung Gugat Anda dengan Nomor Registrasi <strong className="font-mono">{appealForm.noRegistrasi}</strong> telah tercatat secara sukses dalam basis cloud LPH Al-Ghazali.
                                </p>
                                <div className="text-left text-xs bg-white border border-emerald-200/50 rounded-lg p-3 space-y-2 mb-6">
                                    <div><strong className="text-emerald-950">Nama Usaha:</strong> {appealForm.namaUsaha}</div>
                                    <div><strong className="text-emerald-950">Email Klien:</strong> {appealForm.email}</div>
                                    <div className="truncate"><strong className="text-emerald-950">Alasan:</strong> {appealForm.alasanKeberatan}</div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setAppealSubmitStatus(null);
                                        setAppealForm({
                                            noRegistrasi: '',
                                            namaUsaha: '',
                                            email: '',
                                            alasanKeberatan: '',
                                            persetujuanBiaya: false
                                        });
                                    }} 
                                    className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
                                >
                                    Ajukan Pengajuan Baru
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                setAppealSubmitStatus('loading');
                                setTimeout(() => {
                                    setAppealSubmitStatus('success');
                                }, 1000);
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">No. Registrasi SIHALAL / Invoice *</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Contoh: REG/2026/05/9821" 
                                        value={appealForm.noRegistrasi}
                                        onChange={(e) => setAppealForm({ ...appealForm, noRegistrasi: e.target.value })}
                                        className="w-full text-sm border-gray-200 rounded-lg border p-2.5 bg-gray-50/50 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800" 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Pelaku Usaha / Perusahaan *</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Contoh: CV. Berkah Makmur" 
                                        value={appealForm.namaUsaha}
                                        onChange={(e) => setAppealForm({ ...appealForm, namaUsaha: e.target.value })}
                                        className="w-full text-sm border-gray-200 rounded-lg border p-2.5 bg-gray-50/50 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Email Korespondensi *</label>
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="Contoh: berkahmakmur@gmail.com" 
                                        value={appealForm.email}
                                        onChange={(e) => setAppealForm({ ...appealForm, email: e.target.value })}
                                        className="w-full text-sm border-gray-200 rounded-lg border p-2.5 bg-gray-50/50 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Detail Justifikasi & Alasan Keberatan *</label>
                                    <textarea 
                                        required
                                        rows={4}
                                        placeholder="Berikan bukti pendukung kehalalan, atau sanggahan administratif secara mendetail..." 
                                        value={appealForm.alasanKeberatan}
                                        onChange={(e) => setAppealForm({ ...appealForm, alasanKeberatan: e.target.value })}
                                        className="w-full text-sm border-gray-200 rounded-lg border p-2.5 bg-gray-50/50 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 resize-none animate-none" 
                                    ></textarea>
                                </div>

                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2.5">
                                    <input 
                                        type="checkbox" 
                                        required
                                        id="persetujuanBiaya"
                                        checked={appealForm.persetujuanBiaya}
                                        onChange={(e) => setAppealForm({ ...appealForm, persetujuanBiaya: e.target.checked })}
                                        className="mt-1 border-gray-300 rounded text-amber-600 focus:ring-amber-500 h-4 w-4 shrink-0 transition-colors cursor-pointer" 
                                    />
                                    <label htmlFor="persetujuanBiaya" className="text-[10px] text-amber-900 leading-snug select-none cursor-pointer">
                                        Saya menyetujui bahwa biaya audit ulang ditanggung oleh pihak kami jika keputusan akhir tetap dinyatakan tidak halal, serta memahami keputusan tanggung gugat ini bersifat final.
                                    </label>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={appealSubmitStatus === 'loading'}
                                    className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
                                >
                                    {appealSubmitStatus === 'loading' ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Mengirimkan Berkas...
                                        </>
                                    ) : (
                                        <>Kirim Pengajuan Keberatan</>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

            </div>
        </div>
      </section>

      {/* Kontak Section */}
      <section id="kontak" className="py-20 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Hubungi Kami</h2>
                <p className="text-emerald-700 font-medium text-lg">LPH Al Ghazali Halal Indonesia</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Contact Info */}
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Informasi Kontak</h3>
                    
                    <div className="space-y-6 mb-10">
                        <div className="flex items-start">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm shrink-0 mr-4">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Call Us</h4>
                                <p className="text-lg font-medium text-gray-900">{profilInfo.noWa}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm shrink-0 mr-4">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">E-mail</h4>
                                <p className="text-lg font-medium text-gray-900">{profilInfo.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm shrink-0 mr-4">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</h4>
                                <p className="text-base text-gray-900 leading-relaxed">
                                    {profilInfo.alamat}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-emerald-200/50">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Temukan Kami di</h4>
                        <div className="flex flex-wrap gap-3">
                            <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:shadow-md transition-all"><Facebook className="w-5 h-5" /></a>
                            <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:shadow-md transition-all"><Twitter className="w-5 h-5" /></a>
                            <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:shadow-md transition-all"><Linkedin className="w-5 h-5" /></a>
                            <a href="#" className="w-10 h-10 bg-white rounded-full flex flex-col pt-0 items-center justify-center text-gray-500 hover:text-emerald-600 hover:shadow-md transition-all font-bold text-[10px] leading-tight"><span>Sky</span><span>pe</span></a>
                            <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:shadow-md transition-all font-bold text-[10px]">Pin</a>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">INFO LANJUT</h3>
                    <p className="text-gray-500 mb-6">Isi data berikut, kami akan segera menghubungi Anda.</p>
                    
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                            <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow" placeholder="Masukkan nama Anda" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input type="tel" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow" placeholder="Nomor Telepon" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow" placeholder="Alamat Email" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow" placeholder="Subjek Pesan" />
                        </div>
                        <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-emerald-700 transition-colors shadow-md mt-4">
                            Kirim Pesan
                        </button>
                    </form>
                </div>
            </div>

            {/* Map */}
            <div className="mt-16 bg-gray-200 rounded-2xl overflow-hidden shadow-sm h-80 border border-emerald-100/50 flex items-center justify-center relative">
                <iframe 
                    src="https://maps.google.com/maps?q=Jl.%20Kemerdekaan%20Barat%20No.12,%20Kesugihan,%20Cilacap,%20Jawa%20Tengah%2053274&t=&z=13&ie=UTF8&iwloc=&output=embed" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={false} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Map Location"
                    className="absolute inset-0"
                ></iframe>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 pt-16 pb-8 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                <div>
                    <h4 className="text-white text-lg font-bold mb-4 flex items-center">
                        <img src="https://drive.google.com/thumbnail?id=1279_6Jv2PVryShpLbfRpHo6uX3YYue6T&sz=w500" alt="Logo LPH Al-Ghazali" className="h-12 w-auto mr-3 bg-white p-1.5 rounded-lg" referrerPolicy="no-referrer" />
                        LPH Al-Ghazali
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Portal Layanan LPH Al-Ghazali merupakan platform terpadu untuk mempermudah pendaftaran dan proses sertifikasi halal bagi para pelaku usaha di seluruh Indonesia.
                    </p>
                </div>
                <div>
                    <h4 className="text-white text-lg font-bold mb-4">Tautan Cepat</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li><a href="#beranda" className="hover:text-emerald-400 transition-colors flex items-center"><ChevronRight className="w-4 h-4 mr-1 text-emerald-600" /> Beranda</a></li>
                        <li><a href="#tarif-layanan" className="hover:text-emerald-400 transition-colors flex items-center"><ChevronRight className="w-4 h-4 mr-1 text-emerald-600" /> Kalkulator Biaya</a></li>
                        <li><a href="#alur-sertifikasi" className="hover:text-emerald-400 transition-colors flex items-center"><ChevronRight className="w-4 h-4 mr-1 text-emerald-600" /> Prosedur</a></li>
                        <li><a href="#tanggung-gugat" className="hover:text-emerald-400 transition-colors flex items-center"><ChevronRight className="w-4 h-4 mr-1 text-emerald-600" /> Tanggung Gugat</a></li>
                        <li><a href="#berita" className="hover:text-emerald-400 transition-colors flex items-center"><ChevronRight className="w-4 h-4 mr-1 text-emerald-600" /> Berita Utama</a></li>
                        <li><a href="#faq" className="hover:text-emerald-400 transition-colors flex items-center"><ChevronRight className="w-4 h-4 mr-1 text-emerald-600" /> FAQ</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white text-lg font-bold mb-4">Layanan</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center"><ShieldCheck className="w-4 h-4 mr-2" /> Sertifikasi Halal Reguler</a></li>
                        <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center"><FileSignature className="w-4 h-4 mr-2" /> Edukasi & Pelatihan Halal</a></li>
                        <li><a href="#ruang-lingkup" className="hover:text-emerald-400 transition-colors flex items-center"><Briefcase className="w-4 h-4 mr-2" /> Layanan Pra-Audit (Opsional)</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white text-lg font-bold mb-4">Hubungi Kami</h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li className="flex items-start group">
                           <span className="mt-1 mr-3 text-emerald-500 group-hover:text-emerald-400 transition-colors"><MapPin className="w-5 h-5" /></span>
                           <span className="group-hover:text-gray-300 transition-colors">{profilInfo.alamat}</span>
                        </li>
                        <li className="flex items-center group cursor-pointer">
                           <span className="mr-3 text-emerald-500 group-hover:text-emerald-400 transition-colors"><Phone className="w-5 h-5" /></span>
                           <a href={`https://wa.me/62${profilInfo.noWa?.replace(/^0+/, '')}`} target="_blank" rel="noopener noreferrer" className="group-hover:text-gray-300 transition-colors">{profilInfo.noWa} (WhatsApp)</a>
                        </li>
                        <li className="flex items-center group cursor-pointer">
                           <span className="mr-3 text-emerald-500 group-hover:text-emerald-400 transition-colors"><Mail className="w-5 h-5" /></span>
                           <span className="group-hover:text-gray-300 transition-colors">{profilInfo.email}</span>
                        </li>
                        <li className="flex items-center group cursor-pointer">
                           <span className="mr-3 text-emerald-500 group-hover:text-emerald-400 transition-colors"><Globe className="w-5 h-5" /></span>
                           <a href="https://halal.unugha.ac.id" target="_blank" rel="noopener noreferrer" className="group-hover:text-gray-300 transition-colors">halal.unugha.ac.id</a>
                        </li>
                        <li className="flex items-start group">
                           <span className="mt-1 mr-3 text-emerald-500 group-hover:text-emerald-400 transition-colors"><Clock className="w-5 h-5" /></span>
                           <span className="group-hover:text-gray-300 transition-colors flex flex-col">
                              <span>Senin - Jum'at,</span>
                              <span>9:00 AM - 8:00 PM</span>
                           </span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-4">
                <div className="order-3 md:order-1 flex flex-col md:flex-row md:items-center md:gap-3 text-center md:text-left">
                    <p>&copy; {new Date().getFullYear()} LPH Al-Ghazali. Hak Cipta Dilindungi.</p>
                    <span className="hidden md:inline text-gray-600">•</span>
                    <p className="flex items-center justify-center md:justify-start text-gray-400 mt-2 md:mt-0 font-medium">
                        <Clock className="w-4 h-4 mr-1.5 text-emerald-500" /> Jam Buka: Senin - Jum'at, 9:00 AM - 8:00 PM
                    </p>
                </div>
                <div className="flex space-x-5 order-2">
                    <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors"><span className="sr-only">Facebook</span><Facebook className="w-5 h-5" /></a>
                    <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors"><span className="sr-only">Twitter</span><Twitter className="w-5 h-5" /></a>
                    <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors"><span className="sr-only">Instagram</span><Instagram className="w-5 h-5" /></a>
                    <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors"><span className="sr-only">LinkedIn</span><Linkedin className="w-5 h-5" /></a>
                </div>
                <div className="flex space-x-6 order-1 md:order-3">
                    <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
                    <a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a>
                </div>
            </div>
        </div>
      </footer>

      {isVisiMisiPdfOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Dokumen_Visi_Misi_LPH_Al_Ghazali.pdf</h3>
              </div>
              <button 
                onClick={() => setIsVisiMisiPdfOpen(false)} 
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 sm:p-12 overflow-y-auto bg-gray-100 flex-1">
              <div className="bg-white max-w-2xl mx-auto shadow-sm ring-1 ring-gray-900/5 min-h-[600px] p-10 sm:p-16">
                <div className="text-center border-b-2 border-emerald-800 pb-6 mb-8">
                  <Logo className="h-16 w-16 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Lembaga Pemeriksa Halal (LPH)</h1>
                  <h2 className="text-xl font-bold text-emerald-700 uppercase tracking-widest mt-1">Al-Ghazali</h2>
                  <p className="text-sm text-gray-500 mt-2">Jl. Kemerdekaan Barat No.12, Kesugihan, Cilacap, Jawa Tengah 53274</p>
                </div>
                
                <div className="space-y-8 text-gray-800 leading-relaxed">
                  <div className="text-center mb-10">
                    <h3 className="text-2xl font-bold underline mb-2">VISI DAN MISI</h3>
                    <p className="text-sm">Dokumen Profil LPH Al-Ghazali</p>
                  </div>

                  <section>
                    <h4 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md mr-3 border border-emerald-200">A</span> VISI
                    </h4>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                      <p className="text-lg font-medium text-center italic text-gray-700">
                        "Menjadi Lembaga Pemeriksa Halal yang tepercaya, profesional, dan unggul dalam mendukung ekosistem penyelenggaraan jaminan produk halal di Indonesia yang bertaraf Internasional."
                      </p>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md mr-3 border border-emerald-200">B</span> MISI
                    </h4>
                    <ol className="list-decimal list-outside ml-6 space-y-4 marker:text-emerald-600 marker:font-bold">
                      <li className="pl-2">
                        Menyelenggarakan pemeriksaan dan/atau pengujian kehalalan produk secara komprehensif, independen, dan berintegritas sesuai dengan prinsip Syariah Islam dan regulasi Badan Penyelenggara Jaminan Produk Halal (BPJPH).
                      </li>
                      <li className="pl-2">
                        Mengembangkan sumber daya manusia (Auditor Halal) yang kompeten, mutakhir, profesional, dan menjunjung tinggi kode etik sesuai dengan Standar Kompetensi Kerja Nasional Indonesia (SKKNI).
                      </li>
                      <li className="pl-2">
                        Mendorong kolaborasi aktif dengan berbagai pemangku kepentingan, Perguruan Tinggi, pelaku industri, dan asosiasi pengusaha (Pondok Pesantren, UMKM) untuk mempercepat perwujudan ekosistem halal.
                      </li>
                      <li className="pl-2">
                        Memberikan edukasi, pelatihan, dan pendampingan kepada pelaku usaha terkait standar operasional kehalalan produk, penerapan Sistem Jaminan Produk Halal (SJPH), serta keamanan pangan secara berkelanjutan.
                      </li>
                    </ol>
                  </section>
                  
                  <div className="pt-16 mt-12 border-t border-gray-200 grid grid-cols-2">
                    <div></div>
                    <div className="text-center text-sm">
                      <p className="mb-16">Disahkan pada Direktur Utama,</p>
                      <p className="font-bold underline">Direktur LPH Al-Ghazali</p>
                      <p>NIP. -</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end shrink-0">
              <button 
                onClick={() => setIsVisiMisiPdfOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
                type="button"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {isSejarahPdfOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Sejarah_dan_Latar_Belakang_LPH_Al_Ghazali.pdf</h3>
              </div>
              <button 
                onClick={() => setIsSejarahPdfOpen(false)} 
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 sm:p-12 overflow-y-auto bg-gray-100 flex-1">
              <div className="bg-white max-w-2xl mx-auto shadow-sm ring-1 ring-gray-900/5 min-h-[600px] p-10 sm:p-16">
                <div className="text-center border-b-2 border-emerald-800 pb-6 mb-8">
                  <Logo className="h-16 w-16 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Lembaga Pemeriksa Halal (LPH)</h1>
                  <h2 className="text-xl font-bold text-emerald-700 uppercase tracking-widest mt-1">Al-Ghazali</h2>
                  <p className="text-sm text-gray-500 mt-2">Universitas Nahdlatul Ulama Al Ghazali (UNUGHA) Cilacap</p>
                </div>
                
                <div className="space-y-6 text-gray-800 leading-relaxed text-justify">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold underline mb-2">SEJARAH & LATAR BELAKANG</h3>
                    <p className="text-sm">Dokumen Profil LPH Al-Ghazali</p>
                  </div>

                  <p>
                    Lembaga Pemeriksa Halal (LPH) Al-Ghazali didirikan sebagai wujud nyata dari komitmen Universitas Nahdlatul Ulama Al Ghazali (UNUGHA) Cilacap dalam mengabdi kepada masyarakat, khususnya dalam mendukung ekosistem produk halal di Indonesia sesuai dengan amanat Undang-Undang Nomor 33 Tahun 2014 tentang Jaminan Produk Halal.
                  </p>
                  <p>
                    Berdirinya LPH Al-Ghazali dilatarbelakangi oleh tingginya kebutuhan masyarakat muslim akan jaminan produk halal, serta komitmen pemerintah dalam mensertifikasi produk Usaha Mikro, Kecil, dan Menengah (UMKM). UNUGHA Cilacap, sebagai salah satu perguruan tinggi Nahdlatul Ulama yang memiliki kapasitas sumber daya manusia di bidang sains, teknologi pangan, dan syariah, mengambil peran strategis ini dengan membentuk LPH.
                  </p>
                  <p>
                    Dengan mengintegrasikan sains dan prinsip-prinsip syariat Islam, LPH Al-Ghazali berdedikasi untuk melakukan pemeriksaan dan pengujian kehalalan produk secara objektif, independen, dan terpercaya. Kami dibekali dengan auditor halal yang telah lulus uji kompetensi dari Badan Nasional Sertifikasi Profesi (BNSP) dan terdaftar resmi di Badan Penyelenggara Jaminan Produk Halal (BPJPH).
                  </p>
                  <p>
                    Hingga saat ini, LPH Al-Ghazali terus berkomitmen untuk memberikan layanan sertifikasi halal yang cepat, transparan, dan dapat diakses dengan mudah oleh seluruh lapisan pelaku usaha melalui portal terintegrasi kami, guna mendukung Indonesia sebagai pusat produsen halal dunia.
                  </p>
                  
                  <div className="pt-16 mt-12 border-t border-gray-200 grid grid-cols-2">
                    <div></div>
                    <div className="text-center text-sm">
                      <p className="mb-16">Cilacap, Jawa Tengah</p>
                      <p className="font-bold underline">Rektor UNUGHA / Direktur LPH</p>
                      <p>NIP. -</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end shrink-0">
              <button 
                onClick={() => setIsSejarahPdfOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
                type="button"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {isStrukturOrganisasiOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto">
          <div className="bg-white rounded-sm shadow-2xl w-full max-w-[1300px] my-auto relative border border-gray-200">
            <button 
              onClick={() => setIsStrukturOrganisasiOpen(false)} 
              className="absolute top-4 right-4 p-2 z-50 bg-gray-100 rounded-full shadow-sm text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 sm:p-14">
              {/* Header */}
              <div className="text-center mb-10 border-b-4 border-emerald-800 pb-8 flex flex-col items-center">
                  <Logo className="h-20 w-20 mb-4" />
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase tracking-widest leading-tight">STRUKTUR ORGANISASI</h1>
                  <h2 className="text-lg sm:text-xl font-bold text-emerald-700 uppercase tracking-wider mt-2">Lembaga Pemeriksa Halal (LPH) Al-Ghazali</h2>
              </div>

              {/* Chart Container (Scrollable) */}
              <div className="w-full overflow-x-auto pb-10 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-transparent">
                  <div className="min-w-[1150px] flex flex-col items-center pt-4">
                      
                      {/* Dewan Pembina */}
                      <div className="relative flex flex-col items-center">
                          <OrgCard title="Dewan Pembina LPH" name="Dr. A. Luthfi Hamidi, M.Ag." className="w-[200px]" />
                          <div className="w-[3px] h-8 bg-emerald-600"></div>
                      </div>

                      {/* Direktur */}
                      <div className="relative flex flex-col items-center">
                          <OrgCard title="Direktur LPH" name="H. Shoiman Nawawi, S.H.I., M.H." className="w-[200px]" />
                          <div className="w-[3px] h-8 bg-emerald-600"></div>
                      </div>

                      {/* Level 2 Wrapper (Tengah Dirapatkan) */}
                      <div className="relative flex justify-center w-full mt-0">
                          {/* Horizontal Line connecting exactly first and last column centers */}
                          <div className="absolute top-0 left-[80px] right-[80px] h-[3px] bg-emerald-600"></div>
                          
                          <div className="flex justify-between w-full relative pt-8">
                              
                              <div className="relative flex flex-col items-center w-[160px]">
                                  <div className="absolute top-[-32px] w-[3px] h-8 bg-emerald-600"></div>
                                  <OrgCard title="Komite Ketidakberpihakan" list={["Istikharoh, M.H.", "Rindrayatni, S.Kep., Ners.", "Abdul Haq, M.Cs."]} className="w-[155px]" />
                              </div>

                              <div className="relative flex flex-col items-center w-[160px]">
                                  <div className="absolute top-[-32px] w-[3px] h-8 bg-emerald-600"></div>
                                  <OrgCard title="Komite Banding" name="Dr. Misbah Khusurur, M.Si." className="w-[155px]" />
                              </div>

                              <div className="relative flex flex-col items-center w-[160px]">
                                  <div className="absolute top-[-32px] w-[3px] h-8 bg-emerald-600"></div>
                                  <OrgCard title="Sekretaris" name="Fathurrohman, S.H." className="w-[155px]" />
                              </div>

                              <div className="relative flex flex-col items-center w-[160px]">
                                  <div className="absolute top-[-32px] w-[3px] h-8 bg-emerald-600"></div>
                                  <OrgCard title="Manajer Mutu" name="Rahmatulloh, S.Sy., M.E." className="w-[155px]" />
                              </div>

                              {/* Manajer Operasional (Root of bottom level ditarik lurus ke bawah) */}
                              <div className="relative flex flex-col items-center w-[160px]">
                                  <div className="absolute top-[-32px] w-[3px] h-8 bg-emerald-600"></div>
                                  <OrgCard title="Manajer Operasional" name="Christian Soolany, S.TP., M.Si." className="w-[155px] z-10" />
                                  
                                  <div className="relative w-full flex flex-col items-center pt-8 space-y-6">
                                      <div className="absolute top-0 bottom-[30px] left-[50%] -ml-[1.5px] w-[3px] bg-emerald-600 z-0"></div>
                                      
                                      <OrgCard 
                                        title="SDM Syariah" 
                                        list={settings?.struktur?.sdmSyariah || ["H. Fatah Rosihan A., M.M.", "Syaefudin Zuhri, S.Ag."]} 
                                        className="w-[155px] z-10 relative" 
                                        allowUpload={false}
                                        defaultImages={settings?.struktur?.images || {
                                          "H. Fatah Rosihan A., M.M.": "/fatah.jpg",
                                          "Syaefudin Zuhri, S.Ag.": "/syaefudin.jpg"
                                        }}
                                      />
                                      <OrgCard 
                                        title="Auditor Halal" 
                                        list={["Siti Khuzaimah, S.T., M.T.", "dr. Atingul Marifah", "Anisha Dian I., S.T., M.Sc."]} 
                                        className="w-[155px] z-10 relative" 
                                        allowUpload={true}
                                        defaultImages={{
                                          "Siti Khuzaimah, S.T., M.T.": "/siti.jpg",
                                          "dr. Atingul Marifah": "/atingul.jpg",
                                          "Anisha Dian I., S.T., M.Sc.": "/anisha.jpg"
                                        }}
                                      />
                                      <OrgCard title="Evaluator LPH" name="Fathurrohman, S.H." className="w-[155px] z-10 relative" />
                                      <OrgCard title="Petugas Pengambil Sample" list={["Siti Khuzaimah, S.T., M.T.", "dr. Atingul Marifah", "Anisha Dian I., S.T."]} className="w-[155px] z-10 relative" />
                                  </div>
                              </div>

                              <div className="relative flex flex-col items-center w-[160px]">
                                  <div className="absolute top-[-32px] w-[3px] h-8 bg-emerald-600"></div>
                                  <OrgCard title="Manajer Keuangan" name="Siti Khuzaimah, S.T., M.T." className="w-[155px]" />
                              </div>

                              <div className="relative flex flex-col items-center w-[160px]">
                                  <div className="absolute top-[-32px] w-[3px] h-8 bg-emerald-600"></div>
                                  <OrgCard title="Pengelola LPH" name="Mukti Ali, S.Pd." className="w-[155px]" />
                              </div>
                              
                          </div>
                      </div>

                  </div>
              </div>

            </div>
          </div>
        {isMenuRegulasiOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden border border-emerald-100 ring-1 ring-emerald-500/10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/20 shrink-0 gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-100 p-3 rounded-2xl shadow-sm border border-emerald-200">
                  <Scale className="w-7 h-7 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Pusat Regulasi & Dokumen JPH</h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm">
                    <span className="text-emerald-700 font-bold flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                      Terakhir diperbarui: 20 Mei 2026
                    </span>
                    <span className="text-gray-300 hidden md:inline">|</span>
                    <a href="https://bpjph.halal.go.id/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-800 font-semibold hover:underline flex items-center">
                      Referensi Utama: BPJPH RI <Globe className="w-3.5 h-3.5 ml-1 inline" />
                    </a>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsMenuRegulasiOpen(false)} 
                className="self-end md:self-auto p-2 bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-800 rounded-full transition-colors cursor-pointer border border-gray-200 shadow-sm"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Categories Bar */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 shrink-0 space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari regulasi berdasarkan nomor, tentang, atau kata kunci..."
                    value={searchRegulasiQuery}
                    onChange={(e) => {
                      setSearchRegulasiQuery(e.target.value);
                      setActiveRegulasiDoc(null);
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors font-semibold text-gray-800"
                  />
                  {searchRegulasiQuery && (
                    <button
                      onClick={() => setSearchRegulasiQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {['Semua', 'Undang-Undang', 'Peraturan Pemerintah', 'Keputusan Menteri Agama', 'Keputusan Kepala BPJPH', 'Peraturan BPOM', 'SNI'].map((cat) => {
                    const isActive = selectedRegulasiCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedRegulasiCategory(cat);
                          setActiveRegulasiDoc(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Content Area split layout */}
            {(() => {
              const matchesFilter = REKAP_REGULASI_DATA.filter(doc => {
                const matchesCategory = selectedRegulasiCategory === 'Semua' || doc.kategori === selectedRegulasiCategory;
                const matchesSearch = doc.nomor.toLowerCase().includes(searchRegulasiQuery.toLowerCase()) || 
                                      doc.tentang.toLowerCase().includes(searchRegulasiQuery.toLowerCase()) || 
                                      doc.deskripsi.toLowerCase().includes(searchRegulasiQuery.toLowerCase());
                return matchesCategory && matchesSearch;
              });

              // pick active doc
              const currentDoc = activeRegulasiDoc || matchesFilter[0] || null;

              return (
                <div className="flex-1 flex overflow-hidden bg-gray-50/30">
                  {/* Left Column: List */}
                  <div className={`w-full ${currentDoc && 'lg:w-[45%]'} border-r border-gray-100 flex flex-col h-full bg-white overflow-y-auto`}>
                    <div className="p-3 bg-gray-50/50 border-b border-gray-150 flex items-center justify-between text-xs font-bold text-gray-500">
                      <span>Daftar Regulasi ({matchesFilter.length})</span>
                      {selectedRegulasiCategory !== 'Semua' && (
                        <button onClick={() => setSelectedRegulasiCategory('Semua')} className="text-emerald-600 hover:underline">
                          Reset Filter
                        </button>
                      )}
                    </div>
                    {matchesFilter.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center my-auto">
                        <Scale className="w-10 h-10 text-gray-300 mb-2" />
                        <p className="text-sm font-bold text-gray-800">Tidak ada regulasi yang cocok</p>
                        <p className="text-xs text-gray-500 mt-1">Coba sesuaikan kata kunci pencarian atau kategori Anda.</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {matchesFilter.map((doc) => {
                          const isSelected = currentDoc && currentDoc.id === doc.id;
                          return (
                            <button
                              key={doc.id}
                              onClick={() => setActiveRegulasiDoc(doc)}
                              className={`w-full text-left p-3.5 rounded-xl transition-all border flex flex-col gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50/80 border-emerald-250 text-emerald-950 shadow-sm'
                                  : 'bg-white border-gray-100 hover:border-gray-300 text-gray-800'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                                  {doc.kategori}
                                </span>
                                <span className="text-[11px] text-gray-400 font-mono font-bold">
                                  Th. {doc.tahun}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-xs font-extrabold text-gray-900 line-clamp-1 leading-tight">
                                  {doc.nomor}
                                </h4>
                                <p className="text-xs font-bold text-emerald-700 mt-0.5 line-clamp-1">
                                  {doc.tentang}
                                </p>
                              </div>
                              <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed font-semibold">
                                {doc.deskripsi}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Details Pane */}
                  {currentDoc ? (
                    <div className="hidden lg:flex w-[55%] flex-col h-full bg-white overflow-hidden">
                      {/* doc details title bar */}
                      <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex items-start justify-between shrink-0 gap-3">
                        <div className="space-y-1">
                          <span className="inline-block bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest">
                            {currentDoc.kategori}
                          </span>
                          <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                            {currentDoc.nomor}
                          </h3>
                          <p className="text-sm font-bold text-emerald-700">
                            {currentDoc.tentang}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleDownloadRegulasiDocument(currentDoc)}
                            className="inline-flex items-center justify-center px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                            title="Unduh draf regulasi lengkap (.txt)"
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" /> Unduh
                          </button>
                        </div>
                      </div>

                      {/* doc details content */}
                      <div className="flex-1 p-5 overflow-y-auto space-y-5">
                        {/* ringkasan */}
                        <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center">
                            <BookOpen className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> Deskripsi Ringkas
                          </h4>
                          <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                            {currentDoc.deskripsi}
                          </p>
                        </div>

                        {/* pasal-pasal kunci */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">
                            Poin Utama / Pasal Penting
                          </h4>
                          <div className="grid grid-cols-1 gap-2.5">
                            {currentDoc.pasalPenting.map((p: any, idx: number) => (
                              <div key={idx} className="bg-white border border-gray-200 hover:border-emerald-250 rounded-xl p-3.5 transition-colors shadow-none hover:shadow-sm">
                                <div className="text-xs font-extrabold text-emerald-800 mb-1 flex items-center">
                                  <ChevronRight className="w-3.5 h-3.5 mr-1" /> {p.pasal}
                                </div>
                                <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                                  {p.isi}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* full text block */}
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">
                            Naskah & SOP Komparasi Lengkap
                          </h4>
                          <pre className="font-mono text-[11px] bg-slate-900 border border-slate-800 text-slate-200 p-4 rounded-xl max-h-[250px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                            {currentDoc.isiLengkap}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })()}

            {/* Footer with actions for small devices */}
            <div className="p-4 border-t border-gray-100 bg-white flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-3">
              <span className="text-xs text-gray-500 font-bold text-center md:text-left">
                Laman Sinkronisasi Otomatis API-Middleware BPJPH RI v2.1 • Akreditasi SNI Jaminan Mutu
              </span>
              <div className="flex items-center gap-2 justify-center md:justify-end">
                {(() => {
                  const mFilter = REKAP_REGULASI_DATA.filter(doc => {
                    const matchesCategory = selectedRegulasiCategory === 'Semua' || doc.kategori === selectedRegulasiCategory;
                    const matchesSearch = doc.nomor.toLowerCase().includes(searchRegulasiQuery.toLowerCase()) || 
                                          doc.tentang.toLowerCase().includes(searchRegulasiQuery.toLowerCase()) || 
                                          doc.deskripsi.toLowerCase().includes(searchRegulasiQuery.toLowerCase());
                    return matchesCategory && matchesSearch;
                  });
                  const activeDoc = activeRegulasiDoc || mFilter[0];
                  return activeDoc ? (
                    <button
                      onClick={() => handleDownloadRegulasiDocument(activeDoc)}
                      className="lg:hidden inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4 mr-1.5" /> Unduh Dokumen Terpilih
                    </button>
                  ) : null;
                })()}
                <button 
                  onClick={() => setIsMenuRegulasiOpen(false)}
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors text-xs font-bold cursor-pointer"
                >
                  Tutup Pusat Regulasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}        </div>
      )}

      {isPeraturanPemerintahOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full overflow-hidden border border-emerald-100 ring-1 ring-emerald-500/10">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white shrink-0">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-100 p-2.5 rounded-xl shadow-sm border border-emerald-200">
                    <Landmark className="w-7 h-7 text-emerald-700" />
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Peraturan Pemerintah</h2>
                    <p className="text-sm text-emerald-600 font-semibold mt-0.5">Regulasi Terkait Jaminan Produk Halal</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPeraturanPemerintahOpen(false)} 
                className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200 shadow-sm"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto w-full h-[600px] flex flex-col bg-gray-50/50">
              <div className="p-4 sm:p-8 space-y-6">
                 
                 {/* Item 1 */}
                 <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300 group">
                    <div className="flex flex-col sm:flex-row gap-5 sm:items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">Peraturan Pemerintah Nomor 39 Tahun 2021</h3>
                            <div className="inline-block bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md mb-4">
                                <p className="text-[13px] font-bold text-emerald-700 uppercase tracking-widest">Penyelenggaraan Bidang Jaminan Produk Halal</p>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                Peraturan Pemerintah ini merupakan aturan pelaksanaan dari UU No 33 Tahun 2014, yang mengatur lebih detail mengenai tata cara pendaftaran, sertifikasi, pembinaan, pengawasan, serta peran masyarakat dan pelaku usaha dalam ekosistem jaminan produk halal.
                            </p>
                        </div>
                        <div className="sm:text-right shrink-0 mt-2 sm:mt-0">
                            <button className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all w-full sm:w-auto focus:ring-4 focus:ring-emerald-500/20">
                                <FileText className="w-4 h-4 mr-2" />
                                Lihat Dokumen
                            </button>
                        </div>
                    </div>
                 </div>

              </div>
            </div>
            
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setIsPeraturanPemerintahOpen(false)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 hover:text-gray-900 transition-colors font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {isKeputusanMenagOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full overflow-hidden border border-emerald-100 ring-1 ring-emerald-500/10">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white shrink-0">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-100 p-2.5 rounded-xl shadow-sm border border-emerald-200">
                    <BookOpen className="w-7 h-7 text-emerald-700" />
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Keputusan Menteri Agama</h2>
                    <p className="text-sm text-emerald-600 font-semibold mt-0.5">Regulasi Terkait Jaminan Produk Halal</p>
                </div>
              </div>
              <button 
                onClick={() => setIsKeputusanMenagOpen(false)} 
                className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200 shadow-sm"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto w-full h-[600px] flex flex-col bg-gray-50/50">
              <div className="p-4 sm:p-8 space-y-6">
                 
                 {/* Item 1 */}
                 <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300 group">
                    <div className="flex flex-col sm:flex-row gap-5 sm:items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">KMA Nomor 748 Tahun 2021</h3>
                            <div className="inline-block bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md mb-4">
                                <p className="text-[13px] font-bold text-emerald-700 uppercase tracking-widest">Jenis Produk yang Wajib Bersertifikat Halal</p>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                Keputusan ini menetapkan daftar jenis produk, baik barang maupun jasa, yang diwajibkan untuk memiliki sertifikat halal, guna memberikan pedoman yang jelas bagi pelaku usaha dan LPH.
                            </p>
                        </div>
                        <div className="sm:text-right shrink-0 mt-2 sm:mt-0">
                            <button className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all w-full sm:w-auto focus:ring-4 focus:ring-emerald-500/20">
                                <FileText className="w-4 h-4 mr-2" />
                                Lihat Dokumen
                            </button>
                        </div>
                    </div>
                 </div>
                 
                 {/* Item 2 */}
                 <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300 group">
                    <div className="flex flex-col sm:flex-row gap-5 sm:items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">KMA Nomor 1360 Tahun 2021</h3>
                            <div className="inline-block bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md mb-4">
                                <p className="text-[13px] font-bold text-emerald-700 uppercase tracking-widest">Bahan yang Dikecualikan</p>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                Keputusan ini mengatur bahan-bahan yang dikecualikan dari kewajiban bersertifikat halal, karena bahan tersebut sudah dipastikan kehalalannya secara organik atau alamiah, sehingga memudahkan pelaku UMKM dalam proses sertifikasi.
                            </p>
                        </div>
                        <div className="sm:text-right shrink-0 mt-2 sm:mt-0">
                            <button className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all w-full sm:w-auto focus:ring-4 focus:ring-emerald-500/20">
                                <FileText className="w-4 h-4 mr-2" />
                                Lihat Dokumen
                            </button>
                        </div>
                    </div>
                 </div>

              </div>
            </div>
            
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setIsKeputusanMenagOpen(false)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 hover:text-gray-900 transition-colors font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {isKeputusanBpjphOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full overflow-hidden border border-emerald-100 ring-1 ring-emerald-500/10">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white shrink-0">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-100 p-2.5 rounded-xl shadow-sm border border-emerald-200">
                    <FileSignature className="w-7 h-7 text-emerald-700" />
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Keputusan Kepala BPJPH</h2>
                    <p className="text-sm text-emerald-600 font-semibold mt-0.5">Regulasi Terkait Jaminan Produk Halal</p>
                </div>
              </div>
              <button 
                onClick={() => setIsKeputusanBpjphOpen(false)} 
                className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200 shadow-sm"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto w-full h-[600px] flex flex-col bg-gray-50/50">
              <div className="p-4 sm:p-8 space-y-6">
                 
                 <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300 group">
                    <div className="flex flex-col sm:flex-row gap-5 sm:items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">Keputusan Kepala BPJPH Nomor 57 Tahun 2021</h3>
                            <div className="inline-block bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md mb-4">
                                <p className="text-[13px] font-bold text-emerald-700 uppercase tracking-widest">Kriteria Sistem Jaminan Produk Halal</p>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                Keputusan ini menetapkan kriteria Sistem Jaminan Produk Halal yang harus dipenuhi oleh pelaku usaha, meliputi komitmen dan tanggung jawab, bahan, proses produk halal, produk, serta pemantauan dan evaluasi.
                            </p>
                        </div>
                        <div className="sm:text-right shrink-0 mt-2 sm:mt-0">
                            <button className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all w-full sm:w-auto focus:ring-4 focus:ring-emerald-500/20">
                                <FileText className="w-4 h-4 mr-2" />
                                Lihat Dokumen
                            </button>
                        </div>
                    </div>
                 </div>
                 
              </div>
            </div>
            
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setIsKeputusanBpjphOpen(false)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 hover:text-gray-900 transition-colors font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {isPeraturanBpomOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full overflow-hidden border border-emerald-100 ring-1 ring-emerald-500/10">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white shrink-0">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-100 p-2.5 rounded-xl shadow-sm border border-emerald-200">
                    <ShieldCheck className="w-7 h-7 text-emerald-700" />
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Peraturan BPOM</h2>
                    <p className="text-sm text-emerald-600 font-semibold mt-0.5">Regulasi Terkait Jaminan Produk Halal</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPeraturanBpomOpen(false)} 
                className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200 shadow-sm"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto w-full h-[600px] flex flex-col bg-gray-50/50">
              <div className="p-4 sm:p-8 space-y-6">
                 
                 <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300 group">
                    <div className="flex flex-col sm:flex-row gap-5 sm:items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">Peraturan BPOM No 31 Tahun 2018</h3>
                            <div className="inline-block bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md mb-4">
                                <p className="text-[13px] font-bold text-emerald-700 uppercase tracking-widest">Label Pangan Olahan</p>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                Peraturan ini yang berkaitan dengan pencantuman label halal pada pangan olahan yang telah mendapatkan sertifikat halal dari BPJPH dan persetujuan label dari BPOM.
                            </p>
                        </div>
                        <div className="sm:text-right shrink-0 mt-2 sm:mt-0">
                            <button className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all w-full sm:w-auto focus:ring-4 focus:ring-emerald-500/20">
                                <FileText className="w-4 h-4 mr-2" />
                                Lihat Dokumen
                            </button>
                        </div>
                    </div>
                 </div>
                 
              </div>
            </div>
            
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setIsPeraturanBpomOpen(false)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 hover:text-gray-900 transition-colors font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {isSniOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full overflow-hidden border border-emerald-100 ring-1 ring-emerald-500/10">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white shrink-0">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-100 p-2.5 rounded-xl shadow-sm border border-emerald-200">
                    <Award className="w-7 h-7 text-emerald-700" />
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">SNI (Standar Nasional Indonesia)</h2>
                    <p className="text-sm text-emerald-600 font-semibold mt-0.5">Regulasi Terkait Jaminan Produk Halal</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSniOpen(false)} 
                className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200 shadow-sm"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto w-full h-[600px] flex flex-col bg-gray-50/50">
              <div className="p-4 sm:p-8 space-y-6">
                 
                 <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300 group">
                    <div className="flex flex-col sm:flex-row gap-5 sm:items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">SNI ISO/IEC 17065:2012</h3>
                            <div className="inline-block bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md mb-4">
                                <p className="text-[13px] font-bold text-emerald-700 uppercase tracking-widest">Penilaian Kesesuaian</p>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                Persyaratan untuk lembaga sertifikasi produk, proses, dan jasa. Standar ini menjadi acuan utama bagi Lembaga Pemeriksa Halal (LPH) dalam menjalankan operasional dan menjamin ketidakberpihakan.
                            </p>
                        </div>
                        <div className="sm:text-right shrink-0 mt-2 sm:mt-0">
                            <button className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all w-full sm:w-auto focus:ring-4 focus:ring-emerald-500/20">
                                <FileText className="w-4 h-4 mr-2" />
                                Lihat Dokumen
                            </button>
                        </div>
                    </div>
                 </div>

                 <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300 group">
                    <div className="flex flex-col sm:flex-row gap-5 sm:items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">SNI 99001:2016</h3>
                            <div className="inline-block bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md mb-4">
                                <p className="text-[13px] font-bold text-emerald-700 uppercase tracking-widest">Sistem Manajemen Halal</p>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                Standar Sistem Manajemen Halal yang mengintegrasikan prinsip-prinsip syariat Islam dengan standar manajemen mutu yang diakui secara internasional.
                            </p>
                        </div>
                        <div className="sm:text-right shrink-0 mt-2 sm:mt-0">
                            <button className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all w-full sm:w-auto focus:ring-4 focus:ring-emerald-500/20">
                                <FileText className="w-4 h-4 mr-2" />
                                Lihat Dokumen
                            </button>
                        </div>
                    </div>
                 </div>
                 
              </div>
            </div>
            
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setIsSniOpen(false)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 hover:text-gray-900 transition-colors font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {isKebijakanPdfOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Kebijakan_Mutu_dan_Sasaran_Mutu_LPH_Al_Ghazali.pdf</h3>
              </div>
              <button 
                onClick={() => setIsKebijakanPdfOpen(false)} 
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 sm:p-12 overflow-y-auto bg-gray-100 flex-1">
              <div className="bg-white max-w-2xl mx-auto shadow-sm ring-1 ring-gray-900/5 min-h-[600px] p-10 sm:p-16">
                <div className="text-center border-b-2 border-emerald-800 pb-6 mb-8">
                  <Logo className="h-16 w-16 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Lembaga Pemeriksa Halal (LPH)</h1>
                  <h2 className="text-xl font-bold text-emerald-700 uppercase tracking-widest mt-1">Al-Ghazali</h2>
                  <p className="text-sm text-gray-500 mt-2">Universitas Nahdlatul Ulama Al Ghazali (UNUGHA) Cilacap</p>
                </div>
                
                <div className="space-y-6 text-gray-800 leading-relaxed text-justify">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold underline mb-2">KEBIJAKAN MUTU & SASARAN MUTU</h3>
                    <p className="text-sm">Dokumen Profil LPH Al-Ghazali</p>
                  </div>

                  <section className="mb-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-3 bg-emerald-100 text-emerald-800 px-3 py-1 rounded inline-block">A. KEBIJAKAN MUTU</h4>
                    <p className="mb-3">
                      LPH Al-Ghazali berkomitmen penuh memberikan pelayanan pemeriksaan dan/atau pengujian kehalalan produk yang profesional, independen, objektif, dan tidak memihak. Kami secara konsisten mengedepankan:
                    </p>
                    <ol className="list-decimal pl-6 space-y-2 marker:text-emerald-600 marker:font-bold">
                      <li><strong>Kepatuhan Regulasi:</strong> Menjalankan seluruh proses sertifikasi sesuai dengan regulasi Badan Penyelenggara Jaminan Produk Halal (BPJPH) dan Fatwa Majelis Ulama Indonesia (MUI).</li>
                      <li><strong>Standar Internasional:</strong> Secara berkelanjutan menerapkan pedoman SNI ISO/IEC 17065:2012 terkait persyaratan untuk lembaga sertifikasi produk, proses, dan jasa.</li>
                      <li><strong>Integritas dan Ketidakberpihakan:</strong> Menjaga objektivitas dalam setiap tahap pemeriksaan, bebas dari tekanan komersial, finansial, maupun tekanan lainnya yang mempengaruhi hasil audit.</li>
                      <li><strong>Kompetensi Berkelanjutan:</strong> Meningkatkan kompetensi Auditor Halal secara berkelanjutan melalui pelatihan guna memastikan keahlian dalam sains, teknologi pangan, dan syariat Islam.</li>
                      <li><strong>Kerahasiaan Data:</strong> Menjaga seluruh tingkat kerahasiaan informasi, dokumen formula, dan matrik proses produksi milik Pelaku Usaha sesuai dengan kode etik.</li>
                    </ol>
                  </section>

                  <section>
                    <h4 className="text-lg font-bold text-gray-900 mb-3 bg-emerald-100 text-emerald-800 px-3 py-1 rounded inline-block">B. SASARAN MUTU</h4>
                    <p className="mb-3">
                      Dalam rangka mewujudkan Kebijakan Mutu tersebut, LPH Al-Ghazali menetapkan Sasaran Mutu terukur yang harus dicapai sebagai berikut:
                    </p>
                    <ul className="list-disc pl-6 space-y-3 marker:text-emerald-500">
                      <li>Penyelesaian proses pemeriksaan dan pengujian lapangan <strong>(audit) maksimal 15 (lima belas) hari kerja</strong> sejak ditetapkan oleh BPJPH.</li>
                      <li>Mencapai <strong>Tingkat Kepuasan Pelanggan (Pelaku Usaha) minimal 85%</strong> (Kategori Sangat Baik) melalui layanan yang ramah, responsif, dan solutif.</li>
                      <li>Memastikan <strong>0% (Nol Persen) benturan kepentingan (Conflict of Interest)</strong> dan pelanggaran kode etik oleh auditor halal dalam seluruh proses sertifikasi.</li>
                      <li>Peningkatan kompetensi auditor melalui <strong>pelaksanaan pelatihan/workshop internal atau eksternal minimal 2 (dua) kali dalam satu tahun</strong>.</li>
                    </ul>
                  </section>
                  
                  <div className="pt-16 mt-12 border-t border-gray-200 grid grid-cols-2">
                    <div></div>
                    <div className="text-center text-sm">
                      <p className="mb-16">Cilacap, Jawa Tengah</p>
                      <p className="font-bold underline">Manajer Puncak LPH Al-Ghazali</p>
                      <p>NIP. -</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end shrink-0">
              <button 
                onClick={() => setIsKebijakanPdfOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
                type="button"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      

      {isAuditorPdfOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Profil_Auditor_Halal_LPH_Al_Ghazali.pdf</h3>
              </div>
              <button 
                onClick={() => setIsAuditorPdfOpen(false)} 
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 sm:p-12 overflow-y-auto bg-gray-100 flex-1">
              <div className="bg-white max-w-3xl mx-auto shadow-sm ring-1 ring-gray-900/5 min-h-[600px] p-8 sm:p-12 text-gray-800">
                <div className="border-b-2 border-emerald-800 pb-6 mb-8 text-center">
                  <Logo className="h-16 w-16 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">SUMBER DAYA MANUSIA</h1>
                  <h2 className="text-xl font-bold text-emerald-700 uppercase tracking-widest mt-1">Daftar Auditor Halal LPH Al-Ghazali</h2>
                </div>
                
                <div className="space-y-8 leading-relaxed text-justify">
                  <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100 shadow-sm text-center">
                    <p className="text-lg font-medium text-emerald-900 italic">
                      "Auditor Halal LPH Al-Ghazali adalah tenaga profesional, terdidik, dan tersertifikasi yang bertugas menjadi garda terdepan dalam memastikan kepatuhan syariat dan standar mutu pada setiap produk yang disertifikasi."
                    </p>
                  </div>

                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <ShieldCheck className="w-6 h-6 mr-3 text-emerald-600" />
                      Kompetensi & Kualifikasi
                    </h3>
                    <p className="mb-4">
                      Seluruh Auditor Halal yang tergabung di LPH Al-Ghazali Universitas Nahdlatul Ulama Al Ghazali (UNUGHA) telah memenuhi kualifikasi ketat sesuai dengan regulasi pemerintah, yaitu:
                    </p>
                    <ul className="list-none space-y-3 pl-2 text-gray-700">
                      <li className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Telah lulus uji kompetensi dari <strong>Badan Nasional Sertifikasi Profesi (BNSP)</strong> di bidang penjaminan produk halal.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Memiliki latar belakang pendidikan spesifik di bidang sains yang relevan, seperti Teknologi Pangan, Biologi, Kimia, Pertanian, Peternakan, dan keilmuan serumpun lainnya.</span>
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Award className="w-6 h-6 mr-3 text-emerald-600" />
                      Tugas dan Tanggung Jawab Utama
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-bold text-emerald-800 mb-2 flex items-center"><Search className="w-4 h-4 mr-2" />Pemeriksaan Material</h4>
                        <p className="text-sm text-gray-600">Memeriksa secara langsung kehalalan bahan baku, bahan tambahan, dan bahan penolong yang digunakan dalam proses produksi.</p>
                      </div>
                      <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-bold text-emerald-800 mb-2 flex items-center"><Activity className="w-4 h-4 mr-2" />Audit Fasilitas</h4>
                        <p className="text-sm text-gray-600">Memastikan fasilitas dan peralatan produksi terbebas dari paparan najis tingkat berat, sedang, maupun ringan (mughallazah, mutawassitah, mukhaffafah).</p>
                      </div>
                      <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-bold text-emerald-800 mb-2 flex items-center"><FlaskConical className="w-4 h-4 mr-2" />Uji Laboratorium</h4>
                        <p className="text-sm text-gray-600">Dalam kondisi ragu (mutasyabihat), auditor berwenang mengambil sampel produk untuk diuji secara empiris di laboratorium afiliasi LPH.</p>
                      </div>
                      <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-bold text-emerald-800 mb-2 flex items-center"><FileEdit className="w-4 h-4 mr-2" />Pelaporan Fakta Mutu</h4>
                        <p className="text-sm text-gray-600">Menyusun Laporan Hasil Pemeriksaan (LHP) Halal secara mendetail yang akan diserahkan kepada Komisi Fatwa MUI untuk sidang penetapan kehalalan.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <BookOpen className="w-6 h-6 mr-3 text-emerald-600" />
                      Integritas dan Kode Etik
                    </h3>
                    <p className="text-gray-700">
                      Profesi Auditor Halal adalah amanah keagamaan (mas’uliyah syar’iyyah) sekaligus tanggung jawab profesional. Oleh karena itu, LPH Al-Ghazali menjamin bahwa setiap auditornya terikat kuat pada Kode Etik Auditor, yang mengharamkan praktik suap (gratifikasi), benturan kepentingan (conflict of interest), serta membocorkan rahasia formula atau dapur produksi milik pelaku usaha kepada pihak yang tidak berkepentingan.
                    </p>
                  </section>

                  <section className="mt-8 pt-8 border-t border-emerald-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-center">
                      <Users className="w-6 h-6 mr-3 text-emerald-600" />
                      Auditor Halal lph Al-Ghazali
                    </h3>
                    <div className="flex flex-wrap gap-6 justify-center">
                        <OrgCard 
                          title="Auditor Halal" 
                          list={["Siti Khuzaimah, S.T., M.T.", "dr. Atingul Marifah", "Anisha Dian I., S.T., M.Sc."]} 
                          className="w-full sm:w-[350px] z-10 relative" 
                          allowUpload={true} 
                          defaultImages={{
                            "Siti Khuzaimah, S.T., M.T.": "/siti.jpg",
                            "dr. Atingul Marifah": "/atingul.jpg",
                            "Anisha Dian I., S.T., M.Sc.": "/anisha.jpg"
                          }}
                        />
                    </div>
                  </section>

                  <div className="pt-16 mt-12 border-t border-gray-200">
                    <div className="flex justify-end text-center text-sm">
                      <div>
                        <p className="mb-16">Divisi Sumber Daya Manusia</p>
                        <p className="font-bold underline">Manajer Administrasi LPH</p>
                        <p>NIP. -</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end shrink-0">
              <button 
                onClick={() => setIsAuditorPdfOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
                type="button"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {isSdmPdfOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Profil_SDM_Syariah_LPH_Al_Ghazali.pdf</h3>
              </div>
              <button 
                onClick={() => setIsSdmPdfOpen(false)} 
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 sm:p-12 overflow-y-auto bg-gray-100 flex-1">
              <div className="bg-white max-w-3xl mx-auto shadow-sm ring-1 ring-gray-900/5 min-h-[600px] p-8 sm:p-12 text-gray-800">
                <div className="border-b-2 border-emerald-800 pb-6 mb-8 text-center">
                  <Logo className="h-16 w-16 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">SUMBER DAYA MANUSIA</h1>
                  <h2 className="text-xl font-bold text-emerald-700 uppercase tracking-widest mt-1">Tim SDM Syariah LPH Al-Ghazali</h2>
                </div>
                
                <div className="space-y-8 leading-relaxed text-justify">
                  <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100 shadow-sm text-center">
                    <p className="text-lg font-medium text-emerald-900 italic">
                      "SDM Syariah LPH Al-Ghazali adalah para cendekiawan muslim, ulama, dan pakar fiqih yang menjadi benteng utama dalam memastikan landasan hukum Islam pada setiap aspek produksi yang disertifikasi halal."
                    </p>
                  </div>

                  {/* Profil Kepala SDM Syariah (Manajer Operasional) */}
                  <section className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100/70 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <ShieldCheck className="w-6 h-6 mr-3 text-emerald-600" />
                      Kepala Divisi & Manajer Operasional
                    </h3>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                      
                      {/* Photo Container */}
                      <div className="w-32 h-44 bg-gray-105 border-2 border-emerald-600 rounded-lg shadow-md shrink-0 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-950/5 group-hover:bg-transparent transition-colors z-10"></div>
                        <Users className="w-12 h-12 text-emerald-600/30 absolute z-0" />
                        <div className="text-center z-10 p-2 flex flex-col items-center h-full justify-between">
                          <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider mt-2 shadow-sm text-center">FOTO RESMI</span>
                          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200 shadow-inner">
                            <span className="text-emerald-800 font-extrabold text-xs">CS</span>
                          </div>
                          <span className="text-[10px] text-gray-600 font-bold mb-2">Christian Soolany</span>
                        </div>
                      </div>

                      {/* Profile details */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest font-mono">Manajer Operasional LPH</p>
                          <h4 className="text-xl font-extrabold text-gray-900 mt-1">Christian Soolany, S.TP., M.Si.</h4>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-emerald-600 shrink-0" /> Sertifikasi Syariah & Kompetensi:
                          </p>
                          <div className="bg-white border border-emerald-100 p-3 rounded-lg shadow-2xs space-y-1">
                            <p className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Sertifikat Kompetensi Ahli Ekonomi Syariah (BNSP-MUI)
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono">No. Registrasi / Lisensi: 89721-AES-BNSP-2025</p>
                            <p className="text-[11px] text-gray-600 leading-relaxed">Diterbitkan oleh Badan Nasional Sertifikasi Profesi bekerjasama dengan Dewan Syariah Nasional Majelis Ulama Indonesia.</p>
                          </div>
                        </div>

                        {/* Signature block for audit/PKS */}
                        <div className="pt-2">
                          <p className="text-xs font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                            <FileSignature className="w-4 h-4 text-emerald-600 shrink-0" /> Tanda Tangan Digital (Kredensial Dokumen PKS & Audit):
                          </p>
                          <div className="bg-white border border-gray-200/60 rounded-lg p-3 inline-block shadow-2xs">
                            <div className="text-center font-mono text-[9px] text-gray-400 mb-2 tracking-wider">LPH AL-GHAZALI • DIGITAL SIGNATURE SEAL</div>
                            
                            <div className="px-6 py-2 border-y border-dashed border-gray-150 flex items-center justify-center bg-gray-50/50">
                              <span className="font-serif italic text-emerald-700 font-extrabold text-xl tracking-wide select-none filter drop-shadow-sm rotate-[-4deg]">
                                ChristianSoolany
                              </span>
                            </div>
                            
                            <div className="mt-2 flex items-center justify-between text-[9px] text-gray-500 font-mono gap-4">
                              <span>VERIFIED BY CLOUD</span>
                              <span className="text-emerald-700 font-bold">SHA-256 SECURED</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Scale className="w-6 h-6 mr-3 text-emerald-600" />
                      Kompetensi dan Kualifikasi
                    </h3>
                    <p className="mb-4">
                      SDM Syariah memegang peranan krusial sebagai penyeimbang antara kajian sains teknologi (oleh Auditor Halal) dengan kajian Fiqih Islam. Seluruh tim SDM Syariah kami memiliki profil sebagai berikut:
                    </p>
                    <ul className="list-none space-y-3 pl-2 text-gray-700">
                      <li className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Memiliki latar belakang pendidikan tinggi atau pondok pesantren (tafaqquh fiddin) yang berfokus pada keilmuan <strong>Fiqih Muamalah, Ushul Fiqih, dan syariat Islam</strong>.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Terintegrasi dan memiliki rekomendasi atau bersinergi erat dengan <strong>Majelis Ulama Indonesia (MUI)</strong>, baik di tingkat kabupaten/kota maupun provinsi.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Memiliki wawasan komprehensif terkait perkembangan fatwa-fatwa DSN-MUI tentang bahan, proses, dan kaidah halal haram kekinian.</span>
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Landmark className="w-6 h-6 mr-3 text-emerald-600" />
                      Ruang Lingkup Tanggung Jawab
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-bold text-emerald-800 mb-2 flex items-center"><Scale className="w-4 h-4 mr-2" />Kajian Fiqih Bahan</h4>
                        <p className="text-sm text-gray-600">Melakukan analisis status hukum (halal/haram/syubhat) terhadap bahan kritis berdasarkan dalil syar'i dan Fatwa MUI terkait.</p>
                      </div>
                      <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-bold text-emerald-800 mb-2 flex items-center"><ShieldCheck className="w-4 h-4 mr-2" />Pencegahan Syubhat</h4>
                        <p className="text-sm text-gray-600">Memberikan rekomendasi perbaikan berbasis syariah bagi pelaku usaha jika ditemukan sistem yang berpotensi melanggar syariat Islam.</p>
                      </div>
                      <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-bold text-emerald-800 mb-2 flex items-center"><BookOpen className="w-4 h-4 mr-2" />Edukasi Pelaku Usaha</h4>
                        <p className="text-sm text-gray-600">Membantu memberikan pemahaman dan kesadaran halal (halal awareness) kepada produsen terkait pandangan Islam dalam menghasilkan asupan thayyib (baik).</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <CheckCircle className="w-6 h-6 mr-3 text-emerald-600" />
                      Landasan Operasional
                    </h3>
                    <p className="text-gray-700">
                      Sebagai bagian dari LPH yang lahir dalam naungan perguruan tinggi Nahdlatul Ulama (UNUGHA), SDM Syariah Al-Ghazali sangat memegang teguh prinsip <em>Ahlussunnah Wal Jamaah</em> yang moderat (tawassuth), seimbang (tawazun), adil (i'tidal), dan toleran (tasamuh) namun tetap istiqamah dalam menjaga batasan syariat yang qath'i terkait halalan thayyiban.
                    </p>
                  </section>

                  <section className="mt-8 pt-8 border-t border-emerald-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-center">
                      <Users className="w-6 h-6 mr-3 text-emerald-600" />
                      SDM Syariah lph Al-Ghazali
                    </h3>
                    <div className="flex flex-wrap gap-6 justify-center">
                        <OrgCard 
                          title="SDM Syariah" 
                          list={settings?.struktur?.sdmSyariah || ["H. Fatah Rosihan A., M.M.", "Syaefudin Zuhri, S.Ag."]} 
                          className="w-full sm:w-[350px] z-10 relative" 
                          allowUpload={false} 
                          defaultImages={settings?.struktur?.images || {
                            "H. Fatah Rosihan A., M.M.": "/fatah.jpg",
                            "Syaefudin Zuhri, S.Ag.": "/syaefudin.jpg"
                          }}
                        />
                    </div>
                  </section>

                  <div className="pt-16 mt-12 border-t border-gray-200">
                    <div className="flex justify-end text-center text-sm">
                      <div>
                        <p className="mb-16">Divisi Sumber Daya Manusia</p>
                        <p className="font-bold underline">Manajer Administrasi LPH</p>
                        <p>NIP. -</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end shrink-0">
              <button 
                onClick={() => setIsSdmPdfOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
                type="button"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {isKerjasamaPdfOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Jejaring_dan_Kerjasama_LPH_Al_Ghazali.pdf</h3>
              </div>
              <button 
                onClick={() => setIsKerjasamaPdfOpen(false)} 
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 sm:p-12 overflow-y-auto bg-gray-100 flex-1">
              <div className="bg-white max-w-3xl mx-auto shadow-sm ring-1 ring-gray-900/5 min-h-[600px] p-8 sm:p-12 text-gray-800">
                <div className="border-b-2 border-emerald-800 pb-6 mb-8 text-center">
                  <Logo className="h-16 w-16 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">JEJARING DAN MITRA</h1>
                  <h2 className="text-xl font-bold text-emerald-700 uppercase tracking-widest mt-1">Kerjasama LPH Al-Ghazali</h2>
                </div>
                
                <div className="space-y-8 leading-relaxed text-justify">
                  <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100 shadow-sm text-center">
                    <p className="text-lg font-medium text-emerald-900 italic">
                      "Peran strategis LPH Al-Ghazali difokuskan sepenuhnya pada sinergi teknis berintegritas tinggi bersama jaringan pemotongan hewan guna mengawal kehalalan produk hulu di Jawa Tengah."
                    </p>
                  </div>

                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Network className="w-6 h-6 mr-3 text-emerald-600" />
                      Jejaring & Kemitraan Teknis Utama
                    </h3>
                    <p className="mb-4">
                      LPH Al-Ghazali di bawah naungan Universitas Nahdlatul Ulama Al Ghazali (UNUGHA) menetapkan kebijakan integrasi hulu ke hilir. Guna menjamin keandalan sumber produk asal hewan, kami bermitra secara tunggal dan eksklusif dengan asosiasi pemotong hewan sebagai mitra teknis resmi lembaga.
                    </p>
                    
                    <div className="border border-emerald-100 rounded-xl overflow-hidden shadow-sm flex flex-col sm:flex-row bg-emerald-50/20 mb-6">
                      <div className="bg-emerald-750 p-6 flex flex-col items-center justify-center text-white sm:w-1/3">
                        <Users className="w-12 h-12 mb-2" />
                        <h4 className="font-extrabold text-center text-sm tracking-wide">Mitra Teknis Tunggal</h4>
                      </div>
                      <div className="p-6 sm:w-2/3">
                        <h4 className="font-bold text-lg text-emerald-950 mb-2">Asosiasi Pemotong Hewan</h4>
                        <p className="text-sm text-gray-650 mb-3">
                          Sebagai satu-satunya jejaring mitra teknis resmi, asosiasi ini berperan penting dalam memberikan jaminan ketelusuran (traceability) bahan baku asal hewan di wilayah kerja Provinsi Jawa Tengah.
                        </p>
                        <ul className="text-sm space-y-1 text-gray-700 font-medium">
                          <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Verifikasi data rantai pasok rumah potong hewan</li>
                          <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Standardisasi kompetensi Juru Sembelih Halal</li>
                          <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Pendampingan kepatuhan syariat pemotongan hewan</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 text-amber-900 border border-amber-200 p-4 rounded-xl text-xs font-semibold leading-relaxed">
                      ⚠️ LPH Al-Ghazali berkomitmen menegakkan profesionalisme tinggi dan dengan ini mendeklarasikan tidak mencantumkan, mengesahkan, maupun melayani bentuk kerjasama lain selain Asosiasi Pemotong Hewan ini.
                    </div>
                  </section>

                  {/* Section b: Layanan Pra-Audit (Opsional) */}
                  <section className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <ShieldCheck className="w-6 h-6 mr-3 text-emerald-600" />
                      Layanan Pra-Audit (Opsional)
                    </h3>
                    <p className="mb-4 text-sm text-gray-650 leading-relaxed">
                      LPH Al-Ghazali berkomitmen tinggi untuk fokus pada kepatuhan teknis penjaminan mutu. Sesuai ketentuan terbaru, <strong>Layanan Konsultasi telah resmi Dihapus</strong>. Kami hanya membuka <strong>Layanan Pra-Audit</strong> yang bersifat opsional untuk menguji tingkat kesiapan calon klien sebelum pendaftaran reguler.
                    </p>
                    <div className="bg-white border border-emerald-100 rounded-xl p-4 space-y-3 shadow-2xs">
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-emerald-950">Pengecekan Kesiapan Dokumen:</strong> Evaluasi kelengkapan draf dokumen jaminan produk halal (SJPH) calon klien.
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-emerald-950">Pengecekan Bahan Baku:</strong> Evaluasi kecocokan data administratif asal-usul bahan baku dan sertifikasi pendukungnya.
                        </div>
                      </div>
                      <div className="pt-2 border-t border-dashed border-gray-150 text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                        <span className="bg-emerald-100 text-emerald-950 font-mono px-2 py-0.5 rounded text-[10px] uppercase">Rincian Tarif</span>
                        Biaya Layanan Pra-Audit ini bersifat mandiri dan dihitung sepenuhnya terpisah dari biaya sertifikasi reguler.
                      </div>
                    </div>
                  </section>

                  {/* Section c: Peluang Kemitraan Baru */}
                  <section className="bg-gray-50 p-6 rounded-lg border-l-4 border-emerald-600">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 font-sans">Peluang Kemitraan Baru (Sosialisasi)</h3>
                    <p className="text-sm text-gray-750 leading-relaxed mb-4">
                      LPH Al-Ghazali mendedikasikan program kemitraan baru dengan fokus utama pada <strong>Sosialisasi Sertifikasi Halal Kolektif bagi UMK (Usaha Mikro & Kecil)</strong>. LPH dengan senang hati mengundang lembaga-lembaga lain di Jawa Tengah—termasuk perguruan tinggi, yayasan sosial/keagamaan, pusat kajian halal mandiri, organisasi kemasyarakatan (Ormas), serta dinas pembina UMKM—untuk berkolaborasi bersama sebagai mitra sosialisasi halal.
                    </p>
                    <p className="text-sm text-gray-750 leading-relaxed">
                      Sinergi sosialisasi bersama ini bermaksud menyebarluaskan edukasi pra-audit secara meluas dan meringankan hambatan administratif bagi usaha mikro kecil. <a href="#kontak" className="text-emerald-700 font-bold underline" onClick={() => setIsKerjasamaPdfOpen(false)}>Hubungi Kami</a> untuk menginisiasi gerakan kepedulian UMK ini.
                    </p>
                  </section>

                  {/* Contoh Dokumen PKS dengan Asosiasi Pemotong Hewan */}
                  <div className="mb-6 border-t border-gray-200 pt-8 mt-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <div>
                        <h4 className="font-bold text-emerald-950 text-sm">Unduh Naskah Draf PKS (PDF)</h4>
                        <p className="text-xs text-emerald-800">Dapatkan langsung naskah Surat Perjanjian Kerjasama versi ringkas pendampingan UMK.</p>
                      </div>
                      <button 
                        onClick={handleDownloadPksPdf}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs tracking-wide shadow-sm hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
                        type="button"
                      >
                        <Download className="w-4 h-4" /> Unduh Dokumen PKS
                      </button>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                      <FileSignature className="w-6 h-6 mr-3 text-emerald-600" />
                      Dokumen Acuan Kerjasama (Draf PKS Spesifik UMK)
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">Berikut merupakan naskah Surat Perjanjian Kerjasama (PKS) terstandardisasi antara LPH Al-Ghazali dengan Asosiasi Pemotong Hewan yang telah diringkas khusus untuk kemudahan kelompok UMK.</p>
                    
                    <div className="border border-gray-300 shadow-md p-6 sm:p-12 bg-white text-gray-800 text-xs font-serif leading-relaxed">
                      <div className="text-center font-bold mb-8">
                        <h3 className="text-base uppercase tracking-wide">SURAT PERJANJIAN KERJASAMA</h3>
                        <p className="mb-1">ANTARA</p>
                        <h4 className="text-sm uppercase text-gray-900">LPH AL-GHAZALI (UNUGHA)</h4>
                        <p className="my-1 uppercase font-normal">DENGAN</p>
                        <h4 className="text-sm uppercase text-gray-900">ASOSIASI PEMOTONG HEWAN JAWA TENGAH</h4>
                        <p className="my-1">TENTANG</p>
                        <h4 className="text-sm uppercase text-emerald-950">KEMITRAAN TEKNIS DAN SOSIALISASI HALAL BAGI PELAKU UMK</h4>
                        <p className="mt-4 font-normal font-mono text-[10px]">Nomor : LPH-AG/PKS-UMK/006/2026</p>
                      </div>
                      
                      <div className="text-justify space-y-4">
                        <p>Pada hari ini tanggal Dua Puluh bulan Mei tahun Dua ribu dua puluh enam (20-05-2026), bertempat di Kantor LPH Al-Ghazali, Kesugihan, Cilacap, Jawa Tengah, para pihak yang bertandatangan di bawah ini:</p>
                        
                        <ol className="list-decimal pl-5 space-y-3">
                          <li>
                            <strong>Christian Soolany, S.TP., M.Si.</strong> : Selaku <strong>Manajer Operasional LPH AL-GHAZALI</strong>, bertindak fungsional untuk dan atas nama LPH AL-GHAZALI (UNUGHA) yang berkedudukan di Cilacap. Selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.
                          </li>
                          <li>
                            <strong>Perwakilan Asosiasi Pemotong Hewan</strong> : Bertindak sebagai representator pengurus Asosiasi Pemotong Hewan Jawa Tengah. Selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.
                          </li>
                        </ol>

                        <p className="pt-2"><strong>PARA PIHAK</strong> secara sadar bermufakat atas perjanjian kerjasama ringkas spesifik kelompok UMK:</p>

                        <div className="text-center font-bold mt-6 mb-2">Pasal 1<br/>RUANG LINGKUP SOSIALISASI & TEKNIS UMK</div>
                        <ol className="list-[lower-alpha] pl-5 space-y-2">
                          <li><strong>Sosialisasi Halal Kolektif:</strong> PIHAK PERTAMA dan PIHAK KEDUA sepakat mengundang lembaga pendidikan, yayasan, ormas, dan instansi kemasyarakatan lain untuk berkolaborasi menyelenggarakan sosialisasi sertifikasi halal reguler bagi pelaku UMK.</li>
                          <li><strong>Integrasi Asal-Usul Sembelihan:</strong> PIHAK KEDUA mendukung verifikasi dan penyediaan akses ketertelusuran bahan baku asal hewan dari RPH binaan demi membantu keabsahan audit halal UMK oleh PIHAK PERTAMA.</li>
                          <li><strong>Eksklusivitas Non-Komersial:</strong> PIHAK PERTAMA mendeklarasikan kebijakan tunggal kemitraan ini tanpa melibatkan pengujian lab komersial luar agar biaya tetap efisien untuk UMK.</li>
                        </ol>

                        <div className="text-center font-bold mt-6 mb-2">Pasal 2<br/>PEMBIAYAAN UMK</div>
                        <p>Bahwa pelaksanaan seluruh agenda sosialisasi bersama dikoordinasikan secara nirlaba dengan mengutamakan asas pemberdayaan umat tanpa mengenakan beban pembiayaan komersial kepada pelaku usaha mikro kecil.</p>

                        <div className="text-center font-bold mt-6 mb-2">Pasal 3<br/>MASA BERLAKU</div>
                        <p>PKS ringkas ini berlaku selama 2 (dua) tahun dan dapat diperpanjang atas persetujuan tertulis PARA PIHAK.</p>

                        <p className="mt-6 pt-4">Naskah dikukuhkan dengan itikad mulia and ditandatangani secara sah elektronik oleh masing-masing perwakilan instansi.</p>
                        
                        <div className="flex flex-col md:flex-row justify-between items-center text-center mt-12 mb-6 gap-8 md:gap-0 font-sans">
                          <div className="w-full md:w-1/2">
                            <p className="font-bold mb-1">PIHAK PERTAMA</p>
                            <p className="text-[10px] text-gray-500 uppercase">LPH AL-GHAZALI</p>
                            <div className="h-16 flex items-center justify-center">
                              <span className="font-serif italic text-emerald-800 font-extrabold text-sm rotate-[-3deg]">C. Soolany, S.TP., M.Si.</span>
                            </div>
                            <p className="font-bold underline text-xs">Christian Soolany, S.TP., M.Si.</p>
                            <p className="text-[10px] text-gray-500">Manajer Operasional LPH</p>
                          </div>
                          <div className="w-full md:w-1/2">
                            <p className="font-bold mb-1">PIHAK KEDUA</p>
                            <p className="text-[10px] text-gray-500 uppercase">Asosiasi Pemotong Hewan</p>
                            <div className="h-16 flex items-center justify-center">
                              <span className="font-mono text-gray-400 text-xs border border-dashed border-gray-300 px-3 py-1 bg-gray-50">DIGITALLY SIGNED</span>
                            </div>
                            <p className="font-bold underline text-xs">Perwakilan Asosiasi</p>
                            <p className="text-[10px] text-gray-500">Mitra Teknis Jawa Tengah</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 mt-12 border-t border-gray-200">
                    <div className="flex justify-between items-end text-sm text-gray-600">
                      <div>
                        Dokumen: Profil_Mitra_v2.5 (Ringkas & Spesifik UMK)
                      </div>
                      <div className="text-right">
                        <p className="mb-16">Bagian Hubungan Masyarakat dan Kemitraan</p>
                        <p className="font-bold underline text-gray-900 font-sans">Manajer Operasional LPH</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end shrink-0">
              <button 
                onClick={() => setIsKerjasamaPdfOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
                type="button"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {isPencarianPdfOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl shrink-0">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Pencarian_Sertifikasi_Halal_LPH_Al_Ghazali</h3>
              </div>
              <button 
                onClick={() => setIsPencarianPdfOpen(false)} 
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 sm:p-12 overflow-y-auto bg-gray-100 flex-1">
              <div className="bg-white max-w-3xl mx-auto shadow-sm ring-1 ring-gray-900/5 min-h-[600px] p-8 sm:p-12 text-gray-800">
                <div className="border-b-2 border-emerald-800 pb-6 mb-8 text-center">
                  <Logo className="h-16 w-16 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">LAYANAN PUBLIK</h1>
                  <h2 className="text-xl font-bold text-emerald-700 uppercase tracking-widest mt-1">Pencarian Sertifikasi Halal</h2>
                </div>
                
                <div className="space-y-8 leading-relaxed">
                  <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100 shadow-sm text-center">
                    <p className="text-lg font-medium text-emerald-900 italic">
                      "Layanan ini difasilitasi oleh LPH Al-Ghazali untuk memberikan kemudahan bagi masyarakat dan pelaku usaha dalam memverifikasi status kehalalan suatu produk secara real-time dan transparan."
                    </p>
                  </div>

                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Target className="w-6 h-6 mr-3 text-emerald-600" />
                      Tujuan Layanan Pencarian
                    </h3>
                    <p className="mb-4">
                      Fitur ini diintegrasikan secara terpusat untuk mewujudkan jaminan kepastian dan kenyamanan konsumen muslim dalam mengonsumsi produk. Melalui portal ini, Anda dapat:
                    </p>
                    <ul className="list-none space-y-3 pl-2 text-gray-700">
                      <li className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Mengecek <strong>Validitas Nomor Ketetapan Halal</strong> atau Nomor Sertifikat Halal yang diterbitkan oleh BPJPH.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Melacak riwayat <strong>Proses Pemeriksaan (Tracking)</strong> bagi produk yang sedang diaudit oleh LPH Al-Ghazali.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Memastikan kesesuaian antara nama produk, nama pelaku usaha, dan tanggal kedaluwarsa dokumen sertifikasi.</span>
                      </li>
                    </ul>
                  </section>

                  <section className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm mt-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-emerald-800">Direktori & Verifikasi Produk Halal</h3>
                      <p className="text-sm text-gray-500 mt-1">Cek Status Produk Anda di bawah ini</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-3">
                      <select className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none md:w-1/3">
                        <option value="nama_produk">Nama Produk</option>
                        <option value="nomor_sertifikat">Nomor Ketetapan Halal</option>
                        <option value="nama_perusahaan">Nama Perusahaan (PU)</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Masukkan kata kunci pencarian..." 
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center">
                        <Search className="w-4 h-4 mr-2" />
                        Cari
                      </button>
                    </div>
                    <div className="mt-4 text-center text-xs text-gray-500 border-t border-gray-100 pt-4">
                      *Hasil pencarian terhubung dengan sistem layanan terpadu Badan Penyelenggara Jaminan Produk Halal (BPJPH).
                    </div>
                  </section>

                  <section className="bg-gray-50 p-6 rounded-lg mt-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <ShieldCheck className="w-5 h-5 mr-2 text-emerald-600" />
                      Status Tahapan Sertifikasi
                    </h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Kami membedakan indikator status pengajuan sebagai berikut:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="w-3 h-3 rounded-full bg-yellow-400 mr-3"></div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Proses Pemeriksaan LPH</p>
                          <p className="text-xs text-gray-500">Produk/fasilitas sedang dalam tahap audit oleh Tim LPH Al-Ghazali.</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Menunggu Ketetapan Halal (Sidang Fatwa)</p>
                          <p className="text-xs text-gray-500">Berkas audit (LHP) sedang disidangkan oleh Komisi Fatwa MUI.</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 mr-3"></div>
                        <div>
                          <p className="text-sm font-bold text-emerald-800">Sertifikat Halal Terbit (Tervalidasi)</p>
                          <p className="text-xs text-emerald-700">Produk telah sah memiliki sertifikat halal yang dikeluarkan negara (BPJPH).</p>
                        </div>
                      </div>
                    </div>
                  </section>

                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end shrink-0">
              <button 
                onClick={() => setIsPencarianPdfOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
                type="button"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {isDaftarAuditPdfOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Daftar_Audit_dan_Klien_LPH_Al_Ghazali.pdf</h3>
              </div>
              <button 
                onClick={() => setIsDaftarAuditPdfOpen(false)} 
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 sm:p-12 overflow-y-auto bg-gray-100 flex-1">
              <div className="bg-white max-w-3xl mx-auto shadow-sm ring-1 ring-gray-900/5 min-h-[600px] p-8 sm:p-12 text-gray-800">
                <div className="border-b-2 border-emerald-800 pb-6 mb-8 text-center">
                  <Logo className="h-16 w-16 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">LAYANAN PUBLIK</h1>
                  <h2 className="text-xl font-bold text-emerald-700 uppercase tracking-widest mt-1">Daftar Audit dan Rekam Jejak LPH</h2>
                </div>
                
                <div className="space-y-8 leading-relaxed">
                  <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100 shadow-sm text-center">
                    <p className="text-lg font-medium text-emerald-900 italic">
                      "Transparansi layanan adalah wujud komitmen LPH Al-Ghazali dalam melayani umat dan mendampingi pelaku usaha merengkuh jaminan kepastian halal."
                    </p>
                  </div>

                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Briefcase className="w-6 h-6 mr-3 text-emerald-600" />
                      Lingkup Klien Kami
                    </h3>
                    <p className="mb-4 text-gray-700">
                      Selama beroperasi, Lembaga Pemeriksa Halal Universitas Nahdlatul Ulama Al Ghazali telah dipercaya oleh berbagai skala usaha lintas sektor, terutama yang beroperasi di wilayah eks-Karesidenan Banyumas (Cilacap, Banyumas, Purbalingga, Banjarnegara) hingga seluruh Jawa Tengah dan area strategis lainnya. Skala usaha yang kami audit meliputi:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                      <div className="bg-white border border-emerald-100 p-4 rounded-xl shadow-sm text-center">
                        <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm">Usaha Mikro (UMi)</h4>
                      </div>
                      <div className="bg-white border border-emerald-100 p-4 rounded-xl shadow-sm text-center">
                        <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm">Usaha Kecil</h4>
                      </div>
                      <div className="bg-white border border-emerald-100 p-4 rounded-xl shadow-sm text-center">
                        <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm">Usaha Menengah</h4>
                      </div>
                      <div className="bg-white border border-emerald-100 p-4 rounded-xl shadow-sm text-center">
                        <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm">Usaha Besar</h4>
                      </div>
                    </div>
                  </section>

                  {/* Section 'Daftar Pemeriksaan Berjalan' (walkthrough checklist) has been removed */}

                  <div className="pt-16 mt-12 border-t border-gray-200">
                    <div className="flex justify-between items-end text-sm text-gray-600">
                      <div>
                        Dokumen: Rekam_Jejak_Audit
                      </div>
                      <div className="text-right">
                        <p className="mb-16">Divisi Layanan & Operasional LPH</p>
                        <p className="font-bold underline text-gray-900">Manajer Operasional LPH</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end shrink-0">
              <button 
                onClick={() => setIsDaftarAuditPdfOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
                type="button"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {isAgendaPdfOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl shrink-0">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Agenda_dan_Jadwal_Kegiatan_LPH_Al_Ghazali.pdf</h3>
              </div>
              <button 
                onClick={() => setIsAgendaPdfOpen(false)} 
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 sm:p-12 overflow-y-auto bg-gray-100 flex-1">
              <div className="bg-white max-w-3xl mx-auto shadow-sm ring-1 ring-gray-900/5 min-h-[600px] p-8 sm:p-12 text-gray-800">
                <div className="border-b-2 border-emerald-800 pb-6 mb-8 text-center">
                  <Logo className="h-16 w-16 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">BERITA & INFORMASI</h1>
                  <h2 className="text-xl font-bold text-emerald-700 uppercase tracking-widest mt-1">Agenda Kampanye Halal Nasional</h2>
                </div>
                
                <div className="space-y-8 leading-relaxed">
                  <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100 shadow-sm text-center">
                    <p className="text-lg font-medium text-emerald-900 italic">
                      "Menyemai kesadaran halal melalui langkah nyata. Ikuti dan hadiri ragam agenda edukasi, pelatihan, dan kegiatan pendampingan sertifikasi yang diselenggarakan oleh LPH Al-Ghazali."
                    </p>
                  </div>

                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <CalendarDays className="w-6 h-6 mr-3 text-emerald-600" />
                      Jadwal Kegiatan Mendatang Terdekat
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-emerald-700 text-white p-6 flex flex-col items-center justify-center sm:w-1/4">
                          <span className="text-3xl font-black">15</span>
                          <span className="text-sm font-semibold uppercase tracking-widest mt-1">OKTOBER</span>
                          <span className="text-emerald-200 text-xs mt-1">2023</span>
                        </div>
                        <div className="p-6 sm:w-3/4 flex flex-col justify-center">
                          <div className="flex items-center text-xs text-emerald-600 font-semibold mb-2 bg-emerald-50 w-fit px-2 py-1 rounded">
                            <Activity className="w-3 h-3 mr-1" /> Pelatihan SDM
                          </div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2">Bimtek Penyelia Halal Batch IV</h4>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">Bimbingan teknis komprehensif bagi calon Penyelia Halal di lingkungan industri makanan ringan dan katering, bekerjasama dengan Dinas Koperasi UKM Cilacap.</p>
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <span className="flex items-center"><Clock className="w-4 h-4 mr-1 text-gray-400" /> 08:00 - Selesai</span>
                            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400" /> Aula Lt.3 UNUGHA</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-emerald-700 text-white p-6 flex flex-col items-center justify-center sm:w-1/4">
                          <span className="text-3xl font-black">28</span>
                          <span className="text-sm font-semibold uppercase tracking-widest mt-1">OKTOBER</span>
                          <span className="text-emerald-200 text-xs mt-1">2023</span>
                        </div>
                        <div className="p-6 sm:w-3/4 flex flex-col justify-center">
                          <div className="flex items-center text-xs text-blue-600 font-semibold mb-2 bg-blue-50 w-fit px-2 py-1 rounded">
                            <Activity className="w-3 h-3 mr-1" /> Kampanye Sosial
                          </div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2">Festival Jajanan Halal Nusantara</h4>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">Pameran UMKM Binaan LPH Al-Ghazali sekaligus kampanye Wajib Halal Oktober 2024 (WHO2024). Menghadirkan 50+ tenant makanan tersertifikasi.</p>
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <span className="flex items-center"><Clock className="w-4 h-4 mr-1 text-gray-400" /> 09:00 - 21:00</span>
                            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400" /> Alun-alun Cilacap</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-gray-100 text-gray-500 p-6 flex flex-col items-center justify-center sm:w-1/4">
                          <span className="text-3xl font-black">10</span>
                          <span className="text-sm font-semibold uppercase tracking-widest mt-1">NOVEMBER</span>
                          <span className="text-gray-400 text-xs mt-1">2023</span>
                        </div>
                        <div className="p-6 sm:w-3/4 flex flex-col justify-center">
                          <div className="flex items-center text-xs text-gray-600 font-semibold mb-2 bg-gray-200 w-fit px-2 py-1 rounded">
                            <Activity className="w-3 h-3 mr-1" /> Sosialisasi & Pra-Audit
                          </div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2">Layanan Jemput Bola "Gerai Halal"</h4>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">Pengecekan dokumen pra-audit gratis dan pendaftaran NIB terintegrasi Sihalal bagi UMKM Kecamatan Kesugihan dan sekitarnya.</p>
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <span className="flex items-center"><Clock className="w-4 h-4 mr-1 text-gray-400" /> 08:30 - 15:00</span>
                            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400" /> Balai Desa Kesugihan</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-white p-6 rounded-lg border border-gray-200 mt-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <Phone className="w-5 h-5 mr-2 text-emerald-600" />
                      Tertarik Berpartisipasi?
                    </h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Untuk informasi pendaftaran Bimtek, pemesanan kuota peserta, atau kolaborasi penyelenggaraan kegiatan, silakan hubungi tim Kesekretariatan kami.
                    </p>
                    <a href="#kontak" onClick={() => setIsAgendaPdfOpen(false)} className="inline-flex items-center bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-4 py-2 rounded-md font-medium text-sm transition-colors">
                      Hubungi Kesekretariatan LPH
                    </a>
                  </section>

                  <div className="pt-16 mt-12 border-t border-gray-200">
                    <div className="flex justify-between items-end text-sm text-gray-600">
                      <div>
                        Modul: Informasi_Agenda_Tahunan
                      </div>
                      <div className="text-right">
                        <p className="mb-16">Bagian Publikasi & Informasi</p>
                        <p className="font-bold underline text-gray-900">Admin Portal Publik LPH</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end shrink-0">
              <button 
                onClick={() => setIsAgendaPdfOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
                type="button"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {isKegiatanPdfOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl shrink-0">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Laporan_Kegiatan_LPH_Al_Ghazali.pdf</h3>
              </div>
              <button 
                onClick={() => setIsKegiatanPdfOpen(false)} 
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 sm:p-12 overflow-y-auto bg-gray-100 flex-1">
              <div className="bg-white max-w-3xl mx-auto shadow-sm ring-1 ring-gray-900/5 min-h-[600px] p-8 sm:p-12 text-gray-800">
                <div className="border-b-2 border-emerald-800 pb-6 mb-8 text-center">
                  <Logo className="h-16 w-16 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">BERITA & INFORMASI</h1>
                  <h2 className="text-xl font-bold text-emerald-700 uppercase tracking-widest mt-1">Kegiatan & Pendampingan LPH</h2>
                </div>
                
                <div className="space-y-8 leading-relaxed">
                  <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100 shadow-sm text-center">
                    <p className="text-lg font-medium text-emerald-900 italic">
                      "Dokumentasi kiprah nyata LPH Al-Ghazali dalam memfasilitasi, mendampingi, dan mengedukasi masyarakat serta UMKM demi terwujudnya ekosistem halal yang kuat dan berdaya saing."
                    </p>
                  </div>

                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <ImageIcon className="w-6 h-6 mr-3 text-emerald-600" />
                      Galeri & Laporan Kegiatan Terbaru
                    </h3>
                    
                    <div className="space-y-8">
                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white group hover:shadow-md transition-shadow">
                        <div className="aspect-[21/9] bg-gray-200 relative overflow-hidden flex items-center justify-center">
                          <ImageIcon className="w-16 h-16 text-gray-400 group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                            Bimtek & Pendampingan
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
                            <span className="flex items-center"><CalendarDays className="w-4 h-4 mr-1 text-emerald-600" /> 12 Agustus 2023</span>
                            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-emerald-600" /> Cilacap</span>
                          </div>
                          <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">Sosialisasi Wajib Halal Oktober 2024 (WHO2024) bagi Pelaku UMKM Karesidenan Banyumas</h4>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3">LPH Al-Ghazali berkolaborasi dengan Satgas Halal Kabupaten Cilacap sukses menyelenggarakan sosialisasi masif yang dihadiri oleh lebih dari 200 pelaku UMKM binaan. Kegiatan ini difokuskan pada percepatan sertifikasi halal jalur mandiri (reguler) maupun fasilitas gratis pemerintah (SEHATI).</p>
                          <button className="text-emerald-600 font-semibold text-sm hover:underline flex items-center">Selengkapnya <ArrowRight className="w-4 h-4 ml-1" /></button>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white group hover:shadow-md transition-shadow">
                        <div className="aspect-[21/9] bg-gray-200 relative overflow-hidden flex items-center justify-center">
                          <ImageIcon className="w-16 h-16 text-gray-400 group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                            Kunjungan & Audit
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
                            <span className="flex items-center"><CalendarDays className="w-4 h-4 mr-1 text-blue-600" /> 05 Juli 2023</span>
                            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-blue-600" /> Purbalingga</span>
                          </div>
                          <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">Audit Pemeriksaan Fasilitas Sentra Pemotongan Ayam Kab. Purbalingga</h4>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3">Tim Auditor dan SDM Syariah LPH Al-Ghazali melaksanakan audit lapangan secara komprehensif di salah satu sentra pemotongan ayam terbesar (RPA) di Purbalingga. Pemeriksaan mencakup aspek kebersihan (thayyib) dan pemotongan sesuai syariat (halal).</p>
                          <button className="text-blue-600 font-semibold text-sm hover:underline flex items-center">Selengkapnya <ArrowRight className="w-4 h-4 ml-1" /></button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-gray-50 border border-gray-200 p-6 rounded-xl mt-8 flex flex-col sm:flex-row items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Arsip Kegiatan</h3>
                      <p className="text-sm text-gray-600">Telusuri rekam jejak program dan kegiatan yang telah kami laksanakan di waktu terdahulu.</p>
                    </div>
                    <button className="mt-4 sm:mt-0 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                      Lihat Semua Arsip
                    </button>
                  </section>

                  <div className="pt-16 mt-12 border-t border-gray-200">
                    <div className="flex justify-between items-end text-sm text-gray-600">
                      <div>
                        Modul: Laporan_Giat_Publik
                      </div>
                      <div className="text-right">
                        <p className="mb-16">Divisi Humas & Publikasi</p>
                        <p className="font-bold underline text-gray-900">Redaksi LPH Al-Ghazali</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end shrink-0">
              <button 
                onClick={() => setIsKegiatanPdfOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
                type="button"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuthView({ navigateTo, setRole, roleType = 'pu' }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(roleType === 'staff' ? 'admin' : roleType);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
       setErrorMsg('Harap masukkan email Anda terlebih dahulu, lalu klik lupa sandi.');
       return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Tautan reset kata sandi telah dikirim ke email Anda.');
    } catch(e: any) {
      setErrorMsg(e.message || 'Gagal mengirim email reset kata sandi.');
    }
  };

  const handleStaffLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
            // Auto-create example staff accounts
            const EXAMPLE_STAFF: Record<string, string> = {
              'admin@lphalghazali.com': 'admin',
              'editor@lphalghazali.com': 'editor',
              'staf@lphalghazali.com': 'staf',
              'auditor@lphalghazali.com': 'auditor' // keep for backward compatibility temporarily
            };
            
            if (EXAMPLE_STAFF[email]) {
               try {
                   userCredential = await createUserWithEmailAndPassword(auth, email, password);
                   const roleAssigned = EXAMPLE_STAFF[email];
                   await setDoc(doc(db, 'users', userCredential.user.uid), {
                       email: email,
                       role: roleAssigned,
                       createdAt: Date.now()
                   });
               } catch (createErr: any) {
                   throw authError;
               }
            } else {
               throw authError; // Not an example staff, bubble up error
            }
        } else {
            throw authError;
        }
      }

      // Verify the role in DB
      let roleToSet = selectedRole;
      if (firebaseConfig.projectId !== 'mock-project') {
         const userDocRef = doc(db, 'users', userCredential.user.uid);
         const userDocSnap = await getDoc(userDocRef);
         
         if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (['admin', 'editor', 'staf', 'auditor'].includes(userData.role)) {
               roleToSet = userData.role;
               if (selectedRole !== userData.role && !(selectedRole === 'editor' && userData.role === 'auditor')) {
                   // Only relax error if user mis-selected but is actually staff. But for simplicity, let's just warn or accept.
                   // To avoid locking them out, we just use their real role from DB since they authenticated successfully.
               }
            } else {
               throw new Error("Akun ini bukan merupakan akun Staf/Admin.");
            }
         } else {
            // Ensure example staff data exists in database
            if (email === 'admin@lphalghazali.com' || email === 'editor@lphalghazali.com' || email === 'staf@lphalghazali.com') {
                const roleAssigned = email === 'admin@lphalghazali.com' ? 'admin' : (email === 'editor@lphalghazali.com' ? 'editor' : 'staf');
                await setDoc(userDocRef, {
                    email: email,
                    role: roleAssigned,
                    createdAt: Date.now()
                });
                roleToSet = roleAssigned;
            } else if (email === 'auditor@lphalghazali.com') {
                await setDoc(userDocRef, { email, role: 'auditor', createdAt: Date.now() });
                roleToSet = 'auditor';
            } else {
                throw new Error("Data Role Admin tidak ditemukan di database.");
            }
         }
      }

      setRole(roleToSet);
      if (roleToSet === 'admin' || roleToSet === 'staf') {
        navigateTo('admin-dashboard');
      } else if (roleToSet === 'auditor') {
        navigateTo('auditor-dashboard');
      } else if (roleToSet === 'editor') {
        navigateTo('admin-berita');
      } else {
        navigateTo('auditor-dashboard');
      }
      
    } catch (e: any) {
       console.error("Staff Login Error:", e);
       if (e.code === 'auth/operation-not-allowed') {
         setErrorMsg('Fitur masuk dengan Email belum diaktifkan. Silakan aktifkan di Firebase Console.');
       } else if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
         setErrorMsg('Email atau kata sandi admin salah.');
       } else {
         setErrorMsg(e.message || 'Gagal masuk. Periksa kembali data Anda.');
       }
    } finally {
       setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    if (roleType === 'staff') {
       handleStaffLogin();
       return;
    }

    try {
       if (isLogin) {
          try {
             await signInWithEmailAndPassword(auth, email, password);
          } catch (signInErr: any) {
             if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
                try {
                   const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                   await setDoc(doc(db, 'users', userCredential.user.uid), {
                      email: email,
                      role: 'pu',
                      createdAt: Date.now()
                   });
                } catch (createErr: any) {
                   if (createErr.code === 'auth/email-already-in-use') {
                      throw new Error('Email sudah terdaftar, tetapi kata sandi Anda salah.');
                   }
                   throw createErr; // rethrow other errors
                }
             } else {
                throw signInErr; // rethrow other sign in errors
             }
          }
       } else {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          try {
             await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: email,
                role: 'pu',
                createdAt: Date.now()
             });
          } catch (firestoreError) {
             console.error("Error creating user doc:", firestoreError);
          }
       }
       setRole('pu');
       navigateTo('pu-dashboard');
    } catch (e: any) {
       console.error("Auth error:", e);
       if (e.code === 'auth/operation-not-allowed') {
         setErrorMsg('Fitur masuk dengan Email belum diaktifkan. Silakan aktifkan Email/Password di Firebase Console.');
       } else if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
         setErrorMsg('Email atau kata sandi yang Anda masukkan salah.');
       } else if (e.code === 'auth/email-already-in-use') {
         setErrorMsg('Email ini sudah terdaftar. Silakan pilih "Sudah punya akun? Masuk di sini".');
       } else {
         setErrorMsg(e.message || 'Gagal masuk. Periksa kembali data Anda.');
       }
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-600 flex-col justify-between p-12 text-white">
        <div>
          <Logo className="h-16 w-16 mb-4 filter drop-shadow-md bg-white p-2 rounded-xl" />
          <h1 className="text-4xl font-bold mb-4">Portal Cloud LPH</h1>
          <p className="text-emerald-100 text-lg max-w-md">Sistem informasi terpadu yang terhubung langsung dengan database cloud untuk kecepatan dan keamanan data sertifikasi Anda.</p>
        </div>
        <p className="text-emerald-200 text-sm">&copy; 2026 LPH Al-Ghazali</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white relative">
        <button 
          onClick={() => navigateTo('landing')}
          className="absolute top-6 left-6 flex items-center text-gray-500 hover:text-emerald-600 transition-colors"
          type="button"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span className="text-sm font-medium">Kembali</span>
        </button>

        <div className="w-full max-w-md mt-6 lg:mt-0">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Logo className="h-12 w-12 mr-2" />
            <h1 className="text-2xl font-bold text-emerald-600">LPH Al-Ghazali</h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">{isLogin ? 'Selamat Datang' : 'Buat Akun'}</h2>
          <p className="text-gray-500 mb-8">Silakan masuk {roleType === 'staff' ? 'sebagai Staf LPH' : 'untuk mengakses sistem cloud'}.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center">
                   <X className="w-4 h-4 mr-2 shrink-0" /> {errorMsg}
                </div>
            )}

            {!isLogin && roleType === 'pu' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan</label>
                <input type="text" required className="block w-full border-gray-300 rounded-lg border p-3 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500" placeholder="PT. Nama Usaha" />
              </div>
            )}
            {roleType === 'staff' && (
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Role</label>
                  <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="block w-full border-gray-300 rounded-lg border p-3 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500">
                     <option value="admin">Admin Pusat</option>
                     <option value="auditor">Admin Auditor</option>
                     <option value="editor">Admin Editor</option>
                     <option value="staf">Admin Staf</option>
                  </select>
               </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{roleType === 'staff' ? 'Email Staf' : 'Email / ID SIHALAL'}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="block w-full border-gray-300 rounded-lg border p-3 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500" placeholder="nama@email.com" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Kata Sandi</label>
                {isLogin && (
                   <button 
                     type="button" 
                     onClick={handleResetPassword}
                     className="text-sm font-medium text-emerald-600 hover:text-emerald-500 flex items-center focus:outline-none"
                   >
                     <Key className="w-4 h-4 mr-1" /> Lupa sandi?
                   </button>
                )}
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full border-gray-300 rounded-lg border p-3 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 transition-colors">
              {loading ? 'Memproses...' : (isLogin ? 'Masuk ke Dashboard' : 'Daftar Sekarang')}
            </button>
            
          </form>

          {roleType === 'pu' && (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-emerald-600 hover:text-emerald-500">{isLogin ? 'Daftar di sini' : 'Masuk di sini'}</button>
              </p>
            </div>
          )}
          {roleType === 'staff' && (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Hubungi administrator jika Anda lupa kata sandi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardLayout({ children, role, navigateTo, logout, currentView }: any) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isInternal = ['admin', 'auditor', 'editor', 'staf'].includes(role);
  const roleName = role === 'admin' ? 'Admin Pusat' : (role === 'editor' ? 'Admin Editor' : (role === 'staf' ? 'Admin Staf' : (role === 'auditor' ? 'Admin Auditor' : 'Pelaku Usaha')));
  const roleInitial = role === 'admin' ? 'AP' : (role === 'editor' ? 'AE' : (role === 'staf' ? 'AS' : (role === 'auditor' ? 'AA' : 'PU')));
  const roleTitle = role === 'admin' ? 'Admin Pusat' : (role === 'editor' ? 'Editor' : (role === 'staf' ? 'Staf' : (role === 'auditor' ? 'Auditor' : 'Portal PU')));
  const portalTitle = isInternal ? 'Sistem Manajemen LPH' : 'Portal Pelaku Usaha';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 ${isInternal ? 'bg-slate-900 text-slate-300' : 'bg-white text-gray-600 shadow-md'} flex flex-col z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className={`h-16 flex items-center justify-between px-6 border-b shrink-0 ${isInternal ? 'border-slate-800 bg-slate-950 text-white' : 'border-gray-200 text-emerald-600'}`}>
          <div className="flex items-center">
            <Logo className={`h-8 w-8 mr-2 ${isInternal ? 'bg-white p-0.5 rounded' : ''}`} />
            <span className="font-bold text-xl">LPH {role === 'pu' ? 'Portal' : 'Staf'}</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className={`p-4 text-center border-b shrink-0 ${isInternal ? 'border-slate-800' : 'border-gray-200'}`}>
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl font-bold mb-2 ${isInternal ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                {roleInitial}
            </div>
            <p className={`font-semibold ${isInternal ? 'text-white' : 'text-gray-800'}`}>{roleName}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button onClick={() => { navigateTo(role === 'admin' ? 'admin-dashboard' : (isInternal ? 'auditor-dashboard' : 'pu-dashboard')); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${currentView.includes('dashboard') ? (isInternal ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 font-medium') : (isInternal ? 'hover:bg-slate-800' : 'hover:bg-emerald-50')}`}>
            <Home className="w-5 h-5 mr-3" /> Dashboard
          </button>
          
          {role === 'pu' && (
            <>
              <button onClick={() => { navigateTo('pu-pengajuan'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${currentView === 'pu-pengajuan' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'hover:bg-emerald-50 hover:text-emerald-600'}`}>
                <PlusCircle className="w-5 h-5 mr-3" /> Buat Pengajuan
              </button>
              <button onClick={() => { navigateTo('pu-kalkulator'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${currentView === 'pu-kalkulator' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'hover:bg-emerald-50 hover:text-emerald-600'}`}>
                <Calculator className="w-5 h-5 mr-3" /> Kalkulator Biaya
              </button>
            </>
          )}
          
          {(role === 'admin' || role === 'staf' || role === 'auditor') && (
            <button onClick={() => { navigateTo('admin-dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${currentView === 'admin-dashboard' || (currentView === 'auditor-dashboard' && role === 'auditor') ? (isInternal ? 'bg-emerald-600 text-white font-medium shadow-md' : 'bg-emerald-100 text-emerald-700') : (isInternal ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-emerald-50 hover:text-emerald-600')}`}>
              <ShieldCheck className="w-5 h-5 mr-3" /> Dashboard {role === 'pu' ? '' : 'Internal'}
            </button>
          )}

          {(role === 'admin' || role === 'editor') && (
            <button onClick={() => { navigateTo('admin-berita'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${currentView === 'admin-berita' ? (isInternal ? 'bg-emerald-600 text-white font-medium shadow-md' : 'bg-emerald-100') : (isInternal ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-emerald-50')}`}>
              <Newspaper className="w-5 h-5 mr-3" /> Publikasi & Berita
            </button>
          )}

          {(role === 'admin' || role === 'editor') && (
            <button onClick={() => { navigateTo('admin-kegiatan'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${currentView === 'admin-kegiatan' ? (isInternal ? 'bg-emerald-600 text-white font-medium shadow-md' : 'bg-emerald-100') : (isInternal ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-emerald-50')}`}>
              <Activity className="w-5 h-5 mr-3" /> Agenda Kegiatan
            </button>
          )}

          {(role === 'admin' || role === 'staf') && (
            <button onClick={() => { navigateTo('admin-auditor'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${currentView === 'admin-auditor' ? (isInternal ? 'bg-emerald-600 text-white font-medium shadow-md' : 'bg-emerald-100') : (isInternal ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-emerald-50')}`}>
              <Users className="w-5 h-5 mr-3" /> Data Auditor
            </button>
          )}

          {role === 'auditor' && (
            <button onClick={() => { navigateTo('auditor-dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${currentView === 'auditor-dashboard' ? 'bg-emerald-600 text-white font-medium shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
              <UserCheck className="w-5 h-5 mr-3" /> Panel Audit Halal
            </button>
          )}

          <button onClick={() => { if (role === 'admin') { navigateTo('admin-settings'); } else if (isInternal) { navigateTo('auditor-dashboard'); } else { navigateTo('pu-settings'); } setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${currentView === 'admin-settings' && role === 'admin' ? 'bg-emerald-600 text-white font-medium' : currentView === 'pu-settings' && role === 'pu' ? 'bg-emerald-100 text-emerald-700 font-medium' : isInternal ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-emerald-50 hover:text-emerald-600'}`}>
            <Settings className="w-5 h-5 mr-3" /> Pengaturan
          </button>
        </nav>
        
        <div className={`p-4 border-t shrink-0 ${isInternal ? 'border-slate-800' : 'border-gray-200'}`}>
          <button onClick={logout} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${isInternal ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}>
            <LogOut className="w-5 h-5 mr-3" /> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10 shadow-sm shrink-0">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mr-3 text-gray-500 hover:text-emerald-600">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-gray-800 hidden sm:block">
              {portalTitle}
            </h2>
            <h2 className="text-lg font-bold text-gray-800 sm:hidden">
              {roleTitle}
            </h2>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:flex items-center text-xs sm:text-sm font-medium text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-1 rounded-full border border-emerald-100">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-emerald-500" /> Cloud Sync Active
            </div>
            <div className="flex items-center space-x-2 pl-2 sm:pl-4 sm:border-l border-gray-200 cursor-pointer hover:bg-gray-50 p-1.5 sm:p-2 rounded-lg transition-colors">
               <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  {roleInitial.charAt(0)}
               </div>
               <span className="text-sm font-medium text-gray-700 hidden sm:block">{roleName}</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// ==========================================
// PELAKU USAHA VIEWS
// ==========================================

function PUDashboard({ data, navigateTo }: any) {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [activeHistory, setActiveHistory] = useState<any>(null);

  const handleOpenHistory = (item: any) => {
    setActiveHistory(item);
    setHistoryModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Anda</h2>
          <p className="text-gray-500">Pantau status pemeriksaan sertifikasi dari cloud.</p>
        </div>
        <button onClick={() => navigateTo('pu-pengajuan')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-colors flex items-center">
          <PlusCircle className="w-5 h-5 mr-2" /> Pengajuan Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4"><FileText /></div>
          <div><p className="text-sm text-gray-500 font-medium">Total Pengajuan</p><p className="text-2xl font-bold text-gray-800">{data.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mr-4"><Clock /></div>
          <div><p className="text-sm text-gray-500 font-medium">Sedang Diproses</p><p className="text-2xl font-bold text-gray-800">{data.filter((d: any) => d.status !== 'Selesai' && d.status !== 'LHP Terbit').length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4"><CheckCircle /></div>
          <div><p className="text-sm text-gray-500 font-medium">Selesai / LHP</p><p className="text-2xl font-bold text-gray-800">{data.filter((d: any) => d.status === 'Selesai' || d.status === 'LHP Terbit').length}</p></div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-4">Riwayat Pengajuan Tersimpan</h3>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {data.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileSignature className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>Belum ada data pengajuan di Cloud.</p>
            <button onClick={() => navigateTo('pu-pengajuan')} className="mt-4 text-emerald-600 font-medium hover:underline">Buat pengajuan pertama Anda</button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Registrasi / Waktu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perusahaan & Produk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Real-time</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{item.nomorRegistrasi}</div>
                    <div className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString('id-ID')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.companyName}</div>
                    <div className="text-xs text-gray-500">{item.productName} ({item.jenisPengajuan})</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => handleOpenHistory(item)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors font-medium">Buka Riwayat & Catatan</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {historyModalOpen && activeHistory && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                  <h3 className="font-bold text-gray-900">Riwayat Perubahan Status</h3>
                  <button onClick={() => setHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
               </div>
               <div className="p-6 overflow-y-auto grow">
                  <div className="mb-6">
                     <p className="text-sm text-gray-500 mb-1">Registrasi: <span className="font-bold text-gray-900">{activeHistory.nomorRegistrasi}</span></p>
                     <p className="text-sm text-gray-500">Pelaku Usaha: <span className="font-bold text-gray-900">{activeHistory.companyName}</span></p>
                  </div>
                  <div className="space-y-4">
                     {activeHistory.history && activeHistory.history.length > 0 ? (
                        activeHistory.history.map((h: any, i: number) => (
                           <div key={i} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                                 {i < activeHistory.history.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1"></div>}
                              </div>
                              <div className="pb-4">
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-gray-900">{h.status}</span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{new Date(h.timestamp).toLocaleString('id-ID')}</span>
                                 </div>
                                 <p className="text-sm text-gray-600">{h.catatan}</p>
                              </div>
                           </div>
                        ))
                     ) : (
                        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">Tidak ada riwayat untuk pengajuan ini.</p>
                     )}
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

function PUFormPengajuan({ submit, navigateTo }: any) {
  const [formData, setFormData] = useState({
    companyName: '',
    productName: '',
    skalaUsaha: 'Mikro',
    jenisPengajuan: 'Baru',
    jenisLayanan: 'Reguler',
    jenisProduk: 'Makanan & Minuman',
    jumlahProduk: 1,
    jumlahPabrik: 1,
    tiketPesawat: 0
  });
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (validTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
    } else {
      alert("Tipe file tidak didukung. Harap unggah PDF, JPG, PNG, atau WEBP.");
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'jumlahProduk' || name === 'jumlahPabrik' || name === 'tiketPesawat') ? Number(value) : value
    }));
  };

  // Live calculation formula
  let mandays = 0;
  if (formData.skalaUsaha === 'Mikro') mandays = 1;
  else if (formData.skalaUsaha === 'Kecil') mandays = 2;
  else if (formData.skalaUsaha === 'Menengah') mandays = 4;
  else if (formData.skalaUsaha === 'Besar') mandays = 8;
  
  if (formData.jumlahPabrik > 1 && mandays > 0) {
    mandays += (formData.jumlahPabrik - 1);
  }

  const unitCost = 1000000;
  const hargaMandoc = mandays * unitCost;
  const operasional = formData.skalaUsaha ? 200000 : 0;
  const unitUhpd = 150000;
  const hargaUhpd = mandays * unitUhpd;
  const unitTransport = 100000;
  const hargaTransport = mandays * unitTransport;

  const dDays = mandays > 2 ? mandays - 2 : 0;
  const unitAkomodasi = 200000;
  const hargaAkomodasi = dDays * unitAkomodasi;

  const pendaftaran = (formData.skalaUsaha === 'Mikro' || formData.skalaUsaha === 'Kecil') ? 300000 : 1500000;
  const penetapanKH = (formData.skalaUsaha === 'Mikro' || formData.skalaUsaha === 'Kecil') ? 150000 : 300000;

  const grandTotal = hargaMandoc + operasional + hargaUhpd + hargaTransport + hargaAkomodasi + formData.tiketPesawat + pendaftaran + penetapanKH;

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  const onSubmit = (e: any) => {
    e.preventDefault();
    setLoading(true);
    // Simulate Cloud Upload Delay
    setTimeout(() => {
      submit({ ...formData, grandTotal, file });
    }, 1200);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigateTo('pu-dashboard')} className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-emerald-600">
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Formulir Card */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-emerald-600 px-6 py-4 text-white">
            <h3 className="font-bold text-lg">Formulir Pengajuan Terhubung Cloud</h3>
            <p className="text-emerald-100 text-sm">Dokumen dan data akan disinkronisasikan ke Firestore secara real-time.</p>
          </div>
          
          <form onSubmit={onSubmit} className="p-6 sm:p-8 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Perusahaan / Pabrik <span className="text-red-500">*</span></label>
                <input type="text" required name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" placeholder="PT. / CV. / Kedai..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Produk / Grup Produk <span className="text-red-500">*</span></label>
                <input type="text" required name="productName" value={formData.productName} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" placeholder="Kripik Pisang Aneka Rasa" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Skala Usaha</label>
                <select name="skalaUsaha" value={formData.skalaUsaha} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="Mikro">Mikro</option>
                  <option value="Kecil">Kecil</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Pengajuan</label>
                <select name="jenisPengajuan" value={formData.jenisPengajuan} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="Baru">Baru</option>
                  <option value="Perpanjangan">Perpanjangan</option>
                  <option value="Pengembangan">Pengembangan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Layanan</label>
                <input type="text" readOnly name="jenisLayanan" value="Reguler" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-600 cursor-not-allowed font-medium" />
                <span className="text-[10px] text-gray-500">LPH Al-Ghazali hanya memproses skema sertifikasi Reguler.</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Produk</label>
                <select name="jenisProduk" value={formData.jenisProduk} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="Makanan & Minuman">Makanan & Minuman</option>
                  <option value="Barang Gunaan">Barang Gunaan</option>
                  <option value="Jasa Pendistribusian">Jasa Pendistribusian</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Jumlah Produk</label>
                <input type="number" min="1" name="jumlahProduk" value={formData.jumlahProduk} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Jumlah Pabrik / Outlet</label>
                <input type="number" min="1" name="jumlahPabrik" value={formData.jumlahPabrik} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Transport Udara / Tiket Pesawat</label>
                <select name="tiketPesawat" value={formData.tiketPesawat} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500">
                  <option value={0}>Tidak membutuhkan tiket pesawat</option>
                  <option value={1000000}>Dalam Pulau Jawa (Rp 1.000.000)</option>
                  <option value={3000000}>Luar Pulau Jawa (Rp 3.000.000)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Unggah Dokumen Legal / Syarat <span className="text-red-500">*</span></label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleChange}
                />
                <UploadCloud className={`w-10 h-10 mx-auto mb-2 ${dragActive ? 'text-emerald-500' : 'text-gray-400'}`} />
                {file ? (
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-medium text-emerald-600 truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Hapus File
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900">Klik / Drag & Drop Berkas Persyaratan</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, WEBP (Maksimal 10MB)</p>
                  </>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-end">
              <button type="submit" disabled={loading} className="px-6 py-3 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-75 flex items-center">
                {loading ? 'Mengunggah ke Cloud...' : 'Simpan & Kirim Pengajuan'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Estimator Sidebar Panel */}
        <div className="w-full lg:w-80 bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4 self-start">
          <div>
            <h4 className="font-bold text-gray-800 text-sm">Estimator Biaya Real-time</h4>
            <p className="text-xs text-gray-400">Pre-kalkulasi instan berdasarkan input form</p>
          </div>

          <div className="space-y-2 text-xs border-y py-3 text-gray-600">
            <div className="flex justify-between">
              <span>Mandays ({mandays} hari)</span>
              <span className="font-semibold text-gray-800">{formatRp(hargaMandoc)}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Operasional</span>
              <span className="font-semibold text-gray-800">{formatRp(operasional)}</span>
            </div>
            <div className="flex justify-between">
              <span>UHPD Auditor</span>
              <span className="font-semibold text-gray-800">{formatRp(hargaUhpd)}</span>
            </div>
            <div className="flex justify-between">
              <span>Transport & Akomodasi</span>
              <span className="font-semibold text-gray-800">{formatRp(hargaTransport + hargaAkomodasi)}</span>
            </div>
            {formData.tiketPesawat > 0 && (
              <div className="flex justify-between">
                <span>Tiket Pesawat</span>
                <span className="font-semibold text-gray-800">{formatRp(formData.tiketPesawat)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Pendaftaran & Sertifikasi</span>
              <span className="font-semibold text-gray-800">{formatRp(pendaftaran)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sidang Fatwa KH</span>
              <span className="font-semibold text-gray-800">{formatRp(penetapanKH)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100">
            <span className="text-xs font-bold text-gray-700">Total Biaya</span>
            <span className="font-extrabold text-emerald-600 text-sm">{formatRp(grandTotal)}</span>
          </div>

          <div className="bg-emerald-50 text-[10px] text-emerald-800 leading-relaxed p-2.5 rounded border border-emerald-100">
            <span className="font-bold bg-emerald-200 px-1 rounded mr-1">Cloud Sync</span>
            Biaya ini tersimpan otomatis di data pengajuan cloud setelah disubmit.
          </div>
        </div>
      </div>
    </div>
  );
}

function PUSettings({ navigateTo }: any) {
  const [activeTab, setActiveTab] = useState('profil');
  const [agreed, setAgreed] = useState(false);

  const tabs = [
    { id: 'profil', label: 'Profil Usaha', icon: Briefcase },
    { id: 'aturan', label: 'Aturan & Regulasi LPH', icon: ShieldCheck }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pengaturan & Informasi</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola data profil usaha dan baca aturan LPH Al-Ghazali sebelum mengajukan permohonan audit.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible relative" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center w-full px-4 py-4 sm:px-6 whitespace-nowrap md:whitespace-normal transition-all border-b-2 md:border-b-0 md:border-l-4 text-sm font-medium ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-500 md:border-b-transparent' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent md:border-l-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
          {activeTab === 'profil' && (
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Profil Pelaku Usaha</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Pemilik/Penanggung Jawab</label>
                    <input type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Perusahaan/Usaha</label>
                    <input type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">NIB</label>
                    <input type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input type="email" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Lengkap</label>
                    <textarea rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"></textarea>
                  </div>
                </div>
                <div className="flex justify-end pt-4 gap-3">
                  <button onClick={() => alert("Profil berhasil disimpan.")} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors text-sm">
                    Simpan Profil
                  </button>
                  <button onClick={() => setActiveTab('aturan')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center">
                    Lanjut ke Aturan <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'aturan' && (
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Aturan & Persyaratan Pelaku Usaha</h3>
              <p className="text-sm text-gray-500 mb-6">Syarat dan ketentuan yang harus dipatuhi selama proses pengajuan audit di LPH Al-Ghazali.</p>
              
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <h4 className="font-bold text-emerald-800 text-sm mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" /> Kewajiban Pelaku Usaha (PU)
                  </h4>
                  <ul className="list-disc list-inside text-sm text-emerald-900 space-y-1.5 ml-1">
                    <li>Memberikan informasi dan dokumen yang benar, sah, dan valid sesuai persyaratan SIHALAL BPJPH.</li>
                    <li>Memisahkan lokasi, tempat, dan alat penyembelihan, pengolahan, penyimpanan, pengemasan, pendistribusian, penjualan, serta penyajian antara produk halal dan tidak halal.</li>
                    <li>Memiliki Penyelia Halal yang beragama Islam dan memiliki sertifikat pelatihan Penyelia Halal.</li>
                    <li>Melaporkan setiap perubahan komposisi bahan (ingredients) kepada BPJPH dan LPH.</li>
                    <li>Mengikuti seluruh rangkaian proses audit lapangan (on-site) yang dilakukan oleh tim Auditor LPH Al-Ghazali.</li>
                    <li>Membayar tarif layanan sertifikasi sesuai tagihan (invoice) yang ditetapkan.</li>
                  </ul>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                  <h4 className="font-bold text-orange-800 text-sm mb-2 flex items-center">
                    <Zap className="w-4 h-4 mr-2" /> Sanksi & Ketentuan Lainnya
                  </h4>
                  <ul className="list-disc list-inside text-sm text-orange-900 space-y-1.5 ml-1">
                    <li>Pemalsuan dokumen persyaratan dapat mengakibatkan penolakan pengajuan sertifikasi secara sepihak.</li>
                    <li>Auditor berhak menolak melanjutkan proses audit apabila ditemukan indikasi kontaminasi najis berat (mughallazah) yang tidak dilaporkan.</li>
                    <li>Hasil penetapan kehalalan (Fatwa MUI) bersifat mutlak dan LPH Al-Ghazali hanya bertugas melakukan pemeriksaan/pengujian.</li>
                  </ul>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="flex items-start cursor-pointer group">
                    <div className="flex items-center h-5">
                      <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500" />
                    </div>
                    <div className="ml-3 text-sm">
                      <span className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">Saya telah membaca dan menyetujui aturan serta kewajiban di atas.</span>
                      <p className="text-gray-500 text-xs mt-1">Persetujuan ini menjadi syarat wajib bagi setiap Pelaku Usaha yang mengajukan pemeriksaan di LPH.</p>
                    </div>
                  </label>
                  
                  <div className="mt-6 flex justify-end">
                    <button 
                      disabled={!agreed} 
                      onClick={() => navigateTo('pu-pengajuan')} 
                      className={`px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center ${agreed ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    >
                      Mulai Pengajuan Sertifikasi <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PUKalkulatorView({ navigateTo }: any) {
  const [formData, setFormData] = useState({
    provinsi: 'Jawa Tengah',
    kabKota: 'Cilacap',
    kecamatan: '',
    kelurahanDesa: '',
    jenisLayanan: 'Reguler',
    jenisProduk: 'Makanan & Minuman',
    skalaUsaha: 'Mikro',
    jumlahProduk: 1,
    jumlahPabrik: 1,
    tiketPesawat: 0
  });

  const handleFormChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: (name === 'jumlahProduk' || name === 'jumlahPabrik' || name === 'tiketPesawat') ? Number(value) : value
    }));
  };

  // Kalkulasi biaya
  let mandays = 0;
  if (formData.skalaUsaha === 'Mikro') mandays = 1;
  else if (formData.skalaUsaha === 'Kecil') mandays = 2;
  else if (formData.skalaUsaha === 'Menengah') mandays = 4;
  else if (formData.skalaUsaha === 'Besar') mandays = 8;
  
  if (formData.jumlahPabrik > 1 && mandays > 0) {
    mandays += (formData.jumlahPabrik - 1);
  }

  const unitCost = 1000000;
  const hargaMandoc = mandays * unitCost;
  const operasional = formData.skalaUsaha ? 200000 : 0;
  const unitUhpd = 150000;
  const hargaUhpd = mandays * unitUhpd;
  const unitTransport = 100000;
  const hargaTransport = mandays * unitTransport;

  const dDays = mandays > 2 ? mandays - 2 : 0;
  const unitAkomodasi = 200000;
  const hargaAkomodasi = dDays * unitAkomodasi;

  const pendaftaran = (formData.skalaUsaha === 'Mikro' || formData.skalaUsaha === 'Kecil') ? 300000 : 1500000;
  const penetapanKH = (formData.skalaUsaha === 'Mikro' || formData.skalaUsaha === 'Kecil') ? 150000 : 300000;

  const grandTotal = hargaMandoc + operasional + hargaUhpd + hargaTransport + hargaAkomodasi + formData.tiketPesawat + pendaftaran + penetapanKH;

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="md:flex md:justify-between md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Simulasi / Kalkulator Biaya</h2>
          <p className="text-gray-500 text-sm">Hitung pra-estimasi biaya sertifikasi halal Anda secara langsung.</p>
        </div>
        <button onClick={() => navigateTo('pu-pengajuan')} className="mt-4 md:mt-0 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-colors flex items-center text-sm">
          <PlusCircle className="w-5 h-5 mr-2" /> Mulai Isi Pengajuan
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Form Input Container */}
        <div className="lg:w-1/2 w-full bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-emerald-500 pl-3">Parameter Simulasi</h3>
          <form className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Provinsi (Fokus Layanan)</label>
                <input type="text" readOnly name="provinsi" value="Jawa Tengah" className="w-full border-gray-300 rounded-lg border p-2.5 bg-gray-50 text-sm font-medium text-gray-600 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kabupaten / Kota</label>
                <input type="text" name="kabKota" value={formData.kabKota} onChange={handleFormChange} placeholder="Contoh: Cilacap" className="w-full border-gray-300 rounded-lg border p-2.5 bg-white text-sm focus:ring-emerald-500 focus:border-emerald-500 text-gray-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kecamatan</label>
                <input type="text" name="kecamatan" value={formData.kecamatan || ''} onChange={handleFormChange} placeholder="Contoh: Kesugihan" className="w-full border-gray-300 rounded-lg border p-2.5 bg-white text-sm focus:ring-emerald-500 focus:border-emerald-500 text-gray-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kelurahan / Desa</label>
                <input type="text" name="kelurahanDesa" value={formData.kelurahanDesa || ''} onChange={handleFormChange} placeholder="Contoh: Kesugihan Kidul" className="w-full border-gray-300 rounded-lg border p-2.5 bg-white text-sm focus:ring-emerald-500 focus:border-emerald-500 text-gray-700" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Jenis Layanan</label>
                <input type="text" readOnly name="jenisLayanan" value="Reguler" className="w-full border-gray-300 rounded-lg border p-2.5 bg-gray-50 text-sm font-medium text-gray-600 cursor-not-allowed" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Jenis Produk</label>
                <select name="jenisProduk" value={formData.jenisProduk} onChange={handleFormChange} className="w-full border-gray-300 rounded-lg border p-2.5 bg-white text-sm focus:ring-emerald-500 focus:border-emerald-500 text-gray-700">
                  <option value="Makanan & Minuman">Makanan & Minuman</option>
                  <option value="Barang Gunaan">Barang Gunaan</option>
                  <option value="Jasa Pendistribusian">Jasa Pendistribusian</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Skala Usaha</label>
                <select name="skalaUsaha" value={formData.skalaUsaha} onChange={handleFormChange} className="w-full border-gray-300 rounded-lg border p-2.5 bg-white text-sm focus:ring-emerald-500 focus:border-emerald-500 text-gray-700">
                  <option value="Mikro">Mikro</option>
                  <option value="Kecil">Kecil</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Jumlah Produk</label>
                <input name="jumlahProduk" type="number" min="1" value={formData.jumlahProduk} onChange={handleFormChange} className="w-full border-gray-300 rounded-lg border p-2.5 bg-white text-sm focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Jumlah Pabrik / Outlet</label>
                <input name="jumlahPabrik" type="number" min="1" value={formData.jumlahPabrik} onChange={handleFormChange} className="w-full border-gray-300 rounded-lg border p-2.5 bg-white text-sm focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kebutuhan Transport (Opsional)</label>
                <select name="tiketPesawat" value={formData.tiketPesawat} onChange={handleFormChange} className="w-full border-gray-300 rounded-lg border p-2.5 bg-white text-sm focus:ring-emerald-500 focus:border-emerald-500 text-gray-700">
                  <option value={0}>Tidak memerlukan tiket pesawat</option>
                  <option value={1000000}>Pulau Jawa (Rp 1.000.000)</option>
                  <option value={3000000}>Luar Pulau Jawa (Rp 3.000.000)</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Detailed Estimate */}
        <div className="lg:w-1/2 w-full bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-emerald-500 pl-3">Estimasi Biaya</h3>
          
          <div className="mb-4 text-xs bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 leading-relaxed shadow-xs">
            <span className="font-bold bg-emerald-200 text-emerald-950 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider mr-1.5">Info Edukasi</span>
            Sesuai peraturan menteri, biaya pemeriksaan dihitung berdasarkan tarif mandays auditor kepatuhan berpatokan pada skala usaha mikro & kecil Anda, yang dikoordinasikan secara penuh melalui standar rujukan biaya BPJPH RI.
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-500">Pemeriksaan Dokumen (Mandays: {mandays})</span>
              <span className="font-semibold text-gray-800">{formatRp(hargaMandoc)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-500">Biaya Administrasi & Operasional</span>
              <span className="font-semibold text-gray-800">{formatRp(operasional)}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-500">UHPD Auditor</span>
              <span className="font-semibold text-gray-800">{formatRp(hargaUhpd)}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-500">Akomodasi & Transport Lokal</span>
              <span className="font-semibold text-gray-800">{formatRp(hargaTransport + hargaAkomodasi)}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-500">Tiket Pesawat</span>
              <span className="font-semibold text-gray-800">{formatRp(formData.tiketPesawat)}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-500">Pendaftaran & Penerbitan Sertifikat</span>
              <span className="font-semibold text-gray-800">{formatRp(pendaftaran)}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-500">Sidang Fatwa / Penetapan Kehalalan</span>
              <span className="font-semibold text-gray-800">{formatRp(penetapanKH)}</span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl flex justify-between items-center border border-emerald-100 mt-4">
              <span className="font-bold text-gray-800 text-lg">Total Estimasi</span>
              <span className="font-extrabold text-emerald-600 text-xl">{formatRp(grandTotal)}</span>
            </div>

            <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-800 flex gap-1.5 items-start">
              <span className="font-bold bg-amber-100 px-1 py-0.5 rounded text-amber-900 leading-none">Info</span>
              <p>Estimasi ini bersifat simulasi awal. Tagihan final akan dihitung resmi oleh administrasi LPH Al-Ghazali setelah dokumen di-verifikasi di cloud.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ADMIN VIEWS
// ==========================================

function AdminDashboard({ data, updateStatus, role }: any) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [catatan, setCatatan] = useState('');

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [activeHistory, setActiveHistory] = useState<any>(null);

  const roleLabel = role === 'admin' ? 'Pusat' : (role === 'staf' ? 'Staf' : (role === 'auditor' ? 'Auditor' : 'Editor'));

  const handleOpenUpdateModal = (item: any) => {
    // Audit log or restriction check here if needed
    setSelectedItem(item);
    setNewStatus(item.status);
    setCatatan('');
    setIsModalOpen(true);
  };

  const handleSubmitUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      updateStatus(selectedItem.id, newStatus, catatan);
      setIsModalOpen(false);
      setSelectedItem(null);
    }
  };

  const handleOpenHistory = (item: any) => {
    setActiveHistory(item);
    setHistoryModalOpen(true);
  };

  return (
    <div className="max-w-full relative">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-emerald-600 pl-4">Panel Sinkronisasi Data <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg text-sm font-semibold ml-2">Admin {roleLabel}</span></h2>
          <p className="text-gray-500 text-sm mt-1">Perubahan status di sini akan langsung terlihat oleh Pelaku Usaha via Cloud.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Pengajuan Cloud</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-yellow-400">
            <p className="text-sm font-medium text-gray-500">Menunggu Verifikasi</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data.filter((d: any) => d.status === 'Menunggu Verifikasi').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-blue-500">
            <p className="text-sm font-medium text-gray-500">Proses Audit</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data.filter((d: any) => d.status === 'Proses Audit').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-emerald-500">
            <p className="text-sm font-medium text-gray-500">Selesai (LHP Terbit)</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data.filter((d: any) => d.status === 'Selesai' || d.status === 'LHP Terbit').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800">Daftar Pengajuan (Real-time Firestore)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reg / Waktu</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pelaku Usaha / Produk</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status Saat Ini</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{item.nomorRegistrasi}</div>
                    <div className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString('id-ID')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.companyName}</div>
                    <div className="text-xs text-gray-500">{item.productName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleOpenHistory(item)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded transition-colors font-medium">Riwayat</button>
                       <button onClick={() => handleOpenUpdateModal(item)} className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded transition-colors font-medium border border-emerald-200">Ubah Status</button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Belum ada data masuk dari Cloud.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedItem && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-900">Perbarui Status Pengajuan</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
               </div>
               <form onSubmit={handleSubmitUpdate} className="p-6">
                  <div className="mb-4">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Status Baru</label>
                     <select 
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full border-gray-300 rounded-lg p-2.5 bg-white focus:ring-emerald-500 focus:border-emerald-500 border text-sm"
                     >
                        <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                        <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                        <option value="Proses Audit">Proses Audit</option>
                        <option value="Selesai">Selesai (Terbit LHP)</option>
                     </select>
                  </div>
                  <div className="mb-6">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
                     <textarea 
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        placeholder="Contoh: Dokumen NIB kurang lengkap..."
                        className="w-full border-gray-300 rounded-lg p-2.5 border text-sm focus:ring-emerald-500 focus:border-emerald-500"
                        rows={3}
                     ></textarea>
                  </div>
                  <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors">Batal</button>
                     <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm shadow-sm transition-colors">Simpan Perubahan</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {historyModalOpen && activeHistory && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                  <h3 className="font-bold text-gray-900">Riwayat Perubahan Status</h3>
                  <button onClick={() => setHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
               </div>
               <div className="p-6 overflow-y-auto grow">
                  <div className="mb-6">
                     <p className="text-sm text-gray-500 mb-1">Registrasi: <span className="font-bold text-gray-900">{activeHistory.nomorRegistrasi}</span></p>
                     <p className="text-sm text-gray-500">Pelaku Usaha: <span className="font-bold text-gray-900">{activeHistory.companyName}</span></p>
                  </div>
                  <div className="space-y-4">
                     {activeHistory.history && activeHistory.history.length > 0 ? (
                        activeHistory.history.map((h: any, i: number) => (
                           <div key={i} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                                 {i < activeHistory.history.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1"></div>}
                              </div>
                              <div className="pb-4">
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-gray-900">{h.status}</span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{new Date(h.timestamp).toLocaleString('id-ID')}</span>
                                 </div>
                                 <p className="text-sm text-gray-600">{h.catatan}</p>
                              </div>
                           </div>
                        ))
                     ) : (
                        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">Tidak ada riwayat untuk pengajuan ini.</p>
                     )}
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

// ==========================================
// AUDITOR VIEW
// ==========================================
function AuditorDashboard({ data, updateStatus }: any) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [catatan, setCatatan] = useState('');

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [activeHistory, setActiveHistory] = useState<any>(null);

  const handleOpenUpdateModal = (item: any) => {
    setSelectedItem(item);
    setNewStatus(item.status);
    setCatatan('');
    setIsModalOpen(true);
  };

  const handleSubmitUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      updateStatus(selectedItem.id, newStatus, catatan);
      setIsModalOpen(false);
      setSelectedItem(null);
    }
  };

  const handleOpenHistory = (item: any) => {
    setActiveHistory(item);
    setHistoryModalOpen(true);
  };

  return (
    <div className="max-w-full relative">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Data Audit Berjalan</h2>
        <p className="text-gray-500 text-sm mt-1">Daftar pengajuan yang ditugaskan kepada Anda untuk dilakukan audit halal.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-blue-500">
            <p className="text-sm font-medium text-gray-500">Menunggu Tindakan (Proses Audit)</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data.filter((d: any) => d.status === 'Proses Audit').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-emerald-500">
            <p className="text-sm font-medium text-gray-500">Selesai (LHP Terbit)</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data.filter((d: any) => d.status === 'Selesai' || d.status === 'LHP Terbit').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800">Daftar Pengajuan untuk Diaudit</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reg / Waktu</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pelaku Usaha / Produk</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi LHP</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{item.nomorRegistrasi}</div>
                    <div className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString('id-ID')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.companyName}</div>
                    <div className="text-xs text-gray-500">{item.productName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleOpenHistory(item)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded transition-colors font-medium">Riwayat</button>
                       <button onClick={() => handleOpenUpdateModal(item)} className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded transition-colors font-medium border border-emerald-200">Ubah Status</button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada pengajuan yang perlu diaudit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedItem && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-gray-900">Perbarui Status LHP</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
               </div>
               <form onSubmit={handleSubmitUpdate} className="p-6">
                  <div className="mb-4">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Status Baru</label>
                     <select 
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full border-gray-300 rounded-lg p-2.5 bg-white focus:ring-emerald-500 focus:border-emerald-500 border text-sm"
                     >
                        <option value="Proses Audit">Proses Audit</option>
                        <option value="Selesai">Selesai (Terbit LHP)</option>
                     </select>
                  </div>
                  <div className="mb-6">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Audit Tambahan (Opsional)</label>
                     <textarea 
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        placeholder="Contoh: Dokumen NIB kurang lengkap..."
                        className="w-full border-gray-300 rounded-lg p-2.5 border text-sm focus:ring-emerald-500 focus:border-emerald-500"
                        rows={3}
                     ></textarea>
                  </div>
                  <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors">Batal</button>
                     <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm shadow-sm transition-colors">Simpan Perubahan</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {historyModalOpen && activeHistory && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                  <h3 className="font-bold text-gray-900">Riwayat Laporan</h3>
                  <button onClick={() => setHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
               </div>
               <div className="p-6 overflow-y-auto grow">
                  <div className="mb-6">
                     <p className="text-sm text-gray-500 mb-1">Registrasi: <span className="font-bold text-gray-900">{activeHistory.nomorRegistrasi}</span></p>
                     <p className="text-sm text-gray-500">Pelaku Usaha: <span className="font-bold text-gray-900">{activeHistory.companyName}</span></p>
                  </div>
                  <div className="space-y-4">
                     {activeHistory.history && activeHistory.history.length > 0 ? (
                        activeHistory.history.map((h: any, i: number) => (
                           <div key={i} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                                 {i < activeHistory.history.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1"></div>}
                              </div>
                              <div className="pb-4">
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-gray-900">{h.status}</span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{new Date(h.timestamp).toLocaleString('id-ID')}</span>
                                 </div>
                                 <p className="text-sm text-gray-600">{h.catatan}</p>
                              </div>
                           </div>
                        ))
                     ) : (
                        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">Tidak ada riwayat untuk pengajuan ini.</p>
                     )}
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

// ==========================================
// ADMIN BERITA VIEW (CRUD)
// ==========================================
function AdminBerita({ data, addData, updateData, deleteData }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const initialFormState = { title: '', category: 'Berita Utama', content: '', fileName: '', fileType: '', fileData: '', socialMediaLink: '' };
  const [formData, setFormData] = useState(initialFormState);

  const openModal = (berita: any = null) => {
    if (berita) {
      setEditId(berita.id);
      setFormData({
        title: berita.title || '',
        category: berita.category || 'Berita Utama',
        content: berita.content || '',
        fileName: berita.fileName || '',
        fileType: berita.fileType || '',
        fileData: berita.fileData || '',
        socialMediaLink: berita.socialMediaLink || ''
      });
    } else {
      setEditId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditId(null);
  };

  // Menangani File Upload (Gambar, PDF, Video)
  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    // Batasan ukuran file (10MB untuk demo)
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file terlalu besar! Maksimal 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({
        ...formData,
        fileName: file.name,
        fileType: file.type,
        fileData: reader.result as string // Data URL (base64)
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setFormData({ ...formData, fileName: '', fileType: '', fileData: '' });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate slight network delay
    setTimeout(async () => {
      if (editId) {
        await updateData(editId, formData);
      } else {
        await addData(formData);
      }
      setIsLoading(false);
      closeModal();
    }, 800);
  };

  return (
    <div className="max-w-full relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Publikasi & Edukasi Halal</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola artikel, berita, dan unggah lampiran gambar/PDF.</p>
        </div>
        <button onClick={() => openModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-colors flex items-center">
          <PlusCircle className="w-5 h-5 mr-2" /> Tulis Berita
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Judul & Lampiran</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kategori & Tanggal</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((berita: any) => (
                <tr key={berita.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                        {berita.fileType && berita.fileType.includes('image') ? (
                          <img src={berita.fileData} alt="" className="h-full w-full object-cover" />
                        ) : berita.fileType && berita.fileType.includes('pdf') ? (
                          <FileText className="text-red-500 w-6 h-6" />
                        ) : (
                          <ImageIcon className="text-gray-400 w-6 h-6" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900 line-clamp-1">{berita.title}</div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                           {berita.fileName ? (
                             <span className="truncate max-w-[200px] inline-block"><i className="fas fa-paperclip mr-1"></i> {berita.fileName}</span>
                           ) : "Tidak ada lampiran"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mb-1">{berita.category}</span>
                    <div className="text-xs text-gray-500">{new Date(berita.createdAt).toLocaleDateString('id-ID')}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button onClick={() => openModal(berita)} className="text-blue-600 hover:text-blue-900 mr-4 bg-blue-50 p-2 rounded-md transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => deleteData(berita.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    <Newspaper className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    Belum ada data publikasi di Cloud.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM TAMBAH/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/75 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Edit className="w-5 h-5 text-emerald-600 mr-2" /> 
                {editId ? 'Edit Berita' : 'Tulis Berita Baru'}
              </h3>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul Artikel <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Masukkan judul..." />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500">
                    <option value="Berita Utama">Berita Utama</option>
                    <option value="Kegiatan">Kegiatan LPH</option>
                    <option value="Agenda">Agenda LPH</option>
                    <option value="Regulasi BPJPH">Regulasi BPJPH/MUI</option>
                    <option value="Info Halal">Info Halal Edukatif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Isi Konten Artikel <span className="text-red-500">*</span></label>
                  <textarea required rows={5} value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Tulis deskripsi atau isi berita di sini..."></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tautan Embed Sosial Media (Opsional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Link className="h-4 w-4 text-gray-400" />
                    </div>
                    <input type="url" value={formData.socialMediaLink} onChange={(e) => setFormData({...formData, socialMediaLink: e.target.value})} className="w-full pl-10 rounded-md border border-gray-300 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="https://instagram.com/... atau youtube..." />
                  </div>
                </div>

                {/* Upload File / Gambar / Video Section */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                   <label className="block text-sm font-bold text-gray-700 mb-2">Lampiran File (Gambar, Video, Dokumen PDF)</label>
                   
                   {formData.fileName ? (
                     <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                        <div className="flex items-center overflow-hidden">
                           {formData.fileType.includes('image') ? <ImageIcon className="w-5 h-5 text-emerald-500 mr-2 shrink-0" /> : formData.fileType.includes('video') ? <Video className="w-5 h-5 text-blue-500 mr-2 shrink-0" /> : <FileText className="w-5 h-5 text-red-500 mr-2 shrink-0" />}
                           <span className="text-sm font-medium text-gray-800 truncate">{formData.fileName}</span>
                        </div>
                        <button type="button" onClick={removeFile} className="text-red-500 hover:text-red-700 p-1 ml-2"><X className="w-4 h-4" /></button>
                     </div>
                   ) : (
                     <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:bg-gray-50 transition">
                       <UploadCloud className="text-emerald-500 w-8 h-8 mb-2" />
                       <span className="text-sm font-medium text-gray-700">Klik untuk memilih file</span>
                       <span className="text-xs text-gray-400 mt-1">Mendukung: PDF, JPG, PNG, GIF, SVG, WEBP (Maks 10MB)</span>
                       <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.svg,.webp" onChange={handleFileChange} className="hidden" />
                     </label>
                   )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 shrink-0">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={isLoading} className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md shadow-sm hover:bg-emerald-700 disabled:opacity-75 flex items-center">
                  {isLoading ? 'Menyimpan...' : 'Simpan & Publikasikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminAuditor({ data }: any) {
  const [searchName, setSearchName] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchCert, setSearchCert] = useState('');

  // Gabungkan dummy "ARTHAGUNA LESTARI" dengan auto-data (data pengajuanList)
  const baseData = [
    {
      id: 'mock-1',
      companyName: 'ARTHAGUNA LESTARI',
      productName: 'Serealia dan produk serealia yang merupakan produk turunan dari biji serealia, akar dan umbi, kacang-kacangan dan empulur dengan pengolahan dan penambahan bahan tambahan pangan',
      nomorSertifikat: 'ID18110033288141125'
    },
    ...(data || []).map((item: any, index: number) => ({
      id: item.id || `auto-${index}`,
      companyName: item.companyName,
      productName: item.productName || item.jenisPengajuan || '-',
      nomorSertifikat: item.nomorRegistrasi || `ID18110000000${index + 1}`
    }))
  ];

  const filteredData = baseData.filter(item => {
    const matchName = item.companyName?.toLowerCase().includes(searchName.toLowerCase());
    const matchProduct = item.productName?.toLowerCase().includes(searchProduct.toLowerCase());
    const matchCert = item.nomorSertifikat?.toLowerCase().includes(searchCert.toLowerCase());
    return matchName && matchProduct && matchCert;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Daftar Audit</h2>
          <p className="text-sm text-gray-500 mt-1">Data auditor dan daftar audit pelaku usaha yang telah mendaftar.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Cari Nama PU..." 
            value={searchName} 
            onChange={e => setSearchName(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" 
          />
          <input 
            type="text" 
            placeholder="Cari Jenis Produk..." 
            value={searchProduct} 
            onChange={e => setSearchProduct(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" 
          />
          <input 
            type="text" 
            placeholder="Cari No Sertifikat..." 
            value={searchCert} 
            onChange={e => setSearchCert(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" 
          />
        </div>
        
        <div className="px-6 py-3 border-b border-gray-200 bg-emerald-50 text-emerald-800 font-medium text-sm">
          Jumlah data: {filteredData.length}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Nama PU
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Jenis Produk
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  No Sertifikat
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-100">
                    {item.companyName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-100 max-w-md" title={item.productName}>
                    {item.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-mono">
                    {item.nomorSertifikat}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm">
                    Tidak ada data yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminKegiatan({ addData, updateData }: any) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Kegiatan',
    content: '',
    startDate: '',
    location: '',
    organizer: '',
    fileName: '',
    fileType: '',
    fileData: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file terlalu besar! Maksimal 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({
        ...formData,
        fileName: file.name,
        fileType: file.type,
        fileData: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setFormData({ ...formData, fileName: '', fileType: '', fileData: '' });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Combine fields into content to fit existing data structure of Berita
    const combinedContent = `**Tanggal:** ${formData.startDate}
**Lokasi/Platform:** ${formData.location}
**Penyelenggara:** ${formData.organizer}

${formData.content}`;

    const submissionData = {
      title: formData.title,
      category: formData.category,
      content: combinedContent,
      fileName: formData.fileName,
      fileType: formData.fileType,
      fileData: formData.fileData,
    };

    setTimeout(async () => {
      await addData(submissionData);
      setIsLoading(false);
      setFormData({
        title: '',
        category: 'Kegiatan',
        content: '',
        startDate: '',
        location: '',
        organizer: '',
        fileName: '',
        fileType: '',
        fileData: ''
      });
      alert('Kegiatan berhasil dipublikasikan!');
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Activity className="w-6 h-6 mr-3 text-emerald-600" /> Form Kegiatan & Agenda
        </h2>
        <p className="text-gray-500 text-sm mt-1">Buat jadwal agenda dan kegiatan baru yang akan ditampilkan di portal publikasi.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kegiatan <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Misal: Sosialisasi Jaminan Produk Halal 2024" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pelaksanaan <span className="text-red-500">*</span></label>
              <input type="datetime-local" required value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi / Platform <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Misal: Aula Masjid Al-Ghazali atau Zoom" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Penyelenggara / Narasumber</label>
              <input type="text" value={formData.organizer} onChange={(e) => setFormData({...formData, organizer: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Sebutkan Instansi / Narasumber" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi & Rincian Acara <span className="text-red-500">*</span></label>
              <textarea required rows={5} value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Tulis rincian informasi kegiatan..."></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Poster / Banner Kegiatan (Opsional)</label>
              <div className="flex items-center space-x-4">
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-500 transition-colors bg-gray-50 flex-1 text-center cursor-pointer overflow-hidden">
                  <input type="file" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.webp,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <UploadCloud className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-emerald-600">Pilih File Poster/Gambar</span>
                  <p className="text-xs text-gray-500 mt-1">Maks: 10MB (JPG, PNG)</p>
                </div>
                {formData.fileData && (
                  <div className="relative h-24 w-24 shrink-0 rounded-lg overflow-hidden border border-gray-200">
                    {formData.fileType.includes('image') ? (
                      <img src={formData.fileData} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                        <FileText className="text-emerald-500 w-8 h-8" />
                      </div>
                    )}
                    <button type="button" onClick={removeFile} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 flex justify-end">
            <button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-colors flex items-center">
              {isLoading ? 'Menyimpan...' : 'Simpan & Publikasikan Kegiatan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminSettings() {
  const [activeTab, setActiveTab] = useState('profil');
  const [isSaving, setIsSaving] = useState(false);

  const defaultSettings = {
    profil: {
      namaLembaga: 'LPH Al-Ghazali',
      noAkreditasi: 'LPH-1811-001',
      alamat: 'Jl. Kemerdekaan Barat No.12, Kesugihan, Cilacap, Jawa Tengah 53274',
      email: 'lphalghazali@gmail.com',
      noWa: '085802494252'
    },
    struktur: {
      sdmSyariah: ["H. Fatah Rosihan A., M.M.", "Syaefudin Zuhri, S.Ag."],
      images: {
        "H. Fatah Rosihan A., M.M.": "/fatah.jpg",
        "Syaefudin Zuhri, S.Ag.": "/syaefudin.jpg"
      }
    },
    sistem: {
      whatsappBot: true,
      emailNotif: true,
      maintenance: false
    },
    integrasi: {
      sihalalEndpoint: 'https://api.sihalal.bpjph.go.id/v1/',
      sihalalSecret: 'sihalal-sec-1234567890'
    },
    tarifData: [
      { komponen: 'Biaya Pemeriksaan (Mandoc)', skala: 'Mikro & Kecil', nominal: '350.000' },
      { komponen: 'Biaya Pemeriksaan (Mandoc)', skala: 'Menengah', nominal: '2.500.000' },
      { komponen: 'Biaya Transportasi Auditor', skala: 'Dalam Kota (Radius < 50km)', nominal: '150.000' },
      { komponen: 'Uang Harian Auditor', skala: 'Semua Skala (Per Hari)', nominal: '200.000' }
    ],
    produkData: [
      'Susu dan analognya',
      'Lemak, minyak, dan emulsi minyak',
      'Buah dan sayur olahan',
      'Kembang gula/permen dan cokelat',
      'Serealia dan produk serealia',
      'Produk bakeri'
    ],
    wilayahData: [
      { nama: 'Jawa Tengah', cakupan: 'Cilacap, Banyumas, Purbalingga, Banjarnegara' },
      { nama: 'Jawa Barat', cakupan: 'Pangandaran, Ciamis, Banjar, Tasikmalaya' }
    ],
    roles: [
      { role: 'Super Admin', desc: 'Akses penuh ke semua modul konfigurasi dan master data.', status: 'Aktif' },
      { role: 'Auditor Utama', desc: 'Terbitkan laporan LHP, kelola data audit & plotting.', status: 'Aktif' },
      { role: 'Staf Keuangan', desc: 'Validasi pembayaran tarif layanan oleh PU.', status: 'Aktif' }
    ],
    akunStaf: [
      { nama: 'Admin Pusat', email: 'admin@lphalghazali.com', role: 'Super Admin', status: 'Aktif', passwordHash: CryptoJS.SHA256('Admin123').toString() },
      { nama: 'Admin Editor', email: 'editor@lphalghazali.com', role: 'Editor Eksekutif', status: 'Aktif', passwordHash: CryptoJS.SHA256('Editor123').toString() },
      { nama: 'Staf Admin', email: 'staf@lphalghazali.com', role: 'Staf Pelaksana', status: 'Aktif', passwordHash: CryptoJS.SHA256('Staf123').toString() }
    ]
  };

  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    // Fetch from Firebase
    const settingsRef = doc(db, 'artifacts', currentAppId, 'public', 'system_settings');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(prev => ({ 
           ...prev, 
           ...data,
           profil: { ...prev.profil, ...(data.profil || {}) },
           struktur: { ...prev.struktur, ...(data.struktur || {}) },
           sistem: { ...prev.sistem, ...(data.sistem || {}) },
           integrasi: { ...prev.integrasi, ...(data.integrasi || {}) },
        }));
      }
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, `artifacts/${currentAppId}/public/system_settings`);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsRef = doc(db, 'artifacts', currentAppId, 'public', 'system_settings');
      await setDoc(settingsRef, settings, { merge: true });
      setIsSaving(false);
      alert("Pengaturan Sistem berhasil disimpan ke Cloud Database!");
    } catch (error) {
      console.error('Error saving settings:', error);
      setIsSaving(false);
      alert("Gagal menyimpan pengaturan.");
    }
  };

  const handleChange = (category: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...(prev as any)[category],
        [field]: value
      }
    }));
  };

  const tabs = [
    { id: 'profil', label: 'Profil Lembaga', icon: Landmark },
    { id: 'struktur', label: 'Struktur Organisasi', icon: Network },
    { id: 'akses', label: 'Hak Akses & Role', icon: Users },
    { id: 'master', label: 'Master Data', icon: BookOpen },
    { id: 'sistem', label: 'Sistem & Notifikasi', icon: MonitorSmartphone },
    { id: 'template', label: 'Template Dokumen', icon: FileText },
    { id: 'integrasi', label: 'Integrasi & API', icon: Network }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h2>
          <p className="text-sm text-gray-500 mt-1">Konfigurasi dan manajemen platform LPH Al-Ghazali.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-colors flex items-center text-sm shrink-0">
          <CheckCircle className="w-4 h-4 mr-2" /> {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible relative" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center w-full px-4 py-4 sm:px-6 whitespace-nowrap lg:whitespace-normal transition-all border-b-2 lg:border-b-0 lg:border-l-4 text-sm font-medium ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-500 lg:border-b-transparent' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent lg:border-l-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
          {activeTab === 'profil' && (
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Profil Lembaga LPH</h3>
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lembaga</label>
                    <input type="text" value={settings.profil.namaLembaga} onChange={(e) => handleChange('profil', 'namaLembaga', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Akreditasi BPJPH</label>
                    <input type="text" value={settings.profil.noAkreditasi} onChange={(e) => handleChange('profil', 'noAkreditasi', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                    <textarea rows={3} value={settings.profil.alamat} onChange={(e) => handleChange('profil', 'alamat', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Resmi</label>
                    <input type="email" value={settings.profil.email} onChange={(e) => handleChange('profil', 'email', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp/Telepon</label>
                    <input type="text" value={settings.profil.noWa} onChange={(e) => handleChange('profil', 'noWa', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'struktur' && (
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Struktur Organisasi (SDM Syariah)</h3>
              <p className="text-sm text-gray-500 mb-6">Kelola susunan anggota dan foto profil SDM Syariah.</p>
              
              <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800">Daftar SDM Syariah</h4>
                      {(settings.struktur?.sdmSyariah || []).map((person: string, idx: number) => (
                          <div key={idx} className="flex gap-2">
                              <input 
                                  type="text" 
                                  value={person} 
                                  onChange={(e) => {
                                      const newSet = [...(settings.struktur?.sdmSyariah || [])];
                                      newSet[idx] = e.target.value;
                                      
                                      // If the name changes, copy the image mapping over (best effort)
                                      const newImages = { ...(settings.struktur?.images || {}) };
                                      if (settings.struktur?.images?.[person] && !newImages[e.target.value]) {
                                        newImages[e.target.value] = settings.struktur.images[person];
                                      }

                                      handleChange('struktur', 'sdmSyariah', newSet);
                                      handleChange('struktur', 'images', newImages);
                                  }}
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" 
                                  placeholder="Nama anggota"
                              />
                              <button
                                  type="button"
                                  onClick={() => {
                                      const newSet = [...(settings.struktur?.sdmSyariah || [])];
                                      newSet.splice(idx, 1);
                                      handleChange('struktur', 'sdmSyariah', newSet);
                                  }}
                                  className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      ))}
                      <button
                          type="button"
                          onClick={() => {
                              const newSet = [...(settings.struktur?.sdmSyariah || []), ""];
                              handleChange('struktur', 'sdmSyariah', newSet);
                          }}
                          className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
                      >
                          <PlusCircle className="w-4 h-4 mr-1" /> Tambah Anggota
                      </button>
                      <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex items-start mt-4">
                          <CheckCircle2 className="w-5 h-5 text-blue-500 mr-2 shrink-0 mt-0.5" />
                          <p className="text-sm text-blue-800">
                             Simpan perubahan terlebih dahulu sebelum memperbarui foto pada kartu di sebelah kanan.
                          </p>
                      </div>
                  </div>

                  <div className="flex flex-col items-center p-8 bg-gray-50 rounded-xl border border-gray-200">
                    <OrgCard 
                      title="SDM Syariah" 
                      list={settings.struktur?.sdmSyariah || []} 
                      className="w-full sm:w-[350px] relative" 
                      allowUpload={true} 
                      defaultImages={settings.struktur?.images || {}}
                      onImageChange={(identifier: string, base64Data: string) => {
                          handleChange('struktur', 'images', {
                              ...(settings.struktur?.images || {}),
                              [identifier]: base64Data
                          });
                      }}
                    />
                  </div>
              </div>
            </div>
          )}
          {activeTab === 'akses' && (
             <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Hak Akses & Role</h3>
                <p className="text-sm text-gray-500 mb-6">Kelola wewenang dan jenis staf dalam sistem.</p>
                <div className="border border-gray-200 rounded-lg overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                         <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deskripsi Wewenang</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                         </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                         {settings.roles.map((role: any, idx: number) => (
                           <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                <input type="text" value={role.role} onChange={(e) => {
                                  const newRoles = [...settings.roles];
                                  newRoles[idx].role = e.target.value;
                                  handleChange('roles', '', newRoles);
                                }} className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none" />
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                <input type="text" value={role.desc} onChange={(e) => {
                                  const newRoles = [...settings.roles];
                                  newRoles[idx].desc = e.target.value;
                                  handleChange('roles', '', newRoles);
                                }} className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none" />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right"><span className="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">{role.status}</span></td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                <button onClick={() => {
                  const newRoles = [...settings.roles, { role: 'Role Baru', desc: 'Deskripsi Role', status: 'Aktif' }];
                  setSettings(prev => ({ ...prev, roles: newRoles }));
                }} className="mt-5 text-sm text-emerald-600 font-semibold hover:text-emerald-700 flex items-center bg-emerald-50 px-3 py-2 rounded-lg transition-colors"><PlusCircle className="w-4 h-4 mr-1.5" /> Tambah Role Baru</button>

                <div className="mt-10 mb-2">
                   <h3 className="text-lg font-bold text-gray-900">Daftar Akun Staf (Contoh Hak Akses)</h3>
                   <p className="text-sm text-gray-500">Gunakan contoh akun di bawah ini pada simulasi <strong className="font-semibold text-emerald-600">Login Staf LPH</strong> dengan memilih "Pilih Role" yang sesuai untuk melihat perbedaan level akses.</p>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                         <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama & Email Simulasi</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kredensial Login</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pilih Role Login</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Akses</th>
                         </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                         {(settings.akunStaf || []).map((akun: any, idx: number) => (
                           <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="text-sm font-semibold text-gray-900">{akun.nama}</div>
                                 <div className="text-sm text-emerald-600">{akun.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                 <span className="bg-gray-100 border border-gray-200 rounded px-2 py-1 font-mono text-xs select-all">Pwd: {akun.email.includes('admin') ? 'Admin123' : (akun.email.includes('editor') ? 'Editor123' : 'Staf123')}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                 <span className="px-2.5 py-1 inline-flex text-xs font-semibold rounded bg-gray-100 text-gray-800 border border-gray-200">{akun.role === 'Super Admin' ? 'Admin Pusat' : (akun.role === 'Auditor Utama' ? 'Auditor Halal' : 'Staf Keuangan')}</span>
                                 <span className="ml-2 text-xs text-gray-400">sebagai {akun.role}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-emerald-600 font-medium">
                                {akun.status}
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
          {activeTab === 'master' && (
             <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Master Data</h3>
                <p className="text-sm text-gray-500 mb-6">Data referensi global untuk dropdown dan variabel sistem.</p>
                <div className="space-y-8">
                  {/* Komponen Tarif */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                      <div className="flex items-center">
                         <Coins className="w-5 h-5 text-emerald-600 mr-2" />
                         <h4 className="font-bold text-gray-900">Master Data Tarif LPH</h4>
                      </div>
                      <button className="text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
                        <PlusCircle className="w-4 h-4 inline mr-1" /> Tambah Tarif
                      </button>
                    </div>
                    <div className="p-5">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Komponen Biaya</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori Skala Usaha</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nominal (Rp)</th>
                              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {settings.tarifData.map((item: any, idx: number) => (
                              <tr key={idx}>
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                  <input type="text" value={item.komponen} onChange={(e) => {
                                    const newData = [...settings.tarifData];
                                    newData[idx].komponen = e.target.value;
                                    handleChange('tarifData', '', newData);
                                  }} className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none" />
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  <input type="text" value={item.skala} onChange={(e) => {
                                    const newData = [...settings.tarifData];
                                    newData[idx].skala = e.target.value;
                                    handleChange('tarifData', '', newData);
                                  }} className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none" />
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                                  <input type="text" value={item.nominal} onChange={(e) => {
                                    const newData = [...settings.tarifData];
                                    newData[idx].nominal = e.target.value;
                                    handleChange('tarifData', '', newData);
                                  }} className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none" />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button onClick={() => {
                                      const newData = settings.tarifData.filter((_: any, i: number) => i !== idx);
                                      handleChange('tarifData', '', newData);
                                  }} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="w-4 h-4 ml-auto" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Jenis Produk */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                      <div className="flex items-center">
                         <BookOpen className="w-5 h-5 text-emerald-600 mr-2" />
                         <h4 className="font-bold text-gray-900">Master Data Jenis Produk</h4>
                      </div>
                      <button onClick={() => {
                        handleChange('produkData', '', [...settings.produkData, 'Produk Baru']);
                      }} className="text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
                        <PlusCircle className="w-4 h-4 inline mr-1" /> Tambah Produk
                      </button>
                    </div>
                    <div className="p-5">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {settings.produkData.map((prod: string, idx: number) => (
                            <div key={idx} className="flex items-center border border-gray-300 rounded-md pr-2">
                               <input type="text" value={prod} onChange={(e) => {
                                 const newProd = [...settings.produkData];
                                 newProd[idx] = e.target.value;
                                 handleChange('produkData', '', newProd);
                               }} className="w-full flex-1 border-none focus:ring-0 px-3 py-2 text-sm rounded-l-md" />
                               <button onClick={() => {
                                 const newProd = settings.produkData.filter((_: any, i: number) => i !== idx);
                                 handleChange('produkData', '', newProd);
                               }} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                  <X className="w-4 h-4" />
                               </button>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>

                  {/* Wilayah */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                      <div className="flex items-center">
                         <MapPin className="w-5 h-5 text-emerald-600 mr-2" />
                         <h4 className="font-bold text-gray-900">Master Data Wilayah Layanan</h4>
                      </div>
                      <button className="text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
                        <PlusCircle className="w-4 h-4 inline mr-1" /> Tambah Wilayah
                      </button>
                    </div>
                    <div className="p-5 flex gap-4 overflow-x-auto">
                        {settings.wilayahData.map((wil: any, idx: number) => (
                          <div key={idx} className="border border-gray-200 p-4 rounded-lg min-w-[200px]">
                             <input type="text" value={wil.nama} onChange={(e) => {
                               const newWil = [...settings.wilayahData];
                               newWil[idx].nama = e.target.value;
                               handleChange('wilayahData', '', newWil);
                             }} className="font-bold text-gray-900 mb-2 border-b pb-2 w-full bg-transparent focus:outline-none" />
                             <textarea value={wil.cakupan} onChange={(e) => {
                               const newWil = [...settings.wilayahData];
                               newWil[idx].cakupan = e.target.value;
                               handleChange('wilayahData', '', newWil);
                             }} className="text-sm text-gray-600 w-full bg-transparent border-none focus:ring-0 resize-none px-0" rows={4} />
                          </div>
                        ))}
                        
                        <div onClick={() => {
                           handleChange('wilayahData', '', [...settings.wilayahData, { nama: 'Provinsi Baru', cakupan: 'Kota/Kabupaten Baru' }]);
                        }} className="border border-gray-200 p-4 rounded-lg min-w-[200px] border-dashed bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                           <span className="text-emerald-600 font-medium text-sm flex items-center"><PlusCircle className="w-4 h-4 mr-1"/> Provinsi Baru</span>
                        </div>
                    </div>
                  </div>
                </div>
             </div>
          )}
          {activeTab === 'sistem' && (
             <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Sistem & Notifikasi</h3>
                <div className="space-y-6">
                   <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                      <div className="pr-4">
                         <h4 className="text-sm font-bold text-gray-900 flex items-center mb-1"><Zap className="w-4 h-4 text-yellow-500 mr-1.5" /> Notifikasi WhatsApp Bot</h4>
                         <p className="text-sm text-gray-500">Kirim otomatis pesan perubahan status dokumen kepada Pelaku Usaha.</p>
                      </div>
                      <div className="relative inline-block w-12 shrink-0 align-middle select-none transition duration-200 ease-in">
                         <input type="checkbox" name="toggle" id="whatsapp-toggle" checked={settings.sistem.whatsappBot} onChange={(e) => handleChange('sistem', 'whatsappBot', e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-emerald-500" style={{ right: settings.sistem.whatsappBot ? 0 : '1.5rem' }}/>
                         <label htmlFor="whatsapp-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.sistem.whatsappBot ? 'bg-emerald-500' : 'bg-gray-300'}`}></label>
                      </div>
                   </div>
                   <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                      <div className="pr-4">
                         <h4 className="text-sm font-bold text-gray-900 flex items-center mb-1"><Mail className="w-4 h-4 text-blue-500 mr-1.5" /> Notifikasi Email</h4>
                         <p className="text-sm text-gray-500">Email pemberitahuan penagihan invoice & sertifikat elektronik.</p>
                      </div>
                      <div className="relative inline-block w-12 shrink-0 align-middle select-none transition duration-200 ease-in">
                         <input type="checkbox" name="toggle" id="email-toggle" checked={settings.sistem.emailNotif} onChange={(e) => handleChange('sistem', 'emailNotif', e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-emerald-500" style={{ right: settings.sistem.emailNotif ? 0 : '1.5rem' }}/>
                         <label htmlFor="email-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.sistem.emailNotif ? 'bg-emerald-500' : 'bg-gray-300'}`}></label>
                      </div>
                   </div>
                   <div className="flex items-center justify-between pb-2">
                      <div className="pr-4">
                         <h4 className="text-sm font-bold text-gray-900 flex items-center mb-1"><Settings className="w-4 h-4 text-gray-500 mr-1.5" /> Mode Perbaikan (Maintenance)</h4>
                         <p className="text-sm text-gray-500">Tutup portal publik sementara waktu saat sistem dimutakhirkan.</p>
                      </div>
                      <div className="relative inline-block w-12 shrink-0 align-middle select-none transition duration-200 ease-in">
                         <input type="checkbox" name="toggle" id="maint-toggle" checked={settings.sistem.maintenance} onChange={(e) => handleChange('sistem', 'maintenance', e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300" style={{ right: settings.sistem.maintenance ? 0 : '1.5rem' }}/>
                         <label htmlFor="maint-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.sistem.maintenance ? 'bg-emerald-500' : 'bg-gray-300'}`}></label>
                      </div>
                   </div>
                </div>
             </div>
          )}
          {activeTab === 'template' && (
             <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Template Dokumen</h3>
                <p className="text-sm text-gray-500 mb-6">Kelola struktur format cetak PDF otomatis berbasis variabel.</p>
                <div className="space-y-4">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-gray-200 rounded-xl hover:border-emerald-300 transition-colors bg-gray-50">
                      <div className="flex items-center mb-4 sm:mb-0">
                         <div className="bg-white p-2.5 rounded-lg border border-gray-200 mr-4 shadow-sm">
                            <Receipt className="w-6 h-6 text-emerald-600" />
                         </div>
                         <div>
                            <h4 className="text-sm font-bold text-gray-900">Tagihan & Kwitansi (PDF)</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Versi: v2.1 • Diubah: 2 hari yang lalu</p>
                         </div>
                      </div>
                      <button className="text-sm text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto">Edit Tata Letak</button>
                   </div>
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-gray-200 rounded-xl hover:border-emerald-300 transition-colors bg-gray-50">
                      <div className="flex items-center mb-4 sm:mb-0">
                         <div className="bg-white p-2.5 rounded-lg border border-gray-200 mr-4 shadow-sm">
                            <FileSignature className="w-6 h-6 text-emerald-600" />
                         </div>
                         <div>
                            <h4 className="text-sm font-bold text-gray-900">Surat Rekomendasi / LHP</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Versi: v1.0 • Diubah: 1 bulan yang lalu</p>
                         </div>
                      </div>
                      <button className="text-sm text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto">Edit Tata Letak</button>
                   </div>
                </div>
             </div>
          )}
          {activeTab === 'integrasi' && (
             <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Integrasi & API</h3>
                <p className="text-sm text-gray-500 mb-6">Kelola konektor kunci (webhook) dengan sistem pihak ketiga.</p>
                <div className="grid grid-cols-1 gap-6">
                   <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                         <div className="flex items-center">
                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 mr-4"><Network className="w-6 h-6 text-blue-600" /></div>
                            <div>
                               <h4 className="text-base font-bold text-gray-900">Bridging SIHALAL BPJPH</h4>
                               <p className="text-xs text-gray-500">Sinkronisasi Pendaftaran & LHP Nasional</p>
                            </div>
                         </div>
                         <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200 shrink-0">Menunggu Koneksi</span>
                      </div>
                      <div className="space-y-4 pt-2">
                         <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">REST API Endpoint</label>
                            <input type="text" value={settings.integrasi.sihalalEndpoint} onChange={(e) => handleChange('integrasi', 'sihalalEndpoint', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 font-mono text-gray-600" />
                         </div>
                         <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Client Secret Key</label>
                            <input type="password" value={settings.integrasi.sihalalSecret} onChange={(e) => handleChange('integrasi', 'sihalalSecret', e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 font-mono text-gray-600" />
                         </div>
                         <div className="pt-2">
                             <button className="bg-gray-100 border border-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">Uji Koneksi (Ping)</button>
                         </div>
                      </div>
                   </div>
                   
                   <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                         <div className="flex items-center">
                            <div className="p-2.5 bg-green-50 rounded-xl border border-green-100 mr-4"><Phone className="w-6 h-6 text-green-600" /></div>
                            <div>
                               <h4 className="text-base font-bold text-gray-900">WhatsApp Engine</h4>
                               <p className="text-xs text-gray-500">Server Pengirim Pesan Otomatis</p>
                            </div>
                         </div>
                         <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 shrink-0 flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></div>Terhubung Aktif</span>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
                         <p className="text-sm font-medium text-gray-700">Modul: <span className="font-semibold text-gray-900">Baileys Multidevice v6</span></p>
                         <p className="text-sm font-medium text-gray-700 mt-1">Sesi: <span className="font-bold text-emerald-600">+62 858-0249-4252</span></p>
                      </div>
                      <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 shadow-sm transition-colors">Putuskan & Scan Ulang QR</button>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function StatusBadge({ status }: any) {
  let bg = 'bg-gray-100 text-gray-800';
  let dot = 'bg-gray-500';
  
  if (status === 'Menunggu Verifikasi') { bg = 'bg-yellow-100 text-yellow-800'; dot = 'bg-yellow-500'; }
  else if (status === 'Menunggu Pembayaran') { bg = 'bg-orange-100 text-orange-800'; dot = 'bg-orange-500'; }
  else if (status === 'Proses Audit') { bg = 'bg-blue-100 text-blue-800'; dot = 'bg-blue-500'; }
  else if (status === 'Selesai' || status === 'LHP Terbit') { bg = 'bg-emerald-100 text-emerald-800'; dot = 'bg-emerald-500'; }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bg}`}>
      <span className={`w-1.5 h-1.5 ${dot} rounded-full mr-1.5`}></span> {status}
    </span>
  );
}

function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Left Gold Floral */}
      <path d="M 90 140 Q 60 160 30 120 Q 50 145 90 145" fill="#B89B48" />
      {/* Right Gold Floral */}
      <path d="M 110 140 Q 140 160 170 120 Q 150 145 110 145" fill="#B89B48" />
      
      {/* Left Green Floral */}
      <path d="M 95 135 Q 40 140 20 90 Q 45 125 95 128" fill="#245A36" />
      {/* Right Green Floral */}
      <path d="M 105 135 Q 160 140 180 90 Q 155 125 105 128" fill="#245A36" />
      
      {/* Additional Green Leaves */}
      <path d="M 90 150 Q 70 165 40 160 Q 65 170 95 155" fill="#1A4A28" />
      <path d="M 110 150 Q 130 165 160 160 Q 135 170 105 155" fill="#1A4A28" />

      {/* Purple Abstract Bird/Calligraphy Top */}
      <g transform="translate(0, -15)">
        <path d="M 100 150 C 70 150 60 120 70 100 L 80 110 C 70 125 80 140 100 140 C 120 140 130 125 120 110 L 130 100 C 140 120 130 150 100 150 Z" fill="#9113B8" />
        {/* Main central curves/ribbons */}
        <path d="M 75 95 Q 100 120 125 145 L 135 135 Q 110 105 70 70 Z" fill="#9113B8" />
        <path d="M 65 80 Q 90 105 115 130 L 125 120 Q 100 90 60 55 Z" fill="#9113B8" />
        {/* Right swoosh */}
        <path d="M 125 50 Q 115 80 110 90 L 120 100 Q 135 70 140 40 Z" fill="#9113B8" />
      </g>

      {/* Text Portion */}
      <text x="100" y="200" textAnchor="middle" fontFamily="Georgia, serif" fontSize="46" fontWeight="bold" fill="#000">LPH</text>
      <text x="100" y="225" textAnchor="middle" fontFamily="Georgia, serif" fontSize="18" fontWeight="bold" fill="#000" letterSpacing="2">AL GHAZALI</text>
    </svg>
  );
}
