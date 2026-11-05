"""PlanInterest model — tracks user interest in subscription tiers (mockup checkout validation)."""
from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PlanInterest(Base):
    __tablename__ = "plan_interests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    plan_name: Mapped[str] = mapped_column(String(100), nullable=False)   # e.g. "Individu", "Tim", "Institusi"
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationship
    user: Mapped["User"] = relationship("User")

