/**
 * Admin Feedback — review user feedback on answers and system (Phase 6).
 * Protected with role-check guard.
 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert, ThumbsUp, ThumbsDown, Filter, CheckCircle2,
  Clock, AlertTriangle, MessageSquare, User as UserIcon, RefreshCw
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { feedbackApi } from '@/lib/api';
import type { FeedbackItem, FeedbackStatus } from '@/lib/types';

export default function AdminFeedbackPage() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('semua');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchFeedbacks = async (status?: string) => {
    setIsLoading(true);
    try {
      const data = await feedbackApi.list(status && status !== 'semua' ? status : undefined);
      setFeedbacks(data);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks(selectedStatus);
  }, [selectedStatus]);

  const handleStatusChange = async (feedbackId: number, newStatus: FeedbackStatus) => {
    setUpdatingId(feedbackId);
    try {
      const updated = await feedbackApi.updateStatus(feedbackId, newStatus);
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === updated.id ? { ...f, status: updated.status } : f))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memperbarui status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Role Guard
  if (user && user.role !== 'admin') {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center max-w-md mx-auto">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4 ring-8 ring-red-50/60">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">Akses Ditolak</h1>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            Halaman ini khusus untuk <strong>Admin Korpus</strong>. Akun Anda terdaftar sebagai Pengguna umum.
          </p>
          <div className="mt-6">
            <Link href="/tanya">
              <Button>Kembali ke Tanya Hukum</Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // Reason formatting
  const reasonLabel = (reason: string | null | undefined, isGeneral: boolean) => {
    if (isGeneral) return 'Saran Umum Aplikasi';
    switch (reason) {
      case 'sitasi_salah':
        return 'Sitasi Salah';
      case 'jawaban_keliru':
        return 'Jawaban Keliru';
      case 'peraturan_tidak_berlaku':
        return 'Peraturan Tidak Berlaku';
      default:
        return 'Masukan Lainnya';
    }
  };

  const statusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'baru':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'ditinjau':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'diperbaiki':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  // Stats calculation
  const stats = {
    total: feedbacks.length,
    baru: feedbacks.filter((f) => f.status === 'baru').length,
    ditinjau: feedbacks.filter((f) => f.status === 'ditinjau').length,
    diperbaiki: feedbacks.filter((f) => f.status === 'diperbaiki').length,
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-900">
              Tinjau Feedback Pengguna
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Pantau laporan sitasi salah, ketidaksesuaian naskah, dan status perbaikan korpus.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchFeedbacks(selectedStatus)}
            className="text-xs self-start sm:self-auto gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Muat Ulang
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-2xs">
            <span className="text-xs font-semibold text-gray-500">Total Masukan</span>
            <div className="font-serif text-2xl font-bold text-navy-900 mt-1">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs">
            <span className="text-xs font-semibold text-blue-700">Perlu Ditinjau (Baru)</span>
            <div className="font-serif text-2xl font-bold text-blue-900 mt-1">{stats.baru}</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
            <span className="text-xs font-semibold text-amber-700">Sedang Ditinjau</span>
            <div className="font-serif text-2xl font-bold text-amber-900 mt-1">{stats.ditinjau}</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
            <span className="text-xs font-semibold text-emerald-700">Telah Diperbaiki</span>
            <div className="font-serif text-2xl font-bold text-emerald-900 mt-1">{stats.diperbaiki}</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
          <span className="text-xs font-semibold text-navy-900 flex items-center gap-1 mr-1">
            <Filter className="h-3.5 w-3.5" />
            Status:
          </span>

          {[
            { id: 'semua', label: 'Semua Status' },
            { id: 'baru', label: 'Baru' },
            { id: 'ditinjau', label: 'Ditinjau' },
            { id: 'diperbaiki', label: 'Diperbaiki' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                selectedStatus === tab.id
                  ? 'bg-navy-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feedback List */}
        {isLoading ? (
          <div className="py-16 text-center">
            <Spinner size="md" label="Memuat feedback pengguna..." />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="font-serif font-bold text-navy-900 text-sm">
              Tidak Ada Feedback {selectedStatus !== 'semua' ? `dengan Status "${selectedStatus}"` : ''}
            </h3>
            <p className="text-xs text-gray-500">
              Seluruh masukan pengguna telah ditangani atau belum ada feedback yang dikirim.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="rounded-2xl border border-navy-100 bg-white p-5 shadow-xs space-y-4 hover:border-navy-300 transition-all"
              >
                {/* Header: User, Type, Reason, Status changer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Thumbs Badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                        fb.feedback_type === 'thumbs_up'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {fb.feedback_type === 'thumbs_up' ? (
                        <>
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>Puas / Akurat</span>
                        </>
                      ) : (
                        <>
                          <ThumbsDown className="h-3.5 w-3.5" />
                          <span>Kurang Akurat</span>
                        </>
                      )}
                    </span>

                    {/* Reason Tag */}
                    <span className="rounded-lg bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                      {reasonLabel(fb.reason, fb.is_general)}
                    </span>

                    {/* User Info */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <UserIcon className="h-3 w-3 text-gray-400" />
                      <span>{fb.user_name ?? fb.user_email ?? `User #${fb.user_id}`}</span>
                    </div>

                    {/* Timestamp */}
                    <span className="text-[11px] text-gray-400">
                      {new Date(fb.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Status Changer Select */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-medium text-gray-500">Status:</span>
                    <select
                      value={fb.status}
                      disabled={updatingId === fb.id}
                      onChange={(e) =>
                        handleStatusChange(fb.id, e.target.value as FeedbackStatus)
                      }
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold focus:outline-none transition-colors ${statusBadge(
                        fb.status
                      )}`}
                    >
                      <option value="baru">🔵 Baru</option>
                      <option value="ditinjau">🟡 Ditinjau</option>
                      <option value="diperbaiki">🟢 Diperbaiki</option>
                    </select>
                  </div>
                </div>

                {/* Comment Text */}
                {fb.comment && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 text-xs text-navy-950 leading-relaxed font-sans">
                    <span className="font-semibold text-navy-900 block mb-1">
                      Komentar / Catatan Pengguna:
                    </span>
                    <p className="whitespace-pre-line italic text-gray-700">
                      "{fb.comment}"
                    </p>
                  </div>
                )}

                {/* Associated Message Preview */}
                {fb.message_preview && (
                  <div className="rounded-xl border border-navy-50 bg-navy-50/40 p-3 text-xs text-gray-600 leading-relaxed">
                    <span className="font-bold text-navy-800 text-[11px] uppercase tracking-wider block mb-0.5">
                      Kutipan Jawaban Terkait:
                    </span>
                    <p className="line-clamp-2">{fb.message_preview}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
