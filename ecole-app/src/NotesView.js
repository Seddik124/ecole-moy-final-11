import React, { useState, useCallback, useRef } from 'react';
import { getModulesForNiveau, MODULE_ICONS } from './schoolConfig';
import { supabase } from './supabaseClient';

function calcSectionAvg(notes, matieres) {
  let sum = 0, count = 0;
  matieres.forEach(m => {
    const v = notes?.[m];
    if (v !== undefined && v !== null && v !== '' && !isNaN(parseFloat(v))) {
      sum += parseFloat(v); count++;
    }
  });
  return count ? (sum / count).toFixed(2) : null;
}

export default function NotesView({ eleves, niveau, anneeId, onNoteUpdated, onNomUpdated, onEleveDeleted, addToast }) {
  const modules = getModulesForNiveau(niveau);

  // localNotes[eleveId][matiere] = valeur string (en cours de saisie)
  const [localNotes, setLocalNotes] = useState({});
  // editingNom: { id, value }
  const [editingNom, setEditingNom] = useState(null);
  const [savingKeys, setSavingKeys] = useState(new Set());
  const savingRef = useRef(new Set());

  const getDisplayNote = (eleve, matiere) => {
    const local = localNotes[eleve.id]?.[matiere];
    if (local !== undefined) return local;
    const db = eleve.notes?.[matiere];
    return db !== undefined && db !== null ? String(db) : '';
  };

  const handleChange = (eleveId, matiere, value) => {
    setLocalNotes(prev => ({
      ...prev,
      [eleveId]: { ...(prev[eleveId] || {}), [matiere]: value }
    }));
  };

  const handleSave = useCallback(async (eleve, matiere) => {
    const raw = localNotes[eleve.id]?.[matiere];
    if (raw === undefined) return; // pas de changement local

    const key = `${eleve.id}__${matiere}`;
    if (savingRef.current.has(key)) return;

    const valeur = raw === '' ? null : parseFloat(raw);
    if (valeur !== null && (isNaN(valeur) || valeur < 0 || valeur > 20)) {
      addToast('النقطة يجب أن تكون بين 0 و 20', 'error');
      return;
    }

    savingRef.current.add(key);
    setSavingKeys(prev => new Set([...prev, key]));

    try {
      if (valeur === null) {
        // Supprimer la note si vide
        await supabase.from('notes')
          .delete()
          .eq('eleve_id', eleve.id)
          .eq('matiere', matiere);
      } else {
        const { error } = await supabase.from('notes').upsert(
          { eleve_id: eleve.id, matiere, valeur },
          { onConflict: 'eleve_id,matiere' }
        );
        if (error) throw error;
      }

      addToast('تم الحفظ ✓');
      onNoteUpdated(eleve.id, matiere, valeur);
      setLocalNotes(prev => {
        const next = { ...prev };
        if (next[eleve.id]) {
          next[eleve.id] = { ...next[eleve.id] };
          delete next[eleve.id][matiere];
        }
        return next;
      });
    } catch (e) {
      addToast('خطأ في الحفظ: ' + e.message, 'error');
    } finally {
      savingRef.current.delete(key);
      setSavingKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
    }
  }, [localNotes, onNoteUpdated, addToast]);

  // ── Modifier le nom ────────────────────────────────────────────────────────
  const startEditNom = (eleve) => setEditingNom({ id: eleve.id, value: eleve.nom });

  const saveNom = async () => {
    if (!editingNom || !editingNom.value.trim()) return;
    const { error } = await supabase.from('eleves')
      .update({ nom: editingNom.value.trim() })
      .eq('id', editingNom.id);
    if (error) { addToast('خطأ في تعديل الاسم', 'error'); return; }
    addToast('تم تعديل الاسم ✓');
    onNomUpdated(editingNom.id, editingNom.value.trim());
    setEditingNom(null);
  };

  const deleteEleve = async (eleve) => {
    if (!window.confirm(`هل أنت متأكد من حذف التلميذ "${eleve.nom}" وكل نقاطه؟`)) return;
    const { error } = await supabase.from('eleves').delete().eq('id', eleve.id);
    if (error) { addToast('خطأ في الحذف', 'error'); return; }
    addToast('تم حذف التلميذ بنجاح ✓');
    if (typeof onEleveDeleted === 'function') {
      onEleveDeleted(eleve.id);
    }
  };

  if (eleves.length === 0) {
    return (
      <div className="empty-state">
        <div className="emoji">📝</div>
        <p>لم يتم إضافة أي تلميذ بعد</p>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <div className="section-title"><span>📝</span><span>جدول النقاط</span></div>
        <span className="text-sm text-muted">أدخل النقطة ثم اضغط Enter أو انقر خارج الخانة للحفظ</span>
      </div>

      {Object.entries(modules).map(([mk, mod]) => (
        <div key={mk} className="notes-section mb-4">
          {/* En-tête de section */}
          <div className="notes-section-header" style={{ background: mod.bg, color: mod.color }}>
            <span style={{ fontSize: '1.05rem' }}>{MODULE_ICONS[mk]} {mod.label}</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.75 }}>
              {mod.matieres.length} مادة — معامل 1
            </span>
          </div>

          <div className="notes-table-wrap">
            <table className="notes-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 170, textAlign: 'right' }}>التلميذ</th>
                  {mod.matieres.map(m => (
                    <th key={m} style={{ minWidth: 88 }}>{m}</th>
                  ))}
                  <th style={{ minWidth: 90, background: mod.bg, color: mod.color, fontWeight: 700 }}>
                    معدل الوحدة
                  </th>
                </tr>
              </thead>
              <tbody>
                {eleves.map(eleve => {
                  // Notes à jour pour calcul de moyenne section
                  const notesForCalc = { ...eleve.notes };
                  mod.matieres.forEach(m => {
                    const local = localNotes[eleve.id]?.[m];
                    if (local !== undefined) notesForCalc[m] = local;
                  });
                  const sectionAvg = calcSectionAvg(notesForCalc, mod.matieres);

                  return (
                    <tr key={eleve.id}>
                      {/* Nom de l'élève + bouton édition */}
                      <td>
                        <div className="student-name-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {editingNom?.id === eleve.id ? (
                            <>
                              <input
                                className="note-input"
                                style={{ width: 130 }}
                                value={editingNom.value}
                                onChange={e => setEditingNom(p => ({ ...p, value: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') saveNom(); if (e.key === 'Escape') setEditingNom(null); }}
                                autoFocus
                              />
                              <button className="btn btn-success btn-sm" onClick={saveNom}>✓</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingNom(null)}>✕</button>
                            </>
                          ) : (
                            <>
                              <span style={{ fontWeight: 600 }}>{eleve.nom}</span>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button className="edit-name-btn" onClick={() => startEditNom(eleve)} title="تعديل الاسم">✏️</button>
                                <button className="edit-name-btn" style={{ color: 'var(--danger)' }} onClick={() => deleteEleve(eleve)} title="حذف التلميذ">🗑️</button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Inputs de notes */}
                      {mod.matieres.map(m => {
                        const key = `${eleve.id}__${m}`;
                        const val = getDisplayNote(eleve, m);
                        const isSaving = savingKeys.has(key);
                        const isInvalid = val !== '' && (isNaN(parseFloat(val)) || parseFloat(val) < 0 || parseFloat(val) > 20);
                        return (
                          <td key={m}>
                            <input
                              type="number"
                              className={`note-input${isInvalid ? ' invalid' : ''}`}
                              min="0" max="20" step="0.25"
                              value={val}
                              placeholder="—"
                              disabled={isSaving}
                              onChange={e => handleChange(eleve.id, m, e.target.value)}
                              onBlur={() => handleSave(eleve, m)}
                              onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                            />
                          </td>
                        );
                      })}

                      {/* Moyenne de la section */}
                      <td style={{ textAlign: 'center' }}>
                        {sectionAvg !== null ? (
                          <span className={`moyenne-badge ${parseFloat(sectionAvg) >= 10 ? 'moyenne-bien' : 'moyenne-insuffisant'}`}>
                            {sectionAvg}
                          </span>
                        ) : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
