-- Schéma Supabase pour l'application de gestion des notes scolaires

-- Table des classes (niveaux)
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  annee INTEGER NOT NULL CHECK (annee BETWEEN 1 AND 6),
  label TEXT NOT NULL,
  ordre_paniers JSONB DEFAULT '[]'::jsonb, -- ordre des paniers drag-and-drop
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des étudiants
CREATE TABLE IF NOT EXISTS etudiants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  classe_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  etudiant_id UUID REFERENCES etudiants(id) ON DELETE CASCADE,
  classe_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,   -- ex: 'arabique', 'scientifique'
  matiere TEXT NOT NULL,      -- ex: 'رياضيات'
  note NUMERIC(4,2) CHECK (note >= 0 AND note <= 20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(etudiant_id, module_key, matiere)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_notes_etudiant ON notes(etudiant_id);
CREATE INDEX IF NOT EXISTS idx_notes_classe ON notes(classe_id);
CREATE INDEX IF NOT EXISTS idx_etudiants_classe ON etudiants(classe_id);

-- Activer RLS (Row Level Security) - optionnel selon votre configuration
-- ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE etudiants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Insérer les 6 classes par défaut
INSERT INTO classes (annee, label) VALUES
  (1, 'السنة الأولى'),
  (2, 'السنة الثانية'),
  (3, 'السنة الثالثة'),
  (4, 'السنة الرابعة'),
  (5, 'السنة الخامسة'),
  (6, 'السنة السادسة')
ON CONFLICT DO NOTHING;
