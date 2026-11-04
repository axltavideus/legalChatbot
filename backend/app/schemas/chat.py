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


class CitationOut(BaseModel):
    pasal_chunk_id: int
    label: str          # e.g. "UU 13/2003 Pasal 59 ayat (1)"
    text: str
    status: str         # berlaku / diubah / dicabut


class ConflictOut(BaseModel):
    description: str
    higher_reg: str
    lower_reg: str


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

