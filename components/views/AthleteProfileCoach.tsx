import React, { useState, useEffect } from 'react';
import { Athlete } from '../../types';
import { supabase } from '../../lib/supabase';
import { addObjective, updateObjectiveStatus, requestObjectiveValidation, claimObjectiveReward } from '../../services/athleteService';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell,
} from 'recharts';

interface Props {
  athlete: Athlete;
  onClose: () => void;
  onUpdate: () => void;
}

interface TestResult {
  id: string;
  test_date: string;
  cheville_g: number|null; cheville_g_note: number|null;
  cheville_d: number|null; cheville_d_note: number|null;
  adducteurs: number|null; adducteurs_note: number|null;
  ischios_d: number|null; ischios_g: number|null;
  main_g: number|null; main_d: number|null;
  epaule_g: number|null; epaule_g_note: number|null;
  epaule_d: number|null; epaule_d_note: number|null;
  taille: number|null; masse: number|null;
  cmj_sec: number|null; rm_dc: number|null; rm_squat: number|null;
  traction_lestee: number|null; max_tractions: number|null;
  cmj_eau: number|null; rast: number|null; wist: number|null;
}

// ─── Normalisation pour les radars ────────────────────────────
const norm = (v: number|null, max: number, invert = false) => {
  if (v === null || v === undefined) return 0;
  const pct = Math.min(100, (v / max) * 100);
  return invert ? 100 - pct : pct;
};

const getTestRadarData = (t: TestResult) => ({
  souplesse: [
    { subject: 'Cheville G', val: norm(t.cheville_g_note, 3)*100/100*3, fullMark: 3 },
    { subject: 'Cheville D', val: norm(t.cheville_d_note, 3)*100/100*3, fullMark: 3 },
    { subject: 'Adducteurs', val: norm(t.adducteurs_note, 3)*100/100*3, fullMark: 3 },
    { subject: 'Épaule G',   val: norm(t.epaule_g_note, 3)*100/100*3, fullMark: 3 },
    { subject: 'Épaule D',   val: norm(t.epaule_d_note, 3)*100/100*3, fullMark: 3 },
  ],
  force: [
    { subject: 'CMJ Sec',   val: norm(t.cmj_sec, 50),       fullMark: 100 },
    { subject: 'Bench',     val: norm(t.rm_dc, 110),         fullMark: 100 },
    { subject: 'Squat',     val: norm(t.rm_squat, 130),      fullMark: 100 },
    { subject: 'Tractions', val: norm(t.max_tractions, 35),  fullMark: 100 },
    { subject: 'Lestée',    val: norm(t.traction_lestee, 35),fullMark: 100 },
  ],
  aqua: [
    { subject: 'WIST',    val: norm(t.wist, 12),    fullMark: 100 },
    { subject: 'CMJ Eau', val: norm(t.cmj_eau, 50), fullMark: 100 },
  ],
});

// ─── Couleur note (0-3) ───────────────────────────────────────
const noteColor = (n: number|null) => {
  if (n === null) return '#8B9BB4';
  if (n === 3) return '#22c55e';
  if (n === 2) return '#84cc16';
  if (n === 1) return '#f97316';
  return '#ef4444';
};
const noteLabel = (n: number|null) => {
  if (n === null) return '—';
  return ['Mauvais','Passable','Bien','Excellent'][n] || '—';
};

// ─── Badge statut objectif ────────────────────────────────────
const OBJ_STYLES: Record<string, {bg:string,color:string,label:string}> = {
  ACTIVE:             { bg:'rgba(59,130,246,0.15)',  color:'#60a5fa',  label:'En cours' },
  PENDING_VALIDATION: { bg:'rgba(249,115,22,0.15)',  color:'#f97316',  label:'En attente' },
  VALIDATED:          { bg:'rgba(34,197,94,0.15)',   color:'#22c55e',  label:'✅ Validé' },
  CLAIMED:            { bg:'rgba(107,114,128,0.15)', color:'#9ca3af',  label:'Réclamé' },
};

export const AthleteProfileCoach: React.FC<Props> = ({ athlete, onClose, onUpdate }) => {
  const [tab, setTab] = useState<'APERCU'|'TESTS'|'MONITORING'|'PRESENCE'|'OBJECTIFS'>('APERCU');
  const [tests, setTests] = useState<TestResult[]>([]);
  const [selectedTestIdx, setSelectedTestIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingObj, setAddingObj] = useState<'shortTerm'|'mediumTerm'|'longTerm'|null>(null);
  const [newObjLabel, setNewObjLabel] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('test_results')
        .select('*')
        .eq('athlete_id', athlete.id)
        .order('test_date', { ascending: false });
      setTests(data ?? []);
      setLoading(false);
    };
    load();
  }, [athlete.id]);

  const activeTest = tests[selectedTestIdx] ?? null;
  const radarData  = activeTest ? getTestRadarData(activeTest) : null;

  // RPE charts
  const waterRpeData = athlete.monitoring.waterHistory
    .slice(-12).map(h => ({ date: h.date.slice(5), rpe: h.rpe || 0 }));
  const dryRpeData = athlete.monitoring.dryHistory
    .slice(-12).map(h => ({ date: h.date.slice(5), rpe: h.rpe || 0 }));

  // Présence
  const waterH = athlete.monitoring.waterHistory;
  const dryH   = athlete.monitoring.dryHistory;
  const waterPct = waterH.length ? Math.round((waterH.filter(h=>h.attendance==='PRESENT').length/waterH.length)*100) : 0;
  const dryPct   = dryH.length   ? Math.round((dryH.filter(h=>h.attendance==='PRESENT').length/dryH.length)*100)     : 0;

  const handleAddObj = async () => {
    if (!addingObj || !newObjLabel.trim()) return;
    await addObjective(athlete.id, addingObj, newObjLabel.trim());
    setNewObjLabel(''); setAddingObj(null);
    onUpdate();
  };
  const handleValidate = async (id: string, approved: boolean) => {
    await updateObjectiveStatus(id, approved ? 'VALIDATED' : 'ACTIVE');
    onUpdate();
  };

  const GOLD = '#E8B800';
  const NAVY = '#0B1628';

  return (
    <div className="fixed inset-0 z-[80] flex flex-col" style={{ background: '#080F1E' }}>
      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-5 pt-8 pb-4 border-b border-white/10 sticky top-0 z-10"
        style={{ background: 'rgba(8,15,30,0.95)', backdropFilter: 'blur(12px)' }}>
        <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#8B9BB4' }}>←</button>
        <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1A3A7A, #0B1628)', border: `2px solid ${GOLD}` }}>
          <span className="text-3xl">{athlete.gamification.selectedSkin}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-2xl text-white uppercase leading-none">{athlete.firstName} {athlete.lastName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,184,0,0.15)', color: GOLD }}>
              {athlete.team_category === 'BOTH' ? 'U18 + N1' : athlete.team_category || 'N1'}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
              Lvl {athlete.gamification.level}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-display text-2xl font-bold" style={{ color: GOLD }}>{athlete.gamification.rank}</div>
          <div className="text-[10px] uppercase" style={{ color: '#8B9BB4' }}>Classement</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 px-4 py-2 overflow-x-auto scrollbar-hide border-b border-white/5">
        {([
          { id: 'APERCU',    label: '👤 Aperçu' },
          { id: 'TESTS',     label: '🧪 Tests' },
          { id: 'MONITORING',label: '📈 Monitoring' },
          { id: 'PRESENCE',  label: '📋 Présence' },
          { id: 'OBJECTIFS', label: '🎯 Objectifs' },
        ] as {id:typeof tab, label:string}[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all"
            style={{ background: tab===t.id ? GOLD : 'rgba(255,255,255,0.05)', color: tab===t.id ? NAVY : '#8B9BB4' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ════════ APERÇU ════════ */}
        {tab === 'APERCU' && (
          <div className="p-5 space-y-5 pb-10">

            {/* Stats saison */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B9BB4' }}>Statistiques Saison</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Matchs', val: athlete.stats.matchesPlayed, color: GOLD },
                  { label: 'Buts',   val: athlete.stats.goals,         color: '#22c55e' },
                  { label: 'Fautes', val: athlete.stats.fouls,         color: '#f97316' },
                  { label: 'Excl.',  val: athlete.stats.exclusions,    color: '#ef4444' },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${s.color}25` }}>
                    <div className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.val}</div>
                    <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: '#8B9BB4' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Morphologie */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B9BB4' }}>Morphologie</h3>
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const latest = tests[0];
                  return [
                    { label: 'Taille', val: latest?.taille ? `${latest.taille} cm` : `${athlete.monitoring.height || '—'} cm` },
                    { label: 'Poids',  val: latest?.masse  ? `${latest.masse} kg`  : athlete.monitoring.weight.length ? `${athlete.monitoring.weight[athlete.monitoring.weight.length-1].value} kg` : '— kg' },
                    { label: 'Âge',    val: `${athlete.age} ans` },
                    { label: 'Équipe', val: athlete.team_category === 'BOTH' ? 'U18 + N1' : athlete.team_category || 'N1' },
                  ].map((m, i) => (
                    <div key={i} className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div>
                        <div className="text-[9px] uppercase font-bold" style={{ color: '#8B9BB4' }}>{m.label}</div>
                        <div className="font-display text-xl text-white font-bold">{m.val}</div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Courbe de poids */}
            {athlete.monitoring.weight.length >= 2 && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B9BB4' }}>Évolution du Poids</h3>
                <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={athlete.monitoring.weight.map(w => ({ date: w.date.slice(5), val: w.value }))}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#8B9BB4', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#8B9BB4', fontSize: 9 }} domain={['auto','auto']} />
                      <Tooltip contentStyle={{ background: '#0D1F3C', border: 'none', borderRadius: 8 }} itemStyle={{ color: GOLD }} />
                      <Line type="monotone" dataKey="val" stroke={GOLD} strokeWidth={2} dot={{ r: 3, fill: NAVY, stroke: GOLD }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Dernier check-in */}
            {athlete.lastCheckIn && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B9BB4' }}>Dernier Check-in · {athlete.lastCheckIn.date}</h3>
                <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {[
                    { label: 'Sommeil', val: athlete.lastCheckIn.sleep },
                    { label: 'Douleurs', val: athlete.lastCheckIn.soreness },
                    { label: 'Moral',    val: athlete.lastCheckIn.mood },
                    { label: 'Nutrition', val: athlete.lastCheckIn.foodQuality },
                    { label: 'Fatigue',  val: athlete.lastCheckIn.fatigue },
                  ].map((item, i) => {
                    const color = item.label==='Douleurs'||item.label==='Fatigue'
                      ? item.val>=8?'#ef4444':item.val>=5?'#f97316':'#22c55e'
                      : item.val<=3?'#ef4444':item.val<=6?'#f97316':'#22c55e';
                    return (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-bold" style={{ color: '#8B9BB4' }}>{item.label}</span>
                          <span className="text-xs font-bold" style={{ color }}>{item.val}/10</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div className="h-full rounded-full" style={{ width: `${item.val*10}%`, background: color, transition: 'width 0.8s ease' }}></div>
                        </div>
                      </div>
                    );
                  })}
                  {athlete.lastCheckIn.comment && (
                    <p className="text-xs italic px-3 py-2 rounded-lg mt-2" style={{ color: '#8B9BB4', background: 'rgba(0,0,0,0.3)', borderLeft: `2px solid ${GOLD}` }}>
                      &quot;{athlete.lastCheckIn.comment}&quot;
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════ TESTS ════════ */}
        {tab === 'TESTS' && (
          <div className="p-5 space-y-5 pb-10">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD, borderTopColor: 'transparent' }}></div>
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-20 text-sm" style={{ color: '#8B9BB4' }}>Aucun test enregistré.</div>
            ) : (
              <>
                {/* Sélecteur date */}
                <div className="flex gap-2">
                  {tests.map((t, i) => (
                    <button key={t.id} onClick={() => setSelectedTestIdx(i)}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all"
                      style={{ background: selectedTestIdx===i ? GOLD : 'rgba(255,255,255,0.05)', color: selectedTestIdx===i ? NAVY : '#8B9BB4' }}>
                      {new Date(t.test_date).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}
                    </button>
                  ))}
                </div>

                {activeTest && radarData && (
                  <>
                    {/* Radar Souplesse */}
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid rgba(232,184,0,0.2)` }}>
                      <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>🔄 Souplesse</h3>
                      <p className="text-[9px] mb-3" style={{ color: '#8B9BB4' }}>Notes 0 (mauvais) → 3 (excellent)</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={radarData.souplesse}>
                          <PolarGrid stroke="rgba(255,255,255,0.1)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B9BB4', fontSize: 10 }} />
                          <Radar name="Note" dataKey="val" stroke={GOLD} fill={GOLD} fillOpacity={0.3} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                      {/* Détails souplesse */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          { label: 'Cheville G', val: activeTest.cheville_g, note: activeTest.cheville_g_note },
                          { label: 'Cheville D', val: activeTest.cheville_d, note: activeTest.cheville_d_note },
                          { label: 'Adducteurs', val: activeTest.adducteurs, note: activeTest.adducteurs_note },
                          { label: 'Épaule G',   val: activeTest.epaule_g,   note: activeTest.epaule_g_note },
                          { label: 'Épaule D',   val: activeTest.epaule_d,   note: activeTest.epaule_d_note },
                          { label: 'Ischios D/G',val: activeTest.ischios_d !== null ? `${activeTest.ischios_d}/${activeTest.ischios_g}` : null, note: null },
                        ].map((m, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <span className="text-[10px] font-bold" style={{ color: '#8B9BB4' }}>{m.label}</span>
                            <div className="text-right">
                              {m.val !== null && m.val !== undefined ? (
                                <span className="text-xs text-white font-bold">{typeof m.val==='number'?`${m.val} cm`:m.val}</span>
                              ) : <span className="text-xs" style={{ color: '#8B9BB4' }}>—</span>}
                              {m.note !== null && m.note !== undefined && (
                                <span className="block text-[9px] font-bold" style={{ color: noteColor(m.note) }}>{noteLabel(m.note)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Radar Force */}
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#ef4444' }}>💪 Force & Explosivité (Sec)</h3>
                      <p className="text-[9px] mb-3" style={{ color: '#8B9BB4' }}>Normalisé sur maximums équipe</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={radarData.force}>
                          <PolarGrid stroke="rgba(255,255,255,0.1)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B9BB4', fontSize: 10 }} />
                          <Radar name="Score" dataKey="val" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          { label: 'CMJ Sec',       val: activeTest.cmj_sec,         unit: 'cm' },
                          { label: '1RM Bench',      val: activeTest.rm_dc,           unit: 'kg' },
                          { label: '1RM Squat',      val: activeTest.rm_squat,        unit: 'kg' },
                          { label: 'Traction Lest.', val: activeTest.traction_lestee, unit: 'kg' },
                          { label: 'Max Tractions',  val: activeTest.max_tractions,   unit: 'reps' },
                        ].map((m, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <span className="text-[10px] font-bold" style={{ color: '#8B9BB4' }}>{m.label}</span>
                            {m.val !== null && m.val !== undefined
                              ? <span className="text-xs text-white font-bold">{m.val} <span style={{ color: '#8B9BB4' }}>{m.unit}</span></span>
                              : <span className="text-xs" style={{ color: '#8B9BB4' }}>—</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Radar Aquatique */}
                    {(activeTest.wist || activeTest.cmj_eau) && (
                      <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#60a5fa' }}>🏊 Aquatique</h3>
                        <ResponsiveContainer width="100%" height={180}>
                          <RadarChart data={radarData.aqua}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B9BB4', fontSize: 10 }} />
                            <Radar name="Score" dataKey="val" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.3} strokeWidth={2} />
                          </RadarChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {[
                            { label: 'CMJ Eau', val: activeTest.cmj_eau, unit: 'cm' },
                            { label: 'RAST',    val: activeTest.rast,    unit: 's' },
                            { label: 'WIST',    val: activeTest.wist,    unit: 'pts' },
                          ].map((m, i) => (
                            <div key={i} className="flex flex-col items-center px-2 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                              <span className="text-[9px] font-bold mb-1" style={{ color: '#8B9BB4' }}>{m.label}</span>
                              {m.val !== null && m.val !== undefined
                                ? <span className="text-base text-white font-bold">{m.val}<span className="text-[9px] ml-0.5" style={{ color: '#8B9BB4' }}>{m.unit}</span></span>
                                : <span className="text-sm" style={{ color: '#8B9BB4' }}>—</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Taille main */}
                    {(activeTest.main_g || activeTest.main_d) && (
                      <div className="rounded-2xl p-4 flex gap-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex-1 text-center">
                          <div className="text-[9px] uppercase font-bold mb-1" style={{ color: '#8B9BB4' }}>Main G</div>
                          <div className="font-display text-2xl text-white">{activeTest.main_g ?? '—'}<span className="text-xs ml-0.5" style={{ color: '#8B9BB4' }}>cm</span></div>
                        </div>
                        <div className="w-px bg-white/10"></div>
                        <div className="flex-1 text-center">
                          <div className="text-[9px] uppercase font-bold mb-1" style={{ color: '#8B9BB4' }}>Main D</div>
                          <div className="font-display text-2xl text-white">{activeTest.main_d ?? '—'}<span className="text-xs ml-0.5" style={{ color: '#8B9BB4' }}>cm</span></div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ════════ MONITORING ════════ */}
        {tab === 'MONITORING' && (
          <div className="p-5 space-y-5 pb-10">

            {/* RPE Water */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#60a5fa' }}>🏊 RPE Water-Polo</h3>
                <div>
                  <span className="font-display text-2xl font-bold text-white">{athlete.monitoring.waterRpe}</span>
                  <span className="text-[9px] ml-1" style={{ color: '#8B9BB4' }}>Moy.</span>
                </div>
              </div>
              {waterRpeData.length >= 2 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={waterRpeData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#8B9BB4', fontSize: 9 }} />
                    <YAxis domain={[0,10]} tick={{ fill: '#8B9BB4', fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: '#0D1F3C', border: 'none', borderRadius: 8 }} itemStyle={{ color: '#60a5fa' }} />
                    <Line type="monotone" dataKey="rpe" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3, fill: NAVY, stroke: '#60a5fa' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-center py-6 text-sm" style={{ color: '#8B9BB4' }}>Pas assez de données.</p>}
            </div>

            {/* RPE Muscu */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>💪 RPE Musculation</h3>
                <div>
                  <span className="font-display text-2xl font-bold text-white">{athlete.monitoring.dryRpe}</span>
                  <span className="text-[9px] ml-1" style={{ color: '#8B9BB4' }}>Moy.</span>
                </div>
              </div>
              {dryRpeData.length >= 2 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={dryRpeData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#8B9BB4', fontSize: 9 }} />
                    <YAxis domain={[0,10]} tick={{ fill: '#8B9BB4', fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: '#0D1F3C', border: 'none', borderRadius: 8 }} itemStyle={{ color: '#ef4444' }} />
                    <Line type="monotone" dataKey="rpe" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: NAVY, stroke: '#ef4444' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-center py-6 text-sm" style={{ color: '#8B9BB4' }}>Pas assez de données.</p>}
            </div>

            {/* Historique check-ins */}
            {athlete.dailyLogs && athlete.dailyLogs.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B9BB4' }}>Historique Check-ins</h3>
                <div className="space-y-2">
                  {athlete.dailyLogs.slice(0, 10).map((log, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-white">{new Date(log.date).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { l:'💤', v: log.sleep },
                          { l:'⚡', v: log.fatigue },
                          { l:'🦴', v: log.soreness },
                          { l:'🥗', v: log.foodQuality },
                          { l:'🧠', v: log.mood },
                        ].map((item, j) => (
                          <div key={j} className="rounded-lg p-1 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                            <div className="text-sm">{item.l}</div>
                            <div className="font-bold text-xs text-white">{item.v}</div>
                          </div>
                        ))}
                      </div>
                      {log.comment && <p className="text-[10px] italic mt-2 pl-2 border-l" style={{ color: '#8B9BB4', borderColor: GOLD }}>{log.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════ PRÉSENCE ════════ */}
        {tab === 'PRESENCE' && (
          <div className="p-5 space-y-5 pb-10">
            {/* Taux globaux */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Water-Polo', pct: waterPct, color: '#60a5fa', history: waterH },
                { label: 'Musculation', pct: dryPct,  color: '#ef4444', history: dryH },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${s.color}25` }}>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: s.color }}>{s.label}</h3>
                  {/* Cercle gauge */}
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"/>
                      <circle cx="40" cy="40" r="32" fill="none" stroke={s.color} strokeWidth="8"
                        strokeDasharray={`${2*Math.PI*32}`}
                        strokeDashoffset={`${2*Math.PI*32*(1-s.pct/100)}`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display font-bold text-white text-lg">{s.pct}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px]" style={{ color: '#8B9BB4' }}>{s.history.filter(h=>h.attendance==='PRESENT').length}/{s.history.length} séances</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Répartition présences */}
            {(() => {
              const allH = [
                ...waterH.map(h=>({...h, type:'Water' as const})),
                ...dryH.map(h=>({...h, type:'Muscu' as const})),
              ].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());
              const present = allH.filter(h=>h.attendance==='PRESENT').length;
              const injured = allH.filter(h=>h.attendance==='INJURED').length;
              const excused = allH.filter(h=>h.attendance==='ABSENT_JUSTIFIED').length;
              const absent  = allH.filter(h=>h.attendance==='ABSENT_UNJUSTIFIED').length;
              const total = allH.length;
              const barData = [
                { name:'Présent',   val:present, color:'#22c55e' },
                { name:'Excusé',   val:excused, color:'#60a5fa' },
                { name:'Blessé',   val:injured, color:'#f97316' },
                { name:'Absent',   val:absent,  color:'#ef4444' },
              ];
              return total > 0 ? (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#8B9BB4' }}>Répartition des Présences</h3>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={barData} layout="vertical">
                      <XAxis type="number" tick={{ fill:'#8B9BB4', fontSize:9 }} domain={[0,total]} />
                      <YAxis type="category" dataKey="name" tick={{ fill:'#8B9BB4', fontSize:10 }} width={60} />
                      <Tooltip contentStyle={{ background:'#0D1F3C', border:'none', borderRadius:8 }} />
                      <Bar dataKey="val" radius={4}>
                        {barData.map((b,i) => <Cell key={i} fill={b.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null;
            })()}

            {/* Historique récent */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B9BB4' }}>Historique Récent</h3>
              <div className="space-y-1.5">
                {[...waterH.map(h=>({...h,stype:'Water'})),...dryH.map(h=>({...h,stype:'Muscu'}))]
                  .sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime())
                  .slice(0,20).map((s,i) => {
                    const COLORS: Record<string,{label:string,color:string}> = {
                      PRESENT:{label:'Présent',color:'#22c55e'},
                      ABSENT_JUSTIFIED:{label:'Excusé',color:'#60a5fa'},
                      ABSENT_UNJUSTIFIED:{label:'Absent',color:'#ef4444'},
                      INJURED:{label:'Blessé',color:'#f97316'},
                    };
                    const info = COLORS[s.attendance] || {label:'-',color:'#8B9BB4'};
                    return (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background:'rgba(255,255,255,0.04)' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:s.stype==='Water'?'rgba(96,165,250,0.2)':'rgba(239,68,68,0.2)', color:s.stype==='Water'?'#60a5fa':'#ef4444' }}>{s.stype}</span>
                          <span className="text-xs text-white">{s.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold" style={{ color:info.color }}>{info.label}</span>
                          {s.rpe > 0 && <span className="font-display font-bold text-white text-sm">{s.rpe}</span>}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ════════ OBJECTIFS ════════ */}
        {tab === 'OBJECTIFS' && (
          <div className="p-5 pb-10 space-y-6">
            {([
              { term: 'shortTerm'  as const, label: 'Court Terme',  emoji: '🟢', color: '#22c55e',  desc: 'Cette semaine / Ce mois' },
              { term: 'mediumTerm' as const, label: 'Moyen Terme',  emoji: '🔵', color: '#60a5fa',  desc: 'Cette saison' },
              { term: 'longTerm'   as const, label: 'Long Terme',   emoji: '⭐', color: GOLD,         desc: 'Objectif carrière' },
            ]).map(section => {
              const items = athlete.structuredObjectives[section.term];
              return (
                <div key={section.term} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${section.color}25` }}>
                  {/* Header section */}
                  <div className="flex items-center justify-between px-4 py-3" style={{ background: `${section.color}15` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{section.emoji}</span>
                      <div>
                        <h3 className="font-display text-base uppercase font-bold" style={{ color: section.color }}>{section.label}</h3>
                        <p className="text-[9px] uppercase tracking-wider" style={{ color: '#8B9BB4' }}>{section.desc}</p>
                      </div>
                    </div>
                    <button onClick={() => setAddingObj(section.term)}
                      className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg"
                      style={{ background: `${section.color}20`, color: section.color, border: `1px solid ${section.color}40` }}>
                      + Ajouter
                    </button>
                  </div>

                  {/* Liste */}
                  <div className="p-3 space-y-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    {items.length === 0 && (
                      <p className="text-xs text-center py-3 italic" style={{ color: '#8B9BB4' }}>Aucun objectif défini.</p>
                    )}
                    {items.map(obj => {
                      const style = OBJ_STYLES[obj.status] || OBJ_STYLES.ACTIVE;
                      return (
                        <div key={obj.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: section.color, opacity: obj.status==='ACTIVE'?0.4:1 }}></div>
                            <div className="flex-1">
                              <p className="text-sm text-white leading-tight">{obj.label}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.color }}>{style.label}</span>
                                {obj.status === 'PENDING_VALIDATION' && (
                                  <div className="flex gap-1.5 ml-auto">
                                    <button onClick={() => handleValidate(obj.id, true)}
                                      className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background:'rgba(34,197,94,0.2)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.3)' }}>✓ Valider</button>
                                    <button onClick={() => handleValidate(obj.id, false)}
                                      className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background:'rgba(239,68,68,0.2)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)' }}>✕ Refuser</button>
                                  </div>
                                )}
                                {obj.status === 'VALIDATED' && (
                                  <span className="text-[10px] ml-auto" style={{ color: '#22c55e' }}>✅ Récompense disponible côté joueur</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Modal ajout objectif */}
            {addingObj && (
              <div className="fixed inset-0 z-[90] flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.8)' }}>
                <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: '#0D1F3C', border: `1px solid ${GOLD}40` }}>
                  <h3 className="font-display text-xl text-white uppercase">Nouvel Objectif</h3>
                  <p className="text-xs uppercase" style={{ color: '#8B9BB4' }}>
                    {addingObj==='shortTerm'?'🟢 Court Terme':addingObj==='mediumTerm'?'🔵 Moyen Terme':'⭐ Long Terme'}
                  </p>
                  <input autoFocus
                    className="w-full rounded-xl p-3 text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${GOLD}40` }}
                    placeholder="ex: Améliorer le tir de loin..."
                    value={newObjLabel}
                    onChange={e => setNewObjLabel(e.target.value)}
                    onKeyDown={e => e.key==='Enter'&&handleAddObj()}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setAddingObj(null)} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ background:'rgba(255,255,255,0.08)', color:'#8B9BB4' }}>Annuler</button>
                    <button onClick={handleAddObj} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ background:GOLD, color:NAVY }}>Ajouter</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};