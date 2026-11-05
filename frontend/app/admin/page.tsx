/**
 * Admin Dashboard — 6 KPI metric cards for LexIndo operations.
 * Shows demo data with a "⚠️ Data Contoh" badge when real data is unavailable.
 * Protected: admin role only.
 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, MessageSquareText, Users, ThumbsDown,
  BookOpen, Cpu, CreditCard, ShieldAlert, RefreshCw,
  TrendingUp, AlertTriangle, Database, Coins, BarChart3
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { adminDashboardApi } from '@/lib/api';
import type { DashboardMetrics } from '@/lib/types';

/* ── Helper badge for demo data ─────────────────────────────────── */
function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
      <AlertTriangle className="h-2.5 w-2.5" />
      Data Contoh
    </span>
  );
}

/* ── Thin bar component for simple bar charts ───────────────────── */
function MiniBar({ value, max, label, sub }: { value: number; max: number; label: string; sub?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs text-gray-600">
        <span className="font-medium truncate max-w-[70%]">{label}</span>
        <span className="font-semibold tabular-nums">{value.toLocaleString('id-ID')}{sub}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-navy-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Metric card wrapper ────────────────────────────────────────── */
function MetricCard({
  icon: Icon,
  title,
  isDemo,
  children,
  className = '',
}: {
  icon: React.ElementType;
  title: string;
  isDemo?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white shadow-sm p-5 flex flex-col gap-4 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        {isDemo && <DemoBadge />}
      </div>
      {children}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  /* ── Role guard ─── */
  if (user && user.role !== 'admin') {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <ShieldAlert className="h-16 w-16 text-red-400" />
          <h1 className="text-xl font-semibold text-gray-800">Akses Ditolak</h1>
          <p className="text-sm text-gray-500">Halaman ini hanya untuk Administrator.</p>
          <Link href="/tanya">
            <Button variant="secondary">Kembali ke Beranda</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const loadMetrics = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await adminDashboardApi.getMetrics();
      setMetrics(data);
      setLastRefreshed(new Date());
    } catch {
      setError('Gagal memuat data metrik. Periksa koneksi atau coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (user) loadMetrics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* ── Helpers ─── */
  const maxAnswers = metrics
    ? Math.max(...(metrics.answers_weekly.data.map((d) => d.answers)), 1)
    : 1;
  const maxPlanCount = metrics
    ? Math.max(...(metrics.plan_interest.data.map((d) => d.count)), 1)
    : 1;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy-100 text-navy-700">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-navy-900">Dashboard Admin</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Metrik operasional LexIndo
                {lastRefreshed && (
                  <span> · Diperbarui {lastRefreshed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/admin/korpus">
              <Button variant="secondary">
                <Database className="h-4 w-4 mr-1.5" />
                Kelola Korpus
              </Button>
            </Link>
            <Link href="/admin/feedback">
              <Button variant="secondary">
                <ThumbsDown className="h-4 w-4 mr-1.5" />
                Kelola Feedback
              </Button>
            </Link>
            <Button variant="primary" onClick={loadMetrics} isLoading={isLoading}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Muat Ulang
            </Button>
          </div>
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Loading state ── */}
        {isLoading && !metrics && (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {/* ── Metric grid ── */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {/* (a) Jawaban & Sitasi per Minggu */}
            <MetricCard
              icon={MessageSquareText}
              title="Jawaban & Sitasi per Minggu"
              isDemo={metrics.answers_weekly.is_demo_data}
              className="md:col-span-2 xl:col-span-2"
            >
              {metrics.answers_weekly.data.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Belum ada data.</p>
              ) : (
                <div className="space-y-3">
                  {metrics.answers_weekly.data.map((row) => (
                    <div key={row.week} className="space-y-1">
                      <div className="flex justify-between text-[11px] text-gray-500">
                        <span className="font-medium">{row.week}</span>
                        <span className="text-navy-600 font-semibold">{row.citations} sitasi</span>
                      </div>
                      <MiniBar value={row.answers} max={maxAnswers} label={`${row.answers} jawaban`} />
                    </div>
                  ))}
                </div>
              )}
              {metrics.answers_weekly.is_demo_data && (
                <p className="text-[10px] text-amber-600 italic">
                  ⚠️ Angka di atas adalah data contoh ilustratif. Data nyata akan muncul setelah ada aktivitas pengguna.
                </p>
              )}
            </MetricCard>

            {/* (b) Pengguna Aktif & Retensi */}
            <MetricCard
              icon={Users}
              title="Pengguna Aktif & Retensi"
              isDemo={metrics.users_retention.is_demo_data}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-navy-50 p-3 text-center">
                    <p className="text-2xl font-bold text-navy-800 tabular-nums">
                      {metrics.users_retention.total_registered.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] text-navy-600 mt-0.5">Total Terdaftar</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                      {metrics.users_retention.weekly_active_users.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">Aktif Minggu Ini</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Tingkat Retensi Mingguan</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">{metrics.users_retention.retention_rate}</span>
                </div>
              </div>
              {metrics.users_retention.is_demo_data && (
                <p className="text-[10px] text-amber-600 italic">
                  ⚠️ Data contoh. Retensi dihitung: WAU ÷ Total Terdaftar.
                </p>
              )}
            </MetricCard>

            {/* (c) Tingkat Feedback Negatif */}
            <MetricCard
              icon={ThumbsDown}
              title="Tingkat Feedback Negatif"
              isDemo={metrics.negative_feedback.is_demo_data}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {metrics.negative_feedback.total_feedbacks.toLocaleString('id-ID')} total feedback
                  </span>
                  <span className="text-lg font-bold text-red-600">
                    {metrics.negative_feedback.negative_rate}
                  </span>
                </div>
                {metrics.negative_feedback.reasons.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Belum ada feedback negatif.</p>
                ) : (
                  <div className="space-y-2.5">
                    {metrics.negative_feedback.reasons.map((r) => (
                      <div key={r.reason} className="space-y-0.5">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span className="capitalize">{r.reason.replace(/_/g, ' ')}</span>
                          <span className="font-semibold tabular-nums">{r.count} ({r.percentage})</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-red-400 transition-all duration-500"
                            style={{ width: r.percentage }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {metrics.negative_feedback.is_demo_data && (
                <p className="text-[10px] text-amber-600 italic">⚠️ Data contoh ilustratif.</p>
              )}
            </MetricCard>

            {/* (d) Inventori Korpus */}
            <MetricCard
              icon={BookOpen}
              title="Inventori Korpus Hukum"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-center">
                    <p className="text-2xl font-bold text-blue-800 tabular-nums">
                      {metrics.corpus_inventory.regulations_count.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] text-blue-600 mt-0.5">Peraturan</p>
                  </div>
                  <div className="rounded-xl bg-indigo-50 p-3 text-center">
                    <p className="text-2xl font-bold text-indigo-800 tabular-nums">
                      {metrics.corpus_inventory.pasal_chunks_count.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] text-indigo-600 mt-0.5">Pasal Ter-index</p>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-[11px] text-gray-500">
                    <span className="font-semibold text-gray-700">Kluster Utama:</span>{' '}
                    {metrics.corpus_inventory.labor_law_cluster}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 italic">
                Data langsung dari database — selalu real-time.
              </p>
            </MetricCard>

            {/* (e) Penggunaan LLM & Estimasi Biaya */}
            <MetricCard
              icon={Cpu}
              title="Penggunaan LLM & Estimasi Biaya"
              isDemo={metrics.llm_usage.is_demo_data}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-purple-50 p-2.5 text-center">
                    <p className="text-xl font-bold text-purple-800 tabular-nums">
                      {metrics.llm_usage.total_calls.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[9px] text-purple-600 mt-0.5 leading-tight">Total Panggilan LLM</p>
                  </div>
                  <div className="rounded-xl bg-violet-50 p-2.5 text-center">
                    <p className="text-xl font-bold text-violet-800 tabular-nums">
                      {(metrics.llm_usage.total_tokens / 1000).toFixed(1)}K
                    </p>
                    <p className="text-[9px] text-violet-600 mt-0.5 leading-tight">Total Token</p>
                  </div>
                  <div className="rounded-xl bg-fuchsia-50 p-2.5 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <Coins className="h-3 w-3 text-fuchsia-700" />
                      <p className="text-xl font-bold text-fuchsia-800 tabular-nums">
                        {metrics.llm_usage.estimated_cost_usd}
                      </p>
                    </div>
                    <p className="text-[9px] text-fuchsia-600 mt-0.5 leading-tight">Est. Biaya (USD)</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 italic leading-relaxed">
                  Estimasi berbasis harga Gemini Flash. Bukan tagihan resmi Google Cloud.
                </p>
              </div>
              {metrics.llm_usage.is_demo_data && (
                <p className="text-[10px] text-amber-600 italic">⚠️ Data contoh. Log nyata tersimpan di tabel usage_logs.</p>
              )}
            </MetricCard>

            {/* (f) Minat Paket Langganan */}
            <MetricCard
              icon={CreditCard}
              title="Minat Paket Langganan"
              isDemo={metrics.plan_interest.is_demo_data}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Total Ekspresi Minat</span>
                  <span className="text-lg font-bold text-navy-800 tabular-nums">
                    {metrics.plan_interest.total_interest.toLocaleString('id-ID')}
                  </span>
                </div>
                {metrics.plan_interest.data.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Belum ada yang memilih paket.</p>
                ) : (
                  <div className="space-y-2.5">
                    {metrics.plan_interest.data.map((p) => (
                      <MiniBar
                        key={p.plan}
                        value={p.count}
                        max={maxPlanCount}
                        label={p.plan}
                        sub={` (${p.pct})`}
                      />
                    ))}
                  </div>
                )}
              </div>
              {metrics.plan_interest.is_demo_data && (
                <p className="text-[10px] text-amber-600 italic">⚠️ Data contoh. Data nyata tersimpan di tabel plan_interests.</p>
              )}
            </MetricCard>

          </div>
        )}

        {/* ── Footer note ── */}
        <p className="text-center text-xs text-gray-400 pb-6">
          ⚖️ Dashboard ini hanya untuk penggunaan internal admin. Data sensitif tidak ditampilkan ke publik.
        </p>
      </div>
    </AppShell>
  );
}

