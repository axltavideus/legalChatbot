/**
 * SaveModal — modal to save an assistant research response into a named folder with a personal note (BP5).
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark, FolderPlus, X, Check, Folder as FolderIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { savedApi } from '@/lib/api';
import type { Folder } from '@/lib/types';

interface SaveModalProps {
  isOpen: boolean;
  messageId: number | undefined;
  onClose: () => void;
  onSaved?: () => void;
}

export function SaveModal({ isOpen, messageId, onClose, onSaved }: SaveModalProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [note, setNote] = useState('');
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing folders when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setError(null);
      setShowNewFolderInput(false);
      setNewFolderName('');
      setNote('');

      const fetchFolders = async () => {
        setIsLoadingFolders(true);
        try {
          const res = await savedApi.listFolders();
          setFolders(res);
          if (res.length > 0) {
            setSelectedFolderId(res[0].id);
          }
        } catch {
          // If fail, just continue with empty folders
        } finally {
          setIsLoadingFolders(false);
        }
      };
      fetchFolders();
    }
  }, [isOpen]);

  if (!isOpen || !messageId) return null;

  const handleCreateNewFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const created = await savedApi.createFolder(newFolderName.trim());
      setFolders((prev) => [created, ...prev]);
      setSelectedFolderId(created.id);
      setNewFolderName('');
      setShowNewFolderInput(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat folder');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // If user typed a new folder without pressing add, create it first
      let targetFolderId = selectedFolderId;
      if (showNewFolderInput && newFolderName.trim()) {
        const created = await savedApi.createFolder(newFolderName.trim());
        targetFolderId = created.id;
      }

      await savedApi.saveItem({
        message_id: messageId,
        folder_id: targetFolderId,
        note: note.trim() || undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        if (onSaved) onSaved();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan riset');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden border border-navy-100 animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-navy-50 bg-navy-50/50 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-600 text-white shadow-2xs">
              <Bookmark className="h-4 w-4" />
            </span>
            <h3 className="font-serif font-bold text-navy-950 text-base">
              Simpan Hasil Riset
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {isSuccess ? (
            <div className="py-8 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-6 w-6 stroke-[3]" />
              </div>
              <p className="font-semibold text-emerald-900 text-sm">
                Riset Berhasil Disimpan!
              </p>
              <p className="text-xs text-gray-500">
                Dapat dilihat dan diekspor ke PDF di menu Riwayat & Tersimpan.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              {/* Folder Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-navy-900 flex items-center gap-1.5">
                    <FolderIcon className="h-3.5 w-3.5 text-navy-600" />
                    Pilih Folder Koleksi
                  </label>
                  {!showNewFolderInput && (
                    <button
                      type="button"
                      onClick={() => setShowNewFolderInput(true)}
                      className="text-xs text-navy-700 hover:text-navy-900 font-medium flex items-center gap-1 hover:underline"
                    >
                      <Plus className="h-3 w-3" />
                      Folder Baru
                    </button>
                  )}
                </div>

                {showNewFolderInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nama folder baru..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="flex-1 rounded-lg border border-navy-300 px-3 py-1.5 text-xs text-navy-950 focus:outline-none focus:ring-1 focus:ring-navy-600"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateNewFolder}
                      disabled={!newFolderName.trim()}
                      className="text-xs bg-navy-600 text-white"
                    >
                      Tambah
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewFolderInput(false)}
                      className="text-xs text-gray-500"
                    >
                      Batal
                    </Button>
                  </div>
                ) : (
                  <select
                    value={selectedFolderId ?? ''}
                    onChange={(e) =>
                      setSelectedFolderId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs md:text-sm text-navy-950 focus:outline-none focus:ring-1 focus:ring-navy-500 bg-white"
                  >
                    <option value="">(Tanpa Folder / Koleksi Umum)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name} ({f.items_count ?? 0} riset)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Personal Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-navy-900">
                  Catatan Pribadi (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tambahkan konteks riset, nama klien/perkara, atau pertimbangan hukum Anda..."
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs md:text-sm text-navy-950 focus:outline-none focus:ring-1 focus:ring-navy-500 resize-none bg-white"
                />
                <p className="text-[11px] text-gray-500">
                  Catatan ini akan ikut tercetak saat koleksi diekspor ke PDF.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  isLoading={isSaving}
                  className="bg-navy-600 hover:bg-navy-700 text-white gap-1.5"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  Simpan Riset
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
