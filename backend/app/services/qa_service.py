"""RAG Q&A pipeline service — retrieves grounded Pasal chunks, enforces similarity thresholds,

and persists conversation history with structured legal citations.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message, MessageRole
from app.models.regulation import HIERARCHY_LEVEL, RegulationType
from app.services.vector_store import query_pasals
from app.services.llm_service import generate_legal_answer

DISCLAIMER_FOOTNOTE = "\n\n---\n*⚖️ Alat bantu riset, bukan nasihat hukum. Verifikasi naskah dengan sumber resmi (peraturan.go.id / JDIH).*"


def _prioritize_chunks(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Prioritize chunks by validity status (berlaku > diubah > dicabut) and hierarchy level."""
    def sort_key(c):
        meta = c.get("metadata", {})
        status_val = meta.get("status", "berlaku")
        reg_type_str = meta.get("reg_type", "UU")

        # Status priority score (0 = highest)
        status_rank = 0 if status_val == "berlaku" else (1 if status_val == "diubah" else 2)

        # Hierarchy level (lower is higher authority)
        try:
            reg_enum = RegulationType(reg_type_str)
            hierarchy_rank = HIERARCHY_LEVEL.get(reg_enum, 99)
        except Exception:
            hierarchy_rank = 99

        # Higher similarity should also rank higher: negate similarity
        similarity = c.get("similarity", 0.0)

        return (status_rank, hierarchy_rank, -similarity)

    return sorted(chunks, key=sort_key)


def execute_qa_pipeline(
    question: str,
    conversation_id: Optional[int],
    current_user: User,
    db: Session,
) -> Dict[str, Any]:
    """Execute the end-to-end RAG pipeline for a user question."""
    cleaned_question = question.strip()
    if not cleaned_question:
        raise ValueError("Pertanyaan tidak boleh kosong.")

    # 1. Retrieve top-k chunks from ChromaDB
    retrieved = query_pasals(cleaned_question, top_k=settings.RETRIEVAL_TOP_K)

    # 2. Refusal check: filter chunks that satisfy the similarity threshold
    valid_chunks = [c for c in retrieved if c.get("similarity", 0.0) >= settings.SIMILARITY_THRESHOLD]

    if not valid_chunks:
        # Refusal behavior as required by BP2
        refusal_answer = (
            "Dasar hukum tidak ditemukan dalam korpus.\n\n"
            "Pertanyaan Anda tidak memiliki dasar hukum yang memadai dalam naskah regulasi ketenagakerjaan "
            "yang saat ini terindeks (UU 13/2003, UU Cipta Kerja, PP 35/2021). Silakan perjelas pertanyaan Anda "
            "atau verifikasi langsung melalui situs resmi JDIH Kementerian Ketenagakerjaan / peraturan.go.id."
            + DISCLAIMER_FOOTNOTE
        )
        llm_output = {
            "answer": refusal_answer,
            "citations": [],
            "status_flags": ["tidak_ditemukan"],
            "conflicts": [],
        }
    else:
        # 3. Prioritize retrieved chunks by validity and hierarchy
        sorted_chunks = _prioritize_chunks(valid_chunks)

        # 4. Invoke LLM generation
        llm_output = generate_legal_answer(cleaned_question, sorted_chunks)

        # 5. Append persistent legal disclaimer to answer text
        if DISCLAIMER_FOOTNOTE not in llm_output["answer"]:
            llm_output["answer"] = llm_output["answer"] + DISCLAIMER_FOOTNOTE

    # 6. Database persistence: Conversation & Messages
    conv = None
    if conversation_id:
        conv = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        ).first()

    if conv is None:
        title_candidate = cleaned_question[:60] + "..." if len(cleaned_question) > 60 else cleaned_question
        conv = Conversation(user_id=current_user.id, title=title_candidate)
        db.add(conv)
        db.flush()

    # User question message
    user_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.user,
        content=cleaned_question,
    )
    db.add(user_msg)

    # Assistant answer message with structured JSON
    assistant_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.assistant,
        content=llm_output["answer"],
        citations=llm_output.get("citations", []),
        status_flags=llm_output.get("status_flags", []),
        conflicts=llm_output.get("conflicts", []),
    )
    db.add(assistant_msg)

    db.commit()
    db.refresh(conv)
    db.refresh(assistant_msg)

    return {
        "conversation_id": conv.id,
        "message_id": assistant_msg.id,
        "answer": assistant_msg.content,
        "citations": assistant_msg.citations or [],
        "status_flags": assistant_msg.status_flags or [],
        "conflicts": assistant_msg.conflicts or [],
    }
