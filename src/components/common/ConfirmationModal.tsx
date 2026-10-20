import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  consequentialDetails?: {
    actionLabel: string;
    currentValue?: string;
    newValue: string;
    estimatedCostImpact?: string;
    affectedPlatforms?: string[];
  };
  confirmButtonText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  requireTextMatch?: string; // Optional typed confirmation (e.g. "CONFIRM" or workspace name)
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  consequentialDetails,
  confirmButtonText = 'Confirm & Execute Action',
  variant = 'warning',
  requireTextMatch,
}) => {
  const [typedInput, setTypedInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isMatchValid = requireTextMatch ? typedInput.trim() === requireTextMatch : true;

  const handleConfirm = async () => {
    if (!isMatchValid) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#0B0B0B] border border-[#252525] rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Accent Line */}
        <div 
          className={`absolute top-0 left-0 right-0 h-1 ${
            variant === 'danger' ? 'bg-red-500' : 'bg-[#C7FF4D]'
          }`} 
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              variant === 'danger' 
                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                : 'bg-[#C7FF4D]/10 text-[#C7FF4D] border border-[#C7FF4D]/30'
            }`}>
              {variant === 'danger' ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-[#A5A5A5] mt-0.5">Consequential Action Safeguard</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A5A5A5] hover:text-white hover:bg-[#141414] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-[#A5A5A5] mt-4 leading-relaxed">
          {description}
        </p>

        {/* Consequential Financial / Operational Breakdown */}
        {consequentialDetails && (
          <div className="mt-4 p-4 rounded-xl bg-[#141414] border border-[#252525] space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#252525]">
              <span className="text-[#A5A5A5]">Action:</span>
              <span className="font-semibold text-white">{consequentialDetails.actionLabel}</span>
            </div>

            {consequentialDetails.currentValue && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A5A5A5]">Current Value:</span>
                <span className="text-[#A5A5A5] font-mono line-through">{consequentialDetails.currentValue}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A5A5A5]">New Target Value:</span>
              <span className="text-[#C7FF4D] font-mono font-bold text-sm">{consequentialDetails.newValue}</span>
            </div>

            {consequentialDetails.estimatedCostImpact && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#252525]">
                <span className="text-amber-400 font-medium">Est. Financial Impact:</span>
                <span className="text-amber-400 font-mono font-semibold">{consequentialDetails.estimatedCostImpact}</span>
              </div>
            )}
          </div>
        )}

        {/* Typed Input Requirement (Optional) */}
        {requireTextMatch && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-[#A5A5A5] mb-1.5">
              Type <span className="font-mono text-white font-bold">{requireTextMatch}</span> to confirm:
            </label>
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={requireTextMatch}
              className="w-full px-3.5 py-2 text-sm bg-[#141414] border border-[#252525] rounded-lg text-white focus:outline-none focus:border-[#C7FF4D] focus:ring-1 focus:ring-[#C7FF4D]"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#252525]">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            disabled={!isMatchValid}
            isLoading={isSubmitting}
            onClick={handleConfirm}
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
};

