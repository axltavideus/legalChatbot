/**
 * Typed API client — all requests go through Next.js rewrites to FastAPI.
 * Cookies are sent automatically (credentials: 'include').
 */
import type {
  TokenResponse, RegisterPayload, LoginPayload,
  UpdateProfilePayload, ChangePasswordPayload, DeleteAccountPayload,
  User, ChatResponse, ConversationOut, Regulation, Folder, FeedbackPayload,
  FeedbackItem, FeedbackStatus, SavedItem, SaveItemPayload, UpdateSavedItemPayload,
  PreviewResponse, IngestRegulationPayload, InviteInfo, DashboardMetrics,
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

  getInvite: () =>
    request<InviteInfo>('/auth/invite'),
};

// ---------------------------------------------------------------------------
// Chat (Phase 4 / BP2)
// ---------------------------------------------------------------------------
export const chatApi = {
  ask: (question: string, conversation_id?: number) =>
    request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ question, conversation_id }),
    }),
  listConversations: () => request<ConversationOut[]>('/chat/conversations'),
  getConversation: (id: number) => request<ConversationOut>(`/chat/conversations/${id}`),
  deleteConversation: (id: number) =>
    request<{ message: string }>(`/chat/conversations/${id}`, {
      method: 'DELETE',
    }),
};

// ---------------------------------------------------------------------------
// Corpus (Phase 3 / BP1)
// ---------------------------------------------------------------------------
export const corpusApi = {
  list: () => request<Regulation[]>('/corpus'),

  get: (id: number) => request<Regulation>(`/corpus/${id}`),

  preview: async (formData: FormData): Promise<PreviewResponse> => {
    const res = await fetch(`${BASE}/corpus/preview`, {
      method: 'POST',
      credentials: 'include',
      body: formData, // fetch sets multipart/form-data boundary automatically
    });
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        detail = body?.detail ?? detail;
      } catch {}
      throw new Error(detail);
    }
    return res.json();
  },

  confirm: (payload: IngestRegulationPayload) =>
    request<Regulation>('/corpus/confirm', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  delete: (id: number) =>
    request<{ message: string }>(`/corpus/${id}`, {
      method: 'DELETE',
    }),
};

// ---------------------------------------------------------------------------
// Saved & Folders (BP5)
// ---------------------------------------------------------------------------
export const savedApi = {
  // Folders
  listFolders: () => request<Folder[]>('/saved/folders'),
  createFolder: (name: string) =>
    request<Folder>('/saved/folders', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  updateFolder: (id: number, name: string) =>
    request<Folder>(`/saved/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  deleteFolder: (id: number) =>
    request<{ message: string }>(`/saved/folders/${id}`, {
      method: 'DELETE',
    }),

  // Saved Items
  listItems: (folderId?: number) => {
    const url = folderId !== undefined ? `/saved/items?folder_id=${folderId}` : '/saved/items';
    return request<SavedItem[]>(url);
  },
  saveItem: (payload: SaveItemPayload) =>
    request<SavedItem>('/saved/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateItem: (id: number, payload: UpdateSavedItemPayload) =>
    request<SavedItem>(`/saved/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteItem: (id: number) =>
    request<{ message: string }>(`/saved/items/${id}`, {
      method: 'DELETE',
    }),

  // Export PDF (downloads binary Blob)
  exportFolderPdfUrl: (folderId: number) => `${BASE}/saved/folders/${folderId}/export`,
  exportItemPdfUrl: (itemId: number) => `${BASE}/saved/items/${itemId}/export`,
};

// ---------------------------------------------------------------------------
// Feedback (Answer Feedback & Admin Review)
// ---------------------------------------------------------------------------
export const feedbackApi = {
  submit: (payload: FeedbackPayload) =>
    request<{ message: string; id?: number }>('/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin endpoints
  list: (statusFilter?: string) => {
    const url = statusFilter ? `/feedback?status_filter=${statusFilter}` : '/feedback';
    return request<FeedbackItem[]>(url);
  },
  updateStatus: (id: number, status: FeedbackStatus) =>
    request<FeedbackItem>(`/feedback/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ---------------------------------------------------------------------------
// Plans & Subscription Interest (Lean Canvas Validation)
// ---------------------------------------------------------------------------
export const plansApi = {
  recordInterest: (plan_name: string) =>
    request<{ message: string; plan_name: string }>('/plans/interest', {
      method: 'POST',
      body: JSON.stringify({ plan_name }),
    }),
  getMyInterests: () =>
    request<{ plan_name: string; created_at: string }[]>('/plans/interest'),
};

// ---------------------------------------------------------------------------
// Admin Dashboard Metrics
// ---------------------------------------------------------------------------
export const adminDashboardApi = {
  getMetrics: () =>
    request<DashboardMetrics>('/admin/dashboard/metrics'),
};

