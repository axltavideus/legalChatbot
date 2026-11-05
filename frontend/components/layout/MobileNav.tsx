/**
 * MobileNav — responsive header for small screens with hamburger button & slide-over drawer.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, MessageSquare, BookOpen, Bookmark, User,
  Settings, LogOut, ShieldAlert, CreditCard, LayoutDashboard
} from 'lucide-react';
import clsx from 'clsx';
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

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Top Mobile Bar (visible only below md) */}
      <header className="flex h-14 items-center justify-between border-b border-navy-100 bg-white px-4 md:hidden">
        <Link href="/tanya" className="flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          <span className="font-serif text-lg font-bold text-navy-800">LexIndo</span>
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 text-navy-700 hover:bg-navy-50"
          aria-label="Buka menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Slide-over backdrop & drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer panel */}
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-navy-100 px-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚖️</span>
                <span className="font-serif text-lg font-bold text-navy-800">LexIndo</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="flex flex-col gap-1.5">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setIsOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        pathname.startsWith(href)
                          ? 'bg-navy-500 text-white'
                          : 'text-navy-700 hover:bg-navy-50',
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>

              {user?.role === 'admin' && (
                <>
                  <div className="my-4 border-t border-navy-100" />
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Admin Korpus
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {adminItems.map(({ href, label, icon: Icon }) => (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setIsOpen(false)}
                          className={clsx(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            pathname.startsWith(href)
                              ? 'bg-navy-500 text-white'
                              : 'text-navy-700 hover:bg-navy-50',
                          )}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </nav>

            {/* Footer with user info & logout */}
            <div className="border-t border-navy-100 p-4">
              {user && (
                <div className="mb-3 rounded-lg bg-navy-50 p-3">
                  <div className="font-medium text-navy-900 truncate">{user.name}</div>
                  <div className="text-xs text-navy-500 truncate">{user.email}</div>
                  <span className="mt-1 inline-block rounded-full bg-navy-200 px-2 py-0.5 text-[10px] font-semibold text-navy-800 uppercase">
                    {user.role === 'admin' ? 'Admin Korpus' : 'Pengguna'}
                  </span>
                </div>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

