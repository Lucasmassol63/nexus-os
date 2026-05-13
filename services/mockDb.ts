// ============================================================
//  mockDb.ts — STUB (plus utilisé, remplacé par Supabase)
//  Conservé pour éviter les erreurs d'import résiduels
// ============================================================

export const db = {
  login:                     async () => { throw new Error('Utilise athleteService.login()'); },
  getAthletes:               async () => [],
  saveDailyLog:              async () => {},
  getAthleteSessions:        async () => [],
  getNextMatch:              async () => null,
  getWeeklySchedule:         async () => [],
  updateWeeklySchedule:      async () => {},
  getAppointments:           async () => [],
  bookAppointment:           async () => false,
  sendMessage:               async () => {},
  addObjective:              async () => {},
  requestObjectiveValidation:async () => {},
  approveObjective:          async () => {},
  claimObjectiveReward:      async () => 0,
  updateSkin:                async () => {},
  getFoods:                  async () => [],
  logMeal:                   async () => {},
  deleteMealLog:             async () => {},
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  addSessionLog:             async () => {},
const localDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  assignWorkout:             async () => {},
  completeSession:           async () => {},
  getTeamStats:              async () => ({ gamesPlayed: 0, wins: 0, losses: 0, draws: 0 }),
};