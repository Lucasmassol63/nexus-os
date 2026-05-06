import React, { useState, useEffect, useCallback } from 'react';
import { getAthletes, addObjective, updateObjectiveStatus } from '../../services/athleteService';
import { getWeeklySchedule, addEvent, deleteEvent, getWeekEventAthletes, setEventAthletes, getEventAthletes, getNextMatch, getAllMatches, createMatch, deleteMatch, updateMatch, getTeamStats, submitAttendance, addSessionLog, assignWorkout, sendMessage, getAppointments } from '../../services/scheduleService';
import { Athlete, Exercise, Match, DaySchedule, AttendanceStatus, ScheduleEvent, EventType } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { DataView } from './DataView';

interface CoachDashboardProps { onLogout: () => void; }

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff); d.setHours(0,0,0,0); return d;
};
const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
};

const WATER_THEMES = ["Speed","Hit","CA 0/CA 1","CA 2/CA 3","Technical individual","Shoot","Duel","Point defense","Pass","Leg","Tactical","Zone/Pressing","Z+/Z-","Counter-attack","Match"];
const MUSCU_THEMES = ["Mobility","Prevention","Gainage","Hypertrophy","Strength","Force","Cardio crossfit"];

export const CoachDashboard: React.FC<CoachDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'HOME'|'ATTENDANCE'|'PLANNING'|'OBJECTIVES'|'PROGRAMMING'|'DATA'>('HOME');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([]);
  const [eventAthletes, setEventAthletesState] = useState<Record<string, string[]>>({});
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));

  // UI States
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [viewingAthleteDetail, setViewingAthleteDetail] = useState<Athlete | null>(null);
  const [viewingStatsDetail, setViewingStatsDetail] = useState<'WATER'|'DRY'|null>(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState<{event: ScheduleEvent, dayDate: string} | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  // Attendance
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceEventId, setAttendanceEventId] = useState<string | null>(null);
  const [attendanceSessionType, setAttendanceSessionType] = useState<EventType | null>(null);
  const [attendanceSession, setAttendanceSession] = useState<Record<string, 'PRESENT'|'INJURED'|'ABSENT_JUSTIFIED'|'ABSENT_UNJUSTIFIED'>>({});

  // Planning
  const [planningDayIndex, setPlanningDayIndex] = useState(0);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({ type: 'WATER-POLO', startTime: '18:00', endTime: '19:30', title: '', description: '', isVisibleToAthletes: true, intensity: 5 });
  const [newEventAthleteIds, setNewEventAthleteIds] = useState<string[]>([]);

  // Match form
  const [matchForm, setMatchForm] = useState<Partial<Match>>({ opponent: '', date: '', time: '20:00', isHome: true, location: '' });
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  // Builder
  const [programQueue, setProgramQueue] = useState<Exercise[]>([]);
  const [exerciseForm, setExerciseForm] = useState<Partial<Exercise>>({});

  const loadData = useCallback(async () => {
    const [data, match, matches] = await Promise.all([getAthletes(), getNextMatch(), getAllMatches()]);
    setAthletes(data); setNextMatch(match); setAllMatches(matches);
  }, []);

  const loadSchedule = useCallback(async () => {
    const offset = currentWeekStart.getTimezoneOffset();
    const adjustedDate = new Date(currentWeekStart.getTime() - (offset*60*1000));
    const dateStr = adjustedDate.toISOString().split('T')[0];
    const [schedule, ea] = await Promise.all([getWeeklySchedule(dateStr), getWeekEventAthletes(dateStr)]);
    setWeeklySchedule(schedule);
    setEventAthletesState(ea);
  }, [currentWeekStart]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const handlePrevWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate()-7); setCurrentWeekStart(d); };
  const handleNextWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate()+7); setCurrentWeekStart(d); };

  const getDaysBeforeMatch = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000*3600*24));

  const getWeeklyAvgRpe = (athlete: Athlete, type: 'WATER'|'DRY'|'BOTH' = 'BOTH') => {
    let sum = 0, count = 0;
    if (type === 'WATER' || type === 'BOTH') athlete.monitoring.waterHistory.slice(-7).forEach(d => { if(d.rpe>0){sum+=d.rpe;count++;} });
    if (type === 'DRY' || type === 'BOTH') athlete.monitoring.dryHistory.slice(-7).forEach(d => { if(d.rpe>0){sum+=d.rpe;count++;} });
    return count === 0 ? 0 : Math.round((sum/count)*10)/10;
  };

  const getWeeklyAttendance = (type: 'WATER'|'DRY') => {
    let total = 0, present = 0;
    athletes.forEach(a => { const h = type==='WATER'?a.monitoring.waterHistory:a.monitoring.dryHistory; h.slice(-7).forEach(d => { total++; if(d.attendance==='PRESENT') present++; }); });
    return total === 0 ? 0 : Math.round((present/total)*100);
  };

  const getAthleteAttendancePct = (athlete: Athlete, type: 'WATER'|'DRY') => {
    const h = type==='WATER'?athlete.monitoring.waterHistory:athlete.monitoring.dryHistory;
    if (!h.length) return 0;
    return Math.round((h.filter(x=>x.attendance==='PRESENT').length/h.length)*100);
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch(status) {
      case 'PRESENT': return { label:'Présent', color:'text-green-500', bg:'bg-green-500/20' };
      case 'INJURED': return { label:'Blessé', color:'text-orange-500', bg:'bg-orange-500/20' };
      case 'ABSENT_JUSTIFIED': return { label:'Excusé', color:'text-blue-400', bg:'bg-blue-400/20' };
      case 'ABSENT_UNJUSTIFIED': return { label:'Absent', color:'text-red-500', bg:'bg-red-500/20' };
      default: return { label:'-', color:'text-gray-500', bg:'bg-gray-500/10' };
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

  const getTeamSessionStats = (type: 'WATER'|'DRY') => {
    const allDates = new Set<string>();
    athletes.forEach(a => { const h = type==='WATER'?a.monitoring.waterHistory:a.monitoring.dryHistory; h.forEach(x=>allDates.add(x.date)); });
    return Array.from(allDates).sort((a,b)=>new Date(b).getTime()-new Date(a).getTime()).map(date => {
      let presentCount=0, rpeSum=0, rpeCount=0;
      const details: {name:string,status:AttendanceStatus,rpe:number}[] = [];
      athletes.forEach(a => {
        const h = type==='WATER'?a.monitoring.waterHistory:a.monitoring.dryHistory;
        const entry = h.find(x=>x.date===date);
        if(entry){ if(entry.attendance==='PRESENT') presentCount++; if(entry.rpe>0){rpeSum+=entry.rpe;rpeCount++;} details.push({name:`${a.firstName} ${a.lastName}`,status:entry.attendance,rpe:entry.rpe}); }
      });
      return { date, attendancePct: athletes.length>0?Math.round((presentCount/athletes.length)*100):0, avgRpe: rpeCount>0?(rpeSum/rpeCount).toFixed(1):'-', details };
    });
  };

  const getAlerts = () => {
    const alerts: {athlete:Athlete,reason:string}[] = [];
    athletes.forEach(ath => {
      const recentRpes = [...ath.monitoring.waterHistory,...ath.monitoring.dryHistory].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,4).map(d=>d.rpe).filter(r=>r>0);
      const avg = recentRpes.length>0?recentRpes.reduce((a,b)=>a+b,0)/recentRpes.length:0;
      if(avg>9) alerts.push({athlete:ath,reason:'RPE Moyen > 9'});
      if(recentRpes.slice(0,2).some(r=>r===10)) alerts.push({athlete:ath,reason:'RPE 10 Récemment'});
      const comment = ath.lastCheckIn?.comment?.toLowerCase()||'';
      if(comment.includes('mal')||comment.includes('douleur')) alerts.push({athlete:ath,reason:`Mot-clé: "${ath.lastCheckIn?.comment}"`});
      if(ath.monitoring.waterHistory.some(d=>d.attendance==='INJURED') && !alerts.find(al=>al.athlete.id===ath.id&&al.reason==='Blessé')) alerts.push({athlete:ath,reason:'Blessé'});
    });
    return alerts;
  };

  const alerts = getAlerts();
  const availablePlayers = athletes.filter(a => !a.monitoring.waterHistory.some(d=>d.attendance==='INJURED'));

  // ─── HANDLERS ────────────────────────────────────────────────

  const handleAttendanceChange = (athleteId: string, status: 'PRESENT'|'INJURED'|'ABSENT_JUSTIFIED'|'ABSENT_UNJUSTIFIED') => {
    setAttendanceSession(prev => ({...prev, [athleteId]: status}));
  };

  const handleSubmitAttendance = async () => {
    if(attendanceSessionType==='WATER-POLO'||attendanceSessionType==='MUSCU') {
      await submitAttendance(attendanceSessionType==='WATER-POLO'?'WATER':'DRY', attendanceSession);
      alert('Appel validé !'); setAttendanceSession({});
    } else {
      alert('Prise de présence uniquement disponible pour Water-Polo et Muscu pour le moment.');
    }
  };

  /** Ajouter un événement immédiatement dans Supabase */
  const handleAddEvent = async () => {
    if (!newEvent.title) return;
    const day = weeklySchedule[planningDayIndex];
    const event: Omit<ScheduleEvent, 'id'> = {
      type: newEvent.type as EventType,
      startTime: newEvent.startTime || '18:00',
      endTime: newEvent.endTime || '19:00',
      title: newEvent.title || 'Nouvelle Session',
      description: newEvent.description || '',
      intensity: newEvent.intensity || 5,
      isVisibleToAthletes: newEvent.isVisibleToAthletes !== undefined ? newEvent.isVisibleToAthletes : true,
    };
    const newId = await addEvent(day.date, event);
    // Sauvegarder les athlètes assignés
    if (newEventAthleteIds.length > 0) {
      await setEventAthletes(newId, newEventAthleteIds);
    }
    setShowAddEventModal(false);
    setNewEvent({ type:'WATER-POLO', startTime:'18:00', endTime:'19:30', title:'', description:'', isVisibleToAthletes:true, intensity:5 });
    setNewEventAthleteIds([]);
    await loadSchedule();
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent(eventId);
    await loadSchedule();
  };

  /** Ouvrir le détail d'un événement */
  const handleEventClick = (event: ScheduleEvent, dayDate: string) => {
    setSelectedEventDetail({ event, dayDate });
  };

  // Gestion des matches
  const handleSaveMatch = async () => {
    if (!matchForm.opponent || !matchForm.date) return;
    const m: Omit<Match,'id'> = { opponent: matchForm.opponent!, date: matchForm.date!, time: matchForm.time||'20:00', isHome: matchForm.isHome??true, location: matchForm.location||'' };
    if (editingMatchId) { await updateMatch(editingMatchId, m); }
    else { await createMatch(m); }
    await loadData();
    setMatchForm({ opponent:'', date:'', time:'20:00', isHome:true, location:'' });
    setEditingMatchId(null);
  };

  const handleDeleteMatch = async (id: string) => {
    if (confirm('Supprimer ce match ?')) { await deleteMatch(id); await loadData(); }
  };

  const handleEditMatch = (match: Match) => {
    setMatchForm({ opponent:match.opponent, date:match.date, time:match.time, isHome:match.isHome, location:match.location });
    setEditingMatchId(match.id);
  };

  // Objectifs
  const handleValidateObjective = async (athleteId: string, _type: string, objId: string, approved: boolean) => {
    await updateObjectiveStatus(objId, approved ? 'VALIDATED' : 'ACTIVE');
    const data = await getAthletes(); setAthletes(data);
  };

  const handleAddObjective = async (athleteId: string) => {
    const typeInput = prompt("Type ? (1: Court Terme, 2: Moyen Terme, 3: Long Terme)", "1");
    if (!typeInput) return;
    let type: 'shortTerm'|'mediumTerm'|'longTerm' = 'shortTerm';
    if(typeInput==='2') type='mediumTerm';
    if(typeInput==='3') type='longTerm';
    const label = prompt("Nouvel objectif :");
    if(label) { await addObjective(athleteId, type, label); const data = await getAthletes(); setAthletes(data); }
  };

  const getSessionsForDate = (date: string) => {
    const day = weeklySchedule.find(d=>d.date===date);
    return day ? day.events : [];
  };

  /** Athlètes à afficher dans l'appel (filtrés par événement si assignés) */
  const getAttendanceAthletes = () => {
    if (!attendanceEventId) return athletes;
    const assigned = eventAthletes[attendanceEventId];
    if (!assigned || assigned.length === 0) return athletes;
    return athletes.filter(a => assigned.includes(a.id));
  };

  const addToQueue = () => {
    if(!exerciseForm.name) return;
    const ex: Exercise = { id:Math.random().toString(), name:exerciseForm.name||'Exercise', sets:exerciseForm.sets||3, reps:exerciseForm.reps||'10', tempo:exerciseForm.tempo||'3010', rest:exerciseForm.rest||'60s', targetLoad:exerciseForm.targetLoad||'-' };
    setProgramQueue([...programQueue, ex]); setExerciseForm({});
  };

  const sendProgram = async () => {
    if(!selectedAthlete) { alert("Sélectionnez un athlète"); return; }
    await assignWorkout(selectedAthlete.id, { date:new Date().toISOString().split('T')[0], title:'Séance Custom Coach', type:'MUSCU', contentJson:JSON.stringify(programQueue) });
    alert(`Programme envoyé à ${selectedAthlete.firstName} !`); setProgramQueue([]);
  };

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
        <div onClick={onLogout} className="w-10 h-10 rounded-full bg-nexus-gold/10 flex items-center justify-center border border-nexus-gold/30 text-nexus-gold font-display font-bold cursor-pointer hover:bg-red-500 hover:text-white transition-colors">HC</div>
      </header>

      {/* ─── HOME ─────────────────────────────────────────── */}
      {activeTab === 'HOME' && (
        <div className="px-6 space-y-8 animate-in fade-in">

          {/* EFFECTIF */}
          <GlassCard onClick={() => setShowSquadModal(true)} className="p-6 flex flex-col items-center justify-center border-l-4 border-l-green-500 cursor-pointer hover:bg-white/5 active:scale-95 transition-all">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-display text-green-500">{availablePlayers.length}</span>
              <span className="text-2xl font-display text-nexus-gray">/ {athletes.length}</span>
            </div>
            <span className="text-xs uppercase text-nexus-gray tracking-[0.2em] mt-2 font-bold">Joueurs Disponibles</span>
            <span className="text-[10px] text-nexus-gold mt-1 animate-pulse">● Voir liste détaillée</span>
          </GlassCard>

          {/* PROCHAIN MATCH — cliquable pour gérer les matchs */}
          <GlassCard onClick={() => setShowMatchModal(true)} className="p-0 overflow-hidden cursor-pointer hover:brightness-110 transition-all border-nexus-gold/30">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-black/80 z-0"></div>
            <div className="relative z-10 p-6">
              {nextMatch ? (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-nexus-gray text-[10px] font-bold uppercase tracking-widest mb-1">PROCHAIN MATCH</p>
                      <h3 className="font-display text-3xl text-white uppercase italic leading-none">VS {nextMatch.opponent}</h3>
                    </div>
                    <div className="text-right">
                      <span className="block font-display text-4xl text-nexus-gold drop-shadow-[0_0_10px_rgba(255,161,77,0.5)]">J-{getDaysBeforeMatch(nextMatch.date)}</span>
                      <span className="text-[10px] text-nexus-gold/60 uppercase">Gérer →</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <span className="text-nexus-gray">{new Date(nextMatch.date).toLocaleDateString()}</span>
                      <span className="text-nexus-red">•</span>
                      <span>{nextMatch.time}</span>
                      <span className="text-nexus-gray">•</span>
                      <span className="text-xs text-nexus-gray">{nextMatch.location}</span>
                    </div>
                    <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${nextMatch.isHome?'bg-white/10 text-white':'bg-nexus-red/20 text-nexus-red'}`}>
                      {nextMatch.isHome?'DOMICILE':'EXTÉRIEUR'}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-nexus-gray text-sm">Aucun match programmé</p>
                  <p className="text-nexus-gold text-xs mt-1">+ Ajouter un match →</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* ALERTES */}
          {alerts.length > 0 && (
            <div>
              <h3 className="text-xs text-nexus-red font-bold uppercase tracking-widest mb-3 pl-1 flex items-center gap-2"><span>⚠️</span> Joueurs en Alerte</h3>
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

          {/* APERÇU SEMAINE */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs text-nexus-gray font-bold uppercase tracking-widest pl-1">Aperçu Semaine</h3>
              <WeekNavigator />
            </div>
            <div className="overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
              <div className="grid min-w-[500px]" style={{ gridTemplateColumns: `80px repeat(7, 1fr)`, gridTemplateRows: 'auto' }}>
                <div className="text-[8px] text-nexus-gray p-1"></div>
                {weeklySchedule.map((day, dIdx) => (
                  <div key={dIdx} className="text-center p-1">
                    <div className="text-[8px] font-bold text-nexus-gray uppercase">{day.dayName.substring(0,3)}</div>
                    <div className="text-[10px] text-white font-bold">{day.date.split('-')[2]}</div>
                  </div>
                ))}
                {[...Array(14)].map((_, rowIdx) => (
                  <React.Fragment key={rowIdx}>
                    <div className="text-[7px] text-nexus-gray/50 p-0.5">{rowIdx < 7 ? 'AM' : 'PM'}</div>
                    {weeklySchedule.map((day, dIdx) => {
                      const half = rowIdx < 7 ? 'AM' : 'PM';
                      const relevantEvents = day.events.filter(ev => {
                        const h = parseInt(ev.startTime.split(':')[0]);
                        return half === 'AM' ? h < 14 : h >= 14;
                      }).slice(0, 1);
                      return (
                        <div key={dIdx} className="border border-white/5 bg-transparent min-h-[60px] p-1 flex flex-col gap-1">
                          {relevantEvents.map((ev, eIdx) => (
                            <div key={eIdx} className={`rounded p-1 text-[8px] leading-tight ${getEventTypeColor(ev.type)} text-white relative`}>
                              {!ev.isVisibleToAthletes && <span className="absolute top-0 right-0 text-[6px] bg-red-500 rounded-full w-1.5 h-1.5"></span>}
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

          {/* STATS */}
          <div className="grid grid-cols-2 gap-4 pb-8">
            <GlassCard onClick={() => setViewingStatsDetail('WATER')} className="p-4 relative overflow-hidden border-blue-500/30 cursor-pointer hover:bg-blue-500/10 transition-colors" accentColor="white">
              <div className="flex justify-between items-start">
                <h4 className="text-blue-400 font-display text-lg uppercase mb-2">Water-Polo</h4>
                <span className="text-[9px] text-blue-400 border border-blue-400/50 px-1 rounded">Détails →</span>
              </div>
              <span className="text-3xl font-display text-white">{getWeeklyAttendance('WATER')}%</span>
              <span className="block text-[9px] text-nexus-gray uppercase tracking-wider">Présence Hebdo</span>
            </GlassCard>
            <GlassCard onClick={() => setViewingStatsDetail('DRY')} className="p-4 relative overflow-hidden border-nexus-red/30 cursor-pointer hover:bg-nexus-red/10 transition-colors" accentColor="nexus-red">
              <div className="flex justify-between items-start">
                <h4 className="text-nexus-red font-display text-lg uppercase mb-2">Musculation</h4>
                <span className="text-[9px] text-nexus-red border border-nexus-red/50 px-1 rounded">Détails →</span>
              </div>
              <span className="text-3xl font-display text-white">{getWeeklyAttendance('DRY')}%</span>
              <span className="block text-[9px] text-nexus-gray uppercase tracking-wider">Présence Hebdo</span>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ─── MODAL GESTION MATCHS ─────────────────────────────── */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in zoom-in-95 duration-200">
          <div className="p-6 flex justify-between items-center border-b border-white/10 bg-black/80">
            <div>
              <h2 className="font-display text-2xl text-white uppercase">Gestion des Matchs</h2>
              <p className="text-[10px] text-nexus-gray uppercase">Ajouter, modifier ou supprimer</p>
            </div>
            <button onClick={() => { setShowMatchModal(false); setEditingMatchId(null); setMatchForm({opponent:'',date:'',time:'20:00',isHome:true,location:''}); }} className="text-nexus-red font-bold text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Formulaire ajout/édition */}
            <GlassCard className="p-5 space-y-4">
              <h3 className="font-display text-nexus-gold uppercase">{editingMatchId ? 'Modifier le match' : '+ Nouveau Match'}</h3>
              <input placeholder="Adversaire (ex: LIVRY-GARGAN)" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" value={matchForm.opponent||''} onChange={e=>setMatchForm({...matchForm,opponent:e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-nexus-gray uppercase mb-1 block">Date</label>
                  <input type="date" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" value={matchForm.date||''} onChange={e=>setMatchForm({...matchForm,date:e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-nexus-gray uppercase mb-1 block">Heure</label>
                  <input type="time" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" value={matchForm.time||'20:00'} onChange={e=>setMatchForm({...matchForm,time:e.target.value})} />
                </div>
              </div>
              <input placeholder="Lieu (ex: Piscine Olympique)" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" value={matchForm.location||''} onChange={e=>setMatchForm({...matchForm,location:e.target.value})} />
              <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/10">
                <span className="text-sm font-bold text-white uppercase">Domicile</span>
                <div onClick={() => setMatchForm({...matchForm,isHome:!matchForm.isHome})} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${matchForm.isHome?'bg-green-500':'bg-gray-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${matchForm.isHome?'translate-x-6':'translate-x-0'}`}></div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button fullWidth onClick={handleSaveMatch} disabled={!matchForm.opponent||!matchForm.date} className="bg-nexus-gold text-black border-none">
                  {editingMatchId ? 'Modifier' : 'Ajouter'}
                </Button>
                {editingMatchId && <Button variant="secondary" onClick={() => { setEditingMatchId(null); setMatchForm({opponent:'',date:'',time:'20:00',isHome:true,location:''}); }}>Annuler</Button>}
              </div>
            </GlassCard>

            {/* Liste des matchs */}
            <div className="space-y-3">
              <h3 className="text-xs text-nexus-gray font-bold uppercase tracking-widest">Matchs à venir</h3>
              {allMatches.length === 0 && <p className="text-nexus-gray italic text-sm text-center py-4">Aucun match programmé</p>}
              {allMatches.map(match => (
                <div key={match.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-white font-bold uppercase block">VS {match.opponent}</span>
                    <span className="text-nexus-gray text-xs">{new Date(match.date).toLocaleDateString()} • {match.time} • {match.isHome?'Domicile':'Extérieur'}</span>
                    {match.location && <span className="text-nexus-gray text-[10px] block">{match.location}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditMatch(match)} className="text-nexus-gold text-xs border border-nexus-gold/30 px-2 py-1 rounded">✏️</button>
                    <button onClick={() => handleDeleteMatch(match.id)} className="text-red-500 text-xs border border-red-500/30 px-2 py-1 rounded">🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── SQUAD MODAL ──────────────────────────────────────── */}
      {showSquadModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in zoom-in-95 duration-200">
          <div className="p-6 flex justify-between items-center border-b border-white/10 bg-black/80">
            <div>
              <h2 className="font-display text-2xl text-white uppercase">Effectif Complet</h2>
              <p className="text-[10px] text-nexus-gray uppercase">Cliquez pour voir le profil</p>
            </div>
            <button onClick={() => setShowSquadModal(false)} className="text-nexus-red font-bold text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {athletes.map(ath => {
              const isInjured = ath.monitoring.waterHistory.some(d=>d.attendance==='INJURED');
              return (
                <div key={ath.id} onClick={() => setViewingAthleteDetail(ath)} className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isInjured?'bg-red-500 animate-pulse':'bg-green-500'}`}></div>
                    <div>
                      <span className="text-white font-bold block uppercase">{ath.firstName} {ath.lastName}</span>
                      <span className={`text-[10px] uppercase font-bold ${isInjured?'text-red-500':'text-green-500'}`}>{isInjured?'BLESSÉ':'APTE'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`block font-display text-xl ${getWeeklyAvgRpe(ath)>8?'text-red-500':'text-white'}`}>{getWeeklyAvgRpe(ath)}</span>
                    <span className="text-[9px] text-nexus-gray uppercase">RPE Moy.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── ATHLETE DETAIL ───────────────────────────────────── */}
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
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-center">
                <span className="block text-2xl font-display text-blue-400">{getAthleteAttendancePct(viewingAthleteDetail,'WATER')}%</span>
                <span className="text-[9px] uppercase text-nexus-gray">Présence Water</span>
              </div>
              <div className="bg-nexus-red/10 border border-nexus-red/30 p-4 rounded-xl text-center">
                <span className="block text-2xl font-display text-nexus-red">{getAthleteAttendancePct(viewingAthleteDetail,'DRY')}%</span>
                <span className="text-[9px] uppercase text-nexus-gray">Présence Muscu</span>
              </div>
            </div>
            <h3 className="text-xs text-white font-bold uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Historique</h3>
            <div className="space-y-3">
              {[...viewingAthleteDetail.monitoring.waterHistory.map(h=>({...h,type:'WATER'})),...viewingAthleteDetail.monitoring.dryHistory.map(h=>({...h,type:'DRY'}))].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map((session, idx) => {
                const status = getStatusLabel(session.attendance);
                return (
                  <div key={idx} className="bg-white/5 p-3 rounded-lg flex justify-between items-center border border-white/5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold px-1.5 rounded ${session.type==='WATER'?'bg-blue-500 text-black':'bg-nexus-red text-white'}`}>{session.type==='WATER'?'EAU':'MUSCU'}</span>
                        <span className="text-white font-mono text-sm">{session.date}</span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${status.color} ${status.bg}`}>{status.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-display text-xl text-white">{session.rpe||'-'}</span>
                      <span className="text-[9px] text-nexus-gray uppercase">RPE</span>
                    </div>
                  </div>
                );
              })}
              {!viewingAthleteDetail.monitoring.waterHistory.length && !viewingAthleteDetail.monitoring.dryHistory.length && <p className="text-nexus-gray text-xs italic text-center">Aucune donnée.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ─── STATS DETAIL ─────────────────────────────────────── */}
      {viewingStatsDetail && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-6 flex justify-between items-center border-b border-white/10 bg-black/80">
            <div>
              <h2 className="font-display text-2xl text-white uppercase">{viewingStatsDetail==='WATER'?'Stats Water-Polo':'Stats Musculation'}</h2>
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
                    <span className="text-[10px] text-nexus-gray uppercase">Séance {viewingStatsDetail==='WATER'?'Eau':'Muscu'}</span>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div><span className="block font-display text-lg text-white">{session.attendancePct}%</span><span className="text-[8px] text-nexus-gray uppercase">Présence</span></div>
                    <div><span className={`block font-display text-lg ${parseFloat(session.avgRpe as string)>8?'text-red-500':'text-nexus-gold'}`}>{session.avgRpe}</span><span className="text-[8px] text-nexus-gray uppercase">RPE Moy.</span></div>
                  </div>
                </div>
                <div className="p-3 bg-black/20 border-t border-white/5 space-y-1">
                  {session.details.map((det, dIdx) => {
                    const st = getStatusLabel(det.status);
                    return (
                      <div key={dIdx} className="flex justify-between items-center px-2 py-1 rounded hover:bg-white/5">
                        <span className="text-xs text-gray-300">{det.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-1.5 rounded ${st.color} ${st.bg}`}>{st.label}</span>
                          <span className="text-xs font-mono font-bold w-6 text-right text-white">{det.rpe||'-'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {getTeamSessionStats(viewingStatsDetail).length===0 && <p className="text-center text-nexus-gray italic mt-10">Aucune session enregistrée.</p>}
          </div>
        </div>
      )}

      {/* ─── EVENT DETAIL MODAL ───────────────────────────────── */}
      {selectedEventDetail && (
        <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-xl flex flex-col animate-in zoom-in-95 duration-200">
          <div className={`p-6 flex justify-between items-center border-b border-white/10 ${getEventTypeColor(selectedEventDetail.event.type)}`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{selectedEventDetail.event.type}</span>
              <h2 className="font-display text-2xl text-white uppercase">{selectedEventDetail.event.title}</h2>
            </div>
            <button onClick={() => setSelectedEventDetail(null)} className="text-white text-xl bg-black/30 w-10 h-10 rounded-full">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Infos */}
            <GlassCard className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-nexus-gray text-xs uppercase font-bold">Horaires</span>
                <span className="text-white font-mono font-bold">{selectedEventDetail.event.startTime} — {selectedEventDetail.event.endTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-nexus-gray text-xs uppercase font-bold">Date</span>
                <span className="text-white font-bold">{new Date(selectedEventDetail.dayDate).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</span>
              </div>
              {selectedEventDetail.event.description && (
                <div>
                  <span className="text-nexus-gray text-xs uppercase font-bold block mb-1">Détails</span>
                  <p className="text-white text-sm italic border-l-2 border-nexus-gold pl-3">{selectedEventDetail.event.description}</p>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-nexus-gray text-xs uppercase font-bold">RPE Prédictif</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({length:10}).map((_,i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i<(selectedEventDetail.event.intensity||0)?'bg-nexus-gold':'bg-white/10'}`}></div>
                    ))}
                  </div>
                  <span className="text-nexus-gold font-display text-lg font-bold">{selectedEventDetail.event.intensity}/10</span>
                </div>
              </div>
            </GlassCard>

            {/* Joueurs assignés */}
            <div>
              <h3 className="text-xs text-nexus-gray font-bold uppercase tracking-widest mb-3">Joueurs assignés</h3>
              {(() => {
                const assigned = eventAthletes[selectedEventDetail.event.id];
                const assignedAthletes = assigned && assigned.length > 0
                  ? athletes.filter(a => assigned.includes(a.id))
                  : [];
                return assignedAthletes.length > 0 ? (
                  <div className="space-y-2">
                    {assignedAthletes.map(ath => (
                      <div key={ath.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3">
                        <span className="text-2xl">{ath.gamification.selectedSkin}</span>
                        <div>
                          <span className="text-white font-bold block">{ath.firstName} {ath.lastName}</span>
                          <span className="text-nexus-gray text-[10px] uppercase">{ath.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-nexus-gray italic text-sm text-center py-4">Tous les joueurs sont concernés (aucune restriction)</p>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── ATTENDANCE ───────────────────────────────────────── */}
      {activeTab === 'ATTENDANCE' && (
        <div className="px-6 pb-20 animate-in fade-in">
          <div className="bg-[#1e293b] rounded-3xl p-6 shadow-2xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-nexus-gold">
                <span className="text-xl">📋</span>
                <h2 className="font-display text-xl font-bold uppercase tracking-wider text-nexus-gold">APPEL</h2>
              </div>
              <input type="date" value={attendanceDate} onChange={e => { setAttendanceDate(e.target.value); setAttendanceSessionType(null); setAttendanceEventId(null); }} className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm font-bold outline-none focus:border-nexus-gold" />
            </div>

            {/* Sélection séance */}
            <div className="mb-6">
              <p className="text-[10px] text-nexus-gray uppercase mb-2">Choisir la séance :</p>
              <div className="flex flex-wrap gap-2">
                {getSessionsForDate(attendanceDate).length === 0 ? (
                  <span className="text-xs text-nexus-gray italic">Aucune séance programmée ce jour.</span>
                ) : (
                  getSessionsForDate(attendanceDate).map(ev => {
                    const assigned = eventAthletes[ev.id];
                    const count = assigned && assigned.length > 0 ? assigned.length : athletes.length;
                    return (
                      <button key={ev.id}
                        onClick={() => { setAttendanceSessionType(ev.type); setAttendanceEventId(ev.id); setAttendanceSession({}); }}
                        className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border transition-all flex flex-col items-start ${attendanceEventId===ev.id?'bg-nexus-gold/20 border-nexus-gold text-nexus-gold':'border-white/10 text-nexus-gray hover:bg-white/5'}`}
                      >
                        <span>{ev.type} — {ev.startTime}</span>
                        <span className="text-[9px] font-normal opacity-70">{ev.title} • {count} joueur{count>1?'s':''}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {attendanceEventId ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] text-nexus-gray uppercase font-bold">
                    {getAttendanceAthletes().length} joueur{getAttendanceAthletes().length>1?'s':''} concerné{getAttendanceAthletes().length>1?'s':''}
                  </p>
                </div>
                {getAttendanceAthletes().map(ath => (
                  <div key={ath.id} className="bg-[#0f172a] border border-white/5 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{ath.gamification.selectedSkin}</span>
                      <div>
                        <span className="text-white font-bold text-sm block">{ath.firstName} {ath.lastName}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${attendanceSession[ath.id] ? getStatusLabel(attendanceSession[ath.id] as AttendanceStatus).color+' '+getStatusLabel(attendanceSession[ath.id] as AttendanceStatus).bg : 'text-gray-500 bg-gray-500/10'}`}>
                          {attendanceSession[ath.id] ? getStatusLabel(attendanceSession[ath.id] as AttendanceStatus).label : 'Non marqué'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[{s:'PRESENT',emoji:'✓',c:'text-green-500 border-green-500/30 hover:bg-green-500/20'},{s:'INJURED',emoji:'🤕',c:'text-orange-500 border-orange-500/30 hover:bg-orange-500/20'},{s:'ABSENT_JUSTIFIED',emoji:'📋',c:'text-blue-400 border-blue-400/30 hover:bg-blue-400/20'},{s:'ABSENT_UNJUSTIFIED',emoji:'✕',c:'text-red-500 border-red-500/30 hover:bg-red-500/20'}].map(btn => (
                        <button key={btn.s} onClick={() => handleAttendanceChange(ath.id, btn.s as any)} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border text-sm ${attendanceSession[ath.id]===btn.s?'bg-white/20 border-white text-white scale-110':btn.c+' border'}`}>{btn.emoji}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="mt-6">
                  <Button fullWidth onClick={handleSubmitAttendance} className="bg-nexus-gold text-black border-none hover:bg-white">
                    VALIDER L'APPEL ({getAttendanceAthletes().filter(a=>attendanceSession[a.id]).length}/{getAttendanceAthletes().length})
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-nexus-gray italic">Sélectionnez une séance pour faire l'appel.</div>
            )}
          </div>
        </div>
      )}

      {/* ─── PLANNING ─────────────────────────────────────────── */}
      {activeTab === 'PLANNING' && (
        <div className="px-6 pb-32 animate-in fade-in">
          <div className="bg-[#1e293b] rounded-3xl p-6 shadow-2xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-nexus-gold">
                <span className="text-xl">📅</span>
                <h2 className="font-display text-xl font-bold uppercase tracking-wider text-nexus-gold">SEMAINIER</h2>
              </div>
              <WeekNavigator />
            </div>

            {/* Sélecteur de jour */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
              {weeklySchedule.map((day, idx) => (
                <button key={idx} onClick={() => setPlanningDayIndex(idx)} className={`min-w-[60px] p-2 rounded-xl border flex flex-col items-center transition-all ${idx===planningDayIndex?'bg-nexus-gold text-black border-nexus-gold shadow-lg scale-105':'bg-[#0f172a] border-white/5 text-nexus-gray hover:bg-white/5'}`}>
                  <span className="text-[10px] font-bold uppercase">{day.dayName.substring(0,3)}</span>
                  <span className="text-lg font-bold">{day.date.split('-')[2]}</span>
                  {day.events.length > 0 && <span className="text-[8px] mt-0.5 opacity-70">{day.events.length} séance{day.events.length>1?'s':''}</span>}
                </button>
              ))}
            </div>

            {/* Événements du jour */}
            <div className="bg-[#0f172a] rounded-2xl p-4 border border-white/5 min-h-[300px]">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <h3 className="text-nexus-gold font-display text-lg uppercase">{weeklySchedule[planningDayIndex]?.dayName}</h3>
                <button onClick={() => setShowAddEventModal(true)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-500 font-bold">+ Ajouter Créneau</button>
              </div>

              <div className="space-y-3">
                {weeklySchedule[planningDayIndex]?.events.length === 0 && <p className="text-nexus-gray text-center italic py-10">Aucun créneau programmé.</p>}
                {weeklySchedule[planningDayIndex]?.events.map((event, idx) => {
                  const assigned = eventAthletes[event.id];
                  const assignedCount = assigned && assigned.length > 0 ? assigned.length : athletes.length;
                  return (
                    <div key={idx} onClick={() => handleEventClick(event, weeklySchedule[planningDayIndex].date)} className={`rounded-xl p-3 border-l-4 bg-black/20 relative group cursor-pointer hover:brightness-110 transition-all ${getEventTypeColor(event.type)}`}>
                      <button onClick={e => { e.stopPropagation(); handleDeleteEvent(event.id); }} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold z-10">✕</button>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded text-white">{event.type}</span>
                        <div className="flex items-center gap-2">
                          {/* RPE affiché à droite */}
                          <span className={`text-lg font-display font-bold ${(event.intensity||0)>=8?'text-red-400':(event.intensity||0)>=5?'text-nexus-gold':'text-green-400'}`}>{event.intensity}</span>
                          <span className="text-[9px] text-nexus-gray/70">RPE</span>
                          <span className="text-xs font-mono text-white">{event.startTime}-{event.endTime}</span>
                        </div>
                      </div>
                      <h4 className="text-white font-bold text-sm uppercase">{event.title}</h4>
                      {event.description && <p className="text-[10px] text-gray-300 mt-1 italic border-l border-white/20 pl-2">{event.description}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-0.5">
                          {Array.from({length:10}).map((_,i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i<(event.intensity||0)?'bg-nexus-gold':'bg-white/10'}`}></div>)}
                        </div>
                        <span className="text-[9px] text-nexus-gray/70">👥 {assignedCount} joueur{assignedCount>1?'s':''} • Voir détails →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD EVENT MODAL ──────────────────────────────────── */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95">
          <GlassCard className="w-full max-w-md p-6 border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl text-white uppercase">Ajouter Créneau</h3>
              <button onClick={() => setShowAddEventModal(false)} className="text-nexus-gray hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Type</label>
                <select className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" value={newEvent.type} onChange={e => setNewEvent({...newEvent,type:e.target.value as EventType,title:''})}>
                  <option value="WATER-POLO">Water-Polo</option><option value="MUSCU">Musculation</option><option value="MATCH">Match</option><option value="KINE">Kiné</option><option value="MENTAL">Prépa Mentale</option><option value="VIDEO">Analyse Vidéo</option><option value="MEETING">Réunion</option><option value="ENTRETIEN">Entretien Perso</option><option value="SLOT_LIBRE">Créneaux Staff</option>
                </select>
              </div>
              {/* Horaires */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Début</label>
                  <input type="time" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" value={newEvent.startTime} onChange={e=>setNewEvent({...newEvent,startTime:e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Fin</label>
                  <input type="time" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" value={newEvent.endTime} onChange={e=>setNewEvent({...newEvent,endTime:e.target.value})} />
                </div>
              </div>
              {/* Titre */}
              <div>
                <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Titre / Thème</label>
                {newEvent.type==='WATER-POLO' ? (
                  <select className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" value={newEvent.title} onChange={e=>setNewEvent({...newEvent,title:e.target.value})}>
                    <option value="" disabled>Sélectionner un thème</option>
                    {WATER_THEMES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                ) : newEvent.type==='MUSCU' ? (
                  <select className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" value={newEvent.title} onChange={e=>setNewEvent({...newEvent,title:e.target.value})}>
                    <option value="" disabled>Sélectionner un thème</option>
                    {MUSCU_THEMES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <input placeholder="ex: Bilan, Briefing..." className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" value={newEvent.title} onChange={e=>setNewEvent({...newEvent,title:e.target.value})} />
                )}
              </div>
              {/* RPE */}
              <div>
                <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">RPE Prédictif ({newEvent.intensity})</label>
                <input type="range" min="1" max="10" step="1" value={newEvent.intensity||5} onChange={e=>setNewEvent({...newEvent,intensity:parseInt(e.target.value)})} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-nexus-gold" />
                <div className="flex justify-between text-[8px] text-nexus-gray uppercase mt-1"><span>Faible</span><span>Moyen</span><span>Intense</span></div>
              </div>
              {/* Description */}
              <div>
                <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-1 block">Détails</label>
                <textarea rows={2} placeholder="Détails de la séance..." className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-nexus-gold" value={newEvent.description} onChange={e=>setNewEvent({...newEvent,description:e.target.value})} />
              </div>

              {/* ─── SÉLECTION JOUEURS ─── */}
              <div>
                <label className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-2 block">
                  Joueurs concernés ({newEventAthleteIds.length===0?'Tous':''+newEventAthleteIds.length+' sélectionné'+(newEventAthleteIds.length>1?'s':'')})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <button onClick={() => setNewEventAthleteIds([])} className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors ${newEventAthleteIds.length===0?'bg-nexus-gold/20 border-nexus-gold text-nexus-gold':'border-white/10 text-nexus-gray hover:bg-white/5'}`}>
                    🌍 Toute l'équipe (défaut)
                  </button>
                  {athletes.map(ath => (
                    <div key={ath.id} onClick={() => setNewEventAthleteIds(prev => prev.includes(ath.id) ? prev.filter(id=>id!==ath.id) : [...prev, ath.id])} className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${newEventAthleteIds.includes(ath.id)?'bg-nexus-gold/20 border-nexus-gold':'border-white/10 hover:bg-white/5'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${newEventAthleteIds.includes(ath.id)?'bg-nexus-gold border-nexus-gold':'border-white/30'}`}>
                        {newEventAthleteIds.includes(ath.id) && <span className="text-black text-[10px] font-bold">✓</span>}
                      </div>
                      <span className="text-lg">{ath.gamification.selectedSkin}</span>
                      <span className={`text-sm font-bold ${newEventAthleteIds.includes(ath.id)?'text-nexus-gold':'text-white'}`}>{ath.firstName} {ath.lastName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visibilité */}
              <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/10">
                <span className="text-sm font-bold text-white uppercase">Visible par les joueurs</span>
                <div onClick={() => setNewEvent({...newEvent,isVisibleToAthletes:!newEvent.isVisibleToAthletes})} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${newEvent.isVisibleToAthletes?'bg-green-500':'bg-gray-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${newEvent.isVisibleToAthletes?'translate-x-6':'translate-x-0'}`}></div>
                </div>
              </div>
              <Button fullWidth onClick={handleAddEvent} disabled={!newEvent.title}>Ajouter au Planning</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ─── OBJECTIFS ────────────────────────────────────────── */}
      {activeTab === 'OBJECTIVES' && (
        <div className="px-6 space-y-6 animate-in fade-in">
          {!selectedAthlete ? (
            <div className="space-y-4">
              <h3 className="font-display text-white uppercase text-xl mb-4">Suivi Objectifs</h3>
              {athletes.map(ath => {
                const pending = ath.structuredObjectives.shortTerm.filter(o=>o.status==='PENDING_VALIDATION').length;
                return (
                  <GlassCard key={ath.id} onClick={() => setSelectedAthlete(ath)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5">
                    <span className="text-white font-bold">{ath.firstName} {ath.lastName}</span>
                    <div className="flex items-center gap-2">
                      {pending>0 && <span className="bg-nexus-gold text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{pending} en attente</span>}
                      <span className="text-nexus-gray">→</span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedAthlete(null)} className="text-nexus-gray hover:text-white">←</button>
                <h3 className="font-display text-white uppercase text-xl">{selectedAthlete.firstName}</h3>
              </div>
              <Button onClick={() => handleAddObjective(selectedAthlete.id)} variant="secondary">+ Ajouter Objectif</Button>
              {(['shortTerm','mediumTerm','longTerm'] as const).map(term => {
                const labels: Record<string, string> = { shortTerm:'Court Terme', mediumTerm:'Moyen Terme', longTerm:'Long Terme' };
                const objs = selectedAthlete.structuredObjectives[term];
                return (
                  <div key={term}>
                    <h4 className="text-[10px] text-nexus-gray uppercase font-bold tracking-widest mb-2">{labels[term]}</h4>
                    {objs.length===0 ? <p className="text-nexus-gray italic text-xs">Aucun objectif.</p> : objs.map(obj => (
                      <div key={obj.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex justify-between items-center mb-2">
                        <span className="text-white text-sm">{obj.label}</span>
                        <div className="flex gap-2 items-center">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${obj.status==='ACTIVE'?'bg-blue-500/20 text-blue-400':obj.status==='PENDING_VALIDATION'?'bg-yellow-500/20 text-yellow-400':obj.status==='VALIDATED'?'bg-green-500/20 text-green-400':'bg-gray-500/20 text-gray-400'}`}>{obj.status}</span>
                          {obj.status==='PENDING_VALIDATION' && (
                            <>
                              <button onClick={() => handleValidateObjective(selectedAthlete.id, term, obj.id, true)} className="text-green-500 text-xs border border-green-500/30 px-2 py-0.5 rounded">✓</button>
                              <button onClick={() => handleValidateObjective(selectedAthlete.id, term, obj.id, false)} className="text-red-500 text-xs border border-red-500/30 px-2 py-0.5 rounded">✕</button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── PROGRAMMING ──────────────────────────────────────── */}
      {activeTab === 'PROGRAMMING' && (
        <div className="px-6 space-y-6 animate-in fade-in">
          {!selectedAthlete ? (
            <div className="space-y-4">
              <h3 className="font-display text-white uppercase text-xl mb-4">Programmer une séance</h3>
              {athletes.map(ath => (
                <GlassCard key={ath.id} onClick={() => setSelectedAthlete(ath)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5">
                  <span className="text-white font-bold">{ath.firstName} {ath.lastName}</span>
                  <span className="text-nexus-gray">→</span>
                </GlassCard>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => { setSelectedAthlete(null); setProgramQueue([]); }} className="text-nexus-gray hover:text-white">←</button>
                <div>
                  <span className="font-display text-xl text-nexus-gold uppercase block">{selectedAthlete.firstName}</span>
                  <span className="text-[10px] text-nexus-gray uppercase">Nouvelle Programmation</span>
                </div>
              </div>
              <GlassCard className="p-6 border-t-2 border-t-nexus-gold/50">
                <h3 className="font-display text-lg text-white mb-6 uppercase tracking-wider">Ajouter un exercice</h3>
                <div className="space-y-4">
                  <input placeholder="Nom (ex: Back Squat)" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-nexus-gold outline-none" value={exerciseForm.name||''} onChange={e=>setExerciseForm({...exerciseForm,name:e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Séries" type="number" className="bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-nexus-gold outline-none" value={exerciseForm.sets||''} onChange={e=>setExerciseForm({...exerciseForm,sets:parseInt(e.target.value)})} />
                    <input placeholder="Reps" className="bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-nexus-gold outline-none" value={exerciseForm.reps||''} onChange={e=>setExerciseForm({...exerciseForm,reps:e.target.value})} />
                    <input placeholder="Tempo (3010)" className="bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-nexus-gold outline-none" value={exerciseForm.tempo||''} onChange={e=>setExerciseForm({...exerciseForm,tempo:e.target.value})} />
                    <input placeholder="Repos" className="bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-nexus-gold outline-none" value={exerciseForm.rest||''} onChange={e=>setExerciseForm({...exerciseForm,rest:e.target.value})} />
                    <input placeholder="Charge Cible" className="col-span-2 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-nexus-gold outline-none" value={exerciseForm.targetLoad||''} onChange={e=>setExerciseForm({...exerciseForm,targetLoad:e.target.value})} />
                  </div>
                </div>
                <div className="mt-6">
                  <Button variant="secondary" fullWidth onClick={addToQueue} disabled={!exerciseForm.name}>+ Ajouter à la liste</Button>
                </div>
              </GlassCard>
              {programQueue.length>0 && (
                <div className="space-y-3 pb-20">
                  <h4 className="text-xs text-nexus-gray uppercase font-bold tracking-widest pl-2">Séance ({programQueue.length})</h4>
                  {programQueue.map((ex, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center group hover:bg-white/10 transition-colors">
                      <div>
                        <span className="font-display text-white block uppercase tracking-wide">{ex.name}</span>
                        <span className="text-xs text-nexus-gold font-mono">{ex.sets}x{ex.reps} @ {ex.tempo}</span>
                      </div>
                      <button onClick={() => setProgramQueue(programQueue.filter((_,i)=>i!==idx))} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">✕</button>
                    </div>
                  ))}
                  <div className="pt-6">
                    <Button fullWidth onClick={sendProgram} className="shadow-[0_0_20px_rgba(229,46,1,0.4)]">CONFIRMER L'ENVOI</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── DATA ─────────────────────────────────────────────── */}
      {activeTab === 'DATA' && (
        <DataView athletes={athletes} onUpdate={async () => { const data = await getAthletes(); setAthletes(data); }} />
      )}

      {/* ─── BOTTOM NAV ───────────────────────────────────────── */}
      <nav className="fixed bottom-0 w-full px-6 pb-6 pt-2 z-40 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-between items-center p-2 shadow-2xl pointer-events-auto max-w-lg mx-auto overflow-x-auto">
          {[{tab:'HOME',icon:'🏠',label:'Accueil'},{tab:'ATTENDANCE',icon:'📝',label:'Présence'},{tab:'PLANNING',icon:'📅',label:'Semainier'},{tab:'OBJECTIVES',icon:'🎯',label:'Objectifs'},{tab:'PROGRAMMING',icon:'💪',label:'Prog'},{tab:'DATA',icon:'📊',label:'Data'}].map(item => (
            <button key={item.tab} onClick={() => setActiveTab(item.tab as any)} className={`flex flex-col items-center p-2 min-w-[50px] ${activeTab===item.tab?'text-nexus-gold':'text-nexus-gray hover:text-white'}`}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-[8px] uppercase font-bold mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};