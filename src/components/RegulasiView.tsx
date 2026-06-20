import React from 'react';
import { Scale, Landmark, BookOpen, FileSignature, ShieldCheck, Award, Search, Download, HelpCircle, ArrowLeft, FileText, Eye, X } from 'lucide-react';
import { jsPDF } from 'jspdf';

export interface Pasal {
  pasal: string;
  isi: string;
}

export interface RegulasiDoc {
  id: string;
  nomor: string;
  kategori: string;
  tentang: string;
  deskripsi: string;
  tahun: string;
  referensiUrl: string;
  pasalPenting?: Pasal[];
  isiLengkap?: string;
  embedUrl?: string;
  fileData?: string;
  fileName?: string;
  fileSize?: string;
  fileExtension?: string;
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
}

const CATEGORY_META = [
  { label: 'Undang-Undang', display: 'Undang-Undang RI', icon: Scale, colorBg: 'bg-blue-50/75 text-blue-700 hover:bg-blue-100' },
  { label: 'Peraturan Pemerintah', display: 'Peraturan Pemerintah', icon: Landmark, colorBg: 'bg-emerald-50/75 text-emerald-700 hover:bg-emerald-100' },
  { label: 'Keputusan Menteri Agama', display: 'Keputusan Menteri Agama', icon: BookOpen, colorBg: 'bg-amber-50/75 text-amber-700 hover:bg-amber-100' },
  { label: 'Keputusan Kepala BPJPH', display: 'Keputusan Kepala BPJPH', icon: FileSignature, colorBg: 'bg-purple-50/75 text-purple-700 hover:bg-purple-100' },
  { label: 'Peraturan BPOM', display: 'Peraturan BPOM', icon: ShieldCheck, colorBg: 'bg-rose-50/75 text-rose-700 hover:bg-rose-100' },
  { label: 'SNI', display: 'Standar Nasional (SNI)', icon: Award, colorBg: 'bg-slate-50/75 text-slate-700 hover:bg-slate-100' },
  { label: 'Fatwa MUI', display: 'Fatwa MUI', icon: FileText, colorBg: 'bg-teal-50/75 text-teal-700 hover:bg-teal-100' }
];

function base64ToBlob(base64: string, mimeType: string = 'application/pdf') {
  const parts = base64.split(';base64,');
  const actualBase64 = parts.length > 1 ? parts[1] : parts[0];
  const byteCharacters = atob(actualBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export default function RegulasiView({
  navigateTo,
  regulasiList = [],
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  activeDoc,
  setActiveDoc,
  handleDownload
}: RegulasiViewProps) {

  const [previewState, setPreviewState] = React.useState<{ title: string; url: string; isBlob?: boolean } | null>(null);

  // Category Filtering
  const filteredRegulasi = regulasiList.filter(doc => {
    // Category match
    if (selectedCategory !== 'Semua' && doc.kategori !== selectedCategory) {
      return false;
    }
    // Search query match
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        doc.nomor.toLowerCase().includes(q) ||
        doc.tentang.toLowerCase().includes(q) ||
        doc.deskripsi.toLowerCase().includes(q) ||
        doc.tahun.includes(q) ||
        doc.kategori.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const currentDoc = (activeDoc && filteredRegulasi.some(d => d.id === activeDoc.id))
    ? activeDoc
    : (filteredRegulasi[0] || null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Undang-Undang': return Scale;
      case 'Peraturan Pemerintah': return Landmark;
      case 'Keputusan Menteri Agama': return BookOpen;
      case 'Keputusan Kepala BPJPH': return FileSignature;
      case 'Peraturan BPOM': return ShieldCheck;
      case 'Fatwa MUI': return FileText;
      default: return Award;
    }
  };

  const getEmbedUrl = (doc: RegulasiDoc) => {
    const url = doc.embedUrl || doc.referensiUrl;
    if (!url) return null;

    if (url.includes('drive.google.com')) {
      let fileId = '';
      if (url.includes('/file/d/')) {
        const parts = url.split('/file/d/');
        if (parts.length > 1) {
          fileId = parts[1].split('/')[0].split('?')[0];
        }
      } else if (url.includes('id=')) {
        const parts = url.split('id=');
        if (parts.length > 1) {
          fileId = parts[1].split('&')[0];
        }
      }

      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return url;
  };

  const handleDownloadAttached = (docObj: RegulasiDoc) => {
    try {
      if (!docObj.fileData) return;
      
      const link = document.createElement('a');
      link.href = docObj.fileData;
      link.download = docObj.fileName || `${docObj.nomor}.${docObj.fileExtension || 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Gagal mendownload file lampiran:", err);
      alert("Gagal mendownload file lampiran.");
    }
  };

  const generateIsiLengkapPDFDoc = (docObj: RegulasiDoc) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let yPos = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const maxLineWidth = pageWidth - (margin * 2);
    let pageNum = 1;

    // Helper to draw footer on current page
    const drawFooter = (page: number) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Halaman ${page}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
    };

    // Draw page 1 footer initially
    drawFooter(pageNum);

    // Helper to add new page and reset yPos
    const checkPageBreakFull = (heightNeeded: number) => {
      if (yPos + heightNeeded > pageHeight - margin - 5) {
        doc.addPage();
        pageNum++;
        drawFooter(pageNum);

        // Add subtle running header on subsequent pages
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(docObj.nomor, margin, 12);
        doc.setDrawColor(241, 245, 249); // slate-100
        doc.line(margin, 14, pageWidth - margin, 14);
        
        yPos = 22;
      }
    };

    // --- Header Block on Page 1 ---
    // Deep Emerald Banner block
    doc.setFillColor(6, 95, 70); // Emerald 800
    doc.rect(margin, yPos, maxLineWidth, 16, 'F');
    
    // Banner white text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("NASKAH LENGKAP REGULASI HALAL", margin + 6, yPos + 10.5);
    yPos += 24;

    // Kategori
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.text(docObj.kategori.toUpperCase(), margin, yPos);
    yPos += 7;

    // Nomor Dokumen
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate 900
    const nomorLines = doc.splitTextToSize(docObj.nomor, maxLineWidth);
    nomorLines.forEach((line: string) => {
      checkPageBreakFull(8);
      doc.text(line, margin, yPos);
      yPos += 8;
    });

    yPos += 2;

    // Tentang
    doc.setFont('helvetica', 'oblique');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // Slate 600
    const tentangLines = doc.splitTextToSize(`Tentang: "${docObj.tentang}"`, maxLineWidth);
    tentangLines.forEach((line: string) => {
      checkPageBreakFull(7);
      doc.text(line, margin, yPos);
      yPos += 7;
    });

    yPos += 5;

    // Elegant separator line
    checkPageBreakFull(5);
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // --- Content Section: ISI LENGKAP ---
    checkPageBreakFull(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('KETENTUAN & SALINAN TEKS LENGKAP', margin, yPos);
    yPos += 8;

    const rawText = docObj.isiLengkap || "Naskah lengkap tidak tersedia.";
    const paragraphs = rawText.split('\n');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // Slate 700

    paragraphs.forEach((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) {
        yPos += 4; // structural spacing for empty fields
        return;
      }

      // Check for headings within isiLengkap to style them slightly bolder
      const isSubHeading = trimmed.startsWith('Pasal') || trimmed.startsWith('BAB') || trimmed.includes('MEMBERIKAN') || trimmed.includes('MEMUTUSKAN') || trimmed.startsWith('Menimbang') || trimmed.startsWith('Mengingat') || trimmed.includes('KEPALA BADAN');
      
      if (isSubHeading) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
      }

      const pLines = doc.splitTextToSize(trimmed, maxLineWidth);
      pLines.forEach((line: string) => {
        checkPageBreakFull(6);
        doc.text(line, margin, yPos);
        yPos += 5.5;
      });
      yPos += 2.5; // spacing between paragraphs
    });

    yPos += 8;

    // Footer signature-like area
    checkPageBreakFull(30);
    doc.setDrawColor(22, 163, 74); // Green 600
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text('Lembaga Pemeriksa Halal Al-Ghazali Cilacap', margin, yPos);
    yPos += 4.5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    const footnoteTxt = 'Dokumen ini merupakan salinan naskah lengkap digital resmi yang disetujui untuk visualisasi publik dan sosialisasi sertifikasi halal oleh Kantor LPH Al-Ghazali Cilacap.';
    const footnoteLines = doc.splitTextToSize(footnoteTxt, maxLineWidth);
    footnoteLines.forEach((line: string) => {
      checkPageBreakFull(4);
      doc.text(line, margin, yPos);
      yPos += 4;
    });

    return doc;
  };

  const handleDownloadIsiLengkap = (docObj: RegulasiDoc) => {
    try {
      const doc = generateIsiLengkapPDFDoc(docObj);
      const fileName = `${docObj.nomor.replace(/[^a-zA-Z0-9]/g, '_')}_Naskah_Lengkap.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("Full PDF generation failed, falling back to TXT:", err);
      // Fallback TXT
      const textContent = `NASKAH LENGKAP REGULASI HALAL
==================================================
KATEGORI: ${docObj.kategori.toUpperCase()}
NOMOR: ${docObj.nomor}
TENTANG: ${docObj.tentang}
==================================================

${docObj.isiLengkap || "Naskah lengkap tidak tersedia."}

--------------------------------------------------
Disahkan oleh LPH Al-Ghazali Cilacap.
`;
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${docObj.nomor.replace(/[^a-zA-Z0-9]/g, '_')}_Naskah_Lengkap.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handlePreviewIsiLengkap = (docObj: RegulasiDoc) => {
    try {
      const doc = generateIsiLengkapPDFDoc(docObj);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPreviewState({
        title: `Pratinjau Naskah: ${docObj.nomor}`,
        url,
        isBlob: true
      });
    } catch (err) {
      console.error("Full PDF preview generation failed:", err);
      alert("Gagal memproses pratinjau PDF.");
    }
  };

  const handlePreviewAttached = (docObj: RegulasiDoc) => {
    try {
      if (!docObj.fileData) return;
      
      const blob = base64ToBlob(docObj.fileData, 'application/pdf');
      const url = URL.createObjectURL(blob);
      setPreviewState({
        title: `Pratinjau Lampiran: ${docObj.fileName || docObj.nomor}`,
        url,
        isBlob: true
      });
    } catch (err) {
      console.error("Gagal mendownload dan menampilkan file lampiran:", err);
      alert("Gagal menyiapkan pratinjau lampiran.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Back Button and Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Scale className="w-8 h-8 text-emerald-600" /> Pusat Informasi Regulasi Halal
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Telusuri kumpulan dasar hukum, regulasi BPJPH, KMA, PP, dan UU terkait Jaminan Produk Halal (JPH) secara transparan.
          </p>
        </div>
      </div>

      {/* Category Grid */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600" /> Pilih Kategori Regulasi
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 font-sans">
          {CATEGORY_META.map((catItem) => {
            const count = regulasiList.filter(doc => doc.kategori === catItem.label).length;
            const isCatActive = selectedCategory === catItem.label;
            const IconComp = catItem.icon;
            return (
              <button
                key={catItem.label}
                id={`cat-btn-${catItem.label.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => {
                  setSelectedCategory(isCatActive ? 'Semua' : catItem.label);
                }}
                className={`group flex flex-col items-center justify-between p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                  isCatActive
                    ? 'bg-emerald-600 border-emerald-500 shadow-emerald-500/15 text-white shadow-md'
                    : `bg-white border-gray-150 hover:border-emerald-200 hover:shadow-xs shadow-none`
                }`}
              >
                <div className={`p-2.5 rounded-xl mb-3 shrink-0 transition-transform group-hover:scale-105 ${
                  isCatActive ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <span className={`text-[11px] font-extrabold leading-tight ${isCatActive ? 'text-white' : 'text-gray-700'}`}>
                  {catItem.display}
                </span>
                <span className={`text-[9px] font-extrabold font-sans mt-2 px-2 py-0.5 rounded-full ${
                  isCatActive ? 'bg-emerald-700/60 text-emerald-50' : 'bg-gray-100 text-gray-500 group-hover:bg-emerald-50 group-hover:text-emerald-700'
                }`}>
                  {count} Dokumen
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: List of Regulations */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-emerald-600" />
              <input
                id="search-regulasi-input"
                type="text"
                placeholder="Cari regulasi berdasarkan nomor, tahun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white transition-all shadow-sm font-medium"
              />
            </div>

            {/* Selected category indicator */}
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 px-1 border-b border-gray-50 pb-2">
              <span>Hasil ({filteredRegulasi.length})</span>
              {selectedCategory !== 'Semua' && (
                <button onClick={() => setSelectedCategory('Semua')} className="text-emerald-700 hover:underline">
                  Reset Filter
                </button>
              )}
            </div>

            {/* List scrollarea */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredRegulasi.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 border border-gray-150 rounded-xl">
                  <Scale className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-400">Tidak ada regulasi yang cocok</p>
                </div>
              ) : (
                filteredRegulasi.map((doc) => {
                  const IconComp = getCategoryIcon(doc.kategori);
                  const isDocActive = currentDoc && currentDoc.id === doc.id;
                  return (
                    <button
                      key={doc.id}
                      id={`doc-card-${doc.id}`}
                      onClick={() => setActiveDoc(doc)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                        isDocActive
                          ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/10'
                          : 'bg-white border-gray-100 hover:border-emerald-150 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isDocActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                            doc.kategori === 'Undang-Undang' ? 'bg-blue-100/60 text-blue-800' :
                            doc.kategori === 'Peraturan Pemerintah' ? 'bg-emerald-100/60 text-emerald-800' :
                            doc.kategori === 'Keputusan Menteri Agama' ? 'bg-amber-100/60 text-amber-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {doc.kategori}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 font-mono">Tahun {doc.tahun}</span>
                        </div>
                        <h3 className="text-xs font-black text-gray-900 mt-1.5 leading-tight line-clamp-2">
                          {doc.nomor}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-500 mt-1 line-clamp-2 leading-normal font-sans">
                          {doc.tentang}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Document Details */}
        <div className="lg:col-span-7">
          {currentDoc ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header card banner */}
              <div className="p-6 bg-slate-900 text-white relative">
                <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                  <span className="text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500 text-slate-950 px-3 py-1 rounded-full font-sans">
                    {currentDoc.kategori}
                  </span>
                  <div className="flex gap-2.5 flex-wrap">
                    <button
                      id={`download-ringkasan-btn-${currentDoc.id}`}
                      onClick={() => handleDownload(currentDoc)}
                      className="flex items-center gap-1.5 text-xs font-bold leading-none bg-slate-800 text-emerald-400 border border-slate-700/60 px-3.5 py-2 rounded-full hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-500 transition-all font-sans cursor-pointer shadow-xs"
                      title="Download Ringkasan Kebijakan & Pasal Kunci"
                    >
                      <Download className="w-3.5 h-3.5" /> Ringkasan (.pdf)
                    </button>
                    <div className="flex gap-1.5">
                      <button
                        id={`download-lengkap-btn-${currentDoc.id}`}
                        onClick={() => handleDownloadIsiLengkap(currentDoc)}
                        className="flex items-center gap-1.5 text-xs font-bold leading-none bg-white text-slate-900 px-3.5 py-2 rounded-full hover:bg-emerald-500 hover:text-slate-950 transition-all font-sans cursor-pointer shadow-sm"
                        title="Download Teks / Naskah Lengkap Regulasi"
                      >
                        <Download className="w-3.5 h-3.5" /> Naskah (.pdf)
                      </button>
                      <button
                        id={`preview-lengkap-btn-${currentDoc.id}`}
                        onClick={() => handlePreviewIsiLengkap(currentDoc)}
                        className="flex items-center gap-1.5 text-xs font-bold leading-none bg-emerald-800 text-white px-3.5 py-2 rounded-full hover:bg-emerald-500 hover:text-slate-950 transition-all font-sans cursor-pointer shadow-sm"
                        title="Pratinjau Naskah Lengkap PDF"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </button>
                    </div>
                    {currentDoc.fileData && (
                      <div className="flex gap-1.5">
                        {currentDoc.fileExtension === 'pdf' && (
                          <button
                            id={`preview-lampiran-btn-${currentDoc.id}`}
                            onClick={() => handlePreviewAttached(currentDoc)}
                            className="flex items-center gap-1.5 text-xs font-bold leading-none bg-blue-600 text-white px-3.5 py-2 rounded-full hover:bg-blue-500 hover:text-slate-955 transition-all font-sans cursor-pointer shadow-sm"
                            title={`Pratinjau PDF (${currentDoc.fileName})`}
                          >
                            <Eye className="w-3.5 h-3.5" /> Pratinjau Lampiran
                          </button>
                        )}
                        <button
                          id={`download-lampiran-btn-${currentDoc.id}`}
                          onClick={() => handleDownloadAttached(currentDoc)}
                          className="flex items-center gap-1.5 text-xs font-bold leading-none bg-emerald-600 text-white px-3.5 py-2 rounded-full hover:bg-emerald-500 hover:text-slate-950 transition-all font-sans cursor-pointer shadow-sm"
                          title={`Download Lampiran (${currentDoc.fileName})`}
                        >
                          <FileText className="w-3.5 h-3.5" /> Lampiran (.{currentDoc.fileExtension})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                  {currentDoc.nomor}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-300 mt-2 font-sans italic">
                  &ldquo;{currentDoc.tentang}&rdquo;
                </p>
              </div>

              {/* Document details contents */}
              <div className="p-6 space-y-6">
                {/* Description */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
                    Esensi & Deskripsi Umum
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed font-sans bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/30">
                    {currentDoc.deskripsi}
                  </p>
                </div>

                {/* Key Clauses (Pasal Penting) */}
                {currentDoc.pasalPenting && currentDoc.pasalPenting.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
                      Butir Kebijakan & Pasal Kunci
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {currentDoc.pasalPenting.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-gray-150/80 bg-slate-50/50 flex gap-3 h-full hover:border-emerald-200 transition-colors"
                        >
                          <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 font-mono shadow-xs mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-extrabold text-emerald-800 font-mono uppercase tracking-wider block mb-1">
                              {p.pasal}
                            </span>
                            <p className="text-xs font-bold text-gray-600 leading-normal font-sans">
                              {p.isi}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}



                {/* Integration Info Badge */}
                <div className="p-4 rounded-xl bg-slate-50 border border-gray-100 flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[10px] font-bold text-gray-400 leading-snug font-sans">
                    Butuh dokumen fisik lengkap dalam format PDF resminya? Silakan hubungi sekretariat LPH Al-Ghazali Cilacap atau login ke portal SIHALAL BPJPH Kementerian Agama RI.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col items-center justify-center">
              <Scale className="w-16 h-16 text-gray-200 mb-3" />
              <p className="text-sm font-bold text-gray-400">Silakan pilih dokumen regulasi di sebelah kiri untuk melihat rincian.</p>
            </div>
          )}
        </div>
      </div>

      {/* PDF Previewer Modal */}
      {previewState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="text-sm sm:text-base font-black tracking-tight truncate max-w-[200px] sm:max-w-md lg:max-w-2xl text-white">
                  {previewState.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = previewState.url;
                    link.download = `${previewState.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="p-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs flex items-center gap-1.5 transition-all text-white cursor-pointer"
                  title="Unduh File PDF ini"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh
                </button>
                <button
                  onClick={() => {
                    if (previewState.isBlob) {
                      URL.revokeObjectURL(previewState.url);
                    }
                    setPreviewState(null);
                  }}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document body / iframe */}
            <div className="flex-1 bg-slate-100 flex items-center justify-center p-0 relative overflow-hidden">
              <iframe
                src={`${previewState.url}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title="Pratinjau PDF"
              />
            </div>
            
            {/* Footer containing help text */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-between items-center text-[10px] font-bold text-slate-400">
              <span>* Gunakan kontrol navigasi di atas PDF untuk zoom, print, atau rotasi.</span>
              <span>LPH Al-Ghazali Cilacap</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
