import { useState, useEffect, useCallback } from 'react';
import { Athlete } from '../types';
import { getAthletes } from '../services/athleteService';
import { supabase } from '../lib/supabase';

export function useAthletes() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setAthletes(await getAthletes()); }
    catch (err: any) { setError(err.message ?? 'Erreur'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const channel = supabase.channel('athletes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'athletes' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return { athletes, loading, error, refresh: load };
}