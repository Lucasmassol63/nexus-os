import React from 'react';

interface GaugeProps {
  value: number; // Ratio ACWR : 0 à 2.0
  label?: string;
  size?: number;
}

/*
  Zones ACWR :
  0.0 – 0.8  → Bleu    (Sous-charge)
  0.8 – 1.2  → Vert    (Zone optimale)
  1.2 – 1.5  → Orange  (Attention)
  1.5 – 2.0  → Rouge   (Surcharge)
*/

const ZONES = [
  { from: 0,   to: 0.8, color: '#3B82F6', label: 'Sous-charge' },
  { from: 0.8, to: 1.2, color: '#10B981', label: 'Optimal'     },
  { from: 1.2, to: 1.5, color: '#F59E0B', label: 'Attention'   },
  { from: 1.5, to: 2.0, color: '#EF4444', label: 'Surcharge'   },
];

const MAX_VAL = 2.0;
// Semicircle: 180° arc from 180° (left) to 0° (right)
// value 0  → angle 180° (pointing left)
// value 1  → angle  90° (pointing up)
// value 2  → angle   0° (pointing right)

const toRad = (deg: number) => (deg * Math.PI) / 180;

const valueToAngle = (v: number): number => {
  const clamped = Math.max(0, Math.min(v, MAX_VAL));
  return 180 - (clamped / MAX_VAL) * 180; // degrees, 180→0
};

const polarToXY = (cx: number, cy: number, r: number, angleDeg: number) => ({
  x: cx + r * Math.cos(toRad(angleDeg)),
  y: cy - r * Math.sin(toRad(angleDeg)),
});

const arcPath = (
  cx: number, cy: number,
  innerR: number, outerR: number,
  startDeg: number, endDeg: number
): string => {
  const s1 = polarToXY(cx, cy, outerR, startDeg);
  const e1 = polarToXY(cx, cy, outerR, endDeg);
  const s2 = polarToXY(cx, cy, innerR, endDeg);
  const e2 = polarToXY(cx, cy, innerR, startDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return [
    `M ${s1.x} ${s1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 0 ${e1.x} ${e1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${innerR} ${innerR} 0 ${large} 1 ${e2.x} ${e2.y}`,
    'Z',
  ].join(' ');
};

export const Gauge: React.FC<GaugeProps> = ({ value, label, size = 150 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = size / 2 - 22;
  const svgH = size / 2 + 28; // Only top half + space for label

  const clamped = Math.max(0, Math.min(value, MAX_VAL));
  const needleAngle = valueToAngle(clamped);
  const needleTip = polarToXY(cx, cy, innerR - 8, needleAngle);

  // Active zone color
  const activeZone = ZONES.find(z => clamped >= z.from && clamped < z.to) || ZONES[ZONES.length - 1];
  const gaugeColor = activeZone.color;

  // Tick marks
  const ticks = [0, 0.5, 1.0, 1.5, 2.0];

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={svgH} viewBox={`0 0 ${size} ${svgH}`}>
        {/* Background arc (gray) */}
        <path
          d={arcPath(cx, cy, innerR, outerR, 0, 180)}
          fill="#1e293b"
        />

        {/* Colored zone arcs */}
        {ZONES.map((zone, i) => {
          const startDeg = valueToAngle(zone.to);   // higher value = smaller angle
          const endDeg   = valueToAngle(zone.from);
          return (
            <path
              key={i}
              d={arcPath(cx, cy, innerR, outerR, startDeg, endDeg)}
              fill={zone.color}
              opacity={0.85}
            />
          );
        })}

        {/* Tick marks */}
        {ticks.map((t, i) => {
          const ang = valueToAngle(t);
          const outer = polarToXY(cx, cy, outerR + 2, ang);
          const inner = polarToXY(cx, cy, outerR + 8, ang);
          const label = polarToXY(cx, cy, outerR + 16, ang);
          return (
            <g key={i}>
              <line
                x1={outer.x} y1={outer.y}
                x2={inner.x} y2={inner.y}
                stroke="#9CA3AF" strokeWidth="1.5"
              />
              <text
                x={label.x} y={label.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="7" fill="#9CA3AF" fontFamily="monospace"
              >
                {t.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={needleTip.x} y2={needleTip.y}
          stroke="white" strokeWidth="2" strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5" fill="white" />
        <circle cx={cx} cy={cy} r="2.5" fill="#0B1628" />

        {/* Center value */}
        <text
          x={cx} y={cy + 18}
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="white"
          fontFamily="'Oswald', sans-serif"
        >
          {clamped.toFixed(2)}
        </text>
      </svg>

      {/* Zone label below */}
      <div className="text-center mt-1 -mt-2">
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: gaugeColor }}>
          {activeZone.label}
        </span>
        {label && <span className="block text-[8px] text-gray-500 uppercase tracking-widest">{label}</span>}
      </div>
    </div>
  );
};
