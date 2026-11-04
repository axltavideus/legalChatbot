/**
 * Jelajahi Peraturan — browse the regulation corpus.
 */
'use client';

import { AppShell } from '@/components/layout/AppShell';
import { BookOpen, Search } from 'lucide-react';

export default function JelajahiPage() {
  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-900">Jelajahi Peraturan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Telusuri naskah undang-undang dan peraturan turunan yang telah diindeks ke dalam korpus LexIndo.
          </p>
        </div>

        {/* Search Bar Placeholder */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nomor peraturan, bab, atau kata kunci..."
            className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
            disabled
          />
        </div>

        {/* Empty state / Phase 3 info */}
        <div className="rounded-2xl border border-dashed border-navy-200 bg-white p-12 text-center shadow-xs">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-600 mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-navy-900">Korpus Siap Diindeks</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
            Daftar peraturan (UU 13/2003, UU Cipta Kerja, PP 35/2021) akan dimuat secara dinamis dari database pada <strong>Phase 3</strong>.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
