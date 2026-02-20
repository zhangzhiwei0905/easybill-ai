import React, { useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { AiPendingItem, GlobalOutletContextType } from '../types';
import EditAuditModal from './EditAuditModal';
import ConfirmRecordModal from './ConfirmRecordModal';

interface DashboardProps {
  onOpenEntryModal: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onOpenEntryModal }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { aiItems, setAiItems } = useOutletContext<GlobalOutletContextType>();
  const [editingAiItem, setEditingAiItem] = useState<AiPendingItem | null>(null);
  const [confirmingAiItem, setConfirmingAiItem] = useState<AiPendingItem | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Mock Data for Charts
  const trendData = [
    { day: '1', amount: 1200 }, { day: '5', amount: 3400 },
    { day: '10', amount: 2800 }, { day: '15', amount: 1500 },
    { day: '20', amount: 5600 }, { day: '25', amount: 2300 },
    { day: '30', amount: 4100 },
  ];

  const categoryData = [
    { name: '餐饮美食', value: 35, color: '#137fec' },
    { name: '交通出行', value: 25, color: '#3b82f6' },
    { name: '网购日常', value: 20, color: '#60a5fa' },
    { name: '其他支出', value: 20, color: '#93c5fd' },
  ];

  const handleConfirmAiItem = (id: string) => {
    const item = aiItems.find(i => i.id === id);
    if (item) {
      setConfirmingAiItem(item);
    }
  };

  const handleRealConfirm = () => {
    if (confirmingAiItem) {
      setAiItems(prev => prev.filter(item => item.id !== confirmingAiItem.id));
      setConfirmingAiItem(null);
      
      // Show Success Toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleEditAiItem = (item: AiPendingItem) => {
    setEditingAiItem(item);
  };

  const handleSaveAiItem = (updatedItem: AiPendingItem) => {
    setAiItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    setEditingAiItem(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth h-full bg-background-light">
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 h-full max-w-7xl mx-auto pb-4">
        
        {/* Left Main Content */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          
          {/* Header */}
          <div className="flex flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-text-main">{t('common.welcome')}, {user?.name}</h2>
              <p className="text-xs md:text-sm text-text-sub mt-1">{t('common.overview')}</p>
            </div>
            <button 
              onClick={onOpenEntryModal}
              className="flex items-center gap-2 h-10 px-4 md:px-5 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="hidden md:inline">{t('common.quickAdd')}</span>
              <span className="md:hidden">Add</span>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <SummaryCard title={t('common.totalExpense')} amount="¥482,930" icon="outbox" color="text-danger" bg="bg-red-50" />
            <SummaryCard title={t('common.totalIncome')} amount="¥607,430" icon="inbox" color="text-success" bg="bg-emerald-50" />
            <SummaryCard title={t('common.monthExpense')} amount="¥8,340" icon="calendar_month" color="text-orange-500" bg="bg-orange-50" />
            <SummaryCard title={t('common.monthIncome')} amount="¥15,200" icon="payments" color="text-primary" bg="bg-blue-50" />
          </div>

          {/* Trend Chart */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-text-main">{t('common.trend')}</h3>
              <select className="bg-transparent text-sm font-medium text-text-sub border-none focus:ring-0 cursor-pointer hover:text-primary outline-none">
                <option>This Month</option>
                <option>Last Month</option>
                <option>3 Months</option>
              </select>
            </div>
            <div className="h-56 md:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#137fec" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#137fec" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#137fec', fontWeight: 'bold' }}
                    formatter={(value: number) => [`¥${value}`, t('common.expense')]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#137fec" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                  />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    dy={10}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Chart */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="font-bold text-lg text-text-main mb-6">{t('common.categoryDist')}</h3>
            <div className="flex flex-col md:flex-row items-center justify-around gap-8">
              <div className="w-48 h-48 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-text-sub uppercase tracking-wider font-medium">{t('common.totalExpense')}</span>
                  <span className="text-xl font-bold text-text-main">¥8.3k</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full max-w-sm">
                {categoryData.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-sm text-text-sub">{cat.name}</span>
                    <span className="text-sm font-bold ml-auto">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar - AI Insights */}
        <aside className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h3 className="font-bold text-lg text-text-main">{t('common.aiInsight')}</h3>
              </div>
              <span className="bg-primary/10 text-primary text-[11px] px-2 py-1 rounded font-bold">{aiItems.length} {t('common.pendingConfirm')}</span>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              {aiItems.length > 0 ? (
                aiItems.map(item => (
                  <AiPendingCard 
                    key={item.id}
                    item={item}
                    onConfirm={() => handleConfirmAiItem(item.id)}
                    onEdit={() => handleEditAiItem(item)}
                    t={t}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-text-sub opacity-50">
                  <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                  <p className="text-sm">All Confirmed</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <button 
                onClick={() => navigate('/ai-audit')}
                className="text-xs text-text-sub hover:text-primary font-medium flex items-center justify-center gap-1 w-full transition-colors p-2"
              >
                {t('common.checkAll')}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </aside>

      </div>

      {/* Edit Modal for Dashboard AI Items */}
      {editingAiItem && (
        <EditAuditModal 
          item={editingAiItem} 
          onClose={() => setEditingAiItem(null)} 
          onSave={handleSaveAiItem} 
        />
      )}

      {/* Confirm Record Modal */}
      {confirmingAiItem && (
        <ConfirmRecordModal 
          item={confirmingAiItem} 
          onClose={() => setConfirmingAiItem(null)} 
          onConfirm={handleRealConfirm} 
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] bg-[#111418] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <span className="material-symbols-outlined text-success">check_circle</span>
          <span className="font-bold text-sm">已成功记入账本</span>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, amount, icon, color, bg }: any) => (
  <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-3 md:mb-4">
      <div className={`p-2 ${bg} rounded-lg ${color}`}>
        <span className="material-symbols-outlined text-[20px] md:text-[24px]">{icon}</span>
      </div>
    </div>
    <div>
      <p className="text-text-sub text-[10px] md:text-xs font-medium mb-1">{title}</p>
      <h3 className="text-lg md:text-xl font-extrabold text-text-main tracking-tight truncate" title={amount}>{amount}</h3>
    </div>
  </div>
);

const AiPendingCard = ({ item, onConfirm, onEdit, t }: { item: AiPendingItem, onConfirm: () => void, onEdit: () => void, t: any }) => (
  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors group">
    <div className="flex items-start justify-between mb-3 gap-2">
      <div className="flex items-center gap-2 overflow-hidden">
        <div className={`w-8 h-8 rounded-full ${item.categoryColor} flex items-center justify-center shrink-0`}>
          <span className="material-symbols-outlined text-sm">{item.categoryIcon}</span>
        </div>
        <span className="font-bold text-text-main text-sm truncate">{item.category}</span>
      </div>
      <span className="text-sm font-bold text-text-main whitespace-nowrap">
         {item.type === 'INCOME' ? '+' : '-'}¥{item.amount.toFixed(2)}
      </span>
    </div>
    <div className="p-3 bg-white rounded-lg mb-3 border border-dashed border-slate-200">
      <p className="text-xs text-text-sub leading-relaxed line-clamp-2">
        <span className="font-bold text-primary">{t('common.aiParsing')}:</span> 
        <span dangerouslySetInnerHTML={{ __html: ` "${item.rawText}"` }} />
      </p>
    </div>
    <div className="flex gap-2 opacity-100 transition-opacity">
      <button 
        onClick={(e) => { e.stopPropagation(); onConfirm(); }}
        className="flex-1 bg-primary hover:bg-primary-hover active:bg-primary-hover text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-sm"
      >
        {t('common.confirmRecord')}
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="px-3 py-2 text-text-sub hover:text-text-main bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center cursor-pointer active:bg-slate-300"
      >
        <span className="material-symbols-outlined text-sm">edit</span>
      </button>
    </div>
  </div>
);

export default Dashboard;