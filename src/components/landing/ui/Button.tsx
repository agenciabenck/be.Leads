import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  icon,
  ...props 
}) => {
  // Base Styles: Standardized to font-bold and tracking-wide
  const baseStyles = "relative overflow-hidden font-bold transition-all duration-200 rounded-2xl flex items-center justify-center gap-2 group tracking-wide select-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    // Primary: Strong Blue, Colored Shadow Glow
    primary: "bg-[#0068ff] text-white hover:bg-[#0055d4] shadow-[0_4px_14px_0_rgba(0,104,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,104,255,0.23)] hover:-translate-y-0.5 border border-white/10",
    
    // Secondary: Glass feel for Dark Mode, clean for light
    secondary: "bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]",
    
    // Outline: Blue border
    outline: "bg-transparent border-2 border-[#0068ff] text-[#0068ff] hover:bg-[#0068ff]/5",
    
    // Ghost: Simple text
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-5 py-2 text-sm h-10",
    md: "px-8 py-3 text-base h-12",
    lg: "px-10 py-4 text-lg h-14",
  };

  // Shimmer Effect: only for primary
  const shimmer = variant === 'primary' ? (
    <>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] translate-x-[-200%] animate-[shimmer_3s_infinite]" />
      {/* Inner Ring for depth */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20 pointer-events-none"></div>
    </>
  ) : null;

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {shimmer}
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {icon && <span className="group-hover:translate-x-1 transition-transform duration-300">{icon}</span>}
      </span>
    </button>
  );
};

export default Button;