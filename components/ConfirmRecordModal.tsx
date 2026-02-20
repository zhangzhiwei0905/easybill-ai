import React, { useEffect } from 'react';
import { AiPendingItem } from '../types';
import { useLanguage } from '../LanguageContext';

interface ConfirmRecordModalProps {
  item: AiPendingItem;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmRecordModal: React.FC<ConfirmRecordModalProps> = ({ item, onClose, onConfirm }) => {
  const { t } = useLanguage();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
        
        <div className={`size-20 rounded-full flex items-center justify-center mb-5 ${item.categoryColor.replace(/text-\w+-\d+/, '')} bg-opacity-20`}>
          <div className={`size-14 rounded-full ${item.categoryColor} flex items-center justify-center shadow-sm`}>
            <span className="material-symbols-outlined text-[32px]">{item.categoryIcon}</span>
          </div>
        </div>

        <h3 className="text-xl font-extrabold text-text-main mb-2">{t('common.confirmRecord')}</h3>
        <p className="text-sm text-text-sub mb-8 leading-relaxed max-w-[260px]">
          {t('common.confirmDetail')}
        </p>

        <div className="w-full flex flex-col gap-0 mb-8 border-t border-dashed border-slate-100">
             <div className="flex justify-between items-center py-4 border-b border-dashed border-slate-100">
                <span className="text-sm text-text-sub font-medium">{t('common.category')}</span>
                <span className="text-base font-bold text-text-main">{item.category}</span>
             </div>
             <div className="flex justify-between items-center py-4 border-b border-dashed border-slate-100">
                <span className="text-sm text-text-sub font-medium">{t('common.amount')}</span>
                <span className={`text-base font-bold ${item.type === 'INCOME' ? 'text-success' : 'text-danger'}`}>
                   {item.type === 'INCOME' ? '+' : '-'}¥{item.amount.toFixed(2)}
                </span>
             </div>
             <div className="flex justify-between items-center py-4 border-b border-dashed border-slate-100">
                <span className="text-sm text-text-sub font-medium whitespace-nowrap mr-4">{t('common.desc')}</span>
                <span className="text-sm font-bold text-text-main text-right line-clamp-1">{item.description}</span>
             </div>
        </div>

        <div className="flex gap-3 w-full">
          <button 
            onClick={onClose} 
            className="flex-1 h-12 rounded-xl border border-slate-200 bg-white text-text-main font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className="flex-1 h-12 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors shadow-lg shadow-blue-200"
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRecordModal;