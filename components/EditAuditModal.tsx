import React, { useState, useEffect } from 'react';
import { AiPendingItem } from '../types';

interface EditAuditModalProps {
  item: AiPendingItem;
  onClose: () => void;
  onSave: (updatedItem: AiPendingItem) => void;
}

type TabType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

const EditAuditModal: React.FC<EditAuditModalProps> = ({ item, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<TabType>(item.type);
  const [amount, setAmount] = useState(item.amount.toString());
  // Attempt to extract pure category name (remove ' - subcategory' if present for matching)
  const initialCategory = item.category.split(' - ')[0] || item.category;
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState(item.description);

  // Initialize date format
  useEffect(() => {
    // Convert "YYYY年MM月DD日" to "YYYY-MM-DD" for the input
    const match = item.date.match(/(\d{4})年(\d{2})月(\d{2})日/);
    if (match) {
      setDate(`${match[1]}-${match[2]}-${match[3]}`);
    } else {
      // If already in YYYY-MM-DD or other format, try to parse
      const d = new Date(item.date.replace(/年|月/g, '-').replace(/日/g, ''));
      if (!isNaN(d.getTime())) {
          setDate(d.toISOString().split('T')[0]);
      } else {
          setDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [item.date]);

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
    // Reformat date back to YYYY年MM月DD日
    let formattedDate = item.date;
    if (date) {
        const [y, m, d] = date.split('-');
        formattedDate = `${y}年${m}月${d}日`;
    }
    
    // Find icon based on category
    const catObj = categories[activeTab].find(c => c.name === selectedCategory) || categories[activeTab][0];
    
    // Determine color based on type
    let colorClass = '';
    if (activeTab === 'INCOME') {
         colorClass = 'bg-green-100 text-green-600';
    } else if (activeTab === 'TRANSFER') {
         colorClass = 'bg-cyan-100 text-cyan-600';
    } else {
         colorClass = 'bg-blue-100 text-blue-600';
    }

    // Construct updated item
    const updatedItem: AiPendingItem = {
        ...item,
        type: activeTab,
        amount: parseFloat(amount) || 0,
        category: selectedCategory, 
        categoryIcon: catObj.icon,
        categoryColor: colorClass, 
        date: formattedDate,
        description: description
    };

    onSave(updatedItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-text-main">编辑记录</h2>
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

export default EditAuditModal;