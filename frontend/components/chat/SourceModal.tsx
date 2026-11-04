/**
 * SourceModal — modal displaying the official legal text and details of a cited Pasal.
 */
'use client';

import { ExternalLink, BookOpen } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Citation } from '@/lib/types';

interface SourceModalProps {
  citation: Citation | null;
  onClose: () => void;
}

export function SourceModal({ citation, onClose }: SourceModalProps) {
  if (!citation) return null;

  return (
    <Modal
      open={Boolean(citation)}
      onClose={onClose}
      title={citation.label}
      size="md"
    >
      <div className="space-y-4 text-xs md:text-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-1.5 text-navy-800 font-semibold">
            <BookOpen className="h-4 w-4 text-navy-600" />
            <span>Naskah Resmi Peraturan</span>
          </div>
          <Badge variant={citation.status}>{citation.status}</Badge>
        </div>

        {/* Legal Text Quote Box */}
        <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4 leading-relaxed text-navy-950 font-serif whitespace-pre-line shadow-2xs">
          {citation.text}
        </div>

        <div className="flex items-center justify-between pt-2">
          <a
            href="https://peraturan.go.id"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-navy-600 hover:underline font-medium"
          >
            Verifikasi di peraturan.go.id / JDIH <ExternalLink className="h-3 w-3" />
          </a>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}

