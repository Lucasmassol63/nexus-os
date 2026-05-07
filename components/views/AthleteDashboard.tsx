import React, { useState, useEffect } from 'react';
import { Athlete, WorkoutSession, Match, AttendanceStatus, Appointment, DaySchedule, EventType } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { RadarPerf } from '../charts/RadarPerf';
import { CareView } from './CareView';
import { NutritionView } from './NutritionView';
import { ProfileView } from './ProfileView';
import { CheckInView } from './CheckInView';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getAthleteSessions, getNextMatch, getAppointments, bookAppointment } from '../../services/scheduleService';
import { getAthleteWeeklySchedule } from '../../services/scheduleService';
import { sendMessage } from '../../services/scheduleService';

// ─── HELPERS ─────────────────────────────────────────────────
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

const getEventTypeColor = (type: EventType) => {
  switch(type) {
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

interface AthleteDashboardProps {
  athlete: Athlete;
  onLogout: () => void;
}

export const AthleteDashboard: React.FC<AthleteDashboardProps> = ({ athlete, onLogout }) => {
  const [sessions, setSessions]       = useState<WorkoutSession[]>([]);
  const [nextMatch, setNextMatch]     = useState<Match | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab]     = useState<'HOME'|'NUTRITION'|'CARE'|'CHECKIN'|'PROFILE'>('HOME');

  const [weekSchedule, setWeekSchedule]         = useState<DaySchedule[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));

  // UI states
  const [showRadarModal, setShowRadarModal]         = useState(false);
  const [activeDayAgenda, setActiveDayAgenda]       = useState<{date:string,events:any[]}|null>(null);
  const [historyModal, setHistoryModal]             = useState<{type:'WATER'|'DRY'|'BODY'|null}>({type:null});
  const [statDetail, setStatDetail]                 = useState<{title:string,val:number,desc:string}|null>(null);
  const [showMessageModal, setShowMessageModal]     = useState(false);
  const [messageSent, setMessageSent]               = useState(false);
  const [messageSubject, setMessageSubject]         = useState('');
  const [messageContent, setMessageContent]         = useState('');
  const [sendingMessage, setSendingMessage]         = useState(false);

  // ─── DATA LOADING ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const [s, m, a] = await Promise.all([
        getAthleteSessions(athlete.id),
        getNextMatch(),
        getAppointments(),
      ]);
      setSessions(s); setNextMatch(m); setAppointments(a);
    };
    load();
  }, [athlete.id, activeTab]);

  useEffect(() => {
    const load = async () => {
      const offset = currentWeekStart.getTimezoneOffset();
      const adj = new Date(currentWeekStart.getTime() - offset*60*1000);
      const dateStr = adj.toISOString().split('T')[0];
      const schedule = await getAthleteWeeklySchedule(dateStr, athlete.id);
      setWeekSchedule(schedule);
    };
    load();
  }, [currentWeekStart, athlete.id]);

  const handlePrevWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate()-7); setCurrentWeekStart(d); };
  const handleNextWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate()+7); setCurrentWeekStart(d); };

  const getDaysBeforeMatch = (dateStr: string) =>
    Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000*3600*24));

  const getAttendanceLabel = (status: AttendanceStatus) => {
    switch(status) {
      case 'PRESENT':             return { text:'PRÉSENT',          color:'text-green-500',    bg:'bg-green-500/20' };
      case 'ABSENT_JUSTIFIED':    return { text:'ABSENT JUSTIFIÉ',  color:'text-nexus-gold',   bg:'bg-nexus-gold/20' };
      case 'ABSENT_UNJUSTIFIED':  return { text:'ABSENT INJUSTIFIÉ',color:'text-red-500',      bg:'bg-red-500/20' };
      case 'INJURED':             return { text:'BLESSÉ',           color:'text-blue-500',     bg:'bg-blue-500/20' };
      default:                    return { text:'-',                 color:'text-gray-500',     bg:'bg-gray-500/20' };
    }
  };

  const getWeightDomain = () => {
    const vals = athlete.monitoring.weight.map(w => w.value);
    if (!vals.length) return ['auto','auto'];
    return [Math.floor(Math.min(...vals)-5), Math.ceil(Math.max(...vals)+5)];
  };

  const hasUpcomingAppointment = appointments.some(a => {
    if (a.bookedBy !== athlete.id) return false;
    const diff = new Date(a.date).getTime() - new Date().getTime();
    return diff >= 0 && diff <= 86400000;
  });

  const hasRewardsToClaim =
    [...athlete.structuredObjectives.shortTerm,
     ...athlete.structuredObjectives.mediumTerm,
     ...athlete.structuredObjectives.longTerm].some(o => o.status === 'VALIDATED');

  const showNotificationBadge = hasRewardsToClaim || hasUpcomingAppointment;
  const animalIcon = athlete.gamification.selectedSkin || '🐣';

  // ─── MESSAGE ──────────────────────────────────────────────
  const submitMessage = async () => {
    if (!messageSubject || !messageContent) return;
    setSendingMessage(true);
    try {
      await sendMessage(athlete.id, messageSubject, messageContent);
      setMessageSent(true);
      setMessageSubject(''); setMessageContent('');
      setTimeout(() => { setShowMessageModal(false); setMessageSent(false); }, 2500);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDayClick = (day: DaySchedule) => {
    setActiveDayAgenda({ date: day.date, events: day.events.filter(e => e.isVisibleToAthletes) });
  };

  // ─── WEEK NAVIGATOR ───────────────────────────────────────
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

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="pb-32 relative min-h-screen">

      {/* Header */}
      <div className="p-6 pt-10 flex justify-between items-end bg-gradient-to-b from-black/90 to-transparent sticky top-0 z-30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div onClick={() => setActiveTab('PROFILE')} className="w-12 h-12 rounded-full bg-white/10 border-2 border-nexus-gold p-0.5 cursor-pointer hover:scale-105 transition-transform overflow-hidden relative flex items-center justify-center bg-black">
            <span className="text-2xl">{animalIcon}</span>
            {showNotificationBadge && <div className="absolute top-0 right-0 w-3 h-3 bg-nexus-red rounded-full border-2 border-black animate-pulse"></div>}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-white tracking-wide uppercase leading-none">{athlete.firstName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-bold text-nexus-gold tracking-widest uppercase">{athlete.type} SQUAD</span>
            </div>
          </div>
        </div>
        <div onClick={onLogout} className="cursor-pointer opacity-80 hover:opacity-100 mb-1">
          <svg className="w-6 h-6 text-nexus-gray hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
      </div>

      {/* ─── HOME ──────────────────────────────────────────── */}
      {activeTab === 'HOME' && (
        <div className="px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {hasUpcomingAppointment && (
            <GlassCard className="p-3 border-l-4 border-l-purple-500 flex items-center gap-3 animate-pulse cursor-pointer" onClick={() => setActiveTab('PROFILE')}>
              <span className="text-2xl">🗓️</span>
              <div>
                <span className="text-white font-bold text-sm uppercase block">N'oubliez pas votre rendez-vous</span>
                <span className="text-[10px] text-nexus-gray">Consultez votre agenda profil</span>
              </div>
            </GlassCard>
          )}

          <GlassCard className="p-4 flex items-center justify-between cursor-pointer border-l-4 border-l-nexus-red hover:bg-white/5 active:scale-95 transition-all" onClick={() => setShowMessageModal(true)}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-nexus-red/20 text-nexus-red flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <div>
                <span className="block font-display text-white text-lg uppercase leading-none mb-1">Message Staff</span>
                <span className="text-[10px] text-nexus-gray uppercase tracking-widest">Feedback / Confidentiel</span>
              </div>
            </div>
            <div className="text-nexus-red text-xl">→</div>
          </GlassCard>

          {/* Agenda semaine */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs text-nexus-gray font-bold uppercase tracking-widest pl-1">Agenda Semaine</h4>
              <WeekNavigator />
            </div>
            <div className="overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
              <div className="flex gap-2 min-w-[500px]">
                {weekSchedule.map((day, dIdx) => (
                  <div key={dIdx} className="flex-1 min-w-[65px]" onClick={() => handleDayClick(day)}>
                    <div className="text-center mb-1 cursor-pointer hover:bg-white/5 rounded-lg p-1">
                      <div className="text-[9px] font-bold text-nexus-gray uppercase">{day.dayName.substring(0,3)}</div>
                      <div className="text-xs text-white font-bold">{day.date.split('-')[2]}</div>
                    </div>
                    <div className="space-y-1 min-h-[60px]">
                      {day.events.length === 0 && <div className="h-8 border border-white/5 rounded-lg"></div>}
                      {day.events.map((ev, eIdx) => (
                        <div key={eIdx} className={`rounded-lg p-1.5 text-[8px] leading-tight cursor-pointer ${getEventTypeColor(ev.type)} text-white`}>
                          <div className="font-bold">{ev.startTime}</div>
                          <div className="truncate">{ev.title||ev.type}</div>
                          <div className="text-[7px] opacity-70">RPE {ev.intensity}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Prochain match */}
          {nextMatch && (
            <GlassCard className="p-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-black/80 z-0"></div>
              <div className="relative z-10 p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-nexus-gray text-[10px] font-bold uppercase tracking-widest mb-1">PROCHAIN MATCH</p>
                    <h3 className="font-display text-3xl text-white uppercase italic leading-none">VS {nextMatch.opponent}</h3>
                  </div>
                  <span className="block font-display text-4xl text-nexus-gold">J-{getDaysBeforeMatch(nextMatch.date)}</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <span className="text-nexus-gray">{new Date(nextMatch.date).toLocaleDateString()}</span>
                    <span className="text-nexus-red">•</span>
                    <span>{nextMatch.time}</span>
                  </div>
                  <div className={`px-3 py-1 rounded text-xs font-bold uppercase ${nextMatch.isHome?'bg-white/10 text-white':'bg-nexus-red/20 text-nexus-red'}`}>
                    {nextMatch.isHome?'DOMICILE':'EXTÉRIEUR'}
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Stats saison */}
          <div>
            <h4 className="text-xs text-nexus-gray font-bold uppercase tracking-widest mb-3 pl-1">Saison</h4>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label:'Matchs', val:athlete.stats.matchesPlayed, color:'text-nexus-gold',   border:'border-nexus-gold' },
                { label:'Buts',   val:athlete.stats.goals,         color:'text-emerald-500', border:'border-emerald-500' },
                { label:'Fautes', val:athlete.stats.fouls,         color:'text-orange-500',  border:'border-orange-500' },
                { label:'Excl',   val:athlete.stats.exclusions,    color:'text-nexus-red',   border:'border-nexus-red' },
              ].map((s,i) => (
                <div key={i} onClick={() => setStatDetail({title:s.label,val:s.val,desc:s.label})} className={`bg-black/40 border ${s.border} rounded-xl p-3 text-center aspect-square flex flex-col items-center justify-center cursor-pointer active:scale-95`}>
                  <span className={`font-display text-3xl ${s.color}`}>{s.val}</span>
                  <span className={`text-[8px] ${s.color} uppercase font-bold tracking-widest mt-1`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monitoring */}
          <div className="space-y-3">
            <h4 className="text-xs text-nexus-gray font-bold uppercase tracking-widest mb-1 pl-1">Suivi & Performance</h4>
            <div className="grid grid-cols-2 gap-4">
              <GlassCard onClick={() => setHistoryModal({type:'WATER'})} className="p-4 flex flex-col justify-between h-40 bg-gradient-to-br from-blue-900/20 to-transparent border-blue-500/30 cursor-pointer hover:bg-blue-900/20">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  </div>
                  <span className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">EAU</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl text-white">{athlete.monitoring.waterRpe}</span>
                    <span className="text-xs text-nexus-gray">RPE</span>
                  </div>
                  <div className="text-xs text-blue-400 font-bold mt-1">{athlete.monitoring.waterAttendance}% Présence</div>
                </div>
              </GlassCard>

              <GlassCard onClick={() => setHistoryModal({type:'DRY'})} className="p-4 flex flex-col justify-between h-40 bg-gradient-to-br from-nexus-red/20 to-transparent border-nexus-red/30 cursor-pointer hover:bg-nexus-red/20">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 rounded bg-nexus-red/20 text-nexus-red flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                  </div>
                  <span className="text-[10px] text-nexus-red uppercase font-bold tracking-widest">DRY</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl text-white">{athlete.monitoring.dryRpe}</span>
                    <span className="text-xs text-nexus-gray">RPE</span>
                  </div>
                  <div className="text-xs text-nexus-red font-bold mt-1">{athlete.monitoring.dryAttendance}% Présence</div>
                </div>
              </GlassCard>

              <GlassCard onClick={() => setHistoryModal({type:'BODY'})} className="p-4 flex flex-col justify-between h-40 cursor-pointer hover:bg-white/5">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 rounded bg-gray-700/50 text-white flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">CORPS</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl text-white">
                      {athlete.monitoring.weight.length > 0 ? athlete.monitoring.weight[athlete.monitoring.weight.length-1].value : '--'}
                    </span>
                    <span className="text-xs text-nexus-gray">KG</span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-gray-400 font-bold mt-1 uppercase">
                    <span>{athlete.monitoring.height} cm</span>
                    <span className="text-nexus-red">•</span>
                    <span>{athlete.age} ans</span>
                  </div>
                </div>
              </GlassCard>

              <GlassCard onClick={() => setShowRadarModal(true)} className="p-4 flex flex-col justify-between h-40 bg-gradient-to-br from-nexus-gold/10 to-transparent border-nexus-gold/30 cursor-pointer hover:bg-nexus-gold/10 transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 rounded bg-nexus-gold/20 text-nexus-gold flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <span className="text-[10px] text-nexus-gold uppercase font-bold tracking-widest">PERFS</span>
                </div>
                <div className="relative">
                  <div className="opacity-50 scale-75 origin-bottom-left -ml-2">
                    <RadarPerf data={athlete.performance.dry.slice(0,3)} color="#FF0055" />
                  </div>
                  <div className="absolute bottom-0 left-0 text-[10px] text-nexus-gold uppercase font-bold">Voir Détails →</div>
                </div>
              </GlassCard>
            </div>
          </div>

        </div>
      )}

      {/* ─── TABS ──────────────────────────────────────────── */}
      {activeTab === 'CARE' && <CareView athlete={athlete} />}
      {activeTab === 'NUTRITION' && <NutritionView athlete={athlete} />}
      {activeTab === 'PROFILE' && <ProfileView athlete={athlete} />}
      {activeTab === 'CHECKIN' && (
        <CheckInView athlete={athlete} onDone={() => setActiveTab('HOME')} />
      )}

      {/* ─── MESSAGE MODAL ─────────────────────────────────── */}
      {showMessageModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
          <GlassCard className="w-full max-w-md p-6 border-nexus-red/30 relative">
            <button onClick={() => { setShowMessageModal(false); setMessageSent(false); }} className="absolute top-4 right-4 text-nexus-gray hover:text-white">✕</button>
            <h2 className="font-display text-2xl text-white uppercase mb-1">Message au Staff</h2>
            <p className="text-[10px] text-nexus-gray uppercase tracking-widest mb-6">Confidentiel · Blessures · Ressenti</p>

            {messageSent ? (
              <div className="text-center py-8 animate-in zoom-in-95">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-display text-xl text-white uppercase mb-2">Message Envoyé !</h3>
                <p className="text-sm text-nexus-gray">Le staff a reçu ton message en toute confidentialité.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white uppercase mb-2">Sujet</label>
                  <select className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none" value={messageSubject} onChange={e => setMessageSubject(e.target.value)}>
                    <option value="" disabled>Choisir un sujet...</option>
                    <option>Blessure / Douleur</option>
                    <option>Retour de Match</option>
                    <option>Moral / Mental</option>
                    <option>Nutrition / Poids</option>
                    <option>Demande de RDV</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white uppercase mb-2">Message</label>
                  <textarea className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none h-32 resize-none" placeholder="Exprime-toi librement..." value={messageContent} onChange={e => setMessageContent(e.target.value)} />
                </div>
                <Button fullWidth onClick={submitMessage} disabled={sendingMessage || !messageSubject || !messageContent}>
                  {sendingMessage ? 'Envoi...' : 'Envoyer au Staff'}
                </Button>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* ─── AGENDA DAY MODAL ──────────────────────────────── */}
      {activeDayAgenda && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-6 flex justify-between items-center border-b border-white/10 bg-black/80">
            <h2 className="font-display text-2xl text-white uppercase">
              {new Date(activeDayAgenda.date).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
            </h2>
            <button onClick={() => setActiveDayAgenda(null)} className="text-nexus-gray font-bold">Fermer</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeDayAgenda.events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-nexus-gray">
                <span className="text-4xl mb-2">😴</span>
                <p className="font-display uppercase tracking-widest">Jour de Repos</p>
              </div>
            ) : activeDayAgenda.events.map((ev, idx) => (
              <div key={idx} className="flex gap-4 border-b border-white/5 pb-4 last:border-0">
                <div className="w-12 text-right">
                  <span className="text-white font-mono font-bold block">{ev.startTime}</span>
                  <span className="text-nexus-gray text-[10px]">{ev.endTime}</span>
                </div>
                <div className={`flex-1 p-3 rounded-lg relative overflow-hidden ${getEventTypeColor(ev.type)} bg-opacity-10 border border-opacity-30`}>
                  <span className="font-bold uppercase tracking-wide block mb-1 text-sm text-white">{ev.type}</span>
                  <span className="text-white font-bold block uppercase">{ev.title}</span>
                  {ev.description && <p className="text-xs text-gray-400 mt-1 italic">{ev.description}</p>}
                  {ev.intensity && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[8px] text-gray-500 uppercase">RPE Prévu</span>
                      <span className="font-bold text-nexus-gold">{ev.intensity}/10</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── HISTORY MODAL ─────────────────────────────────── */}
      {historyModal.type && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
          <div className="p-6 flex justify-between items-center border-b border-white/10 bg-black">
            <h2 className="font-display text-2xl text-white uppercase">Historique {historyModal.type}</h2>
            <button onClick={() => setHistoryModal({type:null})} className="text-white text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-8">
            <div className="h-64 w-full">
              <h4 className="text-xs text-nexus-gray font-bold uppercase tracking-widest mb-4 text-center">Évolution</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={
                  historyModal.type === 'BODY'  ? athlete.monitoring.weight.map(w => ({name:w.date,value:w.value})) :
                  historyModal.type === 'WATER' ? athlete.monitoring.waterHistory.map(h => ({name:h.date,value:h.rpe})) :
                  athlete.monitoring.dryHistory.map(h => ({name:h.date,value:h.rpe}))
                }>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#555" tick={{fill:'#9CA3AF',fontSize:10}} />
                  <YAxis stroke="#555" tick={{fill:'#9CA3AF',fontSize:10}} domain={historyModal.type==='BODY'?getWeightDomain():[0,10]} />
                  <RechartsTooltip contentStyle={{backgroundColor:'#000',border:'1px solid #333'}} />
                  <Line type="monotone" dataKey="value" stroke={historyModal.type==='WATER'?'#3B82F6':historyModal.type==='BODY'?'#fff':'#E52E01'} strokeWidth={3} dot={{r:4,fill:'#000',strokeWidth:2}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {(historyModal.type === 'WATER' || historyModal.type === 'DRY') && (
              <div className="pb-8">
                <h4 className="text-xs text-nexus-gray font-bold uppercase tracking-widest mb-4 text-center">Relevé de Présences</h4>
                <div className="space-y-2">
                  {(historyModal.type==='WATER'?athlete.monitoring.waterHistory:athlete.monitoring.dryHistory).map((day,i) => {
                    const s = getAttendanceLabel(day.attendance);
                    return (
                      <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="font-display text-white">{day.date}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${s.color} ${s.bg}`}>{s.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {historyModal.type === 'BODY' && (
              <div className="pb-8">
                <h4 className="text-xs text-nexus-gray font-bold uppercase tracking-widest mb-4 text-center">Mensurations</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {label:'Poitrine',val:athlete.monitoring.measurements.chest,unit:'cm'},
                    {label:'Taille',val:athlete.monitoring.measurements.waist,unit:'cm'},
                    {label:'Cuisses',val:athlete.monitoring.measurements.thighs,unit:'cm'},
                    {label:'Bras',val:athlete.monitoring.measurements.arms,unit:'cm'},
                  ].map((m,i) => (
                    <GlassCard key={i} className="p-3 text-center border-white/5">
                      <span className="text-[10px] text-nexus-gray uppercase tracking-widest block mb-1">{m.label}</span>
                      <span className="font-display text-2xl text-white">{m.val}</span>
                      <span className="text-xs text-nexus-gray ml-1">{m.unit}</span>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── STAT DETAIL MODAL ─────────────────────────────── */}
      {statDetail && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setStatDetail(null)}>
          <GlassCard className="w-full max-w-sm p-8 text-center space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-3xl text-white uppercase">{statDetail.title}</h3>
            <div className="text-6xl font-display font-bold text-nexus-gold">{statDetail.val}</div>
            <Button fullWidth onClick={() => setStatDetail(null)}>Fermer</Button>
          </GlassCard>
        </div>
      )}

      {/* ─── RADAR MODAL ───────────────────────────────────── */}
      {showRadarModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300 overflow-y-auto">
          <div className="p-6 flex justify-between items-center border-b border-white/10 sticky top-0 bg-black/80 z-10">
            <h2 className="font-display text-2xl text-white uppercase">Performance</h2>
            <button onClick={() => setShowRadarModal(false)} className="text-white text-xl">✕</button>
          </div>
          <div className="p-6 space-y-8 pb-24">
            {[
              {title:'Souplesse',data:athlete.performance.flexibility,color:'#FF0055'},
              {title:'Force (Dry)',data:athlete.performance.dry,color:'#FFA14D'},
              {title:'Aquatique',data:athlete.performance.water,color:'#3B82F6'},
            ].map((r,i) => (
              <div key={i}>
                <h4 className="text-center font-display text-xl uppercase tracking-widest mb-4" style={{color:r.color}}>{r.title}</h4>
                <GlassCard className="p-2 bg-black/60"><RadarPerf data={r.data} color={r.color} /></GlassCard>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── BOTTOM NAV ────────────────────────────────────── */}
      <nav className="fixed bottom-0 w-full px-6 pb-6 pt-2 z-40 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none">
        <div className="bg-nexus-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-around items-center p-2 shadow-2xl pointer-events-auto max-w-lg mx-auto">
          {[
            { tab:'HOME',     icon:<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, label:'Accueil' },
            { tab:'NUTRITION',icon:<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" /></svg>, label:'Nutri' },
            { tab:'CARE',     icon:<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, label:'Soin' },
            { tab:'CHECKIN',  icon:<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>, label:'Check-in', special:true },
          ].map(item => (
            <button key={item.tab} onClick={() => setActiveTab(item.tab as any)} className={`flex flex-col items-center p-3 rounded-xl transition-all ${activeTab===item.tab?'text-nexus-gold':'text-nexus-gray hover:text-white'}`}>
              {item.special ? (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1 ${activeTab===item.tab?'bg-nexus-gold border-nexus-gold text-black':'border-nexus-gray text-nexus-gray'}`}>
                  {item.icon}
                </div>
              ) : item.icon}
              <span className="text-[9px] font-bold uppercase tracking-widest mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

    </div>
  );
};