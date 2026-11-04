/**
 * Toast notification — positioned at top-right, auto-dismissed.
 */
'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import clsx from 'clsx';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  onDismiss: () => void;
  duration?: number; // ms
}

const icons = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error:   <XCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
};

const bgStyles = {
  success: 'border-green-200 bg-green-50',
  error:   'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
};

export function Toast({ message, type = 'success', onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div
      className={clsx(
        'fixed top-4 right-4 z-[100] flex items-start gap-3 rounded-xl border p-4 shadow-lg',
        'max-w-sm w-full',
        bgStyles[type],
      )}
      role="alert"
    >
      {icons[type]}
      <p className="flex-1 text-sm text-gray-800">{message}</p>
      <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

