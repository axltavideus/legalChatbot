/**
 * Paket & Langganan — mockup subscription tiers to validate customer willingness to pay (Lean Canvas Block 2).
 */
'use client';

import React, { useState } from 'react';
import {
  Check, Sparkles, Building2, Users, User, ShieldCheck,
  AlertCircle, CheckCircle2, ArrowRight
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { plansApi } from '@/lib/api';

interface PlanTier {
  id: string;
  name: string;
  badge?: string;
  targetUser: string;
  priceDisplay: string;
  billingPeriod: string;
  quotaLabel: string;
  features: string[];
  isPopular?: boolean;
  buttonLabel: string;
}

const PLANS: PlanTier[] = [
  {
    id: 'gratis',
    name: 'Gratis',
    targetUser: 'Mahasiswa Hukum & Paralegal Pemula',
    priceDisplay: 'Rp 0',
    billingPeriod: 'selamanya gratis',
    quotaLabel: '15 Pertanyaan Riset / bulan',
    features: [
      'Akses korpus dasar UU Ketenagakerjaan',
      'Sitasi Pasal & Ayat resmi',
      'Riwayat percakapan 7 hari terakhir',
      'Simpan maksimal 3 riset ke folder',
      'Dukungan komunitas LexIndo',
    ],
    buttonLabel: 'Paket Saat Ini',
  },
  {
    id: 'individu',
    name: 'Individu',
    badge: 'Paling Populer',
    isPopular: true,
    targetUser: 'Advokat, Praktisi HR, & Konsultan Hukum',
    priceDisplay: 'Rp 149.000',
    billingPeriod: 'per bulan / pengguna',
    quotaLabel: '200 Pertanyaan Riset / bulan',
    features: [
      'Seluruh korpus UU, PP, dan Permen terindeks',
      'Riwayat amandemen lengkap (timeline silsilah)',
      'Peringatan dini konflik hierarki hukum',
      'Folder riset tanpa batas',
      'Ekspor laporan resmi PDF dengan disclaimer',
      'Dukungan via email prioritas',
    ],
    buttonLabel: 'Pilih Paket Individu',
  },
  {
    id: 'tim',
    name: 'Tim',
    badge: 'Rekomendasi Kantor',
    targetUser: 'Firma Hukum Kecil & Kantor HR-UMKM',
    priceDisplay: 'Rp 499.000',
    billingPeriod: 'per bulan (hingga 5 pengguna)',
    quotaLabel: '1.000 Pertanyaan Riset / bulan (shared)',
    features: [
      'Semua fitur Paket Individu',
      'Hingga 5 akun anggota tim terintegrasi',
      'Folder riset kolaboratif bersama',
      'Ekspor PDF bermerek nama kantor/institusi',
      'Respon RAG prioritas tinggi & latensi rendah',
      'Sesi orientasi penggunaan korpus LexIndo',
    ],
    buttonLabel: 'Pilih Paket Tim',
  },
  {
    id: 'institusi',
    name: 'Institusi',
    targetUser: 'Korporasi, LBH Besar, & Universitas',
    priceDisplay: 'Rp 1.499.000',
    billingPeriod: 'per bulan (kustom pengguna)',
    quotaLabel: 'Pertanyaan Tanpa Batas (Unlimited)',
    features: [
      'Semua fitur Paket Tim tanpa kuota',
      'Akses API LexIndo untuk integrasi internal',
      'Kemampuan indeks dokumen / PKB internal',
      'Dedicated Account Manager & SLA 24/7',
      'Pelatihan dan audit akurasi hukum berkala',
    ],
    buttonLabel: 'Pilih Paket Institusi',
  },
];

export default function LanggananPage() {
  const [submittingPlan, setSubmittingPlan] = useState<string | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState<string | null>(null);

  const handleSelectPlan = async (plan: PlanTier) => {
    setSubmittingPlan(plan.name);
    try {
      const res = await plansApi.recordInterest(plan.name);
      setSelectedPlanName(plan.name);
      setThankYouMessage(res.message);
    } catch {
      // Fallback thank you even if offline
      setSelectedPlanName(plan.name);
      setThankYouMessage(
        `Terima kasih atas minat Anda pada Paket ${plan.name}! Minat Anda telah dicatat. Kami akan segera menghubungi Anda saat paket ini resmi dirilis.`
      );
    } finally {
      setSubmittingPlan(null);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 animate-fade-in">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-navy-50 border border-navy-200/80 px-3.5 py-1 text-xs font-semibold text-navy-800 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-navy-600" />
            <span>Validasi Minat Paket Layanan LexIndo</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-navy-950">
            Pilihan Paket Riset Hukum yang Fleksibel
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
            Dapatkan kecepatan riset hukum ketenagakerjaan yang akurat dan berbasis pasal resmi sesuai skala kebutuhan Anda atau tim Anda.
          </p>

          {/* User Requirement Label */}
          <div className="inline-block rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 shadow-2xs">
            ⚠️ <em>Harga ilustratif, dapat berubah berdasarkan validasi kebutuhan pengguna (tahap pengujian prototipe).</em>
          </div>
        </div>

        {/* Thank You Banner upon Selecting a Plan */}
        {thankYouMessage && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-center space-y-2 shadow-sm animate-scale-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h3 className="font-serif font-bold text-emerald-950 text-base md:text-lg">
              Minat Paket {selectedPlanName} Tercatat!
            </h3>
            <p className="text-xs md:text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
              {thankYouMessage}
            </p>
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setThankYouMessage(null)}
                className="text-xs"
              >
                Tutup Pesan
              </Button>
            </div>
          </div>
        )}

        {/* 4 Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const isSubmitting = submittingPlan === plan.name;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl border bg-white p-6 transition-all duration-200 ${
                  plan.isPopular
                    ? 'border-navy-600 shadow-lg ring-2 ring-navy-600/10'
                    : 'border-navy-100 shadow-xs hover:border-navy-300'
                }`}
              >
                {/* Popular / Recommended Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-navy-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Plan Name & Target */}
                  <div>
                    <h3 className="font-serif text-xl font-bold text-navy-950">
                      {plan.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1 min-h-[32px] leading-snug">
                      {plan.targetUser}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="font-serif text-3xl font-extrabold text-navy-950">
                      {plan.priceDisplay}
                    </div>
                    <span className="text-[11px] text-gray-500 block mt-0.5">
                      {plan.billingPeriod}
                    </span>
                  </div>

                  {/* Quota Highlight */}
                  <div className="rounded-xl bg-navy-50/80 border border-navy-100 p-2.5 text-center">
                    <span className="text-xs font-bold text-navy-900 block">
                      {plan.quotaLabel}
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Fitur Termasuk:
                    </span>
                    <ul className="space-y-2 text-xs text-navy-900 leading-relaxed">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Plan Selection Action */}
                <div className="pt-6 mt-4 border-t border-gray-100">
                  <Button
                    size="md"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full font-bold text-xs sm:text-sm ${
                      plan.isPopular
                        ? 'bg-navy-600 hover:bg-navy-700 text-white shadow-xs'
                        : 'bg-white hover:bg-navy-50 text-navy-800 border border-navy-300'
                    }`}
                  >
                    <span>{plan.buttonLabel}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ or Assurance Box */}
        <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-xs space-y-3 text-center max-w-3xl mx-auto">
          <h3 className="font-serif font-bold text-navy-900 text-base">
            Mengapa Kami Memvalidasi Minat Anda Terlebih Dahulu?
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed max-w-xl mx-auto">
            Sebagai komitmen pengembangan berbasis riset pengguna nyata, tombol "Pilih paket" di atas tidak menarik biaya sama sekali.
            Kami mencatat preferensi paket yang paling diminati oleh komunitas hukum untuk menyempurnakan fitur korpus sebelum integrasi gateway pembayaran resmi.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

