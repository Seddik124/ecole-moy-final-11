import React from 'react';
import { getModulesForNiveau, MODULE_ICONS, NIVEAU_LABELS } from './schoolConfig';

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

function getBadgeClass(m) {
  if (m === null) return '';
  const f = parseFloat(m);
  if (f >= 15) return 'moyenne-excellent';
  if (f >= 12) return 'moyenne-bien';
  if (f >= 10) return 'moyenne-passable';
  return 'moyenne-insuffisant';
}

function formatNote(v) {
  if (v === undefined || v === null || v === '') return null;
  return parseFloat(v).toFixed(2).replace(/\.00$/, '');
}

export default function ClassGradesOverviewModal({ eleves, niveau, onClose }) {
  const modules = getModulesForNiveau(niveau);
  const moduleEntries = Object.entries(modules);

  const sorted = [...eleves].sort((a, b) =>
    a.nom.localeCompare(b.nom, 'ar')
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-wide-header">
          <h2>
            📋 نقاط الفصل — {NIVEAU_LABELS[niveau]}
            <span className="modal-wide-subtitle">{eleves.length} تلميذ</span>
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ إغلاق</button>
        </div>

        {eleves.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="emoji">👥</div>
            <p>لا يوجد تلاميذ في هذا المستوى</p>
          </div>
        ) : (
          <div className="overview-table-wrap">
            <table className="overview-table">
              <thead>
                <tr className="overview-panier-row">
                  <th className="overview-col-name" rowSpan={2}>التلميذ</th>
                  {moduleEntries.map(([k, mod]) => (
                    <th
                      key={k}
                      colSpan={mod.matieres.length + 1}
                      className="overview-panier-header"
                      style={{ background: mod.bg, color: mod.color, borderColor: mod.border }}
                    >
                      {MODULE_ICONS[k]} {mod.label}
                    </th>
                  ))}
                </tr>
                <tr className="overview-matiere-row">
                  {moduleEntries.map(([k, mod]) => (
                    <React.Fragment key={k}>
                      <th
                        className="overview-col-avg-header"
                        style={{ background: mod.bg, color: mod.color, borderColor: mod.border }}
                      >
                        معدل
                      </th>
                      {mod.matieres.map(m => (
                        <th key={`${k}-${m}`} className="overview-col-matiere">{m}</th>
                      ))}
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(eleve => (
                  <tr key={eleve.id}>
                    <td className="overview-col-name">{eleve.nom}</td>
                    {moduleEntries.map(([k, mod]) => {
                      const avg = calcSectionAvg(eleve.notes, mod.matieres);
                      return (
                        <React.Fragment key={k}>
                          <td className="overview-col-avg">
                            {avg !== null ? (
                              <span className={`moyenne-badge moyenne-badge-sm ${getBadgeClass(avg)}`}>
                                {avg}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          {mod.matieres.map(m => {
                            const note = formatNote(eleve.notes?.[m]);
                            return (
                              <td key={`${k}-${m}`} className="overview-col-note">
                                {note !== null ? note : <span className="text-muted">—</span>}
                              </td>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
