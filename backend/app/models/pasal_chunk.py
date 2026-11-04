"""PasalChunk model — one Pasal (or Ayat) from a regulation, stored as a vector-searchable chunk."""
import enum
from sqlalchemy import String, Integer, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ChunkStatus(str, enum.Enum):
    berlaku = "berlaku"
    diubah = "diubah"
    dicabut = "dicabut"


class PasalChunk(Base):
    __tablename__ = "pasal_chunks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    regulation_id: Mapped[int] = mapped_column(ForeignKey("regulations.id"), nullable=False, index=True)

    # Structural identifiers
    bab: Mapped[str | None] = mapped_column(String(100), nullable=True)    # e.g. "BAB II"
    pasal: Mapped[str] = mapped_column(String(50), nullable=False)          # e.g. "59"
    ayat: Mapped[str | None] = mapped_column(String(50), nullable=True)     # e.g. "1", "2"

    # Content
    text: Mapped[str] = mapped_column(Text, nullable=False)

    # Validity
    status: Mapped[ChunkStatus] = mapped_column(Enum(ChunkStatus), default=ChunkStatus.berlaku)
    amended_by_id: Mapped[int | None] = mapped_column(ForeignKey("pasal_chunks.id"), nullable=True)

    # ChromaDB vector ID for cross-referencing
    chroma_id: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)

    # Relationships
    regulation: Mapped["Regulation"] = relationship("Regulation", back_populates="pasal_chunks")
    amended_by: Mapped["PasalChunk | None"] = relationship("PasalChunk", remote_side="PasalChunk.id", foreign_keys=[amended_by_id])

    @property
    def citation_label(self) -> str:
        """Human-readable citation, e.g. 'UU 13/2003 Pasal 59 ayat 1'."""
        label = f"{self.regulation.short_name} Pasal {self.pasal}"
        if self.ayat:
            label += f" ayat {self.ayat}"
        return label

