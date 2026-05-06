import React, { useState, useEffect } from 'react';
import { Athlete, Appointment, ObjectiveItem } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { db } from '../../services/mockDb';

interface ProfileViewProps {
  athlete: Athlete;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ athlete }) => {
  const [activeTab, setActiveTab] = useState<'GAMIFICATION' | 'OBJECTIVES' | 'APPOINTMENTS'>('GAMIFICATION');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bookingReason, setBookingReason] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showSkinModal, setShowSkinModal] = useState(false);

  // Objective Form
  const [newObjLabel, setNewObjLabel] = useState('');
  const [addingType, setAddingType] = useState<'shortTerm' | 'mediumTerm' | 'longTerm' | null>(null);

  useEffect(() => {
    const loadAppointments = async () => {
      const data = await db.getAppointments();
      setAppointments(data);
    };
    loadAppointments();
  }, []);

  const handleBook = async () => {
    if (!selectedSlot) return;
    const success = await db.bookAppointment(selectedSlot, athlete.id, bookingReason);
    if (success) {
      alert("Rendez-vous confirmé !");
      setSelectedSlot(null);
      setBookingReason('');
      const data = await db.getAppointments();
      setAppointments(data);
    } else {
      alert("Erreur lors de la réservation.");
    }
  };

  const handleUpdateSkin = async (skin: string) => {
    await db.updateSkin(athlete.id, skin);
    setShowSkinModal(false);
  };

  // Gamification Logic
  const xpPercentage = Math.min(100, (athlete.gamification.currentXp / athlete.gamification.nextLevelXp) * 100);
  const animalIcon = athlete.gamification.selectedSkin || '🐣';
  
  const getDynamicRank = () => {
    const score = (athlete.stats.goals * 3) - (athlete.stats.fouls * 2) - (athlete.stats.exclusions * 5);
    if (score > 30) return { name: "LEGEND", color: "text-nexus-gold" };
    if (score > 15) return { name: "ELITE", color: "text-nexus-red" };
    if (score > 5) return { name: "PRO", color: "text-blue-400" };
    return { name: "ROOKIE", color: "text-gray-400" };
  };
  const rank = getDynamicRank();

  // Objective Handlers
  const handleAddObjective = async () => {
    if (!addingType || !newObjLabel) return;
    await db.addObjective(athlete.id, addingType, newObjLabel);
    setNewObjLabel('');
    setAddingType(null);
  };

  const handleRequestValidation = async (type: 'shortTerm' | 'mediumTerm' | 'longTerm', id: string) => {
    await db.requestObjectiveValidation(athlete.id, type, id);
    alert("Demande de validation envoyée au coach.");
  };

  const handleClaimReward = async (type: 'shortTerm' | 'mediumTerm' | 'longTerm', id: string) => {
    const reward = await db.claimObjectiveReward(athlete.id, type, id);
    if (reward > 0) {
      // Force refresh or let React state update via parent re-render if real app
      // Here we rely on the fact that db modifies the object reference which might require a refresh in a real app,
      // but in this mock, the object is mutated. To trigger re-render we might need a dummy state or the parent updates.
      alert(`Bravo ! Objectif validé et retiré. +${reward} XP !`);
    }
  };

  const renderObjectiveList = (title: string, items: ObjectiveItem[], type: 'shortTerm' | 'mediumTerm' | 'longTerm', color: string) => (
    <GlassCard className={`p-5 border-l-4 border-l-${color}`}>
       <div className="flex justify-between items-center mb-4">
         <h3 className="font-display text-xl text-white uppercase flex items-center gap-2">
           <span className={`text-${color}`}>●</span> {title}
         </h3>
         <button onClick={() => setAddingType(type)} className="text-xs bg-white/10 p-2 rounded hover:bg-white/20 text-white">+</button>
       </div>
       
       <ul className="space-y-3">
         {items.map((obj) => (
           <li key={obj.id} className="flex flex-col gap-1 bg-black/20 p-2 rounded-lg">
             <div className="flex items-start justify-between">
               <div className="flex items-start gap-2">
                 <div className={`w-4 h-4 rounded-full border border-${color}/50 flex items-center justify-center mt-0.5`}></div>
                 <span className="text-sm text-gray-200">{obj.label}</span>
               </div>
             </div>
             
             {/* Action Buttons based on Status */}
             <div className="pl-6 pt-1">
               {obj.status === 'ACTIVE' && (
                 <button 
                   onClick={() => handleRequestValidation(type, obj.id)}
                   className="text-[10px] uppercase font-bold text-nexus-gray border border-white/10 px-2 py-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                 >
                   Valider l'objectif
                 </button>
               )}
               {obj.status === 'PENDING_VALIDATION' && (
                 <span className="text-[10px] text-orange-400 italic">En attente validation coach...</span>
               )}
               {obj.status === 'VALIDATED' && (
                 <button 
                   onClick={() => handleClaimReward(type, obj.id)}
                   className="text-[10px] uppercase font-bold text-black bg-nexus-gold px-3 py-1 rounded animate-pulse shadow-[0_0_10px_rgba(255,161,77,0.5)] flex items-center gap-1"
                 >
                   <span>✨</span> Récupérer XP
                 </button>
               )}
             </div>
           </li>
         ))}
         {items.length === 0 && <p className="text-nexus-gray text-sm italic">Aucun objectif défini</p>}
       </ul>
    </GlassCard>
  );

  return (
    <div className="px-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Profile Header with Animal */}
      <div className="flex items-center gap-4 mb-8 pt-4">
        <div 
          onClick={() => setShowSkinModal(true)}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-nexus-red to-black border-2 border-nexus-gold p-1 shadow-[0_0_30px_rgba(255,161,77,0.3)] relative flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        >
           <span className="text-6xl drop-shadow-lg filter">{animalIcon}</span>
           <div className="absolute -bottom-2 -right-2 bg-nexus-gold text-black text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full border-2 border-black">
             {athlete.gamification.level}
           </div>
           <div className="absolute top-0 right-0 bg-white/20 rounded-full p-1">
             <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
           </div>
        </div>
        <div>
          <h2 className="font-display text-3xl text-white uppercase">{athlete.firstName}</h2>
          <div className="flex flex-col">
            <span className={`font-display text-lg font-bold ${rank.color}`}>{rank.name} CLASS</span>
            <span className="text-xs text-nexus-gray uppercase tracking-widest mt-1">XP: {athlete.gamification.currentXp}</span>
          </div>
        </div>
      </div>

      {/* Skin Selection Modal */}
      {showSkinModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 animate-in zoom-in-95">
           <GlassCard className="w-full max-w-sm p-6 text-center">
              <h3 className="font-display text-2xl text-white uppercase mb-4">Choisir Avatar</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                 {['🐣', '🦅', '🦊', '🐺', '🦁', '🐉'].map((skin, idx) => {
                    const isUnlocked = athlete.gamification.unlockedSkins.includes(skin);
                    const levels = [1, 3, 5, 10, 15, 20];
                    return (
                      <button 
                        key={skin} 
                        disabled={!isUnlocked}
                        onClick={() => handleUpdateSkin(skin)}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-all
                          ${athlete.gamification.selectedSkin === skin ? 'border-nexus-gold bg-nexus-gold/20' : 'border-white/10 bg-white/5'}
                          ${!isUnlocked ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-white/10'}
                        `}
                      >
                        <span className="text-3xl mb-1">{skin}</span>
                        {!isUnlocked && <span className="text-[8px] text-white font-bold uppercase">Niv {levels[idx]}</span>}
                      </button>
                    )
                 })}
              </div>
              <Button fullWidth onClick={() => setShowSkinModal(false)}>Fermer</Button>
           </GlassCard>
        </div>
      )}

      {/* Profile Tabs */}
      <div className="flex p-1 bg-white/5 rounded-xl mb-6">
        <button 
          onClick={() => setActiveTab('GAMIFICATION')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'GAMIFICATION' ? 'bg-nexus-red text-white shadow-lg' : 'text-nexus-gray'}`}
        >
          Progression
        </button>
        <button 
          onClick={() => setActiveTab('OBJECTIVES')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'OBJECTIVES' ? 'bg-nexus-red text-white shadow-lg' : 'text-nexus-gray'}`}
        >
          Objectifs
        </button>
        <button 
          onClick={() => setActiveTab('APPOINTMENTS')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'APPOINTMENTS' ? 'bg-nexus-red text-white shadow-lg' : 'text-nexus-gray'}`}
        >
          Agenda
        </button>
      </div>

      {/* GAMIFICATION VIEW */}
      {activeTab === 'GAMIFICATION' && (
        <div className="space-y-6">
           {/* XP Card */}
           <GlassCard className="p-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-nexus-gray text-xs font-bold uppercase tracking-widest">Niveau {athlete.gamification.level}</span>
                <span className="text-nexus-gold text-xs font-bold">{athlete.gamification.currentXp} / {athlete.gamification.nextLevelXp} XP</span>
              </div>
              <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-nexus-red to-nexus-gold transition-all duration-1000 ease-out relative"
                  style={{ width: `${xpPercentage}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50 blur-[2px]"></div>
                </div>
              </div>
              <p className="text-center text-[10px] text-nexus-gray mt-3 uppercase tracking-wider">
                Continuez vos Check-ins & Repas pour XP
              </p>
           </GlassCard>

           {/* Stats & Streak */}
           <div className="grid grid-cols-2 gap-4">
              <GlassCard className="p-4 text-center border-orange-500/30">
                 <div className="text-4xl mb-2">🔥</div>
                 <div className="font-display text-3xl text-white">{athlete.gamification.streakDays}</div>
                 <div className="text-[9px] text-nexus-gray uppercase tracking-widest">Jours Check-in</div>
              </GlassCard>
              <GlassCard className="p-4 text-center border-blue-500/30">
                 <div className="text-4xl mb-2">⚽️</div>
                 <div className="font-display text-3xl text-white">{athlete.stats.goals}</div>
                 <div className="text-[9px] text-nexus-gray uppercase tracking-widest">Buts Saison</div>
              </GlassCard>
           </div>

           {/* Unlockables Preview */}
           <div>
             <h4 className="text-xs text-nexus-gray font-bold uppercase tracking-widest mb-3 pl-1">Récompenses Skins</h4>
             <div className="space-y-3">
               <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-nexus-gold/30">
                 <div className="w-10 h-10 bg-nexus-gold/20 rounded-full flex items-center justify-center text-2xl">🦅</div>
                 <div>
                   <span className="block text-white font-bold text-sm">Aigle Royal</span>
                   <span className="text-[10px] text-nexus-gray uppercase">Débloqué Niv. 3</span>
                 </div>
               </div>
               <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl opacity-50 border border-white/5">
                 <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-2xl">🐺</div>
                 <div>
                   <span className="block text-white font-bold text-sm">Loup Solitaire</span>
                   <span className="text-[10px] text-nexus-gray uppercase">Débloqué Niv. 10</span>
                 </div>
               </div>
               <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl opacity-50 border border-white/5">
                 <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-2xl">🦁</div>
                 <div>
                   <span className="block text-white font-bold text-sm">Roi Lion</span>
                   <span className="text-[10px] text-nexus-gray uppercase">Débloqué Niv. 15</span>
                 </div>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* OBJECTIVES VIEW */}
      {activeTab === 'OBJECTIVES' && (
        <div className="space-y-6">
          <div className="text-center mb-4">
             <p className="text-nexus-gray text-xs italic">"Définis tes cibles. Valide tes succès."</p>
          </div>

          {renderObjectiveList('Court Terme', athlete.structuredObjectives.shortTerm, 'shortTerm', 'emerald-500')}
          {renderObjectiveList('Moyen Terme', athlete.structuredObjectives.mediumTerm, 'mediumTerm', 'blue-500')}
          {renderObjectiveList('Long Terme', athlete.structuredObjectives.longTerm, 'longTerm', 'nexus-gold')}

          {addingType && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 animate-in fade-in">
               <GlassCard className="w-full max-w-sm p-6 space-y-4">
                  <h3 className="font-display text-white uppercase text-lg">Nouvel Objectif</h3>
                  <p className="text-xs text-nexus-gray uppercase">{addingType}</p>
                  <input 
                    autoFocus
                    className="w-full bg-white/10 border border-white/20 rounded p-3 text-white focus:border-nexus-gold outline-none"
                    placeholder="ex: +5kg au Bench"
                    value={newObjLabel}
                    onChange={(e) => setNewObjLabel(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button fullWidth variant="ghost" onClick={() => setAddingType(null)}>Annuler</Button>
                    <Button fullWidth onClick={handleAddObjective}>Ajouter</Button>
                  </div>
               </GlassCard>
            </div>
          )}
        </div>
      )}

      {/* APPOINTMENTS VIEW */}
      {activeTab === 'APPOINTMENTS' && (
        <div className="space-y-6">
           <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
             <h3 className="text-white font-bold uppercase text-sm mb-1">Prendre Rendez-vous</h3>
             <p className="text-[10px] text-nexus-gray">Réservez un créneau avec le staff médical ou technique.</p>
           </div>

           <div className="space-y-3">
             <h4 className="text-xs text-nexus-gray font-bold uppercase tracking-widest pl-1">Créneaux Disponibles</h4>
             {appointments.filter(a => !a.isBooked).length === 0 ? (
               <div className="text-center py-8 text-nexus-gray text-sm">Aucun créneau disponible.</div>
             ) : (
               appointments.filter(a => !a.isBooked).map(apt => (
                 <GlassCard 
                   key={apt.id} 
                   className={`p-4 flex items-center justify-between cursor-pointer border-l-4 ${selectedSlot === apt.id ? 'border-l-nexus-red bg-white/10' : 'border-l-transparent'}`}
                   onClick={() => setSelectedSlot(apt.id)}
                 >
                    <div>
                      <div className="font-display text-lg text-white">{apt.time}</div>
                      <div className="text-xs text-nexus-gold uppercase font-bold">{new Date(apt.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                       <span className="block text-sm text-white">{apt.coachName}</span>
                       <span className="text-[9px] text-nexus-gray uppercase">Disponible</span>
                    </div>
                 </GlassCard>
               ))
             )}
           </div>

           {selectedSlot && (
             <div className="animate-in slide-in-from-bottom-2 fade-in mt-4 bg-black/60 p-4 rounded-xl border border-nexus-red/30">
                <h4 className="text-white font-bold text-sm mb-2">Confirmer la réservation</h4>
                <textarea 
                   className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-nexus-red outline-none mb-3"
                   placeholder="Raison du rendez-vous (ex: Douleur genou, Bilan...)"
                   rows={2}
                   value={bookingReason}
                   onChange={(e) => setBookingReason(e.target.value)}
                />
                <Button fullWidth onClick={handleBook}>Valider le RDV</Button>
             </div>
           )}

           <div className="space-y-3 mt-8 opacity-60">
             <h4 className="text-xs text-nexus-gray font-bold uppercase tracking-widest pl-1">Mes Rendez-vous à venir</h4>
             {appointments.filter(a => a.bookedBy === athlete.id).map(apt => (
               <div key={apt.id} className="bg-white/5 border border-white/5 p-3 rounded-xl flex justify-between items-center">
                  <div className="text-xs text-white">
                     <span className="text-nexus-gold font-bold mr-2">{new Date(apt.date).toLocaleDateString()}</span>
                     <span>{apt.time} - {apt.coachName}</span>
                  </div>
                  <span className="text-[9px] bg-green-500/20 text-green-500 px-2 py-1 rounded">CONFIRMÉ</span>
               </div>
             ))}
             {appointments.filter(a => a.bookedBy === athlete.id).length === 0 && (
               <p className="text-xs text-nexus-gray pl-1">Aucun rendez-vous prévu.</p>
             )}
           </div>
        </div>
      )}

    </div>
  );
};