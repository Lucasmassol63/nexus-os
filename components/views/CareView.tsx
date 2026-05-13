import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Exercise, Athlete } from '../../types';

interface CareViewProps { athlete: Athlete; }

const PRE_MATCH: Exercise[] = [
  { id: 'pm1', name: 'Réveil Fessier (Clamshells)', sets: 2, reps: '15/côté', tempo: 'Dynamique', rest: '0s', targetLoad: 'Élastique', instructions: 'Allongé sur le côté, ouvrir le genou vers le haut en gardant les pieds joints. Active les fessiers.' },
  { id: 'pm2', name: "World's Greatest Stretch", sets: 2, reps: '6/côté', tempo: 'Fluide', rest: '0s', targetLoad: 'PDC', instructions: 'Grande fente avant, main au sol côté jambe avancée, ouvrir le bras vers le ciel. Mobilité totale.' },
  { id: 'pm3', name: 'Sauts Pogo', sets: 2, reps: '20', tempo: 'Explosif', rest: '30s', targetLoad: 'PDC', instructions: 'Rebonds rapides sur les orteils, jambes quasi-tendues. Minimal contact sol. Active les réflexes.' },
  { id: 'pm4', name: 'Activation Épaules Élastique', sets: 2, reps: '15', tempo: 'Contrôlé', rest: '0s', targetLoad: 'Élastique', instructions: 'Rotation externe résistée, coude à 90°. Ouvrir lentement. Prépare la coiffe des rotateurs.' },
];

const BASE_WARMUP: Exercise[] = [
  { id: 'w1', name: 'Rotations Articulaires Globales', sets: 1, reps: '2 min', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Cou → épaules → coudes → poignets → hanches → genoux → chevilles. Cercles complets, 10 par articulation.' },
  { id: 'w2', name: 'Squat Profond Tenu', sets: 1, reps: '60s', tempo: 'Statique', rest: '0s', targetLoad: 'PDC', instructions: 'Pieds à largeur épaules, descendre le plus bas possible, dos droit. Tenir et respirer. Ouvre les hanches.' },
  { id: 'w3', name: 'Fente Latérale (Cossack)', sets: 2, reps: '8/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Grand écart, descendre lentement sur un côté. Active adducteurs et hanches.' },
];

const ROUTINES: Record<string, { mobility: Exercise[]; stretching: Exercise[] }> = {
  'Cou': {
    mobility: [
      { id: 'm-cou-1', name: 'Rétraction Menton', sets: 3, reps: '10', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Rentrer le menton (double menton). Tenir 2s. Renforce les fléchisseurs profonds du cou.' },
      { id: 'm-cou-2', name: 'CARs Cou', sets: 2, reps: '5/côté', tempo: 'Très lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotation maximale et contrôlée de la tête. 10 secondes par rotation. Ne jamais forcer.' },
    ],
    stretching: [
      { id: 's-cou-1', name: 'Étirement Trapèze', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Incliner la tête vers lépaule, épaule opposée vers le bas. Ne pas hausser lépaule.' },
      { id: 's-cou-2', name: 'Élévateur Scapula', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Regarder vers laisselle (45°), incliner la tête. Légère pression de la main.' },
    ],
  },
  'Épaule': {
    mobility: [
      { id: 'm-ep-1', name: 'Dislocations Bâton', sets: 3, reps: '10', tempo: 'Lent', rest: '0s', targetLoad: 'Bâton', instructions: 'Prise large sur le bâton, passer davant en arrière bras tendus. Réduire la prise progressivement.' },
      { id: 'm-ep-2', name: 'Pompes Scapulaires', sets: 3, reps: '12', tempo: '2020', rest: '30s', targetLoad: 'PDC', instructions: 'En planche, serrer les omoplates (baisser) puis les écarter (monter). Bras tendus tout le long.' },
      { id: 'm-ep-3', name: 'Wall Slides', sets: 3, reps: '10', tempo: '3030', rest: '30s', targetLoad: 'PDC', instructions: 'Dos au mur, bras en W, glisser vers le haut en gardant le contact. Lombaires plaquées.' },
    ],
    stretching: [
      { id: 's-ep-1', name: 'Étirement Pectoraux au Mur', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Main contre le mur, bras à 90°, tourner lentement le buste du côté opposé.' },
      { id: 's-ep-2', name: 'Sleeper Stretch', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Allongé sur le côté, bras tendu devant, pousser le poignet vers le sol. Capsule postérieure.' },
    ],
  },
  'Coude': {
    mobility: [
      { id: 'm-co-1', name: 'Pro/Supination Résistée', sets: 3, reps: '15', tempo: '2020', rest: '30s', targetLoad: 'Marteau', instructions: 'Coude fixe contre le corps, tourner le poignet paume haut puis paume bas. Lent et contrôlé.' },
      { id: 'm-co-2', name: 'Distraction Élastique', sets: 2, reps: '60s', tempo: 'Statique', rest: '0s', targetLoad: 'Élastique', instructions: 'Élastique attaché en haut, bras tendu dans la boucle. Laisser lélastique tirer larticulation.' },
    ],
    stretching: [
      { id: 's-co-1', name: 'Étirement Fléchisseurs Poignet', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Bras tendu, paume vers lavant, tirer doucement les doigts vers vous.' },
      { id: 's-co-2', name: 'Étirement Extenseurs Poignet', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Bras tendu, dos de la main en avant, plier le poignet vers le bas et tirer les doigts.' },
    ],
  },
  'Poignet': {
    mobility: [
      { id: 'm-po-1', name: 'CARs Poignet', sets: 3, reps: '5/côté', tempo: 'Très lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotation maximale et contrôlée du poignet dans les deux sens. 8 secondes par tour complet.' },
      { id: 'm-po-2', name: 'Pompes sur Poings', sets: 2, reps: '10', tempo: '2020', rest: '30s', targetLoad: 'PDC', instructions: 'Pompes sur les poings. Renforce lalignement du poignet sous charge.' },
    ],
    stretching: [
      { id: 's-po-1', name: 'Prière Descente', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Mains jointes en prière devant la poitrine, descendre lentement les mains.' },
      { id: 's-po-2', name: 'Prière Inversée', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Dos des mains joints, pousser les coudes vers le haut. Étire les fléchisseurs du poignet.' },
    ],
  },
  'Thorax': {
    mobility: [
      { id: 'm-th-1', name: 'Livre Ouvert', sets: 3, reps: '10/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Allongé sur le côté, genoux pliés, ouvrir le bras supérieur en rotation thoracique. Suivre du regard.' },
      { id: 'm-th-2', name: 'Extension Thoracique au Rouleau', sets: 3, reps: '10', tempo: 'Tenir 3s', rest: '30s', targetLoad: 'Rouleau', instructions: 'Rouleau sous les omoplates, bras croisés. Extension arrière en 3 segments différents.' },
    ],
    stretching: [
      { id: 's-th-1', name: 'Enfant Bras Latéral', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Posture de lenfant, un bras tendu vers le côté. Pousser le sol avec la paume.' },
      { id: 's-th-2', name: 'Suspension Décompression', sets: 3, reps: '30s', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Suspendu à une barre, relâcher le bas du corps. Décompresse la colonne.' },
    ],
  },
  'Dos': {
    mobility: [
      { id: 'm-do-1', name: 'Chat / Vache', sets: 3, reps: '12', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'À quatre pattes. Inspiration = dos creux (vache), expiration = dos rond (chat). Vertèbre par vertèbre.' },
      { id: 'm-do-2', name: 'Jefferson Curl', sets: 3, reps: '6', tempo: '5050', rest: '30s', targetLoad: 'Léger', instructions: 'Enrouler la colonne vertèbre par vertèbre de haut en bas puis dérouler. Charge très légère.' },
    ],
    stretching: [
      { id: 's-do-1', name: 'Posture de Enfant', sets: 2, reps: '90s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Assis sur les talons, bras tendus loin devant. Relâcher complètement le dos. Respiration profonde.' },
      { id: 's-do-2', name: 'Carré des Lombes Assis', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Assis, se pencher latéralement vers la jambe tendue. Sentir le flanc étirer.' },
    ],
  },
  'Hanche': {
    mobility: [
      { id: 'm-ha-1', name: '90/90 Switch', sets: 3, reps: '8/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Assis au sol, deux jambes en angle 90°. Passer dun côté à lautre. Dos droit.' },
      { id: 'm-ha-2', name: 'CARs Hanche', sets: 2, reps: '5/côté', tempo: 'Très lent', rest: '0s', targetLoad: 'PDC', instructions: 'Debout sur un pied, grand cercle avec le genou. Maximiser amplitude. 10s par cercle.' },
    ],
    stretching: [
      { id: 's-ha-1', name: 'Pigeon Allongé', sets: 2, reps: '90s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Jambe avant pliée devant, jambe arrière tendue. Sallonger vers lavant sur la jambe pliée.' },
      { id: 's-ha-2', name: 'Étirement Psoas', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Un genou au sol, pied opposé en avant. Pousser les hanches vers lavant. Dos droit.' },
    ],
  },
  'Genou': {
    mobility: [
      { id: 'm-ge-1', name: 'Rotation Tibiale Assis', sets: 3, reps: '10/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Assis, stabiliser la cuisse, tourner le pied en rotation interne puis externe.' },
      { id: 'm-ge-2', name: 'Step-up Petersen', sets: 3, reps: '12/côté', tempo: '2010', rest: '45s', targetLoad: 'PDC', instructions: 'Monter sur la pointe du pied sur une marche, descendre lentement. Focus sur le VMO.' },
    ],
    stretching: [
      { id: 's-ge-1', name: 'Quadriceps Talon-Fesse', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Debout, ramener le talon vers la fesse. Genoux alignés. Légère poussée de hanche en avant.' },
      { id: 's-ge-2', name: 'Ischio-Jambiers Surélevé', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Jambe tendue sur une surface, dos droit, pencher depuis les hanches.' },
    ],
  },
  'Cheville': {
    mobility: [
      { id: 'm-ch-1', name: 'Genou au Mur (Dorsiflexion)', sets: 3, reps: '10', tempo: 'Tenir 2s', rest: '0s', targetLoad: 'PDC', instructions: 'Pied à ~10cm du mur, avancer le genou sans décoller le talon. Chercher la limite.' },
      { id: 'm-ch-2', name: 'CARs Cheville', sets: 3, reps: '8/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Assis, tracer des cercles complets avec le pied. Maximiser amplitude dans chaque direction.' },
    ],
    stretching: [
      { id: 's-ch-1', name: 'Mollet Gastrocnémien', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Pousser contre un mur, jambe arrière tendue, talon au sol. Haut du mollet.' },
      { id: 's-ch-2', name: 'Soléaire Genou Fléchi', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Même position mais genou légèrement fléchi. Étire le soléaire plus profond.' },
    ],
  },
  'Pectoraux': {
    mobility: [
      { id: 'm-pe-1', name: 'Chest Fly Élastique', sets: 3, reps: '12', tempo: '2020', rest: '30s', targetLoad: 'Élastique', instructions: 'Bras légèrement fléchis, ouvrir et fermer devant la poitrine. Contrôler la fermeture (excentrique).' },
      { id: 'm-pe-2', name: 'Rotation Externe Épaule', sets: 3, reps: '15', tempo: '2020', rest: '30s', targetLoad: 'Élastique', instructions: 'Coude à 90° contre le corps, ouvrir le bras vers lextérieur. Antagoniste des pectoraux.' },
    ],
    stretching: [
      { id: 's-pe-1', name: 'Étirement Pec en Porte', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Bras à 90° contre le cadre de porte, tourner le buste du côté opposé.' },
      { id: 's-pe-2', name: 'Bras en Croix au Sol', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Allongé, un bras tendu à 90°, laisser la gravité étirer le pectoral.' },
    ],
  },
  'Grand Dorsal': {
    mobility: [
      { id: 'm-gd-1', name: 'Grand Dorsal Barre Haute', sets: 3, reps: '60s', tempo: 'Statique', rest: '30s', targetLoad: 'PDC', instructions: 'Mains sur une barre épaules, pousser les hanches en arrière. Dos plat.' },
      { id: 'm-gd-2', name: 'Rotation Tronc Assise', sets: 3, reps: '8/côté', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Assis, croiser les bras, tourner le tronc de chaque côté. Amplifier à chaque répétition.' },
    ],
    stretching: [
      { id: 's-gd-1', name: 'Cobra', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Allongé ventre, bras tendus, relever le buste. Hanches au sol. Expirer vers le haut.' },
      { id: 's-gd-2', name: 'Balançoire Latérale', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Debout, un bras levé, se pencher latéralement. Sentir le flanc et le grand dorsal.' },
    ],
  },
  'Quadriceps': {
    mobility: [
      { id: 'm-qu-1', name: 'Step-up Petersen', sets: 3, reps: '12/côté', tempo: '2010', rest: '45s', targetLoad: 'PDC', instructions: 'Monter sur la pointe du pied sur une marche, descendre lentement. Travaille le VMO.' },
      { id: 'm-qu-2', name: 'Sissy Squat Assisté', sets: 3, reps: '8', tempo: '3030', rest: '60s', targetLoad: 'PDC', instructions: 'Tenir un support, saccroupir en avançant les genoux. Contrôle excentrique.' },
    ],
    stretching: [
      { id: 's-qu-1', name: 'Quadriceps Debout', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Debout, talon vers la fesse. Pousser légèrement la hanche en avant pour maximiser.' },
      { id: 's-qu-2', name: 'Fente Arrière Quad', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Genou arrière au sol, piquer les hanches vers lavant. Dos droit, pas de cambrure.' },
    ],
  },
  'Ischio-Jambiers': {
    mobility: [
      { id: 'm-is-1', name: 'Nordic Curl Excentrique', sets: 3, reps: '5', tempo: '5010', rest: '90s', targetLoad: 'PDC', instructions: 'Chevilles tenues, descendre très lentement vers lavant. Prévention des élongations.' },
      { id: 'm-is-2', name: 'RDL Haltères', sets: 3, reps: '10', tempo: '3030', rest: '60s', targetLoad: 'Léger', instructions: 'Descendre les haltères le long des cuisses, dos droit. Sentir les ischios étirer.' },
    ],
    stretching: [
      { id: 's-is-1', name: 'Ischio Jambe Surélevée', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Jambe sur une surface élevée, dos droit, pencher depuis les hanches.' },
      { id: 's-is-2', name: 'Stretch RDL Passif', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Assis jambes tendues, pencher en avant sans arrondir le dos. Respiration lente.' },
    ],
  },
  'Adducteurs': {
    mobility: [
      { id: 'm-ad-1', name: 'Cossack Squat', sets: 3, reps: '8/côté', tempo: '2020', rest: '30s', targetLoad: 'PDC', instructions: 'Grand écart, descendre sur un côté en gardant pied opposé à plat. Dos droit.' },
      { id: 'm-ad-2', name: 'Copenhagen Hold', sets: 3, reps: '30s/côté', tempo: 'Statique', rest: '45s', targetLoad: 'PDC', instructions: 'En appui latéral, cheville sur surface. Soulever le corps. Renforce adducteur supérieur.' },
    ],
    stretching: [
      { id: 's-ad-1', name: 'Papillon', sets: 2, reps: '90s', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Assis, plantes de pieds jointes, pousser les genoux vers le sol. Dos droit. Respirer.' },
      { id: 's-ad-2', name: 'Grand Écart Latéral', sets: 2, reps: '90s', tempo: 'Progressif', rest: '15s', targetLoad: 'PDC', instructions: 'Jambes écartées au maximum, mains au sol. Progresser sur chaque expiration.' },
    ],
  },
  'Fessiers': {
    mobility: [
      { id: 'm-fe-1', name: 'Hip Thrust PDC', sets: 3, reps: '15', tempo: '2021', rest: '45s', targetLoad: 'PDC', instructions: 'Épaules sur banc, monter les hanches, serrer les fessiers en haut. Tenir 1 seconde.' },
      { id: 'm-fe-2', name: 'Clamshell Élastique', sets: 3, reps: '15/côté', tempo: 'Dynamique', rest: '30s', targetLoad: 'Élastique', instructions: 'Allongé sur le côté avec élastique, ouvrir le genou sans bouger le bassin.' },
    ],
    stretching: [
      { id: 's-fe-1', name: 'Figure 4 Allongé', sets: 2, reps: '90s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Allongé, croiser la cheville sur genou opposé, tirer la jambe vers la poitrine.' },
      { id: 's-fe-2', name: 'Pigeon Fessier', sets: 2, reps: '90s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Jambe pliée à 90° devant, jambe arrière tendue. Sallonger vers lavant.' },
    ],
  },
  'Mollets': {
    mobility: [
      { id: 'm-mo-1', name: 'Mollets Excentriques', sets: 3, reps: '10', tempo: '4010', rest: '60s', targetLoad: 'PDC', instructions: 'Monter sur 2 pieds sur une marche, descendre sur 1 seul en 4 secondes. Prévention tendinite.' },
      { id: 'm-mo-2', name: 'Sauts Pogo', sets: 3, reps: '20', tempo: 'Explosif', rest: '45s', targetLoad: 'PDC', instructions: 'Rebonds rapides sur les orteils, minimal contact sol. Active le réflexe élongation-raccourcissement.' },
    ],
    stretching: [
      { id: 's-mo-1', name: 'Gastrocnémien Mur', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Pousser contre un mur, jambe arrière complètement tendue, talon au sol.' },
      { id: 's-mo-2', name: 'Soléaire Genou Fléchi', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Même position mais genou légèrement fléchi. Étire le soléaire, plus profond.' },
    ],
  },
};

interface Zone { id: string; x: number; y: number; bilateral?: boolean; }

const JOINT_ZONES: Zone[] = [
  { id: 'Cou',      x: 50, y: 10  },
  { id: 'Épaule',   x: 29, y: 18,  bilateral: true },
  { id: 'Coude',    x: 22, y: 32,  bilateral: true },
  { id: 'Poignet',  x: 17, y: 46,  bilateral: true },
  { id: 'Thorax',   x: 50, y: 23  },
  { id: 'Dos',      x: 50, y: 36  },
  { id: 'Hanche',   x: 38, y: 52,  bilateral: true },
  { id: 'Genou',    x: 36, y: 72,  bilateral: true },
  { id: 'Cheville', x: 36, y: 90,  bilateral: true },
];

const MUSCLE_ZONES: Zone[] = [
  { id: 'Pectoraux',         x: 50, y: 22  },
  { id: 'Grand Dorsal',      x: 50, y: 31  },
  { id: 'Quadriceps',        x: 36, y: 63,  bilateral: true },
  { id: 'Ischio-Jambiers',   x: 38, y: 68,  bilateral: true },
  { id: 'Adducteurs',        x: 43, y: 57,  bilateral: true },
  { id: 'Fessiers',          x: 41, y: 54,  bilateral: true },
  { id: 'Mollets',           x: 37, y: 80,  bilateral: true },
];

const BodyFigure: React.FC<{ zones: Zone[]; dotColor: string; shape: 'circle' | 'diamond'; onSelect: (id: string) => void; selected: string | null; }> = ({ zones, dotColor, shape, onSelect, selected }) => {
  const dots = zones.flatMap(z => {
    if (z.bilateral) return [
      { id: z.id, key: z.id + '-L', x: z.x,       y: z.y },
      { id: z.id, key: z.id + '-R', x: 100 - z.x, y: z.y },
    ];
    return [{ id: z.id, key: z.id, x: z.x, y: z.y }];
  });
  return (
    <div className="relative flex justify-center">
      <div className="relative" style={{ width: 130, height: 310 }}>
        <svg viewBox="0 0 200 470" width="130" height="310">
          <g fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
            <ellipse cx="100" cy="28" rx="18" ry="22" />
            <path d="M100 50 L100 57" />
            <path d="M100 57 Q130 57 140 65 Q150 70 150 90 L152 150 L154 215 L150 225 L146 215 L135 150 L125 105 L125 220 L135 320 L130 420 L110 420 L105 320 L100 250 L95 320 L90 420 L70 410 L65 320 L75 220 L75 105 L65 150 L54 215 L50 225 L46 215 L48 150 L50 90 Q50 70 60 65 Q70 58 100 58" />
            <path d="M77 218 L123 218" strokeOpacity="0.4" />
          </g>
        </svg>
        {dots.map(dot => (
          <button key={dot.key} onClick={() => onSelect(dot.id)}
            style={{ position: 'absolute', left: `${dot.x}%`, top: `${dot.y}%`, transform: 'translate(-50%,-50%)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {shape === 'circle' ? (
              <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: dotColor, boxShadow: `0 0 8px ${dotColor}`, border: '2px solid rgba(255,255,255,0.5)', transition: 'transform 0.2s' }}
                className={`${selected === dot.id ? 'scale-150' : ''} hover:scale-150`} />
            ) : (
              <div style={{ width: 12, height: 12, transform: `rotate(45deg)${selected === dot.id ? ' scale(1.5)' : ''}`, backgroundColor: dotColor + 'CC', boxShadow: `0 0 6px ${dotColor}80`, border: '1px solid rgba(255,255,255,0.3)', transition: 'transform 0.2s' }}
                className="hover:scale-150" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const parseSeconds = (str: string): number | null => {
  const min = str.match(/(\d+)\s*min/); if (min) return parseInt(min[1]) * 60;
  const sec = str.match(/(\d+)\s*s/);   if (sec && !str.includes('/')) return parseInt(sec[1]);
  return null;
};
const isTimedRep = (reps: string) => /^\d+s$|^\d+min$/.test(reps.trim());
const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;

const SessionRunner: React.FC<{ exercises: Exercise[]; title: string; zone: string; onFinish: () => void }> = ({ exercises, title, zone, onFinish }) => {
  const [exIdx, setExIdx]       = useState(0);
  const [setNum, setSetNum]     = useState(1);
  const [phase, setPhase]       = useState<'READY'|'WORKING'|'REST'|'DONE'>('READY');
  const [timeLeft, setTimeLeft] = useState<number|null>(null);
  const [maxTime, setMaxTime]   = useState<number>(1);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const ex = exercises[exIdx];
  const totalEx = exercises.length;
  const totalSets = ex?.sets ?? 1;

  const clearT = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const startTimer = (secs: number, nextPhase: 'READY'|'REST'|'DONE') => {
    setMaxTime(secs); setTimeLeft(secs); clearT();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) { clearT(); setPhase(nextPhase); return null; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearT(), []);

  const handleStart = () => {
    if (isTimedRep(ex.reps)) {
      const s = parseSeconds(ex.reps);
      if (s) { setPhase('WORKING'); startTimer(s, 'REST'); return; }
    }
    setPhase('WORKING');
  };

  const handleSetDone = () => {
    clearT();
    const rest = parseSeconds(ex.rest);
    if (rest && rest > 0 && setNum < totalSets) { setPhase('REST'); startTimer(rest, 'READY'); }
    else advance();
  };

  const advance = () => {
    clearT();
    if (setNum < totalSets) { setSetNum(s => s + 1); setPhase('READY'); }
    else if (exIdx < totalEx - 1) { setExIdx(i => i + 1); setSetNum(1); setPhase('READY'); }
    else setPhase('DONE');
  };

  const pct = Math.round(((exIdx / totalEx) + ((setNum - 1) / totalSets / totalEx)) * 100);

  if (phase === 'DONE') return (
    <div className="text-center py-16 space-y-6">
      <div className="text-7xl">🏆</div>
      <h2 className="font-display text-3xl text-nexus-gold uppercase">Routine Terminée !</h2>
      <p className="text-nexus-gray text-sm">{totalEx} exercices · {title} · {zone}</p>
      <Button fullWidth onClick={onFinish} className="bg-nexus-gold text-black border-none">Fermer</Button>
    </div>
  );

  return (
    <div className="space-y-5 pb-32">
      <div className="flex items-center gap-3">
        <button onClick={onFinish} className="text-nexus-gray hover:text-white text-lg">←</button>
        <div className="flex-1">
          <p className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest">{zone} · {title}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full">
              <div className="h-1.5 bg-nexus-gold rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-nexus-gold font-bold tabular-nums">{pct}%</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-nexus-gray uppercase font-bold tracking-widest px-1">
        <span>Exercice {exIdx + 1} / {totalEx}</span>
        <span>Série {setNum} / {totalSets}</span>
      </div>

      <GlassCard className="p-6 space-y-5 border-l-4 border-l-nexus-gold">
        <div>
          <h2 className="font-display text-2xl text-white uppercase leading-tight">{ex.name}</h2>
          <p className="text-nexus-gray text-xs uppercase tracking-widest mt-0.5">{ex.targetLoad}</p>
        </div>

        {ex.instructions && (
          <div className="bg-black/40 rounded-xl p-4 border-l-2 border-nexus-gold/50">
            <p className="text-[10px] text-nexus-gray uppercase font-bold mb-1">📋 Consigne</p>
            <p className="text-white text-sm leading-relaxed">{ex.instructions}</p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 text-center">
          {[['Série', `${setNum}/${totalSets}`], ['Reps', ex.reps], ['Repos', ex.rest], ['Tempo', ex.tempo]].map(([l,v]) => (
            <div key={l} className="bg-black/30 rounded-lg p-2 border border-white/5">
              <p className="text-[9px] text-nexus-gray uppercase">{l}</p>
              <p className="text-white font-display font-bold text-sm">{v}</p>
            </div>
          ))}
        </div>

        {phase === 'READY' && (
          <button onClick={handleStart} className="w-full py-5 rounded-2xl bg-nexus-gold text-black font-display text-xl font-bold uppercase tracking-wider shadow-[0_0_30px_rgba(232,184,0,0.3)] active:scale-95 transition-all">
            ▶ Démarrer la série
          </button>
        )}

        {phase === 'WORKING' && isTimedRep(ex.reps) && timeLeft !== null && (
          <div className="text-center space-y-4">
            <div className="relative w-32 h-32 mx-auto">
              <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#E8B800" strokeWidth="8"
                  strokeDasharray={`${2*Math.PI*45}`}
                  strokeDashoffset={`${2*Math.PI*45*(1 - timeLeft/maxTime)}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-3xl text-white font-bold">{fmt(timeLeft)}</span>
              </div>
            </div>
            <p className="text-nexus-gold text-sm font-bold uppercase tracking-widest animate-pulse">⏳ En cours…</p>
            <button onClick={handleSetDone} className="text-[10px] text-nexus-gray underline hover:text-white">Passer</button>
          </div>
        )}

        {phase === 'WORKING' && !isTimedRep(ex.reps) && (
          <div className="text-center space-y-4">
            <div className="bg-nexus-gold/10 border border-nexus-gold/30 rounded-2xl py-6">
              <p className="font-display text-5xl text-nexus-gold font-bold">{ex.reps}</p>
              <p className="text-nexus-gray text-xs uppercase mt-1 tracking-widest">répétitions</p>
            </div>
            <button onClick={handleSetDone} className="w-full py-4 rounded-2xl bg-green-500 text-white font-display text-lg font-bold uppercase shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all">
              ✓ Série terminée
            </button>
          </div>
        )}

        {phase === 'REST' && timeLeft !== null && (
          <div className="text-center space-y-4">
            <p className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest">Repos — Prépare la série {setNum + 1}</p>
            <div className="relative w-32 h-32 mx-auto">
              <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#3B82F6" strokeWidth="8"
                  strokeDasharray={`${2*Math.PI*45}`}
                  strokeDashoffset={`${2*Math.PI*45*(1 - timeLeft/maxTime)}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-3xl text-white font-bold">{fmt(timeLeft)}</span>
              </div>
            </div>
            <button onClick={advance} className="w-full py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-bold uppercase hover:bg-blue-500 hover:text-white transition-all">
              ➡ Passer le repos
            </button>
          </div>
        )}
      </GlassCard>

      {exIdx < totalEx - 1 && (
        <div>
          <p className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-2">Suivants</p>
          {exercises.slice(exIdx + 1).map((e, i) => (
            <div key={e.id} className="py-2 px-3 rounded-xl border border-white/5 mb-1 flex justify-between items-center opacity-40">
              <span className="text-white text-sm">{e.name}</span>
              <span className="text-nexus-gray text-xs">{e.sets}×{e.reps}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const CareView: React.FC<CareViewProps> = ({ athlete }) => {
  const [selectedZone, setSelectedZone]               = useState<string|null>(null);
  const [routineType, setRoutineType]                 = useState<'mobility'|'stretching'|null>(null);
  const [activeGlobal, setActiveGlobal]               = useState<string|null>(null);
  const [runningSession, setRunningSession]           = useState<{exercises:Exercise[];title:string}|null>(null);

  const getRoutine = (zone: string, type: 'mobility'|'stretching') => ROUTINES[zone]?.[type] ?? [];

  const generateWarmUp = () => {
    const out = [...BASE_WARMUP];
    const map: Record<string,string> = { 'Cheville G':'Cheville', 'Épaule G':'Épaule', 'Hanche G':'Hanche', 'Adducteur':'Adducteurs' };
    athlete.performance.flexibility.forEach(m => {
      if (m.A < 75) { const k = map[m.subject]; if (k && ROUTINES[k]) { const ex = ROUTINES[k].mobility[0]; if (!out.find(e=>e.id===ex.id)) out.push({...ex, name:`${ex.name} (${m.subject})`}); }}
    });
    return out;
  };

  if (runningSession) return (
    <div className="px-6 pt-4">
      <SessionRunner exercises={runningSession.exercises} title={runningSession.title}
        zone={selectedZone ?? activeGlobal ?? ''}
        onFinish={() => { setRunningSession(null); setRoutineType(null); setSelectedZone(null); setActiveGlobal(null); }} />
    </div>
  );

  if (activeGlobal) {
    const exercises = activeGlobal === 'PRE_MATCH' ? PRE_MATCH : generateWarmUp();
    const title = activeGlobal === 'PRE_MATCH' ? 'Pré-Match' : 'Échauffement';
    return (
      <div className="px-6 space-y-4 animate-in fade-in pb-24">
        <button onClick={() => setActiveGlobal(null)} className="text-nexus-gray text-xs font-bold uppercase tracking-widest flex items-center gap-2">← Retour</button>
        <div className="flex justify-between items-end border-b border-white/10 pb-4">
          <div><h2 className="font-display text-3xl text-white uppercase">{title}</h2><p className="text-nexus-gray text-sm">{exercises.length} exercices</p></div>
          <Button onClick={() => setRunningSession({ exercises, title })} className="bg-nexus-gold text-black border-none">▶ Démarrer</Button>
        </div>
        <div className="space-y-3">
          {exercises.map((ex,i) => (
            <GlassCard key={ex.id} className="p-4 border-l-2 border-l-nexus-gold">
              <div className="flex justify-between items-start mb-1">
                <div><p className="text-[10px] text-nexus-gray">#{i+1}</p><h3 className="text-white font-bold">{ex.name}</h3></div>
                <span className="text-nexus-gold font-mono">{ex.sets}×{ex.reps}</span>
              </div>
              {ex.instructions && <p className="text-xs text-nexus-gray italic border-l border-white/20 pl-3 mt-2">{ex.instructions}</p>}
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  if (selectedZone && !routineType) {
    const has = !!ROUTINES[selectedZone];
    const isJoint = JOINT_ZONES.some(z => z.id === selectedZone);
    return (
      <div className="px-6 space-y-6 animate-in fade-in pb-24">
        <button onClick={() => setSelectedZone(null)} className="text-nexus-gray text-xs font-bold uppercase tracking-widest flex items-center gap-2">← Carte</button>
        <div className="text-center">
          <div className="text-4xl mb-2">{isJoint ? '🔴' : '🔵'}</div>
          <h2 className="font-display text-4xl text-nexus-gold uppercase">{selectedZone}</h2>
          <p className="text-nexus-gray text-xs uppercase tracking-wide mt-1">{isJoint ? 'Articulation' : 'Muscle'}</p>
        </div>
        {!has ? <p className="text-center text-nexus-gray italic">Protocole en cours d'ajout.</p> : (
          <div className="grid gap-4">
            <GlassCard onClick={() => setRoutineType('mobility')} className="p-8 text-center cursor-pointer hover:bg-white/5 border-l-4 border-l-nexus-gold">
              <h3 className="font-display text-2xl text-white uppercase mb-1">Mobilité</h3>
              <p className="text-nexus-gray text-xs">{ROUTINES[selectedZone].mobility.length} exercices · ~15 min</p>
            </GlassCard>
            <GlassCard onClick={() => setRoutineType('stretching')} className="p-8 text-center cursor-pointer hover:bg-white/5 border-l-4 border-l-nexus-red">
              <h3 className="font-display text-2xl text-white uppercase mb-1">Stretching</h3>
              <p className="text-nexus-gray text-xs">{ROUTINES[selectedZone].stretching.length} exercices · ~15 min</p>
            </GlassCard>
          </div>
        )}
      </div>
    );
  }

  if (selectedZone && routineType) {
    const exercises = getRoutine(selectedZone, routineType);
    const title = routineType === 'mobility' ? 'Mobilité' : 'Stretching';
    return (
      <div className="px-6 space-y-4 animate-in fade-in pb-24">
        <div className="flex items-center justify-between">
          <button onClick={() => setRoutineType(null)} className="text-nexus-gray text-xs font-bold uppercase tracking-widest flex items-center gap-2">← Choix</button>
          <span className="text-nexus-gold text-xs font-bold px-3 py-1 bg-nexus-gold/10 rounded-full border border-nexus-gold/20">⏱ ~15 min</span>
        </div>
        <div className="flex justify-between items-end border-b border-white/10 pb-4">
          <div><h2 className="font-display text-3xl text-white uppercase">{selectedZone}</h2><p className="text-nexus-gold font-display text-xl uppercase">{title}</p></div>
          <Button onClick={() => setRunningSession({ exercises, title })} className="bg-nexus-gold text-black border-none">▶ Démarrer</Button>
        </div>
        <div className="space-y-3">
          {exercises.map((ex,i) => (
            <GlassCard key={ex.id} className="p-4 border-l-2 border-l-white/20">
              <div className="flex justify-between mb-1">
                <div><p className="text-[10px] text-nexus-gray">#{i+1}</p><h3 className="text-white font-bold text-sm uppercase">{ex.name}</h3></div>
                <span className="text-nexus-gold font-mono text-sm">{ex.sets}×{ex.reps}</span>
              </div>
              {ex.instructions && <p className="text-xs text-nexus-gray italic border-l border-white/20 pl-3">{ex.instructions}</p>}
              <div className="grid grid-cols-4 gap-1 mt-3">
                {[['Séries',ex.sets],['Reps',ex.reps],['Repos',ex.rest],['Tempo',ex.tempo]].map(([l,v]) => (
                  <div key={String(l)} className="bg-black/30 rounded p-1.5 text-center border border-white/5">
                    <p className="text-[8px] text-nexus-gray uppercase">{l}</p>
                    <p className="text-white font-bold text-xs">{v}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 space-y-6 pb-32 animate-in fade-in">
      <div className="grid grid-cols-2 gap-3 mt-2">
        <GlassCard onClick={() => setActiveGlobal('PRE_MATCH')} className="p-4 text-center cursor-pointer hover:bg-white/5 h-20 flex flex-col items-center justify-center border-nexus-red/30">
          <span className="text-xl">🔥</span><span className="font-display font-bold text-white uppercase text-sm">Pré-Match</span>
          <span className="text-[9px] text-nexus-gray">15 min</span>
        </GlassCard>
        <GlassCard onClick={() => setActiveGlobal('WARMUP')} className="p-4 text-center cursor-pointer hover:bg-white/5 h-20 flex flex-col items-center justify-center border-nexus-gold/30">
          <span className="text-xl">⚡️</span><span className="font-display font-bold text-white uppercase text-sm">Échauffement</span>
          <span className="text-[9px] text-nexus-gray">Adapté · 15 min</span>
        </GlassCard>
      </div>

      <div>
        <h3 className="text-center font-display text-xl text-white uppercase tracking-widest mb-1">Carte Corporelle</h3>
        <p className="text-center text-nexus-gray text-[10px] uppercase tracking-[0.2em] mb-5">Touche une zone douloureuse</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-center text-[10px] font-bold uppercase tracking-wider text-nexus-red mb-2">🔴 Articulations</p>
            <BodyFigure zones={JOINT_ZONES} dotColor="#E52E01" shape="circle" onSelect={setSelectedZone} selected={selectedZone} />
          </div>
          <div>
            <p className="text-center text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">🔵 Muscles</p>
            <BodyFigure zones={MUSCLE_ZONES} dotColor="#3B82F6" shape="diamond" onSelect={setSelectedZone} selected={selectedZone} />
          </div>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-3">Toutes les zones</p>
        <div className="grid grid-cols-2 gap-2">
          {[...JOINT_ZONES, ...MUSCLE_ZONES].filter((z,i,a)=>a.findIndex(x=>x.id===z.id)===i).map(zone => {
            const isJoint = JOINT_ZONES.some(j=>j.id===zone.id);
            return (
              <button key={zone.id} onClick={() => setSelectedZone(zone.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-bold uppercase tracking-wide transition-all ${isJoint ? 'border-nexus-red/20 bg-nexus-red/5 text-white hover:bg-nexus-red/15' : 'border-blue-500/20 bg-blue-500/5 text-white hover:bg-blue-500/15'}`}>
                <span className={isJoint ? 'text-nexus-red' : 'text-blue-400'}>{isJoint ? '●' : '◆'}</span>
                {zone.id}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
