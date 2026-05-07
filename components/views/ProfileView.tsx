import React, { useState, useEffect } from 'react';
import { Athlete, Appointment, ObjectiveItem } from '../../types';
import { getAppointments, bookAppointment, cancelAppointment } from '../../services/scheduleService';
import { addObjective, requestObjectiveValidation, claimObjectiveReward, updateSkin } from '../../services/athleteService';

interface ProfileViewProps { athlete: Athlete; }

const SKINS = [
  { emoji: '🐣', name: 'Poussin',     level: 1  },
  { emoji: '🦊', name: 'Renard',      level: 2  },
  { emoji: '🦅', name: 'Aigle Royal', level: 3  },
  { emoji: '🐺', name: 'Loup',        level: 10 },
  { emoji: '🦁', name: 'Lion',        level: 15 },
  { emoji: '🐉', name: 'Dragon',      level: 20 },
];

export const ProfileView: React.FC<ProfileViewProps> = ({ athlete }) => {
  const [activeTab, setActiveTab]         = useState<'GAMIFICATION'|'OBJECTIVES'|'APPOINTMENTS'>('GAMIFICATION');
  const [appointments, setAppointments]   = useState<Appointment[]>([]);
  const [loading, setLoading]             = useState(false);
  const [bookingReason, setBookingReason] = useState('');
  const [selectedSlot, setSelectedSlot]   = useState<string|null>(null);
  const [bookingDone, setBookingDone]     = useState(false);
  const [showSkinModal, setShowSkinModal] = useState(false);
  const [newObjLabel, setNewObjLabel]     = useState('');
  const [addingType, setAddingType]       = useState<'shortTerm'|'mediumTerm'|'longTerm'|null>(null);

  const loadAppointments = async () => {
    setLoading(true);
    const data = await getAppointments();
    setAppointments(data);
    setLoading(false);
  };

  useEffect(() => { if (activeTab === 'APPOINTMENTS') loadAppointments(); }, [activeTab]);

  const handleBook = async () => {
    if (!selectedSlot || !bookingReason.trim()) return;
    await bookAppointment(selectedSlot, athlete.id, bookingReason.trim());
    setBookingDone(true); setSelectedSlot(null); setBookingReason('');
    await loadAppointments();
    setTimeout(() => setBookingDone(false), 4000);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    await cancelAppointment(id);
    await loadAppointments();
  };

  const handleUpdateSkin = async (skin: string) => {
    await updateSkin(athlete.id, skin);
    athlete.gamification.selectedSkin = skin;
    setShowSkinModal(false);
  };

  const handleAddObjective = async () => {
    if (!addingType || !newObjLabel.trim()) return;
    await addObjective(athlete.id, addingType, newObjLabel.trim());
    setNewObjLabel(''); setAddingType(null); alert('Objectif ajouté !');
  };

  const handleRequestValidation = async (type: 'shortTerm'|'mediumTerm'|'longTerm', id: string) => {
    await requestObjectiveValidation(athlete.id, type, id);
    alert('Demande envoyée au coach ✅');
  };

  const handleClaimReward = async (type: 'shortTerm'|'mediumTerm'|'longTerm', id: string) => {
    const xp = await claimObjectiveReward(athlete.id, type, id);
    alert(`🎉 Objectif validé ! +${xp} XP`);
  };

  const xpPct      = Math.min(100, (athlete.gamification.currentXp / athlete.gamification.nextLevelXp) * 100);
  const animalIcon = athlete.gamification.selectedSkin || '🐣';
  const getDynamicRank = () => {
    const score = athlete.stats.goals * 3 - athlete.stats.fouls * 2 - athlete.stats.exclusions * 5;
    if (score > 30) return { name: 'LEGEND', color: '#E8B800' };
    if (score > 15) return { name: 'ELITE',  color: '#ef4444' };
    if (score > 5)  return { name: 'PRO',    color: '#3b82f6' };
    return { name: 'ROOKIE', color: '#6b7280' };
  };
  const rank = getDynamicRank();
  const availableSlots = appointments.filter(a => a.status === 'AVAILABLE' && !a.isBooked);
  const myAppointments = appointments.filter(a => a.bookedBy === athlete.id);

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case 'PENDING_VALIDATION': return { label: '⏳ En attente de validation staff', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' };
      case 'CONFIRMED':          return { label: '✅ Confirmé par le staff',           color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)' };
      case 'DECLINED':           return { label: '❌ Refusé',                          color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)' };
      default:                   return { label: 'Disponible',                          color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)' };
    }
  };

  const renderObjectiveList = (title: string, items: ObjectiveItem[], type: 'shortTerm'|'mediumTerm'|'longTerm', color: string) => (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}30` }}>
      <div className="flex justify-between items-center p-4" style={{ borderBottom: `1px solid ${color}20` }}>
        <h3 className="font-display text-lg text-white uppercase flex items-center gap-2"><span style={{color}}>●</span> {title}</h3>
        <button onClick={() => setAddingType(type)} className="text-xs px-3 py-1 rounded-lg font-bold" style={{ background: `${color}20`, color }}>+ Ajouter</button>
      </div>
      <div className="p-4 space-y-3">
        {items.length === 0 && <p className="text-sm italic text-center py-2" style={{color:'#8B9BB4'}}>Aucun objectif — définis tes cibles !</p>}
        {items.map(obj => (
          <div key={obj.id} className="p-3 rounded-xl" style={{background:'rgba(255,255,255,0.05)'}}>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{background:color, opacity: obj.status==='ACTIVE'?0.4:1}}></div>
              <div className="flex-1">
                <p className="text-sm text-white">{obj.label}</p>
                <div className="mt-2">
                  {obj.status === 'ACTIVE' && <button onClick={() => handleRequestValidation(type, obj.id)} className="text-[10px] font-bold uppercase px-2 py-1 rounded border" style={{borderColor:'rgba(255,255,255,0.2)',color:'#8B9BB4'}}>✓ Demander validation</button>}
                  {obj.status === 'PENDING_VALIDATION' && <span className="text-[10px] italic" style={{color:'#f97316'}}>⏳ En attente coach...</span>}
                  {obj.status === 'VALIDATED' && <button onClick={() => handleClaimReward(type, obj.id)} className="text-[10px] font-bold uppercase px-3 py-1 rounded animate-pulse" style={{background:'#E8B800',color:'#0B1628'}}>✨ Récupérer XP</button>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="px-4 pb-32 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pt-4">
        <div onClick={() => setShowSkinModal(true)} className="relative cursor-pointer hover:scale-105 transition-transform">
          <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{background:'linear-gradient(135deg, #1A3A7A, #0B1628)',border:'2px solid #E8B800'}}>
            <span className="text-5xl">{animalIcon}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{background:'#E8B800',color:'#0B1628',border:'2px solid #0B1628'}}>{athlete.gamification.level}</div>
          <div className="absolute top-0 right-0 w-6 h-6 rounded-full flex items-center justify-center" style={{background:'rgba(255,255,255,0.2)'}}><span className="text-xs">✏️</span></div>
        </div>
        <div>
          <h2 className="font-display text-2xl text-white uppercase">{athlete.firstName} {athlete.lastName}</h2>
          <span className="font-display text-lg font-bold" style={{color:rank.color}}>{rank.name} CLASS</span>
          {athlete.team_category && (
            <div className="mt-1"><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:'rgba(232,184,0,0.15)',color:'#E8B800'}}>{athlete.team_category === 'BOTH' ? 'U18 + N1' : athlete.team_category}</span></div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{id:'GAMIFICATION',label:'🏆 XP'},{id:'OBJECTIVES',label:'🎯 Objectifs'},{id:'APPOINTMENTS',label:'🗓 RDV'}].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} className="flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all"
            style={{background:activeTab===t.id?'#E8B800':'rgba(255,255,255,0.05)',color:activeTab===t.id?'#0B1628':'#8B9BB4'}}>{t.label}</button>
        ))}
      </div>

      {/* ── GAMIFICATION ── */}
      {activeTab === 'GAMIFICATION' && (
        <div className="space-y-5">
          <div className="rounded-2xl p-5" style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(232,184,0,0.2)'}}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase" style={{color:'#8B9BB4'}}>Niveau {athlete.gamification.level}</span>
              <span className="text-xs font-bold" style={{color:'#E8B800'}}>{athlete.gamification.currentXp} / {athlete.gamification.nextLevelXp} XP</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.1)'}}>
              <div className="h-full rounded-full transition-all duration-1000" style={{width:`${xpPct}%`,background:'linear-gradient(to right, #E8B800, #F5D000)'}}></div>
            </div>
            <p className="text-xs mt-3 text-center" style={{color:'#8B9BB4'}}>Check-in quotidien (+100 XP) · Repas enregistré (+150 XP)</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 text-center" style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(249,115,22,0.3)'}}>
              <div className="text-3xl mb-1">🔥</div>
              <div className="font-display text-3xl text-white">{athlete.gamification.streakDays}</div>
              <div className="text-[9px] uppercase tracking-widest" style={{color:'#8B9BB4'}}>Jours Consécutifs</div>
            </div>
            <div className="rounded-xl p-4 text-center" style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(59,130,246,0.3)'}}>
              <div className="text-3xl mb-1">🏊</div>
              <div className="font-display text-3xl text-white">{athlete.stats.goals}</div>
              <div className="text-[9px] uppercase tracking-widest" style={{color:'#8B9BB4'}}>Buts Saison</div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#8B9BB4'}}>Skins & Récompenses</h4>
            <div className="space-y-2">
              {SKINS.map(s => {
                const unlocked = athlete.gamification.unlockedSkins.includes(s.emoji);
                const active   = athlete.gamification.selectedSkin === s.emoji;
                return (
                  <div key={s.emoji} onClick={() => unlocked && handleUpdateSkin(s.emoji)} className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{background:active?'rgba(232,184,0,0.15)':'rgba(255,255,255,0.05)',border:active?'1px solid rgba(232,184,0,0.4)':'1px solid rgba(255,255,255,0.08)',opacity:unlocked?1:0.4,cursor:unlocked?'pointer':'default'}}>
                    <span className="text-2xl">{s.emoji}</span>
                    <div className="flex-1">
                      <span className="text-white font-bold block text-sm">{s.name}</span>
                      <span className="text-[10px] uppercase" style={{color:'#8B9BB4'}}>{unlocked?(active?'✓ Actif':'Débloqué'):`Niveau ${s.level} requis`}</span>
                    </div>
                    {active && <span className="text-xs font-bold" style={{color:'#E8B800'}}>ÉQUIPÉ</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── OBJECTIVES ── */}
      {activeTab === 'OBJECTIVES' && (
        <div className="space-y-4">
          <p className="text-xs italic text-center pb-2" style={{color:'#8B9BB4'}}>"Définis tes cibles. Valide tes succès."</p>
          {renderObjectiveList('Court Terme',  athlete.structuredObjectives.shortTerm,  'shortTerm',  '#22c55e')}
          {renderObjectiveList('Moyen Terme',  athlete.structuredObjectives.mediumTerm, 'mediumTerm', '#3b82f6')}
          {renderObjectiveList('Long Terme',   athlete.structuredObjectives.longTerm,   'longTerm',   '#E8B800')}
        </div>
      )}

      {/* ── APPOINTMENTS ── */}
      {activeTab === 'APPOINTMENTS' && (
        <div className="space-y-5">
          {bookingDone && (
            <div className="rounded-2xl p-4 text-center animate-in zoom-in-95" style={{background:'rgba(249,115,22,0.1)',border:'1px solid rgba(249,115,22,0.3)'}}>
              <span className="text-3xl block mb-2">📨</span>
              <p className="font-bold text-orange-400 text-sm">Demande envoyée !</p>
              <p className="text-xs mt-1" style={{color:'#8B9BB4'}}>Le staff va valider ton rendez-vous. Il apparaîtra dans ton planning une fois confirmé.</p>
            </div>
          )}
          <div className="rounded-xl p-4" style={{background:'rgba(26,58,122,0.2)',border:'1px solid rgba(232,184,0,0.2)'}}>
            <p className="text-white font-bold text-sm mb-1">📋 Prendre Rendez-vous</p>
            <p className="text-xs" style={{color:'#8B9BB4'}}>Choisis un créneau disponible. Le staff validera ta demande avant confirmation définitive.</p>
          </div>

          {/* Créneaux disponibles */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#8B9BB4'}}>Créneaux Disponibles</h4>
            {loading ? (
              <div className="text-center py-4" style={{color:'#8B9BB4'}}>Chargement...</div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-6 rounded-xl" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                <span className="text-3xl block mb-2">📭</span>
                <p className="text-sm" style={{color:'#8B9BB4'}}>Aucun créneau disponible pour le moment.</p>
              </div>
            ) : (
              availableSlots.map(apt => (
                <div key={apt.id} onClick={() => setSelectedSlot(apt.id === selectedSlot ? null : apt.id)}
                  className="p-4 rounded-xl mb-2 flex items-center justify-between cursor-pointer transition-all"
                  style={{background:selectedSlot===apt.id?'rgba(232,184,0,0.15)':'rgba(255,255,255,0.05)',border:`1px solid ${selectedSlot===apt.id?'rgba(232,184,0,0.4)':'rgba(255,255,255,0.08)'}`}}>
                  <div>
                    <div className="font-display text-lg text-white">{apt.time}</div>
                    <div className="text-xs font-bold" style={{color:'#E8B800'}}>{new Date(apt.date).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm text-white">{apt.coachName}</span>
                    <span className="text-[9px] uppercase font-bold" style={{color:'#22c55e'}}>● Disponible</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Formulaire */}
          {selectedSlot && (
            <div className="rounded-2xl p-4 animate-in slide-in-from-bottom-2" style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(232,184,0,0.3)'}}>
              <h4 className="text-white font-bold text-sm mb-3">Confirmer la demande</h4>
              <textarea rows={2} className="w-full rounded-lg p-3 text-sm text-white resize-none focus:outline-none mb-3"
                style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}
                placeholder="Raison du rendez-vous (ex: Douleur genou, Bilan mensuel...)"
                value={bookingReason} onChange={e => setBookingReason(e.target.value)} />
              <button onClick={handleBook} disabled={!bookingReason.trim()} className="w-full py-3 rounded-xl font-display font-bold uppercase tracking-widest"
                style={{background:bookingReason.trim()?'linear-gradient(135deg, #E8B800, #F5D000)':'rgba(255,255,255,0.1)',color:bookingReason.trim()?'#0B1628':'#8B9BB4'}}>
                Envoyer la demande
              </button>
            </div>
          )}

          {/* Mes RDV */}
          {myAppointments.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#8B9BB4'}}>Mes Rendez-vous</h4>
              {myAppointments.map(apt => {
                const badge = getStatusBadge(apt.status);
                return (
                  <div key={apt.id} className="p-4 rounded-2xl mb-3" style={{background:badge.bg,border:`1px solid ${badge.border}`}}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-display text-lg text-white">{apt.time}</div>
                        <div className="text-xs font-bold" style={{color:'#E8B800'}}>{new Date(apt.date).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div>
                        <div className="text-xs text-white mt-0.5">{apt.coachName}</div>
                      </div>
                      {apt.status === 'PENDING_VALIDATION' && (
                        <button onClick={() => handleCancel(apt.id)} className="text-[10px] font-bold uppercase px-2 py-1 rounded border" style={{borderColor:'rgba(239,68,68,0.3)',color:'#ef4444'}}>Annuler</button>
                      )}
                    </div>
                    {apt.reason && <p className="text-xs mb-2 pl-2 border-l-2" style={{color:'#8B9BB4',borderColor:badge.color}}>{apt.reason}</p>}
                    <span className="text-xs font-bold" style={{color:badge.color}}>{badge.label}</span>
                    {apt.status === 'CONFIRMED' && <p className="text-[10px] mt-1 font-bold" style={{color:'#22c55e'}}>✓ Ce RDV apparaît dans ton emploi du temps</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Objectif */}
      {addingType && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{background:'#0D1F3C',border:'1px solid rgba(232,184,0,0.3)'}}>
            <h3 className="font-display text-white uppercase text-xl">Nouvel Objectif</h3>
            <p className="text-xs uppercase" style={{color:'#8B9BB4'}}>{addingType==='shortTerm'?'🟢 Court Terme':addingType==='mediumTerm'?'🔵 Moyen Terme':'⭐ Long Terme'}</p>
            <input autoFocus className="w-full rounded-xl p-3 text-white focus:outline-none" style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(232,184,0,0.3)'}}
              placeholder="ex: +5kg au Bench..." value={newObjLabel} onChange={e => setNewObjLabel(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleAddObjective()} />
            <div className="flex gap-2">
              <button onClick={() => setAddingType(null)} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{background:'rgba(255,255,255,0.08)',color:'#8B9BB4'}}>Annuler</button>
              <button onClick={handleAddObjective} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{background:'#E8B800',color:'#0B1628'}}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Skin */}
      {showSkinModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 animate-in zoom-in-95">
          <div className="w-full max-w-sm rounded-2xl p-6" style={{background:'#0D1F3C',border:'1px solid rgba(232,184,0,0.3)'}}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-xl text-white uppercase">Choisir ton Avatar</h3>
              <button onClick={() => setShowSkinModal(false)} className="text-white text-xl">✕</button>
            </div>
            <div className="space-y-2">
              {SKINS.map(s => {
                const unlocked = athlete.gamification.unlockedSkins.includes(s.emoji);
                return (
                  <div key={s.emoji} onClick={() => unlocked && handleUpdateSkin(s.emoji)} className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{background:'rgba(255,255,255,0.05)',opacity:unlocked?1:0.4,cursor:unlocked?'pointer':'not-allowed'}}>
                    <span className="text-3xl">{s.emoji}</span>
                    <div>
                      <span className="text-white font-bold">{s.name}</span>
                      <span className="block text-xs" style={{color:'#8B9BB4'}}>{unlocked?'Débloqué':`Niveau ${s.level} requis`}</span>
                    </div>
                    {athlete.gamification.selectedSkin === s.emoji && <span className="ml-auto text-xs font-bold" style={{color:'#E8B800'}}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};