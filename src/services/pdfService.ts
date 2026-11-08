// @ts-ignore
import html2pdf from 'html2pdf.js';
import { FamilyMember, LabResult, SymptomLog } from '../types';
import { translateParameter } from './paramTranslator';

function markdownToHtml(md: string): string {
  if (!md) return '';
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.155rem; font-weight: bold; color: #1e293b; margin-top: 1.2rem; margin-bottom: 0.6rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.35rem; font-weight: bold; color: #0f172a; margin-top: 1.8rem; margin-bottom: 0.8rem; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.25rem;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 1.65rem; font-weight: 800; color: #1e3a8a; margin-top: 2.2rem; margin-bottom: 1.2rem; text-align: center; border-bottom: 3px double #1e3a8a; padding-bottom: 0.4rem;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #0f172a;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #475569;">$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>')
    .replace(/^\s*-\s+(.*$)/gim, '<li style="margin-left: 1.5rem; list-style-type: disc; margin-bottom: 0.35rem; color: #334155;">$1</li>')
    .replace(/^\s*\*\s+(.*$)/gim, '<li style="margin-left: 1.5rem; list-style-type: disc; margin-bottom: 0.35rem; color: #334155;">$1</li>')
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
        return line;
      }
      if (trimmed === '') return '';
      return `<p style="margin-bottom: 0.85rem; line-height: 1.6; color: #334155; font-size: 0.95rem;">${line}</p>`;
    })
    .join('\n');
}

export type PdfReportType = 'scan' | 'insight' | 'consilium';

interface ScanReportData {
  reportType: string;
  category: string;
  documentDate: string;
  extractedLabs: LabResult[];
  extractedMedications: any[];
  scanInsight: string | null;
  doctorSpecialization?: string;
}

interface InsightReportData {
  insight: string;
  member: FamilyMember;
  labsCount: number;
  symptomsCount: number;
}

interface ConsiliumReportData {
  conclusion: string;
  discussion: Array<{ doctorId: string; text: string }>;
  doctorsList: Array<{ id: string; name: string; spec: string }>;
}

export const downloadReportAsPdf = async (
  type: PdfReportType,
  member: FamilyMember,
  data: any,
  lang: string = 'en'
) => {
  // Dictionary support for 5 languages
  const pdfTranslations: Record<string, any> = {
    en: {
      clinicTitle: 'FAMILY HEALTH ASSISTANT',
      subHeader: 'Personalized AI Health Analysis Report',
      patientCardTitle: 'PATIENT PROFILE',
      name: 'Name',
      age: 'Age',
      sex: 'Sex',
      sexMale: 'Male',
      sexFemale: 'Female',
      height: 'Height',
      weight: 'Weight',
      bloodGroup: 'Blood Group',
      chronicConditions: 'Chronic Conditions',
      none: 'None',
      dateGenerated: 'Report Date',
      docDate: 'Document Date',
      disclaimerTitle: 'Medical Advisory Disclaimer',
      disclaimerBody: 'This report has been compiled utilizing advanced medical pattern-recognition AI technologies for informational and educational purposes only. It is not a substitute for professional medical advice, comprehensive diagnosis, or supervised prescription plans. Always seek the advice of your qualified healthcare provider with any questions regarding a medical condition.',
      scanTitle: 'Document Scan & Diagnostic Analysis',
      insightTitle: 'Comprehensive AI Health Insights',
      consiliumTitle: 'AI Medical Board Consilium Report',
      labsTableTitle: 'Extracted Laboratory Metrics',
      paramColumn: 'Parameter',
      valColumn: 'Result Value',
      normColumn: 'Ref. Range/Norm',
      medicationsTitle: 'Identified Medications & Schedules',
      medName: 'Medication',
      medRegimen: 'Usage Regimen',
      aiAnalysisTitle: 'AI Strategic Clinical Assessment',
      discussionTranscript: 'Consilium Discussion Transcript (Physicians Transcript)',
      doctorsSpecLabel: 'Specialization',
      overallConclusion: 'Unified Clinical Conclusion'
    },
    ru: {
      clinicTitle: 'СЕМЕЙНЫЙ ПОМОЩНИК ЗДОРОВЬЯ',
      subHeader: 'Персонализированный Медицинский Отчет ИИ',
      patientCardTitle: 'ИНФОРМАЦИЯ О ПАЦИЕНТЕ',
      name: 'ФИО',
      age: 'Возраст',
      sex: 'Пол',
      sexMale: 'Мужской',
      sexFemale: 'Женский',
      height: 'Рост',
      weight: 'Вес',
      bloodGroup: 'Группа крови',
      chronicConditions: 'Хронические заболевания',
      none: 'Нет',
      dateGenerated: 'Дата отчета',
      docDate: 'Дата документа',
      disclaimerTitle: 'Важное Медицинское Предупреждение',
      disclaimerBody: 'Данный документ подготовлен с использованием технологий искусственного интеллекта исключительно в информационных целях. Он не заменяет профессиональное врачебное заключение, медицинскую диагностику или назначение лекарственной терапии. При возникновении вопросов по состоянию здоровья или началу нового лечения обязательно проконсультируйтесь с вашим лечащим врачом.',
      scanTitle: 'Результаты Анализа Документов',
      insightTitle: 'Комплексный AI-Анализ и Показатели',
      consiliumTitle: 'Коллегиальное Заключение ИИ-Консилиума',
      labsTableTitle: 'Выявленные Показатели',
      paramColumn: 'Показатель',
      valColumn: 'Значение',
      normColumn: 'Нормальный диапазон',
      medicationsTitle: 'Определенные Препараты и Рекомендации',
      medName: 'Препарат',
      medRegimen: 'Схема приема',
      aiAnalysisTitle: 'Анализ и Расшифровка ИИ',
      discussionTranscript: 'Стенограмма консилиума (Дискуссия врачей)',
      doctorsSpecLabel: 'Специализация',
      overallConclusion: 'Коллегиальный вывод консилиума'
    },
    pl: {
      clinicTitle: 'ASYSTENT ZDROWIA RODZINY',
      subHeader: 'Spersonalizowany Raport Analizy Zdrowia AI',
      patientCardTitle: 'PROFIL PACJENTA',
      name: 'Imię i nazwisko',
      age: 'Wiek',
      sex: 'Płeć',
      sexMale: 'Mężczyzna',
      sexFemale: 'Kobieta',
      height: 'Wzrost',
      weight: 'Waga',
      bloodGroup: 'Grupa krwi',
      chronicConditions: 'Choroby przewlekłe',
      none: 'Brak',
      dateGenerated: 'Data raportu',
      docDate: 'Data dokumentu',
      disclaimerTitle: 'Zastrzeżenie Medyczne',
      disclaimerBody: 'Niniejszy raport został sporządzony przy użyciu zaawansowanych technologii sztucznej inteligencji służących do rozpoznawania wzorców medycznych wyłącznie w celach informacyjnych i edukacyjnych. Nie zastępuje on profesjonalnej porady medycznej, kompleksowej diagnozy ani nadzorowanego planu leczenia. Przed podjęciem jakichkolwiek decyzji medycznych należy skonsultować się z lekarzem.',
      scanTitle: 'Skan Dokumentu i Analiza Diagnostyczna',
      insightTitle: 'Kompleksowa Analiza Zdrowotna AI',
      consiliumTitle: 'Raport Konsylium Medycznego AI',
      labsTableTitle: 'Wykryte Parametry Laboratoryjne',
      paramColumn: 'Parametr',
      valColumn: 'Wartość wynikowa',
      normColumn: 'Zakres referencyjny',
      medicationsTitle: 'Zidentyfikowane Leki i Harmonogramy',
      medName: 'Lek',
      medRegimen: 'Schemat dawkowania',
      aiAnalysisTitle: 'Strategiczna Ocena Kliniczna AI',
      discussionTranscript: 'Protokół Dyskusji Konsylium (Zapis Lekarzy)',
      doctorsSpecLabel: 'Specjalizacja',
      overallConclusion: 'Jednolity Wniosek Kliniczny'
    },
    es: {
      clinicTitle: 'ASISTENTE DE SALUD FAMILIAR',
      subHeader: 'Informe de Análisis de Salud de IA Personalizado',
      patientCardTitle: 'PERFIL DEL PACIENTE',
      name: 'Nombre',
      age: 'Edad',
      sex: 'Sexo',
      sexMale: 'Masculino',
      sexFemale: 'Femenino',
      height: 'Altura',
      weight: 'Peso',
      bloodGroup: 'Grupo sanguíneo',
      chronicConditions: 'Enfermedades crónicas',
      none: 'Ninguno',
      dateGenerated: 'Fecha del informe',
      docDate: 'Fecha del documento',
      disclaimerTitle: 'Aviso de Descargo de Responsabilidad Médica',
      disclaimerBody: 'Este informe se ha elaborado utilizando tecnologías avanzadas de reconocimiento de patrones médicos de IA solo con fines informativos y educativos. No sustituye el consejo de un profesional médico, un diagnóstico exhaustivo o un plan de prescripción supervisado. Siempre busque el consejo de un proveedor de salud calificado con cualquier pregunta sobre su estado de salud.',
      scanTitle: 'Escaneo de Documentos y Análisis Diagnóstico',
      insightTitle: 'Análisis de Salud Integral de IA',
      consiliumTitle: 'Informe de Consilio Médico de IA',
      labsTableTitle: 'Métricas de Laboratorio Extraídas',
      paramColumn: 'Parámetro',
      valColumn: 'Valor del resultado',
      normColumn: 'Rango de ref./Norma',
      medicationsTitle: 'Medicamentos Identificados y Horarios',
      medName: 'Medicamento',
      medRegimen: 'Régimen de uso',
      aiAnalysisTitle: 'Evaluación Clínica Estratégica de IA',
      discussionTranscript: 'Transcripción de la Discusión del Consilio (Médicos)',
      doctorsSpecLabel: 'Especialización',
      overallConclusion: 'Conclusión Clínica Unificada'
    },
    de: {
      clinicTitle: 'FAMILIENGESUNDHEITSASSISTENT',
      subHeader: 'Personalisierter KI-Gesundheitsanalysebericht',
      patientCardTitle: 'PATIENTENPROFIL',
      name: 'Name',
      age: 'Alter',
      sex: 'Geschlecht',
      sexMale: 'Männlich',
      sexFemale: 'Weiblich',
      height: 'Größe',
      weight: 'Gewicht',
      bloodGroup: 'Blutgruppe',
      chronicConditions: 'Chronische Erkrankungen',
      none: 'Keine',
      dateGenerated: 'Berichtsdatum',
      docDate: 'Dokumentendatum',
      disclaimerTitle: 'Medizinischer Haftungsausschluss',
      disclaimerBody: 'Dieser Bericht wurde unter Verwendung fortschrittlicher medizinischer KI-Technologien zur Mustererkennung ausschließlich zu Informations- und Bildungszwecken erstellt. Er ist kein Ersatz für professionelle medizinische Beratung, umfassende Diagnose oder einen überwachten Behandlungsplan. Wenden Sie sich bei Fragen zu einer Erkrankung immer an Ihren qualifizierten Arzt.',
      scanTitle: 'Dokumentenscan & Diagnostische Analyse',
      insightTitle: 'Umfassende KI-Gesundheitsanalyse',
      consiliumTitle: 'KI-Ärztekonsiliumsbericht',
      labsTableTitle: 'Extrahierte Laborparameter',
      paramColumn: 'Parameter',
      valColumn: 'Ergebniswert',
      normColumn: 'Referenzbereich/Norm',
      medicationsTitle: 'Identifizierte Medikamente & Einnahmepläne',
      medName: 'Medikament',
      medRegimen: 'Einnahmeberechnung',
      aiAnalysisTitle: 'Klinische KI-Bewertung',
      discussionTranscript: 'Protokoll der Konsilium-Diskussion (Ärzteprotokoll)',
      doctorsSpecLabel: 'Spezialisierung',
      overallConclusion: 'Einheitliche klinische Schlussfolgerung'
    }
  };

  const labels = pdfTranslations[lang] || pdfTranslations['en'];

  const localeMap: Record<string, string> = {
    ru: 'ru-RU',
    pl: 'pl-PL',
    es: 'es-ES',
    de: 'de-DE',
    en: 'en-US'
  };
  const activeLocale = localeMap[lang] || 'en-US';

  const currentFormattedDate = new Date().toLocaleDateString(activeLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Assemble HTML template
  let contentHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 25px; color: #1e293b; background-color: #ffffff; line-height: 1.5; font-size: 14px; width: 740px; max-width: 740px; min-width: 740px; margin: 0; box-sizing: border-box; word-wrap: break-word; overflow-wrap: break-word;">
      <!-- TOP CLINICAL BAR -->
      <table style="width: 100%; border-collapse: collapse; border: none; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 24px;">
        <tr>
          <td style="text-align: left; vertical-align: bottom; padding-bottom: 10px;">
            <div style="font-weight: 800; font-size: 1.4rem; color: #1e3a8a; tracking-tight: -0.025em; margin: 0; line-height: 1;">${labels.clinicTitle}</div>
            <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.1em;">${labels.subHeader}</div>
          </td>
          <td style="text-align: right; vertical-align: bottom; padding-bottom: 10px; font-size: 11px; color: #64748b; font-weight: 500; width: 220px;">
            <div>${labels.dateGenerated}:</div>
            <div style="font-weight: 700; color: #1e293b; margin-top: 2px;">${currentFormattedDate}</div>
          </td>
        </tr>
      </table>

      <!-- PATIENT PROFILE CARD -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px; box-sizing: border-box;">
        <div style="font-size: 10px; font-weight: 800; color: #475569; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">${labels.patientCardTitle}</div>
        <table style="width: 100%; border-collapse: collapse; border: none;">
          <tr>
            <td style="width: 50%; padding: 4px 10px 4px 0; vertical-align: top;">
              <span style="color: #64748b; font-size: 11px; font-weight: 600;">${labels.name}:</span>
              <span style="font-weight: 700; color: #0f172a; margin-left: 6px;">${member.name}</span>
            </td>
            <td style="width: 50%; padding: 4px 0 4px 10px; vertical-align: top;">
              <span style="color: #64748b; font-size: 11px; font-weight: 600;">${labels.age}:</span>
              <span style="font-weight: 700; color: #0f172a; margin-left: 6px;">${member.age}</span>
            </td>
          </tr>
          <tr>
            <td style="width: 50%; padding: 4px 10px 4px 0; vertical-align: top;">
              <span style="color: #64748b; font-size: 11px; font-weight: 600;">${labels.sex}:</span>
              <span style="font-weight: 700; color: #0f172a; margin-left: 6px;">${member.sex === 'Male' ? labels.sexMale : labels.sexFemale}</span>
            </td>
            <td style="width: 50%; padding: 4px 0 4px 10px; vertical-align: top;">
              <span style="color: #64748b; font-size: 11px; font-weight: 600;">${labels.bloodGroup}:</span>
              <span style="font-weight: 700; color: #0f172a; margin-left: 6px;">${member.bloodGroup || labels.none}</span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="width: 100%; padding: 6px 0 4px 0; vertical-align: top;">
              <span style="color: #64748b; font-size: 11px; font-weight: 600;">${labels.chronicConditions}:</span>
              <span style="font-weight: 600; color: #0f172a; margin-left: 6px;">${member.chronicConditions && member.chronicConditions.length > 0 ? member.chronicConditions.join(', ') : labels.none}</span>
            </td>
          </tr>
        </table>
      </div>
  `;

  // Specific reports section append
  if (type === 'scan') {
    const scanData: ScanReportData = data;
    contentHtml += `
      <!-- REPORT TITLE -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #1e3a8a; margin: 0; line-height: 1.2;">
          ${labels.scanTitle}
        </h2>
        <div style="font-size: 12px; color: #475569; margin-top: 4px; font-weight: 500;">
          ${scanData.reportType ? `<strong>${scanData.reportType}</strong>` : ''} 
          ${scanData.documentDate ? ` • ${labels.docDate}: <strong>${scanData.documentDate}</strong>` : ''}
          ${scanData.category ? ` • ${labels.doctorsSpecLabel}: <strong>${translateCategory(scanData.category, lang)}</strong>` : ''}
        </div>
      </div>
    `;

    // AI Translation Insight
    if (scanData.scanInsight) {
      contentHtml += `
        <!-- AI ASSESSMENT -->
        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px 8px 8px 4px; padding: 16px; margin-bottom: 24px;">
          <h3 style="font-size: 12px; font-weight: 800; color: #1e40af; letter-spacing: 0.05em; text-transform: uppercase; margin: 0 0 8px 0;">${labels.aiAnalysisTitle}</h3>
          <div style="font-size: 13.5px; line-height: 1.55; color: #1e3a8a; font-style: italic;">
            ${markdownToHtml(scanData.scanInsight)}
          </div>
        </div>
      `;
    }

    // Parameters Table
    if (scanData.extractedLabs && scanData.extractedLabs.length > 0) {
      contentHtml += `
        <!-- EXTRACTED PARAMETERS -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 13px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">${labels.labsTableTitle}</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12.5px;">
            <thead>
              <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px 12px; font-weight: 700; color: #475569;">${labels.paramColumn}</th>
                <th style="padding: 10px 12px; font-weight: 700; color: #475569; text-align: center;">${labels.valColumn}</th>
                <th style="padding: 10px 12px; font-weight: 700; color: #475569; text-align: right;">${labels.normColumn}</th>
              </tr>
            </thead>
            <tbody>
      `;

      scanData.extractedLabs.forEach((lab, i) => {
        const isOutOfRange = lab.referenceRange && !(lab.referenceRange.min === 0 && lab.referenceRange.max === 0)
          ? (lab.value < lab.referenceRange.min || lab.value > lab.referenceRange.max)
          : false;

        const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        const displayVal = lab.textValue ? lab.textValue : `${lab.value} ${lab.unit}`;
        const refText = lab.referenceRange 
          ? (lab.referenceRange.min === 0 && lab.referenceRange.max === 0 ? '---' : `${lab.referenceRange.min} - ${lab.referenceRange.max} ${lab.unit}`)
          : '---';

        contentHtml += `
          <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; font-weight: 700; color: #334155;">${translateParameter(lab.parameter, lang as any)}</td>
            <td style="padding: 10px 12px; text-align: center;">
              <span style="${isOutOfRange ? 'background-color: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 6px; font-weight: 800;' : 'background-color: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 6px; font-weight: 700;'}">
                ${displayVal}
              </span>
            </td>
            <td style="padding: 10px 12px; text-align: right; color: #64748b; font-weight: 500;">${refText}</td>
          </tr>
        `;
      });

      contentHtml += `
            </tbody>
          </table>
        </div>
      `;
    }

    // Medications prescribed
    if (scanData.extractedMedications && scanData.extractedMedications.length > 0) {
      contentHtml += `
        <!-- EXTRACTED MEDICATIONS -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 13px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">${labels.medicationsTitle}</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12.5px;">
            <thead>
              <tr style="background-color: #faf5ff; border-bottom: 2px solid #e9d5ff;">
                <th style="padding: 10px 12px; font-weight: 700; color: #6b21a8; width: 40%;">${labels.medName}</th>
                <th style="padding: 10px 12px; font-weight: 700; color: #6b21a8; width: 60%;">${labels.medRegimen}</th>
              </tr>
            </thead>
            <tbody>
      `;

      scanData.extractedMedications.forEach((med, i) => {
        const rowBg = i % 2 === 0 ? '#ffffff' : '#faf5ff/20';
        const notesStr = med.notes && med.notes !== 'Scanned by AI' && med.notes !== 'Сканировано ИИ' ? ` • ${med.notes}` : '';
        const regimeStr = [med.dosage, med.frequency, med.duration].filter(Boolean).join(' • ') + notesStr;

        contentHtml += `
          <tr style="background-color: ${rowBg}; border-bottom: 1px solid #f3e8ff;">
            <td style="padding: 10px 12px; font-weight: 700; color: #581c87;">${med.name}</td>
            <td style="padding: 10px 12px; color: #6b21a8; font-weight: 500;">${regimeStr || '---'}</td>
          </tr>
        `;
      });

      contentHtml += `
            </tbody>
          </table>
        </div>
      `;
    }

  } else if (type === 'insight') {
    const insightData: InsightReportData = data;
    contentHtml += `
      <!-- REPORT TITLE -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #1e3a8a; margin: 0; line-height: 1.2;">
          ${labels.insightTitle}
        </h2>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600; text-transform: uppercase;">
          ${(() => {
            switch(lang) {
              case 'ru': return `Проанализировано на основе последних ${insightData.labsCount} анализов и ${insightData.symptomsCount} записей симптомов`;
              case 'de': return `Analysiert basierend auf den letzten ${insightData.labsCount} Laborwerten und ${insightData.symptomsCount} Symptomeinträgen`;
              case 'es': return `Analizado sobre la base de los últimos ${insightData.labsCount} análisis de laboratorio y ${insightData.symptomsCount} registros de síntomas`;
              case 'pl': return `Analiza na podstawie ostatnich ${insightData.labsCount} badań laboratoryjnych oraz ${insightData.symptomsCount} logów objawów`;
              default: return `Analyzed based on latest ${insightData.labsCount} labs and ${insightData.symptomsCount} symptom logs`;
            }
          })()}
        </div>
      </div>

      <!-- INSIGHT CONTENT -->
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
        <div style="line-height: 1.6; color: #334155; font-size: 14.5px;">
          ${markdownToHtml(insightData.insight)}
        </div>
      </div>
    `;

  } else if (type === 'consilium') {
    const consiliumData: ConsiliumReportData = data;
    contentHtml += `
      <!-- REPORT TITLE -->
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #1e3a8a; margin: 0; line-height: 1.2;">
          ${labels.consiliumTitle}
        </h2>
      </div>

      <!-- OVERALL CONCLUSION -->
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
        <h3 style="font-size: 13.5px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px 0; border-bottom: 1px solid #bfdbfe; padding-bottom: 6px;">
          ${labels.overallConclusion}
        </h3>
        <div style="font-size: 14px; line-height: 1.6; color: #1e3a8a;">
          ${markdownToHtml(consiliumData.conclusion)}
        </div>
      </div>

      <!-- DISCUSSIONS -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 13px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
          ${labels.discussionTranscript}
        </h3>
        <div style="margin-top: 12px;">
    `;

    consiliumData.discussion.forEach((msg) => {
      const docMeta = consiliumData.doctorsList.find(d => d.id === msg.doctorId) || { name: msg.doctorId, spec: 'Specialist' };
      contentHtml += `
        <div style="border-left: 3px solid #6366f1; background-color: #fafafa; border-top-right-radius: 12px; border-bottom-right-radius: 12px; padding: 14px 18px; margin-bottom: 16px; box-sizing: border-box;">
          <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 8px;">
            <tr>
              <td style="font-weight: 800; color: #0f172a; font-size: 13.5px; text-align: left; vertical-align: middle;">
                ${docMeta.name}
              </td>
              <td style="text-align: right; vertical-align: middle; width: 200px;">
                <span style="font-size: 10px; font-weight: 700; color: #6366f1; background-color: #e0e7ff; padding: 3px 8px; border-radius: 12px; text-transform: uppercase; display: inline-block;">
                  ${docMeta.spec}
                </span>
              </td>
            </tr>
          </table>
          <div style="font-size: 13px; line-height: 1.55; color: #334155; font-style: normal;">
            ${markdownToHtml(msg.text)}
          </div>
        </div>
      `;
    });

    contentHtml += `
        </div>
      </div>
    `;
  }

  // Mandatory Clinical Disclaimer
  contentHtml += `
      <!-- CLINICAL ADVISORY DISCLAIMER -->
      <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 16px; margin-top: 36px; box-sizing: border-box;">
        <h4 style="font-size: 11.5px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px 0;">
          ${labels.disclaimerTitle}
        </h4>
        <p style="font-size: 11px; line-height: 1.5; color: #b45309; margin: 0; text-align: justify; font-weight: 500;">
          ${labels.disclaimerBody}
        </p>
      </div>

      <!-- FOOTER BANNER -->
      <div style="margin-top: 36px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        ${labels.clinicTitle} © 2026 • AI Medical Intelligence System • ${labels.subHeader}
      </div>
    </div>
  `;

  // Create absolute off-screen wrapper with unconstrained height to prevent multi-page clipping
  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.left = '0px';
  wrapper.style.top = '0px';
  wrapper.style.width = '740px';
  wrapper.style.zIndex = '-9999';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.opacity = '0.01'; // invisible but fully rendered

  const printContainer = document.createElement('div');
  printContainer.style.width = '740px';
  printContainer.style.backgroundColor = '#ffffff';
  printContainer.innerHTML = contentHtml;

  wrapper.appendChild(printContainer);
  document.body.appendChild(wrapper);

  const cleanMemberName = member.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9А-Яа-я_]/g, '');
  const cleanReportDate = new Date().toISOString().split('T')[0];
  const filename = `${type}_report_${cleanMemberName}_${cleanReportDate}.pdf`;

  const opt = {
    margin:       10,
    filename:     filename,
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas:  { 
      scale: 2, 
      useCORS: true, 
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: 740
    },
    jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
  };

  try {
    await html2pdf().set(opt).from(printContainer).save();
  } catch (error) {
    console.error("PDF download failed:", error);
  } finally {
    document.body.removeChild(wrapper);
  }
};

function translateCategory(cat: string, lang: string): string {
  const categories: Record<string, Record<string, string>> = {
    'Blood': { ru: 'Анализ крови', de: 'Bluttest', pl: 'Badanie krwi', es: 'Análisis de sangre', en: 'Blood Test' },
    'Biochemistry': { ru: 'Биохимия', de: 'Biochemie', pl: 'Biochemia', es: 'Bioquímica', en: 'Biochemistry' },
    'Urinalysis': { ru: 'Анализ мочи', de: 'Urinanalyse', pl: 'Badanie moczu', es: 'Análisis de orina', en: 'Urinalysis' },
    'Imaging': { ru: 'Снимок/Рентген', de: 'Bildgebung', pl: 'Obrazowanie', es: 'Imagenología', en: 'Imaging' },
    'Ultrasound': { ru: 'УЗИ', de: 'Ultraschall', pl: 'USG', es: 'Ecografía', en: 'Ultrasound' },
    'MRI': { ru: 'МРТ', de: 'MRT', pl: 'Rezonans (MRI)', es: 'Resonancia (RMN)', en: 'MRI' },
    'CT': { ru: 'КТ', de: 'CT', pl: 'Tomografia (TK)', es: 'Tomografía (TC)', en: 'CT' },
    'Consultation': { ru: 'Консультация', de: 'Konsultation', pl: 'Konsultacja', es: 'Consulta', en: 'Consultation' },
    'Other': { ru: 'Другие исследования', de: 'Andere Untersuchungen', pl: 'Inne badania', es: 'Otros exámenes', en: 'Other exams' }
  };
  return categories[cat]?.[lang] || categories[cat]?.['en'] || cat;
}
