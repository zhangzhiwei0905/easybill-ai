import React, { useEffect, useState } from 'react';
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MonthlyTrend } from '../../types';

interface TrendChartProps {
  trends: MonthlyTrend[];
  loading?: boolean;
}

type ChartView = 'bar' | 'line' | 'pie';

const chartViews: Array<{ key: ChartView; icon: string; label: string }> = [
  { key: 'bar', icon: 'bar_chart', label: '柱状图' },
  { key: 'line', icon: 'show_chart', label: '折线图' },
  { key: 'pie', icon: 'pie_chart', label: '饼图' },
];

export const TrendChart: React.FC<TrendChartProps> = ({ trends, loading = false }) => {
  const [chartView, setChartView] = useState<ChartView>('bar');
  const [selectedPieMonth, setSelectedPieMonth] = useState('');

  useEffect(() => {
    if (trends.length === 0) return;

    const hasSelectedMonth = trends.some(trend => trend.month === selectedPieMonth);
    if (!hasSelectedMonth) {
      setSelectedPieMonth(trends[trends.length - 1].month);
    }
  }, [selectedPieMonth, trends]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-border-dark">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-text-main dark:text-text-dark-main">收支趋势分析</h3>
          <div className="w-24 h-6 bg-gray-100 dark:bg-[#2e3244] rounded animate-pulse"></div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-500">加载中...</div>
        </div>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-border-dark">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-text-main dark:text-text-dark-main">收支趋势分析</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-500">暂无数据</div>
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

  const chartData = trends.map(trend => ({
    ...trend,
    label: formatMonth(trend.month),
  }));

  const selectedPieTrend = trends.find(trend => trend.month === selectedPieMonth) || trends[trends.length - 1];
  const pieData = [
    { name: '收入', value: selectedPieTrend.income, color: '#10b981' },
    { name: '支出', value: selectedPieTrend.expense, color: '#137fec' },
  ].filter(item => item.value > 0);

  const formatCurrency = (value: number) => `¥${value.toLocaleString('zh-CN')}`;

  const renderBarChart = () => (
    <div className="h-64 w-full flex items-end justify-between gap-2 px-2 relative">
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-16">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full border-t border-dashed border-slate-100 dark:border-border-dark h-0"></div>
        ))}
      </div>
      
      {trends.map((trend, i) => {
        const incomeHeight = maxValue > 0 ? (trend.income / maxValue) * 100 : 0;
        const expenseHeight = maxValue > 0 ? (trend.expense / maxValue) * 100 : 0;
        
        return (
          <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center gap-2 z-10 group">
            <div className="w-full min-h-0 flex-1 flex justify-center items-end gap-1">
              <div 
                className="w-3 bg-emerald-400/80 rounded-t-sm transition-all group-hover:bg-emerald-500" 
                style={{height: `${incomeHeight}%`}}
                title={`收入: ${formatCurrency(trend.income)}`}
              ></div>
              <div 
                className="w-3 bg-primary/80 rounded-t-sm transition-all group-hover:bg-primary" 
                style={{height: `${expenseHeight}%`}}
                title={`支出: ${formatCurrency(trend.expense)}`}
              ></div>
            </div>
            <span className="text-xs font-medium text-slate-400 dark:text-gray-500">
              {formatMonth(trend.month)}
            </span>
            <div className="flex flex-col items-center gap-0.5 text-[10px] leading-tight">
              <span className="max-w-full truncate font-semibold text-emerald-500" title={`收入: ${formatCurrency(trend.income)}`}>
                {formatCurrency(trend.income)}
              </span>
              <span className="max-w-full truncate font-semibold text-primary" title={`支出: ${formatCurrency(trend.expense)}`}>
                {formatCurrency(trend.expense)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderLineChart = () => (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis hide domain={[0, 'dataMax']} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value: number, name: string) => [formatCurrency(value), name === 'income' ? '收入' : '支出']}
          />
          <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="expense" stroke="#137fec" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const renderPieChart = () => (
    <div>
      <div className="mb-3 flex justify-end">
        <select
          value={selectedPieTrend.month}
          onChange={(event) => setSelectedPieMonth(event.target.value)}
          className="h-9 rounded-lg border border-slate-200 dark:border-border-dark bg-background-light dark:bg-background-dark px-3 text-sm font-medium text-text-main dark:text-text-dark-main outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          {trends.map(trend => (
            <option key={trend.month} value={trend.month}>
              {formatMonth(trend.month)}
            </option>
          ))}
        </select>
      </div>
      <div className="h-64 w-full min-w-0">
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <PieChart>
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={88}
                paddingAngle={4}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            暂无数据
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-border-dark">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-text-main dark:text-text-dark-main">收支趋势分析</h3>
          <div className="text-sm text-text-sub dark:text-text-dark-sub">
            最近 {trends.length} 个月数据
          </div>
        </div>
        <div className="flex w-fit rounded-lg bg-background-light dark:bg-background-dark p-1">
          {chartViews.map(view => (
            <button
              key={view.key}
              type="button"
              onClick={() => setChartView(view.key)}
              title={view.label}
              aria-label={view.label}
              className={`size-9 rounded-md flex items-center justify-center transition-colors ${
                chartView === view.key
                  ? 'bg-white dark:bg-surface-dark-alt text-primary shadow-sm'
                  : 'text-text-sub dark:text-text-dark-sub hover:text-text-main dark:hover:text-text-dark-main'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{view.icon}</span>
            </button>
          ))}
        </div>
      </div>

      {chartView === 'bar' && renderBarChart()}
      {chartView === 'line' && renderLineChart()}
      {chartView === 'pie' && renderPieChart()}
      
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-emerald-400"></span>
          <span className="text-xs text-slate-500 dark:text-gray-400">收入</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-primary"></span>
          <span className="text-xs text-slate-500 dark:text-gray-400">支出</span>
        </div>
      </div>
    </div>
  );
};
