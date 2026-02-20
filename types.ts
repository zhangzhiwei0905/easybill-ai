import React from 'react';

export interface Transaction {
  id: string;
  date: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  description: string;
  subDescription?: string;
  source: 'AI_EXTRACTED' | 'MANUAL';
  amount: number;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
}

export interface AiPendingItem {
  id: string;
  rawText: string;
  date: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  description: string;
  amount: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
}

export enum NavPage {
  DASHBOARD = 'dashboard',
  TRANSACTIONS = 'transactions',
  AI_AUDIT = 'ai_audit',
  REPORTS = 'reports',
  SETTINGS = 'settings'
}

export interface GlobalOutletContextType {
  onOpenEntryModal: () => void;
  aiItems: AiPendingItem[];
  setAiItems: React.Dispatch<React.SetStateAction<AiPendingItem[]>>;
  refreshAiItems: () => void;
}