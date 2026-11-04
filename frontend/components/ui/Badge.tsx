/**
 * Badge — displays regulation status (Berlaku / Diubah / Dicabut).
 */
import clsx from 'clsx';

type BadgeVariant = 'berlaku' | 'diubah' | 'dicabut' | 'baru' | 'ditinjau' | 'diperbaiki' | 'default';

const variantStyles: Record<BadgeVariant, string> = {
  berlaku:    'bg-green-100 text-green-800 border-green-200',
  diubah:     'bg-amber-100 text-amber-800 border-amber-200',
  dicabut:    'bg-red-100 text-red-700 border-red-200',
  baru:       'bg-blue-100 text-blue-800 border-blue-200',
  ditinjau:   'bg-purple-100 text-purple-800 border-purple-200',
  diperbaiki: 'bg-green-100 text-green-800 border-green-200',
  default:    'bg-gray-100 text-gray-700 border-gray-200',
};

const labels: Record<BadgeVariant, string> = {
  berlaku:    'Berlaku',
  diubah:     'Diubah',
  dicabut:    'Dicabut',
  baru:       'Baru',
  ditinjau:   'Ditinjau',
  diperbaiki: 'Diperbaiki',
  default:    '',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children?: string;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {children ?? labels[variant]}
    </span>
  );
}

