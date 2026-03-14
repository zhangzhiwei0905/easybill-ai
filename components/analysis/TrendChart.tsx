import React from 'react';
import { MonthlyTrend } from '../../../types';

interface TrendChartProps {
  trends: MonthlyTrend[];
  loading?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({ trends, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-text-main">收支趋势分析</h3>
          <div className="w-24 h-6 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-400">加载中...</div>
        </div>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-text-main">收支趋势分析</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-400">暂无数据</div>
        </div>
      </div>
    );
  }

  // 找出最大值用于缩放
  const maxValue = Math.max(
    ...trends.flatMap(t => [t.income, t.expense])
  );

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `${parseInt(month)}月`;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-text-main">收支趋势分析</h3>
        <div className="text-sm text-text-sub">
          最近 {trends.length} 个月数据
        </div>
      </div>
      
      <div className="h-64 w-full flex items-end justify-between gap-2 px-2 relative">
        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-full border-t border-dashed border-slate-100 h-0"></div>
          ))}
        </div>
        
        {/* Bars */}
        {trends.map((trend, i) => {
          const incomeHeight = maxValue > 0 ? (trend.income / maxValue) * 100 : 0;
          const expenseHeight = maxValue > 0 ? (trend.expense / maxValue) * 100 : 0;
          
          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 z-10 group">
              <div className="w-full flex justify-center items-end gap-1 h-full">
                <div 
                  className="w-3 bg-emerald-400/80 rounded-t-sm transition-all group-hover:bg-emerald-500" 
                  style={{height: `${incomeHeight}%`}}
                  title={`收入: ¥${trend.income.toLocaleString()}`}
                ></div>
                <div 
                  className="w-3 bg-primary/80 rounded-t-sm transition-all group-hover:bg-primary" 
                  style={{height: `${expenseHeight}%`}}
                  title={`支出: ¥${trend.expense.toLocaleString()}`}
                ></div>
              </div>
              <span className="text-xs font-medium text-slate-400">
                {formatMonth(trend.month)}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-emerald-400"></span>
          <span className="text-xs text-slate-500">收入</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-primary"></span>
          <span className="text-xs text-slate-500">支出</span>
        </div>
      </div>
    </div>
  );
};