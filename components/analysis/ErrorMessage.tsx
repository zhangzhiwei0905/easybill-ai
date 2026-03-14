import React from 'react';

interface ErrorMessageProps {
  error: string;
  onRetry: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onRetry }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-background-light">
      <div className="max-w-[1200px] mx-auto p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-red-500 text-6xl mb-4">
            <span className="material-symbols-outlined">error</span>
          </div>
          <h2 className="text-xl font-bold text-text-main mb-2">加载失败</h2>
          <p className="text-text-sub text-center mb-6 max-w-md">
            {error || '获取分析数据时出现错误，请稍后重试。'}
          </p>
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">refresh</span>
            重新加载
          </button>
        </div>
      </div>
    </div>
  );
};