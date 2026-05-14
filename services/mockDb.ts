import { Athlete, WorkoutSession, DailyLog, Match, Appointment, ObjectiveItem, ObjectiveStatus, FoodItem, MealLog, DaySchedule, ScheduleEvent, TeamStats } from '../types';

// Mock Match Data
const NEXT_MATCH: Match = {
  id: 'm1',
  opponent: 'LIVRY-GARGAN',
  date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  time: '20:00',
  isHome: true,
  location: 'Piscine Olympique CNM'
};

export const TEAM_STATS: TeamStats = { gamesPlayed: 12, wins: 8, losses: 3, draws: 1 };

// LOCAL date helpers (no UTC bug)
const localStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const getDayDate = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return localStr(d);
};

// --- STATIC MOCK DATA FOR CURRENT WEEK ---
const MOCK_EVENTS_SOURCE: Record<number, ScheduleEvent[]> = {
  0: [
    { id: '1', type: 'KINE', startTime: '10:00', endTime: '12:00', title: 'Soins & Recup', description: 'Passage obligatoire', isVisibleToAthletes: true, intensity: 2 },
    { id: '2', type: 'MUSCU', startTime: '18:00', endTime: '19:30', title: 'Hypertrophy', description: 'Cycle Force', intensity: 8, isVisibleToAthletes: true }
  ],
  1: [
    { id: '3', type: 'VIDEO', startTime: '18:00', endTime: '19:00', title: 'Analyse Livry', description: 'Retour match', isVisibleToAthletes: true, intensity: 3 },
    { id: '4', type: 'WATER-POLO', startTime: '19:00', endTime: '21:00', title: 'Tactical', intensity: 7, isVisibleToAthletes: true }
  ],
  2: [
    { id: '5', type: 'MENTAL', startTime: '14:00', endTime: '15:00', title: 'Visualisation', description: 'Groupe complet', isVisibleToAthletes: true, intensity: 4 },
    { id: '6', type: 'SLOT_LIBRE', startTime: '15:00', endTime: '17:00', title: 'Creneaux Staff', description: 'Reservable', isVisibleToAthletes: true, intensity: 1 }
  ],
  3: [
    { id: '7', type: 'ENTRETIEN', startTime: '17:00', endTime: '18:00', title: 'Entretiens Individuels', description: 'Point mi-saison', isVisibleToAthletes: false, intensity: 1 },
    { id: '8', type: 'MUSCU', startTime: '18:00', endTime: '19:00', title: 'Strength', intensity: 9, isVisibleToAthletes: true },
    { id: '9', type: 'WATER-POLO', startTime: '19:00', endTime: '20:30', title: 'Zone/Pressing', intensity: 8, isVisibleToAthletes: true }
  ],
  4: [
    { id: '10', type: 'MEETING', startTime: '19:00', endTime: '19:30', title: 'Briefing Match', description: '', isVisibleToAthletes: true, intensity: 2 },
    { id: '11', type: 'WATER-POLO', startTime: '19:30', endTime: '21:00', title: 'Speed', intensity: 9, isVisibleToAthletes: true }
  ],
  5: [
    { id: '12', type: 'MATCH', startTime: '20:00', endTime: '22:00', title: 'Match', description: 'RDV 18h30 Piscine', intensity: 10, isVisibleToAthletes: true }
  ]
};

// --- FOOD DATABASE ---
export const FOOD_DATABASE: FoodItem[] = [
  // PROTEINS
  { id: 'f1', name: 'Poulet (Blanc)', category: 'PROTEIN', unit: 'g', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 'f3', name: 'Oeuf (Entier)', category: 'PROTEIN', unit: 'piece', calories: 70, protein: 6, carbs: 0.6, fat: 5 },
  { id: 'f6', name: 'Whey Protein', category: 'PROTEIN', unit: 'g', calories: 370, protein: 78, carbs: 6, fat: 4 },
  { id: 'f10', name: 'Saumon', category: 'PROTEIN', unit: 'g', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: 'f16', name: 'Steak Hache 5%', category: 'PROTEIN', unit: 'g', calories: 125, protein: 21, carbs: 0, fat: 5 },
  { id: 'f17', name: 'Tofu', category: 'PROTEIN', unit: 'g', calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  { id: 'f18', name: 'Thon (Boite)', category: 'PROTEIN', unit: 'g', calories: 116, protein: 26, carbs: 0, fat: 1 },
  { id: 'p01', name: 'Blanc de Dinde', category: 'PROTEIN', unit: 'g', calories: 104, protein: 22, carbs: 0, fat: 1 },
  { id: 'p02', name: 'Filet de Cabillaud', category: 'PROTEIN', unit: 'g', calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  { id: 'p03', name: 'Crevettes', category: 'PROTEIN', unit: 'g', calories: 85, protein: 18, carbs: 0.9, fat: 0.8 },
  { id: 'p04', name: 'Sardines Boite', category: 'PROTEIN', unit: 'g', calories: 208, protein: 25, carbs: 0, fat: 11 },
  { id: 'p05', name: 'Maquereau', category: 'PROTEIN', unit: 'g', calories: 205, protein: 19, carbs: 0, fat: 14 },
  { id: 'p06', name: 'Jambon Blanc', category: 'PROTEIN', unit: 'g', calories: 97, protein: 17, carbs: 0.8, fat: 2.5 },
  { id: 'p07', name: 'Cottage Cheese', category: 'PROTEIN', unit: 'g', calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
  { id: 'p08', name: 'Skyr Nature', category: 'PROTEIN', unit: 'g', calories: 62, protein: 10, carbs: 4, fat: 0.2 },
  { id: 'p09', name: 'Yaourt Grec 0%', category: 'PROTEIN', unit: 'g', calories: 59, protein: 10, carbs: 3.6, fat: 0.1 },
  { id: 'p10', name: 'Steak Boeuf Maigre', category: 'PROTEIN', unit: 'g', calories: 158, protein: 26, carbs: 0, fat: 6 },
  { id: 'p11', name: 'Blanc Oeuf', category: 'PROTEIN', unit: 'piece', calories: 17, protein: 3.6, carbs: 0.2, fat: 0 },
  { id: 'p12', name: 'Poulet Cuisse', category: 'PROTEIN', unit: 'g', calories: 185, protein: 26, carbs: 0, fat: 9 },
  { id: 'p13', name: 'Lentilles Cuites', category: 'PROTEIN', unit: 'g', calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  { id: 'p14', name: 'Pois Chiches Cuits', category: 'PROTEIN', unit: 'g', calories: 164, protein: 8.9, carbs: 27, fat: 2.6 },
  { id: 'p15', name: 'Edamame', category: 'PROTEIN', unit: 'g', calories: 121, protein: 11, carbs: 9, fat: 5 },
  { id: 'p16', name: 'Thon Frais', category: 'PROTEIN', unit: 'g', calories: 144, protein: 23, carbs: 0, fat: 5 },
  { id: 'p17', name: 'Jambon Sec', category: 'PROTEIN', unit: 'g', calories: 167, protein: 26, carbs: 0.5, fat: 6 },
  // STARCH
  { id: 'f2', name: 'Riz Basmati (Cuit)', category: 'STARCH', unit: 'g', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: 'f5', name: 'Flocons Avoine', category: 'STARCH', unit: 'g', calories: 389, protein: 16.9, carbs: 66, fat: 6.9 },
  { id: 'f7', name: 'Pates (Cuites)', category: 'STARCH', unit: 'g', calories: 158, protein: 6, carbs: 31, fat: 1 },
  { id: 'f11', name: 'Pain Complet', category: 'STARCH', unit: 'g', calories: 247, protein: 13, carbs: 41, fat: 3.4 },
  { id: 'f14', name: 'Pomme de Terre', category: 'STARCH', unit: 'g', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  { id: 'f19', name: 'Patate Douce', category: 'STARCH', unit: 'g', calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { id: 'f20', name: 'Quinoa (Cuit)', category: 'STARCH', unit: 'g', calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { id: 's01', name: 'Riz Complet Cuit', category: 'STARCH', unit: 'g', calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
  { id: 's02', name: 'Pates Completes Cuites', category: 'STARCH', unit: 'g', calories: 148, protein: 6, carbs: 29, fat: 1.1 },
  { id: 's03', name: 'Boulgour Cuit', category: 'STARCH', unit: 'g', calories: 83, protein: 3.1, carbs: 18, fat: 0.2 },
  { id: 's04', name: 'Semoule Couscous', category: 'STARCH', unit: 'g', calories: 112, protein: 3.8, carbs: 23, fat: 0.2 },
  { id: 's05', name: 'Lentilles Corail', category: 'STARCH', unit: 'g', calories: 100, protein: 7.5, carbs: 17, fat: 0.3 },
  { id: 's06', name: 'Pain de Seigle', category: 'STARCH', unit: 'g', calories: 258, protein: 8.5, carbs: 48, fat: 3.3 },
  { id: 's07', name: 'Galette de Riz', category: 'STARCH', unit: 'piece', calories: 35, protein: 0.7, carbs: 7.5, fat: 0.3 },
  { id: 's08', name: 'Mais Boite', category: 'STARCH', unit: 'g', calories: 86, protein: 3.2, carbs: 19, fat: 1.2 },
  { id: 's09', name: 'Haricots Rouges', category: 'STARCH', unit: 'g', calories: 127, protein: 8.7, carbs: 22, fat: 0.5 },
  { id: 's10', name: 'Tortilla Ble', category: 'STARCH', unit: 'piece', calories: 146, protein: 4, carbs: 25, fat: 3.5 },
  // VEGETABLES / FRUITS
  { id: 'f4', name: 'Avocat', category: 'VEGETABLE', unit: 'piece', calories: 250, protein: 3, carbs: 12, fat: 23 },
  { id: 'f9', name: 'Banane', category: 'VEGETABLE', unit: 'piece', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { id: 'f12', name: 'Brocolis', category: 'VEGETABLE', unit: 'g', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { id: 'f21', name: 'Pomme', category: 'VEGETABLE', unit: 'piece', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { id: 'f22', name: 'Haricots Verts', category: 'VEGETABLE', unit: 'g', calories: 31, protein: 1.8, carbs: 7, fat: 0.2 },
  { id: 'v01', name: 'Epinards', category: 'VEGETABLE', unit: 'g', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { id: 'v02', name: 'Courgette', category: 'VEGETABLE', unit: 'g', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  { id: 'v03', name: 'Poivron Rouge', category: 'VEGETABLE', unit: 'g', calories: 31, protein: 1, carbs: 7, fat: 0.3 },
  { id: 'v04', name: 'Tomate', category: 'VEGETABLE', unit: 'piece', calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2 },
  { id: 'v05', name: 'Carotte', category: 'VEGETABLE', unit: 'g', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { id: 'v06', name: 'Champignons', category: 'VEGETABLE', unit: 'g', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  { id: 'v07', name: 'Orange', category: 'VEGETABLE', unit: 'piece', calories: 62, protein: 1.2, carbs: 15, fat: 0.2 },
  { id: 'v08', name: 'Fraises', category: 'VEGETABLE', unit: 'g', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { id: 'v09', name: 'Myrtilles', category: 'VEGETABLE', unit: 'g', calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  { id: 'v10', name: 'Mangue', category: 'VEGETABLE', unit: 'g', calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
  { id: 'v11', name: 'Kiwi', category: 'VEGETABLE', unit: 'piece', calories: 42, protein: 0.8, carbs: 10, fat: 0.4 },
  // OTHER
  { id: 'f8', name: 'Huile Olive', category: 'OTHER', unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { id: 'f13', name: 'Amandes', category: 'OTHER', unit: 'g', calories: 579, protein: 21, carbs: 22, fat: 50 },
  { id: 'f15', name: 'Fromage Blanc 0%', category: 'OTHER', unit: 'g', calories: 48, protein: 8, carbs: 4, fat: 0.1 },
  { id: 'f23', name: 'Nutella', category: 'OTHER', unit: 'g', calories: 546, protein: 6, carbs: 57, fat: 30 },
  { id: 'f24', name: 'Beurre de Cacahuete', category: 'OTHER', unit: 'g', calories: 588, protein: 25, carbs: 20, fat: 50 },
  { id: 'o01', name: 'Noix', category: 'OTHER', unit: 'g', calories: 654, protein: 15, carbs: 14, fat: 65 },
  { id: 'o02', name: 'Noix de Cajou', category: 'OTHER', unit: 'g', calories: 553, protein: 18, carbs: 30, fat: 44 },
  { id: 'o03', name: 'Graines de Chia', category: 'OTHER', unit: 'g', calories: 486, protein: 17, carbs: 42, fat: 31 },
  { id: 'o04', name: 'Lait Ecreme', category: 'OTHER', unit: 'ml', calories: 34, protein: 3.4, carbs: 5, fat: 0.1 },
  { id: 'o05', name: 'Lait Entier', category: 'OTHER', unit: 'ml', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { id: 'o06', name: 'Emmental', category: 'OTHER', unit: 'g', calories: 382, protein: 28, carbs: 0.5, fat: 29 },
  { id: 'o07', name: 'Mozzarella', category: 'OTHER', unit: 'g', calories: 280, protein: 28, carbs: 3.1, fat: 17 },
  { id: 'o08', name: 'Miel', category: 'OTHER', unit: 'g', calories: 304, protein: 0.3, carbs: 82, fat: 0 },
  { id: 'o09', name: 'Chocolat Noir 70%', category: 'OTHER', unit: 'g', calories: 598, protein: 7.8, carbs: 46, fat: 43 },
  { id: 'o10', name: 'Compote Pomme', category: 'OTHER', unit: 'g', calories: 46, protein: 0.3, carbs: 12, fat: 0.1 },
  { id: 'o11', name: 'Cacao Poudre', category: 'OTHER', unit: 'g', calories: 228, protein: 19, carbs: 58, fat: 14 },
];

const MOCK_ATHLETES: Athlete[] = [
  {
    id: '1', firstName: 'Arthur', lastName: 'PEREA', code: '1234', age: 24, type: 'TEAM',
    objectives: 'Explosivite & Gainage',
    structuredObjectives: {
      shortTerm: [
        { id: 'st1', label: 'Ameliorer le squat (+5kg)', status: 'ACTIVE' },
        { id: 'st2', label: 'Sommeil > 7h/nuit', status: 'VALIDATED' }
      ],
      mediumTerm: [
        { id: 'mt1', label: 'Selection Equipe A', status: 'ACTIVE' },
        { id: 'mt2', label: 'Reduire masse grasse a 10%', status: 'PENDING_VALIDATION' }
      ],
      longTerm: [
        { id: 'lt1', label: 'Championnat National', status: 'ACTIVE' },
        { id: 'lt2', label: '0 Blessures sur la saison', status: 'ACTIVE' }
      ]
    },
    gamification: { level: 3, currentXp: 350, nextLevelXp: 1000, streakDays: 6, rank: 'Titulaire', selectedSkin: '🦅', unlockedSkins: ['🐣', '🦅'], unlockedFeatures: ['DARK_MODE'] },
    nutritionHistory: [],
    stats: { goals: 14, fouls: 5, matchesPlayed: 8, exclusions: 2 },
    monitoring: {
      waterRpe: 7.2, waterAttendance: 95,
      waterHistory: [
        { date: '2026-02-01', rpe: 6, attendance: 'PRESENT', duration: 90, load: 540, sessionType: 'WATER-POLO' },
        { date: '2026-02-02', rpe: 9, attendance: 'PRESENT', duration: 60, load: 540, sessionType: 'WATER-POLO' },
        { date: '2026-02-03', rpe: 10, attendance: 'ABSENT_JUSTIFIED', duration: 0, load: 0, sessionType: 'WATER-POLO' },
        { date: '2026-02-04', rpe: 10, attendance: 'PRESENT', duration: 90, load: 900, sessionType: 'MATCH' },
        { date: '2026-02-05', rpe: 9, attendance: 'PRESENT', duration: 60, load: 540, sessionType: 'WATER-POLO' },
        { date: '2026-02-06', rpe: 0, attendance: 'INJURED', duration: 0, load: 0, sessionType: 'WATER-POLO' },
        { date: '2026-02-07', rpe: 9.5, attendance: 'PRESENT', duration: 75, load: 712.5, sessionType: 'WATER-POLO' }
      ],
      dryRpe: 8.5, dryAttendance: 88,
      dryHistory: [
        { date: '2026-02-01', rpe: 8, attendance: 'PRESENT', duration: 60, load: 480, sessionType: 'MUSCU' },
        { date: '2026-02-03', rpe: 9, attendance: 'PRESENT', duration: 60, load: 540, sessionType: 'MUSCU' },
        { date: '2026-02-05', rpe: 0, attendance: 'ABSENT_UNJUSTIFIED', duration: 0, load: 0, sessionType: 'MUSCU' },
        { date: '2026-02-07', rpe: 8.5, attendance: 'PRESENT', duration: 45, load: 382.5, sessionType: 'MUSCU' }
      ],
      weight: [{date: 'S1', value: 82.5}, {date: 'S2', value: 82.8}, {date: 'S3', value: 83.0}, {date: 'S4', value: 82.9}],
      height: 184, measurements: { chest: 108, waist: 82, thighs: 62, arms: 41 }
    },
    lastCheckIn: { date: new Date().toISOString(), sleep: 4, fatigue: 9, soreness: 8, foodQuality: 6, mood: 4, comment: "J'ai une douleur vive a l'epaule depuis hier" },
    performance: {
      flexibility: [
        { subject: 'Cheville G', A: 80, B: 75, fullMark: 100 }, { subject: 'Cheville D', A: 85, B: 75, fullMark: 100 },
        { subject: 'Adducteur', A: 65, B: 80, fullMark: 100 }, { subject: 'Hanche G', A: 70, B: 70, fullMark: 100 },
        { subject: 'Hanche D', A: 72, B: 70, fullMark: 100 }, { subject: 'Epaule G', A: 90, B: 85, fullMark: 100 },
        { subject: 'Epaule D', A: 88, B: 85, fullMark: 100 },
      ],
      dry: [
        { subject: 'CMJ Dry', A: 65, B: 60, fullMark: 100 }, { subject: '1RM Bench', A: 110, B: 100, fullMark: 150 },
        { subject: '1RM Squat', A: 140, B: 130, fullMark: 200 }, { subject: 'Pull-up', A: 25, B: 20, fullMark: 40 },
        { subject: 'Max Pull', A: 135, B: 120, fullMark: 150 },
      ],
      water: [
        { subject: 'CMJ Water', A: 70, B: 65, fullMark: 100 }, { subject: 'RAST', A: 85, B: 80, fullMark: 100 },
        { subject: 'WIST', A: 78, B: 85, fullMark: 100 },
      ]
    }
  },
  {
    id: '2', firstName: 'Louis', lastName: 'PEYRUDE', code: '5678', age: 28, type: 'PRIVATE',
    objectives: 'Hypertrophie',
    structuredObjectives: { shortTerm: [], mediumTerm: [], longTerm: [] },
    gamification: { level: 1, currentXp: 50, nextLevelXp: 500, streakDays: 2, rank: 'Novice', selectedSkin: '🐣', unlockedSkins: ['🐣'], unlockedFeatures: [] },
    nutritionHistory: [],
    stats: { goals: 0, fouls: 0, matchesPlayed: 0, exclusions: 0 },
    monitoring: {
      waterRpe: 0, waterAttendance: 0, waterHistory: [],
      dryRpe: 9.0, dryAttendance: 100,
      dryHistory: [{ date: 'S1', rpe: 8, attendance: 'PRESENT' }, { date: 'S2', rpe: 9, attendance: 'PRESENT' }],
      weight: [{date: 'S1', value: 75.0}, {date: 'S2', value: 75.5}],
      height: 178, measurements: { chest: 102, waist: 78, thighs: 58, arms: 38 }
    },
    performance: { flexibility: [{ subject: 'Global', A: 60, B: 70, fullMark: 100 }], dry: [{ subject: 'Force', A: 80, B: 70, fullMark: 100 }], water: [] }
  },
  {
    id: '3', firstName: 'Audoin', lastName: 'DE REVIERS', code: '1111', age: 22, type: 'TEAM', objectives: '',
    structuredObjectives: { shortTerm: [], mediumTerm: [], longTerm: [] },
    gamification: { level: 2, currentXp: 120, nextLevelXp: 500, streakDays: 3, rank: 'Espoir', selectedSkin: '🦊', unlockedSkins: ['🐣', '🦊'], unlockedFeatures: [] },
    nutritionHistory: [], stats: { goals: 5, fouls: 2, matchesPlayed: 4, exclusions: 1 },
    monitoring: { waterRpe: 6, waterAttendance: 80, waterHistory: [], dryRpe: 7, dryAttendance: 90, dryHistory: [], weight: [], height: 180, measurements: { chest: 0, waist: 0, thighs: 0, arms: 0 } },
    performance: { flexibility: [], dry: [], water: [] }
  },
  {
    id: '4', firstName: 'Baptiste', lastName: 'AUDON', code: '2222', age: 25, type: 'TEAM', objectives: '',
    structuredObjectives: { shortTerm: [], mediumTerm: [], longTerm: [] },
    gamification: { level: 5, currentXp: 800, nextLevelXp: 1500, streakDays: 20, rank: 'Expert', selectedSkin: '🦁', unlockedSkins: ['🐣', '🦁'], unlockedFeatures: [] },
    nutritionHistory: [], stats: { goals: 20, fouls: 10, matchesPlayed: 10, exclusions: 5 },
    monitoring: { waterRpe: 8, waterAttendance: 100, waterHistory: [], dryRpe: 9, dryAttendance: 100, dryHistory: [], weight: [], height: 190, measurements: { chest: 0, waist: 0, thighs: 0, arms: 0 } },
    performance: { flexibility: [], dry: [], water: [] }
  },
  {
    id: '5', firstName: 'Dario', lastName: 'DANOVSKI', code: '3333', age: 30, type: 'TEAM', objectives: '',
    structuredObjectives: { shortTerm: [], mediumTerm: [], longTerm: [] },
    gamification: { level: 4, currentXp: 400, nextLevelXp: 1000, streakDays: 10, rank: 'Pro', selectedSkin: '🐺', unlockedSkins: ['🐣', '🐺'], unlockedFeatures: [] },
    nutritionHistory: [], stats: { goals: 8, fouls: 8, matchesPlayed: 9, exclusions: 3 },
    monitoring: { waterRpe: 7.5, waterAttendance: 92, waterHistory: [], dryRpe: 7.5, dryAttendance: 95, dryHistory: [], weight: [], height: 185, measurements: { chest: 0, waist: 0, thighs: 0, arms: 0 } },
    performance: { flexibility: [], dry: [], water: [] }
  },
  {
    id: '6', firstName: 'Elias', lastName: 'FERRAND', code: '4444', age: 20, type: 'TEAM', objectives: '',
    structuredObjectives: { shortTerm: [], mediumTerm: [], longTerm: [] },
    gamification: { level: 1, currentXp: 20, nextLevelXp: 200, streakDays: 0, rank: 'Rookie', selectedSkin: '🐣', unlockedSkins: ['🐣'], unlockedFeatures: [] },
    nutritionHistory: [], stats: { goals: 1, fouls: 0, matchesPlayed: 2, exclusions: 0 },
    monitoring: { waterRpe: 6, waterAttendance: 70, waterHistory: [], dryRpe: 5, dryAttendance: 60, dryHistory: [], weight: [], height: 175, measurements: { chest: 0, waist: 0, thighs: 0, arms: 0 } },
    performance: { flexibility: [], dry: [], water: [] }
  }
];

const today2 = new Date();
const tomorrow2 = new Date(today2); tomorrow2.setDate(today2.getDate() + 1);

let APPOINTMENTS: Appointment[] = [
  { id: 'apt1', date: localStr(today2), time: '14:00', coachName: 'Coach Head', isBooked: false },
  { id: 'apt2', date: localStr(today2), time: '15:00', coachName: 'Coach Head', isBooked: false },
  { id: 'apt3', date: localStr(tomorrow2), time: '09:00', coachName: 'Coach Physio', isBooked: false },
  { id: 'apt4', date: localStr(tomorrow2), time: '10:00', coachName: 'Coach Physio', isBooked: true, bookedBy: '1', reason: 'Douleur epaule' },
];

const INITIAL_WORKOUT: WorkoutSession = {
  id: 'w1', date: localStr(new Date()), title: 'Prepa Physique Generale', type: 'MUSCU', completed: false,
  contentJson: JSON.stringify([
    { id: 'e1', name: 'Back Squat', sets: 4, reps: '6-8', tempo: '3010', rest: '120s', targetLoad: '80kg' },
    { id: 'e2', name: 'Pull Ups Weighted', sets: 4, reps: 'MAX', tempo: '2010', rest: '90s', targetLoad: '+10kg' },
    { id: 'e3', name: 'Dips', sets: 3, reps: '12', tempo: '2110', rest: '60s', targetLoad: 'BW' }
  ])
};

let athletes = [...MOCK_ATHLETES];
let sessions: Record<string, WorkoutSession[]> = { '1': [INITIAL_WORKOUT], '2': [] };
let logs: Record<string, DailyLog[]> = {};
let messages: Record<string, any[]> = {};
let WEEKLY_SCHEDULE_CACHE: Record<string, DaySchedule[]> = {};

const SKINS_MAP: Record<number, string> = { 1: '🐣', 3: '🦅', 5: '🦊', 10: '🐺', 15: '🦁', 20: '🐉' };

const checkLevelUp = (athlete: Athlete) => {
  if (athlete.gamification.currentXp >= athlete.gamification.nextLevelXp) {
    athlete.gamification.level += 1;
    athlete.gamification.currentXp -= athlete.gamification.nextLevelXp;
    athlete.gamification.nextLevelXp = Math.round(athlete.gamification.nextLevelXp * 1.5);
    const newSkin = SKINS_MAP[athlete.gamification.level];
    if (newSkin && !athlete.gamification.unlockedSkins.includes(newSkin)) {
      athlete.gamification.unlockedSkins.push(newSkin);
      alert(`Nouveau skin : ${newSkin}`);
    }
    return true;
  }
  return false;
};

const generateMockLogs = (count: number): DailyLog[] => {
  const result: DailyLog[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    result.push({ date: localStr(d), sleep: Math.floor(Math.random()*5)+5, fatigue: Math.floor(Math.random()*10)+1, soreness: Math.floor(Math.random()*10)+1, foodQuality: Math.floor(Math.random()*5)+5, mood: Math.floor(Math.random()*5)+5, comment: '' });
  }
  return result.reverse();
};

export const db = {
  login: async (name: string, code: string): Promise<{ role: 'COACH' | 'ATHLETE', user?: Athlete }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (name.toUpperCase() === 'COACH' && code === '9999') return { role: 'COACH' };
    const athlete = athletes.find(a => a.firstName.toUpperCase() === name.toUpperCase() && a.code === code);
    if (athlete) return { role: 'ATHLETE', user: athlete };
    throw new Error("Identifiants invalides");
  },

  getAthletes: async (): Promise<Athlete[]> => {
    return athletes.map(a => {
      if (!logs[a.id] || logs[a.id].length === 0) logs[a.id] = generateMockLogs(30);
      return { ...a, dailyLogs: logs[a.id] };
    });
  },

  getAthleteSessions: async (athleteId: string): Promise<WorkoutSession[]> => sessions[athleteId] || [],
  getNextMatch: async (): Promise<Match> => NEXT_MATCH,

  assignWorkout: async (athleteId: string, workout: Omit<WorkoutSession, 'id' | 'completed'>) => {
    const newSession: WorkoutSession = { ...workout, id: Math.random().toString(36).substr(2, 9), completed: false };
    if (!sessions[athleteId]) sessions[athleteId] = [];
    sessions[athleteId].push(newSession);
    return newSession;
  },

  completeSession: async (athleteId: string, sessionId: string, rpe: number) => {
    const session = sessions[athleteId]?.find(s => s.id === sessionId);
    if (session) { session.completed = true; session.actualRpe = rpe; }
  },

  saveDailyLog: async (athleteId: string, log: DailyLog) => {
    if (!logs[athleteId]) logs[athleteId] = [];
    logs[athleteId].push(log);
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      let gainedXp = 100;
      athlete.gamification.streakDays += 1;
      if (athlete.gamification.streakDays % 7 === 0) gainedXp += 250;
      if (athlete.gamification.streakDays % 15 === 0) gainedXp += 500;
      athlete.gamification.currentXp += gainedXp;
      checkLevelUp(athlete);
    }
  },

  sendMessage: async (athleteId: string, subject: string, message: string) => {
    if (!messages[athleteId]) messages[athleteId] = [];
    messages[athleteId].push({ date: new Date().toISOString(), subject, message });
    return true;
  },

  getAppointments: async (): Promise<Appointment[]> => APPOINTMENTS,

  bookAppointment: async (appointmentId: string, athleteId: string, reason: string) => {
    const apt = APPOINTMENTS.find(a => a.id === appointmentId);
    if (apt && !apt.isBooked) { apt.isBooked = true; apt.bookedBy = athleteId; apt.reason = reason; return true; }
    return false;
  },

  addObjective: async (athleteId: string, type: 'shortTerm' | 'mediumTerm' | 'longTerm', label: string) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete && athlete.structuredObjectives) {
      athlete.structuredObjectives[type].push({ id: Math.random().toString(36).substr(2,9), label, status: 'ACTIVE' });
      return true;
    }
    return false;
  },

  requestObjectiveValidation: async (athleteId: string, type: 'shortTerm' | 'mediumTerm' | 'longTerm', objectiveId: string) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      const obj = athlete.structuredObjectives[type].find(o => o.id === objectiveId);
      if (obj && obj.status === 'ACTIVE') { obj.status = 'PENDING_VALIDATION'; return true; }
    }
    return false;
  },

  approveObjective: async (athleteId: string, type: 'shortTerm' | 'mediumTerm' | 'longTerm', objectiveId: string, approved: boolean) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      const obj = athlete.structuredObjectives[type].find(o => o.id === objectiveId);
      if (obj && obj.status === 'PENDING_VALIDATION') { obj.status = approved ? 'VALIDATED' : 'ACTIVE'; return true; }
    }
    return false;
  },

  claimObjectiveReward: async (athleteId: string, type: 'shortTerm' | 'mediumTerm' | 'longTerm', objectiveId: string) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      const list = athlete.structuredObjectives[type];
      const index = list.findIndex(o => o.id === objectiveId);
      if (index !== -1 && list[index].status === 'VALIDATED') {
        list.splice(index, 1);
        let reward = 0;
        if (type === 'shortTerm') reward = 500;
        if (type === 'mediumTerm') reward = 1000;
        if (type === 'longTerm') reward = 3000;
        athlete.gamification.currentXp += reward;
        checkLevelUp(athlete);
        return reward;
      }
    }
    return 0;
  },

  updateSkin: async (athleteId: string, skin: string) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete && athlete.gamification.unlockedSkins.includes(skin)) { athlete.gamification.selectedSkin = skin; return true; }
    return false;
  },

  logMeal: async (athleteId: string, meal: MealLog) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      let cals = 0, pro = 0, carb = 0, fat = 0;
      meal.foods.forEach(f => {
        const ratio = f.item.unit === 'piece' ? f.quantity : f.quantity / 100;
        cals += f.item.calories * ratio; pro += f.item.protein * ratio; carb += f.item.carbs * ratio; fat += f.item.fat * ratio;
      });
      meal.totalCalories = Math.round(cals); meal.totalProtein = Math.round(pro); meal.totalCarbs = Math.round(carb); meal.totalFat = Math.round(fat);
      athlete.nutritionHistory.push(meal);
      athlete.gamification.currentXp += 150;
      const todayStr = localStr(new Date());
      if (athlete.nutritionHistory.filter(m => m.date === todayStr).length >= 4) athlete.gamification.currentXp += 200;
      checkLevelUp(athlete);
      return true;
    }
    return false;
  },

  deleteMealLog: async (athleteId: string, mealId: string) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) { athlete.nutritionHistory = athlete.nutritionHistory.filter(m => m.id !== mealId); return true; }
    return false;
  },

  getFoods: async () => FOOD_DATABASE,

  getWeeklySchedule: async (startDateStr: string): Promise<DaySchedule[]> => {
    // localStorage en priorité absolue (sync coach→joueur, survit au refresh)
    try {
      const ls = typeof localStorage !== 'undefined' && localStorage.getItem('nexus_sched_' + startDateStr);
      if (ls) { const p = JSON.parse(ls); WEEKLY_SCHEDULE_CACHE[startDateStr] = p; return p; }
    } catch {}
    if (WEEKLY_SCHEDULE_CACHE[startDateStr]) return WEEKLY_SCHEDULE_CACHE[startDateStr];

    // Parse as local date (avoid UTC timezone bug)
    const [yr, mo, dy] = startDateStr.split('-').map(Number);
    const requestedDate = new Date(yr, mo - 1, dy, 0, 0, 0, 0);

    // Get current Monday in local time
    const now = new Date();
    const currentMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const dow = currentMonday.getDay();
    currentMonday.setDate(currentMonday.getDate() - (dow === 0 ? 6 : dow - 1));

    const isCurrentWeek = Math.abs(currentMonday.getTime() - requestedDate.getTime()) < 24 * 3600 * 1000;

    const weekDays = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
    const days: DaySchedule[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), requestedDate.getDate() + i, 0, 0, 0, 0);
      days.push({
        dayName: weekDays[i],
        date: localStr(d),
        events: isCurrentWeek && MOCK_EVENTS_SOURCE[i] ? [...MOCK_EVENTS_SOURCE[i]] : []
      });
    }

    WEEKLY_SCHEDULE_CACHE[startDateStr] = days;
    return days;
  },

  updateWeeklySchedule: async (schedule: DaySchedule[]) => {
    if (schedule.length > 0) {
      const start = schedule[0].date;
      WEEKLY_SCHEDULE_CACHE[start] = schedule;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('nexus_sched_' + start, JSON.stringify(schedule));
          window.dispatchEvent(new CustomEvent('schedule-updated', { detail: { start } }));
        }
      } catch {}
    }
    return true;
  },

  submitAttendance: async (type: 'WATER' | 'DRY', data: Record<string, 'PRESENT' | 'INJURED' | 'ABSENT_JUSTIFIED' | 'ABSENT_UNJUSTIFIED'>) => {
    const todayStr = localStr(new Date());
    athletes.forEach(ath => {
      const status = data[ath.id];
      if (status) {
        const history = type === 'WATER' ? ath.monitoring.waterHistory : ath.monitoring.dryHistory;
        const existingIdx = history.findIndex(d => d.date === todayStr);
        if (existingIdx !== -1) history[existingIdx].attendance = status as any;
        else history.push({ date: todayStr, rpe: 0, attendance: status as any });
      }
    });
    return true;
  },

  addSessionLog: async (athleteId: string, date: string, type: string, duration: number, rpe: number) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      const load = rpe * duration;
      const isWater = ['WATER-POLO', 'MATCH'].includes(type);
      const history = isWater ? athlete.monitoring.waterHistory : athlete.monitoring.dryHistory;
      const existing = history.find(h => h.date === date);
      if (existing) { existing.rpe = rpe; existing.duration = duration; existing.load = load; existing.sessionType = type; }
      else history.push({ date, rpe, attendance: 'PRESENT', duration, load, sessionType: type });
      return true;
    }
    return false;
  }
};
