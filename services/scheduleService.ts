import { supabase } from '../lib/supabase';
import { DaySchedule, ScheduleEvent, Match, WorkoutSession, Appointment, TeamStats, EventType } from '../types';

// ─── PLANNING SEMAINE ────────────────────────────────────────

export async function getWeeklySchedule(startDateStr: string): Promise<DaySchedule[]> {
  const end = new Date(startDateStr);
  end.setDate(end.getDate() + 6);
  const { data, error } = await supabase
    .from('schedule_events').select('*')
    .gte('date', startDateStr)
    .lte('date', end.toISOString().split('T')[0])
    .order('start_time');
  if (error) throw error;
  const weekDays = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
  const start = new Date(startDateStr);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    return {
      dayName: weekDays[i], date: dateStr,
      events: (data ?? []).filter((e: any) => e.date === dateStr).map((e: any) => ({
        id: e.id, type: e.type, startTime: e.start_time, endTime: e.end_time,
        title: e.title, description: e.description ?? '', intensity: e.intensity ?? 5,
        isVisibleToAthletes: e.is_visible_to_athletes ?? true,
      })),
    };
  });
}

export async function getAthleteWeeklySchedule(startDateStr: string, athleteId: string): Promise<DaySchedule[]> {
  const end = new Date(startDateStr); end.setDate(end.getDate() + 6);
  const { data: events, error } = await supabase.from('schedule_events').select('*')
    .gte('date', startDateStr).lte('date', end.toISOString().split('T')[0])
    .eq('is_visible_to_athletes', true).order('start_time');
  if (error) throw error;
  const eventIds = (events ?? []).map((e: any) => e.id);
  let assignedEventIds = new Set<string>();
  let eventsWithAssignments = new Set<string>();
  if (eventIds.length > 0) {
    const [myA, allA] = await Promise.all([
      supabase.from('event_athletes').select('event_id').eq('athlete_id', athleteId).in('event_id', eventIds),
      supabase.from('event_athletes').select('event_id').in('event_id', eventIds),
    ]);
    (myA.data ?? []).forEach((r: any) => assignedEventIds.add(r.event_id));
    (allA.data ?? []).forEach((r: any) => eventsWithAssignments.add(r.event_id));
  }
  const filtered = (events ?? []).filter((e: any) =>
    !eventsWithAssignments.has(e.id) || assignedEventIds.has(e.id)
  );
  const weekDays = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
  const start = new Date(startDateStr);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    return {
      dayName: weekDays[i], date: dateStr,
      events: filtered.filter((e: any) => e.date === dateStr).map((e: any) => ({
        id: e.id, type: e.type as EventType, startTime: e.start_time, endTime: e.end_time,
        title: e.title, description: e.description ?? '', intensity: e.intensity ?? 5,
        isVisibleToAthletes: true,
      })),
    };
  });
}

export async function addEvent(date: string, event: Omit<ScheduleEvent, 'id'>): Promise<string> {
  const { data, error } = await supabase.from('schedule_events').insert({
    date, type: event.type, start_time: event.startTime, end_time: event.endTime,
    title: event.title, description: event.description ?? '',
    intensity: event.intensity ?? 5, is_visible_to_athletes: event.isVisibleToAthletes,
  }).select().single();
  if (error) throw error;
  return data.id;
}

export async function deleteEvent(eventId: string) {
  await supabase.from('schedule_events').delete().eq('id', eventId);
}

export async function updateWeeklySchedule(schedule: DaySchedule[]) {
  if (!schedule.length) return;
  await supabase.from('schedule_events').delete()
    .gte('date', schedule[0].date).lte('date', schedule[schedule.length - 1].date);
  const rows = schedule.flatMap(day => day.events.map(e => ({
    date: day.date, type: e.type, start_time: e.startTime, end_time: e.endTime,
    title: e.title, description: e.description ?? '', intensity: e.intensity ?? 5,
    is_visible_to_athletes: e.isVisibleToAthletes,
  })));
  if (rows.length > 0) await supabase.from('schedule_events').insert(rows);
}

// ─── EVENT ATHLETES ───────────────────────────────────────────

export async function getWeekEventAthletes(startDateStr: string): Promise<Record<string, string[]>> {
  const end = new Date(startDateStr); end.setDate(end.getDate() + 6);
  const { data: events } = await supabase.from('schedule_events').select('id')
    .gte('date', startDateStr).lte('date', end.toISOString().split('T')[0]);
  const eventIds = (events ?? []).map((e: any) => e.id);
  if (eventIds.length === 0) return {};
  const { data } = await supabase.from('event_athletes').select('event_id, athlete_id').in('event_id', eventIds);
  const result: Record<string, string[]> = {};
  (data ?? []).forEach((r: any) => {
    if (!result[r.event_id]) result[r.event_id] = [];
    result[r.event_id].push(r.athlete_id);
  });
  return result;
}

export async function setEventAthletes(eventId: string, athleteIds: string[]) {
  await supabase.from('event_athletes').delete().eq('event_id', eventId);
  if (athleteIds.length > 0) {
    await supabase.from('event_athletes').insert(athleteIds.map(athlete_id => ({ event_id: eventId, athlete_id })));
  }
}

// ─── SÉANCES ─────────────────────────────────────────────────

export async function getAthleteSessions(athleteId: string): Promise<WorkoutSession[]> {
  const { data, error } = await supabase.from('workout_sessions').select('*')
    .eq('athlete_id', athleteId).order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id, date: row.date, title: row.title, type: row.type,
    contentJson: row.content_json, completed: row.completed, actualRpe: row.actual_rpe,
  }));
}

export async function assignWorkout(athleteId: string, workout: Omit<WorkoutSession, 'id' | 'completed'>) {
  const { data, error } = await supabase.from('workout_sessions').insert({
    athlete_id: athleteId, date: workout.date, title: workout.title,
    type: workout.type, content_json: workout.contentJson, completed: false,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function completeSession(sessionId: string, rpe: number) {
  await supabase.from('workout_sessions').update({ completed: true, actual_rpe: rpe }).eq('id', sessionId);
}

// ─── PRÉSENCES ────────────────────────────────────────────────

export async function submitAttendance(type: 'WATER' | 'DRY', data: Record<string, string>) {
  const today = new Date().toISOString().split('T')[0];
  const rows = Object.entries(data).map(([athlete_id, attendance]) => ({
    athlete_id, date: today, category: type,
    session_type: type === 'WATER' ? 'WATER-POLO' : 'MUSCU',
    rpe: 0, duration: 0, load: 0, attendance,
  }));
  const { error } = await supabase.from('monitoring_history').upsert(rows, { onConflict: 'athlete_id,date,category' });
  if (error) throw error;
}

export async function addSessionLog(athleteId: string, date: string, type: string, duration: number, rpe: number) {
  const isWater = ['WATER-POLO', 'MATCH'].includes(type);
  await supabase.from('monitoring_history').upsert({
    athlete_id: athleteId, date, category: isWater ? 'WATER' : 'DRY',
    session_type: type, rpe, duration, load: rpe * duration, attendance: 'PRESENT',
  }, { onConflict: 'athlete_id,date,category' });
}

// ─── MATCHS ───────────────────────────────────────────────────

export async function getNextMatch(): Promise<Match | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('matches').select('*').gte('date', today).order('date').limit(1).single();
  if (error) return null;
  return { id: data.id, opponent: data.opponent, date: data.date, time: data.time, isHome: data.is_home, location: data.location };
}

export async function getAllMatches(): Promise<Match[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase.from('matches').select('*').gte('date', today).order('date');
  return (data ?? []).map((m: any) => ({ id: m.id, opponent: m.opponent, date: m.date, time: m.time, isHome: m.is_home, location: m.location }));
}

export async function createMatch(match: Omit<Match, 'id'>) {
  const { error } = await supabase.from('matches').insert({ opponent: match.opponent, date: match.date, time: match.time, is_home: match.isHome, location: match.location });
  if (error) throw error;
}

export async function updateMatch(id: string, match: Partial<Omit<Match, 'id'>>) {
  const { error } = await supabase.from('matches').update({ opponent: match.opponent, date: match.date, time: match.time, is_home: match.isHome, location: match.location }).eq('id', id);
  if (error) throw error;
}

export async function deleteMatch(id: string) {
  await supabase.from('matches').delete().eq('id', id);
}

export async function getTeamStats(): Promise<TeamStats> {
  const { data } = await supabase.from('team_stats').select('*').single();
  return data ? { gamesPlayed: data.games_played, wins: data.wins, losses: data.losses, draws: data.draws } : { gamesPlayed: 0, wins: 0, losses: 0, draws: 0 };
}

// ─── RENDEZ-VOUS ──────────────────────────────────────────────

function rowToAppointment(row: any): Appointment {
  return {
    id: row.id, date: row.date, time: row.time, coachName: row.coach_name,
    isBooked: row.is_booked, bookedBy: row.booked_by ?? undefined,
    reason: row.reason ?? '', status: row.status ?? 'AVAILABLE',
  };
}

/** Tous les RDV — pour le coach */
export async function getAllAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase.from('appointments').select('*').order('date').order('time');
  if (error) throw error;
  return (data ?? []).map(rowToAppointment);
}

/** RDV futurs — pour le joueur */
export async function getAppointments(): Promise<Appointment[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('appointments').select('*').gte('date', today).order('date').order('time');
  if (error) throw error;
  return (data ?? []).map(rowToAppointment);
}

/** Nombre de RDV en attente (badge notification coach) */
export async function getPendingAppointmentsCount(): Promise<number> {
  const { count } = await supabase.from('appointments')
    .select('*', { count: 'exact', head: true }).eq('status', 'PENDING_VALIDATION');
  return count ?? 0;
}

/** Créer un créneau (coach) */
export async function addAppointment(apt: { date: string; time: string; coachName: string }) {
  const { error } = await supabase.from('appointments').insert({
    date: apt.date, time: apt.time, coach_name: apt.coachName, is_booked: false, status: 'AVAILABLE',
  });
  if (error) throw error;
}

/** Supprimer un créneau (coach) */
export async function deleteAppointment(id: string) {
  await supabase.from('appointments').delete().eq('id', id);
}

/** Réserver un RDV (joueur) → PENDING_VALIDATION */
export async function bookAppointment(appointmentId: string, athleteId: string, reason: string) {
  const { error } = await supabase.from('appointments').update({
    is_booked: true, booked_by: athleteId, reason, status: 'PENDING_VALIDATION',
  }).eq('id', appointmentId).eq('status', 'AVAILABLE');
  if (error) throw error;
}

/** Annuler réservation */
export async function cancelAppointment(appointmentId: string) {
  const { error } = await supabase.from('appointments').update({
    is_booked: false, booked_by: null, reason: '', status: 'AVAILABLE',
  }).eq('id', appointmentId);
  if (error) throw error;
}

/** Confirmer un RDV (coach) → CONFIRMED + crée l'event dans les deux plannings */
export async function confirmAppointment(appointmentId: string) {
  const { data: apt, error: fetchErr } = await supabase.from('appointments').select('*').eq('id', appointmentId).single();
  if (fetchErr || !apt) throw new Error('RDV introuvable');

  await supabase.from('appointments').update({ status: 'CONFIRMED' }).eq('id', appointmentId);

  // Crée l'événement dans le planning
  const startH = parseInt(apt.time.split(':')[0]);
  const endTime = `${(startH + 1).toString().padStart(2,'0')}:${apt.time.split(':')[1]}`;
  const { data: eventData } = await supabase.from('schedule_events').insert({
    date: apt.date, type: 'ENTRETIEN',
    start_time: apt.time, end_time: endTime,
    title: `RDV — ${apt.coach_name}`,
    description: apt.reason ?? '',
    intensity: 1, is_visible_to_athletes: true,
  }).select().single();

  // Assigne l'événement à l'athlète
  if (apt.booked_by && eventData) {
    await supabase.from('event_athletes').insert({ event_id: eventData.id, athlete_id: apt.booked_by });
  }
}

/** Refuser un RDV (coach) → remet disponible */
export async function declineAppointment(appointmentId: string) {
  const { error } = await supabase.from('appointments').update({
    is_booked: false, booked_by: null, reason: '', status: 'AVAILABLE',
  }).eq('id', appointmentId);
  if (error) throw error;
}

// ─── MESSAGES ─────────────────────────────────────────────────

export async function sendMessage(athleteId: string, subject: string, body: string) {
  const { error } = await supabase.from('messages').insert({ athlete_id: athleteId, subject, body });
  if (error) throw error;
}