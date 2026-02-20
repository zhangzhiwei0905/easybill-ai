import React, { useEffect } from 'react';

interface DeleteConfirmationModalProps {
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
  onClose, 
  onConfirm, 
  title = "确认删除", 
  message = "删除后将无法恢复，确定要继续吗？" 
}) => {
  
  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
        
        <div className="size-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[32px]">delete_forever</span>
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
            className="flex-1 h-10 rounded-lg bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;