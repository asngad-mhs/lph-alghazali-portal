const fs = require('fs');

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// The lines we want to extract
const lines = content.split('\n');
const treeContent = lines.slice(1659, 1803).join('\n'); // 1660 to 1803 in 1-based index

const targetSection = `
      {/* Struktur Organisasi Section */}
      <section id="struktur-organisasi" className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-[100vw] mx-auto overflow-hidden px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <Logo className="h-16 w-16 mx-auto mb-4" />
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-wide mb-2 uppercase">STRUKTUR ORGANISASI</h1>
                <div className="inline-block bg-emerald-100 px-6 py-2 rounded-full">
                    <h3 className="text-lg font-semibold text-emerald-700">Lembaga Pemeriksa Halal (LPH) Al-Ghazali</h3>
                </div>
            </div>
            
            <div className="relative mx-auto mt-10 overflow-x-auto pb-8">
${treeContent}
            </div>
        </div>
      </section>
`;

// Insert after profil section
content = content.replace(
  '      {/* Keunggulan / Layanan Section */}',
  targetSection + '\n\n      {/* Keunggulan / Layanan Section */}'
);

content = content.replace('const [isStrukturPdfOpen, setIsStrukturPdfOpen] = useState(false);\n', '');

content = content.replace(
  '<button onClick={() => setIsStrukturPdfOpen(true)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">\n                    <Network className="w-4 h-4 mr-2" /> Struktur Organisasi\n                  </button>',
  '<a href="#struktur-organisasi" className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center border-b border-gray-50">\n                    <Network className="w-4 h-4 mr-2" /> Struktur Organisasi\n                  </a>'
);

content = content.replace(
  '<button onClick={() => { setIsStrukturPdfOpen(true); setIsMobileMenuOpen(false); }} className="w-full text-left py-1 text-sm text-gray-600 hover:text-emerald-600">Struktur Organisasi</button>',
  '<a href="#struktur-organisasi" onClick={() => setIsMobileMenuOpen(false)} className="block py-1 text-sm text-gray-600 hover:text-emerald-600">Struktur Organisasi</a>'
);

const startIdx = content.indexOf('{isStrukturPdfOpen && (');
if (startIdx !== -1) {
  const endMarker = 'Tutup Dokumen\n              </button>\n            </div>\n          </div>\n        </div>\n      )}';
  const endIdx = content.indexOf(endMarker, startIdx);
  if (endIdx !== -1) {
    content = content.substring(0, startIdx) + content.substring(endIdx + endMarker.length);
  } else {
    console.log('End marker not found');
  }
} else {
  console.log('Start marker not found');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');
