/**
 * Typed API client — all requests go through Next.js rewrites to FastAPI.
 * Cookies are sent automatically (credentials: 'include').
 */
import type {
  TokenResponse, RegisterPayload, LoginPayload,
  UpdateProfilePayload, ChangePasswordPayload, DeleteAccountPayload,
  User, ChatResponse, Regulation, Folder, FeedbackPayload,
} from './types';

const BASE = '/api';

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {}
    throw new Error(detail);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authApi = {
  register: (payload: RegisterPayload) =>
    request<TokenResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  login: (payload: LoginPayload) =>
    request<TokenResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),

  me: () =>
    request<User>('/auth/me'),

  updateProfile: (payload: UpdateProfilePayload) =>
    request<User>('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) }),

  changePassword: (payload: ChangePasswordPayload) =>
    request<{ message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify(payload) }),

  completeOnboarding: () =>
    request<{ message: string }>('/auth/complete-onboarding', {
      method: 'POST',
      body: JSON.stringify({ acknowledged: true }),
    }),

  deleteAccount: (payload: DeleteAccountPayload) =>
    request<{ message: string }>('/auth/me', { method: 'DELETE', body: JSON.stringify(payload) }),
};

// ---------------------------------------------------------------------------
// Chat (Phase 4)
// ---------------------------------------------------------------------------
export const chatApi = {
  ask: (question: string, conversation_id?: number) =>
    request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ question, conversation_id }),
    }),
};

// ---------------------------------------------------------------------------
// Corpus (Phase 3)
// ---------------------------------------------------------------------------
export const corpusApi = {
  list: () => request<Regulation[]>('/corpus'),
};

// ---------------------------------------------------------------------------
// Saved (Phase 6)
// ---------------------------------------------------------------------------
export const savedApi = {
  list: () => request<Folder[]>('/saved'),
};

// ---------------------------------------------------------------------------
// Feedback (Phase 6)
// ---------------------------------------------------------------------------
export const feedbackApi = {
  submit: (payload: FeedbackPayload) =>
    request<{ message: string }>('/feedback', { method: 'POST', body: JSON.stringify(payload) }),
};

