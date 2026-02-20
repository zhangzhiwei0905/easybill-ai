import React, { useEffect } from 'react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmButtonClass?: string;
  icon?: string;
  iconColorClass?: string;
  iconBgClass?: string;
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "确认",
  confirmButtonClass = "bg-primary text-white hover:bg-primary-hover shadow-blue-200",
  icon = "check_circle",
  iconColorClass = "text-primary",
  iconBgClass = "bg-blue-50"
}) => {
  if (!isOpen) return null;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
        
        <div className={`size-14 rounded-full ${iconBgClass} ${iconColorClass} flex items-center justify-center mb-4`}>
          <span className="material-symbols-outlined text-[32px]">{icon}</span>
        </div>

        <h3 className="text-lg font-bold text-text-main mb-2">{title}</h3>
        <p className="text-sm text-text-sub mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3 w-full">
          <button 
            onClick={onClose} 
            className="flex-1 h-10 rounded-lg border border-slate-200 bg-white text-text-main font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className={`flex-1 h-10 rounded-lg font-bold text-sm transition-colors shadow-lg ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;