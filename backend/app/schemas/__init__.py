"""Placeholder schemas for other routers — will be expanded in later phases."""
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# --- Chat ---
class ChatRequest(BaseModel):
    question: str
    conversation_id: Optional[int] = None


class CitationOut(BaseModel):
    pasal_chunk_id: int
    label: str          # e.g. "UU 13/2003 Pasal 59 ayat 1"
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


# --- Corpus ---
class RegulationOut(BaseModel):
    id: int
    reg_type: str
    number: str
    year: int
    title: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Saved ---
class FolderOut(BaseModel):
    id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SaveItemRequest(BaseModel):
    message_id: int
    folder_id: Optional[int] = None
    note: Optional[str] = None


# --- Feedback ---
class FeedbackRequest(BaseModel):
    message_id: Optional[int] = None
    feedback_type: str          # thumbs_up / thumbs_down
    reason: Optional[str] = None
    comment: Optional[str] = None
    is_general: bool = False


class FeedbackOut(BaseModel):
    id: int
    user_id: int
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    message_id: Optional[int] = None
    message_preview: Optional[str] = None
    feedback_type: str
    reason: Optional[str] = None
    comment: Optional[str] = None
    status: str
    is_general: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class FeedbackStatusUpdate(BaseModel):
    status: str  # baru / ditinjau / diperbaiki


