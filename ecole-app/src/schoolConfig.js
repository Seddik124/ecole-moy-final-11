// Configuration des modules et matières
// La colonne `matiere` en base = nom direct de la matière (ex: "رياضيات")

export const MODULES = {
  arabique: {
    label: "عربية",
    color: "#1e40af",
    bg: "#dbeafe",
    border: "#93c5fd",
    matieres: ["تواصل", "إنتاج كتابي", "قراءة", "قواعد اللغة"],
  },
  scientifique: {
    label: "علمية",
    color: "#065f46",
    bg: "#d1fae5",
    border: "#6ee7b7",
    matieres: ["رياضيات", "إيقاظ علمي", "تربية تكنولوجية"],
  },
  sociale: {
    label: "اجتماعية",
    color: "#7c3aed",
    bg: "#ede9fe",
    border: "#c4b5fd",
    matieres_completes: ["جغرافيا", "تاريخ", "مدنية", "اسلامية"],
    matieres_restreintes: ["اسلامية"],
  },
  artistique: {
    label: "فنية",
    color: "#be185d",
    bg: "#fce7f3",
    border: "#f9a8d4",
    matieres: ["تشكيلية", "موسيقية", "بدنية"],
  },
  francaise: {
    label: "فرنسية",
    color: "#92400e",
    bg: "#fef3c7",
    border: "#fde68a",
    matieres: ["expression écrite", "expression orale", "lecture", "langue"],
  },
  anglaise: {
    label: "Anglais",
    color: "#1e3a5f",
    bg: "#e0f2fe",
    border: "#7dd3fc",
    matieres: ["Anglais"],
    annees_uniquement: [4, 5, 6],
  },
};

export const getModulesForNiveau = (niveau) => {
  const result = {};
  Object.entries(MODULES).forEach(([key, mod]) => {
    // Anglais : seulement niveaux 4, 5, 6
    if (key === "anglaise") {
      if (!mod.annees_uniquement.includes(niveau)) return;
      result[key] = { ...mod, matieres: mod.matieres };
      return;
    }
    // Sociale : niveaux 5-6 = tout, niveaux 1-4 = islamique seulement
    if (key === "sociale") {
      result[key] = {
        ...mod,
        matieres: niveau >= 5 ? mod.matieres_completes : mod.matieres_restreintes,
      };
      return;
    }
    result[key] = { ...mod };
  });
  return result;
};

// Toutes les matières d'un niveau, à plat (pour requêtes Supabase)
export const getAllMatieresForNiveau = (niveau) => {
  const mods = getModulesForNiveau(niveau);
  const all = [];
  Object.values(mods).forEach(mod => mod.matieres.forEach(m => all.push(m)));
  return all;
};

export const NIVEAUX = [1, 2, 3, 4, 5, 6];
export const NIVEAU_LABELS = {
  1: "السنة الأولى",
  2: "السنة الثانية",
  3: "السنة الثالثة",
  4: "السنة الرابعة",
  5: "السنة الخامسة",
  6: "السنة السادسة",
};

export const MODULE_ICONS = {
  arabique: "📖",
  scientifique: "🔬",
  sociale: "🌍",
  artistique: "🎨",
  francaise: "🇫🇷",
  anglaise: "🇬🇧",
};
