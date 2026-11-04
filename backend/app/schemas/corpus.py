"""Corpus Pydantic schemas for regulation ingestion and management."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.regulation import RegulationType, RegulationStatus
from app.models.pasal_chunk import ChunkStatus


class ParsedChunkIn(BaseModel):
    bab: Optional[str] = None
    pasal: str
    ayat: Optional[str] = None
    text: str
    status: Optional[str] = "berlaku"
    amended_by_id: Optional[int] = None


class PreviewResponse(BaseModel):
    total_chunks: int
    chunks: List[ParsedChunkIn]


class IngestRegulationRequest(BaseModel):
    reg_type: RegulationType
    number: str
    year: int
    title: str
    status: RegulationStatus = RegulationStatus.berlaku
    source_url: Optional[str] = None
    chunks: List[ParsedChunkIn]


class PasalChunkOut(BaseModel):
    id: int
    bab: Optional[str]
    pasal: str
    ayat: Optional[str]
    text: str
    status: str
    amended_by_id: Optional[int]

    model_config = {"from_attributes": True}


class RegulationDetailOut(BaseModel):
    id: int
    reg_type: str
    number: str
    year: int
    title: str
    status: str
    source_url: Optional[str]
    chunks_count: int
    created_at: datetime
    chunks: Optional[List[PasalChunkOut]] = None

    model_config = {"from_attributes": True}

