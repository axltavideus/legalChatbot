/**
 * Reusable Input component.
 */
import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-navy-800">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'rounded-lg border px-3 py-2 text-sm text-navy-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-navy-400',
          'transition-colors duration-150',
          error
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 bg-white hover:border-navy-300',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

