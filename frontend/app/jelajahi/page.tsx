/**
 * Jelajahi Peraturan — Browse indexed regulations and view official Pasal texts.
 */
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { BookOpen, Search, Layers, Eye, ExternalLink } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { corpusApi } from '@/lib/api';
import type { Regulation } from '@/lib/types';

export default function JelajahiPage() {
  const { data: regulations, error, isLoading } = useSWR<Regulation[]>(
    '/corpus',
    () => corpusApi.list()
  );
  const [search, setSearch] = useState('');
  const [selectedReg, setSelectedReg] = useState<Regulation | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const filtered = regulations?.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.number.toLowerCase().includes(q) ||
      r.reg_type.toLowerCase().includes(q) ||
      r.year.toString().includes(q)
    );
  });

  const handleOpenDetail = async (reg: Regulation) => {
    setSelectedReg(reg);
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const full = await corpusApi.get(reg.id);
      setSelectedReg(full);
    } catch {
      // fallback
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-900">Jelajahi Peraturan</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Daftar regulasi hukum ketenagakerjaan resmi Republik Indonesia yang terindeks dalam korpus LexIndo.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor peraturan, tahun, atau kata kunci judul..."
            className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white shadow-2xs"
          />
        </div>

        {/* Regulation Cards Grid */}
        {isLoading ? (
          <div className="p-16 text-center">
            <Spinner label="Memuat korpus regulasi..." />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-700">
            Gagal memuat korpus peraturan: {error.message}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-xs text-gray-400">
            Tidak ditemukan peraturan yang sesuai dengan pencarian Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered?.map((reg) => (
              <div
                key={reg.id}
                className="flex flex-col justify-between rounded-2xl border border-navy-100 bg-white p-5 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-lg bg-navy-100 px-2.5 py-1 text-xs font-bold text-navy-900">
                      {reg.reg_type} No. {reg.number}/{reg.year}
                    </span>
                    <Badge variant={reg.status as any}>{reg.status}</Badge>
                  </div>
                  <h2 className="font-serif text-sm font-semibold text-navy-900 leading-snug line-clamp-2">
                    {reg.title}
                  </h2>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
                    <Layers className="h-3.5 w-3.5 text-navy-500" />
                    {reg.chunks_count} Pasal Terindeks
                  </span>
                  <button
                    onClick={() => handleOpenDetail(reg)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-2.5 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-50 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Baca Naskah
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedReg ? `${selectedReg.reg_type} ${selectedReg.number}/${selectedReg.year}` : 'Detil Peraturan'}
        size="lg"
      >
        {loadingDetail ? (
          <div className="p-10 text-center">
            <Spinner label="Memuat naskah pasal..." />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-navy-50 p-3.5 border border-navy-100">
              <div className="font-semibold text-xs md:text-sm text-navy-900">{selectedReg?.title}</div>
              {selectedReg?.source_url && (
                <a
                  href={selectedReg.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-navy-600 hover:underline"
                >
                  Naskah resmi di JDIH <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {selectedReg?.chunks && selectedReg.chunks.length > 0 ? (
                selectedReg.chunks.map((p) => (
                  <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-3.5 text-xs shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-900 text-sm">Pasal {p.pasal}</span>
                      <Badge variant={p.status as any}>{p.status}</Badge>
                    </div>
                    {p.bab && <div className="text-[11px] font-medium text-navy-600">{p.bab}</div>}
                    <p className="text-gray-800 leading-relaxed whitespace-pre-line">{p.text}</p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-400 text-xs">Belum ada rincian pasal.</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
