/**
 * Admin Korpus — regulation upload and corpus management.
 * Protected with role-check guard.
 */
'use client';

import Link from 'next/link';
import { ShieldAlert, Settings, Plus, Upload, Database } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export default function AdminKorpusPage() {
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-900">Kelola Korpus Peraturan</h1>
            <p className="text-sm text-gray-500 mt-1">
              Panel Admin Korpus: unggah, parsing otomatis struktur Bab/Pasal/Ayat, dan embed ke ChromaDB.
            </p>
          </div>
          <Button className="self-start sm:self-auto gap-2">
            <Plus className="h-4 w-4" />
            Unggah Peraturan Baru
          </Button>
        </div>

        {/* BP1 Preview Card */}
        <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-navy-50">
            <Database className="h-5 w-5 text-navy-600" />
            <h2 className="font-serif text-lg font-semibold text-navy-900">Status Korpus Vektor</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Pada <strong>Phase 3 (BP1)</strong>, formulir pengunggahan naskah PDF/TXT peraturan beserta metadata
            (Jenis, Nomor, Tahun, Judul, Status) dan pratinjau parser regex Bab/Pasal akan diaktifkan secara interaktif.
          </p>
          <div className="rounded-xl border border-dashed border-navy-200 bg-navy-50/50 p-6 text-center text-xs text-navy-600">
            Fitur Ingestion & Structure-Aware Parser (BP1) akan hadir di Phase 3.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
