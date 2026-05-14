import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Exercise, Athlete } from '../../types';

interface CareViewProps { athlete: Athlete; }

const PRE_MATCH_ROUTINE: Exercise[] = [
  { id: 'pm1', name: 'Réveil Fessier (Clamshells)', sets: 2, reps: '15/côté', tempo: 'Dynamique', rest: '0s', targetLoad: 'Elastique', instructions: 'Activation rapide des fessiers.' },
  { id: 'pm2', name: 'World\'s Greatest Stretch', sets: 2, reps: '6/côté', tempo: 'Fluide', rest: '0s', targetLoad: 'PDC', instructions: 'Grande fente avec rotation thoracique.' },
  { id: 'pm3', name: 'Sauts Pogo', sets: 2, reps: '20', tempo: 'Explosif', rest: '30s', targetLoad: 'PDC', instructions: 'Rebonds chevilles jambes tendues.' },
  { id: 'pm4', name: 'Shadow Boxing / Mouvements', sets: 1, reps: '45s', tempo: 'Rapide', rest: '0s', targetLoad: 'PDC', instructions: 'Monter le cardio progressivement.' },
];
const BASE_WARMUP: Exercise[] = [
  { id: 'w1', name: 'Rotations Articulaires (Cou, Epaules, Hanches)', sets: 1, reps: '1 min', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Réveil articulaire global.' },
  { id: 'w2', name: 'Squat Profond (Tenue)', sets: 1, reps: '45s', tempo: 'Statique', rest: '0s', targetLoad: 'PDC', instructions: 'Ouvrir les hanches en bas du squat.' },
];

const ROUTINES: Record<string, { mobility: Exercise[], stretching: Exercise[] }> = {
  'Cou': {
    mobility: [
      { id: 'm1', name: 'Rétraction Menton', sets: 3, reps: '10', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Rentrer le menton pour créer un double menton (Fléchisseurs profonds).' },
      { id: 'm2', name: 'Rotations Cou', sets: 3, reps: '10', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotation contrôlée gauche/droite sans douleur.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Trapèzes', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Incliner la tête sur le côté, épaule opposée basse.' },
      { id: 's2', name: 'Élévateur Scapula', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Regarder vers l\'aisselle et tirer doucement la tête.' },
    ],
  },
  'Epaule': {
    mobility: [
      { id: 'm1', name: 'Dislocations Bâton', sets: 3, reps: '10', tempo: 'Lent', rest: '0s', targetLoad: 'Bâton', instructions: 'Passer le bâton d\'avant en arrière bras tendus.' },
      { id: 'm2', name: 'Pompes Scapulaires', sets: 3, reps: '12', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Serrer et écarter les omoplates bras tendus.' },
      { id: 'm3', name: 'Glissements Muraux', sets: 3, reps: '10', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Dos au mur, glisser les bras vers le haut.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Pectoraux', sets: 2, reps: '45s', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Main contre un mur, tourner le buste opposé.' },
      { id: 's2', name: 'Capsule Postérieure', sets: 2, reps: '45s', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Bras en écharpe devant la poitrine.' },
    ],
  },
  'Coude': {
    mobility: [
      { id: 'm1', name: 'Distraction Élastique', sets: 2, reps: '60s', tempo: 'Statique', rest: '0s', targetLoad: 'Élastique', instructions: 'Elastique attaché haut, bras tendu, laisser tirer.' },
      { id: 'm2', name: 'Pro/Supination', sets: 3, reps: '15', tempo: '2020', rest: '0s', targetLoad: 'Léger', instructions: 'Rotation du poignet avec marteau ou petit poids.' },
    ],
    stretching: [
      { id: 's1', name: 'Fléchisseurs Poignet', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Bras tendu, paume vers l\'avant, tirer les doigts.' },
      { id: 's2', name: 'Extenseurs Poignet', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Bras tendu, dos de la main vers l\'avant, plier le poignet.' },
    ],
  },
  'Poignet': {
    mobility: [
      { id: 'm1', name: 'Rotations Poignet', sets: 3, reps: '5/côté', tempo: 'Très Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotations articulaires contrôlées maximales (CARs).' },
      { id: 'm2', name: 'Pompes sur Poings', sets: 2, reps: '10', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Sur les poings pour renforcer l\'alignement.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Prière', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Mains jointes devant le coeur, descendre les mains.' },
      { id: 's2', name: 'Prière Inversée', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Dos des mains l\'un contre l\'autre.' },
    ],
  },
  'Thorax': {
    mobility: [
      { id: 'm1', name: 'Livre Ouvert', sets: 3, reps: '10/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Allongé côté, ouvrir le bras en suivant du regard.' },
      { id: 'm2', name: 'Extension Thoracique', sets: 3, reps: '10', tempo: 'Tenir 3s', rest: '0s', targetLoad: 'Rouleau', instructions: 'Rouleau sous les omoplates, extension arrière.' },
    ],
    stretching: [
      { id: 's1', name: 'Grand Dorsal Mur', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Mains au mur, pousser les fesses en arrière.' },
      { id: 's2', name: 'Suspension Barre', sets: 3, reps: '30s', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Suspendu au cadre de porte pour décompresser.' },
    ],
  },
  'Dos': {
    mobility: [
      { id: 'm1', name: 'Chat / Vache', sets: 3, reps: '10', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Alterner dos rond et dos creux vertèbre par vertèbre.' },
      { id: 'm2', name: 'Jefferson Curl', sets: 3, reps: '5', tempo: '5050', rest: '0s', targetLoad: 'Léger', instructions: 'Enroulement complet de la colonne avec charge légère.' },
    ],
    stretching: [
      { id: 's1', name: 'Posture de l\'Enfant', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Fesses sur les talons, bras loin devant.' },
      { id: 's2', name: 'Carré des Lombes', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Étirement du carré des lombaires assis.' },
    ],
  },
  'Hanche': {
    mobility: [
      { id: 'm1', name: '90/90 Switch', sets: 3, reps: '8/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotation interne/externe des hanches au sol.' },
      { id: 'm2', name: 'Rotations Hanche', sets: 3, reps: '5/côté', tempo: 'Très Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Grands cercles avec le genou, debout ou à 4 pattes.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Psoas', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Genou au mur, pied au mur, extension hanche.' },
      { id: 's2', name: 'Posture du Pigeon', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Jambe pliée devant, jambe tendue derrière.' },
    ],
  },
  'Genou': {
    mobility: [
      { id: 'm1', name: 'Rotation Tibiale', sets: 3, reps: '10', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Assis, tourner le pied int/ext en bloquant le fémur.' },
      { id: 'm2', name: 'Step-up Petersen', sets: 3, reps: '12', tempo: '2010', rest: '0s', targetLoad: 'PDC', instructions: 'Montée sur pointe de pied sur petite marche (Vaste Interne).' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Quadriceps', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Talon fesse debout.' },
      { id: 's2', name: 'Ischio-Jambiers', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Jambe surélevée, dos droit.' },
    ],
  },
  'Cheville': {
    mobility: [
      { id: 'm1', name: 'Genou au Mur', sets: 3, reps: '10', tempo: 'Tenir 2s', rest: '0s', targetLoad: 'PDC', instructions: 'Avancer le genou sans décoller le talon (Dorsiflexion).' },
      { id: 'm2', name: 'Rotations Cheville', sets: 3, reps: '10/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotations maximales de la cheville.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Mollet', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Pousser le mur, jambe arrière tendue.' },
      { id: 's2', name: 'Étirement Soléaire', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Même chose genou fléchi.' },
    ],
  },
  'Quadriceps': {
    mobility: [
      { id: 'm1', name: 'Step-up Petersen', sets: 3, reps: '12', tempo: '2010', rest: '0s', targetLoad: 'PDC', instructions: 'Montée sur pointe de pied sur petite marche, active le vaste interne.' },
      { id: 'm2', name: 'Squat Tempo', sets: 3, reps: '8', tempo: '4010', rest: '60s', targetLoad: 'PDC', instructions: 'Descente lente 4s pour charger les quadriceps.' },
    ],
    stretching: [
      { id: 's1', name: 'Quadriceps Debout', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Talon fesse, genou aligné.' },
      { id: 's2', name: 'Quad Stretch Couché', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Allongé sur le ventre, tirer le pied vers les fesses.' },
    ],
  },
  'Ischio-jambiers': {
    mobility: [
      { id: 'm1', name: 'Nordic Curl Assisté', sets: 3, reps: '6', tempo: 'Lent', rest: '60s', targetLoad: 'PDC', instructions: 'Descente la plus lente possible, remontée avec les bras.' },
      { id: 'm2', name: 'RDL Léger', sets: 3, reps: '10', tempo: '3010', rest: '60s', targetLoad: 'Léger', instructions: 'Charnière de hanche, dos plat, étirer les ischios.' },
    ],
    stretching: [
      { id: 's1', name: 'Ischio Debout', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Jambe surélevée (chaise/banc), dos droit.' },
      { id: 's2', name: 'Étirement Allongé', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Jambe tirée vers le haut, genou le plus tendu possible.' },
    ],
  },
  'Fessiers': {
    mobility: [
      { id: 'm1', name: '90/90 Switch', sets: 3, reps: '8/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotation interne/externe des hanches au sol.' },
      { id: 'm2', name: 'Hip Thrust Activation', sets: 3, reps: '15', tempo: '2120', rest: '30s', targetLoad: 'PDC', instructions: 'Activer les fessiers, tenir 1s en haut.' },
    ],
    stretching: [
      { id: 's1', name: 'Posture du Pigeon', sets: 2, reps: '90s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Jambe pliée devant, jambe tendue derrière.' },
      { id: 's2', name: 'Figure 4 Allongé', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Cheville sur le genou opposé, tirer la jambe.' },
    ],
  },
  'Adducteurs': {
    mobility: [
      { id: 'm1', name: 'Cossack Squat', sets: 3, reps: '8/côté', tempo: 'Lent', rest: '30s', targetLoad: 'PDC', instructions: 'Descendre sur un côté, talon au sol, jambe opposée tendue.' },
      { id: 'm2', name: 'Monster Walk Latéral', sets: 3, reps: '15/côté', tempo: 'Dynamique', rest: '30s', targetLoad: 'Bande', instructions: 'Bande aux genoux, pas latéraux contrôlés.' },
    ],
    stretching: [
      { id: 's1', name: 'Stretch Papillon', sets: 2, reps: '90s', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Plantes des pieds jointes, genoux vers le sol.' },
      { id: 's2', name: 'Étirement Cavalier', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Ouverture latérale des jambes, tronc droit.' },
    ],
  },
  'Mollets': {
    mobility: [
      { id: 'm1', name: 'Calf Raise Unilatéral', sets: 3, reps: '15/côté', tempo: '2121', rest: '30s', targetLoad: 'PDC', instructions: 'Sur le bord d\'une marche, amplitude maximale.' },
      { id: 'm2', name: 'Sauts Pogo', sets: 3, reps: '30s', tempo: 'Léger', rest: '30s', targetLoad: 'PDC', instructions: 'Rebonds légers sur les pointes, genoux souples.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Gastrocnémien', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Pousser le mur, jambe arrière tendue, talon au sol.' },
      { id: 's2', name: 'Étirement Soléaire', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Même position, genou arrière légèrement fléchi.' },
    ],
  },
  'Trapèzes': {
    mobility: [
      { id: 'm1', name: 'Rouleau Dorsale', sets: 2, reps: '60s', tempo: 'Lent', rest: '0s', targetLoad: 'Foam roller', instructions: 'Rouleau sous les trapèzes, relâcher progressivement.' },
      { id: 'm2', name: 'Haussements lents', sets: 3, reps: '10', tempo: '3030', rest: '0s', targetLoad: 'PDC', instructions: 'Montée lente, tenue 3s, descente contrôlée.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Croisé Épaule', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Bras en écharpe, pousser contre la poitrine.' },
      { id: 's2', name: 'Stretch Trapèze Assis', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Main sur la tête, incliner doucement.' },
    ],
  },
  'Lombaires': {
    mobility: [
      { id: 'm1', name: 'Chat / Vache', sets: 3, reps: '10', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Alterner dos rond et dos creux vertèbre par vertèbre.' },
      { id: 'm2', name: 'Jefferson Curl', sets: 3, reps: '5', tempo: '5050', rest: '0s', targetLoad: 'Léger', instructions: 'Enroulement complet de la colonne avec charge légère.' },
    ],
    stretching: [
      { id: 's1', name: 'Posture de l\'Enfant', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Fesses sur les talons, bras loin devant.' },
      { id: 's2', name: 'Carré des Lombes', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Étirement du carré des lombaires assis.' },
    ],
  },
};

// Points articulations — vue face
const JOINTS_FRONT = [
  { id: 'Cou',      x: 50, y: 11 },
  { id: 'Epaule',   x: 30, y: 17 }, { id: 'Epaule',   x: 70, y: 17 },
  { id: 'Coude',    x: 28, y: 33 }, { id: 'Coude',    x: 72, y: 33 },
  { id: 'Poignet',  x: 25, y: 48 }, { id: 'Poignet',  x: 75, y: 48 },
  { id: 'Thorax',   x: 50, y: 24 },
  { id: 'Hanche',   x: 42, y: 53 }, { id: 'Hanche',   x: 58, y: 53 },
  { id: 'Genou',    x: 38, y: 72 }, { id: 'Genou',    x: 62, y: 72 },
  { id: 'Cheville', x: 38, y: 91 }, { id: 'Cheville', x: 62, y: 91 },
];
// Points articulations — vue dos
const JOINTS_BACK = [
  { id: 'Cou',      x: 50, y: 11 },
  { id: 'Epaule',   x: 30, y: 17 }, { id: 'Epaule',   x: 70, y: 17 },
  { id: 'Coude',    x: 28, y: 33 }, { id: 'Coude',    x: 72, y: 33 },
  { id: 'Poignet',  x: 25, y: 48 }, { id: 'Poignet',  x: 75, y: 48 },
  { id: 'Dos',      x: 50, y: 30 },
  { id: 'Hanche',   x: 42, y: 53 }, { id: 'Hanche',   x: 58, y: 53 },
  { id: 'Genou',    x: 38, y: 72 }, { id: 'Genou',    x: 62, y: 72 },
  { id: 'Cheville', x: 38, y: 91 }, { id: 'Cheville', x: 62, y: 91 },
];
// Points muscles — vue face
const MUSCLES_FRONT = [
  { id: 'Thorax',      x: 42, y: 22 }, { id: 'Thorax',      x: 58, y: 22 },
  { id: 'Adducteurs',  x: 50, y: 57 },
  { id: 'Quadriceps',  x: 37, y: 65 }, { id: 'Quadriceps',  x: 63, y: 65 },
  { id: 'Mollets',     x: 37, y: 82 }, { id: 'Mollets',     x: 63, y: 82 },
];
// Points muscles — vue dos
const MUSCLES_BACK = [
  { id: 'Trapèzes',        x: 50, y: 19 },
  { id: 'Lombaires',       x: 50, y: 40 },
  { id: 'Fessiers',        x: 40, y: 56 }, { id: 'Fessiers',        x: 60, y: 56 },
  { id: 'Ischio-jambiers', x: 38, y: 67 }, { id: 'Ischio-jambiers', x: 62, y: 67 },
  { id: 'Mollets',         x: 37, y: 82 }, { id: 'Mollets',         x: 63, y: 82 },
];

// SVG identique à l'original
const BodySVG: React.FC = () => (
  <svg viewBox="0 0 200 450" className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
    <g fill="none" stroke="#F4F4F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="100" cy="30" rx="18" ry="22" />
      <path d="M100 52 L 100 58" />
      <path d="M 100 58 Q 130 58 140 65 Q 150 70 150 90 L 152 150 L 154 215 L 150 225 L 146 215 L 135 150 L 125 105 L 125 220 L 135 320 L 130 410 L 110 420 L 105 320 L 100 250 L 95 320 L 90 420 L 70 410 L 65 320 L 75 220 L 75 105 L 65 150 L 54 215 L 50 225 L 46 215 L 48 150 L 50 90 Q 50 70 60 65 Q 70 58 100 58" />
      <path d="M75 100 Q 100 110 125 100" strokeOpacity="0.3" />
      <path d="M100 120 L 100 170" strokeOpacity="0.2" />
      <path d="M75 220 L 125 220" strokeOpacity="0.5" />
      <path d="M70 320 L 60 320" strokeOpacity="0.2" />
      <path d="M130 320 L 140 320" strokeOpacity="0.2" />
    </g>
  </svg>
);

// Composant bonhomme avec toggle face/dos
interface FigureProps {
  label: string;
  dotColor: string;
  glowColor: string;
  pointsFront: { id: string; x: number; y: number }[];
  pointsBack: { id: string; x: number; y: number }[];
  onSelect: (id: string) => void;
}
const BodyFigure: React.FC<FigureProps> = ({ label, dotColor, glowColor, pointsFront, pointsBack, onSelect }) => {
  const [view, setView] = useState<'face' | 'dos'>('face');
  const points = view === 'face' ? pointsFront : pointsBack;
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: dotColor }}>{label}</p>
      {/* Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-white/10">
        {(['face', 'dos'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`text-[7px] font-bold uppercase px-2.5 py-1 transition-colors ${view === v ? 'text-black' : 'text-white/40'}`}
            style={{ backgroundColor: view === v ? dotColor : 'transparent' }}>
            {v}
          </button>
        ))}
      </div>
      {/* Figure */}
      <div className="relative w-full" style={{ maxWidth: '115px', aspectRatio: '200/450' }}>
        <BodySVG />
        {points.map((pt, idx) => (
          <button key={`${pt.id}-${idx}`}
            onClick={() => onSelect(pt.id)}
            className="absolute flex items-center justify-center group z-10"
            style={{ left: `${pt.x}%`, top: `${pt.y}%`, width: '36px', height: '36px', marginLeft: '-18px', marginTop: '-18px' }}>
            <div className="absolute w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: dotColor + '25' }} />
            <div className="w-3.5 h-3.5 rounded-full border border-white/50 transition-transform duration-200 group-hover:scale-150"
              style={{ backgroundColor: dotColor, boxShadow: `0 0 10px ${glowColor}` }} />
          </button>
        ))}
      </div>
    </div>
  );
};

export const CareView: React.FC<CareViewProps> = ({ athlete }) => {
  const [selectedJoint, setSelectedJoint] = useState<string | null>(null);
  const [routineType, setRoutineType] = useState<'mobility' | 'stretching' | null>(null);
  const [activeGlobalRoutine, setActiveGlobalRoutine] = useState<string | null>(null);

  const getRoutine = (joint: string, type: 'mobility' | 'stretching') =>
    ROUTINES[joint]?.[type] || ROUTINES['Epaule'][type];

  const generateWarmUp = (): Exercise[] => {
    let routine = [...BASE_WARMUP];
    const map: Record<string, string> = { 'Cheville G':'Cheville','Cheville D':'Cheville','Hanche G':'Hanche','Hanche D':'Hanche','Epaule G':'Epaule','Epaule D':'Epaule','Adducteur':'Hanche' };
    athlete.performance.flexibility.forEach(m => {
      if (m.A < 75) { const k = map[m.subject]; if (k && ROUTINES[k]) { const ex = ROUTINES[k].mobility[0]; if (!routine.find(e => e.id === ex.id)) routine.push({ ...ex, name: `${ex.name} (${m.subject})` }); } }
    });
    return routine;
  };

  // Rendu d'une routine globale — identique à l'original
  const renderGlobalRoutine = (title: string, exercises: Exercise[]) => (
    <div className="space-y-4 animate-in slide-in-from-right">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setActiveGlobalRoutine(null)} className="text-nexus-gray text-xs font-bold uppercase tracking-widest flex items-center gap-2"><span>←</span> Retour</button>
        <span className="text-nexus-gold text-xs font-bold uppercase px-3 py-1 bg-nexus-gold/10 rounded-full border border-nexus-gold/20">⏱ 15 Minutes</span>
      </div>
      <div className="mb-6"><h2 className="font-display text-3xl text-white uppercase">{title}</h2><p className="text-nexus-gray text-sm">Adapté à votre profil</p></div>
      {exercises.map((ex, idx) => (
        <GlassCard key={idx} className="p-5 border-l-2 border-l-nexus-red">
          <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-white uppercase tracking-wide text-lg">{ex.name}</h3></div>
          {ex.instructions && <p className="text-sm text-nexus-gray mb-4 italic pl-4 border-l border-nexus-gray/30">"{ex.instructions}"</p>}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[{l:'Séries',v:ex.sets},{l:'Reps',v:ex.reps},{l:'Repos',v:ex.rest},{l:'Tempo',v:ex.tempo}].map(({l,v})=>(
              <div key={l} className="bg-black/30 rounded-lg p-2 border border-white/5"><div className="text-nexus-gray uppercase text-[10px] mb-1">{l}</div><div className="text-white font-display font-bold text-lg">{v}</div></div>
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
    <div className="px-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 h-full flex flex-col">
      {!selectedJoint ? (
        <>
          {/* Routines rapides — identiques à l'original */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <GlassCard onClick={() => setActiveGlobalRoutine('PRE_MATCH')} className="p-3 text-center cursor-pointer hover:bg-white/5 flex flex-col items-center justify-center h-24 border-nexus-red/30 relative overflow-hidden" accentColor="nexus-red">
              <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-br from-nexus-red/10 to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-1 mb-1"><span className="text-sm">🔥</span><span className="font-display font-bold text-white text-[10px] uppercase tracking-wider">ROUTINE</span></div>
              <span className="font-display font-bold text-white uppercase text-lg leading-none">PRÉ-MATCH</span>
              <span className="text-[9px] text-nexus-gray mt-1">15 min</span>
            </GlassCard>
            <GlassCard onClick={() => setActiveGlobalRoutine('WARMUP')} className="p-3 text-center cursor-pointer hover:bg-white/5 flex flex-col items-center justify-center h-24 border-nexus-gold/30 relative overflow-hidden" accentColor="nexus-gold">
              <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-br from-nexus-gold/10 to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-1 mb-1"><span className="text-sm">⚡️</span><span className="font-display font-bold text-white text-[10px] uppercase tracking-wider">ROUTINE</span></div>
              <span className="font-display font-bold text-white uppercase text-lg leading-none">ÉCHAUFFEMENT</span>
              <span className="text-[9px] text-nexus-gray mt-1">15 min • Adapté</span>
            </GlassCard>
          </div>

          <div className="text-center mt-4 mb-1">
            <h2 className="font-display text-2xl text-white uppercase tracking-widest">Carte Corporelle</h2>
            <p className="text-nexus-gray text-[10px] tracking-[0.25em] uppercase font-medium">Touchez une zone douloureuse</p>
          </div>

          {/* Deux bonhommes côte à côte */}
          <div className="relative flex-1 flex items-start justify-around -mt-2">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(229,46,1,0.08),transparent_60%)] pointer-events-none" />
            <BodyFigure
              label="Articulations"
              dotColor="#E52E01"
              glowColor="#E52E01"
              pointsFront={JOINTS_FRONT}
              pointsBack={JOINTS_BACK}
              onSelect={setSelectedJoint}
            />
            <div className="w-px self-stretch bg-white/8 my-6" />
            <BodyFigure
              label="Muscles"
              dotColor="#3B82F6"
              glowColor="#3B82F6"
              pointsFront={MUSCLES_FRONT}
              pointsBack={MUSCLES_BACK}
              onSelect={setSelectedJoint}
            />
          </div>
        </>
      ) : !routineType ? (
        /* Choix mobilité/stretching — identique à l'original */
        <div className="space-y-6">
          <button onClick={() => setSelectedJoint(null)} className="text-nexus-gray text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><span>←</span> Retour Carte</button>
          <div className="text-center mb-8">
            <h2 className="font-display text-4xl text-white uppercase text-nexus-gold drop-shadow-lg">{selectedJoint}</h2>
            <p className="text-nexus-gray text-sm uppercase tracking-wide">Protocole Scientifique</p>
          </div>
          <div className="grid gap-6">
            <GlassCard onClick={() => setRoutineType('mobility')} className="p-8 text-center group hover:bg-white/5 border-l-4 border-l-nexus-gold" accentColor="nexus-gold">
              <h3 className="font-display text-2xl text-white uppercase mb-2">Mobilité</h3>
              <p className="text-nexus-gray text-xs uppercase tracking-wider">Amplitude & Activation • 15 min</p>
            </GlassCard>
            <GlassCard onClick={() => setRoutineType('stretching')} className="p-8 text-center group hover:bg-white/5 border-l-4 border-l-nexus-red" accentColor="nexus-red">
              <h3 className="font-display text-2xl text-white uppercase mb-2">Stretching</h3>
              <p className="text-nexus-gray text-xs uppercase tracking-wider">Détente & Décompression • 15 min</p>
            </GlassCard>
          </div>
        </div>
      ) : (
        /* Routine — identique à l'original */
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setRoutineType(null)} className="text-nexus-gray text-xs font-bold uppercase tracking-widest flex items-center gap-2"><span>←</span> Choix</button>
            <span className="text-nexus-red text-xs font-bold uppercase px-3 py-1 bg-nexus-red/10 rounded-full border border-nexus-red/20">Protocole</span>
          </div>
          <div className="mb-6">
            <h2 className="font-display text-3xl text-white uppercase">Routine {routineType === 'mobility' ? 'Mobilité' : 'Stretching'}</h2>
            <p className="text-nexus-gold font-display text-xl uppercase">{selectedJoint} • 15 min</p>
          </div>
          {getRoutine(selectedJoint, routineType).map((ex, idx) => (
            <GlassCard key={idx} className="p-5 border-l-2 border-l-white/20">
              <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-white uppercase tracking-wide text-lg">{ex.name}</h3></div>
              {ex.instructions && <p className="text-sm text-nexus-gray mb-4 italic pl-4 border-l border-nexus-gray/30">"{ex.instructions}"</p>}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[{l:'Séries',v:ex.sets},{l:'Reps',v:ex.reps},{l:'Repos',v:ex.rest},{l:'Tempo',v:ex.tempo}].map(({l,v})=>(
                  <div key={l} className="bg-black/30 rounded-lg p-2 border border-white/5"><div className="text-nexus-gray uppercase text-[10px] mb-1">{l}</div><div className="text-white font-display font-bold text-lg">{v}</div></div>
                ))}
              </div>
            </GlassCard>
          ))}
          <div className="pt-4">
            <Button fullWidth onClick={() => { setRoutineType(null); setSelectedJoint(null); }} className="bg-nexus-red shadow-[0_0_20px_rgba(229,46,1,0.4)]">Terminer la Routine</Button>
          </div>
        </div>
      )}
    </div>
  );
};
