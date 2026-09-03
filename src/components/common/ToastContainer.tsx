import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 className="w-4 h-4 text-[#237A57]" />;
            case 'warning':
              return <AlertTriangle className="w-4 h-4 text-[#B7791F]" />;
            case 'error':
              return <AlertCircle className="w-4 h-4 text-[#B83232]" />;
            default:
              return <Info className="w-4 h-4 text-[#2F75B5]" />;
          }
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white border border-slate-200 rounded-lg shadow-lg p-3.5 flex items-start gap-3 animate-fade-in transition-all"
            role="alert"
          >
            <div className="shrink-0 mt-0.5">{getIcon()}</div>
            <div className="flex-1 text-xs text-[#17202A] leading-snug">
              {toast.message}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 shrink-0 p-0.5"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
