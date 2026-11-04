/**
 * CitationChip — clickable citation badge displaying regulation name, Pasal, and validity status.
 */
'use client';

import { BookOpen, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { Citation } from '@/lib/types';

interface CitationChipProps {
  citation: Citation;
  onClickSource: (citation: Citation) => void;
}

export function CitationChip({ citation, onClickSource }: CitationChipProps) {
  return (
    <button
      onClick={() => onClickSource(citation)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-2.5 py-1 text-xs font-medium text-navy-800 shadow-2xs hover:bg-navy-50 hover:border-navy-400 transition-all group"
      title="Klik untuk membaca naskah resmi Pasal ini"
    >
      <BookOpen className="h-3.5 w-3.5 text-navy-500 group-hover:text-navy-700" />
      <span className="font-semibold">{citation.label}</span>
      <Badge variant={citation.status} className="text-[10px] py-0 px-1.5 font-normal">
        {citation.status}
      </Badge>
    </button>
  );
}

