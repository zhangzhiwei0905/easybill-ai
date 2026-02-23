import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import ConfirmActionModal from './ConfirmActionModal';
import EditProfileModal from './EditProfileModal';

const Settings: React.FC = () => {
  const { user, logout, login, token } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Settings State
  const [currency, setCurrency] = useState('CNY');
  const [activeSheet, setActiveSheet] = useState<'CURRENCY' | 'LANGUAGE' | null>(null);

  const menuGroups = [
    {
      title: t('settings.accountGroup'),
      items: [
        { icon: 'lock', label: t('settings.security'), value: t('settings.protected') },
        { icon: 'badge', label: t('settings.membership'), value: user?.isPro ? t('nav.pro') : 'Free' },
      ]
    },
    {
      title: t('settings.generalGroup'),
      items: [
        { icon: 'notifications', label: t('settings.notifications'), value: t('settings.enabled') },
        {
          icon: 'paid',
          label: t('settings.currency'),
          value: currency === 'CNY' ? 'CNY (¥)' : 'USD ($)',
          onClick: () => setActiveSheet('CURRENCY')
        },
        {
          icon: 'language',
          label: t('settings.language'),
          value: language === 'zh' ? '简体中文' : 'English',
          onClick: () => setActiveSheet('LANGUAGE')
        },
        { icon: 'palette', label: t('settings.theme'), value: t('settings.default') },
      ]
    },
    {
      title: t('settings.aboutGroup'),
      items: [
        { icon: 'help', label: t('settings.help'), value: '' },
        { icon: 'info', label: t('settings.about'), value: 'v2.1.0' },
      ]
    }
  ];

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    navigate('/login', { replace: true });
  };

  const handleUpdateProfile = (updatedUser: User) => {
    const existingToken = localStorage.getItem('easybill_token') || '';
    const existingRefresh = localStorage.getItem('easybill_refresh_token') || '';
    login(updatedUser, existingToken, existingRefresh);
    setIsEditProfileModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background-light h-full">
      <div className="max-w-3xl mx-auto px-4 md:px-10 py-6 md:py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-text-main">{t('settings.title')}</h1>
          <p className="text-sm text-text-sub mt-1">{t('settings.subtitle')}</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 flex items-center gap-4">
          <div
            className="size-14 md:size-16 rounded-full bg-cover bg-center border border-slate-200 shrink-0"
            style={{ backgroundImage: `url("${user?.avatar || 'https://picsum.photos/100/100'}")` }}
          ></div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-text-main truncate">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-text-sub whitespace-nowrap">{user?.email || 'ID: 8839201'}</span>
              {user?.isPro && (
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">{t('nav.pro')}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsEditProfileModalOpen(true)}
            className="shrink-0 px-3 py-1.5 md:px-4 md:py-2 border border-slate-200 rounded-lg text-xs md:text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            {t('settings.editProfileTitle')}
          </button>
        </div>

        {/* Settings Groups */}
        <div className="flex flex-col gap-6 pb-20 md:pb-0">
          {menuGroups.map((group, index) => (
            <div key={index} className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-text-sub uppercase tracking-wider ml-2">{group.title}</h3>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {group.items.map((item, i) => (
                  <button
                    key={i}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left ${i !== group.items.length - 1 ? 'border-b border-slate-50' : ''}`}
                  >
                    <span className="material-symbols-outlined text-slate-400">{item.icon}</span>
                    <span className="text-sm font-medium text-text-main flex-1">{item.label}</span>
                    <span className="text-xs md:text-sm text-text-sub">{item.value}</span>
                    <span className="material-symbols-outlined text-slate-300 text-[18px]">chevron_right</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Logout */}
          <button
            onClick={handleLogoutClick}
            className="w-full bg-white border border-red-100 text-danger font-bold py-4 rounded-xl shadow-sm hover:bg-red-50 transition-colors mt-4 flex items-center justify-center gap-2 group"
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">logout</span>
            {t('nav.logout')}
          </button>

          <div className="text-center text-xs text-slate-400 mt-4 pb-4">
            EasyBill AI © 2023 All Rights Reserved
          </div>
        </div>

      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmActionModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title={t('settings.logoutConfirmTitle')}
        message={t('settings.logoutConfirmMsg')}
        confirmText={t('nav.logout')}
        confirmButtonClass="bg-red-500 text-white hover:bg-red-600 shadow-red-200"
        icon="logout"
        iconColorClass="text-red-500"
        iconBgClass="bg-red-50"
      />

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && user && (
        <EditProfileModal
          user={user}
          onClose={() => setIsEditProfileModalOpen(false)}
          onSave={handleUpdateProfile}
        />
      )}

      {/* Currency Selection Modal */}
      {activeSheet === 'CURRENCY' && (
        <SelectionModal
          title={t('settings.currency')}
          options={[
            { label: 'CNY (¥)', value: 'CNY', icon: 'currency_yuan' },
            { label: 'USD ($)', value: 'USD', icon: 'attach_money' }
          ]}
          currentValue={currency}
          onSelect={(val) => { setCurrency(val); setActiveSheet(null); }}
          onClose={() => setActiveSheet(null)}
        />
      )}

      {/* Language Selection Modal */}
      {activeSheet === 'LANGUAGE' && (
        <SelectionModal
          title={t('settings.language')}
          options={[
            { label: '简体中文', value: 'zh', icon: 'language' },
            { label: 'English', value: 'en', icon: 'translate' }
          ]}
          currentValue={language}
          onSelect={(val) => { setLanguage(val as 'zh' | 'en'); setActiveSheet(null); }}
          onClose={() => setActiveSheet(null)}
        />
      )}
    </div>
  );
};

// Internal reusable Selection Modal Component
interface SelectionModalProps {
  title: string;
  options: { label: string; value: string; icon: string }[];
  currentValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({ title, options, currentValue, onSelect, onClose }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full md:max-w-sm bg-white rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-text-main">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-text-main transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-2">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentValue === option.value
                ? 'bg-primary/5 text-primary'
                : 'text-text-main hover:bg-slate-50'
                }`}
            >
              <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${currentValue === option.value ? 'bg-primary/10' : 'bg-slate-100 text-slate-500'
                }`}>
                <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
              </div>
              <span className={`flex-1 text-left text-sm ${currentValue === option.value ? 'font-bold' : 'font-medium'}`}>
                {option.label}
              </span>
              {currentValue === option.value && (
                <span className="material-symbols-outlined text-primary text-[20px]">check</span>
              )}
            </button>
          ))}
        </div>
        <div className="p-2 bg-slate-50/50 border-t border-slate-100 md:hidden">
          <button onClick={onClose} className="w-full h-12 rounded-xl bg-white border border-slate-200 text-text-main font-bold text-sm">{t('common.cancel')}</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;