import React, { useState, useRef, useCallback } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Athlete, DaySchedule, ScheduleEvent } from '../../types';

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface PlanningViewProps {
  athletes: Athlete[];
  weeklySchedule: DaySchedule[];
}

// ─── LOCAL TYPES ──────────────────────────────────────────────────────────────

interface PlanBlock {
  id: string;
  label: string;
  color: string;
  weekStart: number; // index from start of season
  duration: number;  // nb de semaines
  notes: string;
}

interface SessionExercise {
  id: string;
  name: string;
  category: string;
  sets: number;
  metric: 'reps' | 'time' | 'meters' | 'aller_retour';
  reps: string;
  load: string;
  tempo: string;
  rest: string;
  rpe: number;
  notes: string;
}

type SessionType = 'MUSCU' | 'WATER';

interface SavedSession {
  id: string;
  type: SessionType;
  title: string;
  category: string;         // thème
  duration: number;         // minutes
  predictedRpe: number;
  isVisibleToAthletes: boolean;
  linkedEventId?: string;
  exercises: SessionExercise[];
  createdAt: string;
}

// ─── EXERCISE BANKS ───────────────────────────────────────────────────────────

interface ExerciseDef {
  name: string;
  category: string;
}

const MUSCU_BANK: ExerciseDef[] = [
  // Mouvements de force
  { name: 'Back Squat', category: 'Force' },
  { name: 'Front Squat', category: 'Force' },
  { name: 'Deadlift', category: 'Force' },
  { name: 'Romanian Deadlift (RDL)', category: 'Force' },
  { name: 'Hip Thrust', category: 'Force' },
  { name: 'Bench Press', category: 'Force' },
  { name: 'Incline Bench Press', category: 'Force' },
  { name: 'Overhead Press (OHP)', category: 'Force' },
  { name: 'Pendlay Row', category: 'Force' },
  { name: 'Barbell Row', category: 'Force' },
  { name: 'Pull-up / Chin-up', category: 'Force' },
  { name: 'Traction Lestée', category: 'Force' },
  { name: 'Dips Lestés', category: 'Force' },
  // Haltères
  { name: 'Split Squat (Bulgare)', category: 'Haltères' },
  { name: 'Fente Marchée', category: 'Haltères' },
  { name: 'Step-up', category: 'Haltères' },
  { name: 'Curl Biceps Haltères', category: 'Haltères' },
  { name: 'Extension Triceps Haltère', category: 'Haltères' },
  { name: 'Fly Pectoraux', category: 'Haltères' },
  { name: 'Rowing Haltère Unilatéral', category: 'Haltères' },
  { name: 'Développé Épaule Haltères', category: 'Haltères' },
  { name: 'Lateral Raise', category: 'Haltères' },
  { name: 'Face Pull Haltères', category: 'Haltères' },
  { name: 'Curl Marteau', category: 'Haltères' },
  // Olympique
  { name: 'Power Clean', category: 'Olympique' },
  { name: 'Hang Clean', category: 'Olympique' },
  { name: 'Power Snatch', category: 'Olympique' },
  { name: 'Hang Snatch', category: 'Olympique' },
  { name: 'Push Press', category: 'Olympique' },
  { name: 'Push Jerk', category: 'Olympique' },
  { name: 'Clean & Jerk', category: 'Olympique' },
  { name: 'High Pull', category: 'Olympique' },
  // Explosivité / Pliométrie
  { name: 'CMJ (Counter-Movement Jump)', category: 'Pliométrie' },
  { name: 'Box Jump', category: 'Pliométrie' },
  { name: 'Depth Jump', category: 'Pliométrie' },
  { name: 'Broad Jump', category: 'Pliométrie' },
  { name: 'Saut Pogo', category: 'Pliométrie' },
  { name: 'Medball Slam', category: 'Pliométrie' },
  { name: 'Medball Chest Pass', category: 'Pliométrie' },
  { name: 'Medball Overhead Throw', category: 'Pliométrie' },
  { name: 'Sprint 10m', category: 'Pliométrie' },
  { name: 'Sprint 30m', category: 'Pliométrie' },
  // Crossfit / Fonctionnel
  { name: 'Thruster', category: 'Crossfit' },
  { name: 'Wall Ball', category: 'Crossfit' },
  { name: 'Kettlebell Swing', category: 'Crossfit' },
  { name: 'Turkish Get-Up', category: 'Crossfit' },
  { name: 'Devil Press', category: 'Crossfit' },
  { name: 'Burpee Pull-up', category: 'Crossfit' },
  { name: 'Double Under', category: 'Crossfit' },
  { name: 'Rowing Machine (ergomètre)', category: 'Crossfit' },
  { name: 'Assault Bike', category: 'Crossfit' },
  { name: 'Ski Erg', category: 'Crossfit' },
  // Gainage / Core
  { name: 'Planche (Plank)', category: 'Core' },
  { name: 'Planche Latérale', category: 'Core' },
  { name: 'Dead Bug', category: 'Core' },
  { name: 'Pallof Press', category: 'Core' },
  { name: 'Rollout (TRX ou Rouleau)', category: 'Core' },
  { name: 'V-Up', category: 'Core' },
  { name: 'Russian Twist (Leste)', category: 'Core' },
  { name: 'Dragon Flag', category: 'Core' },
  { name: 'Ab Wheel', category: 'Core' },
  { name: 'Hanging Leg Raise', category: 'Core' },
  // Prévention / Stabilité
  { name: 'Nordic Curl', category: 'Prévention' },
  { name: 'Copenhagen Adducteur', category: 'Prévention' },
  { name: 'Band Pull Apart', category: 'Prévention' },
  { name: 'External Rotation Élastique', category: 'Prévention' },
  { name: 'Clamshell Élastique', category: 'Prévention' },
  { name: 'Goodmorning', category: 'Prévention' },
  { name: 'Jefferson Curl', category: 'Prévention' },
  { name: 'Sissy Squat (assisté)', category: 'Prévention' },
];

const WP_BANK: ExerciseDef[] = [
  // Technique individuelle
  { name: 'Nage libre sprint', category: 'Condition' },
  { name: 'Nage dos sprint', category: 'Condition' },
  { name: 'Eggbeater stationnaire', category: 'Technique indiv.' },
  { name: 'Eggbeater jump', category: 'Technique indiv.' },
  { name: 'Tir en puissance (dominant)', category: 'Technique indiv.' },
  { name: 'Tir en précision (angle)', category: 'Technique indiv.' },
  { name: 'Tir en suspension', category: 'Technique indiv.' },
  { name: 'Dribble pression', category: 'Technique indiv.' },
  { name: 'Dribble contournement', category: 'Technique indiv.' },
  { name: 'Passe longue (bras)', category: 'Technique indiv.' },
  { name: 'Passe courte (push)', category: 'Technique indiv.' },
  // Jeu collectif
  { name: 'Contre-attaque 2c1', category: 'Collectif' },
  { name: 'Contre-attaque 3c2', category: 'Collectif' },
  { name: 'Jeu à 2 (écran + tir)', category: 'Collectif' },
  { name: 'Jeu à 3 (combinaison)', category: 'Collectif' },
  { name: 'Supériorité numérique (6c5)', category: 'Collectif' },
  { name: 'Infériorité numérique (5c6)', category: 'Collectif' },
  { name: 'Pénalty (5m)', category: 'Collectif' },
  { name: 'Jet de coin', category: 'Collectif' },
  { name: 'Rentrée (throw-in)', category: 'Collectif' },
  // Défense
  { name: 'Défense homme à homme', category: 'Défense' },
  { name: 'Pressing 6c6', category: 'Défense' },
  { name: 'Zone 3-3', category: 'Défense' },
  { name: 'Zone 2-4', category: 'Défense' },
  { name: 'Interception / bloc tir', category: 'Défense' },
  // Condition physique eau
  { name: 'Sprint 25m (balle / sans)', category: 'Condition' },
  { name: 'Interval training (10x25m)', category: 'Condition' },
  { name: 'Match à durée réduite (3x2min)', category: 'Condition' },
  { name: 'Circuit eggbeater + tir', category: 'Condition' },
  { name: 'HIIT balle (30s effort / 15s repos)', category: 'Condition' },
  // Gardien
  { name: 'Travail de mains (gardien)', category: 'Gardien' },
  { name: 'Angle et positionnement (gardien)', category: 'Gardien' },
  { name: 'Sortie sur centreur (gardien)', category: 'Gardien' },
];

const WATER_THEMES = [
  'Speed', 'Hit', 'CA 0/CA 1', 'CA 2/CA 3', 'Technical individual',
  'Shoot', 'Duel', 'Point defense', 'Pass', 'Leg',
  'Tactical', 'Zone/Pressing', 'Z+/Z-', 'Counter-attack', 'Match',
];

const MUSCU_THEMES = [
  'Mobilité', 'Prévention', 'Gainage', 'Hypertrophie',
  'Force', 'Puissance', 'Cardio crossfit',
];

const PLAN_COLORS = [
  '#E52E01', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#64748B',
];

const METRICS_LABELS: Record<string, string> = {
  reps: 'Reps', time: 'Temps (sec)', meters: 'Mètres', aller_retour: 'Allers-retours',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).substr(2, 9);

const calcSessionLoad = (exs: SessionExercise[]) =>
  exs.reduce((acc, ex) => acc + ex.sets * ex.rpe * 5, 0);

const avgRpe = (exs: SessionExercise[]) =>
  exs.length ? Math.round(exs.reduce((a, b) => a + b.rpe, 0) / exs.length * 10) / 10 : 0;

// ─── SUB-COMPONENT: EXERCISE ROW ──────────────────────────────────────────────
interface ExRowProps {
  ex: SessionExercise;
  idx: number;
  onChange: (ex: SessionExercise) => void;
  onRemove: () => void;
  isWater?: boolean;
}

const ExRow: React.FC<ExRowProps> = ({ ex, idx, onChange, onRemove, isWater }) => {
  const [open, setOpen] = useState(true);
  const u = (patch: Partial<SessionExercise>) => onChange({ ...ex, ...patch });

  return (
    <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <span className="text-nexus-gray text-xs font-bold w-5 text-center">{idx + 1}</span>
        <div className="flex-1 min-w-0">
          <span className="text-white font-bold text-sm block truncate">{ex.name}</span>
          <span className="text-nexus-gray text-[10px] uppercase">{ex.category}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-nexus-gold text-xs font-mono font-bold">
            {ex.sets}×{ex.reps} · RPE {ex.rpe}
          </span>
          <button onClick={e => { e.stopPropagation(); onRemove(); }}
            className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs">✕</button>
          <span className="text-nexus-gray text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Details */}
      {open && (
        <div className="px-3 pb-4 space-y-3 border-t border-white/5 pt-3">
          {isWater && (
            <div>
              <label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Métrique</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(METRICS_LABELS) as (keyof typeof METRICS_LABELS)[]).map(m => (
                  <button key={m} onClick={() => u({ metric: m as any })}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                      ex.metric === m ? 'bg-nexus-gold text-black' : 'bg-white/5 text-nexus-gray hover:text-white'
                    }`}>
                    {METRICS_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] text-nexus-gray uppercase font-bold block mb-1">Séries</label>
              <input type="number" min="1" max="20" value={ex.sets}
                onChange={e => u({ sets: parseInt(e.target.value) || 1 })}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-nexus-gold text-center" />
            </div>
            <div>
              <label className="text-[9px] text-nexus-gray uppercase font-bold block mb-1">{isWater ? METRICS_LABELS[ex.metric] : 'Reps'}</label>
              <input type="text" value={ex.reps} placeholder="ex: 8, 45s, 50m"
                onChange={e => u({ reps: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-nexus-gold text-center" />
            </div>
            <div>
              <label className="text-[9px] text-nexus-gray uppercase font-bold block mb-1">Charge</label>
              <input type="text" value={ex.load} placeholder="kg / PDC / RM%"
                onChange={e => u({ load: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-nexus-gold text-center" />
            </div>
            {!isWater && (
              <div>
                <label className="text-[9px] text-nexus-gray uppercase font-bold block mb-1">Tempo</label>
                <input type="text" value={ex.tempo} placeholder="3010"
                  onChange={e => u({ tempo: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-nexus-gold text-center" />
              </div>
            )}
            <div>
              <label className="text-[9px] text-nexus-gray uppercase font-bold block mb-1">Repos</label>
              <input type="text" value={ex.rest} placeholder="60s / 2min"
                onChange={e => u({ rest: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-nexus-gold text-center" />
            </div>
            <div>
              <label className="text-[9px] text-nexus-gray uppercase font-bold block mb-1">RPE exercice</label>
              <input type="number" min="1" max="10" value={ex.rpe}
                onChange={e => u({ rpe: parseInt(e.target.value) || 5 })}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-nexus-gold text-center" />
            </div>
          </div>

          <div>
            <label className="text-[9px] text-nexus-gray uppercase font-bold block mb-1">Consignes / Notes</label>
            <input type="text" value={ex.notes} placeholder="Consignes techniques..."
              onChange={e => u({ notes: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-nexus-gold" />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SUB-COMPONENT: SESSION DETAIL MODAL ─────────────────────────────────────
const SessionDetailModal: React.FC<{
  session: SavedSession;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}> = ({ session, onClose, onEdit, onDuplicate, onDelete }) => (
  <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-xl flex flex-col animate-in slide-in-from-right duration-200">
    <div className="p-5 flex justify-between items-center border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-sm z-10">
      <div>
        <h2 className="font-display text-2xl text-white uppercase">{session.title}</h2>
        <p className="text-[10px] text-nexus-gray uppercase tracking-widest">{session.category} · {session.duration} min · RPE {session.predictedRpe}</p>
      </div>
      <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center">✕</button>
    </div>
    <div className="flex-1 overflow-y-auto p-5 space-y-3 pb-32">
      {/* Meta */}
      <div className="flex gap-2 flex-wrap">
        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${session.isVisibleToAthletes ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {session.isVisibleToAthletes ? '👁 Visible joueurs' : '🔒 Staff seulement'}
        </span>
        {session.linkedEventId && (
          <span className="text-[10px] px-2 py-1 rounded font-bold uppercase bg-nexus-gold/20 text-nexus-gold">
            📅 Lié au planning
          </span>
        )}
        <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-nexus-gray">
          {session.exercises.length} exercice{session.exercises.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Exercises */}
      {session.exercises.map((ex, i) => (
        <div key={ex.id} className="bg-black/30 border border-white/10 rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-white font-bold block">{ex.name}</span>
              <span className="text-[10px] text-nexus-gray uppercase">{ex.category}</span>
            </div>
            <span className="text-nexus-gold font-display text-lg font-bold">{ex.sets}×{ex.reps}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center mt-3">
            {[
              { l: 'Charge', v: ex.load || '—' },
              { l: 'Tempo', v: ex.tempo || '—' },
              { l: 'Repos', v: ex.rest },
              { l: 'RPE', v: `${ex.rpe}/10` },
            ].map(cell => (
              <div key={cell.l} className="bg-black/40 rounded-lg p-2">
                <div className="text-[9px] text-nexus-gray uppercase">{cell.l}</div>
                <div className="text-white font-bold text-sm">{cell.v}</div>
              </div>
            ))}
          </div>
          {ex.notes && <p className="text-xs text-nexus-gray italic mt-2 border-l border-nexus-gray/30 pl-2">{ex.notes}</p>}
        </div>
      ))}
    </div>

    {/* Actions */}
    <div className="p-5 border-t border-white/10 grid grid-cols-3 gap-3 bg-black/80">
      <button onClick={onEdit} className="py-3 rounded-xl bg-nexus-gold/10 text-nexus-gold border border-nexus-gold/20 text-xs font-bold uppercase hover:bg-nexus-gold hover:text-black transition-all">
        ✏️ Modifier
      </button>
      <button onClick={onDuplicate} className="py-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase hover:bg-blue-500 hover:text-white transition-all">
        📋 Dupliquer
      </button>
      <button onClick={onDelete} className="py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-all">
        🗑 Supprimer
      </button>
    </div>
  </div>
);

// ─── TAB 1: MACRO PLANNING ────────────────────────────────────────────────────
const MacroPlanTab: React.FC = () => {
  const [blocks, setBlocks] = useState<PlanBlock[]>([
    { id: '1', label: 'Préparation Générale', color: '#3B82F6', weekStart: 0, duration: 4, notes: 'PPG – Volume élevé, intensité faible' },
    { id: '2', label: 'Préparation Spécifique', color: '#F59E0B', weekStart: 4, duration: 4, notes: 'PPO – Montée en intensité' },
    { id: '3', label: 'Compétition', color: '#10B981', weekStart: 8, duration: 6, notes: 'Championnat – Maintenance' },
    { id: '4', label: 'Récupération', color: '#8B5CF6', weekStart: 14, duration: 2, notes: 'Récup active, transition' },
  ]);

  const [editing, setEditing] = useState<PlanBlock | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<PlanBlock>>({ color: PLAN_COLORS[0], duration: 2, weekStart: 0, label: '', notes: '' });
  const dragId = useRef<string | null>(null);
  const [totalWeeks] = useState(32);

  const saveBlock = () => {
    if (!form.label) return;
    if (editing) {
      setBlocks(b => b.map(bl => bl.id === editing.id ? { ...editing, ...form } as PlanBlock : bl));
      setEditing(null);
    } else {
      setBlocks(b => [...b, { ...form, id: uid() } as PlanBlock]);
    }
    setShowForm(false);
    setForm({ color: PLAN_COLORS[0], duration: 2, weekStart: 0, label: '', notes: '' });
  };

  const deleteBlock = (id: string) => setBlocks(b => b.filter(x => x.id !== id));

  const startEdit = (bl: PlanBlock) => {
    setEditing(bl);
    setForm({ ...bl });
    setShowForm(true);
  };

  // Drag on the timeline grid
  const onDragOver = (e: React.DragEvent, weekIdx: number) => {
    e.preventDefault();
    if (!dragId.current) return;
    setBlocks(b => b.map(bl => bl.id === dragId.current ? { ...bl, weekStart: weekIdx } : bl));
  };

  const weekNums = Array.from({ length: totalWeeks }, (_, i) => i);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-display text-2xl text-white uppercase">Planification Macro</h3>
          <p className="text-nexus-gray text-xs uppercase tracking-widest mt-0.5">Saison {new Date().getFullYear()}–{new Date().getFullYear() + 1}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ color: PLAN_COLORS[0], duration: 2, weekStart: 0, label: '', notes: '' }); setShowForm(true); }}
          className="bg-nexus-gold text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-white transition-colors"
        >
          + Bloc
        </button>
      </div>

      {/* Timeline Grid */}
      <GlassCard className="p-4 overflow-x-auto">
        <p className="text-[9px] text-nexus-gray uppercase font-bold mb-3 tracking-widest">
          Timeline — Glisser les blocs pour les repositionner
        </p>
        {/* Week headers */}
        <div className="min-w-[640px]">
          <div className="flex gap-0.5 mb-1">
            {weekNums.map(w => (
              <div key={w} className="flex-1 text-[8px] text-nexus-gray text-center font-mono">
                {w + 1}
              </div>
            ))}
          </div>

          {/* Drop zones */}
          <div className="flex gap-0.5 mb-2 h-6">
            {weekNums.map(w => (
              <div
                key={w}
                className="flex-1 border border-dashed border-white/10 rounded-sm"
                onDragOver={e => onDragOver(e, w)}
                onDrop={e => { e.preventDefault(); dragId.current = null; }}
              />
            ))}
          </div>

          {/* Blocks row */}
          <div className="relative h-10 mb-1">
            {blocks.map(bl => {
              const left = (bl.weekStart / totalWeeks) * 100;
              const width = (bl.duration / totalWeeks) * 100;
              return (
                <div
                  key={bl.id}
                  draggable
                  onDragStart={() => { dragId.current = bl.id; }}
                  style={{ left: `${left}%`, width: `${Math.max(width, 3)}%`, backgroundColor: bl.color }}
                  className="absolute h-full rounded-lg flex items-center px-2 cursor-grab active:cursor-grabbing border border-white/20 shadow-lg"
                  title={bl.label}
                >
                  <span className="text-white text-[9px] font-bold truncate">{bl.label}</span>
                </div>
              );
            })}
          </div>

          {/* Month labels */}
          <div className="flex gap-0.5 mt-1">
            {['Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû'].map((m, i) => (
              <div key={m} className="text-[8px] text-nexus-gray uppercase font-bold" style={{ flex: `${(i < 11 ? 2 : (totalWeeks - 22)) / totalWeeks * totalWeeks}` }}>
                {m}
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Blocks list */}
      <div className="space-y-3">
        {blocks.map(bl => (
          <GlassCard key={bl.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: bl.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-bold text-sm">{bl.label}</h4>
                    <p className="text-[10px] text-nexus-gray">
                      Sem. {bl.weekStart + 1} → {bl.weekStart + bl.duration} · {bl.duration} semaine{bl.duration > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button onClick={() => startEdit(bl)} className="text-[10px] text-nexus-gold hover:text-white px-2 py-1 rounded border border-nexus-gold/20 hover:border-white/20">Modifier</button>
                    <button onClick={() => deleteBlock(bl.id)} className="text-[10px] text-red-400 hover:text-white px-2 py-1 rounded border border-red-500/20 hover:bg-red-500">✕</button>
                  </div>
                </div>
                {bl.notes && <p className="text-xs text-nexus-gray mt-1 italic">{bl.notes}</p>}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in-95">
          <GlassCard className="w-full max-w-md p-6 space-y-4 border-white/10">
            <div className="flex justify-between items-center">
              <h3 className="font-display text-xl text-white uppercase">
                {editing ? 'Modifier Bloc' : 'Nouveau Bloc'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-nexus-gray hover:text-white">✕</button>
            </div>

            <div>
              <label className="text-[10px] text-nexus-gray uppercase font-bold block mb-1">Nom du Bloc</label>
              <input type="text" value={form.label || ''} onChange={e => setForm({ ...form, label: e.target.value })}
                placeholder="ex: Préparation Générale"
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-nexus-gray uppercase font-bold block mb-1">Semaine de début</label>
                <input type="number" min="0" max={totalWeeks - 1} value={form.weekStart ?? 0}
                  onChange={e => setForm({ ...form, weekStart: parseInt(e.target.value) })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" />
              </div>
              <div>
                <label className="text-[10px] text-nexus-gray uppercase font-bold block mb-1">Durée (semaines)</label>
                <input type="number" min="1" max={totalWeeks} value={form.duration ?? 2}
                  onChange={e => setForm({ ...form, duration: parseInt(e.target.value) })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-nexus-gray uppercase font-bold block mb-2">Couleur</label>
              <div className="flex gap-2 flex-wrap">
                {PLAN_COLORS.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'scale-125 border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-nexus-gray uppercase font-bold block mb-1">Notes / Objectifs</label>
              <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Description du thème de travail..."
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold resize-none h-20" />
            </div>

            <button onClick={saveBlock} disabled={!form.label}
              className="w-full py-3 rounded-xl bg-nexus-gold text-black font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-30">
              {editing ? 'Enregistrer' : 'Créer le Bloc'}
            </button>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

// ─── SESSION BUILDER (réutilisé pour Muscu & Water) ───────────────────────────
interface SessionBuilderProps {
  type: SessionType;
  bank: ExerciseDef[];
  themes: string[];
  weeklySchedule: DaySchedule[];
  sessions: SavedSession[];
  onSave: (s: SavedSession) => void;
  onUpdate: (s: SavedSession) => void;
  onDelete: (id: string) => void;
}

const SessionBuilder: React.FC<SessionBuilderProps> = ({
  type, bank, themes, weeklySchedule, sessions, onSave, onUpdate, onDelete,
}) => {
  const isWater = type === 'WATER';
  const [view, setView]                 = useState<'list' | 'build' | 'detail'>('list');
  const [exercises, setExercises]       = useState<SessionExercise[]>([]);
  const [bankSearch, setBankSearch]     = useState('');
  const [bankCategory, setBankCategory] = useState('Tous');
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [detailSession, setDetailSession] = useState<SavedSession | null>(null);

  // Session meta
  const [title, setTitle]                       = useState('');
  const [category, setCategory]                 = useState(themes[0]);
  const [duration, setDuration]                 = useState(60);
  const [predictedRpe, setPredictedRpe]         = useState(7);
  const [isVisible, setIsVisible]               = useState(true);
  const [linkedEventId, setLinkedEventId]       = useState('');

  const categories = ['Tous', ...Array.from(new Set(bank.map(e => e.category)))];

  const filteredBank = bank.filter(e => {
    const matchCat = bankCategory === 'Tous' || e.category === bankCategory;
    const matchSearch = !bankSearch || e.name.toLowerCase().includes(bankSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const addExercise = (def: ExerciseDef) => {
    setExercises(prev => [...prev, {
      id: uid(),
      name: def.name,
      category: def.category,
      sets: 3, reps: '8', metric: 'reps',
      load: '', tempo: '3010', rest: '60s', rpe: 7, notes: '',
    }]);
  };

  const updateExercise = (idx: number, ex: SessionExercise) =>
    setExercises(prev => prev.map((e, i) => i === idx ? ex : e));

  const removeExercise = (idx: number) =>
    setExercises(prev => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setExercises([]);
    setTitle(''); setCategory(themes[0]); setDuration(60);
    setPredictedRpe(7); setIsVisible(true); setLinkedEventId('');
    setEditingId(null);
  };

  const startEdit = (s: SavedSession) => {
    setEditingId(s.id);
    setTitle(s.title); setCategory(s.category); setDuration(s.duration);
    setPredictedRpe(s.predictedRpe); setIsVisible(s.isVisibleToAthletes);
    setLinkedEventId(s.linkedEventId || '');
    setExercises(s.exercises);
    setView('build');
  };

  const handleSave = () => {
    if (!title) { alert('Donne un nom à la séance'); return; }
    const sess: SavedSession = {
      id: editingId || uid(),
      type, title, category, duration, predictedRpe,
      isVisibleToAthletes: isVisible,
      linkedEventId: linkedEventId || undefined,
      exercises,
      createdAt: new Date().toISOString(),
    };
    if (editingId) onUpdate(sess);
    else onSave(sess);
    resetForm();
    setView('list');
  };

  const handleDuplicate = (s: SavedSession) => {
    const dup: SavedSession = { ...s, id: uid(), title: `${s.title} (copie)`, createdAt: new Date().toISOString() };
    onSave(dup);
    setDetailSession(null);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Supprimer cette séance ?')) return;
    onDelete(id);
    setDetailSession(null);
  };

  // Flatten all events from schedule
  const allEvents: (ScheduleEvent & { dayName: string; date: string })[] = weeklySchedule.flatMap(day =>
    day.events
      .filter(e => isWater ? ['WATER-POLO', 'MATCH'].includes(e.type) : e.type === 'MUSCU')
      .map(e => ({ ...e, dayName: day.dayName, date: day.date }))
  );

  // ── LIST VIEW ──
  if (view === 'list') return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-display text-xl text-white uppercase">
            {isWater ? '🏊 Séances Water-Polo' : '💪 Séances Muscu / PP'}
          </h3>
          <p className="text-[10px] text-nexus-gray uppercase tracking-widest mt-0.5">
            {sessions.length} séance{sessions.length !== 1 ? 's' : ''} enregistrée{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => { resetForm(); setView('build'); }}
          className="bg-nexus-gold text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-white transition-colors">
          + Nouvelle
        </button>
      </div>

      {sessions.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <span className="text-4xl block mb-3">{isWater ? '🏊' : '💪'}</span>
          <p className="text-nexus-gray text-sm">Aucune séance enregistrée.</p>
          <p className="text-nexus-gray text-xs mt-1">Crée ta première séance ci-dessus.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <GlassCard key={s.id}
              onClick={() => { setDetailSession(s); setView('detail'); }}
              className="p-4 cursor-pointer hover:bg-white/5 transition-all">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <h4 className="text-white font-bold text-sm truncate">{s.title}</h4>
                  <p className="text-[10px] text-nexus-gray uppercase mt-0.5">
                    {s.category} · {s.duration} min · RPE {s.predictedRpe} · {s.exercises.length} exo{s.exercises.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  {s.linkedEventId && <span className="text-[9px] bg-nexus-gold/20 text-nexus-gold px-1.5 py-0.5 rounded font-bold">PLANIFIÉ</span>}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${s.isVisibleToAthletes ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-nexus-gray'}`}>
                    {s.isVisibleToAthletes ? '👁' : '🔒'}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {view === 'detail' && detailSession && (
        <SessionDetailModal
          session={detailSession}
          onClose={() => { setView('list'); setDetailSession(null); }}
          onEdit={() => { startEdit(detailSession); }}
          onDuplicate={() => handleDuplicate(detailSession)}
          onDelete={() => handleDelete(detailSession.id)}
        />
      )}
    </div>
  );

  // ── BUILD VIEW ──
  return (
    <div className="space-y-5 animate-in fade-in pb-36">
      {/* Back */}
      <button onClick={() => { resetForm(); setView('list'); }}
        className="text-nexus-gray text-xs font-bold uppercase tracking-widest flex items-center gap-2">
        ← Historique
      </button>

      <h3 className="font-display text-2xl text-white uppercase">
        {editingId ? 'Modifier la Séance' : 'Nouvelle Séance'}
      </h3>

      {/* Session Meta */}
      <GlassCard className="p-5 space-y-4 border-l-4 border-l-nexus-gold">
        <h4 className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest">Informations Séance</h4>

        <div>
          <label className="text-[10px] text-nexus-gray uppercase font-bold block mb-1">Titre de la séance *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder={isWater ? 'ex: Entraînement mardi soir – Speed' : 'ex: Force – Membres inférieurs'}
            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-nexus-gray uppercase font-bold block mb-1">Thème / Catégorie</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold">
              {themes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-nexus-gray uppercase font-bold block mb-1">Durée (min)</label>
            <input type="number" min="10" max="180" value={duration} onChange={e => setDuration(parseInt(e.target.value))}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-nexus-gray uppercase font-bold block mb-2">RPE Prédictif Séance ({predictedRpe}/10)</label>
          <input type="range" min="1" max="10" value={predictedRpe} onChange={e => setPredictedRpe(parseInt(e.target.value))}
            className="w-full accent-nexus-gold" />
          <div className="flex justify-between text-[9px] text-nexus-gray uppercase mt-1">
            <span>Récup</span><span>Modéré</span><span>Intense</span>
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/10">
          <span className="text-sm font-bold text-white">Contenu visible par les joueurs</span>
          <div onClick={() => setIsVisible(!isVisible)}
            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${isVisible ? 'bg-green-500' : 'bg-gray-700'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${isVisible ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </div>

        {/* Link to schedule */}
        {allEvents.length > 0 && (
          <div>
            <label className="text-[10px] text-nexus-gray uppercase font-bold block mb-1">
              Associer à une séance du semainier (optionnel)
            </label>
            <select value={linkedEventId} onChange={e => setLinkedEventId(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold">
              <option value="">— Aucune association —</option>
              {allEvents.map(e => (
                <option key={e.id} value={e.id}>
                  {e.dayName} {e.date} · {e.startTime} · {e.title || e.type}
                </option>
              ))}
            </select>
          </div>
        )}
      </GlassCard>

      {/* Exercises in session */}
      {exercises.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest">
              Exercices ({exercises.length}) · Charge ~{calcSessionLoad(exercises)} AU · RPE moy. {avgRpe(exercises)}
            </h4>
          </div>
          {exercises.map((ex, i) => (
            <ExRow key={ex.id} ex={ex} idx={i}
              onChange={updated => updateExercise(i, updated)}
              onRemove={() => removeExercise(i)}
              isWater={isWater} />
          ))}
        </div>
      )}

      {/* Exercise bank */}
      <GlassCard className="p-4 space-y-3 border-l-4 border-l-blue-500">
        <h4 className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest">
          Banque d'exercices — Cliquer pour ajouter
        </h4>

        <div className="flex gap-2">
          <input type="text" value={bankSearch} onChange={e => setBankSearch(e.target.value)}
            placeholder="Rechercher..."
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-nexus-gold" />
          <select value={bankCategory} onChange={e => setBankCategory(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-nexus-gold">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
          {filteredBank.map(def => (
            <button key={def.name} onClick={() => addExercise(def)}
              className="w-full flex justify-between items-center px-3 py-2 rounded-lg bg-black/30 hover:bg-nexus-gold/10 hover:border-nexus-gold/30 border border-transparent transition-all text-left group">
              <div>
                <span className="text-white text-sm font-bold group-hover:text-nexus-gold">{def.name}</span>
                <span className="text-nexus-gray text-[10px] ml-2 uppercase">{def.category}</span>
              </div>
              <span className="text-nexus-gold opacity-0 group-hover:opacity-100 font-bold text-sm">+</span>
            </button>
          ))}
          {filteredBank.length === 0 && (
            <div className="text-center py-4">
              <p className="text-nexus-gray text-xs">Aucun résultat</p>
              <button onClick={() => {
                const name = bankSearch.trim();
                if (!name) return;
                addExercise({ name, category: 'Custom' });
                setBankSearch('');
              }} className="mt-2 text-nexus-gold text-xs font-bold underline">
                + Ajouter "{bankSearch}" comme exercice custom
              </button>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Save button (sticky) */}
      <div className="fixed bottom-24 left-0 right-0 px-6 z-50 max-w-lg mx-auto">
        <button onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-nexus-gold text-black font-display text-lg font-bold uppercase tracking-wider shadow-[0_0_30px_rgba(232,184,0,0.4)] hover:bg-white transition-colors">
          {editingId ? '💾 Enregistrer Modifications' : '💾 Enregistrer la Séance'}
          {exercises.length > 0 && ` (${exercises.length} exo${exercises.length > 1 ? 's' : ''})`}
        </button>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
type PlanTab = 'MACRO' | 'MUSCU' | 'WATER';

export const PlanningView: React.FC<PlanningViewProps> = ({ athletes, weeklySchedule }) => {
  const [activeTab, setActiveTab] = useState<PlanTab>('MACRO');
  const [muscuSessions, setMuscuSessions] = useState<SavedSession[]>([]);
  const [waterSessions, setWaterSessions] = useState<SavedSession[]>([]);

  const saveMuscuSession = (s: SavedSession) => setMuscuSessions(prev => [s, ...prev]);
  const updateMuscuSession = (s: SavedSession) => setMuscuSessions(prev => prev.map(x => x.id === s.id ? s : x));
  const deleteMuscuSession = (id: string) => setMuscuSessions(prev => prev.filter(x => x.id !== id));

  const saveWaterSession = (s: SavedSession) => setWaterSessions(prev => [s, ...prev]);
  const updateWaterSession = (s: SavedSession) => setWaterSessions(prev => prev.map(x => x.id === s.id ? s : x));
  const deleteWaterSession = (id: string) => setWaterSessions(prev => prev.filter(x => x.id !== id));

  const TABS: { id: PlanTab; label: string; icon: string }[] = [
    { id: 'MACRO', label: 'Périodisation',   icon: '📆' },
    { id: 'MUSCU', label: 'Muscu / PP',       icon: '💪' },
    { id: 'WATER', label: 'Water-Polo',       icon: '🏊' },
  ];

  return (
    <div className="px-6 pb-32 animate-in fade-in">
      {/* Sub nav */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-all border ${
              activeTab === tab.id
                ? 'bg-nexus-gold text-black border-nexus-gold'
                : 'bg-white/5 text-nexus-gray border-white/10 hover:text-white hover:border-white/20'
            }`}>
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'MACRO' && <MacroPlanTab />}

      {activeTab === 'MUSCU' && (
        <SessionBuilder
          type="MUSCU"
          bank={MUSCU_BANK}
          themes={MUSCU_THEMES}
          weeklySchedule={weeklySchedule}
          sessions={muscuSessions}
          onSave={saveMuscuSession}
          onUpdate={updateMuscuSession}
          onDelete={deleteMuscuSession}
        />
      )}

      {activeTab === 'WATER' && (
        <SessionBuilder
          type="WATER"
          bank={WP_BANK}
          themes={WATER_THEMES}
          weeklySchedule={weeklySchedule}
          sessions={waterSessions}
          onSave={saveWaterSession}
          onUpdate={updateWaterSession}
          onDelete={deleteWaterSession}
        />
      )}
    </div>
  );
};
