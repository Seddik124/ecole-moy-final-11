import React, { useState, useCallback } from 'react';
import { getModulesForNiveau, MODULE_ICONS } from './schoolConfig';
import { supabase } from './supabaseClient';

export default function SaisieView({ eleves, niveau, onNoteUpdated, addToast }) {
  const modules = getModulesForNiveau(niveau);

  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [localNotes, setLocalNotes] = useState({});  // { eleveId: valeur }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);  // mode lecture après enregistrement

  // Quand on sélectionne une matière, charger les notes existantes
  const selectMatiere = (mk, m) => {
    setSelectedModule(mk);
    setSelectedMatiere(m);
    setSaved(false);
    // Pré-remplir avec les notes déjà en base
    const init = {};
    eleves.forEach(e => {
      const v = e.notes?.[m];
      init[e.id] = v !== undefined && v !== null ? String(v) : '';
    });
    setLocalNotes(init);
  };

  const handleChange = (eleveId, value) => {
    setLocalNotes(prev => ({ ...prev, [eleveId]: value }));
  };

  const handleSaveAll = useCallback(async () => {
    if (!selectedMatiere) return;
    setSaving(true);

    const upserts = [];
    const deletes = [];

    eleves.forEach(e => {
      const raw = localNotes[e.id];
      if (raw === undefined || raw === '') {
        deletes.push(e.id);
      } else {
        const val = parseFloat(raw);
        if (!isNaN(val) && val >= 0 && val <= 20) {
          upserts.push({ eleve_id: e.id, matiere: selectedMatiere, valeur: val });
        }
      }
    });

    try {
      // Upsert les notes remplies
      if (upserts.length > 0) {
        const { error } = await supabase.from('notes')
          .upsert(upserts, { onConflict: 'eleve_id,matiere' });
        if (error) throw error;
      }
      // Supprimer les notes vidées
      for (const eleveId of deletes) {
        await supabase.from('notes')
          .delete()
          .eq('eleve_id', eleveId)
          .eq('matiere', selectedMatiere);
      }

      // Mettre à jour la mémoire locale
      eleves.forEach(e => {
        const raw = localNotes[e.id];
        const val = raw === '' ? null : parseFloat(raw);
        onNoteUpdated(e.id, selectedMatiere, isNaN(val) ? null : val);
      });

      addToast(`تم حفظ نقاط "${selectedMatiere}" بنجاح ✓`);
      setSaved(true);
    } catch (e) {
      addToast('خطأ في الحفظ: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  }, [selectedMatiere, localNotes, eleves, onNoteUpdated, addToast]);

  const mod = selectedModule ? modules[selectedModule] : null;

  return (
    <div>
      <div className="section-header">
        <div className="section-title"><span>✏️</span><span>تسجيل النقاط حسب المادة</span></div>
      </div>

      {/* ── Étape 1 : choisir une matière ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 14, fontSize: '0.95rem' }}>
          الخطوة 1 — اختر المادة:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {Object.entries(modules).map(([mk, mod]) =>
            mod.matieres.map(m => {
              const isSelected = selectedModule === mk && selectedMatiere === m;
              return (
                <button
                  key={`${mk}-${m}`}
                  onClick={() => selectMatiere(mk, m)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 30,
                    border: `2px solid ${isSelected ? mod.color : mod.border}`,
                    background: isSelected ? mod.color : mod.bg,
                    color: isSelected ? 'white' : mod.color,
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {MODULE_ICONS[mk]} {m}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Étape 2 : saisir les notes ── */}
      {selectedMatiere && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16, flexWrap: 'wrap', gap: 12
          }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
              الخطوة 2 — نقاط مادة:{' '}
              <span style={{
                background: mod?.bg, color: mod?.color,
                padding: '3px 14px', borderRadius: 20, marginRight: 6
              }}>
                {MODULE_ICONS[selectedModule]} {selectedMatiere}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {saved && (
                <button className="btn btn-ghost btn-sm" onClick={() => setSaved(false)}>
                  ✏️ تعديل
                </button>
              )}
              {!saved && (
                <button
                  className="btn btn-primary"
                  onClick={handleSaveAll}
                  disabled={saving}
                >
                  {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ كل النقاط'}
                </button>
              )}
            </div>
          </div>

          {eleves.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">👥</div>
              <p>لا يوجد تلاميذ في هذا المستوى</p>
            </div>
          ) : (
            <div style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <table className="notes-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'right', paddingRight: 24, width: '60%' }}>التلميذ</th>
                    <th style={{ textAlign: 'center', width: '20%' }}>النقطة / 20</th>
                    <th style={{ textAlign: 'center', width: '20%' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {eleves.map((eleve, idx) => {
                    const val = localNotes[eleve.id] ?? '';
                    const num = parseFloat(val);
                    const isValid = val === '' || (!isNaN(num) && num >= 0 && num <= 20);
                    const hasNote = val !== '' && !isNaN(num);
                    return (
                      <tr key={eleve.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ textAlign: 'right', paddingRight: 24, fontWeight: 600, fontSize: '0.95rem' }}>
                          {eleve.nom}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {saved ? (
                            <span style={{
                              fontWeight: 700, fontSize: '1.05rem',
                              color: hasNote ? (num < 10 ? 'var(--danger)' : num >= 15 ? 'var(--success)' : 'var(--primary)') : 'var(--text-muted)'
                            }}>
                              {hasNote ? num : '—'}
                            </span>
                          ) : (
                            <input
                              type="number"
                              className={`note-input${!isValid ? ' invalid' : ''}`}
                              style={{ width: 80 }}
                              min="0" max="20" step="0.25"
                              value={val}
                              placeholder="—"
                              onChange={e => handleChange(eleve.id, e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') { const rows = document.querySelectorAll('.note-input'); const i = Array.from(rows).indexOf(e.target); if (rows[i+1]) rows[i+1].focus(); } }}
                            />
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {hasNote ? (
                            <span className={`badge ${num >= 10 ? 'moyenne-bien' : 'moyenne-insuffisant'}`}>
                              {num >= 15 ? 'ممتاز' : num >= 12 ? 'جيد' : num >= 10 ? 'مقبول' : 'ضعيف'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>لم تُسجَّل</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedMatiere && (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <div className="emoji">👆</div>
          <p>اختر مادة من القائمة أعلاه لبدء تسجيل النقاط</p>
        </div>
      )}
    </div>
  );
}