/**
 * Spinner — centered loading indicator.
 */
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeClass = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export function Spinner({ size = 'md', className, label = 'Memuat...' }: SpinnerProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-2', className)} role="status">
      <Loader2 className={clsx('animate-spin text-navy-500', sizeClass[size])} />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
}

