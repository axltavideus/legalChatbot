"""Feedback router — handles user feedback on answers and general app feedback."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import get_current_user, require_admin
from app.models.user import User
from app.models.feedback import Feedback, FeedbackType, FeedbackReason, FeedbackStatus
from app.schemas import FeedbackRequest, FeedbackOut

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
        "message": "Terima kasih atas feedback Anda! Masukan Anda sangat berharga untuk peningkatan akurasi LexIndo.",
        "id": feedback_entry.id,
    }


@router.get("", response_model=list[FeedbackOut])
def list_feedback(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin endpoint — list user feedbacks with optional status filter."""
    query = db.query(Feedback)
    if status_filter:
        try:
            query = query.filter(Feedback.status == FeedbackStatus(status_filter))
        except ValueError:
            pass
    feedbacks = query.order_by(Feedback.created_at.desc()).all()
    return feedbacks
