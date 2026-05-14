import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Exercise, Athlete } from '../../types';

interface CareViewProps { athlete: Athlete; }

// ── ROUTINES DATA (science-based) ──────────────────────────────────────────────
const PRE_MATCH_ROUTINE: Exercise[] = [
  { id:'pm1', name:'Réveil Fessier (Clamshells)', sets:2, reps:'15/côté', tempo:'Dynamique', rest:'0s', targetLoad:'Élastique', instructions:'Activation rapide des fessiers.' },
  { id:'pm2', name:'World\'s Greatest Stretch', sets:2, reps:'6/côté', tempo:'Fluide', rest:'0s', targetLoad:'PDC', instructions:'Grande fente avec rotation thoracique.' },
  { id:'pm3', name:'Sauts Pogo', sets:2, reps:'20', tempo:'Explosif', rest:'30s', targetLoad:'PDC', instructions:'Rebonds chevilles, jambes tendues.' },
  { id:'pm4', name:'Shadow Boxing / Mouvements', sets:1, reps:'45s', tempo:'Rapide', rest:'0s', targetLoad:'PDC', instructions:'Monter le cardio progressivement.' },
];
const BASE_WARMUP: Exercise[] = [
  { id:'w1', name:'Rotations Articulaires Globales', sets:1, reps:'1 min', tempo:'Lent', rest:'0s', targetLoad:'PDC', instructions:'Réveil articulaire cou→chevilles.' },
  { id:'w2', name:'Squat Profond (Tenue)', sets:1, reps:'45s', tempo:'Statique', rest:'0s', targetLoad:'PDC', instructions:'Ouvrir les hanches en bas du squat.' },
];

const ROUTINES: Record<string, { mobility: Exercise[]; stretching: Exercise[] }> = {
  'Cou': {
    mobility:[{ id:'m1', name:'Rétraction Menton', sets:3, reps:'10', tempo:'2020', rest:'0s', targetLoad:'PDC', instructions:'Rentrer le menton (fléchisseurs profonds).' },{ id:'m2', name:'Rotations Cou', sets:3, reps:'10', tempo:'Lent', rest:'0s', targetLoad:'PDC', instructions:'Rotation contrôlée G/D sans douleur.' }],
    stretching:[{ id:'s1', name:'Étirement Trapèzes', sets:2, reps:'45s', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Incliner la tête sur le côté, épaule opposée basse.' },{ id:'s2', name:'Élévateur Scapula', sets:2, reps:'45s', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Regarder vers l\'aisselle, tirer doucement.' }],
  },
  'Trapèzes': {
    mobility:[{ id:'m1', name:'Rouleau Dorsale', sets:2, reps:'60s', tempo:'Lent', rest:'0s', targetLoad:'Foam roller', instructions:'Rouleau sous les trapèzes, relâcher progressivement.' },{ id:'m2', name:'Haussements d\'épaule lent', sets:3, reps:'10', tempo:'3030', rest:'0s', targetLoad:'PDC', instructions:'Montée lente, tenue 3s, descente contrôlée.' }],
    stretching:[{ id:'s1', name:'Étirement Croisé Épaule', sets:2, reps:'45s/côté', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Bras en écharpe, pousser contre la poitrine.' },{ id:'s2', name:'Stretch Trapèze Assis', sets:2, reps:'45s/côté', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Main sur la tête, incliner doucement.' }],
  },
  'Épaule': {
    mobility:[{ id:'m1', name:'Dislocations Bâton', sets:3, reps:'10', tempo:'Lent', rest:'0s', targetLoad:'Bâton', instructions:'Passer le bâton d\'avant en arrière bras tendus.' },{ id:'m2', name:'Pompes Scapulaires', sets:3, reps:'12', tempo:'2020', rest:'0s', targetLoad:'PDC', instructions:'Serrer et écarter les omoplates, bras tendus.' },{ id:'m3', name:'Glissements Muraux', sets:3, reps:'10', tempo:'2020', rest:'0s', targetLoad:'PDC', instructions:'Dos au mur, glisser les bras vers le haut.' }],
    stretching:[{ id:'s1', name:'Étirement Pectoraux', sets:2, reps:'45s', tempo:'Statique', rest:'15s', targetLoad:'PDC', instructions:'Main contre un mur, tourner le buste.' },{ id:'s2', name:'Capsule Postérieure', sets:2, reps:'45s', tempo:'Statique', rest:'15s', targetLoad:'PDC', instructions:'Bras en écharpe devant la poitrine.' }],
  },
  'Coude': {
    mobility:[{ id:'m1', name:'Distraction Élastique', sets:2, reps:'60s', tempo:'Statique', rest:'0s', targetLoad:'Élastique', instructions:'Elastique attaché haut, bras tendu, laisser tirer.' },{ id:'m2', name:'Pro/Supination', sets:3, reps:'15', tempo:'2020', rest:'0s', targetLoad:'Léger', instructions:'Rotation du poignet avec marteau ou petit poids.' }],
    stretching:[{ id:'s1', name:'Fléchisseurs Poignet', sets:2, reps:'45s', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Bras tendu, paume vers l\'avant, tirer les doigts.' },{ id:'s2', name:'Extenseurs Poignet', sets:2, reps:'45s', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Dos de la main vers l\'avant, plier le poignet.' }],
  },
  'Poignet': {
    mobility:[{ id:'m1', name:'Rotations Poignet (CARs)', sets:3, reps:'5/côté', tempo:'Très Lent', rest:'0s', targetLoad:'PDC', instructions:'Rotations articulaires maximales contrôlées.' },{ id:'m2', name:'Pompes sur Poings', sets:2, reps:'10', tempo:'2020', rest:'0s', targetLoad:'PDC', instructions:'Sur les poings pour renforcer l\'alignement.' }],
    stretching:[{ id:'s1', name:'Étirement Prière', sets:2, reps:'60s', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Mains jointes devant le cœur, descendre les mains.' },{ id:'s2', name:'Prière Inversée', sets:2, reps:'60s', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Dos des mains l\'un contre l\'autre.' }],
  },
  'Thorax': {
    mobility:[{ id:'m1', name:'Livre Ouvert', sets:3, reps:'10/côté', tempo:'Lent', rest:'0s', targetLoad:'PDC', instructions:'Allongé côté, ouvrir le bras en suivant du regard.' },{ id:'m2', name:'Extension Thoracique', sets:3, reps:'10', tempo:'Tenir 3s', rest:'0s', targetLoad:'Rouleau', instructions:'Rouleau sous les omoplates, extension arrière.' }],
    stretching:[{ id:'s1', name:'Grand Dorsal Mur', sets:2, reps:'60s', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Mains au mur, pousser les fesses en arrière.' },{ id:'s2', name:'Suspension Barre', sets:3, reps:'30s', tempo:'Statique', rest:'15s', targetLoad:'PDC', instructions:'Suspendu pour décompresser.' }],
  },
  'Lombaires': {
    mobility:[{ id:'m1', name:'Chat / Vache', sets:3, reps:'10', tempo:'Lent', rest:'0s', targetLoad:'PDC', instructions:'Alterner dos rond et dos creux vertèbre par vertèbre.' },{ id:'m2', name:'Jefferson Curl', sets:3, reps:'5', tempo:'5050', rest:'0s', targetLoad:'Léger', instructions:'Enroulement complet de la colonne.' }],
    stretching:[{ id:'s1', name:'Posture de l\'Enfant', sets:2, reps:'60s', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Fesses sur les talons, bras loin devant.' },{ id:'s2', name:'Carré des Lombes Assis', sets:2, reps:'45s/côté', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Étirement latéral du carré des lombaires.' }],
  },
  'Fessiers': {
    mobility:[{ id:'m1', name:'90/90 Switch', sets:3, reps:'8/côté', tempo:'Lent', rest:'0s', targetLoad:'PDC', instructions:'Rotation interne/externe des hanches au sol.' },{ id:'m2', name:'Hip Thrust (Activation)', sets:3, reps:'15', tempo:'2120', rest:'30s', targetLoad:'PDC/Bande', instructions:'Activer les fessiers, tenir 1s en haut.' }],
    stretching:[{ id:'s1', name:'Posture du Pigeon', sets:2, reps:'90s/côté', tempo:'Statique', rest:'15s', targetLoad:'PDC', instructions:'Jambe pliée devant, jambe tendue derrière.' },{ id:'s2', name:'Figure 4 Allongé', sets:2, reps:'60s/côté', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Cheville posée sur le genou opposé.' }],
  },
  'Hanche': {
    mobility:[{ id:'m1', name:'Rotations Hanche', sets:3, reps:'5/côté', tempo:'Très Lent', rest:'0s', targetLoad:'PDC', instructions:'Grands cercles avec le genou.' },{ id:'m2', name:'World\'s Greatest Stretch', sets:3, reps:'5/côté', tempo:'Dynamique', rest:'0s', targetLoad:'PDC', instructions:'Fente + ouverture + rotation thoracique.' }],
    stretching:[{ id:'s1', name:'Étirement Psoas', sets:2, reps:'60s/côté', tempo:'Statique', rest:'15s', targetLoad:'PDC', instructions:'Genou au sol, pousser les hanches en avant.' },{ id:'s2', name:'Posture du Pigeon', sets:2, reps:'60s/côté', tempo:'Statique', rest:'15s', targetLoad:'PDC', instructions:'Fessier avant relâché au sol.' }],
  },
  'Adducteurs': {
    mobility:[{ id:'m1', name:'Cossack Squat', sets:3, reps:'8/côté', tempo:'Lent', rest:'30s', targetLoad:'PDC', instructions:'Descendre sur un côté, talon au sol, jambe opposée tendue.' },{ id:'m2', name:'Monster Walk Latéral', sets:3, reps:'15/côté', tempo:'Dynamique', rest:'30s', targetLoad:'Bande', instructions:'Bande aux genoux, pas latéraux contrôlés.' }],
    stretching:[{ id:'s1', name:'Stretch Papillon (Baddha Konasana)', sets:2, reps:'90s', tempo:'Statique', rest:'15s', targetLoad:'PDC', instructions:'Plantes des pieds jointes, genoux vers le sol.' },{ id:'s2', name:'Étirement Cavalier (Side Split)', sets:2, reps:'60s/côté', tempo:'Statique', rest:'15s', targetLoad:'PDC', instructions:'Ouverture latérale des jambes, tronc droit.' }],
  },
  'Quadriceps': {
    mobility:[{ id:'m1', name:'Step-up Petersen', sets:3, reps:'12', tempo:'2010', rest:'0s', targetLoad:'PDC', instructions:'Montée sur pointe de pied sur petite marche (Vaste Interne).' },{ id:'m2', name:'Squats Tempo', sets:3, reps:'8', tempo:'4010', rest:'60s', targetLoad:'PDC', instructions:'Descente 4s pour charger le quadriceps.' }],
    stretching:[{ id:'s1', name:'Étirement Quadriceps Debout', sets:2, reps:'60s/côté', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Talon fesse, genou aligné. Tenir une surface si besoin.' },{ id:'s2', name:'Quad Stretch Couché', sets:2, reps:'60s/côté', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Allongé sur le ventre, tirer le pied vers les fesses.' }],
  },
  'Ischio-jambiers': {
    mobility:[{ id:'m1', name:'Nordic Curl Assisté', sets:3, reps:'6', tempo:'Lent', rest:'60s', targetLoad:'PDC', instructions:'Descente la plus lente possible, remontée avec les bras.' },{ id:'m2', name:'RDL (Barre/Haltère)', sets:3, reps:'10', tempo:'3010', rest:'60s', targetLoad:'Léger', instructions:'Charnière de hanche, dos plat, étirer les ischios.' }],
    stretching:[{ id:'s1', name:'Ischio-jambiers Debout', sets:2, reps:'60s/côté', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Jambe surélevée (chaise/banc), dos droit.' },{ id:'s2', name:'Étirement Allongé', sets:2, reps:'60s/côté', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Jambe tirée vers le haut, genou le plus tendu possible.' }],
  },
  'Genou': {
    mobility:[{ id:'m1', name:'Rotation Tibiale', sets:3, reps:'10', tempo:'Lent', rest:'0s', targetLoad:'PDC', instructions:'Assis, tourner le pied int/ext en bloquant le fémur.' },{ id:'m2', name:'Terminal Knee Extension', sets:3, reps:'15', tempo:'2020', rest:'30s', targetLoad:'Bande', instructions:'Bande derrière le genou, extension complète debout.' }],
    stretching:[{ id:'s1', name:'Étirement Quadriceps', sets:2, reps:'60s', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Talon fesse debout.' },{ id:'s2', name:'Ischio-Jambiers', sets:2, reps:'60s', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Jambe surélevée, dos droit.' }],
  },
  'Mollets': {
    mobility:[{ id:'m1', name:'Raises Mollets Unilatéraux', sets:3, reps:'15/côté', tempo:'2121', rest:'30s', targetLoad:'PDC', instructions:'Sur le bord d\'une marche, amplitude maximale.' },{ id:'m2', name:'Sauts Corde Lent', sets:3, reps:'30s', tempo:'Lent', rest:'30s', targetLoad:'PDC', instructions:'Rebonds légers sur les pointes, genoux souples.' }],
    stretching:[{ id:'s1', name:'Étirement Gastrocnémien', sets:2, reps:'60s/côté', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Pousser le mur, jambe arrière tendue, talon au sol.' },{ id:'s2', name:'Étirement Soléaire', sets:2, reps:'60s/côté', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Même position, genou arrière légèrement fléchi.' }],
  },
  'Cheville': {
    mobility:[{ id:'m1', name:'Genou au Mur (Dorsiflexion)', sets:3, reps:'10', tempo:'Tenir 2s', rest:'0s', targetLoad:'PDC', instructions:'Avancer le genou sans décoller le talon.' },{ id:'m2', name:'Rotations Cheville (CARs)', sets:3, reps:'10/côté', tempo:'Lent', rest:'0s', targetLoad:'PDC', instructions:'Rotations maximales de la cheville.' }],
    stretching:[{ id:'s1', name:'Étirement Mollet Mur', sets:2, reps:'60s/côté', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Pousser le mur, jambe arrière tendue.' },{ id:'s2', name:'Étirement Soléaire', sets:2, reps:'60s/côté', tempo:'Statique', rest:'10s', targetLoad:'PDC', instructions:'Même chose genou fléchi.' }],
  },
};

// ── JOINTS FRONT VIEW ───────────────────────────────────────────────────────────
// x,y in % of SVG container, sized for viewBox="0 0 220 500"
const JOINTS_FRONT = [
  { id: 'Cou', label: 'Cou', x: 50, y: 13 },
  { id: 'Trapèzes', label: 'Trapèzes', x: 35, y: 19 },
  { id: 'Trapèzes', label: 'Trapèzes', x: 65, y: 19 },
  { id: 'Épaule', label: 'Épaule G', x: 27, y: 22 },
  { id: 'Épaule', label: 'Épaule D', x: 73, y: 22 },
  { id: 'Thorax', label: 'Thorax', x: 50, y: 28 },
  { id: 'Coude', label: 'Coude G', x: 22, y: 37 },
  { id: 'Coude', label: 'Coude D', x: 78, y: 37 },
  { id: 'Adducteurs', label: 'Adducteurs', x: 50, y: 56 },
  { id: 'Poignet', label: 'Poignet G', x: 18, y: 50 },
  { id: 'Poignet', label: 'Poignet D', x: 82, y: 50 },
  { id: 'Hanche', label: 'Hanche G', x: 38, y: 58 },
  { id: 'Hanche', label: 'Hanche D', x: 62, y: 58 },
  { id: 'Quadriceps', label: 'Quadri G', x: 35, y: 68 },
  { id: 'Quadriceps', label: 'Quadri D', x: 65, y: 68 },
  { id: 'Genou', label: 'Genou G', x: 35, y: 77 },
  { id: 'Genou', label: 'Genou D', x: 65, y: 77 },
  { id: 'Mollets', label: 'Mollets G', x: 34, y: 86 },
  { id: 'Mollets', label: 'Mollets D', x: 66, y: 86 },
  { id: 'Cheville', label: 'Cheville G', x: 34, y: 94 },
  { id: 'Cheville', label: 'Cheville D', x: 66, y: 94 },
];

const JOINTS_BACK = [
  { id: 'Cou', label: 'Cou', x: 50, y: 13 },
  { id: 'Trapèzes', label: 'Trapèzes', x: 50, y: 20 },
  { id: 'Épaule', label: 'Épaule G', x: 27, y: 22 },
  { id: 'Épaule', label: 'Épaule D', x: 73, y: 22 },
  { id: 'Thorax', label: 'Dorsal', x: 42, y: 30 },
  { id: 'Thorax', label: 'Dorsal', x: 58, y: 30 },
  { id: 'Lombaires', label: 'Lombaires', x: 50, y: 42 },
  { id: 'Coude', label: 'Coude G', x: 22, y: 37 },
  { id: 'Coude', label: 'Coude D', x: 78, y: 37 },
  { id: 'Poignet', label: 'Poignet G', x: 18, y: 50 },
  { id: 'Poignet', label: 'Poignet D', x: 82, y: 50 },
  { id: 'Fessiers', label: 'Fessier G', x: 39, y: 58 },
  { id: 'Fessiers', label: 'Fessier D', x: 61, y: 58 },
  { id: 'Ischio-jambiers', label: 'Ischio G', x: 35, y: 70 },
  { id: 'Ischio-jambiers', label: 'Ischio D', x: 65, y: 70 },
  { id: 'Genou', label: 'Genou G', x: 35, y: 78 },
  { id: 'Genou', label: 'Genou D', x: 65, y: 78 },
  { id: 'Mollets', label: 'Mollets G', x: 34, y: 87 },
  { id: 'Mollets', label: 'Mollets D', x: 66, y: 87 },
  { id: 'Cheville', label: 'Cheville G', x: 34, y: 94 },
  { id: 'Cheville', label: 'Cheville D', x: 66, y: 94 },
];

// ── BODY SVG COMPONENTS ─────────────────────────────────────────────────────────
const BodyFrontSVG: React.FC = () => (
  <svg viewBox="0 0 220 500" className="w-full h-full drop-shadow-[0_0_12px_rgba(255,255,255,0.08)]">
    <g fill="none" stroke="#C8D4E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Head */}
      <ellipse cx="110" cy="34" rx="22" ry="26" />
      {/* Neck */}
      <line x1="103" y1="60" x2="103" y2="70" /><line x1="117" y1="60" x2="117" y2="70" />
      {/* Torso */}
      <path d="M103 70 Q80 72 68 80 Q56 88 55 100 L52 170 Q51 185 60 192 L60 250 L70 380 L68 460 L82 465 L88 350 L95 280 L110 280 L125 350 L132 465 L148 460 L150 380 L160 250 L160 192 Q169 185 168 170 L165 100 Q164 88 152 80 Q140 72 117 70 Z" />
      {/* Shoulders detail */}
      <path d="M55 100 Q45 95 38 100 Q32 106 34 118 L36 140 L41 165 L45 180" strokeOpacity="0.7"/>
      <path d="M165 100 Q175 95 182 100 Q188 106 186 118 L184 140 L179 165 L175 180" strokeOpacity="0.7"/>
      {/* Chest line */}
      <path d="M75 105 Q110 118 145 105" strokeOpacity="0.35"/>
      {/* Center line */}
      <line x1="110" y1="110" x2="110" y2="185" strokeOpacity="0.25"/>
      {/* Waist line */}
      <path d="M68 190 Q110 202 152 190" strokeOpacity="0.5"/>
      {/* Shorts line */}
      <path d="M68 250 Q110 262 152 250" strokeOpacity="0.5"/>
      {/* Knee lines */}
      <path d="M68 380 Q75 376 82 380" strokeOpacity="0.3"/>
      <path d="M138 380 Q145 376 152 380" strokeOpacity="0.3"/>
    </g>
  </svg>
);

const BodyBackSVG: React.FC = () => (
  <svg viewBox="0 0 220 500" className="w-full h-full drop-shadow-[0_0_12px_rgba(255,255,255,0.08)]">
    <g fill="none" stroke="#C8D4E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Head */}
      <ellipse cx="110" cy="34" rx="22" ry="26" />
      {/* Neck */}
      <line x1="103" y1="60" x2="103" y2="70" /><line x1="117" y1="60" x2="117" y2="70" />
      {/* Torso back */}
      <path d="M103 70 Q80 72 68 80 Q56 88 55 100 L52 170 Q51 185 60 192 L60 250 L70 380 L68 460 L82 465 L88 350 L95 280 L110 280 L125 350 L132 465 L148 460 L150 380 L160 250 L160 192 Q169 185 168 170 L165 100 Q164 88 152 80 Q140 72 117 70 Z"/>
      {/* Arms */}
      <path d="M55 100 Q45 95 38 100 Q32 106 34 118 L36 140 L41 165 L45 180" strokeOpacity="0.7"/>
      <path d="M165 100 Q175 95 182 100 Q188 106 186 118 L184 140 L179 165 L175 180" strokeOpacity="0.7"/>
      {/* Spine */}
      <line x1="110" y1="72" x2="110" y2="245" strokeOpacity="0.3"/>
      {/* Shoulder blades */}
      <ellipse cx="88" cy="105" rx="14" ry="18" strokeOpacity="0.3"/>
      <ellipse cx="132" cy="105" rx="14" ry="18" strokeOpacity="0.3"/>
      {/* Waist */}
      <path d="M68 190 Q110 202 152 190" strokeOpacity="0.5"/>
      {/* Glutes */}
      <path d="M70 250 Q87 268 110 260 Q133 268 150 250" strokeOpacity="0.4"/>
    </g>
  </svg>
);

export const CareView: React.FC<CareViewProps> = ({ athlete }) => {
  const [selectedJoint, setSelectedJoint] = useState<string | null>(null);
  const [routineType, setRoutineType] = useState<'mobility' | 'stretching' | null>(null);
  const [activeGlobalRoutine, setActiveGlobalRoutine] = useState<string | null>(null);
  const [view, setView] = useState<'front' | 'back'>('front');

  const getRoutine = (joint: string, type: 'mobility' | 'stretching') =>
    ROUTINES[joint]?.[type] || ROUTINES['Épaule'][type];

  const generateWarmUp = (): Exercise[] => {
    let routine = [...BASE_WARMUP];
    const mapToKey: Record<string, string> = { 'Cheville G':'Cheville', 'Cheville D':'Cheville', 'Hanche G':'Hanche', 'Hanche D':'Hanche', 'Épaule G':'Épaule', 'Épaule D':'Épaule' };
    athlete.performance.flexibility.forEach(m => {
      if (m.A < 75) { const k = mapToKey[m.subject]; if (k && ROUTINES[k]) { const ex = ROUTINES[k].mobility[0]; if (!routine.find(e => e.id === ex.id)) routine.push({ ...ex, name:`${ex.name} (${m.subject})` }); } }
    });
    return routine;
  };

  const renderGlobalRoutine = (title: string, exercises: Exercise[]) => (
    <div className="space-y-4 animate-in slide-in-from-right">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setActiveGlobalRoutine(null)} className="text-nexus-gray text-xs font-bold uppercase tracking-widest flex items-center gap-2">← Retour</button>
        <span className="text-nexus-gold text-xs font-bold uppercase px-3 py-1 bg-nexus-gold/10 rounded-full border border-nexus-gold/20">⏱ 15 min</span>
      </div>
      <div className="mb-6">
        <h2 className="font-display text-3xl text-white uppercase">{title}</h2>
        <p className="text-nexus-gray text-sm">Adapté à votre profil</p>
      </div>
      {exercises.map((ex, idx) => (
        <GlassCard key={idx} className="p-5 border-l-2 border-l-nexus-red">
          <h3 className="font-bold text-white uppercase tracking-wide text-lg mb-2">{ex.name}</h3>
          {ex.instructions && <p className="text-sm text-nexus-gray mb-4 italic pl-4 border-l border-nexus-gray/30">"{ex.instructions}"</p>}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[{l:'Séries',v:ex.sets},{l:'Reps',v:ex.reps},{l:'Repos',v:ex.rest},{l:'Tempo',v:ex.tempo}].map(({l,v}) => (
              <div key={l} className="bg-black/30 rounded-lg p-2 border border-white/5">
                <div className="text-nexus-gray uppercase text-[10px] mb-1">{l}</div>
                <div className="text-white font-display font-bold text-lg">{v}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
      <div className="pt-4"><Button fullWidth onClick={() => setActiveGlobalRoutine(null)} className="bg-nexus-red shadow-[0_0_20px_rgba(229,46,1,0.4)]">Routine Terminée</Button></div>
    </div>
  );

  if (activeGlobalRoutine === 'PRE_MATCH') return <div className="px-6 pb-24 animate-in fade-in">{renderGlobalRoutine('Routine Pré-Match', PRE_MATCH_ROUTINE)}</div>;
  if (activeGlobalRoutine === 'WARMUP') return <div className="px-6 pb-24 animate-in fade-in">{renderGlobalRoutine('Routine Échauffement', generateWarmUp())}</div>;

  return (
    <div className="px-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

      {!selectedJoint ? (
        <>
          {/* Quick routines */}
          <div className="grid grid-cols-2 gap-3">
            <GlassCard onClick={() => setActiveGlobalRoutine('PRE_MATCH')} className="p-3 text-center cursor-pointer hover:bg-white/5 flex flex-col items-center justify-center h-20 border-nexus-red/30 relative overflow-hidden" accentColor="nexus-red">
              <div className="absolute right-0 top-0 w-14 h-14 bg-gradient-to-br from-nexus-red/10 to-transparent rounded-bl-full pointer-events-none"/>
              <span className="font-display font-bold text-white uppercase text-sm leading-none">🔥 PRÉ-MATCH</span>
              <span className="text-[9px] text-nexus-gray mt-1">15 min</span>
            </GlassCard>
            <GlassCard onClick={() => setActiveGlobalRoutine('WARMUP')} className="p-3 text-center cursor-pointer hover:bg-white/5 flex flex-col items-center justify-center h-20 border-nexus-gold/30 relative overflow-hidden" accentColor="nexus-gold">
              <div className="absolute right-0 top-0 w-14 h-14 bg-gradient-to-br from-nexus-gold/10 to-transparent rounded-bl-full pointer-events-none"/>
              <span className="font-display font-bold text-white uppercase text-sm leading-none">⚡ ÉCHAUFFEMENT</span>
              <span className="text-[9px] text-nexus-gray mt-1">15 min • Adapté</span>
            </GlassCard>
          </div>

          {/* Header + front/back toggle */}
          <div className="text-center">
            <h2 className="font-display text-2xl text-white uppercase tracking-widest">Carte Corporelle</h2>
            <p className="text-nexus-gray text-[10px] tracking-[0.2em] uppercase mt-0.5">Touchez une zone douloureuse</p>
            <div className="flex gap-2 justify-center mt-3">
              <button onClick={() => setView('front')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border transition-all ${view==='front'?'bg-nexus-red text-white border-nexus-red':'border-white/20 text-nexus-gray hover:border-white/40'}`}>
                Vue Avant
              </button>
              <button onClick={() => setView('back')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border transition-all ${view==='back'?'bg-nexus-red text-white border-nexus-red':'border-white/20 text-nexus-gray hover:border-white/40'}`}>
                Vue Arrière
              </button>
            </div>
          </div>

          {/* Body map */}
          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(229,46,1,0.06),transparent_60%)] pointer-events-none rounded-2xl" />
            <div className="relative" style={{ width: '200px', height: '480px' }}>
              {view === 'front' ? <BodyFrontSVG /> : <BodyBackSVG />}

              {(view === 'front' ? JOINTS_FRONT : JOINTS_BACK).map((joint, idx) => (
                <button key={`${joint.id}-${idx}`}
                  onClick={() => setSelectedJoint(joint.id)}
                  className="absolute flex items-center justify-center group"
                  style={{ left:`${joint.x}%`, top:`${joint.y}%`, width:'44px', height:'44px', marginLeft:'-22px', marginTop:'-22px' }}
                  title={joint.label}
                >
                  {/* Outer ping */}
                  <div className="absolute w-6 h-6 bg-nexus-red/20 rounded-full animate-ping opacity-0 group-hover:opacity-100" />
                  {/* Dot */}
                  <div className="w-3.5 h-3.5 bg-nexus-red rounded-full shadow-[0_0_10px_#E52E01] border border-white/40 group-hover:scale-150 transition-transform duration-200 z-10" />
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 justify-center pt-1 pb-2">
            {[...new Set((view==='front'?JOINTS_FRONT:JOINTS_BACK).map(j => j.id))].map(id => (
              <button key={id} onClick={() => setSelectedJoint(id)}
                className="text-[9px] px-2.5 py-1 rounded-full border border-nexus-red/30 text-nexus-gray hover:text-white hover:border-nexus-red hover:bg-nexus-red/10 transition-all">
                {id}
              </button>
            ))}
          </div>
        </>
      ) : !routineType ? (
        <div className="space-y-6">
          <button onClick={() => setSelectedJoint(null)} className="text-nexus-gray text-xs font-bold uppercase tracking-widest flex items-center gap-2">← Carte</button>
          <div className="text-center mb-8">
            <h2 className="font-display text-4xl text-nexus-gold uppercase drop-shadow-lg">{selectedJoint}</h2>
            <p className="text-nexus-gray text-sm uppercase tracking-wide">Protocole Scientifique</p>
          </div>
          <div className="grid gap-4">
            <GlassCard onClick={() => setRoutineType('mobility')} className="p-7 text-center group hover:bg-white/5 border-l-4 border-l-nexus-gold" accentColor="nexus-gold">
              <h3 className="font-display text-2xl text-white uppercase mb-1">Mobilité</h3>
              <p className="text-nexus-gray text-xs uppercase tracking-wider">Amplitude & Activation · 15 min</p>
            </GlassCard>
            <GlassCard onClick={() => setRoutineType('stretching')} className="p-7 text-center group hover:bg-white/5 border-l-4 border-l-nexus-red" accentColor="nexus-red">
              <h3 className="font-display text-2xl text-white uppercase mb-1">Stretching</h3>
              <p className="text-nexus-gray text-xs uppercase tracking-wider">Détente & Décompression · 15 min</p>
            </GlassCard>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setRoutineType(null)} className="text-nexus-gray text-xs font-bold uppercase flex items-center gap-2">← Choix</button>
            <span className="text-nexus-red text-xs font-bold uppercase px-3 py-1 bg-nexus-red/10 rounded-full border border-nexus-red/20">Protocole</span>
          </div>
          <div className="mb-4">
            <h2 className="font-display text-2xl text-white uppercase">Routine {routineType === 'mobility' ? 'Mobilité' : 'Stretching'}</h2>
            <p className="text-nexus-gold font-display text-xl uppercase">{selectedJoint} · 15 min</p>
          </div>
          {getRoutine(selectedJoint, routineType).map((ex, idx) => (
            <GlassCard key={idx} className="p-5 border-l-2 border-l-white/20">
              <h3 className="font-bold text-white uppercase tracking-wide text-base mb-2">{ex.name}</h3>
              {ex.instructions && <p className="text-sm text-nexus-gray mb-4 italic pl-4 border-l border-nexus-gray/30">"{ex.instructions}"</p>}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[{l:'Séries',v:ex.sets},{l:'Reps',v:ex.reps},{l:'Repos',v:ex.rest},{l:'Tempo',v:ex.tempo}].map(({l,v}) => (
                  <div key={l} className="bg-black/30 rounded-lg p-2 border border-white/5">
                    <div className="text-nexus-gray uppercase text-[9px] mb-1">{l}</div>
                    <div className="text-white font-display font-bold">{v}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
          <div className="pt-2">
            <Button fullWidth onClick={() => { setRoutineType(null); setSelectedJoint(null); }} className="bg-nexus-red shadow-[0_0_20px_rgba(229,46,1,0.4)]">
              Terminer la Routine
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
