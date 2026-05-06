import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { RadarMetric } from '../../types';

interface RadarPerfProps {
  data: RadarMetric[];
  color?: string;
}

export const RadarPerf: React.FC<RadarPerfProps> = ({ data, color = "#FF0055" }) => {
  if (!data || data.length === 0) return <div className="text-center text-xs text-gray-500 py-10">Données insuffisantes</div>;

  const maxVal = Math.max(...data.map(d => d.fullMark)) || 100;

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'Montserrat', fontWeight: 600 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, maxVal]} tick={false} axisLine={false} />
          {/* Athlete: Pink */}
          <Radar
            name="Moi"
            dataKey="A"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.4}
          />
          {/* Team Average: Yellow/Gold */}
          <Radar
            name="Moyenne Équipe"
            dataKey="B"
            stroke="#FFA14D"
            strokeWidth={2}
            fill="#FFA14D"
            fillOpacity={0.1}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            labelStyle={{ color: '#9CA3AF', marginBottom: '5px' }}
          />
          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconType="circle" />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};