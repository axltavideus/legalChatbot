"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ArrowRight, CheckCircle, AlertCircle, XCircle } from "lucide-react";

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------
interface TimelineEntry {
  chunk_id: number;
  citation_label: string;
  peraturan: string;
  reg_type: string;
  pasal: string;
  ayat?: string | null;
  text: string;
  status: "berlaku" | "diubah" | "dicabut";
  year: number;
  is_current: boolean;
}

export interface AmendmentTimelineData {
  original_chunk_id: number;
  current_chunk_id: number;
  is_amended: boolean;
  timeline: TimelineEntry[];
}

interface AmendmentTimelineProps {
  timeline: AmendmentTimelineData;
}

// -------------------------------------------------------------------------
// Status icon helper
// -------------------------------------------------------------------------
function StatusIcon({ status }: { status: string }) {
  if (status === "berlaku")
    return <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
  if (status === "diubah")
    return <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
  return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
}

function statusLabel(status: string) {
  if (status === "berlaku") return "Berlaku";
  if (status === "diubah") return "Diubah";
  return "Dicabut";
}

function statusColors(status: string) {
  if (status === "berlaku")
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "diubah")
    return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-red-50 text-red-800 border-red-200";
}

// -------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------
export default function AmendmentTimeline({ timeline }: AmendmentTimelineProps) {
  const [expanded, setExpanded] = useState(false);
  const [openEntry, setOpenEntry] = useState<number | null>(null);

  if (!timeline.is_amended || timeline.timeline.length <= 1) {
    // Single-entry timeline — still show a compact status pill
    const entry = timeline.timeline[0];
    if (!entry) return null;
    return (
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        <StatusIcon status={entry.status} />
        <span>
          {entry.citation_label} —{" "}
          <span className={`font-medium ${entry.status === "berlaku" ? "text-emerald-700" : "text-amber-700"}`}>
            {statusLabel(entry.status)}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3 border border-amber-200 rounded-xl overflow-hidden text-sm">
      {/* Header — always visible */}
      <button
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 font-semibold text-amber-800">
          <AlertCircle className="w-4 h-4" />
          <span>Riwayat Perubahan ({timeline.timeline.length} versi)</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-amber-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-600" />
        )}
      </button>

      {expanded && (
        <div className="bg-white px-4 py-3 space-y-0">
          {timeline.timeline.map((entry, idx) => (
            <div key={entry.chunk_id} className="relative">
              {/* Vertical connector line (except after last item) */}
              {idx < timeline.timeline.length - 1 && (
                <div className="absolute left-[13px] top-8 bottom-0 w-0.5 bg-amber-200 z-0" />
              )}

              <div className="relative z-10 flex gap-3 pb-4">
                {/* Node dot */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                    entry.is_current
                      ? "border-navy-700 bg-navy-700"
                      : "border-amber-300 bg-white"
                  }`}
                  style={entry.is_current ? { backgroundColor: "#1e3a5f", borderColor: "#1e3a5f" } : {}}
                >
                  {entry.is_current ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-xs text-amber-600 font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Content card */}
                <div
                  className={`flex-1 rounded-lg border p-3 cursor-pointer transition-all ${
                    entry.is_current
                      ? "border-navy-200 bg-blue-50"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                  } ${openEntry === entry.chunk_id ? "ring-2 ring-amber-300" : ""}`}
                  style={entry.is_current ? { borderColor: "#bfdbfe" } : {}}
                  onClick={() =>
                    setOpenEntry(openEntry === entry.chunk_id ? null : entry.chunk_id)
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {entry.citation_label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {entry.peraturan} — {entry.year}
                        {entry.is_current && (
                          <span className="ml-2 text-xs font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            Naskah Terkini
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${statusColors(entry.status)}`}
                    >
                      {statusLabel(entry.status)}
                    </span>
                  </div>

                  {/* Expand text preview */}
                  {openEntry === entry.chunk_id && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                      {entry.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Arrow label between entries */}
              {idx < timeline.timeline.length - 1 && (
                <div className="flex items-center gap-1 ml-10 -mt-2 mb-1 text-xs text-amber-600">
                  <ArrowRight className="w-3 h-3" />
                  <span>Diubah oleh</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

