import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { Athlete, WorkoutSession, DailyLog, Match, AttendanceStatus, Appointment, DaySchedule, EventType } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { RadarPerf } from '../charts/RadarPerf';
import { CareView } from './CareView';
import { NutritionView } from './NutritionView';
import { ProfileView } from './ProfileView';
import { CheckInView } from './CheckInView';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
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

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface AthleteDashboardProps {
  athlete: Athlete;
  onLogout: () => void;
}

export const AthleteDashboard: React.FC<AthleteDashboardProps> = ({ athlete, onLogout }) => {
  const [sessions, setSessions]       = useState<WorkoutSession[]>([]);
  const [nextMatch, setNextMatch]     = useState<Match | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab]     = useState<'HOME' | 'NUTRITION' | 'CARE' | 'CHECKIN' | 'PROFILE'>('HOME');

  // Schedule
  const [weekSchedule, setWeekSchedule]       = useState<DaySchedule[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));

  // UI States
  const [showFullCalendar, setShowFullCalendar]   = useState(false);
  const [showRadarModal, setShowRadarModal]       = useState(false);
  const [activeDayAgenda, setActiveDayAgenda]     = useState<{ date: string; events: any[] } | null>(null);
  const [historyModal, setHistoryModal]           = useState<{ type: 'WATER' | 'DRY' | 'BODY' | null }>({ type: null });
  const [statDetail, setStatDetail]               = useState<{ title: string; val: number; desc: string } | null>(null);
  const [showMessageModal, setShowMessageModal]   = useState(false);

  // RDV (disponibles pour réservation)
  const [availableSlots, setAvailableSlots]     = useState<Appointment[]>([]);
  const [bookingSlotId, setBookingSlotId]       = useState<string | null>(null);
  const [bookingReason, setBookingReason]       = useState('');

  // Message
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');

  // ─── DATA LOAD ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const s = await db.getAthleteSessions(athlete.id);
      const m = await db.getNextMatch();
      const a = await db.getAppointments();
      setSessions(s);
      setNextMatch(m);
      setAppointments(a as Appointment[]);
      setAvailableSlots((a as Appointment[]).filter(ap => !ap.isBooked));
    };
    load();
  }, [athlete.id, activeTab]);

  useEffect(() => {
    const loadSchedule = async () => {
      const _d = currentWeekStart;
      const dateStr = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`;
      const schedule = await db.getWeeklySchedule(dateStr);
      setWeekSchedule(schedule);
    };
    loadSchedule();
  }, [currentWeekStart]);

  // Re-sync when coach updates the schedule
  React.useEffect(() => {
    const handleScheduleUpdate = () => {
      const offset = currentWeekStart.getTimezoneOffset();
      const adjusted = new Date(currentWeekStart.getTime() - (offset * 60 * 1000));
      const dateStr = adjusted.toISOString().split('T')[0];
      db.getWeeklySchedule(dateStr).then(schedule => setWeekSchedule(schedule));
    };
    window.addEventListener('schedule-updated', handleScheduleUpdate);
    return () => window.removeEventListener('schedule-updated', handleScheduleUpdate);
  }, [currentWeekStart]);

  const handlePrevWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d); };
  const handleNextWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d); };

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  const getDaysBeforeMatch = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24));

  const submitMessage = async () => {
    if (!messageSubject || !messageContent) return;
    await db.sendMessage(athlete.id, messageSubject, messageContent);
    alert('Message envoyé au staff en toute confidentialité.');
    setShowMessageModal(false);
    setMessageSubject('');
    setMessageContent('');
  };

  const handleDayClick = (daySchedule: DaySchedule) => {
    setActiveDayAgenda({ date: daySchedule.date, events: daySchedule.events.filter(e => e.isVisibleToAthletes) });
  };

  const getAttendanceLabel = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':            return { text: 'PRÉSENT',           color: 'text-green-500',     bg: 'bg-green-500/20'     };
      case 'ABSENT_JUSTIFIED':   return { text: 'ABSENT JUSTIFIÉ',   color: 'text-nexus-gold',    bg: 'bg-nexus-gold/20'    };
      case 'ABSENT_UNJUSTIFIED': return { text: 'ABSENT INJUSTIFIÉ', color: 'text-red-500',       bg: 'bg-red-500/20'       };
      case 'INJURED':            return { text: 'BLESSÉ',            color: 'text-blue-500',      bg: 'bg-blue-500/20'      };
      default: return { text: '-', color: 'text-gray-500', bg: 'bg-gray-500/20' };
    }
  };

  const getWeightDomain = () => {
    const values = athlete.monitoring.weight.map(w => w.value);
    if (values.length === 0) return ['auto', 'auto'];
    return [Math.floor(Math.min(...values) - 5), Math.ceil(Math.max(...values) + 5)];
  };

  const hasUpcomingAppointment = appointments.some(a => {
    if (a.bookedBy !== athlete.id) return false;
    const diff = Math.ceil((new Date(a.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 1;
  });

  const hasRewardsToClaim =
    athlete.structuredObjectives.shortTerm.some(o => o.status === 'VALIDATED') ||
    athlete.structuredObjectives.mediumTerm.some(o => o.status === 'VALIDATED') ||
    athlete.structuredObjectives.longTerm.some(o => o.status === 'VALIDATED');

  const showNotificationBadge = hasRewardsToClaim || hasUpcomingAppointment;
  const animalIcon = athlete.gamification.selectedSkin || '🐣';

  const WeekNavigator = () => (
    <div className="flex items-center bg-[#0f172a] border border-white/10 rounded-lg px-2 py-1 ml-auto">
      <button onClick={handlePrevWeek} className="p-2 text-nexus-gray hover:text-white">←</button>
      <div className="flex flex-col items-center px-2">
        <span className="text-[8px] text-nexus-gray uppercase font-bold tracking-wider">Semaine du</span>
        <span className="text-xs font-bold text-white">{`${String(currentWeekStart.getDate()).padStart(2,'0')}/${String(currentWeekStart.getMonth()+1).padStart(2,'0')}`}</span>
      </div>
      <button onClick={handleNextWeek} className="p-2 text-nexus-gray hover:text-white">→</button>
    </div>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="pb-32 relative min-h-screen">

      {/* Header */}
      <div className="p-6 pt-10 flex justify-between items-end bg-gradient-to-b from-black/90 to-transparent sticky top-0 z-30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab('PROFILE')}
            className="w-12 h-12 rounded-full bg-white/10 border-2 border-nexus-gold p-0.5 cursor-pointer hover:scale-105 transition-transform overflow-hidden relative flex items-center justify-center bg-black"
          >
            <span className="text-2xl">{animalIcon}</span>
            {showNotificationBadge && <div className="absolute top-0 right-0 w-3 h-3 bg-nexus-red rounded-full border-2 border-black animate-pulse" />}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-white tracking-wide uppercase leading-none">{athlete.firstName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_currentColor]" />
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

      {/* ── HOME ── */}
      {activeTab === 'HOME' && (
        <div className="px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* RDV à venir */}
          {hasUpcomingAppointment && (
            <GlassCard className="p-3 border-l-4 border-l-purple-500 flex items-center gap-3 animate-pulse cursor-pointer" onClick={() => setActiveTab('PROFILE')}>
              <span className="text-2xl">🗓️</span>
              <div>
                <span className="text-white font-bold text-sm uppercase block">N'oubliez pas votre rendez-vous</span>
                <span className="text-[10px] text-nexus-gray">Consultez votre agenda profil</span>
              </div>
            </GlassCard>
          )}

          {/* Message Staff */}
          <GlassCard
            className="p-4 flex items-center justify-between cursor-pointer border-l-4 border-l-nexus-red hover:bg-white/5 active:scale-95 transition-all"
            onClick={() => setShowMessageModal(true)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-nexus-red/20 text-nexus-red flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
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
              <div className="min-w-[600px] grid grid-cols-8 gap-1 text-[10px]">
                <div className="text-nexus-gray font-bold text-center py-2">H</div>
                {weekSchedule.map((d, i) => (
                  <div key={i} onClick={() => handleDayClick(d)}
                    className="text-nexus-gray font-bold text-center py-2 bg-white/5 rounded-t-lg flex flex-col cursor-pointer hover:bg-white/10">
                    <span>{d.dayName}</span>
                    <span className="text-[8px] text-nexus-gray/70">{formatDateShort(d.date)}</span>
                  </div>
                ))}
                {['08', '10', '12', '14', '16', '18', '20', '22'].map(hour => (
                  <React.Fragment key={hour}>
                    <div className="text-nexus-gray text-center py-2 border-b border-white/5">{hour}h</div>
                    {weekSchedule.map((day, dIdx) => {
                      const relevant = day.events.filter(e => {
                        if (!e.isVisibleToAthletes) return false;
                        const h = parseInt(e.startTime.split(':')[0]);
                        return h >= parseInt(hour) && h < parseInt(hour) + 2;
                      });
                      return (
                        <div key={dIdx} className="border border-white/5 bg-transparent min-h-[60px] p-1 flex flex-col gap-1">
                          {relevant.map((ev, eIdx) => (
                            <div key={eIdx} onClick={() => handleDayClick(day)}
                              className={`rounded p-1 text-[8px] leading-tight ${getEventTypeColor(ev.type)} text-white relative cursor-pointer hover:scale-105 transition-transform`}>
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

          {/* Prochain match */}
          {nextMatch && (
            <GlassCard className="p-0 overflow-hidden">
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

          {/* Créneaux RDV disponibles */}
          {availableSlots.length > 0 && (
            <div>
              <h4 className="text-xs text-nexus-gray font-bold uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                <span>📅</span> Créneaux Staff Disponibles
                <span className="bg-nexus-gold text-black text-[9px] font-bold px-2 py-0.5 rounded-full">{availableSlots.length}</span>
              </h4>
              <div className="space-y-2">
                {availableSlots.slice(0, 3).map(slot => (
                  <div key={slot.id} className="bg-nexus-gold/10 border border-nexus-gold/30 p-3 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="text-white font-bold block text-sm">
                        {new Date(slot.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </span>
                      <span className="text-nexus-gold text-xs font-bold">{slot.time} · {slot.coachName}</span>
                    </div>
                    <button
                      onClick={() => setBookingSlotId(slot.id)}
                      className="bg-nexus-gold text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white transition-colors ml-3"
                    >
                      Réserver
                    </button>
                  </div>
                ))}
                {availableSlots.length > 3 && (
                  <p className="text-center text-[10px] text-nexus-gray">
                    + {availableSlots.length - 3} autres créneaux dans l'onglet Profil
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Stats saison */}
          <div>
            <h4 className="text-xs text-nexus-gray font-bold uppercase tracking-widest mb-3 pl-1">Saison</h4>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Matchs', val: athlete.stats.matchesPlayed, color: 'text-nexus-gold',  border: 'border-nexus-gold',  desc: 'Total Joués'    },
                { label: 'Buts',   val: athlete.stats.goals,         color: 'text-emerald-500', border: 'border-emerald-500', desc: 'Réalisations'   },
                { label: 'Fautes', val: athlete.stats.fouls,         color: 'text-orange-500',  border: 'border-orange-500',  desc: 'Total Fautes'   },
                { label: 'Excl',   val: athlete.stats.exclusions,    color: 'text-nexus-red',   border: 'border-nexus-red',   desc: 'Exclusions Déf.'},
              ].map((stat, i) => (
                <div key={i}
                  onClick={() => setStatDetail({ title: stat.label, val: stat.val, desc: stat.desc })}
                  className={`bg-black/40 backdrop-blur-md border ${stat.border} rounded-xl p-3 text-center flex flex-col items-center justify-center aspect-square transition-transform active:scale-95 cursor-pointer`}>
                  <span className={`font-display text-3xl ${stat.color}`}>{stat.val}</span>
                  <span className={`text-[8px] ${stat.color} uppercase font-bold tracking-widest mt-1`}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monitoring cards */}
          <div className="space-y-3">
            <h4 className="text-xs text-nexus-gray font-bold uppercase tracking-widest mb-1 pl-1">Suivi & Performance</h4>
            <div className="grid grid-cols-2 gap-4">
              <GlassCard onClick={() => setHistoryModal({ type: 'WATER' })}
                className="p-4 flex flex-col justify-between h-40 bg-gradient-to-br from-blue-900/20 to-transparent border-blue-500/30 cursor-pointer hover:bg-blue-900/20">
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

              <GlassCard onClick={() => setHistoryModal({ type: 'DRY' })}
                className="p-4 flex flex-col justify-between h-40 bg-gradient-to-br from-nexus-red/20 to-transparent border-nexus-red/30 cursor-pointer hover:bg-nexus-red/20">
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

              <GlassCard onClick={() => setHistoryModal({ type: 'BODY' })}
                className="p-4 flex flex-col justify-between h-40 cursor-pointer hover:bg-white/5">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 rounded bg-gray-700/50 text-white flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">CORPS</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl text-white">{athlete.monitoring.weight[athlete.monitoring.weight.length - 1]?.value ?? '—'}</span>
                    <span className="text-xs text-nexus-gray">KG</span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-gray-400 font-bold mt-1 uppercase">
                    <span>{athlete.monitoring.height} cm</span>
                    <span className="text-nexus-red">•</span>
                    <span>{athlete.age} ans</span>
                  </div>
                </div>
              </GlassCard>

              <GlassCard onClick={() => setShowRadarModal(true)}
                className="p-4 flex flex-col justify-between h-40 bg-gradient-to-br from-nexus-gold/10 to-transparent border-nexus-gold/30 cursor-pointer hover:bg-nexus-gold/10 transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 rounded bg-nexus-gold/20 text-nexus-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <span className="text-[10px] text-nexus-gold uppercase font-bold tracking-widest">PERFS</span>
                </div>
                <div className="relative">
                  <div className="opacity-50 scale-75 origin-bottom-left -ml-2">
                    <RadarPerf data={athlete.performance.dry.slice(0, 3)} color="#FF0055" />
                  </div>
                  <div className="absolute bottom-0 left-0 text-[10px] text-nexus-gold uppercase font-bold">Voir Détails →</div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {/* ── OTHER TABS ── */}
      {activeTab === 'CARE' && <CareView athlete={athlete} />}
      {activeTab === 'NUTRITION' && <NutritionView athlete={athlete} />}
      {activeTab === 'PROFILE' && <ProfileView athlete={athlete} />}
      {activeTab === 'CHECKIN' && (
        <div className="px-6 pt-4">
          <CheckInView athlete={athlete} onComplete={() => setActiveTab('HOME')} />
        </div>
      )}

      {/* ── MODAL : Réservation RDV ── */}
      {bookingSlotId && (() => {
        const slot = availableSlots.find(s => s.id === bookingSlotId);
        if (!slot) return null;
        return (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-nexus-black border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
              <h3 className="font-display text-xl text-white uppercase">Confirmer le RDV</h3>
              <div className="bg-nexus-gold/10 border border-nexus-gold/30 p-3 rounded-lg">
                <span className="text-white font-bold block">
                  {new Date(slot.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <span className="text-nexus-gold text-sm">{slot.time} · {slot.coachName}</span>
              </div>
              <div>
                <label className="text-xs text-nexus-gray uppercase font-bold block mb-2">Motif (optionnel)</label>
                <textarea
                  value={bookingReason}
                  onChange={e => setBookingReason(e.target.value)}
                  placeholder="Bilan, question technique, état de forme..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm outline-none h-20 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setBookingSlotId(null); setBookingReason(''); }}
                  className="flex-1 py-2 rounded-lg border border-white/10 text-nexus-gray text-sm font-bold">
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    const ok = await db.bookAppointment(bookingSlotId, athlete.id, bookingReason);
                    if (ok) {
                      alert('Rendez-vous réservé ! Le staff va confirmer.');
                      setBookingSlotId(null);
                      setBookingReason('');
                      const fresh = await db.getAppointments();
                      setAvailableSlots((fresh as Appointment[]).filter(ap => !ap.isBooked));
                    }
                  }}
                  className="flex-1 py-2 rounded-lg bg-nexus-gold text-black text-sm font-bold hover:bg-white transition-colors">
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL : Message Staff ── */}
      {showMessageModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
          <GlassCard className="w-full max-w-md p-6 border-nexus-red/30 relative">
            <button onClick={() => setShowMessageModal(false)} className="absolute top-4 right-4 text-nexus-gray hover:text-white">✕</button>
            <h2 className="font-display text-2xl text-white uppercase mb-1">Message au Staff</h2>
            <p className="text-[10px] text-nexus-gray uppercase tracking-widest mb-6">Confessionnal / Retours / Blessures</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white uppercase mb-2">Sujet</label>
                <select className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-nexus-red outline-none"
                  value={messageSubject} onChange={e => setMessageSubject(e.target.value)}>
                  <option value="" disabled>Choisir un sujet...</option>
                  <option value="Blessure / Douleur">Blessure / Douleur</option>
                  <option value="Retour de Match">Retour de Match</option>
                  <option value="Moral / Mental">Moral / Mental</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-white uppercase mb-2">Message</label>
                <textarea className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-nexus-red outline-none h-32"
                  placeholder="Exprimez-vous librement..."
                  value={messageContent} onChange={e => setMessageContent(e.target.value)} />
              </div>
              <Button fullWidth onClick={submitMessage}>Envoyer</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ── MODAL : Agenda jour ── */}
      {activeDayAgenda && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-6 flex justify-between items-center border-b border-white/10 bg-black/80">
            <h2 className="font-display text-2xl text-white uppercase">
              {new Date(activeDayAgenda.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <button onClick={() => setActiveDayAgenda(null)} className="text-nexus-gray font-bold">Fermer</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeDayAgenda.events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-nexus-gray">
                <span className="text-4xl mb-2">😴</span>
                <p className="font-display uppercase tracking-widest">Jour de Repos</p>
              </div>
            ) : (
              activeDayAgenda.events.map((event, idx) => (
                <div key={idx} className="flex gap-4 border-b border-white/5 pb-4 last:border-0">
                  <div className="w-12 text-right">
                    <span className="text-white font-mono font-bold block">{event.startTime}</span>
                    <span className="text-nexus-gray text-[10px]">{event.endTime}</span>
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10 relative overflow-hidden">
                    <span className="font-bold text-white uppercase tracking-wide block mb-1 text-sm">{event.type}</span>
                    <span className="text-white font-bold block uppercase">{event.title}</span>
                    {event.description && <p className="text-xs text-gray-400 mt-1 italic">{event.description}</p>}
                    {event.intensity && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-[8px] text-gray-500 uppercase">Intensité</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full ${i < Math.ceil(event.intensity / 2) ? 'bg-nexus-gold' : 'bg-gray-700'}`} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── MODAL : Historique ── */}
      {historyModal.type && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
          <div className="p-6 flex justify-between items-center border-b border-white/10 bg-black">
            <h2 className="font-display text-2xl text-white uppercase">Historique {historyModal.type}</h2>
            <button onClick={() => setHistoryModal({ type: null })} className="text-white text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-8">
            <div className="h-64 w-full">
              <h4 className="text-xs text-nexus-gray font-bold uppercase tracking-widest mb-4 text-center">Évolution Graphique</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={
                  historyModal.type === 'BODY'  ? athlete.monitoring.weight.map(w => ({ name: w.date, value: w.value })) :
                  historyModal.type === 'WATER' ? athlete.monitoring.waterHistory.map(h => ({ name: h.date, value: h.rpe })) :
                  athlete.monitoring.dryHistory.map(h => ({ name: h.date, value: h.rpe }))
                }>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#555" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis stroke="#555" tick={{ fill: '#9CA3AF', fontSize: 10 }} domain={historyModal.type === 'BODY' ? getWeightDomain() : [0, 10]} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                  <Line type="monotone" dataKey="value"
                    stroke={historyModal.type === 'WATER' ? '#3B82F6' : historyModal.type === 'BODY' ? '#fff' : '#E52E01'}
                    strokeWidth={3} dot={{ r: 4, fill: '#000', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {(historyModal.type === 'WATER' || historyModal.type === 'DRY') && (
              <div className="pb-8">
                <h4 className="text-xs text-nexus-gray font-bold uppercase tracking-widest mb-4 text-center">Relevé de Présences</h4>
                <div className="space-y-2">
                  {(historyModal.type === 'WATER' ? athlete.monitoring.waterHistory : athlete.monitoring.dryHistory).map((day, i) => {
                    const st = getAttendanceLabel(day.attendance);
                    return (
                      <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="font-display text-white">{day.date}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${st.color} ${st.bg}`}>{st.text}</span>
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
                    { label: 'Poitrine', val: athlete.monitoring.measurements.chest  },
                    { label: 'Taille',   val: athlete.monitoring.measurements.waist  },
                    { label: 'Cuisses',  val: athlete.monitoring.measurements.thighs },
                    { label: 'Bras',     val: athlete.monitoring.measurements.arms   },
                  ].map((m, i) => (
                    <GlassCard key={i} className="p-3 text-center border-white/5">
                      <span className="text-[10px] text-nexus-gray uppercase tracking-widest block mb-1">{m.label}</span>
                      <span className="font-display text-2xl text-white">{m.val}</span>
                      <span className="text-xs text-nexus-gray ml-1">cm</span>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL : Stat détail ── */}
      {statDetail && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setStatDetail(null)}>
          <GlassCard className="w-full max-w-sm p-8 text-center space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-3xl text-white uppercase">{statDetail.title}</h3>
            <div className="text-6xl font-display font-bold text-nexus-gold">{statDetail.val}</div>
            <p className="text-nexus-gray uppercase tracking-widest text-sm">{statDetail.desc}</p>
            <Button fullWidth onClick={() => setStatDetail(null)}>Fermer</Button>
          </GlassCard>
        </div>
      )}

      {/* ── MODAL : Radar ── */}
      {showRadarModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300 overflow-y-auto">
          <div className="p-6 flex justify-between items-center border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-10">
            <h2 className="font-display text-2xl text-white uppercase">Performance</h2>
            <button onClick={() => setShowRadarModal(false)} className="text-white text-xl">✕</button>
          </div>
          <div className="p-6 space-y-8 pb-24">
            {[
              { title: 'Souplesse',   data: athlete.performance.flexibility, color: '#FF0055', border: 'border-nexus-red/30'  },
              { title: 'Force (Dry)', data: athlete.performance.dry,         color: '#E8B800', border: 'border-nexus-gold/30' },
              { title: 'Aquatique',   data: athlete.performance.water,       color: '#3B82F6', border: 'border-blue-400/30'  },
            ].map(section => (
              <div key={section.title}>
                <h4 className="text-center font-display text-xl uppercase tracking-widest mb-4" style={{ color: section.color }}>{section.title}</h4>
                <GlassCard className={`p-2 bg-black/60 ${section.border}`}><RadarPerf data={section.data} color={section.color} /></GlassCard>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 w-full px-6 pb-6 pt-2 z-40 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none">
        <div className="bg-nexus-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-around items-center p-2 shadow-[0_10px_40px_rgba(0,0,0,0.8)] pointer-events-auto max-w-lg mx-auto">
          <button onClick={() => setActiveTab('HOME')}
            className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${activeTab === 'HOME' ? 'text-nexus-gold' : 'text-nexus-gray hover:text-white'}`}>
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-[9px] font-bold uppercase tracking-widest">Accueil</span>
          </button>
          <button onClick={() => setActiveTab('NUTRITION')}
            className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${activeTab === 'NUTRITION' ? 'text-nexus-gold' : 'text-nexus-gray hover:text-white'}`}>
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-widest">Nutrition</span>
          </button>
          <button onClick={() => setActiveTab('CARE')}
            className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${activeTab === 'CARE' ? 'text-nexus-gold' : 'text-nexus-gray hover:text-white'}`}>
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <span className="text-[9px] font-bold uppercase tracking-widest">Soin</span>
          </button>
          <button onClick={() => setActiveTab('CHECKIN')}
            className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${activeTab === 'CHECKIN' ? 'text-nexus-gold' : 'text-nexus-gray hover:text-white'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1 transition-all ${activeTab === 'CHECKIN' ? 'bg-nexus-gold border-nexus-gold text-black' : 'bg-transparent border-nexus-gray text-nexus-gray'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${activeTab === 'CHECKIN' ? 'text-nexus-gold' : ''}`}>Check-in</span>
          </button>
          <button onClick={() => setActiveTab('PROFILE')}
            className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 relative ${activeTab === 'PROFILE' ? 'text-nexus-gold' : 'text-nexus-gray hover:text-white'}`}>
            {showNotificationBadge && <div className="absolute top-1 right-1 w-2 h-2 bg-nexus-red rounded-full animate-pulse" />}
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[9px] font-bold uppercase tracking-widest">Profil</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
