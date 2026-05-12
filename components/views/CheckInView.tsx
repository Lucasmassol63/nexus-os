import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { Athlete, DailyLog, DaySchedule, EventType, ScheduleEvent } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';

interface CheckInViewProps {
  athlete: Athlete;
  onComplete: () => void;
}

// --- HELPERS ---
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEventColor = (type: EventType): string => {
  switch (type) {
    case 'WATER-POLO': return '#3B82F6';
    case 'MATCH':      return '#E8B800';
    case 'MUSCU':      return '#E52E01';
    case 'KINE':       return '#10B981';
    case 'MENTAL':     return '#8B5CF6';
    case 'VIDEO':      return '#6366F1';
    case 'MEETING':    return '#9CA3AF';
    case 'ENTRETIEN':  return '#F97316';
    default:           return '#6B7280';
  }
};

const getEventLabel = (type: EventType): string => {
  switch (type) {
    case 'WATER-POLO': return '🏊 Water-Polo';
    case 'MATCH':      return '🏆 Match';
    case 'MUSCU':      return '💪 Muscu / Dry';
    case 'KINE':       return '🩺 Kiné';
    case 'MENTAL':     return '🧠 Mental';
    case 'VIDEO':      return '📹 Vidéo';
    case 'MEETING':    return '📋 Réunion';
    case 'ENTRETIEN':  return '🤝 Entretien';
    default:           return type;
  }
};

const URINE_COLORS = [
  { hex: '#FFFDE7', label: '1', desc: 'Très hydraté' },
  { hex: '#FFF9C4', label: '2', desc: 'Bien hydraté' },
  { hex: '#FFF176', label: '3', desc: 'Hydraté' },
  { hex: '#FFEE58', label: '4', desc: 'Correct' },
  { hex: '#FDD835', label: '5', desc: 'Légère déshydratation' },
  { hex: '#F9A825', label: '6', desc: 'Déshydraté' },
  { hex: '#E65100', label: '7', desc: 'Très déshydraté ⚠️' },
  { hex: '#BF360C', label: '8', desc: 'Critique — Consulter 🚨' },
];

// --- SUB-COMPONENTS ---
interface SliderProps {
  label: string;
  sublabel?: string;
  val: number;
  onChange: (v: number) => void;
  accentColor?: string;
  inverse?: boolean; // if true, high = bad
}

const SliderField: React.FC<SliderProps> = ({
  label, sublabel, val, onChange, accentColor = '#E52E01', inverse = false,
}) => {
  const getColor = (v: number): string => {
    const norm = inverse ? (10 - v) : v;
    if (norm <= 3) return '#EF4444';
    if (norm <= 6) return '#F59E0B';
    return '#10B981';
  };

  const getVerb = (v: number): string => {
    const norm = inverse ? (10 - v) : v;
    if (norm <= 2) return 'Critique';
    if (norm <= 4) return 'Faible';
    if (norm <= 6) return 'Moyen';
    if (norm <= 8) return 'Bon';
    return 'Excellent';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <div>
          <span className="text-white text-sm font-bold uppercase tracking-wider">{label}</span>
          {sublabel && <span className="block text-[10px] text-nexus-gray mt-0.5">{sublabel}</span>}
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: getColor(val) }} className="font-display font-bold text-xl">{val}</span>
          <span className="text-[10px] text-nexus-gray">/10</span>
        </div>
      </div>
      <input
        type="range" min="1" max="10" step="0.5"
        value={val}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ accentColor }}
        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer outline-none"
      />
      <div className="flex justify-between mt-1.5 text-[9px] text-nexus-gray uppercase font-bold tracking-widest">
        <span>Bas</span>
        <span style={{ color: getColor(val) }}>{getVerb(val)}</span>
        <span>Haut</span>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export const CheckInView: React.FC<CheckInViewProps> = ({ athlete, onComplete }) => {
  const [todayEvents, setTodayEvents] = useState<ScheduleEvent[]>([]);
  const [rpeBySession, setRpeBySession] = useState<Record<string, number>>({});
  const [sleep, setSleep]           = useState(7);
  const [soreness, setSoreness]     = useState(3);
  const [energy, setEnergy]         = useState(7);
  const [mood, setMood]             = useState(7);
  const [nutrition, setNutrition]   = useState(7);
  const [urineIndex, setUrineIndex] = useState<number | null>(null);
  const [comment, setComment]       = useState('');
  const [submitted, setSubmitted]   = useState(false);
  const [loading, setLoading]       = useState(false);

  // Load today's sessions from schedule
  useEffect(() => {
    const loadToday = async () => {
      const weekStart = getStartOfWeek(new Date());
      const offset = weekStart.getTimezoneOffset();
      const adjusted = new Date(weekStart.getTime() - offset * 60 * 1000);
      const dateStr = adjusted.toISOString().split('T')[0];

      const schedule: DaySchedule[] = await db.getWeeklySchedule(dateStr);
      const todayStr = new Date().toISOString().split('T')[0];
      const todaySchedule = schedule.find(d => d.date === todayStr);

      const visibleEvents = (todaySchedule?.events ?? []).filter(
        e => e.isVisibleToAthletes && ['WATER-POLO', 'MATCH', 'MUSCU', 'KINE', 'MENTAL', 'VIDEO'].includes(e.type)
      );
      setTodayEvents(visibleEvents);

      // Init RPE sliders at 5 for each session
      const initial: Record<string, number> = {};
      visibleEvents.forEach(e => { initial[e.id] = 5; });
      setRpeBySession(initial);
    };
    loadToday();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);

    const maxRpe = Object.values(rpeBySession).length > 0
      ? Math.max(...Object.values(rpeBySession))
      : 5;

    // Alert thresholds
    const isCriticalPhysical  = maxRpe >= 9 || soreness >= 9;
    const isCriticalLifestyle = sleep <= 2 || nutrition <= 2 || energy <= 2;
    const isCriticalUrine     = urineIndex !== null && urineIndex >= 6;
    const ALERT_KEYWORDS = ['mal', 'douleur', 'pain', 'blessure', 'fatigue', 'dors pas', 'sommeil', 'faim', 'ache', 'hurt'];
    const hasKeywordAlert = ALERT_KEYWORDS.some(k => comment.toLowerCase().includes(k));

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
    if (isCriticalPhysical)  alerts += '⚠️ RPE ou courbatures élevés — le staff est notifié.\n';
    if (isCriticalLifestyle) alerts += '⚠️ Sommeil, énergie ou nutrition insuffisants.\n';
    if (isCriticalUrine)     alerts += '🚨 Couleur d\'urine critique — pense à t\'hydrater et signale-le au staff.\n';
    if (hasKeywordAlert)     alerts += '⚠️ Mots-clés détectés dans ton commentaire.\n';

    setTimeout(() => {
      if (alerts) {
        alert(alerts + '\n✅ Rapport envoyé — le staff a été notifié.');
      } else {
        alert('✅ Check-in validé ! +100 XP');
      }
      onComplete();
    }, 200);
  };

  // --- SUCCESS STATE ---
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 px-6 text-center space-y-4">
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
        <p className="text-nexus-gray text-[10px] uppercase tracking-widest font-bold mb-1">{today}</p>
        <h2 className="font-display text-3xl text-white uppercase leading-none">Check-in</h2>
        <p className="text-nexus-gray text-xs mt-1">Quelques secondes pour aider le staff à te suivre.</p>
      </div>

      {/* === SECTION 1: RPE PAR SÉANCE === */}
      <GlassCard className="p-5 space-y-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <span className="text-lg">📊</span>
          <h3 className="font-display text-lg text-white uppercase tracking-wide">Effort perçu (RPE)</h3>
        </div>

        {todayEvents.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-nexus-gray text-sm">Aucune séance planifiée aujourd'hui.</p>
            <p className="text-nexus-gray text-xs mt-1">Tu peux quand même renseigner ton état du jour ci-dessous.</p>
          </div>
        ) : (
          todayEvents.map(event => {
            const color = getEventColor(event.type);
            const rpe = rpeBySession[event.id] ?? 5;
            return (
              <div key={event.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full" style={{ backgroundColor: color }} />
                  <div>
                    <span className="text-white font-bold text-sm block">{event.title}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
                      {getEventLabel(event.type)} · {event.startTime}–{event.endTime}
                    </span>
                  </div>
                </div>
                <SliderField
                  label="Comment c'était ?"
                  sublabel="1 = Très facile · 10 = Effort maximal"
                  val={rpe}
                  onChange={(v) => setRpeBySession(prev => ({ ...prev, [event.id]: v }))}
                  accentColor={color}
                />
              </div>
            );
          })
        )}
      </GlassCard>

      {/* === SECTION 2: ÉTAT DU JOUR === */}
      <GlassCard className="p-5 space-y-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <span className="text-lg">🧠</span>
          <h3 className="font-display text-lg text-white uppercase tracking-wide">État du jour</h3>
        </div>

        <SliderField
          label="Sommeil"
          sublabel="Qualité et durée de ton sommeil cette nuit"
          val={sleep} onChange={setSleep}
          accentColor="#6366F1"
        />
        <div className="border-t border-white/5 pt-4">
          <SliderField
            label="Courbatures / Douleurs"
            sublabel="1 = Aucune · 10 = Très douloureuses (inverse)"
            val={soreness} onChange={setSoreness}
            accentColor="#EF4444"
            inverse
          />
        </div>
        <div className="border-t border-white/5 pt-4">
          <SliderField
            label="Énergie"
            sublabel="Comment tu te sens physiquement"
            val={energy} onChange={setEnergy}
            accentColor="#F59E0B"
          />
        </div>
        <div className="border-t border-white/5 pt-4">
          <SliderField
            label="Moral"
            sublabel="Ton état mental et émotionnel"
            val={mood} onChange={setMood}
            accentColor="#8B5CF6"
          />
        </div>
        <div className="border-t border-white/5 pt-4">
          <SliderField
            label="Nutrition"
            sublabel="Qualité de ton alimentation aujourd'hui"
            val={nutrition} onChange={setNutrition}
            accentColor="#10B981"
          />
        </div>
      </GlassCard>

      {/* === SECTION 3: COULEUR URINE === */}
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
                urineIndex === i
                  ? 'border-white scale-105 shadow-lg'
                  : 'border-transparent hover:border-white/30'
              }`}
              style={{ backgroundColor: c.hex }}
            >
              <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-bold text-black/60">{c.label}</span>
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

      {/* === SECTION 4: COMMENTAIRE === */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <span className="text-lg">💬</span>
          <h3 className="font-display text-lg text-white uppercase tracking-wide">Commentaire</h3>
        </div>
        <p className="text-nexus-gray text-xs">Douleur, sensation, moral... Note ce que tu ressens (confidentiel).</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tout va bien, ou tu veux signaler quelque chose..."
          className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-white/30 outline-none resize-none h-28 placeholder-nexus-gray/50"
        />
      </GlassCard>

      {/* === SUBMIT === */}
      <div className="px-1">
        <Button
          fullWidth
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Envoi en cours...' : '✅ Valider mon check-in'}
        </Button>
        <p className="text-center text-[10px] text-nexus-gray mt-3 uppercase tracking-widest">
          Ces données sont transmises au staff en toute confidentialité
        </p>
      </div>
    </div>
  );
};