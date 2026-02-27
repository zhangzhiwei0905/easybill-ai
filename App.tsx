import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, NavLink, useLocation, Outlet, useOutletContext } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { LanguageProvider, useLanguage } from './LanguageContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import AiAudit from './components/AiAudit';
import AiAnalysis from './components/AiAnalysis';
import Settings from './components/Settings';
import Auth from './components/Auth';
import ManualEntryModal from './components/ManualEntryModal';
import { AiPendingItem, GlobalOutletContextType, AiPendingItemApiResponse } from './types';
import { api } from './services/api';

// 分类图标和颜色映射
const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
  '餐饮美食': { icon: 'restaurant', color: 'bg-orange-100 text-orange-600' },
  '购物消费': { icon: 'shopping_bag', color: 'bg-pink-100 text-pink-600' },
  '交通出行': { icon: 'directions_car', color: 'bg-blue-100 text-blue-600' },
  '生活缴费': { icon: 'receipt_long', color: 'bg-green-100 text-green-600' },
  '医疗健康': { icon: 'medical_services', color: 'bg-red-100 text-red-600' },
  '娱乐休闲': { icon: 'sports_esports', color: 'bg-purple-100 text-purple-600' },
  '学习教育': { icon: 'school', color: 'bg-indigo-100 text-indigo-600' },
  '人情往来': { icon: 'card_giftcard', color: 'bg-rose-100 text-rose-600' },
  '工资收入': { icon: 'account_balance_wallet', color: 'bg-emerald-100 text-emerald-600' },
  '投资收益': { icon: 'trending_up', color: 'bg-teal-100 text-teal-600' },
  '奖金收入': { icon: 'emoji_events', color: 'bg-amber-100 text-amber-600' },
  '兼职收入': { icon: 'work', color: 'bg-cyan-100 text-cyan-600' },
  '转账': { icon: 'swap_horiz', color: 'bg-slate-100 text-slate-600' },
};

// 将 API 响应转换为前端显示格式
function transformAiItem(item: AiPendingItemApiResponse): AiPendingItem {
  const categoryConfig = item.category ? CATEGORY_CONFIG[item.category.name] : { icon: 'help', color: 'bg-gray-100 text-gray-600' };

  return {
    id: item.id,
    rawText: item.rawText,
    date: new Date(item.parsedDate).toLocaleDateString('zh-CN'),
    category: item.category?.name || '未分类',
    categoryIcon: categoryConfig.icon,
    categoryColor: categoryConfig.color,
    description: item.description,
    amount: Number(item.amount),
    confidence: item.confidence,
    type: item.type,
    status: item.status,
    categoryId: item.categoryId || undefined,
  };
}

// Component to protect routes that require authentication
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-background-light">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <AppLayout />;
};

// Layout component for authenticated pages
const AppLayout: React.FC = () => {
  const { token } = useAuth();
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [aiItems, setAiItems] = useState<AiPendingItem[]>([]);
  const [aiItemsLoading, setAiItemsLoading] = useState(true);
  const [transactionRefreshKey, setTransactionRefreshKey] = useState(0);

  // 从后端获取 AI 待审核项
  const fetchAiItems = async () => {
    if (!token) return;

    setAiItemsLoading(true);
    try {
      const response = await api.aiItems.findAll(token, 'PENDING');
      const transformedItems = response.items
        .filter((item: AiPendingItemApiResponse) => item.status === 'PENDING' || item.status === 'NEEDS_MANUAL')
        .map(transformAiItem);
      setAiItems(transformedItems);
    } catch (error) {
      console.error('Failed to fetch AI items:', error);
    } finally {
      setAiItemsLoading(false);
    }
  };

  // 初始化和 token 变化时获取数据
  useEffect(() => {
    if (token) {
      fetchAiItems();
    }
  }, [token]);

  const refreshAiItems = () => {
    fetchAiItems();
  };

  const handleTransactionSuccess = () => {
    setTransactionRefreshKey(prev => prev + 1); // Trigger refresh in Transactions component
  };

  const contextValue: GlobalOutletContextType = {
    onOpenEntryModal: () => setIsEntryModalOpen(true),
    aiItems,
    setAiItems,
    refreshAiItems,
    onTransactionSuccess: handleTransactionSuccess
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light flex-col md:flex-row">
      {/* Sidebar - Hidden on Mobile */}
      <Sidebar
        onOpenEntryModal={() => setIsEntryModalOpen(true)}
        aiPendingCount={aiItems.length}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative mb-[60px] md:mb-0">
        <Outlet context={contextValue} />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav aiPendingCount={aiItems.length} />

      {/* Global Modal */}
      {isEntryModalOpen && (
        <ManualEntryModal
          onClose={() => setIsEntryModalOpen(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Auth />} />

      {/* Protected Routes (Wrapped in ProtectedRoute logic) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardWrapper />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/ai-audit" element={<AiAudit />} />
        <Route path="/analysis" element={<AiAnalysis />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </LanguageProvider>
    </AuthProvider>
  );
};

// Helper wrapper to connect the layout state to Dashboard props
const DashboardWrapper: React.FC = () => {
  const { onOpenEntryModal } = useOutletContext<GlobalOutletContextType>();
  return <Dashboard onOpenEntryModal={onOpenEntryModal} />;
};

const MobileNav: React.FC<{ aiPendingCount: number }> = ({ aiPendingCount }) => {
  const location = useLocation();
  const { t } = useLanguage();
  
  const navItems = [
    { name: t('nav.dashboard'), path: '/dashboard', icon: 'dashboard' },
    { name: t('nav.transactions'), path: '/transactions', icon: 'receipt_long' },
    { name: t('nav.aiAudit'), path: '/ai-audit', icon: 'auto_awesome', badge: aiPendingCount > 0 ? aiPendingCount : undefined },
    { name: t('nav.analysis'), path: '/analysis', icon: 'pie_chart' },
    { name: t('nav.my'), path: '/settings', icon: 'person' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-[60px] flex items-center justify-around px-2 z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full relative ${
              isActive ? 'text-primary' : 'text-slate-400'
            }`}
          >
            <div className="relative">
              <span className={`material-symbols-outlined text-[24px] ${isActive ? 'filled' : ''}`}>
                {item.icon}
              </span>
              {item.badge && (
                <span className="absolute -top-1 -right-2 bg-danger text-white text-[9px] font-bold px-1 rounded-full min-w-[16px] h-[16px] flex items-center justify-center border-2 border-white">
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-medium mt-0.5 ${isActive ? 'font-bold' : ''}`}>{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default App;