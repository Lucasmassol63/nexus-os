import { Athlete, WorkoutSession, DailyLog, Match, Appointment, ObjectiveItem, ObjectiveStatus, FoodItem, MealLog, DaySchedule, ScheduleEvent, TeamStats, FederationStats, MonitoringDay } from '../types';

// Mock Match Data
const NEXT_MATCH: Match = {
  id: 'm1',
  opponent: 'LIVRY-GARGAN',
  date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
  time: '20:00',
  isHome: true,
  location: 'Piscine Olympique CNM'
};

// Mock Team Stats
export const TEAM_STATS: TeamStats = {
  gamesPlayed: 12,
  wins: 8,
  losses: 3,
  draws: 1
};

// Helper for dates
const getDayDate = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};

// Helper to generate recent training history
const generateRecentHistory = (
  days: number,
  trainingDays: number[], // day of week (0=Sun, 1=Mon, ...)
  attendanceRate: number, // 0-100
  baseRpe: number,
  sessionType: string,
  baseDuration: number
): MonitoringDay[] => {
  const result: MonitoringDay[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (!trainingDays.includes(d.getDay())) continue;
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    const dateStr = `${d.getFullYear()}-${mm}-${dd}`;
    const seed = i + Math.floor(baseRpe);
    const isPresent = (seed % 10) < (attendanceRate / 10);
    const rpeVariation = ((seed * 7) % 30) / 10 - 1.5;
    const rpe = isPresent ? parseFloat(Math.max(1, Math.min(10, baseRpe + rpeVariation)).toFixed(1)) : 0;
    const duration = isPresent ? baseDuration + ((seed * 3) % 20) : 0;
    result.push({
      date: dateStr,
      rpe,
      attendance: isPresent ? 'PRESENT' : ((seed % 3 === 0) ? 'ABSENT_JUSTIFIED' : 'ABSENT_UNJUSTIFIED'),
      duration,
      load: Math.round(rpe * duration),
      sessionType
    });
  }
  return result;
};

// --- STATIC MOCK DATA FOR CURRENT WEEK ---
const MOCK_EVENTS_SOURCE: Record<number, ScheduleEvent[]> = {
  0: [ // Monday
    { id: '1', type: 'KINE', startTime: '10:00', endTime: '12:00', title: 'Soins & Récup', description: 'Passage obligatoire', isVisibleToAthletes: true, intensity: 2 },
    { id: '2', type: 'MUSCU', startTime: '18:00', endTime: '19:30', title: 'Hypertrophy', description: 'Cycle Force', intensity: 8, isVisibleToAthletes: true }
  ],
  1: [ // Tuesday
    { id: '3', type: 'VIDEO', startTime: '18:00', endTime: '19:00', title: 'Analyse Livry', description: 'Retour match', isVisibleToAthletes: true, intensity: 3 },
    { id: '4', type: 'WATER-POLO', startTime: '19:00', endTime: '21:00', title: 'Tactical', intensity: 7, isVisibleToAthletes: true }
  ],
  2: [ // Wednesday
    { id: '5', type: 'MENTAL', startTime: '14:00', endTime: '15:00', title: 'Visualisation', description: 'Groupe complet', isVisibleToAthletes: true, intensity: 4 },
    { id: '6', type: 'SLOT_LIBRE', startTime: '15:00', endTime: '17:00', title: 'Créneaux Staff', description: 'Réservable', isVisibleToAthletes: true, intensity: 1 }
  ],
  3: [ // Thursday
    { id: '7', type: 'ENTRETIEN', startTime: '17:00', endTime: '18:00', title: 'Entretiens Individuels', description: 'Point mi-saison', isVisibleToAthletes: false, intensity: 1 },
    { id: '8', type: 'MUSCU', startTime: '18:00', endTime: '19:00', title: 'Strength', intensity: 9, isVisibleToAthletes: true },
    { id: '9', type: 'WATER-POLO', startTime: '19:00', endTime: '20:30', title: 'Zone/Pressing', intensity: 8, isVisibleToAthletes: true }
  ],
  4: [ // Friday
    { id: '10', type: 'MEETING', startTime: '19:00', endTime: '19:30', title: 'Briefing Match', description: '', isVisibleToAthletes: true, intensity: 2 },
    { id: '11', type: 'WATER-POLO', startTime: '19:30', endTime: '21:00', title: 'Speed', intensity: 9, isVisibleToAthletes: true }
  ],
  5: [ // Saturday
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
  { id: 'f16', name: 'Steak Haché 5%', category: 'PROTEIN', unit: 'g', calories: 125, protein: 21, carbs: 0, fat: 5 },
  { id: 'f17', name: 'Tofu', category: 'PROTEIN', unit: 'g', calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  { id: 'f18', name: 'Thon (Boîte)', category: 'PROTEIN', unit: 'g', calories: 116, protein: 26, carbs: 0, fat: 1 },

  // STARCH (Féculents)
  { id: 'f2', name: 'Riz Basmati (Cuit)', category: 'STARCH', unit: 'g', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: 'f5', name: 'Flocons d\'Avoine', category: 'STARCH', unit: 'g', calories: 389, protein: 16.9, carbs: 66, fat: 6.9 },
  { id: 'f7', name: 'Pâtes (Cuites)', category: 'STARCH', unit: 'g', calories: 158, protein: 6, carbs: 31, fat: 1 },
  { id: 'f11', name: 'Pain Complet', category: 'STARCH', unit: 'g', calories: 247, protein: 13, carbs: 41, fat: 3.4 },
  { id: 'f14', name: 'Pomme de Terre', category: 'STARCH', unit: 'g', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  { id: 'f19', name: 'Patate Douce', category: 'STARCH', unit: 'g', calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { id: 'f20', name: 'Quinoa (Cuit)', category: 'STARCH', unit: 'g', calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },

  // VEGETABLES / FRUITS
  { id: 'f4', name: 'Avocat', category: 'VEGETABLE', unit: 'piece', calories: 250, protein: 3, carbs: 12, fat: 23 },
  { id: 'f9', name: 'Banane', category: 'VEGETABLE', unit: 'piece', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { id: 'f12', name: 'Brocolis', category: 'VEGETABLE', unit: 'g', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { id: 'f21', name: 'Pomme', category: 'VEGETABLE', unit: 'piece', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { id: 'f22', name: 'Haricots Verts', category: 'VEGETABLE', unit: 'g', calories: 31, protein: 1.8, carbs: 7, fat: 0.2 },

  // OTHER
  { id: 'f8', name: 'Huile d\'Olive', category: 'OTHER', unit: 'ml', calories: 884, protein: 0, carbs: 0, fat: 100 },
  { id: 'f13', name: 'Amandes', category: 'OTHER', unit: 'g', calories: 579, protein: 21, carbs: 22, fat: 50 },
  { id: 'f15', name: 'Fromage Blanc 0%', category: 'OTHER', unit: 'g', calories: 48, protein: 8, carbs: 4, fat: 0.1 },
  { id: 'f23', name: 'Nutella', category: 'OTHER', unit: 'g', calories: 546, protein: 6, carbs: 57, fat: 30 },
  { id: 'f24', name: 'Beurre de Cacahuète', category: 'OTHER', unit: 'g', calories: 588, protein: 25, carbs: 20, fat: 50 },
];

// Initial Mock Data
const MOCK_ATHLETES: Athlete[] = [
  {
    id: '1',
    firstName: 'Arthur',
    lastName: 'PEREA',
    code: '1234',
    age: 24,
    type: 'TEAM',
    objectives: 'Explosivité & Gainage',
    structuredObjectives: {
      shortTerm: [
        { id: 'st1', label: 'Améliorer le squat (+5kg)', status: 'ACTIVE' },
        { id: 'st2', label: 'Sommeil > 7h/nuit', status: 'VALIDATED' } // Ready to claim
      ],
      mediumTerm: [
        { id: 'mt1', label: 'Sélection Équipe A', status: 'ACTIVE' },
        { id: 'mt2', label: 'Réduire masse grasse à 10%', status: 'PENDING_VALIDATION' }
      ],
      longTerm: [
        { id: 'lt1', label: 'Championnat National', status: 'ACTIVE' },
        { id: 'lt2', label: '0 Blessures sur la saison', status: 'ACTIVE' }
      ]
    },
    gamification: {
      level: 3,
      currentXp: 350,
      nextLevelXp: 1000,
      streakDays: 6,
      rank: 'Titulaire', 
      selectedSkin: '🦅',
      unlockedSkins: ['🐣', '🦅'],
      unlockedFeatures: ['DARK_MODE']
    },
    nutritionHistory: [],
    stats: {
      goals: 14,
      fouls: 5,
      matchesPlayed: 8,
      exclusions: 2
    },
    monitoring: {
      waterRpe: 7.2,
      waterAttendance: 95,
      waterHistory: [
        { date: '2026-02-01', rpe: 6, attendance: 'PRESENT', duration: 90, load: 540, sessionType: 'WATER-POLO' }, 
        { date: '2026-02-02', rpe: 9, attendance: 'PRESENT', duration: 60, load: 540, sessionType: 'WATER-POLO' }, 
        { date: '2026-02-03', rpe: 10, attendance: 'ABSENT_JUSTIFIED', duration: 0, load: 0, sessionType: 'WATER-POLO' }, 
        { date: '2026-02-04', rpe: 10, attendance: 'PRESENT', duration: 90, load: 900, sessionType: 'MATCH' }, 
        { date: '2026-02-05', rpe: 9, attendance: 'PRESENT', duration: 60, load: 540, sessionType: 'WATER-POLO' },
        { date: '2026-02-06', rpe: 0, attendance: 'INJURED', duration: 0, load: 0, sessionType: 'WATER-POLO' },
        { date: '2026-02-07', rpe: 9.5, attendance: 'PRESENT', duration: 75, load: 712.5, sessionType: 'WATER-POLO' }
      ],
      dryRpe: 8.5,
      dryAttendance: 88,
      dryHistory: [
        { date: '2026-02-01', rpe: 8, attendance: 'PRESENT', duration: 60, load: 480, sessionType: 'MUSCU' }, 
        { date: '2026-02-03', rpe: 9, attendance: 'PRESENT', duration: 60, load: 540, sessionType: 'MUSCU' }, 
        { date: '2026-02-05', rpe: 0, attendance: 'ABSENT_UNJUSTIFIED', duration: 0, load: 0, sessionType: 'MUSCU' }, 
        { date: '2026-02-07', rpe: 8.5, attendance: 'PRESENT', duration: 45, load: 382.5, sessionType: 'MUSCU' }
      ],
      weight: [{date: 'S1', value: 82.5}, {date: 'S2', value: 82.8}, {date: 'S3', value: 83.0}, {date: 'S4', value: 82.9}],
      height: 184,
      measurements: {
        chest: 108,
        waist: 82,
        thighs: 62,
        arms: 41
      }
    },
    lastCheckIn: {
      date: new Date().toISOString(),
      sleep: 4,
      fatigue: 9,
      soreness: 8,
      foodQuality: 6,
      mood: 4,
      comment: "J'ai une douleur vive à l'épaule depuis hier" // Alert keyword
    },
    performance: {
      flexibility: [
        { subject: 'Cheville G', A: 80, B: 75, fullMark: 100 },
        { subject: 'Cheville D', A: 85, B: 75, fullMark: 100 },
        { subject: 'Adducteur', A: 65, B: 80, fullMark: 100 },
        { subject: 'Hanche G', A: 70, B: 70, fullMark: 100 },
        { subject: 'Hanche D', A: 72, B: 70, fullMark: 100 },
        { subject: 'Epaule G', A: 90, B: 85, fullMark: 100 },
        { subject: 'Epaule D', A: 88, B: 85, fullMark: 100 },
      ],
      dry: [
        { subject: 'CMJ Dry', A: 65, B: 60, fullMark: 100 },
        { subject: '1RM Bench', A: 110, B: 100, fullMark: 150 },
        { subject: '1RM Squat', A: 140, B: 130, fullMark: 200 },
        { subject: 'Pull-up', A: 25, B: 20, fullMark: 40 },
        { subject: 'Max Pull', A: 135, B: 120, fullMark: 150 },
      ],
      water: [
        { subject: 'CMJ Water', A: 70, B: 65, fullMark: 100 },
        { subject: 'RAST', A: 85, B: 80, fullMark: 100 },
        { subject: 'WIST', A: 78, B: 85, fullMark: 100 },
      ]
    },
    federationStats: [
      { competition: 'N1', matchesPlayed: 1, goals: 2, shotsOnGoal: 3, exclusions: 2, penalties: 0 },
      { competition: 'U18', matchesPlayed: 4, goals: 15, shotsOnGoal: 15, exclusions: 8, penalties: 2 }
    ]
  },
  {
    id: '2',
    firstName: 'Louis',
    lastName: 'PEYRUDE',
    code: '5678',
    age: 28,
    type: 'PRIVATE',
    objectives: 'Hypertrophie',
    structuredObjectives: {
      shortTerm: [],
      mediumTerm: [],
      longTerm: []
    },
    gamification: {
      level: 1,
      currentXp: 50,
      nextLevelXp: 500,
      streakDays: 2,
      rank: 'Novice',
      selectedSkin: '🐣',
      unlockedSkins: ['🐣'],
      unlockedFeatures: []
    },
    nutritionHistory: [],
    stats: {
      goals: 5,
      fouls: 3,
      matchesPlayed: 4,
      exclusions: 8
    },
    monitoring: {
      waterRpe: 7.5,
      waterAttendance: 85,
      waterHistory: [],
      dryRpe: 9.0,
      dryAttendance: 100,
      dryHistory: [],
      weight: [{date: 'S1', value: 75.0}, {date: 'S2', value: 75.5}],
      height: 178,
      measurements: {
        chest: 102,
        waist: 78,
        thighs: 58,
        arms: 38
      }
    },
    performance: {
      flexibility: [
        { subject: 'Global', A: 60, B: 70, fullMark: 100 },
      ],
      dry: [
        { subject: 'Force', A: 80, B: 70, fullMark: 100 },
      ],
      water: []
    },
    federationStats: [
      { competition: 'N1', matchesPlayed: 4, goals: 5, shotsOnGoal: 5, exclusions: 8, penalties: 1 },
      { competition: 'U18', matchesPlayed: 4, goals: 14, shotsOnGoal: 14, exclusions: 11, penalties: 2 }
    ]
  },
  {
    id: '3',
    firstName: 'Audoin',
    lastName: 'DE REVIERS',
    code: '1111',
    age: 22,
    type: 'TEAM',
    objectives: '',
    structuredObjectives: { shortTerm: [], mediumTerm: [], longTerm: [] },
    gamification: { level: 2, currentXp: 120, nextLevelXp: 500, streakDays: 3, rank: 'Espoir', selectedSkin: '🦊', unlockedSkins: ['🐣', '🦊'], unlockedFeatures: [] },
    nutritionHistory: [],
    stats: { goals: 60, fouls: 2, matchesPlayed: 5, exclusions: 18 },
    monitoring: { waterRpe: 7.5, waterAttendance: 90, waterHistory: [], dryRpe: 7, dryAttendance: 85, dryHistory: [], weight: [], height: 180, measurements: { chest: 0, waist: 0, thighs: 0, arms: 0 } },
    performance: { flexibility: [], dry: [], water: [] },
    federationStats: [
      { competition: 'N1', matchesPlayed: 5, goals: 60, shotsOnGoal: 61, exclusions: 18, penalties: 0 }
    ]
  },
  {
    id: '4',
    firstName: 'Baptiste',
    lastName: 'AUDON',
    code: '2222',
    age: 25,
    type: 'TEAM',
    objectives: '',
    structuredObjectives: { shortTerm: [], mediumTerm: [], longTerm: [] },
    gamification: { level: 5, currentXp: 800, nextLevelXp: 1500, streakDays: 20, rank: 'Expert', selectedSkin: '🦁', unlockedSkins: ['🐣', '🦁'], unlockedFeatures: [] },
    nutritionHistory: [],
    stats: { goals: 7, fouls: 6, matchesPlayed: 3, exclusions: 16 },
    monitoring: { waterRpe: 8, waterAttendance: 100, waterHistory: [], dryRpe: 9, dryAttendance: 100, dryHistory: [], weight: [], height: 190, measurements: { chest: 0, waist: 0, thighs: 0, arms: 0 } },
    performance: { flexibility: [], dry: [], water: [] },
    federationStats: [
      { competition: 'N1', matchesPlayed: 3, goals: 7, shotsOnGoal: 11, exclusions: 16, penalties: 2 }
    ]
  },
  {
    id: '5',
    firstName: 'Dario',
    lastName: 'DANOVSKI',
    code: '3333',
    age: 30,
    type: 'TEAM',
    objectives: '',
    structuredObjectives: { shortTerm: [], mediumTerm: [], longTerm: [] },
    gamification: { level: 4, currentXp: 400, nextLevelXp: 1000, streakDays: 10, rank: 'Pro', selectedSkin: '🐺', unlockedSkins: ['🐣', '🐺'], unlockedFeatures: [] },
    nutritionHistory: [],
    stats: { goals: 47, fouls: 5, matchesPlayed: 6, exclusions: 7 },
    monitoring: { waterRpe: 7.5, waterAttendance: 92, waterHistory: [], dryRpe: 7.5, dryAttendance: 95, dryHistory: [], weight: [], height: 185, measurements: { chest: 0, waist: 0, thighs: 0, arms: 0 } },
    performance: { flexibility: [], dry: [], water: [] },
    federationStats: [
      { competition: 'N1', matchesPlayed: 6, goals: 47, shotsOnGoal: 67, exclusions: 7, penalties: 1 }
    ]
  },
  {
    id: '6',
    firstName: 'Elias',
    lastName: 'FERRAND',
    code: '4444',
    age: 20,
    type: 'TEAM',
    objectives: '',
    structuredObjectives: { shortTerm: [], mediumTerm: [], longTerm: [] },
    gamification: { level: 1, currentXp: 20, nextLevelXp: 200, streakDays: 0, rank: 'Rookie', selectedSkin: '🐣', unlockedSkins: ['🐣'], unlockedFeatures: [] },
    nutritionHistory: [],
    stats: { goals: 0, fouls: 0, matchesPlayed: 6, exclusions: 1 },
    monitoring: { waterRpe: 6, waterAttendance: 70, waterHistory: [], dryRpe: 5, dryAttendance: 60, dryHistory: [], weight: [], height: 175, measurements: { chest: 0, waist: 0, thighs: 0, arms: 0 } },
    performance: { flexibility: [], dry: [], water: [] },
    federationStats: [
      { competition: 'N1', matchesPlayed: 6, goals: 0, shotsOnGoal: 0, exclusions: 0, penalties: 0 },
      { competition: 'U18', matchesPlayed: 5, goals: 0, shotsOnGoal: 0, exclusions: 1, penalties: 2 }
    ]
  }
];

// Mock Appointments
const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

let APPOINTMENTS: Appointment[] = [
  { id: 'apt1', date: today.toISOString().split('T')[0], time: '14:00', coachName: 'Coach Head', isBooked: false },
  { id: 'apt2', date: today.toISOString().split('T')[0], time: '15:00', coachName: 'Coach Head', isBooked: false },
  { id: 'apt3', date: tomorrow.toISOString().split('T')[0], time: '09:00', coachName: 'Coach Physio', isBooked: false },
  { id: 'apt4', date: tomorrow.toISOString().split('T')[0], time: '10:00', coachName: 'Coach Physio', isBooked: true, bookedBy: '1', reason: 'Douleur épaule' },
];

const INITIAL_WORKOUT: WorkoutSession = {
  id: 'w1',
  date: new Date().toISOString().split('T')[0],
  title: 'Prépa Physique Générale',
  type: 'MUSCU',
  completed: false,
  contentJson: JSON.stringify([
    { id: 'e1', name: 'Back Squat', sets: 4, reps: '6-8', tempo: '3010', rest: '120s', targetLoad: '80kg' },
    { id: 'e2', name: 'Pull Ups Weighted', sets: 4, reps: 'MAX', tempo: '2010', rest: '90s', targetLoad: '+10kg' },
    { id: 'e3', name: 'Dips', sets: 3, reps: '12', tempo: '2110', rest: '60s', targetLoad: 'BW' }
  ])
};

let athletes = [...MOCK_ATHLETES];

// Inject recent monitoring history (last 28 days) so ACWR & charts work
athletes.forEach(a => {
  // Water/polo history: Mon(1), Tue(2), Thu(4), Fri(5), Sat(6)
  const recentWater = generateRecentHistory(28, [1, 2, 4, 5, 6], a.monitoring.waterAttendance || 88, a.monitoring.waterRpe || 7, 'WATER-POLO', 80);
  // Dry/muscu history: Mon(1), Wed(3), Fri(5)
  const recentDry = generateRecentHistory(28, [1, 3, 5], a.monitoring.dryAttendance || 85, a.monitoring.dryRpe || 7.5, 'MUSCU', 60);
  a.monitoring.waterHistory = [...a.monitoring.waterHistory, ...recentWater];
  a.monitoring.dryHistory = [...a.monitoring.dryHistory, ...recentDry];
});
let sessions: Record<string, WorkoutSession[]> = {
  '1': [INITIAL_WORKOUT],
  '2': []
};
let logs: Record<string, DailyLog[]> = {};
let messages: Record<string, any[]> = {}; 

// Mock persistent schedule (simplified)
// We'll regenerate the array based on the requested start date
let WEEKLY_SCHEDULE_CACHE: Record<string, DaySchedule[]> = {};

// --- GAMIFICATION LOGIC ---
const SKINS_MAP: Record<number, string> = {
  1: '🐣',  // Baby Bird
  3: '🦅',  // Eagle
  5: '🦊',  // Fox
  10: '🐺', // Wolf
  15: '🦁', // Lion
  20: '🐉'  // Dragon
};

const checkLevelUp = (athlete: Athlete) => {
  if (athlete.gamification.currentXp >= athlete.gamification.nextLevelXp) {
    athlete.gamification.level += 1;
    athlete.gamification.currentXp -= athlete.gamification.nextLevelXp;
    athlete.gamification.nextLevelXp = Math.round(athlete.gamification.nextLevelXp * 1.5); 
    
    // Unlock skin?
    const newSkin = SKINS_MAP[athlete.gamification.level];
    if (newSkin && !athlete.gamification.unlockedSkins.includes(newSkin)) {
      athlete.gamification.unlockedSkins.push(newSkin);
      alert(`🎉 NOUVEAU SKIN DÉBLOQUÉ : ${newSkin} !`);
    }
    return true; 
  }
  return false;
};

// Helper to generate mock daily logs
const generateMockLogs = (count: number): DailyLog[] => {
  const logs: DailyLog[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    logs.push({
      date: d.toISOString().split('T')[0],
      sleep: Math.floor(Math.random() * 5) + 5, // 5-10
      fatigue: Math.floor(Math.random() * 10) + 1, // 1-10
      soreness: Math.floor(Math.random() * 10) + 1, // 1-10
      foodQuality: Math.floor(Math.random() * 5) + 5, // 5-10
      mood: Math.floor(Math.random() * 5) + 5, // 5-10
      comment: ''
    });
  }
  return logs.reverse();
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
    // Populate logs if empty
    return athletes.map(a => {
      if (!logs[a.id] || logs[a.id].length === 0) {
        logs[a.id] = generateMockLogs(30); // 30 days history
      }
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
      let gainedXp = 100; // Base daily
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
    if (apt && !apt.isBooked) {
      apt.isBooked = true;
      apt.bookedBy = athleteId;
      apt.reason = reason;
      return true;
    }
    return false;
  },

  // OBJECTIVES LOGIC
  addObjective: async (athleteId: string, type: 'shortTerm' | 'mediumTerm' | 'longTerm', label: string) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete && athlete.structuredObjectives) {
      const newObj: ObjectiveItem = {
        id: Math.random().toString(36).substr(2, 9),
        label,
        status: 'ACTIVE'
      };
      athlete.structuredObjectives[type].push(newObj);
      return true;
    }
    return false;
  },

  requestObjectiveValidation: async (athleteId: string, type: 'shortTerm' | 'mediumTerm' | 'longTerm', objectiveId: string) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      const obj = athlete.structuredObjectives[type].find(o => o.id === objectiveId);
      if (obj && obj.status === 'ACTIVE') {
        obj.status = 'PENDING_VALIDATION';
        return true;
      }
    }
    return false;
  },

  approveObjective: async (athleteId: string, type: 'shortTerm' | 'mediumTerm' | 'longTerm', objectiveId: string, approved: boolean) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      const obj = athlete.structuredObjectives[type].find(o => o.id === objectiveId);
      if (obj && obj.status === 'PENDING_VALIDATION') {
        obj.status = approved ? 'VALIDATED' : 'ACTIVE';
        return true;
      }
    }
    return false;
  },

  claimObjectiveReward: async (athleteId: string, type: 'shortTerm' | 'mediumTerm' | 'longTerm', objectiveId: string) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      const list = athlete.structuredObjectives[type];
      const index = list.findIndex(o => o.id === objectiveId);
      
      if (index !== -1 && list[index].status === 'VALIDATED') {
        // Remove objective completely
        list.splice(index, 1);
        
        // Award XP
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
    if (athlete && athlete.gamification.unlockedSkins.includes(skin)) {
      athlete.gamification.selectedSkin = skin;
      return true;
    }
    return false;
  },

  // --- NUTRITION LOGIC ---
  logMeal: async (athleteId: string, meal: MealLog) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      // Calculate totals
      let cals = 0, pro = 0, carb = 0, fat = 0;
      meal.foods.forEach(f => {
        const ratio = f.item.unit === 'piece' ? f.quantity : f.quantity / 100;
        cals += f.item.calories * ratio;
        pro += f.item.protein * ratio;
        carb += f.item.carbs * ratio;
        fat += f.item.fat * ratio;
      });

      meal.totalCalories = Math.round(cals);
      meal.totalProtein = Math.round(pro);
      meal.totalCarbs = Math.round(carb);
      meal.totalFat = Math.round(fat);

      athlete.nutritionHistory.push(meal);

      // Add XP for Meal
      athlete.gamification.currentXp += 150;

      // Check Perfect Day Bonus (4 meals logged today)
      const today = new Date().toISOString().split('T')[0];
      const mealsToday = athlete.nutritionHistory.filter(m => m.date === today).length;
      
      if (mealsToday >= 4) { // 3 meals + snack
         // Simple bonus logic, ideally check macro targets too
         athlete.gamification.currentXp += 200;
      }

      checkLevelUp(athlete);
      return true;
    }
    return false;
  },

  deleteMealLog: async (athleteId: string, mealId: string) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      athlete.nutritionHistory = athlete.nutritionHistory.filter(m => m.id !== mealId);
      return true;
    }
    return false;
  },

  getFoods: async () => FOOD_DATABASE,

  // --- COACHING PLANNING & ATTENDANCE ---
  getWeeklySchedule: async (startDateStr: string): Promise<DaySchedule[]> => {
    // If it's already cached, return it
    if (WEEKLY_SCHEDULE_CACHE[startDateStr]) {
      return WEEKLY_SCHEDULE_CACHE[startDateStr];
    }

    // Determine if the requested start date is THIS week (mock default)
    // For simplicity in this mock, we say if startDate matches roughly today's Monday, we load mock events
    // Otherwise we return empty.
    const requestedDate = new Date(startDateStr);
    const today = new Date();
    // Get current Monday
    const currentMonday = new Date(today);
    const day = currentMonday.getDay();
    const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1);
    currentMonday.setDate(diff);
    currentMonday.setHours(0,0,0,0);
    requestedDate.setHours(0,0,0,0);

    const isCurrentWeek = Math.abs(currentMonday.getTime() - requestedDate.getTime()) < 24 * 3600 * 1000;

    const days: DaySchedule[] = [];
    const weekDays = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(requestedDate);
      d.setDate(requestedDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      days.push({
        dayName: weekDays[i],
        date: dateStr,
        events: isCurrentWeek && MOCK_EVENTS_SOURCE[i] ? [...MOCK_EVENTS_SOURCE[i]] : []
      });
    }

    WEEKLY_SCHEDULE_CACHE[startDateStr] = days;
    return days;
  },
  
  updateWeeklySchedule: async (schedule: DaySchedule[]) => {
    if (schedule.length > 0) {
      // Find the start date (Monday) of this schedule to update cache key
      const start = schedule[0].date;
      WEEKLY_SCHEDULE_CACHE[start] = schedule;
    }
    return true;
  },

  submitAttendance: async (type: 'WATER' | 'DRY', data: Record<string, 'PRESENT' | 'INJURED' | 'ABSENT_JUSTIFIED' | 'ABSENT_UNJUSTIFIED'>) => {
    // This assumes attendance is logged for "Today"
    const today = new Date().toISOString().split('T')[0];
    
    athletes.forEach(ath => {
      const status = data[ath.id];
      if (status) {
        const history = type === 'WATER' ? ath.monitoring.waterHistory : ath.monitoring.dryHistory;
        // Check if already logged for today, if so replace, else push
        const existingIdx = history.findIndex(d => d.date === today);
        if (existingIdx !== -1) {
          history[existingIdx].attendance = status as any;
        } else {
          history.push({ date: today, rpe: 0, attendance: status as any });
        }
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
      
      // Check if entry exists for date
      const existing = history.find(h => h.date === date);
      if (existing) {
        existing.rpe = rpe;
        existing.duration = duration;
        existing.load = load;
        existing.sessionType = type;
      } else {
        history.push({
          date,
          rpe,
          attendance: 'PRESENT',
          duration,
          load,
          sessionType: type
        });
      }
      return true;
    }
    return false;
  },

  // Update federation stats from FFN scrape
  updateFederationStats: (athleteId: string, stats: FederationStats[]) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      athlete.federationStats = stats;
    }
  }
};