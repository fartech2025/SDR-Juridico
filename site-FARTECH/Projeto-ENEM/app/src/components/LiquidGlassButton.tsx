import React from 'react';

interface LiquidGlassButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'info' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export default function LiquidGlassButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  onClick 
}: LiquidGlassButtonProps) {
  
  const variants = {
    primary: {
      container: 'bg-white/[0.03] border-blue-400/40 hover:border-blue-400/60',
      innerGlow: 'from-blue-500/15 via-cyan-500/10 to-blue-500/15',
      liquidLayer: 'bg-gradient-to-br from-blue-400/20 via-cyan-400/15 to-blue-500/20',
      shimmer: 'from-transparent via-blue-300/30 to-transparent',
      hoverGlow: 'from-blue-400/30 via-cyan-400/20 to-blue-500/30',
      text: 'text-blue-300'
    },
    success: {
      container: 'bg-white/[0.04] border-emerald-400/40 hover:border-emerald-400/60',
      innerGlow: 'from-emerald-500/15 via-green-500/10 to-emerald-500/15',
      liquidLayer: 'bg-gradient-to-br from-emerald-400/20 via-green-400/15 to-emerald-500/20',
      shimmer: 'from-transparent via-emerald-300/30 to-transparent',
      hoverGlow: 'from-emerald-400/30 via-green-400/20 to-emerald-500/30',
      text: 'text-emerald-300'
    },
    info: {
      container: 'bg-white/[0.03] border-cyan-400/40 hover:border-cyan-400/60',
      innerGlow: 'from-cyan-500/15 via-blue-500/10 to-cyan-500/15',
      liquidLayer: 'bg-gradient-to-br from-cyan-400/20 via-blue-400/15 to-cyan-500/20',
      shimmer: 'from-transparent via-cyan-300/30 to-transparent',
      hoverGlow: 'from-cyan-400/30 via-blue-400/20 to-cyan-500/30',
      text: 'text-cyan-300'
    },
    warning: {
      container: 'bg-white/[0.03] border-orange-400/40 hover:border-orange-400/60',
      innerGlow: 'from-orange-500/15 via-yellow-500/10 to-orange-500/15',
      liquidLayer: 'bg-gradient-to-br from-orange-400/20 via-yellow-400/15 to-orange-500/20',
      shimmer: 'from-transparent via-orange-300/30 to-transparent',
      hoverGlow: 'from-orange-400/30 via-yellow-400/20 to-orange-500/30',
      text: 'text-orange-300'
    }
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  const variantStyles = variants[variant];
  const sizeStyles = sizes[size];

  return (
    <button
      onClick={onClick}
      className={`
        relative group overflow-hidden
        ${sizeStyles}
        rounded-xl
        border
        ${variantStyles.container}
        backdrop-blur-xl
        shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]
        transition-all duration-500
        hover:scale-[1.02]
        hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.35)]
        active:scale-[0.98]
        ${className}
      `}
    >
      {/* Inner Glow Layer */}
      <div className={`
        absolute inset-0
        bg-gradient-to-br ${variantStyles.innerGlow}
        opacity-100
        transition-opacity duration-500
        group-hover:opacity-80
      `} />

      {/* Liquid Glass Layer - Flowing Effect */}
      <div className={`
        absolute inset-0
        ${variantStyles.liquidLayer}
        opacity-0
        group-hover:opacity-100
        transition-all duration-700
        animate-liquid-flow
      `} />

      {/* Shimmer Effect - Liquid Reflection */}
      <div className={`
        absolute inset-0
        bg-gradient-to-r ${variantStyles.shimmer}
        opacity-0
        group-hover:opacity-100
        transition-opacity duration-500
        translate-x-[-100%]
        group-hover:translate-x-[100%]
        group-hover:transition-transform
        group-hover:duration-1000
      `} />

      {/* Bubble Particles */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/40 rounded-full animate-bubble-float" />
        <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-white/30 rounded-full animate-bubble-float" style={{ animationDelay: '0.3s' }} />
        <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-white/35 rounded-full animate-bubble-float" style={{ animationDelay: '0.6s' }} />
      </div>

      {/* Ripple Effect on Click */}
      <div className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-white/10 rounded-xl animate-ripple" />
      </div>

      {/* Hover Glow - External */}
      <div className={`
        absolute -inset-1
        bg-gradient-to-r ${variantStyles.hoverGlow}
        rounded-xl
        blur-lg
        opacity-0
        group-hover:opacity-100
        transition-opacity duration-500
        -z-10
      `} />

      {/* Glass Reflection Top Edge */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />

      {/* Content */}
      <div className={`relative z-10 flex items-center gap-2 font-bold ${variantStyles.text} transition-all duration-300 group-hover:text-white`}>
        {children}
      </div>
    </button>
  );
}
