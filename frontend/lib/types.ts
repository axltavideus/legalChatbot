/**
 * Shared TypeScript types mirroring the FastAPI Pydantic schemas.
 */

export type UserRole = 'pengguna' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  institution: string | null;
  onboarding_completed: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  institution?: string;
  invite_code?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  institution?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface DeleteAccountPayload {
  password: string;
}

// --- Chat ---
export interface AmendmentTimelineEntry {
  chunk_id: number;
  citation_label: string;
  peraturan: string;
  reg_type: string;
  pasal: string;
  ayat?: string | null;
  text: string;
  status: 'berlaku' | 'diubah' | 'dicabut';
  year: number;
  is_current: boolean;
}

export interface AmendmentTimelineData {
  original_chunk_id: number;
  current_chunk_id: number;
  is_amended: boolean;
  timeline: AmendmentTimelineEntry[];
}

export interface Citation {
  pasal_chunk_id: number;
  label: string;
  peraturan?: string;
  pasal_nomor?: string;
  text: string;
  status: 'berlaku' | 'diubah' | 'dicabut';
  note?: string;
  amendment_timeline?: AmendmentTimelineData;
}

export interface Conflict {
  // Legacy flat fields (from previous MessageBubble)
  description?: string;
  // BP4 structured fields
  topic?: string;
  higher_reg?: string;
  higher_chunk_id?: number;
  higher_citation?: string;
  higher_text?: string;
  higher_level?: number;
  lower_reg?: string;
  lower_chunk_id?: number;
  lower_citation?: string;
  lower_text?: string;
  lower_level?: number;
  principle?: string;
  verdict?: string;
}

export interface ChatResponse {
  conversation_id: number;
  message_id: number;
  answer: string;
  citations: Citation[];
  status_flags: string[];
  conflicts: Conflict[];
}

// --- Corpus ---
export type RegulationType = 'UUD' | 'UU' | 'PP' | 'Perpres' | 'Permen' | 'Perda';
export type RegulationStatus = 'berlaku' | 'diubah' | 'dicabut';

export interface ParsedChunkIn {
  bab?: string;
  pasal: string;
  ayat?: string;
  text: string;
  status?: string;
  amended_by_id?: number;
}

export interface PreviewResponse {
  total_chunks: number;
  chunks: ParsedChunkIn[];
}

export interface IngestRegulationPayload {
  reg_type: RegulationType;
  number: string;
  year: number;
  title: string;
  status: RegulationStatus;
  source_url?: string;
  chunks: ParsedChunkIn[];
}

export interface Regulation {
  id: number;
  reg_type: string;
  number: string;
  year: number;
  title: string;
  status: string;
  source_url?: string;
  chunks_count: number;
  created_at: string;
  chunks?: {
    id: number;
    bab?: string;
    pasal: string;
    ayat?: string;
    text: string;
    status: string;
    amended_by_id?: number;
  }[];
}

// --- Saved ---
export interface Folder {
  id: number;
  name: string;
  created_at: string;
}

// --- Feedback ---
export type FeedbackType = 'thumbs_up' | 'thumbs_down';
export type FeedbackReason = 'sitasi_salah' | 'jawaban_keliru' | 'peraturan_tidak_berlaku' | 'lainnya';

export interface FeedbackPayload {
  message_id?: number;
  feedback_type: FeedbackType;
  reason?: FeedbackReason;
  comment?: string;
  is_general?: boolean;
}

// --- Generic API error ---
export interface ApiError {
  detail: string;
}

