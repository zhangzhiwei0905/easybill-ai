import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'zh' | 'en';

export const translations = {
  zh: {
    common: {
      appName: 'EasyBill AI',
      slogan: '智能记账助手',
      add: '新增账单',
      edit: '编辑',
      delete: '删除',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      search: '搜索',
      loading: '加载中...',
      export: '导出报表',
      refresh: '刷新列表',
      refreshing: '刷新中...',
      filter: '筛选',
      reset: '重置',
      actions: '操作',
      date: '日期',
      category: '分类',
      desc: '备注描述',
      source: '记录来源',
      amount: '金额',
      type: '收支类型',
      all: '全部',
      income: '收入',
      expense: '支出',
      transfer: '转账',
      welcome: '欢迎回来',
      overview: '这是您今天的财务概览',
      quickAdd: '快速记账',
      totalExpense: '总支出',
      totalIncome: '总收入',
      monthExpense: '本月支出',
      monthIncome: '本月收入',
      trend: '支出趋势',
      categoryDist: '类别分布',
      aiInsight: 'DeepSeek 智能识别',
      pendingConfirm: '条待确认',
      confirmAll: '全部确认',
      checkAll: '查看全部识别记录',
      aiParsing: 'AI 解析',
      confirmRecord: '确认记账',
      noMatch: '没有找到匹配的记录',
      clearFilter: '清除筛选条件',
      itemsPerPage: '每页显示',
      manualEntry: '手动录入',
      aiExtracted: 'AI 提取',
      login: '立即登录',
      register: '创建账户',
      email: '电子邮箱',
      password: '密码',
      name: '用户名',
      forgotPass: '忘记密码?',
      or: '或是通过以下方式',
      hasAccount: '已有账户?',
      noAccount: '还没有账户?',
      registerLink: '免费注册',
      loginLink: '直接登录',
      createAccount: '创建新账户',
      loginWelcome: '欢迎回来',
      loginSub: '请输入您的账号密码以继续',
      regSub: '注册即刻体验 AI 智能记账',
      verifyCode: '验证码',
      sendCode: '获取验证码',
      resendCode: '重新获取',
      resetPasswordTitle: '重置密码',
      resetPasswordSub: '验证邮箱以设置新密码',
      resetPasswordBtn: '重置密码',
      newPassword: '新密码',
      backToLogin: '返回登录',
      codeSent: '验证码已发送',
      codeInvalid: '验证码错误 (测试码: 8888)',
      passwordResetSuccess: '密码重置成功，请登录',
      enterEmailFirst: '请先输入邮箱地址',
      confirmDetail: '请核对以下记账信息，确认无误后入账',
      heroTitlePre: '让记账',
      heroTitlePost: '变得前所未有的简单',
      heroDesc: '由 DeepSeek 驱动。自动识别账单短信，智能分析消费习惯，提供专业的财务洞察。',
      usersJoined: '10,000+ 用户已加入',
      google: 'Google',
      wechat: '微信',
    },
    nav: {
      dashboard: '仪表盘',
      transactions: '账单明细',
      aiAudit: 'AI 审核',
      analysis: '收支分析',
      settings: '系统设置',
      my: '我的',
      logout: '退出登录',
      pro: 'PRO 会员',
      aiDesc: 'AI 智能记账'
    },
    settings: {
      title: '系统设置',
      subtitle: '管理您的账户偏好与应用设置',
      accountGroup: '账户与安全',
      generalGroup: '通用设置',
      aboutGroup: '关于与支持',
      profile: '个人信息',
      security: '账户安全',
      membership: '会员权益',
      notifications: '消息通知',
      currency: '货币单位',
      language: '多语言',
      theme: '外观主题',
      help: '帮助中心',
      about: '关于智账本',
      protected: '已保护',
      default: '系统默认',
      enabled: '开启',
      logoutConfirmTitle: '退出登录',
      logoutConfirmMsg: '您确定要退出当前账户吗？退出后下次需要重新登录。',
      editProfileTitle: '编辑个人信息',
      nickname: '昵称',
    },
    audit: {
      title: 'AI 智能提取审核',
      subtitle: '已识别 %count% 条新短信待确认。AI 自动分类准确率 98%',
      rawSms: '原始短信',
      highConfidence: '高置信度',
      needConfirm: '需确认',
      checkAmount: '请核对金额',
      allConfirmed: '所有记录已确认',
      refreshHint: '点击”刷新列表”可获取最新数据',
      confirmAllTitle: '确认全部记录',
      confirmAllMsg: '您确定要将当前列表中的 %count% 条记录全部标记为确认并记入账本吗？',
      confidenceHigh: '高',
      confidenceMedium: '中',
      confidenceLow: '低',
      deleteTitle: '删除记录',
      deleteMsg: '您确定要删除这条记录吗？删除后将不会记入账本。',
    },
    transactions: {
      title: '账单明细',
      subtitle: '管理您的历史收支，支持 DeepSeek AI 智能分类',
      placeholder: '搜索消费内容、金额或关键词...',
      showing: '显示 %start% 到 %end% 条，共 %total% 条'
    }
  },
  en: {
    common: {
      appName: 'EasyBill AI',
      slogan: 'Smart Expense Tracker',
      add: 'Add New',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      search: 'Search',
      loading: 'Loading...',
      export: 'Export CSV',
      refresh: 'Refresh',
      refreshing: 'Refreshing...',
      filter: 'Filter',
      reset: 'Reset',
      actions: 'Actions',
      date: 'Date',
      category: 'Category',
      desc: 'Description',
      source: 'Source',
      amount: 'Amount',
      type: 'Type',
      all: 'All',
      income: 'Income',
      expense: 'Expense',
      transfer: 'Transfer',
      welcome: 'Welcome back',
      overview: 'Here is your financial overview for today',
      quickAdd: 'Quick Add',
      totalExpense: 'Total Exp',
      totalIncome: 'Total Inc',
      monthExpense: 'Month Exp',
      monthIncome: 'Month Inc',
      trend: 'Expense Trend',
      categoryDist: 'Distribution',
      aiInsight: 'DeepSeek AI Analysis',
      pendingConfirm: 'Pending',
      confirmAll: 'Confirm All',
      checkAll: 'View All Records',
      aiParsing: 'Raw Message',
      confirmRecord: 'Confirm',
      noMatch: 'No matching records found',
      clearFilter: 'Clear Filters',
      itemsPerPage: 'Rows per page',
      manualEntry: 'Manual',
      aiExtracted: 'AI Extracted',
      login: 'Login Now',
      register: 'Create Account',
      email: 'Email Address',
      password: 'Password',
      name: 'Username',
      forgotPass: 'Forgot Password?',
      or: 'Or continue with',
      hasAccount: 'Already have an account?',
      noAccount: 'No account yet?',
      registerLink: 'Sign up for free',
      loginLink: 'Sign in',
      createAccount: 'Create Account',
      loginWelcome: 'Welcome Back',
      loginSub: 'Please enter your details to continue',
      regSub: 'Register to experience AI bookkeeping',
      verifyCode: 'Verification Code',
      sendCode: 'Send Code',
      resendCode: 'Resend',
      resetPasswordTitle: 'Reset Password',
      resetPasswordSub: 'Verify email to set a new password',
      resetPasswordBtn: 'Reset Password',
      newPassword: 'New Password',
      backToLogin: 'Back to Login',
      codeSent: 'Code Sent',
      codeInvalid: 'Invalid Code (Try: 8888)',
      passwordResetSuccess: 'Password reset successful, please login',
      enterEmailFirst: 'Please enter email address first',
      confirmDetail: 'Please verify details below before recording',
      heroTitlePre: 'Make accounting',
      heroTitlePost: 'unprecedentedly simple',
      heroDesc: 'Powered by DeepSeek. Automatically identify bill SMS, intelligently analyze spending habits, and provide professional financial insights.',
      usersJoined: '10,000+ Users Joined',
      google: 'Google',
      wechat: 'WeChat',
    },
    nav: {
      dashboard: 'Dashboard',
      transactions: 'Transactions',
      aiAudit: 'AI Audit',
      analysis: 'Analysis',
      settings: 'Settings',
      my: 'Me',
      logout: 'Log Out',
      pro: 'PRO Member',
      aiDesc: 'AI Smart Tracker'
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your account preferences and app settings',
      accountGroup: 'Account & Security',
      generalGroup: 'General',
      aboutGroup: 'About & Support',
      profile: 'Profile',
      security: 'Security',
      membership: 'Membership',
      notifications: 'Notifications',
      currency: 'Currency',
      language: 'Language',
      theme: 'Appearance',
      help: 'Help Center',
      about: 'About EasyBill',
      protected: 'Protected',
      default: 'System Default',
      enabled: 'On',
      logoutConfirmTitle: 'Log Out',
      logoutConfirmMsg: 'Are you sure you want to log out? You will need to sign in again.',
      editProfileTitle: 'Edit Profile',
      nickname: 'Nickname',
    },
    audit: {
      title: 'AI Extraction Audit',
      subtitle: '%count% new SMS identified. AI classification accuracy 98%',
      rawSms: 'Raw SMS',
      highConfidence: 'High Confidence',
      needConfirm: 'Review Needed',
      checkAmount: 'Check Amount',
      allConfirmed: 'All records confirmed',
      refreshHint: 'Click "Refresh" to get latest data',
      confirmAllTitle: 'Confirm All',
      confirmAllMsg: 'Are you sure you want to confirm all %count% records and add them to the ledger?',
      confidenceHigh: 'High',
      confidenceMedium: 'Medium',
      confidenceLow: 'Low',
      deleteTitle: 'Delete Record',
      deleteMsg: 'Are you sure you want to delete this record? It will not be added to the ledger.',
    },
    transactions: {
      title: 'Transactions',
      subtitle: 'Manage history, supported by DeepSeek AI classification',
      placeholder: 'Search content, amount or keywords...',
      showing: 'Showing %start% to %end% of %total% items'
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('easybill_language') as Language;
    if (savedLang) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('easybill_language', lang);
  };

  const t = (path: string, params?: Record<string, string | number>) => {
    const keys = path.split('.');
    let value: any = translations[language];
    
    for (const key of keys) {
      if (value && value[key]) {
        value = value[key];
      } else {
        return path; // Fallback to key if not found
      }
    }

    if (typeof value === 'string' && params) {
      let result = value;
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`%${k}%`, String(v));
      });
      return result;
    }

    return value as string;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
