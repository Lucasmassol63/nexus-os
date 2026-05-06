import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  accentColor?: 'nexus-red' | 'nexus-gold' | 'white';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  onClick,
  accentColor = 'white' 
}) => {
  const borderColors = {
    'nexus-red': 'border-nexus-red/30',
    'nexus-gold': 'border-nexus-gold/30',
    'white': 'border-white/10'
  };

  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden
        bg-black/40 backdrop-blur-md 
        border ${borderColors[accentColor]}
        rounded-2xl shadow-xl
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:bg-black/50 hover:scale-[1.01]' : ''}
        ${className}
      `}
    >
      {/* Subtle Gradient Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};