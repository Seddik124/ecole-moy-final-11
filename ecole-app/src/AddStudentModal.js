import React, { useState } from 'react';

export default function AddStudentModal({ onAdd, onClose }) {
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nom.trim()) return;
    setLoading(true);
    await onAdd(nom.trim());
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>➕ إضافة تلميذ جديد</h2>
        <div className="form-group">
          <label className="form-label">الاسم الكامل *</label>
          <input
            className="form-input"
            value={nom}
            onChange={e => setNom(e.target.value)}
            placeholder="مثال: محمد بن علي"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !nom.trim()}
          >
            {loading ? '⏳ جارٍ الإضافة...' : '✓ إضافة'}
          </button>
        </div>
      </div>
    </div>
  );
}
