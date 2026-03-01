import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { api } from '../services/api';

type AuthView = 'LOGIN' | 'REGISTER' | 'FORGOT';

interface Feedback {
  type: 'success' | 'error';
  message: string;
}

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [view, setView] = useState<AuthView>('LOGIN');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    code: ''
  });

  // Countdown State
  const [countdown, setCountdown] = useState(0);

  // If already authenticated, redirect to dashboard (always, regardless of previous location)
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle Countdown Timer
  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!formData.email) {
      setFeedback({ type: 'error', message: t('common.enterEmailFirst') });
      return;
    }
    try {
      const purpose = view === 'FORGOT' ? 'RESET_PASSWORD' : 'REGISTER';
      const res = await api.auth.sendCode(formData.email, purpose);
      setCountdown(60);
      // Display verification code in feedback message
      if (res.code) {
        setFeedback({ type: 'success', message: `验证码：${res.code}` });
      } else {
        setFeedback({ type: 'success', message: t('common.codeSent') });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || '发送失败' });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsLoading(true);

    try {
      if (view === 'LOGIN') {
        const res = await api.auth.login({
          email: formData.email,
          password: formData.password,
        });
        login(res.user, res.accessToken, res.refreshToken);
        navigate('/dashboard', { replace: true });
      } else if (view === 'REGISTER') {
        const res = await api.auth.register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          code: formData.code,
        });
        setFeedback({ type: 'success', message: '🎉 注册成功！正在跳转...' });
        setTimeout(() => {
          login(res.user, res.accessToken, res.refreshToken);
          navigate('/dashboard', { replace: true });
        }, 1200);
      } else if (view === 'FORGOT') {
        await api.auth.resetPassword({
          email: formData.email,
          code: formData.code,
          newPassword: formData.password,
        });
        setFeedback({ type: 'success', message: t('common.passwordResetSuccess') });
        setTimeout(() => {
          setView('LOGIN');
          setFormData(prev => ({ ...prev, password: '', code: '' }));
          setFeedback(null);
        }, 1500);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || '操作失败' });
    } finally {
      // Don't set loading false for register — we stay loading until redirect
      if (view !== 'REGISTER') {
        setIsLoading(false);
      }
    }
  };

  const switchView = (newView: AuthView) => {
    setView(newView);
    setFeedback(null);
    setFormData(prev => ({ ...prev, password: '', code: '' }));
  };

  const getTitle = () => {
    switch (view) {
      case 'LOGIN': return t('common.loginWelcome');
      case 'REGISTER': return t('common.createAccount');
      case 'FORGOT': return t('common.resetPasswordTitle');
    }
  };

  const getSubtitle = () => {
    switch (view) {
      case 'LOGIN': return t('common.loginSub');
      case 'REGISTER': return t('common.regSub');
      case 'FORGOT': return t('common.resetPasswordSub');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white md:bg-background-light">

      {/* Left Side - Brand / Image (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0B1120] overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-[#0B1120]/90 mix-blend-multiply"></div>

        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/10">
              <span className="material-symbols-outlined text-4xl">account_balance_wallet</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t('common.appName')}</h1>
          </div>
          <h2 className="text-4xl font-extrabold mb-6 leading-tight">
            {t('common.heroTitlePre')} <br />
            <span className="text-blue-300">{t('common.heroTitlePost')}</span>
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            {t('common.heroDesc')}
          </p>

          <div className="mt-12 flex gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0B1120] bg-slate-200 bg-cover" style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 10})` }}></div>
              ))}
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex text-yellow-400 text-sm">★★★★★</div>
              <span className="text-xs text-slate-400 font-medium">{t('common.usersJoined')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[420px] bg-white md:p-10 md:rounded-3xl md:shadow-xl md:border md:border-slate-100 transition-all duration-300">

          {/* Mobile Header Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-white p-1.5 rounded-lg">
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
              </div>
              <span className="text-xl font-extrabold text-text-main">{t('common.appName')}</span>
            </div>
          </div>

          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold text-text-main mb-2">
              {getTitle()}
            </h2>
            <p className="text-text-sub text-sm">
              {getSubtitle()}
            </p>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div className={`mb-6 p-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${feedback.type === 'error'
              ? 'bg-red-50 text-danger border border-red-100'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}>
              <span className="material-symbols-outlined text-[20px]">
                {feedback.type === 'error' ? 'error' : 'check_circle'}
              </span>
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            {/* Name Field - Only for Register */}
            {view === 'REGISTER' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main ml-1">{t('common.name')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">person</span>
                  <input
                    type="text"
                    required
                    placeholder="User"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm transition-all outline-none font-medium"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Email Field - All Views */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-main ml-1">{t('common.email')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">mail</span>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm transition-all outline-none font-medium"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Verification Code Field - Register & Forgot Password */}
            {view !== 'LOGIN' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main ml-1">{t('common.verifyCode')}</label>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">vpn_key</span>
                    <input
                      type="text"
                      required
                      placeholder="8888"
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm transition-all outline-none font-medium"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0}
                    className="px-4 h-11 rounded-xl bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap min-w-[100px]"
                  >
                    {countdown > 0 ? `${countdown}s` : t('common.sendCode')}
                  </button>
                </div>
              </div>
            )}

            {/* Password Field - All Views */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-text-main ml-1">
                  {view === 'FORGOT' ? t('common.newPassword') : t('common.password')}
                </label>
                {view === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => switchView('FORGOT')}
                    className="text-xs font-bold text-primary hover:text-primary-hover"
                  >
                    {t('common.forgotPass')}
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm transition-all outline-none font-medium"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-text-main"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full h-12 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading && <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>}
              {view === 'LOGIN' ? t('common.login') : (view === 'REGISTER' ? t('common.register') : t('common.resetPasswordBtn'))}
            </button>
          </form>

          {/* Social Auth - Only Login and Register */}
          {view !== 'FORGOT' && (
            <div className="mt-8">
              <div className="relative flex justify-center text-xs text-slate-400 mb-5">
                <span className="bg-white md:bg-white px-2 z-10 relative">{t('common.or')}</span>
                <div className="absolute inset-x-0 top-1/2 h-px bg-slate-100 -z-0"></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="h-10 border border-slate-200 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                  <span className="text-sm font-bold text-text-main">{t('common.google')}</span>
                </button>
                <button className="h-10 border border-slate-200 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-green-600 text-[22px]">chat</span>
                  <span className="text-sm font-bold text-text-main">{t('common.wechat')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Toggle Login/Register or Back to Login */}
          <div className="mt-8 text-center">
            <p className="text-sm text-text-sub font-medium">
              {view === 'FORGOT' ? (
                <button
                  onClick={() => switchView('LOGIN')}
                  className="ml-1 text-primary font-bold hover:underline"
                >
                  {t('common.backToLogin')}
                </button>
              ) : (
                <>
                  {view === 'LOGIN' ? t('common.noAccount') : t('common.hasAccount')}
                  <button
                    onClick={() => switchView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                    className="ml-1 text-primary font-bold hover:underline"
                  >
                    {view === 'LOGIN' ? t('common.registerLink') : t('common.loginLink')}
                  </button>
                </>
              )}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;
