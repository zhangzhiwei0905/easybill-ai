import React, { useState } from 'react';
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
import { AiPendingItem, GlobalOutletContextType } from './types';

// Initial Data Set for AI Audit (Updated to match screenshot)
const INITIAL_AI_ITEMS: AiPendingItem[] = [
  {
    id: '2',
    rawText: '滴滴出行自动扣款成功，金额28.00元，订单号...',
    date: '2023年10月24日',
    category: "交通出行",
    categoryIcon: "directions_car",
    categoryColor: "bg-blue-100 text-blue-600",
    description: "滴滴出行",
    amount: 28.00,
    confidence: 'HIGH',
    type: 'EXPENSE'
  },
  {
    id: '3',
    rawText: '京东商城消费128.00元，商品：洁柔抽纸...',
    date: '2023年10月24日',
    category: "网购日常",
    categoryIcon: "shopping_bag",
    categoryColor: "bg-pink-100 text-pink-600",
    description: "京东商城",
    amount: 128.00,
    confidence: 'HIGH',
    type: 'EXPENSE'
  }
];

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
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [aiItems, setAiItems] = useState<AiPendingItem[]>(INITIAL_AI_ITEMS);

  const refreshAiItems = () => {
    setAiItems(INITIAL_AI_ITEMS);
  };

  const contextValue: GlobalOutletContextType = {
    onOpenEntryModal: () => setIsEntryModalOpen(true),
    aiItems,
    setAiItems,
    refreshAiItems
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
        <ManualEntryModal onClose={() => setIsEntryModalOpen(false)} />
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