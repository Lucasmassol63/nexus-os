import React, { useState, useEffect } from 'react';
import { getAthletes } from '../../services/athleteService';
import { getWeeklySchedule, updateWeeklySchedule, getNextMatch, getTeamStats, getAppointments, assignWorkout, submitAttendance, addSessionLog, sendMessage } from '../../services/scheduleService';
import { Athlete, Exercise, Match, DaySchedule, AttendanceStatus, ScheduleEvent, EventType } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { DataView } from './DataView';

interface CoachDashboardProps {
  onLogout: () => void;
}

// Helpers for Week Calculation
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  d.setDate(diff);
  d.setHours(0,0,0,0);
  return d;
};

const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`;
};

const WATER_THEMES = ["Speed", "Hit", "CA 0/CA 1", "CA 2/CA 3", "Technical individual", "Shoot", "Duel", "Point defense", "Pass", "Leg", "Tactical", "Zone/Pressing", "Z+/Z-", "Counter-attack", "Match"];
const MUSCU_THEMES = ["Mobility", "Prevention", "Gainage", "Hypertrophy", "Strength", "Force", "Cardio crossfit"];

export const CoachDashboard: React.FC<CoachDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'ATTENDANCE' | 'PLANNING' | 'OBJECTIVES' | 'PROGRAMMING' | 'DATA'>('HOME');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([]);
  
  // Week Navigation State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));

  // UI States
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [viewingAthleteDetail, setViewingAthleteDetail] = useState<Athlete | null>(null);
  const [viewingStatsDetail, setViewingStatsDetail] = useState<'WATER' | 'DRY' | null>(null);
  
  // Tab specific states
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  
  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceSessionType, setAttendanceSessionType] = useState<EventType | null>(null); // To filter by session type on a specific date
  const [attendanceSession, setAttendanceSession] = useState<Record<string, 'PRESENT' | 'INJURED' | 'ABSENT_JUSTIFIED' | 'ABSENT_UNJUSTIFIED'>>({});

  // Planning State
  const [planningDayIndex, setPlanningDayIndex] = useState(0); 
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({ type: 'WATER-POLO', startTime: '18:00', endTime: '19:30', title: '', description: '', isVisibleToAthletes: true, intensity: 5 });

  // Builder State
  const [programQueue, setProgramQueue] = useState<Exercise[]>([]);
  const [exerciseForm, setExerciseForm] = useState<Partial<Exercise>>({});

  useEffect(() => {
    const loadData = async () => {
      const data = await getAthletes();
      const match = await getNextMatch();
      setAthletes(data);
      setNextMatch(match);
    };
    loadData();
  }, []);

  // Fetch schedule when week changes
  useEffect(() => {
    const loadSchedule = async () => {
      // Need to adjust for timezone offset to ensure string is correct date
      const offset = currentWeekStart.getTimezoneOffset();
      const adjustedDate = new Date(currentWeekStart.getTime() - (offset*60*1000));
      const dateStr = adjustedDate.toISOString().split('T')[0];
      const schedule = await getWeeklySchedule(dateStr);
      setWeeklySchedule(schedule);
    };
    loadSchedule();
  }, [currentWeekStart]);

  // --- HELPERS ---

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const getDaysBeforeMatch = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const getWeeklyAvgRpe = (athlete: Athlete, type: 'WATER' | 'DRY' | 'BOTH' = 'BOTH') => {
    let sum = 0;
    let count = 0;
    if (type === 'WATER' || type === 'BOTH') {
      const h = athlete.monitoring.waterHistory.slice(-7);
      h.forEach(d => { if(d.rpe > 0) { sum += d.rpe; count++; } });
    }
    if (type === 'DRY' || type === 'BOTH') {
      const h = athlete.monitoring.dryHistory.slice(-7);
      h.forEach(d => { if(d.rpe > 0) { sum += d.rpe; count++; } });
    }
    return count === 0 ? 0 : Math.round((sum / count) * 10) / 10;
  };

  const getWeeklyAttendance = (type: 'WATER' | 'DRY') => {
    let totalScheduled = 0; 
    let totalPresent = 0;
    athletes.forEach(a => {
      const hist = type === 'WATER' ? a.monitoring.waterHistory : a.monitoring.dryHistory;
      hist.slice(-7).forEach(d => {
        totalScheduled++;
        if(d.attendance === 'PRESENT') totalPresent++;
      });
    });
    return totalScheduled === 0 ? 0 : Math.round((totalPresent / totalScheduled) * 100);
  };

  const getAthleteAttendancePct = (athlete: Athlete, type: 'WATER' | 'DRY') => {
    const hist = type === 'WATER' ? athlete.monitoring.waterHistory : athlete.monitoring.dryHistory;
    if (hist.length === 0) return 0;
    const present = hist.filter(h => h.attendance === 'PRESENT').length;
    return Math.round((present / hist.length) * 100);
  };

  const getStatusLabel = (status: AttendanceStatus) => {
      switch(status) {
          case 'PRESENT': return { label: 'Présent', color: 'text-green-500', bg: 'bg-green-500/20' };
          case 'INJURED': return { label: 'Blessé', color: 'text-orange-500', bg: 'bg-orange-500/20' };
          case 'ABSENT_JUSTIFIED': return { label: 'Excusé', color: 'text-blue-400', bg: 'bg-blue-400/20' };
          case 'ABSENT_UNJUSTIFIED': return { label: 'Absent', color: 'text-red-500', bg: 'bg-red-500/20' };
          default: return { label: '-', color: 'text-gray-500', bg: 'bg-gray-500/10' };
      }
  };

  const getEventTypeColor = (type: EventType) => {
      switch(type) {
          case 'WATER-POLO': return 'bg-blue-600 border-blue-500/50';
          case 'MUSCU': return 'bg-nexus-red border-nexus-red/50';
          case 'MATCH': return 'bg-nexus-gold text-black border-nexus-gold';
          case 'KINE': return 'bg-green-600 border-green-500/50';
          case 'MENTAL': return 'bg-purple-600 border-purple-500/50';
          case 'VIDEO': return 'bg-indigo-500 border-indigo-400/50';
          case 'MEETING': return 'bg-gray-600 border-gray-500/50';
          case 'ENTRETIEN': return 'bg-orange-500 border-orange-400/50';
          case 'SLOT_LIBRE': return 'bg-white/10 border-white/20 text-nexus-gray';
          default: return 'bg-gray-700';
      }
  };

  // Helper to aggregate team stats per session date
  const getTeamSessionStats = (type: 'WATER' | 'DRY') => {
      const allDates = new Set<string>();
      athletes.forEach(a => {
          const hist = type === 'WATER' ? a.monitoring.waterHistory : a.monitoring.dryHistory;
          hist.forEach(h => allDates.add(h.date));
      });
      const sortedDates = Array.from(allDates).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());

      return sortedDates.map(date => {
          let presentCount = 0;
          let rpeSum = 0;
          let rpeCount = 0;
          const details: { name: string, status: AttendanceStatus, rpe: number }[] = [];

          athletes.forEach(a => {
              const hist = type === 'WATER' ? a.monitoring.waterHistory : a.monitoring.dryHistory;
              const entry = hist.find(h => h.date === date);
              if (entry) {
                  if (entry.attendance === 'PRESENT') presentCount++;
                  if (entry.rpe > 0) { rpeSum += entry.rpe; rpeCount++; }
                  details.push({ name: `${a.firstName} ${a.lastName}`, status: entry.attendance, rpe: entry.rpe });
              }
          });

          const totalAthletes = athletes.length; 
          const attendancePct = totalAthletes > 0 ? Math.round((presentCount / totalAthletes) * 100) : 0;
          const avgRpe = rpeCount > 0 ? (rpeSum / rpeCount).toFixed(1) : '-';

          return { date, attendancePct, avgRpe, details };
      });
  };

  // --- ALERTS LOGIC ---
  const getAlerts = () => {
    const alerts: { athlete: Athlete, reason: string }[] = [];
    athletes.forEach(ath => {
      const recentRpes = [...ath.monitoring.waterHistory, ...ath.monitoring.dryHistory]
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4)
        .map(d => d.rpe)
        .filter(r => r > 0);
      
      const avgLast4 = recentRpes.length > 0 ? recentRpes.reduce((a,b) => a+b, 0) / recentRpes.length : 0;
      if (avgLast4 > 9) alerts.push({ athlete: ath, reason: 'RPE Moyen > 9 (4 derniers)' });

      const last2 = recentRpes.slice(0, 2);
      if (last2.some(r => r === 10)) alerts.push({ athlete: ath, reason: 'RPE 10 Récemment' });

      const comment = ath.lastCheckIn?.comment?.toLowerCase() || "";
      if (comment.includes('mal') || comment.includes('douleur')) {
        alerts.push({ athlete: ath, reason: `Mot-clé: "${ath.lastCheckIn?.comment}"` });
      }

      if (ath.monitoring.waterHistory.some(d => d.attendance === 'INJURED')) {
         if (!alerts.find(al => al.athlete.id === ath.id && al.reason === 'Blessé')) {
            alerts.push({ athlete: ath, reason: 'Blessé' });
         }
      }
    });
    return alerts;
  };

  const alerts = getAlerts();
  const availablePlayers = athletes.filter(a => !a.monitoring.waterHistory.some(d => d.attendance === 'INJURED'));

  // --- ACTIONS ---

  const handleAttendanceChange = (athleteId: string, status: 'PRESENT' | 'INJURED' | 'ABSENT_JUSTIFIED' | 'ABSENT_UNJUSTIFIED') => {
    setAttendanceSession(prev => ({ ...prev, [athleteId]: status }));
  };

  const submitAttendance = async () => {
    
    if (attendanceSessionType === 'WATER-POLO' || attendanceSessionType === 'MUSCU') {
       const Type = attendanceSessionType === 'WATER-POLO' ? 'WATER' : 'DRY';
       await submitAttendance(Type, attendanceSession);
       alert("Appel validé !");
       setAttendanceSession({});
    } else {
       alert("Prise de présence uniquement disponible pour Water-Polo et Muscu pour le moment.");
    }
  };

  // PLANNING ACTIONS
  const updateSchedule = async () => {
    await updateWeeklySchedule(weeklySchedule);
    alert("Semainier mis à jour !");
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
          isVisibleToAthletes: newEvent.isVisibleToAthletes !== undefined ? newEvent.isVisibleToAthletes : true
      };
      
      const updatedSchedule = [...weeklySchedule];
      updatedSchedule[planningDayIndex].events.push(event);
      // Sort events by time
      updatedSchedule[planningDayIndex].events.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setWeeklySchedule(updatedSchedule);
      setShowAddEventModal(false);
      setNewEvent({ type: 'WATER-POLO', startTime: '18:00', endTime: '19:30', title: '', description: '', isVisibleToAthletes: true, intensity: 5 });
  };

  const handleDeleteEvent = (eventId: string) => {
      const updatedSchedule = [...weeklySchedule];
      updatedSchedule[planningDayIndex].events = updatedSchedule[planningDayIndex].events.filter(e => e.id !== eventId);
      setWeeklySchedule(updatedSchedule);
  };

  // BUILDER ACTIONS
  const addToQueue = () => {
      if (!exerciseForm.name) return;
      const newEx: Exercise = {
        id: Math.random().toString(),
        name: exerciseForm.name || 'Exercise',
        sets: exerciseForm.sets || 3,
        reps: exerciseForm.reps || '10',
        tempo: exerciseForm.tempo || '3010',
        rest: exerciseForm.rest || '60s',
        targetLoad: exerciseForm.targetLoad || '-'
      };
      setProgramQueue([...programQueue, newEx]);
      setExerciseForm({}); 
    };
  
    const sendProgram = async () => {
      if (!selectedAthlete) { alert("Sélectionnez un athlète dans l'onglet Objectifs ou Accueil"); return; }
      const jsonString = JSON.stringify(programQueue);
  
      await assignWorkout(selectedAthlete.id, {
        date: new Date().toISOString().split('T')[0],
        title: 'Séance Custom Coach',
        type: 'MUSCU',
        contentJson: jsonString
      });
  
      alert(`Programme envoyé à ${selectedAthlete.firstName} !`);
      setProgramQueue([]);
    };

    const handleValidateObjective = async (athleteId: string, type: 'shortTerm' | 'mediumTerm' | 'longTerm', objId: string, approved: boolean) => {
        await approveObjective(athleteId, type, objId, approved);
        const data = await getAthletes();
        setAthletes(data);
    };
    
    const handleAddObjective = async (athleteId: string) => {
        const typeInput = prompt("Type d'objectif ? (1: Court Terme, 2: Moyen Terme, 3: Long Terme)", "1");
        if (!typeInput) return;
        
        let type: 'shortTerm' | 'mediumTerm' | 'longTerm' = 'shortTerm';
        if (typeInput === '2') type = 'mediumTerm';
        if (typeInput === '3') type = 'longTerm';

        const label = prompt("Nouvel objectif :");
        if(label) {
            await addObjective(athleteId, type, label);
            const data = await getAthletes();
            setAthletes(data);
        }
    }

    // Get Sessions for Attendance Date
    const getSessionsForDate = (date: string) => {
        // Attendance uses a separate date picker, so we might need to fetch schedule if it's not the current week
        // For simplicity in this mock, we only support attendance for sessions in the current loaded week
        const day = weeklySchedule.find(d => d.date === date);
        return day ? day.events : [];
    };

    // Reusable Navigator Component
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


  return (
    <div className="pb-24 relative min-h-screen">
      <header className="px-6 pt-10 pb-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent sticky top-0 z-20 backdrop-blur-sm">
        <div>
          <h2 className="font-display text-3xl font-bold text-white tracking-wider">NEXUS <span className="text-nexus-gold">ADMIN</span></h2>
          <p className="text-[10px] text-nexus-gray tracking-[0.2em] uppercase mt-1">Interface Coaching</p>
        </div>
        <div className="flex items-center gap-4">
            <div 
            onClick={onLogout}
            className="w-10 h-10 rounded-full bg-nexus-gold/10 flex items-center justify-center border border-nexus-gold/30 text-nexus-gold font-display font-bold cursor-pointer hover:bg-red-500 hover:text-white transition-colors"
            >
            HC
            </div>
        </div>
      </header>

      {/* --- TAB 1: ACCUEIL --- */}
      {activeTab === 'HOME' && (
        <div className="px-6 space-y-8 animate-in fade-in">
           
           {/* 1. EFFECTIF DISPONIBLE (Clickable) */}
           <GlassCard 
              onClick={() => setShowSquadModal(true)}
              className="p-6 flex flex-col items-center justify-center border-l-4 border-l-green-500 cursor-pointer hover:bg-white/5 active:scale-95 transition-all"
           >
              <div className="flex items-baseline gap-2">
                 <span className="text-6xl font-display text-green-500">{availablePlayers.length}</span>
                 <span className="text-2xl font-display text-nexus-gray">/ {athletes.length}</span>
              </div>
              <span className="text-xs uppercase text-nexus-gray tracking-[0.2em] mt-2 font-bold">Joueurs Disponibles</span>
              <span className="text-[10px] text-nexus-gold mt-1 animate-pulse">● Voir liste détaillée</span>
           </GlassCard>

           {/* 2. NEXT MATCH */}
           {nextMatch && (
            <GlassCard className="p-0 overflow-hidden group border-nexus-gold/30">
               <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-black/80 z-0"></div>
               <div className="relative z-10 p-6">
                 <div className="flex justify-between items-start mb-6">
                   <div>
                     <p className="text-nexus-gray text-[10px] font-bold uppercase tracking-widest mb-1">PROCHAIN MATCH</p>
                     <h3 className="font-display text-3xl text-white uppercase italic leading-none">VS {nextMatch.opponent}</h3>
                   </div>
                   <div className="text-right">
                     <span className="block font-display text-4xl text-nexus-gold drop-shadow-[0_0_10px_rgba(255,161,77,0.5)]">J-{getDaysBeforeMatch(nextMatch.date)}</span>
                   </div>
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

           {/* 3. ALERTS SECTION */}
           {alerts.length > 0 && (
              <div>
                 <h3 className="text-xs text-nexus-red font-bold uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                    <span>⚠️</span> Joueurs en Alerte
                 </h3>
                 <div className="space-y-2">
                    {alerts.map((alert, idx) => (
                       <div key={idx} onClick={() => setViewingAthleteDetail(alert.athlete)} className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-red-500/20">
                          <span className="text-white font-bold text-sm">{alert.athlete.firstName} {alert.athlete.lastName}</span>
                          <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded font-bold uppercase">{alert.reason}</span>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {/* 4. WEEKLY OVERVIEW (Dynamic Grid) */}
           <div>
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs text-nexus-gray font-bold uppercase tracking-widest pl-1">Aperçu Semaine (08h - 22h)</h3>
                  {/* Navigator positioned above Sunday (Right side) */}
                  <WeekNavigator />
              </div>
              
              <div className="overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                 <div className="min-w-[600px] grid grid-cols-8 gap-1 text-[10px]">
                    {/* Header Row */}
                    <div className="text-nexus-gray font-bold text-center py-2">H</div>
                    {weeklySchedule.map((d, i) => (
                        <div key={i} className="text-nexus-gray font-bold text-center py-2 bg-white/5 rounded-t-lg flex flex-col">
                            <span>{d.dayName}</span>
                            <span className="text-[8px] text-nexus-gray/70">{formatDateShort(d.date)}</span>
                        </div>
                    ))}
                    
                    {/* Time Rows */}
                    {['08','10','12','14','16','18','20','22'].map(hour => (
                       <React.Fragment key={hour}>
                          <div className="text-nexus-gray text-center py-2 border-b border-white/5">{hour}h</div>
                          {weeklySchedule.map((day, dIdx) => {
                             // Find events that start roughly within this 2-hour block
                             const relevantEvents = day.events.filter(e => {
                                 const h = parseInt(e.startTime.split(':')[0]);
                                 const gridH = parseInt(hour);
                                 return h >= gridH && h < gridH + 2;
                             });

                             return (
                                <div key={dIdx} className="border border-white/5 bg-transparent min-h-[60px] p-1 flex flex-col gap-1">
                                   {relevantEvents.map((ev, eIdx) => (
                                       <div key={eIdx} className={`rounded p-1 text-[8px] leading-tight ${getEventTypeColor(ev.type)} text-white relative`}>
                                           {!ev.isVisibleToAthletes && <span className="absolute top-0 right-0 text-[6px] bg-red-500 rounded-full w-1.5 h-1.5" title="Caché"></span>}
                                           <div className="font-bold">{ev.startTime}</div>
                                           <div className="truncate">{ev.type}</div>
                                       </div>
                                   ))}
                                </div>
                             )
                          })}
                       </React.Fragment>
                    ))}
                 </div>
              </div>
           </div>

           {/* 5. STATS COMPARISON (CLICKABLE) */}
           <div className="grid grid-cols-2 gap-4 pb-8">
              {/* WATER */}
              <GlassCard 
                onClick={() => setViewingStatsDetail('WATER')}
                className="p-4 relative overflow-hidden border-blue-500/30 cursor-pointer hover:bg-blue-500/10 transition-colors" 
                accentColor="white"
              >
                 <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>
                 <div className="flex justify-between items-start">
                    <h4 className="text-blue-400 font-display text-lg uppercase mb-2">Water-Polo</h4>
                    <span className="text-[9px] text-blue-400 border border-blue-400/50 px-1 rounded">Détails →</span>
                 </div>
                 <div className="space-y-4">
                    <div>
                       <span className="text-3xl font-display text-white">{getWeeklyAttendance('WATER')}%</span>
                       <span className="block text-[9px] text-nexus-gray uppercase tracking-wider">Présence Hebdo</span>
                    </div>
                    <div>
                       <span className="text-xl font-display text-white">{athletes.length > 0 ? getWeeklyAvgRpe(athletes[0], 'WATER') : '-'}</span> 
                       <span className="block text-[9px] text-nexus-gray uppercase tracking-wider">RPE Moyen</span>
                    </div>
                 </div>
              </GlassCard>

              {/* MUSCU */}
              <GlassCard 
                onClick={() => setViewingStatsDetail('DRY')}
                className="p-4 relative overflow-hidden border-nexus-red/30 cursor-pointer hover:bg-nexus-red/10 transition-colors" 
                accentColor="nexus-red"
              >
                 <div className="absolute -right-4 -top-4 w-20 h-20 bg-nexus-red/10 rounded-full blur-xl"></div>
                 <div className="flex justify-between items-start">
                    <h4 className="text-nexus-red font-display text-lg uppercase mb-2">Musculation</h4>
                    <span className="text-[9px] text-nexus-red border border-nexus-red/50 px-1 rounded">Détails →</span>
                 </div>
                 <div className="space-y-4">
                    <div>
                       <span className="text-3xl font-display text-white">{getWeeklyAttendance('DRY')}%</span>
                       <span className="block text-[9px] text-nexus-gray uppercase tracking-wider">Présence Hebdo</span>
                    </div>
                    <div>
                       <span className="text-xl font-display text-white">{athletes.length > 0 ? getWeeklyAvgRpe(athletes[0], 'DRY') : '-'}</span>
                       <span className="block text-[9px] text-nexus-gray uppercase tracking-wider">RPE Moyen</span>
                    </div>
                 </div>
              </GlassCard>
           </div>

        </div>
      )}

      {/* SQUAD MODAL */}
      {showSquadModal && (
         <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 flex justify-between items-center border-b border-white/10 bg-black/80">
               <div>
                  <h2 className="font-display text-2xl text-white uppercase">Effectif Complet</h2>
                  <p className="text-[10px] text-nexus-gray uppercase">Cliquez pour voir le profil détaillé</p>
               </div>
               <button onClick={() => setShowSquadModal(false)} className="text-nexus-red font-bold uppercase text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
               {athletes.map(ath => {
                  const isInjured = ath.monitoring.waterHistory.some(d => d.attendance === 'INJURED');
                  const avgRpe = getWeeklyAvgRpe(ath);
                  return (
                     <div 
                       key={ath.id} 
                       onClick={() => setViewingAthleteDetail(ath)}
                       className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                     >
                        <div className="flex items-center gap-3">
                           <div className={`w-3 h-3 rounded-full ${isInjured ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
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
                  )
               })}
            </div>
         </div>
      )}

      {/* ATHLETE DETAIL MODAL */}
      {viewingAthleteDetail && (
         <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 flex justify-between items-center border-b border-white/10 bg-black/80 sticky top-0 z-10">
               <div>
                  <h2 className="font-display text-2xl text-white uppercase">{viewingAthleteDetail.firstName}</h2>
                  <span className="text-nexus-gray text-xs uppercase tracking-widest">{viewingAthleteDetail.lastName}</span>
               </div>
               <button onClick={() => setViewingAthleteDetail(null)} className="text-white text-xl bg-white/10 w-10 h-10 rounded-full">←</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 pb-24">
                {/* Stats Summary */}
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

                {/* History Lists */}
                <h3 className="text-xs text-white font-bold uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Historique Complet</h3>
                
                {/* Combine History and Sort by Date */}
                <div className="space-y-4">
                  {[
                    ...viewingAthleteDetail.monitoring.waterHistory.map(h => ({...h, type: 'WATER'})),
                    ...viewingAthleteDetail.monitoring.dryHistory.map(h => ({...h, type: 'DRY'}))
                  ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((session, idx) => {
                      const status = getStatusLabel(session.attendance);
                      return (
                        <div key={idx} className="bg-white/5 p-3 rounded-lg flex justify-between items-center border border-white/5">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] font-bold px-1.5 rounded ${session.type === 'WATER' ? 'bg-blue-500 text-black' : 'bg-nexus-red text-white'}`}>
                                   {session.type === 'WATER' ? 'EAU' : 'MUSCU'}
                                </span>
                                <span className="text-white font-mono text-sm">{session.date}</span>
                              </div>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${status.color} ${status.bg}`}>
                                {status.label}
                              </span>
                           </div>
                           <div className="text-right">
                              <span className="block font-display text-xl text-white">{session.rpe || '-'}</span>
                              <span className="text-[9px] text-nexus-gray uppercase">RPE</span>
                           </div>
                        </div>
                      )
                  })}
                  {viewingAthleteDetail.monitoring.waterHistory.length === 0 && viewingAthleteDetail.monitoring.dryHistory.length === 0 && (
                     <p className="text-nexus-gray text-xs italic text-center">Aucune donnée enregistrée.</p>
                  )}
                </div>
            </div>
         </div>
      )}

      {/* SESSION STATS MODAL (Team Aggregated) */}
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
                      {/* Session Header */}
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
                      
                      {/* Collapsible Detail List (Always visible in this view for clarity) */}
                      <div className="p-3 bg-black/20 border-t border-white/5 space-y-1">
                         <div className="flex justify-between text-[9px] text-nexus-gray uppercase mb-1 px-2">
                           <span>Joueur</span>
                           <span>Statut / RPE</span>
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
                            )
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

      {/* --- TAB 2: PRÉSENCE (Revised with Date Picker) --- */}
      {activeTab === 'ATTENDANCE' && (
        <div className="px-6 pb-20 animate-in fade-in">
           {/* Card Container */}
           <div className="bg-[#1e293b] rounded-3xl p-6 shadow-2xl border border-white/5">
              
              {/* Header with Date Picker */}
              <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-2 text-nexus-gold">
                    <span className="text-xl">📋</span>
                    <h2 className="font-display text-xl font-bold uppercase tracking-wider text-nexus-gold">APPEL</h2>
                 </div>
                 <input 
                    type="date" 
                    value={attendanceDate}
                    onChange={(e) => {
                        setAttendanceDate(e.target.value);
                        setAttendanceSessionType(null); // Reset session type on date change
                    }}
                    className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm font-bold outline-none focus:border-nexus-gold"
                 />
              </div>

              {/* Session Selector (Based on Schedule for that date) */}
              <div className="mb-6">
                 <p className="text-[10px] text-nexus-gray uppercase mb-2">Choisir la séance :</p>
                 <div className="flex flex-wrap gap-2">
                    {getSessionsForDate(attendanceDate).length === 0 ? (
                        <span className="text-xs text-nexus-gray italic">Aucune séance programmée ce jour.</span>
                    ) : (
                        getSessionsForDate(attendanceDate).map(ev => (
                            <button
                                key={ev.id}
                                onClick={() => setAttendanceSessionType(ev.type)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${attendanceSessionType === ev.type ? 'bg-nexus-gold text-black border-nexus-gold' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                            >
                                {ev.startTime} - {ev.type}
                            </button>
                        ))
                    )}
                 </div>
              </div>

              {/* List */}
              {attendanceSessionType ? (
                  <div className="space-y-3">
                     {athletes.map(ath => (
                        <div key={ath.id} className="bg-[#0f172a] rounded-xl p-3 flex items-center justify-between border border-white/5">
                           <span className="font-bold text-white text-sm">{ath.firstName} {ath.lastName}</span>
                           <div className="flex gap-2">
                              {/* Present */}
                              <button 
                                onClick={() => handleAttendanceChange(ath.id, 'PRESENT')}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${attendanceSession[ath.id] === 'PRESENT' ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-[#1e293b] border-white/10 text-gray-500 hover:border-emerald-500/50'}`}
                              >
                                 ✓
                              </button>
                              {/* Injured */}
                              <button 
                                onClick={() => handleAttendanceChange(ath.id, 'INJURED')}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${attendanceSession[ath.id] === 'INJURED' ? 'bg-amber-500 border-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-[#1e293b] border-white/10 text-gray-500 hover:border-amber-500/50'}`}
                              >
                                 🩹
                              </button>
                              {/* Justified */}
                              <button 
                                onClick={() => handleAttendanceChange(ath.id, 'ABSENT_JUSTIFIED')}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${attendanceSession[ath.id] === 'ABSENT_JUSTIFIED' ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-[#1e293b] border-white/10 text-gray-500 hover:border-blue-500/50'}`}
                              >
                                 📩
                              </button>
                              {/* Unjustified */}
                              <button 
                                onClick={() => handleAttendanceChange(ath.id, 'ABSENT_UNJUSTIFIED')}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${attendanceSession[ath.id] === 'ABSENT_UNJUSTIFIED' ? 'bg-red-500 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-[#1e293b] border-white/10 text-gray-500 hover:border-red-500/50'}`}
                              >
                                 ✕
                              </button>
                           </div>
                        </div>
                     ))}
                     {/* Validate Button */}
                     <div className="mt-6">
                        <Button fullWidth onClick={submitAttendance} className="bg-nexus-gold text-black border-none hover:bg-white">
                            VALIDER L'APPEL ({attendanceSessionType})
                        </Button>
                     </div>
                  </div>
              ) : (
                  <div className="text-center py-10 text-nexus-gray italic">
                      Sélectionnez une séance pour faire l'appel.
                  </div>
              )}
           </div>
        </div>
      )}

      {/* --- TAB 3: SEMAINIER (Revised with Dynamic Events) --- */}
      {activeTab === 'PLANNING' && (
        <div className="px-6 pb-32 animate-in fade-in">
           {/* Card Container */}
           <div className="bg-[#1e293b] rounded-3xl p-6 shadow-2xl border border-white/5">
              
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-2 text-nexus-gold">
                    <span className="text-xl">📅</span>
                    <h2 className="font-display text-xl font-bold uppercase tracking-wider text-nexus-gold">SEMAINIER</h2>
                 </div>
                 {/* Week Navigator for Planning */}
                 <WeekNavigator />
              </div>

              {/* Day Selector (Horizontal Scroll) */}
              <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                 {weeklySchedule.map((day, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setPlanningDayIndex(idx)}
                      className={`min-w-[60px] p-2 rounded-xl border flex flex-col items-center transition-all ${idx === planningDayIndex ? 'bg-nexus-gold text-black border-nexus-gold shadow-lg transform scale-105' : 'bg-[#0f172a] border-white/5 text-nexus-gray hover:bg-white/5'}`}
                    >
                       <span className="text-[10px] font-bold uppercase">{day.dayName.substring(0,3)}</span>
                       <span className="text-lg font-bold">{day.date.split('-')[2]}</span>
                    </button>
                 ))}
              </div>

              {/* Active Day Event List */}
              <div className="bg-[#0f172a] rounded-2xl p-4 border border-white/5 min-h-[300px]">
                 <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                    <h3 className="text-nexus-gold font-display text-lg uppercase">{weeklySchedule[planningDayIndex].dayName}</h3>
                    <button 
                        onClick={() => setShowAddEventModal(true)}
                        className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-500 font-bold"
                    >
                        + Ajouter Créneau
                    </button>
                 </div>

                 <div className="space-y-3">
                    {weeklySchedule[planningDayIndex].events.length === 0 && (
                        <p className="text-nexus-gray text-center italic py-10">Aucun créneau programmé.</p>
                    )}
                    {weeklySchedule[planningDayIndex].events.map((event, idx) => (
                        <div key={idx} className={`rounded-xl p-3 border-l-4 border-white/10 bg-black/20 relative group ${getEventTypeColor(event.type)} bg-opacity-20`}>
                            <button 
                                onClick={() => handleDeleteEvent(event.id)}
                                className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                            >✕</button>
                            
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded text-white">{event.type}</span>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-mono text-white">{event.startTime} - {event.endTime}</span>
                                    <span className={`text-[9px] uppercase font-bold mt-1 ${event.isVisibleToAthletes ? 'text-green-500' : 'text-red-500'}`}>
                                        {event.isVisibleToAthletes ? 'Visible' : 'Caché'}
                                    </span>
                                </div>
                            </div>
                            <h4 className="text-white font-bold text-sm uppercase">{event.title}</h4>
                            {event.description && <p className="text-[10px] text-gray-300 mt-1 italic border-l border-white/20 pl-2">{event.description}</p>}
                            
                            {/* RPE Indicator */}
                            <div className="flex items-center gap-1 mt-2">
                                <span className="text-[9px] text-nexus-gray uppercase">RPE Prévu:</span>
                                <div className="flex gap-0.5">
                                    {Array.from({length: 10}).map((_, i) => (
                                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < (event.intensity || 0) ? 'bg-nexus-gold' : 'bg-white/10'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>

              {/* Save Button */}
              <div className="mt-6">
                 <Button fullWidth onClick={updateSchedule} className="bg-nexus-gold text-black border-none hover:bg-white">
                    SAUVEGARDER SEMAINE
                 </Button>
              </div>

           </div>
        </div>
      )}

      {/* ADD EVENT MODAL */}
      {showAddEventModal && (
          <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95">
              <GlassCard className="w-full max-w-md p-6 border-white/10 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-display text-xl text-white uppercase">Ajouter Créneau</h3>
                      <button onClick={() => setShowAddEventModal(false)} className="text-nexus-gray hover:text-white">✕</button>
                  </div>
                  
                  <div className="space-y-4">
                      {/* Type Selector */}
                      <div>
                          <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Type</label>
                          <select 
                              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold"
                              value={newEvent.type}
                              onChange={e => setNewEvent({...newEvent, type: e.target.value as EventType, title: ''})}
                          >
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

                      {/* Time Slots */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Début</label>
                              <input 
                                  type="time" 
                                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold"
                                  value={newEvent.startTime}
                                  onChange={e => setNewEvent({...newEvent, startTime: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Fin</label>
                              <input 
                                  type="time" 
                                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold"
                                  value={newEvent.endTime}
                                  onChange={e => setNewEvent({...newEvent, endTime: e.target.value})}
                              />
                          </div>
                      </div>

                      {/* Title / Theme - Dynamic based on Type */}
                      <div>
                          <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Titre / Thème</label>
                          {newEvent.type === 'WATER-POLO' ? (
                              <select 
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold"
                                value={newEvent.title}
                                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                              >
                                <option value="" disabled>Sélectionner un thème</option>
                                {WATER_THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                          ) : newEvent.type === 'MUSCU' ? (
                              <select 
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold"
                                value={newEvent.title}
                                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                              >
                                <option value="" disabled>Sélectionner un thème</option>
                                {MUSCU_THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                          ) : (
                              <input 
                                  placeholder="ex: Bilan, Briefing..."
                                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold"
                                  value={newEvent.title}
                                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                              />
                          )}
                      </div>

                      {/* RPE Predictive */}
                      <div>
                          <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">RPE Prédictif ({newEvent.intensity})</label>
                          <input 
                            type="range" 
                            min="1" max="10" step="1"
                            value={newEvent.intensity || 5}
                            onChange={(e) => setNewEvent({...newEvent, intensity: parseInt(e.target.value)})}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-nexus-gold"
                          />
                          <div className="flex justify-between text-[8px] text-nexus-gray uppercase mt-1">
                              <span>Faible</span>
                              <span>Moyen</span>
                              <span>Intense</span>
                          </div>
                      </div>

                      {/* Description / Detail */}
                      <div>
                          <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Détails / Commentaire</label>
                          <textarea 
                              placeholder="Détails de la séance..."
                              rows={3}
                              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold"
                              value={newEvent.description}
                              onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                          />
                      </div>

                      {/* Visibility Toggle */}
                      <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/10">
                          <span className="text-sm font-bold text-white uppercase">Visible par les joueurs</span>
                          <div 
                            onClick={() => setNewEvent({...newEvent, isVisibleToAthletes: !newEvent.isVisibleToAthletes})}
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${newEvent.isVisibleToAthletes ? 'bg-green-500' : 'bg-gray-700'}`}
                          >
                              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${newEvent.isVisibleToAthletes ? 'translate-x-6' : 'translate-x-0'}`}></div>
                          </div>
                      </div>

                      <Button fullWidth onClick={handleAddEvent} disabled={!newEvent.title}>
                          Ajouter au Planning
                      </Button>
                  </div>
              </GlassCard>
          </div>
      )}

      {/* --- TAB 4: OBJECTIFS --- */}
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
                 )
               })}
             </div>
           ) : (
             <div className="space-y-6">
                <button onClick={() => setSelectedAthlete(null)} className="text-nexus-gray text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                   <span>←</span> Retour Liste
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

      {/* --- TAB 5: PROGRAMMATION --- */}
      {activeTab === 'PROGRAMMING' && (
        <div className="px-6 space-y-6 animate-in fade-in">
           {!selectedAthlete ? (
              <div className="text-center py-12">
                 <p className="text-nexus-gray mb-4">Veuillez sélectionner un athlète pour programmer une séance.</p>
                 <Button onClick={() => setActiveTab('OBJECTIVES')}>Aller aux Athlètes</Button>
              </div>
           ) : (
             <>
               <div className="flex items-center justify-between">
                  <span className="font-display text-xl text-nexus-gold uppercase block">{selectedAthlete.firstName}</span>
                  <span className="text-[10px] text-nexus-gray uppercase">Nouvelle Programmation</span>
               </div>

               <GlassCard className="p-6 border-t-2 border-t-nexus-gold/50">
                  <h3 className="font-display text-lg text-white mb-6 uppercase tracking-wider">Ajouter un exercice</h3>
                  <div className="space-y-4">
                  <input 
                     placeholder="Nom de l'exercice (ex: Back Squat)" 
                     className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-nexus-gold outline-none transition-colors"
                     value={exerciseForm.name || ''}
                     onChange={e => setExerciseForm({...exerciseForm, name: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                     <input 
                        placeholder="Séries" type="number"
                        className="bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-nexus-gold outline-none"
                        value={exerciseForm.sets || ''}
                        onChange={e => setExerciseForm({...exerciseForm, sets: parseInt(e.target.value)})}
                     />
                     <input 
                        placeholder="Reps" 
                        className="bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-nexus-gold outline-none"
                        value={exerciseForm.reps || ''}
                        onChange={e => setExerciseForm({...exerciseForm, reps: e.target.value})}
                     />
                     <input 
                        placeholder="Tempo (3010)" 
                        className="bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-nexus-gold outline-none"
                        value={exerciseForm.tempo || ''}
                        onChange={e => setExerciseForm({...exerciseForm, tempo: e.target.value})}
                     />
                     <input 
                        placeholder="Repos" 
                        className="bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-nexus-gold outline-none"
                        value={exerciseForm.rest || ''}
                        onChange={e => setExerciseForm({...exerciseForm, rest: e.target.value})}
                     />
                     <input 
                        placeholder="Charge Cible" 
                        className="col-span-2 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-nexus-gold outline-none"
                        value={exerciseForm.targetLoad || ''}
                        onChange={e => setExerciseForm({...exerciseForm, targetLoad: e.target.value})}
                     />
                  </div>
                  </div>
                  <div className="mt-6">
                  <Button variant="secondary" fullWidth onClick={addToQueue} disabled={!exerciseForm.name}>
                     + Ajouter à la liste
                  </Button>
                  </div>
               </GlassCard>

               {programQueue.length > 0 && (
                  <div className="space-y-3 pb-20">
                  <h4 className="text-xs text-nexus-gray uppercase font-bold tracking-widest pl-2">Séance en cours ({programQueue.length})</h4>
                  {programQueue.map((ex, idx) => (
                     <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center group hover:bg-white/10 transition-colors">
                        <div>
                        <span className="font-display text-white block uppercase tracking-wide">{ex.name}</span>
                        <span className="text-xs text-nexus-gold font-mono">{ex.sets}x{ex.reps} @ {ex.tempo}</span>
                        </div>
                        <button 
                        onClick={() => setProgramQueue(programQueue.filter((_, i) => i !== idx))}
                        className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                        >
                        ✕
                        </button>
                     </div>
                  ))}
                  
                  <div className="pt-6">
                     <Button fullWidth onClick={sendProgram} className="shadow-[0_0_20px_rgba(229,46,1,0.4)]">
                        CONFIRMER L'ENVOI
                     </Button>
                  </div>
                  </div>
               )}
             </>
           )}
        </div>
      )}

      {/* --- TAB 6: DATA --- */}
      {activeTab === 'DATA' && (
        <DataView 
            athletes={athletes} 
            onUpdate={async () => {
                const data = await getAthletes();
                setAthletes(data);
            }} 
        />
      )}

      {/* Coach Bottom Nav */}
      <nav className="fixed bottom-0 w-full px-6 pb-6 pt-2 z-40 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-between items-center p-2 shadow-2xl pointer-events-auto max-w-lg mx-auto overflow-x-auto">
             <button onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center p-2 min-w-[60px] ${activeTab === 'HOME' ? 'text-nexus-gold' : 'text-nexus-gray hover:text-white'}`}>
                <span className="text-lg">🏠</span>
                <span className="text-[8px] uppercase font-bold mt-1">Accueil</span>
             </button>
             <button onClick={() => setActiveTab('ATTENDANCE')} className={`flex flex-col items-center p-2 min-w-[60px] ${activeTab === 'ATTENDANCE' ? 'text-nexus-gold' : 'text-nexus-gray hover:text-white'}`}>
                <span className="text-lg">📝</span>
                <span className="text-[8px] uppercase font-bold mt-1">Présence</span>
             </button>
             <button onClick={() => setActiveTab('PLANNING')} className={`flex flex-col items-center p-2 min-w-[60px] ${activeTab === 'PLANNING' ? 'text-nexus-gold' : 'text-nexus-gray hover:text-white'}`}>
                <span className="text-lg">📅</span>
                <span className="text-[8px] uppercase font-bold mt-1">Semainier</span>
             </button>
             <button onClick={() => setActiveTab('OBJECTIVES')} className={`flex flex-col items-center p-2 min-w-[60px] ${activeTab === 'OBJECTIVES' ? 'text-nexus-gold' : 'text-nexus-gray hover:text-white'}`}>
                <span className="text-lg">🎯</span>
                <span className="text-[8px] uppercase font-bold mt-1">Objectifs</span>
             </button>
             <button onClick={() => setActiveTab('PROGRAMMING')} className={`flex flex-col items-center p-2 min-w-[60px] ${activeTab === 'PROGRAMMING' ? 'text-nexus-gold' : 'text-nexus-gray hover:text-white'}`}>
                <span className="text-lg">💪</span>
                <span className="text-[8px] uppercase font-bold mt-1">Prog</span>
             </button>
             <button onClick={() => setActiveTab('DATA')} className={`flex flex-col items-center p-2 min-w-[60px] ${activeTab === 'DATA' ? 'text-nexus-gold' : 'text-nexus-gray hover:text-white'}`}>
                <span className="text-lg">📊</span>
                <span className="text-[8px] uppercase font-bold mt-1">Data</span>
             </button>
          </div>
      </nav>
    </div>
  );
};