import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "font-display font-bold uppercase tracking-wide py-3 px-6 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-nexus-red text-white shadow-[0_0_15px_rgba(229,46,1,0.4)] hover:bg-red-600 hover:shadow-[0_0_25px_rgba(229,46,1,0.6)]",
    secondary: "bg-transparent border border-nexus-gold text-nexus-gold hover:bg-nexus-gold/10",
    ghost: "bg-white/5 text-nexus-gray hover:bg-white/10 hover:text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};