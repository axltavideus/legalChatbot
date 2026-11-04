/**
 * RegisterForm — name, email, password, role, optional institution + invite code.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { UserRole } from '@/lib/types';

export function RegisterForm() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'pengguna' as UserRole,
    institution: '',
    invite_code: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nama wajib diisi';
    if (!form.email) errs.email = 'Email wajib diisi';
    if (form.password.length < 8) errs.password = 'Password minimal 8 karakter';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Password tidak cocok';
    if (form.role === 'admin' && !form.invite_code) errs.invite_code = 'Kode undangan wajib untuk Admin';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    if (!validate()) return;
    setIsLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        institution: form.institution || undefined,
        invite_code: form.invite_code || undefined,
      });
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {globalError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      <Input
        label="Nama Lengkap"
        type="text"
        placeholder="Budi Santoso"
        value={form.name}
        onChange={set('name')}
        error={errors.name}
        autoComplete="name"
        required
      />

      <Input
        label="Email"
        type="email"
        placeholder="nama@email.com"
        value={form.email}
        onChange={set('email')}
        error={errors.email}
        autoComplete="email"
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="Minimal 8 karakter"
        value={form.password}
        onChange={set('password')}
        error={errors.password}
        autoComplete="new-password"
        required
      />

      <Input
        label="Konfirmasi Password"
        type="password"
        placeholder="Ulangi password"
        value={form.confirmPassword}
        onChange={set('confirmPassword')}
        error={errors.confirmPassword}
        autoComplete="new-password"
        required
      />

      {/* Role selector */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-navy-800">Peran</label>
        <select
          value={form.role}
          onChange={set('role')}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400"
        >
          <option value="pengguna">Pengguna (Mahasiswa / Paralegal / HR-UMKM)</option>
          <option value="admin">Admin Korpus</option>
        </select>
        <p className="text-xs text-gray-500">
          Admin Korpus membutuhkan kode undangan khusus
        </p>
      </div>

      {form.role === 'admin' && (
        <Input
          label="Kode Undangan Admin"
          type="text"
          placeholder="Masukkan kode undangan"
          value={form.invite_code}
          onChange={set('invite_code')}
          error={errors.invite_code}
        />
      )}

      <Input
        label="Instansi (opsional)"
        type="text"
        placeholder="Universitas / Perusahaan / Kantor Hukum"
        value={form.institution}
        onChange={set('institution')}
      />

      <Button type="submit" size="lg" isLoading={isLoading} className="mt-2 w-full">
        Daftar
      </Button>

      <p className="text-center text-sm text-gray-600">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-medium text-navy-600 hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}

