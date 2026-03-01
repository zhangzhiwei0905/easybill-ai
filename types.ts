import React from 'react';

// ── Category Types ─────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  icon: string;
  colorClass: string;
  type: 'INCOME' | 'EXPENSE';
  sortOrder: number;
  isSystem: boolean;
  createdAt: string;
}

// ── Transaction Types ─────────────────────────────────────
export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  description: string;
  transactionDate: string; // ISO date string
  source: 'AI_EXTRACTED' | 'MANUAL';
  aiItemId?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

// Frontend display format (for backward compatibility)
export interface TransactionDisplay {
  id: string;
  date: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  description: string;
  source: 'AI_EXTRACTED' | 'MANUAL';
  amount: number;
  type: 'EXPENSE' | 'INCOME';
}

// ── Pagination Types ─────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Transaction Summary Types ─────────────────────────────
export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryStats: CategoryStat[];
}

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  total: number;
  count: number;
}

// ── AI Pending Item Types ─────────────────────────────────
export interface AiPendingItem {
  id: string;
  rawText: string;
  date: string;
  rawDate: string; // ISO 8601 格式的原始日期，用于 API 调用
  category: string;
  categoryIcon: string;
  categoryColor: string;
  description: string;
  amount: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  parseError?: string; // AI 解析失败的错误信息
  type: 'EXPENSE' | 'INCOME';
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'NEEDS_MANUAL';
  categoryId?: string;
}

// API 返回的原始 AI Item 类型
export interface AiPendingItemApiResponse {
  id: string;
  userId: string;
  categoryId: string | null;
  rawText: string;
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  description: string;
  parsedDate: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  parseError?: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'NEEDS_MANUAL';
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    icon: string;
    colorClass: string;
    type: string;
  } | null;
}

// AI 统计数据类型
export interface AiStatistics {
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
  needsManual: number;
  dailyStats: Record<string, { count: number; amount: number }>;
  categoryStats: Record<string, { count: number; amount: number }>;
}

// ── Navigation Types ─────────────────────────────────────
export enum NavPage {
  DASHBOARD = 'dashboard',
  TRANSACTIONS = 'transactions',
  AI_AUDIT = 'ai_audit',
  REPORTS = 'reports',
  SETTINGS = 'settings'
}

// ── Context Types ─────────────────────────────────────────
export interface GlobalOutletContextType {
  onOpenEntryModal: () => void;
  aiItems: AiPendingItem[];
  setAiItems: React.Dispatch<React.SetStateAction<AiPendingItem[]>>;
  refreshAiItems: () => void;
  onTransactionSuccess?: () => void;
}