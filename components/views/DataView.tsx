import React, { useState, useRef, useCallback } from 'react';
import { Athlete, MonitoringDay } from '../../types';
import { db, TEAM_STATS } from '../../services/mockDb';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Gauge } from '../charts/Gauge';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line
} from 'recharts';

interface DataViewProps {
  athletes: Athlete[];
  onUpdate: () => void;
}

type SubTab = 'OVERVIEW' | 'COMPARISON' | 'MONITORING' | 'ENTRY';
type TimeView = 'DAY' | 'WEEK' | 'MONTH';

export const DataView: React.FC<DataViewProps> = ({ athletes, onUpdate }) => {
  const [activeTab, setActiveTab]           = useState<SubTab>('OVERVIEW');
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [timeView, setTimeView]             = useState<TimeView>('DAY');
  const [dateCursor, setDateCursor]         = useState(new Date());
  const [importStatus, setImportStatus]     = useState<string>('');
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'WATER-POLO',
    duration: 90,
    rpe: 7,
    athleteId: '',
  });

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  const calculateLoad = (rpe: number, duration: number) => rpe * duration;

  const calculateACWR = (history: MonitoringDay[]) => {
    const sorted = [...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const acute   = sorted.slice(0, 7);
    const chronic = sorted.slice(0, 28);
    const acuteLoad   = acute.reduce((acc, d) => acc + (d.load || d.rpe * 60 || 0), 0) / (acute.length   || 1);
    const chronicLoad = chronic.reduce((acc, d) => acc + (d.load || d.rpe * 60 || 0), 0) / (chronic.length || 1);
    const ratio = chronicLoad === 0 ? 0 : acuteLoad / chronicLoad;
    return { ratio: parseFloat(ratio.toFixed(2)), acute: Math.round(acuteLoad), chronic: Math.round(chronicLoad) };
  };

  const calculateZScore = (athlete: Athlete) => {
    const log = athlete.lastCheckIn;
    if (!log) return null;
    const s = (log.sleep / 10) * 100;
    const f = (10 - log.fatigue) * 10;
    const r = (10 - log.soreness) * 10;
    const m = (log.mood / 10) * 100;
    const n = (log.foodQuality / 10) * 100;
    return Math.round((s + f + r + m + n) / 5);
  };

  const getTeamAverageStats = () => {
    let rpe = 0, rpeN = 0, sleep = 0, sleepN = 0, nutrition = 0, nutN = 0, doms = 0, domsN = 0;
    athletes.forEach(a => {
      (a.dailyLogs || []).forEach(l => {
        sleep += l.sleep; sleepN++;
        nutrition += l.foodQuality; nutN++;
        doms += l.soreness; domsN++;
      });
      a.monitoring.waterHistory.forEach(h => { if (h.rpe) { rpe += h.rpe; rpeN++; } });
      a.monitoring.dryHistory.forEach(h =>   { if (h.rpe) { rpe += h.rpe; rpeN++; } });
    });
    return {
      rpe:       rpeN   ? (rpe       / rpeN).toFixed(1)       : '-',
      sleep:     sleepN ? (sleep     / sleepN).toFixed(1)     : '-',
      nutrition: nutN   ? (nutrition / nutN).toFixed(1)       : '-',
      doms:      domsN  ? (doms      / domsN).toFixed(1)      : '-',
    };
  };

  // Real load aggregation (no Math.random)
  const getChartData = () => {
    const days  = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
    const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];

    if (timeView === 'DAY') {
      // Current week Mon→Sun
      const weekStart = new Date(dateCursor);
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - day + (day === 0 ? -6 : 1));
      weekStart.setHours(0, 0, 0, 0);

      return days.map((d, i) => {
        const target = new Date(weekStart);
        target.setDate(weekStart.getDate() + i);
        const dateStr = target.toISOString().split('T')[0];
        let waterLoad = 0, dryLoad = 0, count = 0;
        athletes.forEach(a => {
          const w = a.monitoring.waterHistory.find(h => h.date === dateStr);
          if (w) { waterLoad += w.load || w.rpe * 60; count++; }
          const dr = a.monitoring.dryHistory.find(h => h.date === dateStr);
          if (dr) dryLoad += dr.load || dr.rpe * 60;
        });
        const n = athletes.length || 1;
        return { name: d, water: Math.round(waterLoad / n), dry: Math.round(dryLoad / n) };
      });
    }

    if (timeView === 'WEEK') {
      // 4 weeks of current month
      const year  = dateCursor.getFullYear();
      const month = dateCursor.getMonth();
      return Array.from({ length: 4 }, (_, i) => {
        let waterLoad = 0, dryLoad = 0;
        athletes.forEach(a => {
          [...a.monitoring.waterHistory, ...a.monitoring.dryHistory].forEach(h => {
            const d = new Date(h.date);
            if (d.getFullYear() === year && d.getMonth() === month) {
              const weekNum = Math.floor((d.getDate() - 1) / 7);
              if (weekNum === i) {
                const load = h.load || h.rpe * 60;
                if (a.monitoring.waterHistory.includes(h)) waterLoad += load;
                else dryLoad += load;
              }
            }
          });
        });
        const n = athletes.length || 1;
        return { name: `S${i + 1}`, water: Math.round(waterLoad / n), dry: Math.round(dryLoad / n) };
      });
    }

    // MONTH view: Jan→Dec of current year
    const year = dateCursor.getFullYear();
    return months.map((m, i) => {
      let waterLoad = 0, dryLoad = 0;
      athletes.forEach(a => {
        a.monitoring.waterHistory.forEach(h => {
          const d = new Date(h.date);
          if (d.getFullYear() === year && d.getMonth() === i) waterLoad += h.load || h.rpe * 60;
        });
        a.monitoring.dryHistory.forEach(h => {
          const d = new Date(h.date);
          if (d.getFullYear() === year && d.getMonth() === i) dryLoad += h.load || h.rpe * 60;
        });
      });
      const n = athletes.length || 1;
      return { name: m, water: Math.round(waterLoad / n), dry: Math.round(dryLoad / n) };
    });
  };

  const handlePrev = () => {
    const d = new Date(dateCursor);
    if (timeView === 'DAY')   d.setDate(d.getDate() - 7);
    if (timeView === 'WEEK')  d.setMonth(d.getMonth() - 1);
    if (timeView === 'MONTH') d.setFullYear(d.getFullYear() - 1);
    setDateCursor(d);
  };

  const handleNext = () => {
    const d = new Date(dateCursor);
    if (timeView === 'DAY')   d.setDate(d.getDate() + 7);
    if (timeView === 'WEEK')  d.setMonth(d.getMonth() + 1);
    if (timeView === 'MONTH') d.setFullYear(d.getFullYear() + 1);
    setDateCursor(d);
  };

  const handleAddSession = async () => {
    if (!entryForm.athleteId) { alert('Sélectionnez un athlète'); return; }
    // @ts-ignore
    await db.addSessionLog(entryForm.athleteId, entryForm.date, entryForm.type, entryForm.duration, entryForm.rpe);
    alert(`Session ajoutée ! Charge : ${calculateLoad(entryForm.rpe, entryForm.duration)} AU`);
    onUpdate();
  };

  // ─── WORKING CSV / EXCEL-like IMPORT ────────────────────────────────────────
  // Accepts CSV with header: athlete_code,date,type,duration,rpe
  const handleFileImport = useCallback((file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { setImportStatus('❌ Fichier vide ou sans données'); return; }

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const codeIdx     = headers.indexOf('code');
      const dateIdx     = headers.indexOf('date');
      const typeIdx     = headers.indexOf('type');
      const durationIdx = headers.indexOf('duree') !== -1 ? headers.indexOf('duree') : headers.indexOf('duration');
      const rpeIdx      = headers.indexOf('rpe');

      if ([codeIdx, dateIdx, typeIdx, durationIdx, rpeIdx].some(i => i === -1)) {
        setImportStatus('❌ Colonnes attendues : code, date, type, duree, rpe');
        return;
      }

      let imported = 0, errors = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        const code     = cols[codeIdx];
        const date     = cols[dateIdx];
        const type     = cols[typeIdx]?.toUpperCase();
        const duration = parseInt(cols[durationIdx]) || 60;
        const rpe      = parseFloat(cols[rpeIdx]) || 5;

        const athlete = athletes.find(a => a.code === code);
        if (!athlete) { errors++; continue; }

        try {
          // @ts-ignore
          await db.addSessionLog(athlete.id, date, type, duration, rpe);
          imported++;
        } catch { errors++; }
      }

      setImportStatus(`✅ ${imported} sessions importées${errors ? ` · ${errors} erreurs` : ''}`);
      if (imported > 0) onUpdate();
    };
    reader.readAsText(file, 'UTF-8');
  }, [athletes, onUpdate]);

  // ─── RENDERERS ──────────────────────────────────────────────────────────────

  const renderOverview = () => {
    const chartData = getChartData();
    const teamStats = getTeamAverageStats();
    const teamAcwr  = athletes.reduce((acc, a) => {
      return acc + calculateACWR([...a.monitoring.waterHistory, ...a.monitoring.dryHistory]).ratio;
    }, 0) / (athletes.length || 1);

    const waterAttPct = (() => {
      let total = 0, present = 0;
      athletes.forEach(a => a.monitoring.waterHistory.forEach(h => { total++; if (h.attendance === 'PRESENT') present++; }));
      return total ? Math.round((present / total) * 100) : 0;
    })();
    const dryAttPct = (() => {
      let total = 0, present = 0;
      athletes.forEach(a => a.monitoring.dryHistory.forEach(h => { total++; if (h.attendance === 'PRESENT') present++; }));
      return total ? Math.round((present / total) * 100) : 0;
    })();

    return (
      <div className="space-y-6 animate-in fade-in">
        {/* Top KPI cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <GlassCard className="p-4 flex flex-col items-center justify-center border-l-4 border-l-nexus-gold">
            <Gauge value={parseFloat(teamAcwr.toFixed(2))} size={110} label="ACWR Équipe" />
          </GlassCard>
          <GlassCard className="p-4 flex flex-col items-center justify-center border-l-4 border-l-blue-500">
            <span className="text-3xl font-display text-blue-400">{teamStats.rpe}</span>
            <span className="text-[10px] text-nexus-gray uppercase tracking-widest mt-1">RPE Moyen</span>
          </GlassCard>
          <GlassCard className="p-4 flex flex-col items-center justify-center border-l-4 border-l-green-500">
            <span className="text-3xl font-display text-green-400">{waterAttPct}%</span>
            <span className="text-[10px] text-nexus-gray uppercase tracking-widest mt-1">Présence Eau</span>
          </GlassCard>
          <GlassCard className="p-4 flex flex-col items-center justify-center border-l-4 border-l-red-500">
            <span className="text-3xl font-display text-red-400">{dryAttPct}%</span>
            <span className="text-[10px] text-nexus-gray uppercase tracking-widest mt-1">Présence Muscu</span>
          </GlassCard>
        </div>

        {/* Load chart */}
        <GlassCard className="p-6">
          <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
            <h3 className="text-white font-display text-lg uppercase">Charge d'Entraînement (AU/athlète)</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center bg-black/40 rounded-lg p-1">
                <button onClick={handlePrev} className="px-3 py-1 text-nexus-gray hover:text-white">←</button>
                <span className="text-xs font-bold text-white px-2 min-w-[90px] text-center">
                  {timeView === 'DAY'   && `Sem. du ${dateCursor.toLocaleDateString('fr-FR')}`}
                  {timeView === 'WEEK'  && dateCursor.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                  {timeView === 'MONTH' && dateCursor.getFullYear()}
                </span>
                <button onClick={handleNext} className="px-3 py-1 text-nexus-gray hover:text-white">→</button>
              </div>
              <div className="flex gap-1">
                {(['DAY', 'WEEK', 'MONTH'] as TimeView[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setTimeView(v)}
                    className={`px-3 py-1 rounded text-xs font-bold ${timeView === v ? 'bg-nexus-gold text-black' : 'bg-white/10 text-nexus-gray'}`}
                  >
                    {v === 'DAY' ? 'Jour' : v === 'WEEK' ? 'Sem.' : 'Mois'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#555" fontSize={10} tick={{ fill: '#9CA3AF' }} />
                <YAxis stroke="#555" fontSize={10} tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1628', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  formatter={(v: any) => [`${v} AU`, undefined]}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="water" name="Eau" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dry"   name="Muscu" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {chartData.every(d => d.water === 0 && d.dry === 0) && (
            <p className="text-center text-xs text-nexus-gray italic mt-2">
              Aucune donnée de charge pour cette période. Saisissez des sessions dans l'onglet Saisie.
            </p>
          )}
        </GlassCard>
      </div>
    );
  };

  // ─── COMPARISON (bug fix: sidebar always visible) ──────────────────────────
  const renderComparison = () => {
    const COLORS = ['#E52E01', '#3B82F6'];

    const getRadarData = (category: 'flexibility' | 'dry' | 'water') => {
      const base = athletes.find(a => a.id === selectedAthletes[0]);
      if (!base || base.performance[category].length === 0) return [];

      return base.performance[category].map(m => {
        const point: any = { subject: m.subject, fullMark: m.fullMark };
        if (selectedAthletes.length === 1) {
          point[base.lastName]        = m.A;
          point['Moy. Équipe']        = Math.round(m.fullMark * 0.7);
        } else {
          selectedAthletes.forEach(id => {
            const a = athletes.find(x => x.id === id);
            if (a) {
              const metric = a.performance[category].find(x => x.subject === m.subject);
              point[a.lastName] = metric?.A ?? 0;
            }
          });
        }
        return point;
      });
    };

    const renderRadarCard = (title: string, data: any[]) => {
      if (data.length === 0) return (
        <GlassCard key={title} className="p-4 h-[260px] flex items-center justify-center">
          <p className="text-nexus-gray text-xs italic">{title} — pas de données</p>
        </GlassCard>
      );

      const keys = selectedAthletes.length === 1
        ? [athletes.find(a => a.id === selectedAthletes[0])?.lastName ?? '', 'Moy. Équipe']
        : selectedAthletes.map(id => athletes.find(a => a.id === id)?.lastName ?? '');

      return (
        <GlassCard key={title} className="p-3 h-[260px]">
          <h4 className="text-center text-[10px] font-bold uppercase text-nexus-gray mb-1">{title}</h4>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 8 }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 'auto']} />
              {keys.map((k, i) => (
                <Radar
                  key={k}
                  name={k}
                  dataKey={k}
                  stroke={i === 1 && selectedAthletes.length === 1 ? '#9CA3AF' : COLORS[i]}
                  fill={i === 1  && selectedAthletes.length === 1 ? '#9CA3AF' : COLORS[i]}
                  fillOpacity={0.25}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>
      );
    };

    return (
      <div className="space-y-4 animate-in fade-in">
        {/* Athlete selector — always visible */}
        <GlassCard className="p-4">
          <p className="text-[10px] text-nexus-gray uppercase font-bold mb-3">
            Sélection (max 2) — {selectedAthletes.length === 0 ? 'choisissez un athlète' : selectedAthletes.length === 1 ? '1 sélectionné · comparaison avec moyenne équipe' : '2 sélectionnés · comparaison directe'}
          </p>
          <div className="flex flex-wrap gap-2">
            {athletes.map(a => {
              const selected = selectedAthletes.includes(a.id);
              const idx      = selectedAthletes.indexOf(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    if (selected) {
                      setSelectedAthletes(selectedAthletes.filter(id => id !== a.id));
                    } else if (selectedAthletes.length < 2) {
                      setSelectedAthletes([...selectedAthletes, a.id]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    selected
                      ? 'border-transparent text-white'
                      : 'bg-black/20 border-white/10 text-nexus-gray hover:text-white'
                  }`}
                  style={selected ? { backgroundColor: COLORS[idx] + '33', borderColor: COLORS[idx], color: COLORS[idx] } : {}}
                >
                  {a.firstName} {a.lastName}
                  {selected && <span className="ml-1">✓</span>}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Charts — only if athlete selected */}
        {selectedAthletes.length === 0 ? (
          <div className="text-center py-12 text-nexus-gray text-sm">
            Sélectionnez un ou deux athlètes ci-dessus pour afficher les graphiques de comparaison.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {renderRadarCard('Flexibilité', getRadarData('flexibility'))}
              {renderRadarCard('Force (Sec)', getRadarData('dry'))}
              {renderRadarCard('Aquatique', getRadarData('water'))}

              {/* Game stats radar */}
              {(() => {
                const statKeys = ['Buts', 'Fautes', 'Excl.', 'Matchs'];
                const maxVals  = [20, 10, 5, 15];
                const data = statKeys.map((s, si) => {
                  const point: any = { subject: s, fullMark: maxVals[si] };
                  if (selectedAthletes.length === 1) {
                    const a = athletes.find(x => x.id === selectedAthletes[0]);
                    if (a) {
                      const vals = [a.stats.goals, a.stats.fouls, a.stats.exclusions, a.stats.matchesPlayed];
                      point[a.lastName]   = vals[si];
                      point['Moy. Éq.']   = Math.round(maxVals[si] * 0.5);
                    }
                  } else {
                    selectedAthletes.forEach(id => {
                      const a = athletes.find(x => x.id === id);
                      if (a) {
                        const vals = [a.stats.goals, a.stats.fouls, a.stats.exclusions, a.stats.matchesPlayed];
                        point[a.lastName] = vals[si];
                      }
                    });
                  }
                  return point;
                });
                return renderRadarCard('Stats Match', data);
              })()}
            </div>

            {/* Bar charts */}
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="p-4 h-[200px]">
                <h4 className="text-center text-[10px] font-bold uppercase text-nexus-gray mb-2">Présence (%)</h4>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={selectedAthletes.map(id => {
                    const a = athletes.find(x => x.id === id);
                    return { name: a?.lastName, Water: a?.monitoring.waterAttendance, Muscu: a?.monitoring.dryAttendance };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#555" fontSize={9} />
                    <YAxis stroke="#555" fontSize={9} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                    <Bar dataKey="Water" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Muscu" fill="#EF4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard className="p-4 h-[200px]">
                <h4 className="text-center text-[10px] font-bold uppercase text-nexus-gray mb-2">RPE Moyen</h4>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={selectedAthletes.map(id => {
                    const a = athletes.find(x => x.id === id);
                    return { name: a?.lastName, Water: a?.monitoring.waterRpe, Muscu: a?.monitoring.dryRpe };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#555" fontSize={9} />
                    <YAxis stroke="#555" fontSize={9} domain={[0, 10]} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                    <Bar dataKey="Water" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Muscu" fill="#EF4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderMonitoring = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {athletes.map(ath => {
          const zScore = calculateZScore(ath);
          const acwr   = calculateACWR([...ath.monitoring.waterHistory, ...ath.monitoring.dryHistory]);
          const recent = (ath.dailyLogs || []).slice(0, 7);
          const avgSleep = recent.length ? recent.reduce((a, b) => a + b.sleep, 0) / recent.length : 0;
          const avgNutr  = recent.length ? recent.reduce((a, b) => a + b.foodQuality, 0) / recent.length : 0;
          const avgDoms  = recent.length ? recent.reduce((a, b) => a + b.soreness, 0) / recent.length : 0;

          return (
            <GlassCard key={ath.id} className="p-4 border-l-2 border-l-white/10 hover:border-l-nexus-gold transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-white">{ath.firstName} {ath.lastName}</h4>
                  <span className="text-[10px] text-nexus-gray uppercase">{ath.monitoring.waterAttendance}% présence</span>
                </div>
                {zScore !== null ? (
                  <div className="text-right">
                    <span className={`block text-xl font-display ${zScore < 60 ? 'text-red-400' : 'text-green-400'}`}>{zScore}%</span>
                    <span className="text-[8px] text-nexus-gray uppercase">Z-Score</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-nexus-gray italic">Pas de check-in</span>
                )}
              </div>

              <div className="flex justify-center my-3">
                <Gauge value={acwr.ratio} size={100} label="ACWR" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center border-t border-white/5 pt-3">
                {[
                  { val: avgSleep.toFixed(1),  label: 'Sommeil'   },
                  { val: avgNutr.toFixed(1),   label: 'Nutrition' },
                  { val: avgDoms.toFixed(1),   label: 'DOMS'      },
                ].map(stat => (
                  <div key={stat.label}>
                    <span className="block text-white font-bold">{stat.val}</span>
                    <span className="text-[8px] text-nexus-gray uppercase">{stat.label}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );

  const renderEntry = () => (
    <div className="max-w-2xl mx-auto animate-in fade-in space-y-8">
      {/* Manual entry */}
      <GlassCard className="p-6">
        <h3 className="font-display text-xl text-white uppercase mb-6">Saisie Manuelle</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-nexus-gray uppercase font-bold block mb-2">Athlète</label>
            <select
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none"
              value={entryForm.athleteId}
              onChange={e => setEntryForm({ ...entryForm, athleteId: e.target.value })}
            >
              <option value="">Sélectionner...</option>
              {athletes.map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-nexus-gray uppercase font-bold block mb-2">Date</label>
              <input type="date" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none"
                value={entryForm.date} onChange={e => setEntryForm({ ...entryForm, date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-nexus-gray uppercase font-bold block mb-2">Type</label>
              <select className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none"
                value={entryForm.type} onChange={e => setEntryForm({ ...entryForm, type: e.target.value })}>
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
              <input type="number" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none"
                value={entryForm.duration} onChange={e => setEntryForm({ ...entryForm, duration: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-nexus-gray uppercase font-bold block mb-2">RPE (1–10)</label>
              <input type="number" min="1" max="10" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none"
                value={entryForm.rpe} onChange={e => setEntryForm({ ...entryForm, rpe: parseInt(e.target.value) })} />
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
            <span className="text-nexus-gray text-sm uppercase">Charge calculée (AU)</span>
            <span className="text-2xl font-display text-nexus-gold">{calculateLoad(entryForm.rpe, entryForm.duration)}</span>
          </div>

          <Button fullWidth onClick={handleAddSession}>Ajouter Session</Button>
        </div>
      </GlassCard>

      {/* CSV/Excel import */}
      <GlassCard className="p-6">
        <h3 className="font-display text-xl text-white uppercase mb-2">Import CSV / Excel</h3>
        <p className="text-nexus-gray text-xs mb-1">Format attendu (colonnes obligatoires) :</p>
        <code className="block bg-black/60 rounded p-3 text-nexus-gold text-xs mb-4 font-mono">
          code, date, type, duree, rpe<br />
          1234, 2025-01-15, WATER-POLO, 90, 7<br />
          1235, 2025-01-15, MUSCU, 60, 8
        </code>

        <input
          type="file"
          accept=".csv,.txt"
          ref={fileInputRef}
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileImport(f); e.target.value = ''; }}
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-nexus-gold/50 transition-colors cursor-pointer"
        >
          <span className="text-4xl block mb-2">📂</span>
          <span className="text-white font-bold block">Cliquer pour sélectionner un fichier</span>
          <span className="text-xs text-nexus-gray uppercase mt-1 block">CSV · TXT</span>
        </div>

        {importStatus && (
          <div className={`mt-3 p-3 rounded-lg text-sm font-bold text-center ${importStatus.startsWith('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {importStatus}
          </div>
        )}

        {/* Template download */}
        <button
          onClick={() => {
            const csv = 'code,date,type,duree,rpe\n1234,2025-01-15,WATER-POLO,90,7\n1235,2025-01-15,MUSCU,60,8';
            const blob = new Blob([csv], { type: 'text/csv' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href = url; a.download = 'template_import_cnm.csv'; a.click();
            URL.revokeObjectURL(url);
          }}
          className="mt-3 w-full text-center text-xs text-nexus-gray hover:text-white transition-colors underline"
        >
          ↓ Télécharger le template CSV
        </button>
      </GlassCard>
    </div>
  );

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-6 pb-24">
      {/* Sub Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {([
          { id: 'OVERVIEW',   label: 'Vue d\'ensemble' },
          { id: 'COMPARISON', label: 'Comparaison'     },
          { id: 'MONITORING', label: 'Monitoring'      },
          { id: 'ENTRY',      label: 'Saisie & Import' },
        ] as { id: SubTab; label: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-nexus-gold text-black' : 'bg-white/5 text-nexus-gray hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'OVERVIEW'    && renderOverview()}
      {activeTab === 'COMPARISON'  && renderComparison()}
      {activeTab === 'MONITORING'  && renderMonitoring()}
      {activeTab === 'ENTRY'       && renderEntry()}
    </div>
  );
};
