import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface ConfidenceIndicatorProps {
  confidence: number; // 0 to 100
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  showLabel = true,
  size = 'md',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Optical color calibration for extraction reliability
  const getColor = () => {
    if (confidence >= 95) return 'text-[#237A57] bg-[#237A57]';
    if (confidence >= 85) return 'text-[#2F75B5] bg-[#2F75B5]';
    if (confidence >= 70) return 'text-[#B7791F] bg-[#B7791F]';
    return 'text-[#B83232] bg-[#B83232]';
  };

  const colorClass = getColor();

  return (
    <div className="relative inline-flex items-center gap-2">
      {showLabel && (
        <span className="text-xs text-[#5B6777] font-medium whitespace-nowrap">
          Extraction:
        </span>
      )}
      <div 
        className={`flex items-center gap-1.5 font-tabular font-semibold ${
          size === 'sm' ? 'text-xs' : 'text-xs'
        } ${colorClass.split(' ')[0]}`}
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
          <div 
            className={`h-full ${colorClass.split(' ')[1]} transition-all duration-300`} 
            style={{ width: `${Math.min(Math.max(confidence, 0), 100)}%` }}
          />
        </div>
        <span>{confidence}%</span>
      </div>

      <button
        type="button"
        id={`tooltip-confidence-${confidence}`}
        className="text-slate-400 hover:text-slate-600 focus:text-slate-700 p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label="Extraction confidence definition"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {showTooltip && (
        <div 
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-56 p-2 bg-[#17324D] text-white text-[11px] leading-relaxed rounded-md shadow-lg pointer-events-none"
        >
          <p className="font-semibold text-white mb-0.5">Automated Extraction Confidence</p>
          <p className="text-slate-200">
            Reflects OCR clarity and layout parsing confidence. This score does not represent candidate truthfulness or legal eligibility.
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#17324D]" />
        </div>
      )}
    </div>
  );
};
