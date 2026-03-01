import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { api, Category } from '../services/api';
import { AiPendingItem } from '../types';

interface EditAuditModalProps {
  item: AiPendingItem;
  onClose: () => void;
  onSave: (updatedItem: AiPendingItem) => void;
}

type TabType = 'EXPENSE' | 'INCOME';

const EditAuditModal: React.FC<EditAuditModalProps> = ({ item, onClose, onSave }) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(item.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
  const [amount, setAmount] = useState(item.amount.toString());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(item.categoryId || '');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState(item.description);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Initialize date format
  useEffect(() => {
    // 直接使用 rawDate（ISO 8601 格式）
    if (item.rawDate) {
      setDate(item.rawDate);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [item.rawDate]);

  // Load categories on mount and when tab changes
  useEffect(() => {
    if (!token || isLoadingCategories) return;

    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const data = await api.categories.findAll(token, activeTab);

        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.error('Categories data is not an array:', data);
          setCategories([]);
          return;
        }

        setCategories(data);

        // If we have categoryId from item and it matches current tab type, keep it
        // Otherwise auto-select first category
        if (item.categoryId && data.some(c => c.id === item.categoryId)) {
          // Category already set from props
        } else if (data.length > 0) {
          setSelectedCategoryId(data[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load categories:', err);
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, [token, activeTab]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = async () => {
    if (!token) {
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    if (!selectedCategoryId) {
      return;
    }

    setLoading(true);

    try {
      // Call API to update the AI item
      await api.aiItems.update(
        item.id,
        {
          type: activeTab,
          amount: parseFloat(amount),
          categoryId: selectedCategoryId,
          date: date,
          description: description || undefined,
        },
        token
      );

      // Get the selected category for local update
      const selectedCategory = categories.find(c => c.id === selectedCategoryId);

      // Reformat date back to YYYY年MM月DD日 for local state
      let formattedDate = item.date;
      if (date) {
          const [y, m, d] = date.split('-');
          formattedDate = `${y}年${m}月${d}日`;
      }

      // Construct updated item for local state update
      const updatedItem: AiPendingItem = {
          ...item,
          type: activeTab,
          amount: parseFloat(amount) || 0,
          category: selectedCategory?.name || item.category,
          categoryId: selectedCategoryId,
          categoryIcon: selectedCategory?.icon || item.categoryIcon,
          categoryColor: selectedCategory?.colorClass || item.categoryColor,
          date: formattedDate,
          rawDate: date, // 更新 rawDate
          description: description
      };

      // Show success toast
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onSave(updatedItem);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to save:', err);
      alert(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedCategoryId(''); // Reset category selection
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-text-main">编辑记录</h2>
          <div className="flex bg-background-light rounded-lg p-1 gap-1">
            <button
              onClick={() => handleTabChange('EXPENSE')}
              className={`px-4 py-1.5 text-xs font-bold rounded transition-all ${activeTab === 'EXPENSE' ? 'bg-white text-primary shadow-sm' : 'text-text-sub hover:bg-white/50'}`}
            >
              支出
            </button>
            <button
              onClick={() => handleTabChange('INCOME')}
              className={`px-4 py-1.5 text-xs font-bold rounded transition-all ${activeTab === 'INCOME' ? 'bg-white text-primary shadow-sm' : 'text-text-sub hover:bg-white/50'}`}
            >
              收入
            </button>
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <div className="p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">

          {/* Amount Input */}
          <div className="flex flex-col items-center justify-center py-2">
            <label className="text-sm font-medium text-text-sub mb-2">金额</label>
            <div className="relative w-full flex justify-center items-center">
              <span className={`text-4xl font-bold text-text-main mr-1 transition-opacity ${!amount ? 'opacity-30' : ''}`}>¥</span>
              <input
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-center border-none p-0 text-5xl font-extrabold text-text-main focus:ring-0 placeholder:text-gray-200 bg-transparent caret-primary outline-none min-w-[1ch]"
                placeholder="0.00"
                type="number"
                step="0.01"
                style={{ width: amount ? `${amount.length * 0.7 + 1}em` : '4ch', maxWidth: '100%' }}
              />
            </div>
          </div>

          {/* Categories Grid */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-text-main">分类</label>
            {!Array.isArray(categories) || categories.length === 0 ? (
              <div className="text-center text-slate-400 py-4">加载中...</div>
            ) : (
              <div className="grid grid-cols-5 gap-3">
                {Array.isArray(categories) && categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`size-14 rounded-2xl flex items-center justify-center transition-all ${
                      selectedCategoryId === cat.id
                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                        : 'bg-background-light text-text-sub group-hover:bg-slate-200'
                    }`}>
                      <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
                    </div>
                    <span className={`text-xs font-medium transition-colors ${
                      selectedCategoryId === cat.id ? 'text-primary font-bold' : 'text-text-sub'
                    }`}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date & Description */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-main">日期</label>
              <div className="flex items-center bg-background-light rounded-lg h-10 px-3 border border-transparent focus-within:border-primary/50 focus-within:bg-white transition-all">
                <span className="material-symbols-outlined text-text-sub text-[20px] mr-2">calendar_today</span>
                <input
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent border-none text-sm text-text-main focus:ring-0 w-full p-0 outline-none font-medium"
                  type="date"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-main">备注</label>
              <div className="flex items-center bg-background-light rounded-lg h-10 px-3 border border-transparent focus-within:border-primary/50 focus-within:bg-white transition-all">
                <span className="material-symbols-outlined text-text-sub text-[20px] mr-2">edit_note</span>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-transparent border-none text-sm text-text-main focus:ring-0 w-full p-0 placeholder:text-gray-400 outline-none"
                  placeholder="写点什么..."
                  type="text"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 pt-2 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-12 rounded-xl bg-background-light text-text-main font-bold text-base hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !amount || !selectedCategoryId}
            className="flex-[2] h-12 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary-hover transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] bg-[#111418] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <span className="material-symbols-outlined text-success">check_circle</span>
          <span className="font-bold text-sm">已保存修改</span>
        </div>
      )}
    </div>
  );
};

export default EditAuditModal;
