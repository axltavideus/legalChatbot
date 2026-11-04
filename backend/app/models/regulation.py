"""Regulation model — represents one official document (UU, PP, Perpres, etc.)."""
import enum
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Enum, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RegulationType(str, enum.Enum):
    UUD = "UUD"
    UU = "UU"
    PP = "PP"
    Perpres = "Perpres"
    Permen = "Permen"
    Perda = "Perda"


class RegulationStatus(str, enum.Enum):
    berlaku = "berlaku"
    diubah = "diubah"
    dicabut = "dicabut"


# Hierarchy level — lower number = higher authority
HIERARCHY_LEVEL = {
    RegulationType.UUD: 1,
    RegulationType.UU: 2,
    RegulationType.PP: 3,
    RegulationType.Perpres: 4,
    RegulationType.Permen: 5,
    RegulationType.Perda: 6,
}


class Regulation(Base):
    __tablename__ = "regulations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    reg_type: Mapped[RegulationType] = mapped_column(Enum(RegulationType), nullable=False)
    number: Mapped[str] = mapped_column(String(50), nullable=False)   # e.g. "13"
    year: Mapped[int] = mapped_column(Integer, nullable=False)         # e.g. 2003
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[RegulationStatus] = mapped_column(Enum(RegulationStatus), default=RegulationStatus.berlaku)
    source_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    pasal_chunks: Mapped[list["PasalChunk"]] = relationship("PasalChunk", back_populates="regulation", cascade="all, delete-orphan")

    @property
    def short_name(self) -> str:
        return f"{self.reg_type} {self.number}/{self.year}"

