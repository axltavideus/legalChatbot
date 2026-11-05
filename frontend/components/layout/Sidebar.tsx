/**
 * Sidebar — desktop navigation for authenticated users.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare, BookOpen, Bookmark, User, Settings,
  LogOut, ShieldAlert, CreditCard, LayoutDashboard
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/tanya',     label: 'Tanya Hukum',          icon: MessageSquare },
  { href: '/jelajahi',  label: 'Jelajahi Peraturan',    icon: BookOpen },
  { href: '/riwayat',   label: 'Riwayat & Tersimpan',  icon: Bookmark },
  { href: '/langganan', label: 'Paket & Langganan',    icon: CreditCard },
  { href: '/profil',    label: 'Profil',                icon: User },
];

const adminItems = [
  { href: '/admin',          label: 'Dashboard Admin',  icon: LayoutDashboard },
  { href: '/admin/korpus',   label: 'Kelola Korpus',    icon: Settings },
  { href: '/admin/feedback', label: 'Tinjau Feedback',  icon: ShieldAlert },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-navy-100 bg-white shadow-xs">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-navy-100 px-6 py-5">
        <span className="text-2xl drop-shadow-xs">⚖️</span>
        <div>
          <span className="font-serif text-xl font-bold tracking-tight text-navy-800">LexIndo</span>
          <p className="text-[10px] font-medium uppercase tracking-widest text-navy-400">Riset Hukum RAG</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-navy-500 text-white shadow-xs'
                      : 'text-navy-700 hover:bg-navy-50 hover:text-navy-900',
                  )}
                >
                  <Icon className={clsx('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-navy-400')} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Admin Navigation Section */}
        {user?.role === 'admin' && (
          <>
            <div className="my-4 border-t border-navy-100" />
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
              Admin Korpus
            </p>
            <ul className="flex flex-col gap-1.5">
              {adminItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-navy-600 text-white shadow-xs'
                          : 'text-navy-700 hover:bg-navy-50 hover:text-navy-900',
                      )}
                    >
                      <Icon className={clsx('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-navy-400')} />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </nav>

      {/* User Card & Logout */}
      <div className="border-t border-navy-100 p-4">
        {user && (
          <div className="mb-3 rounded-xl bg-navy-50/80 p-3 border border-navy-100/60">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-navy-900 truncate">{user.name}</span>
              <span className="rounded-md bg-navy-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy-800">
                {user.role === 'admin' ? 'Admin' : 'Pengguna'}
              </span>
            </div>
            {user.institution && (
              <p className="mt-0.5 text-xs text-navy-600 truncate">{user.institution}</p>
            )}
            <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
