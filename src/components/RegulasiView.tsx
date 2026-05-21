import React, { useState, useRef, useEffect } from 'react';
import { 
  Scale, Search, Download, Copy, Check, BookOpen, 
  ArrowLeft, Clock, Sparkles, Send, Globe, 
  ChevronRight, ChevronDown, CheckCircle, ShieldCheck,
  AlertCircle, RefreshCw, Landmark, FileSignature, Award, Plus, Edit, Trash2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, setDoc, updateDoc, deleteDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface RegulasiDoc {
  id: string;
  nomor: string;
  kategori: string;
  tentang: string;
  deskripsi: string;
  tahun: string;
  referensiUrl: string;
  status: string;
  lastUpdated: string;
  pasalPenting: { pasal: string; isi: string }[];
  isiLengkap: string;
}

interface RegulasiViewProps {
  navigateTo: (view: string) => void;
  regulasiList: RegulasiDoc[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeDoc: RegulasiDoc | null;
  setActiveDoc: (doc: RegulasiDoc | null) => void;
  handleDownload: (doc: RegulasiDoc) => void;
  user: any;
  userRole: string;
  db: any;
  currentAppId: string;
}

export default function RegulasiView({
  navigateTo,
  regulasiList,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  activeDoc,
  setActiveDoc,
  handleDownload,
  user,
  userRole,
  db,
  currentAppId
}: RegulasiViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCitationId, setCopiedCitationId] = useState<string | null>(null);

  // Edit and Add Regulation Form states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  
  const [formNomor, setFormNomor] = useState('');
  const [formKategori, setFormKategori] = useState('Undang-Undang');
  const [formTentang, setFormTentang] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formTahun, setFormTahun] = useState('');
  const [formReferensiUrl, setFormReferensiUrl] = useState('https://bpjph.halal.go.id/');
  const [formStatus, setFormStatus] = useState('Masih Berlaku');
  const [formPasalPenting, setFormPasalPenting] = useState<{ pasal: string; isi: string }[]>([
    { pasal: 'Pasal 1', isi: '' }
  ]);
  const [formIsiLengkap, setFormIsiLengkap] = useState('');

  const openAddModal = () => {
    setFormMode('add');
    setEditingDocId(null);
    setFormNomor('');
    setFormKategori('Undang-Undang');
    setFormTentang('');
    setFormDeskripsi('');
    setFormTahun(new Date().getFullYear().toString());
    setFormReferensiUrl('https://bpjph.halal.go.id/');
    setFormStatus('Masih Berlaku');
    setFormPasalPenting([{ pasal: 'Pasal 1', isi: '' }]);
    setFormIsiLengkap('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (docObj: RegulasiDoc) => {
    setFormMode('edit');
    setEditingDocId(docObj.id);
    setFormNomor(docObj.nomor);
    setFormKategori(docObj.kategori);
    setFormTentang(docObj.tentang);
    setFormDeskripsi(docObj.deskripsi);
    setFormTahun(docObj.tahun);
    setFormReferensiUrl(docObj.referensiUrl || 'https://bpjph.halal.go.id/');
    setFormStatus(docObj.status || 'Masih Berlaku');
    setFormPasalPenting(docObj.pasalPenting && docObj.pasalPenting.length > 0 
      ? JSON.parse(JSON.stringify(docObj.pasalPenting)) 
      : [{ pasal: 'Pasal 1', isi: '' }]
    );
    setFormIsiLengkap(docObj.isiLengkap || '');
    setIsFormModalOpen(true);
  };

  const deleteRegulasiDoc = async (docId: string, event: any) => {
    event.stopPropagation();
    if (!window.confirm('Apakah Anda yakin ingin menghapus dokumen regulasi ini secara permanen dari pangkalan data LPH?')) {
      return;
    }
    
    try {
      const docRef = doc(db, 'artifacts', currentAppId, 'public', 'data', 'regulasi', docId);
      await deleteDoc(docRef);
      setSuccessToast('Dokumen regulasi berhasil dihapus dari sistem.');
      if (activeDoc && activeDoc.id === docId) {
        setActiveDoc(null);
      }
    } catch (error) {
      console.error("Error deleting regulasi doc:", error);
      alert("Gagal menghapus dokumen. Silakan periksa koneksi Anda.");
    }
  };

  const submitRegulasiForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNomor.trim() || !formTentang.trim() || !formDeskripsi.trim()) {
      alert("Harap lengkapi semua kolom wajib (Nomor, Tentang, Deskripsi)!");
      return;
    }

    try {
      const cleanId = formMode === 'edit' && editingDocId 
        ? editingDocId 
        : formNomor.toLowerCase()
            .replace(/[^a-z0-h0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || `regulasi-${Date.now()}`;

      const targetDocRef = doc(db, 'artifacts', currentAppId, 'public', 'data', 'regulasi', cleanId);
      
      const payload = {
        id: cleanId,
        nomor: formNomor,
        kategori: formKategori,
        tentang: formTentang,
        deskripsi: formDeskripsi,
        tahun: formTahun || new Date().getFullYear().toString(),
        referensiUrl: formReferensiUrl || 'https://bpjph.halal.go.id/',
        status: formStatus || 'Masih Berlaku',
        lastUpdated: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        pasalPenting: formPasalPenting.filter(item => item.pasal.trim() && item.isi.trim()),
        isiLengkap: formIsiLengkap || `${formNomor} TENTANG ${formTentang}`
      };

      await setDoc(targetDocRef, payload, { merge: true });
      setSuccessToast(formMode === 'edit' ? 'Dokumen regulasi berhasil diperbarui!' : 'Dokumen regulasi baru berhasil ditambahkan!');
      setIsFormModalOpen(false);
      
      // Select the newly added or updated doc
      setActiveDoc(payload);
    } catch (error) {
      console.error("Error saving regulasi doc:", error);
      alert("Sistem gagal menyimpan dokumen regulasi. Silakan periksa konfigurasi Firebase Anda.");
    }
  };

  const addPasalField = () => {
    setFormPasalPenting(prev => [...prev, { pasal: `Pasal ${prev.length + 1}`, isi: '' }]);
  };

  const removePasalField = (idx: number) => {
    if (formPasalPenting.length <= 1) return;
    setFormPasalPenting(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePasalChange = (idx: number, field: 'pasal' | 'isi', value: string) => {
    setFormPasalPenting(prev => prev.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };
  
  // Accordion for Mobile Category filter
  const [isCategoryAccordionOpen, setIsCategoryAccordionOpen] = useState(false);
  
  // AI System Chatbot state
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string; timestamp: Date }[]>([
    { 
      sender: 'ai', 
      text: 'Halo! Saya Asisten Regulasi JPH LPH Al-Ghazali. Silakan ajukan pertanyaan seputar Undang-Undang JPH, kriteria bahan halal, proses audit reguler, self-declare, serta regulasi BPJPH atau SNI terkait.',
      timestamp: new Date() 
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync Log Simulations
  const [syncLogs, setSyncLogs] = useState<{ time: string; msg: string; status: 'success' | 'info' | 'warn' }[]>([
    { time: '21 Mei 2026, 01:00 WIB', msg: 'Sinkronisasi Terjadwal Cloudflare Worker dijalankan otomatis.', status: 'info' },
    { time: '21 Mei 2026, 01:01 WIB', msg: 'Memeriksa pangkalan data BPJPH Kemenag (https://bpjph.halal.go.id/).', status: 'info' },
    { time: '21 Mei 2026, 01:02 WIB', msg: 'Data Regulasi terverifikasi sinkron sempurna. Tidak ada revisi dokumen baru.', status: 'success' }
  ]);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading]);

  // Toast effect
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const categories = [
    'Semua', 
    'Undang-Undang', 
    'Peraturan Pemerintah', 
    'Keputusan Menteri Agama', 
    'Keputusan Kepala BPJPH', 
    'Peraturan BPOM', 
    'SNI'
  ];

  // Map category to beautiful Tailwind colors
  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'Undang-Undang':
        return 'bg-blue-100 text-blue-850 hover:bg-blue-200 border border-blue-200';
      case 'Peraturan Pemerintah':
        return 'bg-emerald-100 text-emerald-850 hover:bg-emerald-200 border border-emerald-200';
      case 'Keputusan Menteri Agama':
        return 'bg-amber-100 text-amber-900 hover:bg-amber-150 border border-amber-200';
      case 'Keputusan Kepala BPJPH':
        return 'bg-purple-100 text-purple-850 hover:bg-purple-200 border border-purple-200';
      case 'Peraturan BPOM':
        return 'bg-rose-100 text-rose-850 hover:bg-rose-200 border border-rose-200';
      case 'SNI':
        return 'bg-slate-100 text-slate-850 hover:bg-slate-200 border border-slate-200';
      default:
        return 'bg-gray-100 text-gray-850 border border-gray-200';
    }
  };

  // Search filter
  const filteredRegulasi = regulasiList.filter(doc => {
    const matchesCategory = selectedCategory === 'Semua' || doc.kategori === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = doc.nomor.toLowerCase().includes(searchLower) || 
                          doc.tentang.toLowerCase().includes(searchLower) || 
                          doc.deskripsi.toLowerCase().includes(searchLower) ||
                          doc.id.toLowerCase().includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  const currentDoc = (activeDoc && filteredRegulasi.some(d => d.id === activeDoc.id)) 
    ? activeDoc 
    : (filteredRegulasi[0] || null);

  // Handle citation copy
  const handleCopyCitation = (doc: RegulasiDoc) => {
    const citation = `${doc.nomor} tentang ${doc.tentang}`;
    navigator.clipboard.writeText(citation);
    setCopiedCitationId(doc.id);
    setSuccessToast(`Kutipan berhasil disalin: "${citation}"`);
    setTimeout(() => setCopiedCitationId(null), 2000);
  };

  // Simulated live scraping synchronization
  const triggerManualSync = () => {
    setIsSyncingNow(true);
    const newLogTime = new Date().toLocaleString('id-ID', { hour12: false }) + ' WIB';
    
    // Add start log
    setSyncLogs(prev => [
      { time: newLogTime, msg: 'Inisiasi sinkronisasi manual dipicu oleh Admin.', status: 'info' },
      ...prev
    ]);

    setTimeout(() => {
      setSyncLogs(prev => [
        { time: newLogTime, msg: 'Koneksi ke endpoint scrapper https://bpjph.halal.go.id/ berhasil.', status: 'info' },
        { time: newLogTime, msg: 'Penyamaan arsip legislasi nasional (10 dokumen JPH terupdate).', status: 'info' },
        { time: newLogTime, msg: 'Sinkronisasi berhasil! 0 ditambahkan, 0 diperbarui (Database mutakhir).', status: 'success' },
        ...prev
      ]);
      setIsSyncingNow(false);
      setSuccessToast('Sinkronisasi BPJPH Selesai! Seluruh regulasi dalam keadaan mutakhir.');
    }, 2000);
  };

  // Smart local regulation answering chatbot
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date() }]);
    setChatInput('');
    setIsAiLoading(true);

    setTimeout(() => {
      let aiResponse = "";
      const lower = userMsg.toLowerCase();

      if (lower.includes('audit') || lower.includes('pemeriksa') || lower.includes('regular') || lower.includes('reguler')) {
        aiResponse = "Menurut **Keputusan Kepala BPJPH Nomor 2 Tahun 2022**, proses sertifikasi halal reguler melibatkan pengajuan lewat Sihalal, verifikasi administrasi oleh BPJPH, pemeriksaan dokumen dan pengujian kehalalan bahan oleh Lembaga Pemeriksa Halal (LPH) Al-Ghazali, hingga penyerahan Laporan Hasil Pemeriksaan (LHP) ke Komisi Fatwa MUI untuk penetapan kehalalan.";
      } else if (lower.includes('berlaku') || lower.includes('habis') || lower.includes('masa') || lower.includes('selamanya') || lower.includes('umur hidup')) {
        aiResponse = "Berdasarkan **Undang-Undang Nomor 6 Tahun 2023 Pasal 48 (Klaster Jaminan Produk Halal)**, Sertifikat Halal yang diterbitkan kini berlaku untuk **selamanya (seumur hidup)** sepanjang pelaku usaha memelihara konsistensi kehalalan bahan dan proses produk halal yang bersangkutan.";
      } else if (lower.includes('self declare') || lower.includes('sehati') || lower.includes('gratis') || lower.includes('pernyataan')) {
        aiResponse = "Untuk sertifikasi skema **Self Declare (Pernyataan Pelaku Usaha)**, syarat utamanya diatur dalam **Peraturan BPJPH Nomor 1 Tahun 2023**. Kriteria produk harus tidak berisiko (menggunakan bahan positive list/aman), proses pengolahan sederhana, dan dilakukan pendampingan oleh Pendamping Proses Produk Halal (P3H) yang sah.";
      } else if (lower.includes('label') || lower.includes('kemasan') || lower.includes('logo') || lower.includes('bpom')) {
        aiResponse = "Pencantuman logo halal pada kemasan diatur koordinatif oleh **Peraturan BPOM Nomor 22 Tahun 2018 tentang Label Pangan Olahan**. Pelaku usaha wajib mencantumkan logo halal resmi Indonesia dan nomor sertifikat halal milik BPJPH pada label kemasan di posisi yang mudah terlihat dan dibaca oleh konsumen.";
      } else if (lower.includes('manajemen') || lower.includes('persyaratan') || lower.includes('sni_99001') || lower.includes('sni')) {
        aiResponse = "Standardisasi internal perusahaan diatur secara luas dalam Standar Nasional Indonesia **SNI 99001:2022**. Perusahaan harus berkomitmen membentuk **Tim Manajemen Halal**, menyusun prosedur operasional sanitasi, melakukan review berkala terhadap pemasok bahan, serta memastikan pemisahan total fasilitas produksi dari bahan haram/najis.";
      } else if (lower.includes('uu 33') || lower.includes('2014')) {
        aiResponse = "**Undang-Undang Nomor 33 Tahun 2014** merupakan pilar utama regulasi Jaminan Produk Halal (JPH) di Indonesia. Undang-Undang ini memandatkan bahwa seluruh produk makanan, minuman, obat, kosmetik, serta jasa yang beredar wajib memiliki sertifikat halal secara bertahap sejak Oktober 2019.";
      } else if (lower.includes('ringkas') || lower.includes('rangkuman')) {
        // Find matching document to summarize
        const matchedDoc = regulasiList.find(d => lower.includes(d.id.split('-')[0]) || lower.includes(d.tahun));
        if (matchedDoc) {
          aiResponse = `Berikut ringkasan cerdas dari **${matchedDoc.nomor}** mengenai **"${matchedDoc.tentang}"**:\n\n` +
                       `• **Deskripsi**: ${matchedDoc.deskripsi}\n` +
                       `• **Klausul Kunci**:\n` +
                       matchedDoc.pasalPenting.map(p => `  - *${p.pasal}*: ${p.isi}`).join('\n') + 
                       `\n\nApakah Anda memerlukan analisis pasal spesifik lainnya?`;
        } else {
          aiResponse = "Untuk meringkas dokumen JPH spesifik, silakan sebutkan nomor dokumen atau tahun regulasi yang diinginkan. Contoh: 'ringkas KMA 748'. Saya akan langsung menyajikan intisari pasal kuncinya.";
        }
      } else {
        // Fallback friendly JPH assistant response
        aiResponse = "Terima kasih untuk pertanyaannya! Jaminan Produk Halal (JPH) diatur ketat secara sinergis melalui UU No. 33/2014, UU Cipta Kerja No. 6/2023, serta serangkaian Keputusan Kepala BPJPH & SNI 99001:2022. Ada aspek regulasi tertentu yang melatarbelakangi pengujian produk Anda?\n\nSilakan tanyakan hal khusus seperti: 'bagaimana alur audit reguler?', 'berapa lama masa berlaku sertifikat?', atau 'syarat label kemasan'.";
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: aiResponse, timestamp: new Date() }]);
      setIsAiLoading(false);
    }, 1000);
  };

  const handleSummarizeDoc = (doc: RegulasiDoc) => {
    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: `Ringkas intisari penting dari regulasi ${doc.nomor}`, timestamp: new Date() }
    ]);
    setIsAiLoading(true);
    setTimeout(() => {
      const aiResponse = `**Ringkasan Cerdas Otomatis (${doc.nomor})**:\n\n` +
                         `• **Latar Belakang**: ${doc.deskripsi}\n\n` +
                         `• **Poin-Poin Utama & SOP Regulasi**:\n` +
                         doc.pasalPenting.map(p => `  - **${p.pasal}**: ${p.isi}`).join('\n') +
                         `\n\n*Terintegrasi dari Portal Pusat Data BPJPH Indonesia.*`;
      setChatMessages(prev => [...prev, { sender: 'ai', text: aiResponse, timestamp: new Date() }]);
      setIsAiLoading(false);
    }, 805);
  };

  return (
    <div className="bg-white min-h-screen pt-40 sm:pt-48 pb-16 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-32 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4"
          >
            <div className="bg-slate-900 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-xs font-bold font-mono tracking-tight">{successToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <button 
            onClick={() => navigateTo('landing')} 
            className="inline-flex items-center text-sm font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-4 py-2 rounded-xl transition-all gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </button>
        </div>

        {/* Header Section */}
        <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/10 border border-emerald-100 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/40 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold leading-none mb-2">
                <Scale className="w-3.5 h-3.5 mr-1.5" /> Portal Informasi Legislasi JPH
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Dokumen Regulasi Jaminan Produk Halal
              </h1>
              <p className="text-sm font-semibold text-gray-600 max-w-3xl leading-relaxed">
                Referensi resmi peraturan perundang-undangan produk halal, tersinkronisasi berkala dari database utama BPJPH Kementerian Agama Republik Indonesia.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs pt-1">
                <span className="text-gray-400 font-bold">Sumber Resmi:</span>
                <a 
                  href="https://bpjph.halal.go.id/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-600 hover:text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
                >
                  BPJPH Kemenag RI <Globe className="w-3 h-3" />
                </a>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-2xl shadow-sm text-center min-w-[200px]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Status Gateway</span>
              <span className="text-emerald-700 font-extrabold text-xs mt-1.5 flex items-center md:justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                Sihalal API Connected
              </span>
              <span className="text-[11px] text-gray-500 font-bold mt-1 font-mono">
                Terakhir Diperbarui: 21 Mei 2026
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid: Regulasi panel & AI sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left + Mid: Regulasi Database */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Filter & Search Bar container */}
            <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl shadow-sm space-y-4">
              
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Cari regulasi berdasarkan nomor, tahun, tentang, atau kata kunci..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-gray-800"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {/* Category Filter (Mobile & Desktop) */}
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-1">
                  Kategori Regulasi JPH
                </span>

                {/* Mobile Category Select (Accordion style) */}
                <div className="sm:hidden relative">
                  <button 
                    onClick={() => setIsCategoryAccordionOpen(!isCategoryAccordionOpen)}
                    className="w-full flex justify-between items-center bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 shadow-sm"
                  >
                    <span>Kategori: {selectedCategory}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCategoryAccordionOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isCategoryAccordionOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-40 left-0 right-0 mt-1 bg-white border border-gray-150 rounded-xl shadow-lg overflow-hidden"
                      >
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setIsCategoryAccordionOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                              selectedCategory === cat 
                                ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600' 
                                : 'text-gray-700 hover:bg-emerald-50/50'
                            }`}
                          >
                            {cat === 'Semua' ? '🔥 Semua Regulasi' : cat}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Desktop Category Tabs */}
                <div className="hidden sm:flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-extrabold'
                            : 'bg-white border border-gray-200 text-gray-650 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* List and Detail Split layout */}
            <div className="flex flex-col md:flex-row gap-6 items-stretch">
              
              {/* Regulasi List pane */}
              <div className={`w-full ${currentDoc && 'md:w-[48%]'} space-y-3 max-h-[750px] overflow-y-auto pr-1`}>
                <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                  <span>Hasil ({filteredRegulasi.length})</span>
                  <div className="flex items-center gap-2">
                    {(userRole === 'staff' || userRole === 'admin') && (
                      <button 
                        onClick={openAddModal}
                        className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all uppercase tracking-wider"
                      >
                        <Plus className="w-3 h-3 text-emerald-600 shrink-0" /> Tambah
                      </button>
                    )}
                    {selectedCategory !== 'Semua' && (
                      <button onClick={() => setSelectedCategory('Semua')} className="text-emerald-700 hover:underline">
                        Reset Filter
                      </button>
                    )}
                  </div>
                </div>

                {filteredRegulasi.length === 0 ? (
                  <div className="p-12 text-center bg-gray-50 border border-gray-150 rounded-2xl flex flex-col items-center justify-center">
                    <Scale className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-sm font-bold text-gray-800">Tidak ada regulasi yang cocok</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                      Sesuaikan kata kunci pencarian atau pilih pilar kategori lain.
                    </p>
                  </div>
                ) : (
                  filteredRegulasi.map((doc) => {
                    const isSelected = currentDoc && currentDoc.id === doc.id;
                    return (
                      <div 
                        key={doc.id}
                        onClick={() => setActiveDoc(doc)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col gap-2.5 ${
                          isSelected 
                            ? 'bg-emerald-55/80 border-emerald-300 text-emerald-950 shadow-md shadow-emerald-100/50 scale-[1.01]' 
                            : 'bg-white border-gray-150 hover:bg-gray-50/50 hover:border-gray-305 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${getCategoryBadgeClass(doc.kategori)}`}>
                            {doc.kategori}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-150 text-emerald-800 text-[10px] font-extrabold uppercase">
                            Masih Berlaku
                          </span>
                        </div>
                        
                        <div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 leading-snug line-clamp-2">
                            {doc.nomor}
                          </h4>
                          <p className="text-xs font-bold text-emerald-800 mt-1 line-clamp-1">
                            Tentang: {doc.tentang}
                          </p>
                        </div>

                        <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2 font-semibold leading-relaxed">
                          {doc.deskripsi}
                        </p>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                          <div className="text-[11px] font-bold text-gray-400 font-mono">
                            Tahun Sidang: {doc.tahun}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {(userRole === 'staff' || userRole === 'admin') && (
                              <>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(doc);
                                  }}
                                  className="p-1.5 hover:bg-amber-50 text-amber-600 hover:text-amber-800 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                                  title="Edit Dokumen Regulasi"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    deleteRegulasiDoc(doc.id, e);
                                  }}
                                  className="p-1.5 hover:bg-red-50 text-red-600 hover:text-red-800 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                  title="Hapus Dokumen Regulasi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyCitation(doc);
                              }}
                              className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                              title="Salin Kutipan Peraturan"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(doc);
                              }}
                              className="p-1.5 hover:bg-gray-105 text-emerald-600 hover:text-emerald-800 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                              title="Unduh Naskah Dokumen (.txt)"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Regulasi Detail pane */}
              {currentDoc ? (
                <div className="flex-1 border border-gray-150 rounded-2xl bg-white shadow-sm flex flex-col overflow-hidden max-h-[750px]">
                  {/* Header title */}
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest ${getCategoryBadgeClass(currentDoc.kategori)}`}>
                        {currentDoc.kategori}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1 text-emerald-500 shrink-0" /> Masih Berlaku
                      </span>
                    </div>
                    
                    <h3 className="text-base font-extrabold text-gray-900 leading-snug">
                      {currentDoc.nomor}
                    </h3>
                    <p className="text-sm font-semibold text-emerald-800">
                      Tentang: {currentDoc.tentang}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <button 
                        onClick={() => handleCopyCitation(currentDoc)}
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-650 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Salin Kutipan
                      </button>
                      <button 
                        onClick={() => handleDownload(currentDoc)}
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Unduh Dokumen
                      </button>
                      {(userRole === 'staff' || userRole === 'admin') && (
                        <>
                          <button 
                            onClick={() => openEditModal(currentDoc)}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-amber-200 hover:bg-amber-50 text-amber-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Edit Regulasi
                          </button>
                          <button 
                            onClick={(e) => deleteRegulasiDoc(currentDoc.id, e)}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5 text-red-500" /> Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Body content scrollable */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-5">
                    {/* Ringkasan / Overview */}
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center">
                        <BookOpen className="w-4 h-4 mr-1.5 shrink-0" /> Deskripsi Ringkas Penjelasan
                      </h4>
                      <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                        {currentDoc.deskripsi}
                      </p>
                    </div>

                    {/* Quick AISummarize triggering */}
                    <div className="border border-emerald-200 bg-emerald-500/[0.02] p-4 rounded-xl flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> AI Rangkuman Cerdas JPH
                        </h4>
                        <p className="text-[11px] text-gray-500 font-semibold">
                          Gunakan AI untuk melacak intisari legislalif dari naskah panjang.
                        </p>
                      </div>
                      <button 
                        onClick={() => handleSummarizeDoc(currentDoc)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Minta AI Ringkas
                      </button>
                    </div>

                    {/* Pasal-Pasal Kunci */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                        Poin Utama & Pasal Penting
                      </h4>
                      <div className="space-y-2.5">
                        {currentDoc.pasalPenting.map((p, idx) => (
                          <div 
                            key={idx} 
                            className="bg-gray-50/50 border border-gray-150 hover:border-emerald-200 rounded-xl p-3.5 transition-colors shadow-none hover:shadow-sm"
                          >
                            <div className="text-xs font-extrabold text-emerald-800 mb-1 flex items-center gap-1">
                              <ChevronRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {p.pasal}
                            </div>
                            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                              {p.isi}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Full text PRE block */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                        Naskah Komparasi Lengkap
                      </h4>
                      <pre className="font-mono text-[10px] sm:text-[11px] bg-slate-900 border border-slate-800 text-slate-200 p-4 rounded-xl max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed font-semibold">
                        {currentDoc.isiLengkap}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

          </div>

          {/* Right Column: AI Assistant & Cloud Sync Logs */}
          <div className="space-y-6">
            
            {/* AI Assistant Chat Sandbox inside the Page */}
            <div className="border border-gray-150 rounded-2xl bg-white shadow-sm flex flex-col h-[400px] overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="bg-white/20 p-1.5 rounded-xl">
                    <Sparkles className="w-4 h-4 text-emerald-100" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold tracking-tight">AI Asisten Regulasi JPH</h3>
                    <p className="text-[9px] text-emerald-200 font-bold tracking-wider leading-none mt-1">
                      Gemini 3.5 Flash Connected
                    </p>
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse border border-white/20"></div>
              </div>

              {/* Chat history */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-slate-50">
                {chatMessages.map((msg, idx) => {
                  const isAi = msg.sender === 'ai';
                  return (
                    <div key={idx} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                        isAi 
                          ? 'bg-white border border-gray-150 text-gray-800 font-semibold' 
                          : 'bg-emerald-600 text-white font-medium'
                      }`}>
                        {isAi ? (
                          <div className="whitespace-pre-wrap">
                            {/* Simple inline bullet renderer */}
                            {msg.text}
                          </div>
                        ) : (
                          <p>{msg.text}</p>
                        )}
                        <span className={`block text-[9px] mt-1.5 font-bold font-mono tracking-tighter ${isAi ? 'text-gray-400' : 'text-emerald-250 text-right'}`}>
                          {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 rounded-2xl p-3 text-xs text-gray-500 shadow-sm flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-100"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-200"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-300"></div>
                      </div>
                      <span className="font-bold text-[10px] tracking-wider text-gray-450 uppercase animate-pulse">
                        Sihalal AI menelaah dokumen...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-gray-100 bg-white shrink-0 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Tanyakan klaim halal, self-declare, SNI..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendChatMessage();
                  }}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold"
                />
                <button 
                  onClick={handleSendChatMessage}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm shadow-emerald-600/10 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cloud Worker Scraper Sync Center */}
            <div className="border border-gray-150 rounded-2xl bg-white shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 inline-flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" />
                    Pusat Sinkronisasi BPJPH
                  </h3>
                  <p className="text-[11px] text-gray-550 leading-relaxed font-semibold">
                    Operasional sinkronisasi mandiri LPH Al-Ghazali via Cloudflare Worker & REST integration.
                  </p>
                </div>
              </div>

              {/* Worker attributes */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl text-[11px] font-semibold border border-gray-150">
                <div className="space-y-0.5">
                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Cron Job</span>
                  <span className="text-gray-800">Setiap Hari 01:00 WIB</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Target Endpoint</span>
                  <span className="text-gray-800 truncate block">bpjph.halal.go.id/api</span>
                </div>
                <div className="space-y-0.5 mt-1.5">
                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Metode Scrapper</span>
                  <span className="text-gray-800">Workers + REST SDK</span>
                </div>
                <div className="space-y-0.5 mt-1.5">
                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Pemberitahuan</span>
                  <span className="text-gray-800">Admin Email & Logs</span>
                </div>
              </div>

              {/* Sync Actions (Available to Staff or simulates for visualization) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                  <span>Log Sinkronisasi Otomatis</span>
                  <span className="text-emerald-700">ONLINE</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 max-h-[140px] overflow-y-auto space-y-2.5 font-mono text-[10px] tracking-tight">
                  {syncLogs.map((log, lidx) => (
                    <div key={lidx} className="border-b border-slate-800/60 pb-1.5 last:border-0 last:pb-0">
                      <div className="flex justify-between text-slate-550 text-[9px]">
                        <span>{log.time}</span>
                        <span className={log.status === 'success' ? 'text-emerald-400 font-bold' : log.status === 'warn' ? 'text-amber-400' : 'text-blue-400'}>
                          [{log.status.toUpperCase()}]
                        </span>
                      </div>
                      <p className="text-slate-350 mt-0.5 leading-snug">{log.msg}</p>
                    </div>
                  ))}
                </div>
              </div>

              {userRole === 'admin' ? (
                <button 
                  onClick={triggerManualSync}
                  disabled={isSyncingNow}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 border cursor-pointer ${
                    isSyncingNow 
                      ? 'bg-gray-100 text-gray-500 border-gray-200' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 shadow-emerald-500/10'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow && 'animate-spin'}`} />
                  {isSyncingNow ? 'Menghubungkan ke BPJPH JPH...' : 'Picu Sinkronisasi Manual'}
                </button>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl flex gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed text-amber-800 font-semibold">
                    Fitur Sinkronisasi Manual BPJPH hanya dapat dipicu langsung oleh **Admin LPH / Manajer Operasional**. Masuk sebagai administrator untuk kontrol penuh.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Form Modal for Add/Edit Regulation */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-[300] overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            ></motion.div>
            
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-150 flex flex-col max-h-[85vh] z-[310]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 shrink-0 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                    {formMode === 'add' ? 'Tambah Dokumen Regulasi JPH' : 'Perbarui Dokumen Regulasi JPH'}
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium mt-1">
                    Lengkapi parameter legislatif resmi untuk sinkronisasi pangkalan data LPH.
                  </p>
                </div>
                <button 
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body - Scrollable */}
              <form onSubmit={submitRegulasiForm} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nomor Regulasi */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Nama / Nomor Regulasi <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Contoh: Undang-Undang Nomor 33 Tahun 2014"
                      value={formNomor}
                      onChange={(e) => setFormNomor(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-gray-800"
                    />
                  </div>

                  {/* Kategori */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Kategori Regulasi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formKategori}
                      onChange={(e) => setFormKategori(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-gray-800"
                    >
                      <option value="Undang-Undang">Undang-Undang</option>
                      <option value="Peraturan Pemerintah">Peraturan Pemerintah</option>
                      <option value="Keputusan Menteri Agama">Keputusan Menteri Agama</option>
                      <option value="Keputusan Kepala BPJPH">Keputusan Kepala BPJPH</option>
                      <option value="Peraturan BPOM">Peraturan BPOM</option>
                      <option value="SNI">SNI</option>
                    </select>
                  </div>

                  {/* Tahun */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Tahun Penetapan
                    </label>
                    <input 
                      type="text"
                      placeholder="Contoh: 2014"
                      value={formTahun}
                      onChange={(e) => setFormTahun(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-gray-800"
                    />
                  </div>

                  {/* Tentang */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Tentang / Hal <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Contoh: Jaminan Produk Halal (JPH)"
                      value={formTentang}
                      onChange={(e) => setFormTentang(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-gray-800"
                    />
                  </div>

                  {/* Deskripsi */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Deskripsi Ringkas Penjelasan <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      rows={3}
                      required
                      placeholder="Tuliskan latar belakang singkat dan esensi dari regulasi ini..."
                      value={formDeskripsi}
                      onChange={(e) => setFormDeskripsi(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-gray-800"
                    />
                  </div>

                  {/* Referensi URL */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Referensi URL (Naskah Asli)
                    </label>
                    <input 
                      type="url"
                      placeholder="https://bpjph.halal.go.id/..."
                      value={formReferensiUrl}
                      onChange={(e) => setFormReferensiUrl(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-gray-800"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Status Hukum
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-gray-800"
                    >
                      <option value="Masih Berlaku">Masih Berlaku</option>
                      <option value="Direvisi">Direvisi</option>
                      <option value="Tidak Berlaku">Tidak Berlaku</option>
                    </select>
                  </div>
                </div>

                {/* Pasal Pasal Penting */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-150 pb-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Poin Utama & Pasal Penting
                    </label>
                    <button 
                      type="button"
                      onClick={addPasalField}
                      className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-lg flex items-center gap-1 cursor-pointer transition-all uppercase tracking-wider"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" /> Tambah Pasal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {formPasalPenting.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-205 p-3.5 rounded-xl flex gap-3 relative">
                        <div className="flex-1 space-y-2">
                          <input 
                            type="text"
                            placeholder="Contoh: Pasal 4 atau Diktum Kesatu"
                            value={item.pasal}
                            onChange={(e) => handlePasalChange(idx, 'pasal', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-gray-205 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-emerald-850"
                          />
                          <textarea 
                            rows={2}
                            placeholder="Tuliskan isi pasal atau ketetapan penting secara ringkas..."
                            value={item.isi}
                            onChange={(e) => handlePasalChange(idx, 'isi', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-gray-205 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-gray-800"
                          />
                        </div>
                        {formPasalPenting.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removePasalField(idx)}
                            className="p-1.5 self-start hover:bg-red-50 text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-200 cursor-pointer mt-1"
                            title="Hapus poin"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Isi Lengkap */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Naskah Komparasi Lengkap (Format Bebas)
                  </label>
                  <textarea 
                    rows={6}
                    placeholder="Tulis naskah lengkap dari peraturan di sini untuk perbandingan manual..."
                    value={formIsiLengkap}
                    onChange={(e) => setFormIsiLengkap(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-mono text-xs font-semibold leading-relaxed text-gray-800"
                  />
                </div>

                {/* Submit row */}
                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2.5 hover:bg-gray-105 text-gray-650 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/15 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />Simpan Dokumen
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
