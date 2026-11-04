"use client";

import React, { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Scale } from "lucide-react";

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------
export interface ConflictData {
  topic: string;
  higher_reg: string;
  higher_chunk_id: number;
  higher_citation: string;
  higher_text: string;
  higher_level: number;
  lower_reg: string;
  lower_chunk_id: number;
  lower_citation: string;
  lower_text: string;
  lower_level: number;
  principle: string;
  verdict: string;
}

interface ConflictBannerProps {
  conflicts: ConflictData[];
}

// -------------------------------------------------------------------------
// Hierarchy level label
// -------------------------------------------------------------------------
const LEVEL_LABELS: Record<number, string> = {
  1: "UUD 1945",
  2: "Undang-Undang (UU)",
  3: "Peraturan Pemerintah (PP)",
  4: "Perpres",
  5: "Peraturan Menteri (Permen)",
  6: "Peraturan Daerah (Perda)",
};

function levelLabel(level: number) {
  return LEVEL_LABELS[level] ?? `Tingkat ${level}`;
}

// -------------------------------------------------------------------------
// Single Conflict Card
// -------------------------------------------------------------------------
function ConflictCard({ conflict, index }: { conflict: ConflictData; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-red-200 overflow-hidden">
      {/* Summary row */}
      <button
        className="w-full flex items-start gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-red-800 text-sm">
            Konflik Hierarki: {conflict.topic}
          </div>
          <div className="text-xs text-red-600 mt-0.5 truncate">
            {conflict.higher_citation} vs {conflict.lower_citation}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        )}
      </button>

      {/* Detail panel */}
      {expanded && (
        <div className="bg-white px-4 py-4 space-y-4 text-sm">
          {/* Two-column comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Higher regulation */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-800 text-xs uppercase tracking-wide">
                  Hierarki Lebih Tinggi
                </span>
              </div>
              <div className="font-semibold text-blue-900">{conflict.higher_reg}</div>
              <div className="text-xs text-blue-700 mb-1">
                {levelLabel(conflict.higher_level)}
              </div>
              <div className="text-xs font-medium text-blue-800 bg-blue-100 rounded px-2 py-0.5 inline-block mb-2">
                {conflict.higher_citation}
              </div>
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">
                {conflict.higher_text}
              </p>
            </div>

            {/* Lower regulation */}
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="font-semibold text-orange-800 text-xs uppercase tracking-wide">
                  Hierarki Lebih Rendah
                </span>
              </div>
              <div className="font-semibold text-orange-900">{conflict.lower_reg}</div>
              <div className="text-xs text-orange-700 mb-1">
                {levelLabel(conflict.lower_level)}
              </div>
              <div className="text-xs font-medium text-orange-800 bg-orange-100 rounded px-2 py-0.5 inline-block mb-2">
                {conflict.lower_citation}
              </div>
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">
                {conflict.lower_text}
              </p>
            </div>
          </div>

          {/* Verdict */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Asas: {conflict.principle}
              </span>
            </div>
            <p
              className="text-sm text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: conflict.verdict.replace(
                  /\*\*(.+?)\*\*/g,
                  "<strong>$1</strong>"
                ),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------------
// Main Banner
// -------------------------------------------------------------------------
export default function ConflictBanner({ conflicts }: ConflictBannerProps) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
        <AlertTriangle className="w-4 h-4" />
        <span>
          {conflicts.length === 1
            ? "Terdeteksi 1 potensi konflik hierarki hukum"
            : `Terdeteksi ${conflicts.length} potensi konflik hierarki hukum`}
        </span>
      </div>
      {conflicts.map((conflict, idx) => (
        <ConflictCard key={idx} conflict={conflict} index={idx} />
      ))}
    </div>
  );
}

