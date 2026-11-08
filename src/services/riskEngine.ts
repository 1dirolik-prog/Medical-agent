import { LabResult, RiskLevel, RiskAnalysis, AIRecommendation } from '../types';

/**
 * Normalizes a value to a 0-1 scale based on reference range
 */
export const normalize = (value: number, min: number, max: number): number => {
  if (max === min) return 0;
  return (value - min) / (max - min);
};

/**
 * Analyzes a single lab result against reference ranges safely
 */
export const analyzeResult = (result: LabResult): RiskAnalysis => {
  const { value, referenceRange } = result;
  
  if (!referenceRange || (referenceRange.min === undefined && referenceRange.max === undefined)) {
    return {
      parameterId: result.parameter,
      level: 'GREEN',
      message: 'No reference range',
      trend: 'Stable'
    };
  }

  const min = typeof referenceRange.min === 'number' ? referenceRange.min : -Infinity;
  const max = typeof referenceRange.max === 'number' ? referenceRange.max : Infinity;
  
  let level: RiskLevel = 'GREEN';
  let message = 'Normal range';
  
  if (value < min) {
    level = value < min * 0.8 ? 'RED' : 'YELLOW';
    message = 'Below reference range';
  } else if (value > max) {
    level = value > max * 1.2 ? 'RED' : 'YELLOW';
    message = 'Above reference range';
  }

  return {
    parameterId: result.parameter,
    level,
    message,
    trend: 'Stable'
  };
};

/**
 * Calculate overall health balance score (0-100) from active lab parameters
 */
export const calculateHealthScore = (results: LabResult[]): {
  score: number;
  inRangeCount: number;
  outOfRangeCount: number;
  totalEvaluated: number;
  statusText: string;
} => {
  if (!results || results.length === 0) {
    return { score: 100, inRangeCount: 0, outOfRangeCount: 0, totalEvaluated: 0, statusText: 'No data' };
  }

  // Get most recent reading per unique parameter name
  const latestByParam: Record<string, LabResult> = {};
  for (const r of results) {
    const key = r.parameter.trim().toLowerCase();
    if (!latestByParam[key] || new Date(r.date).getTime() > new Date(latestByParam[key].date).getTime()) {
      latestByParam[key] = r;
    }
  }

  const evaluated = Object.values(latestByParam).filter(
    r => r.referenceRange && (typeof r.referenceRange.min === 'number' || typeof r.referenceRange.max === 'number')
  );

  if (evaluated.length === 0) {
    return { score: 100, inRangeCount: 0, outOfRangeCount: 0, totalEvaluated: 0, statusText: 'Normal' };
  }

  let inRange = 0;
  let yellowDeviations = 0;
  let redDeviations = 0;

  for (const item of evaluated) {
    const min = typeof item.referenceRange.min === 'number' ? item.referenceRange.min : -Infinity;
    const max = typeof item.referenceRange.max === 'number' ? item.referenceRange.max : Infinity;
    
    if (item.value >= min && item.value <= max) {
      inRange++;
    } else {
      const isExtreme = (item.value < min && item.value < min * 0.8) || (item.value > max && item.value > max * 1.25);
      if (isExtreme) {
        redDeviations++;
      } else {
        yellowDeviations++;
      }
    }
  }

  const penalty = (yellowDeviations * 12) + (redDeviations * 22);
  const score = Math.max(20, Math.min(100, Math.round(100 - (penalty / evaluated.length) * 1.8)));

  let statusText = 'Optimal';
  if (score < 60) statusText = 'Attention Needed';
  else if (score < 80) statusText = 'Fair';
  else if (score < 92) statusText = 'Good';

  return {
    score,
    inRangeCount: inRange,
    outOfRangeCount: yellowDeviations + redDeviations,
    totalEvaluated: evaluated.length,
    statusText
  };
};

/**
 * Cross-parameter pattern detection (Syndromes & Clinical Alerts)
 */
export const detectSyndromes = (results: LabResult[], language: string = 'en'): AIRecommendation[] => {
  if (!results || results.length === 0) return [];
  const recommendations: AIRecommendation[] = [];
  const isRu = language === 'ru';
  
  const latest = (paramKeywords: string[]) => {
    return results
      .filter(r => {
        const p = r.parameter.toLowerCase();
        return paramKeywords.some(kw => p.includes(kw.toLowerCase()));
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const iron = latest(['Iron', 'Железо', 'Żelazo']);
  const ferritin = latest(['Ferritin', 'Ферритин', 'Ferrytyna']);
  const hemoglobin = latest(['Hemoglobin', 'Гемоглобин', 'HGB', 'Hb']);
  const cholesterol = latest(['Cholesterol', 'Холестерин', 'Холестерол']);
  const ldl = latest(['LDL', 'ЛПНП']);
  const triglycerides = latest(['Triglycerides', 'Триглицериды']);
  const glucose = latest(['Glucose', 'Глюкоза']);
  const hba1c = latest(['HbA1c', 'Гликированный гемоглобин']);
  const vitD = latest(['Vitamin D', 'Витамин D', '25-OH', '25(OH)']);
  const tsh = latest(['TSH', 'ТТГ']);
  const crp = latest(['CRP', 'СРБ', 'C-reactive']);

  // 1. Iron Deficiency Anemia Pattern
  if (iron && ferritin && hemoglobin && iron.referenceRange && ferritin.referenceRange && hemoglobin.referenceRange) {
    const isIronLow = iron.value < (iron.referenceRange.min ?? 0);
    const isFerritinLow = ferritin.value < (ferritin.referenceRange.min ?? 0);
    const isHgbLow = hemoglobin.value < (hemoglobin.referenceRange.min ?? 0);

    if (isIronLow && isFerritinLow && isHgbLow) {
      recommendations.push({
        id: 'syndrome-anemia',
        type: 'MEDICAL',
        title: isRu ? 'Признаки железодефицитной анемии' : 'Possible Iron Deficiency Anemia',
        content: isRu 
          ? 'Комплекс низкого гемоглобина, ферритина и железа сыворотки указывает на железодефицит. Рекомендуется консультация терапевта или гематолога для назначения терапии.'
          : 'Low hemoglobin, ferritin, and serum iron show a classic iron deficiency pattern. Consult a physician to evaluate root causes and appropriate supplementation.',
        priority: 'RED'
      });
    } else if (isFerritinLow && !isHgbLow) {
      // Latent iron deficiency
      recommendations.push({
        id: 'syndrome-latent-iron',
        type: 'MEDICAL',
        title: isRu ? 'Латентный дефицит железа' : 'Latent Iron Deficiency',
        content: isRu
          ? 'Ферритин снижен при пока сохранном уровне гемоглобина — истощение депо железа до развития явной анемии. Рекомендуется обсудить с врачом коррекцию диеты или приём железа.'
          : 'Ferritin is low while hemoglobin is maintained, suggesting depleted iron stores before full anemia develops. Discuss dietary adjustments or supplements with your doctor.',
        priority: 'YELLOW'
      });
    }

    // 2. Inflammation / Acute phase reactant pattern
    if (isIronLow && ferritin.referenceRange.max && ferritin.value > ferritin.referenceRange.max) {
      recommendations.push({
        id: 'syndrome-inflammation',
        type: 'MEDICAL',
        title: isRu ? 'Воспалительный паттерн (ферритин как острая фаза)' : 'Inflammation Pattern Detected',
        content: isRu
          ? 'Низкое железо при повышенном ферритине часто указывает на воспалительный процесс, стресс или хроническое заболевание. Рекомендуется сдать С-реактивный белок (СРБ).'
          : 'Low iron paired with high ferritin often suggests systemic inflammation or acute-phase response rather than simple dietary deficiency. Discuss CRP testing with your doctor.',
        priority: 'YELLOW'
      });
    }
  }

  // 3. Isolated Elevated CRP
  if (crp && crp.referenceRange && typeof crp.referenceRange.max === 'number' && crp.value > crp.referenceRange.max) {
    recommendations.push({
      id: 'syndrome-crp-elevated',
      type: 'MEDICAL',
      title: isRu ? 'Повышенный маркер воспаления (СРБ)' : 'Elevated C-Reactive Protein (CRP)',
      content: isRu
        ? `С-реактивный белок (${crp.value} ${crp.unit}) превышает верхнюю границу нормы (${crp.referenceRange.max}). Это признак активного воспалительного или инфекционного процесса.`
        : `C-Reactive protein (${crp.value} ${crp.unit}) is above normal range. This indicates an active inflammatory or immune response. Consult your physician.`,
      priority: crp.value > crp.referenceRange.max * 2 ? 'RED' : 'YELLOW'
    });
  }

  // 4. Lipid & Cardiovascular Risk Pattern
  const isCholHigh = cholesterol && cholesterol.referenceRange && typeof cholesterol.referenceRange.max === 'number' && cholesterol.value > cholesterol.referenceRange.max;
  const isLdlHigh = ldl && ldl.referenceRange && typeof ldl.referenceRange.max === 'number' && ldl.value > ldl.referenceRange.max;
  const isTrigHigh = triglycerides && triglycerides.referenceRange && typeof triglycerides.referenceRange.max === 'number' && triglycerides.value > triglycerides.referenceRange.max;

  if (isCholHigh || isLdlHigh || isTrigHigh) {
    const elevatedList: string[] = [];
    if (isCholHigh) elevatedList.push(isRu ? 'Общий холестерин' : 'Total Cholesterol');
    if (isLdlHigh) elevatedList.push('LDL');
    if (isTrigHigh) elevatedList.push(isRu ? 'Триглицериды' : 'Triglycerides');

    recommendations.push({
      id: 'syndrome-dyslipidemia',
      type: 'NUTRITION',
      title: isRu ? 'Липидный профиль: внимание к сосудам' : 'Cardiovascular Lipid Pattern',
      content: isRu
        ? `Повышены показатели: ${elevatedList.join(', ')}. Рекомендуется ограничение насыщенных жиров, увеличение омега-3 и растворимой клетчатки, а также консультация кардиолога.`
        : `Elevated lipid parameters (${elevatedList.join(', ')}). Consider increasing dietary fiber, omega-3 fatty acids, and consulting a cardiologist for cardiovascular risk screening.`,
      priority: (isLdlHigh && isTrigHigh) ? 'RED' : 'YELLOW'
    });
  }

  // 5. Glycemic & Metabolic Pattern
  const isGlucoseHigh = glucose && glucose.referenceRange && typeof glucose.referenceRange.max === 'number' && glucose.value > glucose.referenceRange.max;
  const isHba1cHigh = hba1c && hba1c.referenceRange && typeof hba1c.referenceRange.max === 'number' && hba1c.value > hba1c.referenceRange.max;

  if (isGlucoseHigh || isHba1cHigh) {
    recommendations.push({
      id: 'syndrome-glycemia',
      type: 'MEDICAL',
      title: isRu ? 'Контроль углеводного обмена (Глюкоза)' : 'Glycemic Balance Alert',
      content: isRu
        ? 'Уровень глюкозы или гликированного гемоглобина превышает целевые ориентиры. Рекомендуется консультация эндокринолога и контроль гликемии натощак.'
        : 'Fasting glucose or HbA1c is above standard reference thresholds. Consult an endocrinologist for glycemic monitoring and lifestyle counseling.',
      priority: (isGlucoseHigh && isHba1cHigh) ? 'RED' : 'YELLOW'
    });
  }

  // 6. Vitamin D Insufficiency / Deficiency
  if (vitD && (vitD.value < 30 || (vitD.referenceRange && vitD.value < (vitD.referenceRange.min ?? 30)))) {
    const isSevere = vitD.value < 20;
    recommendations.push({
      id: 'syndrome-vit-d',
      type: 'NUTRITION',
      title: isRu ? (isSevere ? 'Выраженный дефицит витамина D' : 'Недостаточность витамина D') : (isSevere ? 'Vitamin D Deficiency' : 'Vitamin D Insufficiency'),
      content: isRu
        ? `Уровень витамина D составляет ${vitD.value} ${vitD.unit} (норма: от 30). Витамин D критичен для иммунитета, костной ткани и настроения. Обсудите с врачом лечебную дозировку холекальциферола.`
        : `Vitamin D level is ${vitD.value} ${vitD.unit} (optimal: >30). Vitamin D is essential for bone density and immune defense. Discuss therapeutic supplementation with your physician.`,
      priority: isSevere ? 'YELLOW' : 'GREEN'
    });
  }

  // 7. Thyroid Screen (TSH)
  if (tsh && tsh.referenceRange) {
    if (typeof tsh.referenceRange.max === 'number' && tsh.value > tsh.referenceRange.max) {
      recommendations.push({
        id: 'syndrome-tsh-high',
        type: 'MEDICAL',
        title: isRu ? 'ТТГ выше нормы (признак гипотиреоза)' : 'Elevated TSH (Thyroid Screen)',
        content: isRu
          ? `Уровень ТТГ (${tsh.value} ${tsh.unit}) выше нормы. Часто сопровождается слабостью, сухостью кожи и сонливостью. Рекомендуется сдать свободный Т4 и посетить эндокринолога.`
          : `TSH level (${tsh.value} ${tsh.unit}) is elevated. Often linked with fatigue or sluggish metabolism. Consult an endocrinologist and check Free T4.`,
        priority: 'YELLOW'
      });
    } else if (typeof tsh.referenceRange.min === 'number' && tsh.value < tsh.referenceRange.min) {
      recommendations.push({
        id: 'syndrome-tsh-low',
        type: 'MEDICAL',
        title: isRu ? 'ТТГ ниже нормы (признак гипертиреоза)' : 'Low TSH (Thyroid Screen)',
        content: isRu
          ? `Уровень ТТГ (${tsh.value} ${tsh.unit}) снижен. Рекомендуется проверить свободные Т3 и Т4 и проконсультироваться с эндокринологом.`
          : `TSH level (${tsh.value} ${tsh.unit}) is below normal. Check Free T3/T4 and consult an endocrinologist.`,
        priority: 'YELLOW'
      });
    }
  }

  return recommendations;
};

/**
 * Lifestyle logic (What-If simulation)
 */
export const simulateLifestyleChange = (currentLDL: number, fiberIncrease: number) => {
  const reductionFactor = (fiberIncrease / 10) * 0.04;
  const expectedLDL = currentLDL * (1 - reductionFactor);
  return {
    percentage: (reductionFactor * 100).toFixed(1),
    newValue: expectedLDL.toFixed(2)
  };
};
