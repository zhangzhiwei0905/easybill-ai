import React, { useState, useEffect } from 'react';

export interface FilterCriteria {
  type: 'ALL' | 'EXPENSE' | 'INCOME';
  source: 'ALL' | 'AI_EXTRACTED' | 'MANUAL';
  minAmount: string;
  maxAmount: string;
}

interface FilterTransactionModalProps {
  currentFilters: FilterCriteria;
  onClose: () => void;
  onApply: (filters: FilterCriteria) => void;
  onReset: () => void;
}

const FilterTransactionModal: React.FC<FilterTransactionModalProps> = ({ 
  currentFilters, 
  onClose, 
  onApply,
  onReset
}) => {
  const [filters, setFilters] = useState<FilterCriteria>(currentFilters);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-text-main">筛选账单</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-text-main transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">
          
          {/* Type Filter */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-text-main">交易类型</label>
            <div className="flex bg-background-light p-1 rounded-lg">
              {(['ALL', 'EXPENSE', 'INCOME'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilters({ ...filters, type })}
                  className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-md transition-all ${
                    filters.type === type
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-text-sub hover:text-text-main'
                  }`}
                >
                  {type === 'ALL' ? '全部' : type === 'EXPENSE' ? '支出' : '收入'}
                </button>
              ))}
            </div>
          </div>

          {/* Source Filter */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-text-main">记录来源</label>
            <div className="flex gap-2">
               {[
                 { key: 'ALL', label: '全部' },
                 { key: 'AI_EXTRACTED', label: 'AI 提取' },
                 { key: 'MANUAL', label: '手动录入' }
               ].map((item) => (
                 <button
                   key={item.key}
                   onClick={() => setFilters({ ...filters, source: item.key as any })}
                   className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                     filters.source === item.key
                       ? 'bg-primary/5 border-primary text-primary font-bold'
                       : 'bg-white border-slate-200 text-text-sub hover:bg-slate-50'
                   }`}
                 >
                   {item.label}
                 </button>
               ))}
            </div>
          </div>

          {/* Amount Range */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-text-main">金额范围</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">¥</span>
                <input
                  type="number"
                  placeholder="最低"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                  className="w-full h-10 pl-6 pr-3 rounded-lg border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm outline-none"
                />
              </div>
              <span className="text-slate-300">-</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">¥</span>
                <input
                  type="number"
                  placeholder="最高"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                  className="w-full h-10 pl-6 pr-3 rounded-lg border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm outline-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 pt-2 flex gap-3 shrink-0 border-t border-slate-50 mt-auto">
          <button 
            onClick={handleReset} 
            className="flex-1 h-11 rounded-xl border border-slate-200 text-text-sub font-bold text-sm hover:bg-slate-50 hover:text-text-main transition-colors"
          >
            重置
          </button>
          <button 
            onClick={handleApply} 
            className="flex-[2] h-11 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors shadow-lg shadow-blue-200"
          >
            应用筛选
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterTransactionModal;