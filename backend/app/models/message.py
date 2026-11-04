"""Message model — a single turn (user question or assistant answer) in a conversation."""
import enum
from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, JSON, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MessageRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"), nullable=False, index=True)
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Structured RAG output stored as JSON (citations, status_flags, conflicts)
    citations: Mapped[list | None] = mapped_column(JSON, nullable=True)
    status_flags: Mapped[list | None] = mapped_column(JSON, nullable=True)
    conflicts: Mapped[list | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
    feedbacks: Mapped[list["Feedback"]] = relationship("Feedback", back_populates="message", cascade="all, delete-orphan")

