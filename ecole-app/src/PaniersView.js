import React, { useState, useRef } from 'react';
import { getModulesForNiveau, MODULE_ICONS } from './schoolConfig';

export default function PaniersView({ niveau }) {
  const modules = getModulesForNiveau(niveau);
  const defaultOrder = Object.keys(modules);
  const [order, setOrder] = useState(defaultOrder);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const dragRef = useRef(null);

  // Re-sync si niveau change
  const prevNiveau = useRef(niveau);
  if (prevNiveau.current !== niveau) {
    prevNiveau.current = niveau;
    const newKeys = Object.keys(getModulesForNiveau(niveau));
    setOrder(newKeys);
  }

  const orderedMods = order
    .filter(k => modules[k])
    .map(k => ({ key: k, ...modules[k] }));

  const onDragStart = (e, idx) => {
    setDragIdx(idx);
    dragRef.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragEnter = (_, idx) => { if (dragRef.current !== idx) setOverIdx(idx); };
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDragEnd = () => {
    if (overIdx !== null && dragIdx !== null && overIdx !== dragIdx) {
      const next = [...order];
      const [removed] = next.splice(dragIdx, 1);
      next.splice(overIdx, 0, removed);
      setOrder(next);
    }
    setDragIdx(null);
    setOverIdx(null);
    dragRef.current = null;
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">
          <span>📦</span>
          <span>الوحدات والمواد الدراسية</span>
        </div>
        <span className="text-sm text-muted">⠿ اسحب الوحدة لتغيير ترتيبها</span>
      </div>

      <div className="paniers-grid">
        {orderedMods.map((mod, idx) => (
          <div
            key={mod.key}
            className={`panier-card${dragIdx === idx ? ' dragging' : ''}${overIdx === idx ? ' drag-over' : ''}`}
            draggable
            onDragStart={e => onDragStart(e, idx)}
            onDragEnter={e => onDragEnter(e, idx)}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            style={{ borderColor: overIdx === idx ? 'var(--accent)' : mod.border }}
          >
            {/* En-tête coloré */}
            <div className="panier-header" style={{ background: mod.color }}>
              <div className="panier-label" style={{ color: '#fff' }}>
                <span>{MODULE_ICONS[mod.key]}</span>
                {mod.label}
              </div>
              <span className="drag-handle" title="اسحب">⠿</span>
            </div>

            {/* Corps */}
            <div className="panier-body" style={{ background: mod.bg }}>
              {mod.matieres.map(m => (
                <div key={m} className="matiere-row">
                  <span className="matiere-name">{m}</span>
                  <span className="matiere-coeff">معامل 1</span>
                </div>
              ))}
              <div style={{
                marginTop: 10, paddingTop: 8,
                borderTop: `1px dashed ${mod.border}`,
                fontSize: '0.8rem', color: mod.color, fontWeight: 700
              }}>
                {mod.matieres.length} مادة — المعدل الحسابي
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
