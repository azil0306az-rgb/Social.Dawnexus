import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div className={`p-8 md:p-12 text-center rounded-2xl bg-[#0B0B0B] border border-[#252525] border-dashed flex flex-col items-center justify-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-[#252525] flex items-center justify-center text-[#C7FF4D] mb-4 shadow-[0_0_20px_-5px_rgba(199,255,77,0.15)]">
        {icon}
      </div>
      <h3 className="text-base md:text-lg font-bold text-white tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-sm text-[#A5A5A5] max-w-md mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="md" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

