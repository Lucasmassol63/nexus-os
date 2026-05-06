import { supabase } from '../lib/supabase';
import { DaySchedule, ScheduleEvent, Match, WorkoutSession, Appointment, TeamStats } from '../types';

export async function getWeeklySchedule(startDateStr: string): Promise<DaySchedule[]> {
  const end = new Date(startDateStr);
  end.setDate(end.getDate() + 6);
  const { data, error } = await supabase.from('schedule_events').select('*')
    .gte('date', startDateStr).lte('date', end.toISOString().split('T')[0]).order('start_time');
  if (error) throw error;
  const weekDays = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
  const start = new Date(startDateStr);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
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
  const { error } = await supabase.from('workout_sessions')
    .update({ completed: true, actual_rpe: rpe }).eq('id', sessionId);
  if (error) throw error;
}

export async function submitAttendance(type: 'WATER' | 'DRY', data: Record<string, string>) {
  const today = new Date().toISOString().split('T')[0];
  const rows = Object.entries(data).map(([athlete_id, attendance]) => ({
    athlete_id, date: today, category: type,
    session_type: type === 'WATER' ? 'WATER-POLO' : 'MUSCU',
    rpe: 0, duration: 0, load: 0, attendance,
  }));
  const { error } = await supabase.from('monitoring_history')
    .upsert(rows, { onConflict: 'athlete_id,date,category' });
  if (error) throw error;
}

export async function addSessionLog(athleteId: string, date: string, type: string, duration: number, rpe: number) {
  const isWater = ['WATER-POLO', 'MATCH'].includes(type);
  const { error } = await supabase.from('monitoring_history').upsert({
    athlete_id: athleteId, date, category: isWater ? 'WATER' : 'DRY',
    session_type: type, rpe, duration, load: rpe * duration, attendance: 'PRESENT',
  }, { onConflict: 'athlete_id,date,category' });
  if (error) throw error;
}

export async function getNextMatch(): Promise<Match | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('matches').select('*')
    .gte('date', today).order('date').limit(1).single();
  if (error) return null;
  return { id: data.id, opponent: data.opponent, date: data.date, time: data.time, isHome: data.is_home, location: data.location };
}

export async function getTeamStats(): Promise<TeamStats> {
  const { data } = await supabase.from('team_stats').select('*').single();
  return data ? { gamesPlayed: data.games_played, wins: data.wins, losses: data.losses, draws: data.draws }
    : { gamesPlayed: 0, wins: 0, losses: 0, draws: 0 };
}

export async function getAppointments(): Promise<Appointment[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('appointments').select('*')
    .gte('date', today).order('date').order('time');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id, date: row.date, time: row.time, coachName: row.coach_name,
    isBooked: row.is_booked, bookedBy: row.booked_by ?? undefined, reason: row.reason ?? '',
  }));
}

export async function bookAppointment(appointmentId: string, athleteId: string, reason: string) {
  const { error } = await supabase.from('appointments')
    .update({ is_booked: true, booked_by: athleteId, reason })
    .eq('id', appointmentId).eq('is_booked', false);
  if (error) throw error;
}

export async function sendMessage(athleteId: string, subject: string, body: string) {
  const { error } = await supabase.from('messages').insert({ athlete_id: athleteId, subject, body });
  if (error) throw error;
}