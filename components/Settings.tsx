import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { api } from '../services/api';
import ConfirmActionModal from './ConfirmActionModal';
import EditProfileModal from './EditProfileModal';
import ChangePasswordModal from './ChangePasswordModal';

const Settings: React.FC = () => {
  const { user, logout, login, token } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [webhookKey, setWebhookKey] = useState<string | null>(null);
  const [showWebhookKey, setShowWebhookKey] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load user profile on mount
  useEffect(() => {
    if (token) {
      loadUserProfile();
      loadWebhookKey();
      loadPreferences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadUserProfile = async () => {
    setProfileLoading(true);
    try {
      const profile = await api.users.getProfile(token!);
      setCurrentUser(profile);
      // Update auth context as well
      const existingToken = localStorage.getItem('easybill_token') || '';
      const existingRefresh = localStorage.getItem('easybill_refresh_token') || '';
      login(profile, existingToken, existingRefresh);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Fallback to current user from context
      setCurrentUser(user);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadWebhookKey = async () => {
    try {
      const result = await api.auth.getWebhookKey(token!);
      setWebhookKey(result.webhookKey);
    } catch (error) {
      console.error('Failed to load webhook key:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const prefs = await api.users.getPreferences(token!);
      if (prefs.autoConfirmThreshold) {
        setAutoConfirmThreshold(prefs.autoConfirmThreshold);
      }
      if (prefs.language) {
        setLanguage(prefs.language as 'zh' | 'en');
      }
      // Theme is managed locally via ThemeContext/localStorage, not loaded from backend
      // to prevent overriding user's current theme when navigating to Settings
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const handleCopyWebhookKey = async () => {
    if (webhookKey) {
      await navigator.clipboard.writeText(webhookKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyUserId = async () => {
    if (user?.id) {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerateWebhookKey = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await api.auth.regenerateWebhookKey(token);
      setWebhookKey(result.webhookKey);
      setIsRegenerateModalOpen(false);
    } catch (error) {
      console.error('Failed to regenerate webhook key:', error);
      alert(t('settings.regenerateFail'));
    } finally {
      setIsLoading(false);
    }
  };

  // Settings State
  const [autoConfirmThreshold, setAutoConfirmThreshold] = useState('HIGH_ONLY');
  const [activeSheet, setActiveSheet] = useState<'LANGUAGE' | 'AUTO_CONFIRM' | 'THEME' | null>(null);

  const menuGroups = [
    {
      title: t('settings.accountGroup'),
      items: [
        { icon: 'lock', label: t('settings.security'), value: '', onClick: () => setIsChangePasswordModalOpen(true) },
      ]
    },
    {
      title: t('settings.generalGroup'),
      items: [
        {
          icon: 'paid',
          label: t('settings.currency'),
          value: 'CNY (¥)',
        },
        {
          icon: 'language',
          label: t('settings.language'),
          value: language === 'zh' ? '简体中文' : 'English',
          onClick: () => setActiveSheet('LANGUAGE')
        },
        { icon: 'palette', label: t('settings.theme'), value: theme === 'light' ? t('settings.themeLight') : theme === 'dark' ? t('settings.themeDark') : t('settings.themeSystem'), onClick: () => setActiveSheet('THEME') },
      ]
    },
    {
      title: t('settings.aiGroup'),
      items: [
        {
          icon: 'smart_toy',
          label: t('settings.autoConfirmThreshold'),
          value: autoConfirmThreshold === 'HIGH_ONLY' ? t('settings.highOnly') : autoConfirmThreshold === 'HIGH_AND_MEDIUM' ? t('settings.highAndMedium') : t('settings.manualOnly'),
          onClick: () => setActiveSheet('AUTO_CONFIRM')
        },
      ]
    },
    {
      title: t('settings.aboutGroup'),
      items: [
        { icon: 'help', label: t('settings.help'), value: '', onClick: () => navigate('/help') },
        { icon: 'info', label: t('settings.about'), value: 'v1.0.0' },
      ]
    }
  ];

  // Webhook 配置示例
  const webhookExample = `curl -X POST https://your-api.com/api/ai-items/webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "rawText": "【银行】支出100元",
    "userId": "${currentUser?.id || user?.id}",
    "webhookKey": "${webhookKey || 'your-webhook-key'}"
  }'`;

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
    setCurrentUser(updatedUser);
    setIsEditProfileModalOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark h-full">
      <div className="max-w-3xl mx-auto px-4 md:px-10 py-6 md:py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-text-main dark:text-text-dark-main">{t('settings.title')}</h1>
          <p className="text-sm text-text-sub dark:text-text-dark-sub mt-1">{t('settings.subtitle')}</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-surface-dark p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-border-dark mb-8 flex items-center gap-4">
          {profileLoading ? (
            <div className="flex items-center gap-4 flex-1">
              <div className="size-14 md:size-16 rounded-full bg-slate-200 dark:bg-[#3a3f54] animate-pulse shrink-0"></div>
              <div className="flex-1">
                <div className="h-5 w-24 bg-slate-200 dark:bg-[#3a3f54] animate-pulse rounded mb-2"></div>
                <div className="h-4 w-32 bg-slate-200 dark:bg-[#3a3f54] animate-pulse rounded"></div>
              </div>
            </div>
          ) : (
            <>
              <div
                className="size-14 md:size-16 rounded-full bg-cover bg-center border border-slate-200 dark:border-border-dark shrink-0"
                style={{ backgroundImage: `url("${currentUser?.avatar || 'https://picsum.photos/100/100'}")` }}
              ></div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-text-main dark:text-text-dark-main truncate">{currentUser?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-text-sub dark:text-text-dark-sub whitespace-nowrap">{currentUser?.email || 'ID: 8839201'}</span>
                  {currentUser?.isPro && (
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">{t('nav.pro')}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsEditProfileModalOpen(true)}
                className="shrink-0 px-3 py-1.5 md:px-4 md:py-2 border border-slate-200 dark:border-border-dark rounded-lg text-xs md:text-sm font-medium hover:bg-slate-50 dark:hover:bg-surface-dark-alt transition-colors dark:text-text-dark-main"
              >
                {t('settings.editProfileTitle')}
              </button>
            </>
          )}
        </div>

        {/* Webhook Configuration Card */}
        <div className="bg-white dark:bg-surface-dark p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-border-dark mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-500">webhook</span>
            </div>
            <div>
              <h3 className="font-bold text-text-main dark:text-text-dark-main">{t('settings.webhookConfig')}</h3>
              <p className="text-xs text-text-sub dark:text-text-dark-sub">{t('settings.webhookConfigDesc')}</p>
            </div>
          </div>

          {/* User ID */}
          <div className="mb-4">
            <label className="text-xs font-medium text-text-sub dark:text-text-dark-sub mb-1 block">{t('settings.userId')}</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-50 dark:bg-surface-dark-alt px-3 py-2 rounded-lg text-xs font-mono text-slate-600 dark:text-gray-300 break-all">
                {user?.id}
              </code>
              <button
                onClick={handleCopyUserId}
                className="shrink-0 p-2 rounded-lg bg-slate-100 dark:bg-[#2e3244] hover:bg-slate-200 dark:hover:bg-[#3a3f54] transition-colors"
                title={t('settings.copyUserId')}
              >
                <span className="material-symbols-outlined text-slate-500 dark:text-gray-400 text-[18px]">content_copy</span>
              </button>
            </div>
          </div>

          {/* Webhook Key */}
          <div className="mb-4">
            <label className="text-xs font-medium text-text-sub dark:text-text-dark-sub mb-1 block">{t('settings.webhookKey')}</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-50 dark:bg-surface-dark-alt px-3 py-2 rounded-lg text-xs font-mono text-slate-600 dark:text-gray-300 break-all">
                {showWebhookKey ? (webhookKey || t('settings.notSet')) : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
              </code>
              <button
                onClick={() => setShowWebhookKey(!showWebhookKey)}
                className="shrink-0 p-2 rounded-lg bg-slate-100 dark:bg-[#2e3244] hover:bg-slate-200 dark:hover:bg-[#3a3f54] transition-colors"
                title={showWebhookKey ? t('settings.hideKey') : t('settings.showKey')}
              >
                <span className="material-symbols-outlined text-slate-500 dark:text-gray-400 text-[18px]">
                  {showWebhookKey ? 'visibility_off' : 'visibility'}
                </span>
              </button>
              <button
                onClick={handleCopyWebhookKey}
                className="shrink-0 p-2 rounded-lg bg-slate-100 dark:bg-[#2e3244] hover:bg-slate-200 dark:hover:bg-[#3a3f54] transition-colors"
                title={t('settings.copyWebhookKey')}
              >
                <span className="material-symbols-outlined text-slate-500 dark:text-gray-400 text-[18px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>

          {/* Usage Example */}
          <div className="mb-4">
            <label className="text-xs font-medium text-text-sub dark:text-text-dark-sub mb-1 block">{t('settings.usageExample')}</label>
            <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-[10px] md:text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono">
              {webhookExample}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRegenerateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              {t('settings.regenerate')}
            </button>
            <span className="text-xs text-text-sub dark:text-text-dark-sub">
              {t('settings.regenerateWarning')}
            </span>
          </div>
        </div>

        {/* Settings Groups */}
        <div className="flex flex-col gap-6 pb-20 md:pb-0">
          {menuGroups.map((group, index) => (
            <div key={index} className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-text-sub dark:text-text-dark-sub uppercase tracking-wider ml-2">{group.title}</h3>
              <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-100 dark:border-border-dark overflow-hidden">
                {group.items.map((item, i) => (
                  <button
                    key={i}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-surface-dark-alt transition-colors text-left ${i !== group.items.length - 1 ? 'border-b border-slate-50 dark:border-border-dark' : ''}`}
                  >
                    <span className="material-symbols-outlined text-slate-400 dark:text-gray-500">{item.icon}</span>
                    <span className="text-sm font-medium text-text-main dark:text-text-dark-main flex-1">{item.label}</span>
                    <span className="text-xs md:text-sm text-text-sub dark:text-text-dark-sub">{item.value}</span>
                    <span className="material-symbols-outlined text-slate-300 dark:text-gray-600 text-[18px]">chevron_right</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Logout */}
          <button
            onClick={handleLogoutClick}
            className="w-full bg-white dark:bg-surface-dark border border-red-100 dark:border-red-900/30 text-danger font-bold py-4 rounded-xl shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-4 flex items-center justify-center gap-2 group"
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">logout</span>
            {t('nav.logout')}
          </button>

          <div className="text-center text-xs text-slate-400 dark:text-gray-500 mt-4 pb-4">
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
        iconBgClass="bg-red-50 dark:bg-red-900/20"
      />

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (currentUser || user) && (
        <EditProfileModal
          user={currentUser || user!}
          onClose={() => setIsEditProfileModalOpen(false)}
          onSave={handleUpdateProfile}
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
          onSelect={async (val) => {
            setLanguage(val as 'zh' | 'en');
            setActiveSheet(null);
            // Sync to backend
            try {
              await api.users.updatePreferences(token!, { language: val });
            } catch (error) {
              console.error('Failed to update language preference:', error);
            }
          }}
          onClose={() => setActiveSheet(null)}
        />
      )}

      {/* Auto Confirm Threshold Selection Modal */}
      {activeSheet === 'AUTO_CONFIRM' && (
        <SelectionModal
          title={t('settings.autoConfirmThreshold')}
          options={[
            { label: t('settings.highOnly'), value: 'HIGH_ONLY', icon: 'shield', description: t('settings.highOnlyDesc') },
            { label: t('settings.highAndMedium'), value: 'HIGH_AND_MEDIUM', icon: 'verified', description: t('settings.highAndMediumDesc') },
            { label: t('settings.manualOnly'), value: 'MANUAL_ONLY', icon: 'pan_tool', description: t('settings.manualOnlyDesc') }
          ]}
          currentValue={autoConfirmThreshold}
          onSelect={async (val) => {
            setAutoConfirmThreshold(val);
            setActiveSheet(null);
            // 保存到后端
            try {
              await api.users.updatePreferences(token!, { autoConfirmThreshold: val });
            } catch (error) {
              console.error('Failed to update auto confirm threshold:', error);
            }
          }}
          onClose={() => setActiveSheet(null)}
        />
      )}

      {/* Regenerate Webhook Key Modal */}
      <ConfirmActionModal
        isOpen={isRegenerateModalOpen}
        onClose={() => setIsRegenerateModalOpen(false)}
        onConfirm={handleRegenerateWebhookKey}
        title={t('settings.regenerateTitle')}
        message={t('settings.regenerateMessage')}
        confirmText={isLoading ? t('settings.regenerating') : t('settings.regenerateConfirm')}
        confirmButtonClass="bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200"
        icon="refresh"
        iconColorClass="text-amber-500"
        iconBgClass="bg-amber-50 dark:bg-amber-900/20"
      />

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] bg-[#111418] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <span className="material-symbols-outlined text-success">check_circle</span>
          <span className="font-bold text-sm">{t('settings.saveSuccess')}</span>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setIsChangePasswordModalOpen(false)}
          onSuccess={() => {
            setIsChangePasswordModalOpen(false);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
          }}
        />
      )}

      {/* Theme Selection Modal */}
      {activeSheet === 'THEME' && (
        <SelectionModal
          title={t('settings.theme')}
          options={[
            { label: t('settings.themeLight'), value: 'light', icon: 'light_mode' },
            { label: t('settings.themeDark'), value: 'dark', icon: 'dark_mode' },
            { label: t('settings.themeSystem'), value: 'system', icon: 'contrast' },
          ]}
          currentValue={theme}
          onSelect={async (val) => {
            setTheme(val as 'light' | 'dark' | 'system');
            setActiveSheet(null);
            // Sync to backend
            try {
              await api.users.updatePreferences(token!, { theme: val });
            } catch (error) {
              console.error('Failed to update theme preference:', error);
            }
          }}
          onClose={() => setActiveSheet(null)}
        />
      )}
    </div>
  );
};

// Internal reusable Selection Modal Component
interface SelectionModalProps {
  title: string;
  options: { label: string; value: string; icon: string; description?: string }[];
  currentValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({ title, options, currentValue, onSelect, onClose }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full md:max-w-sm bg-white dark:bg-surface-dark rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-border-dark flex items-center justify-between">
          <h3 className="font-bold text-text-main dark:text-text-dark-main">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[#2e3244] text-slate-400 dark:text-gray-500 hover:text-text-main dark:hover:text-text-dark-main transition-colors">
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
                : 'text-text-main dark:text-text-dark-main hover:bg-slate-50 dark:hover:bg-surface-dark-alt'
                }`}
            >
              <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${currentValue === option.value ? 'bg-primary/10' : 'bg-slate-100 dark:bg-[#2e3244] text-slate-500 dark:text-gray-400'
                }`}>
                <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
              </div>
              <div className="flex-1 text-left">
                <div className={`text-sm ${currentValue === option.value ? 'font-bold' : 'font-medium'}`}>
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs text-text-sub dark:text-text-dark-sub mt-0.5">{option.description}</div>
                )}
              </div>
              {currentValue === option.value && (
                <span className="material-symbols-outlined text-primary text-[20px]">check</span>
              )}
            </button>
          ))}
        </div>
        <div className="p-2 bg-slate-50/50 dark:bg-surface-dark-alt border-t border-slate-100 dark:border-border-dark md:hidden">
          <button onClick={onClose} className="w-full h-12 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark text-text-main dark:text-text-dark-main font-bold text-sm">{t('common.cancel')}</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
