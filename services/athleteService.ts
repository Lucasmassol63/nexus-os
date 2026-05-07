import { supabase } from '../lib/supabase';
import { Athlete, DailyLog, ObjectiveItem } from '../types';

// ─── Helpers ─────────────────────────────────────────────────

function rowToLog(row: any): DailyLog {
  return {
    date:        row.date,
    sleep:       row.sleep,
    fatigue:     row.fatigue,
    soreness:    row.soreness,
    foodQuality: row.food_quality,
    mood:        row.mood,
    comment:     row.comment ?? '',
  };
}

function groupObjectives(rows: any[]) {
  const r = { shortTerm: [] as ObjectiveItem[], mediumTerm: [] as ObjectiveItem[], longTerm: [] as ObjectiveItem[] };
  for (const row of rows) {
    const item: ObjectiveItem = { id: row.id, label: row.label, status: row.status };
    if (row.term === 'shortTerm')  r.shortTerm.push(item);
    if (row.term === 'mediumTerm') r.mediumTerm.push(item);
    if (row.term === 'longTerm')   r.longTerm.push(item);
  }
  return r;
}

function groupPerformance(rows: any[]) {
  const r: any = { flexibility: [], dry: [], water: [] };
  for (const row of rows) {
    r[row.category]?.push({ subject: row.subject, A: row.value_a, B: row.value_b, fullMark: row.full_mark });
  }
  return r;
}

function rowToAthlete(row: any, extra?: {
  objectives?: any[];
  performance?: any[];
  dailyLogs?: any[];
  weightHistory?: any[];
}): Athlete {
  return {
    id:            row.id,
    firstName:     row.first_name,
    lastName:      row.last_name,
    code:          row.code,
    age:           row.age,
    type:          row.type as 'TEAM' | 'PRIVATE',
    team_category: row.team_category,
    objectives:    row.objectives ?? '',
    structuredObjectives: groupObjectives(extra?.objectives ?? []),
    gamification: {
      level:            row.gami_level,
      currentXp:        row.gami_current_xp,
      nextLevelXp:      row.gami_next_level_xp,
      streakDays:       row.gami_streak_days,
      rank:             row.gami_rank,
      selectedSkin:     row.gami_selected_skin,
      unlockedSkins:    row.gami_unlocked_skins ?? ['🐣'],
      unlockedFeatures: row.gami_unlocked_features ?? [],
    },
    stats: {
      goals:         row.goals ?? 0,
      fouls:         row.fouls ?? 0,
      matchesPlayed: row.matches_played ?? 0,
      exclusions:    row.exclusions ?? 0,
    },
    monitoring: {
      waterRpe:        row.water_rpe ?? 0,
      waterAttendance: row.water_attendance ?? 0,
      waterHistory:    [],
      dryRpe:          row.dry_rpe ?? 0,
      dryAttendance:   row.dry_attendance ?? 0,
      dryHistory:      [],
      weight:          (extra?.weightHistory ?? []).map((w: any) => ({ date: w.date, value: w.value })),
      height:          row.height ?? 0,
      measurements: {
        chest:  row.chest  ?? 0,
        waist:  row.waist  ?? 0,
        thighs: row.thighs ?? 0,
        arms:   row.arms   ?? 0,
      },
    },
    nutritionHistory: [],
    performance:      groupPerformance(extra?.performance ?? []),
    dailyLogs:        (extra?.dailyLogs ?? []).map(rowToLog),
    lastCheckIn:      extra?.dailyLogs?.[0] ? rowToLog(extra.dailyLogs[0]) : undefined,
  };
}

// ─── Auth ─────────────────────────────────────────────────────

export async function login(name: string, code: string): Promise<{ role: 'COACH' | 'ATHLETE'; user?: Athlete }> {
  if (name.toUpperCase() === 'COACH' && code === '9999') return { role: 'COACH' };

  const nameTrimmed = name.trim();

  let { data, error } = await supabase
    .from('athletes').select('*')
    .ilike('first_name', nameTrimmed)
    .eq('code', code.trim())
    .maybeSingle();

  if (!data && nameTrimmed.includes(' ')) {
    const parts = nameTrimmed.split(' ');
    const res = await supabase.from('athletes').select('*')
      .ilike('first_name', parts[0])
      .ilike('last_name', parts.slice(1).join(' '))
      .eq('code', code.trim())
      .maybeSingle();
    data = res.data; error = res.error;
  }

  if (error) throw new Error(`Erreur: ${error.message}`);
  if (!data) throw new Error('Identifiants invalides');
  return { role: 'ATHLETE', user: rowToAthlete(data) };
}

// ─── Athletes ─────────────────────────────────────────────────

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
    objectives:    (objectivesRes.data ?? []).filter((o: any) => o.athlete_id === row.id),
    performance:   (performanceRes.data ?? []).filter((p: any) => p.athlete_id === row.id),
    dailyLogs:     (logsRes.data ?? []).filter((l: any) => l.athlete_id === row.id).slice(0, 30),
    weightHistory: (weightRes.data ?? []).filter((w: any) => w.athlete_id === row.id),
  }));
}

// ─── Daily Log ────────────────────────────────────────────────

export async function saveDailyLog(athleteId: string, log: DailyLog) {
  const date = log.date.split('T')[0];

  await supabase.from('daily_logs').delete().eq('athlete_id', athleteId).eq('date', date);

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

// ─── Objectives ───────────────────────────────────────────────

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

export async function requestObjectiveValidation(athleteId: string, _type: string, id: string) {
  await updateObjectiveStatus(id, 'PENDING_VALIDATION');
}

export async function claimObjectiveReward(athleteId: string, _type: string, id: string): Promise<number> {
  const xp = 250;
  await deleteObjective(id, xp, athleteId);
  return xp;
}

// ─── Skin ─────────────────────────────────────────────────────

export async function updateSkin(athleteId: string, skin: string) {
  const { error } = await supabase.from('athletes').update({ gami_selected_skin: skin }).eq('id', athleteId);
  if (error) throw error;
}

// ─── Messages ─────────────────────────────────────────────────

export async function sendMessage(athleteId: string, subject: string, body: string) {
  const { error } = await supabase.from('messages').insert({ athlete_id: athleteId, subject, body });
  if (error) throw error;
}