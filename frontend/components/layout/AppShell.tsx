/**
 * AppShell — unified layout wrapping all authenticated views.
 * Provides sticky/fixed desktop sidebar, responsive mobile navigation bar, and legal disclaimer footer.
 */
'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { DisclaimerFooter } from './DisclaimerFooter';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-gray-50">
      {/* Mobile Top Navigation */}
      <MobileNav />

      {/* Desktop Sidebar (visible on md+) */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
        <DisclaimerFooter />
      </div>
    </div>
  );
}

