/**
 * Riwayat & Tersimpan — user conversation history and saved research folders.
 */
'use client';

import { AppShell } from '@/components/layout/AppShell';
import { Bookmark, Clock } from 'lucide-react';

export default function RiwayatPage() {
  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-900">Riwayat & Tersimpan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Akses kembali tanya-jawab hukum sebelumnya dan kelola catatan riset dalam folder.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* History Column */}
          <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-navy-50">
              <Clock className="h-5 w-5 text-navy-600" />
              <h2 className="font-serif text-lg font-semibold text-navy-900">Riwayat Tanya Jawab</h2>
            </div>
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center text-xs text-gray-400">
              Belum ada percakapan. Mulai ajukan pertanyaan di menu Tanya Hukum.
            </div>
          </div>

          {/* Saved Folders Column */}
          <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-navy-50">
              <Bookmark className="h-5 w-5 text-navy-600" />
              <h2 className="font-serif text-lg font-semibold text-navy-900">Folder Riset Tersimpan</h2>
            </div>
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center text-xs text-gray-400">
              Fitur simpan ke folder & ekspor PDF akan aktif di <strong>Phase 6 (BP5)</strong>.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
