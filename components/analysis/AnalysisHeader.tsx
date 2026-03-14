import React from 'react';

interface AnalysisHeaderProps {
  selectedMonths: number;
  onMonthsChange: (months: number) => void;
  loading: boolean;
  onRefresh: () => void;
}

export const AnalysisHeader: React.FC<AnalysisHeaderProps> = ({
  selectedMonths,
  onMonthsChange,
  loading,
  onRefresh,
}) => {
  const TIME_RANGE_OPTIONS = [
    { value: 1, label: '近1个月' },
    { value: 3, label: '近3个月' },
    { value: 6, label: '近6个月' },
    { value: 12, label: '近1年' },
  ];

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-text-main">AI 消费深度分析</h1>
      
      <div className="flex items-center gap-4">
        <select
          value={selectedMonths}
          onChange={(e) => onMonthsChange(Number(e.target.value))}
          disabled={loading}
          className="bg-background-light border border-slate-200 text-sm font-medium rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none cursor-pointer disabled:opacity-50"
        >
          {TIME_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="flex gap-2 text-sm text-text-sub">
          <span>数据更新于：刚刚</span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="material-symbols-outlined text-[18px] cursor-pointer hover:text-primary hover:animate-spin disabled:opacity-50 disabled:cursor-not-allowed"
          >
            refresh
          </button>
        </div>
      </div>
    </div>
  );
};