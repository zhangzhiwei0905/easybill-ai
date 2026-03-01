import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { api } from '../services/api';
import ConfirmActionModal from './ConfirmActionModal';
import EditProfileModal from './EditProfileModal';

const Settings: React.FC = () => {
  const { user, logout, login, token } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [webhookKey, setWebhookKey] = useState<string | null>(null);
  const [showWebhookKey, setShowWebhookKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load user profile on mount
  useEffect(() => {
    if (token) {
      loadUserProfile();
      loadWebhookKey();
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
      alert('重新生成失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // Settings State
  const [currency, setCurrency] = useState('CNY');
  const [autoConfirmThreshold, setAutoConfirmThreshold] = useState('HIGH_ONLY');
  const [activeSheet, setActiveSheet] = useState<'CURRENCY' | 'LANGUAGE' | 'AUTO_CONFIRM' | null>(null);

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
      title: 'AI 自动入账',
      items: [
        {
          icon: 'smart_toy',
          label: '自动入账阈值',
          value: autoConfirmThreshold === 'HIGH_ONLY' ? '仅高置信度' : autoConfirmThreshold === 'HIGH_AND_MEDIUM' ? '高+中置信度' : '全部手动',
          onClick: () => setActiveSheet('AUTO_CONFIRM')
        },
      ]
    },
    {
      title: t('settings.aboutGroup'),
      items: [
        { icon: 'help', label: t('settings.help'), value: '', onClick: () => navigate('/help') },
        { icon: 'info', label: t('settings.about'), value: 'v2.1.0' },
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
          {profileLoading ? (
            <div className="flex items-center gap-4 flex-1">
              <div className="size-14 md:size-16 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
              <div className="flex-1">
                <div className="h-5 w-24 bg-slate-200 animate-pulse rounded mb-2"></div>
                <div className="h-4 w-32 bg-slate-200 animate-pulse rounded"></div>
              </div>
            </div>
          ) : (
            <>
              <div
                className="size-14 md:size-16 rounded-full bg-cover bg-center border border-slate-200 shrink-0"
                style={{ backgroundImage: `url("${currentUser?.avatar || 'https://picsum.photos/100/100'}")` }}
              ></div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-text-main truncate">{currentUser?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-text-sub whitespace-nowrap">{currentUser?.email || 'ID: 8839201'}</span>
                  {currentUser?.isPro && (
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
            </>
          )}
        </div>

        {/* Webhook Configuration Card */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-purple-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-500">webhook</span>
            </div>
            <div>
              <h3 className="font-bold text-text-main">Webhook 配置</h3>
              <p className="text-xs text-text-sub">用于短信自动记账的 API 密钥</p>
            </div>
          </div>

          {/* User ID */}
          <div className="mb-4">
            <label className="text-xs font-medium text-text-sub mb-1 block">用户 ID</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-50 px-3 py-2 rounded-lg text-xs font-mono text-slate-600 break-all">
                {user?.id}
              </code>
              <button
                onClick={handleCopyUserId}
                className="shrink-0 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                title="复制用户ID"
              >
                <span className="material-symbols-outlined text-slate-500 text-[18px]">content_copy</span>
              </button>
            </div>
          </div>

          {/* Webhook Key */}
          <div className="mb-4">
            <label className="text-xs font-medium text-text-sub mb-1 block">Webhook Key</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-50 px-3 py-2 rounded-lg text-xs font-mono text-slate-600 break-all">
                {showWebhookKey ? (webhookKey || '未设置') : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
              </code>
              <button
                onClick={() => setShowWebhookKey(!showWebhookKey)}
                className="shrink-0 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                title={showWebhookKey ? '隐藏' : '显示'}
              >
                <span className="material-symbols-outlined text-slate-500 text-[18px]">
                  {showWebhookKey ? 'visibility_off' : 'visibility'}
                </span>
              </button>
              <button
                onClick={handleCopyWebhookKey}
                className="shrink-0 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                title="复制 Webhook Key"
              >
                <span className="material-symbols-outlined text-slate-500 text-[18px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
          </div>

          {/* Usage Example */}
          <div className="mb-4">
            <label className="text-xs font-medium text-text-sub mb-1 block">调用示例</label>
            <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-[10px] md:text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono">
              {webhookExample}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRegenerateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              重新生成
            </button>
            <span className="text-xs text-text-sub">
              重新生成后，旧的 Key 将立即失效
            </span>
          </div>
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
      {isEditProfileModalOpen && (currentUser || user) && (
        <EditProfileModal
          user={currentUser || user!}
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

      {/* Auto Confirm Threshold Selection Modal */}
      {activeSheet === 'AUTO_CONFIRM' && (
        <SelectionModal
          title="自动入账阈值"
          options={[
            { label: '仅高置信度', value: 'HIGH_ONLY', icon: 'shield', description: '只有 AI 高度确信的交易才会自动入账' },
            { label: '高+中置信度', value: 'HIGH_AND_MEDIUM', icon: 'verified', description: '高和中等置信度的交易都会自动入账' },
            { label: '全部手动确认', value: 'MANUAL_ONLY', icon: 'pan_tool', description: '所有交易都需要手动确认后才入账' }
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
        title="重新生成 Webhook Key"
        message="确定要重新生成 Webhook Key 吗？生成后，旧的 Key 将立即失效，您需要更新所有使用该 Key 的配置。"
        confirmText={isLoading ? '生成中...' : '确认生成'}
        confirmButtonClass="bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200"
        icon="refresh"
        iconColorClass="text-amber-500"
        iconBgClass="bg-amber-50"
      />
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
              <div className="flex-1 text-left">
                <div className={`text-sm ${currentValue === option.value ? 'font-bold' : 'font-medium'}`}>
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs text-text-sub mt-0.5">{option.description}</div>
                )}
              </div>
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