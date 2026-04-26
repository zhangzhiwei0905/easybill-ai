import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { api } from '../services/api';

interface ChangePasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onSuccess }) => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async () => {
    setError(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t('common.confirm'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('settings.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('settings.passwordMismatch'));
      return;
    }

    if (!token) return;

    setLoading(true);
    try {
      await api.users.changePassword({ oldPassword, newPassword }, token);
      onSuccess();
    } catch (err: any) {
      setError(err.message || t('settings.passwordChangeFail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 flex flex-col" onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-text-main dark:text-text-dark-main">{t('settings.changePasswordTitle')}</h3>
          <button onClick={onClose} className="text-slate-400 dark:text-gray-500 hover:text-text-main dark:hover:text-text-dark-main transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          {/* Old Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-main dark:text-text-dark-main">{t('settings.oldPassword')}</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full h-10 px-3 pr-10 rounded-lg border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark-alt focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm text-text-main dark:text-text-dark-main outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300"
              >
                <span className="material-symbols-outlined text-[18px]">{showOld ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-main dark:text-text-dark-main">{t('settings.newPassword')}</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-10 px-3 pr-10 rounded-lg border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark-alt focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm text-text-main dark:text-text-dark-main outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300"
              >
                <span className="material-symbols-outlined text-[18px]">{showNew ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-main dark:text-text-dark-main">{t('settings.confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark-alt focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm text-text-main dark:text-text-dark-main outline-none transition-all"
            />
          </div>

          {error && (
            <div className="text-xs text-danger text-center">{error}</div>
          )}
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-10 rounded-lg border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark text-text-main dark:text-text-dark-main font-bold text-sm hover:bg-slate-50 dark:hover:bg-surface-dark-alt transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !oldPassword || !newPassword || !confirmPassword}
            className="flex-1 h-10 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('settings.saving') : t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
