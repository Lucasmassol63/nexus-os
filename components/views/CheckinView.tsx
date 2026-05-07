import React, { useState, useEffect, useCallback } from 'react';
import { Athlete, ScheduleEvent, DailyLog } from '../../types';
import { getAthleteWeeklySchedule } from '../../services/scheduleService';
import { saveDailyLog, sendMessage } from '../../services/athleteService';

// ─── Couleurs d'urine (échelle d'hydratation) ────────────────
const URINE_SCALE = [
  { level: 1, color: '#FFF9B0', label: 'Très clair',  status: 'Excellent',  statusColor: '#22c55e' },
  { level: 2, color: '#FFE566', label: 'Clair',        status: 'Bon',        statusColor: '#84cc16' },
  { level: 3, color: '#FFD000', label: 'Jaune',        status: 'Normal',     statusColor: '#eab308' },
  { level: 4, color: '#FFA800', label: 'Foncé',        status: 'Attention',  statusColor: '#f97316' },
  { level: 5, color: '#E07000', label: 'Ambre',        status: 'Boire !',    statusColor: '#ef4444' },
  { level: 6, color: '#B85500', label: 'Orange',       status: 'Urgent !',   statusColor: '#dc2626' },
  { level: 7, color: '#7A3300', label: 'Brun',         status: 'Critique',   statusColor: '#991b1b' },
  { level: 8, color: '#4A1800', label: 'Très sombre',  status: 'Danger',     statusColor: '#7f1d1d' },
];

// ─── Questions indicateurs clés ───────────────────────────────
const HEALTH_QUESTIONS = [
  {
    id: 'pain',
    emoji: '🦴',
    label: 'Douleurs & Courbatures',
    desc: '1 = Aucune douleur · 10 = Douleur intense',
    lowLabel: '💚 Aucune douleur',
    highLabel: '🔴 Très intense',
    inverse: true, // rouge = mauvais = valeur haute
  },
  {
    id: 'sleep',
    emoji: '🌙',
    label: 'Qualité du Sommeil cette nuit',
    desc: '1 = Très mauvais · 10 = Excellent',
    lowLabel: '🔴 Très mauvais',
    highLabel: '💚 Excellent',
    inverse: false,
  },
  {
    id: 'energy',
    emoji: '⚡',
    label: 'Niveau d\'Énergie ce matin',
    desc: '1 = Épuisé · 10 = Plein d\'énergie',
    lowLabel: '🔴 Épuisé',
    highLabel: '💚 Plein d\'énergie',
    inverse: false,
  },
  {
    id: 'mood',
    emoji: '🧠',
    label: 'Moral & Humeur',
    desc: '1 = Très bas · 10 = Au top',
    lowLabel: '🔴 Très bas',
    highLabel: '💚 Au top',
    inverse: false,
  },
  {
    id: 'food',
    emoji: '🥗',
    label: 'Qualité Nutritionnelle hier',
    desc: '1 = Mauvaise · 10 = Excellente',
    lowLabel: '🔴 Mauvaise',
    highLabel: '💚 Excellente',
    inverse: false,
  },
];

// ─── Composant Slider amélioré ────────────────────────────────
interface SliderProps {
  label: string;
  emoji: string;
  desc: string;
  lowLabel: string;
  highLabel: string;
  value: number;
  onChange: (v: number) => void;
  inverse?: boolean;
  sessionColor?: string;
}

const CheckSlider: React.FC<SliderProps> = ({ label, emoji, desc, lowLabel, highLabel, value, onChange, inverse = false, sessionColor }) => {
  // Couleur dynamique
  const getColor = () => {
    if (inverse) {
      if (value <= 3) return '#22c55e';
      if (value <= 6) return '#eab308';
      return '#ef4444';
    } else {
      if (value <= 3) return '#ef4444';
      if (value <= 6) return '#eab308';
      return '#22c55e';
    }
  };

  const color = sessionColor || getColor();
  const pct = ((value - 0) / 10) * 100; // 0..10, 5 est au milieu exact

  const getQualLabel = () => {
    if (inverse) {
      if (value === 0) return 'Pas de séance';
      if (value <= 3) return 'Facile';
      if (value <= 6) return 'Modéré';
      if (value <= 8) return 'Dur';
      return 'Maximum';
    } else {
      if (value <= 2) return 'Critique';
      if (value <= 4) return 'Faible';
      if (value <= 6) return 'Moyen';
      if (value <= 8) return 'Bon';
      return 'Optimal';
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{emoji}</span>
            <span className="text-white font-bold text-sm uppercase tracking-wide">{label}</span>
          </div>
          <p className="text-xs mt-0.5 pl-7" style={{ color: '#8B9BB4' }}>{desc}</p>
        </div>
        <div className="text-right ml-4">
          <span className="font-display text-2xl font-bold" style={{ color }}>{value}</span>
          <span className="text-xs" style={{ color: '#8B9BB4' }}>/10</span>
          <div className="text-[10px] font-bold uppercase mt-0.5" style={{ color }}>{getQualLabel()}</div>
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer outline-none"
          style={{ accentColor: color, background: `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)` }}
        />
      </div>

      {/* Légende */}
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
        <span style={{ color: inverse ? '#22c55e' : '#ef4444' }}>{lowLabel}</span>
        <span style={{ color: inverse ? '#ef4444' : '#22c55e' }}>{highLabel}</span>
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────
interface CheckInViewProps {
  athlete: Athlete;
  onDone: () => void;
}

export const CheckInView: React.FC<CheckInViewProps> = ({ athlete, onDone }) => {
  const [todayEvents, setTodayEvents] = useState<ScheduleEvent[]>([]);
  const [sessionRpes, setSessionRpes] = useState<Record<string, number>>({});
  const [healthVals, setHealthVals] = useState<Record<string, number>>({
    pain: 2, sleep: 7, energy: 7, mood: 7, food: 7
  });
  const [urineLevel, setUrineLevel] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  // Charger les événements d'aujourd'hui
  useEffect(() => {
    const load = async () => {
      try {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today);
        monday.setDate(diff);
        monday.setHours(0,0,0,0);
        const offset = monday.getTimezoneOffset();
        const adjusted = new Date(monday.getTime() - offset*60*1000);
        const startDateStr = adjusted.toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];

        const schedule = await getAthleteWeeklySchedule(startDateStr, athlete.id);
        const todaySchedule = schedule.find(d => d.date === todayStr);
        const trainingEvents = (todaySchedule?.events || []).filter(e =>
          ['WATER-POLO', 'MUSCU', 'MATCH', 'KINE', 'MENTAL'].includes(e.type)
        );

        setTodayEvents(trainingEvents);
        // Initialiser les RPE à 0 pour chaque séance
        const init: Record<string, number> = {};
        trainingEvents.forEach(e => { init[e.id] = 0; });
        setSessionRpes(init);
      } catch {
        setTodayEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [athlete.id]);

  const getEventEmoji = (type: string) => {
    switch(type) {
      case 'WATER-POLO': return '🏊';
      case 'MUSCU': return '💪';
      case 'MATCH': return '🏆';
      case 'KINE': return '🩺';
      case 'MENTAL': return '🧠';
      default: return '🏃';
    }
  };

  const getEventColor = (type: string) => {
    switch(type) {
      case 'WATER-POLO': return '#3b82f6';
      case 'MUSCU': return '#ef4444';
      case 'MATCH': return '#E8B800';
      case 'KINE': return '#22c55e';
      default: return '#8b5cf6';
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const allRpes = Object.values(sessionRpes).filter(v => v > 0);
      const maxRpe = allRpes.length > 0 ? Math.max(...allRpes) : 0;

      const log: DailyLog = {
        date: new Date().toISOString(),
        sleep:       healthVals.sleep,
        fatigue:     maxRpe || 5,
        soreness:    healthVals.pain,
        foodQuality: healthVals.food,
        mood:        healthVals.mood,
        comment:     `[Énergie:${healthVals.energy}] [Urine:${urineLevel || '-'}] ${comment}`.trim(),
      };

      await saveDailyLog(athlete.id, log);

      // Alertes automatiques
      const alerts: string[] = [];
      if (healthVals.pain >= 7) alerts.push('🦴 Douleurs importantes signalées');
      if (healthVals.sleep <= 3) alerts.push('🌙 Sommeil très mauvais');
      if (healthVals.energy <= 3) alerts.push('⚡ Niveau d\'énergie critique');
      if (urineLevel && urineLevel >= 5) alerts.push('💧 Hydratation insuffisante');
      if (allRpes.some(r => r >= 9)) alerts.push('🔥 RPE maximum signalé');
      if (comment.toLowerCase().match(/douleur|blessure|mal|pain|genou|épaule/)) alerts.push('⚠️ Mots-clés douleur détectés');

      if (alerts.length > 0) {
        await sendMessage(
          athlete.id,
          `⚠️ Alerte Check-in — ${athlete.firstName} ${athlete.lastName}`,
          `Alertes détectées :\n${alerts.join('\n')}\n\nCommentaire : ${comment}`
        );
        setMessageSent(true);
      }

      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  // ── ÉCRAN DE CONFIRMATION ────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center animate-in zoom-in-95">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="font-display text-3xl text-white uppercase mb-2">Rapport Validé !</h2>
        <p className="text-sm mb-2" style={{ color: '#8B9BB4' }}>Tes données ont été transmises au staff. +100 XP</p>
        {messageSent && (
          <div className="mt-3 px-4 py-2 rounded-lg text-sm font-bold" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
            ⚠️ Le staff a été notifié d'une alerte
          </div>
        )}
        <button
          onClick={onDone}
          className="mt-8 px-8 py-3 rounded-xl font-display font-bold uppercase tracking-widest text-sm"
          style={{ background: 'linear-gradient(135deg, #E8B800, #F5D000)', color: '#0B1628' }}
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E8B800', borderTopColor: 'transparent' }}></div>
          <p className="text-sm" style={{ color: '#8B9BB4' }}>Chargement du planning...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-32 pt-4 space-y-6 animate-in fade-in">

      {/* Header */}
      <div className="text-center py-4">
        <h2 className="font-display text-3xl text-white uppercase tracking-wider">Check-in Quotidien</h2>
        <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: '#E8B800' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}
        </p>
      </div>

      {/* ─── SECTION 1 : RPE par séance ─────────────────────── */}
      <div className="rounded-2xl p-5 space-y-6" style={{ background: 'rgba(26,58,122,0.2)', border: '1px solid rgba(232,184,0,0.2)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <div>
            <h3 className="font-display text-lg text-white uppercase">RPE par Séance</h3>
            <p className="text-xs" style={{ color: '#8B9BB4' }}>Effort perçu pour chaque entraînement d'aujourd'hui</p>
          </div>
        </div>

        {todayEvents.length === 0 ? (
          <div className="text-center py-4">
            <span className="text-3xl block mb-2">😴</span>
            <p className="text-sm font-bold" style={{ color: '#8B9BB4' }}>Aucune séance programmée aujourd'hui</p>
            <p className="text-xs mt-1" style={{ color: '#8B9BB4' }}>Jour de repos ou planning non défini</p>
          </div>
        ) : (
          todayEvents.map(event => (
            <div key={event.id} className="p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${getEventColor(event.type)}40` }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{getEventEmoji(event.type)}</span>
                <div>
                  <span className="font-bold text-sm uppercase text-white">{event.title}</span>
                  <span className="text-xs ml-2 px-2 py-0.5 rounded font-bold uppercase" style={{ background: `${getEventColor(event.type)}25`, color: getEventColor(event.type) }}>
                    {event.startTime} — {event.type}
                  </span>
                </div>
              </div>
              <CheckSlider
                label={`Effort ressenti`}
                emoji=""
                desc="0 = Non participé · 1 = Très facile · 10 = Maximum absolu"
                lowLabel="😌 Repos / Facile"
                highLabel="😤 Maximum"
                value={sessionRpes[event.id] ?? 0}
                onChange={v => setSessionRpes(prev => ({...prev, [event.id]: v}))}
                inverse={true}
                sessionColor={getEventColor(event.type)}
              />
            </div>
          ))
        )}
      </div>

      {/* ─── SECTION 2 : Indicateurs santé ──────────────────── */}
      <div className="rounded-2xl p-5 space-y-6" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">💊</span>
          <div>
            <h3 className="font-display text-lg text-white uppercase">Indicateurs Santé</h3>
            <p className="text-xs" style={{ color: '#8B9BB4' }}>Ton état général ce matin</p>
          </div>
        </div>

        {HEALTH_QUESTIONS.map((q, idx) => (
          <React.Fragment key={q.id}>
            {idx > 0 && <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />}
            <CheckSlider
              label={q.label}
              emoji={q.emoji}
              desc={q.desc}
              lowLabel={q.lowLabel}
              highLabel={q.highLabel}
              value={healthVals[q.id]}
              onChange={v => setHealthVals(prev => ({...prev, [q.id]: v}))}
              inverse={q.inverse}
            />
          </React.Fragment>
        ))}
      </div>

      {/* ─── SECTION 3 : Couleur des urines ─────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">💧</span>
          <div>
            <h3 className="font-display text-lg text-white uppercase">Hydratation au Réveil</h3>
            <p className="text-xs" style={{ color: '#8B9BB4' }}>Sélectionne la couleur de tes urines ce matin</p>
          </div>
        </div>

        {/* Carrés de couleur */}
        <div className="grid grid-cols-8 gap-1.5 mb-3">
          {URINE_SCALE.map(u => (
            <button
              key={u.level}
              onClick={() => setUrineLevel(u.level)}
              className="relative aspect-square rounded-lg transition-all"
              style={{
                background: u.color,
                border: urineLevel === u.level ? '3px solid white' : '2px solid transparent',
                transform: urineLevel === u.level ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              {urineLevel === u.level && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-black font-bold text-xs">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Légende */}
        <div className="flex justify-between text-[9px] font-bold uppercase mb-3" style={{ color: '#8B9BB4' }}>
          <span>💚 Bien hydraté</span>
          <span>🔴 Déshydraté</span>
        </div>

        {/* Résultat sélectionné */}
        {urineLevel && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl animate-in fade-in"
               style={{ background: `${URINE_SCALE[urineLevel-1].color}20`, border: `1px solid ${URINE_SCALE[urineLevel-1].color}50` }}>
            <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ background: URINE_SCALE[urineLevel-1].color }}></div>
            <div>
              <span className="text-white font-bold text-sm block">{URINE_SCALE[urineLevel-1].label}</span>
              <span className="text-xs font-bold" style={{ color: URINE_SCALE[urineLevel-1].statusColor }}>
                Hydratation : {URINE_SCALE[urineLevel-1].status}
              </span>
            </div>
            {urineLevel >= 4 && (
              <div className="ml-auto text-xs font-bold text-right" style={{ color: URINE_SCALE[urineLevel-1].statusColor }}>
                Bois de<br/>l'eau !
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── SECTION 4 : Commentaire ─────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">💬</span>
          <div>
            <h3 className="font-display text-base text-white uppercase">Commentaire Libre</h3>
            <p className="text-xs" style={{ color: '#8B9BB4' }}>Douleur, blessure, ressenti... le staff lira</p>
          </div>
        </div>
        <textarea
          rows={3}
          className="w-full rounded-xl p-3 text-white text-sm placeholder-white/20 focus:outline-none resize-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          placeholder="Rien à signaler... ou dites-le nous librement"
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
      </div>

      {/* ─── BOUTON VALIDER ──────────────────────────────────── */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-4 rounded-2xl font-display font-bold uppercase tracking-widest text-base transition-all active:scale-95 mb-8"
        style={{
          background: 'linear-gradient(135deg, #E8B800, #F5D000)',
          color: '#0B1628',
          boxShadow: '0 0 30px rgba(232,184,0,0.3)',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? '...' : '✅ Valider le Rapport · +100 XP'}
      </button>
    </div>
  );
};