import React from 'react';
import { PredictionAnalysis } from '../../../types';

interface PredictionCardProps {
  predictions: PredictionAnalysis;
  loading?: boolean;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ 
  predictions, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="bg-[#101922] p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 size-32 bg-primary/30 rounded-full blur-2xl"></div>
        <div className="absolute -left-6 bottom-0 size-24 bg-purple-500/20 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">timeline</span>
            <div className="h-6 bg-white/20 rounded w-32 animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded w-40 animate-pulse"></div>
            <div className="h-8 bg-white/10 rounded w-48 animate-pulse"></div>
            <div className="h-3 bg-white/10 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const getRiskText = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return '高';
      case 'medium': return '中';
      default: return '低';
    }
  };

  return (
    <div className="bg-[#101922] p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
      <div className="absolute -right-6 -top-6 size-32 bg-primary/30 rounded-full blur-2xl"></div>
      <div className="absolute -left-6 bottom-0 size-24 bg-purple-500/20 rounded-full blur-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">timeline</span>
          <h3 className="text-base font-bold">月底支出预测</h3>
        </div>
        
        <div className="mb-6">
          <div className="text-xs text-gray-400 mb-1">预计本月总支出</div>
          <div className="text-3xl font-bold tracking-tight">
            ¥{predictions.monthEndExpense.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <span className={`size-2 rounded-full ${getRiskColor(predictions.riskLevel)} animate-pulse`}></span>
            风险等级：{getRiskText(predictions.riskLevel)}
            {predictions.predictedOverspend > 0 && (
              <span className="text-red-400 ml-2">
                预计超支 ¥{predictions.predictedOverspend.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-gray-400">
            <span>当前支出</span>
            <span>¥{predictions.currentExpense.toLocaleString()}</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-purple-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(predictions.budgetUtilization, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-400 pt-1">
            <span>预算利用率</span>
            <span className={`font-medium ${predictions.budgetUtilization > 90 ? 'text-red-400' : 'text-white'}`}>
              {predictions.budgetUtilization.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex justify-between text-xs text-gray-400">
            <span>剩余预算</span>
            <span className={`font-medium ${predictions.remainingBudget < 0 ? 'text-red-400' : 'text-green-400'}`}>
              ¥{predictions.remainingBudget.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between text-xs text-gray-400">
            <span>日均支出</span>
            <span>¥{predictions.dailyAverage.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};