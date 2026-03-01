import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { api, Transaction, Category } from '../services/api';
import EditTransactionModal from './EditTransactionModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import FilterTransactionModal, { FilterCriteria } from './FilterTransactionModal';
import { GlobalOutletContextType } from '../types';
import { debounce } from 'lodash';

// Define default filters outside component to avoid recreating on each render
const DEFAULT_FILTERS: FilterCriteria = {
  type: 'ALL',
  source: 'ALL',
  minAmount: '',
  maxAmount: ''
};

const Transactions: React.FC = () => {
  const { onOpenEntryModal, onTransactionSuccess } = useOutletContext<GlobalOutletContextType>();
  const { t } = useLanguage();
  const { token } = useAuth();

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search State
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // For immediate input display

  // Track if initial load is done to prevent duplicate calls
  const hasLoadedRef = useRef(false);
  const isLoadingTransactionsRef = useRef(false);
  const isLoadingSummaryRef = useRef(false);

  // Debounced search function
  const debouncedSetSearchQuery = useMemo(
    () => debounce((value: string) => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetSearchQuery.cancel();
    };
  }, [debouncedSetSearchQuery]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    debouncedSetSearchQuery(value);
  }, [debouncedSetSearchQuery]);

  // Pagination State (Backend pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>(DEFAULT_FILTERS);

  // Table Header Sort & Filter State
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'createdAt'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [headerSourceFilter, setHeaderSourceFilter] = useState<'ALL' | 'AI_EXTRACTED' | 'MANUAL'>('ALL');
  const [headerCategoryFilter, setHeaderCategoryFilter] = useState<string>('ALL');
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Modal States
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Summary Stats
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  const loadCategories = async () => {
    if (!token) return;
    try {
      const data = await api.categories.findAll(token);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  };

  // Load transactions with backend filtering, sorting, and pagination
  const loadTransactions = async () => {
    if (!token) return;

    // Prevent concurrent calls
    if (isLoadingTransactionsRef.current) return;
    isLoadingTransactionsRef.current = true;

    setLoading(true);
    setError(null);

    try {
      // Build filter params
      const params: any = {
        page: currentPage,
        pageSize: itemsPerPage,
        sortBy,
        sortOrder,
      };

      // Date filter (convert YYYY-MM to date range)
      if (currentDate) {
        const [year, month] = currentDate.split('-');
        params.startDate = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        params.endDate = `${year}-${month}-${lastDay}`;
      }

      // Search
      if (searchQuery) {
        params.search = searchQuery;
      }

      // Type filter (from modal)
      if (filters.type !== 'ALL') {
        params.type = filters.type;
      }

      // Source filter: header dropdown takes priority; fallback to modal filter
      const effectiveSource = headerSourceFilter !== 'ALL' ? headerSourceFilter : filters.source !== 'ALL' ? filters.source : null;
      if (effectiveSource) {
        params.source = effectiveSource;
      }

      // Category filter (from header)
      if (headerCategoryFilter !== 'ALL') {
        params.categoryId = headerCategoryFilter;
      }

      // Amount range filter (from modal, uses absolute value)
      if (filters.minAmount !== '') {
        params.minAmount = parseFloat(filters.minAmount);
      }
      if (filters.maxAmount !== '') {
        params.maxAmount = parseFloat(filters.maxAmount);
      }

      const result = await api.transactions.findAll(params, token);

      // Handle backend response structure
      const transactionsData = (result as any).transactions || (result as any).data || [];
      const pagination = (result as any).pagination || {};

      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.total || 0);
    } catch (err: any) {
      setError(err.message || '加载失败');
      setTransactions([]);
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
      isLoadingTransactionsRef.current = false;
    }
  };

  const loadSummary = async () => {
    if (!token || !currentDate) return;

    // Prevent concurrent calls
    if (isLoadingSummaryRef.current) return;
    isLoadingSummaryRef.current = true;

    try {
      const [year, month] = currentDate.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${lastDay}`;

      const data = await api.transactions.dashboardSummary(token, startDate, endDate);
      setSummary({
        totalIncome: data.currentMonth.totalIncome,
        totalExpense: data.currentMonth.totalExpense,
        balance: data.currentMonth.balance,
      });
    } catch (err: any) {
      console.error('Failed to load summary:', err);
    } finally {
      isLoadingSummaryRef.current = false;
    }
  };

  // Initial load - run once when token is available
  useEffect(() => {
    if (!token) return;

    // Skip if already loaded
    if (hasLoadedRef.current) return;

    hasLoadedRef.current = true;
    // Initial load: fetch both transactions and summary
    loadTransactions();
    loadSummary();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load transactions when filters/pagination/sorting/date change
  useEffect(() => {
    if (!token || !hasLoadedRef.current) return;
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, currentPage, itemsPerPage, searchQuery, filters.type, filters.source, filters.minAmount, filters.maxAmount, sortBy, sortOrder, headerSourceFilter, headerCategoryFilter]);

  // Reload summary only when date changes
  useEffect(() => {
    if (!token || !hasLoadedRef.current) return;
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, token]);

  // Handle date changes
  const handleDateChange = useCallback((newDate: string) => {
    setCurrentDate(newDate);
    setCurrentPage(1);
  }, []);

  // Refresh data when transaction is added/updated/deleted
  useEffect(() => {
    if (onTransactionSuccess) {
      const handleRefresh = () => {
        loadTransactions();
        loadSummary();
      };
      (window as any).__refreshTransactions = handleRefresh;
    }
  }, [onTransactionSuccess]);

  const initiateDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId || !token) return;

    try {
      await api.transactions.delete(deletingId, token);
      setDeletingId(null);
      loadTransactions();
      loadSummary();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const initiateEdit = (transaction: Transaction) => {
    if (categories.length === 0) {
      loadCategories();
    }
    setEditingTransaction(transaction);
  };

  const saveEdit = async (updatedTransaction: Transaction) => {
    if (!token) return;

    try {
      await api.transactions.update(
        updatedTransaction.id,
        {
          type: updatedTransaction.type,
          amount: updatedTransaction.amount,
          categoryId: updatedTransaction.categoryId,
          date: updatedTransaction.transactionDate,
          description: updatedTransaction.description,
        },
        token
      );
      setEditingTransaction(null);
      loadTransactions();
      loadSummary();
    } catch (err: any) {
      alert(err.message || '更新失败');
    }
  };

  const handleApplyFilters = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setHeaderSourceFilter('ALL');
    setHeaderCategoryFilter('ALL');
    setCurrentPage(1);
  };

  const handleExport = async () => {
    if (!token) return;

    try {
      // Build filter params
      const params: any = {};

      if (currentDate) {
        const [year, month] = currentDate.split('-');
        params.startDate = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        params.endDate = `${year}-${month}-${lastDay}`;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (filters.type !== 'ALL') {
        params.type = filters.type;
      }

      const blob = await api.transactions.export(params, token);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `EasyBill_账单明细_${currentDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || '导出失败');
    }
  };

  // Generate Page Numbers
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const isFilterActive = filters.type !== 'ALL' || filters.source !== 'ALL' || filters.minAmount !== '' || filters.maxAmount !== '' || headerSourceFilter !== 'ALL' || headerCategoryFilter !== 'ALL';

  // Helper to format date for display (only year-month-day)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to format transaction for display
  const formatTransaction = (t: Transaction) => {
    // Use category from API response first, fallback to local categories
    const category = t.category || categories.find(c => c.id === t.categoryId);
    return {
      ...t,
      categoryName: category?.name || '未分类',
      categoryIcon: category?.icon || 'help',
      categoryColor: category?.colorClass || 'text-gray-600 bg-gray-50 border-gray-100',
    };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-6 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-text-main tracking-tight">{t('transactions.title')}</h2>
            <p className="text-xs md:text-sm text-text-sub mt-1">{t('transactions.subtitle')}</p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={handleExport}
              disabled={loading || transactions.length === 0}
              className="size-10 md:w-auto md:h-10 flex items-center justify-center gap-2 px-0 md:px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">file_download</span>
              <span className="hidden md:inline">{t('common.export')}</span>
            </button>
            <button
              onClick={onOpenEntryModal}
              className="size-10 md:w-auto md:h-10 flex items-center justify-center gap-2 px-0 md:px-5 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="hidden md:inline">{t('common.add')}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { label: t('common.totalExpense'), value: `¥${(summary.totalExpense || 0).toFixed(2)}`, color: 'danger', icon: 'account_balance' },
            { label: t('common.totalIncome'), value: `¥${(summary.totalIncome || 0).toFixed(2)}`, color: 'success', icon: 'payments' },
            { label: t('common.balance'), value: `¥${(summary.balance || 0).toFixed(2)}`, color: (summary.balance || 0) >= 0 ? 'success' : 'danger', icon: 'account_balance_wallet' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                  <span className={`material-symbols-outlined text-${stat.color} text-[20px]`}>{stat.icon}</span>
                </div>
                <div>
                  <p className="text-xs text-text-sub font-medium">{stat.label}</p>
                  <p className={`text-lg font-bold text-${stat.color} tracking-tight`}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Filters & Search */}
      <div className="px-4 md:px-8 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          {/* Month Picker */}
          <div className="flex-1 md:flex-none md:w-48">
            <input
              type="month"
              value={currentDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Search Bar */}
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-lg border border-slate-200 text-sm font-medium text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`h-11 px-5 rounded-lg border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isFilterActive
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <span className={`material-symbols-outlined text-[18px] ${isFilterActive ? 'filled' : ''}`}>filter_list</span>
            <span>{t('common.filter')}</span>
            {isFilterActive && <span className="size-2 rounded-full bg-primary animate-pulse"></span>}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Table - Always show header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  {/* Date - Sortable */}
                  <th
                    className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors"
                    onClick={() => {
                      if (sortBy === 'date') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('date');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>{t('common.date')}</span>
                      <span className={`material-symbols-outlined text-[14px] ${sortBy === 'date' ? 'text-primary' : 'text-slate-300'}`}>
                        {sortBy === 'date' ? (sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                  {/* Category - Filterable */}
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest relative">
                    <div
                      className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => {
                        setShowCategoryDropdown(!showCategoryDropdown);
                        setShowSourceDropdown(false);
                        if (categories.length === 0) loadCategories();
                      }}
                    >
                      <span>{t('common.category')}</span>
                      <span className={`material-symbols-outlined text-[14px] ${headerCategoryFilter !== 'ALL' ? 'text-primary' : 'text-slate-300'}`}>
                        filter_list
                      </span>
                    </div>
                    {showCategoryDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto min-w-[150px]">
                        <div
                          className={`px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer ${headerCategoryFilter === 'ALL' ? 'text-primary font-medium' : 'text-slate-600'}`}
                          onClick={() => { setHeaderCategoryFilter('ALL'); setShowCategoryDropdown(false); }}
                        >
                          全部分类
                        </div>
                        {categories.map(cat => (
                          <div
                            key={cat.id}
                            className={`px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer ${headerCategoryFilter === cat.id ? 'text-primary font-medium' : 'text-slate-600'}`}
                            onClick={() => { setHeaderCategoryFilter(cat.id); setShowCategoryDropdown(false); }}
                          >
                            {cat.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t('common.desc')}</th>
                  {/* Source - Filterable */}
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest relative">
                    <div
                      className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => {
                        setShowSourceDropdown(!showSourceDropdown);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <span>{t('common.source')}</span>
                      <span className={`material-symbols-outlined text-[14px] ${headerSourceFilter !== 'ALL' ? 'text-primary' : 'text-slate-300'}`}>
                        filter_list
                      </span>
                    </div>
                    {showSourceDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                        {['ALL', 'AI_EXTRACTED', 'MANUAL'].map(source => (
                          <div
                            key={source}
                            className={`px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer ${headerSourceFilter === source ? 'text-primary font-medium' : 'text-slate-600'}`}
                            onClick={() => { setHeaderSourceFilter(source as any); setShowSourceDropdown(false); }}
                          >
                            {source === 'ALL' ? '全部来源' : source === 'AI_EXTRACTED' ? 'AI 提取' : '手动录入'}
                          </div>
                        ))}
                      </div>
                    )}
                  </th>
                  {/* Amount - Sortable by absolute value */}
                  <th
                    className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:text-primary transition-colors"
                    title="按金额绝对值排序"
                    onClick={() => {
                      if (sortBy === 'amount') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('amount');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{t('common.amount')}</span>
                      <span className={`material-symbols-outlined text-[14px] ${sortBy === 'amount' ? 'text-primary' : 'text-slate-300'}`}>
                        {sortBy === 'amount' ? (sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      加载中...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-[48px] mb-2">receipt_long</span>
                        <p>暂无交易记录</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => {
                    const formatted = formatTransaction(transaction);
                    const isExpense = transaction.type === 'EXPENSE';
                    const isIncome = transaction.type === 'INCOME';

                    return (
                      <tr key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="text-sm font-medium text-text-main whitespace-nowrap">{formatDate(transaction.transactionDate)}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className={`size-9 rounded-lg ${formatted.categoryColor} flex items-center justify-center border`}>
                              <span className="material-symbols-outlined text-[18px]">{formatted.categoryIcon}</span>
                            </div>
                            <span className="text-sm font-semibold text-text-main">{formatted.categoryName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm font-medium text-text-main">{transaction.description || ''}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${transaction.source === 'AI_EXTRACTED'
                            ? 'bg-purple-50 text-purple-600 border border-purple-100'
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {transaction.source === 'AI_EXTRACTED' ? 'auto_awesome' : 'edit'}
                            </span>
                            {transaction.source === 'AI_EXTRACTED' ? 'AI 提取' : '手动录入'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`text-base font-bold ${isExpense ? 'text-danger' : isIncome ? 'text-success' : 'text-slate-600'
                            }`}>
                            {isExpense ? '-' : '+'} ¥{Math.abs(transaction.amount).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => initiateEdit(transaction)}
                              className="size-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                              title="编辑"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => initiateDelete(transaction.id)}
                              className="size-8 flex items-center justify-center rounded-lg border border-red-200 bg-white text-danger hover:bg-red-50 transition-colors"
                              title="删除"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Items per page */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-sub font-medium">{t('common.itemsPerPage')}:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-text-sub">
                共 {totalItems} 条
              </span>
            </div>

            {/* Page numbers */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="size-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              {getPageNumbers().map((page, idx) => (
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={`size-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${currentPage === page
                      ? 'bg-primary text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {page}
                  </button>
                )
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="size-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editingTransaction && (
          <EditTransactionModal
            transaction={editingTransaction}
            categories={categories}
            onClose={() => setEditingTransaction(null)}
            onSave={saveEdit}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <DeleteConfirmationModal
            onClose={() => setDeletingId(null)}
            onConfirm={confirmDelete}
          />
        )}

        {/* Filter Modal */}
        {isFilterModalOpen && (
          <FilterTransactionModal
            currentFilters={filters}
            onClose={() => setIsFilterModalOpen(false)}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        )}
      </div>
    </div>
  );
};

export default Transactions;
