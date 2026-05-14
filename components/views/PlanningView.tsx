import React, { useState, useRef, useEffect } from 'react';
import { DaySchedule } from '../../types';

type ExMetric = 'reps' | 'meters' | 'navettes' | 'temps';

interface MacroBlock { id: string; label: string; color: string; startWeek: number; endWeek: number; }
interface PhysiqueExercise { id: string; name: string; category: string; subcat?: string; sets: number; metric: ExMetric; reps: string; load: string; tempo: string; rest: string; rpeEx: number; notes?: string; }
interface PhysiqueSession { id: string; name: string; exercises: PhysiqueExercise[]; sessionRpe: number; duration: number; isVisible: boolean; date: string; notes?: string; associatedEventId?: string; }
interface WaterDrill { id: string; name: string; category: string; sets: number; metric: 'm' | 'AR' | 'time' | 'reps'; value: string; comment: string; }
interface WaterSession { id: string; name: string; theme: string; drills: WaterDrill[]; sessionRpe: number; duration: number; isVisible: boolean; date: string; notes?: string; associatedEventId?: string; }

const MUSCU_SUBCATS = ['Tous', 'Bas du corps', 'Haut du corps', 'Poussée', 'Tirage', 'Gainage'];

const EXERCISE_DB: Record<string, { name: string; defaultMetric: ExMetric; subcat?: string }[]> = {
  'Musculation': [
    { name: 'Back Squat', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Front Squat', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Goblet Squat', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Box Squat', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Deadlift', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Romanian Deadlift', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Sumo Deadlift', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Trap Bar Deadlift', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Leg Press', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Leg Curl', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Leg Extension', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Calf Raise', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Hip Thrust', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Glute Bridge', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Lunge', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Bulgarian Split Squat', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Step-up', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Nordic Curl', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Copenhagen Plank', defaultMetric: 'temps', subcat: 'Bas du corps' },
    { name: 'Good Morning', defaultMetric: 'reps', subcat: 'Bas du corps' },
    { name: 'Bench Press', defaultMetric: 'reps', subcat: 'Poussée' },
    { name: 'Incline Bench Press', defaultMetric: 'reps', subcat: 'Poussée' },
    { name: 'DB Bench Press', defaultMetric: 'reps', subcat: 'Poussée' },
    { name: 'DB Incline Press', defaultMetric: 'reps', subcat: 'Poussée' },
    { name: 'Overhead Press', defaultMetric: 'reps', subcat: 'Poussée' },
    { name: 'Push Press', defaultMetric: 'reps', subcat: 'Poussée' },
    { name: 'Dips', defaultMetric: 'reps', subcat: 'Poussée' },
    { name: 'Lateral Raise', defaultMetric: 'reps', subcat: 'Poussée' },
    { name: 'Front Raise', defaultMetric: 'reps', subcat: 'Poussée' },
    { name: 'Skull Crusher', defaultMetric: 'reps', subcat: 'Poussée' },
    { name: 'Tricep Pushdown', defaultMetric: 'reps', subcat: 'Poussée' },
    { name: 'Close-grip Bench Press', defaultMetric: 'reps', subcat: 'Poussée' },
    { name: 'Pull-up', defaultMetric: 'reps', subcat: 'Tirage' },
    { name: 'Chin-up', defaultMetric: 'reps', subcat: 'Tirage' },
    { name: 'Barbell Row', defaultMetric: 'reps', subcat: 'Tirage' },
    { name: 'DB Row', defaultMetric: 'reps', subcat: 'Tirage' },
    { name: 'Cable Row', defaultMetric: 'reps', subcat: 'Tirage' },
    { name: 'Lat Pulldown', defaultMetric: 'reps', subcat: 'Tirage' },
    { name: 'Face Pull', defaultMetric: 'reps', subcat: 'Tirage' },
    { name: 'DB Curl', defaultMetric: 'reps', subcat: 'Tirage' },
    { name: 'Hammer Curl', defaultMetric: 'reps', subcat: 'Tirage' },
    { name: 'Shrug', defaultMetric: 'reps', subcat: 'Tirage' },
    { name: 'Back Extension', defaultMetric: 'reps', subcat: 'Tirage' },
    { name: 'Pendlay Row', defaultMetric: 'reps', subcat: 'Tirage' },
    { name: 'Seal Row', defaultMetric: 'reps', subcat: 'Tirage' },
    { name: 'Plank', defaultMetric: 'temps', subcat: 'Gainage' },
    { name: 'Side Plank', defaultMetric: 'temps', subcat: 'Gainage' },
    { name: 'Hollow Body Hold', defaultMetric: 'temps', subcat: 'Gainage' },
    { name: 'Russian Twist', defaultMetric: 'reps', subcat: 'Gainage' },
    { name: 'GHD Sit-up', defaultMetric: 'reps', subcat: 'Gainage' },
    { name: 'Ab Wheel', defaultMetric: 'reps', subcat: 'Gainage' },
    { name: 'Farmer\'s Carry', defaultMetric: 'meters', subcat: 'Gainage' },
    { name: 'Hanging Knee Raise', defaultMetric: 'reps', subcat: 'Gainage' },
    { name: 'L-Sit', defaultMetric: 'temps', subcat: 'Gainage' },
  ],
  'CrossFit': [
    'Burpee','Box Jump','Muscle-up','Kipping Pull-up','Strict Pull-up',
    'Thruster','Power Clean','Hang Clean','Full Clean','Power Snatch','Hang Snatch','Full Snatch',
    'Push Jerk','Split Jerk','KB Swing','KB Goblet Squat','KB Clean','KB Snatch','KB Press',
    'Toes-to-bar','K2E','Double Under','Wall Ball','Box Step-up','Air Squat',
    'Turkish Get-Up',
  ].map(n => ({ name: n, defaultMetric: 'reps' as ExMetric })),
  'Cardio / Machine': [
    { name: 'Rowing (erg)', defaultMetric: 'meters' as ExMetric },
    { name: 'Ski Erg', defaultMetric: 'meters' as ExMetric },
    { name: 'Assault Bike', defaultMetric: 'temps' as ExMetric },
    { name: 'Echo Bike', defaultMetric: 'temps' as ExMetric },
    { name: 'Sprint', defaultMetric: 'meters' as ExMetric },
    { name: 'Navettes / Shuttle', defaultMetric: 'navettes' as ExMetric },
    { name: 'Vélo stationnaire', defaultMetric: 'temps' as ExMetric },
    { name: 'Tapis roulant', defaultMetric: 'meters' as ExMetric },
  ],
  'Fonctionnel': [
    { name: 'Battle Rope', defaultMetric: 'temps' as ExMetric },
    { name: 'Sled Push', defaultMetric: 'meters' as ExMetric },
    { name: 'Sled Pull', defaultMetric: 'meters' as ExMetric },
    { name: 'Prowler Sprint', defaultMetric: 'meters' as ExMetric },
    { name: 'Med Ball Slam', defaultMetric: 'reps' as ExMetric },
    { name: 'Med Ball Wall Throw', defaultMetric: 'reps' as ExMetric },
    { name: 'Med Ball Rotational Throw', defaultMetric: 'reps' as ExMetric },
    { name: 'TRX Row', defaultMetric: 'reps' as ExMetric },
    { name: 'TRX Push-up', defaultMetric: 'reps' as ExMetric },
    { name: 'Bear Crawl', defaultMetric: 'meters' as ExMetric },
    { name: 'Pistol Squat', defaultMetric: 'reps' as ExMetric },
    { name: 'Pallof Press', defaultMetric: 'reps' as ExMetric },
    { name: 'Dead Bug', defaultMetric: 'reps' as ExMetric },
    { name: 'Bird Dog', defaultMetric: 'reps' as ExMetric },
    { name: 'Suitcase Carry', defaultMetric: 'meters' as ExMetric },
    { name: 'Handstand Hold', defaultMetric: 'temps' as ExMetric },
    { name: 'Tire Flip', defaultMetric: 'reps' as ExMetric },
    { name: 'Corde à grimper', defaultMetric: 'reps' as ExMetric },
  ],
  'Mobilité / Prévent.': [
    { name: 'Monster Walk', defaultMetric: 'meters' as ExMetric },
    { name: 'Hip Airplane', defaultMetric: 'reps' as ExMetric },
    { name: 'Y-T-W Raises', defaultMetric: 'reps' as ExMetric },
    { name: 'Band Pull Apart', defaultMetric: 'reps' as ExMetric },
    { name: 'Clamshell', defaultMetric: 'reps' as ExMetric },
    { name: 'Hip 90/90', defaultMetric: 'temps' as ExMetric },
    { name: 'Deep Squat Hold', defaultMetric: 'temps' as ExMetric },
    { name: 'Pigeon Pose', defaultMetric: 'temps' as ExMetric },
    { name: 'Cossack Squat', defaultMetric: 'reps' as ExMetric },
    { name: "World's Greatest Stretch", defaultMetric: 'reps' as ExMetric },
    { name: 'Thoracic Rotation', defaultMetric: 'reps' as ExMetric },
    { name: 'Nordic Curl (prévent)', defaultMetric: 'reps' as ExMetric },
    { name: 'Superman', defaultMetric: 'reps' as ExMetric },
  ],
};

const WATER_DB: Record<string, string[]> = {
  'Speed': ['Sprint 25m','Sprint 12.5m relais','Départ réaction signal','Sprint ballon','Navette 4x12.5m'],
  'Hit / Eggbeater': ['Eggbeater statique 30s','Eggbeater dynamique','Sortie d\'eau tir','Duel vertical 1v1'],
  'CA 0 / CA 1': ['Montée rapide 6v5','6v5 CA0 classique','6v5 CA1 décalé','Transition déf-att'],
  'CA 2 / CA 3': ['5v3 supériorité','CA2 2m + ailier','CA3 triangle','Sortie CA + contre-att'],
  'Technique Individuelle': ['Dribble en ligne','Réception haute/basse','Passe courte 2m','Passe longue diag','Feinte corps'],
  'Shoot': ['Tir direct bras','Tir angle fermé','Tir puissance','Lob','Cross shot','Tir 2m','Tir après pivot'],
  'Duel': ['1v1 attaque droit','1v1 attaque gauche','Duel 2m devant but','CA 1v1 dep gardien'],
  'Défense de Point': ['Press 6m agressif','Zone basse 6m','Défense 2m indiv','Flotation zone med'],
  'Passe': ['Circuit 6 joueurs péri','Jeu croisé 2 zones','Passe longue relance gardien','Passe rapide circuit'],
  'Jambes': ['Kick board 25m','Drill jambes crawl','Endurance jambes 200m','Sprint jambes 12.5m'],
  'Tactique': ['Système 3-3 attaque','Système 4-2 classique','Pression haute pressing','Bloc bas défensif'],
  'Zone / Pressing': ['Zone 2-4 standard','Zone 3-3 adaptée','Pressing man-to-man','Drop zone centre'],
  'Z+ / Z-': ['Z+ montée offensive','Z- retour défensif','Transition Z+/Z- alternée'],
  'Contre-attaque': ['CA classique 3v2','CA longue 4v3','CA après interception','CA 2v1 finition'],
  'Match': ['Match 7v7 libre','Match équipe réduite 4v4','Match thématique CA','Match pression temporelle'],
};

const BLOCK_COLORS = ['#e52e01','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#a855f7','#84cc16'];
const uid = () => Math.random().toString(36).substr(2, 9);
const today = () => new Date().toISOString().split('T')[0];

function assignBlockRows(blocks: MacroBlock[]): Record<string, number> {
  const sorted = [...blocks].sort((a, b) => a.startWeek - b.startWeek);
  const rowEndWeek: number[] = [];
  const rowMap: Record<string, number> = {};
  for (const block of sorted) {
    let placed = false;
    for (let r = 0; r < rowEndWeek.length; r++) {
      if (rowEndWeek[r] < block.startWeek) {
        rowMap[block.id] = r; rowEndWeek[r] = block.endWeek; placed = true; break;
      }
    }
    if (!placed) { rowMap[block.id] = rowEndWeek.length; rowEndWeek.push(block.endWeek); }
  }
  return rowMap;
}

const Toggle: React.FC<{ value: boolean; onChange: () => void }> = ({ value, onChange }) => (
  <div onClick={onChange} className={`w-12 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors shrink-0 ${value ? 'bg-green-500' : 'bg-gray-600'}`}>
    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${value ? 'translate-x-6' : ''}`} />
  </div>
);
const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'bg-white/10 text-nexus-gray' }) => (
  <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${color}`}>{children}</span>
);

// ===================== MACRO PLANNING TAB =====================
const MacroPlanningTab: React.FC = () => {
  const [blocks, setBlocks] = useState<MacroBlock[]>([]);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragCurrent, setDragCurrent] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MacroBlock | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formColor, setFormColor] = useState(BLOCK_COLORS[0]);
  const [formStart, setFormStart] = useState(1);
  const [formEnd, setFormEnd] = useState(4);
  const [saved, setSaved] = useState(false);
  const [movingBlock, setMovingBlock] = useState<MacroBlock | null>(null);
  const [moveOffset, setMoveOffset] = useState(0);
  const isDragging = useRef(false);
  const CELL = 52;
  const ROW_H = 44;

  useEffect(() => {
    try { const s = localStorage.getItem('nexus_macro_blocks'); if (s) setBlocks(JSON.parse(s)); } catch {}
  }, []);

  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const dayOffset = yearStart.getDay() === 0 ? -6 : 1 - yearStart.getDay();
  const firstMonday = new Date(yearStart);
  firstMonday.setDate(yearStart.getDate() + dayOffset);
  const currentWeekNum = Math.floor((Date.now() - firstMonday.getTime()) / (7*24*3600*1000));

  const weeks = Array.from({ length: 52 }, (_, i) => {
    const d = new Date(firstMonday); d.setDate(firstMonday.getDate() + i * 7);
    return { idx: i, label: `S${i+1}`, dateStr: `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`, month: d.toLocaleString('fr-FR', { month: 'short' }) };
  });
  const monthGroups: { m: string; count: number }[] = [];
  weeks.forEach((w, i) => { if (i===0||w.month!==weeks[i-1].month) monthGroups.push({m:w.month,count:1}); else monthGroups[monthGroups.length-1].count++; });

  const rowMap = assignBlockRows(blocks);
  const numRows = blocks.length === 0 ? 1 : Math.max(...Object.values(rowMap).concat([0])) + 1;

  const openModal = (s: number, e: number, block?: MacroBlock) => {
    if (block) { setEditing(block); setFormLabel(block.label); setFormColor(block.color); setFormStart(block.startWeek+1); setFormEnd(block.endWeek+1); }
    else { setEditing(null); setFormLabel(''); setFormColor(BLOCK_COLORS[blocks.length % BLOCK_COLORS.length]); setFormStart(s+1); setFormEnd(e+1); }
    setShowModal(true);
  };
  const saveBlock = () => {
    if (!formLabel) return;
    const b: MacroBlock = { id: editing?.id||uid(), label: formLabel, color: formColor, startWeek: formStart-1, endWeek: Math.max(formStart-1, formEnd-1) };
    if (editing) setBlocks(bs => bs.map(x => x.id===editing.id ? b : x));
    else setBlocks(bs => [...bs, b]);
    setShowModal(false);
  };
  const handleSaveAll = () => {
    try { localStorage.setItem('nexus_macro_blocks', JSON.stringify(blocks)); setSaved(true); setTimeout(() => setSaved(false), 2000); } catch {}
  };

  const dragMin = dragStart!==null && dragCurrent!==null ? Math.min(dragStart,dragCurrent) : -1;
  const dragMax = dragStart!==null && dragCurrent!==null ? Math.max(dragStart,dragCurrent) : -1;

  const handleCellDown = (idx: number) => { if (movingBlock) return; isDragging.current=true; setDragStart(idx); setDragCurrent(idx); };
  const handleCellEnter = (idx: number) => {
    if (movingBlock) {
      const dur = movingBlock.endWeek - movingBlock.startWeek;
      const ns = Math.max(0, Math.min(51-dur, idx-moveOffset));
      setDragStart(ns); setDragCurrent(ns+dur);
    } else if (isDragging.current) setDragCurrent(idx);
  };
  const handleCellUp = (idx: number) => {
    if (movingBlock) {
      const dur = movingBlock.endWeek - movingBlock.startWeek;
      const ns = Math.max(0, Math.min(51-dur, idx-moveOffset));
      setBlocks(bs => bs.map(b => b.id===movingBlock.id ? {...b, startWeek:ns, endWeek:ns+dur} : b));
      setMovingBlock(null); setDragStart(null); setDragCurrent(null); isDragging.current=false; return;
    }
    if (!isDragging.current) return;
    isDragging.current=false;
    const s=Math.min(dragStart!,idx), e=Math.max(dragStart!,idx);
    setDragStart(null); setDragCurrent(null);
    openModal(s,e);
  };
  const handleLeave = () => { if (movingBlock) return; if (isDragging.current) { isDragging.current=false; setDragStart(null); setDragCurrent(null); } };
  const handleBlockDown = (ev: React.MouseEvent, block: MacroBlock, weekIdx: number) => {
    ev.preventDefault(); ev.stopPropagation();
    setMovingBlock(block); setMoveOffset(weekIdx-block.startWeek);
    isDragging.current=false; setDragStart(block.startWeek); setDragCurrent(block.endWeek);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-display text-lg text-nexus-gold uppercase tracking-wider">Planification Macro</h3>
          <p className="text-[9px] text-nexus-gray mt-0.5">Glissez sur la timeline · Déplacez les blocs existants</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal(currentWeekNum, currentWeekNum+3)} className="text-[10px] bg-white/5 border border-white/10 text-nexus-gray px-3 py-2 rounded-lg hover:bg-white/10 font-bold">+ Bloc</button>
          <button onClick={handleSaveAll} className={`text-[10px] px-3 py-2 rounded-lg font-bold border transition-all ${saved ? 'bg-green-500 text-black border-green-500' : 'bg-nexus-gold text-black border-nexus-gold hover:bg-white'}`}>
            {saved ? '✓ OK' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      <div className={`overflow-x-auto -mx-2 px-2 pb-4 select-none ${movingBlock ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        onMouseLeave={handleLeave}
        onMouseUp={() => { if (movingBlock) { setMovingBlock(null); setDragStart(null); setDragCurrent(null); } }}>
        <div style={{ width: `${CELL*52+2}px` }}>
          <div className="flex mb-1">
            {monthGroups.map((mg,i) => (
              <div key={i} style={{width:`${CELL*mg.count}px`}} className="text-[8px] uppercase font-bold border-l border-white/10 pl-1" style={{color:'#E8B800'}}>{mg.m.toUpperCase()}</div>
            ))}
          </div>
          <div className="flex h-9">
            {weeks.map(w => {
              const inDrag = w.idx>=dragMin && w.idx<=dragMax;
              const isCurrent = w.idx===currentWeekNum;
              return (
                <div key={w.idx} style={{width:`${CELL}px`}}
                  className={`border-r border-b border-white/5 flex flex-col items-center justify-center text-center transition-colors ${inDrag?'bg-nexus-gold/25':isCurrent?'bg-nexus-gold/10':'bg-white/2 hover:bg-white/6'}`}
                  onMouseDown={() => handleCellDown(w.idx)} onMouseEnter={() => handleCellEnter(w.idx)} onMouseUp={() => handleCellUp(w.idx)}>
                  <span className={`text-[7px] font-bold ${isCurrent?'text-nexus-gold':'text-nexus-gold/60'}`}>{w.label}</span>
                  <span className="text-[5px]" style={{color:'rgba(232,184,0,0.3)'}}>{w.dateStr}</span>
                </div>
              );
            })}
          </div>
          <div className="relative mt-2" style={{minHeight:`${Math.max(1,numRows)*ROW_H+8}px`}}>
            {blocks.map(block => {
              const row = rowMap[block.id]??0;
              const isMoving = movingBlock?.id===block.id;
              return (
                <div key={block.id}
                  style={{ left:`${block.startWeek*CELL+2}px`, width:`${(block.endWeek-block.startWeek+1)*CELL-4}px`, top:`${row*ROW_H+2}px`,
                    backgroundColor: block.color+(isMoving?'15':'22'), borderColor: block.color+(isMoving?'55':'99'), opacity: isMoving?0.3:1, cursor: movingBlock?'grabbing':'grab' }}
                  className="absolute h-9 rounded-lg border flex items-center px-2 group overflow-hidden transition-opacity"
                  onMouseDown={ev => { const rect=ev.currentTarget.getBoundingClientRect(); const offset=Math.floor((ev.clientX-rect.left)/CELL); handleBlockDown(ev, block, block.startWeek+offset); }}
                  onClick={ev => { if (!movingBlock) { ev.stopPropagation(); openModal(block.startWeek, block.endWeek, block); } }}>
                  <div className="w-2 h-2 rounded-full shrink-0 mr-2" style={{backgroundColor:block.color}} />
                  <span className="text-[10px] font-bold truncate" style={{color:block.color}}>{block.label}</span>
                  <span className="text-[8px] ml-1.5 shrink-0 font-mono font-bold" style={{color:'#E8B800'}}>S{block.startWeek+1}→S{block.endWeek+1}</span>
                  <button onClick={ev => { ev.stopPropagation(); setBlocks(bs => bs.filter(b => b.id!==block.id)); }}
                    className="absolute right-1.5 opacity-0 group-hover:opacity-100 text-white/50 hover:text-red-400 text-xs transition-opacity">✕</button>
                </div>
              );
            })}
            {movingBlock && dragStart!==null && dragCurrent!==null && (
              <div style={{ left:`${dragStart*CELL+2}px`, width:`${(dragCurrent-dragStart+1)*CELL-4}px`, top:`${(rowMap[movingBlock.id]??0)*ROW_H+2}px`,
                backgroundColor:movingBlock.color+'30', borderColor:movingBlock.color }}
                className="absolute h-9 rounded-lg border-2 border-dashed flex items-center px-2 pointer-events-none">
                <div className="w-2 h-2 rounded-full shrink-0 mr-2" style={{backgroundColor:movingBlock.color}} />
                <span className="text-[10px] font-bold" style={{color:movingBlock.color}}>{movingBlock.label}</span>
                <span className="text-[8px] ml-1.5 font-mono font-bold" style={{color:'#E8B800'}}>S{dragStart+1}→S{dragCurrent+1}</span>
              </div>
            )}
            {blocks.length===0 && <p className="text-nexus-gray/60 text-[10px] italic text-center pt-6">Glissez sur les semaines pour créer votre premier bloc de planification</p>}
          </div>
        </div>
      </div>

      {blocks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {blocks.map(b => (
            <button key={b.id} onClick={() => openModal(b.startWeek, b.endWeek, b)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold hover:scale-105 transition-transform"
              style={{borderColor:b.color+'50', backgroundColor:b.color+'15', color:b.color}}>
              <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:b.color}} />{b.label}
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-6" onClick={() => setShowModal(false)}>
          <div className="bg-[#1a2235] rounded-2xl p-6 w-full max-w-sm border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h4 className="font-display text-nexus-gold uppercase text-lg">{editing?'Modifier':'Créer'} un bloc</h4>
              <button onClick={() => setShowModal(false)} className="text-nexus-gray hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Nom / Thème</label>
                <input placeholder="ex: Bloc Force, Pré-compétition..." autoFocus
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white placeholder-white/25 outline-none focus:border-nexus-gold"
                  value={formLabel} onChange={e => setFormLabel(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{label:'Semaine début', val:formStart, set:setFormStart}, {label:'Semaine fin', val:formEnd, set:(v:number)=>setFormEnd(Math.max(formStart,v))}].map(({label,val,set}) => (
                  <div key={label}>
                    <label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">{label}</label>
                    <input type="number" min={1} max={52} value={val} onChange={e => set(Math.min(52,Math.max(1,parseInt(e.target.value)||1)))}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-nexus-gold font-mono font-bold outline-none focus:border-nexus-gold text-sm" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[9px] text-nexus-gray uppercase font-bold mb-2 block">Couleur</label>
                <div className="flex flex-wrap gap-2">
                  {BLOCK_COLORS.map(c => <button key={c} onClick={() => setFormColor(c)} style={{backgroundColor:c}} className={`w-8 h-8 rounded-full border-2 transition-transform ${formColor===c?'border-white scale-125':'border-transparent hover:scale-110'}`} />)}
                </div>
              </div>
            </div>
            {editing && <button onClick={() => { setBlocks(bs => bs.filter(b => b.id!==editing.id)); setShowModal(false); }} className="w-full mt-4 text-red-400 text-xs py-2 border border-red-400/20 rounded-lg hover:bg-red-400/10">Supprimer</button>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white/5 text-nexus-gray py-3 rounded-xl text-sm">Annuler</button>
              <button onClick={saveBlock} disabled={!formLabel} className="flex-1 bg-nexus-gold text-black py-3 rounded-xl font-bold text-sm disabled:opacity-40">{editing?'Modifier':'Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================== ASSOCIATE MODAL =====================
const AssociateModal: React.FC<{ weeklySchedule: DaySchedule[]; onSelect: (id: string) => void; onClose: () => void; currentEventId?: string }> = ({ weeklySchedule, onSelect, onClose, currentEventId }) => {
  const allEvents = weeklySchedule.flatMap(d => d.events.map(ev => ({ ...ev, dayName: d.dayName })));
  return (
    <div className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-[#1a2235] rounded-2xl p-6 w-full max-w-sm border border-white/10 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div><h4 className="font-display text-nexus-gold uppercase">Associer au Semainier</h4><p className="text-[9px] text-nexus-gray mt-0.5">Lier à un créneau de la semaine</p></div>
          <button onClick={onClose} className="text-nexus-gray hover:text-white">✕</button>
        </div>
        {allEvents.length === 0 ? <p className="text-nexus-gray italic text-center py-6 text-sm">Aucun créneau cette semaine.</p> : (
          <div className="space-y-2">
            {allEvents.map(ev => (
              <button key={ev.id} onClick={() => onSelect(ev.id)}
                className={`w-full text-left border rounded-xl p-3 transition-all ${currentEventId===ev.id?'bg-nexus-gold/15 border-nexus-gold/50':'bg-white/5 hover:bg-nexus-gold/10 border-white/5'}`}>
                <span className="text-[9px] text-nexus-gold uppercase font-bold block">{ev.dayName} • {ev.startTime}</span>
                <span className="text-white text-sm font-bold">{(ev as any).title||ev.type}</span>
                <div className="flex gap-2 mt-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${ev.isVisibleToAthletes?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>{ev.isVisibleToAthletes?'👁 Visible':'🔒 Caché'}</span>
                  {currentEventId===ev.id && <span className="text-[9px] text-nexus-gold">✓ Associé</span>}
                </div>
              </button>
            ))}
            <button onClick={() => onSelect('')} className="w-full text-center text-nexus-gray text-xs py-2 border border-white/5 rounded-lg hover:bg-white/5">✕ Désassocier</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ===================== PHYSIQUE TAB =====================
const PhysiqueTab: React.FC<{ weeklySchedule: DaySchedule[] }> = ({ weeklySchedule }) => {
  const [sessions, setSessions] = useState<PhysiqueSession[]>([]);
  const [view, setView] = useState<'builder' | 'history'>('builder');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [associatingId, setAssociatingId] = useState<string | null>(null);
  const [sName, setSName] = useState(''); const [sRpe, setSRpe] = useState(7); const [sDuration, setSDuration] = useState(60); const [sVisible, setSVisible] = useState(true); const [sNotes, setSNotes] = useState(''); const [exercises, setExercises] = useState<PhysiqueExercise[]>([]);
  const [catFilter, setCatFilter] = useState('Musculation'); const [subcatFilter, setSubcatFilter] = useState('Tous'); const [search, setSearch] = useState(''); const [customBank, setCustomBank] = useState<string[]>([]); const [showCustomInput, setShowCustomInput] = useState(false); const [customInput, setCustomInput] = useState('');
  const [showExForm, setShowExForm] = useState(false); const [editingExId, setEditingExId] = useState<string|null>(null);
  const [exName, setExName] = useState(''); const [exCat, setExCat] = useState(''); const [exSubcat, setExSubcat] = useState(''); const [exSets, setExSets] = useState(3); const [exMetric, setExMetric] = useState<ExMetric>('reps'); const [exReps, setExReps] = useState('10'); const [exLoad, setExLoad] = useState(''); const [exTempo, setExTempo] = useState('3010'); const [exRest, setExRest] = useState('90s'); const [exRpe, setExRpe] = useState(7); const [exNotes, setExNotes] = useState('');

  const bankCategories = [...Object.keys(EXERCISE_DB), 'Custom'];
  const bankList = catFilter === 'Custom'
    ? customBank.map(n => ({ name: n, defaultMetric: 'reps' as ExMetric, subcat: undefined }))
    : (EXERCISE_DB[catFilter] || []).filter(item => (!search || item.name.toLowerCase().includes(search.toLowerCase())) && (catFilter !== 'Musculation' || subcatFilter === 'Tous' || item.subcat === subcatFilter));

  const openExForm = (name: string, cat: string, defaultMetric: ExMetric = 'reps', existing?: PhysiqueExercise) => {
    setExName(existing?.name??name); setExCat(existing?.category??cat); setExSubcat(existing?.subcat??''); setExSets(existing?.sets??3); setExMetric(existing?.metric??defaultMetric); setExReps(existing?.reps??'10'); setExLoad(existing?.load??''); setExTempo(existing?.tempo??'3010'); setExRest(existing?.rest??'90s'); setExRpe(existing?.rpeEx??7); setExNotes(existing?.notes??''); setEditingExId(existing?.id??null); setShowExForm(true);
  };
  const confirmEx = () => {
    const ex: PhysiqueExercise = { id: editingExId||uid(), name:exName, category:exCat, subcat:exSubcat||undefined, sets:exSets, metric:exMetric, reps:exReps, load:exLoad, tempo:exTempo, rest:exRest, rpeEx:exRpe, notes:exNotes||undefined };
    if (editingExId) setExercises(xs => xs.map(x => x.id===editingExId?ex:x)); else setExercises(xs => [...xs, ex]);
    setShowExForm(false); setEditingExId(null);
  };
  const resetBuilder = () => { setSName(''); setSRpe(7); setSDuration(60); setSVisible(true); setSNotes(''); setExercises([]); setEditingId(null); };
  const saveSession = () => {
    if (!sName || exercises.length===0) return;
    const sess: PhysiqueSession = { id:editingId||uid(), name:sName, exercises, sessionRpe:sRpe, duration:sDuration, isVisible:sVisible, date:today(), notes:sNotes||undefined };
    if (editingId) setSessions(ss => ss.map(s => s.id===editingId?sess:s)); else setSessions(ss => [...ss, sess]);
    resetBuilder(); setView('history');
  };
  const loadForEdit = (s: PhysiqueSession) => { setSName(s.name); setSRpe(s.sessionRpe); setSDuration(s.duration); setSVisible(s.isVisible); setSNotes(s.notes||''); setExercises(s.exercises); setEditingId(s.id); setView('builder'); };
  const duplicate = (s: PhysiqueSession) => setSessions(ss => [...ss, {...s, id:uid(), name:`${s.name} (copie)`, date:today(), associatedEventId:undefined}]);
  const deleteSession = (id: string) => { setSessions(ss => ss.filter(s => s.id!==id)); if (expandedId===id) setExpandedId(null); };
  const associate = (sid: string, eid: string) => { setSessions(ss => ss.map(s => s.id===sid?{...s,associatedEventId:eid||undefined}:s)); setAssociatingId(null); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display text-nexus-gold text-lg uppercase tracking-wider">Préparation Physique</h3>
        <button onClick={() => { if (view==='history') setView('builder'); else { resetBuilder(); setView('history'); } }}
          className={`text-[10px] px-3 py-2 rounded-lg border font-bold transition-all ${view==='history'?'bg-nexus-gold text-black border-nexus-gold':'border-white/10 text-nexus-gray hover:bg-white/5'}`}>
          {view==='history'?'+ Créer séance':`Historique (${sessions.length})`}
        </button>
      </div>

      {view === 'history' ? (
        <div className="space-y-3">
          {sessions.length===0 && <p className="text-nexus-gray italic text-center py-10 text-sm">Aucune séance enregistrée.</p>}
          {sessions.map(s => (
            <div key={s.id} className="bg-[#0f172a] rounded-xl border border-white/5 overflow-hidden">
              <div className="p-4 flex justify-between items-start gap-2">
                <div className="flex-1 cursor-pointer min-w-0" onClick={() => setExpandedId(expandedId===s.id?null:s.id)}>
                  <span className="text-white font-bold text-sm block truncate">{s.name}</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge>{s.date}</Badge><Badge color="bg-nexus-gold/20 text-nexus-gold">{s.exercises.length} exos</Badge>
                    <Badge>{s.duration} min</Badge><Badge color="bg-nexus-red/20 text-nexus-red">RPE {s.sessionRpe}</Badge>
                    <Badge color={s.isVisible?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}>{s.isVisible?'👁 Visible':'🔒 Caché'}</Badge>
                    {s.associatedEventId && <Badge color="bg-blue-500/20 text-blue-400">📌 Associée</Badge>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => loadForEdit(s)} className="p-1.5 text-nexus-gold hover:bg-nexus-gold/20 rounded-lg text-sm">✏️</button>
                  <button onClick={() => duplicate(s)} className="p-1.5 text-blue-400 hover:bg-blue-400/20 rounded-lg text-sm">⧉</button>
                  <button onClick={() => setAssociatingId(s.id)} className="p-1.5 text-purple-400 hover:bg-purple-400/20 rounded-lg text-sm">📌</button>
                  <button onClick={() => deleteSession(s.id)} className="p-1.5 text-red-400 hover:bg-red-400/20 rounded-lg text-sm">🗑</button>
                </div>
              </div>
              {expandedId===s.id && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
                  {s.notes && <p className="text-[10px] text-nexus-gray italic bg-white/3 rounded-lg px-3 py-2">{s.notes}</p>}
                  {s.exercises.map((ex,i) => (
                    <div key={i} className="bg-white/5 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <div><span className="text-white font-bold text-sm">{ex.name}</span><span className="text-[9px] text-nexus-gray ml-2 uppercase">{ex.subcat||ex.category}</span></div>
                        <span className="text-nexus-gold font-mono font-bold">{ex.sets}×{ex.reps}{ex.metric==='meters'?'m':ex.metric==='navettes'?' A/R':''}{ex.load?` @ ${ex.load}`:''}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {ex.metric==='reps'&&ex.tempo&&<Badge>Tempo {ex.tempo}</Badge>}
                        <Badge>Repos {ex.rest}</Badge><Badge color="bg-nexus-red/20 text-nexus-red">RPE {ex.rpeEx}</Badge>
                        {ex.notes&&<Badge color="bg-white/5 text-nexus-gray/70">{ex.notes}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#0f172a] rounded-xl p-4 border border-white/5 space-y-3">
            <input placeholder="Nom de la séance..." value={sName} onChange={e => setSName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-white/25 outline-none focus:border-nexus-gold font-bold" />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Durée (min)</label>
                <input type="number" value={sDuration} onChange={e => setSDuration(parseInt(e.target.value)||60)} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-nexus-gold text-sm" /></div>
              <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">RPE séance ({sRpe})</label>
                <input type="range" min={1} max={10} value={sRpe} onChange={e => setSRpe(parseInt(e.target.value))} className="w-full mt-3 accent-nexus-gold" /></div>
            </div>
            <textarea rows={2} placeholder="Notes générales..." value={sNotes} onChange={e => setSNotes(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-white/25 outline-none focus:border-nexus-gold text-sm resize-none" />
            <div className="flex items-center justify-between"><span className="text-sm text-white font-bold">Visible par les joueurs</span><Toggle value={sVisible} onChange={() => setSVisible(v => !v)} /></div>
          </div>

          <div className="bg-[#0f172a] rounded-xl border border-white/5 overflow-hidden">
            <div className="p-3 space-y-2 border-b border-white/5">
              <p className="text-[9px] text-nexus-gray uppercase font-bold tracking-wider">Banque d'exercices</p>
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {bankCategories.map(cat => (
                  <button key={cat} onClick={() => { setCatFilter(cat); setSearch(''); setSubcatFilter('Tous'); }}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase whitespace-nowrap transition-all ${catFilter===cat?'bg-nexus-gold text-black':'bg-white/5 text-nexus-gray hover:bg-white/10'}`}>{cat}</button>
                ))}
              </div>
              {catFilter === 'Musculation' && (
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                  {MUSCU_SUBCATS.map(sub => (
                    <button key={sub} onClick={() => setSubcatFilter(sub)}
                      className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase whitespace-nowrap transition-all border ${subcatFilter===sub?'bg-nexus-gold/25 text-nexus-gold border-nexus-gold/40':'bg-white/3 text-nexus-gray/60 border-white/5 hover:bg-white/8'}`}>{sub}</button>
                  ))}
                </div>
              )}
              <input placeholder="Chercher..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/20 outline-none focus:border-nexus-gold text-xs" />
            </div>
            <div className="max-h-44 overflow-y-auto p-2 space-y-0.5">
              {bankList.map((item,i) => (
                <button key={i} onClick={() => openExForm(item.name, catFilter, item.defaultMetric)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-white/80 hover:bg-nexus-gold/15 hover:text-nexus-gold flex justify-between items-center group">
                  <span>{item.name}</span>
                  <div className="flex gap-2">
                    {(item as any).subcat && <span className="text-[8px] text-nexus-gray/40 group-hover:text-nexus-gold/50 uppercase">{(item as any).subcat}</span>}
                    <span className="text-[9px] text-nexus-gray/40 uppercase">{item.defaultMetric}</span>
                  </div>
                </button>
              ))}
              {bankList.length===0 && <p className="text-nexus-gray text-center py-4 text-[10px] italic">Aucun exercice</p>}
            </div>
            <div className="p-2 border-t border-white/5">
              {showCustomInput ? (
                <div className="flex gap-2">
                  <input placeholder="Nom de l'exercice..." value={customInput} onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => { if (e.key==='Enter'&&customInput) { setCustomBank(b => [...b, customInput]); setCustomInput(''); setShowCustomInput(false); setCatFilter('Custom'); } }}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/20 outline-none focus:border-nexus-gold text-xs" />
                  <button onClick={() => { if (customInput) { setCustomBank(b => [...b, customInput]); setCustomInput(''); setShowCustomInput(false); setCatFilter('Custom'); } }} className="bg-nexus-gold text-black px-3 rounded-lg text-xs font-bold">OK</button>
                  <button onClick={() => setShowCustomInput(false)} className="text-nexus-gray px-1 text-xs">✕</button>
                </div>
              ) : (
                <button onClick={() => setShowCustomInput(true)} className="w-full text-center text-[10px] text-nexus-gold hover:text-white py-1.5">+ Ajouter un exercice personnalisé</button>
              )}
            </div>
          </div>

          {exercises.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] text-nexus-gray uppercase font-bold tracking-widest">Séance — {exercises.length} exercice{exercises.length>1?'s':''}</p>
              {exercises.map(ex => (
                <div key={ex.id} className="bg-white/5 border border-white/5 p-3 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div><span className="text-white font-bold text-sm">{ex.name}</span><span className="text-[9px] text-nexus-gray ml-2 uppercase">{ex.subcat||ex.category}</span></div>
                    <div className="flex gap-1">
                      <button onClick={() => openExForm(ex.name, ex.category, ex.metric, ex)} className="text-nexus-gray hover:text-nexus-gold text-xs p-1">✏️</button>
                      <button onClick={() => setExercises(xs => xs.filter(x => x.id!==ex.id))} className="text-nexus-gray hover:text-red-400 text-xs p-1">✕</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <Badge color="bg-nexus-gold/20 text-nexus-gold">{ex.sets}×{ex.reps}{ex.metric==='meters'?'m':ex.metric==='navettes'?' A/R':''}</Badge>
                    {ex.load&&<Badge color="bg-white/10 text-white">⚖ {ex.load}</Badge>}
                    {ex.metric==='reps'&&ex.tempo&&<Badge>Tempo {ex.tempo}</Badge>}
                    <Badge>Repos {ex.rest}</Badge><Badge color="bg-nexus-red/20 text-nexus-red">RPE {ex.rpeEx}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={saveSession} disabled={!sName||exercises.length===0}
            className="w-full bg-nexus-gold text-black font-display font-bold py-4 rounded-xl uppercase tracking-wider text-sm disabled:opacity-30 hover:bg-white transition-colors">
            {editingId?'✓ Modifier la séance':'✓ Enregistrer la séance'}
          </button>
        </div>
      )}

      {showExForm && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-end sm:items-center justify-center" onClick={() => setShowExForm(false)}>
          <div className="bg-[#1a2235] rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-lg border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <div><h4 className="font-display text-white text-lg uppercase">{exName}</h4><span className="text-[9px] text-nexus-gold uppercase">{exSubcat||exCat}</span></div>
              <button onClick={() => setShowExForm(false)} className="text-nexus-gray hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Séries</label>
                <input type="number" value={String(exSets)} onChange={e => setExSets(parseInt(e.target.value)||1)} className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-nexus-gold text-sm" /></div>
              <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Métrique</label>
                <select value={exMetric} onChange={e => setExMetric(e.target.value as ExMetric)} className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-nexus-gold text-sm">
                  <option value="reps">Répétitions</option><option value="meters">Mètres</option><option value="navettes">Aller-retours</option><option value="temps">Temps</option>
                </select></div>
              <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">{exMetric==='reps'?'Reps':exMetric==='meters'?'Distance (m)':exMetric==='navettes'?'Aller-retours':'Durée'}</label>
                <input type="text" value={exReps} onChange={e => setExReps(e.target.value)} placeholder={exMetric==='reps'?'10':exMetric==='meters'?'50m':'30s'} className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-nexus-gold text-sm" /></div>
              <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Charge (kg / %RM)</label>
                <input type="text" value={exLoad} onChange={e => setExLoad(e.target.value)} placeholder="80kg / 70%RM" className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-nexus-gold text-sm" /></div>
              {exMetric==='reps' && <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Tempo</label>
                <input type="text" value={exTempo} onChange={e => setExTempo(e.target.value)} placeholder="3010" className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-nexus-gold text-sm" /></div>}
              <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Repos</label>
                <input type="text" value={exRest} onChange={e => setExRest(e.target.value)} placeholder="90s" className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-nexus-gold text-sm" /></div>
              <div className="col-span-2"><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">RPE exercice ({exRpe})</label>
                <div className="flex items-center gap-3"><input type="range" min={1} max={10} value={exRpe} onChange={e => setExRpe(parseInt(e.target.value))} className="flex-1 accent-nexus-gold" /><span className="text-nexus-gold font-bold w-6 text-center">{exRpe}</span></div></div>
              <div className="col-span-2"><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Notes</label>
                <input type="text" value={exNotes} onChange={e => setExNotes(e.target.value)} placeholder="Consignes..." className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-nexus-gold text-sm" /></div>
            </div>
            <button onClick={confirmEx} className="w-full mt-5 bg-nexus-gold text-black font-bold py-3.5 rounded-xl uppercase text-sm hover:bg-white">{editingExId?"Modifier l'exercice":'Ajouter à la séance'}</button>
          </div>
        </div>
      )}
      {associatingId && <AssociateModal weeklySchedule={weeklySchedule} onSelect={eid => associate(associatingId, eid)} onClose={() => setAssociatingId(null)} currentEventId={sessions.find(s => s.id===associatingId)?.associatedEventId} />}
    </div>
  );
};

// ===================== WATER TAB =====================
const WaterTab: React.FC<{ weeklySchedule: DaySchedule[] }> = ({ weeklySchedule }) => {
  const [sessions, setSessions] = useState<WaterSession[]>([]);
  const [view, setView] = useState<'builder' | 'history'>('builder');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [associatingId, setAssociatingId] = useState<string | null>(null);
  const [sName, setSName] = useState(''); const [sTheme, setSTheme] = useState(Object.keys(WATER_DB)[0]); const [sRpe, setSRpe] = useState(7); const [sDuration, setSDuration] = useState(90); const [sVisible, setSVisible] = useState(true); const [sNotes, setSNotes] = useState(''); const [drills, setDrills] = useState<WaterDrill[]>([]);
  const [catFilter, setCatFilter] = useState(Object.keys(WATER_DB)[0]); const [customBank, setCustomBank] = useState<Record<string,string[]>>({}); const [showCustomInput, setShowCustomInput] = useState(false); const [customInput, setCustomInput] = useState('');
  const [showDrillForm, setShowDrillForm] = useState(false); const [editingDrillId, setEditingDrillId] = useState<string|null>(null);
  const [dName, setDName] = useState(''); const [dCat, setDCat] = useState(''); const [dSets, setDSets] = useState(1); const [dMetric, setDMetric] = useState<'m'|'AR'|'time'|'reps'>('reps'); const [dValue, setDValue] = useState(''); const [dComment, setDComment] = useState('');
  const waterCategories = Object.keys(WATER_DB);
  const drillList = [...(WATER_DB[catFilter]||[]), ...(customBank[catFilter]||[])];
  const openDrillForm = (name: string, cat: string, existing?: WaterDrill) => { setDName(existing?.name??name); setDCat(existing?.category??cat); setDSets(existing?.sets??1); setDMetric(existing?.metric??'reps'); setDValue(existing?.value??''); setDComment(existing?.comment??''); setEditingDrillId(existing?.id??null); setShowDrillForm(true); };
  const confirmDrill = () => {
    const d: WaterDrill = { id:editingDrillId||uid(), name:dName, category:dCat, sets:dSets, metric:dMetric, value:dValue, comment:dComment };
    if (editingDrillId) setDrills(ds => ds.map(x => x.id===editingDrillId?d:x)); else setDrills(ds => [...ds, d]);
    setShowDrillForm(false); setEditingDrillId(null);
  };
  const resetBuilder = () => { setSName(''); setSTheme(Object.keys(WATER_DB)[0]); setSRpe(7); setSDuration(90); setSVisible(true); setSNotes(''); setDrills([]); setEditingId(null); };
  const saveSession = () => {
    if (!sName||drills.length===0) return;
    const sess: WaterSession = { id:editingId||uid(), name:sName, theme:sTheme, drills, sessionRpe:sRpe, duration:sDuration, isVisible:sVisible, date:today(), notes:sNotes||undefined };
    if (editingId) setSessions(ss => ss.map(s => s.id===editingId?sess:s)); else setSessions(ss => [...ss, sess]);
    resetBuilder(); setView('history');
  };
  const loadForEdit = (s: WaterSession) => { setSName(s.name); setSTheme(s.theme); setSRpe(s.sessionRpe); setSDuration(s.duration); setSVisible(s.isVisible); setSNotes(s.notes||''); setDrills(s.drills); setEditingId(s.id); setView('builder'); };
  const duplicate = (s: WaterSession) => setSessions(ss => [...ss, {...s, id:uid(), name:`${s.name} (copie)`, date:today(), associatedEventId:undefined}]);
  const deleteSession = (id: string) => { setSessions(ss => ss.filter(s => s.id!==id)); if (expandedId===id) setExpandedId(null); };
  const associate = (sid: string, eid: string) => { setSessions(ss => ss.map(s => s.id===sid?{...s,associatedEventId:eid||undefined}:s)); setAssociatingId(null); };
  const metricLabel: Record<string,string> = { m:'m', AR:'aller-retours', time:'min', reps:'reps' };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display text-nexus-gold text-lg uppercase tracking-wider">Séances Water-Polo</h3>
        <button onClick={() => { if (view==='history') setView('builder'); else { resetBuilder(); setView('history'); } }}
          className={`text-[10px] px-3 py-2 rounded-lg border font-bold transition-all ${view==='history'?'bg-blue-600 text-white border-blue-600':'border-white/10 text-nexus-gray hover:bg-white/5'}`}>
          {view==='history'?'+ Créer séance':`Historique (${sessions.length})`}
        </button>
      </div>
      {view==='history' ? (
        <div className="space-y-3">
          {sessions.length===0 && <p className="text-nexus-gray italic text-center py-10 text-sm">Aucune séance enregistrée.</p>}
          {sessions.map(s => (
            <div key={s.id} className="bg-[#0f172a] rounded-xl border border-white/5 overflow-hidden">
              <div className="p-4 flex justify-between items-start gap-2">
                <div className="flex-1 cursor-pointer min-w-0" onClick={() => setExpandedId(expandedId===s.id?null:s.id)}>
                  <span className="text-white font-bold text-sm block truncate">{s.name}</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge>{s.date}</Badge><Badge color="bg-blue-500/20 text-blue-400">{s.theme}</Badge>
                    <Badge color="bg-nexus-gold/20 text-nexus-gold">{s.drills.length} exercices</Badge><Badge>{s.duration} min</Badge>
                    <Badge color="bg-nexus-red/20 text-nexus-red">RPE {s.sessionRpe}</Badge>
                    <Badge color={s.isVisible?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}>{s.isVisible?'👁 Visible':'🔒 Caché'}</Badge>
                    {s.associatedEventId&&<Badge color="bg-purple-500/20 text-purple-400">📌 Associée</Badge>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => loadForEdit(s)} className="p-1.5 text-nexus-gold hover:bg-nexus-gold/20 rounded-lg text-sm">✏️</button>
                  <button onClick={() => duplicate(s)} className="p-1.5 text-blue-400 hover:bg-blue-400/20 rounded-lg text-sm">⧉</button>
                  <button onClick={() => setAssociatingId(s.id)} className="p-1.5 text-purple-400 hover:bg-purple-400/20 rounded-lg text-sm">📌</button>
                  <button onClick={() => deleteSession(s.id)} className="p-1.5 text-red-400 hover:bg-red-400/20 rounded-lg text-sm">🗑</button>
                </div>
              </div>
              {expandedId===s.id && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
                  {s.notes&&<p className="text-[10px] text-nexus-gray italic bg-white/3 rounded-lg px-3 py-2">{s.notes}</p>}
                  {s.drills.map((d,i) => (
                    <div key={i} className="bg-white/5 p-3 rounded-lg flex justify-between">
                      <div><span className="text-white font-bold text-sm block">{d.name}</span><Badge color="bg-blue-500/20 text-blue-400">{d.category}</Badge>{d.comment&&<span className="text-[9px] text-nexus-gray block mt-1 italic">{d.comment}</span>}</div>
                      <div className="text-right shrink-0 ml-2"><span className="text-nexus-gold font-mono font-bold">{d.sets>1?`${d.sets}×`:''}{d.value}</span><span className="text-nexus-gray text-[9px] block">{metricLabel[d.metric]}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#0f172a] rounded-xl p-4 border border-white/5 space-y-3">
            <input placeholder="Nom de la séance..." value={sName} onChange={e => setSName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-white/25 outline-none focus:border-blue-500 font-bold" />
            <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Thème principal</label>
              <select value={sTheme} onChange={e => { setSTheme(e.target.value); setCatFilter(e.target.value); }} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 text-sm">
                {waterCategories.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Durée (min)</label>
                <input type="number" value={sDuration} onChange={e => setSDuration(parseInt(e.target.value)||90)} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500 text-sm" /></div>
              <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">RPE ({sRpe})</label>
                <input type="range" min={1} max={10} value={sRpe} onChange={e => setSRpe(parseInt(e.target.value))} className="w-full mt-3 accent-blue-500" /></div>
            </div>
            <textarea rows={2} value={sNotes} onChange={e => setSNotes(e.target.value)} placeholder="Notes générales..." className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-white/25 outline-none focus:border-blue-500 text-sm resize-none" />
            <div className="flex items-center justify-between"><span className="text-sm text-white font-bold">Visible par les joueurs</span><Toggle value={sVisible} onChange={() => setSVisible(v => !v)} /></div>
          </div>
          <div className="bg-[#0f172a] rounded-xl border border-white/5 overflow-hidden">
            <div className="p-3 space-y-2 border-b border-white/5">
              <p className="text-[9px] text-nexus-gray uppercase font-bold tracking-wider">Banque d'exercices Water-Polo</p>
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {waterCategories.map(cat => <button key={cat} onClick={() => setCatFilter(cat)} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase whitespace-nowrap transition-all ${catFilter===cat?'bg-blue-600 text-white':'bg-white/5 text-nexus-gray hover:bg-white/10'}`}>{cat}</button>)}
              </div>
            </div>
            <div className="max-h-44 overflow-y-auto p-2 space-y-0.5">
              {drillList.map((name,i) => <button key={i} onClick={() => openDrillForm(name, catFilter)} className="w-full text-left px-3 py-2 rounded-lg text-xs text-white/80 hover:bg-blue-600/20 hover:text-blue-300">{name}</button>)}
            </div>
            <div className="p-2 border-t border-white/5">
              {showCustomInput ? (
                <div className="flex gap-2">
                  <input placeholder="Nom de l'exercice..." value={customInput} onChange={e => setCustomInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter'&&customInput) { setCustomBank(b => ({...b,[catFilter]:[...(b[catFilter]||[]),customInput]})); setCustomInput(''); setShowCustomInput(false); } }} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-blue-500" />
                  <button onClick={() => { if (customInput) { setCustomBank(b => ({...b,[catFilter]:[...(b[catFilter]||[]),customInput]})); setCustomInput(''); setShowCustomInput(false); } }} className="bg-blue-600 text-white px-3 rounded-lg text-xs font-bold">OK</button>
                  <button onClick={() => setShowCustomInput(false)} className="text-nexus-gray px-1 text-xs">✕</button>
                </div>
              ) : <button onClick={() => setShowCustomInput(true)} className="w-full text-center text-[10px] text-blue-400 hover:text-white py-1.5">+ Ajouter un exercice personnalisé</button>}
            </div>
          </div>
          {drills.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] text-nexus-gray uppercase font-bold tracking-widest">Séance — {drills.length} exercice{drills.length>1?'s':''}</p>
              {drills.map(d => (
                <div key={d.id} className="bg-white/5 border border-white/5 p-3 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div><span className="text-white font-bold text-sm">{d.name}</span><Badge color="bg-blue-500/20 text-blue-400 ml-2">{d.category}</Badge></div>
                    <div className="flex items-center gap-2">
                      <span className="text-nexus-gold font-mono font-bold">{d.sets>1?`${d.sets}×`:''}{d.value} <span className="text-[9px] text-nexus-gray">{metricLabel[d.metric]}</span></span>
                      <button onClick={() => openDrillForm(d.name, d.category, d)} className="text-nexus-gray hover:text-nexus-gold text-xs p-1">✏️</button>
                      <button onClick={() => setDrills(ds => ds.filter(x => x.id!==d.id))} className="text-nexus-gray hover:text-red-400 text-xs p-1">✕</button>
                    </div>
                  </div>
                  {d.comment&&<p className="text-[9px] text-nexus-gray mt-1 italic">{d.comment}</p>}
                </div>
              ))}
            </div>
          )}
          <button onClick={saveSession} disabled={!sName||drills.length===0} className="w-full bg-blue-600 text-white font-display font-bold py-4 rounded-xl uppercase tracking-wider text-sm disabled:opacity-30 hover:bg-blue-500">
            {editingId?'✓ Modifier la séance':'✓ Enregistrer la séance'}
          </button>
        </div>
      )}
      {showDrillForm && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-end sm:items-center justify-center" onClick={() => setShowDrillForm(false)}>
          <div className="bg-[#1a2235] rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-lg border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5"><div><h4 className="font-display text-white text-lg uppercase">{dName}</h4><span className="text-[9px] text-blue-400 uppercase">{dCat}</span></div><button onClick={() => setShowDrillForm(false)} className="text-nexus-gray hover:text-white">✕</button></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Séries</label><input type="number" min={1} max={20} value={dSets} onChange={e => setDSets(parseInt(e.target.value)||1)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 text-sm" /></div>
                <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-2 block">Métrique</label>
                  <div className="grid grid-cols-2 gap-1">
                    {(['m','AR','time','reps'] as const).map(m => <button key={m} onClick={() => setDMetric(m)} className={`py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${dMetric===m?'bg-blue-600 text-white border-blue-600':'bg-white/5 text-nexus-gray border-white/10 hover:bg-white/10'}`}>{m==='time'?'Temps':m==='m'?'Mètres':m==='AR'?'A/R':'Reps'}</button>)}
                  </div></div>
              </div>
              <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Valeur</label><input type="text" value={dValue} onChange={e => setDValue(e.target.value)} placeholder={dMetric==='m'?'400':dMetric==='AR'?'6':dMetric==='time'?'5min':'10'} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 text-sm" /></div>
              <div><label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Commentaire</label><textarea rows={2} value={dComment} onChange={e => setDComment(e.target.value)} placeholder="ex: Bras libre, 30s récup..." className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 text-sm resize-none" /></div>
            </div>
            <button onClick={confirmDrill} disabled={!dValue} className="w-full mt-5 bg-blue-600 text-white font-bold py-3.5 rounded-xl uppercase text-sm hover:bg-blue-500 disabled:opacity-40">{editingDrillId?'Modifier':'Ajouter à la séance'}</button>
          </div>
        </div>
      )}
      {associatingId && <AssociateModal weeklySchedule={weeklySchedule} onSelect={eid => associate(associatingId, eid)} onClose={() => setAssociatingId(null)} currentEventId={sessions.find(s => s.id===associatingId)?.associatedEventId} />}
    </div>
  );
};

// ===================== MAIN EXPORT =====================
export const PlanningView: React.FC<{ weeklySchedule: DaySchedule[] }> = ({ weeklySchedule }) => {
  const [tab, setTab] = useState<'MACRO'|'PHYSIQUE'|'WATER'>('MACRO');
  const tabs = [{ id:'MACRO' as const, label:'🗓 Macro' }, { id:'PHYSIQUE' as const, label:'💪 Physique' }, { id:'WATER' as const, label:'🏊 Water' }];
  return (
    <div className="px-4 pb-32 animate-in fade-in space-y-5">
      <div className="bg-black/60 p-1 rounded-2xl border border-white/5 flex gap-1">
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)}
          className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all ${tab===t.id?(t.id==='WATER'?'bg-blue-600 text-white':'bg-nexus-gold text-black'):'text-nexus-gray hover:text-white'}`}>
          {t.label}</button>)}
      </div>
      {tab==='MACRO' && <MacroPlanningTab />}
      {tab==='PHYSIQUE' && <PhysiqueTab weeklySchedule={weeklySchedule} />}
      {tab==='WATER' && <WaterTab weeklySchedule={weeklySchedule} />}
    </div>
  );
};