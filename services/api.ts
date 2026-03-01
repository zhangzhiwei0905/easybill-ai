// API Service Layer
// Dev: /api (proxied by Vite to localhost:3000)
// Production: VITE_API_URL (e.g. https://your-backend.railway.app/api)
const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';


async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    token?: string | null,
): Promise<T> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();

    if (!res.ok || json.code >= 400) {
        throw new Error(json.message || '请求失败');
    }

    // Handle double-wrapped response (backend returns {code, data: {code, data}})
    // Check if json.data is also a wrapped response
    if (json.data && typeof json.data === 'object' && 'code' in json.data && 'data' in json.data) {
        console.warn('Double-wrapped API response detected, unwrapping...');
        return json.data.data as T;
    }

    return json.data as T;
}

// ── Auth ─────────────────────────────────────────────────

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
    isPro?: boolean;
    webhookKey?: string | null;
}

export interface AuthResponse {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
}

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
    transactionDate: string;
    source: 'AI_EXTRACTED' | 'MANUAL';
    aiItemId?: string;
    createdAt: string;
    updatedAt: string;
    category?: Category;
}

export interface PaginatedTransactions {
    data: Transaction[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface TransactionSummary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    categoryStats: {
        categoryId: string;
        categoryName: string;
        total: number;
        count: number;
    }[];
}

export interface DashboardSummary {
    allTime: {
        totalIncome: number;
        totalExpense: number;
        balance: number;
    };
    currentMonth: {
        totalIncome: number;
        totalExpense: number;
        balance: number;
        transactionCount: number;
        categoryStats: {
            [categoryName: string]: {
                amount: number;
                count: number;
            };
        };
        trendData: {
            date: string;
            amount: number;
        }[];
    };
}

export interface CreateTransactionDto {
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    categoryId: string;
    date: string;
    description?: string;
}

export interface UpdateTransactionDto {
    type?: 'INCOME' | 'EXPENSE';
    amount?: number;
    categoryId?: string;
    date?: string;
    description?: string;
}

export interface FilterTransactionParams {
    type?: 'INCOME' | 'EXPENSE';
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    source?: 'AI_EXTRACTED' | 'MANUAL';
    sortBy?: 'date' | 'amount' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    minAmount?: number;
    maxAmount?: number;
}

export const api = {
    auth: {
        sendCode: (email: string, purpose: 'REGISTER' | 'RESET_PASSWORD') =>
            request<{ message: string; code?: string }>('POST', '/auth/send-code', { email, purpose }),

        register: (data: { email: string; password: string; name: string; code: string }) =>
            request<AuthResponse>('POST', '/auth/register', data),

        login: (data: { email: string; password: string }) =>
            request<AuthResponse>('POST', '/auth/login', data),

        resetPassword: (data: { email: string; code: string; newPassword: string }) =>
            request<{ message: string }>('POST', '/auth/reset-password', data),

        refresh: (refreshToken: string) =>
            request<{ accessToken: string; refreshToken: string }>('POST', '/auth/refresh', { refreshToken }),

        me: (token: string) =>
            request<AuthUser>('GET', '/auth/me', undefined, token),

        logout: (token: string) =>
            request<{ message: string }>('POST', '/auth/logout', undefined, token),

        getWebhookKey: (token: string) =>
            request<{ webhookKey: string | null }>('GET', '/auth/webhook-key', undefined, token),

        regenerateWebhookKey: (token: string) =>
            request<{ webhookKey: string }>('POST', '/auth/webhook-key/regenerate', undefined, token),
    },

    users: {
        getProfile: (token: string) =>
            request<AuthUser>('GET', '/users/profile', undefined, token),

        updateProfile: (data: { name?: string; avatarUrl?: string }, token: string) =>
            request<AuthUser>('PUT', '/users/profile', data, token),

        getPreferences: (token: string) =>
            request<{ currency: string; language: string; theme: string }>('GET', '/users/preferences', undefined, token),

        updatePreferences: (data: { currency?: string; language?: string; theme?: string; autoConfirmThreshold?: string }, token: string) =>
            request<{ currency: string; language: string; theme: string; autoConfirmThreshold: string }>('PUT', '/users/preferences', data, token),

        changePassword: (data: { oldPassword: string; newPassword: string }, token: string) =>
            request<{ message: string }>('PATCH', '/users/password', data, token),
    },

    categories: {
        findAll: (token: string, type?: 'INCOME' | 'EXPENSE' | 'TRANSFER') => {
            const query = type ? `?type=${type}` : '';
            return request<Category[]>('GET', `/categories${query}`, undefined, token);
        },
    },

    transactions: {
        create: (data: CreateTransactionDto, token: string) =>
            request<Transaction>('POST', '/transactions', data, token),

        findAll: (params: FilterTransactionParams, token: string) => {
            const query = new URLSearchParams();
            if (params.type) query.append('type', params.type);
            if (params.categoryId) query.append('categoryId', params.categoryId);
            if (params.startDate) query.append('startDate', params.startDate);
            if (params.endDate) query.append('endDate', params.endDate);
            if (params.search) query.append('search', params.search);
            if (params.page) query.append('page', params.page.toString());
            if (params.pageSize) query.append('pageSize', params.pageSize.toString());
            if (params.source) query.append('source', params.source);
            if (params.sortBy) query.append('sortBy', params.sortBy);
            if (params.sortOrder) query.append('sortOrder', params.sortOrder);
            if (params.minAmount !== undefined) query.append('minAmount', params.minAmount.toString());
            if (params.maxAmount !== undefined) query.append('maxAmount', params.maxAmount.toString());

            const queryString = query.toString();
            return request<PaginatedTransactions>('GET', `/transactions${queryString ? '?' + queryString : ''}`, undefined, token);
        },

        findOne: (id: string, token: string) =>
            request<Transaction>('GET', `/transactions/${id}`, undefined, token),

        update: (id: string, data: UpdateTransactionDto, token: string) =>
            request<Transaction>('PATCH', `/transactions/${id}`, data, token),

        delete: (id: string, token: string) =>
            request<{ message: string }>('DELETE', `/transactions/${id}`, undefined, token),

        export: async (params: FilterTransactionParams, token: string): Promise<Blob> => {
            const query = new URLSearchParams();
            if (params.type) query.append('type', params.type);
            if (params.categoryId) query.append('categoryId', params.categoryId);
            if (params.startDate) query.append('startDate', params.startDate);
            if (params.endDate) query.append('endDate', params.endDate);
            if (params.search) query.append('search', params.search);

            const queryString = query.toString();
            const headers: HeadersInit = { 'Authorization': `Bearer ${token}` };

            const res = await fetch(`${BASE}/transactions/export${queryString ? '?' + queryString : ''}`, {
                method: 'GET',
                headers,
            });

            if (!res.ok) {
                throw new Error('导出失败');
            }

            return res.blob();
        },

        dashboardSummary: (token: string, monthStart?: string, monthEnd?: string) => {
            const query = new URLSearchParams();
            if (monthStart) query.append('monthStart', monthStart);
            if (monthEnd) query.append('monthEnd', monthEnd);

            const queryString = query.toString();
            return request<DashboardSummary>('GET', `/transactions/dashboard-summary${queryString ? '?' + queryString : ''}`, undefined, token);
        },
    },

    // ── AI Items ─────────────────────────────────────────────────
    aiItems: {
        findAll: (token: string, status?: string) => {
            const query = status ? `?status=${status}` : '';
            return request<{ items: any[], pagination: any }>('GET', `/ai-items${query}`, undefined, token);
        },

        findOne: (id: string, token: string) =>
            request<any>('GET', `/ai-items/${id}`, undefined, token),

        update: (id: string, data: { type?: string; amount?: number; description?: string; date?: string; categoryId?: string }, token: string) =>
            request<any>('PATCH', `/ai-items/${id}`, data, token),

        confirm: (id: string, data: { type: string; amount: number; description: string; date: string; categoryId: string }, token: string) =>
            request<{ transaction: any; aiItem: any }>('POST', `/ai-items/${id}/confirm`, data, token),

        confirmBatch: (items: Array<{ id: string; type: string; amount: number; description: string; date: string; categoryId: string }>, token: string) =>
            request<{ successCount: number; failedCount: number; results: Array<{ id: string; success: boolean; error?: string; transaction?: any }> }>('POST', '/ai-items/batch-confirm', { items }, token),

        remove: (id: string, token: string) =>
            request<{ message: string }>('DELETE', `/ai-items/${id}`, undefined, token),

        getStatistics: (token: string) =>
            request<{ total: number; pending: number; confirmed: number; rejected: number; needsManual: number; dailyStats: any; categoryStats: any }>('GET', '/ai-items/statistics', undefined, token),
    },
};
