const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/\/\* CSS untuk membuat struktur pohon \(Tree\) \*\/[\s\S]*?(?=\.scrollbar-thin)/, '');
css = css.replace(/\.tree-card[\s\S]*/, ''); // removes tree-card and everything after
fs.writeFileSync('src/index.css', css, 'utf8');

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const treeReplacement = `
            <div className="relative mx-auto mt-10 w-full max-w-4xl">
               <div className="bg-white shadow-xl border border-gray-200 p-6 sm:p-12 mb-10 w-full max-w-[8.5in] min-h-[13in] mx-auto rounded-sm relative overflow-hidden">
                    {/* Title inside the form paper */}
                    <div className="text-center mb-8 border-b-2 border-emerald-800 pb-6">
                        <Logo className="h-16 w-16 mx-auto mb-4" />
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 uppercase tracking-wide">STRUKTUR ORGANISASI</h1>
                        <h2 className="text-lg sm:text-xl font-bold text-emerald-700 uppercase tracking-widest mt-1">Lembaga Pemeriksa Halal (LPH) Al-Ghazali</h2>
                    </div>

                    <div className="pl-2 sm:pl-8">
                        {/* Tree Container (Directory Style) */}
                        <div className="relative border-l-2 border-emerald-600 pb-4">
                            
                            {/* Dewan Pembina LPH */}
                            <div className="relative mb-6">
                                <div className="absolute top-6 -left-[2px] w-8 border-b-2 border-emerald-600"></div>
                                <div className="ml-12 inline-block bg-white border-2 border-emerald-700 rounded-lg p-4 w-64 shadow-md z-10 relative">
                                    <h3 className="font-bold text-lg text-emerald-900">Dewan Pembina LPH</h3>
                                    <div className="w-full h-px bg-emerald-200 my-2"></div>
                                    <p className="text-sm font-bold text-emerald-700">Dr. A. Luthfi Hamidi, M.Ag.</p>
                                </div>
                            </div>

                            {/* Direktur LPH */}
                            <div className="relative mb-6">
                                <div className="absolute top-6 -left-[2px] w-8 border-b-2 border-emerald-600"></div>
                                <div className="ml-12 inline-block bg-white border-2 border-emerald-700 rounded-lg p-4 w-64 shadow-md z-10 relative">
                                    <h3 className="font-bold text-lg text-emerald-900">Direktur LPH</h3>
                                    <div className="w-full h-px bg-emerald-200 my-2"></div>
                                    <p className="text-sm font-bold text-emerald-700">H. Shoiman Nawawi, S.H.I., M.H.</p>
                                </div>
                                
                                {/* Children of Direktur */}
                                <div className="relative ml-16 mt-6 border-l-2 border-emerald-400 pb-2">
                                    
                                    {/* Komite Ketidakberpihakan */}
                                    <div className="relative mb-5">
                                         <div className="absolute top-6 -left-[2px] w-6 border-b-2 border-emerald-400"></div>
                                         <div className="ml-10 inline-block bg-white border border-emerald-500 rounded-lg p-3 sm:p-4 w-60 sm:w-72 shadow-sm z-10 relative hover:bg-emerald-50 transition-colors">
                                             <h3 className="font-bold text-emerald-800 text-sm">Komite Ketidakberpihakan</h3>
                                             <div className="w-full h-px bg-emerald-100 my-2"></div>
                                             <ol className="text-xs text-gray-700 text-left list-decimal pl-4 space-y-1">
                                                 <li>Istikharoh, M.H.</li>
                                                 <li>Rindrayatni, S.Kep., Ners.</li>
                                                 <li>Abdul Haq, M.Cs.</li>
                                             </ol>
                                         </div>
                                    </div>

                                    {/* Komite Banding */}
                                    <div className="relative mb-5">
                                         <div className="absolute top-6 -left-[2px] w-6 border-b-2 border-emerald-400"></div>
                                         <div className="ml-10 inline-block bg-white border border-emerald-500 rounded-lg p-3 sm:p-4 w-60 sm:w-72 shadow-sm z-10 relative hover:bg-emerald-50 transition-colors">
                                             <h3 className="font-bold text-emerald-800 text-sm">Komite Banding</h3>
                                             <div className="w-full h-px bg-emerald-100 my-2"></div>
                                             <p className="text-sm font-semibold text-gray-700 mt-2">Dr. Misbah Khusurur, M.Si.</p>
                                         </div>
                                    </div>

                                    {/* Sekretaris */}
                                    <div className="relative mb-5">
                                         <div className="absolute top-6 -left-[2px] w-6 border-b-2 border-emerald-400"></div>
                                         <div className="ml-10 inline-block bg-white border border-emerald-500 rounded-lg p-3 sm:p-4 w-60 sm:w-72 shadow-sm z-10 relative hover:bg-emerald-50 transition-colors">
                                             <h3 className="font-bold text-emerald-800 text-sm">Sekretaris</h3>
                                             <div className="w-full h-px bg-emerald-100 my-2"></div>
                                             <p className="text-sm font-semibold text-gray-700 mt-2">Fathurrohman, S.H.</p>
                                         </div>
                                    </div>

                                    {/* Manajer Mutu */}
                                    <div className="relative mb-5">
                                         <div className="absolute top-6 -left-[2px] w-6 border-b-2 border-emerald-400"></div>
                                         <div className="ml-10 inline-block bg-white border border-emerald-500 rounded-lg p-3 sm:p-4 w-60 sm:w-72 shadow-sm z-10 relative hover:bg-emerald-50 transition-colors">
                                             <h3 className="font-bold text-emerald-800 text-sm">Manajer Mutu</h3>
                                             <div className="w-full h-px bg-emerald-100 my-2"></div>
                                             <p className="text-sm font-semibold text-gray-700 mt-2">Rahmatulloh, S.Sy., M.E.</p>
                                         </div>
                                    </div>

                                    {/* Manajer Operasional */}
                                    <div className="relative mb-5">
                                         <div className="absolute top-6 -left-[2px] w-6 border-b-2 border-emerald-400"></div>
                                         <div className="ml-10 inline-block bg-emerald-50 border border-emerald-500 rounded-lg p-3 sm:p-4 w-60 sm:w-72 shadow-sm z-10 relative">
                                             <h3 className="font-bold text-emerald-800 text-sm">Manajer Operasional</h3>
                                             <div className="w-full h-px bg-emerald-200 my-2"></div>
                                             <p className="text-sm font-semibold text-gray-700 mt-2">Christian Soolany, S.TP., M.Si.</p>
                                         </div>

                                         {/* Children of Manajer Operasional */}
                                         <div className="relative ml-16 mt-4 border-l-2 border-emerald-200 pb-2">
                                             
                                             {/* SDM Syariah */}
                                             <div className="relative mb-4">
                                                 <div className="absolute top-5 -left-[2px] w-6 border-b-2 border-emerald-200"></div>
                                                 <div className="ml-10 inline-block bg-white border border-emerald-300 rounded-lg p-3 w-52 sm:w-64 shadow-sm z-10 relative">
                                                     <h3 className="font-bold text-emerald-700 text-sm">SDM Syariah</h3>
                                                     <div className="w-full h-px bg-emerald-50 my-2"></div>
                                                     <ol className="text-xs text-gray-700 text-left list-decimal pl-4 space-y-1">
                                                         <li>H. Fatah Rosihan Affandi, S.Fil.I., M.M.</li>
                                                         <li>Syaefudin Zuhri, S.Ag.</li>
                                                     </ol>
                                                 </div>
                                             </div>

                                             {/* Auditor Halal */}
                                             <div className="relative mb-4">
                                                 <div className="absolute top-5 -left-[2px] w-6 border-b-2 border-emerald-200"></div>
                                                 <div className="ml-10 inline-block bg-white border border-emerald-300 rounded-lg p-3 w-52 sm:w-64 shadow-sm z-10 relative">
                                                     <h3 className="font-bold text-emerald-700 text-sm">Auditor Halal</h3>
                                                     <div className="w-full h-px bg-emerald-50 my-2"></div>
                                                     <ol className="text-xs text-gray-700 text-left list-decimal pl-4 space-y-1">
                                                         <li>Siti Khuzaimah, S.T., M.T.</li>
                                                         <li>dr. Atingul Marifah</li>
                                                         <li>Anisha Dian Iswahyuni, S.T., M.Sc.</li>
                                                     </ol>
                                                 </div>
                                             </div>

                                             {/* Evaluator LPH */}
                                             <div className="relative mb-4">
                                                 <div className="absolute top-5 -left-[2px] w-6 border-b-2 border-emerald-200"></div>
                                                 <div className="ml-10 inline-block bg-white border border-emerald-300 rounded-lg p-3 w-52 sm:w-64 shadow-sm z-10 relative">
                                                     <h3 className="font-bold text-emerald-700 text-sm">Evaluator LPH</h3>
                                                     <div className="w-full h-px bg-emerald-50 my-2"></div>
                                                     <p className="text-xs font-semibold text-gray-700 mt-2">Fathurrohman, S.H.</p>
                                                 </div>
                                             </div>

                                             {/* Petugas Pengambil Sample */}
                                             <div className="relative mb-4">
                                                 <div className="absolute top-5 -left-[2px] w-6 border-b-2 border-emerald-200"></div>
                                                 <div className="ml-10 inline-block bg-white border border-emerald-300 rounded-lg p-3 w-52 sm:w-64 shadow-sm z-10 relative">
                                                     <h3 className="font-bold text-emerald-700 text-sm">Petugas Pengambil Sample</h3>
                                                     <div className="w-full h-px bg-emerald-50 my-2"></div>
                                                     <ol className="text-xs text-gray-700 text-left list-decimal pl-4 space-y-1">
                                                         <li>Siti Khuzaimah, S.T., M.T.</li>
                                                         <li>dr. Atingul Marifah</li>
                                                         <li>Anisha Dian Iswahyuni, S.T., M.Sc.</li>
                                                     </ol>
                                                 </div>
                                             </div>

                                         </div>
                                    </div>

                                    {/* Manajer Keuangan */}
                                    <div className="relative mb-5">
                                         <div className="absolute top-6 -left-[2px] w-6 border-b-2 border-emerald-400"></div>
                                         <div className="ml-10 inline-block bg-white border border-emerald-500 rounded-lg p-3 sm:p-4 w-60 sm:w-72 shadow-sm z-10 relative hover:bg-emerald-50 transition-colors">
                                             <h3 className="font-bold text-emerald-800 text-sm">Manajer Keuangan</h3>
                                             <div className="w-full h-px bg-emerald-100 my-2"></div>
                                             <p className="text-sm font-semibold text-gray-700 mt-2">Siti Khuzaimah, S.T., M.T.</p>
                                         </div>
                                    </div>

                                    {/* Pengelola LPH */}
                                    <div className="relative mb-5">
                                         <div className="absolute top-6 -left-[2px] w-6 border-b-2 border-emerald-400"></div>
                                         <div className="ml-10 inline-block bg-white border border-emerald-500 rounded-lg p-3 sm:p-4 w-60 sm:w-72 shadow-sm z-10 relative hover:bg-emerald-50 transition-colors">
                                             <h3 className="font-bold text-emerald-800 text-sm">Pengelola LPH</h3>
                                             <div className="w-full h-px bg-emerald-100 my-2"></div>
                                             <p className="text-sm font-semibold text-gray-700 mt-2">Mukti Ali, S.Pd.</p>
                                         </div>
                                    </div>
                                    
                                </div>
                            </div>
                        </div>
                    </div>
               </div>
            </div>`;

const startIndex = content.indexOf('<div className="relative mx-auto mt-10 w-full">');
const endIndex = content.indexOf('</section>', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex) + treeReplacement + '\n        </div>\n      </section>' + content.substring(endIndex + 10);
    fs.writeFileSync(path, newContent, 'utf8');
} else {
    console.log('Could not find tree bounds');
}
