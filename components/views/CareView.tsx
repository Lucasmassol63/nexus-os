import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Exercise, Athlete } from '../../types';

interface CareViewProps {
  athlete: Athlete;
}

// Global Routines
const PRE_MATCH_ROUTINE: Exercise[] = [
  { id: 'pm1', name: 'Réveil Fessier (Clamshells)', sets: 2, reps: '15/côté', tempo: 'Dynamique', rest: '0s', targetLoad: 'Elastique', instructions: 'Activation rapide des fessiers.' },
  { id: 'pm2', name: 'World\'s Greatest Stretch', sets: 2, reps: '6/côté', tempo: 'Fluide', rest: '0s', targetLoad: 'PDC', instructions: 'Grande fente avec rotation thoracique.' },
  { id: 'pm3', name: 'Sauts Pogo', sets: 2, reps: '20', tempo: 'Explosif', rest: '30s', targetLoad: 'PDC', instructions: 'Rebonds chevilles jambes tendues.' },
  { id: 'pm4', name: 'Shadow Boxing / Mouvements', sets: 1, reps: '45s', tempo: 'Rapide', rest: '0s', targetLoad: 'PDC', instructions: 'Monter le cardio progressivement.' }
];

const BASE_WARMUP: Exercise[] = [
  { id: 'w1', name: 'Rotations Articulaires (Cou, Epaules, Hanches)', sets: 1, reps: '1 min', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Réveil articulaire global.' },
  { id: 'w2', name: 'Squat Profond (Tenue)', sets: 1, reps: '45s', tempo: 'Statique', rest: '0s', targetLoad: 'PDC', instructions: 'Ouvrir les hanches en bas du squat.' }
];

// Mock Routines Data - SCIENCE BASED PROTOCOLS
const ROUTINES: Record<string, { mobility: Exercise[], stretching: Exercise[] }> = {
  'Cou': {
    mobility: [
      { id: 'm1', name: 'Rétraction Menton', sets: 3, reps: '10', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Rentrer le menton pour créer un double menton (Fléchisseurs profonds).' },
      { id: 'm2', name: 'Rotations Cou', sets: 3, reps: '10', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotation contrôlée gauche/droite sans douleur.' }
    ],
    stretching: [
      { id: 's1', name: 'Étirement Trapèzes', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Incliner la tête sur le côté, épaule opposée basse.' },
      { id: 's2', name: 'Élévateur Scapula', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Regarder vers l\'aisselle et tirer doucement la tête.' }
    ]
  },
  'Epaule': {
    mobility: [
      { id: 'm1', name: 'Dislocations Bâton', sets: 3, reps: '10', tempo: 'Lent', rest: '0s', targetLoad: 'Bâton', instructions: 'Passer le bâton d\'avant en arrière bras tendus.' },
      { id: 'm2', name: 'Pompes Scapulaires', sets: 3, reps: '12', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Serrer et écarter les omoplates bras tendus.' },
      { id: 'm3', name: 'Glissements Muraux', sets: 3, reps: '10', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Dos au mur, glisser les bras vers le haut.' }
    ],
    stretching: [
      { id: 's1', name: 'Étirement Pectoraux', sets: 2, reps: '45s', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Main contre un mur, tourner le buste opposé.' },
      { id: 's2', name: 'Capsule Postérieure', sets: 2, reps: '45s', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Bras en écharpe devant la poitrine.' }
    ]
  },
  'Coude': {
    mobility: [
      { id: 'm1', name: 'Distraction Élastique', sets: 2, reps: '60s', tempo: 'Statique', rest: '0s', targetLoad: 'Élastique', instructions: 'Elastique attaché haut, bras tendu, laisser tirer.' },
      { id: 'm2', name: 'Pro/Supination', sets: 3, reps: '15', tempo: '2020', rest: '0s', targetLoad: 'Léger', instructions: 'Rotation du poignet avec marteau ou petit poids.' }
    ],
    stretching: [
      { id: 's1', name: 'Fléchisseurs Poignet', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Bras tendu, paume vers l\'avant, tirer les doigts.' },
      { id: 's2', name: 'Extenseurs Poignet', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Bras tendu, dos de la main vers l\'avant, plier le poignet.' }
    ]
  },
  'Poignet': {
    mobility: [
      { id: 'm1', name: 'Rotations Poignet', sets: 3, reps: '5/côté', tempo: 'Très Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotations articulaires contrôlées maximales (CARs).' },
      { id: 'm2', name: 'Pompes sur Poings', sets: 2, reps: '10', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Sur les poings pour renforcer l\'alignement.' }
    ],
    stretching: [
      { id: 's1', name: 'Étirement Prière', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Mains jointes devant le coeur, descendre les mains.' },
      { id: 's2', name: 'Prière Inversée', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Dos des mains l\'un contre l\'autre.' }
    ]
  },
  'Thorax': {
    mobility: [
      { id: 'm1', name: 'Livre Ouvert', sets: 3, reps: '10/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Allongé côté, ouvrir le bras en suivant du regard.' },
      { id: 'm2', name: 'Extension Thoracique', sets: 3, reps: '10', tempo: 'Tenir 3s', rest: '0s', targetLoad: 'Rouleau', instructions: 'Rouleau sous les omoplates, extension arrière.' }
    ],
    stretching: [
      { id: 's1', name: 'Grand Dorsal Mur', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Mains au mur, pousser les fesses en arrière.' },
      { id: 's2', name: 'Suspension Barre', sets: 3, reps: '30s', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Suspendu au cadre de porte pour décompresser.' }
    ]
  },
  'Dos': {
    mobility: [
      { id: 'm1', name: 'Chat / Vache', sets: 3, reps: '10', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Alterner dos rond et dos creux vertèbre par vertèbre.' },
      { id: 'm2', name: 'Jefferson Curl', sets: 3, reps: '5', tempo: '5050', rest: '0s', targetLoad: 'Léger', instructions: 'Enroulement complet de la colonne avec charge légère.' }
    ],
    stretching: [
      { id: 's1', name: 'Posture de l\'Enfant', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Fesses sur les talons, bras loin devant.' },
      { id: 's2', name: 'Carré des Lombes', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Étirement du carré des lombaires assis.' }
    ]
  },
  'Hanche': {
    mobility: [
      { id: 'm1', name: '90/90 Switch', sets: 3, reps: '8/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotation interne/externe des hanches au sol.' },
      { id: 'm2', name: 'Rotations Hanche', sets: 3, reps: '5/côté', tempo: 'Très Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Grands cercles avec le genou, debout ou à 4 pattes.' }
    ],
    stretching: [
      { id: 's1', name: 'Étirement Psoas', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Genou au mur, pied au mur, extension hanche.' },
      { id: 's2', name: 'Posture du Pigeon', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Jambe pliée devant, jambe tendue derrière.' }
    ]
  },
  'Genou': {
    mobility: [
      { id: 'm1', name: 'Rotation Tibiale', sets: 3, reps: '10', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Assis, tourner le pied int/ext en bloquant le fémur.' },
      { id: 'm2', name: 'Step-up Petersen', sets: 3, reps: '12', tempo: '2010', rest: '0s', targetLoad: 'PDC', instructions: 'Montée sur pointe de pied sur petite marche (Vaste Interne).' }
    ],
    stretching: [
      { id: 's1', name: 'Étirement Quadriceps', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Talon fesse debout.' },
      { id: 's2', name: 'Ischio-Jambiers', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Jambe surélevée, dos droit.' }
    ]
  },
  'Cheville': {
    mobility: [
      { id: 'm1', name: 'Genou au Mur', sets: 3, reps: '10', tempo: 'Tenir 2s', rest: '0s', targetLoad: 'PDC', instructions: 'Avancer le genou sans décoller le talon (Dorsiflexion).' },
      { id: 'm2', name: 'Rotations Cheville', sets: 3, reps: '10/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotations maximales de la cheville.' }
    ],
    stretching: [
      { id: 's1', name: 'Étirement Mollet', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Pousser le mur, jambe arrière tendue.' },
      { id: 's2', name: 'Étirement Soléaire', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Même chose genou fléchi.' }
    ]
  }
};

// Layout: Coordinates adjusted for the simplified schematic body (Straight Arms)
const JOINTS = [
  { id: 'Cou', x: 50, y: 11 },
  { id: 'Epaule', x: 30, y: 17 }, 
  { id: 'Epaule', x: 70, y: 17 },
  { id: 'Coude', x: 28, y: 33 }, // Adjusted for straight arm
  { id: 'Coude', x: 72, y: 33 }, // Adjusted for straight arm
  { id: 'Poignet', x: 25, y: 48 }, // Adjusted for straight arm
  { id: 'Poignet', x: 75, y: 48 }, // Adjusted for straight arm
  { id: 'Thorax', x: 50, y: 24 },
  { id: 'Dos', x: 50, y: 38 }, 
  { id: 'Hanche', x: 42, y: 53 },
  { id: 'Hanche', x: 58, y: 53 },
  { id: 'Genou', x: 38, y: 72 },
  { id: 'Genou', x: 62, y: 72 },
  { id: 'Cheville', x: 38, y: 91 },
  { id: 'Cheville', x: 62, y: 91 },
];

export const CareView: React.FC<CareViewProps> = ({ athlete }) => {
  const [selectedJoint, setSelectedJoint] = useState<string | null>(null);
  const [routineType, setRoutineType] = useState<'mobility' | 'stretching' | null>(null);
  const [activeGlobalRoutine, setActiveGlobalRoutine] = useState<string | null>(null);

  const getRoutine = (joint: string, type: 'mobility' | 'stretching') => {
    return ROUTINES[joint]?.[type] || ROUTINES['Epaule'][type]; 
  };

  const generateWarmUp = (): Exercise[] => {
    // 1. Start with Base
    let routine = [...BASE_WARMUP];

    // 2. Add Weak Points based on Flexibility Radar (Assume Score < 75 is a weak point)
    // Mapping Metric Subject names to Body Parts keys in ROUTINES
    const mapSubjectToKey: Record<string, string> = {
      'Cheville G': 'Cheville', 'Cheville D': 'Cheville',
      'Hanche G': 'Hanche', 'Hanche D': 'Hanche',
      'Epaule G': 'Epaule', 'Epaule D': 'Epaule',
      'Adducteur': 'Hanche' // Approx
    };

    athlete.performance.flexibility.forEach(metric => {
       if (metric.A < 75) {
         const key = mapSubjectToKey[metric.subject];
         if (key && ROUTINES[key]) {
            // Add one mobility exercise from that part if not already added
            const ex = ROUTINES[key].mobility[0];
            if (!routine.find(e => e.id === ex.id)) {
               routine.push({ ...ex, name: `${ex.name} (${metric.subject})` });
            }
         }
       }
    });

    return routine;
  };

  const renderGlobalRoutine = (title: string, exercises: Exercise[]) => (
    <div className="space-y-4 animate-in slide-in-from-right">
       <div className="flex items-center justify-between mb-4">
         <button onClick={() => setActiveGlobalRoutine(null)} className="text-nexus-gray text-xs font-bold uppercase tracking-widest flex items-center gap-2">
           <span>←</span> Retour
         </button>
         <span className="text-nexus-gold text-xs font-bold uppercase px-3 py-1 bg-nexus-gold/10 rounded-full border border-nexus-gold/20">⏱ 15 Minutes</span>
       </div>

       <div className="mb-6">
         <h2 className="font-display text-3xl text-white uppercase">{title}</h2>
         <p className="text-nexus-gray text-sm">Adapté à votre profil</p>
       </div>

       {exercises.map((ex, idx) => (
         <GlassCard key={idx} className="p-5 border-l-2 border-l-nexus-red">
           <div className="flex justify-between items-start mb-2">
             <h3 className="font-bold text-white uppercase tracking-wide text-lg">{ex.name}</h3>
           </div>
           {ex.instructions && <p className="text-sm text-nexus-gray mb-4 italic pl-4 border-l border-nexus-gray/30">"{ex.instructions}"</p>}
           
           <div className="grid grid-cols-4 gap-2 text-center text-xs">
             <div className="bg-black/30 rounded-lg p-2 border border-white/5">
               <div className="text-nexus-gray uppercase text-[10px] mb-1">Séries</div>
               <div className="text-white font-display font-bold text-lg">{ex.sets}</div>
             </div>
             <div className="bg-black/30 rounded-lg p-2 border border-white/5">
               <div className="text-nexus-gray uppercase text-[10px] mb-1">Reps</div>
               <div className="text-white font-display font-bold text-lg">{ex.reps}</div>
             </div>
             <div className="bg-black/30 rounded-lg p-2 border border-white/5">
               <div className="text-nexus-gray uppercase text-[10px] mb-1">Repos</div>
               <div className="text-white font-display font-bold text-lg">{ex.rest}</div>
             </div>
             <div className="bg-black/30 rounded-lg p-2 border border-white/5">
               <div className="text-nexus-gray uppercase text-[10px] mb-1">Tempo</div>
               <div className="text-white font-display font-bold text-lg">{ex.tempo}</div>
             </div>
           </div>
         </GlassCard>
       ))}
       
       <div className="pt-4">
         <Button fullWidth onClick={() => setActiveGlobalRoutine(null)} className="bg-nexus-red shadow-[0_0_20px_rgba(229,46,1,0.4)]">
           Routine Terminée
         </Button>
       </div>
    </div>
  );

  if (activeGlobalRoutine === 'PRE_MATCH') return renderGlobalRoutine('Routine Pré-Match', PRE_MATCH_ROUTINE);
  if (activeGlobalRoutine === 'WARMUP') return renderGlobalRoutine('Routine Échauffement', generateWarmUp());

  return (
    <div className="px-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 h-full flex flex-col">
      
      {!selectedJoint ? (
        <>
          {/* Top Global Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <GlassCard onClick={() => setActiveGlobalRoutine('PRE_MATCH')} className="p-3 text-center cursor-pointer hover:bg-white/5 flex flex-col items-center justify-center h-24 border-nexus-red/30 relative overflow-hidden" accentColor="nexus-red">
               <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-br from-nexus-red/10 to-transparent rounded-bl-full pointer-events-none"></div>
               <div className="flex items-center gap-1 mb-1">
                 <span className="text-sm">🔥</span>
                 <span className="font-display font-bold text-white text-[10px] uppercase tracking-wider">ROUTINE</span>
               </div>
               <span className="font-display font-bold text-white uppercase text-lg leading-none">PRÉ-MATCH</span>
               <span className="text-[9px] text-nexus-gray mt-1">15 min</span>
            </GlassCard>
            <GlassCard onClick={() => setActiveGlobalRoutine('WARMUP')} className="p-3 text-center cursor-pointer hover:bg-white/5 flex flex-col items-center justify-center h-24 border-nexus-gold/30 relative overflow-hidden" accentColor="nexus-gold">
               <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-br from-nexus-gold/10 to-transparent rounded-bl-full pointer-events-none"></div>
               <div className="flex items-center gap-1 mb-1">
                 <span className="text-sm">⚡️</span>
                 <span className="font-display font-bold text-white text-[10px] uppercase tracking-wider">ROUTINE</span>
               </div>
               <span className="font-display font-bold text-white uppercase text-lg leading-none">ÉCHAUFFEMENT</span>
               <span className="text-[9px] text-nexus-gray mt-1">15 min • Adapté</span>
            </GlassCard>
          </div>

          <div className="text-center mt-6 mb-2">
             <h2 className="font-display text-2xl text-white uppercase tracking-widest">Carte Corporelle</h2>
             <p className="text-nexus-gray text-[10px] tracking-[0.25em] uppercase font-medium">Touchez une zone douloureuse</p>
          </div>

          <div className="relative flex-1 flex items-center justify-center -mt-4">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(229,46,1,0.08),transparent_60%)] pointer-events-none"></div>
             
             {/* SIMPLIFIED SCHEMATIC BODY SVG - STRAIGHT ARMS */}
             <div className="relative w-full max-w-[180px] aspect-[1/2.4] z-10">
                <svg viewBox="0 0 200 450" className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                   <g fill="none" stroke="#F4F4F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                     
                     {/* Head */}
                     <ellipse cx="100" cy="30" rx="18" ry="22" />

                     {/* Neck */}
                     <path d="M100 52 L 100 58" />

                     {/* Body Outline - Straight Arms */}
                     <path d="
                        M 100 58 
                        Q 130 58 140 65   
                        Q 150 70 150 90
                        L 152 150
                        L 154 215
                        L 150 225
                        L 146 215
                        L 135 150
                        L 125 105
                        L 125 220
                        L 135 320
                        L 130 410
                        L 110 420
                        L 105 320
                        L 100 250
                        L 95 320         
                        L 90 420         
                        L 70 410         
                        L 65 320         
                        L 75 220
                        L 75 105
                        L 65 150
                        L 54 215
                        L 50 225
                        L 46 215
                        L 48 150
                        L 50 90
                        Q 50 70 60 65    
                        Q 70 58 100 58   
                     " />

                     {/* Details lines */}
                     {/* Pecs */}
                     <path d="M75 100 Q 100 110 125 100" strokeOpacity="0.3" />
                     {/* Abs/Navel */}
                     <path d="M100 120 L 100 170" strokeOpacity="0.2" />
                     {/* Shorts Line */}
                     <path d="M75 220 L 125 220" strokeOpacity="0.5" />
                     {/* Knees */}
                     <path d="M70 320 L 60 320" strokeOpacity="0.2" />
                     <path d="M130 320 L 140 320" strokeOpacity="0.2" />

                   </g>
                </svg>

                {JOINTS.map((joint, idx) => (
                  <button
                    key={`${joint.id}-${idx}`}
                    onClick={() => setSelectedJoint(joint.id)}
                    className="absolute w-10 h-10 -ml-5 -mt-5 flex items-center justify-center group z-10"
                    style={{ left: `${joint.x}%`, top: `${joint.y}%` }}
                  >
                    <div className="absolute w-3 h-3 bg-nexus-red rounded-full shadow-[0_0_10px_#E52E01] animate-pulse group-hover:scale-150 transition-transform duration-300 border border-white/50"></div>
                    <div className="absolute w-8 h-8 bg-nexus-red/30 rounded-full animate-ping opacity-0 group-hover:opacity-100"></div>
                  </button>
                ))}
             </div>
          </div>
        </>
      ) : !routineType ? (
        <div className="space-y-6">
           <button onClick={() => setSelectedJoint(null)} className="text-nexus-gray text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
             <span>←</span> Retour Carte
           </button>
           
           <div className="text-center mb-8">
             <h2 className="font-display text-4xl text-white uppercase text-nexus-gold drop-shadow-lg">{selectedJoint}</h2>
             <p className="text-nexus-gray text-sm uppercase tracking-wide">Protocole Scientifique</p>
           </div>

           <div className="grid gap-6">
             <GlassCard 
               onClick={() => setRoutineType('mobility')} 
               className="p-8 text-center group hover:bg-white/5 border-l-4 border-l-nexus-gold"
               accentColor="nexus-gold"
             >
               <h3 className="font-display text-2xl text-white uppercase mb-2">Mobilité</h3>
               <p className="text-nexus-gray text-xs uppercase tracking-wider">Amplitude & Activation • 15 min</p>
             </GlassCard>

             <GlassCard 
               onClick={() => setRoutineType('stretching')} 
               className="p-8 text-center group hover:bg-white/5 border-l-4 border-l-nexus-red"
               accentColor="nexus-red"
             >
               <h3 className="font-display text-2xl text-white uppercase mb-2">Stretching</h3>
               <p className="text-nexus-gray text-xs uppercase tracking-wider">Détente & Décompression • 15 min</p>
             </GlassCard>
           </div>
        </div>
      ) : (
        <div className="space-y-4">
           <div className="flex items-center justify-between mb-4">
             <button onClick={() => setRoutineType(null)} className="text-nexus-gray text-xs font-bold uppercase tracking-widest flex items-center gap-2">
               <span>←</span> Choix
             </button>
             <span className="text-nexus-red text-xs font-bold uppercase px-3 py-1 bg-nexus-red/10 rounded-full border border-nexus-red/20">Protocole</span>
           </div>

           <div className="mb-6">
             <h2 className="font-display text-3xl text-white uppercase">
               Routine {routineType === 'mobility' ? 'Mobilité' : 'Stretching'}
             </h2>
             <p className="text-nexus-gold font-display text-xl uppercase">{selectedJoint} • 15 min</p>
           </div>

           {getRoutine(selectedJoint, routineType).map((ex, idx) => (
             <GlassCard key={idx} className="p-5 border-l-2 border-l-white/20">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-white uppercase tracking-wide text-lg">{ex.name}</h3>
               </div>
               {ex.instructions && <p className="text-sm text-nexus-gray mb-4 italic pl-4 border-l border-nexus-gray/30">"{ex.instructions}"</p>}
               
               <div className="grid grid-cols-4 gap-2 text-center text-xs">
                 <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                   <div className="text-nexus-gray uppercase text-[10px] mb-1">Séries</div>
                   <div className="text-white font-display font-bold text-lg">{ex.sets}</div>
                 </div>
                 <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                   <div className="text-nexus-gray uppercase text-[10px] mb-1">Reps</div>
                   <div className="text-white font-display font-bold text-lg">{ex.reps}</div>
                 </div>
                 <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                   <div className="text-nexus-gray uppercase text-[10px] mb-1">Repos</div>
                   <div className="text-white font-display font-bold text-lg">{ex.rest}</div>
                 </div>
                 <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                   <div className="text-nexus-gray uppercase text-[10px] mb-1">Tempo</div>
                   <div className="text-white font-display font-bold text-lg">{ex.tempo}</div>
                 </div>
               </div>
             </GlassCard>
           ))}

           <div className="pt-4">
             <Button fullWidth onClick={() => { setRoutineType(null); setSelectedJoint(null); }} className="bg-nexus-red shadow-[0_0_20px_rgba(229,46,1,0.4)]">
               Terminer la Routine
             </Button>
           </div>
        </div>
      )}
    </div>
  );
};