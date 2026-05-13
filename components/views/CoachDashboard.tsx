import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { Athlete, Exercise, Match, DaySchedule, AttendanceStatus, ScheduleEvent, EventType } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { DataView } from './DataView';
import { PlanningView } from './PlanningView';

interface CoachDashboardProps {
  onLogout: () => void;
}

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
};

const WATER_THEMES = ['Speed', 'Hit', 'CA 0/CA 1', 'CA 2/CA 3', 'Technical individual', 'Shoot', 'Duel', 'Point defense', 'Pass', 'Leg', 'Tactical', 'Zone/Pressing', 'Z+/Z-', 'Counter-attack', 'Match'];
const MUSCU_THEMES = ['Mobility', 'Prevention', 'Gainage', 'Hypertrophy', 'Strength', 'Force', 'Cardio crossfit'];

const ALERT_KEYWORDS = [
  'mal', 'douleur', 'douleurs', 'aïe', 'aie', 'ouille', 'ouïe',
  'fatigue', 'fatigué', 'blessure', 'blessé', 'bobo', 'tendinite',
  'crampe', 'entorse', 'claquage', 'chute', 'choc', 'genou',
  'épaule', 'dos', 'hurt', 'pain', 'ache', 'injury', 'sore',
];

export const CoachDashboard: React.FC<CoachDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'ATTENDANCE' | 'PLANNING' | 'OBJECTIVES' | 'PROGRAMMING' | 'DATA'>('HOME');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));

  // UI States
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [viewingAthleteDetail, setViewingAthleteDetail] = useState<Athlete | null>(null);
  const [viewingStatsDetail, setViewingStatsDetail] = useState<'WATER' | 'DRY' | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceSessionType, setAttendanceSessionType] = useState<EventType | null>(null);
  const [attendanceSession, setAttendanceSession] = useState<Record<string, 'PRESENT' | 'INJURED' | 'ABSENT_JUSTIFIED' | 'ABSENT_UNJUSTIFIED'>>({});

  // Planning State
  const [planningDayIndex, setPlanningDayIndex] = useState(0);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({ type: 'WATER-POLO', startTime: '18:00', endTime: '19:30', title: '', description: '', isVisibleToAthletes: true, intensity: 5 });

  // ─── DATA LOAD ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const data = await db.getAthletes();
      const match = await db.getNextMatch();
      setAthletes(data);
      setNextMatch(match);
    };
    load();
  }, []);

  useEffect(() => {
    const loadSchedule = async () => {
      const offset = currentWeekStart.getTimezoneOffset();
      const adjusted = new Date(currentWeekStart.getTime() - offset * 60 * 1000);
      const dateStr = adjusted.toISOString().split('T')[0];
      const schedule = await db.getWeeklySchedule(dateStr);
      setWeeklySchedule(schedule);
    };
    loadSchedule();
  }, [currentWeekStart]);

  // ─── HELPERS ─────────────────────────────────────────────────────────────────
  const handlePrevWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d); };
  const handleNextWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d); };

  const getDaysBeforeMatch = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24));

  const getWeeklyAvgRpe = (athlete: Athlete, type: 'WATER' | 'DRY' | 'BOTH' = 'BOTH') => {
    let sum = 0, count = 0;
    if (type === 'WATER' || type === 'BOTH') athlete.monitoring.waterHistory.slice(-7).forEach(d => { if (d.rpe > 0) { sum += d.rpe; count++; } });
    if (type === 'DRY'   || type === 'BOTH') athlete.monitoring.dryHistory.slice(-7).forEach(d =>   { if (d.rpe > 0) { sum += d.rpe; count++; } });
    return count === 0 ? 0 : Math.round((sum / count) * 10) / 10;
  };

  const getWeeklyAttendance = (type: 'WATER' | 'DRY') => {
    let total = 0, present = 0;
    athletes.forEach(a => {
      const hist = type === 'WATER' ? a.monitoring.waterHistory : a.monitoring.dryHistory;
      hist.slice(-7).forEach(d => { total++; if (d.attendance === 'PRESENT') present++; });
    });
    return total === 0 ? 0 : Math.round((present / total) * 100);
  };

  const getAthleteAttendancePct = (a: Athlete, type: 'WATER' | 'DRY') => {
    const hist = type === 'WATER' ? a.monitoring.waterHistory : a.monitoring.dryHistory;
    if (hist.length === 0) return 0;
    return Math.round((hist.filter(h => h.attendance === 'PRESENT').length / hist.length) * 100);
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':              return { label: 'Présent', color: 'text-green-500',  bg: 'bg-green-500/20'  };
      case 'INJURED':              return { label: 'Blessé',  color: 'text-orange-500', bg: 'bg-orange-500/20' };
      case 'ABSENT_JUSTIFIED':     return { label: 'Excusé',  color: 'text-blue-400',   bg: 'bg-blue-400/20'   };
      case 'ABSENT_UNJUSTIFIED':   return { label: 'Absent',  color: 'text-red-500',    bg: 'bg-red-500/20'    };
      default: return { label: '-', color: 'text-gray-500', bg: 'bg-gray-500/10' };
    }
  };

  const getEventTypeColor = (type: EventType) => {
    switch (type) {
      case 'WATER-POLO': return 'bg-blue-600 border-blue-500/50';
      case 'MUSCU':      return 'bg-nexus-red border-nexus-red/50';
      case 'MATCH':      return 'bg-nexus-gold text-black border-nexus-gold';
      case 'KINE':       return 'bg-green-600 border-green-500/50';
      case 'MENTAL':     return 'bg-purple-600 border-purple-500/50';
      case 'VIDEO':      return 'bg-indigo-500 border-indigo-400/50';
      case 'MEETING':    return 'bg-gray-600 border-gray-500/50';
      case 'ENTRETIEN':  return 'bg-orange-500 border-orange-400/50';
      case 'SLOT_LIBRE': return 'bg-white/10 border-white/20 text-nexus-gray';
      default:           return 'bg-gray-700';
    }
  };

  const getTeamSessionStats = (type: 'WATER' | 'DRY') => {
    const allDates = new Set<string>();
    athletes.forEach(a => {
      const hist = type === 'WATER' ? a.monitoring.waterHistory : a.monitoring.dryHistory;
      hist.forEach(h => allDates.add(h.date));
    });
    return Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => {
      let presentCount = 0, rpeSum = 0, rpeCount = 0;
      const details: { name: string; status: AttendanceStatus; rpe: number }[] = [];
      athletes.forEach(a => {
        const hist = type === 'WATER' ? a.monitoring.waterHistory : a.monitoring.dryHistory;
        const entry = hist.find(h => h.date === date);
        if (entry) {
          if (entry.attendance === 'PRESENT') presentCount++;
          if (entry.rpe > 0) { rpeSum += entry.rpe; rpeCount++; }
          details.push({ name: `${a.firstName} ${a.lastName}`, status: entry.attendance, rpe: entry.rpe });
        }
      });
      return {
        date,
        attendancePct: athletes.length > 0 ? Math.round((presentCount / athletes.length) * 100) : 0,
        avgRpe: rpeCount > 0 ? (rpeSum / rpeCount).toFixed(1) : '-',
        details,
      };
    });
  };

  // ─── ALERTS (enhanced) ───────────────────────────────────────────────────────
  const getAlerts = () => {
    const alerts: { athlete: Athlete; reason: string; severity: 'HIGH' | 'MEDIUM' }[] = [];
    athletes.forEach(ath => {
      const allHistory = [...ath.monitoring.waterHistory, ...ath.monitoring.dryHistory]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const recentRpes = allHistory.slice(0, 4).map(d => d.rpe).filter(r => r > 0);
      const avgLast4 = recentRpes.length ? recentRpes.reduce((a, b) => a + b, 0) / recentRpes.length : 0;

      if (recentRpes.slice(0, 2).some(r => r >= 10))
        alerts.push({ athlete: ath, reason: 'RPE 10 — charge maximale récente', severity: 'HIGH' });
      else if (avgLast4 >= 8.5)
        alerts.push({ athlete: ath, reason: `RPE moyen ${avgLast4.toFixed(1)} sur 4 séances`, severity: 'MEDIUM' });

      if (allHistory.some(d => d.attendance === 'INJURED') &&
          !alerts.find(al => al.athlete.id === ath.id && al.reason.includes('Blessé')))
        alerts.push({ athlete: ath, reason: 'Blessé (historique présence)', severity: 'HIGH' });

      const comment = ath.lastCheckIn?.comment?.toLowerCase() || '';
      const foundKw = ALERT_KEYWORDS.find(kw => comment.includes(kw));
      if (foundKw)
        alerts.push({ athlete: ath, reason: `Mot-clé détecté : "${foundKw}"`, severity: 'HIGH' });

      const lc = ath.lastCheckIn;
      if (lc && (lc.sleep <= 2 || lc.foodQuality <= 2))
        alerts.push({ athlete: ath, reason: `Lifestyle critique (sommeil ${lc.sleep}/10, nutri ${lc.foodQuality}/10)`, severity: 'MEDIUM' });

      const last3 = allHistory.slice(0, 3);
      if (last3.length === 3 && last3.every(d => d.attendance === 'ABSENT_UNJUSTIFIED'))
        alerts.push({ athlete: ath, reason: '3 absences injustifiées consécutives', severity: 'MEDIUM' });
    });
    return alerts;
  };

  const alerts = getAlerts();
  const availablePlayers = athletes.filter(a => !a.monitoring.waterHistory.some(d => d.attendance === 'INJURED'));

  // ─── ACTIONS ─────────────────────────────────────────────────────────────────
  const handleAttendanceChange = (athleteId: string, status: 'PRESENT' | 'INJURED' | 'ABSENT_JUSTIFIED' | 'ABSENT_UNJUSTIFIED') => {
    setAttendanceSession(prev => ({ ...prev, [athleteId]: status }));
  };

  const submitAttendance = async () => {
    if (attendanceSessionType === 'WATER-POLO' || attendanceSessionType === 'MUSCU') {
      const dbType = attendanceSessionType === 'WATER-POLO' ? 'WATER' : 'DRY';
      await db.submitAttendance(dbType, attendanceSession);
      alert('Appel validé !');
      setAttendanceSession({});
    } else {
      alert('Prise de présence uniquement disponible pour Water-Polo et Muscu pour le moment.');
    }
  };

  const updateSchedule = async () => {
    await db.updateWeeklySchedule(weeklySchedule);
    alert('Semainier mis à jour !');
  };

  const handleAddEvent = () => {
    const event: ScheduleEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type: newEvent.type as EventType,
      startTime: newEvent.startTime || '18:00',
      endTime: newEvent.endTime || '19:00',
      title: newEvent.title || 'Nouvelle Session',
      description: newEvent.description || '',
      intensity: newEvent.intensity || 5,
      isVisibleToAthletes: newEvent.isVisibleToAthletes !== undefined ? newEvent.isVisibleToAthletes : true,
    };
    const updated = [...weeklySchedule];
    updated[planningDayIndex].events.push(event);
    updated[planningDayIndex].events.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setWeeklySchedule(updated);
    setShowAddEventModal(false);
    setNewEvent({ type: 'WATER-POLO', startTime: '18:00', endTime: '19:30', title: '', description: '', isVisibleToAthletes: true, intensity: 5 });
  };

  const handleDeleteEvent = (eventId: string) => {
    const updated = [...weeklySchedule];
    updated[planningDayIndex].events = updated[planningDayIndex].events.filter(e => e.id !== eventId);
    setWeeklySchedule(updated);
  };

  const handleValidateObjective = async (athleteId: string, type: 'shortTerm' | 'mediumTerm' | 'longTerm', objId: string, approved: boolean) => {
    await db.approveObjective(athleteId, type, objId, approved);
    setAthletes(await db.getAthletes());
  };

  const handleAddObjective = async (athleteId: string) => {
    const typeInput = prompt("Type d'objectif ? (1: Court Terme, 2: Moyen Terme, 3: Long Terme)", '1');
    if (!typeInput) return;
    let type: 'shortTerm' | 'mediumTerm' | 'longTerm' = 'shortTerm';
    if (typeInput === '2') type = 'mediumTerm';
    if (typeInput === '3') type = 'longTerm';
    const label = prompt('Nouvel objectif :');
    if (label) { await db.addObjective(athleteId, type, label); setAthletes(await db.getAthletes()); }
  };

  const getSessionsForDate = (date: string) => weeklySchedule.find(d => d.date === date)?.events ?? [];

  const WeekNavigator = () => (
    <div className="flex items-center bg-[#0f172a] border border-white/10 rounded-lg px-2 py-1 ml-auto">
      <button onClick={handlePrevWeek} className="p-2 text-nexus-gray hover:text-white">←</button>
      <div className="flex flex-col items-center px-2">
        <span className="text-[8px] text-nexus-gray uppercase font-bold tracking-wider">Semaine du</span>
        <span className="text-xs font-bold text-white">{formatDateShort(currentWeekStart.toISOString())}</span>
      </div>
      <button onClick={handleNextWeek} className="p-2 text-nexus-gray hover:text-white">→</button>
    </div>
  );

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="pb-24 relative min-h-screen">
      <header className="px-6 pt-10 pb-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent sticky top-0 z-20 backdrop-blur-sm">
        <div>
          <h2 className="font-display text-3xl font-bold text-white tracking-wider">NEXUS <span className="text-nexus-gold">ADMIN</span></h2>
          <p className="text-[10px] text-nexus-gray tracking-[0.2em] uppercase mt-1">Interface Coaching</p>
        </div>
        <div
          onClick={onLogout}
          className="w-10 h-10 rounded-full bg-nexus-gold/10 flex items-center justify-center border border-nexus-gold/30 text-nexus-gold font-display font-bold cursor-pointer hover:bg-red-500 hover:text-white transition-colors"
        >HC</div>
      </header>

      {/* ── TAB 1: ACCUEIL ── */}
      {activeTab === 'HOME' && (
        <div className="px-6 space-y-8 animate-in fade-in">

          {/* Effectif disponible */}
          <GlassCard onClick={() => setShowSquadModal(true)}
            className="p-6 flex flex-col items-center justify-center border-l-4 border-l-green-500 cursor-pointer hover:bg-white/5 active:scale-95 transition-all">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-display text-green-500">{availablePlayers.length}</span>
              <span className="text-2xl font-display text-nexus-gray">/ {athletes.length}</span>
            </div>
            <span className="text-xs uppercase text-nexus-gray tracking-[0.2em] mt-2 font-bold">Joueurs Disponibles</span>
            <span className="text-[10px] text-nexus-gold mt-1 animate-pulse">● Voir liste détaillée</span>
          </GlassCard>

          {/* Prochain match */}
          {nextMatch && (
            <GlassCard className="p-0 overflow-hidden border-nexus-gold/30">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-black/80 z-0" />
              <div className="relative z-10 p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-nexus-gray text-[10px] font-bold uppercase tracking-widest mb-1">PROCHAIN MATCH</p>
                    <h3 className="font-display text-3xl text-white uppercase italic leading-none">VS {nextMatch.opponent}</h3>
                  </div>
                  <span className="font-display text-4xl text-nexus-gold drop-shadow-[0_0_10px_rgba(255,161,77,0.5)]">
                    J-{getDaysBeforeMatch(nextMatch.date)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <span className="text-nexus-gray">{new Date(nextMatch.date).toLocaleDateString()}</span>
                    <span className="text-nexus-red">•</span>
                    <span>{nextMatch.time}</span>
                  </div>
                  <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${nextMatch.isHome ? 'bg-white/10 text-white' : 'bg-nexus-red/20 text-nexus-red'}`}>
                    {nextMatch.isHome ? 'DOMICILE' : 'EXTÉRIEUR'}
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* ALERTES (toujours affiché) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3 pl-1 flex items-center gap-2 text-nexus-gray">
              <span>🔔</span> Alertes Joueurs
              {alerts.length > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{alerts.length}</span>
              )}
            </h3>
            {alerts.length === 0 ? (
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-center">
                <span className="text-green-400 text-xs font-bold uppercase">✅ Aucune alerte — tout le monde est dans le vert</span>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((al, idx) => (
                  <div
                    key={idx}
                    onClick={() => setViewingAthleteDetail(al.athlete)}
                    className={`p-3 rounded-xl flex justify-between items-center cursor-pointer transition-all border ${
                      al.severity === 'HIGH'
                        ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                        : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                  >
                    <div>
                      <span className="text-white font-bold text-sm block">
                        {al.severity === 'HIGH' ? '🔴' : '🟡'} {al.athlete.firstName} {al.athlete.lastName}
                      </span>
                      <span className="text-[10px] text-gray-400">{al.reason}</span>
                    </div>
                    <span className="text-[9px] text-nexus-gray ml-2 flex-shrink-0">→ Voir fiche</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aperçu semaine */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs text-nexus-gray font-bold uppercase tracking-widest pl-1">Aperçu Semaine (08h–22h)</h3>
              <WeekNavigator />
            </div>
            <div className="overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
              <div className="min-w-[600px] grid grid-cols-8 gap-1 text-[10px]">
                <div className="text-nexus-gray font-bold text-center py-2">H</div>
                {weeklySchedule.map((d, i) => (
                  <div key={i} className="text-nexus-gray font-bold text-center py-2 bg-white/5 rounded-t-lg flex flex-col">
                    <span>{d.dayName}</span>
                    <span className="text-[8px] text-nexus-gray/70">{formatDateShort(d.date)}</span>
                  </div>
                ))}
                {['08', '10', '12', '14', '16', '18', '20', '22'].map(hour => (
                  <React.Fragment key={hour}>
                    <div className="text-nexus-gray text-center py-2 border-b border-white/5">{hour}h</div>
                    {weeklySchedule.map((day, dIdx) => {
                      const relevant = day.events.filter(e => {
                        const h = parseInt(e.startTime.split(':')[0]);
                        return h >= parseInt(hour) && h < parseInt(hour) + 2;
                      });
                      return (
                        <div key={dIdx} className="border border-white/5 bg-transparent min-h-[60px] p-1 flex flex-col gap-1">
                          {relevant.map((ev, eIdx) => (
                            <div key={eIdx} className={`rounded p-1 text-[8px] leading-tight ${getEventTypeColor(ev.type)} text-white relative`}>
                              {!ev.isVisibleToAthletes && <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                              <div className="font-bold">{ev.startTime}</div>
                              <div className="truncate">{ev.type}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pb-8">
            <GlassCard onClick={() => setViewingStatsDetail('WATER')} className="p-4 border-blue-500/30 cursor-pointer hover:bg-blue-500/10 transition-colors">
              <h4 className="text-blue-400 font-display text-lg uppercase mb-2">Water-Polo</h4>
              <span className="text-3xl font-display text-white">{getWeeklyAttendance('WATER')}%</span>
              <span className="block text-[9px] text-nexus-gray uppercase tracking-wider">Présence Hebdo</span>
            </GlassCard>
            <GlassCard onClick={() => setViewingStatsDetail('DRY')} className="p-4 border-nexus-red/30 cursor-pointer hover:bg-nexus-red/10 transition-colors">
              <h4 className="text-nexus-red font-display text-lg uppercase mb-2">Muscu</h4>
              <span className="text-3xl font-display text-white">{getWeeklyAttendance('DRY')}%</span>
              <span className="block text-[9px] text-nexus-gray uppercase tracking-wider">Présence Hebdo</span>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Squad Modal */}
      {showSquadModal && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-6 flex justify-between items-center border-b border-white/10 bg-black/80 sticky top-0">
            <h2 className="font-display text-2xl text-white uppercase">Effectif</h2>
            <button onClick={() => setShowSquadModal(false)} className="text-white text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 pb-24">
            {athletes.map(ath => {
              const isInjured = ath.monitoring.waterHistory.some(d => d.attendance === 'INJURED');
              const avgRpe = getWeeklyAvgRpe(ath);
              return (
                <div key={ath.id}
                  onClick={() => { setViewingAthleteDetail(ath); setShowSquadModal(false); }}
                  className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isInjured ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                    <div>
                      <span className="text-white font-bold block uppercase">{ath.firstName} {ath.lastName}</span>
                      <span className={`text-[10px] uppercase font-bold ${isInjured ? 'text-red-500' : 'text-green-500'}`}>
                        {isInjured ? 'BLESSÉ' : 'APTE'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`block font-display text-xl ${avgRpe > 8 ? 'text-red-500' : 'text-white'}`}>{avgRpe}</span>
                    <span className="text-[9px] text-nexus-gray uppercase">RPE Moy.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Athlete Detail Modal */}
      {viewingAthleteDetail && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-6 flex justify-between items-center border-b border-white/10 bg-black/80 sticky top-0">
            <div>
              <h2 className="font-display text-2xl text-white uppercase">{viewingAthleteDetail.firstName}</h2>
              <span className="text-nexus-gray text-xs uppercase tracking-widest">{viewingAthleteDetail.lastName}</span>
            </div>
            <button onClick={() => setViewingAthleteDetail(null)} className="text-white text-xl bg-white/10 w-10 h-10 rounded-full">←</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 pb-24">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-center">
                <span className="block text-2xl font-display text-blue-400">{getAthleteAttendancePct(viewingAthleteDetail, 'WATER')}%</span>
                <span className="text-[9px] uppercase text-nexus-gray">Présence Water</span>
              </div>
              <div className="bg-nexus-red/10 border border-nexus-red/30 p-4 rounded-xl text-center">
                <span className="block text-2xl font-display text-nexus-red">{getAthleteAttendancePct(viewingAthleteDetail, 'DRY')}%</span>
                <span className="text-[9px] uppercase text-nexus-gray">Présence Muscu</span>
              </div>
            </div>
            <h3 className="text-xs text-white font-bold uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Historique Complet</h3>
            <div className="space-y-4">
              {[
                ...viewingAthleteDetail.monitoring.waterHistory.map(h => ({ ...h, sessionType: 'WATER' as const })),
                ...viewingAthleteDetail.monitoring.dryHistory.map(h => ({ ...h, sessionType: 'DRY' as const })),
              ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((session, idx) => {
                const st = getStatusLabel(session.attendance);
                return (
                  <div key={idx} className="bg-white/5 p-3 rounded-lg flex justify-between items-center border border-white/5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold px-1.5 rounded ${session.sessionType === 'WATER' ? 'bg-blue-500 text-black' : 'bg-nexus-red text-white'}`}>
                          {session.sessionType === 'WATER' ? 'EAU' : 'MUSCU'}
                        </span>
                        <span className="text-white font-mono text-sm">{session.date}</span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${st.color} ${st.bg}`}>{st.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-display text-xl text-white">{session.rpe || '-'}</span>
                      <span className="text-[9px] text-nexus-gray uppercase">RPE</span>
                    </div>
                  </div>
                );
              })}
              {viewingAthleteDetail.monitoring.waterHistory.length === 0 && viewingAthleteDetail.monitoring.dryHistory.length === 0 && (
                <p className="text-nexus-gray text-xs italic text-center">Aucune donnée enregistrée.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Session Stats Modal */}
      {viewingStatsDetail && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-6 flex justify-between items-center border-b border-white/10 bg-black/80">
            <div>
              <h2 className="font-display text-2xl text-white uppercase">
                {viewingStatsDetail === 'WATER' ? 'Stats Water-Polo' : 'Stats Musculation'}
              </h2>
              <span className="text-nexus-gray text-xs uppercase tracking-widest">Détail des séances</span>
            </div>
            <button onClick={() => setViewingStatsDetail(null)} className="text-white text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-4">
            {getTeamSessionStats(viewingStatsDetail).map((session, idx) => (
              <div key={idx} className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
                <div className="p-4 flex justify-between items-center bg-white/5">
                  <div>
                    <span className="text-white font-bold block">{session.date}</span>
                    <span className="text-[10px] text-nexus-gray uppercase">Séance {viewingStatsDetail === 'WATER' ? 'Eau' : 'Muscu'}</span>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <span className="block font-display text-lg text-white">{session.attendancePct}%</span>
                      <span className="text-[8px] text-nexus-gray uppercase">Présence</span>
                    </div>
                    <div>
                      <span className={`block font-display text-lg ${parseFloat(session.avgRpe as string) > 8 ? 'text-red-500' : 'text-nexus-gold'}`}>{session.avgRpe}</span>
                      <span className="text-[8px] text-nexus-gray uppercase">RPE Moy.</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-black/20 border-t border-white/5 space-y-1">
                  <div className="flex justify-between text-[9px] text-nexus-gray uppercase mb-1 px-2">
                    <span>Joueur</span><span>Statut / RPE</span>
                  </div>
                  {session.details.map((det, dIdx) => {
                    const st = getStatusLabel(det.status);
                    return (
                      <div key={dIdx} className="flex justify-between items-center px-2 py-1 rounded hover:bg-white/5">
                        <span className="text-xs text-gray-300">{det.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-1.5 rounded ${st.color} ${st.bg}`}>{st.label}</span>
                          <span className="text-xs font-mono font-bold w-6 text-right text-white">{det.rpe || '-'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {getTeamSessionStats(viewingStatsDetail).length === 0 && (
              <p className="text-center text-nexus-gray italic mt-10">Aucune session enregistrée.</p>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: PRÉSENCE ── */}
      {activeTab === 'ATTENDANCE' && (
        <div className="px-6 pb-20 animate-in fade-in">
          <div className="bg-[#1e293b] rounded-3xl p-6 shadow-2xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-nexus-gold">
                <span className="text-xl">📋</span>
                <h2 className="font-display text-xl font-bold uppercase tracking-wider">APPEL</h2>
              </div>
              <input type="date" value={attendanceDate}
                onChange={e => { setAttendanceDate(e.target.value); setAttendanceSessionType(null); }}
                className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm font-bold outline-none focus:border-nexus-gold"
              />
            </div>
            <div className="mb-6">
              <p className="text-[10px] text-nexus-gray uppercase mb-2">Choisir la séance :</p>
              <div className="flex flex-wrap gap-2">
                {getSessionsForDate(attendanceDate).length === 0 ? (
                  <span className="text-xs text-nexus-gray italic">Aucune séance programmée ce jour.</span>
                ) : (
                  getSessionsForDate(attendanceDate).map(ev => (
                    <button key={ev.id}
                      onClick={() => setAttendanceSessionType(ev.type)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${attendanceSessionType === ev.type ? 'bg-nexus-gold text-black border-nexus-gold' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}>
                      {ev.startTime} — {ev.type}
                    </button>
                  ))
                )}
              </div>
            </div>
            {attendanceSessionType ? (
              <div className="space-y-3">
                {athletes.map(ath => (
                  <div key={ath.id} className="bg-[#0f172a] rounded-xl p-3 flex items-center justify-between border border-white/5">
                    <span className="font-bold text-white text-sm">{ath.firstName} {ath.lastName}</span>
                    <div className="flex gap-2">
                      {(['PRESENT', 'ABSENT_JUSTIFIED', 'ABSENT_UNJUSTIFIED', 'INJURED'] as const).map(status => {
                        const labels: Record<string, string> = { PRESENT: '✅', ABSENT_JUSTIFIED: '📋', ABSENT_UNJUSTIFIED: '❌', INJURED: '🩹' };
                        const colors: Record<string, string> = {
                          PRESENT: 'bg-emerald-500 border-emerald-500',
                          ABSENT_JUSTIFIED: 'bg-blue-500 border-blue-500',
                          ABSENT_UNJUSTIFIED: 'bg-red-500 border-red-500',
                          INJURED: 'bg-orange-500 border-orange-500',
                        };
                        const active = attendanceSession[ath.id] === status;
                        return (
                          <button key={status}
                            onClick={() => handleAttendanceChange(ath.id, status)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border text-base ${active ? colors[status] + ' text-white shadow-lg' : 'bg-[#1e293b] border-white/10 hover:border-white/30'}`}>
                            {labels[status]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="pt-4">
                  <Button fullWidth onClick={submitAttendance} className="bg-nexus-gold text-black border-none hover:bg-white">
                    VALIDER L'APPEL ({attendanceSessionType})
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-nexus-gray italic">Sélectionnez une séance pour faire l'appel.</div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: SEMAINIER ── */}
      {activeTab === 'PLANNING' && (
        <div className="px-6 pb-32 animate-in fade-in">
          <div className="bg-[#1e293b] rounded-3xl p-6 shadow-2xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-nexus-gold">
                <span className="text-xl">📅</span>
                <h2 className="font-display text-xl font-bold uppercase tracking-wider">SEMAINIER</h2>
              </div>
              <WeekNavigator />
            </div>

            {/* Day selector */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
              {weeklySchedule.map((day, idx) => (
                <button key={idx} onClick={() => setPlanningDayIndex(idx)}
                  className={`min-w-[60px] p-2 rounded-xl border flex flex-col items-center transition-all ${idx === planningDayIndex ? 'bg-nexus-gold text-black border-nexus-gold shadow-lg scale-105' : 'bg-[#0f172a] border-white/5 text-nexus-gray hover:bg-white/5'}`}>
                  <span className="text-[10px] font-bold uppercase">{day.dayName.substring(0, 3)}</span>
                  <span className="text-lg font-bold">{day.date.split('-')[2]}</span>
                </button>
              ))}
            </div>

            {/* Events list */}
            <div className="bg-[#0f172a] rounded-2xl p-4 border border-white/5 min-h-[300px]">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <h3 className="text-nexus-gold font-display text-lg uppercase">
                  {weeklySchedule[planningDayIndex]?.dayName}
                </h3>
                <button onClick={() => setShowAddEventModal(true)}
                  className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-500 font-bold">
                  + Ajouter Créneau
                </button>
              </div>
              <div className="space-y-3">
                {weeklySchedule[planningDayIndex]?.events.length === 0 && (
                  <p className="text-nexus-gray text-center italic py-10">Aucun créneau programmé.</p>
                )}
                {weeklySchedule[planningDayIndex]?.events.map((event, idx) => (
                  <div key={idx} className={`rounded-xl p-3 border-l-4 border-white/10 bg-black/20 relative group ${getEventTypeColor(event.type)}`}>
                    <button onClick={() => handleDeleteEvent(event.id)}
                      className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">✕</button>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded text-white">{event.type}</span>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-mono text-white">{event.startTime} — {event.endTime}</span>
                        <span className={`text-[9px] uppercase font-bold mt-1 ${event.isVisibleToAthletes ? 'text-green-500' : 'text-red-500'}`}>
                          {event.isVisibleToAthletes ? 'Visible' : 'Caché'}
                        </span>
                      </div>
                    </div>
                    <h4 className="text-white font-bold text-sm uppercase">{event.title}</h4>
                    {event.description && <p className="text-[10px] text-gray-300 mt-1 italic border-l border-white/20 pl-2">{event.description}</p>}
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-[9px] text-nexus-gray uppercase">RPE Prévu:</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < (event.intensity || 0) ? 'bg-nexus-gold' : 'bg-white/10'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 space-y-3">
              <Button fullWidth onClick={updateSchedule} className="bg-nexus-gold text-black border-none hover:bg-white">
                SAUVEGARDER SEMAINE
              </Button>

              <button
                onClick={() => {
                  if (!window.confirm('Copier toute cette semaine vers la semaine suivante ?')) return;
                  const nextWeek = weeklySchedule.map(day => {
                    const next = new Date(day.date);
                    next.setDate(next.getDate() + 7);
                    return {
                      ...day,
                      date: next.toISOString().split('T')[0],
                      events: day.events.map(e => ({ ...e, id: Math.random().toString(36).substr(2, 9) })),
                    };
                  });
                  handleNextWeek();
                  setWeeklySchedule(nextWeek);
                  alert('Semaine dupliquée ! Cliquez sur "Sauvegarder" pour confirmer.');
                }}
                className="w-full py-3 rounded-xl border border-white/10 text-nexus-gray hover:text-white hover:border-white/30 text-sm font-bold uppercase tracking-widest transition-all"
              >
                📋 Dupliquer → Semaine suivante
              </button>

              <button
                onClick={() => {
                  const lines = weeklySchedule.map(day => {
                    const evts = day.events.map(e =>
                      `  ${e.startTime}–${e.endTime}  ${e.type.padEnd(12)} ${e.title} (RPE ${e.intensity ?? '—'})`
                    ).join('\n');
                    return `${day.dayName} ${day.date}\n${evts || '  Repos'}`;
                  }).join('\n\n');
                  const content = `CN MARSEILLE — PLANNING SEMAINE\n${'='.repeat(50)}\n\n${lines}\n\nGénéré le ${new Date().toLocaleDateString('fr-FR')}`;
                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `planning_cnm_${weeklySchedule[0]?.date || 'semaine'}.txt`; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-3 rounded-xl border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-sm font-bold uppercase tracking-widest transition-all"
              >
                ↓ Exporter Planning (TXT)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95">
          <GlassCard className="w-full max-w-md p-6 border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl text-white uppercase">Ajouter Créneau</h3>
              <button onClick={() => setShowAddEventModal(false)} className="text-nexus-gray hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Type</label>
                <select className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold"
                  value={newEvent.type}
                  onChange={e => setNewEvent({ ...newEvent, type: e.target.value as EventType, title: '' })}>
                  <option value="WATER-POLO">Water-Polo</option>
                  <option value="MUSCU">Musculation</option>
                  <option value="MATCH">Match</option>
                  <option value="KINE">Kiné</option>
                  <option value="MENTAL">Prépa Mentale</option>
                  <option value="VIDEO">Analyse Vidéo</option>
                  <option value="MEETING">Réunion / Meeting</option>
                  <option value="ENTRETIEN">Entretien Perso</option>
                  <option value="SLOT_LIBRE">Créneaux Disponibles (Staff)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Début</label>
                  <input type="time" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold"
                    value={newEvent.startTime} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Fin</label>
                  <input type="time" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold"
                    value={newEvent.endTime} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Titre / Thème</label>
                {newEvent.type === 'WATER-POLO' ? (
                  <select className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold"
                    value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}>
                    <option value="" disabled>Sélectionner un thème</option>
                    {WATER_THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : newEvent.type === 'MUSCU' ? (
                  <select className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold"
                    value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}>
                    <option value="" disabled>Sélectionner un thème</option>
                    {MUSCU_THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <input placeholder="ex: Bilan, Briefing..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold"
                    value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                )}
              </div>
              <div>
                <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">RPE Prédictif ({newEvent.intensity})</label>
                <input type="range" min="1" max="10" step="1" value={newEvent.intensity || 5}
                  onChange={e => setNewEvent({ ...newEvent, intensity: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-nexus-gold" />
              </div>
              <div>
                <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Détails / Commentaire</label>
                <textarea rows={3} placeholder="Détails de la séance..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold"
                  value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/10">
                <span className="text-sm font-bold text-white uppercase">Visible par les joueurs</span>
                <div onClick={() => setNewEvent({ ...newEvent, isVisibleToAthletes: !newEvent.isVisibleToAthletes })}
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${newEvent.isVisibleToAthletes ? 'bg-green-500' : 'bg-gray-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${newEvent.isVisibleToAthletes ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
              <Button fullWidth onClick={handleAddEvent} disabled={!newEvent.title}>Ajouter au Planning</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ── TAB 4: OBJECTIFS ── */}
      {activeTab === 'OBJECTIVES' && (
        <div className="px-6 space-y-6 animate-in fade-in">
          {!selectedAthlete ? (
            <div className="space-y-4">
              <h3 className="font-display text-white uppercase text-xl mb-4">Suivi Objectifs</h3>
              {athletes.map(ath => {
                const pending = ath.structuredObjectives.shortTerm.filter(o => o.status === 'PENDING_VALIDATION').length;
                return (
                  <GlassCard key={ath.id} onClick={() => setSelectedAthlete(ath)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5">
                    <span className="text-white font-bold">{ath.firstName} {ath.lastName}</span>
                    {pending > 0 && <span className="bg-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">{pending} Validation(s)</span>}
                  </GlassCard>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              <button onClick={() => setSelectedAthlete(null)} className="text-nexus-gray text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                ← Retour Liste
              </button>
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <h2 className="font-display text-3xl text-white uppercase">{selectedAthlete.firstName}</h2>
                <button onClick={() => handleAddObjective(selectedAthlete.id)} className="text-xs bg-nexus-gold text-black font-bold px-3 py-1.5 rounded hover:bg-white">+ Ajouter</button>
              </div>
              <div className="space-y-4">
                {[...selectedAthlete.structuredObjectives.shortTerm, ...selectedAthlete.structuredObjectives.mediumTerm].map(obj => (
                  <GlassCard key={obj.id} className="p-4 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start">
                      <span className="text-white font-bold text-sm">{obj.label}</span>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${obj.status === 'VALIDATED' ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-nexus-gray'}`}>{obj.status}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {obj.status === 'PENDING_VALIDATION' && (
                        <>
                          <button onClick={() => handleValidateObjective(selectedAthlete.id, 'shortTerm', obj.id, true)} className="flex-1 bg-green-500/20 text-green-500 text-xs py-1 rounded hover:bg-green-500 hover:text-white">Valider</button>
                          <button onClick={() => handleValidateObjective(selectedAthlete.id, 'shortTerm', obj.id, false)} className="flex-1 bg-red-500/20 text-red-500 text-xs py-1 rounded hover:bg-red-500 hover:text-white">Refuser</button>
                        </>
                      )}
                      {obj.status === 'ACTIVE' && (
                        <button onClick={() => handleValidateObjective(selectedAthlete.id, 'shortTerm', obj.id, true)} className="flex-1 bg-white/5 text-nexus-gray text-xs py-1 rounded hover:bg-white/10">Marquer Atteint</button>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: PROGRAMMATION ── */}
      {activeTab === 'PROGRAMMING' && (
        <PlanningView athletes={athletes} weeklySchedule={weeklySchedule} />
      )}

      {/* ── TAB 6: DATA ── */}
      {activeTab === 'DATA' && (
        <DataView athletes={athletes} onUpdate={async () => setAthletes(await db.getAthletes())} />
      )}

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 w-full px-6 pb-6 pt-2 z-40 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-between items-center p-2 shadow-2xl pointer-events-auto max-w-lg mx-auto overflow-x-auto">
          {[
            { id: 'HOME',        icon: '🏠', label: 'Accueil'  },
            { id: 'ATTENDANCE',  icon: '📝', label: 'Présence' },
            { id: 'PLANNING',    icon: '📅', label: 'Planning' },
            { id: 'OBJECTIVES',  icon: '🎯', label: 'Objectifs'},
            { id: 'PROGRAMMING', icon: '💪', label: 'Prog'     },
            { id: 'DATA',        icon: '📊', label: 'Data'     },
          ].map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center p-2 min-w-[50px] transition-all ${activeTab === tab.id ? 'text-nexus-gold' : 'text-nexus-gray hover:text-white'}`}>
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[8px] uppercase font-bold mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
