import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { supabase } from './supabaseClient';
import { NIVEAUX, NIVEAU_LABELS, getModulesForNiveau, getAllMatieresForNiveau } from './schoolConfig';
import PaniersView from './PaniersView';
import ClassementView from './ClassementView';
import NotesView from './NotesView';
import AddStudentModal from './AddStudentModal';
import { useToast, ToastContainer } from './Toast';
import SaisieView from './SaisieView';
import ClassGradesOverviewModal from './ClassGradesOverviewModal';

const TABS = [
  { id: 'paniers', label: '📦 الوحدات' },
  { id: 'classement', label: '🏆 الترتيب' },
  { id: 'notes', label: '📊 النقاط' },
  { id: 'saisie', label: '✏️ تسجيل النقاط' },  // ← ajouter cette ligne
];
export default function App() {
  const [niveau, setNiveau] = useState(1);
  const [tab, setTab] = useState('paniers');

  // annee scolaire active
  const [anneeId, setAnneeId] = useState(null);
  const [anneeLabel, setAnneeLabel] = useState('');
  const [annees, setAnnees] = useState([]);

  // données élèves : { [niveau]: [{id, nom, niveau, notes:{matiere: valeur}}] }
  const [elevesMap, setElevesMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGradesOverview, setShowGradesOverview] = useState(false);
  const [showAddAnnee, setShowAddAnnee] = useState(false);
  const [newAnneeLabel, setNewAnneeLabel] = useState('2024-2025');
  const [creatingAnnee, setCreatingAnnee] = useState(false);

  const { toasts, addToast } = useToast();

  // ── Charger les années scolaires ──────────────────────────────────────────
  const loadAnnees = useCallback(async () => {
    const { data, error } = await supabase
      .from('annees_scolaires')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    setAnnees(data || []);
    if (data && data.length > 0) {
      setAnneeId(data[0].id);
      setAnneeLabel(data[0].label);
    }
  }, []);

  useEffect(() => { loadAnnees(); }, [loadAnnees]);

  // ── Créer une nouvelle année scolaire ─────────────────────────────────────
  const handleCreateAnnee = async () => {
    if (!newAnneeLabel.trim()) return;
    setCreatingAnnee(true);
    const { data, error } = await supabase
      .from('annees_scolaires')
      .insert({ label: newAnneeLabel.trim() })
      .select()
      .single();
    setCreatingAnnee(false);
    if (error) { addToast('خطأ في الإنشاء: ' + error.message, 'error'); return; }
    addToast('تم إنشاء السنة الدراسية ✓');
    setAnnees(prev => [data, ...prev]);
    setAnneeId(data.id);
    setAnneeLabel(data.label);
    setShowAddAnnee(false);
  };

  // ── Charger les élèves + leurs notes pour le niveau sélectionné ───────────
  const fetchEleves = useCallback(async (niv, aId) => {
    if (!aId) return;
    setLoading(true);
    try {
      // 1. Récupérer les élèves de ce niveau et cette année
      const { data: elevesData, error: elevesErr } = await supabase
        .from('eleves')
        .select('id, nom, niveau')
        .eq('niveau', niv)
        .eq('annee_scolaire_id', aId)
        .order('nom');

      if (elevesErr) throw elevesErr;
      if (!elevesData || elevesData.length === 0) {
        setElevesMap(prev => ({ ...prev, [niv]: [] }));
        return;
      }

      // 2. Récupérer uniquement les matières de ce niveau
      const matieresDuNiveau = getAllMatieresForNiveau(niv);
      const eleveIds = elevesData.map(e => e.id);

      const { data: notesData, error: notesErr } = await supabase
        .from('notes')
        .select('eleve_id, matiere, valeur')
        .in('eleve_id', eleveIds)
        .in('matiere', matieresDuNiveau);

      if (notesErr) throw notesErr;

      // 3. Construire map notes par élève
      const notesMap = {};
      (notesData || []).forEach(n => {
        if (!notesMap[n.eleve_id]) notesMap[n.eleve_id] = {};
        notesMap[n.eleve_id][n.matiere] = n.valeur;
      });

      const elevesAvecNotes = elevesData.map(e => ({
        ...e,
        notes: notesMap[e.id] || {},
      }));

      setElevesMap(prev => ({ ...prev, [niv]: elevesAvecNotes }));
    } catch (e) {
      addToast('خطأ في تحميل البيانات: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (anneeId) fetchEleves(niveau, anneeId);
  }, [niveau, anneeId, fetchEleves]);

  const currentEleves = elevesMap[niveau] || [];

  // ── Ajouter un élève ──────────────────────────────────────────────────────
  const handleAddEleve = async (nom) => {
    if (!anneeId) { addToast('لا توجد سنة دراسية محددة', 'error'); return; }
    const { data, error } = await supabase
      .from('eleves')
      .insert({ nom, niveau, annee_scolaire_id: anneeId })
      .select('id, nom, niveau')
      .single();
    if (error) { addToast('خطأ في الإضافة: ' + error.message, 'error'); return; }
    setElevesMap(prev => ({
      ...prev,
      [niveau]: [...(prev[niveau] || []), { ...data, notes: {} }]
        .sort((a, b) => a.nom.localeCompare(b.nom, 'ar'))
    }));
    addToast('تمت إضافة التلميذ بنجاح ✓');
    setShowAddModal(false);
  };

  // ── Mise à jour note en mémoire locale ───────────────────────────────────
  const handleNoteUpdated = useCallback((eleveId, matiere, valeur) => {
    setElevesMap(prev => ({
      ...prev,
      [niveau]: (prev[niveau] || []).map(e =>
        e.id === eleveId
          ? { ...e, notes: { ...e.notes, [matiere]: valeur } }
          : e
      ),
    }));
  }, [niveau]);

  // ── Mise à jour nom élève en mémoire ─────────────────────────────────────
  const handleNomUpdated = useCallback((eleveId, nouveauNom) => {
    setElevesMap(prev => ({
      ...prev,
      [niveau]: (prev[niveau] || []).map(e =>
        e.id === eleveId ? { ...e, nom: nouveauNom } : e
      ),
    }));
  }, [niveau]);

  // ── Supprimer élève en mémoire ───────────────────────────────────────────
  const handleEleveDeleted = useCallback((eleveId) => {
    setElevesMap(prev => ({
      ...prev,
      [niveau]: (prev[niveau] || []).filter(e => e.id !== eleveId)
    }));
  }, [niveau]);

  // ── Changer d'année scolaire ──────────────────────────────────────────────
  const handleAnneeChange = (e) => {
    const id = e.target.value;
    const found = annees.find(a => a.id === id);
    if (found) { setAnneeId(id); setAnneeLabel(found.label); setElevesMap({}); }
  };

  return (
    <div className="app-wrapper">
      <ToastContainer toasts={toasts} />

      {/* ── Top Bar ── */}
      <header className="topbar">
        <div className="topbar-brand">
          <span className="icon">🏫</span>
          <h1>نظام إدارة نقاط المدرسة الابتدائية</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {annees.length > 1 && (
            <select className="select-styled" value={anneeId || ''} onChange={handleAnneeChange}
              style={{ color: 'white', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
              {annees.map(a => <option key={a.id} value={a.id} style={{ color: '#1e293b' }}>{a.label}</option>)}
            </select>
          )}
          {anneeLabel
            ? <span className="topbar-meta">السنة الدراسية: {anneeLabel}</span>
            : <span className="topbar-meta" style={{ color: '#fca5a5' }}>⚠️ لا توجد سنة دراسية</span>
          }
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            onClick={() => setShowAddAnnee(true)}
            title="إضافة سنة دراسية جديدة"
          >
            ＋ سنة جديدة
          </button>
        </div>
      </header>

      <main className="main-content">

        {/* ── Bandeau si pas d'année ── */}
        {!anneeId && (
          <div style={{
            background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12,
            padding: '20px 24px', marginBottom: 24, display: 'flex',
            alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '1rem', marginBottom: 4 }}>
                ⚠️ لم يتم إنشاء سنة دراسية بعد
              </div>
              <div style={{ color: '#7f1d1d', fontSize: '0.88rem' }}>
                يجب إنشاء سنة دراسية أولاً قبل إضافة التلاميذ والنقاط
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddAnnee(true)}>
              ＋ إنشاء سنة دراسية الآن
            </button>
          </div>
        )}

        {/* ── Sélecteur de niveau ── */}
        <div className="section-header mb-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>المستوى:</span>
            <div className="tabs-bar" style={{ marginBottom: 0 }}>
              {NIVEAUX.map(n => (
                <button
                  key={n}
                  className={`tab-btn${niveau === n ? ' active' : ''}`}
                  onClick={() => setNiveau(n)}
                >
                  {NIVEAU_LABELS[n]}
                </button>
              ))}
            </div>
          </div>
          {tab !== 'paniers' && anneeId && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="btn btn-accent"
                onClick={() => setShowGradesOverview(true)}
                disabled={currentEleves.length === 0}
                title="عرض جميع نقاط التلاميذ مجمّعة حسب الوحدات"
              >
                📋 عرض نقاط الفصل
              </button>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                ➕ إضافة تلميذ
              </button>
            </div>
          )}
        </div>

        {/* ── Breadcrumb ── */}
        <div className="breadcrumb">
          <span className="breadcrumb-current">🏫 {NIVEAU_LABELS[niveau]}</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{TABS.find(t => t.id === tab)?.label}</span>
          <span className="breadcrumb-sep">—</span>
          <span className="text-muted">{currentEleves.length} تلميذ مسجل</span>
        </div>

        {/* ── Onglets ── */}
        <div className="tabs-bar" style={{ marginBottom: 24 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Contenu ── */}
        {loading && tab !== 'paniers' ? (
          <div className="loading-spinner">
            <div className="spinner" />
            <span>جارٍ تحميل البيانات...</span>
          </div>
        ) : (
          <>
            {tab === 'paniers' && <PaniersView niveau={niveau} />}
            {tab === 'classement' && (
              <ClassementView eleves={currentEleves} niveau={niveau} />
            )}
            {tab === 'notes' && (
              <NotesView
                eleves={currentEleves}
                niveau={niveau}
                anneeId={anneeId}
                onNoteUpdated={handleNoteUpdated}
                onNomUpdated={handleNomUpdated}
                onEleveDeleted={handleEleveDeleted}
                addToast={addToast}
              />
            )}
            {tab === 'saisie' && (
                <SaisieView
                eleves={currentEleves}
                niveau={niveau}
                onNoteUpdated={handleNoteUpdated}
                addToast={addToast}
               />
             )}
          </>
        )}
      </main>

      {/* ── Modal ajout élève ── */}
      {showAddModal && (
        <AddStudentModal onAdd={handleAddEleve} onClose={() => setShowAddModal(false)} />
      )}

      {/* ── Modal vue d'ensemble des notes par panier ── */}
      {showGradesOverview && (
        <ClassGradesOverviewModal
          eleves={currentEleves}
          niveau={niveau}
          onClose={() => setShowGradesOverview(false)}
        />
      )}

      {/* ── Modal création année scolaire ── */}
      {showAddAnnee && (
        <div className="modal-overlay" onClick={() => setShowAddAnnee(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>📅 إنشاء سنة دراسية جديدة</h2>
            <div className="form-group">
              <label className="form-label">تسمية السنة الدراسية</label>
              <input
                className="form-input"
                value={newAnneeLabel}
                onChange={e => setNewAnneeLabel(e.target.value)}
                placeholder="مثال: 2024-2025"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleCreateAnnee(); }}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAddAnnee(false)}>إلغاء</button>
              <button
                className="btn btn-primary"
                onClick={handleCreateAnnee}
                disabled={creatingAnnee || !newAnneeLabel.trim()}
              >
                {creatingAnnee ? '⏳ جارٍ الإنشاء...' : '✓ إنشاء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
