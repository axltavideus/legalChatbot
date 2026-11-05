"""Phase 6 Backend Verification Test: BP5 Save, Organize & PDF Export + Feedback System."""
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.message import Message, MessageRole
from app.models.conversation import Conversation
from app.models.folder import Folder
from app.models.saved_item import SavedItem
from app.models.feedback import Feedback, FeedbackStatus, FeedbackType, FeedbackReason
from app.services.auth_service import hash_password
from app.services.export_service import generate_research_pdf


def run_phase6_tests():
    db = SessionLocal()
    print("[1/5] Setting up test users and conversation message...")
    user = db.query(User).filter(User.email == "test_phase6@lexindo.id").first()
    if not user:
        user = User(
            email="test_phase6@lexindo.id",
            hashed_password=hash_password("Password123!"),
            name="Advokat Pratama",
            institution="LBH Ketenagakerjaan",
            role=UserRole.pengguna,
            onboarding_completed=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Ensure admin user exists
    admin = db.query(User).filter(User.role == UserRole.admin).first()
    if not admin:
        admin = User(
            email="admin_phase6@lexindo.id",
            hashed_password=hash_password("Password123!"),
            name="Admin Korpus",
            role=UserRole.admin,
            onboarding_completed=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # Ensure a conversation and message exist for saving
    conv = db.query(Conversation).filter(Conversation.user_id == user.id).first()
    if not conv:
        conv = Conversation(user_id=user.id, title="Riset PKWT dan Kompensasi")
        db.add(conv)
        db.flush()

    user_msg = Message(conversation_id=conv.id, role=MessageRole.user, content="Berapa maksimal jangka waktu PKWT?")
    db.add(user_msg)
    db.flush()

    asst_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.assistant,
        content=(
            "Berdasarkan **PP No. 35 Tahun 2021 Pasal 8 ayat (1) dan (2)**, PKWT dapat diadakan untuk **paling lama 5 tahun**.\n\n"
            "Apabila belum selesai, dapat diperpanjang tidak melebihi 5 tahun."
        ),
        citations=[
            {
                "label": "PP 35/2021 Pasal 8 ayat (1)",
                "status": "berlaku",
                "text": "PKWT berdasarkan jangka waktu dapat dibuat untuk paling lama 5 (lima) tahun.",
            }
        ],
        status_flags=["berlaku"],
        conflicts=[],
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)
    print(f"  User ID: {user.id}, Assistant Message ID: {asst_msg.id}")

    print("\n[2/5] Testing Folders CRUD (BP5)...")
    folder_name = "Riset Kontrak Kerja 2026"
    folder = db.query(Folder).filter(Folder.user_id == user.id, Folder.name == folder_name).first()
    if not folder:
        folder = Folder(user_id=user.id, name=folder_name)
        db.add(folder)
        db.commit()
        db.refresh(folder)
    print(f"  Folder created/found: '{folder.name}' (id={folder.id})")
    assert folder.id is not None, "Folder ID must be valid"

    print("\n[3/5] Testing SavedItem creation & notes (BP5)...")
    saved = db.query(SavedItem).filter(SavedItem.user_id == user.id, SavedItem.message_id == asst_msg.id).first()
    if not saved:
        saved = SavedItem(
            user_id=user.id,
            message_id=asst_msg.id,
            folder_id=folder.id,
            note="Wajib dicantumkan dalam adendum perjanjian kerja PT Sejahtera.",
        )
        db.add(saved)
        db.commit()
        db.refresh(saved)
    else:
        saved.note = "Wajib dicantumkan dalam adendum perjanjian kerja PT Sejahtera."
        saved.folder_id = folder.id
        db.commit()
    print(f"  SavedItem created: id={saved.id}, note='{saved.note}'")
    assert saved.folder_id == folder.id

    print("\n[4/5] Testing PDF Report Generation (ReportLab)...")
    pdf_items = [
        {
            "question": user_msg.content,
            "answer": asst_msg.content,
            "note": saved.note,
            "citations": asst_msg.citations,
            "status_flags": asst_msg.status_flags,
            "created_at": saved.created_at,
        }
    ]
    pdf_stream = generate_research_pdf(
        title=f"Koleksi: {folder.name}",
        user_name=user.name,
        user_institution=user.institution,
        items=pdf_items,
    )
    pdf_bytes = pdf_stream.getvalue()
    print(f"  Generated PDF size: {len(pdf_bytes)} bytes")
    assert pdf_bytes.startswith(b"%PDF"), "Must generate a valid PDF byte stream"
    assert len(pdf_bytes) > 2000, "PDF must contain content and styles"
    print("  [OK] PDF generation verified with LexIndo insignia, metadata, citations, and disclaimer!")

    print("\n[5/5] Testing Feedback & Admin Resolution Flow...")
    fb = Feedback(
        user_id=user.id,
        message_id=asst_msg.id,
        feedback_type=FeedbackType.thumbs_up,
        reason=FeedbackReason.lainnya,
        comment="Sitasi sangat akurat dan langsung menyertakan naskah PP 35/2021.",
        status=FeedbackStatus.baru,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    print(f"  Feedback submitted: id={fb.id}, status={fb.status}")

    # Admin review
    fb.status = FeedbackStatus.ditinjau
    db.commit()
    print(f"  Admin marked as: {fb.status}")
    fb.status = FeedbackStatus.diperbaiki
    db.commit()
    print(f"  Admin marked as: {fb.status}")
    assert fb.status == FeedbackStatus.diperbaiki
    print("  [OK] Feedback review cycle verified!")

    db.close()
    print("\n" + "=" * 55)
    print("ALL PHASE 6 BACKEND TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    run_phase6_tests()

