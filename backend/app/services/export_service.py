"""Export service — generates professional legal research PDF reports using ReportLab (BP5).

Features:
- Navy & gold professional legal typography
- Header with LexIndo insignia and metadata table
- Sections for each research query, personal user note, grounded answer, and exact citations
- Persistent legal disclaimer footer on every page
"""
import io
import html
from typing import List, Dict, Any, Optional
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas


# Professional Legal Palette
COLOR_NAVY = colors.HexColor("#1e3a5f")
COLOR_GOLD = colors.HexColor("#b45309")
COLOR_LIGHT_BG = colors.HexColor("#f8fafc")
COLOR_BORDER = colors.HexColor("#cbd5e1")
COLOR_GRAY_TEXT = colors.HexColor("#475569")
COLOR_AMBER_BG = colors.HexColor("#fffbeb")
COLOR_AMBER_BORDER = colors.HexColor("#fde68a")


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and draw total page count and disclaimer footer."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(COLOR_GRAY_TEXT)

        # Header rule & title (pages > 1)
        if self._pageNumber > 1:
            self.setStrokeColor(COLOR_BORDER)
            self.setLineWidth(0.5)
            self.line(1.5 * cm, 28.2 * cm, 19.5 * cm, 28.2 * cm)
            self.drawString(1.5 * cm, 28.4 * cm, "LexIndo — Laporan Hasil Riset Hukum Ketenagakerjaan")

        # Footer divider line
        self.setStrokeColor(COLOR_BORDER)
        self.setLineWidth(0.5)
        self.line(1.5 * cm, 1.8 * cm, 19.5 * cm, 1.8 * cm)

        # Disclaimer note
        self.drawString(
            1.5 * cm,
            1.35 * cm,
            "⚖️ Dokumen alat bantu riset, bukan nasihat hukum. Verifikasi naskah asli melalui JDIH / peraturan.go.id."
        )

        # Page numbering
        page_str = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(19.5 * cm, 1.35 * cm, page_str)

        self.restoreState()


def _clean_markdown_for_pdf(text: str) -> str:
    """Convert basic Markdown formatting to ReportLab Paragraph-supported HTML tags."""
    if not text:
        return ""
    # Escape basic HTML special chars first
    t = html.escape(text)

    # Convert Markdown bold: **text** -> <b>text</b>
    import re
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    # Convert Markdown italic: *text* -> <i>\1</i>
    t = re.sub(r'(?<!\*)\*([^*]+?)\*(?!\*)', r'<i>\1</i>', t)
    # Convert code spans: `text` -> <font face="Courier">\1</font>
    t = re.sub(r'`(.+?)`', r'<font face="Courier" size="8">\1</font>', t)
    # Convert newlines to breaks
    t = t.replace('\n', '<br/>')
    return t


def generate_research_pdf(
    title: str,
    user_name: str,
    user_institution: Optional[str],
    items: List[Dict[str, Any]],
) -> io.BytesIO:
    """
    Generate a formatted PDF byte stream for research items.

    Each item in items contains:
    - question: str
    - answer: str
    - note: Optional[str]
    - citations: List[dict] (label, status, text, etc.)
    - status_flags: List[str]
    - created_at: str / datetime
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=2.0 * cm,
        bottomMargin=2.2 * cm,
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    style_title = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=COLOR_NAVY,
        spaceAfter=4,
    )
    style_subtitle = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=COLOR_GOLD,
        spaceAfter=14,
    )
    style_meta = ParagraphStyle(
        "DocMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=COLOR_GRAY_TEXT,
    )
    style_q_header = ParagraphStyle(
        "QuestionHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=COLOR_NAVY,
        spaceBefore=8,
        spaceAfter=4,
    )
    style_body = ParagraphStyle(
        "BodyText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=6,
    )
    style_note = ParagraphStyle(
        "NoteText",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#92400e"),
    )
    style_cit_head = ParagraphStyle(
        "CitHead",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=COLOR_NAVY,
    )
    style_cit_cell = ParagraphStyle(
        "CitCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#334155"),
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("LEXINDO", style_title))
    story.append(Paragraph("LAPORAN HASIL RISET HUKUM KETENAGAKERJAAN REPUBLIK INDONESIA", style_subtitle))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_NAVY, spaceAfter=10))

    # 2. Metadata Info Box
    export_time = datetime.now().strftime("%d %B %Y, %H:%M WIB")
    inst_str = f" ({user_institution})" if user_institution else ""
    meta_data = [
        [
            Paragraph(f"<b>Koleksi / Folder:</b> {title}", style_meta),
            Paragraph(f"<b>Waktu Ekspor:</b> {export_time}", style_meta),
        ],
        [
            Paragraph(f"<b>Penyusun:</b> {user_name}{inst_str}", style_meta),
            Paragraph(f"<b>Jumlah Topik Riset:</b> {len(items)} Butir", style_meta),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[9.0 * cm, 9.0 * cm])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # 3. Iterate research items
    for idx, itm in enumerate(items, 1):
        q_text = itm.get("question", "")
        a_text = itm.get("answer", "")
        note_text = itm.get("note")
        citations = itm.get("citations", [])

        item_elements = []

        # Question Title
        item_elements.append(Paragraph(f"<b>#{idx}. Pertanyaan:</b> {html.escape(q_text)}", style_q_header))

        # User Personal Note (if provided)
        if note_text:
            note_content = [
                [Paragraph(f"📌 <b>Catatan Peneliti:</b> {html.escape(note_text)}", style_note)]
            ]
            note_table = Table(note_content, colWidths=[18.0 * cm])
            note_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), COLOR_AMBER_BG),
                ('BOX', (0, 0), (-1, -1), 0.5, COLOR_AMBER_BORDER),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ]))
            item_elements.append(note_table)
            item_elements.append(Spacer(1, 6))

        # Answer Body (Markdown-parsed)
        # Strip trailing disclaimer footnotes from raw answer to avoid duplication with page footer
        clean_answer = a_text.split("---")[0].strip() if "---" in a_text else a_text
        parsed_answer = _clean_markdown_for_pdf(clean_answer)
        item_elements.append(Paragraph(parsed_answer, style_body))

        # Citations Table
        if citations:
            item_elements.append(Spacer(1, 4))
            item_elements.append(Paragraph("<b>Dasar Hukum Rujukan Terkait:</b>", style_cit_head))
            item_elements.append(Spacer(1, 3))

            cit_rows = [
                [
                    Paragraph("<b>Peraturan & Naskah</b>", style_cit_cell),
                    Paragraph("<b>Status</b>", style_cit_cell),
                    Paragraph("<b>Ringkasan Naskah Resmi</b>", style_cit_cell),
                ]
            ]
            for c in citations:
                lbl = c.get("label", "Peraturan")
                st = c.get("status", "berlaku").upper()
                c_text = c.get("text", "")
                preview = c_text[:140] + "..." if len(c_text) > 140 else c_text

                cit_rows.append([
                    Paragraph(f"<b>{html.escape(lbl)}</b>", style_cit_cell),
                    Paragraph(st, style_cit_cell),
                    Paragraph(html.escape(preview), style_cit_cell),
                ])

            cit_table = Table(cit_rows, colWidths=[4.8 * cm, 2.2 * cm, 11.0 * cm])
            cit_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), COLOR_LIGHT_BG),
                ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ]))
            item_elements.append(cit_table)

        item_elements.append(Spacer(1, 12))
        item_elements.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_BORDER, spaceAfter=10))

        story.append(KeepTogether(item_elements))

    # Build PDF with custom NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer

