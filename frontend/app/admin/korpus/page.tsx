/**
 * Admin Korpus — Regulation Ingestion, Structure-Aware Parsing (BP1), and Vector Indexing.
 */
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import {
  Database,
  Plus,
  Upload,
  FileText,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { corpusApi } from '@/lib/api';
import type { Regulation, RegulationType, RegulationStatus, ParsedChunkIn } from '@/lib/types';

export default function AdminKorpusPage() {
  const { user } = useAuth();
  const { data: regulations, error, isLoading, mutate } = useSWR<Regulation[]>(
    '/corpus',
    () => corpusApi.list()
  );

  // --- Ingestion Modal State ---
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: Metadata + Input, 2: Parsing Preview
  const [regType, setRegType] = useState<RegulationType>('UU');
  const [number, setNumber] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [title, setTitle] = useState('');
  const [regStatus, setRegStatus] = useState<RegulationStatus>('berlaku');
  const [sourceUrl, setSourceUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Parsing & Confirm State
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [previewChunks, setPreviewChunks] = useState<ParsedChunkIn[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Regulation | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [regToDelete, setRegToDelete] = useState<Regulation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Guard for Pengguna
  if (user && user.role !== 'admin') {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center max-w-md mx-auto">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4 ring-8 ring-red-50/60">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">Akses Terbatas</h1>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            Halaman Kelola Korpus hanya dapat diakses oleh <strong>Admin Korpus</strong>.
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

  // Handle Parse Preview (BP1 Step 1)
  const handlePreviewParse = async (e: React.FormEvent) => {
    e.preventDefault();
    setParseError('');

    if (!selectedFile && !rawText.trim()) {
      setParseError('Wajib memilih berkas PDF/TXT atau menempelkan teks peraturan.');
      return;
    }
    if (!number.trim() || !title.trim()) {
      setParseError('Nomor peraturan dan judul lengkap wajib diisi.');
      return;
    }

    setIsParsing(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('raw_text', rawText);
      }

      const res = await corpusApi.preview(formData);
      if (!res.chunks || res.chunks.length === 0) {
        setParseError('Parser tidak menemukan pasal dalam naskah tersebut.');
        return;
      }
      setPreviewChunks(res.chunks);
      setStep(2);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Gagal memproses dokumen.');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Confirm & Index (BP1 Step 2)
  const handleConfirmIngest = async () => {
    setIsIndexing(true);
    try {
      await corpusApi.confirm({
        reg_type: regType,
        number,
        year: Number(year),
        title,
        status: regStatus,
        source_url: sourceUrl || undefined,
        chunks: previewChunks,
      });

      mutate(); // refresh table
      setModalOpen(false);
      resetIngestForm();
      setToast({
        message: `Peraturan ${regType} ${number}/${year} berhasil diindeks ke ChromaDB!`,
        type: 'success',
      });
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : 'Gagal mengindeks peraturan.',
        type: 'error',
      });
    } finally {
      setIsIndexing(false);
    }
  };

  const resetIngestForm = () => {
    setStep(1);
    setRegType('UU');
    setNumber('');
    setYear(new Date().getFullYear());
    setTitle('');
    setRegStatus('berlaku');
    setSourceUrl('');
    setRawText('');
    setSelectedFile(null);
    setPreviewChunks([]);
    setParseError('');
  };

  // View Details
  const handleViewDetails = async (reg: Regulation) => {
    setSelectedReg(reg);
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const full = await corpusApi.get(reg.id);
      setSelectedReg(full);
    } catch {
      // fallback to basic reg
    } finally {
      setLoadingDetail(false);
    }
  };

  // Delete Regulation
  const handleDelete = async () => {
    if (!regToDelete) return;
    setIsDeleting(true);
    try {
      await corpusApi.delete(regToDelete.id);
      mutate();
      setDeleteConfirmOpen(false);
      setRegToDelete(null);
      setToast({ message: 'Peraturan dan vektor terkait berhasil dihapus.', type: 'success' });
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : 'Gagal menghapus.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-900">Kelola Korpus Peraturan</h1>
            </div>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              BP1: Ingestion naskah resmi, parsing Bab/Pasal/Ayat terstruktur, dan penanaman vektor ke ChromaDB.
            </p>
          </div>

          <Button
            onClick={() => {
              resetIngestForm();
              setModalOpen(true);
            }}
            className="self-start sm:self-auto gap-2 bg-navy-600 hover:bg-navy-700 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Unggah Peraturan Baru
          </Button>
        </div>

        {/* Regulation Table Card */}
        <div className="rounded-2xl border border-navy-100 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-5 border-b border-navy-50 bg-navy-50/40">
            <div className="flex items-center gap-2 text-navy-900 font-semibold text-sm">
              <Database className="h-4 w-4 text-navy-600" />
              <span>Daftar Regulasi Terindeks ({regulations?.length || 0})</span>
            </div>
            <span className="text-xs text-navy-600">Model: multilingual-e5 / ChromaDB</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <Spinner label="Memuat korpus..." />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600 text-sm">
              Gagal memuat korpus: {error.message}
            </div>
          ) : regulations?.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              Belum ada peraturan diindeks. Klik tombol di atas untuk mengunggah atau jalankan script seed.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-gray-50 text-navy-700 border-b border-gray-100 text-[11px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Jenis & Nomor</th>
                    <th className="py-3 px-4">Tahun</th>
                    <th className="py-3 px-4">Judul Peraturan</th>
                    <th className="py-3 px-4 text-center">Jumlah Pasal</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {regulations?.map((reg) => (
                    <tr key={reg.id} className="hover:bg-navy-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-navy-900 whitespace-nowrap">
                        {reg.reg_type} {reg.number}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">{reg.year}</td>
                      <td className="py-3.5 px-4 text-gray-800 max-w-md truncate" title={reg.title}>
                        {reg.title}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-800">
                          <Layers className="h-3 w-3" />
                          {reg.chunks_count}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge variant={reg.status as any}>{reg.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetails(reg)}
                            className="rounded-lg p-1.5 text-navy-600 hover:bg-navy-50 transition-colors"
                            title="Lihat Daftar Pasal"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setRegToDelete(reg);
                              setDeleteConfirmOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                            title="Hapus dari Korpus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* INGESTION & PARSING MODAL (BP1) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={step === 1 ? 'Unggah & Parsing Peraturan (BP1)' : 'Pratinjau Hasil Parsing Struktur (BP1)'}
        size="lg"
      >
        {step === 1 ? (
          <form onSubmit={handlePreviewParse} className="space-y-4">
            {parseError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-navy-800">Jenis Peraturan</label>
                <select
                  value={regType}
                  onChange={(e) => setRegType(e.target.value as RegulationType)}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-xs font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400"
                >
                  <option value="UUD">UUD (Undang-Undang Dasar)</option>
                  <option value="UU">UU (Undang-Undang)</option>
                  <option value="PP">PP (Peraturan Pemerintah)</option>
                  <option value="Perpres">Perpres (Peraturan Presiden)</option>
                  <option value="Permen">Permen (Peraturan Menteri)</option>
                  <option value="Perda">Perda (Peraturan Daerah)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-navy-800">Nomor</label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="cth. 13 atau 35"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-navy-800">Tahun</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  placeholder="cth. 2023"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-navy-800">Judul Lengkap Peraturan</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth. Undang-Undang tentang Ketenagakerjaan"
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-navy-800">Status Keberlakuan</label>
                <select
                  value={regStatus}
                  onChange={(e) => setRegStatus(e.target.value as RegulationStatus)}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400"
                >
                  <option value="berlaku">Berlaku</option>
                  <option value="diubah">Diubah (Sebagian / Telah Direvisi)</option>
                  <option value="dicabut">Dicabut (Tidak Berlaku Lagi)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-navy-800">URL Sumber Resmi (JDIH)</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://peraturan.go.id/id/..."
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400"
                />
              </div>
            </div>

            {/* Document Input Mode: File or Text */}
            <div className="pt-2 border-t border-gray-100">
              <label className="text-xs font-medium text-navy-800 mb-1 block">
                Unggah Berkas Naskah Peraturan (PDF / TXT)
              </label>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setSelectedFile(f || null);
                }}
                className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100 cursor-pointer"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Atau tempelkan langsung naskah teks peraturan di bawah ini jika tidak menggunakan berkas:
              </p>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={4}
                placeholder="Tempel naskah Bab/Pasal di sini (misal: BAB I KETENTUAN UMUM ... Pasal 1 ... Pasal 2) ..."
                className="mt-2 w-full rounded-lg border border-gray-300 p-2.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" isLoading={isParsing} className="gap-2">
                <span>Pratinjau Struktur (Parser)</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        ) : (
          /* STEP 2: PARSING PREVIEW */
          <div className="space-y-4">
            <div className="rounded-xl bg-navy-50 p-3 border border-navy-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-navy-900 text-xs md:text-sm">
                  {regType} No. {number}/{year}
                </span>
                <p className="text-xs text-navy-600 line-clamp-1">{title}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                  <CheckCircle2 className="h-3 w-3" />
                  {previewChunks.length} Pasal Terdeteksi
                </span>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {previewChunks.map((chunk, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-navy-800 font-semibold">
                    <span className="rounded-md bg-navy-100 px-2 py-0.5 text-[11px] font-bold text-navy-900">
                      Pasal {chunk.pasal}
                    </span>
                    {chunk.bab && <span className="text-[11px] text-gray-500 truncate max-w-xs">{chunk.bab}</span>}
                  </div>
                  <p className="text-gray-700 leading-relaxed line-clamp-3">{chunk.text}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setStep(1)} disabled={isIndexing}>
                ← Kembali Koreksi
              </Button>
              <Button
                onClick={handleConfirmIngest}
                isLoading={isIndexing}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                <CheckCircle2 className="h-4 w-4" />
                Konfirmasi & Indeks ke ChromaDB
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DETAIL VIEW MODAL */}
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
            <div className="rounded-xl bg-navy-50/70 p-3.5 border border-navy-100">
              <div className="font-semibold text-xs md:text-sm text-navy-900">{selectedReg?.title}</div>
              {selectedReg?.source_url && (
                <a
                  href={selectedReg.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-navy-600 hover:underline"
                >
                  Lihat sumber resmi JDIH <ExternalLink className="h-3 w-3" />
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

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Konfirmasi Hapus Peraturan"
        size="sm"
      >
        <div className="space-y-4 text-xs md:text-sm">
          <p className="text-gray-600">
            Apakah Anda yakin ingin menghapus <strong>{regToDelete?.reg_type} {regToDelete?.number}/{regToDelete?.year}</strong>?
          </p>
          <div className="rounded-xl bg-red-50 p-3 text-red-800 border border-red-200 text-xs leading-relaxed">
            Tindakan ini akan menghapus seluruh data Pasal dari database SQLite dan membersihkan vektor embedding terkait dari ChromaDB.
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>
              Batal
            </Button>
            <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </AppShell>
  );
}
