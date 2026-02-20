import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';

interface SidebarProps {
  onOpenEntryModal: () => void;
  aiPendingCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenEntryModal, aiPendingCount }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { name: t('nav.dashboard'), path: '/dashboard', icon: 'dashboard' },
    { name: t('nav.transactions'), path: '/transactions', icon: 'receipt_long' },
    { name: t('nav.aiAudit'), path: '/ai-audit', icon: 'auto_awesome', badge: aiPendingCount > 0 ? aiPendingCount : undefined },
    { name: t('nav.analysis'), path: '/analysis', icon: 'pie_chart' },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col justify-between shrink-0 h-full z-30">
      <div className="p-6">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-primary size-10 flex items-center justify-center rounded-xl shadow-lg shadow-primary/20 text-white">
            <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-text-main text-base font-bold leading-tight">{t('common.appName')}</h1>
            <p className="text-text-sub text-xs font-medium">{t('nav.aiDesc')}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-sub hover:bg-slate-50 hover:text-text-main'
                }`}
              >
                <span className={`material-symbols-outlined text-[22px] ${isActive ? 'filled' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-sm font-medium ${isActive ? 'font-bold' : ''}`}>
                  {item.name}
                </span>
                {item.badge && (
                  <span className="ml-auto bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile - Click to go to Settings */}
      <div className="p-4 border-t border-slate-100">
        <div 
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
          title="点击查看系统设置"
        >
          <div 
            className="size-10 rounded-full bg-cover bg-center border border-slate-200"
            style={{ backgroundImage: `url("${user?.avatar || 'https://picsum.photos/100/100'}")` }}
          ></div>
          <div className="flex flex-col">
            <span className="text-text-main text-sm font-bold leading-none group-hover:text-primary transition-colors">{user?.name}</span>
            {user?.isPro && (
              <span className="text-primary text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 rounded w-fit mt-1">{t('nav.pro')}</span>
            )}
          </div>
          <span className="material-symbols-outlined text-text-sub ml-auto group-hover:text-primary transition-colors">settings</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;