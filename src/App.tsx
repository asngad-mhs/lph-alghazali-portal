import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Leaf, Home, FileText, LogOut, PlusCircle, Settings, CheckCircle, Clock, Search, Briefcase, FileSignature, UploadCloud, ArrowLeft, ArrowRight, ShieldCheck, Zap, MonitorSmartphone, UserCheck, Newspaper, Edit, Trash2, X, Image as ImageIcon, Route, Coins, ChevronDown, ChevronRight, Calculator, Receipt, CalendarDays, Activity, Video, Link, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin, History, Target, Award, Network, Users, BookOpen, Handshake, Menu } from 'lucide-react';

// ==========================================
// 1. FIREBASE INITIALIZATION (CLOUD SETUP)
// ==========================================
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "mock-key",
  authDomain: "mock.firebaseapp.com",
  projectId: "mock-project",
  storageBucket: "mock.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// @ts-ignore
const appId = typeof __app_id !== 'undefined' ? __app_id : 'lph-alghazali-app';

export default function LPHApp() {
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState('landing'); // landing, login, pu-dashboard, pu-pengajuan, admin-dashboard, admin-berita
  const [userRole, setUserRole] = useState('pu'); // 'pu' atau 'admin'
  const [pengajuanList, setPengajuanList] = useState<any[]>([]);
  const [beritaList, setBeritaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // 2. AUTHENTICATION & DATA FETCHING
  // ==========================================
  useEffect(() => {
    const initAuth = async () => {
      try {
        // @ts-ignore
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          // @ts-ignore
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          // Use mock login for preview
          // await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();

    // Mock an initial user to see dashboard logic
    setUser({ uid: 'mock-user-123' });
    setIsLoading(false);

    /* Real Auth Listener (disabled for preview if no actual firebase)
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribeAuth();
    */
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

    /* Real Database Fetcher
    // Fetch Pengajuan
    const pengajuanRef = collection(db, 'artifacts', appId, 'public', 'data', 'pengajuan_halal');
    const unsubscribeData = onSnapshot(pengajuanRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setPengajuanList(data);
    });

    // Fetch Berita & Artikel
    const beritaRef = collection(db, 'artifacts', appId, 'public', 'data', 'berita');
    const unsubscribeBerita = onSnapshot(beritaRef, (snapshot) => {
      const bData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      bData.sort((a, b) => b.createdAt - a.createdAt);
      setBeritaList(bData);
    });

    return () => {
        unsubscribeData();
        unsubscribeBerita();
    };
    */
  }, [user]);

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
        jenisPengajuan: 'Baru',
        status: 'Menunggu Verifikasi',
        createdAt: Date.now()
      };
      
      // Mock Save
      setPengajuanList([newPengajuan, ...pengajuanList]);
      
      /* Real Save
      const pengajuanRef = collection(db, 'artifacts', appId, 'public', 'data', 'pengajuan_halal');
      await addDoc(pengajuanRef, newPengajuan);
      */
      setCurrentView('pu-dashboard');
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Gagal menyimpan ke cloud.");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!user) return;
    try {
      setPengajuanList(pengajuanList.map(p => p.id === id ? { ...p, status: newStatus } : p));
      /* Real Update
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'pengajuan_halal', id);
      await updateDoc(docRef, { status: newStatus });
      */
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
      /* Real Add
      const beritaRef = collection(db, 'artifacts', appId, 'public', 'data', 'berita');
      await addDoc(beritaRef, { ...formData, createdAt: Date.now() });
      */
    } catch (error) {
      console.error("Error adding berita: ", error);
      alert("Gagal menyimpan berita ke cloud.");
    }
  };

  const handleUpdateBerita = async (id: string, formData: any) => {
    if (!user) return;
    try {
      setBeritaList(beritaList.map(b => b.id === id ? { ...b, ...formData, updatedAt: Date.now() } : b));
      /* Real Update
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'berita', id);
      await updateDoc(docRef, { ...formData, updatedAt: Date.now() });
      */
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
          /* Real Delete
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'berita', id);
          await deleteDoc(docRef);
          */
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
      {currentView === 'login-admin' && <AuthView navigateTo={navigateTo} setRole={setUserRole} roleType="admin" />}
      
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

      {currentView === 'admin-dashboard' && (
        <DashboardLayout role="admin" navigateTo={navigateTo} logout={handleLogout} currentView={currentView}>
          <AdminDashboard data={pengajuanList} updateStatus={handleUpdateStatus} />
        </DashboardLayout>
      )}

      {currentView === 'admin-berita' && (
        <DashboardLayout role="admin" navigateTo={navigateTo} logout={handleLogout} currentView={currentView}>
          <AdminBerita data={beritaList} addData={handleAddBerita} updateData={handleUpdateBerita} deleteData={handleDeleteBerita} />
        </DashboardLayout>
      )}
    </div>
  );
}

// ==========================================
// VIEW COMPONENTS
// ==========================================

function LandingView({ navigateTo, beritaList }: any) {
  const [formData, setFormData] = useState({
    provinsi: '',
    kabKota: '',
    jenisLayanan: '',
    jenisProduk: '',
    skalaUsaha: '',
    jumlahProduk: 0,
    jumlahPabrik: 0,
    tiketPesawat: 0
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <div className="flex flex-col min-h-screen scroll-smooth">
      {/* Navbar */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center">
              <Logo className="h-10 w-10 mr-2" />
              <span className="font-bold text-2xl tracking-tight text-gray-900">LPH Al-Ghazali</span>
            </div>
            <div className="hidden lg:flex space-x-8 items-center">
              <a href="#beranda" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors flex items-center">
                <Home className="w-4 h-4 mr-1" /> Beranda
              </a>
              <div className="relative group">
                <button className="text-gray-600 hover:text-emerald-600 font-medium transition-colors flex items-center py-5">
                  <UserCheck className="w-4 h-4 mr-1" /> Profil <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-[80%] left-0 w-72 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <a href="/dokumen/sejarah_lph_al_ghazali.pdf" target="_blank" rel="noopener noreferrer" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <History className="w-4 h-4 mr-2" /> Sejarah dan Latar Belakang
                  </a>
                  <a href="#profil" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Target className="w-4 h-4 mr-2" /> Visi Misi
                  </a>
                  <a href="#profil" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Award className="w-4 h-4 mr-2" /> Kebijakan Mutu & Sasaran Mutu
                  </a>
                  <a href="#profil" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Network className="w-4 h-4 mr-2" /> Struktur Organisasi
                  </a>
                  <a href="#profil" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Users className="w-4 h-4 mr-2" /> Auditor Halal
                  </a>
                  <a href="#profil" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <BookOpen className="w-4 h-4 mr-2" /> SDM Syariah
                  </a>
                  <a href="#profil" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center">
                    <Handshake className="w-4 h-4 mr-2" /> Kerjasama
                  </a>
                </div>
              </div>
              <div className="relative group">
                <button className="text-gray-600 hover:text-emerald-600 font-medium transition-colors flex items-center py-5">
                  <Briefcase className="w-4 h-4 mr-1" /> Layanan <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-[80%] left-0 w-80 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <a href="#pendaftaran" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <FileSignature className="w-4 h-4 mr-2" /> Pendaftaran Sertifikasi Halal
                  </a>
                  <a href="#ruang-lingkup" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Search className="w-4 h-4 mr-2" /> Ruang Lingkup dan Layanan Pemeriksaan Halal
                  </a>
                  <a href="#pencarian" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <CheckCircle className="w-4 h-4 mr-2" /> Pencarian Sertifikasi Halal
                  </a>
                  <a href="#daftar-audit" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center">
                    <FileText className="w-4 h-4 mr-2" /> Daftar Audit
                  </a>
                </div>
              </div>
              <div className="relative group">
                <button className="text-gray-600 hover:text-emerald-600 font-medium transition-colors flex items-center py-5">
                  <FileSignature className="w-4 h-4 mr-1" /> Proses <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-[80%] left-0 w-52 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <a href="#alur-sertifikasi" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Route className="w-4 h-4 mr-2" /> Alur Sertifikasi
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
              <div className="relative group">
                <button className="text-gray-600 hover:text-emerald-600 font-medium transition-colors flex items-center py-5">
                  <Newspaper className="w-4 h-4 mr-1" /> Berita <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute top-[80%] left-0 w-48 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <a href="#berita" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Newspaper className="w-4 h-4 mr-2" /> Berita Utama
                  </a>
                  <a href="#kegiatan" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">
                    <Activity className="w-4 h-4 mr-2" /> Kegiatan
                  </a>
                  <a href="#agenda" className="px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center">
                    <CalendarDays className="w-4 h-4 mr-2" /> Agenda
                  </a>
                </div>
              </div>
              <a href="#faq" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors flex items-center">
                <Search className="w-4 h-4 mr-1" /> FAQ
              </a>
              <a href="https://wa.me/6285802494252" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors flex items-center">
                <Phone className="w-4 h-4 mr-1" /> Kontak
              </a>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button onClick={() => navigateTo('login')} className="bg-emerald-600 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base hover:bg-emerald-700 shadow-md">Masuk</button>
              <button onClick={() => navigateTo('login-admin')} className="hidden sm:flex opacity-0 hover:opacity-100 focus:opacity-100 text-emerald-600 transition-opacity items-center" title="Admin">
                <ShieldCheck className="w-5 h-5 mr-1" />
                <span className="font-medium text-sm">Admin</span>
              </button>
              <button className="flex items-center bg-gray-50 p-1.5 sm:p-2 rounded-lg border border-gray-100 transition-colors shadow-sm hover:shadow" title="Indonesia (ID)">
                <div className="w-6 h-4 sm:w-7 sm:h-5 rounded-sm overflow-hidden border border-gray-200 flex flex-col shadow-inner">
                  <div className="w-full h-1/2 bg-[#FF0000]"></div>
                  <div className="w-full h-1/2 bg-white"></div>
                </div>
              </button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-gray-600 hover:text-emerald-600 ml-2">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-4 space-y-1 shadow-lg max-h-[80vh] overflow-y-auto">
            <a href="#beranda" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-md">
              <div className="flex items-center"><Home className="w-4 h-4 mr-2" /> Beranda</div>
            </a>
            
            <div className="px-3 py-2">
              <div className="text-sm font-bold text-emerald-600 mb-1 flex items-center"><UserCheck className="w-4 h-4 mr-2" /> Profil</div>
              <div className="ml-6 space-y-1 border-l-2 border-emerald-100 pl-3">
                <a href="/dokumen/sejarah_lph_al_ghazali.pdf" target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Sejarah dan Latar Belakang</a>
                <a href="#profil" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Visi Misi</a>
                <a href="#profil" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Kebijakan Mutu & Sasaran Mutu</a>
                <a href="#profil" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Struktur Organisasi</a>
                <a href="#profil" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Auditor Halal</a>
                <a href="#profil" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">SDM Syariah</a>
                <a href="#profil" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Kerjasama</a>
              </div>
            </div>

            <div className="px-3 py-2">
              <div className="text-sm font-bold text-emerald-600 mb-1 flex items-center"><Briefcase className="w-4 h-4 mr-2" /> Layanan</div>
              <div className="ml-6 space-y-1 border-l-2 border-emerald-100 pl-3">
                <a href="#pendaftaran" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Pendaftaran Sertifikasi Halal</a>
                <a href="#ruang-lingkup" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Ruang Lingkup dan Layanan Pemeriksaan Halal</a>
                <a href="#pencarian" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Pencarian Sertifikasi Halal</a>
                <a href="#daftar-audit" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Daftar Audit</a>
              </div>
            </div>

            <div className="px-3 py-2">
              <div className="text-sm font-bold text-emerald-600 mb-1 flex items-center"><FileSignature className="w-4 h-4 mr-2" /> Proses</div>
              <div className="ml-6 space-y-1 border-l-2 border-emerald-100 pl-3">
                <a href="#alur-sertifikasi" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Alur Sertifikasi</a>
                <a href="#tarif-layanan" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Tarif Layanan</a>
                <a href="#form-perhitungan-biaya" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Form Perhitungan Biaya</a>
                <a href="#detail-hasil-perhitungan" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Detail Hasil Perhitungan</a>
              </div>
            </div>

            <div className="px-3 py-2">
              <div className="text-sm font-bold text-emerald-600 mb-1 flex items-center"><Newspaper className="w-4 h-4 mr-2" /> Berita</div>
              <div className="ml-6 space-y-1 border-l-2 border-emerald-100 pl-3">
                <a href="#berita" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Berita Utama</a>
                <a href="#kegiatan" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Kegiatan</a>
                <a href="#agenda" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Agenda</a>
              </div>
            </div>

            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-md">
              <div className="flex items-center"><Search className="w-4 h-4 mr-2" /> FAQ</div>
            </a>
            
            <a href="https://wa.me/6285802494252" target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-md">
              <div className="flex items-center"><Phone className="w-4 h-4 mr-2" /> Kontak</div>
            </a>
            
            <div className="px-3 pt-4 pb-2 border-t border-gray-100 mt-2">
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo('login-admin');
                }} 
                className="w-full flex justify-center items-center px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg text-sm font-medium border border-emerald-100"
              >
                <ShieldCheck className="w-4 h-4 mr-2" /> Login Admin
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="beranda" className="pt-32 pb-20 bg-emerald-600 text-white flex-1 flex items-center relative overflow-hidden">
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                            <h4 className="font-bold text-emerald-700 text-2xl mb-1">100+</h4>
                            <p className="text-gray-500 text-sm">Auditor Berpengalaman</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                            <h4 className="font-bold text-emerald-700 text-2xl mb-1">1000+</h4>
                            <p className="text-gray-500 text-sm">Sertifikat Terbit</p>
                        </div>
                    </div>
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
                    Lembaga Pemeriksa Halal (LPH) Edukasi Halal Indonesia saat ini tengah menjalani proses Akreditasi Pratama yang diajukan kepada Badan Penyelenggara Jaminan Produk Halal (BPJPH) Republik Indonesia. Setelah memperoleh Sertifikat Akreditasi Pratama, LPH Al ghazali Halal Indonesia akan memiliki wewenang untuk melaksanakan pemeriksaan kehalalan produk untuk 3 (dua) ruang lingkup, yaitu:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center justify-center text-emerald-700 font-medium shadow-sm">
                       <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" /> 1. Makanan
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center justify-center text-emerald-700 font-medium shadow-sm">
                       <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" /> 2. Minuman
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center justify-center text-emerald-700 font-medium shadow-sm">
                       <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" /> 3. Jasa Penyembelihan
                    </div>
                </div>
                <p className="text-justify">
                    LPH Al ghazali Halal Indonesia menyediakan layanan pemeriksaan halal sebagai bagian dari proses pengajuan Sertifikasi Halal, yang ditujukan khusus untuk pelaku usaha mikro dan kecil di wilayah Provinsi Cilacap.
                </p>
            </div>
        </div>
      </section>

      {/* Proses Sertifikasi Section */}
      <section id="alur-sertifikasi" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Proses Sertifikasi Halal</h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg">Alur pendaftaran dan pemeriksaan halal melalui LPH Al-Ghazali yang mudah dan transparan.</p>
            </div>
            
            <div className="relative">
                <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-emerald-200"></div>
                <div className="space-y-12">
                    <div className="relative flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 md:pr-12 md:text-right text-center mb-4 md:mb-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">1. Pendaftaran di SIHALAL</h3>
                            <p className="text-gray-600">Pelaku usaha mendaftar melalui sistem SIHALAL BPJPH dan memilih LPH Al-Ghazali sebagai Lembaga Pemeriksa Halal.</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl relative z-10 mx-auto md:mx-0 shadow-lg border-4 border-gray-50">1</div>
                        <div className="md:w-1/2 md:pl-12 hidden md:block"></div>
                    </div>
                    <div className="relative flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 md:pr-12 hidden md:block"></div>
                        <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl relative z-10 mx-auto md:mx-0 mb-4 md:mb-0 shadow-lg border-4 border-gray-50">2</div>
                        <div className="md:w-1/2 md:pl-12 text-center md:text-left">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">2. Verifikasi Dokumen & Biaya</h3>
                            <p className="text-gray-600">LPH melakukan perhitungan biaya. Setelah tagihan dibayar oleh pelaku usaha, LPH memulai proses verifikasi dokumen.</p>
                        </div>
                    </div>
                    <div className="relative flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 md:pr-12 md:text-right text-center mb-4 md:mb-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">3. Audit / Pemeriksaan Lapangan</h3>
                            <p className="text-gray-600">Auditor Halal melakukan pemeriksaan langsung ke fasilitas produksi untuk memastikan kehalalan bahan dan proses produksi.</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl relative z-10 mx-auto md:mx-0 shadow-lg border-4 border-gray-50">3</div>
                        <div className="md:w-1/2 md:pl-12 hidden md:block"></div>
                    </div>
                    <div className="relative flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 md:pr-12 hidden md:block"></div>
                        <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl relative z-10 mx-auto md:mx-0 mb-4 md:mb-0 shadow-lg border-4 border-gray-50">4</div>
                        <div className="md:w-1/2 md:pl-12 text-center md:text-left">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">4. Sidang Fatwa & Penerbitan</h3>
                            <p className="text-gray-600">Hasil audit diserahkan ke Komisi Fatwa MUI. Setelah fatwa keluar, BPJPH menerbitkan Sertifikat Halal resmi.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Tarif Layanan Section */}
      <section id="tarif-layanan" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tarif Layanan Sertifikasi Halal</h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg">Biaya layanan pemeriksaan halal LPH Al-Ghazali transparan dan sesuai dengan regulasi BPJPH.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-100 shadow-sm text-center">
                    <h3 className="font-bold text-gray-900 text-xl mb-2">Usaha Mikro & Kecil</h3>
                    <p className="text-gray-600 text-sm mb-6">Reguler (Self Declare tidak termasuk)</p>
                    <div className="text-emerald-600 font-extrabold text-3xl mb-6">Mulai Rp 300rb</div>
                    <ul className="text-left text-sm text-gray-600 space-y-3 mb-8">
                        <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Pemeriksaan dokumen dasar</li>
                        <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Audit lapangan standar (1 lokasi)</li>
                    </ul>
                </div>
                <div className="bg-white rounded-2xl p-8 border-2 border-emerald-500 shadow-xl text-center relative transform md:-translate-y-4">
                    <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full absolute -top-3 left-1/2 transform -translate-x-1/2">Paling Diminati</div>
                    <h3 className="font-bold text-gray-900 text-xl mb-2">Usaha Menengah</h3>
                    <p className="text-gray-600 text-sm mb-6">Industri Menengah Makanan/Minuman</p>
                    <div className="text-emerald-600 font-extrabold text-3xl mb-6">Mulai Rp 3-5 Jt</div>
                    <ul className="text-left text-sm text-gray-600 space-y-3 mb-8">
                        <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Konsultasi awal</li>
                        <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Audit lapangan komprehensif (s/d 3 lokasi)</li>
                        <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Pendampingan pengolahan berkas laporan</li>
                    </ul>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-100 shadow-sm text-center">
                    <h3 className="font-bold text-gray-900 text-xl mb-2">Usaha Besar</h3>
                    <p className="text-gray-600 text-sm mb-6">Pabrikasi / Franchise Besar</p>
                    <a href="https://wa.me/6285802494252" target="_blank" rel="noopener noreferrer" className="inline-block bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg mb-6 hover:bg-emerald-700 transition-colors">Hubungi Kami</a>
                    <ul className="text-left text-sm text-gray-600 space-y-3 mb-8">
                        <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Audit tersendiri oleh tim khusus</li>
                        <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Multi-lokasi pabrik/gerai</li>
                        <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Layanan prioritas plotting auditor</li>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi Fasilitas Produksi</label>
                                <select name="provinsi" value={formData.provinsi} onChange={handleFormChange} className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700">
                                    <option value="">Pilih Provinsi</option>
                                    <option value="Jawa Tengah">Jawa Tengah</option>
                                    <option value="Jawa Barat">Jawa Barat</option>
                                    <option value="Jawa Timur">Jawa Timur</option>
                                    <option value="DKI Jakarta">DKI Jakarta</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten / Kota Fasilitas Produksi</label>
                                <select name="kabKota" value={formData.kabKota} onChange={handleFormChange} className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700">
                                    <option value="">Pilih Kabupaten / Kota</option>
                                    <option value="Semarang">Semarang</option>
                                    <option value="Cilacap">Cilacap</option>
                                    <option value="Banyumas">Banyumas</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Layanan</label>
                                <select name="jenisLayanan" value={formData.jenisLayanan} onChange={handleFormChange} className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700">
                                    <option value="">Pilih Jenis Layanan</option>
                                    <option value="Reguler">Reguler</option>
                                    <option value="Self Declare">Self Declare</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Produk</label>
                                <select name="jenisProduk" value={formData.jenisProduk} onChange={handleFormChange} className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700">
                                    <option value="">Pilih Jenis Produk</option>
                                    <option value="Makanan">Makanan</option>
                                    <option value="Minuman">Minuman</option>
                                    <option value="Obat/Kosmetik">Obat/Kosmetik</option>
                                    <option value="Jasa Penyembelihan">Jasa Penyembelihan</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Skala Usaha</label>
                                <select name="skalaUsaha" value={formData.skalaUsaha} onChange={handleFormChange} className="w-full border-gray-300 rounded-lg border p-3 bg-white focus:ring-emerald-500 focus:border-emerald-500 text-gray-700">
                                    <option value="">Pilih...</option>
                                    <option value="Mikro">Mikro</option>
                                    <option value="Kecil">Kecil</option>
                                    <option value="Menengah">Menengah</option>
                                    <option value="Besar">Besar</option>
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
                    <p className="text-gray-600">Proses sertifikasi bervariasi bergantung pada jenis produk dan kelengkapan dokumen. Namun, LPH Al-Ghazali berkomitmen menetapkan plotting auditor maksimal 2x24 jam setelah pembayaran invoice.</p>
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

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 pt-16 pb-8 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                <div>
                    <h4 className="text-white text-lg font-bold mb-4 flex items-center">
                        <Leaf className="w-6 h-6 mr-2 text-emerald-500" />
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
                        <li><a href="#kalkulator" className="hover:text-emerald-400 transition-colors flex items-center"><ChevronRight className="w-4 h-4 mr-1 text-emerald-600" /> Kalkulator Biaya</a></li>
                        <li><a href="#prosedur" className="hover:text-emerald-400 transition-colors flex items-center"><ChevronRight className="w-4 h-4 mr-1 text-emerald-600" /> Prosedur</a></li>
                        <li><a href="#berita" className="hover:text-emerald-400 transition-colors flex items-center"><ChevronRight className="w-4 h-4 mr-1 text-emerald-600" /> Berita Utama</a></li>
                        <li><a href="#faq" className="hover:text-emerald-400 transition-colors flex items-center"><ChevronRight className="w-4 h-4 mr-1 text-emerald-600" /> FAQ</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white text-lg font-bold mb-4">Layanan</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center"><ShieldCheck className="w-4 h-4 mr-2" /> Sertifikasi Halal Reguler</a></li>
                        <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center"><UserCheck className="w-4 h-4 mr-2" /> Self Declare</a></li>
                        <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center"><FileSignature className="w-4 h-4 mr-2" /> Edukasi & Pelatihan</a></li>
                        <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center"><Briefcase className="w-4 h-4 mr-2" /> Konsultasi</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white text-lg font-bold mb-4">Hubungi Kami</h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li className="flex items-start group">
                           <span className="mt-1 mr-3 text-emerald-500 group-hover:text-emerald-400 transition-colors"><MapPin className="w-5 h-5" /></span>
                           <span className="group-hover:text-gray-300 transition-colors">Jl. Kemerdekaan Barat No.12, Kesugihan, Cilacap, Jawa Tengah 53274</span>
                        </li>
                        <li className="flex items-center group cursor-pointer">
                           <span className="mr-3 text-emerald-500 group-hover:text-emerald-400 transition-colors"><Phone className="w-5 h-5" /></span>
                           <a href="https://wa.me/6285802494252" target="_blank" rel="noopener noreferrer" className="group-hover:text-gray-300 transition-colors">0858-0249-4252 (WhatsApp)</a>
                        </li>
                        <li className="flex items-center group cursor-pointer">
                           <span className="mr-3 text-emerald-500 group-hover:text-emerald-400 transition-colors"><Mail className="w-5 h-5" /></span>
                           <span className="group-hover:text-gray-300 transition-colors">lph@alghazali.com</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-4">
                <p className="order-3 md:order-1">&copy; {new Date().getFullYear()} LPH Al-Ghazali. Hak Cipta Dilindungi.</p>
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
    </div>
  );
}

function AuthView({ navigateTo, setRole, roleType = 'pu' }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const selectedRole = roleType;

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth delay, logic handled by Firebase Anonymous Auth behind the scenes
    setTimeout(() => {
      setLoading(false);
      setRole(selectedRole);
      navigateTo(selectedRole === 'pu' ? 'pu-dashboard' : 'admin-dashboard');
    }, 1000);
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

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Logo className="h-12 w-12 mr-2" />
            <h1 className="text-2xl font-bold text-emerald-600">LPH Al-Ghazali</h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">{isLogin ? 'Selamat Datang' : 'Buat Akun'}</h2>
          <p className="text-gray-500 mb-8">Silakan masuk {roleType === 'admin' ? 'sebagai Admin LPH' : 'untuk mengakses sistem cloud'}.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && roleType === 'pu' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan</label>
                <input type="text" required className="block w-full border-gray-300 rounded-lg border p-3 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500" placeholder="PT. Nama Usaha" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{roleType === 'admin' ? 'Email Admin' : 'Email / ID SIHALAL'}</label>
              <input type="text" required className="block w-full border-gray-300 rounded-lg border p-3 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500" placeholder="nama@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi</label>
              <input type="password" required className="block w-full border-gray-300 rounded-lg border p-3 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500" placeholder="••••••••" />
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
        </div>
      </div>
    </div>
  );
}

function DashboardLayout({ children, role, navigateTo, logout, currentView }: any) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      <aside className={`fixed md:static inset-y-0 left-0 w-64 ${role === 'admin' ? 'bg-slate-900 text-slate-300' : 'bg-white text-gray-600 shadow-md'} flex flex-col z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className={`h-16 flex items-center justify-between px-6 border-b shrink-0 ${role === 'admin' ? 'border-slate-800 bg-slate-950 text-white' : 'border-gray-200 text-emerald-600'}`}>
          <div className="flex items-center">
            <Logo className={`h-8 w-8 mr-2 ${role === 'admin' ? 'bg-white p-0.5 rounded' : ''}`} />
            <span className="font-bold text-xl">LPH {role === 'admin' ? 'Admin' : 'Portal'}</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className={`p-4 text-center border-b shrink-0 ${role === 'admin' ? 'border-slate-800' : 'border-gray-200'}`}>
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl font-bold mb-2 ${role === 'admin' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                {role === 'admin' ? 'AD' : 'PU'}
            </div>
            <p className={`font-semibold ${role === 'admin' ? 'text-white' : 'text-gray-800'}`}>{role === 'admin' ? 'Admin Pusat' : 'Pelaku Usaha'}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button onClick={() => { navigateTo(role === 'admin' ? 'admin-dashboard' : 'pu-dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${currentView.includes('dashboard') ? (role === 'admin' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 font-medium') : (role === 'admin' ? 'hover:bg-slate-800' : 'hover:bg-emerald-50')}`}>
            <Home className="w-5 h-5 mr-3" /> Dashboard
          </button>
          
          {role === 'pu' && (
            <button onClick={() => { navigateTo('pu-pengajuan'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${currentView === 'pu-pengajuan' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'hover:bg-emerald-50 hover:text-emerald-600'}`}>
              <PlusCircle className="w-5 h-5 mr-3" /> Buat Pengajuan
            </button>
          )}
          
          {role === 'admin' && (
            <>
              <button onClick={() => { navigateTo('admin-berita'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${currentView === 'admin-berita' ? 'bg-emerald-600 text-white font-medium' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Newspaper className="w-5 h-5 mr-3" /> Publikasi & Berita
              </button>
              <button className="w-full flex items-center px-4 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                <Briefcase className="w-5 h-5 mr-3" /> Data Auditor
              </button>
            </>
          )}

          <button className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${role === 'admin' ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-emerald-50 hover:text-emerald-600'}`}>
            <Settings className="w-5 h-5 mr-3" /> Pengaturan
          </button>
        </nav>
        
        <div className={`p-4 border-t shrink-0 ${role === 'admin' ? 'border-slate-800' : 'border-gray-200'}`}>
          <button onClick={logout} className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${role === 'admin' ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}>
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
              {role === 'admin' ? 'Sistem Manajemen LPH' : 'Portal Pelaku Usaha'}
            </h2>
            <h2 className="text-lg font-bold text-gray-800 sm:hidden">
              {role === 'admin' ? 'Admin' : 'Portal PU'}
            </h2>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:flex items-center text-xs sm:text-sm font-medium text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-1 rounded-full border border-emerald-100">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-emerald-500" /> Cloud Sync Active
            </div>
            <div className="flex items-center space-x-2 pl-2 sm:pl-4 sm:border-l border-gray-200 cursor-pointer hover:bg-gray-50 p-1.5 sm:p-2 rounded-lg transition-colors">
               <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  {role === 'admin' ? 'A' : 'P'}
               </div>
               <span className="text-sm font-medium text-gray-700 hidden sm:block">{role === 'admin' ? 'Admin' : 'Profil PU'}</span>
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
  return (
    <div className="max-w-6xl mx-auto">
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PUFormPengajuan({ submit, navigateTo }: any) {
  const [formData, setFormData] = useState({ companyName: '', productName: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: any) => {
    e.preventDefault();
    setLoading(true);
    // Simulate Cloud Upload Delay
    setTimeout(() => {
      submit(formData);
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigateTo('pu-dashboard')} className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-emerald-600">
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-emerald-600 px-6 py-4 text-white">
          <h3 className="font-bold text-lg">Formulir Pengajuan Terhubung Cloud</h3>
          <p className="text-emerald-100 text-sm">Dokumen akan dienkripsi dan disimpan di Firestore.</p>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 sm:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan / Pabrik <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="PT. / CV. / Kedai..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk / Grup Produk <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Kripik Pisang Aneka Rasa" />
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors bg-gray-50">
             <UploadCloud className="w-10 h-10 mx-auto text-gray-400 mb-2" />
             <p className="text-sm font-medium text-gray-900">Unggah Matriks Bahan (PDF)</p>
             <p className="text-xs text-gray-500 mt-1">Disimulasikan sebagai metadata dokumen di Cloud</p>
          </div>

          <div className="pt-6 border-t border-gray-200 flex justify-end">
            <button type="submit" disabled={loading} className="px-6 py-3 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-75 flex items-center">
              {loading ? 'Mengunggah ke Cloud...' : 'Simpan & Kirim Pengajuan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// ADMIN VIEWS
// ==========================================

function AdminDashboard({ data, updateStatus }: any) {
  return (
    <div className="max-w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Panel Sinkronisasi Data</h2>
        <p className="text-gray-500 text-sm mt-1">Perubahan status di sini akan langsung terlihat oleh Pelaku Usaha via Cloud.</p>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status Cloud</th>
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
                    <select 
                      value={item.status}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-1 bg-gray-50"
                    >
                      <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                      <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                      <option value="Proses Audit">Proses Audit</option>
                      <option value="Selesai">Selesai (Terbit LHP)</option>
                    </select>
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
                       <span className="text-xs text-gray-400 mt-1">Mendukung: JPG, PNG, PDF, MP4 (Maks 10MB)</span>
                       <input type="file" accept=".jpg,.jpeg,.png,.pdf,.mp4" onChange={handleFileChange} className="hidden" />
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
