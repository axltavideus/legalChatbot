/**
 * Login page — auth layout (no sidebar).
 */
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = { title: 'Masuk — LexIndo' };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-50 to-navy-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">⚖️</div>
          <h1 className="font-serif text-3xl font-bold text-navy-800">LexIndo</h1>
          <p className="mt-2 text-xs sm:text-sm text-navy-600 max-w-sm mx-auto font-serif leading-relaxed">
            "Jawaban hukum dari peraturan yang masih berlaku, dengan pasal yang bisa Anda periksa sendiri."
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 font-serif text-xl font-semibold text-navy-800">Masuk ke Akun Anda</h2>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-navy-400">
          Alat bantu riset hukum · bukan nasihat hukum
        </p>
      </div>
    </main>
  );
}

