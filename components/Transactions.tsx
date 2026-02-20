import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { Transaction } from '../types';
import EditTransactionModal from './EditTransactionModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import FilterTransactionModal, { FilterCriteria } from './FilterTransactionModal';

const Transactions: React.FC = () => {
  const { onOpenEntryModal } = useOutletContext<{ onOpenEntryModal: () => void }>();
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState('2023-10');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const defaultFilters: FilterCriteria = {
    type: 'ALL',
    source: 'ALL',
    minAmount: '',
    maxAmount: ''
  };
  const [filters, setFilters] = useState<FilterCriteria>(defaultFilters);

  // Modal States
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1', date: '2023-10-24', category: '餐饮美食', categoryIcon: 'restaurant', categoryColor: 'text-orange-600 bg-orange-50 border-orange-100',
      description: '星巴克咖啡 (Starbucks)', subDescription: '午后休息', source: 'AI_EXTRACTED', amount: -35.00, type: 'EXPENSE'
    },
    {
      id: '2', date: '2023-10-23', category: '交通出行', categoryIcon: 'directions_car', categoryColor: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      description: '滴滴出行 (Didi Taxi)', subDescription: '加班打车回家', source: 'AI_EXTRACTED', amount: -42.50, type: 'EXPENSE'
    },
    {
      id: '3', date: '2023-10-20', category: '工资收入', categoryIcon: 'work', categoryColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      description: '十月工资发放', subDescription: '主营收入', source: 'MANUAL', amount: 15000.00, type: 'INCOME'
    },
    {
      id: '4', date: '2023-10-18', category: '网购日常', categoryIcon: 'shopping_bag', categoryColor: 'text-pink-600 bg-pink-50 border-pink-100',
      description: '京东商城 (JD.com)', subDescription: '家庭生活用品', source: 'AI_EXTRACTED', amount: -218.00, type: 'EXPENSE'
    },
    {
      id: '5', date: '2023-10-15', category: '房租水电', categoryIcon: 'home', categoryColor: 'text-purple-600 bg-purple-50 border-purple-100',
      description: '10月房租', subDescription: '通过支付宝转账', source: 'MANUAL', amount: -3500.00, type: 'EXPENSE'
    },
    {
      id: '6', date: '2023-10-10', category: '还款', categoryIcon: 'credit_card', categoryColor: 'text-cyan-600 bg-cyan-50 border-cyan-100',
      description: '信用卡还款', subDescription: '招商银行', source: 'MANUAL', amount: -2000.00, type: 'TRANSFER'
    },
  ]);

  // Derived filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Date Filter (Month)
      // Check if filter is active (not empty string) and if transaction date starts with the month string
      if (currentDate && !t.date.startsWith(currentDate)) {
        return false;
      }

      // 2. Search Query (Description, Category)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = t.description.toLowerCase().includes(query);
        const matchesSub = t.subDescription?.toLowerCase().includes(query);
        const matchesCat = t.category.toLowerCase().includes(query);
        if (!matchesDesc && !matchesSub && !matchesCat) return false;
      }

      // 3. Advanced Filters (Type, Source, Amount)
      if (filters.type !== 'ALL' && t.type !== filters.type) return false;
      if (filters.source !== 'ALL' && t.source !== filters.source) return false;

      const absAmount = Math.abs(t.amount);
      if (filters.minAmount && absAmount < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && absAmount > parseFloat(filters.maxAmount)) return false;

      return true;
    });
  }, [transactions, currentDate, searchQuery, filters]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [currentDate, searchQuery, filters]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

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

  // Check if any filter is active (to style the button)
  const isFilterActive = filters.type !== 'ALL' || filters.source !== 'ALL' || filters.minAmount !== '' || filters.maxAmount !== '';

  const initiateDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      setTransactions(prev => prev.filter(t => t.id !== deletingId));
      setDeletingId(null);
    }
  };

  const initiateEdit = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setEditingTransaction(transaction);
    }
  };

  const saveEdit = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    setEditingTransaction(null);
  };

  const handleApplyFilters = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const handleExport = () => {
    // Define CSV headers
    const headers = ['日期,分类,备注描述,记录来源,交易金额,收支类型'];
    
    // Map transactions to CSV rows
    const rows = filteredTransactions.map(t => {
      // Escape description to prevent CSV breakage with commas
      const desc = t.subDescription ? `${t.description} - ${t.subDescription}` : t.description;
      const cleanDesc = `"${desc.replace(/"/g, '""')}"`;
      
      const source = t.source === 'AI_EXTRACTED' ? 'AI 提取' : '手动录入';
      const type = t.type === 'INCOME' ? '收入' : t.type === 'EXPENSE' ? '支出' : '转账';
      
      // Amount
      const amount = t.amount.toFixed(2);
      
      return `${t.date},${t.category},${cleanDesc},${source},${amount},${type}`;
    });

    // Combine headers and rows
    const csvContent = "\ufeff" + [headers, ...rows].join('\n'); // Add BOM for Excel compatibility with UTF-8

    // Create a Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EasyBill_账单明细_${currentDate}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
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
              className="size-10 md:w-auto md:h-10 flex items-center justify-center gap-2 px-0 md:px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all active:bg-slate-100"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
           {[
             { label: t('common.totalExpense'), value: '¥42,850.00', color: 'danger', icon: 'account_balance' },
             { label: t('common.totalIncome'), value: '¥156,200.00', color: 'success', icon: 'payments' },
             { label: t('common.monthExpense'), value: '¥5,240.50', color: 'danger', icon: 'calendar_month' },
             { label: t('common.monthIncome'), value: '¥15,000.00', color: 'success', icon: 'savings' },
           ].map((stat, i) => (
             <div key={i} className="bg-slate-50/50 p-3 md:p-4 rounded-xl border border-slate-100 flex items-center gap-3 md:gap-4">
               <div className={`size-8 md:size-10 rounded-full bg-${stat.color === 'danger' ? 'red' : 'emerald'}-50 text-${stat.color === 'danger' ? 'red' : 'emerald'}-500 flex items-center justify-center shrink-0`}>
                 <span className="material-symbols-outlined text-[18px] md:text-[24px]">{stat.icon}</span>
               </div>
               <div className="min-w-0">
                 <p className="text-[10px] md:text-xs font-medium text-text-sub truncate">{stat.label}</p>
                 <p className="text-sm md:text-lg font-bold text-text-main truncate">{stat.value}</p>
               </div>
             </div>
           ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input 
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 text-sm transition-all outline-none" 
              placeholder={t('transactions.placeholder')}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            {/* Date Filter Input */}
            <div className="relative flex-1 md:flex-none h-11 rounded-xl bg-white border border-slate-200 text-sm font-medium text-text-sub flex items-center gap-2 px-3 hover:border-slate-300 transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 group">
              <span className="material-symbols-outlined text-[20px] text-slate-400">calendar_today</span>
              <input 
                type="month" 
                value={currentDate}
                className="bg-transparent border-none outline-none text-text-main text-sm font-medium w-full h-full cursor-pointer" 
                onChange={(e) => setCurrentDate(e.target.value)}
              />
              {currentDate && (
                <button 
                  onClick={() => setCurrentDate('')}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                  title={t('common.clearFilter')}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
            
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className={`flex-1 md:flex-none h-11 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                isFilterActive 
                  ? 'bg-primary/10 border-primary text-primary' 
                  : 'bg-white border-slate-200 text-text-sub hover:border-slate-300'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${isFilterActive ? 'filled' : ''}`}>filter_list</span>
              <span>{t('common.filter')}</span>
              {isFilterActive && <span className="size-2 rounded-full bg-primary animate-pulse"></span>}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t('common.date')}</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t('common.category')}</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t('common.desc')}</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t('common.source')}</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">{t('common.amount')}</th>
                  <th className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((t) => (
                    <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors group ${t.amount > 0 ? 'bg-emerald-50/20' : ''}`}>
                      <td className="py-4 px-6 text-sm text-slate-500">{t.date}</td>
                      <td className="py-4 px-6">
                        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border ${t.categoryColor}`}>
                          <span className="material-symbols-outlined text-[16px]">{t.categoryIcon}</span>
                          <span className="text-xs font-bold">{t.category}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-semibold text-text-main">{t.description}</div>
                        {t.subDescription && <div className="text-[11px] text-slate-400 mt-0.5">{t.subDescription}</div>}
                      </td>
                      <td className="py-4 px-6">
                        {t.source === 'AI_EXTRACTED' ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            <span className="material-symbols-outlined text-[14px] filled">auto_awesome</span>
                            <span className="text-[10px] font-bold uppercase">AI</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            <span className="material-symbols-outlined text-[14px]">edit_note</span>
                            <span className="text-[10px] font-bold uppercase">{t.source === 'MANUAL' ? 'Manual' : 'Manual'}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`text-sm font-bold ${t.amount > 0 ? 'text-success' : 'text-danger'}`}>
                          {t.amount > 0 ? '+' : '-'}¥{Math.abs(t.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => initiateEdit(t.id)} className="p-1.5 rounded-md text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                          <button onClick={() => initiateDelete(t.id)} className="p-1.5 rounded-md text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-4xl opacity-50">search_off</span>
                        <span className="text-sm">{t('common.noMatch')}</span>
                        {isFilterActive || currentDate ? (
                          <button onClick={() => { handleResetFilters(); setCurrentDate(''); }} className="text-primary text-xs font-bold mt-2 hover:underline">{t('common.clearFilter')}</button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div className="px-6 py-4 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between border-t border-slate-100 gap-4 md:gap-0">
            {/* Info and Page Size Selector */}
            <div className="flex items-center gap-4 text-xs font-medium text-text-sub w-full md:w-auto justify-between md:justify-start">
              <span>
                {t('transactions.showing', { start: filteredTransactions.length > 0 ? indexOfFirstItem + 1 : 0, end: Math.min(indexOfLastItem, filteredTransactions.length), total: filteredTransactions.length })}
              </span>
              <div className="flex items-center gap-2">
                <span>{t('common.itemsPerPage')}</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1 w-full md:w-auto justify-center md:justify-end">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || filteredTransactions.length === 0}
                className="size-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              
              {getPageNumbers().map((page, index) => (
                typeof page === 'number' ? (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(page)}
                    className={`size-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      currentPage === page
                        ? 'bg-primary text-white shadow-sm shadow-primary/20'
                        : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-text-main'
                    }`}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={index} className="size-8 flex items-center justify-center text-slate-400 text-xs">...</span>
                )
              ))}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || filteredTransactions.length === 0}
                className="size-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTransaction && (
        <EditTransactionModal 
          transaction={editingTransaction} 
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
  );
};

export default Transactions;