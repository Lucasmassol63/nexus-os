import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Exercise, Athlete } from '../../types';

interface CareViewProps { athlete: Athlete; }

// ── DATA ──────────────────────────────────────────────────────────────────────
const PRE_MATCH_ROUTINE: Exercise[] = [
  { id:'pm1', name:'Réveil Fessier (Clamshells)', sets:2, reps:'15/côté', tempo:'Dynamique', rest:'0s', targetLoad:'Elastique', instructions:'Activation rapide des fessiers.' },
  { id:'pm2', name:'World\'s Greatest Stretch', sets:2, reps:'6/côté', tempo:'Fluide', rest:'0s', targetLoad:'PDC', instructions:'Grande fente avec rotation thoracique.' },
  { id:'pm3', name:'Sauts Pogo', sets:2, reps:'20', tempo:'Explosif', rest:'30s', targetLoad:'PDC', instructions:'Rebonds chevilles jambes tendues.' },
  { id:'pm4', name:'Shadow Boxing / Mouvements', sets:1, reps:'45s', tempo:'Rapide', rest:'0s', targetLoad:'PDC', instructions:'Monter le cardio progressivement.' },
];
const BASE_WARMUP: Exercise[] = [
  { id:'w1', name:'Rotations Articulaires (Cou, Epaules, Hanches)', sets:1, reps:'1 min', tempo:'Lent', rest:'0s', targetLoad:'PDC', instructions:'Réveil articulaire global.' },
  { id:'w2', name:'Squat Profond (Tenue)', sets:1, reps:'45s', tempo:'Statique', rest:'0s', targetLoad:'PDC', instructions:'Ouvrir les hanches en bas du squat.' },
];

const ROUTINES: Record<string, { mobility: Exercise[], stretching: Exercise[] }> = {
  'Cou': { mobility:[{id:'m1',name:'Rétraction Menton',sets:3,reps:'10',tempo:'2020',rest:'20s',targetLoad:'PDC',instructions:'Rentrer le menton (fléchisseurs profonds).'},{id:'m2',name:'Rotations Cou',sets:3,reps:'10',tempo:'Lent',rest:'20s',targetLoad:'PDC',instructions:'Rotation contrôlée G/D sans douleur.'}], stretching:[{id:'s1',name:'Étirement Trapèzes',sets:2,reps:'45s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Incliner la tête, épaule opposée basse.'},{id:'s2',name:'Élévateur Scapula',sets:2,reps:'45s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Regarder vers l\'aisselle, tirer doucement.'}] },
  'Epaule': { mobility:[{id:'m1',name:'Dislocations Bâton',sets:3,reps:'10',tempo:'Lent',rest:'30s',targetLoad:'Bâton',instructions:'Passer le bâton d\'avant en arrière bras tendus.'},{id:'m2',name:'Pompes Scapulaires',sets:3,reps:'12',tempo:'2020',rest:'30s',targetLoad:'PDC',instructions:'Serrer et écarter les omoplates bras tendus.'},{id:'m3',name:'Glissements Muraux',sets:3,reps:'10',tempo:'2020',rest:'30s',targetLoad:'PDC',instructions:'Dos au mur, glisser les bras vers le haut.'}], stretching:[{id:'s1',name:'Étirement Pectoraux',sets:2,reps:'45s',tempo:'Statique',rest:'20s',targetLoad:'PDC',instructions:'Main contre un mur, tourner le buste.'},{id:'s2',name:'Capsule Postérieure',sets:2,reps:'45s',tempo:'Statique',rest:'20s',targetLoad:'PDC',instructions:'Bras en écharpe devant la poitrine.'}] },
  'Coude': { mobility:[{id:'m1',name:'Distraction Élastique',sets:2,reps:'60s',tempo:'Statique',rest:'20s',targetLoad:'Élastique',instructions:'Elastique attaché haut, bras tendu, laisser tirer.'},{id:'m2',name:'Pro/Supination',sets:3,reps:'15',tempo:'2020',rest:'30s',targetLoad:'Léger',instructions:'Rotation du poignet avec marteau ou petit poids.'}], stretching:[{id:'s1',name:'Fléchisseurs Poignet',sets:2,reps:'45s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Bras tendu, paume vers l\'avant, tirer les doigts.'},{id:'s2',name:'Extenseurs Poignet',sets:2,reps:'45s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Dos de la main vers l\'avant, plier le poignet.'}] },
  'Poignet': { mobility:[{id:'m1',name:'Rotations Poignet (CARs)',sets:3,reps:'5/côté',tempo:'Très Lent',rest:'20s',targetLoad:'PDC',instructions:'Rotations articulaires maximales contrôlées.'},{id:'m2',name:'Pompes sur Poings',sets:2,reps:'10',tempo:'2020',rest:'30s',targetLoad:'PDC',instructions:'Sur les poings pour renforcer l\'alignement.'}], stretching:[{id:'s1',name:'Étirement Prière',sets:2,reps:'60s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Mains jointes devant le cœur, descendre.'},{id:'s2',name:'Prière Inversée',sets:2,reps:'60s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Dos des mains l\'un contre l\'autre.'}] },
  'Thorax': { mobility:[{id:'m1',name:'Livre Ouvert',sets:3,reps:'10/côté',tempo:'Lent',rest:'30s',targetLoad:'PDC',instructions:'Allongé côté, ouvrir le bras en suivant du regard.'},{id:'m2',name:'Extension Thoracique',sets:3,reps:'10',tempo:'Tenir 3s',rest:'30s',targetLoad:'Rouleau',instructions:'Rouleau sous les omoplates, extension arrière.'}], stretching:[{id:'s1',name:'Grand Dorsal Mur',sets:2,reps:'60s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Mains au mur, pousser les fesses en arrière.'},{id:'s2',name:'Suspension Barre',sets:3,reps:'30s',tempo:'Statique',rest:'20s',targetLoad:'PDC',instructions:'Suspendu pour décompresser.'}] },
  'Dos': { mobility:[{id:'m1',name:'Chat / Vache',sets:3,reps:'10',tempo:'Lent',rest:'20s',targetLoad:'PDC',instructions:'Alterner dos rond et dos creux.'},{id:'m2',name:'Jefferson Curl',sets:3,reps:'5',tempo:'5050',rest:'60s',targetLoad:'Léger',instructions:'Enroulement complet de la colonne.'}], stretching:[{id:'s1',name:'Posture de l\'Enfant',sets:2,reps:'60s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Fesses sur les talons, bras loin devant.'},{id:'s2',name:'Carré des Lombes',sets:2,reps:'45s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Étirement latéral du carré des lombaires.'}] },
  'Hanche': { mobility:[{id:'m1',name:'90/90 Switch',sets:3,reps:'8/côté',tempo:'Lent',rest:'30s',targetLoad:'PDC',instructions:'Rotation interne/externe des hanches au sol.'},{id:'m2',name:'Rotations Hanche',sets:3,reps:'5/côté',tempo:'Très Lent',rest:'30s',targetLoad:'PDC',instructions:'Grands cercles avec le genou.'}], stretching:[{id:'s1',name:'Étirement Psoas',sets:2,reps:'60s/côté',tempo:'Statique',rest:'20s',targetLoad:'PDC',instructions:'Genou au sol, pousser les hanches en avant.'},{id:'s2',name:'Posture du Pigeon',sets:2,reps:'60s/côté',tempo:'Statique',rest:'20s',targetLoad:'PDC',instructions:'Jambe pliée devant, jambe tendue derrière.'}] },
  'Genou': { mobility:[{id:'m1',name:'Rotation Tibiale',sets:3,reps:'10',tempo:'Lent',rest:'20s',targetLoad:'PDC',instructions:'Assis, tourner le pied int/ext en bloquant le fémur.'},{id:'m2',name:'Step-up Petersen',sets:3,reps:'12',tempo:'2010',rest:'30s',targetLoad:'PDC',instructions:'Montée sur pointe de pied sur petite marche.'}], stretching:[{id:'s1',name:'Étirement Quadriceps',sets:2,reps:'60s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Talon fesse debout.'},{id:'s2',name:'Ischio-Jambiers',sets:2,reps:'60s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Jambe surélevée, dos droit.'}] },
  'Cheville': { mobility:[{id:'m1',name:'Genou au Mur (Dorsiflexion)',sets:3,reps:'10',tempo:'Tenir 2s',rest:'20s',targetLoad:'PDC',instructions:'Avancer le genou sans décoller le talon.'},{id:'m2',name:'Rotations Cheville (CARs)',sets:3,reps:'10/côté',tempo:'Lent',rest:'20s',targetLoad:'PDC',instructions:'Rotations maximales de la cheville.'}], stretching:[{id:'s1',name:'Étirement Mollet',sets:2,reps:'60s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Pousser le mur, jambe arrière tendue.'},{id:'s2',name:'Étirement Soléaire',sets:2,reps:'60s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Même chose genou fléchi.'}] },
  'Quadriceps': { mobility:[{id:'m1',name:'Step-up Petersen',sets:3,reps:'12',tempo:'2010',rest:'30s',targetLoad:'PDC',instructions:'Montée sur pointe de pied, active le vaste interne.'},{id:'m2',name:'Squat Tempo',sets:3,reps:'8',tempo:'4010',rest:'60s',targetLoad:'PDC',instructions:'Descente lente 4s pour charger les quadriceps.'}], stretching:[{id:'s1',name:'Quadriceps Debout',sets:2,reps:'60s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Talon fesse, genou aligné.'},{id:'s2',name:'Quad Couché',sets:2,reps:'60s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Allongé sur le ventre, tirer le pied vers les fesses.'}] },
  'Ischio-jambiers': { mobility:[{id:'m1',name:'Nordic Curl Assisté',sets:3,reps:'6',tempo:'Lent',rest:'90s',targetLoad:'PDC',instructions:'Descente la plus lente possible, remontée bras.'},{id:'m2',name:'RDL Léger',sets:3,reps:'10',tempo:'3010',rest:'60s',targetLoad:'Léger',instructions:'Charnière hanche, dos plat, étirer les ischios.'}], stretching:[{id:'s1',name:'Ischio Debout',sets:2,reps:'60s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Jambe surélevée, dos droit.'},{id:'s2',name:'Étirement Allongé',sets:2,reps:'60s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Jambe tirée vers le haut, genou tendu.'}] },
  'Fessiers': { mobility:[{id:'m1',name:'90/90 Switch',sets:3,reps:'8/côté',tempo:'Lent',rest:'30s',targetLoad:'PDC',instructions:'Rotation interne/externe des hanches au sol.'},{id:'m2',name:'Hip Thrust Activation',sets:3,reps:'15',tempo:'2120',rest:'45s',targetLoad:'PDC/Bande',instructions:'Activer les fessiers, tenir 1s en haut.'}], stretching:[{id:'s1',name:'Posture du Pigeon',sets:2,reps:'90s/côté',tempo:'Statique',rest:'20s',targetLoad:'PDC',instructions:'Jambe pliée devant, jambe tendue derrière.'},{id:'s2',name:'Figure 4 Allongé',sets:2,reps:'60s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Cheville sur le genou opposé, tirer la jambe.'}] },
  'Adducteurs': { mobility:[{id:'m1',name:'Cossack Squat',sets:3,reps:'8/côté',tempo:'Lent',rest:'45s',targetLoad:'PDC',instructions:'Descendre sur un côté, talon au sol, jambe opposée tendue.'},{id:'m2',name:'Monster Walk Latéral',sets:3,reps:'15/côté',tempo:'Dynamique',rest:'30s',targetLoad:'Bande',instructions:'Bande aux genoux, pas latéraux contrôlés.'}], stretching:[{id:'s1',name:'Stretch Papillon',sets:2,reps:'90s',tempo:'Statique',rest:'20s',targetLoad:'PDC',instructions:'Plantes des pieds jointes, genoux vers le sol.'},{id:'s2',name:'Étirement Cavalier',sets:2,reps:'60s/côté',tempo:'Statique',rest:'20s',targetLoad:'PDC',instructions:'Ouverture latérale des jambes.'}] },
  'Mollets': { mobility:[{id:'m1',name:'Calf Raise Unilatéral',sets:3,reps:'15/côté',tempo:'2121',rest:'45s',targetLoad:'PDC',instructions:'Sur le bord d\'une marche, amplitude maximale.'},{id:'m2',name:'Sauts Pogo',sets:3,reps:'30s',tempo:'Léger',rest:'30s',targetLoad:'PDC',instructions:'Rebonds légers sur les pointes, genoux souples.'}], stretching:[{id:'s1',name:'Étirement Gastrocnémien',sets:2,reps:'60s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Pousser le mur, jambe arrière tendue.'},{id:'s2',name:'Étirement Soléaire',sets:2,reps:'60s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Genou arrière légèrement fléchi.'}] },
  'Trapèzes': { mobility:[{id:'m1',name:'Rouleau Dorsale',sets:2,reps:'60s',tempo:'Lent',rest:'20s',targetLoad:'Foam roller',instructions:'Rouleau sous les trapèzes, relâcher progressivement.'},{id:'m2',name:'Haussements lents',sets:3,reps:'10',tempo:'3030',rest:'30s',targetLoad:'PDC',instructions:'Montée lente, tenue 3s, descente contrôlée.'}], stretching:[{id:'s1',name:'Étirement Croisé Épaule',sets:2,reps:'45s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Bras en écharpe, pousser contre la poitrine.'},{id:'s2',name:'Stretch Trapèze Assis',sets:2,reps:'45s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Main sur la tête, incliner doucement.'}] },
  'Lombaires': { mobility:[{id:'m1',name:'Chat / Vache',sets:3,reps:'10',tempo:'Lent',rest:'20s',targetLoad:'PDC',instructions:'Alterner dos rond et dos creux.'},{id:'m2',name:'Jefferson Curl',sets:3,reps:'5',tempo:'5050',rest:'60s',targetLoad:'Léger',instructions:'Enroulement complet de la colonne.'}], stretching:[{id:'s1',name:'Posture de l\'Enfant',sets:2,reps:'60s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Fesses sur les talons, bras loin devant.'},{id:'s2',name:'Carré des Lombes',sets:2,reps:'45s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Étirement latéral du carré des lombaires.'}] },
  'Pectoraux': { mobility:[{id:'m1',name:'Fly avec Bandes',sets:3,reps:'12',tempo:'3010',rest:'30s',targetLoad:'Bandes',instructions:'Ouverture contrôlée en écarté, bandes légères.'},{id:'m2',name:'Push-up Archer',sets:3,reps:'8/côté',tempo:'2010',rest:'45s',targetLoad:'PDC',instructions:'Pompe en s\'écartant d\'un côté à l\'autre.'}], stretching:[{id:'s1',name:'Étirement Pec Mur',sets:2,reps:'45s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Main au mur à hauteur d\'épaule, tourner le buste.'},{id:'s2',name:'Doorway Stretch',sets:2,reps:'60s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Avant-bras sur le cadre de porte, se pencher en avant.'}] },
  'Biceps': { mobility:[{id:'m1',name:'Curl Excentrique Lent',sets:3,reps:'8',tempo:'4010',rest:'45s',targetLoad:'Léger',instructions:'Montée normale, descente sur 4 secondes.'},{id:'m2',name:'Flexion Marteau',sets:3,reps:'10',tempo:'2020',rest:'30s',targetLoad:'Léger',instructions:'Prise neutre, contrôle en descente.'}], stretching:[{id:'s1',name:'Étirement Biceps Mur',sets:2,reps:'45s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Bras tendu paume au mur, tourner le corps à l\'opposé.'},{id:'s2',name:'Étirement Supination',sets:2,reps:'30s/côté',tempo:'Statique',rest:'10s',targetLoad:'PDC',instructions:'Bras tendu, tourner le poignet vers le bas.'}] },
  'Triceps': { mobility:[{id:'m1',name:'Tricep Overhead Extension',sets:3,reps:'12',tempo:'2020',rest:'30s',targetLoad:'Léger',instructions:'Extension au-dessus de la tête, coude stable.'},{id:'m2',name:'Diamond Push-up',sets:3,reps:'10',tempo:'2010',rest:'45s',targetLoad:'PDC',instructions:'Mains en diamant, coudes près du corps.'}], stretching:[{id:'s1',name:'Étirement Triceps Overhead',sets:2,reps:'45s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Bras plié derrière la tête, pousser le coude vers le bas.'},{id:'s2',name:'Cross-body Tricep',sets:2,reps:'30s/côté',tempo:'Statique',rest:'10s',targetLoad:'PDC',instructions:'Bras en écharpe, étirer la face postérieure.'}] },
  'Deltoïdes': { mobility:[{id:'m1',name:'Cercles d\'Épaule',sets:2,reps:'10/sens',tempo:'Lent',rest:'20s',targetLoad:'PDC',instructions:'Grands cercles contrôlés bras le long du corps.'},{id:'m2',name:'Face Pull Bandes',sets:3,reps:'15',tempo:'2020',rest:'30s',targetLoad:'Bandes',instructions:'Tirer vers le visage, ouverture maximale.'}], stretching:[{id:'s1',name:'Cross-body Shoulder',sets:2,reps:'45s/côté',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Bras croisé devant la poitrine, tirer vers l\'épaule opposée.'},{id:'s2',name:'Stretch Deltoïde Post',sets:2,reps:'30s/côté',tempo:'Statique',rest:'10s',targetLoad:'PDC',instructions:'Bras dans le dos, tirer vers le haut avec l\'autre main.'}] },
  'Grand dorsal': { mobility:[{id:'m1',name:'Pull-up Négatif',sets:3,reps:'5',tempo:'5000',rest:'60s',targetLoad:'PDC',instructions:'Descente très lente de la barre fixe.'},{id:'m2',name:'Lat Pulldown Léger',sets:3,reps:'12',tempo:'3010',rest:'30s',targetLoad:'Léger',instructions:'Tirer vers la poitrine, coudes vers le sol.'}], stretching:[{id:'s1',name:'Grand Dorsal Mur',sets:2,reps:'60s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Mains au mur, pousser les fesses en arrière.'},{id:'s2',name:'Suspension Barre',sets:3,reps:'30s',tempo:'Statique',rest:'20s',targetLoad:'PDC',instructions:'Suspendu à une barre, laisser le corps s\'allonger.'}] },
  'Abdominaux': { mobility:[{id:'m1',name:'Hollow Body Hold',sets:3,reps:'30s',tempo:'Statique',rest:'30s',targetLoad:'PDC',instructions:'Corps en forme de banane creuse, lombaires au sol.'},{id:'m2',name:'Dead Bug',sets:3,reps:'10/côté',tempo:'Lent',rest:'30s',targetLoad:'PDC',instructions:'Bras et jambe opposés, dos plat au sol.'}], stretching:[{id:'s1',name:'Cobra Yoga',sets:2,reps:'45s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Allongé ventre, mains au sol, pousser le buste vers le haut.'},{id:'s2',name:'Bridge Hold',sets:2,reps:'30s',tempo:'Statique',rest:'15s',targetLoad:'PDC',instructions:'Pont complet, ouverture de la cage thoracique.'}] },
};

// Points articulations face/dos
const JOINTS_FRONT = [
  {id:'Cou',x:50,y:11},{id:'Epaule',x:30,y:17},{id:'Epaule',x:70,y:17},
  {id:'Coude',x:28,y:33},{id:'Coude',x:72,y:33},{id:'Poignet',x:25,y:48},{id:'Poignet',x:75,y:48},
  {id:'Thorax',x:50,y:24},{id:'Hanche',x:42,y:53},{id:'Hanche',x:58,y:53},
  {id:'Genou',x:38,y:72},{id:'Genou',x:62,y:72},{id:'Cheville',x:38,y:91},{id:'Cheville',x:62,y:91},
];
const JOINTS_BACK = [
  {id:'Cou',x:50,y:11},{id:'Epaule',x:30,y:17},{id:'Epaule',x:70,y:17},
  {id:'Coude',x:28,y:33},{id:'Coude',x:72,y:33},{id:'Poignet',x:25,y:48},{id:'Poignet',x:75,y:48},
  {id:'Dos',x:50,y:30},{id:'Hanche',x:42,y:53},{id:'Hanche',x:58,y:53},
  {id:'Genou',x:38,y:72},{id:'Genou',x:62,y:72},{id:'Cheville',x:38,y:91},{id:'Cheville',x:62,y:91},
];

// Points muscles face/dos (beaucoup plus complets)
const MUSCLES_FRONT = [
  {id:'Pectoraux',x:40,y:21},{id:'Pectoraux',x:60,y:21},
  {id:'Deltoïdes',x:28,y:19},{id:'Deltoïdes',x:72,y:19},
  {id:'Biceps',x:26,y:29},{id:'Biceps',x:74,y:29},
  {id:'Triceps',x:22,y:29},{id:'Triceps',x:78,y:29},
  {id:'Grand dorsal',x:35,y:30},{id:'Grand dorsal',x:65,y:30},
  {id:'Abdominaux',x:50,y:33},
  {id:'Adducteurs',x:50,y:57},
  {id:'Quadriceps',x:37,y:65},{id:'Quadriceps',x:63,y:65},
  {id:'Mollets',x:36,y:82},{id:'Mollets',x:64,y:82},
];
const MUSCLES_BACK = [
  {id:'Trapèzes',x:50,y:18},
  {id:'Deltoïdes',x:28,y:19},{id:'Deltoïdes',x:72,y:19},
  {id:'Grand dorsal',x:40,y:28},{id:'Grand dorsal',x:60,y:28},
  {id:'Triceps',x:22,y:29},{id:'Triceps',x:78,y:29},
  {id:'Lombaires',x:50,y:40},
  {id:'Fessiers',x:40,y:56},{id:'Fessiers',x:60,y:56},
  {id:'Ischio-jambiers',x:38,y:67},{id:'Ischio-jambiers',x:62,y:67},
  {id:'Mollets',x:36,y:82},{id:'Mollets',x:64,y:82},
];

// SVG original inchangé
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

// ── ROUTINE PLAYER DYNAMIQUE ──────────────────────────────────────────────────
const parseRestSeconds = (rest: string): number => {
  if (!rest || rest === '0s') return 0;
  const m = rest.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
};

const RoutinePlayer: React.FC<{
  title: string;
  exercises: Exercise[];
  onDone: () => void;
}> = ({ title, exercises, onDone }) => {
  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [phase, setPhase] = useState<'exercise' | 'rest'>('exercise');
  const [restLeft, setRestLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ex = exercises[exIdx];
  const totalSets = ex?.sets ?? 1;
  const restSecs = parseRestSeconds(ex?.rest ?? '0s');
  const totalExercises = exercises.length;

  // Progress
  const completedSets = exercises.slice(0, exIdx).reduce((a, e) => a + e.sets, 0) + setIdx;
  const totalAllSets = exercises.reduce((a, e) => a + e.sets, 0);
  const progress = Math.round((completedSets / totalAllSets) * 100);

  // Timer countdown
  useEffect(() => {
    if (phase === 'rest' && restLeft > 0) {
      timerRef.current = setInterval(() => {
        setRestLeft(r => {
          if (r <= 1) {
            clearInterval(timerRef.current!);
            advanceAfterRest();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, restLeft]);

  const advanceAfterRest = () => {
    const nextSet = setIdx + 1;
    if (nextSet < totalSets) {
      setSetIdx(nextSet);
      setPhase('exercise');
    } else {
      const nextEx = exIdx + 1;
      if (nextEx < totalExercises) {
        setExIdx(nextEx);
        setSetIdx(0);
        setPhase('exercise');
      } else {
        onDone();
      }
    }
  };

  const handleDoneSet = () => {
    if (restSecs > 0) {
      setPhase('rest');
      setRestLeft(restSecs);
    } else {
      advanceAfterRest();
    }
  };

  const skipRest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    advanceAfterRest();
  };

  if (!ex) return null;

  const restPct = restSecs > 0 ? ((restSecs - restLeft) / restSecs) * 100 : 0;

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-white uppercase">{title}</h2>
          <p className="text-nexus-gold text-sm font-bold uppercase">
            Exercice {exIdx + 1}/{totalExercises} · Série {setIdx + 1}/{totalSets}
          </p>
        </div>
        <span className="text-[10px] text-nexus-gray uppercase px-3 py-1 bg-white/5 rounded-full border border-white/10">{progress}% terminé</span>
      </div>

      {/* Progress bar globale */}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-nexus-gold rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Exercices à venir */}
      {exIdx < totalExercises - 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {exercises.slice(exIdx + 1).map((e, i) => (
            <div key={i} className="shrink-0 text-[9px] bg-white/5 border border-white/8 rounded-lg px-2 py-1 text-nexus-gray">
              {e.name.split(' ')[0]}
            </div>
          ))}
        </div>
      )}

      {phase === 'exercise' ? (
        /* ── PHASE EXERCICE ── */
        <div className="space-y-4">
          {/* Carte exercice principale */}
          <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'rgba(232,184,0,0.06)' }}>
            <h3 className="font-display text-2xl text-white uppercase mb-1">{ex.name}</h3>
            {ex.instructions && (
              <p className="text-sm text-nexus-gray italic mb-4 pl-3 border-l-2 border-nexus-gold/40">{ex.instructions}</p>
            )}
            {/* Métriques */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { l: 'Séries', v: `${setIdx + 1}/${totalSets}`, hi: true },
                { l: 'Reps', v: ex.reps },
                { l: 'Tempo', v: ex.tempo },
                { l: 'Charge', v: ex.targetLoad },
              ].map(({ l, v, hi }) => (
                <div key={l} className={`rounded-xl p-3 text-center border ${hi ? 'bg-nexus-gold/15 border-nexus-gold/30' : 'bg-black/30 border-white/5'}`}>
                  <div className="text-[9px] text-nexus-gray uppercase mb-1">{l}</div>
                  <div className={`font-display font-bold text-lg ${hi ? 'text-nexus-gold' : 'text-white'}`}>{v}</div>
                </div>
              ))}
            </div>
            {/* Indicateur séries visuelles */}
            <div className="flex gap-1.5 mb-5">
              {Array.from({ length: totalSets }).map((_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full transition-all ${i < setIdx ? 'bg-nexus-gold' : i === setIdx ? 'bg-nexus-gold/60 animate-pulse' : 'bg-white/15'}`} />
              ))}
            </div>
          </div>
          <button onClick={handleDoneSet}
            className="w-full py-5 rounded-2xl font-display font-bold uppercase tracking-widest text-lg text-black transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #E8B800, #F5D000)', boxShadow: '0 0 30px rgba(232,184,0,0.3)' }}>
            ✓ Série terminée{restSecs > 0 ? ` · Repos ${ex.rest}` : ''}
          </button>
        </div>
      ) : (
        /* ── PHASE REPOS ── */
        <div className="space-y-4">
          <div className="rounded-2xl p-8 text-center border border-blue-500/20" style={{ background: 'rgba(59,130,246,0.06)' }}>
            <p className="text-[10px] text-nexus-gray uppercase tracking-widest mb-2">Temps de repos</p>
            {/* Cercle timer */}
            <div className="relative mx-auto mb-6" style={{ width: '140px', height: '140px' }}>
              <svg viewBox="0 0 140 140" className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle cx="70" cy="70" r="60" fill="none" stroke="#3B82F6" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  strokeDashoffset={`${2 * Math.PI * 60 * (1 - restPct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-5xl font-bold text-white">{restLeft}</span>
                <span className="text-[10px] text-nexus-gray uppercase">secondes</span>
              </div>
            </div>
            {/* Prochain exercice/série */}
            <div className="text-sm text-nexus-gray">
              {setIdx + 1 < totalSets ? (
                <><span className="text-white font-bold">Série {setIdx + 2}/{totalSets}</span> · {ex.name}</>
              ) : exIdx + 1 < totalExercises ? (
                <><span className="text-nexus-gold font-bold">Prochain :</span> {exercises[exIdx + 1].name}</>
              ) : (
                <span className="text-green-400 font-bold">Dernière série !</span>
              )}
            </div>
          </div>
          <button onClick={skipRest}
            className="w-full py-3 rounded-xl border border-white/15 text-nexus-gray hover:text-white hover:bg-white/5 text-sm font-bold uppercase transition-all">
            Passer le repos →
          </button>
        </div>
      )}
    </div>
  );
};

// ── FIGURE CORPORELLE ─────────────────────────────────────────────────────────
interface FigureProps {
  label: string; color: string;
  front: { id: string; x: number; y: number }[];
  back: { id: string; x: number; y: number }[];
  onSelect: (id: string) => void;
}
const BodyFigure: React.FC<FigureProps> = ({ label, color, front, back, onSelect }) => {
  const [view, setView] = useState<'face' | 'dos'>('face');
  const pts = view === 'face' ? front : back;
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
      <div className="flex rounded-lg overflow-hidden border border-white/10">
        {(['face', 'dos'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className="text-[7px] font-bold uppercase px-2.5 py-1 transition-colors"
            style={{ backgroundColor: view === v ? color : 'transparent', color: view === v ? '#000' : 'rgba(255,255,255,0.35)' }}>
            {v}
          </button>
        ))}
      </div>
      <div className="relative w-full" style={{ maxWidth: '115px', aspectRatio: '200/450' }}>
        <BodySVG />
        {pts.map((pt, idx) => (
          <button key={`${pt.id}-${idx}`} onClick={() => onSelect(pt.id)}
            className="absolute flex items-center justify-center group z-10"
            style={{ left: `${pt.x}%`, top: `${pt.y}%`, width: '34px', height: '34px', marginLeft: '-17px', marginTop: '-17px' }}>
            <div className="absolute w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color + '20' }} />
            <div className="w-3.5 h-3.5 rounded-full border border-white/40 group-hover:scale-150 transition-transform duration-200"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
          </button>
        ))}
      </div>
    </div>
  );
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
export const CareView: React.FC<CareViewProps> = ({ athlete }) => {
  const [selectedJoint, setSelectedJoint] = useState<string | null>(null);
  const [routineType, setRoutineType] = useState<'mobility' | 'stretching' | null>(null);
  const [playing, setPlaying] = useState(false);
  const [activeGlobalRoutine, setActiveGlobalRoutine] = useState<string | null>(null);

  const getRoutine = (joint: string, type: 'mobility' | 'stretching') =>
    ROUTINES[joint]?.[type] || ROUTINES['Epaule'][type];

  const generateWarmUp = (): Exercise[] => {
    let r = [...BASE_WARMUP];
    const map: Record<string, string> = { 'Cheville G':'Cheville','Cheville D':'Cheville','Hanche G':'Hanche','Hanche D':'Hanche','Epaule G':'Epaule','Epaule D':'Epaule','Adducteur':'Hanche' };
    athlete.performance.flexibility.forEach(m => {
      if (m.A < 75) { const k = map[m.subject]; if (k && ROUTINES[k]) { const ex = ROUTINES[k].mobility[0]; if (!r.find(e => e.id === ex.id)) r.push({ ...ex, name: `${ex.name} (${m.subject})` }); } }
    });
    return r;
  };

  // Routine player pour routines globales
  const renderGlobalPlayer = (title: string, exercises: Exercise[]) => (
    playing
      ? <RoutinePlayer title={title} exercises={exercises} onDone={() => { setPlaying(false); setActiveGlobalRoutine(null); }} />
      : (
        <div className="space-y-4 animate-in slide-in-from-right">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setActiveGlobalRoutine(null)} className="text-nexus-gray text-xs font-bold uppercase flex items-center gap-2">← Retour</button>
            <span className="text-nexus-gold text-xs font-bold uppercase px-3 py-1 bg-nexus-gold/10 rounded-full border border-nexus-gold/20">⏱ {exercises.length} exercices</span>
          </div>
          <div className="mb-4"><h2 className="font-display text-3xl text-white uppercase">{title}</h2><p className="text-nexus-gray text-sm">Adapté à votre profil</p></div>
          {exercises.map((ex, idx) => (
            <GlassCard key={idx} className="p-4 border-l-2 border-l-nexus-red">
              <h3 className="font-bold text-white uppercase text-sm mb-2">{ex.name}</h3>
              {ex.instructions && <p className="text-xs text-nexus-gray mb-3 italic pl-3 border-l border-nexus-gray/30">{ex.instructions}</p>}
              <div className="grid grid-cols-4 gap-2 text-center">
                {[{l:'Séries',v:ex.sets},{l:'Reps',v:ex.reps},{l:'Repos',v:ex.rest},{l:'Tempo',v:ex.tempo}].map(({l,v})=>(
                  <div key={l} className="bg-black/30 rounded-lg p-2 border border-white/5">
                    <div className="text-nexus-gray uppercase text-[9px] mb-0.5">{l}</div>
                    <div className="text-white font-display font-bold">{v}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
          <Button fullWidth onClick={() => setPlaying(true)} className="bg-nexus-red shadow-[0_0_20px_rgba(229,46,1,0.4)] py-5 text-lg">
            ▶ Démarrer la routine
          </Button>
        </div>
      )
  );

  if (activeGlobalRoutine === 'PRE_MATCH') return <div className="px-6 pb-24 animate-in fade-in">{renderGlobalPlayer('Routine Pré-Match', PRE_MATCH_ROUTINE)}</div>;
  if (activeGlobalRoutine === 'WARMUP') return <div className="px-6 pb-24 animate-in fade-in">{renderGlobalPlayer('Routine Échauffement', generateWarmUp())}</div>;

  // Routine joint/muscle player
  if (selectedJoint && routineType) {
    const exercises = getRoutine(selectedJoint, routineType);
    return (
      <div className="px-6 pb-24 animate-in fade-in">
        {playing ? (
          <RoutinePlayer
            title={`${routineType === 'mobility' ? 'Mobilité' : 'Stretching'} · ${selectedJoint}`}
            exercises={exercises}
            onDone={() => { setPlaying(false); setRoutineType(null); setSelectedJoint(null); }}
          />
        ) : (
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setRoutineType(null)} className="text-nexus-gray text-xs font-bold uppercase flex items-center gap-2">← Choix</button>
              <span className="text-nexus-red text-xs font-bold uppercase px-3 py-1 bg-nexus-red/10 rounded-full border border-nexus-red/20">Protocole</span>
            </div>
            <div className="mb-4">
              <h2 className="font-display text-3xl text-white uppercase">Routine {routineType === 'mobility' ? 'Mobilité' : 'Stretching'}</h2>
              <p className="text-nexus-gold font-display text-xl uppercase">{selectedJoint} · 15 min</p>
            </div>
            {exercises.map((ex, idx) => (
              <GlassCard key={idx} className="p-5 border-l-2 border-l-white/20">
                <h3 className="font-bold text-white uppercase tracking-wide text-lg mb-2">{ex.name}</h3>
                {ex.instructions && <p className="text-sm text-nexus-gray mb-4 italic pl-4 border-l border-nexus-gray/30">"{ex.instructions}"</p>}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[{l:'Séries',v:ex.sets},{l:'Reps',v:ex.reps},{l:'Repos',v:ex.rest},{l:'Tempo',v:ex.tempo}].map(({l,v})=>(
                    <div key={l} className="bg-black/30 rounded-lg p-2 border border-white/5">
                      <div className="text-nexus-gray uppercase text-[10px] mb-1">{l}</div>
                      <div className="text-white font-display font-bold text-lg">{v}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
            <Button fullWidth onClick={() => setPlaying(true)} className="bg-nexus-red shadow-[0_0_20px_rgba(229,46,1,0.4)] py-5 text-lg mt-4">
              ▶ Démarrer la routine
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (selectedJoint && !routineType) return (
    <div className="px-6 pb-24 animate-in fade-in space-y-6 mt-4">
      <button onClick={() => setSelectedJoint(null)} className="text-nexus-gray text-xs font-bold uppercase flex items-center gap-2">← Retour Carte</button>
      <div className="text-center mb-8">
        <h2 className="font-display text-4xl text-nexus-gold uppercase drop-shadow-lg">{selectedJoint}</h2>
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
  );

  return (
    <div className="px-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 h-full flex flex-col">
      {/* Routines rapides */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <GlassCard onClick={() => { setActiveGlobalRoutine('PRE_MATCH'); setPlaying(false); }} className="p-3 text-center cursor-pointer hover:bg-white/5 flex flex-col items-center justify-center h-24 border-nexus-red/30 relative overflow-hidden" accentColor="nexus-red">
          <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-br from-nexus-red/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center gap-1 mb-1"><span className="text-sm">🔥</span><span className="font-display font-bold text-white text-[10px] uppercase tracking-wider">ROUTINE</span></div>
          <span className="font-display font-bold text-white uppercase text-lg leading-none">PRÉ-MATCH</span>
          <span className="text-[9px] text-nexus-gray mt-1">15 min</span>
        </GlassCard>
        <GlassCard onClick={() => { setActiveGlobalRoutine('WARMUP'); setPlaying(false); }} className="p-3 text-center cursor-pointer hover:bg-white/5 flex flex-col items-center justify-center h-24 border-nexus-gold/30 relative overflow-hidden" accentColor="nexus-gold">
          <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-br from-nexus-gold/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center gap-1 mb-1"><span className="text-sm">⚡️</span><span className="font-display font-bold text-white text-[10px] uppercase tracking-wider">ROUTINE</span></div>
          <span className="font-display font-bold text-white uppercase text-lg leading-none">ÉCHAUFFEMENT</span>
          <span className="text-[9px] text-nexus-gray mt-1">15 min • Adapté</span>
        </GlassCard>
      </div>

      <div className="text-center mt-2 mb-1">
        <h2 className="font-display text-2xl text-white uppercase tracking-widest">Carte Corporelle</h2>
        <p className="text-nexus-gray text-[10px] tracking-[0.25em] uppercase font-medium">Touchez une zone douloureuse</p>
      </div>

      <div className="relative flex-1 flex items-start justify-around -mt-2">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(229,46,1,0.08),transparent_60%)] pointer-events-none" />
        <BodyFigure label="Articulations" color="#E52E01" front={JOINTS_FRONT} back={JOINTS_BACK} onSelect={id => { setSelectedJoint(id); setRoutineType(null); setPlaying(false); }} />
        <div className="w-px self-stretch bg-white/8 my-6" />
        <BodyFigure label="Muscles" color="#3B82F6" front={MUSCLES_FRONT} back={MUSCLES_BACK} onSelect={id => { setSelectedJoint(id); setRoutineType(null); setPlaying(false); }} />
      </div>
    </div>
  );
};
