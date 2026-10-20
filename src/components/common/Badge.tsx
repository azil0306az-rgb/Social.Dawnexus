import React from 'react';

export type BadgeVariant = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'scheduled' 
  | 'published' 
  | 'failed'
  | 'connected'
  | 'disconnected'
  | 'active'
  | 'paused'
  | 'meta'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'mcp'
  | 'lime';

interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  children,
  className = '',
  size = 'md',
}) => {
  const sizeStyles = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  const styles: Record<BadgeVariant, { bg: string; text: string; border: string; dot?: string; defaultLabel: string }> = {
    draft: {
      bg: 'bg-[#1C1C1C]',
      text: 'text-[#A5A5A5]',
      border: 'border-[#2D2D2D]',
      dot: 'bg-[#666666]',
      defaultLabel: 'Draft',
    },
    pending_approval: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
      defaultLabel: 'Pending Approval',
    },
    approved: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400',
      defaultLabel: 'Approved',
    },
    scheduled: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      dot: 'bg-cyan-400',
      defaultLabel: 'Scheduled',
    },
    published: {
      bg: 'bg-[#C7FF4D]/10',
      text: 'text-[#C7FF4D]',
      border: 'border-[#C7FF4D]/30',
      dot: 'bg-[#C7FF4D] shadow-[0_0_6px_#C7FF4D]',
      defaultLabel: 'Published',
    },
    failed: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      dot: 'bg-red-400',
      defaultLabel: 'Failed',
    },
    connected: {
      bg: 'bg-[#C7FF4D]/10',
      text: 'text-[#C7FF4D]',
      border: 'border-[#C7FF4D]/30',
      dot: 'bg-[#C7FF4D] shadow-[0_0_6px_#C7FF4D]',
      defaultLabel: 'Connected',
    },
    disconnected: {
      bg: 'bg-neutral-800',
      text: 'text-[#A5A5A5]',
      border: 'border-[#252525]',
      dot: 'bg-[#444444]',
      defaultLabel: 'Disconnected',
    },
    active: {
      bg: 'bg-[#C7FF4D]/10',
      text: 'text-[#C7FF4D]',
      border: 'border-[#C7FF4D]/30',
      dot: 'bg-[#C7FF4D]',
      defaultLabel: 'Active',
    },
    paused: {
      bg: 'bg-neutral-800',
      text: 'text-[#A5A5A5]',
      border: 'border-[#2A2A2A]',
      dot: 'bg-[#666666]',
      defaultLabel: 'Paused',
    },
    meta: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      defaultLabel: 'Meta Ads',
    },
    instagram: {
      bg: 'bg-pink-500/10',
      text: 'text-pink-400',
      border: 'border-pink-500/30',
      defaultLabel: 'Instagram',
    },
    facebook: {
      bg: 'bg-blue-600/10',
      text: 'text-blue-400',
      border: 'border-blue-600/30',
      defaultLabel: 'Facebook',
    },
    linkedin: {
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/30',
      defaultLabel: 'LinkedIn',
    },
    mcp: {
      bg: 'bg-[#C7FF4D]/10',
      text: 'text-[#C7FF4D]',
      border: 'border-[#C7FF4D]/30',
      dot: 'bg-[#C7FF4D]',
      defaultLabel: 'MCP Enabled',
    },
    lime: {
      bg: 'bg-[#C7FF4D]/15',
      text: 'text-[#C7FF4D]',
      border: 'border-[#C7FF4D]/40',
      defaultLabel: 'Active',
    }
  };

  const style = styles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeStyles} ${className}`}
    >
      {style.dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      <span>{children || style.defaultLabel}</span>
    </span>
  );
};

