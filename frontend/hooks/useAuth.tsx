/**
 * useAuth — React Context + SWR hook for the current user session.
 *
 * Wrap the app with <AuthProvider>; then call useAuth() in any component.
 */
'use client';

import {
  createContext, useContext, useCallback,
  type ReactNode,
} from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import type { User, RegisterPayload, LoginPayload } from '@/lib/types';

interface AuthContextValue {
  user: User | null | undefined; // undefined = loading, null = not logged in
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const { data: user, error, isLoading, mutate } = useSWR<User>(
    '/auth/me',
    () => authApi.me(),
    { shouldRetryOnError: false },
  );

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    await mutate(res.user, false);
    if (!res.user.onboarding_completed) {
      router.push('/onboarding');
    } else {
      router.push('/tanya');
    }
  }, [mutate, router]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    await mutate(res.user, false);
    router.push('/onboarding');
  }, [mutate, router]);

  const logout = useCallback(async () => {
    await authApi.logout();
    await mutate(undefined, false);
    router.push('/login');
  }, [mutate, router]);

  const resolvedUser = error ? null : user;

  return (
    <AuthContext.Provider value={{
      user: resolvedUser,
      isLoading,
      login,
      register,
      logout,
      refresh: () => mutate(),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

