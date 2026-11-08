const fs = require('fs');
let code = fs.readFileSync('src/views/MedicalHistory.tsx', 'utf8');

// 1. subtitle logic
const labelsSubtitleRegex = /subtitle:\s*t\.history_subtitle\s*\|\|[\s\S]*?(?=\s*searchPlaceholder:)/;
code = code.replace(labelsSubtitleRegex, `subtitle: "",\n    searchPlaceholder:`);

const filteredItemsRegex = /const filteredItems = useMemo\(\(\) => \{[\s\S]*?\}, \[historyItems, activeFilter, searchQuery, language\]\);/;
const filteredItemsMatch = code.match(filteredItemsRegex);
if(filteredItemsMatch) {
  // we will insert subtitle computation later
}

// 2. Add Plus icon to imports
code = code.replace(/Trash2,\n} from "lucide-react";/, "Trash2,\n  Plus,\n  Settings2,\n  Camera,\n  Upload,\n  Edit3,\n} from \"lucide-react\";");

// 3. Horizontal tabs padding and fade
code = code.replace(/<div className="flex gap-1\.5 overflow-x-auto pb-1 scrollbar-none">/, `<div className="relative"><div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none pr-8">`);
code = code.replace(/className={\`px-4 py-2 rounded-xl/g, 'className={`px-[14px] py-[10px] rounded-xl');
// inject the fade right after the closing div of tabs
code = code.replace(/<\/div>\s*<\/div>\s*\{\/\* Main List Area \*\/\}/, '</div><div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#F8F9FF] to-transparent pointer-events-none" /></div>\n      </div>\n\n      {/* Main List Area */}');

// 4. Update title logic for "X записи"
code = code.replace(/<p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pb-1">\s*\{labels\.subtitle\}\s*<\/p>/, 
  `<p className="text-[13px] text-[#757575] mt-1 pb-1">
          {historyItems.length > 0 ? (language === 'ru' ? \`\${historyItems.length} записи · последняя \${new Date(historyItems[0].date).toLocaleDateString(language, {day: 'numeric', month: 'short', year: 'numeric'})}\` : \`\${historyItems.length} records · latest \${new Date(historyItems[0].date).toLocaleDateString(language, {day: 'numeric', month: 'short', year: 'numeric'})}\`) : labels.subtitle}
        </p>`);

// 5. Update Search placeholder and add Filter button
code = code.replace(
  /placeholder=\{labels\.searchPlaceholder\}/, 
  `placeholder={language === 'ru' ? "Поиск по показателям, врачам, симптомам..." : "Search by parameters, doctors, or symptoms..."}`
);
code = code.replace(
  /<div className="relative">\s*<div className="absolute inset-y-0 left-3\.5 flex items-center/,
  `<div className="flex gap-2">\n          <div className="relative flex-1">\n          <div className="absolute inset-y-0 left-3.5 flex items-center`
);
code = code.replace(
  /onChange=\{\(e\) => setSearchQuery\(e\.target\.value\)\}\s*\/>\s*<\/div>/,
  `onChange={(e) => setSearchQuery(e.target.value)}\n            />\n          </div>\n          <button className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 hover:text-medical-blue transition-colors shrink-0">\n            <Settings2 size={20} />\n          </button>\n        </div>`
);

// 6. Sticky date dividers and tags logic
code = code.replace(/<div className="flex-1 overflow-y-auto p-4 space-y-3\.5 content-area pb-28">/, `<div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 content-area pb-28 relative flex flex-col">`);

const mapReplacementStr = `
          {filteredItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center justify-center m-4 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
                <ClipboardList size={28} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-1">
                {labels.emptyHistory}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-400 max-w-[260px] leading-relaxed mb-6">
                {labels.emptyHistoryDesc}
              </p>
              <button
                onClick={() => setActiveTab("scan")}
                className="px-5 py-2.5 bg-medical-blue/10 hover:bg-medical-blue/20 text-medical-blue rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {isRu ? "Сканировать" : "Capture Now"}
              </button>
            </div>
          ) : (
            Object.entries(filteredItems.reduce((acc, item) => {
              const dateObj = new Date(item.date);
              const monthYear = dateObj.toLocaleDateString(language, { month: 'long', year: 'numeric' });
              const formattedDate = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
              if (!acc[formattedDate]) acc[formattedDate] = [];
              acc[formattedDate].push(item);
              return acc;
            }, {} as Record<string, any[]>)).map(([dateGroup, items]) => (
              <div key={dateGroup} className="flex flex-col">
                <div className="sticky top-0 z-20 px-4 py-2 bg-[#F8F9FF] text-[12px] font-semibold text-[#9E9E9E] border-y border-slate-100/50">
                  {dateGroup}
                </div>
                <div className="flex flex-col gap-3.5 p-4 relative">
                  {(items as any[]).map((item, index) => {
`;
code = code.replace(/\{filteredItems\.length === 0 \? \([\s\S]*?\) : \(\s*filteredItems\.map\(\(item\) => \{/m, mapReplacementStr);

// Close out the reduce map
code = code.replace(/return \(\s*<div \s*key=\{item\.id\}/, `return (\n                <div \n                  key={item.id}`);
code = code.replace(/\{isExpanded && \(\s*<motion\.div/g, `{isExpanded && (\n                      <motion.div`);

const closeMapRegex = /<\/div>\n\s*\);\n\s*\}\)\n\s*\)}/m;
code = code.replace(closeMapRegex, `                </div>\n              );\n            })}\n          </div>\n        </div>\n      ))\n    )}`);

// Tags styling
code = code.replace(/<span className="bg-purple-100 dark:bg-purple-950\/50 text-purple-700 dark:text-purple-400 font-bold text-\[9px\] uppercase tracking-wider px-1\.5 py-0\.5 rounded-full">/, `<span className="bg-[#F3E5F5] text-[#7B1FA2] font-medium text-[10px] px-2 py-0.5 rounded-full">`);
code = code.replace(/\{isRu \? 'Консилиум ИИ' : 'AI Consilium'\}/, `{isRu ? 'Консилиум ИИ' : 'AI Consilium'}`);

code = code.replace(/<span className="bg-blue-100 dark:bg-blue-950\/50 text-blue-700 dark:text-blue-400 font-bold text-\[9px\] uppercase tracking-wider px-1\.5 py-0\.5 rounded-full">/, `<span className="bg-[#E8F4FD] text-[#0288D1] font-medium text-[10px] px-2 py-0.5 rounded-full">`);
code = code.replace(/\{isRu \? 'Сканер ИИ' : 'AI Scanner'\}/, `{isRu ? 'Сканер ИИ' : 'AI Scanner'}`);

// Add FAB and Bottom Sheet state
code = code.replace(/const \[confirmDeleteId, setConfirmDeleteId\] = useState<string \| null>\(null\);/, `const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);\n  const [showAddSheet, setShowAddSheet] = useState(false);`);

// the gradient fade over cards at the bottom "fade снизу контента"
// we can add a fixed element
code = code.replace(/<\/div>\n\s*<\/div>\n\s*\);\n\s*\}\n\s*export default MedicalHistory;/m, 
`      <div className="fixed bottom-[80px] sm:bottom-[90px] left-0 right-0 h-12 bg-gradient-to-t from-[#F8F9FF] to-transparent pointer-events-none z-10" />
      </div>

      <div 
        className="fixed bottom-24 right-4 z-40 bg-[#3D5AFE] w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(61,90,254,0.4)] cursor-pointer hover:bg-blue-600 transition-colors"
        onClick={() => setShowAddSheet(true)}
      >
        <Plus size={24} />
      </div>

      <AnimatePresence>
        {showAddSheet && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddSheet(false);
            }}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full rounded-t-3xl p-6 pb-12 flex flex-col gap-4 relative"
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#E0E0E0] rounded-full" />
              <h3 className="text-lg font-bold text-slate-800 mt-2 mb-2">
                {language === 'ru' ? 'Добавить запись' : 'Add Record'}
              </h3>
              
              <button onClick={() => { setShowAddSheet(false); setActiveTab("scan"); }} className="w-full flex items-center gap-3 p-4 border border-slate-100 rounded-2xl text-left hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-[#3D5AFE] flex items-center justify-center">
                  <Camera size={20} />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{language === 'ru' ? 'Сканировать документ' : 'Scan Document'}</div>
                  <div className="text-[11px] text-slate-500">{language === 'ru' ? 'ИИ распознает данные с фото' : 'AI extracts data from photo'}</div>
                </div>
              </button>

              <button onClick={() => { setShowAddSheet(false); document.getElementById('file-upload-history')?.click(); }} className="w-full flex items-center gap-3 p-4 border border-slate-100 rounded-2xl text-left hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{language === 'ru' ? 'Загрузить файл' : 'Upload File'}</div>
                  <div className="text-[11px] text-slate-500">{language === 'ru' ? 'PDF или изображение из галереи' : 'PDF or image from gallery'}</div>
                </div>
                <input type="file" id="file-upload-history" className="hidden" accept="image/*,.pdf" />
              </button>

              <button onClick={() => setShowAddSheet(false)} className="w-full flex items-center gap-3 p-4 border border-slate-100 rounded-2xl text-left hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Edit3 size={20} />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{language === 'ru' ? 'Ввести вручную' : 'Enter Manually'}</div>
                  <div className="text-[11px] text-slate-500">{language === 'ru' ? 'Заполнить форму самостоятельно' : 'Fill the form yourself'}</div>
                </div>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default MedicalHistory;
`);

fs.writeFileSync('src/views/MedicalHistory.tsx', code);
