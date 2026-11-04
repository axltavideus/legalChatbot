"""LLM service — handles grounded generation using Google Gemini API or deterministic MOCK_LLM fallback."""
import re
import json
from typing import List, Dict, Any, Optional

from app.config import settings

STRICT_SYSTEM_PROMPT = """Anda adalah LexIndo, asisten riset hukum ketenagakerjaan Indonesia berbasis Retrieval-Augmented Generation (RAG).

ATURAN HUKUM KETAT (WAJIB DIPATUHI):
1. Anda HANYA diperkenankan menjawab berdasarkan naskah Pasal dan Ayat yang diberikan di dalam konteks di bawah ini.
2. DILARANG KERAS mengarang, mengasumsikan, atau menambahkan ketentuan hukum di luar naskah konteks.
3. Jika informasi dalam naskah konteks tidak cukup atau tidak relevan untuk menjawab pertanyaan secara pasti, Anda WAJIB menjawab persis:
   "Dasar hukum tidak ditemukan dalam korpus."
4. Setiap rujukan wajib menyebutkan sitasi spesifik: jenis peraturan, nomor/tahun, Pasal, dan nomor Ayat.
5. Jika ada Pasal yang berstatus "diubah", jelaskan bahwa Pasal tersebut telah diubah oleh peraturan yang lebih baru dalam konteks.
6. Jawaban Anda WAJIB berupa JSON valid (tanpa teks pembuka/penutup di luar JSON) dengan struktur persis berikut:
{
  "answer": "Penjelasan hukum lengkap dan lugas dalam Bahasa Indonesia...",
  "citations": [
    {
      "pasal_chunk_id": 1,
      "label": "UU 13/2003 Pasal 59 ayat (1)",
      "text": "Ringkasan kutipan isi pasal...",
      "status": "berlaku atau diubah atau dicabut"
    }
  ],
  "status_flags": ["berlaku"],
  "conflicts": []
}
"""


def _generate_mock_response(
    question: str,
    chunks: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Deterministic, high-quality canned answer generator for testing without Gemini API key."""
    q_lower = question.lower()

    # Build citations from actual retrieved chunks
    citations = []
    status_flags = set()

    for c in chunks:
        meta = c.get("metadata", {})
        cid = int(meta.get("chunk_id", 0))
        label = meta.get("citation_label", "Peraturan")
        status_val = meta.get("status", "berlaku")
        text_preview = c.get("text", "")[:200] + "..." if len(c.get("text", "")) > 200 else c.get("text", "")

        citations.append({
            "pasal_chunk_id": cid,
            "label": label,
            "text": text_preview,
            "status": status_val,
        })
        status_flags.add(status_val)

    # 1. Topic: PKWT duration / masa kontrak
    if any(k in q_lower for k in ["pkwt", "kontrak", "masa", "jangka waktu", "59", "5 tahun"]):
        has_cipta_kerja = any("6/2023" in c["label"] or "35/2021" in c["label"] for c in citations)
        has_old_uu = any("13/2003" in c["label"] for c in citations)

        if has_cipta_kerja:
            answer = (
                "Berdasarkan **PP No. 35 Tahun 2021 Pasal 8 ayat (1) dan (2)** sebagai aturan pelaksanaan "
                "dari UU Cipta Kerja (UU No. 6 Tahun 2023 yang mengubah Pasal 59 UU No. 13 Tahun 2003), "
                "Perjanjian Kerja Waktu Tertentu (PKWT) berdasarkan jangka waktu dapat diadakan untuk **paling lama 5 (lima) tahun**.\n\n"
                "Apabila pekerjaan yang dilaksanakan belum selesai, PKWT dapat diperpanjang dengan kesepakatan para pihak, "
                "dengan ketentuan bahwa **jangka waktu keseluruhan PKWT beserta perpanjangannya tidak boleh melebihi 5 (lima) tahun**.\n\n"
                "*Catatan Riwayat Regulasi:* Ketentuan lama pada Pasal 59 ayat (4) UU No. 13 Tahun 2003 yang membatasi masa PKWT 2 tahun "
                "dengan perpanjangan 1 tahun telah resmi diubah oleh UU Cipta Kerja."
            )
        else:
            answer = (
                "Berdasarkan **UU No. 13 Tahun 2003 Pasal 59**, Perjanjian Kerja Waktu Tertentu (PKWT) "
                "hanya dapat diadakan untuk pekerjaan tertentu yang selesai dalam waktu tertentu. "
                "Perlu dicatat bahwa ketentuan Pasal 59 ini memiliki riwayat perubahan dalam klaster ketenagakerjaan UU Cipta Kerja."
            )

    # 2. Topic: Uang Kompensasi PKWT
    elif any(k in q_lower for k in ["kompensasi", "uang kompensasi", "hak pekerja", "selesai kontrak"]):
        answer = (
            "Berdasarkan **PP No. 35 Tahun 2021 Pasal 15 ayat (1), (2), dan (3)**:\n\n"
            "1. Pengusaha **wajib memberikan uang kompensasi** kepada Pekerja/Buruh yang hubungan kerjanya berdasarkan PKWT.\n"
            "2. Pembayaran uang kompensasi dilaksanakan pada saat berakhirnya jangka waktu PKWT.\n"
            "3. Hak uang kompensasi ini diberikan kepada pekerja yang telah memiliki masa kerja **paling sedikit 1 (satu) bulan** secara terus menerus."
        )

    # 3. Topic: Upah / Pengupahan / Upah Minimum
    elif any(k in q_lower for k in ["upah", "gaji", "penghasilan", "88", "layak"]):
        answer = (
            "Berdasarkan **UU No. 13 Tahun 2003 Pasal 88 ayat (1) dan (2)**, setiap pekerja/buruh berhak memperoleh "
            "penghasilan yang memenuhi penghidupan yang layak bagi kemanusiaan. Untuk mewujudkan hal tersebut, "
            "Pemerintah menetapkan kebijakan pengupahan nasional yang melindungi pekerja/buruh."
        )

    # 4. Default grounded response from retrieved chunks
    else:
        first_chunk = chunks[0]
        meta = first_chunk.get("metadata", {})
        label = meta.get("citation_label", "Peraturan")
        doc_text = first_chunk.get("text", "")
        answer = (
            f"Berdasarkan dasar hukum pada **{label}**, ketentuan yang berlaku menyatakan:\n\n"
            f"> \"{doc_text}\"\n\n"
            "Ketentuan tersebut merupakan norma resmi yang terindeks dalam korpus regulasi ketenagakerjaan LexIndo."
        )

    return {
        "answer": answer,
        "citations": citations,
        "status_flags": list(status_flags) if status_flags else ["berlaku"],
        "conflicts": [],
    }


def generate_legal_answer(
    question: str,
    retrieved_chunks: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Generate structured legal Q&A response from retrieved chunks using Gemini or MOCK_LLM."""
    if not retrieved_chunks:
        return {
            "answer": "Dasar hukum tidak ditemukan dalam korpus.",
            "citations": [],
            "status_flags": ["tidak_ditemukan"],
            "conflicts": [],
        }

    # If MOCK_LLM mode is active or no API key provided, use deterministic generator
    if settings.MOCK_LLM or not settings.GEMINI_API_KEY:
        return _generate_mock_response(question, retrieved_chunks)

    # Otherwise, invoke real Google Gemini API
    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=STRICT_SYSTEM_PROMPT,
            generation_config={"response_mime_type": "application/json"},
        )

        # Prepare context prompt from retrieved chunks
        context_parts = []
        for idx, c in enumerate(retrieved_chunks, 1):
            meta = c.get("metadata", {})
            cid = meta.get("chunk_id", idx)
            label = meta.get("citation_label", f"Dokumen {idx}")
            status_val = meta.get("status", "berlaku")
            text = c.get("text", "")
            context_parts.append(
                f"--- DOKUMEN [{idx}] (ID: {cid}) ---\n"
                f"Sitasi: {label}\n"
                f"Status: {status_val}\n"
                f"Naskah:\n{text}\n"
            )

        context_str = "\n".join(context_parts)
        user_prompt = (
            f"NASKAH DOKUMEN HUKUM TERPILIH:\n{context_str}\n\n"
            f"PERTANYAAN PENGGUNA:\n{question}\n\n"
            f"Jawablah dalam format JSON sesuai spesifikasi sistem."
        )

        response = model.generate_content(user_prompt)
        text_out = response.text.strip()

        # Clean JSON markdown fences if returned
        if text_out.startswith("```json"):
            text_out = text_out[7:]
        if text_out.startswith("```"):
            text_out = text_out[3:]
        if text_out.endswith("```"):
            text_out = text_out[:-3]
        text_out = text_out.strip()

        parsed_json = json.loads(text_out)
        return parsed_json

    except Exception as e:
        # Fallback to deterministic mock generator if Gemini network fails
        mock = _generate_mock_response(question, retrieved_chunks)
        mock["answer"] = f"{mock['answer']}\n\n*(Catatan fallback offline: {str(e)})*"
        return mock

