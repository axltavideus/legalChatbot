/**
 * useOnboarding — tracks current step and completion state.
 */
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from './useAuth';

const TOTAL_STEPS = 4;

export function useOnboarding() {
  const [step, setStep] = useState(0); // 0-indexed
  const [acknowledged, setAcknowledged] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { refresh } = useAuth();
  const router = useRouter();

  const next = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const prev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const skip = useCallback(async () => {
    setIsCompleting(true);
    try {
      await authApi.completeOnboarding();
      refresh();
      router.push('/tanya');
    } finally {
      setIsCompleting(false);
    }
  }, [refresh, router]);

  const complete = useCallback(async () => {
    if (!acknowledged) return;
    setIsCompleting(true);
    try {
      await authApi.completeOnboarding();
      refresh();
      router.push('/tanya');
    } finally {
      setIsCompleting(false);
    }
  }, [acknowledged, refresh, router]);

  return {
    step,
    totalSteps: TOTAL_STEPS,
    acknowledged,
    setAcknowledged,
    isCompleting,
    next,
    prev,
    skip,
    complete,
  };
}

