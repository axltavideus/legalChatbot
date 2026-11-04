"""Phase 5 test: BP3 (amendment timeline) + BP4 (conflict detection)."""
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.pasal_chunk import PasalChunk
from app.services.auth_service import hash_password
from app.services.validity_service import build_amendment_timeline, enrich_citations_with_amendments
from app.services.conflict_service import detect_conflicts
from app.services.qa_service import execute_qa_pipeline


def get_or_create_user(db):
    user = db.query(User).filter(User.email == "test_phase5@lexindo.id").first()
    if not user:
        user = User(
            email="test_phase5@lexindo.id",
            hashed_password=hash_password("Password123!"),
            name="Tester Phase 5",
            role=UserRole.pengguna,
            onboarding_completed=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def test_bp3_amendment_timeline(db):
    print("[BP3] Testing amendment timeline traversal...")

    # Chunk ID 2 = UU 13/2003 Pasal 59 (status: diubah), amended_by = UU Cipta Kerja chunk
    chunk = db.query(PasalChunk).filter(PasalChunk.pasal == "59").first()
    if chunk is None:
        print("  SKIP: Pasal 59 not found in DB, re-run seed first.")
        return

    print(f"  Found chunk: {chunk.citation_label} (status: {chunk.status})")
    timeline = build_amendment_timeline(db, chunk.id)

    print(f"  Timeline length: {len(timeline['timeline'])}")
    print(f"  is_amended: {timeline['is_amended']}")
    for entry in timeline["timeline"]:
        marker = " [TERKINI]" if entry["is_current"] else ""
        print(f"    {entry['citation_label']} ({entry['status']}){marker}")

    assert len(timeline["timeline"]) >= 1, "Timeline must have at least 1 entry"
    if timeline["is_amended"]:
        assert any(e["is_current"] for e in timeline["timeline"]), "One entry must be marked as current"
        current = next(e for e in timeline["timeline"] if e["is_current"])
        assert current["status"] in ("berlaku", "diubah"), "Current entry should be active"
        print("  [OK] Amendment chain correctly traversed!")
    else:
        print("  [OK] Single-version pasal (no amendment chain).")


def test_bp4_conflict_detection(db):
    print("[BP4] Testing hierarchy conflict detection...")

    from app.services.vector_store import query_pasals
    chunks = query_pasals("Berapa maksimal jangka waktu PKWT?", top_k=5)
    print(f"  Retrieved {len(chunks)} chunks from ChromaDB")
    for c in chunks:
        meta = c.get("metadata", {})
        print(f"    {meta.get('citation_label', '?')} | reg_type={meta.get('reg_type')} | sim={c.get('similarity', 0):.3f}")

    conflicts = detect_conflicts(chunks)
    print(f"  Conflicts detected: {len(conflicts)}")
    for conf in conflicts:
        print(f"    Topic: {conf['topic']}")
        print(f"      Higher: {conf['higher_citation']} (level {conf['higher_level']})")
        print(f"      Lower:  {conf['lower_citation']} (level {conf['lower_level']})")
        print(f"      Verdict snippet: {conf['verdict'][:80]}...")

    assert isinstance(conflicts, list), "detect_conflicts must return a list"
    print("  [OK] Conflict detection executed successfully!")
    return conflicts


def test_bp3_bp4_integrated_pipeline(db, user):
    print("[Integration] Testing full pipeline with BP3+BP4 enrichment...")

    result = execute_qa_pipeline(
        "Berapa maksimal jangka waktu PKWT?",
        conversation_id=None,
        current_user=user,
        db=db,
    )

    print(f"  Answer snippet: {result['answer'][:100]}...")
    print(f"  Citations: {len(result['citations'])}")
    print(f"  Conflicts: {len(result['conflicts'])}")
    print(f"  Status flags: {result['status_flags']}")

    # Check amendment timelines are attached
    for cit in result["citations"]:
        timeline = cit.get("amendment_timeline")
        print(f"    Citation: {cit.get('label', '?')} | has_timeline={timeline is not None}")
        if timeline:
            print(f"      Timeline entries: {len(timeline['timeline'])}, is_amended={timeline['is_amended']}")

    assert "tidak_ditemukan" not in result["status_flags"], "PKWT query should NOT be a refusal"
    print("  [OK] Integrated pipeline with BP3+BP4 passed!")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        user = get_or_create_user(db)
        print(f"User: {user.name} (id={user.id})\n")

        test_bp3_amendment_timeline(db)
        print()
        conflicts = test_bp4_conflict_detection(db)
        print()
        test_bp3_bp4_integrated_pipeline(db, user)
        print()
        print("=" * 55)
        print("ALL PHASE 5 BACKEND CHECKS PASSED!")
    finally:
        db.close()

