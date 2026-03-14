import { useState, useEffect, useCallback, useRef } from 'react';
import { AnalysisData } from '../../../types';
import { api } from '../../../services/api';
import { useAuth } from '../../../AuthContext';

export function useAnalysisData(months: number) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  
  // 使用 ref 防止重复调用
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchKeyRef = useRef<string>('');
  const isMountedRef = useRef(true);

  const fetchAnalysisData = useCallback(async (forceRefetch = false) => {
    if (!token) return;

    // 生成唯一标识，防止重复调用
    const fetchKey = `${months}-${token}`;
    
    // 如果上次获取的 key 相同且不是强制刷新，跳过
    if (lastFetchKeyRef.current === fetchKey && !forceRefetch) {
      console.log('[Analysis] 数据已获取，跳过重复请求');
      return;
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      console.log('[Analysis] 取消之前的请求');
      abortControllerRef.current.abort();
    }

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();
    
    // 立即标记为已获取，防止 StrictMode 双重调用
    lastFetchKeyRef.current = fetchKey;

    console.log('[Analysis] 开始获取数据...', { months, forceRefetch });
    
    try {
      setLoading(true);
      setError(null);
      
      // 先获取核心数据（不包含 recommendations）
      const [summary, trends, categories, predictions] = await Promise.all([
        api.analysis.getSummary(months, token),
        api.analysis.getTrends(months, token),
        api.analysis.getCategories(months, token),
        api.analysis.getPredictions(token),
      ]);

      console.log('[Analysis] 核心数据获取完成');

      // 检查组件是否仍然挂载
      if (!isMountedRef.current) {
        console.log('[Analysis] 组件已卸载，取消更新');
        return;
      }

      // 立即设置核心数据
      setAnalysisData({
        summary,
        trends,
        categories,
        predictions,
        aiInsights: {
          summary: 'AI 建议加载中...',
          insights: [],
          recommendations: [],
          riskWarnings: [],
          nextMonthBudget: {},
          overallScore: 7,
          months,
        },
      });

      // 异步获取 recommendations（不阻塞其他数据）
      console.log('[Analysis] 开始获取 recommendations...');
      try {
        const recommendations = await Promise.race([
          api.analysis.getRecommendations(months, token),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('AI 建议获取超时')), 10000)
          ),
        ]);
        
        if (!isMountedRef.current) {
          console.log('[Analysis] 组件已卸载，不更新 recommendations');
          return;
        }

        console.log('[Analysis] Recommendations 获取完成');
        setAnalysisData(prev => prev ? { ...prev, aiInsights: recommendations } : null);
      } catch (recError) {
        console.warn('[Analysis] Failed to load recommendations, using defaults:', recError);
        
        if (!isMountedRef.current) return;

        // Recommendations 失败时使用默认值
        setAnalysisData(prev => prev ? {
          ...prev,
          aiInsights: {
            summary: '基于您的消费数据分析，我们为您提供以下个性化建议。',
            insights: ['建议定期查看消费报表', '合理规划月度预算', '适当减少非必要开支'],
            recommendations: [
              {
                category: '餐饮美食',
                suggestion: '减少外卖频率，尝试自己做饭',
                potentialSavings: 500,
                priority: 'high',
                feasibilityScore: 8,
                difficulty: 'medium',
              },
            ],
            riskWarnings: ['注意控制娱乐消费'],
            nextMonthBudget: {},
            overallScore: 7,
            months,
          },
        } : null);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      setError(err instanceof Error ? err.message : '获取分析数据失败');
      console.error('[Analysis] Failed to fetch analysis data:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [months, token]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchAnalysisData();

    return () => {
      console.log('[Analysis] 组件卸载');
      isMountedRef.current = false;
      // 取消正在进行的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months, token]);

  const refetch = useCallback(() => {
    console.log('[Analysis] 强制刷新数据');
    lastFetchKeyRef.current = ''; // 清除缓存，允许重新获取
    fetchAnalysisData(true);
  }, [fetchAnalysisData]);

  return { analysisData, loading, error, refetch };
}