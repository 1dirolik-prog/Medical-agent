export interface DoctorInfo {
  id: string;
  name: string;
  spec: string;
  color: string;
  bg: string;
}

const DOCTOR_DEFINITIONS: Record<string, {
  color: string;
  bg: string;
  translations: Record<string, { name: string; spec: string }>;
}> = {
  therapist: {
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    translations: {
      en: { name: "Therapist", spec: "General medicine" },
      ru: { name: "Терапевт", spec: "Общая медицина" },
      de: { name: "Therapeut", spec: "Allgemeinmedizin" },
      pl: { name: "Terapeuta", spec: "Medycyna ogólna" },
      es: { name: "Terapeuta", spec: "Medicina general" }
    }
  },
  surgeon: {
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    translations: {
      en: { name: "Surgeon", spec: "Surgical treatment" },
      ru: { name: "Хирург", spec: "Оперативное лечение" },
      de: { name: "Chirurg", spec: "Chirurgische Behandlung" },
      pl: { name: "Chirurg", spec: "Leczenie chirurgiczne" },
      es: { name: "Cirujano", spec: "Tratamiento quirúrgico" }
    }
  },
  neurologist: {
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    translations: {
      en: { name: "Neurologist", spec: "Nervous system" },
      ru: { name: "Невролог", spec: "Нервная система" },
      de: { name: "Neurologe", spec: "Nervensystem" },
      pl: { name: "Neurolog", spec: "Układ nerwowy" },
      es: { name: "Neurólogo", spec: "Sistema nervioso" }
    }
  },
  cardiologist: {
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    translations: {
      en: { name: "Cardiologist", spec: "Cardiovascular system" },
      ru: { name: "Кардиолог", spec: "Сердечно-сосудистая система" },
      de: { name: "Kardiologe", spec: "Herz-Kreislauf-System" },
      pl: { name: "Kardiolog", spec: "Układ sercowo-naczyniowy" },
      es: { name: "Cardiólogo", spec: "Sistema cardiovascular" }
    }
  },
  gastro: {
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    translations: {
      en: { name: "Gastroenterologist", spec: "Digestive tract" },
      ru: { name: "Гастроэнтеролог", spec: "ЖКТ" },
      de: { name: "Gastroenterologe", spec: "Magen-Darm-Trakt" },
      pl: { name: "Gastrolog", spec: "Układ pokarmowy" },
      es: { name: "Gastroenterólogo", spec: "Tracto gastrointestinal" }
    }
  },
  urologist: {
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    translations: {
      en: { name: "Urologist", spec: "Genitourinary system" },
      ru: { name: "Уролог", spec: "Мочеполовая система" },
      de: { name: "Urologe", spec: "Urogenitaltrakt" },
      pl: { name: "Urolog", spec: "Układ moczowo-płciowy" },
      es: { name: "Urólogo", spec: "Sistema genitourinario" }
    }
  },
  ent: {
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    translations: {
      en: { name: "ENT", spec: "Otolaryngology" },
      ru: { name: "ЛОР", spec: "Ухо, горло, нос" },
      de: { name: "HNO-Arzt", spec: "Hals-Nasen-Ohren-Heilkunde" },
      pl: { name: "Laryngolog", spec: "Otolaryngologia" },
      es: { name: "Otorrino", spec: "Otorrinolaringología" }
    }
  },
  endocrinologist: {
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    translations: {
      en: { name: "Endocrinologist", spec: "Hormonal system" },
      ru: { name: "Эндокринолог", spec: "Гормональная система" },
      de: { name: "Endokrinologe", spec: "Hormonsystem" },
      pl: { name: "Endokrynolog", spec: "Układ hormonalny" },
      es: { name: "Endocrinólogo", spec: "Sistema hormonal" }
    }
  },
  dermatologist: {
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    translations: {
      en: { name: "Dermatologist", spec: "Skin & appendages" },
      ru: { name: "Дерматолог", spec: "Кожа и придатки" },
      de: { name: "Dermatologe", spec: "Haut & Anhangsgebilde" },
      pl: { name: "Dermatolog", spec: "Skóra i przydatki" },
      es: { name: "Dermatólogo", spec: "Piel y anexos" }
    }
  },
  pulmonologist: {
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    translations: {
      en: { name: "Pulmonologist", spec: "Lungs & breathing" },
      ru: { name: "Пульмонолог", spec: "Легкие и дыхание" },
      de: { name: "Pulmologe", spec: "Lunge & Atmung" },
      pl: { name: "Pulmonolog", spec: "Płuca i oddychanie" },
      es: { name: "Neumólogo", spec: "Pulmones y respiración" }
    }
  },
  proctologist: {
    color: "text-stone-500",
    bg: "bg-stone-500/10",
    translations: {
      en: { name: "Proctologist", spec: "Rectum" },
      ru: { name: "Проктолог", spec: "Прямая кишка" },
      de: { name: "Proktologe", spec: "Enddarm" },
      pl: { name: "Proktolog", spec: "Odbytnica" },
      es: { name: "Proctólogo", spec: "Recto" }
    }
  },
  psychotherapist: {
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-500/10",
    translations: {
      en: { name: "Psychotherapist", spec: "Mental health" },
      ru: { name: "Психотерапевт", spec: "Психическое здоровье" },
      de: { name: "Psychotherapeut", spec: "Psychische Gesundheit" },
      pl: { name: "Psychoterapeuta", spec: "Zdrowie psychiczne" },
      es: { name: "Psicoterapeuta", spec: "Salud mental" }
    }
  },
  rheumatologist: {
    color: "text-red-500",
    bg: "bg-red-500/10",
    translations: {
      en: { name: "Rheumatologist", spec: "Joints & tissues" },
      ru: { name: "Ревматолог", spec: "Суставы и ткани" },
      de: { name: "Rheumatologe", spec: "Gelenke & Gewebe" },
      pl: { name: "Reumatolog", spec: "Stawy i tkanki" },
      es: { name: "Reumatólogo", spec: "Articulaciones y tejidos" }
    }
  },
  gynecologist: {
    color: "text-pink-600",
    bg: "bg-pink-600/10",
    translations: {
      en: { name: "Gynecologist", spec: "Women's health" },
      ru: { name: "Гинеколог", spec: "Женское здоровье" },
      de: { name: "Gynäkologe", spec: "Frauengesundheit" },
      pl: { name: "Ginekolog", spec: "Zdrowie kobiet" },
      es: { name: "Ginecólogo", spec: "Salud de la mujer" }
    }
  },
  ai_lab: {
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    translations: {
      en: { name: "AI Lab Analyzer", spec: "Blood, urine, markers" },
      ru: { name: "AI-анализатор анализов", spec: "Кровь, моча, маркеры" },
      de: { name: "KI-Laboranalysator", spec: "Blut, Urin, Marker" },
      pl: { name: "Analizator laboratoryjny AI", spec: "Krew, mocz, markery" },
      es: { name: "Analizador de laboratorio de IA", spec: "Sangre, orina, marcadores" }
    }
  },
  ai_imaging: {
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    translations: {
      en: { name: "AI MRI/CT Analyzer", spec: "Imaging diagnostics" },
      ru: { name: "AI-МРТ/КТ", spec: "Лучевая диагностика" },
      de: { name: "KI-MRT/CT-Analysator", spec: "Bildgebende Diagnostik" },
      pl: { name: "Analizator MRI/CT AI", spec: "Diagnostyka obrazowa" },
      es: { name: "Analizador de RM/TC de IA", spec: "Diagnóstico por imágenes" }
    }
  }
};

export const getAllDoctors = (lang: string = "en"): DoctorInfo[] => {
  const currentLang = ["en", "ru", "de", "pl", "es"].includes(lang) ? lang : "en";
  return Object.entries(DOCTOR_DEFINITIONS).map(([id, def]) => {
    const translation = def.translations[currentLang] || def.translations["en"];
    return {
      id,
      name: translation.name,
      spec: translation.spec,
      color: def.color,
      bg: def.bg
    };
  });
};

export const getDoctorById = (id: string, lang: string = "en"): DoctorInfo => {
  const all = getAllDoctors(lang);
  const found = all.find((d) => d.id === id);
  if (found) return found;
  return {
    id,
    name: id,
    spec: "Specialist",
    color: "text-slate-500",
    bg: "bg-slate-500/10"
  };
};
