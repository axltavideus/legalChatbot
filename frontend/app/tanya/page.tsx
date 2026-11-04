/**
 * Tanya Hukum — Legal Q&A Chat Center with Grounded RAG Citations (BP2).
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Scale, Sparkles, PlusCircle, AlertCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { SourceModal } from '@/components/chat/SourceModal';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import type { Citation } from '@/lib/types';

const SUGGESTED_QUESTIONS = [
  'Berapa maksimal masa kontrak PKWT menurut UU Cipta Kerja & PP 35/2021?',
  'Apa hak uang kompensasi bagi pekerja yang hubungan kerjanya berdasarkan PKWT?',
  'Bagaimana perlindungan hak atas upah yang layak menurut UU 13/2003?',
  'Bagaimana cara memasak rendang daging sapi padang? (Uji Tolakan RAG)',
];

export default function TanyaPage() {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState('');
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    await sendMessage(text);
  };

  const handleSelectSuggested = async (questionText: string) => {
    if (isLoading) return;
    await sendMessage(questionText);
  };

  return (
    <AppShell>
      <div className="flex h-full flex-col bg-gray-50/50">
        {/* Chat Header Bar */}
        <header className="flex h-14 items-center justify-between border-b border-navy-100 bg-white px-4 md:px-6 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚖️</span>
            <div>
              <h1 className="font-serif text-sm md:text-base font-bold text-navy-900 leading-none">
                Tanya Hukum Ketenagakerjaan
              </h1>
              <p className="text-[10px] md:text-xs text-navy-500 mt-0.5">
                Riset terverifikasi korpus UU 13/2003, UU Cipta Kerja, dan PP 35/2021
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-xs text-navy-600 gap-1.5"
                title="Mulai percakapan baru"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Percakapan Baru</span>
              </Button>
            )}

            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Korpus Aktif
            </div>
          </div>
        </header>

        {/* Message Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 ? (
            /* Empty State: Welcome Hero & Suggested Questions */
            <div className="flex flex-col items-center justify-center min-h-[460px] gap-6 text-center max-w-xl mx-auto py-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-50 text-navy-600 ring-8 ring-navy-50/60 shadow-xs">
                <Scale className="h-8 w-8" />
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold text-navy-900">
                  Selamat Datang{user ? `, ${user.name.split(' ')[0]}` : ''}!
                </h2>
                <p className="mt-2 text-xs md:text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                  Ajukan pertanyaan seputar hukum ketenagakerjaan. Sistem akan mencari naskah Pasal dan Ayat terkait,
                  memverifikasi status keberlakuan, dan memberikan jawaban dengan sitasi yang tepat.
                </p>
              </div>

              {/* Suggested Questions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggested(q)}
                    className="flex items-start gap-2.5 rounded-xl border border-navy-200 bg-white p-3 text-xs md:text-sm text-navy-800 hover:border-navy-400 hover:bg-navy-50/60 transition-all shadow-2xs group"
                  >
                    <Sparkles className="h-4 w-4 text-navy-400 group-hover:text-navy-600 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-snug">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Conversation Turn List */
            messages.map((msg) => {
              if (msg.isLoading) {
                return (
                  <div key={msg.id} className="flex justify-start animate-fade-in">
                    <div className="rounded-2xl rounded-tl-xs border border-navy-100 bg-white px-5 py-4 shadow-xs">
                      <Spinner size="sm" label="Menelusuri naskah Pasal & Ayat dalam korpus..." />
                    </div>
                  </div>
                );
              }

              if (msg.error) {
                return (
                  <div key={msg.id} className="flex justify-start animate-fade-in">
                    <div className="rounded-2xl rounded-tl-xs border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{msg.error}</span>
                    </div>
                  </div>
                );
              }

              return (
                <MessageBubble
                  key={msg.id}
                  id={msg.id}
                  role={msg.role}
                  content={msg.content}
                  citations={msg.citations}
                  status_flags={msg.status_flags}
                  conflicts={msg.conflicts}
                  messageId={msg.message_id}
                  onClickSource={(citation) => setSelectedCitation(citation)}
                />
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-navy-100 bg-white p-3 md:p-4 shadow-xs">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 max-w-4xl mx-auto"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ajukan pertanyaan hukum ketenagakerjaan Anda (tekan Enter untuk mengirim)..."
              rows={2}
              className="flex-1 resize-none rounded-xl border border-gray-300 p-3 text-xs md:text-sm text-navy-950 focus:outline-none focus:ring-2 focus:ring-navy-400 transition-colors bg-white shadow-2xs"
            />
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!input.trim()}
              size="lg"
              className="h-[52px] px-5 bg-navy-600 hover:bg-navy-700 text-white font-semibold shadow-xs"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Official Legal Source Modal */}
      <SourceModal
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />
    </AppShell>
  );
}
