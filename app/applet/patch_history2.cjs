const fs = require('fs');
let code = fs.readFileSync('src/views/MedicalHistory.tsx', 'utf8');

// 1. FAB position and padding
code = code.replace(
  'className="flex-1 overflow-y-auto bg-[#F8F9FF] dark:bg-slate-900 content-area pb-28 relative flex flex-col"',
  'className="flex-1 overflow-y-auto bg-[#F4F6FB] dark:bg-slate-900 content-area pb-[80px] relative flex flex-col"'
);

// 2. Tab Right Fade & Background
code = code.split('from-[#F8F9FF] to-transparent').join('from-[#F4F6FB] to-transparent');

// Replace the right tab fade section
code = code.split('<div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#F4F6FB] to-transparent pointer-events-none" />').join('<div className="absolute right-0 top-0 bottom-0 w-[40px] bg-gradient-to-l from-[#F4F6FB] dark:from-slate-900 to-transparent pointer-events-none" />');

// Replace Date Headers Sticky Group
code = code.split('className="sticky top-0 z-20 px-4 py-2 bg-[#F8F9FF]/95 backdrop-blur-sm text-[12px] font-semibold text-[#9E9E9E] border-y border-slate-100/50"').join('className="sticky top-0 z-20 bg-[#F4F6FB] dark:bg-slate-900 text-[13px] font-semibold text-[#546E7A] dark:text-slate-400 pt-6 pb-2 pl-4"');

// Search field width:
code = code.split('<div className="relative flex-1">').join('<div className="relative flex-1 min-w-0" style={{ flex: 1 }}>');

code = code.split('<button className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 hover:text-medical-blue transition-colors shrink-0">').join('<button className={`w-[44px] h-[44px] shrink-0 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center transition-colors bg-white dark:bg-slate-900 relative ${activeFilter !== "all" ? "text-[#3D5AFE]" : "text-[#9E9E9E]"}`}>\n            {activeFilter !== "all" && <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#3D5AFE] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 leading-none">1</div>}');

if (!code.includes('const getPluralTitle')) {
  code = code.replace(
    'const MedicalHistory: React.FC = () => {',
    `const getPluralTitle = (n: number, lang: string) => {
    if (lang !== 'ru') return \`\${n} record\${n !== 1 ? 's' : ''}\`;
    const m10 = n % 10; const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return \`\${n} запись\`;
    if ([2, 3, 4].includes(m10) && ![12, 13, 14].includes(m100)) return \`\${n} записи\`;
    return \`\${n} записей\`;
  };

  const MedicalHistory: React.FC = () => {`
  );
}

code = code.replace(
  "{historyItems.length > 0 ? (language === 'ru' ? `${historyItems.length} записи · последняя ${new Date(historyItems[0].date).toLocaleDateString(language, {day: 'numeric', month: 'short', year: 'numeric'})}` : `${historyItems.length} records · latest ${new Date(historyItems[0].date).toLocaleDateString(language, {day: 'numeric', month: 'short', year: 'numeric'})}`) : labels.subtitle}",
  "{historyItems.length > 0 ? `${getPluralTitle(historyItems.length, language)} · ${language === 'ru' ? 'последняя ' : 'latest '}${new Date(historyItems[0].date).toLocaleDateString(language, {day: 'numeric', month: 'short', year: 'numeric'})}` : labels.subtitle}"
);

// Link Original + AI
code = code.split("${isAIforPreceding ? 'ml-4 border-l-2 border-l-[#3D5AFE]/20' : ''}").join("${isAIforPreceding ? 'ml-4 border-l-2 !border-l-[#E8EAF6] dark:!border-l-slate-700' : ''}");

// Replace Bottom Gradient & FAB
code = code.split('<div className="fixed bottom-[80px] sm:bottom-[90px] left-0 right-0 h-[80px] bg-gradient-to-t from-[#F8F9FF] dark:from-slate-900 to-transparent pointer-events-none z-10" />').join('<div className="fixed bottom-[72px] inset-x-0 mx-auto max-w-md h-[48px] bg-gradient-to-t from-[#F4F6FB] dark:from-slate-900 to-transparent pointer-events-none z-10" />');

code = code.replace(
  /<div \s*\n*\s*className="fixed bottom-24 right-4 z-40 bg-medical-blue w-\[52px\] h-\[52px\] rounded-2xl flex items-center justify-center text-white shadow-\[0_4px_12px_rgba\(61,90,254,0\.4\)\] cursor-pointer hover:bg-blue-600 transition-colors"\s*\n*\s*onClick=\{\(\) => setShowAddSheet\(true\)\}\s*\n*\s*>\s*\n*\s*<Plus size=\{24\} \/>\s*\n*\s*<\/div>/,
  `<div className="fixed bottom-[88px] inset-x-0 mx-auto max-w-md h-[52px] pointer-events-none z-40">
        <div 
          className="absolute right-4 w-[52px] h-[52px] bg-medical-blue rounded-2xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(61,90,254,0.4)] cursor-pointer hover:bg-blue-600 transition-colors pointer-events-auto"
          onClick={() => setShowAddSheet(true)}
        >
          <Plus size={24} />
        </div>
      </div>`
);

fs.writeFileSync('src/views/MedicalHistory.tsx', code);
