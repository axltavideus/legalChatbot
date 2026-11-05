/**
 * LexIndo Public Landing Page (Lean Canvas Block 1).
 */
import Link from 'next/link';
import {
  Scale, ShieldCheck, AlertTriangle, Clock, Sparkles,
  ArrowRight, FileText, CheckCircle2, Search, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'LexIndo — Asisten Riset Hukum Ketenagakerjaan Indonesia',
  description:
    'Jawaban hukum dari peraturan yang masih berlaku, dengan pasal yang bisa Anda periksa sendiri.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-navy-950">
      {/* ----------------------------------------------------------------- */}
      {/* Navigation Header */}
      {/* ----------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 w-full border-b border-navy-100 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-600 text-white text-lg shadow-xs">
              ⚖️
            </span>
            <span className="font-serif text-xl font-bold tracking-tight text-navy-900">
              LexIndo
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-navy-700 font-semibold text-xs sm:text-sm">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-navy-600 hover:bg-navy-700 text-white font-semibold text-xs sm:text-sm shadow-xs gap-1.5">
                <span>Daftar Gratis</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------------- */}
      {/* Hero Section */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-white via-navy-50/30 to-slate-50 border-b border-navy-100/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-navy-50 border border-navy-200/80 px-3.5 py-1 text-xs font-semibold text-navy-800 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-navy-600" />
            <span>Riset Hukum Berbasis Retrieval-Augmented Generation (RAG)</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-navy-950 leading-[1.15]">
            Asisten Riset Hukum yang Tepat, Teruji, dan Tanpa Halusinasi.
          </h1>

          {/* User Required Tagline */}
          <p className="font-serif text-lg sm:text-2xl text-navy-700 font-medium max-w-3xl mx-auto leading-relaxed">
            "Jawaban hukum dari peraturan yang masih berlaku, dengan pasal yang bisa Anda periksa sendiri."
          </p>

          <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Dirancang khusus untuk advokat, staf HR-UMKM, paralegal, dan mahasiswa hukum.
            Cakupan naskah resmi: UU Ketenagakerjaan (UU 13/2003), klaster UU Cipta Kerja (UU 6/2023), dan PP 35/2021.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-navy-600 hover:bg-navy-700 text-white font-bold px-8 shadow-sm gap-2">
                <span>Mulai Riset Gratis</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto font-semibold px-6">
                Sudah Punya Akun? Masuk
              </Button>
            </Link>
          </div>

          {/* Interactive UI Mockup Card */}
          <div className="pt-8 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-navy-200/80 bg-white p-5 md:p-6 shadow-md text-left space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-navy-100 text-xs">⚖️</span>
                  <span className="font-serif font-bold text-navy-900 text-xs md:text-sm">Asisten Riset LexIndo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
                    <ShieldCheck className="h-3 w-3" /> Terverifikasi Korpus
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    Ada Perubahan
                  </span>
                </div>
              </div>

              <div className="text-xs md:text-sm text-navy-900 leading-relaxed space-y-2">
                <p>
                  Berdasarkan <strong>PP No. 35 Tahun 2021 Pasal 8 ayat (1) dan (2)</strong>, Perjanjian Kerja Waktu Tertentu (PKWT)
                  berdasarkan jangka waktu dapat diadakan untuk <strong>paling lama 5 (lima) tahun</strong> beserta perpanjangannya.
                </p>
                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  📌 <em>Riwayat Regulasi:</em> Ketentuan lama pada Pasal 59 UU 13/2003 yang membatasi 2 tahun + 1 tahun telah resmi diubah oleh UU Cipta Kerja.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sitasi Resmi:</span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-navy-50/60 px-2.5 py-1 text-[11px] font-semibold text-navy-800">
                  <FileText className="h-3 w-3 text-navy-600" />
                  PP 35/2021 Pasal 8 ayat (1)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                  <FileText className="h-3 w-3 text-amber-700" />
                  UU 6/2023 Pasal 59 (Naskah Terkini)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 3-Item Problem Section */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-16 md:py-20 bg-white border-b border-navy-100/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-serif text-xs md:text-sm font-bold uppercase tracking-widest text-red-600">
              Masalah Nyata di Lapangan
            </h2>
            <p className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-navy-950">
              Mengapa Riset Hukum Tradisional & AI Umum Sangat Berisiko?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Problem 1 */}
            <div className="rounded-2xl border border-red-100 bg-red-50/40 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-red-950">
                1. Peraturan Cepat Berubah
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                Pasca berlakunya UU Cipta Kerja dan aturan pelaksananya, puluhan pasal ketenagakerjaan mengalami pergeseran norma. Mengutip pasal yang sudah dicabut atau diubah dapat berakibat fatal pada keabsahan kontrak dan gugatan PHI.
              </p>
            </div>

            {/* Problem 2 */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-amber-950">
                2. Riset Manual Sangat Lambat
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                Praktisi HR dan paralegal kerap menghabiskan waktu berjam-jam membuka belasan lembaran negara dalam format PDF tebal hanya untuk mencari satu batasan kompensasi atau masa probation yang sah.
              </p>
            </div>

            {/* Problem 3 */}
            <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-purple-950">
                3. Chatbot AI Mengarang Pasal
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                Chatbot AI generik (ChatGPT, Copilot umum) kerap mengalami halusinasi hukum: mengarang nomor pasal fiktif, mengutip UU yang sudah diganti, atau mencampuradukkan peraturan tanpa dasar rujukan yang dapat dibuktikan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 3-Item Solution Section */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-16 md:py-20 bg-slate-50 border-b border-navy-100/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-serif text-xs md:text-sm font-bold uppercase tracking-widest text-navy-600">
              Solusi LexIndo
            </h2>
            <p className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-navy-950">
              Riset Hukum Berbasis Pembuktian Naskah Resmi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Solution 1 */}
            <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-xs space-y-3 hover:border-navy-300 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-100 text-navy-700">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-navy-900">
                1. Grounded RAG Naskah Resmi
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                LexIndo hanya menjawab berdasarkan naskah peraturan yang terindeks (UU 13/2003, UU Cipta Kerja, PP 35/2021). Jika dasar hukum tidak mencukupi, sistem menolak menjawab daripada berspekulasi.
              </p>
            </div>

            {/* Solution 2 */}
            <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-xs space-y-3 hover:border-navy-300 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-100 text-navy-700">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-navy-900">
                2. Riwayat Amandemen & Hierarki
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Setiap pasal yang dikutip ditelusuri riwayat perubahannya hingga naskah terkini. Sistem juga mendeteksi kontradiksi norma antar peraturan lebih rendah vs lebih tinggi (*Lex Superior*).
              </p>
            </div>

            {/* Solution 3 */}
            <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-xs space-y-3 hover:border-navy-300 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-100 text-navy-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-navy-900">
                3. Sitasi Pasal & Ayat Transparan
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Setiap kalimat jawaban disertai chip sitasi eksplisit (*contoh: UU 13/2003 Pasal 59 ayat 1*). Cukup klik chip tersebut untuk membaca bunyi asli pasal langsung di layar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Bottom CTA Banner */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-16 bg-navy-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold">
            Mulai Riset Hukum Ketenagakerjaan dengan Percaya Diri
          </h2>
          <p className="text-xs sm:text-sm text-navy-200 max-w-xl mx-auto leading-relaxed">
            Daftar sekarang dan nikmati akses penuh tanya-jawab hukum berbasis korpus regulasi resmi Indonesia.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold px-8 shadow-sm">
                Daftar Akun Baru
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg" className="text-white hover:bg-navy-800">
                Masuk
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Persistent Legal Disclaimer Footer */}
      {/* ----------------------------------------------------------------- */}
      <footer className="border-t border-navy-100 bg-white py-8 text-center text-xs text-gray-500 space-y-2">
        <div className="flex items-center justify-center gap-2 font-serif font-bold text-navy-900 text-sm">
          <span>⚖️ LexIndo</span>
        </div>
        <p className="max-w-xl mx-auto text-[11px] leading-relaxed text-gray-400">
          ⚖️ <strong>Pemberitahuan:</strong> LexIndo adalah alat bantu riset hukum berbasis teknologi RAG, bukan nasihat hukum formal (legal opinion). Selalu verifikasi naskah resmi pada JDIH atau peraturan.go.id.
        </p>
        <p className="text-[10px] text-gray-400">
          © {new Date().getFullYear()} LexIndo. Seluruh Hak Cipta Dilindungi.
        </p>
      </footer>
    </div>
  );
}
