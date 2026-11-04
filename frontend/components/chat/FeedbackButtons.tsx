/**
 * FeedbackButtons — inline thumbs up/down feedback widget on assistant answers.
 */
'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check, X } from 'lucide-react';
import { feedbackApi } from '@/lib/api';
import type { FeedbackReason } from '@/lib/types';

interface FeedbackButtonsProps {
  messageId?: number;
}

export function FeedbackButtons({ messageId }: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showReasonModal, setShowReasonModal] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<FeedbackReason>('jawaban_keliru');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleThumbsUp = async () => {
    if (submitted) return;
    try {
      await feedbackApi.submit({
        message_id: messageId,
        feedback_type: 'thumbs_up',
      });
      setSubmitted(true);
    } catch {}
  };

  const handleOpenNegativeModal = () => {
    if (submitted) return;
    setShowReasonModal(true);
  };

  const handleSendNegativeFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await feedbackApi.submit({
        message_id: messageId,
        feedback_type: 'thumbs_down',
        reason: selectedReason,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
      setShowReasonModal(false);
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="inline-flex items-center gap-1.5 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-0.5">
        <Check className="h-3 w-3" />
        <span>Terima kasih atas feedback Anda!</span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <span className="text-[11px] text-gray-400">Apakah jawaban ini membantu?</span>
      <button
        onClick={handleThumbsUp}
        className="rounded-md p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
        title="Jawaban akurat & membantu"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={handleOpenNegativeModal}
        className="rounded-md p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Laporkan sitasi salah / jawaban keliru"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>

      {/* Popover / Reason Form */}
      {showReasonModal && (
        <div className="absolute bottom-7 left-0 z-30 w-72 rounded-xl border border-gray-200 bg-white p-3.5 shadow-xl text-xs space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between font-semibold text-navy-900 pb-1 border-b border-gray-100">
            <span>Laporkan Masalah Jawaban</span>
            <button onClick={() => setShowReasonModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSendNegativeFeedback} className="space-y-2">
            <div>
              <label className="text-[11px] font-medium text-gray-700 block mb-1">Alasan Keliru:</label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value as FeedbackReason)}
                className="w-full rounded-lg border border-gray-300 p-1.5 text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-400"
              >
                <option value="sitasi_salah">Sitasi Pasal/Ayat salah</option>
                <option value="jawaban_keliru">Jawaban/interpretasi keliru</option>
                <option value="peraturan_tidak_berlaku">Peraturan sudah tidak berlaku</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Komentar tambahan (opsional)..."
                className="w-full rounded-lg border border-gray-300 p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-navy-400"
              />
            </div>

            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setShowReasonModal(false)}
                className="rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-navy-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-navy-700"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

