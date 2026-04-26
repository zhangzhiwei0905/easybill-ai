import React from 'react';
import { AiRecommendations } from '../../types';

interface AiRecommendationsComponentProps {
  recommendations: AiRecommendations;
  loading?: boolean;
}

export const AiRecommendationsComponent: React.FC<AiRecommendationsComponentProps> = ({ 
  recommendations, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-border-dark flex-1">
        <h3 className="text-lg font-bold text-text-main dark:text-text-dark-main mb-4">AI 建议</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="p-3 bg-gray-50 dark:bg-surface-dark-alt rounded-lg border border-gray-100 dark:border-border-dark">
                <div className="h-4 bg-gray-100 dark:bg-[#2e3244] rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 dark:bg-[#2e3244] rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-900/30';
      default: return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30';
    }
  };

  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'hard': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  const getDifficultyText = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'hard': return '较难';
      case 'medium': return '中等';
      default: return '容易';
    }
  };

  return (
    <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-border-dark flex-1">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-text-main dark:text-text-dark-main">AI 建议</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-sub dark:text-text-dark-sub">总体评分</span>
          <span className="font-bold text-primary">{recommendations.overallScore}/10</span>
        </div>
      </div>
      
      {/* 洞察点 */}
      {recommendations.insights.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
          <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">关键洞察</h4>
          <ul className="space-y-1">
            {recommendations.insights.map((insight, i) => (
              <li key={i} className="text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2">
                <span className="material-symbols-outlined text-[14px] mt-0.5">lightbulb</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 风险警告 */}
      {recommendations.riskWarnings.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
          <h4 className="text-sm font-bold text-red-800 dark:text-red-300 mb-2">风险提醒</h4>
          <ul className="space-y-1">
            {recommendations.riskWarnings.map((warning, i) => (
              <li key={i} className="text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                <span className="material-symbols-outlined text-[14px] mt-0.5">warning</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 具体建议 */}
      <div className="flex flex-col gap-4">
        {recommendations.recommendations.map((rec, i) => (
          <SuggestionCard
            key={i}
            suggestion={rec}
            priorityColor={getPriorityColor(rec.priority)}
            difficultyColor={getDifficultyColor(rec.difficulty)}
            difficultyText={getDifficultyText(rec.difficulty)}
          />
        ))}
      </div>
      
      {/* 下月预算建议 */}
      {Object.keys(recommendations.nextMonthBudget).length > 0 && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/30">
          <h4 className="text-sm font-bold text-green-800 dark:text-green-300 mb-3">下月预算建议</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(recommendations.nextMonthBudget).map(([category, budget]) => (
              <div key={category} className="flex justify-between text-xs">
                <span className="text-green-700 dark:text-green-400">{category}</span>
                <span className="font-bold text-green-800 dark:text-green-300">¥{budget.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SuggestionCard: React.FC<{
  suggestion: any;
  priorityColor: string;
  difficultyColor: string;
  difficultyText: string;
}> = ({ suggestion, priorityColor, difficultyColor, difficultyText }) => {
  return (
    <div className={`p-3 rounded-lg border ${priorityColor}`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">savings</span>
          <span className="text-xs font-bold">{suggestion.category}</span>
        </div>
      </div>
      
      <p className="text-xs mt-2 leading-relaxed mb-3">{suggestion.suggestion}</p>
      
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold">
          预计节省: ¥{suggestion.potentialSavings.toLocaleString()}
        </span>
        <div className="flex items-center gap-2">
          <span className={`${difficultyColor}`}>
            难度: {difficultyText}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            可行性: {suggestion.feasibilityScore}/10
          </span>
        </div>
      </div>
    </div>
  );
};