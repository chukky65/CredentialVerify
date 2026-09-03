import React, { ReactNode } from 'react';

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
  variant?: 'default' | 'verified' | 'warning' | 'alert' | 'info' | 'purple';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  sublabel,
  icon,
  variant = 'default',
  onClick,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'verified':
        return 'border-l-4 border-l-[#237A57] bg-white';
      case 'warning':
        return 'border-l-4 border-l-[#B7791F] bg-white';
      case 'alert':
        return 'border-l-4 border-l-[#B83232] bg-white';
      case 'info':
        return 'border-l-4 border-l-[#2F75B5] bg-white';
      case 'purple':
        return 'border-l-4 border-l-[#7C3AED] bg-white';
      default:
        return 'border-l-4 border-l-[#17324D] bg-white';
    }
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative p-4 rounded-lg border border-slate-200/80 shadow-xs transition-all duration-200 ${getVariantStyles()} ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#5B6777] uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold font-tabular text-[#17202A] tracking-tight">
            {value}
          </p>
          {sublabel && (
            <p className="text-xs text-[#5B6777] mt-1.5 flex items-center gap-1">
              {sublabel}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2.5 rounded-md bg-slate-50 text-slate-700 shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
