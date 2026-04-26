import React, { useState } from 'react';
import { CategoryAnalysis, TransactionDetail } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../AuthContext';

interface CategoryAnalysisProps {
  categories: CategoryAnalysis[];
  loading?: boolean;
}

export const CategoryAnalysisComponent: React.FC<CategoryAnalysisProps> = ({
  categories,
  loading = false,
}) => {
  const { token } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, TransactionDetail[]>>({});
  const [detailsLoading, setDetailsLoading] = useState<Record<string, boolean>>({});

  const toggleExpand = async (category: CategoryAnalysis) => {
    if (expandedId === category.categoryId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(category.categoryId);

    // 如果还没加载过明细，才去请求
    if (!details[category.categoryId] && token) {
      setDetailsLoading(prev => ({ ...prev, [category.categoryId]: true }));
      try {
        const data = await api.analysis.getCategoryTransactions(category.categoryId, 3, token);
        setDetails(prev => ({ ...prev, [category.categoryId]: data }));
      } catch (e) {
        console.error('加载明细失败', e);
      } finally {
        setDetailsLoading(prev => ({ ...prev, [category.categoryId]: false }));
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-border-dark">
        <h3 className="text-lg font-bold text-text-main dark:text-text-dark-main mb-6">支出分类 TOP 5</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-[#2e3244] rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 dark:bg-[#2e3244] rounded mb-2"></div>
                  <div className="h-2 bg-gray-100 dark:bg-[#2e3244] rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-border-dark">
        <h3 className="text-lg font-bold text-text-main dark:text-text-dark-main mb-6">支出分类 TOP 5</h3>
        <div className="h-32 flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-500">暂无数据</div>
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'trending_flat';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-red-500';
      case 'down': return 'text-green-500';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  const formatDate = (dateStr: string) => {
    const [, month, day] = dateStr.split('-');
    return `${parseInt(month)}-${day}`;
  };

  return (
    <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-border-dark">
      <h3 className="text-lg font-bold text-text-main dark:text-text-dark-main mb-6">支出分类 TOP 5</h3>

      <div className="flex flex-col gap-5">
        {categories.slice(0, 5).map((category) => {
          const isExpanded = expandedId === category.categoryId;
          const categoryDetails = details[category.categoryId] || [];
          const isLoadingDetails = detailsLoading[category.categoryId];

          return (
            <div key={category.categoryId} className="flex flex-col">
              {/* 主行：可点击展开 */}
              <div
                className="flex items-center gap-4 cursor-pointer select-none"
                onClick={() => toggleExpand(category)}
              >
                <div
                  className={`size-10 rounded-lg ${category.colorClass.replace('bg-', 'bg-')} bg-opacity-10 flex items-center justify-center shrink-0`}
                >
                  <span className={`material-symbols-outlined ${category.colorClass.replace('bg-', 'text-')}`}>
                    {category.icon}
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-main dark:text-text-dark-main">
                        {category.categoryName}
                      </span>
                      <div className={`flex items-center gap-1 ${getTrendColor(category.trend)}`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {getTrendIcon(category.trend)}
                        </span>
                        <span className="text-xs">
                          {category.changePercentage > 0 ? '+' : ''}
                          {category.changePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-text-main dark:text-text-dark-main">
                        ¥{category.amount.toLocaleString()}
                      </span>
                      <span className="material-symbols-outlined text-base text-slate-400 dark:text-gray-500 transition-transform duration-200"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        expand_more
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-[#2e3244] rounded-full h-2 overflow-hidden">
                    <div
                      className={`${category.colorClass} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs text-text-sub dark:text-text-dark-sub">
                    <span>{category.count} 笔交易</span>
                    <span>{category.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* 展开的明细区域 */}
              {isExpanded && (
                <div className="mt-3 ml-14 flex flex-col gap-1">
                  {/* 明细头部 */}
                  <div className="flex justify-between items-center px-1 mb-1">
                    <span className="text-xs text-text-sub dark:text-text-dark-sub">
                      明细 ({categoryDetails.length} 笔)
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5"
                    >
                      收起
                      <span className="material-symbols-outlined text-[14px]">expand_less</span>
                    </button>
                  </div>

                  {/* 明细列表 */}
                  <div className="max-h-[200px] overflow-y-auto border border-slate-100 dark:border-border-dark rounded-lg divide-y divide-slate-50 dark:divide-border-dark">
                    {isLoadingDetails ? (
                      <div className="py-6 text-center text-xs text-slate-400 dark:text-gray-500">加载中...</div>
                    ) : categoryDetails.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 dark:text-gray-500">暂无明细</div>
                    ) : (
                      categoryDetails.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-surface-dark-alt transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-text-sub dark:text-text-dark-sub shrink-0">
                              {formatDate(item.transactionDate)}
                            </span>
                            <span className="text-sm text-text-main dark:text-text-dark-main truncate">
                              {item.description}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-text-main dark:text-text-dark-main shrink-0 ml-2">
                            -¥{item.amount.toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
