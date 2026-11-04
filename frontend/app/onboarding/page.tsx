/**
 * Onboarding Wizard — 4 interactive screens shown after registration.
 * Skippable, persistent progress dots, visual previews, and disclaimer acknowledgment.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  FileCheck2,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Scale,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { authApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function OnboardingPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await authApi.completeOnboarding();
      refresh();
      router.push('/tanya');
    } catch {
      router.push('/tanya');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await authApi.completeOnboarding();
      refresh();
      router.push('/tanya');
    } catch {
      router.push('/tanya');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 p-4 md:p-8">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 md:p-10 shadow-2xl transition-all">
        {/* Top bar: Brand + Step Indicator + Skip */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <span className="font-serif text-lg font-bold text-navy-900">LexIndo</span>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((stepIndex) => (
              <div
                key={stepIndex}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentStep === stepIndex
                    ? 'w-8 bg-navy-600'
                    : stepIndex < currentStep
                    ? 'w-2.5 bg-navy-300'
                    : 'w-2.5 bg-gray-200'
                }`}
                aria-label={`Langkah ${stepIndex + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="text-xs font-medium text-gray-400 hover:text-navy-600 transition-colors"
          >
            Lewati
          </button>
        </div>

        {/* Step Content Area */}
        <div className="py-8 min-h-[380px] flex flex-col justify-center">
          {/* STEP 1: Welcome & Overview */}
          {currentStep === 0 && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-50 text-navy-600 ring-8 ring-navy-50/50">
                <Scale className="h-8 w-8" />
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-900">
                Selamat Datang di LexIndo
              </h1>
              <p className="mt-3 max-w-lg text-sm md:text-base text-gray-600 leading-relaxed">
                Asisten kecerdasan buatan berbasis <strong>Retrieval-Augmented Generation (RAG)</strong> yang
                dirancang khusus untuk riset peraturan perundang-undangan Republik Indonesia.
              </p>

              {/* Scope highlights */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
                <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-3.5">
                  <BookOpen className="h-5 w-5 text-navy-600 mb-2" />
                  <div className="font-semibold text-xs text-navy-900">Fokus Ketenagakerjaan</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">UU 13/2003, UU Cipta Kerja, PP 35/2021</div>
                </div>
                <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-3.5">
                  <FileCheck2 className="h-5 w-5 text-green-600 mb-2" />
                  <div className="font-semibold text-xs text-navy-900">100% Berbasis Dokumen</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Hanya menjawab dari regulasi resmi</div>
                </div>
                <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-3.5">
                  <GitBranch className="h-5 w-5 text-amber-600 mb-2" />
                  <div className="font-semibold text-xs text-navy-900">Deteksi Perubahan</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Lacak Pasal yang berlaku vs diubah</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Grounded Citations */}
          {currentStep === 1 && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
                <FileCheck2 className="h-8 w-8" />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-navy-900">
                Jawaban dari Sumber Resmi
              </h2>
              <p className="mt-2 max-w-lg text-sm text-gray-600">
                LexIndo tidak pernah mengarang hukum bebas. Setiap kesimpulan terikat langsung dengan teks asli Pasal dan Ayat.
              </p>

              {/* Visual preview of a grounded citation card */}
              <div className="mt-6 w-full max-w-lg rounded-2xl border border-navy-200 bg-navy-50/40 p-4 text-left shadow-xs">
                <div className="text-xs font-semibold text-navy-600 mb-1">Contoh Pratinjau Jawaban:</div>
                <p className="text-sm text-navy-900 leading-snug">
                  "Jangka waktu Perjanjian Kerja Waktu Tertentu (PKWT) dapat diadakan untuk paling lama 5 (lima) tahun..."
                </p>

                {/* Grounded Citation Chips */}
                <div className="mt-3 pt-3 border-t border-navy-100 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-navy-700">Dasar Hukum:</span>
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-navy-300 bg-white px-2.5 py-1 text-xs font-medium text-navy-800 shadow-2xs">
                    <span>📜 UU 13/2003 Pasal 59 ayat (1)</span>
                    <Badge variant="diubah" className="text-[10px] py-0 px-1.5">Diubah</Badge>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-900 shadow-2xs">
                    <span>📜 PP 35/2021 Pasal 8 ayat (1)</span>
                    <Badge variant="berlaku" className="text-[10px] py-0 px-1.5">Berlaku</Badge>
                  </div>
                </div>

                <div className="mt-2 text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-navy-600 hover:underline cursor-pointer">
                    Lihat teks asli sumber <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Status Berlaku & Conflict Warning */}
          {currentStep === 2 && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
                <GitBranch className="h-8 w-8" />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-navy-900">
                Status Berlaku & Hierarki Peraturan
              </h2>
              <p className="mt-2 max-w-lg text-sm text-gray-600">
                Sistem menandai regulasi yang telah diubah atau dicabut, serta mendeteksi konflik hierarki norma perundang-undangan secara otomatis.
              </p>

              {/* Visual preview of status flags + conflict banner */}
              <div className="mt-6 w-full max-w-lg space-y-3 text-left">
                {/* Status Badges Preview */}
                <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 p-3 border border-gray-200">
                  <span className="text-xs font-semibold text-gray-700">Tiga Status Norma:</span>
                  <Badge variant="berlaku">Berlaku</Badge>
                  <Badge variant="diubah">Diubah</Badge>
                  <Badge variant="dicabut">Dicabut</Badge>
                </div>

                {/* Conflict Banner Preview */}
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-900">Peringatan Konflik Hierarki Hukum (BP4)</div>
                      <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
                        Ditemukan perbedaan ketentuan antara <strong>UU 13/2003</strong> dan <strong>Permen Tenaga Kerja</strong>.
                        Berdasarkan asas <em>Lex Superior Derogat Legi Inferiori</em>, ketentuan Undang-Undang yang memiliki hierarki lebih tinggi diutamakan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Legal Disclaimer & Acknowledgement */}
          {currentStep === 3 && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/50">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-navy-900">
                Pernyataan Penyangkalan (Disclaimer)
              </h2>
              <p className="mt-2 max-w-lg text-sm text-gray-600">
                Harap baca dan setujui batasan penggunaan LexIndo sebelum Anda mulai melakukan riset.
              </p>

              {/* Disclaimer Box */}
              <div className="mt-5 w-full rounded-2xl border border-red-200 bg-red-50/60 p-4 text-left">
                <ul className="space-y-2 text-xs md:text-sm text-red-900">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>Bukan Nasihat Hukum:</strong> LexIndo adalah alat bantu riset hukum digital, bukan advokat atau konsultan hukum profesional.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>Kewajiban Verifikasi:</strong> Jawaban yang dihasilkan harus diverifikasi silang ke naskah resmi pemerintah (JDIH / peraturan.go.id).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>Batasan Tanggung Jawab:</strong> Pengembang tidak bertanggung jawab atas keputusan hukum atau sengketa yang diambil semata-mata atas dasar keluaran sistem.</span>
                  </li>
                </ul>
              </div>

              {/* Mandatory Checkbox */}
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-navy-300 bg-navy-50/60 p-4 text-left hover:bg-navy-50 transition-colors">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-navy-400 text-navy-600 focus:ring-navy-500 accent-navy-600 cursor-pointer"
                />
                <span className="text-xs md:text-sm font-medium text-navy-900 leading-snug">
                  Saya memahami dan menyetujui bahwa <strong>LexIndo adalah alat bantu riset, bukan nasihat hukum</strong>, dan saya akan memverifikasi jawaban dengan sumber resmi pemerintah.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-5">
          {currentStep > 0 ? (
            <Button
              variant="secondary"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Kembali
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {currentStep < 3 ? (
              <Button onClick={() => setCurrentStep((prev) => Math.min(3, prev + 1))}>
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!acknowledged}
                isLoading={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Mulai Gunakan LexIndo
              </Button>
            )}
          </div>
        </div>

        {/* Step Counter */}
        <div className="mt-4 text-center text-xs text-gray-400">
          Langkah {currentStep + 1} dari 4
        </div>
      </div>
    </main>
  );
}
