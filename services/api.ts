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

    return json.data as T;
}

// ── Auth ─────────────────────────────────────────────────

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
    isPro?: boolean;
}

export interface AuthResponse {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
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
    },

    users: {
        getProfile: (token: string) =>
            request<AuthUser>('GET', '/users/profile', undefined, token),

        updateProfile: (data: { name?: string; avatarUrl?: string }, token: string) =>
            request<AuthUser>('PUT', '/users/profile', data, token),

        getPreferences: (token: string) =>
            request<{ currency: string; language: string; theme: string }>('GET', '/users/preferences', undefined, token),

        updatePreferences: (data: { currency?: string; language?: string; theme?: string }, token: string) =>
            request<{ currency: string; language: string; theme: string }>('PUT', '/users/preferences', data, token),

        changePassword: (data: { oldPassword: string; newPassword: string }, token: string) =>
            request<{ message: string }>('PATCH', '/users/password', data, token),
    },
};
