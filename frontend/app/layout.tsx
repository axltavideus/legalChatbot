/**
 * Root layout — fonts, global CSS, AuthProvider.
 */
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata: Metadata = {
  title: 'LexIndo — Asisten Riset Hukum Indonesia',
  description: 'Tanya peraturan Indonesia, dapatkan jawaban dengan sitasi Pasal yang akurat.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

