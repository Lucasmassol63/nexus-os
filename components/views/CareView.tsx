import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Exercise, Athlete } from '../../types';

interface CareViewProps {
  athlete: Athlete;
}

// ─── EXERCISES DATABASE ──────────────────────────────────────────────────────

const PRE_MATCH_ROUTINE: Exercise[] = [
  { id: 'pm1', name: 'Réveil Fessier (Clamshells)', sets: 2, reps: '15/côté', tempo: 'Dynamique', rest: '0s', targetLoad: 'Élastique', instructions: 'Activation rapide des fessiers.' },
  { id: 'pm2', name: "World's Greatest Stretch", sets: 2, reps: '6/côté', tempo: 'Fluide', rest: '0s', targetLoad: 'PDC', instructions: 'Grande fente avec rotation thoracique.' },
  { id: 'pm3', name: 'Sauts Pogo', sets: 2, reps: '20', tempo: 'Explosif', rest: '30s', targetLoad: 'PDC', instructions: 'Rebonds chevilles jambes tendues.' },
  { id: 'pm4', name: 'Shadow Boxing / Mouvements', sets: 1, reps: '45s', tempo: 'Rapide', rest: '0s', targetLoad: 'PDC', instructions: 'Monter le cardio progressivement.' },
];

const BASE_WARMUP: Exercise[] = [
  { id: 'w1', name: 'Rotations Articulaires (Cou, Épaules, Hanches)', sets: 1, reps: '1 min', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Réveil articulaire global.' },
  { id: 'w2', name: 'Squat Profond (Tenue)', sets: 1, reps: '45s', tempo: 'Statique', rest: '0s', targetLoad: 'PDC', instructions: 'Ouvrir les hanches en bas du squat.' },
];

// ─── ROUTINES (Articulations + Muscles) ─────────────────────────────────────
const ROUTINES: Record<string, { mobility: Exercise[]; stretching: Exercise[] }> = {
  // ── ARTICULATIONS ──
  Cou: {
    mobility: [
      { id: 'm1', name: 'Rétraction Menton', sets: 3, reps: '10', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Rentrer le menton pour créer un double menton (fléchisseurs profonds).' },
      { id: 'm2', name: 'Rotations Cou (CARs)', sets: 3, reps: '5/côté', tempo: 'Très lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotations contrôlées dans toute l\'amplitude, très lentement.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Trapèzes', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Incliner la tête sur le côté, épaule opposée basse.' },
      { id: 's2', name: 'Élévateur Scapula', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: "Regarder vers l'aisselle et tirer doucement la tête." },
    ],
  },
  Épaule: {
    mobility: [
      { id: 'm1', name: 'Dislocations Bâton', sets: 3, reps: '10', tempo: 'Lent', rest: '0s', targetLoad: 'Bâton', instructions: "Passer le bâton d'avant en arrière bras tendus." },
      { id: 'm2', name: 'Pompes Scapulaires', sets: 3, reps: '12', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Serrer et écarter les omoplates bras tendus.' },
      { id: 'm3', name: 'Glissements Muraux (Wall Slides)', sets: 3, reps: '10', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Dos au mur, glisser les bras vers le haut en gardant le contact.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Pectoraux au Mur', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Main contre un mur, tourner le buste du côté opposé.' },
      { id: 's2', name: 'Capsule Postérieure (Sleeper Stretch)', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Allongé côté, bras tendu devant, pousser le poignet vers le sol.' },
    ],
  },
  Coude: {
    mobility: [
      { id: 'm1', name: 'Distraction Élastique', sets: 2, reps: '60s', tempo: 'Statique', rest: '0s', targetLoad: 'Élastique', instructions: 'Élastique attaché haut, bras tendu, laisser tirer.' },
      { id: 'm2', name: 'Pro/Supination', sets: 3, reps: '15', tempo: '2020', rest: '0s', targetLoad: 'Léger', instructions: 'Rotation du poignet avec marteau ou petit poids.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Fléchisseurs Poignet', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Bras tendu, paume vers l\'avant, tirer les doigts.' },
      { id: 's2', name: 'Étirement Extenseurs Poignet', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Bras tendu, dos de la main vers l\'avant.' },
    ],
  },
  Poignet: {
    mobility: [
      { id: 'm1', name: 'Rotations Poignet (CARs)', sets: 3, reps: '5/côté', tempo: 'Très lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotations articulaires contrôlées maximales.' },
      { id: 'm2', name: 'Pompes sur Poings', sets: 2, reps: '10', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Sur les poings pour renforcer l\'alignement du poignet.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Prière', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Mains jointes devant le cœur, descendre les mains.' },
      { id: 's2', name: 'Prière Inversée', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Dos des mains l\'un contre l\'autre, monter les coudes.' },
    ],
  },
  Thorax: {
    mobility: [
      { id: 'm1', name: 'Livre Ouvert', sets: 3, reps: '10/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Allongé sur le côté, ouvrir le bras en suivant du regard.' },
      { id: 'm2', name: 'Extension Thoracique au Rouleau', sets: 3, reps: '10', tempo: 'Tenir 3s', rest: '0s', targetLoad: 'Rouleau', instructions: 'Rouleau sous les omoplates, extension arrière.' },
    ],
    stretching: [
      { id: 's1', name: 'Grand Dorsal au Mur', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Mains au mur, pousser les fesses en arrière.' },
      { id: 's2', name: 'Suspension Barre', sets: 3, reps: '30s', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Suspendu pour décompresser la colonne.' },
    ],
  },
  Dos: {
    mobility: [
      { id: 'm1', name: 'Chat / Vache', sets: 3, reps: '10', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Alterner dos rond et dos creux, vertèbre par vertèbre.' },
      { id: 'm2', name: 'Jefferson Curl', sets: 3, reps: '5', tempo: '5050', rest: '0s', targetLoad: 'Léger', instructions: 'Enroulement complet de la colonne avec charge légère.' },
    ],
    stretching: [
      { id: 's1', name: "Posture de l'Enfant", sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Fesses sur les talons, bras loin devant.' },
      { id: 's2', name: 'Carré des Lombes', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Étirement du carré des lombaires assis ou debout.' },
    ],
  },
  Hanche: {
    mobility: [
      { id: 'm1', name: '90/90 Switch', sets: 3, reps: '8/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotation interne/externe des hanches au sol.' },
      { id: 'm2', name: 'Rotations Hanche (CARs)', sets: 3, reps: '5/côté', tempo: 'Très lent', rest: '0s', targetLoad: 'PDC', instructions: 'Grands cercles avec le genou, debout.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Psoas', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Genou au sol, hanches vers l\'avant, dos droit.' },
      { id: 's2', name: 'Posture du Pigeon', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Jambe pliée devant, jambe tendue derrière.' },
    ],
  },
  Genou: {
    mobility: [
      { id: 'm1', name: 'Rotation Tibiale', sets: 3, reps: '10', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Assis, tourner le pied int/ext en bloquant le fémur.' },
      { id: 'm2', name: 'Step-up Petersen', sets: 3, reps: '12', tempo: '2010', rest: '0s', targetLoad: 'PDC', instructions: 'Montée sur pointe de pied sur petite marche (Vaste Interne).' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Quadriceps', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Talon fesse debout ou allongé.' },
      { id: 's2', name: 'Ischio-Jambiers', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Jambe surélevée, dos droit.' },
    ],
  },
  Cheville: {
    mobility: [
      { id: 'm1', name: 'Genou au Mur (Dorsiflexion)', sets: 3, reps: '10', tempo: 'Tenir 2s', rest: '0s', targetLoad: 'PDC', instructions: 'Avancer le genou sans décoller le talon.' },
      { id: 'm2', name: 'Rotations Cheville (CARs)', sets: 3, reps: '10/côté', tempo: 'Lent', rest: '0s', targetLoad: 'PDC', instructions: 'Rotations maximales de la cheville.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Mollet', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Pousser le mur, jambe arrière tendue.' },
      { id: 's2', name: 'Étirement Soléaire', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Même chose genou légèrement fléchi.' },
    ],
  },

  // ── GROUPES MUSCULAIRES ──
  Pectoraux: {
    mobility: [
      { id: 'm1', name: 'Ouvertures Bras (Chest Fly Debout)', sets: 3, reps: '12', tempo: '2020', rest: '30s', targetLoad: 'Élastique', instructions: 'Bras légèrement fléchis, ouvrir et fermer devant la poitrine.' },
      { id: 'm2', name: 'Rotation Externe Épaule', sets: 3, reps: '15', tempo: '2020', rest: '0s', targetLoad: 'Élastique', instructions: 'Coude à 90°, tourner le bras vers l\'extérieur en résistance.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Pecs en Porte', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Bras à 90° contre le cadre de porte, tourner le buste.' },
      { id: 's2', name: 'Bras en Croix au Sol', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Allongé, bras tendu en croix, laisser la gravité étirer le pec.' },
    ],
  },
  'Grand Dorsal': {
    mobility: [
      { id: 'm1', name: 'Tirages en Rotation', sets: 3, reps: '10/côté', tempo: '2020', rest: '30s', targetLoad: 'Élastique', instructions: 'Tirer le coude vers le bas en rotation externe.' },
      { id: 'm2', name: 'Étirement Actif Grand Dorsal', sets: 3, reps: '8', tempo: '3030', rest: '0s', targetLoad: 'PDC', instructions: 'Bras levés, grandir vers le haut puis relâcher.' },
    ],
    stretching: [
      { id: 's1', name: 'Grand Dorsal à la Barre', sets: 2, reps: '60s', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Mains sur une barre à hauteur des épaules, pousser les hanches en arrière.' },
      { id: 's2', name: 'Cobra au Sol', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Allongé ventre, bras tendus, relever le buste. Hanches au sol.' },
    ],
  },
  Biceps: {
    mobility: [
      { id: 'm1', name: 'Rotations Avant-Bras', sets: 3, reps: '10', tempo: '2020', rest: '0s', targetLoad: 'PDC', instructions: 'Coude fixe, tourner la paume vers le haut et le bas.' },
      { id: 'm2', name: 'Curls Excentrique', sets: 3, reps: '8', tempo: '4010', rest: '60s', targetLoad: 'Léger', instructions: 'Descente lente en 4 secondes. Concentre-toi sur l\'excentrique.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Biceps au Mur', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Main à hauteur d\'épaule contre le mur, pouce vers le bas, tourner le corps.' },
      { id: 's2', name: 'Étirement Avant-Bras (Prière Inversée)', sets: 2, reps: '45s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Dos des mains joints, coudes écartés, montée lente.' },
    ],
  },
  Triceps: {
    mobility: [
      { id: 'm1', name: 'Dips Articulaires (sans charge)', sets: 3, reps: '10', tempo: '2020', rest: '30s', targetLoad: 'PDC', instructions: 'Descente contrôlée, sans aller en douleur.' },
      { id: 'm2', name: 'Extensions Triceps Élastique', sets: 3, reps: '15', tempo: '2020', rest: '30s', targetLoad: 'Élastique', instructions: 'Coude haut et fixe, extension complète puis lâcher contrôlé.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Triceps Overhead', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Bras plié derrière la tête, pousser le coude avec l\'autre main.' },
      { id: 's2', name: 'Étirement Croisé Bras', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Bras tendu en travers de la poitrine, appuyer sur le coude.' },
    ],
  },
  Trapèzes: {
    mobility: [
      { id: 'm1', name: 'Élévations Épaules (Shrugs)', sets: 3, reps: '10', tempo: '1130', rest: '30s', targetLoad: 'PDC', instructions: 'Monter les épaules, tenir 3s en haut, descendre lentement.' },
      { id: 'm2', name: 'Face Pulls', sets: 3, reps: '15', tempo: '2020', rest: '30s', targetLoad: 'Élastique', instructions: 'Tirer l\'élastique vers le visage, coudes hauts, finir en rotation externe.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Trapèze Latéral', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Tête inclinée sur le côté, épaule opposée vers le bas.' },
      { id: 's2', name: 'Roulement Mousse Trapèze', sets: 2, reps: '60s/côté', tempo: 'Lent', rest: '10s', targetLoad: 'Rouleau', instructions: 'Rouleau sous le trapèze, chercher les points sensibles.' },
    ],
  },
  Quadriceps: {
    mobility: [
      { id: 'm1', name: 'Step-up Petersen', sets: 3, reps: '12/côté', tempo: '2010', rest: '30s', targetLoad: 'PDC', instructions: 'Montée sur pointe de pied, focus sur le Vaste Interne.' },
      { id: 'm2', name: 'Sissy Squat (assisté)', sets: 3, reps: '8', tempo: '3030', rest: '60s', targetLoad: 'PDC', instructions: 'Appui d\'une main, s\'accroupir en partant des genoux.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Quadriceps Debout', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Talon fesse, genou dans l\'axe. Pousser la hanche en avant.' },
      { id: 's2', name: 'Fente Étirement Quad', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Genou arrière au sol, bassin vers l\'avant, dos droit.' },
    ],
  },
  'Ischio-Jambiers': {
    mobility: [
      { id: 'm1', name: 'Nordic Curl (excentrique)', sets: 3, reps: '5', tempo: '5010', rest: '90s', targetLoad: 'PDC', instructions: 'Descente très lente, contrôlée. Stopper avant le sol si besoin.' },
      { id: 'm2', name: 'Good Morning', sets: 3, reps: '10', tempo: '3030', rest: '60s', targetLoad: 'Léger', instructions: 'Barre sur épaules, genoux semi-fléchis, pencher depuis les hanches.' },
    ],
    stretching: [
      { id: 's1', name: 'Ischio Jambe Surélevée', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Jambe sur une table ou banc, dos droit, pencher depuis les hanches.' },
      { id: 's2', name: 'Étirement Sol (RDL passif)', sets: 2, reps: '60s', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Assis jambes tendues, se pencher vers l\'avant sans arrondir le dos.' },
    ],
  },
  Adducteurs: {
    mobility: [
      { id: 'm1', name: 'Fente Latérale (Cossack Squat)', sets: 3, reps: '8/côté', tempo: '2020', rest: '30s', targetLoad: 'PDC', instructions: 'Descendre sur une jambe, l\'autre tendue. Pied à plat si possible.' },
      { id: 'm2', name: 'Pliés (Sumo)', sets: 3, reps: '10', tempo: '3030', rest: '30s', targetLoad: 'PDC', instructions: 'Pieds très écartés, descendre lentement, genoux dans l\'axe.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Papillon', sets: 2, reps: '60s', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Plantes de pieds jointes, pousser les genoux vers le bas.' },
      { id: 's2', name: 'Grand Écart Latéral (progressif)', sets: 2, reps: '90s', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Jambes écartées, descendre progressivement, mains au sol.' },
    ],
  },
  Fessiers: {
    mobility: [
      { id: 'm1', name: 'Hip Thrust (PDC)', sets: 3, reps: '15', tempo: '2021', rest: '30s', targetLoad: 'PDC', instructions: 'Épaules sur le banc, monter les hanches, serrer les fesses en haut.' },
      { id: 'm2', name: 'Clamshells', sets: 3, reps: '15/côté', tempo: 'Dynamique', rest: '0s', targetLoad: 'Élastique', instructions: 'Allongé sur le côté, ouvrir le genou sans bouger le bassin.' },
    ],
    stretching: [
      { id: 's1', name: 'Figure 4 (Pigeon au Sol)', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '15s', targetLoad: 'PDC', instructions: 'Allongé, croiser la cheville sur le genou opposé, tirer la jambe vers soi.' },
      { id: 's2', name: 'Étirement Fessier Assis', sets: 2, reps: '45s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Assis, croiser une jambe, se pencher vers l\'avant.' },
    ],
  },
  Mollets: {
    mobility: [
      { id: 'm1', name: 'Mollets Excentriques sur Marche', sets: 3, reps: '10', tempo: '4010', rest: '60s', targetLoad: 'PDC', instructions: 'Monter sur 2 pieds, descendre sur 1 seul. Descente en 4s.' },
      { id: 'm2', name: 'Sauts Pogo', sets: 3, reps: '20', tempo: 'Explosif', rest: '30s', targetLoad: 'PDC', instructions: 'Rebonds sur les orteils, jambes quasi-tendues, contact sol minimal.' },
    ],
    stretching: [
      { id: 's1', name: 'Étirement Gastrocnémien', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Pousser le mur, jambe arrière tendue, talon au sol.' },
      { id: 's2', name: 'Étirement Soléaire', sets: 2, reps: '60s/côté', tempo: 'Statique', rest: '10s', targetLoad: 'PDC', instructions: 'Même position mais genou légèrement fléchi.' },
    ],
  },
};

// ─── BODY MAP DATA ───────────────────────────────────────────────────────────
// Coordonnées en % dans le viewBox SVG 200×470

type ZoneType = 'joint' | 'muscle';

interface BodyZone {
  id: string;       // clé dans ROUTINES
  label: string;    // texte affiché
  x: number;        // % horizontal
  y: number;        // % vertical
  type: ZoneType;
  bilateral?: boolean; // si true, on affiche deux points gauche/droite
}

// Points articulaires (ronds rouges pulsants)
const JOINT_ZONES: BodyZone[] = [
  { id: 'Cou',      label: 'Cou',      x: 50, y: 10.5, type: 'joint' },
  { id: 'Épaule',   label: 'Épaule',   x: 28, y: 17,   type: 'joint', bilateral: true },
  { id: 'Coude',    label: 'Coude',    x: 24, y: 30,   type: 'joint', bilateral: true },
  { id: 'Poignet',  label: 'Poignet',  x: 21, y: 43,   type: 'joint', bilateral: true },
  { id: 'Thorax',   label: 'Thorax',   x: 50, y: 24,   type: 'joint' },
  { id: 'Dos',      label: 'Dos',      x: 50, y: 37,   type: 'joint' },
  { id: 'Hanche',   label: 'Hanche',   x: 42, y: 52,   type: 'joint', bilateral: true },
  { id: 'Genou',    label: 'Genou',    x: 38, y: 72,   type: 'joint', bilateral: true },
  { id: 'Cheville', label: 'Cheville', x: 38, y: 91,   type: 'joint', bilateral: true },
];

// Zones musculaires (losanges bleus)
const MUSCLE_ZONES: BodyZone[] = [
  { id: 'Pectoraux',        label: 'Pectoraux',     x: 50, y: 21,   type: 'muscle' },
  { id: 'Grand Dorsal',     label: 'Grand Dorsal',  x: 50, y: 30,   type: 'muscle' },
  { id: 'Trapèzes',         label: 'Trapèzes',      x: 50, y: 14,   type: 'muscle' },
  { id: 'Biceps',           label: 'Biceps',        x: 23, y: 24,   type: 'muscle', bilateral: true },
  { id: 'Triceps',          label: 'Triceps',       x: 26, y: 27,   type: 'muscle', bilateral: true },
  { id: 'Quadriceps',       label: 'Quadriceps',    x: 38, y: 63,   type: 'muscle', bilateral: true },
  { id: 'Ischio-Jambiers',  label: 'Ischio',        x: 40, y: 67,   type: 'muscle', bilateral: true },
  { id: 'Adducteurs',       label: 'Adducteurs',    x: 46, y: 59,   type: 'muscle', bilateral: true },
  { id: 'Fessiers',         label: 'Fessiers',      x: 44, y: 55,   type: 'muscle', bilateral: true },
  { id: 'Mollets',          label: 'Mollets',       x: 39, y: 80,   type: 'muscle', bilateral: true },
];

// ─── EXERCISE CARD ───────────────────────────────────────────────────────────
const ExerciseCard: React.FC<{ ex: Exercise; idx: number }> = ({ ex, idx }) => {
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft]       = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const parseSeconds = (str: string): number | null => {
    const m = str.match(/(\d+)/);
    if (!m) return null;
    const n = parseInt(m[1]);
    if (str.includes('min')) return n * 60;
    return n;
  };

  const startTimer = () => {
    const s = parseSeconds(ex.rest !== '0s' ? ex.rest : ex.reps);
    if (!s) return;
    setTimeLeft(s);
    setTimerActive(true);
  };

  useEffect(() => {
    if (timerActive && timeLeft !== null) {
      if (timeLeft <= 0) { setTimerActive(false); setTimeLeft(null); return; }
      intervalRef.current = setInterval(() => setTimeLeft(t => (t ?? 1) - 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerActive, timeLeft]);

  return (
    <GlassCard className="p-5 border-l-2 border-l-white/20">
      <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest">#{idx + 1}</span>
        {timerActive && timeLeft !== null && (
          <span className="text-nexus-gold font-display text-lg font-bold tabular-nums">
            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>
      <h3 className="font-bold text-white uppercase tracking-wide text-base mb-1">{ex.name}</h3>
      {ex.instructions && (
        <p className="text-xs text-nexus-gray mb-4 italic pl-3 border-l border-nexus-gray/30">
          "{ex.instructions}"
        </p>
      )}
      <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
        {[
          { label: 'Séries', val: ex.sets },
          { label: 'Reps', val: ex.reps },
          { label: 'Repos', val: ex.rest },
          { label: 'Tempo', val: ex.tempo },
        ].map(cell => (
          <div key={cell.label} className="bg-black/30 rounded-lg p-2 border border-white/5">
            <div className="text-nexus-gray uppercase text-[9px] mb-1">{cell.label}</div>
            <div className="text-white font-display font-bold text-base">{cell.val}</div>
          </div>
        ))}
      </div>
      {ex.rest !== '0s' && (
        <button
          onClick={timerActive ? () => { setTimerActive(false); setTimeLeft(null); } : startTimer}
          className={`w-full py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            timerActive ? 'bg-nexus-gold/20 text-nexus-gold border border-nexus-gold/30' : 'bg-white/5 text-nexus-gray hover:text-white hover:bg-white/10'
          }`}
        >
          {timerActive ? '⏸ Pause timer' : '⏱ Démarrer timer repos'}
        </button>
      )}
    </GlassCard>
  );
};

// ─── BODY MAP DOT ─────────────────────────────────────────────────────────────
interface DotProps {
  zone: BodyZone;
  side?: 'L' | 'R';
  onClick: (id: string) => void;
  active: boolean;
}

const BodyDot: React.FC<DotProps> = ({ zone, side, onClick, active }) => {
  const mirrorX = side === 'R' ? 100 - (zone.x - 50) + (zone.x > 50 ? 0 : 0) : zone.x;
  // For bilateral: L stays at x, R mirrors to 100-x+50... simpler: R = 100 - zone.x
  const finalX = side === 'R' ? (100 - zone.x) : zone.x;

  const isJoint = zone.type === 'joint';
  const color = isJoint ? '#E52E01' : '#3B82F6';
  const bgColor = isJoint ? 'bg-nexus-red' : 'bg-blue-500';
  const shadowColor = isJoint ? '#E52E01' : '#3B82F6';

  return (
    <button
      onClick={() => onClick(zone.id)}
      className={`absolute flex items-center justify-center group z-10 ${isJoint ? 'w-9 h-9 -ml-4 -mt-4' : 'w-8 h-8 -ml-4 -mt-4'}`}
      style={{ left: `${finalX}%`, top: `${zone.y}%` }}
      title={zone.label + (side ? (side === 'L' ? ' G' : ' D') : '')}
    >
      {isJoint ? (
        <>
          <div
            className={`absolute w-3 h-3 rounded-full shadow-md group-hover:scale-150 transition-transform duration-200 border border-white/50 ${active ? 'scale-150' : ''}`}
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${shadowColor}` }}
          />
          <div className="absolute w-6 h-6 rounded-full animate-ping opacity-0 group-hover:opacity-30"
            style={{ backgroundColor: color }} />
        </>
      ) : (
        /* Losange pour les muscles */
        <div
          className={`absolute w-3 h-3 rotate-45 transition-transform duration-200 group-hover:scale-150 border border-white/30 ${active ? 'scale-150' : ''}`}
          style={{ backgroundColor: color + 'CC', boxShadow: `0 0 6px ${shadowColor}80` }}
        />
      )}
    </button>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export const CareView: React.FC<CareViewProps> = ({ athlete }) => {
  const [selectedZone, setSelectedZone]         = useState<string | null>(null);
  const [routineType, setRoutineType]           = useState<'mobility' | 'stretching' | null>(null);
  const [activeGlobalRoutine, setActiveGlobalRoutine] = useState<string | null>(null);
  const [showLegend, setShowLegend]             = useState(false);

  const getRoutine = (zone: string, type: 'mobility' | 'stretching') =>
    ROUTINES[zone]?.[type] ?? ROUTINES['Épaule'][type];

  const generateWarmUp = (): Exercise[] => {
    const routine = [...BASE_WARMUP];
    const map: Record<string, string> = {
      'Cheville G': 'Cheville', 'Cheville D': 'Cheville',
      'Hanche G': 'Hanche', 'Hanche D': 'Hanche',
      'Épaule G': 'Épaule', 'Épaule D': 'Épaule',
      'Adducteur': 'Adducteurs',
    };
    athlete.performance.flexibility.forEach(metric => {
      if (metric.A < 75) {
        const key = map[metric.subject];
        if (key && ROUTINES[key]) {
          const ex = ROUTINES[key].mobility[0];
          if (!routine.find(e => e.id === ex.id))
            routine.push({ ...ex, name: `${ex.name} (${metric.subject})` });
        }
      }
    });
    return routine;
  };

  const renderExerciseList = (title: string, exercises: Exercise[], onBack: () => void) => (
    <div className="space-y-4 animate-in slide-in-from-right">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-nexus-gray text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <span>←</span> Retour
        </button>
        <span className="text-nexus-gold text-xs font-bold uppercase px-3 py-1 bg-nexus-gold/10 rounded-full border border-nexus-gold/20">
          ⏱ ~15 min
        </span>
      </div>
      <div className="mb-6">
        <h2 className="font-display text-3xl text-white uppercase">{title}</h2>
        {selectedZone && (
          <p className="text-nexus-gold font-display text-xl uppercase">{selectedZone}</p>
        )}
      </div>
      {exercises.map((ex, idx) => <ExerciseCard key={ex.id} ex={ex} idx={idx} />)}
      <div className="pt-4">
        <Button fullWidth onClick={onBack} className="bg-nexus-red shadow-[0_0_20px_rgba(229,46,1,0.4)]">
          Terminer la Routine
        </Button>
      </div>
    </div>
  );

  // ── Routine globale active ──
  if (activeGlobalRoutine === 'PRE_MATCH')
    return renderExerciseList('Routine Pré-Match', PRE_MATCH_ROUTINE, () => setActiveGlobalRoutine(null));
  if (activeGlobalRoutine === 'WARMUP')
    return renderExerciseList('Routine Échauffement', generateWarmUp(), () => setActiveGlobalRoutine(null));

  // ── Séance ciblée : choix mobilité / stretching ──
  if (selectedZone && !routineType) {
    const hasRoutine = !!ROUTINES[selectedZone];
    const isJoint    = JOINT_ZONES.some(z => z.id === selectedZone);
    return (
      <div className="space-y-6 animate-in fade-in">
        <button onClick={() => setSelectedZone(null)} className="text-nexus-gray text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <span>←</span> Retour Carte
        </button>
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{isJoint ? '🔴' : '🔵'}</div>
          <h2 className="font-display text-4xl text-nexus-gold uppercase drop-shadow-lg">{selectedZone}</h2>
          <p className="text-nexus-gray text-xs uppercase tracking-wide mt-1">
            {isJoint ? 'Articulation' : 'Groupe Musculaire'} · Protocole Scientifique
          </p>
        </div>
        {!hasRoutine && (
          <p className="text-center text-nexus-gray text-sm italic">Protocole en cours d'ajout.</p>
        )}
        {hasRoutine && (
          <div className="grid gap-4">
            <GlassCard
              onClick={() => setRoutineType('mobility')}
              className="p-8 text-center cursor-pointer hover:bg-white/5 border-l-4 border-l-nexus-gold"
            >
              <h3 className="font-display text-2xl text-white uppercase mb-1">Mobilité</h3>
              <p className="text-nexus-gray text-xs uppercase tracking-wider">Amplitude & Activation · 15 min</p>
            </GlassCard>
            <GlassCard
              onClick={() => setRoutineType('stretching')}
              className="p-8 text-center cursor-pointer hover:bg-white/5 border-l-4 border-l-nexus-red"
            >
              <h3 className="font-display text-2xl text-white uppercase mb-1">Stretching</h3>
              <p className="text-nexus-gray text-xs uppercase tracking-wider">Détente & Décompression · 15 min</p>
            </GlassCard>
          </div>
        )}
      </div>
    );
  }

  // ── Exercices de la routine ciblée ──
  if (selectedZone && routineType) {
    return renderExerciseList(
      routineType === 'mobility' ? 'Routine Mobilité' : 'Routine Stretching',
      getRoutine(selectedZone, routineType),
      () => setRoutineType(null)
    );
  }

  // ── Carte corporelle principale ──
  const allZones = [
    ...JOINT_ZONES,
    ...MUSCLE_ZONES,
  ];

  const renderDots = (zones: BodyZone[]) =>
    zones.flatMap(zone => {
      if (zone.bilateral) {
        return [
          <BodyDot key={`${zone.id}-L`} zone={zone} side="L" onClick={setSelectedZone} active={selectedZone === zone.id} />,
          <BodyDot key={`${zone.id}-R`} zone={{ ...zone, x: 100 - zone.x }} side="R" onClick={setSelectedZone} active={selectedZone === zone.id} />,
        ];
      }
      return [<BodyDot key={zone.id} zone={zone} onClick={setSelectedZone} active={selectedZone === zone.id} />];
    });

  return (
    <div className="px-6 space-y-4 animate-in fade-in pb-32">
      {/* Routines rapides */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <GlassCard onClick={() => setActiveGlobalRoutine('PRE_MATCH')} className="p-3 text-center cursor-pointer hover:bg-white/5 flex flex-col items-center justify-center h-20 border-nexus-red/30 relative overflow-hidden">
          <span className="text-lg mb-1">🔥</span>
          <span className="font-display font-bold text-white uppercase text-sm leading-none">Pré-Match</span>
          <span className="text-[9px] text-nexus-gray mt-0.5">15 min</span>
        </GlassCard>
        <GlassCard onClick={() => setActiveGlobalRoutine('WARMUP')} className="p-3 text-center cursor-pointer hover:bg-white/5 flex flex-col items-center justify-center h-20 border-nexus-gold/30 relative overflow-hidden">
          <span className="text-lg mb-1">⚡️</span>
          <span className="font-display font-bold text-white uppercase text-sm leading-none">Échauffement</span>
          <span className="text-[9px] text-nexus-gray mt-0.5">15 min · Adapté</span>
        </GlassCard>
      </div>

      {/* Header carte */}
      <div className="text-center pt-2">
        <h2 className="font-display text-2xl text-white uppercase tracking-widest">Carte Corporelle</h2>
        <p className="text-nexus-gray text-[10px] tracking-[0.2em] uppercase">Touche une zone douloureuse</p>
      </div>

      {/* Légende */}
      <div className="flex gap-4 justify-center text-[10px] uppercase font-bold tracking-wider">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-nexus-red inline-block" />
          Articulation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rotate-45 bg-blue-500 inline-block" />
          Muscle
        </span>
      </div>

      {/* SVG Body Map */}
      <div className="relative flex justify-center">
        <div className="relative w-full max-w-[200px] aspect-[1/2.4]">
          <svg viewBox="0 0 200 470" className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.08)]">
            <g fill="none" stroke="#F4F4F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {/* Tête */}
              <ellipse cx="100" cy="28" rx="18" ry="22" />
              {/* Cou */}
              <path d="M100 50 L100 57" />
              {/* Corps */}
              <path d="
                M100 57
                Q130 57 140 65 Q150 70 150 90
                L152 150 L154 215 L150 225 L146 215
                L135 150 L125 105 L125 220
                L135 320 L130 420 L110 420
                L105 320 L100 250
                L95 320 L90 420 L70 410
                L65 320 L75 220
                L75 105 L65 150 L54 215
                L50 225 L46 215 L48 150
                L50 90
                Q50 70 60 65 Q70 58 100 58
              " />
              {/* Pecs */}
              <path d="M75 98 Q100 108 125 98" strokeOpacity="0.25" />
              {/* Abs */}
              <path d="M100 115 L100 170" strokeOpacity="0.15" />
              {/* Short */}
              <path d="M77 218 L123 218" strokeOpacity="0.4" />
            </g>
          </svg>

          {/* Points articulaires */}
          {renderDots(JOINT_ZONES)}
          {/* Zones musculaires */}
          {renderDots(MUSCLE_ZONES)}
        </div>
      </div>

      {/* Liste scroll des zones */}
      <div className="pt-2">
        <p className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-3">Toutes les zones</p>
        <div className="grid grid-cols-2 gap-2">
          {[...JOINT_ZONES.filter(z => !z.bilateral || true), ...MUSCLE_ZONES]
            .filter((z, i, arr) => arr.findIndex(x => x.id === z.id) === i) // dédoublonner
            .map(zone => (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all text-xs font-bold uppercase tracking-wide ${
                  zone.type === 'joint'
                    ? 'border-nexus-red/20 bg-nexus-red/5 text-white hover:bg-nexus-red/15'
                    : 'border-blue-500/20 bg-blue-500/5 text-white hover:bg-blue-500/15'
                }`}
              >
                <span className={zone.type === 'joint' ? 'text-nexus-red' : 'text-blue-400'}>
                  {zone.type === 'joint' ? '●' : '◆'}
                </span>
                {zone.id}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
