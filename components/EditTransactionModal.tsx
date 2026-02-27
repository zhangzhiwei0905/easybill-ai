import React, { useState, useEffect } from 'react';
import { Transaction, Category } from '../services/api';

interface EditTransactionModalProps {
  transaction: Transaction;
  categories: Category[];
  onClose: () => void;
  onSave: (updatedTransaction: Transaction) => void;
}

type TabType = 'EXPENSE' | 'INCOME';

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, categories, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<TabType>(transaction.type);
  const [amount, setAmount] = useState(Math.abs(transaction.amount).toString());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(transaction.categoryId);
  // Format date to YYYY-MM-DD for input[type="date"]
  const [date, setDate] = useState(() => {
    const d = new Date(transaction.transactionDate);
    return d.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState(transaction.description || '');

  // Filter categories by type
  const filteredCategories = categories.filter(cat => cat.type === activeTab);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Update selected category when tab changes
  useEffect(() => {
    const categoriesForType = categories.filter(cat => cat.type === activeTab);
    if (categoriesForType.length > 0) {
      // Try to keep the same category if it exists in the new type
      const existingCategory = categoriesForType.find(cat => cat.id === selectedCategoryId);
      if (!existingCategory) {
        setSelectedCategoryId(categoriesForType[0].id);
      }
    }
  }, [activeTab, categories]);

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('请输入有效金额');
      return;
    }

    if (!selectedCategoryId) {
      alert('请选择分类');
      return;
    }

    const updatedTransaction: Transaction = {
      ...transaction,
      type: activeTab,
      amount: parseFloat(amount),
      categoryId: selectedCategoryId,
      transactionDate: date,
      description: description || '',
    };

    onSave(updatedTransaction);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-text-main">编辑账单</h2>
          <div className="flex bg-background-light rounded-lg p-1 gap-1">
            <button
              onClick={() => setActiveTab('EXPENSE')}
              className={`px-4 py-1.5 text-xs font-bold rounded transition-all ${activeTab === 'EXPENSE' ? 'bg-white text-primary shadow-sm' : 'text-text-sub hover:bg-white/50'}`}
            >
              支出
            </button>
            <button
              onClick={() => setActiveTab('INCOME')}
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
            {filteredCategories.length === 0 ? (
              <div className="text-center text-slate-400 py-4">暂无分类</div>
            ) : (
              <div className="grid grid-cols-5 gap-3">
                {filteredCategories.map((cat) => (
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
                  className="bg-transparent border-none text-sm text-text-main focus:ring-0 w-full p-0 outline-none font-medium"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-main">备注</label>
              <div className="flex items-center bg-background-light rounded-lg h-10 px-3 border border-transparent focus-within:border-primary/50 focus-within:bg-white transition-all">
                <span className="material-symbols-outlined text-text-sub text-[20px] mr-2">edit_note</span>
                <input
                  className="bg-transparent border-none text-sm text-text-main focus:ring-0 w-full p-0 placeholder:text-gray-400 outline-none"
                  placeholder="写点什么..."
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 pt-2 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-background-light text-text-main font-bold text-base hover:bg-slate-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!amount || !selectedCategoryId}
            className="flex-[2] h-12 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary-hover transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存修改
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTransactionModal;
