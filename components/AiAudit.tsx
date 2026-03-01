import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { api } from '../services/api';
import { AiPendingItem, GlobalOutletContextType } from '../types';
import EditAuditModal from './EditAuditModal';
import ConfirmActionModal from './ConfirmActionModal';
import ConfirmRecordModal from './ConfirmRecordModal';

const AiAudit: React.FC = () => {
  const { aiItems, setAiItems, refreshAiItems } = useOutletContext<GlobalOutletContextType>();
  const { t } = useLanguage();
  const { token } = useAuth();
  const [editingItem, setEditingItem] = useState<AiPendingItem | null>(null);
  const [confirmingItem, setConfirmingItem] = useState<AiPendingItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<AiPendingItem | null>(null);
  const [isConfirmAllModalOpen, setIsConfirmAllModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('已成功记入账本');
  const [isConfirming, setIsConfirming] = useState(false);

  // 进入页面时刷新数据，获取最新的待审核记录
  useEffect(() => {
    refreshAiItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      refreshAiItems();
    } finally {
      // Add a small delay for UX
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleConfirmAllClick = () => {
    if (aiItems.length === 0) return;
    setIsConfirmAllModalOpen(true);
  };

  const handleConfirmAllAction = async () => {
    if (!token) return;

    // 只确认信息完整的记录（分类、金额、日期完整）
    const completeItems = aiItems.filter(item =>
      item.categoryId && item.amount > 0 && item.date
    );

    if (completeItems.length === 0) {
      setToastMessage('没有信息完整的记录可确认');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setIsConfirmAllModalOpen(false);
      return;
    }

    setIsConfirming(true);
    try {
      // 调用批量确认接口
      const result = await api.aiItems.confirmBatch(
        completeItems.map(item => ({
          id: item.id,
          type: item.type,
          amount: item.amount,
          description: item.description,
          date: item.rawDate, // 使用 ISO 8601 格式日期
          categoryId: item.categoryId!,
        })),
        token
      );

      // 刷新列表
      refreshAiItems();

      // 根据结果显示不同的提示
      if (result.failedCount === 0) {
        setToastMessage(`已成功入账 ${result.successCount} 条记录`);
      } else if (result.successCount === 0) {
        setToastMessage(`入账失败 ${result.failedCount} 条，请重试`);
      } else {
        setToastMessage(`成功入账 ${result.successCount} 条，失败 ${result.failedCount} 条`);
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Failed to confirm all items:', error);
      setToastMessage('确认失败，请重试');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsConfirming(false);
      setIsConfirmAllModalOpen(false);
    }
  };

  const handleConfirmItemClick = (item: AiPendingItem) => {
    setConfirmingItem(item);
  };

  const handleRealConfirm = async () => {
    if (!confirmingItem || !token || !confirmingItem.categoryId) {
      setToastMessage('请先选择分类');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setIsConfirming(true);
    try {
      await api.aiItems.confirm(
        confirmingItem.id,
        {
          type: confirmingItem.type,
          amount: confirmingItem.amount,
          description: confirmingItem.description,
          date: confirmingItem.rawDate, // 使用 ISO 8601 格式日期
          categoryId: confirmingItem.categoryId,
        },
        token
      );

      // 从列表中移除已确认的项
      setAiItems(prev => prev.filter(item => item.id !== confirmingItem.id));
      setConfirmingItem(null);
      setToastMessage('已成功记入账本');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Failed to confirm AI item:', error);
      setToastMessage('确认失败，请重试');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleEditItem = (item: AiPendingItem) => {
    setEditingItem(item);
  };

  const handleDeleteClick = (item: AiPendingItem) => {
    setDeletingItem(item);
  };

  const handleRealDelete = async () => {
    if (!deletingItem || !token) return;

    setIsConfirming(true);
    try {
      await api.aiItems.remove(deletingItem.id, token);

      // 从列表中移除已删除的项
      setAiItems(prev => prev.filter(item => item.id !== deletingItem.id));
      setDeletingItem(null);
      setToastMessage('已删除该记录');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Failed to delete AI item:', error);
      setToastMessage('删除失败，请重试');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSaveModal = (updatedItem: AiPendingItem) => {
    setAiItems(prev => prev.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    ));
    setEditingItem(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-background-light overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 md:px-10 py-6 md:py-8 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">{t('audit.title')}</h1>
              <span className="px-2 py-1 bg-blue-100 text-primary text-xs font-bold rounded uppercase tracking-wider">DeepSeek Powered</span>
            </div>
            <p className="text-text-sub text-sm md:text-base">
              {t('audit.subtitle', { count: aiItems.length })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-text-main font-bold py-2.5 px-4 md:px-5 rounded-lg text-xs md:text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait"
            >
              <span className={`material-symbols-outlined text-lg ${isRefreshing ? 'animate-spin' : ''}`}>refresh</span>
              <span className="hidden md:inline">{isRefreshing ? t('common.refreshing') : t('common.refresh')}</span>
            </button>
            <button 
              onClick={handleConfirmAllClick}
              disabled={aiItems.length === 0 || isRefreshing}
              className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-4 md:px-5 rounded-lg text-xs md:text-sm flex items-center gap-2 transition-colors shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span className="hidden md:inline">{t('common.confirmAll')}</span>
              <span className="md:hidden">Confirm All</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-4 pb-20 md:pb-0">
          {aiItems.length > 0 ? (
            aiItems.map((item) => (
              <div key={item.id} className={`bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-transparent overflow-hidden group transition-all duration-200 hover:border-blue-200 ${item.confidence === 'LOW' ? 'hover:border-yellow-200' : ''}`}>
                <div className="flex flex-col lg:flex-row">
                  
                  {/* Raw SMS (Left) */}
                  <div className="lg:w-1/3 bg-slate-50 p-4 md:p-5 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-text-sub text-lg">sms</span>
                      <span className="text-xs font-bold text-text-sub uppercase tracking-wide">{t('audit.rawSms')}</span>
                    </div>
                    <div className={`relative pl-3 border-l-2 ${item.confidence === 'LOW' ? 'border-yellow-400' : 'border-primary/30'}`}>
                      <p className="text-xs md:text-sm text-slate-600 leading-relaxed italic line-clamp-3 md:line-clamp-none">"{item.rawText}"</p>
                    </div>
                  </div>

                  {/* Extracted Data (Right) */}
                  <div className="lg:w-2/3 p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-2 gap-x-4 md:gap-x-8 gap-y-4 w-full">
                      
                      {/* Date */}
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-text-sub">{t('common.date')}</span>
                        <div className="font-medium text-text-main text-sm md:text-base">{item.date}</div>
                      </div>

                      {/* Category */}
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-text-sub">{t('common.category')}</span>
                        <div className="flex items-center gap-2">
                          <div className={`size-6 rounded-full flex items-center justify-center ${item.categoryColor} shrink-0`}>
                            <span className="material-symbols-outlined text-sm">{item.categoryIcon}</span>
                          </div>
                          <span className="font-medium text-text-main text-sm md:text-base truncate">{item.category}</span>
                          {item.confidence === 'HIGH' ? (
                            <span className="hidden md:inline-flex ml-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">{t('audit.highConfidence')}</span>
                          ) : (
                            <span className="hidden md:inline-flex ml-1 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">{t('audit.needConfirm')}</span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="flex flex-col gap-1 col-span-2">
                        <span className="text-xs text-text-sub">{t('common.desc')}</span>
                        <div
                          className="flex items-center gap-2 group/edit cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); handleEditItem(item); }}
                        >
                          <span className={`font-medium text-text-main text-sm md:text-base border-b border-transparent transition-colors hover:border-slate-300 ${item.confidence === 'LOW' ? 'border-dashed border-slate-400' : ''}`}>
                            {item.description}
                          </span>
                          <span className="material-symbols-outlined text-gray-300 text-sm opacity-0 group-hover/edit:opacity-100 transition-opacity">edit</span>
                        </div>
                        {/* 显示解析错误信息 */}
                        {item.parseError && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            <span>{item.parseError}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions & Amount */}
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-4 w-full md:w-auto justify-between md:justify-center border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0">
                      <div className="text-right">
                        <span className={`block text-xl md:text-2xl font-bold tabular-nums tracking-tight ${item.type === 'INCOME' ? 'text-success' : 'text-danger'}`}>
                          {item.type === 'INCOME' ? '+' : '-'}¥ {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        {item.confidence !== 'HIGH' && (
                          <div className="text-xs text-warning mt-1 font-medium text-right">{t('audit.checkAmount')}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditItem(item); }}
                          className="p-2 text-text-sub hover:text-text-main hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="编辑"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                          className="p-2 text-text-sub hover:text-danger hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors cursor-pointer"
                          title="删除"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleConfirmItemClick(item); }}
                          className="bg-primary hover:bg-primary-hover active:bg-blue-700 text-white text-xs md:text-sm font-bold py-2 px-4 rounded-lg shadow-sm shadow-blue-200 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {t('common.confirm')}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="flex flex-col items-center justify-center py-20 opacity-50 animate-in fade-in duration-300">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">check_circle</span>
                <p className="text-lg font-medium text-slate-500">{t('audit.allConfirmed')}</p>
                <p className="text-xs text-slate-400 mt-2">{t('audit.refreshHint')}</p>
             </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditAuditModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
          onSave={handleSaveModal} 
        />
      )}

      {/* Confirm Record Modal */}
      {confirmingItem && (
        <ConfirmRecordModal 
          item={confirmingItem} 
          onClose={() => setConfirmingItem(null)} 
          onConfirm={handleRealConfirm} 
        />
      )}

      {/* Confirm All Modal */}
      <ConfirmActionModal
        isOpen={isConfirmAllModalOpen}
        onClose={() => setIsConfirmAllModalOpen(false)}
        onConfirm={handleConfirmAllAction}
        title={t('audit.confirmAllTitle')}
        message={t('audit.confirmAllMsg', { count: aiItems.length })}
        confirmText={t('common.confirmAll')}
        confirmButtonClass="bg-primary text-white hover:bg-primary-hover shadow-blue-200"
        icon="check_circle"
        iconColorClass="text-primary"
        iconBgClass="bg-blue-50"
      />

      {/* Delete Confirm Modal */}
      <ConfirmActionModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleRealDelete}
        title={t('audit.deleteTitle')}
        message={t('audit.deleteMsg')}
        confirmText={t('common.delete')}
        confirmButtonClass="bg-danger text-white hover:bg-red-600"
        icon="delete"
        iconColorClass="text-danger"
        iconBgClass="bg-red-50"
      />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] bg-[#111418] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <span className="material-symbols-outlined text-success">check_circle</span>
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AiAudit;