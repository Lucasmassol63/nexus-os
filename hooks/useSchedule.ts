import { useState, useEffect, useCallback } from 'react';
import { DaySchedule } from '../types';
import { getWeeklySchedule, updateWeeklySchedule } from '../services/scheduleService';
import { supabase } from '../lib/supabase';

function getCurrentMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(today.setDate(diff)).toISOString().split('T')[0];
}

export function useSchedule() {
  const [weekStart, setWeekStart] = useState(getCurrentMonday());
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setSchedule(await getWeeklySchedule(weekStart)); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [weekStart]);

  useEffect(() => {
    load();
    const channel = supabase.channel('schedule-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_events' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return { schedule, loading, error, saveSchedule: async (s: DaySchedule[]) => { await updateWeeklySchedule(s); setSchedule(s); }, goToWeek: setWeekStart };
}