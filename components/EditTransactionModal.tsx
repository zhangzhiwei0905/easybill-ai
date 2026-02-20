import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';

interface EditTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
  onSave: (updatedTransaction: Transaction) => void;
}

type TabType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<TabType>(transaction.type);
  const [amount, setAmount] = useState(Math.abs(transaction.amount).toString());
  const [selectedCategory, setSelectedCategory] = useState<string>(transaction.category);
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description);

  // Categories Data
  const categories: Record<TabType, { name: string; icon: string }[]> = {
    EXPENSE: [
      { name: '餐饮美食', icon: 'restaurant' },
      { name: '交通出行', icon: 'directions_bus' },
      { name: '网购日常', icon: 'shopping_bag' },
      { name: '休闲娱乐', icon: 'movie' },
      { name: '房租水电', icon: 'home' },
      { name: '生活服务', icon: 'water_drop' },
      { name: '医疗健康', icon: 'medical_services' },
      { name: '教育培训', icon: 'school' },
      { name: '人情往来', icon: 'redeem' },
      { name: '其他支出', icon: 'more_horiz' },
    ],
    INCOME: [
      { name: '工资收入', icon: 'attach_money' },
      { name: '兼职副业', icon: 'work_outline' },
      { name: '理财收益', icon: 'trending_up' },
      { name: '礼金收入', icon: 'card_giftcard' },
      { name: '其他收入', icon: 'more_horiz' },
    ],
    TRANSFER: [
      { name: '存入', icon: 'login' },
      { name: '取现', icon: 'logout' },
      { name: '还款', icon: 'credit_card' },
      { name: '借出', icon: 'volunteer_activism' },
      { name: '其他转账', icon: 'sync_alt' },
    ]
  };

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = () => {
    // Find icon based on category
    const catObj = categories[activeTab].find(c => c.name === selectedCategory) || 
                   categories[activeTab][0] || 
                   { name: selectedCategory, icon: 'category' };
    
    // Determine color based on type
    let colorClass = '';
    if (activeTab === 'INCOME') {
         colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-100';
    } else if (activeTab === 'TRANSFER') {
         colorClass = 'text-cyan-600 bg-cyan-50 border-cyan-100';
    } else {
         // Default Expense Colors
         if (selectedCategory.includes('餐饮')) colorClass = 'text-orange-600 bg-orange-50 border-orange-100';
         else if (selectedCategory.includes('交通')) colorClass = 'text-indigo-600 bg-indigo-50 border-indigo-100';
         else if (selectedCategory.includes('网购')) colorClass = 'text-pink-600 bg-pink-50 border-pink-100';
         else colorClass = 'text-slate-600 bg-slate-50 border-slate-100';
    }

    const finalAmount = parseFloat(amount);
    
    const updatedTransaction: Transaction = {
        ...transaction,
        type: activeTab,
        amount: activeTab === 'INCOME' ? Math.abs(finalAmount) : -Math.abs(finalAmount),
        category: selectedCategory,
        categoryIcon: catObj.icon,
        categoryColor: colorClass,
        date: date,
        description: description,
        source: 'MANUAL'
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
              className={`px-3 py-1 text-xs font-bold rounded transition-all ${activeTab === 'EXPENSE' ? 'bg-white text-primary shadow-sm' : 'text-text-sub hover:bg-white/50'}`}
            >
              支出
            </button>
            <button 
              onClick={() => setActiveTab('INCOME')}
              className={`px-3 py-1 text-xs font-bold rounded transition-all ${activeTab === 'INCOME' ? 'bg-white text-primary shadow-sm' : 'text-text-sub hover:bg-white/50'}`}
            >
              收入
            </button>
            <button 
              onClick={() => setActiveTab('TRANSFER')}
              className={`px-3 py-1 text-xs font-bold rounded transition-all ${activeTab === 'TRANSFER' ? 'bg-white text-primary shadow-sm' : 'text-text-sub hover:bg-white/50'}`}
            >
              转账
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
                style={{ width: amount ? `${amount.length * 0.7 + 1}em` : '4ch', maxWidth: '100%' }}
              />
            </div>
          </div>

          {/* Categories Grid */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-text-main">分类</label>
            <div className="grid grid-cols-5 gap-3">
              {categories[activeTab].map((cat) => (
                <button 
                  key={cat.name} 
                  onClick={() => setSelectedCategory(cat.name)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`size-12 rounded-full flex items-center justify-center transition-all duration-200 ${selectedCategory === cat.name ? 'bg-primary text-white shadow-md shadow-primary/30 scale-110' : 'bg-background-light text-text-sub group-hover:bg-slate-200 group-hover:text-text-main'}`}>
                    <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
                  </div>
                  <span className={`text-xs font-medium transition-colors ${selectedCategory === cat.name ? 'text-primary font-bold' : 'text-text-sub group-hover:text-text-main'}`}>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-text-main">日期</label>
                <div className="flex items-center bg-background-light rounded-lg h-10 px-3 border border-transparent focus-within:border-primary/50 focus-within:bg-white transition-all">
                  <span className="material-symbols-outlined text-text-sub text-[20px] mr-2">calendar_today</span>
                  <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent border-none text-sm text-text-main focus:ring-0 w-full p-0 outline-none font-medium"
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
          <button onClick={onClose} className="flex-1 h-12 rounded-xl bg-background-light text-text-main font-bold text-base hover:bg-slate-200 transition-colors">取消</button>
          <button onClick={handleSave} className="flex-[2] h-12 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary-hover transition-colors shadow-lg shadow-blue-200">保存修改</button>
        </div>
      </div>
    </div>
  );
};

export default EditTransactionModal;