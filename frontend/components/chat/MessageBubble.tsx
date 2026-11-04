/**
 * MessageBubble — renders a single turn (user question or structured assistant legal response).
 */
'use client';

import { Scale, AlertTriangle, ShieldCheck } from 'lucide-react';
import { CitationChip } from './CitationChip';
import { FeedbackButtons } from './FeedbackButtons';
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

          <div className="flex items-center gap-1.5">
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
          </div>
        </div>

        {/* Conflict Warning Banner (BP4) */}
        {conflicts && conflicts.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>Peringatan Konflik Hierarki Hukum (Lex Superior Derogat Legi Inferiori)</span>
            </div>
            {conflicts.map((conf, idx) => (
              <p key={idx} className="text-xs text-amber-800 leading-relaxed pl-6">
                {conf.description} (Ketentuan <strong>{conf.higher_reg}</strong> mengesampingkan <strong>{conf.lower_reg}</strong>).
              </p>
            ))}
          </div>
        )}

        {/* Answer Content */}
        <div className="text-xs md:text-sm text-navy-950 leading-relaxed whitespace-pre-line font-sans">
          {content}
        </div>

        {/* Grounded Citation Chips (BP2) */}
        {citations && citations.length > 0 && (
          <div className="rounded-xl bg-navy-50/50 p-3 border border-navy-100/70 space-y-2">
            <div className="text-[11px] font-bold text-navy-800 uppercase tracking-wider">
              Dasar Hukum Rujukan:
            </div>
            <div className="flex flex-wrap gap-2">
              {citations.map((c, idx) => (
                <CitationChip
                  key={`${c.pasal_chunk_id}-${idx}`}
                  citation={c}
                  onClickSource={onClickSource}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions: Feedback & Refusal info */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <FeedbackButtons messageId={messageId} />
        </div>
      </div>
    </div>
  );
}

