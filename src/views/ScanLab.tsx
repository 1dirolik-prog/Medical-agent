import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  FileClock,
  Sparkles,
  Save,
  CheckCircle2,
  FileDown,
  RotateCcw,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { useHealth } from '../HealthContext';
import { extractLabsFromImages } from '../services/gemini';
import { downloadReportAsPdf } from '../services/pdfService';
import {
  processDocumentFiles,
  ProcessedDocumentImage,
} from '../services/imagePreprocessor';
import { ScanDropzone } from '../components/scanner/ScanDropzone';
import { ScanPreviewGallery } from '../components/scanner/ScanPreviewGallery';
import {
  ScanProgressCard,
  ScanStage,
} from '../components/scanner/ScanProgressCard';
import {
  ScanDocumentOverview,
  ScanDocumentMetadata,
} from '../components/scanner/ScanDocumentOverview';
import {
  ScanResultEditor,
  EditableIndicator,
  EditableMedication,
} from '../components/scanner/ScanResultEditor';

export const ScanLab: React.FC = () => {
  const {
    t,
    addLabResult,
    addMedication,
    setActiveTab,
    language,
    activeMember,
    addAIReport,
    aiReports,
    activeMemberId,
    members,
    labResults,
  } = useHealth();

  // Queue of uploaded & compressed document pages
  const [queuedImages, setQueuedImages] = useState<ProcessedDocumentImage[]>([]);
  const [selectedDocHint, setSelectedDocHint] = useState<string | null>(null);

  // Scanning progress state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState<ScanStage>('preparing');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);

  // Extracted Document Data
  const [hasExtractedData, setHasExtractedData] = useState(false);
  const [documentMetadata, setDocumentMetadata] = useState<ScanDocumentMetadata>({
    documentType: 'lab_result',
    documentDate: new Date().toISOString().split('T')[0],
  });
  const [indicators, setIndicators] = useState<EditableIndicator[]>([]);
  const [medications, setMedications] = useState<EditableMedication[]>([]);
  const [hasSaved, setHasSaved] = useState(false);

  const isRu = language === 'ru';

  if (!activeMemberId || members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {isRu ? 'Профиль не выбран' : 'No Profile Selected'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isRu
            ? 'Пожалуйста, выберите или создайте профиль перед сканированием.'
            : 'Please select or create a profile before scanning lab results.'}
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('family')}
          className="px-6 py-3 bg-medical-blue text-white rounded-xl font-bold mt-2 cursor-pointer shadow-md shadow-medical-blue/20"
        >
          {isRu ? 'Перейти к профилям' : 'Go to Profiles'}
        </button>
      </div>
    );
  }

  // Handle newly selected files
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    setScanError(null);
    setHasSaved(false);

    try {
      const processed = await processDocumentFiles(files);
      setQueuedImages((prev) => [...prev, ...processed]);
    } catch (err: any) {
      setScanError(
        isRu
          ? 'Не удалось обработать изображение'
          : 'Failed to process selected images'
      );
    }
  };

  const handleRemoveImage = (id: string) => {
    setQueuedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleClearAll = () => {
    setQueuedImages([]);
    setHasExtractedData(false);
    setIndicators([]);
    setMedications([]);
    setScanError(null);
    setHasSaved(false);
  };

  // Run Medical AI OCR & Analysis
  const handleStartAnalysis = async () => {
    if (queuedImages.length === 0) return;

    setIsScanning(true);
    setScanError(null);
    setScanStage('preparing');
    setScanProgress(15);
    setHasSaved(false);

    try {
      // 1. Build previous history string for comparative dynamics
      let previousHistory = '';
      const memberLabs = labResults[activeMemberId] || [];
      if (memberLabs.length > 0) {
        previousHistory = memberLabs
          .slice(-15)
          .map((l) => `${l.parameter}: ${l.value} ${l.unit} (${l.date})`)
          .join('\n');
      }

      // 2. Prepare payload for Gemini API
      setScanStage('ocr');
      setScanProgress(45);

      const imagesPayload = queuedImages.map((img) => ({
        data: img.data,
        mimeType: img.mimeType,
      }));

      // Simulate step advancement for smooth UI feedback
      const progressTimer = setTimeout(() => {
        setScanStage('analyzing');
        setScanProgress(75);
      }, 1600);

      const resJson = await extractLabsFromImages(
        imagesPayload,
        language,
        previousHistory,
        selectedDocHint || undefined
      );

      clearTimeout(progressTimer);
      setScanProgress(95);

      if (resJson.error && resJson.error === 'not_medical_document') {
        throw new Error(
          resJson.message ||
            (isRu
              ? 'Документ не распознан как медицинский бланк.'
              : 'Document was not recognized as a medical record.')
        );
      }

      // 3. Map document metadata
      const parsedDate = resJson.document_date || new Date().toISOString().split('T')[0];
      setDocumentMetadata({
        documentType: resJson.document_type || selectedDocHint || 'lab_result',
        documentDate: parsedDate,
        labName: resJson.lab_name || '',
        doctor: resJson.doctor || '',
        doctorSpecialization: resJson.doctor_specialization || '',
        confidence: resJson.scan_confidence ?? 0.95,
        needsReview: resJson.needs_review ?? false,
        diagnosis: resJson.diagnosis || '',
        recommendations: resJson.recommendations || '',
        warnings: Array.isArray(resJson.warnings) ? resJson.warnings : [],
        thumbnail: queuedImages[0]?.thumbnail || queuedImages[0]?.data,
      });

      // 4. Map indicators
      const parsedIndicators: EditableIndicator[] = (resJson.indicators || []).map(
        (ind: any, idx: number) => {
          const val =
            typeof ind.value === 'number'
              ? ind.value
              : parseFloat(ind.value) || 0;
          const min = ind.reference_min != null ? Number(ind.reference_min) : undefined;
          const max = ind.reference_max != null ? Number(ind.reference_max) : undefined;
          let status = ind.status || 'unknown';
          if (!['normal', 'low', 'high', 'critical', 'unknown'].includes(status)) {
            status = 'normal';
          }
          return {
            id: `ind_${Date.now()}_${idx}`,
            selected: true,
            name: ind.name || (isRu ? `Показатель ${idx + 1}` : `Indicator ${idx + 1}`),
            name_short: ind.name_short,
            category: ind.category || 'Blood',
            value: val,
            text_value: ind.text_value || undefined,
            unit: ind.unit || '',
            reference_min: min,
            reference_max: max,
            reference_text: ind.reference_text || undefined,
            status: status as any,
            comment: ind.comment || undefined,
          };
        }
      );
      setIndicators(parsedIndicators);

      // 5. Map medications
      const parsedMeds: EditableMedication[] = (resJson.medications || []).map(
        (med: any, idx: number) => ({
          id: `med_${Date.now()}_${idx}`,
          selected: true,
          name: med.name || (isRu ? `Препарат ${idx + 1}` : `Medication ${idx + 1}`),
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          duration: med.duration || '',
          notes: med.notes || '',
        })
      );
      setMedications(parsedMeds);

      setScanStage('done');
      setScanProgress(100);
      setHasExtractedData(true);
      setIsScanning(false);
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanStage('error');
      setScanError(
        err.message ||
          (isRu
            ? 'Произошла ошибка при анализе документа. Проверьте соединение или качество фото.'
            : 'Error analyzing document. Please verify connection or image quality.')
      );
      setIsScanning(false);
    }
  };

  // Save selected indicators to patient timeline
  const handleSaveToTimeline = () => {
    let finalIsoDate: string;
    try {
      finalIsoDate = new Date(documentMetadata.documentDate).toISOString();
    } catch (e) {
      finalIsoDate = new Date().toISOString();
    }

    // 1. Save selected lab results
    indicators
      .filter((i) => i.selected)
      .forEach((ind) => {
        let category: any = 'Blood';
        const docType = documentMetadata.documentType?.toLowerCase() || '';
        if (docType.includes('mri')) category = 'MRI';
        else if (docType.includes('ct')) category = 'CT';
        else if (docType.includes('ultrasound') || docType.includes('узи'))
          category = 'Ultrasound';
        else if (docType.includes('imaging') || docType.includes('рентген'))
          category = 'Imaging';
        else if (docType.includes('consult') || docType.includes('консульт'))
          category = 'Consultation';
        else if (ind.category === 'Biochemistry') category = 'Biochemistry';
        else if (ind.category === 'Urinalysis') category = 'Urinalysis';

        addLabResult({
          id: Math.random().toString(36).substring(2, 9),
          date: finalIsoDate,
          parameter: ind.name,
          value: ind.value,
          textValue: ind.text_value,
          unit: ind.unit,
          referenceRange: {
            min: ind.reference_min ?? 0,
            max: ind.reference_max ?? 0,
          },
          category,
          doctorSpecialization: documentMetadata.doctorSpecialization || undefined,
          notes: ind.comment,
        });
      });

    // 2. Save selected medications
    medications
      .filter((m) => m.selected)
      .forEach((med) => {
        addMedication({
          id: med.id,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          startDate: documentMetadata.documentDate,
          notes: med.notes,
        });
      });

    // 3. Save AI Report
    if (documentMetadata.diagnosis || documentMetadata.recommendations) {
      let reportType: 'labs' | 'studies' | 'consultations' | 'general' = 'labs';
      const docType = documentMetadata.documentType?.toLowerCase() || '';
      if (['mri', 'ct', 'ultrasound', 'imaging'].some((t) => docType.includes(t))) {
        reportType = 'studies';
      } else if (docType.includes('consult')) {
        reportType = 'consultations';
      }

      const content = [
        documentMetadata.diagnosis
          ? `### ${isRu ? 'Заключение / Диагноз:' : 'Diagnosis / Impression:'}\n${
              documentMetadata.diagnosis
            }`
          : '',
        documentMetadata.recommendations
          ? `### ${isRu ? 'Рекомендации:' : 'Recommendations:'}\n${
              documentMetadata.recommendations
            }`
          : '',
        documentMetadata.warnings && documentMetadata.warnings.length > 0
          ? `### ${isRu ? 'Выявленные отклонения:' : 'Critical Findings:'}\n${documentMetadata.warnings
              .map((w) => `- ${w}`)
              .join('\n')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      addAIReport({
        id: Math.random().toString(36).substring(2, 9),
        date: finalIsoDate,
        title: `${
          documentMetadata.labName ||
          (isRu ? 'Медицинский документ' : 'Medical Document')
        } (Medical AI)`,
        content,
        reportType,
        doctorSpecialization: documentMetadata.doctorSpecialization || undefined,
      });
    }

    setHasSaved(true);
  };

  // Export to PDF
  const handleExportPdf = () => {
    if (!activeMember) return;
    const mappedLabs = indicators.filter((i) => i.selected).map((ind) => ({
      id: ind.id,
      date: documentMetadata.documentDate,
      parameter: ind.name,
      value: ind.value,
      textValue: ind.text_value,
      unit: ind.unit,
      referenceRange: {
        min: ind.reference_min ?? 0,
        max: ind.reference_max ?? 0,
      },
      category: 'Blood' as const,
      notes: ind.comment,
    }));

    downloadReportAsPdf(
      'scan',
      activeMember,
      {
        reportType: documentMetadata.documentType,
        category: documentMetadata.documentType,
        documentDate: documentMetadata.documentDate,
        extractedLabs: mappedLabs,
        extractedMedications: medications.filter((m) => m.selected),
        scanInsight: [documentMetadata.diagnosis, documentMetadata.recommendations]
          .filter(Boolean)
          .join('\n\n'),
        doctorSpecialization: documentMetadata.doctorSpecialization,
      },
      language
    );
  };

  const selectedIndicatorsCount = indicators.filter((i) => i.selected).length;
  const recentReports = (aiReports && aiReports[activeMemberId]) || [];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 flex-1 overflow-hidden">
      <div className="p-4 space-y-5 flex-1 overflow-y-auto max-w-4xl mx-auto w-full">
        {/* Upload / Capture Stage (when not yet showing results) */}
        {!hasExtractedData && !isScanning && (
          <div className="space-y-4">
            <ScanDropzone
              onFilesSelected={handleFilesSelected}
              selectedDocHint={selectedDocHint}
              onDocHintSelect={setSelectedDocHint}
              language={language}
              isProcessing={isScanning}
            />

            <ScanPreviewGallery
              images={queuedImages}
              onRemoveImage={handleRemoveImage}
              onAddMoreFiles={handleFilesSelected}
              onStartAnalysis={handleStartAnalysis}
              onClearAll={handleClearAll}
              isProcessing={isScanning}
              language={language}
            />

            {/* Recent Scans Carousel */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3 px-1">
                <h4 className="text-slate-800 dark:text-white font-bold text-sm flex items-center gap-2">
                  <FileClock size={16} className="text-medical-blue" />
                  <span>{isRu ? 'Недавние сканирования' : 'Recent Scans'}</span>
                </h4>
                {recentReports.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('insights')}
                    className="text-xs text-medical-blue hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{isRu ? 'Все отчёты' : 'All reports'}</span>
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>

              {recentReports.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 px-1 hide-scrollbar scroll-smooth">
                  {recentReports.slice(0, 6).map((report) => (
                    <div
                      key={report.id}
                      onClick={() => setActiveTab('insights')}
                      className="card-android min-w-[170px] max-w-[200px] flex flex-col shrink-0 !p-3.5 cursor-pointer hover:border-medical-blue/40 transition-colors bg-white dark:bg-slate-900 shadow-xs"
                    >
                      <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/40 text-medical-blue rounded-lg mb-2 flex items-center justify-center">
                        <FileText size={16} />
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        {new Date(report.date).toLocaleDateString(
                          isRu ? 'ru-RU' : 'en-US'
                        )}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2 mt-0.5">
                        {report.title}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card-android bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-medical-blue shrink-0">
                      <Sparkles size={15} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      {isRu ? 'Как работает AI-сканер' : 'How AI Scanner Works'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-blue-500/10 text-medical-blue font-bold text-xs flex items-center justify-center shrink-0">
                        1
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {isRu ? 'Фото бланка' : 'Document photo'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {isRu ? 'Сфотографируйте анализ, УЗИ или рецепт' : 'Take a photo of test results or medical report'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0">
                        2
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {isRu ? 'Распознавание' : 'Recognition'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {isRu ? 'AI оцифрует показатели, единицы и нормы' : 'AI extracts parameters, units and reference norms'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs flex items-center justify-center shrink-0">
                        3
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {isRu ? 'В медкарту' : 'Save to record'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {isRu ? 'Автосохранение в историю и график здоровья' : 'Saved to timeline and health trend graphs'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scanning In Progress / Error Stage */}
        {(isScanning || scanError) && (
          <ScanProgressCard
            stage={scanStage}
            progress={scanProgress}
            error={scanError}
            onRetry={handleStartAnalysis}
            language={language}
          />
        )}

        {/* Extracted Results & Interactive Editor */}
        <AnimatePresence>
          {hasExtractedData && !isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Document Overview & AI Insights */}
              <ScanDocumentOverview
                metadata={documentMetadata}
                onUpdateMetadata={(updated) =>
                  setDocumentMetadata((prev) => ({ ...prev, ...updated }))
                }
                language={language}
              />

              {/* Interactive Result Editor */}
              <ScanResultEditor
                indicators={indicators}
                onUpdateIndicators={setIndicators}
                medications={medications}
                onUpdateMedications={setMedications}
                language={language}
              />

              {/* Action Buttons: Save, Export, Scan Another */}
              <div className="card-android !p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                {hasSaved ? (
                  <div className="w-full py-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800 text-sm">
                    <CheckCircle2 size={18} />
                    <span>
                      {isRu
                        ? 'Успешно сохранено в медкарту и таймлайн!'
                        : 'Successfully saved to health timeline!'}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="btn-save-to-timeline"
                    onClick={handleSaveToTimeline}
                    disabled={selectedIndicatorsCount === 0 && medications.length === 0}
                    className="w-full py-3.5 bg-gradient-to-r from-medical-blue to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-medical-blue/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save size={18} />
                    <span>
                      {isRu
                        ? `Сохранить в медкарту (${selectedIndicatorsCount} пок.)`
                        : `Save to Medical Record (${selectedIndicatorsCount} items)`}
                    </span>
                  </button>
                )}

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    id="btn-export-pdf"
                    onClick={handleExportPdf}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <FileDown size={16} />
                    <span>{isRu ? 'Экспорт в PDF' : 'Export to PDF'}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-scan-another"
                    onClick={handleClearAll}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <RotateCcw size={16} />
                    <span>
                      {isRu ? 'Сканировать другой' : 'Scan another'}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ScanLab;
