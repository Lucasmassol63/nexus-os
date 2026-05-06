import { supabase } from '../lib/supabase';
import { Athlete, DailyLog, ObjectiveItem } from '../types';

function rowToAthlete(row: any, extra?: { objectives?: any[], performance?: any[], dailyLogs?: any[], weightHistory?: any[] }): Athlete {
  return {
    id: row.id, firstName: row.first_name, lastName: row.last_name,
   code: row.code, age: row.age, type: row.type,
team_category: row.team_category,
    objectives: row.objectives ?? '',
    structuredObjectives: groupObjectives(extra?.objectives ?? []),
    gamification: {
      level: row.gami_level, currentXp: row.gami_current_xp,
      nextLevelXp: row.gami_next_level_xp, streakDays: row.gami_streak_days,
      rank: row.gami_rank, selectedSkin: row.gami_selected_skin,
      unlockedSkins: row.gami_unlocked_skins ?? ['🐣'],
      unlockedFeatures: row.gami_unlocked_features ?? [],
    },
    stats: { goals: row.goals ?? 0, fouls: row.fouls ?? 0, matchesPlayed: row.matches_played ?? 0, exclusions: row.exclusions ?? 0 },
    monitoring: {
      waterRpe: row.water_rpe ?? 0, waterAttendance: row.water_attendance ?? 0, waterHistory: [],
      dryRpe: row.dry_rpe ?? 0, dryAttendance: row.dry_attendance ?? 0, dryHistory: [],
      weight: (extra?.weightHistory ?? []).map((w: any) => ({ date: w.date, value: w.value })),
      height: row.height ?? 0,
      measurements: { chest: row.chest ?? 0, waist: row.waist ?? 0, thighs: row.thighs ?? 0, arms: row.arms ?? 0 },
    },
    nutritionHistory: [],
    performance: groupPerformance(extra?.performance ?? []),
    dailyLogs: (extra?.dailyLogs ?? []).map(rowToLog),
    lastCheckIn: extra?.dailyLogs?.[0] ? rowToLog(extra.dailyLogs[0]) : undefined,
  };
}

function rowToLog(row: any): DailyLog {
  return { date: row.date, sleep: row.sleep, fatigue: row.fatigue, soreness: row.soreness, foodQuality: row.food_quality, mood: row.mood, comment: row.comment ?? '' };
}

function groupObjectives(rows: any[]) {
  const result = { shortTerm: [] as ObjectiveItem[], mediumTerm: [] as ObjectiveItem[], longTerm: [] as ObjectiveItem[] };
  for (const row of rows) {
    const item: ObjectiveItem = { id: row.id, label: row.label, status: row.status };
    if (row.term === 'shortTerm') result.shortTerm.push(item);
    if (row.term === 'mediumTerm') result.mediumTerm.push(item);
    if (row.term === 'longTerm') result.longTerm.push(item);
  }
  return result;
}

function groupPerformance(rows: any[]) {
  const result: any = { flexibility: [], dry: [], water: [] };
  for (const row of rows) result[row.category]?.push({ subject: row.subject, A: row.value_a, B: row.value_b, fullMark: row.full_mark });
  return result;
}

export async function login(name: string, code: string): Promise<{ role: 'COACH' | 'ATHLETE', user?: Athlete }> {
  if (name.toUpperCase() === 'COACH' && code === '9999') return { role: 'COACH' };
  const { data, error } = await supabase.from('athletes').select('*').ilike('first_name', name).eq('code', code).single();
  if (error || !data) throw new Error('Identifiants invalides');
  return { role: 'ATHLETE', user: rowToAthlete(data) };
}

export async function getAthletes(): Promise<Athlete[]> {
  const [athletesRes, objectivesRes, performanceRes, logsRes, weightRes] = await Promise.all([
    supabase.from('athletes').select('*').order('last_name'),
    supabase.from('objectives').select('*'),
    supabase.from('performance_metrics').select('*'),
    supabase.from('daily_logs').select('*').order('date', { ascending: false }),
    supabase.from('weight_history').select('*').order('date'),
  ]);
  if (athletesRes.error) throw athletesRes.error;
  return (athletesRes.data ?? []).map((row: any) => rowToAthlete(row, {
    objectives: (objectivesRes.data ?? []).filter((o: any) => o.athlete_id === row.id),
    performance: (performanceRes.data ?? []).filter((p: any) => p.athlete_id === row.id),
    dailyLogs: (logsRes.data ?? []).filter((l: any) => l.athlete_id === row.id).slice(0, 30),
    weightHistory: (weightRes.data ?? []).filter((w: any) => w.athlete_id === row.id),
  }));
}

export async function saveDailyLog(athleteId: string, log: DailyLog) {
  const date = log.date.split('T')[0];
  
  // Supprimer l'entrée existante si elle existe
  await supabase.from('daily_logs')
    .delete()
    .eq('athlete_id', athleteId)
    .eq('date', date);

  // Insérer la nouvelle
  const { error } = await supabase.from('daily_logs').insert({
    athlete_id:   athleteId,
    date,
    sleep:        log.sleep,
    fatigue:      log.fatigue,
    soreness:     log.soreness,
    food_quality: log.foodQuality,
    mood:         log.mood,
    comment:      log.comment,
  });
  
  if (error) throw error;
  await supabase.rpc('increment_xp', { p_athlete_id: athleteId, p_xp: 100 });
}

export async function addObjective(athleteId: string, term: 'shortTerm' | 'mediumTerm' | 'longTerm', label: string) {
  const { error } = await supabase.from('objectives').insert({ athlete_id: athleteId, term, label, status: 'ACTIVE' });
  if (error) throw error;
}

export async function updateObjectiveStatus(objectiveId: string, status: string) {
  const { error } = await supabase.from('objectives').update({ status }).eq('id', objectiveId);
  if (error) throw error;
}

export async function deleteObjective(objectiveId: string, rewardXp: number, athleteId: string) {
  await supabase.from('objectives').delete().eq('id', objectiveId);
  await supabase.rpc('increment_xp', { p_athlete_id: athleteId, p_xp: rewardXp });
}

export async function updateSkin(athleteId: string, skin: string) {
  const { error } = await supabase.from('athletes').update({ gami_selected_skin: skin }).eq('id', athleteId);
  if (error) throw error;
}