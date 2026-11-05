/**
 * Riwayat & Riset Tersimpan — full research management with folders and PDF export (BP5).
 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock, Bookmark, Folder as FolderIcon, Plus, Download,
  Trash2, Edit3, MessageSquare, ExternalLink, AlertCircle, Check, Search
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CitationChip } from '@/components/chat/CitationChip';
import { SourceModal } from '@/components/chat/SourceModal';
import { renderMarkdown } from '@/lib/renderMarkdown';
import { chatApi, savedApi } from '@/lib/api';
import type { Folder, SavedItem, ConversationOut, Citation } from '@/lib/types';

export default function RiwayatPage() {
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');

  // Folders and Saved Items state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  // Conversations history state
  const [conversations, setConversations] = useState<ConversationOut[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Modal / Editing state
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingItem, setEditingItem] = useState<SavedItem | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  // Notification state
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Folders & Saved Items
  const loadSavedData = async () => {
    setIsLoadingSaved(true);
    try {
      const [foldersRes, itemsRes] = await Promise.all([
        savedApi.listFolders(),
        savedApi.listItems(selectedFolderId ?? undefined),
      ]);
      setFolders(foldersRes);
      setSavedItems(itemsRes);
    } catch (err: unknown) {
      setActionError('Gagal memuat riset tersimpan');
    } finally {
      setIsLoadingSaved(false);
    }
  };

  // 2. Fetch Conversations
  const loadHistoryData = async () => {
    setIsLoadingHistory(true);
    try {
      const convs = await chatApi.listConversations();
      setConversations(convs);
    } catch {
      // Ignore
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadSavedData();
    loadHistoryData();
  }, [selectedFolderId]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const created = await savedApi.createFolder(newFolderName.trim());
      setFolders((prev) => [created, ...prev]);
      setSelectedFolderId(created.id);
      setNewFolderName('');
      setShowNewFolderModal(false);
      setActionSuccess(`Folder '${created.name}' berhasil dibuat`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Gagal membuat folder');
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const handleDeleteFolder = async (folderId: number, folderName: string) => {
    if (!confirm(`Hapus folder '${folderName}'? Riset di dalamnya akan tetap disimpan di Koleksi Umum.`)) return;
    try {
      await savedApi.deleteFolder(folderId);
      if (selectedFolderId === folderId) setSelectedFolderId(null);
      await loadSavedData();
      setActionSuccess(`Folder '${folderName}' berhasil dihapus`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setActionError('Gagal menghapus folder');
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const handleDeleteSavedItem = async (itemId: number) => {
    if (!confirm('Hapus riset ini dari daftar tersimpan?')) return;
    try {
      await savedApi.deleteItem(itemId);
      setSavedItems((prev) => prev.filter((i) => i.id !== itemId));
      setActionSuccess('Riset berhasil dihapus');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err: unknown) {
      setActionError('Gagal menghapus riset tersimpan');
      setTimeout(() => setActionError(null), 2500);
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const updated = await savedApi.updateItem(editingItem.id, {
        note: editNoteText.trim() || undefined,
      });
      setSavedItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setEditingItem(null);
      setActionSuccess('Catatan berhasil diperbarui');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch {
      setActionError('Gagal memperbarui catatan');
      setTimeout(() => setActionError(null), 2500);
    }
  };

  const handleDeleteConversation = async (convId: number) => {
    if (!confirm('Hapus percakapan ini secara permanen?')) return;
    try {
      await chatApi.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      setActionSuccess('Percakapan berhasil dihapus');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch {
      setActionError('Gagal menghapus percakapan');
      setTimeout(() => setActionError(null), 2500);
    }
  };

  // Filter saved items by search
  const filteredItems = savedItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      (item.note && item.note.toLowerCase().includes(q))
    );
  });

  const activeFolderName = selectedFolderId
    ? folders.find((f) => f.id === selectedFolderId)?.name ?? 'Folder'
    : 'Semua Riset';

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-900">
              Riwayat & Riset Tersimpan
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Kelola arsip riset hukum dalam folder khusus dan unduh laporan resmi dalam format PDF.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="inline-flex rounded-xl bg-navy-50/80 p-1 border border-navy-100/80">
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'saved'
                  ? 'bg-white text-navy-900 shadow-2xs'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Riset Tersimpan</span>
              {savedItems.length > 0 && (
                <span className="rounded-full bg-navy-100 px-1.5 py-0.2 text-[10px] text-navy-800">
                  {savedItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-navy-900 shadow-2xs'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Riwayat Chat</span>
              {conversations.length > 0 && (
                <span className="rounded-full bg-navy-100 px-1.5 py-0.2 text-[10px] text-navy-800">
                  {conversations.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {actionSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 animate-fade-in">
            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1: RISET TERSIMPAN & FOLDERS (BP5) */}
        {/* ================================================================= */}
        {activeTab === 'saved' && (
          <div className="space-y-6 animate-fade-in">
            {/* Folder Bar & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-navy-100 bg-white p-3.5 shadow-xs">
              {/* Folder Pills List */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedFolderId === null
                      ? 'bg-navy-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-navy-800 hover:bg-gray-200'
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  Semua Koleksi
                </button>

                {folders.map((f) => (
                  <div key={f.id} className="relative group inline-flex">
                    <button
                      onClick={() => setSelectedFolderId(f.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedFolderId === f.id
                          ? 'bg-navy-600 text-white shadow-2xs'
                          : 'bg-navy-50/70 text-navy-800 hover:bg-navy-100'
                      }`}
                    >
                      <FolderIcon className="h-3.5 w-3.5 text-navy-500" />
                      {f.name}
                      <span className="opacity-70 text-[10px]">({f.items_count ?? 0})</span>
                    </button>
                    {/* Delete folder button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(f.id, f.name);
                      }}
                      className="ml-1 hidden group-hover:inline-flex items-center justify-center text-gray-400 hover:text-red-600"
                      title="Hapus folder"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowNewFolderModal(true)}
                  className="text-xs h-8 whitespace-nowrap gap-1 border-dashed"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Buat Folder
                </Button>
              </div>

              {/* Action Buttons: Export Folder to PDF & Search */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative flex-1 md:w-56">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari dalam riset..."
                    className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-navy-400"
                  />
                </div>

                {selectedFolderId && (
                  <a
                    href={savedApi.exportFolderPdfUrl(selectedFolderId)}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg bg-navy-600 hover:bg-navy-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
                    title={`Unduh seluruh riset dalam ${activeFolderName} sebagai PDF`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Ekspor PDF Folder</span>
                  </a>
                )}
              </div>
            </div>

            {/* Saved Items Grid */}
            {isLoadingSaved ? (
              <div className="py-16 text-center">
                <Spinner size="md" label="Memuat riset hukum tersimpan..." />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-400">
                  <Bookmark className="h-6 w-6" />
                </div>
                <h3 className="font-serif font-bold text-navy-900 text-base">
                  Belum Ada Riset di {activeFolderName}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Saat melakukan tanya jawab hukum di menu Tanya Hukum, klik tombol <strong>"Simpan Riset"</strong> pada jawaban yang ingin Anda arsipkan.
                </p>
                <div className="pt-2">
                  <Link href="/tanya">
                    <Button size="sm" className="bg-navy-600 text-white text-xs gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Buka Tanya Hukum
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-navy-100 bg-white p-5 shadow-xs space-y-3.5 hover:border-navy-300 transition-all"
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-navy-100 px-2 py-0.5 text-[10px] font-bold text-navy-800">
                            📁 {item.folder_name ?? 'Koleksi Umum'}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(item.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-navy-950 text-sm md:text-base leading-snug">
                          {item.question}
                        </h3>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* PDF Export Single */}
                        <a
                          href={savedApi.exportItemPdfUrl(item.id)}
                          download
                          className="rounded-lg p-1.5 text-navy-600 hover:bg-navy-50 hover:text-navy-900 transition-colors"
                          title="Unduh PDF Riset Ini"
                        >
                          <Download className="h-4 w-4" />
                        </a>

                        {/* Edit Note */}
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setEditNoteText(item.note ?? '');
                          }}
                          className="rounded-lg p-1.5 text-navy-600 hover:bg-navy-50 hover:text-navy-900 transition-colors"
                          title="Edit Catatan Pribadi"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteSavedItem(item.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Hapus dari Tersimpan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Personal Note Box */}
                    {item.note && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 leading-relaxed">
                        <span className="font-bold text-amber-950">📌 Catatan Anda: </span>
                        <span>{item.note}</span>
                      </div>
                    )}

                    {/* Grounded Answer Snippet */}
                    <div className="rounded-xl bg-gray-50/70 p-3.5 text-xs text-navy-950 leading-relaxed font-sans border border-gray-100">
                      {renderMarkdown(item.answer)}
                    </div>

                    {/* Citations Row */}
                    {item.citations && item.citations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          Dasar Hukum:
                        </span>
                        {item.citations.map((c, i) => (
                          <CitationChip
                            key={`${c.pasal_chunk_id}-${i}`}
                            citation={c}
                            onClickSource={(cit) => setSelectedCitation(cit)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: RIWAYAT PERCAKAPAN (CHAT HISTORY) */}
        {/* ================================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-fade-in">
            {isLoadingHistory ? (
              <div className="py-16 text-center">
                <Spinner size="md" label="Memuat riwayat percakapan..." />
              </div>
            ) : conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-400">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="font-serif font-bold text-navy-900 text-base">
                  Belum Ada Riwayat Percakapan
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Semua pertanyaan yang Anda ajukan di menu Tanya Hukum akan otomatis tersimpan di sini.
                </p>
                <div className="pt-2">
                  <Link href="/tanya">
                    <Button size="sm" className="bg-navy-600 text-white text-xs gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Mulai Percakapan Baru
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col justify-between rounded-2xl border border-navy-100 bg-white p-5 shadow-xs hover:border-navy-300 transition-all space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] text-gray-400">
                          {new Date(c.updated_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          onClick={() => handleDeleteConversation(c.id)}
                          className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Hapus Percakapan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <h3 className="font-serif font-semibold text-navy-950 text-sm leading-snug line-clamp-2">
                        {c.title}
                      </h3>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
                      <Link href={`/tanya?conversation_id=${c.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-navy-700 hover:text-navy-900 gap-1.5 font-semibold"
                        >
                          <span>Lanjutkan Percakapan</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Create New Folder */}
        {showNewFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-5 border border-navy-100 space-y-4">
              <h3 className="font-serif font-bold text-navy-950 text-base flex items-center gap-2">
                <FolderIcon className="h-4 w-4 text-navy-600" />
                Buat Folder Koleksi Baru
              </h3>
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <input
                  type="text"
                  autoFocus
                  placeholder="Contoh: Perkara PT ABC, Klaster Upah..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs md:text-sm text-navy-950 focus:outline-none focus:ring-1 focus:ring-navy-500"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowNewFolderModal(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newFolderName.trim()}
                    className="bg-navy-600 text-white"
                  >
                    Simpan Folder
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Personal Note */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-5 border border-navy-100 space-y-4">
              <h3 className="font-serif font-bold text-navy-950 text-base flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-navy-600" />
                Edit Catatan Riset
              </h3>
              <form onSubmit={handleUpdateNote} className="space-y-4">
                <textarea
                  rows={4}
                  autoFocus
                  value={editNoteText}
                  onChange={(e) => setEditNoteText(e.target.value)}
                  placeholder="Ketik catatan pribadi atau arahan hukum Anda..."
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs md:text-sm text-navy-950 focus:outline-none focus:ring-1 focus:ring-navy-500 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingItem(null)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" size="sm" className="bg-navy-600 text-white">
                    Perbarui Catatan
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Source Inspector Modal */}
        <SourceModal
          citation={selectedCitation}
          onClose={() => setSelectedCitation(null)}
        />
      </div>
    </AppShell>
  );
}
