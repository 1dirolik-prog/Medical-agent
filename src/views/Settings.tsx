import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHealth } from '../HealthContext';
import { clearAllData } from '../services/storage';
import { Shield, Globe, Moon, Ruler, LogOut, ChevronRight, Brain, X, ArrowLeft, Download, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const Settings = () => {
  const { 
    t, 
    language, 
    setLanguage, 
    appTheme, 
    setAppTheme, 
    setActiveTab, 
    previousTab, 
    exportBackupData, 
    importBackupData,
    aiSettings, 
    setAiSettings 
  } = useHealth();
  const [showAiModal, setShowAiModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pendingImportData, setPendingImportData] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLanguageChange = () => {
    const langs: ('en' | 'ru' | 'de' | 'pl' | 'es')[] = ['en', 'ru', 'de', 'pl', 'es'];
    const currentIndex = langs.indexOf(language as any);
    const nextIndex = (currentIndex + 1) % langs.length;
    setLanguage(langs[nextIndex]);
  };

  const handleThemeChange = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(appTheme as any);
    const nextIndex = (currentIndex + 1) % themes.length;
    setAppTheme(themes[nextIndex] as any);
  };

  const displayTheme = appTheme === 'system' ? t.theme_system || 'System' : appTheme === 'dark' ? t.theme_dark || 'Dark' : t.theme_light || 'Light';

  const handleExportBackup = () => {
    try {
      const dataToExport = exportBackupData();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `family_medical_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBackupMessage({
        text: language === 'ru' 
          ? 'Резервная копия успешно экспортирована в JSON файл.' 
          : 'Backup successfully exported to JSON file.',
        type: 'success'
      });
    } catch (e) {
      setBackupMessage({
        text: language === 'ru' ? 'Ошибка при создании резервной копии.' : 'Error exporting backup data.',
        type: 'error'
      });
    }
    setTimeout(() => setBackupMessage(null), 4500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON');
        }
        setPendingImportData(parsed);
      } catch (err) {
        setBackupMessage({
          text: language === 'ru' ? 'Неверный формат файла резервной копии.' : 'Invalid backup file format.',
          type: 'error'
        });
        setTimeout(() => setBackupMessage(null), 4500);
      }
    };
    reader.readAsText(file);
    // Reset file input value so user can re-upload if needed
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!pendingImportData) return;
    const success = importBackupData(pendingImportData);
    setPendingImportData(null);

    if (success) {
      setBackupMessage({
        text: language === 'ru' ? 'Данные успешно восстановлены из копии!' : 'Data successfully restored from backup!',
        type: 'success'
      });
    } else {
      setBackupMessage({
        text: language === 'ru' ? 'Не удалось восстановить данные из файла.' : 'Failed to restore data from backup file.',
        type: 'error'
      });
    }
    setTimeout(() => setBackupMessage(null), 4500);
  };

  return (
    <div className="p-4 space-y-4 bg-[#F4F6FB] dark:bg-slate-900 min-h-full pb-28 relative">
      <div className="flex items-center gap-3 mb-4 px-2">
        <button 
          onClick={() => setActiveTab(previousTab || 'home')} 
          className="p-2 -ml-2 text-slate-700 dark:text-slate-200 hover:text-medical-blue hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-[20px] font-bold text-slate-900 dark:text-white">{t.settings || 'Настройки'}</h2>
      </div>

      <div className="space-y-4">
        <section className="space-y-0">
           <h4 className="text-[13px] font-semibold text-[#546E7A] dark:text-slate-400 pt-6 pb-2 px-2">{language === 'ru' ? 'Интерфейс' : 'Interface'}</h4>
           <div className="card-android overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] !p-0">
             <SettingItem 
               icon={<Globe size={18} />} 
               label={t.language} 
               value={language.toUpperCase()} 
               onClick={handleLanguageChange}
             />
             <SettingItem 
               icon={<Moon size={18} />} 
               label={t.theme} 
               value={displayTheme} 
               onClick={handleThemeChange}
             />
             <SettingItem 
               icon={<Ruler size={18} />} 
               label={t.units} 
               value={language === 'ru' ? 'Метрическая (СИ)' : 'Metric (SI)'} 
               isLast 
             />
           </div>
        </section>

        <section className="space-y-0">
           <h4 className="text-[13px] font-semibold text-[#546E7A] dark:text-slate-400 pt-6 pb-2 px-2">{language === 'ru' ? 'Нейросеть (AI)' : 'AI Settings'}</h4>
           <div className="card-android overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] !p-0">
             <SettingItem 
               icon={<Brain size={18} />} 
               label={language === 'ru' ? 'AI Провайдер' : 'AI Provider'} 
               subtitle={language === 'ru' ? 'Обрабатывает ваши медданные' : 'Processes your medical data'}
               value={aiSettings.provider === 'custom' ? (aiSettings.customModel || 'Custom AI') : 'Google Gemini'} 
               valueColorClass={aiSettings.provider === 'custom' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' : undefined}
               onClick={() => setShowAiModal(true)} 
               isLast
             />
           </div>
        </section>

        <section className="space-y-0">
           <h4 className="text-[13px] font-semibold text-[#546E7A] dark:text-slate-400 pt-6 pb-2 px-2">
             {language === 'ru' ? 'Безопасность и Резервное копирование' : 'Security & Backup'}
           </h4>
           <div className="card-android overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] !p-0">
             <div className="p-4 min-h-[52px] flex items-center justify-between border-b border-slate-100 dark:border-slate-750">
                <div className="flex items-center gap-3">
                   <div className="text-slate-400"><Shield size={18} /></div>
                   <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{t.data_enc}</span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                         <Shield size={10} /> {language === 'ru' ? 'Данные защищены на устройстве (Local Sandbox)' : 'Data is protected on device (Local Sandbox)'}
                      </span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                     Active
                   </span>
                </div>
             </div>
             <SettingItem 
               icon={<Download size={18} className="text-medical-blue" />} 
               label={language === 'ru' ? 'Экспорт резервной копии (JSON)' : 'Export Backup (JSON)'} 
               subtitle={language === 'ru' ? 'Сохранить все профили и медкарту в файл' : 'Save all profiles and health history to file'}
               onClick={handleExportBackup}
             />
             <SettingItem 
               icon={<Upload size={18} className="text-indigo-500" />} 
               label={language === 'ru' ? 'Восстановление из копии (JSON)' : 'Restore from Backup (JSON)'} 
               subtitle={language === 'ru' ? 'Загрузить сохранённую медкарту из файла' : 'Load saved medical history from JSON file'}
               onClick={() => fileInputRef.current?.click()}
               isLast
             />
           </div>

           <input 
             type="file" 
             ref={fileInputRef} 
             accept=".json,application/json" 
             onChange={handleFileSelect} 
             className="hidden" 
           />

           {backupMessage && (
             <motion.div 
               initial={{ opacity: 0, y: -4 }}
               animate={{ opacity: 1, y: 0 }}
               className={`text-xs font-bold text-center mt-3 p-2.5 rounded-xl border flex items-center justify-center gap-2 ${
                 backupMessage.type === 'success' 
                   ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                   : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40'
               }`}
             >
               {backupMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
               {backupMessage.text}
             </motion.div>
           )}
        </section>

        <section className="space-y-0">
           <h4 className="text-[13px] font-semibold text-[#546E7A] dark:text-slate-400 pt-6 pb-2 px-2">{language === 'ru' ? 'Аккаунт' : 'Account'}</h4>
           <div className="card-android overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] !p-0">
             <div 
               onClick={() => setShowDeleteConfirm(true)}
               className="p-4 min-h-[52px] flex items-center justify-between text-[#FF5252] cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
             >
                <div className="flex items-center gap-3">
                   <LogOut size={18} />
                   <span className="font-bold text-sm">{t.delete_data}</span>
                </div>
                <ChevronRight size={18} />
             </div>
           </div>
        </section>
      </div>

      <div className="text-center pt-8 pb-12">
        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Family Medical AI Agent</p>
        <p className="text-[10px] text-slate-300 uppercase">Version 1.0.4 - Production Beta</p>
      </div>

      <div className="fixed bottom-[80px] sm:bottom-[90px] left-0 right-0 h-16 bg-gradient-to-t from-[#F4F6FB] dark:from-slate-900 to-transparent pointer-events-none z-10" />

      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-white">AI Provider Settings</h3>
              <button onClick={() => setShowAiModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{language === 'ru' ? 'Выбор провайдера' : 'Select Provider'}</label>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setAiSettings({...aiSettings, provider: 'gemini'})} className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-colors ${aiSettings.provider === 'gemini' ? 'bg-medical-blue text-white border-medical-blue' : 'bg-transparent text-slate-600 border-slate-200 dark:border-slate-700 dark:text-slate-300'}`}>
                    Google Gemini
                  </button>
                  <button onClick={() => setAiSettings({...aiSettings, provider: 'custom'})} className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-colors ${aiSettings.provider === 'custom' ? 'bg-medical-blue text-white border-medical-blue' : 'bg-transparent text-slate-600 border-slate-200 dark:border-slate-700 dark:text-slate-300'}`}>
                     Custom (API)
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {language === 'ru' ? 'Вы можете использовать стороннюю модель, например QVAC MedPsy, указав параметры OpenAI-совместимого API (OpenRouter, HuggingFace, и т.д.).' : 'You can use a 3rd party model like QVAC MedPsy by providing an OpenAI-compatible API endpoint.'}
                </p>
              </div>

              {aiSettings.provider === 'custom' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500">API Base URL</label>
                    <input 
                      type="text" 
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-medical-blue dark:text-white" 
                      placeholder="https://openrouter.ai/api/v1"
                      value={aiSettings.customUrl || ''}
                      onChange={e => setAiSettings({...aiSettings, customUrl: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">API Key</label>
                    <input 
                      type="password" 
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-medical-blue dark:text-white" 
                      placeholder="sk-..."
                      value={aiSettings.customKey || ''}
                      onChange={e => setAiSettings({...aiSettings, customKey: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Model Name</label>
                    <input 
                      type="text" 
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-medical-blue dark:text-white" 
                      placeholder="qvac/medpsy-72b or your-model"
                      value={aiSettings.customModel || ''}
                      onChange={e => setAiSettings({...aiSettings, customModel: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
               <button onClick={() => setShowAiModal(false)} className="w-full bg-medical-blue text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors cursor-pointer">
                 {t.save || 'Save'}
               </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingImportData !== null}
        onClose={() => setPendingImportData(null)}
        onConfirm={handleConfirmImport}
        title={language === 'ru' ? 'Восстановить данные из резервной копии?' : 'Restore Data from Backup?'}
        description={
          language === 'ru'
            ? `В файле обнаружено членов семьи: ${pendingImportData?.members?.length || 1}. Текущие записи будут заменены данными из резервной копии. Продолжить?`
            : `Detected ${pendingImportData?.members?.length || 1} profile(s). Current data will be replaced with backup data. Continue?`
        }
        confirmText={language === 'ru' ? 'Восстановить' : 'Restore'}
        cancelText={language === 'ru' ? 'Отмена' : 'Cancel'}
      />

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative border border-slate-100 dark:border-slate-700 z-[120]"
            >
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                {language === 'ru' ? 'Удалить все данные?' : 'Delete All Data?'}
              </h3>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-6">
                {language === 'ru'
                  ? 'Вы уверены, что хотите полностью стереть все данные приложения? Это действие необратимо.'
                  : 'Are you sure you want to completely wipe all application data? This action is irreversible.'}
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  {language === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await clearAllData();
                    window.location.reload();
                  }}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 dark:bg-red-500/90 dark:hover:bg-red-500 text-white rounded-xl text-sm font-bold shadow-md shadow-red-500/15 transition-colors"
                >
                  {language === 'ru' ? 'Удалить' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SettingItem = ({ icon, label, subtitle, value, valueColorClass, hideChevron, onClick, isLast }: any) => (
  <div onClick={onClick} className={`p-4 min-h-[52px] flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors ${!isLast ? 'border-b border-slate-100 dark:border-slate-750' : ''}`}>
     <div className="flex flex-col">
        <div className="flex items-center gap-3">
           <div className="text-slate-400">{icon}</div>
           <div className="flex flex-col">
              <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{label}</span>
              {subtitle && <span className="text-[11px] text-slate-400 mt-0.5">{subtitle}</span>}
           </div>
        </div>
     </div>
     <div className="flex items-center gap-2 shrink-0">
        {value && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${valueColorClass || 'bg-medical-blue/10 text-medical-blue'}`}>
            {value}
          </span>
        )}
        {!hideChevron && <ChevronRight size={18} className="text-slate-300 dark:text-slate-500" />}
     </div>
  </div>
);

export default Settings;
