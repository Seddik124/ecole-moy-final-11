-- Migration pour adapter le schéma existant au projet de notes
-- À exécuter dans Supabase → SQL Editor

-- 1. Ajouter contrainte UNIQUE sur notes (eleve_id, matiere)
--    Indispensable pour le upsert (évite les doublons de notes)
ALTER TABLE notes 
  ADD CONSTRAINT notes_eleve_matiere_unique 
  UNIQUE (eleve_id, matiere);

-- 2. Vérifier que la colonne valeur accepte les décimales (déjà numeric = OK)
-- 3. Ajouter un index pour accélérer les requêtes par élève
CREATE INDEX IF NOT EXISTS idx_notes_eleve_id ON notes(eleve_id);
CREATE INDEX IF NOT EXISTS idx_eleves_niveau ON eleves(niveau);
CREATE INDEX IF NOT EXISTS idx_eleves_annee ON eleves(annee_scolaire_id);

-- 4. Exemple d'année scolaire à insérer si la table est vide
-- INSERT INTO annees_scolaires (label) VALUES ('2024-2025') ON CONFLICT DO NOTHING;
