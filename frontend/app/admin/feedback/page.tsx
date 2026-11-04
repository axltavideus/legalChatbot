/**
 * Admin Feedback — review user feedback on answers and system.
 * Protected with role-check guard.
 */
'use client';

import Link from 'next/link';
import { ShieldAlert, MessageSquareText, Filter } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';

export default function AdminFeedbackPage() {
  const { user } = useAuth();

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

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-900">Tinjau Feedback Pengguna</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau laporan sitasi salah, jawaban keliru, dan saran peningkatan kualitas dari pengguna.
          </p>
        </div>

        {/* Filter bar placeholder */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <span className="text-xs font-semibold text-gray-500">Filter Status:</span>
          <Badge variant="baru" className="cursor-pointer">Semua</Badge>
          <Badge variant="default" className="cursor-pointer hover:bg-gray-200">Baru</Badge>
          <Badge variant="default" className="cursor-pointer hover:bg-gray-200">Ditinjau</Badge>
          <Badge variant="default" className="cursor-pointer hover:bg-gray-200">Diperbaiki</Badge>
        </div>

        {/* Feedback List Placeholder */}
        <div className="rounded-2xl border border-navy-100 bg-white p-8 text-center shadow-xs">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-600 mb-3">
            <MessageSquareText className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-navy-900">Daftar Feedback Pengguna</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
            Seluruh ulasan jawaban dan saran umum yang dikirimkan pengguna dapat ditinjau dan diperbarui statusnya di <strong>Phase 6</strong>.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
