import React from 'react';
import { AiRecommendations } from '../../../types';

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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex-1">
        <h3 className="text-lg font-bold text-text-main mb-4">AI 建议</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
      default: return 'text-blue-600 bg-blue-50 border-blue-100';
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex-1">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-text-main">AI 建议</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-sub">总体评分</span>
          <span className="font-bold text-primary">{recommendations.overallScore}/10</span>
        </div>
      </div>
      
      {/* 洞察点 */}
      {recommendations.insights.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="text-sm font-bold text-blue-800 mb-2">关键洞察</h4>
          <ul className="space-y-1">
            {recommendations.insights.map((insight, i) => (
              <li key={i} className="text-xs text-blue-700 flex items-start gap-2">
                <span className="material-symbols-outlined text-[14px] mt-0.5">lightbulb</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 风险警告 */}
      {recommendations.riskWarnings.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-100">
          <h4 className="text-sm font-bold text-red-800 mb-2">风险提醒</h4>
          <ul className="space-y-1">
            {recommendations.riskWarnings.map((warning, i) => (
              <li key={i} className="text-xs text-red-700 flex items-start gap-2">
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
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100">
          <h4 className="text-sm font-bold text-green-800 mb-3">下月预算建议</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(recommendations.nextMonthBudget).map(([category, budget]) => (
              <div key={category} className="flex justify-between text-xs">
                <span className="text-green-700">{category}</span>
                <span className="font-bold text-green-800">¥{budget.toLocaleString()}</span>
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
          <span className="text-gray-500">
            可行性: {suggestion.feasibilityScore}/10
          </span>
        </div>
      </div>
    </div>
  );
};