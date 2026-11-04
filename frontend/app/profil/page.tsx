/**
 * Profil — View/edit name, institution; change password; submit general feedback; delete account.
 * UU PDP compliant with transparent data deletion confirmation.
 */
'use client';

import { useState } from 'react';
import { User, Lock, MessageSquarePlus, Trash2, Check, AlertCircle, Building2, Mail, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { authApi, feedbackApi } from '@/lib/api';

export default function ProfilPage() {
  const { user, refresh, logout } = useAuth();

  // --- Edit profile ---
  const [name, setName] = useState(user?.name ?? '');
  const [institution, setInstitution] = useState(user?.institution ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // --- Change password ---
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  // --- General Feedback ---
  const [feedbackType, setFeedbackType] = useState<'thumbs_up' | 'thumbs_down'>('thumbs_up');
  const [feedbackCategory, setFeedbackCategory] = useState('lainnya');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // --- Delete account ---
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // --- Toast notification ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 1. Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authApi.updateProfile({ name, institution });
      refresh();
      setToast({ message: 'Profil Anda berhasil diperbarui.', type: 'success' });
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : 'Gagal memperbarui profil.', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  // 2. Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPw.length < 8) {
      setPwError('Password baru harus minimal 8 karakter');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('Konfirmasi password baru tidak cocok');
      return;
    }
    setChangingPw(true);
    try {
      await authApi.changePassword({ current_password: currentPw, new_password: newPw });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setToast({ message: 'Password Anda berhasil diubah.', type: 'success' });
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : 'Gagal mengubah password.', type: 'error' });
    } finally {
      setChangingPw(false);
    }
  };

  // 3. Submit General Feedback
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment.trim()) {
      setToast({ message: 'Silakan tuliskan komentar feedback Anda.', type: 'error' });
      return;
    }
    setSubmittingFeedback(true);
    try {
      await feedbackApi.submit({
        feedback_type: feedbackType,
        reason: feedbackCategory as any,
        comment: feedbackComment,
        is_general: true,
      });
      setFeedbackComment('');
      setToast({ message: 'Terima kasih! Feedback umum Anda telah diterima oleh tim korpus.', type: 'success' });
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : 'Gagal mengirim feedback.', type: 'error' });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // 4. Delete Account (UU PDP)
  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePw) {
      setDeleteError('Password wajib diisi untuk verifikasi penghapusan');
      return;
    }
    setDeleting(true);
    try {
      await authApi.deleteAccount({ password: deletePw });
      logout();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Gagal menghapus akun. Periksa password Anda.');
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-8">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-900">Profil & Pengaturan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola data diri, keamanan akun, dan preferensi riset hukum Anda.
          </p>
        </div>

        {/* 1. Account Information */}
        <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-navy-50 pb-4 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-navy-900">Informasi Pengguna</h2>
              <p className="text-xs text-gray-500">Identitas yang terdaftar pada sistem LexIndo</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nama Lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Budi Santoso, S.H."
                required
              />
              <Input
                label="Instansi / Afiliasi"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="cth. Universitas Indonesia / LBH"
                hint="Opsional — membantu personalisasi riset"
              />
            </div>

            <div className="rounded-xl bg-navy-50/60 p-4 border border-navy-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-navy-400" />
                <div>
                  <div className="text-xs text-gray-500">Alamat Email Terdaftar</div>
                  <div className="text-sm font-medium text-navy-900">{user?.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-navy-500" />
                <span className="rounded-full bg-navy-200/80 px-2.5 py-1 text-xs font-semibold text-navy-800">
                  {user?.role === 'admin' ? '🛡️ Admin Korpus' : '⚖️ Pengguna'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={savingProfile}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </section>

        {/* 2. Change Password */}
        <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-navy-50 pb-4 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-navy-900">Ubah Kata Sandi</h2>
              <p className="text-xs text-gray-500">Perbarui kata sandi Anda secara berkala</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <Input
              label="Kata Sandi Saat Ini"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Kata Sandi Baru"
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
              />
              <Input
                label="Konfirmasi Kata Sandi Baru"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="secondary" isLoading={changingPw}>
                Perbarui Kata Sandi
              </Button>
            </div>
          </form>
        </section>

        {/* 3. General Feedback Form */}
        <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-navy-50 pb-4 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
              <MessageSquarePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-navy-900">Kirim Masukan & Feedback Umum</h2>
              <p className="text-xs text-gray-500">Bantu kami meningkatkan kualitas korpus hukum dan jawaban AI</p>
            </div>
          </div>

          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-xs font-medium text-gray-700">Pengalaman Anda:</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFeedbackType('thumbs_up')}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    feedbackType === 'thumbs_up'
                      ? 'border-green-400 bg-green-50 text-green-800 ring-2 ring-green-200'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  👍 Membantu
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType('thumbs_down')}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    feedbackType === 'thumbs_down'
                      ? 'border-red-400 bg-red-50 text-red-800 ring-2 ring-red-200'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  👎 Perlu Perbaikan
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-navy-800">Kategori Masukan</label>
              <select
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400"
              >
                <option value="lainnya">Saran & Masukan Umum</option>
                <option value="sitasi_salah">Laporan Sitasi / Pasal Kurang Akurat</option>
                <option value="peraturan_tidak_berlaku">Peraturan Belum Diperbarui ke UU Cipta Kerja</option>
                <option value="jawaban_keliru">Interpretasi Hukum Keliru</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-navy-800">Pesan Masukan / Laporan</label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                rows={3}
                placeholder="Tuliskan pengalaman Anda, regulasi yang perlu ditambahkan, atau saran perbaikan..."
                className="rounded-lg border border-gray-300 p-3 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={submittingFeedback}>
                Kirim Masukan
              </Button>
            </div>
          </form>
        </section>

        {/* 4. Danger Zone: Delete Account (UU PDP) */}
        <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
          <div className="flex items-center gap-3 border-b border-red-100 pb-4 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-red-900">Hapus Akun Permanen</h2>
              <p className="text-xs text-red-600">Kepatuhan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</p>
            </div>
          </div>

          <p className="text-xs md:text-sm text-red-800 leading-relaxed mb-4">
            Sesuai hak subjek data dalam UU PDP, Anda berhak meminta penghapusan seluruh data pribadi Anda secara permanen.
            Tindakan ini tidak dapat dibatalkan.
          </p>

          <Button
            variant="danger"
            onClick={() => setDeleteModalOpen(true)}
          >
            Hapus Akun & Seluruh Data Saya
          </Button>
        </section>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteError('');
          setDeletePw('');
        }}
        title="Konfirmasi Penghapusan Akun Permanen"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-red-50 p-3 border border-red-200 text-xs text-red-900 leading-relaxed">
            ⚠️ <strong>Perhatian:</strong> Penghapusan ini bersifat permanen dan tidak dapat dipulihkan.
            Sesuai kepatuhan UU PDP, sistem akan langsung menghapus:
          </div>

          <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside bg-gray-50 p-3 rounded-lg border border-gray-200">
            <li>Identitas profil akun dan sesi login Anda</li>
            <li>Seluruh riwayat sesi tanya-jawab hukum</li>
            <li>Semua dokumen/folder hasil riset yang Anda simpan</li>
            <li>Seluruh riwayat ulasan & feedback yang pernah Anda berikan</li>
          </ul>

          {deleteError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {deleteError}
            </div>
          )}

          <div className="pt-2">
            <Input
              label="Masukkan Kata Sandi Anda untuk Mengonfirmasi"
              type="password"
              value={deletePw}
              onChange={(e) => setDeletePw(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteError('');
                setDeletePw('');
              }}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              isLoading={deleting}
              onClick={handleDeleteAccount}
            >
              Ya, Hapus Akun Secara Permanen
            </Button>
          </div>
        </div>
      </Modal>

      {/* Floating Toast Notification */}
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
