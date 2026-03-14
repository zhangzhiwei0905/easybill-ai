import React from 'react';
import { CategoryAnalysis } from '../../../types';

interface CategoryAnalysisProps {
  categories: CategoryAnalysis[];
  loading?: boolean;
}

export const CategoryAnalysisComponent: React.FC<CategoryAnalysisProps> = ({ 
  categories, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-text-main mb-6">支出分类 TOP 5</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded mb-2"></div>
                  <div className="h-2 bg-gray-100 rounded-full"></div>
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-text-main mb-6">支出分类 TOP 5</h3>
        <div className="h-32 flex items-center justify-center">
          <div className="text-gray-400">暂无数据</div>
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
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold text-text-main mb-6">支出分类 TOP 5</h3>
      
      <div className="flex flex-col gap-5">
        {categories.slice(0, 5).map((category, i) => (
          <div key={category.categoryId} className="flex items-center gap-4">
            <div className={`size-10 rounded-lg ${category.colorClass.replace('bg-', 'bg-')} bg-opacity-10 flex items-center justify-center shrink-0`}>
              <span className={`material-symbols-outlined ${category.colorClass.replace('bg-', 'text-')}`}>
                {category.icon}
              </span>
            </div>
            
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-main">{category.categoryName}</span>
                  <div className={`flex items-center gap-1 ${getTrendColor(category.trend)}`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {getTrendIcon(category.trend)}
                    </span>
                    <span className="text-xs">
                      {category.changePercentage > 0 ? '+' : ''}{category.changePercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold text-text-main">
                  ¥{category.amount.toLocaleString()}
                </span>
              </div>
              
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className={`${category.colorClass} h-full rounded-full transition-all duration-500`} 
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-text-sub">
                <span>{category.count} 笔交易</span>
                <span>{category.percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};