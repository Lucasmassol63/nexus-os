import React, { useState, useMemo } from 'react';
import { Athlete, TeamStats, MonitoringDay } from '../../types';
import { db, TEAM_STATS } from '../../services/mockDb';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Gauge } from '../charts/Gauge';

interface DataViewProps {
  athletes: Athlete[];
  onUpdate: () => void;
}

type SubTab = 'OVERVIEW' | 'COMPARISON' | 'MONITORING' | 'ENTRY';
type TimeView = 'DAY' | 'WEEK' | 'MONTH';

export const DataView: React.FC<DataViewProps> = ({ athletes, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<SubTab>('OVERVIEW');
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  
  // Time View State
  const [timeView, setTimeView] = useState<TimeView>('WEEK');
  const [dateCursor, setDateCursor] = useState(new Date());

  // Data Entry State
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'WATER-POLO',
    duration: 60,
    rpe: 5,
    athleteId: ''
  });

  // --- HELPERS ---

  const calculateLoad = (rpe: number, duration: number) => rpe * duration;

  const getStartOfPeriod = (date: Date, view: TimeView) => {
    const d = new Date(date);
    if (view === 'DAY') {
      // Start of week (Monday)
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
    } else if (view === 'WEEK') {
      // Start of month? Or just arbitrary range?
      // Let's say start of current month to show weeks of month
      d.setDate(1);
    } else {
      // Start of year
      d.setMonth(0, 1);
    }
    d.setHours(0,0,0,0);
    return d;
  };

  const handlePrev = () => {
    const d = new Date(dateCursor);
    if (timeView === 'DAY') d.setDate(d.getDate() - 7);
    if (timeView === 'WEEK') d.setMonth(d.getMonth() - 1);
    if (timeView === 'MONTH') d.setFullYear(d.getFullYear() - 1);
    setDateCursor(d);
  };

  const handleNext = () => {
    const d = new Date(dateCursor);
    if (timeView === 'DAY') d.setDate(d.getDate() + 7);
    if (timeView === 'WEEK') d.setMonth(d.getMonth() + 1);
    if (timeView === 'MONTH') d.setFullYear(d.getFullYear() + 1);
    setDateCursor(d);
  };

  const getChartData = () => {
    const start = getStartOfPeriod(dateCursor, timeView);
    const data = [];
    
    if (timeView === 'DAY') {
      // Show Mon-Sun
      const days = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        // Aggregate Load
        let waterLoad = 0;
        let dryLoad = 0;
        
        athletes.forEach(a => {
            const w = a.monitoring.waterHistory.find(h => h.date === dateStr);
            if (w) waterLoad += (w.load || 0);
            const dr = a.monitoring.dryHistory.find(h => h.date === dateStr);
            if (dr) dryLoad += (dr.load || 0);
        });

        // Average per athlete
        const count = athletes.length || 1;
        data.push({
            name: days[i],
            water: Math.round(waterLoad / count),
            dry: Math.round(dryLoad / count),
            fullDate: dateStr
        });
      }
    } else if (timeView === 'WEEK') {
      // Show Weeks of Month (approx 4-5)
      // Simple logic: 4 weeks starting from 1st
      for (let i = 0; i < 4; i++) {
         // Mock data for weeks as real aggregation is complex without full DB
         data.push({
             name: `S${i+1}`,
             water: Math.round(1500 + Math.random() * 500),
             dry: Math.round(1000 + Math.random() * 300)
         });
      }
    } else {
      // Show Months Jan-Dec
      const months = ['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOUT', 'SEPT', 'OCT', 'NOV', 'DEC'];
      months.forEach(m => {
          data.push({
              name: m,
              water: Math.round(6000 + Math.random() * 2000),
              dry: Math.round(4000 + Math.random() * 1000)
          });
      });
    }
    return data;
  };

  const getTeamAverageStats = () => {
      // Calculate global averages from all athletes
      let totalRpe = 0, countRpe = 0;
      let totalSleep = 0, countSleep = 0;
      let totalNutrition = 0, countNutrition = 0;
      let totalDoms = 0, countDoms = 0;

      athletes.forEach(a => {
          if(a.dailyLogs) {
              a.dailyLogs.forEach(l => {
                  totalSleep += l.sleep; countSleep++;
                  totalNutrition += l.foodQuality; countNutrition++;
                  totalDoms += l.soreness; countDoms++;
              });
          }
          // RPE from monitoring
          a.monitoring.waterHistory.forEach(h => { if(h.rpe){ totalRpe += h.rpe; countRpe++; }});
          a.monitoring.dryHistory.forEach(h => { if(h.rpe){ totalRpe += h.rpe; countRpe++; }});
      });

      return {
          rpe: countRpe ? (totalRpe / countRpe).toFixed(1) : '-',
          sleep: countSleep ? (totalSleep / countSleep).toFixed(1) : '-',
          nutrition: countNutrition ? (totalNutrition / countNutrition).toFixed(1) : '-',
          doms: countDoms ? (totalDoms / countDoms).toFixed(1) : '-'
      };
  };

  const calculateACWR = (history: MonitoringDay[]) => {
    // Simplified ACWR
    const sorted = [...history].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const acuteDays = sorted.slice(0, 7);
    const chronicDays = sorted.slice(0, 28);
    const acuteLoad = acuteDays.reduce((acc, d) => acc + (d.load || 0), 0) / (acuteDays.length || 1);
    const chronicLoad = chronicDays.reduce((acc, d) => acc + (d.load || 0), 0) / (chronicDays.length || 1);
    const ratio = chronicLoad === 0 ? 0 : acuteLoad / chronicLoad;
    return { ratio: parseFloat(ratio.toFixed(2)), acute: Math.round(acuteLoad), chronic: Math.round(chronicLoad) };
  };

  const calculateZScore = (athlete: Athlete) => {
    const lastCheckIn = athlete.lastCheckIn;
    if (!lastCheckIn) return 50; 
    const sleepScore = (lastCheckIn.sleep / 10) * 100;
    const fatigueScore = (10 - lastCheckIn.fatigue) * 10; 
    const sorenessScore = (10 - lastCheckIn.soreness) * 10; 
    const moodScore = (lastCheckIn.mood / 10) * 100;
    const foodScore = (lastCheckIn.foodQuality / 10) * 100;
    const score = (sleepScore + fatigueScore + sorenessScore + moodScore + foodScore) / 5;
    return Math.round(score);
  };

  const handleAddSession = async () => {
    if (!entryForm.athleteId) {
      alert("Sélectionnez un athlète");
      return;
    }
    // @ts-ignore 
    await db.addSessionLog(entryForm.athleteId, entryForm.date, entryForm.type, entryForm.duration, entryForm.rpe);
    alert(`Session ajoutée ! Charge: ${calculateLoad(entryForm.rpe, entryForm.duration)}`);
    onUpdate(); 
  };

  // --- RENDERERS ---

  const renderOverview = () => {
      const chartData = getChartData();
      const teamStats = getTeamAverageStats();
      // Calculate Team ACWR (Average of all athletes)
      const teamAcwr = athletes.reduce((acc, ath) => {
          const acwr = calculateACWR([...ath.monitoring.waterHistory, ...ath.monitoring.dryHistory]);
          return acc + acwr.ratio;
      }, 0) / (athletes.length || 1);

      return (
        <div className="space-y-6 animate-in fade-in">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard className="p-4 flex flex-col items-center justify-center border-l-4 border-l-nexus-gold">
                    <Gauge value={teamAcwr} size={120} label="ACWR Équipe" />
                </GlassCard>
                <GlassCard className="p-4 flex flex-col items-center justify-center border-l-4 border-l-blue-500">
                    <span className="text-3xl font-display text-blue-500">{teamStats.rpe}</span>
                    <span className="text-[10px] text-nexus-gray uppercase tracking-widest mt-1">RPE Moyen</span>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col items-center justify-center border-l-4 border-l-green-500">
                    <span className="text-3xl font-display text-green-500">92%</span>
                    <span className="text-[10px] text-nexus-gray uppercase tracking-widest mt-1">Présence Eau</span>
                </GlassCard>
                <GlassCard className="p-4 flex flex-col items-center justify-center border-l-4 border-l-red-500">
                    <span className="text-3xl font-display text-red-500">88%</span>
                    <span className="text-[10px] text-nexus-gray uppercase tracking-widest mt-1">Présence Muscu</span>
                </GlassCard>
            </div>

            {/* Main Chart */}
            <GlassCard className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-display text-lg uppercase">Charge d'Entraînement (AU)</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-black/40 rounded-lg p-1">
                            <button onClick={handlePrev} className="px-3 py-1 text-nexus-gray hover:text-white">←</button>
                            <span className="text-xs font-bold text-white px-2 min-w-[80px] text-center">
                                {timeView === 'DAY' && dateCursor.toLocaleDateString()}
                                {timeView === 'WEEK' && dateCursor.toLocaleString('default', { month: 'long' })}
                                {timeView === 'MONTH' && dateCursor.getFullYear()}
                            </span>
                            <button onClick={handleNext} className="px-3 py-1 text-nexus-gray hover:text-white">→</button>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => setTimeView('DAY')} className={`px-3 py-1 rounded text-xs font-bold ${timeView === 'DAY' ? 'bg-nexus-gold text-black' : 'bg-white/10 text-nexus-gray'}`}>J</button>
                            <button onClick={() => setTimeView('WEEK')} className={`px-3 py-1 rounded text-xs font-bold ${timeView === 'WEEK' ? 'bg-nexus-gold text-black' : 'bg-white/10 text-nexus-gray'}`}>S</button>
                            <button onClick={() => setTimeView('MONTH')} className={`px-3 py-1 rounded text-xs font-bold ${timeView === 'MONTH' ? 'bg-nexus-gold text-black' : 'bg-white/10 text-nexus-gray'}`}>M</button>
                        </div>
                    </div>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" fontSize={10} />
                            <YAxis stroke="#666" fontSize={10} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                            />
                            <Legend />
                            <Bar dataKey="water" name="Eau" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="dry" name="Muscu" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>
        </div>
      );
  };

  const renderComparison = () => {
    const colors = ['#E52E01', '#3B82F6'];

    const getRadarData = (category: 'flexibility' | 'dry' | 'water') => {
        if (selectedAthletes.length === 0) return [];
        const baseAth = athletes.find(a => a.id === selectedAthletes[0]);
        if (!baseAth || !baseAth.performance[category].length) return [];
        return baseAth.performance[category].map(m => {
            const point: any = { subject: m.subject, fullMark: m.fullMark };
            if (selectedAthletes.length === 1) {
                point[baseAth.lastName] = m.A;
                point['Moy. Équipe'] = m.fullMark * 0.7;
            } else {
                selectedAthletes.forEach(id => {
                    const ath = athletes.find(a => a.id === id);
                    if (ath) {
                        const metric = ath.performance[category].find(x => x.subject === m.subject);
                        point[ath.lastName] = metric ? metric.A : 0;
                    }
                });
            }
            return point;
        });
    };

    const statsData = [
        { subject: 'Buts', fullMark: 70 },
        { subject: 'Excl.', fullMark: 20 },
        { subject: 'Matchs', fullMark: 10 },
        { subject: 'Pénaltys', fullMark: 10 }
    ].map(s => {
        const point: any = { subject: s.subject, fullMark: s.fullMark };
        selectedAthletes.forEach((id, idx) => {
            const ath = athletes.find(a => a.id === id);
            if (ath) {
                const fedN1 = ath.federationStats?.find(f => f.competition === 'N1');
                if (s.subject === 'Buts') point[ath.lastName] = fedN1?.goals ?? ath.stats.goals;
                if (s.subject === 'Excl.') point[ath.lastName] = fedN1?.exclusions ?? ath.stats.exclusions;
                if (s.subject === 'Matchs') point[ath.lastName] = fedN1?.matchesPlayed ?? ath.stats.matchesPlayed;
                if (s.subject === 'Pénaltys') point[ath.lastName] = fedN1?.penalties ?? 0;
            }
        });
        if (selectedAthletes.length === 1) {
            const ath = athletes.find(a => a.id === selectedAthletes[0]);
            if (ath) point['Moy. Équipe'] = s.fullMark * 0.5;
        }
        return point;
    });

    const renderRadar = (title: string, data: any[]) => (
        <GlassCard className="p-2 h-[260px]">
            <h4 className="text-center text-xs font-bold uppercase text-nexus-gray mb-1">{title}</h4>
            {data.length === 0 ? (
                <div className="flex items-center justify-center h-full text-nexus-gray text-xs italic">Pas de données</div>
            ) : (
            <ResponsiveContainer width="100%" height="85%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 9 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                    {selectedAthletes.length === 1 ? (
                        <>
                            <Radar name={athletes.find(a => a.id === selectedAthletes[0])?.lastName} dataKey={athletes.find(a => a.id === selectedAthletes[0])?.lastName || ''} stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} />
                            <Radar name="Moy. Équipe" dataKey="Moy. Équipe" stroke="#9CA3AF" fill="#9CA3AF" fillOpacity={0.1} />
                        </>
                    ) : (
                        selectedAthletes.map((id, idx) => {
                            const ath = athletes.find(a => a.id === id);
                            return <Radar key={id} name={ath?.lastName} dataKey={ath?.lastName || ''} stroke={colors[idx]} fill={colors[idx]} fillOpacity={0.3} />;
                        })
                    )}
                    <Legend wrapperStyle={{fontSize: '9px'}} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                </RadarChart>
            </ResponsiveContainer>
            )}
        </GlassCard>
    );

    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-in fade-in">
        {/* Sidebar - always visible */}
        <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto pr-2">
            <p className="text-xs text-nexus-gray uppercase mb-2 font-bold">Sélection (Max 2)</p>
            {athletes.map(ath => (
                <div 
                    key={ath.id} 
                    onClick={() => {
                        if (selectedAthletes.includes(ath.id)) {
                            setSelectedAthletes(selectedAthletes.filter(id => id !== ath.id));
                        } else {
                            if (selectedAthletes.length < 2) setSelectedAthletes([...selectedAthletes, ath.id]);
                        }
                    }}
                    className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${selectedAthletes.includes(ath.id) ? 'bg-white/10 border-nexus-gold' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                >
                    <span className="text-white font-bold text-sm">{ath.firstName} {ath.lastName}</span>
                    {selectedAthletes.includes(ath.id) && <span className="text-nexus-gold text-sm">✓</span>}
                </div>
            ))}
        </div>

        {/* Charts area */}
        <div className="lg:col-span-3">
          {selectedAthletes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-nexus-gray">
              <span className="text-4xl mb-3">👆</span>
              <p className="text-sm font-bold uppercase tracking-widest">Sélectionnez un athlète</p>
              <p className="text-xs mt-1 opacity-60">Jusqu'à 2 joueurs en comparaison</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  {renderRadar('Flexibilité', getRadarData('flexibility'))}
                  {renderRadar('Tests Sec', getRadarData('dry'))}
                  {renderRadar('Tests Eau', getRadarData('water'))}
                  {renderRadar('Stats FFN (N1)', statsData)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <GlassCard className="p-4 h-[200px]">
                      <h4 className="text-center text-xs font-bold uppercase text-nexus-gray mb-2">Présence (%)</h4>
                      <ResponsiveContainer width="100%" height="85%">
                          <BarChart data={selectedAthletes.map(id => {
                              const ath = athletes.find(a => a.id === id);
                              return { name: ath?.lastName, Eau: ath?.monitoring.waterAttendance, Muscu: ath?.monitoring.dryAttendance };
                          })}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                              <XAxis dataKey="name" stroke="#666" fontSize={10} />
                              <YAxis stroke="#666" fontSize={10} domain={[0, 100]} />
                              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                              <Legend wrapperStyle={{fontSize: '10px'}} />
                              <Bar dataKey="Eau" fill="#3B82F6" />
                              <Bar dataKey="Muscu" fill="#EF4444" />
                          </BarChart>
                      </ResponsiveContainer>
                  </GlassCard>
                  <GlassCard className="p-4 h-[200px]">
                      <h4 className="text-center text-xs font-bold uppercase text-nexus-gray mb-2">RPE Moyen</h4>
                      <ResponsiveContainer width="100%" height="85%">
                          <BarChart data={selectedAthletes.map(id => {
                              const ath = athletes.find(a => a.id === id);
                              return { name: ath?.lastName, Eau: ath?.monitoring.waterRpe, Muscu: ath?.monitoring.dryRpe };
                          })}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                              <XAxis dataKey="name" stroke="#666" fontSize={10} />
                              <YAxis stroke="#666" fontSize={10} domain={[0, 10]} />
                              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                              <Legend wrapperStyle={{fontSize: '10px'}} />
                              <Bar dataKey="Eau" fill="#3B82F6" />
                              <Bar dataKey="Muscu" fill="#EF4444" />
                          </BarChart>
                      </ResponsiveContainer>
                  </GlassCard>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMonitoring = () => {
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {athletes.map(ath => {
                    const zScore = calculateZScore(ath);
                    const acwr = calculateACWR([...ath.monitoring.waterHistory, ...ath.monitoring.dryHistory]);
                    
                    // Calculate Averages from Daily Logs
                    let avgSleep = 0, avgNutrition = 0, avgDoms = 0;
                    if (ath.dailyLogs && ath.dailyLogs.length > 0) {
                        const recent = ath.dailyLogs.slice(0, 7);
                        avgSleep = recent.reduce((a,b) => a + b.sleep, 0) / recent.length;
                        avgNutrition = recent.reduce((a,b) => a + b.foodQuality, 0) / recent.length;
                        avgDoms = recent.reduce((a,b) => a + b.soreness, 0) / recent.length;
                    }

                    return (
                        <GlassCard 
                            key={ath.id} 
                            className="p-4 border-l-2 border-l-white/10 hover:border-l-nexus-gold transition-all cursor-pointer group"
                            onClick={() => alert(`Historique détaillé pour ${ath.firstName} (À implémenter)`)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-white group-hover:text-nexus-gold transition-colors">{ath.firstName} {ath.lastName}</h4>
                                    <span className="text-[10px] text-nexus-gray uppercase">{ath.type}</span>
                                </div>
                                <div className="text-right">
                                    <span className={`block text-xl font-display ${zScore < 60 ? 'text-red-500' : 'text-green-500'}`}>{zScore}%</span>
                                    <span className="text-[8px] text-nexus-gray uppercase">Z-Score</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-center my-4">
                                <Gauge value={acwr.ratio} size={100} label="ACWR" />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-center border-t border-white/5 pt-2">
                                <div>
                                    <span className="block text-white font-bold">{avgSleep.toFixed(1)}</span>
                                    <span className="text-[8px] text-nexus-gray uppercase">Sommeil</span>
                                </div>
                                <div>
                                    <span className="block text-white font-bold">{avgNutrition.toFixed(1)}</span>
                                    <span className="text-[8px] text-nexus-gray uppercase">Nutrition</span>
                                </div>
                                <div>
                                    <span className="block text-white font-bold">{avgDoms.toFixed(1)}</span>
                                    <span className="text-[8px] text-nexus-gray uppercase">DOMS</span>
                                </div>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>
        </div>
    );
  };

  const renderEntry = () => (
      <div className="max-w-2xl mx-auto animate-in fade-in space-y-8">
          <GlassCard className="p-6">
              <h3 className="font-display text-xl text-white uppercase mb-6">Saisie Manuelle Session</h3>
              
              <div className="space-y-4">
                  {/* Athlete Select */}
                  <div>
                      <label className="text-xs text-nexus-gray uppercase font-bold block mb-2">Athlète</label>
                      <select 
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none"
                        value={entryForm.athleteId}
                        onChange={e => setEntryForm({...entryForm, athleteId: e.target.value})}
                      >
                          <option value="">Sélectionner...</option>
                          {athletes.map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
                      </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs text-nexus-gray uppercase font-bold block mb-2">Date</label>
                          <input 
                            type="date"
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none"
                            value={entryForm.date}
                            onChange={e => setEntryForm({...entryForm, date: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-xs text-nexus-gray uppercase font-bold block mb-2">Type</label>
                          <select 
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none"
                            value={entryForm.type}
                            onChange={e => setEntryForm({...entryForm, type: e.target.value})}
                          >
                              <option value="WATER-POLO">Water-Polo</option>
                              <option value="MUSCU">Musculation</option>
                              <option value="MATCH">Match</option>
                              <option value="KINE">Kiné</option>
                          </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs text-nexus-gray uppercase font-bold block mb-2">Durée (min)</label>
                          <input 
                            type="number"
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none"
                            value={entryForm.duration}
                            onChange={e => setEntryForm({...entryForm, duration: parseInt(e.target.value)})}
                          />
                      </div>
                      <div>
                          <label className="text-xs text-nexus-gray uppercase font-bold block mb-2">RPE (1-10)</label>
                          <input 
                            type="number" min="1" max="10"
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none"
                            value={entryForm.rpe}
                            onChange={e => setEntryForm({...entryForm, rpe: parseInt(e.target.value)})}
                          />
                      </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                      <span className="text-nexus-gray text-sm uppercase">Charge Calculée (AU)</span>
                      <span className="text-2xl font-display text-nexus-gold">{calculateLoad(entryForm.rpe, entryForm.duration)}</span>
                  </div>

                  <Button fullWidth onClick={handleAddSession}>Ajouter Session</Button>
              </div>
          </GlassCard>

          <GlassCard className="p-6">
              <h3 className="font-display text-xl text-white uppercase mb-4">Import Données</h3>
              <p className="text-nexus-gray text-sm mb-4">Importez vos fichiers CSV ou Excel pour mettre à jour la base de données.</p>
              
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-nexus-gold/50 transition-colors cursor-pointer">
                  <span className="text-4xl block mb-2">📂</span>
                  <span className="text-white font-bold block">Glisser-déposer ou cliquer</span>
                  <span className="text-xs text-nexus-gray uppercase">CSV, XLSX supportés</span>
              </div>
          </GlassCard>
      </div>
  );

  return (
    <div className="px-6 pb-24">
      {/* Sub Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        <button onClick={() => setActiveTab('OVERVIEW')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all ${activeTab === 'OVERVIEW' ? 'bg-nexus-gold text-black' : 'bg-white/5 text-nexus-gray hover:text-white'}`}>Vue d'ensemble</button>
        <button onClick={() => setActiveTab('COMPARISON')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all ${activeTab === 'COMPARISON' ? 'bg-nexus-gold text-black' : 'bg-white/5 text-nexus-gray hover:text-white'}`}>Comparaison</button>
        <button onClick={() => setActiveTab('MONITORING')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all ${activeTab === 'MONITORING' ? 'bg-nexus-gold text-black' : 'bg-white/5 text-nexus-gray hover:text-white'}`}>Charge & Monitoring</button>
        <button onClick={() => setActiveTab('ENTRY')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all ${activeTab === 'ENTRY' ? 'bg-nexus-gold text-black' : 'bg-white/5 text-nexus-gray hover:text-white'}`}>Saisie & Import</button>
      </div>

      {activeTab === 'OVERVIEW' && renderOverview()}
      {activeTab === 'COMPARISON' && renderComparison()}
      {activeTab === 'MONITORING' && renderMonitoring()}
      {activeTab === 'ENTRY' && renderEntry()}
    </div>
  );
};
