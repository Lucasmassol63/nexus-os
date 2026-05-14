import React, { useState, useEffect, useCallback } from 'react';
import { getAthletes, addObjective, updateObjectiveStatus } from '../../services/athleteService';
import {
  getWeeklySchedule, addEvent, deleteEvent, getWeekEventAthletes, setEventAthletes,
  getNextMatch, getAllMatches, createMatch, deleteMatch, updateMatch,
  submitAttendance, assignWorkout,
  getAllAppointments, getPendingAppointmentsCount, addAppointment, deleteAppointment,
  confirmAppointment, declineAppointment,
} from '../../services/scheduleService';
import { Athlete, Exercise, Match, DaySchedule, AttendanceStatus, ScheduleEvent, EventType, Appointment } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { DataView } from './DataView';
import { PlanningView } from './PlanningView';
import { AthleteProfileCoach } from './AthleteProfileCoach';

interface CoachDashboardProps { onLogout: () => void; }

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0,0,0,0); return d;
};
const fmt = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
const fmtShort = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.getDate().toString().padStart(2,'0') + '/' + (d.getMonth()+1).toString().padStart(2,'0');
};

const WATER_THEMES = ["Speed","Hit","CA 0/CA 1","CA 2/CA 3","Technical individual","Shoot","Duel","Point defense","Pass","Leg","Tactical","Zone/Pressing","Z+/Z-","Counter-attack","Match"];
const MUSCU_THEMES = ["Mobility","Prevention","Gainage","Hypertrophy","Strength","Force","Cardio crossfit"];

const EV_COLORS: Record<string, string> = {
  'WATER-POLO': 'bg-blue-600 border-blue-500/50',
  'MUSCU':      'bg-red-600 border-red-500/50',
  'MATCH':      'bg-yellow-500 border-yellow-400',
  'KINE':       'bg-green-600 border-green-500/50',
  'MENTAL':     'bg-purple-600 border-purple-500/50',
  'VIDEO':      'bg-indigo-500 border-indigo-400/50',
  'MEETING':    'bg-gray-600 border-gray-500/50',
  'ENTRETIEN':  'bg-orange-500 border-orange-400/50',
  'SLOT_LIBRE': 'bg-white/10 border-white/20',
};
const evColor = (type: EventType) => EV_COLORS[type] || 'bg-gray-700';

export const CoachDashboard: React.FC<CoachDashboardProps> = ({ onLogout }) => {
  type MainTab = 'HOME' | 'PLANNING' | 'EFFECTIF' | 'PLANIFICATION';
  type PlanningTab = 'PRESENCES' | 'SEMAINIER' | 'MATCHS' | 'RDV';

  const [mainTab, setMainTab]         = useState<MainTab>('HOME');
  const [planningTab, setPlanningTab] = useState<PlanningTab>('SEMAINIER');

  const [athletes, setAthletes]       = useState<Athlete[]>([]);
  const [nextMatch, setNextMatch]     = useState<Match | null>(null);
  const [allMatches, setAllMatches]   = useState<Match[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([]);
  const [eventAthletes, setEventAthletesState] = useState<Record<string, string[]>>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));

  // UI
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [profileAthlete, setProfileAthlete]   = useState<Athlete | null>(null);  // full profile
  const [planningDayIdx, setPlanningDayIdx]   = useState(0);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedEventDetail, setSelectedEventDetail] = useState<{event:ScheduleEvent,dayDate:string}|null>(null);
  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({ type:'WATER-POLO', startTime:'18:00', endTime:'19:30', title:'', description:'', isVisibleToAthletes:true, intensity:5 });
  const [newEventAthleteIds, setNewEventAthleteIds] = useState<string[]>([]);

  const [attendanceDate, setAttendanceDate]           = useState(new Date().toISOString().split('T')[0]);
  const [attendanceEventId, setAttendanceEventId]     = useState<string|null>(null);
  const [attendanceSessionType, setAttendanceSessionType] = useState<EventType|null>(null);
  const [attendanceSession, setAttendanceSession]     = useState<Record<string,string>>({});

  const [matchForm, setMatchForm]   = useState<Partial<Match>>({ opponent:'', date:'', time:'20:00', isHome:true, location:'' });
  const [editingMatchId, setEditingMatchId] = useState<string|null>(null);
  const [newAptForm, setNewAptForm] = useState({ date:'', time:'09:00', coachName:'Coach Head' });

  const [effectifSubTab, setEffectifSubTab] = useState<'LISTE'|'DATA'>('LISTE');
  const [compareMode, setCompareMode]       = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // Présence detail modal
  const [presenceDetail, setPresenceDetail] = useState<'WATER'|'DRY'|null>(null);

  const [programQueue, setProgramQueue] = useState<Exercise[]>([]);
  const [exerciseForm, setExerciseForm] = useState<Partial<Exercise>>({});

  // ─── LOAD ──────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    const [ath, match, matches, count] = await Promise.all([
      getAthletes(), getNextMatch(), getAllMatches(), getPendingAppointmentsCount(),
    ]);
    setAthletes(ath); setNextMatch(match); setAllMatches(matches); setPendingCount(count);
  }, []);

  const loadSchedule = useCallback(async () => {
    const offset = currentWeekStart.getTimezoneOffset();
    const adj = new Date(currentWeekStart.getTime() - offset*60*1000);
    const dateStr = adj.toISOString().split('T')[0];
    const [sched, ea] = await Promise.all([getWeeklySchedule(dateStr), getWeekEventAthletes(dateStr)]);
    setWeeklySchedule(sched); setEventAthletesState(ea);
  }, [currentWeekStart]);

  const loadAppointments = useCallback(async () => {
    const [apts, count] = await Promise.all([getAllAppointments(), getPendingAppointmentsCount()]);
    setAppointments(apts); setPendingCount(count);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { loadSchedule(); }, [loadSchedule]);
  useEffect(() => { if (mainTab==='PLANNING' && planningTab==='RDV') loadAppointments(); }, [mainTab, planningTab]);

  // ─── COMPUTED ──────────────────────────────────────────────
  const availablePlayers = athletes.filter(a => !a.monitoring.waterHistory.some(d => d.attendance==='INJURED'));

  const getWeeklyAvgRpe = (ath: Athlete) => {
    const rpes = [...ath.monitoring.waterHistory,...ath.monitoring.dryHistory].slice(-7).map(d=>d.rpe).filter(r=>r>0);
    return rpes.length ? (rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1) : '-';
  };

  const getAlerts = () => {
    const out: {athlete:Athlete,reason:string}[] = [];
    athletes.forEach(ath => {
      const rpes = [...ath.monitoring.waterHistory,...ath.monitoring.dryHistory]
        .sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime())
        .slice(0,4).map(d=>d.rpe).filter(r=>r>0);
      const avg = rpes.length ? rpes.reduce((a,b)=>a+b,0)/rpes.length : 0;
      if (avg > 9) out.push({athlete:ath, reason:'RPE Moyen > 9'});
      const comment = ath.lastCheckIn?.comment?.toLowerCase() || '';
      if (comment.match(/douleur|mal|blessure/)) out.push({athlete:ath, reason:`Alerte check-in`});
    });
    return out;
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch(status) {
      case 'PRESENT':            return { label:'Présent',  color:'text-green-500',  bg:'bg-green-500/20' };
      case 'INJURED':            return { label:'Blessé',   color:'text-orange-500', bg:'bg-orange-500/20' };
      case 'ABSENT_JUSTIFIED':   return { label:'Excusé',   color:'text-blue-400',   bg:'bg-blue-400/20' };
      case 'ABSENT_UNJUSTIFIED': return { label:'Absent',   color:'text-red-500',    bg:'bg-red-500/20' };
      default:                   return { label:'-',        color:'text-gray-400',   bg:'bg-gray-400/10' };
    }
  };

  const getSessionsForDate = (date: string) => weeklySchedule.find(d=>d.date===date)?.events ?? [];

  const getAttendanceAthletes = () => {
    if (!attendanceEventId) return athletes;
    const assigned = eventAthletes[attendanceEventId];
    if (!assigned?.length) return athletes;
    return athletes.filter(a => assigned.includes(a.id));
  };

  const getPresenceStats = (type: 'WATER'|'DRY') => {
    return athletes.map(ath => {
      const h = type==='WATER' ? ath.monitoring.waterHistory : ath.monitoring.dryHistory;
      const total = h.length;
      const present = h.filter(d=>d.attendance==='PRESENT').length;
      const pct = total > 0 ? Math.round((present/total)*100) : 0;
      return { athlete: ath, total, present, pct };
    }).sort((a,b) => b.pct - a.pct);
  };

  // ─── HANDLERS ──────────────────────────────────────────────
  const handleAddEvent = async () => {
    if (!newEvent.title) return;
    const day = weeklySchedule[planningDayIdx];
    const ev: Omit<ScheduleEvent,'id'> = {
      type: newEvent.type as EventType, startTime: newEvent.startTime||'18:00',
      endTime: newEvent.endTime||'19:00', title: newEvent.title||'',
      description: newEvent.description||'', intensity: newEvent.intensity||5,
      isVisibleToAthletes: newEvent.isVisibleToAthletes !== undefined ? newEvent.isVisibleToAthletes : true,
    };
    const id = await addEvent(day.date, ev);
    if (newEventAthleteIds.length > 0) await setEventAthletes(id, newEventAthleteIds);
    setShowAddEventModal(false);
    setNewEvent({type:'WATER-POLO',startTime:'18:00',endTime:'19:30',title:'',description:'',isVisibleToAthletes:true,intensity:5});
    setNewEventAthleteIds([]);
    await loadSchedule();
  };

  const handleSaveMatch = async () => {
    if (!matchForm.opponent || !matchForm.date) return;
    const m: Omit<Match,'id'> = { opponent:matchForm.opponent!, date:matchForm.date!, time:matchForm.time||'20:00', isHome:matchForm.isHome??true, location:matchForm.location||'' };
    editingMatchId ? await updateMatch(editingMatchId, m) : await createMatch(m);
    await loadAll();
    setMatchForm({opponent:'',date:'',time:'20:00',isHome:true,location:''}); setEditingMatchId(null);
  };

  // ── FIX : valider appel pour TOUTE activité ──────────────
  const handleSubmitAttendance = async () => {
    if (!attendanceSessionType) { alert('Sélectionnez une séance.'); return; }
    const isWater = ['WATER-POLO','MATCH'].includes(attendanceSessionType);
    await submitAttendance(isWater?'WATER':'DRY', attendanceSession);
    alert('Appel validé !'); setAttendanceSession({});
  };

  const handleValidateObj = async (objId: string, approved: boolean) => {
    await updateObjectiveStatus(objId, approved ? 'VALIDATED' : 'ACTIVE');
    const data = await getAthletes(); setAthletes(data);
  };

  const handleAddObjective = async (athleteId: string) => {
    const t = prompt('1=Court Terme, 2=Moyen Terme, 3=Long Terme','1');
    if (!t) return;
    const type = t==='2'?'mediumTerm':t==='3'?'longTerm':'shortTerm';
    const label = prompt('Objectif :');
    if (label) { await addObjective(athleteId, type as any, label); const d = await getAthletes(); setAthletes(d); }
  };

  const addToQueue = () => {
    if (!exerciseForm.name) return;
    setProgramQueue([...programQueue, { id:Math.random().toString(), name:exerciseForm.name, sets:exerciseForm.sets||3, reps:exerciseForm.reps||'10', tempo:exerciseForm.tempo||'3010', rest:exerciseForm.rest||'60s', targetLoad:exerciseForm.targetLoad||'-' }]);
    setExerciseForm({});
  };

  const sendProgram = async () => {
    if (!selectedAthlete) return;
    await assignWorkout(selectedAthlete.id, { date:new Date().toISOString().split('T')[0], title:'Séance Coach', type:'MUSCU', contentJson:JSON.stringify(programQueue) });
    alert(`Programme envoyé à ${selectedAthlete.firstName} !`); setProgramQueue([]);
  };

  const prevWeek = () => { const d=new Date(currentWeekStart); d.setDate(d.getDate()-7); setCurrentWeekStart(d); };
  const nextWeek = () => { const d=new Date(currentWeekStart); d.setDate(d.getDate()+7); setCurrentWeekStart(d); };
  const WeekNav = () => (
    <div className="flex items-center rounded-lg px-2 py-1" style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}}>
      <button onClick={prevWeek} className="p-1.5 hover:text-white" style={{color:'#8B9BB4'}}>←</button>
      <span className="text-xs font-bold text-white px-2">{fmtShort(currentWeekStart.toISOString())}</span>
      <button onClick={nextWeek} className="p-1.5 hover:text-white" style={{color:'#8B9BB4'}}>→</button>
    </div>
  );

  const alerts = getAlerts();

  // ── Si un profil est ouvert → le montrer en priorité ──────
  if (profileAthlete) {
    return (
      <AthleteProfileCoach
        athlete={profileAthlete}
        onClose={() => setProfileAthlete(null)}
        onUpdate={async () => { const d = await getAthletes(); setAthletes(d); if (profileAthlete) { const updated = d.find(a=>a.id===profileAthlete.id); if (updated) setProfileAthlete(updated); }}}
      />
    );
  }

  return (
    <div className="pb-28 relative min-h-screen">

      <header className="px-6 pt-10 pb-4 flex justify-between items-center sticky top-0 z-20 backdrop-blur-sm bg-gradient-to-b from-black/90 to-transparent">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wider">CNM <span style={{color:'#E8B800'}}>HUB</span></h1>
          <p className="text-[10px] tracking-[0.2em] uppercase mt-0.5" style={{color:'#8B9BB4'}}>Interface Coaching</p>
        </div>
        <button onClick={onLogout} className="w-10 h-10 rounded-full flex items-center justify-center border font-bold transition-colors hover:bg-red-500 hover:text-white"
          style={{background:'rgba(232,184,0,0.1)',border:'1px solid rgba(232,184,0,0.3)',color:'#E8B800'}}>HC</button>
      </header>

      {/* ══ HOME ══════════════════════════════════════════════ */}
      {mainTab === 'HOME' && (
        <div className="px-6 space-y-6 animate-in fade-in">

          <GlassCard onClick={() => setMainTab('EFFECTIF')} className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 border-l-4 border-l-green-500 active:scale-95 transition-all">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-display text-green-500">{availablePlayers.length}</span>
                <span className="text-xl font-display" style={{color:'#8B9BB4'}}>/ {athletes.length}</span>
              </div>
              <span className="text-xs uppercase tracking-widest font-bold" style={{color:'#8B9BB4'}}>Joueurs Disponibles</span>
            </div>
            <div className="text-right">
              <span className="text-2xl">👥</span>
              <p className="text-[10px] mt-1" style={{color:'#E8B800'}}>Voir effectif →</p>
            </div>
          </GlassCard>

          <GlassCard onClick={() => { setMainTab('PLANNING'); setPlanningTab('MATCHS'); }} className="p-0 overflow-hidden cursor-pointer hover:brightness-110 transition-all border-yellow-500/30">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-black/80"></div>
            <div className="relative z-10 p-5">
              {nextMatch ? (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{color:'#8B9BB4'}}>PROCHAIN MATCH</p>
                      <h3 className="font-display text-2xl text-white uppercase italic">VS {nextMatch.opponent}</h3>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-4xl" style={{color:'#E8B800'}}>J-{Math.ceil((new Date(nextMatch.date).getTime()-new Date().getTime())/(1000*3600*24))}</span>
                      <p className="text-[10px] mt-0.5" style={{color:'rgba(232,184,0,0.6)'}}>Gérer →</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm border-t border-white/10 pt-3">
                    <span style={{color:'#8B9BB4'}}>{new Date(nextMatch.date).toLocaleDateString()}</span>
                    <span style={{color:'#E8B800'}}>•</span>
                    <span className="text-white">{nextMatch.time}</span>
                    {nextMatch.location && <><span style={{color:'#E8B800'}}>•</span><span className="text-xs" style={{color:'#8B9BB4'}}>{nextMatch.location}</span></>}
                    <span className={`ml-auto px-2 py-0.5 rounded text-xs font-bold uppercase ${nextMatch.isHome?'bg-white/10 text-white':'bg-red-500/20 text-red-400'}`}>{nextMatch.isHome?'DOM':'EXT'}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-3">
                  <p className="text-sm" style={{color:'#8B9BB4'}}>Aucun match programmé</p>
                  <p className="text-xs mt-1" style={{color:'#E8B800'}}>+ Ajouter →</p>
                </div>
              )}
            </div>
          </GlassCard>

          {alerts.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{color:'#ef4444'}}>⚠️ Alertes Joueurs</h3>
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <div key={i} onClick={() => setProfileAthlete(a.athlete)}
                    className="p-3 rounded-xl flex justify-between items-center cursor-pointer" style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)'}}>
                    <span className="text-white font-bold text-sm">{a.athlete.firstName} {a.athlete.lastName}</span>
                    <span className="text-[10px] px-2 py-1 rounded font-bold uppercase" style={{background:'#ef4444',color:'white'}}>{a.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── APERÇU SEMAINE — RPE toujours lisible ── */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{color:'#8B9BB4'}}>Aperçu Semaine</h3>
              <WeekNav />
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-2 min-w-[500px]">
                {weeklySchedule.map((day, dIdx) => (
                  <div key={dIdx} className="flex-1 min-w-[65px]">
                    <div className="text-center mb-1 cursor-pointer rounded-lg p-1 hover:bg-white/5"
                      onClick={() => { setPlanningDayIdx(dIdx); setMainTab('PLANNING'); setPlanningTab('SEMAINIER'); }}>
                      <div className="text-[9px] font-bold uppercase" style={{color:'#8B9BB4'}}>{day.dayName.substring(0,3)}</div>
                      <div className="text-xs font-bold text-white">{day.date.split('-')[2]}</div>
                    </div>
                    <div className="space-y-1 min-h-[50px]">
                      {day.events.length === 0 && <div className="border border-white/5 rounded-lg min-h-[36px]"></div>}
                      {day.events.map((ev, eIdx) => (
                        <div key={eIdx} onClick={() => { setPlanningDayIdx(dIdx); setMainTab('PLANNING'); setPlanningTab('SEMAINIER'); }}
                          className={`rounded-lg p-1.5 text-[8px] leading-tight cursor-pointer hover:brightness-125 ${evColor(ev.type)} text-white`}>
                          <div className="font-bold">{ev.startTime}</div>
                          <div className="truncate">{ev.title||ev.type}</div>
                          {/* ── RPE toujours lisible : fond sombre ── */}
                          <div className="mt-0.5 px-1 rounded text-[7px] font-bold text-white inline-block"
                            style={{background:'rgba(0,0,0,0.55)'}}>
                            RPE {ev.intensity}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── CARTES PRÉSENCE CLIQUABLES ── */}
          <div className="grid grid-cols-2 gap-3 pb-4">
            {[
              {label:'Water-Polo', type:'WATER' as const, color:'#3b82f6'},
              {label:'Musculation', type:'DRY'  as const, color:'#ef4444'},
            ].map(s => {
              let total=0, present=0;
              athletes.forEach(a => { const h = s.type==='WATER'?a.monitoring.waterHistory:a.monitoring.dryHistory; h.slice(-7).forEach(d => { total++; if(d.attendance==='PRESENT') present++; }); });
              const pct = total>0?Math.round((present/total)*100):0;
              return (
                <div key={s.type} onClick={() => setPresenceDetail(s.type)}
                  className="rounded-2xl p-4 cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                  style={{background:'rgba(0,0,0,0.3)',border:`1px solid ${s.color}30`}}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold uppercase" style={{color:s.color}}>{s.label}</h4>
                    <span className="text-[9px]" style={{color:s.color}}>Détails →</span>
                  </div>
                  <span className="font-display text-3xl text-white">{pct}%</span>
                  <p className="text-[9px] uppercase tracking-wider mt-1" style={{color:'#8B9BB4'}}>Présence Hebdo</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ PLANNING ══════════════════════════════════════════ */}
      {mainTab === 'PLANNING' && (
        <div className="animate-in fade-in">
          {/* Sub-tabs */}
          <div className="flex gap-1 px-4 pb-4 overflow-x-auto scrollbar-hide">
            {([
              {id:'PRESENCES', label:'📝 Présences'},
              {id:'SEMAINIER', label:'📅 Semainier'},
              {id:'MATCHS',    label:'🏆 Matchs'},
              {id:'RDV',       label:'🗓 RDV', badge:pendingCount},
            ] as {id:PlanningTab,label:string,badge?:number}[]).map(t => (
              <button key={t.id} onClick={() => { setPlanningTab(t.id); if(t.id==='RDV') loadAppointments(); }}
                className="relative flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all"
                style={{background:planningTab===t.id?'#E8B800':'rgba(255,255,255,0.05)',color:planningTab===t.id?'#0B1628':'#8B9BB4'}}>
                {t.label}
                {/* ── FIX badge : ne montre que si > 0 ── */}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center" style={{background:'#ef4444',color:'white'}}>{t.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Présences */}
          {planningTab === 'PRESENCES' && (
            <div className="px-4">
              <div className="rounded-3xl p-5" style={{background:'rgba(26,58,122,0.2)',border:'1px solid rgba(232,184,0,0.15)'}}>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="font-display text-xl font-bold uppercase" style={{color:'#E8B800'}}>📋 Appel</h2>
                  <input type="date" value={attendanceDate} onChange={e => { setAttendanceDate(e.target.value); setAttendanceEventId(null); setAttendanceSessionType(null); }}
                    className="rounded-lg px-3 py-1.5 text-white text-sm outline-none" style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} />
                </div>
                <div className="mb-5">
                  <p className="text-[10px] uppercase font-bold mb-2" style={{color:'#8B9BB4'}}>Choisir la séance</p>
                  <div className="flex flex-wrap gap-2">
                    {getSessionsForDate(attendanceDate).length === 0 ? (
                      <p className="text-xs italic" style={{color:'#8B9BB4'}}>Aucune séance ce jour.</p>
                    ) : getSessionsForDate(attendanceDate).map(ev => {
                      const assigned = eventAthletes[ev.id];
                      const count = assigned?.length>0?assigned.length:athletes.length;
                      return (
                        <button key={ev.id} onClick={() => { setAttendanceSessionType(ev.type); setAttendanceEventId(ev.id); setAttendanceSession({}); }}
                          className="px-3 py-2 rounded-lg text-xs font-bold uppercase flex flex-col items-start transition-all"
                          style={{background:attendanceEventId===ev.id?'rgba(232,184,0,0.2)':'rgba(255,255,255,0.05)',border:attendanceEventId===ev.id?'1px solid #E8B800':'1px solid rgba(255,255,255,0.1)',color:attendanceEventId===ev.id?'#E8B800':'#8B9BB4'}}>
                          <span>{ev.type} — {ev.startTime}</span>
                          <span className="text-[9px] font-normal opacity-70">{ev.title} • {count} joueur{count>1?'s':''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {attendanceEventId ? (
                  <div className="space-y-2">
                    {getAttendanceAthletes().map(ath => (
                      <div key={ath.id} className="p-3 rounded-xl flex items-center justify-between" style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.05)'}}>
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{ath.gamification.selectedSkin}</span>
                          <div>
                            <span className="text-white font-bold text-sm block">{ath.firstName} {ath.lastName}</span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${attendanceSession[ath.id]?getStatusLabel(attendanceSession[ath.id] as AttendanceStatus).color+' '+getStatusLabel(attendanceSession[ath.id] as AttendanceStatus).bg:'text-gray-500 bg-gray-500/10'}`}>
                              {attendanceSession[ath.id]?getStatusLabel(attendanceSession[ath.id] as AttendanceStatus).label:'Non marqué'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[{s:'PRESENT',e:'✓',col:'green'},{s:'INJURED',e:'🤕',col:'orange'},{s:'ABSENT_JUSTIFIED',e:'📋',col:'blue'},{s:'ABSENT_UNJUSTIFIED',e:'✕',col:'red'}].map(btn => (
                            <button key={btn.s} onClick={() => setAttendanceSession(p=>({...p,[ath.id]:btn.s}))}
                              className={`w-9 h-9 rounded-lg text-sm border flex items-center justify-center transition-all ${attendanceSession[ath.id]===btn.s?'bg-white/20 border-white text-white scale-110':`text-${btn.col}-500 border-${btn.col}-500/30`}`}>{btn.e}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button onClick={handleSubmitAttendance} className="w-full mt-4 py-3 rounded-xl font-bold uppercase tracking-widest" style={{background:'linear-gradient(135deg,#E8B800,#F5D000)',color:'#0B1628'}}>
                      VALIDER L'APPEL ({getAttendanceAthletes().filter(a=>attendanceSession[a.id]).length}/{getAttendanceAthletes().length})
                    </button>
                  </div>
                ) : <p className="text-center py-8 italic text-sm" style={{color:'#8B9BB4'}}>Sélectionnez une séance pour faire l'appel.</p>}
              </div>
            </div>
          )}

          {/* Semainier */}
          {planningTab === 'SEMAINIER' && (
            <div className="px-4">
              <div className="rounded-3xl p-5" style={{background:'rgba(26,58,122,0.2)',border:'1px solid rgba(232,184,0,0.15)'}}>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="font-display text-xl font-bold uppercase" style={{color:'#E8B800'}}>📅 Semainier</h2>
                  <WeekNav />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
                  {weeklySchedule.map((day, idx) => (
                    <button key={idx} onClick={() => setPlanningDayIdx(idx)}
                      className="min-w-[58px] p-2 rounded-xl flex flex-col items-center transition-all"
                      style={{background:idx===planningDayIdx?'#E8B800':'rgba(0,0,0,0.3)',border:idx===planningDayIdx?'1px solid #E8B800':'1px solid rgba(255,255,255,0.08)',color:idx===planningDayIdx?'#0B1628':'#8B9BB4',transform:idx===planningDayIdx?'scale(1.05)':'scale(1)'}}>
                      <span className="text-[10px] font-bold uppercase">{day.dayName.substring(0,3)}</span>
                      <span className="text-base font-bold">{day.date.split('-')[2]}</span>
                      {day.events.length>0 && <span className="text-[8px] opacity-70">{day.events.length}s</span>}
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl p-4 min-h-[200px]" style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.05)'}}>
                  <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                    <h3 className="font-display text-lg uppercase" style={{color:'#E8B800'}}>{weeklySchedule[planningDayIdx]?.dayName}</h3>
                    <button onClick={() => setShowAddEventModal(true)} className="text-xs px-3 py-1.5 rounded-lg font-bold" style={{background:'#22c55e',color:'white'}}>+ Ajouter</button>
                  </div>
                  <div className="space-y-3">
                    {weeklySchedule[planningDayIdx]?.events.length === 0 && <p className="text-center italic py-8 text-sm" style={{color:'#8B9BB4'}}>Aucun créneau.</p>}
                    {weeklySchedule[planningDayIdx]?.events.map((ev, idx) => {
                      const assigned = eventAthletes[ev.id];
                      const count = assigned?.length>0?assigned.length:athletes.length;
                      return (
                        <div key={idx} onClick={() => setSelectedEventDetail({event:ev,dayDate:weeklySchedule[planningDayIdx].date})}
                          className={`rounded-xl p-3 border-l-4 relative group cursor-pointer hover:brightness-110 transition-all ${evColor(ev.type)}`}>
                          <button onClick={e => { e.stopPropagation(); deleteEvent(ev.id).then(loadSchedule); }} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-sm">✕</button>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold uppercase bg-black/40 px-2 py-0.5 rounded text-white">{ev.type}</span>
                            <div className="flex items-center gap-1.5">
                              {/* RPE lisible : fond sombre */}
                              <span className="px-2 py-0.5 rounded text-xs font-display font-bold text-white" style={{background:'rgba(0,0,0,0.55)'}}>{ev.intensity} RPE</span>
                              <span className="text-xs font-mono text-white">{ev.startTime}-{ev.endTime}</span>
                            </div>
                          </div>
                          <h4 className="text-white font-bold text-sm uppercase">{ev.title}</h4>
                          {ev.description && <p className="text-[10px] text-gray-300 mt-1 italic">{ev.description}</p>}
                          <p className="text-[9px] mt-2 opacity-70 text-white">👥 {count} joueur{count>1?'s':''} • Voir détails →</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Matchs */}
          {planningTab === 'MATCHS' && (
            <div className="px-4 space-y-4 pb-8">
              <div className="rounded-2xl p-5" style={{background:'rgba(26,58,122,0.2)',border:'1px solid rgba(232,184,0,0.15)'}}>
                <h3 className="font-display text-lg uppercase mb-4" style={{color:'#E8B800'}}>{editingMatchId?'✏️ Modifier':'+ Nouveau Match'}</h3>
                <div className="space-y-3">
                  <input placeholder="Adversaire" className="w-full rounded-xl p-3 text-white outline-none text-sm" style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} value={matchForm.opponent||''} onChange={e=>setMatchForm({...matchForm,opponent:e.target.value})} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" className="rounded-xl p-3 text-white outline-none text-sm" style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} value={matchForm.date||''} onChange={e=>setMatchForm({...matchForm,date:e.target.value})} />
                    <input type="time" className="rounded-xl p-3 text-white outline-none text-sm" style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} value={matchForm.time||'20:00'} onChange={e=>setMatchForm({...matchForm,time:e.target.value})} />
                  </div>
                  <input placeholder="Lieu" className="w-full rounded-xl p-3 text-white outline-none text-sm" style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} value={matchForm.location||''} onChange={e=>setMatchForm({...matchForm,location:e.target.value})} />
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)'}}>
                    <span className="text-sm font-bold text-white uppercase">Domicile</span>
                    <div onClick={() => setMatchForm({...matchForm,isHome:!matchForm.isHome})} className={`w-12 h-6 rounded-full p-1 cursor-pointer ${matchForm.isHome?'bg-green-500':'bg-gray-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${matchForm.isHome?'translate-x-6':'translate-x-0'}`}></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveMatch} disabled={!matchForm.opponent||!matchForm.date} className="flex-1 py-3 rounded-xl font-bold uppercase text-sm" style={{background:'linear-gradient(135deg,#E8B800,#F5D000)',color:'#0B1628',opacity:(!matchForm.opponent||!matchForm.date)?0.5:1}}>{editingMatchId?'Modifier':'Ajouter'}</button>
                    {editingMatchId && <button onClick={() => { setEditingMatchId(null); setMatchForm({opponent:'',date:'',time:'20:00',isHome:true,location:''}); }} className="px-4 py-3 rounded-xl font-bold text-sm" style={{background:'rgba(255,255,255,0.08)',color:'#8B9BB4'}}>Annuler</button>}
                  </div>
                </div>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest px-1" style={{color:'#8B9BB4'}}>Matchs à venir</h3>
              {allMatches.length===0 && <p className="text-center italic text-sm py-4" style={{color:'#8B9BB4'}}>Aucun match programmé.</p>}
              {allMatches.map(m => (
                <div key={m.id} className="p-4 rounded-xl flex justify-between items-center" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div>
                    <span className="text-white font-bold uppercase block">VS {m.opponent}</span>
                    <span className="text-xs" style={{color:'#8B9BB4'}}>{new Date(m.date).toLocaleDateString()} • {m.time} • {m.isHome?'Domicile':'Extérieur'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setMatchForm({opponent:m.opponent,date:m.date,time:m.time,isHome:m.isHome,location:m.location}); setEditingMatchId(m.id); }} className="text-xs px-2 py-1 rounded border" style={{borderColor:'rgba(232,184,0,0.3)',color:'#E8B800'}}>✏️</button>
                    <button onClick={() => { if(confirm('Supprimer ?')) deleteMatch(m.id).then(loadAll); }} className="text-xs px-2 py-1 rounded border" style={{borderColor:'rgba(239,68,68,0.3)',color:'#ef4444'}}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* RDV */}
          {planningTab === 'RDV' && (
            <div className="px-4 space-y-5 pb-8">
              <div className="rounded-2xl p-5" style={{background:'rgba(26,58,122,0.2)',border:'1px solid rgba(232,184,0,0.2)'}}>
                <h3 className="font-display text-lg uppercase mb-4" style={{color:'#E8B800'}}>+ Nouveau Créneau</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" className="rounded-xl p-3 text-white outline-none text-sm" style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} value={newAptForm.date} onChange={e=>setNewAptForm({...newAptForm,date:e.target.value})} />
                    <input type="time" className="rounded-xl p-3 text-white outline-none text-sm" style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} value={newAptForm.time} onChange={e=>setNewAptForm({...newAptForm,time:e.target.value})} />
                  </div>
                  <select className="w-full rounded-xl p-3 text-white outline-none text-sm" style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} value={newAptForm.coachName} onChange={e=>setNewAptForm({...newAptForm,coachName:e.target.value})}>
                    <option>Coach Head</option><option>Coach Physio</option><option>Coach Mental</option><option>Staff Médical</option>
                  </select>
                  <button onClick={async () => { if(!newAptForm.date) return; await addAppointment(newAptForm); setNewAptForm({date:'',time:'09:00',coachName:'Coach Head'}); await loadAppointments(); }} disabled={!newAptForm.date} className="w-full py-3 rounded-xl font-bold uppercase text-sm" style={{background:newAptForm.date?'linear-gradient(135deg,#E8B800,#F5D000)':'rgba(255,255,255,0.08)',color:newAptForm.date?'#0B1628':'#8B9BB4'}}>Créer le créneau</button>
                </div>
              </div>

              {appointments.filter(a=>a.status==='PENDING_VALIDATION').length>0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{color:'#f97316'}}>
                    ⏳ En attente de validation
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{background:'#ef4444',color:'white'}}>{appointments.filter(a=>a.status==='PENDING_VALIDATION').length}</span>
                  </h3>
                  <div className="space-y-3">
                    {appointments.filter(a=>a.status==='PENDING_VALIDATION').map(apt => {
                      const ath = athletes.find(a=>a.id===apt.bookedBy);
                      return (
                        <div key={apt.id} className="p-4 rounded-2xl" style={{background:'rgba(249,115,22,0.1)',border:'1px solid rgba(249,115,22,0.3)'}}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{ath?.gamification.selectedSkin||'🐣'}</span>
                            <div>
                              <span className="text-white font-bold block">{ath?`${ath.firstName} ${ath.lastName}`:'Joueur'}</span>
                              <span className="text-xs" style={{color:'#E8B800'}}>{fmt(apt.date)} • {apt.time} • {apt.coachName}</span>
                            </div>
                          </div>
                          {apt.reason && <p className="text-sm italic mb-3 px-3 py-2 rounded-lg" style={{background:'rgba(0,0,0,0.3)',color:'#C8D4E8'}}>"{apt.reason}"</p>}
                          <div className="flex gap-2">
                            <button onClick={async () => { await confirmAppointment(apt.id); await loadAppointments(); await loadSchedule(); }} className="flex-1 py-2 rounded-xl font-bold text-sm uppercase" style={{background:'rgba(34,197,94,0.2)',border:'1px solid rgba(34,197,94,0.4)',color:'#22c55e'}}>✓ Confirmer</button>
                            <button onClick={async () => { await declineAppointment(apt.id); await loadAppointments(); }} className="flex-1 py-2 rounded-xl font-bold text-sm uppercase" style={{background:'rgba(239,68,68,0.2)',border:'1px solid rgba(239,68,68,0.4)',color:'#ef4444'}}>✕ Refuser</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#8B9BB4'}}>Créneaux Disponibles</h3>
                {appointments.filter(a=>a.status==='AVAILABLE').length===0 ? <p className="text-center italic text-sm py-4" style={{color:'#8B9BB4'}}>Aucun créneau disponible.</p> : appointments.filter(a=>a.status==='AVAILABLE').map(apt => (
                  <div key={apt.id} className="p-3 rounded-xl mb-2 flex justify-between items-center" style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)'}}>
                    <div>
                      <span className="text-white font-bold block">{apt.time}</span>
                      <span className="text-xs" style={{color:'#8B9BB4'}}>{fmt(apt.date)} • {apt.coachName}</span>
                    </div>
                    <button onClick={async () => { await deleteAppointment(apt.id); await loadAppointments(); }} className="text-xs px-2 py-1 rounded border" style={{borderColor:'rgba(239,68,68,0.3)',color:'#ef4444'}}>🗑</button>
                  </div>
                ))}
              </div>

              {appointments.filter(a=>a.status==='CONFIRMED').length>0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#22c55e'}}>✅ RDV Confirmés</h3>
                  {appointments.filter(a=>a.status==='CONFIRMED').map(apt => {
                    const ath = athletes.find(a=>a.id===apt.bookedBy);
                    return (
                      <div key={apt.id} className="p-3 rounded-xl mb-2 flex justify-between items-center" style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)'}}>
                        <div>
                          <span className="text-white font-bold">{ath?`${ath.firstName} ${ath.lastName}`:'-'}</span>
                          <span className="text-xs block" style={{color:'#8B9BB4'}}>{fmt(apt.date)} • {apt.time}</span>
                          {apt.reason && <span className="text-[10px] italic" style={{color:'#8B9BB4'}}>{apt.reason}</span>}
                        </div>
                        <span className="text-xs font-bold" style={{color:'#22c55e'}}>✓</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ EFFECTIF ══════════════════════════════════════════ */}
      {mainTab === 'EFFECTIF' && (
        <div className="animate-in fade-in">
          <div className="flex gap-2 px-4 pb-4">
            {[{id:'LISTE',label:'👥 Joueurs'},{id:'DATA',label:'📊 Data'}].map(t => (
              <button key={t.id} onClick={() => setEffectifSubTab(t.id as any)} className="flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all"
                style={{background:effectifSubTab===t.id?'#E8B800':'rgba(255,255,255,0.05)',color:effectifSubTab===t.id?'#0B1628':'#8B9BB4'}}>{t.label}</button>
            ))}
          </div>

          {effectifSubTab === 'LISTE' && (
            <div className="px-4 space-y-3 pb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{color:'#8B9BB4'}}>Effectif ({athletes.length} joueurs)</h3>
                <button onClick={() => { setCompareMode(!compareMode); setSelectedForCompare([]); }} className="text-xs px-3 py-1.5 rounded-lg font-bold uppercase" style={{background:compareMode?'rgba(232,184,0,0.2)':'rgba(255,255,255,0.08)',color:compareMode?'#E8B800':'#8B9BB4',border:compareMode?'1px solid rgba(232,184,0,0.4)':'1px solid rgba(255,255,255,0.1)'}}>{compareMode?'✓ Mode Comparaison':'⚖ Comparer'}</button>
              </div>

              {compareMode && selectedForCompare.length>=2 && (
                <div className="rounded-2xl p-4" style={{background:'rgba(232,184,0,0.08)',border:'1px solid rgba(232,184,0,0.25)'}}>
                  <h4 className="text-sm font-bold uppercase mb-3" style={{color:'#E8B800'}}>Comparaison ({selectedForCompare.length} joueurs)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-white/10">
                        {['Joueur','RPE Moy.','Présence','Buts','Excl.'].map(h => <th key={h} className="py-1 font-bold text-left pr-4" style={{color:'#8B9BB4'}}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {athletes.filter(a=>selectedForCompare.includes(a.id)).map(ath => {
                          const rpes = [...ath.monitoring.waterHistory,...ath.monitoring.dryHistory].slice(-14).map(d=>d.rpe).filter(r=>r>0);
                          const avgR = rpes.length?(rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1):'-';
                          const allH = [...ath.monitoring.waterHistory,...ath.monitoring.dryHistory];
                          const pct = allH.length?Math.round((allH.filter(d=>d.attendance==='PRESENT').length/allH.length)*100):0;
                          return (
                            <tr key={ath.id} className="border-b border-white/5">
                              <td className="py-2 text-white font-bold pr-4">{ath.firstName}</td>
                              <td className="py-2 pr-4" style={{color:parseFloat(avgR)>8?'#ef4444':'#22c55e'}}>{avgR}</td>
                              <td className="py-2 text-white pr-4">{pct}%</td>
                              <td className="py-2 text-white pr-4">{ath.stats.goals}</td>
                              <td className="py-2 text-white">{ath.stats.exclusions}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {athletes.map(ath => {
                const isInjured = ath.monitoring.waterHistory.some(d=>d.attendance==='INJURED');
                const isSelected = selectedForCompare.includes(ath.id);
                return (
                  <div key={ath.id}
                    onClick={() => compareMode
                      ? setSelectedForCompare(prev=>isSelected?prev.filter(id=>id!==ath.id):[...prev,ath.id])
                      : setProfileAthlete(ath)  // ← ouvre le profil complet
                    }
                    className="p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all active:scale-98"
                    style={{background:isSelected?'rgba(232,184,0,0.15)':'rgba(255,255,255,0.05)',border:`1px solid ${isSelected?'rgba(232,184,0,0.4)':isInjured?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.08)'}`}}>
                    <div className="flex items-center gap-3">
                      {compareMode && (
                        <div className="w-5 h-5 rounded border-2 flex items-center justify-center" style={{borderColor:isSelected?'#E8B800':'rgba(255,255,255,0.3)',background:isSelected?'#E8B800':'transparent'}}>{isSelected&&<span className="text-[9px] font-bold" style={{color:'#0B1628'}}>✓</span>}</div>
                      )}
                      <span className="text-2xl">{ath.gamification.selectedSkin}</span>
                      <div>
                        <span className="text-white font-bold block uppercase">{ath.firstName} {ath.lastName}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] uppercase font-bold ${isInjured?'text-red-400':'text-green-400'}`}>{isInjured?'BLESSÉ':'APTE'}</span>
                          {ath.team_category && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{background:'rgba(232,184,0,0.15)',color:'#E8B800'}}>{ath.team_category}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-display text-xl block ${parseFloat(getWeeklyAvgRpe(ath) as string)>8?'text-red-400':'text-white'}`}>{getWeeklyAvgRpe(ath)}</span>
                      <span className="text-[9px] uppercase" style={{color:'#8B9BB4'}}>RPE • Profil →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {effectifSubTab === 'DATA' && (
            <DataView athletes={athletes} onUpdate={async () => { const d=await getAthletes(); setAthletes(d); }} />
          )}
        </div>
      )}

      {/* ══ PLANIFICATION ══════════════════════════════════════════════ */}
      {mainTab === 'PLANIFICATION' && (
        <PlanningView weeklySchedule={weeklySchedule} />
      )}

      {/* ══ MODALS PARTAGÉS ═══════════════════════════════════ */}

      {/* Détail événement */}
      {selectedEventDetail && (
        <div className="fixed inset-0 z-[70] backdrop-blur-xl flex flex-col animate-in zoom-in-95 duration-200" style={{background:'rgba(11,22,40,0.98)'}}>
          <div className={`p-5 flex justify-between items-center border-b border-white/10 ${evColor(selectedEventDetail.event.type)}`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{selectedEventDetail.event.type}</span>
              <h2 className="font-display text-2xl text-white uppercase">{selectedEventDetail.event.title}</h2>
            </div>
            <button onClick={() => setSelectedEventDetail(null)} className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{background:'rgba(0,0,0,0.3)'}}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="rounded-2xl p-4 space-y-3" style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div className="flex justify-between"><span className="text-xs uppercase font-bold" style={{color:'#8B9BB4'}}>Horaires</span><span className="text-white font-mono">{selectedEventDetail.event.startTime} — {selectedEventDetail.event.endTime}</span></div>
              <div className="flex justify-between"><span className="text-xs uppercase font-bold" style={{color:'#8B9BB4'}}>Date</span><span className="text-white font-bold">{fmt(selectedEventDetail.dayDate)}</span></div>
              {selectedEventDetail.event.description && <div><span className="text-xs uppercase font-bold block mb-1" style={{color:'#8B9BB4'}}>Détails</span><p className="text-white text-sm italic border-l-2 border-yellow-500 pl-3">{selectedEventDetail.event.description}</p></div>}
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-xs uppercase font-bold" style={{color:'#8B9BB4'}}>RPE Prédictif</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">{Array.from({length:10}).map((_,i)=><div key={i} className={`w-2 h-2 rounded-full ${i<(selectedEventDetail.event.intensity||0)?'bg-yellow-400':'bg-white/10'}`}></div>)}</div>
                  <span className="font-display text-lg font-bold" style={{color:'#E8B800'}}>{selectedEventDetail.event.intensity}/10</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#8B9BB4'}}>Joueurs assignés</h3>
              {(() => {
                const assigned = eventAthletes[selectedEventDetail.event.id];
                const list = assigned?.length>0?athletes.filter(a=>assigned.includes(a.id)):[];
                return list.length>0 ? (
                  <div className="space-y-2">{list.map(ath => (<div key={ath.id} className="p-3 rounded-xl flex items-center gap-3" style={{background:'rgba(255,255,255,0.05)'}}><span className="text-2xl">{ath.gamification.selectedSkin}</span><div><span className="text-white font-bold block">{ath.firstName} {ath.lastName}</span><span className="text-[10px] uppercase" style={{color:'#8B9BB4'}}>{ath.type}</span></div></div>))}</div>
                ) : <p className="text-sm italic text-center py-3" style={{color:'#8B9BB4'}}>Tous les joueurs sont concernés</p>;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── PRÉSENCE DETAIL MODAL ── */}
      {presenceDetail && (
        <div className="fixed inset-0 z-[70] backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300" style={{background:'rgba(8,15,30,0.97)'}}>
          <div className="p-5 flex justify-between items-center border-b border-white/10 sticky top-0" style={{background:'rgba(8,15,30,0.95)'}}>
            <div>
              <h2 className="font-display text-2xl text-white uppercase">{presenceDetail==='WATER'?'Water-Polo':'Musculation'}</h2>
              <p className="text-[10px] uppercase tracking-wider" style={{color:'#8B9BB4'}}>Taux de présence par joueur</p>
            </div>
            <button onClick={() => setPresenceDetail(null)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{background:'rgba(255,255,255,0.08)',color:'white'}}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3 pb-10">
            {/* Stat globale */}
            {(() => {
              let total=0, present=0;
              athletes.forEach(a => {
                const h = presenceDetail==='WATER'?a.monitoring.waterHistory:a.monitoring.dryHistory;
                h.forEach(d => { total++; if(d.attendance==='PRESENT') present++; });
              });
              const pct = total>0?Math.round((present/total)*100):0;
              const color = presenceDetail==='WATER'?'#3b82f6':'#ef4444';
              return (
                <div className="rounded-2xl p-5 mb-2" style={{background:`${color}15`,border:`1px solid ${color}30`}}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-display text-5xl font-bold text-white">{pct}%</div>
                      <div className="text-xs uppercase tracking-widest mt-1" style={{color:'#8B9BB4'}}>Taux global équipe</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{present}/{total}</div>
                      <div className="text-xs uppercase" style={{color:'#8B9BB4'}}>séances présentes</div>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.1)'}}>
                    <div className="h-full rounded-full" style={{width:`${pct}%`,background:color,transition:'width 1s ease'}}></div>
                  </div>
                </div>
              );
            })()}

            {/* Classement par joueur */}
            <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{color:'#8B9BB4'}}>Classement par joueur</h3>
            {getPresenceStats(presenceDetail).map((s, i) => {
              const color = presenceDetail==='WATER'?'#3b82f6':'#ef4444';
              const pctColor = s.pct>=80?'#22c55e':s.pct>=60?'#f97316':'#ef4444';
              return (
                <div key={s.athlete.id} className="rounded-xl p-3" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{background:'rgba(255,255,255,0.1)',color:'#8B9BB4'}}>#{i+1}</div>
                    <span className="text-xl">{s.athlete.gamification.selectedSkin}</span>
                    <span className="text-white font-bold text-sm flex-1">{s.athlete.firstName} {s.athlete.lastName}</span>
                    <span className="font-display font-bold text-lg" style={{color:pctColor}}>{s.pct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.08)'}}>
                      <div className="h-full rounded-full transition-all duration-700" style={{width:`${s.pct}%`,background:pctColor}}></div>
                    </div>
                    <span className="text-[9px] flex-shrink-0" style={{color:'#8B9BB4'}}>{s.present}/{s.total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Ajouter Créneau */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in zoom-in-95" style={{background:'rgba(0,0,0,0.9)'}}>
          <div className="w-full max-w-md rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{background:'#0D1F3C',border:'1px solid rgba(232,184,0,0.3)'}}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display text-xl text-white uppercase">Ajouter Créneau</h3>
              <button onClick={() => setShowAddEventModal(false)} style={{color:'#8B9BB4'}}>✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold mb-1 block" style={{color:'#8B9BB4'}}>Type</label>
                <select className="w-full rounded-xl p-3 text-white outline-none text-sm" style={{background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.1)'}} value={newEvent.type} onChange={e=>setNewEvent({...newEvent,type:e.target.value as EventType,title:''})}>
                  <option value="WATER-POLO">Water-Polo</option><option value="MUSCU">Musculation</option><option value="MATCH">Match</option><option value="KINE">Kiné</option><option value="MENTAL">Prépa Mentale</option><option value="VIDEO">Analyse Vidéo</option><option value="MEETING">Réunion</option><option value="ENTRETIEN">Entretien</option><option value="SLOT_LIBRE">Créneaux Staff</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase font-bold mb-1 block" style={{color:'#8B9BB4'}}>Début</label><input type="time" className="w-full rounded-xl p-3 text-white outline-none text-sm" style={{background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.1)'}} value={newEvent.startTime} onChange={e=>setNewEvent({...newEvent,startTime:e.target.value})} /></div>
                <div><label className="text-[10px] uppercase font-bold mb-1 block" style={{color:'#8B9BB4'}}>Fin</label><input type="time" className="w-full rounded-xl p-3 text-white outline-none text-sm" style={{background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.1)'}} value={newEvent.endTime} onChange={e=>setNewEvent({...newEvent,endTime:e.target.value})} /></div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold mb-1 block" style={{color:'#8B9BB4'}}>Thème</label>
                {newEvent.type==='WATER-POLO'?<select className="w-full rounded-xl p-3 text-white outline-none text-sm" style={{background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.1)'}} value={newEvent.title} onChange={e=>setNewEvent({...newEvent,title:e.target.value})}><option value="" disabled>Choisir</option>{WATER_THEMES.map(t=><option key={t} value={t}>{t}</option>)}</select>:newEvent.type==='MUSCU'?<select className="w-full rounded-xl p-3 text-white outline-none text-sm" style={{background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.1)'}} value={newEvent.title} onChange={e=>setNewEvent({...newEvent,title:e.target.value})}><option value="" disabled>Choisir</option>{MUSCU_THEMES.map(t=><option key={t} value={t}>{t}</option>)}</select>:<input placeholder="ex: Bilan..." className="w-full rounded-xl p-3 text-white outline-none text-sm" style={{background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.1)'}} value={newEvent.title} onChange={e=>setNewEvent({...newEvent,title:e.target.value})} />}
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold mb-1 block" style={{color:'#8B9BB4'}}>RPE Prédictif ({newEvent.intensity})</label>
                <input type="range" min="1" max="10" step="1" value={newEvent.intensity||5} onChange={e=>setNewEvent({...newEvent,intensity:parseInt(e.target.value)})} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{accentColor:'#E8B800'}} />
                <div className="flex justify-between text-[8px] uppercase mt-1" style={{color:'#8B9BB4'}}><span>Faible</span><span>Moyen</span><span>Intense</span></div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold mb-1 block" style={{color:'#8B9BB4'}}>Détails</label>
                <textarea rows={2} className="w-full rounded-xl p-3 text-white outline-none text-sm resize-none" style={{background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.1)'}} value={newEvent.description} onChange={e=>setNewEvent({...newEvent,description:e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold mb-2 block" style={{color:'#8B9BB4'}}>Joueurs ({newEventAthleteIds.length===0?'Tous':newEventAthleteIds.length+' sélectionné'+(newEventAthleteIds.length>1?'s':'')})</label>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  <button onClick={() => setNewEventAthleteIds([])} className="w-full text-left text-xs px-3 py-2 rounded-lg border" style={{background:newEventAthleteIds.length===0?'rgba(232,184,0,0.15)':'rgba(255,255,255,0.05)',border:newEventAthleteIds.length===0?'1px solid rgba(232,184,0,0.4)':'1px solid rgba(255,255,255,0.08)',color:newEventAthleteIds.length===0?'#E8B800':'#8B9BB4'}}>🌍 Toute l'équipe</button>
                  {athletes.map(ath => { const sel=newEventAthleteIds.includes(ath.id); return (
                    <div key={ath.id} onClick={() => setNewEventAthleteIds(prev=>sel?prev.filter(id=>id!==ath.id):[...prev,ath.id])} className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer" style={{background:sel?'rgba(232,184,0,0.15)':'rgba(255,255,255,0.05)',border:sel?'1px solid rgba(232,184,0,0.4)':'1px solid rgba(255,255,255,0.08)'}}>
                      <div className="w-4 h-4 rounded border-2 flex items-center justify-center" style={{borderColor:sel?'#E8B800':'rgba(255,255,255,0.3)',background:sel?'#E8B800':'transparent'}}>{sel&&<span className="text-[9px] font-bold" style={{color:'#0B1628'}}>✓</span>}</div>
                      <span className="text-base">{ath.gamification.selectedSkin}</span>
                      <span className="text-sm font-bold" style={{color:sel?'#E8B800':'white'}}>{ath.firstName} {ath.lastName}</span>
                    </div>
                  ); })}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <span className="text-sm font-bold text-white uppercase">Visible par les joueurs</span>
                <div onClick={() => setNewEvent({...newEvent,isVisibleToAthletes:!newEvent.isVisibleToAthletes})} className={`w-12 h-6 rounded-full p-1 cursor-pointer ${newEvent.isVisibleToAthletes?'bg-green-500':'bg-gray-700'}`}><div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${newEvent.isVisibleToAthletes?'translate-x-6':'translate-x-0'}`}></div></div>
              </div>
              <button onClick={handleAddEvent} disabled={!newEvent.title} className="w-full py-3 rounded-xl font-bold uppercase text-sm" style={{background:newEvent.title?'linear-gradient(135deg,#E8B800,#F5D000)':'rgba(255,255,255,0.08)',color:newEvent.title?'#0B1628':'#8B9BB4',opacity:!newEvent.title?0.5:1}}>Ajouter au Planning</button>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV — 4 onglets, sans cercle/dot parasite ── */}
      <nav className="fixed bottom-0 w-full px-4 pb-6 pt-2 z-40 pointer-events-none">
        <div className="backdrop-blur-xl border border-white/10 rounded-2xl flex justify-around items-center p-2 shadow-2xl pointer-events-auto max-w-lg mx-auto" style={{background:'rgba(11,22,40,0.92)'}}>
          {([
            { tab:'HOME',          icon:'🏠', label:'Accueil' },
            { tab:'PLANNING',      icon:'📅', label:'Planning',  badge: pendingCount },
            { tab:'EFFECTIF',      icon:'👥', label:'Effectif' },
            { tab:'PLANIFICATION', icon:'💪', label:'Planif' },
          ] as {tab:string,icon:string,label:string,badge?:number}[]).map(item => (
            <button key={item.tab} onClick={() => { setMainTab(item.tab as MainTab); setSelectedAthlete(null); }}
              className="relative flex flex-col items-center p-2 min-w-[60px] transition-all"
              style={{color:mainTab===item.tab?'#E8B800':'#8B9BB4'}}>
              {/* ── FIX: badge uniquement si > 0, pas de 0 affiché ── */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center z-10" style={{background:'#ef4444',color:'white'}}>{item.badge}</span>
              )}
              <span className="text-xl">{item.icon}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest mt-1">{item.label}</span>
              {/* ── FIX: suppression du dot actif et du cercle parasite ── */}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};