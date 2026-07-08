import React from 'react';
import { getModulesForNiveau, MODULE_ICONS } from './schoolConfig';

function getMoyenneModuleEleve(eleve, matieres) {
  let sum = 0, count = 0;
  matieres.forEach(m => {
    const v = eleve.notes?.[m];
    if (v !== undefined && v !== null && v !== '') {
      sum += parseFloat(v); count++;
    }
  });
  return count ? (sum / count).toFixed(2) : null;
}

function getMoyenneGenerale(eleve, modules) {
  let sum = 0, count = 0;
  Object.values(modules).forEach(mod => {
    mod.matieres.forEach(m => {
      const v = eleve.notes?.[m];
      if (v !== undefined && v !== null && v !== '') {
        sum += parseFloat(v); count++;
      }
    });
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

function getTaqdeer(m) {
  if (m === null) return '—';
  const f = parseFloat(m);
  if (f >= 15) return 'ممتاز';
  if (f >= 12) return 'جيد';
  if (f >= 10) return 'مقبول';
  return 'ضعيف';
}

function getRankClass(r) {
  if (r === 1) return 'rank-1';
  if (r === 2) return 'rank-2';
  if (r === 3) return 'rank-3';
  return 'rank-other';
}

export default function ClassementView({ eleves, niveau }) {
  const modules = getModulesForNiveau(niveau);

  const ranked = [...eleves]
    .map(e => ({ ...e, moyGen: getMoyenneGenerale(e, modules) }))
    .sort((a, b) => {
      if (a.moyGen === null && b.moyGen === null) return 0;
      if (a.moyGen === null) return 1;
      if (b.moyGen === null) return -1;
      return parseFloat(b.moyGen) - parseFloat(a.moyGen);
    });

  if (eleves.length === 0) {
    return (
      <div className="empty-state">
        <div className="emoji">👥</div>
        <p>لم يتم إضافة أي تلميذ بعد</p>
        <p className="text-sm text-muted">أضف تلاميذ من خلال زر "إضافة تلميذ"</p>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <div className="section-title">
          <span>🏆</span>
          <span>ترتيب التلاميذ حسب المعدل العام</span>
        </div>
        <span className="badge" style={{ background: '#dbeafe', color: '#1e40af' }}>
          {eleves.length} تلميذ
        </span>
      </div>

      <div className="classement-table-wrapper">
        <table className="classement-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>الرتبة</th>
              <th>الاسم</th>
              {Object.entries(modules).map(([k, mod]) => (
                <th key={k}>{MODULE_ICONS[k]} {mod.label}</th>
              ))}
              <th>المعدل العام</th>
              <th>التقدير</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((e, i) => (
              <tr key={e.id}>
                <td style={{ textAlign: 'center' }}>
                  <span className={`rank-badge ${getRankClass(i + 1)}`}>{i + 1}</span>
                </td>
                <td style={{ fontWeight: 700, textAlign: 'right' }}>{e.nom}</td>
                {Object.entries(modules).map(([k, mod]) => {
                  const avg = getMoyenneModuleEleve(e, mod.matieres);
                  return (
                    <td key={k} style={{ textAlign: 'center' }}>
                      {avg !== null
                        ? <span className={`moyenne-badge ${getBadgeClass(avg)}`}>{avg}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                  );
                })}
                <td style={{ textAlign: 'center' }}>
                  {e.moyGen !== null
                    ? <span className={`moyenne-badge ${getBadgeClass(e.moyGen)}`} style={{ fontSize: '0.97rem' }}>{e.moyGen}</span>
                    : <span className="text-muted">—</span>}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: e.moyGen && parseFloat(e.moyGen) >= 10 ? 'var(--success)' : 'var(--danger)' }}>
                  {getTaqdeer(e.moyGen)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
