"""Parsing service — structure-aware legal document parser for Indonesian regulations.

Extracts text from TXT or PDF, identifies structural hierarchy (Bab, Pasal, Ayat),
and segments text into discrete searchable PasalChunks with clean citation metadata.
"""
import re
import io
from typing import List, Dict, Any, Optional

try:
    import pdfplumber
except ImportError:
    pdfplumber = None


class ParsedChunk:
    def __init__(
        self,
        pasal: str,
        text: str,
        bab: Optional[str] = None,
        ayat: Optional[str] = None,
    ):
        self.bab = bab
        self.pasal = pasal
        self.ayat = ayat
        self.text = text.strip()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "bab": self.bab,
            "pasal": self.pasal,
            "ayat": self.ayat,
            "text": self.text,
        }


def extract_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    """Extract plain text from an uploaded file (PDF or TXT)."""
    filename_lower = filename.lower()
    if filename_lower.endswith(".pdf"):
        if pdfplumber is None:
            raise RuntimeError("pdfplumber tidak terpasang untuk membaca berkas PDF.")
        text_parts = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n".join(text_parts)
    else:
        # Assume text/plain or markdown
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return file_bytes.decode("latin-1", errors="replace")


def clean_legal_text(raw_text: str) -> str:
    """Normalize whitespace, remove line wraps inside sentences, and standardize headers."""
    # Replace CRLF with LF
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")
    # Remove recurring page headers/footers like 'PRESIDEN REPUBLIK INDONESIA'
    text = re.sub(r'PRESIDEN\s+REPUBLIK\s+INDONESIA\s*', '', text, flags=re.IGNORECASE)
    # Remove solitary page numbers like '\n - 12 - \n'
    text = re.sub(r'\n\s*-\s*\d+\s*-\s*\n', '\n', text)
    return text


def parse_regulation_structure(raw_text: str) -> List[ParsedChunk]:
    """Parse text into structured Pasal chunks, tracking the enclosing Bab."""
    text = clean_legal_text(raw_text)

    # Regex to match BAB headers: e.g. "BAB I" or "BAB I KETENTUAN UMUM"
    # Also captures title on next line if capitalized
    bab_regex = re.compile(
        r'(?:^|\n)\s*(BAB\s+[IVXLCDM\d]+)(?:[ \t]+([^\n]+))?(?:\n\s*([A-Z\s]{3,50}))?',
        re.IGNORECASE
    )

    # Regex to match PASAL headers: e.g. "Pasal 1", "Pasal 59", "Pasal 59A"
    pasal_regex = re.compile(r'(?:^|\n)\s*Pasal\s+(\d+[A-Z]?)\b', re.IGNORECASE)

    # Find all Pasal occurrences with their start/end indices
    matches = list(pasal_regex.finditer(text))
    if not matches:
        # Fallback if no explicit "Pasal N" found: treat as single chunk
        return [ParsedChunk(pasal="Umum", text=text[:3000])]

    chunks: List[ParsedChunk] = []

    for i, match in enumerate(matches):
        pasal_num = match.group(1).strip()
        pasal_start = match.start()

        # The text for this Pasal ends where the next Pasal begins (or at EOF)
        if i + 1 < len(matches):
            pasal_end = matches[i + 1].start()
        else:
            pasal_end = len(text)

        pasal_content = text[pasal_start:pasal_end].strip()

        # Determine the enclosing BAB by searching backwards from pasal_start
        prefix_text = text[:pasal_start]
        bab_matches = list(bab_regex.finditer(prefix_text))
        current_bab = None
        if bab_matches:
            last_m = bab_matches[-1]
            bab_num = last_m.group(1).strip()
            same_line_title = last_m.group(2).strip() if last_m.group(2) else ""
            next_line_title = last_m.group(3).strip() if last_m.group(3) else ""
            title = same_line_title or next_line_title
            current_bab = f"{bab_num} {title}".strip() if title else bab_num

        # Check for first ayat if present (e.g. "(1)")
        ayat_match = re.search(r'\(([0-9]+)\)', pasal_content)
        first_ayat = ayat_match.group(1) if ayat_match else "1"

        # Format clean text: remove excessive whitespace but preserve ayat numbering
        clean_content = re.sub(r'[ \t]+', ' ', pasal_content)

        chunk = ParsedChunk(
            pasal=pasal_num,
            text=clean_content,
            bab=current_bab,
            ayat=first_ayat,
        )
        chunks.append(chunk)

    return chunks
