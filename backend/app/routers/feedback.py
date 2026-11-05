"""Feedback router — handles user feedback on answers and general app feedback.

Admin Korpus can review submitted feedback, filter by status, and update resolution status.
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import get_current_user, require_admin
from app.models.user import User
from app.models.feedback import Feedback, FeedbackType, FeedbackReason, FeedbackStatus
from app.schemas import FeedbackRequest, FeedbackOut, FeedbackStatusUpdate

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED)
def submit_feedback(
    body: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit either thumbs up/down on a message, or general feedback from profile menu."""
    try:
        fb_type = FeedbackType(body.feedback_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipe feedback tidak valid (harus thumbs_up atau thumbs_down)",
        )

    reason_enum = None
    if body.reason:
        try:
            reason_enum = FeedbackReason(body.reason)
        except ValueError:
            reason_enum = FeedbackReason.lainnya

    feedback_entry = Feedback(
        user_id=current_user.id,
        message_id=body.message_id,
        feedback_type=fb_type,
        reason=reason_enum,
        comment=body.comment,
        is_general=body.is_general,
        status=FeedbackStatus.baru,
    )
    db.add(feedback_entry)
    db.commit()
    db.refresh(feedback_entry)

    return {
        "message": "Terima kasih atas masukan Anda! Feedback Anda sangat membantu peningkatan akurasi LexIndo.",
        "id": feedback_entry.id,
    }


@router.get("", response_model=List[FeedbackOut])
def list_feedback(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin endpoint — list user feedbacks with optional status filter (baru / ditinjau / diperbaiki)."""
    query = db.query(Feedback)
    if status_filter and status_filter.lower() != "semua":
        try:
            query = query.filter(Feedback.status == FeedbackStatus(status_filter.lower()))
        except ValueError:
            pass

    feedbacks = query.order_by(Feedback.created_at.desc()).all()
    results = []

    for fb in feedbacks:
        user_email = fb.user.email if fb.user else None
        user_name = fb.user.name if fb.user else None

        msg_preview = None
        if fb.message:
            raw_text = fb.message.content or ""
            msg_preview = raw_text[:160] + "..." if len(raw_text) > 160 else raw_text

        results.append(
            FeedbackOut(
                id=fb.id,
                user_id=fb.user_id,
                user_email=user_email,
                user_name=user_name,
                message_id=fb.message_id,
                message_preview=msg_preview,
                feedback_type=fb.feedback_type.value if hasattr(fb.feedback_type, "value") else str(fb.feedback_type),
                reason=fb.reason.value if (fb.reason and hasattr(fb.reason, "value")) else (str(fb.reason) if fb.reason else None),
                comment=fb.comment,
                status=fb.status.value if hasattr(fb.status, "value") else str(fb.status),
                is_general=fb.is_general,
                created_at=fb.created_at,
            )
        )

    return results


@router.patch("/{feedback_id}/status", response_model=FeedbackOut)
def update_feedback_status(
    feedback_id: int,
    body: FeedbackStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin endpoint — update review status of a feedback item (baru -> ditinjau -> diperbaiki)."""
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback tidak ditemukan.")

    try:
        new_status = FeedbackStatus(body.status.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status tidak valid. Pilihan: 'baru', 'ditinjau', atau 'diperbaiki'.",
        )

    fb.status = new_status
    fb.reviewed_at = datetime.now()
    db.commit()
    db.refresh(fb)

    user_email = fb.user.email if fb.user else None
    user_name = fb.user.name if fb.user else None
    msg_preview = fb.message.content[:160] if fb.message else None

    return FeedbackOut(
        id=fb.id,
        user_id=fb.user_id,
        user_email=user_email,
        user_name=user_name,
        message_id=fb.message_id,
        message_preview=msg_preview,
        feedback_type=fb.feedback_type.value if hasattr(fb.feedback_type, "value") else str(fb.feedback_type),
        reason=fb.reason.value if (fb.reason and hasattr(fb.reason, "value")) else None,
        comment=fb.comment,
        status=fb.status.value if hasattr(fb.status, "value") else str(fb.status),
        is_general=fb.is_general,
        created_at=fb.created_at,
    )
