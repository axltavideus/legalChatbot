"""Chat Pydantic schemas for Legal Q&A endpoint."""
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


class ChatRequest(BaseModel):
    question: str
    conversation_id: Optional[int] = None

    @field_validator("question")
    @classmethod
    def question_not_empty(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Pertanyaan tidak boleh kosong.")
        return cleaned


class AmendmentTimelineEntryOut(BaseModel):
    chunk_id: int
    citation_label: str
    peraturan: str
    reg_type: str
    pasal: str
    ayat: Optional[str] = None
    text: str
    status: str
    year: int
    is_current: bool


class AmendmentTimelineDataOut(BaseModel):
    original_chunk_id: int
    current_chunk_id: int
    is_amended: bool
    timeline: List[AmendmentTimelineEntryOut] = []


class CitationOut(BaseModel):
    pasal_chunk_id: int
    label: str          # e.g. "UU 13/2003 Pasal 59 ayat (1)"
    text: str
    status: str         # berlaku / diubah / dicabut
    peraturan: Optional[str] = None
    pasal_nomor: Optional[str] = None
    note: Optional[str] = None
    amendment_timeline: Optional[AmendmentTimelineDataOut] = None


class ConflictOut(BaseModel):
    topic: Optional[str] = None
    description: Optional[str] = None
    higher_reg: Optional[str] = None
    higher_chunk_id: Optional[int] = None
    higher_citation: Optional[str] = None
    higher_text: Optional[str] = None
    higher_level: Optional[int] = None
    lower_reg: Optional[str] = None
    lower_chunk_id: Optional[int] = None
    lower_citation: Optional[str] = None
    lower_text: Optional[str] = None
    lower_level: Optional[int] = None
    principle: Optional[str] = "Lex Superior Derogat Legi Inferiori"
    verdict: Optional[str] = None


class ChatResponse(BaseModel):
    conversation_id: int
    message_id: int
    answer: str
    citations: List[CitationOut] = []
    status_flags: List[str] = []
    conflicts: List[ConflictOut] = []


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    citations: Optional[List[CitationOut]] = None
    status_flags: Optional[List[str]] = None
    conflicts: Optional[List[ConflictOut]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: Optional[List[MessageOut]] = None

    model_config = {"from_attributes": True}

