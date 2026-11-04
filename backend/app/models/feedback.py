"""Feedback model — user feedback on an individual answer or general app feedback."""
import enum
from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, Enum, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FeedbackType(str, enum.Enum):
    thumbs_up = "thumbs_up"
    thumbs_down = "thumbs_down"


class FeedbackReason(str, enum.Enum):
    sitasi_salah = "sitasi_salah"
    jawaban_keliru = "jawaban_keliru"
    peraturan_tidak_berlaku = "peraturan_tidak_berlaku"
    lainnya = "lainnya"


class FeedbackStatus(str, enum.Enum):
    baru = "baru"
    ditinjau = "ditinjau"
    diperbaiki = "diperbaiki"


class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    message_id: Mapped[int | None] = mapped_column(ForeignKey("messages.id"), nullable=True)  # None for general feedback
    feedback_type: Mapped[FeedbackType] = mapped_column(Enum(FeedbackType), nullable=False)
    reason: Mapped[FeedbackReason | None] = mapped_column(Enum(FeedbackReason), nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[FeedbackStatus] = mapped_column(Enum(FeedbackStatus), default=FeedbackStatus.baru)
    is_general: Mapped[bool] = mapped_column(Boolean, default=False)  # True = from profile menu
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="feedbacks")
    message: Mapped["Message | None"] = relationship("Message", back_populates="feedbacks")

