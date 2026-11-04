"""Chat router — Legal Q&A endpoint with RAG pipeline, rate limiting, and conversation history.

BP3 & BP4: Amendment timeline and hierarchy conflict endpoints added in Phase 5.
"""
from typing import List
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.services.auth_service import get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.pasal_chunk import PasalChunk
from app.schemas.chat import ChatRequest, ChatResponse, ConversationOut, MessageOut
from app.services.qa_service import execute_qa_pipeline
from app.services.validity_service import build_amendment_timeline

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


# ---------------------------------------------------------------------------
# BP2: Legal Q&A with grounded citations & similarity threshold refusal
# ---------------------------------------------------------------------------

@router.post("", response_model=ChatResponse)
@limiter.limit("20/minute")
def ask_question(
    request: Request,
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ask a legal question in Bahasa Indonesia.

    Retrieves grounded Pasal chunks from ChromaDB, evaluates similarity threshold,
    and returns answer with citations, status flags, and conflict warnings.
    """
    try:
        result = execute_qa_pipeline(
            question=body.question,
            conversation_id=body.conversation_id,
            current_user=current_user,
            db=db,
        )
        return ChatResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan saat memproses riset hukum: {str(e)}",
        )


# ---------------------------------------------------------------------------
# List User Conversations (for Riwayat)
# ---------------------------------------------------------------------------

@router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all past Q&A conversation threads for the current user."""
    convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return convs


# ---------------------------------------------------------------------------
# Get Conversation Details with Message turns
# ---------------------------------------------------------------------------

@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single conversation and all its messages."""
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Percakapan tidak ditemukan.")
    return conv


# ---------------------------------------------------------------------------
# Delete Conversation
# ---------------------------------------------------------------------------

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_200_OK)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a conversation and its messages."""
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Percakapan tidak ditemukan.")

    db.delete(conv)
    db.commit()
    return {"message": "Percakapan berhasil dihapus."}


# ---------------------------------------------------------------------------
# BP3: Amendment timeline for a specific Pasal chunk
# ---------------------------------------------------------------------------

@router.get("/pasal/{chunk_id}/timeline")
def get_amendment_timeline(
    chunk_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the full amendment chain for a Pasal chunk.

    Used by the frontend AmendmentTimeline component to display 'Riwayat Perubahan'.
    """
    chunk = db.query(PasalChunk).filter(PasalChunk.id == chunk_id).first()
    if not chunk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pasal chunk tidak ditemukan.")
    return build_amendment_timeline(db, chunk_id)
