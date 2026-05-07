import React, { useState, useEffect, useRef } from 'react';
import { Athlete, Exercise } from '../../types';

interface CareViewProps { athlete: Athlete; }

// ─── TYPES ───────────────────────────────────────────────────
interface EnhancedExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: number; // secondes
  tempo?: string;
  load?: string;
  category: 'MOBILITY' | 'STRETCHING' | 'ACTIVATION';
  instructions: string;
  tips: string[];
  muscles: string[];
  videoNote?: string;
  isTimed?: boolean; // si true, reps = durée en secondes
}

// ─── BASE DONNÉES EXERCICES ───────────────────────────────────
const ROUTINES: Record<string, { mobility: EnhancedExercise[], stretching: EnhancedExercise[] }> = {
  Cou: {
    mobility: [
      {
        id: 'cou-m1', category: 'MOBILITY',
        name: 'CARs Cervicaux', sets: 2, reps: '5/côté', rest: 15,
        instructions: 'Effectue des rotations articulaires maximales lentes de la tête. Commence par amener l\'oreille vers l\'épaule, puis l\'oeil vers le ciel, puis l\'oreille à l\'autre épaule, puis le menton vers la poitrine.',
        tips: ['Mouvement lent et contrôlé', 'Ne force pas en fin d\'amplitude', 'Respiration régulière'],
        muscles: ['Sterno-cléido-mastoïdien', 'Trapèze supérieur', 'Semi-épineux'],
      },
      {
        id: 'cou-m2', category: 'MOBILITY',
        name: 'Rétraction du Menton', sets: 3, reps: '12', rest: 10,
        instructions: 'Assis droit, amène le menton vers l\'arrière en créant un "double menton". Maintiens 2 secondes. Active les fléchisseurs profonds du cou. Évite de pencher la tête vers le bas.',
        tips: ['Regard horizontal', 'Tenir 2s en position haute', 'Sensation de grandissement'],
        muscles: ['Longus colli', 'Longus capitis', 'Fléchisseurs profonds'],
      },
      {
        id: 'cou-m3', category: 'ACTIVATION',
        name: 'Renfo Isométrique Cou', sets: 3, reps: '8s/direction', rest: 20, isTimed: false,
        instructions: 'Place ta main sur le côté de la tête. Pousse la tête contre la main sans bouger (isométrique). Maintiens 8 secondes. Fait les 4 directions : droite, gauche, avant, arrière.',
        tips: ['Force = 60-70% du max', 'Aucun mouvement de tête', 'Expire pendant l\'effort'],
        muscles: ['Scalènes', 'Sterno-mastoïdien', 'Splénius'],
      },
    ],
    stretching: [
      {
        id: 'cou-s1', category: 'STRETCHING',
        name: 'Étirement Trapèze Supérieur', sets: 2, reps: '45s/côté', rest: 15, isTimed: true,
        instructions: 'Assis, incline la tête vers l\'épaule droite. Place la main droite sur la tête (sans tirer). Laisse le poids de la main faire l\'étirement. Épaule gauche maintenue basse. Change de côté.',
        tips: ['Ne tire pas avec la main', 'Poids de la main seulement', 'Garde l\'épaule basse'],
        muscles: ['Trapèze supérieur', 'Scalènes', 'Sterno-mastoïdien'],
      },
      {
        id: 'cou-s2', category: 'STRETCHING',
        name: 'Étirement Sub-occipital', sets: 2, reps: '60s', rest: 15, isTimed: true,
        instructions: 'Couché sur le dos, place une balle de tennis sous la base du crâne (là où le cou rejoint la tête). Laisse le poids de la tête comprimer doucement la zone. Respire profondément.',
        tips: ['Poids de la tête uniquement', 'Respiration abdominale', 'Jamais de douleur vive'],
        muscles: ['Sub-occipitaux', 'Muscles de la nuque profonds'],
      },
    ],
  },

  Epaule: {
    mobility: [
      {
        id: 'ep-m1', category: 'MOBILITY',
        name: 'CARs d\'Épaule', sets: 2, reps: '5/côté', rest: 15,
        instructions: 'Debout, bras tendu sur le côté. Décris le plus grand cercle possible avec le bras en gardant le coude tendu. Monte devant, passe par le haut, va en arrière, reviens par le bas. Inverted : l\'autre sens.',
        tips: ['Bras rigoureusement tendu', 'Cercle le plus grand possible', 'Gaine abdominale active'],
        muscles: ['Deltoïde', 'Coiffe des rotateurs', 'Grand dentelé'],
      },
      {
        id: 'ep-m2', category: 'MOBILITY',
        name: 'Dislocations au Bâton', sets: 3, reps: '10', rest: 20,
        instructions: 'Tiens un bâton ou une serviette roulée devant toi, prise large. Passe le bâton d\'avant en arrière en gardant les coudes tendus. Réduis l\'écartement des mains progressivement. Évite de monter les épaules.',
        tips: ['Prise aussi large que nécessaire', 'Coudes tendus tout le long', 'Réduire la prise sur plusieurs semaines'],
        muscles: ['Capsule antérieure', 'Rhomboïdes', 'Grand rond'],
      },
      {
        id: 'ep-m3', category: 'ACTIVATION',
        name: 'Y-T-W-L (Élastique ou Sol)', sets: 3, reps: '10/lettre', rest: 30,
        instructions: 'Face contre sol ou debout avec élastique. Forme les lettres Y (bras en V vers le haut), T (bras horizontaux), W (coudes à 90° élevés), L (coudes à 90° de face). Contrôle le retour.',
        tips: ['Omoplates vers la colonne en tout point', 'Mouvement lent et contrôlé', 'Sensation de brûlure dans le haut du dos = normal'],
        muscles: ['Sus-épineux', 'Infra-épineux', 'Rhomboïdes', 'Grand dentelé'],
      },
    ],
    stretching: [
      {
        id: 'ep-s1', category: 'STRETCHING',
        name: 'Étirement Capsule Postérieure', sets: 2, reps: '60s/côté', rest: 20, isTimed: true,
        instructions: 'Debout, croise le bras gauche devant la poitrine au niveau de l\'épaule. Avec le bras droit, amène le coude gauche vers l\'épaule droite. Tête tournée à gauche. Tu dois sentir l\'arrière de l\'épaule.',
        tips: ['Ne tourne pas le tronc', 'Maintien doux et régulier', 'Respire dans l\'étirement'],
        muscles: ['Capsule postérieure', 'Infra-épineux', 'Petit rond'],
      },
      {
        id: 'ep-s2', category: 'STRETCHING',
        name: 'Ouverture Pectorale au Mur', sets: 2, reps: '45s/côté', rest: 20, isTimed: true,
        instructions: 'Place l\'avant-bras à 90° sur un montant de porte ou un mur. Coude à hauteur d\'épaule. Tourne le buste vers l\'opposé jusqu\'à sentir l\'étirement du pectoral. Varie la hauteur du bras pour toucher différentes fibres.',
        tips: ['Coude à hauteur d\'épaule', 'Rotation du buste, pas de la tête', '3 positions de hauteur différentes'],
        muscles: ['Grand pectoral', 'Petit pectoral', 'Deltoïde antérieur'],
      },
    ],
  },

  Dos: {
    mobility: [
      {
        id: 'dos-m1', category: 'MOBILITY',
        name: 'Chat / Vache Contrôlé', sets: 3, reps: '10', rest: 10,
        instructions: 'À 4 pattes, mains sous les épaules, genoux sous les hanches. Expire en arrondissant le dos (chat), pousse le sol avec les mains. Inspire en creusant le dos (vache), regard vers l\'avant. Vertèbre par vertèbre.',
        tips: ['Vertèbre par vertèbre, du bas vers le haut', 'Expire sur l\'arrondi, inspire sur le creux', 'Amplitude maximale à chaque répétition'],
        muscles: ['Érecteurs du rachis', 'Multifides', 'Grand dorsal'],
      },
      {
        id: 'dos-m2', category: 'MOBILITY',
        name: 'Livre Ouvert Thoracique', sets: 3, reps: '8/côté', rest: 15,
        instructions: 'Allongé sur le côté, genoux fléchis à 90°, bras tendus devant toi. Ouvre le bras supérieur vers le plafond et l\'arrière aussi loin que possible, regarde ta main. Reviens. Objectif : poser l\'épaule au sol côté opposé.',
        tips: ['Genoux collés (ne pas les laisser basculer)', 'Regarde ta main tout le long', 'Expire en ouvrant'],
        muscles: ['Rotateurs thoraciques', 'Rhomboïdes', 'Dentelé'],
      },
      {
        id: 'dos-m3', category: 'ACTIVATION',
        name: 'Superman / Hollow Body', sets: 3, reps: '12s/position', rest: 20,
        instructions: 'Couché ventre, lève simultanément les bras, la poitrine et les jambes du sol. Maintiens 3s. Ensuite, retourne-toi et adopte la position Hollow (dos plat, bras et jambes en l\'air, bas du dos collé au sol). Alterne.',
        tips: ['Sur le ventre : serrer les fessiers', 'Hollow : bas du dos COLLÉ au sol', 'Respiration diaphragmatique'],
        muscles: ['Érecteurs', 'Grand fessier', 'Abdominaux profonds'],
      },
    ],
    stretching: [
      {
        id: 'dos-s1', category: 'STRETCHING',
        name: 'Posture de l\'Enfant Étendue', sets: 2, reps: '60s', rest: 15, isTimed: true,
        instructions: 'À genoux, assis sur les talons (ou aussi loin que tu peux). Glisse les bras loin devant toi, front au sol. Pour cibler les côtés, glisse les bras vers la droite ou la gauche alternativement.',
        tips: ['Fesses vers les talons', 'Expulsion totale de l\'air', 'Relâchement progressif à chaque expiration'],
        muscles: ['Grand dorsal', 'Carré des lombes', 'Grand rond'],
      },
      {
        id: 'dos-s2', category: 'STRETCHING',
        name: 'Figure 4 / Piriforme', sets: 2, reps: '60s/côté', rest: 15, isTimed: true,
        instructions: 'Couché sur le dos, croise la cheville droite sur le genou gauche (figure 4). Attrape le dos de la cuisse gauche et tire doucement vers toi. Sens l\'étirement dans la fesse droite. Échange.',
        tips: ['Pied en flexion (flex)', 'Dos plat sur le sol', 'Plus tu rapproches la jambe, plus c\'est intense'],
        muscles: ['Grand fessier', 'Piriforme', 'Rotateurs externes de hanche'],
      },
    ],
  },

  Hanche: {
    mobility: [
      {
        id: 'hip-m1', category: 'MOBILITY',
        name: '90/90 Switch Hip', sets: 3, reps: '8/côté', rest: 20,
        instructions: 'Assis au sol, une jambe devant (genou à 90°) et une derrière (genou à 90°). Lève les deux genoux du sol et bascule vers l\'autre côté sans utiliser les mains. Maintiens 2s en haut de chaque côté.',
        tips: ['Sans aide des mains', 'Dos droit pendant le switch', 'Amplitude complète des 2 côtés'],
        muscles: ['Rotateurs internes/externes hanche', 'Psoas', 'Carré des lombes'],
      },
      {
        id: 'hip-m2', category: 'MOBILITY',
        name: 'World\'s Greatest Stretch', sets: 2, reps: '5/côté', rest: 15,
        instructions: 'Depuis la position debout, fais un grand pas en avant (fente). Pose la main du même côté que le pied avant au sol à l\'intérieur du pied. Ouvre le coude vers le sol (rotation de la hanche). Puis lève le bras vers le plafond (rotation thoracique). Reviens et change de côté.',
        tips: ['Pied arrière poussé dans le sol', 'Hanche arrière abaissée vers le sol', 'Regard sur la main qui monte'],
        muscles: ['Psoas', 'Fléchisseurs hanche', 'Rotateurs thoraciques', 'Grand fessier'],
      },
      {
        id: 'hip-m3', category: 'MOBILITY',
        name: 'Deep Squat Hold', sets: 3, reps: '45s', rest: 20, isTimed: true,
        instructions: 'Descends en squat profond, talons au sol. Talons dans l\'alignement des épaules. Pousse les genoux vers l\'extérieur avec les coudes. Garde le dos droit. Maintiens la position en respirant profondément.',
        tips: ['Talons au sol impérativement', 'Coudes poussent les genoux', 'Monte les bras si besoin pour le contrepoids'],
        muscles: ['Hanche', 'Cheville', 'Colonne lombaire', 'Adducteurs'],
      },
    ],
    stretching: [
      {
        id: 'hip-s1', category: 'STRETCHING',
        name: 'Étirement Psoas au Sol', sets: 2, reps: '60s/côté', rest: 20, isTimed: true,
        instructions: 'Genou droit au sol (sur une serviette), pied gauche devant (fente basse). Avance les hanches vers l\'avant et le bas sans incliner le buste. Tu dois sentir l\'avant de la cuisse droite et l\'aine. Pour intensifier, lève le bras droit.',
        tips: ['Hanche avant, pas buste en avant', 'Contracte légèrement le fessier arrière', 'Jamais de lordose exagérée'],
        muscles: ['Psoas-iliaque', 'Droit fémoral', 'Sartorius'],
      },
      {
        id: 'hip-s2', category: 'STRETCHING',
        name: 'Pigeon Yoga', sets: 2, reps: '90s/côté', rest: 20, isTimed: true,
        instructions: 'Depuis la planche, amène le genou gauche derrière la main gauche, tibia horizontal. Extends la jambe droite derrière toi. Descends progressivement vers le sol. Pour plus d\'intensité, pose les avant-bras au sol.',
        tips: ['Pied avant en flexion (protège le genou)', 'Hanche avant vers le bas', 'Respiration profonde pour relâcher'],
        muscles: ['Grand fessier', 'Piriforme', 'TFL', 'Rotateurs externes'],
      },
    ],
  },

  Genou: {
    mobility: [
      {
        id: 'gn-m1', category: 'MOBILITY',
        name: 'Genou au Mur (Dorsiflexion)', sets: 3, reps: '12/côté', rest: 10,
        instructions: 'À genoux face au mur, pied avant à environ 10 cm du mur. Avance le genou vers le mur sans décoller le talon. L\'objectif est de toucher le mur avec le genou. Augmente progressivement la distance du pied au mur.',
        tips: ['Talon impérativement au sol', 'Pointe du pied dans l\'axe du tibia', 'Mesure ta distance chaque séance pour progresser'],
        muscles: ['Mollet (Gastrocnémien/Soléaire)', 'Cheville', 'Vaste interne'],
      },
      {
        id: 'gn-m2', category: 'ACTIVATION',
        name: 'Terminal Knee Extension (TKE)', sets: 3, reps: '15', rest: 20,
        instructions: 'Élastique autour de la jambe derrière le genou, fixé à un point devant toi. Fléchis légèrement le genou puis tends-le complètement. Contracte le quadriceps au maximum en fin d\'extension. Pied au sol tout le temps.',
        tips: ['Extension COMPLÈTE du genou', 'Pied plat au sol', 'Contraction quadriceps maximale'],
        muscles: ['Vaste interne (VMO)', 'Quadriceps', 'Ligament croisé antérieur'],
      },
      {
        id: 'gn-m3', category: 'ACTIVATION',
        name: 'Nordic Hamstring (Excentrique)', sets: 3, reps: '6', rest: 90,
        instructions: 'À genoux sur une surface rembourrée, fixe les chevilles (sous une barre, canapé, etc.). Descends le buste vers le sol le plus lentement possible en contrôlant avec les ischio-jambiers. Pousse sur les mains pour revenir si nécessaire.',
        tips: ['Descente la plus LENTE possible (5 à 10s)', 'Corps droit comme une planche', 'Stop si douleur derrière le genou'],
        muscles: ['Ischio-jambiers', 'Biceps fémoral', 'Tendon du jarret'],
      },
    ],
    stretching: [
      {
        id: 'gn-s1', category: 'STRETCHING',
        name: 'Quadriceps Couché', sets: 2, reps: '60s/côté', rest: 20, isTimed: true,
        instructions: 'Allongé sur le côté, attrape ta cheville par derrière. Ramène le talon vers la fesse. Pousse doucement la hanche vers l\'avant pour intensifier. Tu dois sentir l\'avant de la cuisse.',
        tips: ['Hanches alignées (ne pas ouvrir)', 'Genou vers le bas (pas vers le haut)', 'Pas de douleur dans le genou'],
        muscles: ['Droit fémoral', 'Vaste latéral', 'Sartorius'],
      },
      {
        id: 'gn-s2', category: 'STRETCHING',
        name: 'Ischio-Jambiers (RDL Étirement)', sets: 2, reps: '45s/côté', rest: 15, isTimed: true,
        instructions: 'Debout, pose le talon sur une surface à hauteur de hanche (banc, barrière). Garde la jambe tendue. Incline le buste vers l\'avant, dos plat. Ne voûte pas le dos. Tu sens l\'arrière de la cuisse.',
        tips: ['DOS PLAT (crucial)', 'Pied en flexion (pointe vers toi)', 'Inclinaison des hanches, pas du dos'],
        muscles: ['Biceps fémoral', 'Semi-tendineux', 'Semi-membraneux'],
      },
    ],
  },

  Cheville: {
    mobility: [
      {
        id: 'ch-m1', category: 'MOBILITY',
        name: 'Rotations Complètes CARs', sets: 2, reps: '5/côté', rest: 10,
        instructions: 'Assis ou debout sur une jambe, réalise des rotations maximales de la cheville : pointe vers le haut (dorsiflexion), vers le bas (extension), vers l\'intérieur, vers l\'extérieur. Amplitude maximale et lente. Répète dans les deux sens.',
        tips: ['Jambe fixe (ne pas compenser avec la jambe)', 'Amplitude maximale = objectif', 'Lenteur = contrôle'],
        muscles: ['Tibial antérieur', 'Péroniers', 'Tibial postérieur', 'Triceps sural'],
      },
      {
        id: 'ch-m2', category: 'ACTIVATION',
        name: 'Single Leg Calf Raise + Hold', sets: 3, reps: '12 + 5s', rest: 30,
        instructions: 'Debout sur un pied au bord d\'une marche, talon qui dépasse. Descends le talon vers le bas (étirement). Monte sur la pointe des pieds (contraction). En haut, maintiens 3-5 secondes. Descends lentement (3s).',
        tips: ['Descente LENTE et contrôlée', 'Maintien en haut = force du mollet', 'Si trop difficile : 2 pieds au début'],
        muscles: ['Gastrocnémien', 'Soléaire', 'Fibulaires', 'Tibial postérieur'],
      },
    ],
    stretching: [
      {
        id: 'ch-s1', category: 'STRETCHING',
        name: 'Étirement Mollet + Soléaire', sets: 2, reps: '45s/position', rest: 15, isTimed: true,
        instructions: 'Position 1 (Gastro) : jambe arrière tendue, talon plat, pousse le mur. Position 2 (Soléaire) : même chose mais genou arrière légèrement fléchi. 45s dans chaque position. Sens la différence entre les deux.',
        tips: ['Talon COLLÉ au sol impérativement', 'La fente : genou dans l\'axe du pied', 'Deux positions = deux muscles différents'],
        muscles: ['Gastrocnémien', 'Soléaire', 'Achille'],
      },
      {
        id: 'ch-s2', category: 'STRETCHING',
        name: 'Étirement Plantar Fascia', sets: 2, reps: '45s/côté', rest: 10, isTimed: true,
        instructions: 'Assis, croise la cheville droite sur le genou gauche. Attrape les orteils droits et plie-les vers le tibia (extension). Masse simultanément la voûte plantaire avec le pouce. Crucial pour la prévention des fasciites et pour les water-polo players.',
        tips: ['Orteils vraiment vers le tibia', 'Massage circulaire voûte plantaire', 'Faire le matin avant de poser le pied par terre'],
        muscles: ['Fascia plantaire', 'Fléchisseurs orteils', 'Intrinsèques du pied'],
      },
    ],
  },

  Thorax: {
    mobility: [
      {
        id: 'th-m1', category: 'MOBILITY',
        name: 'Extension Thoracique au Rouleau', sets: 3, reps: '60s/position', rest: 15, isTimed: true,
        instructions: 'Place un rouleau de massage sous les omoplates (horizontalement). Bras croisés sur la poitrine ou derrière la tête. Laisse ton dos s\'étendre vers l\'arrière sur le rouleau. Déplace le rouleau de T4 à T12 (du haut vers le bas du dos) en petits segments.',
        tips: ['Ne pas aller sur les lombaires', 'Hanches au sol', 'Respiration lente et profonde dans la position'],
        muscles: ['Érecteurs thoraciques', 'Rhomboïdes', 'Pectoraux (stretch)'],
      },
      {
        id: 'th-m2', category: 'MOBILITY',
        name: 'Rotation Thoracique en Fente', sets: 3, reps: '8/côté', rest: 15,
        instructions: 'En position de fente basse, pose la main avant au sol. Lève le bras opposé vers le plafond en cherchant à regarder ta main. Descends ce bras et lève le bras de la jambe arrière. Le genou arrière est au sol pour stabiliser.',
        tips: ['Hanche basse et stable', 'Regard sur la main qui monte', 'Rotation vient du thorax, pas des lombaires'],
        muscles: ['Rotateurs thoraciques', 'Obliques', 'Dentelé antérieur'],
      },
    ],
    stretching: [
      {
        id: 'th-s1', category: 'STRETCHING',
        name: 'Prise de Suspension (Porte/Barre)', sets: 3, reps: '30s', rest: 20, isTimed: true,
        instructions: 'Attrape un cadre de porte, barre ou espaliers. Laisse le poids de ton corps étirer ton rachis. Sens les vertèbres s\'écarter. Pour plus d\'intensité : plie légèrement les genoux pour laisser tout le poids du corps tirer.',
        tips: ['Se laisser descendre progressivement', 'Épaules actives (pas d\'hyper laxité)', 'Idéal après entraînement chargé'],
        muscles: ['Grand dorsal', 'Disques intervertébraux', 'Carré des lombes'],
      },
      {
        id: 'th-s2', category: 'STRETCHING',
        name: 'Grand Dorsal (Pose Prière)', sets: 2, reps: '60s', rest: 15, isTimed: true,
        instructions: 'À genoux, pose les mains sur un banc ou une chaise devant toi, bras tendus. Descends le buste vers le sol en poussant les fesses vers l\'arrière. Tête entre les bras. Sens l\'étirement dans les flancs et le haut du dos.',
        tips: ['Bras tendus, ne pas plier les coudes', 'Fesses vers les talons', 'Cherche la sensation dans les aisselles'],
        muscles: ['Grand dorsal', 'Grand rond', 'Triceps (étirement secondaire)'],
      },
    ],
  },
};

// ─── Routines globales ────────────────────────────────────────
const PRE_MATCH: EnhancedExercise[] = [
  {
    id: 'pre1', category: 'ACTIVATION', name: 'Rotations Articulaires Globales', sets: 1, reps: '2 min', rest: 0, isTimed: true,
    instructions: 'Réveille chaque articulation dans l\'ordre : chevilles (cercles), genoux (demi-squat), hanches (cercles bras sur les côtés), épaules (grands cercles), poignets, cou (rotations douces). 30 secondes par zone.',
    tips: ['Sens chaque articulation se lubrifier', 'Mouvement fluide et progressif', 'Accélère progressivement'],
    muscles: ['Global'],
  },
  {
    id: 'pre2', category: 'ACTIVATION', name: 'High Knees + Arm Swing', sets: 2, reps: '20s', rest: 10, isTimed: true,
    instructions: 'Monte les genoux alternativement haut (90°) en synchronisant les bras opposés. Monte sur la pointe des pieds à chaque élévation. Augmente la vitesse progressivement.',
    tips: ['Pointe de pied vers le tibia en montant', 'Regard droit devant', 'Rythme régulier puis explosif'],
    muscles: ['Hip flexors', 'Core', 'Mollets'],
  },
  {
    id: 'pre3', category: 'ACTIVATION', name: 'Lateral Shuffle + Touch', sets: 2, reps: '15s/côté', rest: 15, isTimed: true,
    instructions: 'Position basse (semi-fléchi), déplace-toi latéralement sur 4-5 pas, touche le sol de la main à chaque fois que tu arrives sur le côté. Exploses vers le côté opposé. Simule les déplacements en piscine.',
    tips: ['Rester bas (ne pas se relever)', 'Toucher le sol = position basse maximale', 'Accélère sur les 3 dernières répétitions'],
    muscles: ['Fessiers', 'Adducteurs', 'Stabilisateurs genou'],
  },
  {
    id: 'pre4', category: 'ACTIVATION', name: 'Activation Épaules (Band Pull Apart)', sets: 3, reps: '15', rest: 15,
    instructions: 'Tiens un élastique de résistance légère devant toi, bras tendus. Écarte les bras en tirant l\'élastique vers l\'arrière, en serrant les omoplates. Maintiens 1s en fin d\'amplitude. Reviens lentement.',
    tips: ['Coudes tendus', 'Serrer les omoplates à chaque rep', 'Élastique à hauteur des épaules'],
    muscles: ['Rhomboïdes', 'Trapèze moyen', 'Rotateurs externes'],
  },
  {
    id: 'pre5', category: 'ACTIVATION', name: 'Fentes Dynamiques + Rotation', sets: 2, reps: '8/côté', rest: 20,
    instructions: 'Fente avant dynamic. À la position basse, tourne le buste du côté de la jambe avant et lève le bras opposé vers le ciel. Reviens et enchaine. Alterne droite/gauche.',
    tips: ['Genou avant dans l\'axe du pied', 'Rotation complète du buste', 'Explosif sur le retour en position debout'],
    muscles: ['Quadriceps', 'Fessiers', 'Thorax', 'Épaules'],
  },
];

const RECOVERY: EnhancedExercise[] = [
  {
    id: 'rec1', category: 'STRETCHING', name: 'Foam Rolling Ischio-Jambiers', sets: 1, reps: '60s/jambe', rest: 0, isTimed: true,
    instructions: 'Assis sur le sol, rouleau sous une cuisse. Utilise les bras pour lever les fesses et rouler lentement de la fesse au creux du genou. Fais des petits allers-retours de 2 cm. Quand tu trouves un point sensible, reste dessus 10-15s.',
    tips: ['Ne pas rouler sur la zone sensible directement (aller autour)', 'Croise la jambe opposée par-dessus pour intensifier', 'Évite la fosse poplitée (creux du genou)'],
    muscles: ['Biceps fémoral', 'Semi-tendineux', 'TFL'],
  },
  {
    id: 'rec2', category: 'STRETCHING', name: 'Étirement Grand Dorsal Suspendu', sets: 3, reps: '30s', rest: 15, isTimed: true,
    instructions: 'Suspension à une barre ou cadre de porte. Lâche tout le poids du corps. Tourne légèrement le bassin pour décompresser chaque côté. Respiration lente. Après l\'eau, le dos a besoin de décompression.',
    tips: ['Epaules actives (légère contraction)', 'Respiration abdominale profonde', 'Se laisser aller progressivement'],
    muscles: ['Grand dorsal', 'Colonne vertébrale', 'Carré des lombes'],
  },
  {
    id: 'rec3', category: 'STRETCHING', name: 'Étirement Global Membres Inférieurs', sets: 2, reps: '90s/côté', rest: 20, isTimed: true,
    instructions: 'Couché sur le dos, Posture du Pigeon (figure 4). Tiens 45s. Puis saisit la jambe et ramène les deux jambes vers la poitrine (rotation externe max). Tiens 45s. Change de côté.',
    tips: ['Dos plat au sol tout le long', 'Ne force jamais sur le genou', 'Respire dans l\'étirement pour progresser'],
    muscles: ['Piriforme', 'Grand fessier', 'Ischio-jambiers', 'TFL'],
  },
  {
    id: 'rec4', category: 'MOBILITY', name: 'Respiration Diaphragmatique', sets: 1, reps: '5 min', rest: 0, isTimed: true,
    instructions: 'Allongé sur le dos, genoux fléchis. Place une main sur le ventre, une sur la poitrine. Inspire par le nez en gonflant UNIQUEMENT le ventre (4s). Retiens (2s). Expire lentement par la bouche (6s). La main sur la poitrine ne bouge pas.',
    tips: ['Main sur le ventre = bouge, main sur poitrine = immobile', 'Expire complètement, vide les poumons', 'Active le système nerveux parasympathique (récupération)'],
    muscles: ['Diaphragme', 'Intercostaux', 'Système nerveux autonome'],
  },
];

// ─── Composant Timer ──────────────────────────────────────────
const Timer: React.FC<{ duration: number; onDone: () => void }> = ({ duration, onDone }) => {
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { clearInterval(intervalRef.current); setRunning(false); onDone(); return 0; }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const pct = ((duration - remaining) / duration) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Cercle timer */}
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6"/>
          <circle cx="40" cy="40" r="36" fill="none" stroke="#E8B800" strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 36}`}
            strokeDashoffset={`${2 * Math.PI * 36 * (1 - pct/100)}`}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-xl text-white">{remaining}s</span>
        </div>
      </div>
      <button
        onClick={() => running ? (clearInterval(intervalRef.current), setRunning(false)) : setRunning(true)}
        className="px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all"
        style={{ background: running ? 'rgba(239,68,68,0.2)' : 'rgba(232,184,0,0.2)', color: running ? '#ef4444' : '#E8B800', border: `1px solid ${running ? 'rgba(239,68,68,0.4)' : 'rgba(232,184,0,0.4)'}` }}
      >
        {remaining === 0 ? '✓ Terminé' : running ? '⏸ Pause' : remaining === duration ? '▶ Démarrer' : '▶ Reprendre'}
      </button>
      {remaining === 0 && (
        <button onClick={() => setRemaining(duration)} className="text-xs" style={{ color: '#8B9BB4' }}>↺ Recommencer</button>
      )}
    </div>
  );
};

// ─── Composant Carte Exercice Interactive ─────────────────────
const ExerciseCard: React.FC<{ ex: EnhancedExercise; index: number }> = ({ ex, index }) => {
  const [setsCompleted, setSetsCompleted] = useState<boolean[]>(Array(ex.sets).fill(false));
  const [showTips, setShowTips] = useState(false);
  const [resting, setResting] = useState(false);

  const allDone = setsCompleted.every(Boolean);
  const completedCount = setsCompleted.filter(Boolean).length;

  const handleSetDone = (i: number) => {
    const next = [...setsCompleted];
    next[i] = !next[i];
    setSetsCompleted(next);
    if (next[i] && ex.rest > 0 && i < ex.sets - 1) setResting(true);
  };

  const getCategoryColor = () => {
    switch(ex.category) {
      case 'MOBILITY': return '#E8B800';
      case 'STRETCHING': return '#3b82f6';
      case 'ACTIVATION': return '#22c55e';
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden transition-all" style={{
      background: allDone ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.3)',
      border: `1px solid ${allDone ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
    }}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{ background: `${getCategoryColor()}20`, color: getCategoryColor() }}>
            {index + 1}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: `${getCategoryColor()}20`, color: getCategoryColor() }}>
                {ex.category}
              </span>
              {allDone && <span className="text-[9px] font-bold text-green-400">✓ TERMINÉ</span>}
            </div>
            <h3 className="text-white font-bold uppercase tracking-wide">{ex.name}</h3>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-sm mt-3 leading-relaxed pl-11" style={{ color: '#C8D4E8' }}>
          {ex.instructions}
        </p>

        {/* Muscles ciblés */}
        <div className="flex flex-wrap gap-1 mt-2 pl-11">
          {ex.muscles.map((m, i) => (
            <span key={i} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: '#8B9BB4' }}>
              {m}
            </span>
          ))}
        </div>

        {/* Conseils */}
        <button onClick={() => setShowTips(!showTips)} className="mt-2 ml-11 text-xs flex items-center gap-1" style={{ color: '#E8B800' }}>
          <span>{showTips ? '▼' : '▶'}</span> Conseils
        </button>
        {showTips && (
          <ul className="ml-11 mt-2 space-y-1">
            {ex.tips.map((tip, i) => (
              <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#8B9BB4' }}>
                <span style={{ color: '#E8B800' }}>→</span> {tip}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Paramètres */}
      <div className="grid grid-cols-4 gap-px" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {[
          { label: 'Séries', val: `${completedCount}/${ex.sets}` },
          { label: ex.isTimed ? 'Durée' : 'Reps', val: ex.reps },
          { label: 'Repos', val: ex.rest > 0 ? `${ex.rest}s` : 'Pas de repos' },
          { label: 'Charge', val: ex.load || 'PDC' },
        ].map((p, i) => (
          <div key={i} className="text-center py-3 px-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <div className="text-[9px] uppercase font-bold mb-1" style={{ color: '#8B9BB4' }}>{p.label}</div>
            <div className="font-display font-bold text-white text-sm">{p.val}</div>
          </div>
        ))}
      </div>

      {/* Timer si timed */}
      {ex.isTimed && ex.rest > 0 && (
        <div className="p-4 flex justify-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Timer duration={parseInt(ex.reps)} onDone={() => setSetsCompleted(prev => { const n=[...prev]; const idx=n.findIndex(v=>!v); if(idx>=0) n[idx]=true; return n; })} />
        </div>
      )}

      {/* Séries à cocher */}
      <div className="p-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[10px] uppercase font-bold mb-2" style={{ color: '#8B9BB4' }}>Coche chaque série terminée :</p>
        <div className="flex gap-2 flex-wrap">
          {setsCompleted.map((done, i) => (
            <button
              key={i}
              onClick={() => handleSetDone(i)}
              className="flex-1 min-w-[60px] py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{
                background: done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${done ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: done ? '#22c55e' : '#8B9BB4',
              }}
            >
              {done ? `✓ S${i+1}` : `S${i+1}`}
            </button>
          ))}
        </div>

        {/* Timer de repos */}
        {resting && ex.rest > 0 && (
          <div className="mt-3 p-3 rounded-xl flex items-center gap-3 animate-in fade-in" style={{ background: 'rgba(232,184,0,0.1)', border: '1px solid rgba(232,184,0,0.2)' }}>
            <span>⏱</span>
            <div className="flex-1">
              <p className="text-xs font-bold" style={{ color: '#E8B800' }}>Repos : {ex.rest} secondes</p>
            </div>
            <Timer duration={ex.rest} onDone={() => setResting(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Composant Principal ──────────────────────────────────────
const JOINTS_LIST = ['Cou', 'Epaule', 'Thorax', 'Dos', 'Hanche', 'Genou', 'Cheville'];
const JOINT_EMOJIS: Record<string, string> = {
  Cou: '🦒', Epaule: '💪', Thorax: '🫁', Dos: '🏋️', Hanche: '🦵', Genou: '🦿', Cheville: '🦶'
};

export const CareView: React.FC<CareViewProps> = ({ athlete }) => {
  const [view, setView] = useState<'MENU' | 'ROUTINE' | 'JOINT_SELECT' | 'JOINT_TYPE' | 'JOINT_EX'>('MENU');
  const [activeRoutine, setActiveRoutine] = useState<EnhancedExercise[]>([]);
  const [routineTitle, setRoutineTitle] = useState('');
  const [selectedJoint, setSelectedJoint] = useState('');
  const [jointType, setJointType] = useState<'mobility' | 'stretching'>('mobility');
  const [done, setDone] = useState(false);

  const startRoutine = (title: string, exercises: EnhancedExercise[]) => {
    setRoutineTitle(title); setActiveRoutine(exercises); setDone(false); setView('ROUTINE');
  };

  // ── VUE ROUTINE ─────────────────────────────────────────────
  if (view === 'ROUTINE') {
    return (
      <div className="px-4 pb-32 pt-2 space-y-4 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 py-2">
          <button onClick={() => setView('MENU')} className="text-sm font-bold" style={{ color: '#8B9BB4' }}>← Retour</button>
          <div className="flex-1">
            <h2 className="font-display text-xl text-white uppercase">{routineTitle}</h2>
            <p className="text-xs" style={{ color: '#8B9BB4' }}>{activeRoutine.length} exercices</p>
          </div>
        </div>

        {done && (
          <div className="rounded-2xl p-4 text-center animate-in zoom-in-95" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <span className="text-3xl block mb-2">🎉</span>
            <p className="font-bold text-green-400 uppercase">Routine Terminée !</p>
            <p className="text-xs mt-1" style={{ color: '#8B9BB4' }}>Excellent travail.</p>
          </div>
        )}

        {activeRoutine.map((ex, i) => (
          <ExerciseCard key={ex.id} ex={ex} index={i} />
        ))}

        <button
          onClick={() => { setDone(true); setTimeout(() => setView('MENU'), 1500); }}
          className="w-full py-4 rounded-2xl font-display font-bold uppercase tracking-widest"
          style={{ background: 'linear-gradient(135deg, #E8B800, #F5D000)', color: '#0B1628' }}
        >
          ✓ Routine Terminée
        </button>
      </div>
    );
  }

  // ── VUE SÉLECTION ZONE ──────────────────────────────────────
  if (view === 'JOINT_SELECT') {
    return (
      <div className="px-4 pb-32 pt-2 space-y-4 animate-in fade-in">
        <div className="flex items-center gap-3 py-2">
          <button onClick={() => setView('MENU')} className="text-sm font-bold" style={{ color: '#8B9BB4' }}>← Retour</button>
          <h2 className="font-display text-xl text-white uppercase">Choisir une Zone</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {JOINTS_LIST.map(joint => (
            <button
              key={joint}
              onClick={() => { setSelectedJoint(joint); setView('JOINT_TYPE'); }}
              className="p-5 rounded-2xl text-center transition-all active:scale-95"
              style={{ background: 'rgba(26,58,122,0.2)', border: '1px solid rgba(232,184,0,0.2)' }}
            >
              <span className="text-3xl block mb-2">{JOINT_EMOJIS[joint]}</span>
              <span className="font-bold text-white uppercase text-sm">{joint}</span>
              <div className="flex gap-1 justify-center mt-2">
                <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,184,0,0.15)', color: '#E8B800' }}>Mobilité</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>Stretching</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── VUE CHOIX TYPE ──────────────────────────────────────────
  if (view === 'JOINT_TYPE') {
    return (
      <div className="px-4 pb-32 pt-2 space-y-4 animate-in fade-in">
        <div className="flex items-center gap-3 py-2">
          <button onClick={() => setView('JOINT_SELECT')} className="text-sm font-bold" style={{ color: '#8B9BB4' }}>← Zones</button>
          <div className="flex-1">
            <h2 className="font-display text-2xl text-white uppercase">{JOINT_EMOJIS[selectedJoint]} {selectedJoint}</h2>
          </div>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => startRoutine(`${selectedJoint} — Mobilité`, ROUTINES[selectedJoint]?.mobility || [])}
            className="w-full p-6 rounded-2xl text-left transition-all active:scale-95"
            style={{ background: 'rgba(232,184,0,0.1)', border: '1px solid rgba(232,184,0,0.3)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔄</span>
              <div>
                <h3 className="font-display text-xl text-white uppercase">Mobilité</h3>
                <p className="text-xs mt-0.5" style={{ color: '#8B9BB4' }}>Amplitude articulaire & Activation • {ROUTINES[selectedJoint]?.mobility.length || 0} exercices</p>
                <p className="text-xs mt-1" style={{ color: '#E8B800' }}>Idéal avant l'entraînement</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => startRoutine(`${selectedJoint} — Stretching`, ROUTINES[selectedJoint]?.stretching || [])}
            className="w-full p-6 rounded-2xl text-left transition-all active:scale-95"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🧘</span>
              <div>
                <h3 className="font-display text-xl text-white uppercase">Stretching</h3>
                <p className="text-xs mt-0.5" style={{ color: '#8B9BB4' }}>Détente & Récupération • {ROUTINES[selectedJoint]?.stretching.length || 0} exercices</p>
                <p className="text-xs mt-1" style={{ color: '#60a5fa' }}>Idéal après l'entraînement</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── MENU PRINCIPAL ───────────────────────────────────────────
  return (
    <div className="px-4 pb-32 pt-2 space-y-5 animate-in fade-in">
      <div className="py-2">
        <h2 className="font-display text-2xl text-white uppercase">Soins & Mobilité</h2>
        <p className="text-xs mt-1" style={{ color: '#8B9BB4' }}>Routines scientifiques adaptées au water-polo</p>
      </div>

      {/* Routines globales */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#E8B800' }}>Routines Complètes</h3>
        <div className="space-y-3">
          <button onClick={() => startRoutine('⚡ Activation Pré-Match', PRE_MATCH)} className="w-full p-5 rounded-2xl text-left transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, rgba(232,184,0,0.15), rgba(232,184,0,0.05))', border: '1px solid rgba(232,184,0,0.3)' }}>
            <div className="flex items-center gap-4">
              <span className="text-3xl">⚡</span>
              <div>
                <h3 className="font-display text-lg text-white uppercase">Activation Pré-Match</h3>
                <p className="text-xs" style={{ color: '#8B9BB4' }}>Éveiller le corps · Prévenir les blessures · {PRE_MATCH.length} exercices</p>
                <p className="text-xs font-bold mt-1" style={{ color: '#E8B800' }}>≈ 15-20 minutes</p>
              </div>
            </div>
          </button>

          <button onClick={() => startRoutine('🔄 Récupération Active', RECOVERY)} className="w-full p-5 rounded-2xl text-left transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))', border: '1px solid rgba(59,130,246,0.3)' }}>
            <div className="flex items-center gap-4">
              <span className="text-3xl">🔄</span>
              <div>
                <h3 className="font-display text-lg text-white uppercase">Récupération Active</h3>
                <p className="text-xs" style={{ color: '#8B9BB4' }}>Après entraînement · Réduire les courbatures · {RECOVERY.length} exercices</p>
                <p className="text-xs font-bold mt-1" style={{ color: '#60a5fa' }}>≈ 20-25 minutes</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Zone ciblée */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#E8B800' }}>Par Zone du Corps</h3>
        <button onClick={() => setView('JOINT_SELECT')} className="w-full p-5 rounded-2xl text-left transition-all active:scale-95" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-4">
            <span className="text-3xl">🗺️</span>
            <div>
              <h3 className="font-display text-lg text-white uppercase">Cibler une Zone</h3>
              <p className="text-xs" style={{ color: '#8B9BB4' }}>Cou · Épaule · Thorax · Dos · Hanche · Genou · Cheville</p>
              <div className="flex gap-2 mt-2">
                <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,184,0,0.15)', color: '#E8B800' }}>Mobilité</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>Stretching</span>
              </div>
            </div>
            <span className="ml-auto text-xl" style={{ color: '#8B9BB4' }}>→</span>
          </div>
        </button>
      </div>

      {/* Info message staff */}
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(26,58,122,0.2)', border: '1px solid rgba(232,184,0,0.15)' }}>
        <p className="text-xs" style={{ color: '#8B9BB4' }}>
          💡 <strong className="text-white">Conseil :</strong> En cas de douleur persistante, signale-le dans le <strong style={{ color: '#E8B800' }}>Check-in quotidien</strong> ou envoie un message direct au staff depuis l'onglet Profil.
        </p>
      </div>
    </div>
  );
};