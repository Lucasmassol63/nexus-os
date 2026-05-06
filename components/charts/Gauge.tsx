import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

interface GaugeProps {
  value: number; // Ratio value (e.g., 0.5, 1.0, 1.5)
  label?: string;
  size?: number;
}

export const Gauge: React.FC<GaugeProps> = ({ value, label, size = 150 }) => {
  // Gauge Logic
  // Range: 0 to 2.0
  // Sections:
  // 0 - 0.8: Blue (#3B82F6)
  // 0.8 - 1.2: Green (#10B981)
  // 1.2 - 2.0: Red (#EF4444)
  
  const data = [
    { name: 'Low', value: 0.8, color: '#3B82F6' },
    { name: 'Optimal', value: 0.4, color: '#10B981' }, // 0.8 to 1.2 is 0.4 width
    { name: 'High', value: 0.8, color: '#EF4444' }, // 1.2 to 2.0 is 0.8 width
  ];

  const cx = size / 2;
  const cy = size / 2;
  const iR = size / 2 - 20;
  const oR = size / 2;

  // Calculate needle angle
  // Total range is 2.0. 180 degrees.
  // Angle = 180 - (value / 2.0) * 180
  const clampedValue = Math.min(Math.max(value, 0), 2.0);
  const angle = 180 - (clampedValue / 2.0) * 180;

  const needleLength = iR - 5;
  const needleRad = (angle * Math.PI) / 180;
  const nx = cx + needleLength * Math.cos(needleRad);
  const ny = cy - needleLength * Math.sin(needleRad);

  // Calculate label positions for 0.8 and 1.2
  // 0.8 is at: 180 - (0.8/2.0)*180 = 180 - 72 = 108 degrees
  // 1.2 is at: 180 - (1.2/2.0)*180 = 180 - 108 = 72 degrees
  const radiusLabel = iR - 15;
  const rad08 = (108 * Math.PI) / 180;
  const x08 = cx + radiusLabel * Math.cos(rad08);
  const y08 = cy - radiusLabel * Math.sin(rad08);

  const rad12 = (72 * Math.PI) / 180;
  const x12 = cx + radiusLabel * Math.cos(rad12);
  const y12 = cy - radiusLabel * Math.sin(rad12);

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size / 2 + 40 }}>
      <PieChart width={size} height={size / 2 + 20}>
        <Pie
          dataKey="value"
          startAngle={180}
          endAngle={0}
          data={data}
          cx={cx}
          cy={cy}
          innerRadius={iR}
          outerRadius={oR}
          fill="#8884d8"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
      
      {/* Limit Labels */}
      <div className="absolute text-[8px] font-bold text-white" style={{ left: x08 - 6, top: y08 - 4 }}>0.8</div>
      <div className="absolute text-[8px] font-bold text-white" style={{ left: x12 - 6, top: y12 - 4 }}>1.2</div>

      {/* Modern Needle */}
      <svg width={size} height={size} className="absolute top-0 left-0 pointer-events-none">
        {/* Center Circle */}
        <circle cx={cx} cy={cy} r="6" fill="#FFFFFF" />
        {/* Needle Line */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      </svg>

      {/* Value Label */}
      <div className="absolute bottom-0 text-center">
        <span className="block text-2xl font-display text-white font-bold">{value.toFixed(2)}</span>
        {label && <span className="text-[10px] text-nexus-gray uppercase">{label}</span>}
      </div>
    </div>
  );
};
