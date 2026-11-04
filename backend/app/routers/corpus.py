"""Corpus router — Ingestion, parsing, preview, and vector indexing for regulations."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import get_current_user, require_admin
from app.models.user import User
from app.models.regulation import Regulation, RegulationType, RegulationStatus
from app.models.pasal_chunk import PasalChunk, ChunkStatus
from app.schemas.corpus import (
    PreviewResponse, ParsedChunkIn, IngestRegulationRequest,
    RegulationDetailOut, PasalChunkOut,
)
from app.services.parsing_service import extract_text_from_bytes, parse_regulation_structure
from app.services.vector_store import upsert_pasal_chunks_batch, delete_regulation_chunks

router = APIRouter()


# ---------------------------------------------------------------------------
# BP1: Step 1 - Upload & Preview Parsing (No DB write yet)
# ---------------------------------------------------------------------------

@router.post("/preview", response_model=PreviewResponse)
async def preview_regulation(
    file: Optional[UploadFile] = File(default=None),
    raw_text: Optional[str] = Form(default=None),
    current_user: User = Depends(require_admin),
):
    """Admin endpoint: upload PDF/TXT or paste text to preview extracted Bab/Pasal/Ayat chunks."""
    content_text = ""
    if file:
        file_bytes = await file.read()
        content_text = extract_text_from_bytes(file_bytes, file.filename or "document.txt")
    elif raw_text:
        content_text = raw_text
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wajib mengunggah berkas PDF/TXT atau menyertakan teks naskah peraturan.",
        )

    parsed_chunks = parse_regulation_structure(content_text)
    chunks_in = [
        ParsedChunkIn(
            bab=c.bab,
            pasal=c.pasal,
            ayat=c.ayat,
            text=c.text,
            status="berlaku",
        )
        for c in parsed_chunks
    ]

    return PreviewResponse(
        total_chunks=len(chunks_in),
        chunks=chunks_in,
    )


# ---------------------------------------------------------------------------
# BP1: Step 2 - Confirm & Index into DB + ChromaDB
# ---------------------------------------------------------------------------

@router.post("/confirm", response_model=RegulationDetailOut, status_code=status.HTTP_201_CREATED)
def confirm_and_index_regulation(
    body: IngestRegulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin endpoint: confirm metadata and chunks, persist to SQLite and index to ChromaDB."""
    # 1. Create Regulation record
    reg = Regulation(
        reg_type=body.reg_type,
        number=body.number.strip(),
        year=body.year,
        title=body.title.strip(),
        status=body.status,
        source_url=body.source_url.strip() if body.source_url else None,
    )
    db.add(reg)
    db.flush()  # get reg.id

    # 2. Create PasalChunk records
    pasal_models: List[PasalChunk] = []
    for c in body.chunks:
        chunk_status = ChunkStatus.berlaku
        if c.status in [s.value for s in ChunkStatus]:
            chunk_status = ChunkStatus(c.status)

        chunk_model = PasalChunk(
            regulation_id=reg.id,
            bab=c.bab,
            pasal=c.pasal,
            ayat=c.ayat,
            text=c.text,
            status=chunk_status,
            amended_by_id=c.amended_by_id,
        )
        db.add(chunk_model)
        pasal_models.append(chunk_model)

    db.flush()

    # 3. Batch Index to ChromaDB
    chroma_ids: List[str] = []
    chroma_texts: List[str] = []
    chroma_metas: List[dict] = []

    for chunk in pasal_models:
        cid = f"chunk_{chunk.id}"
        chunk.chroma_id = cid

        label = f"{reg.short_name} Pasal {chunk.pasal}"
        if chunk.ayat:
            label += f" ayat ({chunk.ayat})"

        chroma_ids.append(cid)
        chroma_texts.append(chunk.text)
        chroma_metas.append({
            "chunk_id": chunk.id,
            "regulation_id": reg.id,
            "reg_type": reg.reg_type.value,
            "number": reg.number,
            "year": reg.year,
            "title": reg.title,
            "bab": chunk.bab or "",
            "pasal": chunk.pasal,
            "ayat": chunk.ayat or "",
            "status": chunk.status.value,
            "citation_label": label,
        })

    upsert_pasal_chunks_batch(chroma_ids, chroma_texts, chroma_metas)

    db.commit()
    db.refresh(reg)

    return RegulationDetailOut(
        id=reg.id,
        reg_type=reg.reg_type.value,
        number=reg.number,
        year=reg.year,
        title=reg.title,
        status=reg.status.value,
        source_url=reg.source_url,
        chunks_count=len(pasal_models),
        created_at=reg.created_at,
        chunks=[
            PasalChunkOut(
                id=p.id,
                bab=p.bab,
                pasal=p.pasal,
                ayat=p.ayat,
                text=p.text,
                status=p.status.value,
                amended_by_id=p.amended_by_id,
            )
            for p in pasal_models
        ],
    )


# ---------------------------------------------------------------------------
# List all indexed regulations (accessible to authenticated users)
# ---------------------------------------------------------------------------

@router.get("", response_model=List[RegulationDetailOut])
def list_regulations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all indexed regulations with chunk counts."""
    regs = db.query(Regulation).order_by(Regulation.year.desc(), Regulation.id.desc()).all()
    out = []
    for r in regs:
        out.append(
            RegulationDetailOut(
                id=r.id,
                reg_type=r.reg_type.value,
                number=r.number,
                year=r.year,
                title=r.title,
                status=r.status.value,
                source_url=r.source_url,
                chunks_count=len(r.pasal_chunks),
                created_at=r.created_at,
            )
        )
    return out


# ---------------------------------------------------------------------------
# Get regulation details with full Pasal list
# ---------------------------------------------------------------------------

@router.get("/{regulation_id}", response_model=RegulationDetailOut)
def get_regulation(
    regulation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single regulation with all its Pasal chunks."""
    reg = db.get(Regulation, regulation_id)
    if not reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Peraturan tidak ditemukan.")

    return RegulationDetailOut(
        id=reg.id,
        reg_type=reg.reg_type.value,
        number=reg.number,
        year=reg.year,
        title=reg.title,
        status=reg.status.value,
        source_url=reg.source_url,
        chunks_count=len(reg.pasal_chunks),
        created_at=reg.created_at,
        chunks=[
            PasalChunkOut(
                id=p.id,
                bab=p.bab,
                pasal=p.pasal,
                ayat=p.ayat,
                text=p.text,
                status=p.status.value,
                amended_by_id=p.amended_by_id,
            )
            for p in reg.pasal_chunks
        ],
    )


# ---------------------------------------------------------------------------
# Delete regulation and clean up chunks from ChromaDB & SQLite
# ---------------------------------------------------------------------------

@router.delete("/{regulation_id}", status_code=status.HTTP_200_OK)
def delete_regulation(
    regulation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin endpoint: remove a regulation and its vector embeddings."""
    reg = db.get(Regulation, regulation_id)
    if not reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Peraturan tidak ditemukan.")

    # Remove from ChromaDB
    delete_regulation_chunks(regulation_id)

    # Remove from SQLite (cascade deletes pasal_chunks)
    db.delete(reg)
    db.commit()

    return {"message": f"Peraturan {reg.short_name} berhasil dihapus dari korpus."}
