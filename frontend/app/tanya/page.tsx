/**
 * Tanya Hukum — main Q&A chat page wrapped in AppShell.
 */
'use client';

import { useState } from 'react';
import { Send, Scale, BookOpen, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';

const SUGGESTED_QUESTIONS = [
  'Berapa maksimal masa kontrak PKWT menurut UU Cipta Kerja & PP 35/2021?',
  'Apa saja hak kompensasi pekerja PKWT yang berakhir masa kontraknya?',
  'Bagaimana aturan upah lembur dan perhitungan upah per jam?',
  'Apakah ada perubahan Pasal 59 UU 13/2003 oleh UU Cipta Kerja?',
];

export default function TanyaPage() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const send = async (question: string) => {
    if (!question.trim() || isLoading) return;
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setIsLoading(true);

    // Mock response until Phase 4 RAG pipeline is connected
    await new Promise((r) => setTimeout(r, 800));
    setMessages((m) => [
      ...m,
      {
        role: 'assistant',
        text: 'Layanan tanya-jawab hukum interaktif akan aktif di Phase 4. Struktur layout responsif, sidebar mobile/desktop, dan profil pengguna pada Phase 2 telah aktif sepenuhnya!',
      },
    ]);
    setIsLoading(false);
  };

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="border-b border-navy-100 bg-white px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl font-bold text-navy-900">Tanya Hukum Ketenagakerjaan</h1>
            <p className="text-xs text-gray-500">
              Jawaban dirujuk dari korpus UU 13/2003, UU Cipta Kerja, dan PP 35/2021
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Korpus Terindeks
          </div>
        </header>

        {/* Chat / Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[420px] gap-6 text-center max-w-xl mx-auto py-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-50 text-navy-600 ring-8 ring-navy-50/60 shadow-xs">
                <Scale className="h-8 w-8" />
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold text-navy-900">
                  Selamat Datang{user ? `, ${user.name.split(' ')[0]}` : ''}!
                </h2>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Ketik pertanyaan Anda seputar hukum ketenagakerjaan di bawah, atau pilih salah satu contoh pertanyaan riset berikut:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="flex items-start gap-2.5 rounded-xl border border-navy-200 bg-white p-3 text-xs md:text-sm text-navy-800 hover:border-navy-400 hover:bg-navy-50/60 transition-all shadow-2xs group"
                  >
                    <Sparkles className="h-4 w-4 text-navy-400 group-hover:text-navy-600 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-snug">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-navy-600 text-white shadow-xs'
                      : 'bg-white border border-navy-100 text-navy-900 shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-navy-100 bg-white px-5 py-3.5 shadow-xs">
                <Spinner size="sm" label="Menelusuri Pasal & Ayat dalam korpus..." />
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-navy-100 bg-white p-3 md:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 max-w-4xl mx-auto"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ajukan pertanyaan hukum Anda (tekan Enter untuk mengirim)..."
              rows={2}
              className="flex-1 resize-none rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 transition-colors"
            />
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!input.trim()}
              size="lg"
              className="h-[52px] px-5"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
