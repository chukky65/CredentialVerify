import React from 'react';
import { VerificationStatus, Priority, SourceResultStatus } from '../../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  XCircle, 
  Clock, 
  ShieldAlert,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';

interface StatusBadgeProps {
  status: VerificationStatus | Priority | SourceResultStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'VERIFIED':
      case 'MATCHED':
        return {
          label: 'Verified',
          bg: 'bg-[#237A57]/10',
          text: 'text-[#237A57]',
          border: 'border-[#237A57]/30',
          icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
        };
      case 'NEEDS_REVIEW':
        return {
          label: 'Needs Review',
          bg: 'bg-[#B7791F]/10',
          text: 'text-[#B7791F]',
          border: 'border-[#B7791F]/30',
          icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
        };
      case 'INFO_REQUIRED':
      case 'MANUAL_REQUIRED':
        return {
          label: 'Information Required',
          bg: 'bg-[#C56A1A]/10',
          text: 'text-[#C56A1A]',
          border: 'border-[#C56A1A]/30',
          icon: <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
        };
      case 'CONTRADICTED':
      case 'MISMATCH':
        return {
          label: 'Contradicted',
          bg: 'bg-[#B83232]/10',
          text: 'text-[#B83232]',
          border: 'border-[#B83232]/30',
          icon: <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
        };
      case 'PENDING':
        return {
          label: 'Pending',
          bg: 'bg-[#64748B]/10',
          text: 'text-[#475569]',
          border: 'border-[#64748B]/30',
          icon: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
        };
      case 'RESTRICTED':
        return {
          label: 'Restricted Review',
          bg: 'bg-[#7C3AED]/10',
          text: 'text-[#7C3AED]',
          border: 'border-[#7C3AED]/30',
          icon: <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
        };
      // Priorities
      case 'URGENT':
        return {
          label: 'Urgent Priority',
          bg: 'bg-[#B83232]/10',
          text: 'text-[#B83232]',
          border: 'border-[#B83232]/40',
          icon: <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
        };
      case 'HIGH':
        return {
          label: 'High Priority',
          bg: 'bg-[#C56A1A]/10',
          text: 'text-[#C56A1A]',
          border: 'border-[#C56A1A]/30',
          icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
        };
      case 'MEDIUM':
        return {
          label: 'Medium Priority',
          bg: 'bg-[#B7791F]/10',
          text: 'text-[#B7791F]',
          border: 'border-[#B7791F]/30',
          icon: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
        };
      case 'STANDARD':
        return {
          label: 'Standard',
          bg: 'bg-[#64748B]/10',
          text: 'text-[#475569]',
          border: 'border-[#64748B]/20',
          icon: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
        };
      // Source states
      case 'UNAVAILABLE':
      case 'OFFLINE':
        return {
          label: 'Source Unavailable',
          bg: 'bg-[#B83232]/10',
          text: 'text-[#B83232]',
          border: 'border-[#B83232]/30',
          icon: <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
        };
      case 'RATE_LIMITED':
      case 'DEGRADED':
        return {
          label: 'Rate Limited',
          bg: 'bg-[#C56A1A]/10',
          text: 'text-[#C56A1A]',
          border: 'border-[#C56A1A]/30',
          icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
        };
      case 'HEALTHY':
        return {
          label: 'Operational',
          bg: 'bg-[#237A57]/10',
          text: 'text-[#237A57]',
          border: 'border-[#237A57]/30',
          icon: <Wifi className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
        };
      default:
        return {
          label: status ? String(status).replace(/_/g, ' ') : 'Unknown',
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          border: 'border-slate-300',
          icon: <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
        };
    }
  };

  const config = getBadgeConfig();
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-medium',
    lg: 'px-3 py-1.5 text-sm gap-2 font-medium',
  }[size];

  return (
    <span
      id={`status-badge-${String(status).toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      className={`inline-flex items-center rounded-md border whitespace-nowrap ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
      role="status"
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
