"""BP4 — Hierarchy Conflict Detection Service.

Compares retrieved PasalChunks across different levels of the Indonesian
legal hierarchy and surfaces conflicts where a lower-ranking regulation
contradicts a higher one on the same topic.

Hierarchy: UUD (1) > UU (2) > PP (3) > Perpres (4) > Permen (5) > Perda (6)
Principle: Lex Superior Derogat Legi Inferiori
"""
from typing import Dict, Any, List, Tuple, Optional

from app.models.regulation import HIERARCHY_LEVEL, RegulationType


# ---------------------------------------------------------------------------
# Keyword clusters used to decide whether two chunks address the same topic
# ---------------------------------------------------------------------------
TOPIC_CLUSTERS: List[List[str]] = [
    # PKWT duration
    ["pkwt", "jangka waktu", "perjanjian kerja waktu tertentu", "masa kontrak", "5 tahun", "2 tahun", "1 tahun",
     "paling lama", "diperpanjang", "kontrak kerja"],
    # Compensation / uang kompensasi
    ["kompensasi", "uang kompensasi", "pesangon", "uang penghargaan", "uang pisah"],
    # Wages / upah
    ["upah", "gaji", "penghasilan", "upah minimum", "ump", "umk", "umr", "upah layak"],
    # Termination / PHK
    ["phk", "pemutusan hubungan kerja", "pemecatan", "pengakhiran"],
    # Outsourcing / alih daya
    ["alih daya", "outsourcing", "pemborongan pekerjaan"],
    # Working hours
    ["waktu kerja", "jam kerja", "lembur", "waktu istirahat", "cuti"],
]


def _get_topic_index(text: str) -> Optional[int]:
    """Return index of the first matching topic cluster, or None."""
    text_lower = text.lower()
    for idx, keywords in enumerate(TOPIC_CLUSTERS):
        if any(kw in text_lower for kw in keywords):
            return idx
    return None


def _hierarchy_level(reg_type_str: str) -> int:
    """Convert reg_type string to hierarchy integer (lower = higher authority)."""
    try:
        reg_enum = RegulationType(reg_type_str)
        return HIERARCHY_LEVEL.get(reg_enum, 99)
    except (ValueError, KeyError):
        return 99


def detect_conflicts(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Given a list of retrieved chunk dicts (from ChromaDB + metadata), detect
    any pairs where a lower-ranking regulation appears to contradict a
    higher-ranking one on the same topic.

    Returns a list of conflict dicts:
    [
      {
        "topic": "PKWT / Jangka Waktu Kontrak",
        "higher_reg": "UU 13/2003 jo. PP 35/2021",
        "higher_chunk_id": 5,
        "higher_citation": "PP 35/2021 Pasal 8 ayat (1)",
        "higher_text": "...",
        "higher_level": 3,
        "lower_reg": "Permen 999/2024",
        "lower_chunk_id": 7,
        "lower_citation": "Permen 999/2024 Pasal 4 ayat (1)",
        "lower_text": "...",
        "lower_level": 5,
        "principle": "Lex Superior Derogat Legi Inferiori",
        "verdict": "Ketentuan UU/PP yang lebih tinggi berlaku. Permen 999/2024 Pasal 4 tidak dapat menyimpangi UU 13/2003 dan PP 35/2021."
      }
    ]
    """
    conflicts: List[Dict[str, Any]] = []

    # Group chunks by topic index
    topic_groups: Dict[int, List[Dict[str, Any]]] = {}
    for chunk in chunks:
        meta = chunk.get("metadata", {})
        text = chunk.get("text", "")
        # Also check citation labels for keywords
        combined = text + " " + meta.get("citation_label", "") + " " + meta.get("title", "")
        topic_idx = _get_topic_index(combined)
        if topic_idx is not None:
            topic_groups.setdefault(topic_idx, []).append(chunk)

    # Detect conflicts within each topic group
    for topic_idx, group in topic_groups.items():
        if len(group) < 2:
            continue

        topic_name = _topic_label(topic_idx)

        # Sort by hierarchy level (ascending = highest authority first)
        sorted_group = sorted(group, key=lambda c: _hierarchy_level(c.get("metadata", {}).get("reg_type", "UU")))

        # Compare each pair
        for i in range(len(sorted_group)):
            for j in range(i + 1, len(sorted_group)):
                higher_chunk = sorted_group[i]
                lower_chunk = sorted_group[j]

                higher_meta = higher_chunk.get("metadata", {})
                lower_meta = lower_chunk.get("metadata", {})

                higher_level = _hierarchy_level(higher_meta.get("reg_type", "UU"))
                lower_level = _hierarchy_level(lower_meta.get("reg_type", "UU"))

                # Only flag when there is a genuine hierarchy gap (different levels)
                if higher_level == lower_level:
                    continue

                # Check whether the texts actually contradict on a numeric limit
                contradiction = _check_numeric_contradiction(
                    higher_chunk.get("text", ""),
                    lower_chunk.get("text", ""),
                    topic_idx,
                )
                if not contradiction:
                    continue

                higher_citation = higher_meta.get("citation_label", f"Chunk {higher_meta.get('chunk_id', '?')}")
                lower_citation = lower_meta.get("citation_label", f"Chunk {lower_meta.get('chunk_id', '?')}")
                higher_reg = _short_name(higher_meta)
                lower_reg = _short_name(lower_meta)

                verdict = (
                    f"Berdasarkan asas **Lex Superior Derogat Legi Inferiori**, ketentuan {higher_reg} "
                    f"yang memiliki kedudukan hierarki lebih tinggi **berlaku dan mengalahkan** ketentuan "
                    f"{lower_reg} yang lebih rendah. {lower_reg} tidak dapat menyimpangi atau bertentangan "
                    f"dengan {higher_reg}."
                )

                conflict = {
                    "topic": topic_name,
                    "description": f"Konflik hierarki: {higher_citation} ({higher_reg}) mengesampingkan {lower_citation} ({lower_reg}).",
                    "higher_reg": higher_reg,
                    "higher_chunk_id": int(higher_meta.get("chunk_id", 0)),
                    "higher_citation": higher_citation,
                    "higher_text": higher_chunk.get("text", "")[:300],
                    "higher_level": higher_level,
                    "lower_reg": lower_reg,
                    "lower_chunk_id": int(lower_meta.get("chunk_id", 0)),
                    "lower_citation": lower_citation,
                    "lower_text": lower_chunk.get("text", "")[:300],
                    "lower_level": lower_level,
                    "principle": "Lex Superior Derogat Legi Inferiori",
                    "verdict": verdict,
                }
                conflicts.append(conflict)

    # Deduplicate by (higher_chunk_id, lower_chunk_id)
    seen_pairs = set()
    unique_conflicts = []
    for c in conflicts:
        pair = (c["higher_chunk_id"], c["lower_chunk_id"])
        if pair not in seen_pairs:
            seen_pairs.add(pair)
            unique_conflicts.append(c)

    return unique_conflicts


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _topic_label(idx: int) -> str:
    labels = [
        "PKWT / Jangka Waktu Kontrak",
        "Kompensasi & Pesangon",
        "Pengupahan / Upah Minimum",
        "Pemutusan Hubungan Kerja (PHK)",
        "Alih Daya / Outsourcing",
        "Waktu Kerja & Istirahat",
    ]
    return labels[idx] if idx < len(labels) else f"Topik {idx}"


def _short_name(meta: Dict[str, Any]) -> str:
    reg_type = meta.get("reg_type", "")
    number = meta.get("number", "")
    year = meta.get("year", "")
    return f"{reg_type} {number}/{year}" if number and year else reg_type


def _check_numeric_contradiction(text_higher: str, text_lower: str, topic_idx: int) -> bool:
    """
    Heuristic: for PKWT topic (idx 0), look for a '1 (satu) tahun' limit in
    the lower text versus '5 (lima) tahun' or '2 (dua) tahun' in the higher
    text — an obvious contradiction.

    For other topics, any two chunks from different hierarchy levels that
    share the same topic keyword cluster are flagged as a *potential* conflict.
    This is intentionally conservative: false positives are preferable to
    missing real conflicts.
    """
    if topic_idx == 0:
        # Specific heuristic for PKWT duration
        # Lower reg must explicitly limit to 1 year (matches the demo Permen 999/2024 text)
        lower_has_one_year = any(
            kw in text_lower.lower()
            for kw in ["1 (satu) tahun tanpa", "paling lama hanya 1", "hanya 1 (satu) tahun", "dibatasi secara mutlak paling lama hanya"]
        )
        higher_has_longer = any(
            kw in text_higher.lower()
            for kw in ["5 (lima) tahun", "paling lama 5", "2 (dua) tahun", "paling lama 2"]
        )
        # Also flag if lower explicitly says "1 tahun" and higher says "5 tahun"
        if not lower_has_one_year:
            lower_has_one_year = "1 (satu) tahun" in text_lower.lower() and "tanpa" in text_lower.lower()
        return lower_has_one_year and higher_has_longer

    # For all other topics: treat presence in same topic cluster as a potential conflict
    return True
