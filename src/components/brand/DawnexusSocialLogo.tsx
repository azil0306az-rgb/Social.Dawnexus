import React from 'react';

interface DawnexusSocialLogoProps {
  variant?: 'full' | 'symbol' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showBadge?: boolean;
}

export const DawnexusSocialLogo: React.FC<DawnexusSocialLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showBadge = true,
}) => {
  const heights = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  };

  const symbolHeights = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  if (variant === 'symbol') {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <picture>
          <source srcSet="/brand/dawnexus-d-symbol.webp" type="image/webp" />
          <img
            src="/brand/dawnexus-d-symbol.png"
            alt="Dawnexus D Symbol"
            className={`${symbolHeights[size]} object-contain drop-shadow-[0_0_12px_rgba(199,255,77,0.2)]`}
            loading="eager"
          />
        </picture>
        {showBadge && (
          <span 
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#C7FF4D] border-2 border-[#050505] shadow-[0_0_8px_#C7FF4D]"
            title="Dawnexus Social Active"
          />
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 shrink-0 select-none ${className}`}>
      {/* Authoritative Dawnexus Primary Logo */}
      <picture className="flex items-center">
        <source srcSet="/brand/dawnexus-horizontal.webp" type="image/webp" />
        <img
          src="/brand/dawnexus-horizontal.png"
          alt="Dawnexus Official Logo"
          className={`${heights[size]} w-auto object-contain transition-transform duration-200`}
          loading="eager"
        />
      </picture>

      {/* Product Lockup Divider */}
      <div className="h-5 w-px bg-[#252525]" aria-hidden="true" />

      {/* SOCIAL Product Lockup Tag */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-[#C7FF4D] px-2 py-0.5 rounded bg-[#C7FF4D]/10 border border-[#C7FF4D]/30 shadow-[0_0_12px_rgba(199,255,77,0.15)]">
          SOCIAL
        </span>
      </div>
    </div>
  );
};
