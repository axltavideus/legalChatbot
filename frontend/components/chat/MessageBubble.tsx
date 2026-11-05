/**
 * MessageBubble — renders a single turn (user question or structured assistant legal response).
 * Phase 5: Integrates AmendmentTimeline (BP3) and ConflictBanner (BP4).
 */
'use client';

import { useState } from 'react';
import { ShieldCheck, Bookmark } from 'lucide-react';
import { CitationChip } from './CitationChip';
import { FeedbackButtons } from './FeedbackButtons';
import AmendmentTimeline from './AmendmentTimeline';
import ConflictBanner from './ConflictBanner';
import { SaveModal } from './SaveModal';
import { renderMarkdown } from '@/lib/renderMarkdown';
import type { Citation, Conflict } from '@/lib/types';
export interface MessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  status_flags?: string[];
  conflicts?: Conflict[];
  messageId?: number;
  onClickSource: (citation: Citation) => void;
}

export function MessageBubble({
  role,
  content,
  citations,
  status_flags,
  conflicts,
  messageId,
  onClickSource,
}: MessageProps) {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const isUser = role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-2xl rounded-2xl rounded-tr-xs bg-navy-600 px-4 py-3 text-sm text-white shadow-xs leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  // Assistant Legal Turn
  const isRefusal = status_flags?.includes('tidak_ditemukan');

  // Determine whether any citation has been amended (for status badge)
  const hasAmended = citations?.some((c) => c.status === 'diubah' || c.status === 'dicabut');
  const hasConflicts = conflicts && conflicts.length > 0;

  return (
    <div className="flex justify-start animate-fade-in">
      <div className="w-full max-w-3xl rounded-2xl rounded-tl-xs border border-navy-100 bg-white p-4 md:p-5 shadow-xs space-y-4">
        {/* Assistant Header */}
        <div className="flex items-center justify-between border-b border-navy-50 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-navy-100 text-xs text-navy-800">
              ⚖️
            </span>
            <span className="font-serif text-xs md:text-sm font-bold text-navy-900">
              Asisten Riset LexIndo
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {isRefusal ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                Di Luar Korpus
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                <ShieldCheck className="h-3 w-3" />
                Terverifikasi Korpus
              </span>
            )}
            {hasAmended && !isRefusal && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                Ada Perubahan
              </span>
            )}
            {hasConflicts && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-semibold text-red-800">
                ⚠️ Konflik Terdeteksi
              </span>
            )}
          </div>
        </div>

        {/* BP4: Hierarchy Conflict Warning Banner */}
        {hasConflicts && (
          <ConflictBanner conflicts={conflicts as any[]} />
        )}

        {/* Answer Content — rendered with inline markdown (bold, italic, code) */}
        <div className="text-xs md:text-sm text-navy-950 leading-relaxed font-sans space-y-1">
          {renderMarkdown(content)}
        </div>

        {/* BP2 + BP3: Grounded Citation Chips with Amendment Timelines */}
        {citations && citations.length > 0 && (
          <div className="rounded-xl bg-navy-50/50 p-3 border border-navy-100/70 space-y-3">
            <div className="text-[11px] font-bold text-navy-800 uppercase tracking-wider">
              Dasar Hukum Rujukan:
            </div>
            {/* Citation chips row */}
            <div className="flex flex-wrap gap-2">
              {citations.map((c, idx) => (
                <CitationChip
                  key={`${c.pasal_chunk_id}-${idx}`}
                  citation={c}
                  onClickSource={onClickSource}
                />
              ))}
            </div>
            {/* BP3: Amendment timelines — one per citation that has been amended */}
            {citations.map((c, idx) => {
              if (!c.amendment_timeline) return null;
              return (
                <AmendmentTimeline
                  key={`timeline-${c.pasal_chunk_id}-${idx}`}
                  timeline={c.amendment_timeline}
                />
              );
            })}
            {/* Show amendment upgrade note if present */}
            {citations.some((c) => c.note) && (
              <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {citations
                  .filter((c) => c.note)
                  .map((c, i) => (
                    <p key={i}>📌 {c.note}</p>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions: Feedback & Save Research */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <FeedbackButtons messageId={messageId} />

          {messageId && !isRefusal && (
            <button
              onClick={() => setIsSaveModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-2.5 py-1 text-xs font-medium text-navy-700 hover:border-navy-400 hover:bg-navy-50/70 transition-colors shadow-2xs"
              title="Simpan ke Folder Riset"
            >
              <Bookmark className="h-3.5 w-3.5 text-navy-600" />
              <span>Simpan Riset</span>
            </button>
          )}
        </div>

        {/* Save Research Modal */}
        <SaveModal
          isOpen={isSaveModalOpen}
          messageId={messageId}
          onClose={() => setIsSaveModalOpen(false)}
        />
      </div>
    </div>
  );
}
