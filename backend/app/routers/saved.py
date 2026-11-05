"""Saved items and folders router (BP5).

Enables users to organize research answers into custom folders, add personal notes,
and export research collections as professional PDF documents with citations and disclaimers.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.services.auth_service import get_current_user
from app.models.user import User
from app.models.folder import Folder
from app.models.saved_item import SavedItem
from app.models.message import Message, MessageRole
from app.models.conversation import Conversation
from app.schemas.saved import (
    FolderCreate, FolderUpdate, FolderOut,
    SavedItemCreate, SavedItemUpdate, SavedItemOut,
)
from app.services.export_service import generate_research_pdf

router = APIRouter()


def _get_preceding_question(message: Message, db: Session) -> str:
    """Find the user question immediately preceding this assistant message."""
    prev_msg = (
        db.query(Message)
        .filter(
            Message.conversation_id == message.conversation_id,
            Message.id < message.id,
            Message.role == MessageRole.user,
        )
        .order_by(Message.id.desc())
        .first()
    )
    if prev_msg:
        return prev_msg.content

    # Fallback to conversation title
    conv = db.query(Conversation).filter(Conversation.id == message.conversation_id).first()
    return conv.title if conv else "Pertanyaan Hukum Ketenagakerjaan"


# ---------------------------------------------------------------------------
# Folders CRUD
# ---------------------------------------------------------------------------

@router.post("/folders", response_model=FolderOut, status_code=status.HTTP_201_CREATED)
def create_folder(
    body: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new folder for organizing legal research answers."""
    cleaned_name = body.name.strip()
    if not cleaned_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nama folder tidak boleh kosong.")

    # Check for duplicate folder name for this user
    existing = (
        db.query(Folder)
        .filter(Folder.user_id == current_user.id, Folder.name == cleaned_name)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Folder dengan nama '{cleaned_name}' sudah ada.",
        )

    folder = Folder(user_id=current_user.id, name=cleaned_name)
    db.add(folder)
    db.commit()
    db.refresh(folder)

    return FolderOut(
        id=folder.id,
        user_id=folder.user_id,
        name=folder.name,
        created_at=folder.created_at,
        items_count=0,
    )


@router.get("/folders", response_model=List[FolderOut])
def list_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all folders owned by the current user, with item counts."""
    folders = (
        db.query(Folder)
        .filter(Folder.user_id == current_user.id)
        .order_by(Folder.created_at.desc())
        .all()
    )

    out = []
    for f in folders:
        count = db.query(func.count(SavedItem.id)).filter(SavedItem.folder_id == f.id).scalar() or 0
        out.append(
            FolderOut(
                id=f.id,
                user_id=f.user_id,
                name=f.name,
                created_at=f.created_at,
                items_count=count,
            )
        )
    return out


@router.patch("/folders/{folder_id}", response_model=FolderOut)
def update_folder(
    folder_id: int,
    body: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rename a folder."""
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder tidak ditemukan.")

    cleaned_name = body.name.strip()
    if not cleaned_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nama folder tidak boleh kosong.")

    folder.name = cleaned_name
    db.commit()
    db.refresh(folder)

    count = db.query(func.count(SavedItem.id)).filter(SavedItem.folder_id == folder.id).scalar() or 0
    return FolderOut(
        id=folder.id,
        user_id=folder.user_id,
        name=folder.name,
        created_at=folder.created_at,
        items_count=count,
    )


@router.delete("/folders/{folder_id}", status_code=status.HTTP_200_OK)
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a folder. Any saved items inside are preserved by moving to root (folder_id=None)."""
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder tidak ditemukan.")

    # Re-assign saved items in this folder to None rather than deleting them
    db.query(SavedItem).filter(SavedItem.folder_id == folder.id).update({"folder_id": None})
    db.delete(folder)
    db.commit()

    return {"message": "Folder berhasil dihapus."}


# ---------------------------------------------------------------------------
# Saved Items CRUD
# ---------------------------------------------------------------------------

@router.post("/items", response_model=SavedItemOut, status_code=status.HTTP_201_CREATED)
def save_research_item(
    body: SavedItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save an assistant research turn into a folder with an optional note."""
    msg = db.query(Message).filter(Message.id == body.message_id).first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pesan riset tidak ditemukan.")

    # Validate folder ownership if provided
    folder_name = None
    if body.folder_id is not None:
        f = db.query(Folder).filter(Folder.id == body.folder_id, Folder.user_id == current_user.id).first()
        if not f:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder tidak ditemukan.")
        folder_name = f.name

    # Check if already saved by this user
    existing = (
        db.query(SavedItem)
        .filter(SavedItem.user_id == current_user.id, SavedItem.message_id == msg.id)
        .first()
    )
    if existing:
        # Update existing record
        existing.folder_id = body.folder_id
        if body.note is not None:
            existing.note = body.note
        db.commit()
        db.refresh(existing)
        item = existing
    else:
        item = SavedItem(
            user_id=current_user.id,
            message_id=msg.id,
            folder_id=body.folder_id,
            note=body.note,
        )
        db.add(item)
        db.commit()
        db.refresh(item)

    question = _get_preceding_question(msg, db)

    return SavedItemOut(
        id=item.id,
        user_id=item.user_id,
        message_id=item.message_id,
        folder_id=item.folder_id,
        folder_name=folder_name,
        note=item.note,
        created_at=item.created_at,
        question=question,
        answer=msg.content,
        citations=msg.citations or [],
        status_flags=msg.status_flags or [],
        conflicts=msg.conflicts or [],
    )


@router.get("/items", response_model=List[SavedItemOut])
def list_saved_items(
    folder_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List saved research items for current user, optionally filtered by folder."""
    query = (
        db.query(SavedItem)
        .filter(SavedItem.user_id == current_user.id)
        .order_by(SavedItem.created_at.desc())
    )
    if folder_id is not None:
        query = query.filter(SavedItem.folder_id == folder_id)

    items = query.all()
    results = []

    for itm in items:
        msg = itm.message
        folder_name = itm.folder.name if itm.folder else None
        q = _get_preceding_question(msg, db) if msg else "Pertanyaan tidak tersedia"
        a = msg.content if msg else ""
        cits = msg.citations if msg and msg.citations else []
        flags = msg.status_flags if msg and msg.status_flags else []
        confs = msg.conflicts if msg and msg.conflicts else []

        results.append(
            SavedItemOut(
                id=itm.id,
                user_id=itm.user_id,
                message_id=itm.message_id,
                folder_id=itm.folder_id,
                folder_name=folder_name,
                note=itm.note,
                created_at=itm.created_at,
                question=q,
                answer=a,
                citations=cits,
                status_flags=flags,
                conflicts=confs,
            )
        )
    return results


@router.patch("/items/{item_id}", response_model=SavedItemOut)
def update_saved_item(
    item_id: int,
    body: SavedItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update personal research note or move saved item to another folder."""
    item = db.query(SavedItem).filter(SavedItem.id == item_id, SavedItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Riset tersimpan tidak ditemukan.")

    if body.folder_id is not None:
        if body.folder_id > 0:
            f = db.query(Folder).filter(Folder.id == body.folder_id, Folder.user_id == current_user.id).first()
            if not f:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder tujuan tidak ditemukan.")
            item.folder_id = body.folder_id
        else:
            item.folder_id = None

    if body.note is not None:
        item.note = body.note

    db.commit()
    db.refresh(item)

    msg = item.message
    folder_name = item.folder.name if item.folder else None
    q = _get_preceding_question(msg, db) if msg else ""

    return SavedItemOut(
        id=item.id,
        user_id=item.user_id,
        message_id=item.message_id,
        folder_id=item.folder_id,
        folder_name=folder_name,
        note=item.note,
        created_at=item.created_at,
        question=q,
        answer=msg.content if msg else "",
        citations=msg.citations if msg and msg.citations else [],
        status_flags=msg.status_flags if msg and msg.status_flags else [],
        conflicts=msg.conflicts if msg and msg.conflicts else [],
    )


@router.delete("/items/{item_id}", status_code=status.HTTP_200_OK)
def delete_saved_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove an item from saved research."""
    item = db.query(SavedItem).filter(SavedItem.id == item_id, SavedItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Riset tersimpan tidak ditemukan.")

    db.delete(item)
    db.commit()
    return {"message": "Riset berhasil dihapus dari daftar tersimpan."}


# ---------------------------------------------------------------------------
# PDF Export Endpoints (BP5)
# ---------------------------------------------------------------------------

@router.get("/folders/{folder_id}/export")
def export_folder_as_pdf(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export all saved research items inside a folder as a formatted PDF report."""
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder tidak ditemukan.")

    items = (
        db.query(SavedItem)
        .filter(SavedItem.folder_id == folder.id, SavedItem.user_id == current_user.id)
        .order_by(SavedItem.created_at.asc())
        .all()
    )
    if not items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Folder ini masih kosong, belum ada riset tersimpan untuk diekspor.")

    pdf_items = []
    for itm in items:
        msg = itm.message
        q = _get_preceding_question(msg, db) if msg else "Topik Riset"
        pdf_items.append({
            "question": q,
            "answer": msg.content if msg else "",
            "note": itm.note,
            "citations": msg.citations if msg and msg.citations else [],
            "status_flags": msg.status_flags if msg and msg.status_flags else [],
            "created_at": itm.created_at,
        })

    pdf_buffer = generate_research_pdf(
        title=f"Koleksi: {folder.name}",
        user_name=current_user.name,
        user_institution=current_user.institution,
        items=pdf_items,
    )

    filename = f"LexIndo_Riset_{folder.name.replace(' ', '_')}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/items/{item_id}/export")
def export_single_item_as_pdf(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export a single saved research answer as a formatted PDF report."""
    item = db.query(SavedItem).filter(SavedItem.id == item_id, SavedItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Riset tersimpan tidak ditemukan.")

    msg = item.message
    q = _get_preceding_question(msg, db) if msg else "Riset Hukum"

    pdf_items = [{
        "question": q,
        "answer": msg.content if msg else "",
        "note": item.note,
        "citations": msg.citations if msg and msg.citations else [],
        "status_flags": msg.status_flags if msg and msg.status_flags else [],
        "created_at": item.created_at,
    }]

    pdf_buffer = generate_research_pdf(
        title=f"Catatan Riset #{item.id}",
        user_name=current_user.name,
        user_institution=current_user.institution,
        items=pdf_items,
    )

    filename = f"LexIndo_Riset_{item.id}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
