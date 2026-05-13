import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { Athlete, DailyLog, DaySchedule, EventType, ScheduleEvent } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';

interface CheckInViewProps {
  athlete: Athlete;
  onComplete: () => void;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

// ⚠️ IMPORTANT: ne jamais utiliser new Date().toISOString() pour la date locale
// toISOString() retourne UTC — en France (UTC+2), avant 2h du matin ça donne la veille
const getLocalDateStr = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getStartOfWeekLocal = (): string => {
  const d = new Date();
  const day = d.getDay(); // 0=dim, 1=lun...
  const diff = day === 0 ? -6 : 1 - day; // reculer jusqu'au lundi
  d.setDate(d.getDate() + diff);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const EVENT_COLORS: Record<string, string> = {
  'WATER-POLO': '#3B82F6',
  'MATCH':      '#E8B800',
  'MUSCU':      '#E52E01',
  'KINE':       '#10B981',
  'MENTAL':     '#8B5CF6',
  'VIDEO':      '#6366F1',
  'MEETING':    '#9CA3AF',
  'ENTRETIEN':  '#F97316',
};

const EVENT_LABELS: Record<string, string> = {
  'WATER-POLO': '🏊 Water-Polo',
  'MATCH':      '🏆 Match',
  'MUSCU':      '💪 Musculation',
  'KINE':       '🩺 Kiné',
  'MENTAL':     '🧠 Mental',
  'VIDEO':      '📹 Vidéo',
  'MEETING':    '📋 Réunion',
  'ENTRETIEN':  '🤝 Entretien',
};

const URINE_COLORS = [
  { hex: '#FFFDE7', label: '1', desc: 'Très bien hydraté' },
  { hex: '#FFF9C4', label: '2', desc: 'Bien hydraté' },
  { hex: '#FFF176', label: '3', desc: 'Hydraté' },
  { hex: '#FFEE58', label: '4', desc: 'Correct' },
  { hex: '#FDD835', label: '5', desc: 'Légère déshydratation' },
  { hex: '#F9A825', label: '6', desc: 'Déshydraté ⚠️' },
  { hex: '#E65100', label: '7', desc: 'Très déshydraté 🚨' },
  { hex: '#BF360C', label: '8', desc: 'Critique — Parle au staff' },
];

// ─── SLIDER ──────────────────────────────────────────────────────────────────
interface SliderProps {
  label: string;
  sublabel?: string;
  val: number;
  onChange: (v: number) => void;
  accentColor?: string;
  inverse?: boolean;
}

const Slider: React.FC<SliderProps> = ({ label, sublabel, val, onChange, accentColor = '#E52E01', inverse = false }) => {
  const norm = inverse ? 10 - val : val;
  const color = norm <= 3 ? '#EF4444' : norm <= 6 ? '#F59E0B' : '#10B981';
  const verb  = norm <= 2 ? 'Critique' : norm <= 4 ? 'Faible' : norm <= 6 ? 'Moyen' : norm <= 8 ? 'Bon' : 'Excellent';

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <div>
          <span className="text-white text-sm font-bold uppercase tracking-wide">{label}</span>
          {sublabel && <span className="block text-[10px] text-nexus-gray mt-0.5">{sublabel}</span>}
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color }} className="font-display font-bold text-xl">{val}</span>
          <span className="text-[10px] text-nexus-gray">/10</span>
        </div>
      </div>
      <input
        type="range" min="1" max="10" step="0.5" value={val}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ accentColor }}
        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer outline-none"
      />
      <div className="flex justify-between mt-1.5 text-[9px] text-nexus-gray uppercase font-bold tracking-widest">
        <span>Bas</span>
        <span style={{ color }}>{verb}</span>
        <span>Haut</span>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export const CheckInView: React.FC<CheckInViewProps> = ({ athlete, onComplete }) => {
  const [todayEvents, setTodayEvents]         = useState<ScheduleEvent[]>([]);
  const [rpeBySession, setRpeBySession]       = useState<Record<string, number>>({});
  const [sleep, setSleep]                     = useState(7);
  const [soreness, setSoreness]               = useState(3);
  const [energy, setEnergy]                   = useState(7);
  const [mood, setMood]                       = useState(7);
  const [nutrition, setNutrition]             = useState(7);
  const [urineIndex, setUrineIndex]           = useState<number | null>(null);
  const [comment, setComment]                 = useState('');
  const [submitted, setSubmitted]             = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [scheduleLoaded, setScheduleLoaded]   = useState(false);

  // ── Chargement des séances du JOUR ──────────────────────────────────────
  useEffect(() => {
    const loadToday = async () => {
      // ⚠️ On utilise la date locale, PAS toISOString() (bug UTC+2)
      const weekStart = getStartOfWeekLocal();
      const todayStr  = getLocalDateStr();

      console.log('[CheckIn] weekStart:', weekStart, '| today:', todayStr);

      const schedule: DaySchedule[] = await db.getWeeklySchedule(weekStart);
      console.log('[CheckIn] schedule days:', schedule.map(d => d.date));

      const todaySchedule = schedule.find(d => d.date === todayStr);
      console.log('[CheckIn] todaySchedule:', todaySchedule);

      // Types de séances pour lesquels on demande un RPE
      const RPE_TYPES: EventType[] = ['WATER-POLO', 'MATCH', 'MUSCU', 'KINE', 'MENTAL'];

      const visibleEvents = (todaySchedule?.events ?? []).filter(
        e => e.isVisibleToAthletes && RPE_TYPES.includes(e.type as EventType)
      );

      setTodayEvents(visibleEvents);
      const initial: Record<string, number> = {};
      visibleEvents.forEach(e => { initial[e.id] = 6; });
      setRpeBySession(initial);
      setScheduleLoaded(true);
    };

    loadToday();
  }, []);

  // ── Soumission ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);

    const maxRpe = Object.values(rpeBySession).length > 0
      ? Math.max(...Object.values(rpeBySession))
      : 5;

    const ALERT_KW = [
      'mal', 'douleur', 'douleurs', 'blessure', 'blessé', 'fatigue',
      'fatigué', 'aïe', 'ouille', 'crampe', 'entorse', 'bobo',
      'genou', 'épaule', 'dos', 'hurt', 'pain', 'ache', 'sore',
    ];
    const hasKw     = ALERT_KW.some(k => comment.toLowerCase().includes(k));
    const isCritPhy = maxRpe >= 9 || soreness >= 8;
    const isCritLif = sleep <= 2 || nutrition <= 2 || energy <= 2;
    const isCritHyd = urineIndex !== null && urineIndex >= 6;

    const log: DailyLog = {
      date:        new Date().toISOString(),
      sleep,
      fatigue:     maxRpe,
      soreness,
      foodQuality: nutrition,
      mood,
      comment,
    };

    await db.saveDailyLog(athlete.id, log);
    setLoading(false);
    setSubmitted(true);

    let alerts = '';
    if (isCritPhy)  alerts += '⚠️ RPE ou courbatures élevés — staff notifié.\n';
    if (isCritLif)  alerts += '⚠️ Sommeil, énergie ou nutrition insuffisants.\n';
    if (isCritHyd)  alerts += '🚨 Hydratation critique — bois de l\'eau et parle au staff.\n';
    if (hasKw)      alerts += '⚠️ Mots-clés détectés dans ton commentaire.\n';

    setTimeout(() => {
      if (alerts) alert(alerts + '\n✅ Rapport envoyé — le staff a été notifié.');
      else        alert('✅ Check-in validé ! +100 XP');
      onComplete();
    }, 150);
  };

  // ── Écran succès ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-4">
        <div className="text-6xl">✅</div>
        <h2 className="font-display text-3xl text-white uppercase">Check-in envoyé</h2>
        <p className="text-nexus-gray text-sm">Données transmises au staff.</p>
        <Button onClick={onComplete}>Retour à l'accueil</Button>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6 pb-32">

      {/* Header */}
      <div>
        <p className="text-nexus-gray text-[10px] uppercase tracking-widest font-bold mb-1 capitalize">{today}</p>
        <h2 className="font-display text-3xl text-white uppercase leading-none">Check-in</h2>
        <p className="text-nexus-gray text-xs mt-1">Quelques secondes pour aider le staff à te suivre.</p>
      </div>

      {/* ── SECTION 1 : RPE par séance ── */}
      <GlassCard className="p-5 space-y-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <span className="text-lg">📊</span>
          <h3 className="font-display text-lg text-white uppercase tracking-wide">Effort Perçu (RPE)</h3>
        </div>

        {!scheduleLoaded ? (
          <p className="text-nexus-gray text-xs text-center py-4">Chargement du planning...</p>
        ) : todayEvents.length === 0 ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-nexus-gray text-sm">Aucune séance planifiée aujourd'hui.</p>
            <p className="text-nexus-gray text-xs italic">
              Si tu as fait quelque chose, note-le dans le commentaire ci-dessous.
            </p>
          </div>
        ) : (
          todayEvents.map(event => {
            const color = EVENT_COLORS[event.type] ?? '#6B7280';
            const rpe   = rpeBySession[event.id] ?? 6;
            return (
              <div key={event.id} className="space-y-3">
                {/* Infos séance */}
                <div className="flex items-center gap-3">
                  <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div>
                    <span className="text-white font-bold text-sm block">{event.title}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
                      {EVENT_LABELS[event.type] ?? event.type} · {event.startTime}–{event.endTime}
                    </span>
                  </div>
                </div>

                {/* Slider RPE */}
                <Slider
                  label="Comment c'était ?"
                  sublabel="1 = Très facile · 10 = Effort maximal absolu"
                  val={rpe}
                  onChange={v => setRpeBySession(prev => ({ ...prev, [event.id]: v }))}
                  accentColor={color}
                />

                {/* Jauge visuelle */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-1.5 rounded-full transition-all"
                      style={{ backgroundColor: i < rpe ? color : 'rgba(255,255,255,0.1)' }}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </GlassCard>

      {/* ── SECTION 2 : État du jour ── */}
      <GlassCard className="p-5 space-y-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <span className="text-lg">🧠</span>
          <h3 className="font-display text-lg text-white uppercase tracking-wide">État du Jour</h3>
        </div>

        <Slider label="Sommeil" sublabel="Qualité et durée de ta nuit" val={sleep} onChange={setSleep} accentColor="#6366F1" />
        <div className="border-t border-white/5 pt-4">
          <Slider label="Courbatures / Douleurs" sublabel="1 = Très douloureux · 10 = Aucune douleur" val={soreness} onChange={setSoreness} accentColor="#EF4444" inverse />
        </div>
        <div className="border-t border-white/5 pt-4">
          <Slider label="Énergie" sublabel="Comment tu te sens physiquement" val={energy} onChange={setEnergy} accentColor="#F59E0B" />
        </div>
        <div className="border-t border-white/5 pt-4">
          <Slider label="Moral" sublabel="Ton état mental et émotionnel" val={mood} onChange={setMood} accentColor="#8B5CF6" />
        </div>
        <div className="border-t border-white/5 pt-4">
          <Slider label="Nutrition" sublabel="Qualité de ton alimentation aujourd'hui" val={nutrition} onChange={setNutrition} accentColor="#10B981" />
        </div>
      </GlassCard>

      {/* ── SECTION 3 : Hydratation ── */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <span className="text-lg">💧</span>
          <h3 className="font-display text-lg text-white uppercase tracking-wide">Hydratation</h3>
        </div>
        <p className="text-nexus-gray text-xs">Sélectionne la couleur de tes urines ce matin :</p>

        <div className="grid grid-cols-4 gap-2">
          {URINE_COLORS.map((c, i) => (
            <button
              key={i}
              onClick={() => setUrineIndex(i)}
              className={`relative rounded-xl h-14 border-2 transition-all duration-200 ${
                urineIndex === i ? 'border-white scale-105 shadow-lg' : 'border-transparent hover:border-white/30'
              }`}
              style={{ backgroundColor: c.hex }}
            >
              <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-bold text-black/60">
                {c.label}
              </span>
            </button>
          ))}
        </div>

        {urineIndex !== null && (
          <div className={`text-center text-sm font-bold py-2 px-4 rounded-lg ${
            urineIndex >= 6
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : urineIndex >= 4
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {URINE_COLORS[urineIndex].desc}
          </div>
        )}
      </GlassCard>

      {/* ── SECTION 4 : Commentaire ── */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <span className="text-lg">💬</span>
          <h3 className="font-display text-lg text-white uppercase tracking-wide">Commentaire</h3>
        </div>
        <p className="text-nexus-gray text-xs">
          Douleur, sensation, moral... Note ce que tu ressens. C'est confidentiel.
        </p>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Tout va bien, ou tu veux signaler quelque chose..."
          className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-white/30 outline-none resize-none h-24 placeholder-nexus-gray/40"
        />
      </GlassCard>

      {/* ── SUBMIT ── */}
      <div className="px-1">
        <Button fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? 'Envoi en cours...' : '✅ Valider mon check-in'}
        </Button>
        <p className="text-center text-[10px] text-nexus-gray mt-3 uppercase tracking-widest">
          Données transmises au staff en toute confidentialité
        </p>
      </div>
    </div>
  );
};
