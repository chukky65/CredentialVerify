import React, { useEffect, useRef, ReactNode } from 'react';
import { X, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  children?: ReactNode;
  isProcessing?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'primary',
  children,
  isProcessing = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => confirmButtonRef.current?.focus(), 50);
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getVariantIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-[#B83232]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#B7791F]" />;
      case 'success':
        return <ShieldCheck className="w-5 h-5 text-[#237A57]" />;
      default:
        return <Info className="w-5 h-5 text-[#2F75B5]" />;
    }
  };

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-[#B83232] hover:bg-[#992222] text-white focus:ring-[#B83232]';
      case 'warning':
        return 'bg-[#B7791F] hover:bg-[#976014] text-white focus:ring-[#B7791F]';
      case 'success':
        return 'bg-[#237A57] hover:bg-[#1b6145] text-white focus:ring-[#237A57]';
      default:
        return 'bg-[#17324D] hover:bg-[#0f2337] text-white focus:ring-[#2F75B5]';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
              {getVariantIcon()}
            </div>
            <div>
              <h3 id="modal-title" className="text-base font-semibold text-[#17202A]">
                {title}
              </h3>
              <p className="text-xs text-[#5B6777]">Authorized Electoral Action</p>
            </div>
          </div>
          <button
            type="button"
            id="modal-close-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F75B5]"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <p id="modal-description" className="text-sm text-[#5B6777] leading-relaxed">
            {description}
          </p>

          {children}

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-md flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Audit Notice:</strong> This action will be permanently recorded in the immutable audit trail with your authorized staff identifier and timestamp.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            id="modal-cancel-btn"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-[#17202A] bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F75B5] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            id="modal-confirm-btn"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-4 py-2 text-sm font-medium rounded-md shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 flex items-center gap-2 ${getConfirmButtonClasses()}`}
          >
            {isProcessing ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
