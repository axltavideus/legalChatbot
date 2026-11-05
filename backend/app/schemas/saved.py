"""Pydantic schemas for Saved Items and Folders (BP5)."""
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# ---------------------------------------------------------------------------
# Folder Schemas
# ---------------------------------------------------------------------------

class FolderBase(BaseModel):
    name: str


class FolderCreate(FolderBase):
    pass


class FolderUpdate(FolderBase):
    pass


class FolderOut(FolderBase):
    id: int
    user_id: int
    created_at: datetime
    items_count: int = 0

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Saved Item Schemas
# ---------------------------------------------------------------------------

class SavedItemCreate(BaseModel):
    message_id: int
    folder_id: Optional[int] = None
    note: Optional[str] = None


class SavedItemUpdate(BaseModel):
    folder_id: Optional[int] = None
    note: Optional[str] = None


class SavedItemOut(BaseModel):
    id: int
    user_id: int
    message_id: int
    folder_id: Optional[int] = None
    folder_name: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime

    # Denormalized context from message and conversation for seamless display
    question: str
    answer: str
    citations: List[Any] = []
    status_flags: List[str] = []
    conflicts: List[Any] = []

    model_config = {"from_attributes": True}

