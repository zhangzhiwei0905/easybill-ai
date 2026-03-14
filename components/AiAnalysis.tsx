import React, { useState } from 'react';
import { AnalysisHeader } from './analysis/AnalysisHeader';
import { TrendChart } from './analysis/TrendChart';
import { CategoryAnalysisComponent } from './analysis/CategoryAnalysis';
import { PredictionCard } from './analysis/PredictionCard';
import { AiRecommendationsComponent } from './analysis/AiRecommendations';
import { AnalysisSkeleton } from './analysis/AnalysisSkeleton';
import { ErrorMessage } from './analysis/ErrorMessage';
import { useAnalysisData } from './analysis/hooks/useAnalysisData';

const AiAnalysis: React.FC = () => {
  const [selectedMonths, setSelectedMonths] = useState(3);
  const { analysisData, loading, error, refetch } = useAnalysisData(selectedMonths);

  if (loading && !analysisData) {
    return <AnalysisSkeleton />;
  }

  if (error && !analysisData) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  if (!analysisData) {
    return <ErrorMessage error="无法获取分析数据" onRetry={refetch} />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background-light">
      <div className="max-w-[1200px] mx-auto p-8 flex flex-col gap-6">
        
        {/* Header */}
        <AnalysisHeader
          selectedMonths={selectedMonths}
          onMonthsChange={setSelectedMonths}
          loading={loading}
          onRefresh={refetch}
        />

        {/* AI Insight Hero Card */}
        {analysisData.aiInsights.summary && (
          <div className="bg-white rounded-xl p-6 border-l-4 border-primary shadow-sm flex items-start gap-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-[180px]">psychology</span>
            </div>
            <div className="bg-primary/10 p-3 rounded-full shrink-0 text-primary">
              <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
            </div>
            <div className="flex flex-col gap-2 relative z-10">
              <h3 className="text-base font-bold text-text-main">AI 智能洞察</h3>
              <p className="text-text-main leading-relaxed max-w-4xl">
                {analysisData.aiInsights.summary}
              </p>
              {analysisData.aiInsights.insights.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {analysisData.aiInsights.insights.slice(0, 3).map((insight, i) => (
                    <span 
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-600"
                    >
                      <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                      {insight.slice(0, 20)}...
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Main Analysis Column */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            
            {/* Trend Chart */}
            <TrendChart 
              trends={analysisData.trends.monthly} 
              loading={loading} 
            />

            {/* Category Analysis */}
            <CategoryAnalysisComponent 
              categories={analysisData.categories} 
              loading={loading} 
            />

          </div>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            
            {/* Prediction Card */}
            <PredictionCard 
              predictions={analysisData.predictions} 
              loading={loading} 
            />

            {/* AI Recommendations */}
            <AiRecommendationsComponent 
              recommendations={analysisData.aiInsights} 
              loading={loading} 
            />

          </div>

        </div>
      </div>
    </div>
  );
};

export default AiAnalysis;