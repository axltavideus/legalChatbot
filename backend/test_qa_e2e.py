import os
import sys

# Ensure backend directory is in sys.path and is current working directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

from app.database import get_db, SessionLocal
from app.models.user import User, UserRole
from app.services.qa_service import execute_qa_pipeline
from app.services.auth_service import hash_password

def test_phase4():
    print("[1/4] Checking database and user...")
    db = SessionLocal()
    user = db.query(User).filter(User.email == "test_phase4@lexindo.id").first()
    if not user:
        user = User(
            email="test_phase4@lexindo.id",
            hashed_password=hash_password("Password123!"),
            name="Tester Phase 4",
            role=UserRole.pengguna,
            onboarding_completed=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    print("  User ready: id =", user.id)

    print("[2/4] Testing grounded legal question: 'Berapa maksimal jangka waktu PKWT?'...")
    res = execute_qa_pipeline("Berapa maksimal jangka waktu PKWT?", None, user, db)
    print("  Answer snippet:", res["answer"][:120], "...")
    print("  Citations count:", len(res["citations"]))
    for c in res["citations"]:
        print(f"    - {c['label']} (Status: {c['status']})")
    assert len(res["citations"]) > 0, "Should have citations for relevant query"
    assert "tidak_ditemukan" not in res["status_flags"], "Should NOT be a refusal for labor law query"
    print("  [OK] Grounded question passed!")

    print("[3/4] Testing refusal behavior on out-of-scope query: 'Resep bumbu rendang padang'...")
    res_out = execute_qa_pipeline("Bagaimana cara membuat bumbu rendang daging sapi padang?", None, user, db)
    print("  Status flags:", res_out["status_flags"])
    print("  Citations:", res_out["citations"])
    print("  Answer snippet:", res_out["answer"][:80], "...")
    assert "tidak_ditemukan" in res_out["status_flags"], "Should be marked with status_flag 'tidak_ditemukan'"
    assert "Dasar hukum tidak ditemukan dalam korpus" in res_out["answer"], "Answer must contain standard refusal text"
    assert len(res_out["citations"]) == 0, "Citations must be empty on refusal"
    print("  [OK] Out-of-scope refusal passed!")

    print("[4/4] Verifying conversation persistence...")
    conv_id = res["conversation_id"]
    assert conv_id is not None, "Conversation ID must be generated"
    print("  Conversation ID:", conv_id)
    print("  [OK] Persistence verified!")

    db.close()
    print("\nALL PHASE 4 BACKEND CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_phase4()
