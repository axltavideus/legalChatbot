"""BP3 — Validity & Amendment Chain Service.

For every retrieved PasalChunk, traverses the amended_by_id chain to find
the currently-active provision, and builds a human-readable amendment
timeline suitable for the frontend 'Riwayat Perubahan' timeline component.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.pasal_chunk import PasalChunk
from app.models.regulation import Regulation


MAX_CHAIN_DEPTH = 10  # Guard against accidental circular links


def _get_amending_chunk(db: Session, chunk: PasalChunk) -> Optional[PasalChunk]:
    """Return the PasalChunk that amends *chunk*, or None if none exists."""
    if chunk.amended_by_id is None:
        return None
    return db.query(PasalChunk).filter(PasalChunk.id == chunk.amended_by_id).first()


def build_amendment_timeline(
    db: Session,
    chunk_id: int,
) -> Dict[str, Any]:
    """
    Starting from *chunk_id*, walk the amended_by_id chain (original → amended)
    and also walk backwards to find the root (oldest) version.

    Returns a dict suitable for the AmendmentTimeline frontend component:
    {
      "original_chunk_id": int,
      "current_chunk_id": int,
      "is_amended": bool,
      "timeline": [
        {
          "chunk_id": int,
          "citation_label": str,
          "peraturan": str,       # e.g. "UU 13/2003"
          "reg_type": str,
          "pasal": str,
          "ayat": str | None,
          "text": str,
          "status": str,          # "berlaku" | "diubah" | "dicabut"
          "year": int,
          "is_current": bool,
        }
      ]
    }
    """
    start_chunk = db.query(PasalChunk).filter(PasalChunk.id == chunk_id).first()
    if start_chunk is None:
        return {"original_chunk_id": chunk_id, "current_chunk_id": chunk_id, "is_amended": False, "timeline": []}

    # Walk backwards to find the root (a chunk that no other chunk amends *into*)
    # We do this by looking for chunks whose amended_by_id == start_chunk.id — i.e. the predecessor.
    root = start_chunk
    seen = {root.id}
    depth = 0
    while depth < MAX_CHAIN_DEPTH:
        predecessor = (
            db.query(PasalChunk)
            .filter(PasalChunk.amended_by_id == root.id)
            .first()
        )
        if predecessor is None or predecessor.id in seen:
            break
        seen.add(predecessor.id)
        root = predecessor
        depth += 1

    # Now walk forward from root following amended_by_id
    timeline_chunks: List[PasalChunk] = [root]
    seen_forward = {root.id}
    depth = 0
    current = root
    while depth < MAX_CHAIN_DEPTH:
        nxt = _get_amending_chunk(db, current)
        if nxt is None or nxt.id in seen_forward:
            break
        seen_forward.add(nxt.id)
        timeline_chunks.append(nxt)
        current = nxt
        depth += 1

    # The last item in the chain is the current active version
    current_chunk = timeline_chunks[-1]
    is_amended = len(timeline_chunks) > 1

    # Build serializable timeline entries
    timeline_entries = []
    for i, tc in enumerate(timeline_chunks):
        reg = tc.regulation
        entry = {
            "chunk_id": tc.id,
            "citation_label": tc.citation_label,
            "peraturan": reg.short_name,
            "reg_type": reg.reg_type.value if hasattr(reg.reg_type, "value") else str(reg.reg_type),
            "pasal": tc.pasal,
            "ayat": tc.ayat,
            "text": tc.text,
            "status": tc.status.value if hasattr(tc.status, "value") else str(tc.status),
            "year": reg.year,
            "is_current": (i == len(timeline_chunks) - 1),
        }
        timeline_entries.append(entry)

    return {
        "original_chunk_id": root.id,
        "current_chunk_id": current_chunk.id,
        "is_amended": is_amended,
        "timeline": timeline_entries,
    }


def enrich_citations_with_amendments(
    db: Session,
    citations: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    For each citation in the list, fetch the corresponding PasalChunk and
    attach its full amendment timeline. Also prefer the *current* (latest)
    version of a Pasal when the cited one is marked 'diubah'.

    Mutates and returns the input list with new 'amendment_timeline' key.
    """
    enriched = []
    for cit in citations:
        chunk_id = cit.get("pasal_chunk_id")
        if not chunk_id:
            enriched.append(cit)
            continue

        chunk = db.query(PasalChunk).filter(PasalChunk.id == chunk_id).first()
        if chunk is None:
            enriched.append(cit)
            continue

        timeline_data = build_amendment_timeline(db, chunk.id)

        # If the cited chunk is amended, upgrade citation to point to current version
        if timeline_data["is_amended"] and timeline_data["current_chunk_id"] != chunk.id:
            current = db.query(PasalChunk).filter(
                PasalChunk.id == timeline_data["current_chunk_id"]
            ).first()
            if current:
                reg = current.regulation
                cit = {
                    **cit,
                    "pasal_chunk_id": current.id,
                    "label": current.citation_label,
                    "peraturan": reg.short_name,
                    "pasal_nomor": f"Pasal {current.pasal}" + (f" ayat {current.ayat}" if current.ayat else ""),
                    "text": current.text[:300] + "..." if len(current.text) > 300 else current.text,
                    "status": current.status.value if hasattr(current.status, "value") else str(current.status),
                    "note": f"Diperbarui: sitasi asli ({chunk.citation_label}) telah diubah, menampilkan versi terkini.",
                }

        cit["amendment_timeline"] = timeline_data
        enriched.append(cit)

    return enriched

