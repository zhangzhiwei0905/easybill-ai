import React from 'react';

export const AnalysisSkeleton: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-background-light">
      <div className="max-w-[1200px] mx-auto p-8 flex flex-col gap-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-100 rounded w-48 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-100 rounded w-24 animate-pulse"></div>
            <div className="w-6 h-6 bg-gray-100 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* AI Insight Card Skeleton */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-gray-300 shadow-sm">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-100 rounded w-32 animate-pulse"></div>
              <div className="space-y-1">
                <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Trend Chart Skeleton */}
          <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="h-6 bg-gray-100 rounded w-32 mb-6 animate-pulse"></div>
            <div className="h-64 bg-gray-50 rounded animate-pulse"></div>
          </div>

          {/* Prediction Card Skeleton */}
          <div className="col-span-12 lg:col-span-4 bg-gray-900 p-6 rounded-xl shadow-sm">
            <div className="space-y-4">
              <div className="h-6 bg-gray-700 rounded w-32 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
                <div className="h-8 bg-gray-700 rounded w-40 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-700 rounded-full animate-pulse"></div>
                <div className="h-2 bg-gray-700 rounded-full w-3/4 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};