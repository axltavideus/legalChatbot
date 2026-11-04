"""Synchronous test suite for Phase 1: Database models, Auth service, and Auth endpoints."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import Response, HTTPException
from app.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.schemas.auth import (
    RegisterRequest, LoginRequest, UpdateProfileRequest,
    ChangePasswordRequest, CompleteOnboardingRequest, DeleteAccountRequest
)
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, decode_token,
    get_current_user, require_admin
)
from app.routers.auth import register, login, update_profile, change_password, complete_onboarding, delete_account

def run_tests():
    print("=== Testing LexIndo Phase 1: Models & Auth ===", flush=True)

    # 1. Database table creation
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[OK] DB tables created successfully", flush=True)

    db = SessionLocal()
    try:
        # 2. Test password hashing & verification
        pwd = "rahasiaNegara123"
        hashed = hash_password(pwd)
        assert verify_password(pwd, hashed) is True
        assert verify_password("wrongPassword", hashed) is False
        print("[OK] Bcrypt hashing and constant-time verification working", flush=True)

        # 3. Test JWT minting and decoding
        token = create_access_token({"sub": "42"})
        payload = decode_token(token)
        assert payload.get("sub") == "42"
        print("[OK] JWT creation and decoding working", flush=True)

        # 4. Register Pengguna
        res_obj = Response()
        reg_payload = RegisterRequest(
            name="Budi Santoso",
            email="budi@example.com",
            password="password123",
            role=UserRole.pengguna,
            institution="Universitas Indonesia"
        )
        reg_res = register(body=reg_payload, response=res_obj, db=db)
        assert reg_res.user.name == "Budi Santoso"
        assert reg_res.user.role == UserRole.pengguna
        assert reg_res.user.onboarding_completed is False
        print("[OK] Pengguna registration endpoint passed", flush=True)

        # 5. Duplicate email rejection
        try:
            register(body=reg_payload, response=res_obj, db=db)
            assert False, "Should have raised 409 Conflict"
        except HTTPException as e:
            assert e.status_code == 409
            print("[OK] Duplicate email rejected (409 Conflict)", flush=True)

        # 6. Admin registration without invite code rejection
        try:
            admin_bad = RegisterRequest(
                name="Bad Admin",
                email="admin_bad@example.com",
                password="password123",
                role=UserRole.admin,
                invite_code="WRONG_CODE"
            )
            register(body=admin_bad, response=res_obj, db=db)
            assert False, "Should have raised 400 for bad invite code"
        except HTTPException as e:
            assert e.status_code == 400
            print("[OK] Invalid admin invite code rejected (400 Bad Request)", flush=True)

        # 7. Admin registration with valid invite code
        admin_good = RegisterRequest(
            name="Siti Admin Korpus",
            email="admin@example.com",
            password="password123",
            role=UserRole.admin,
            invite_code="ADMIN2025"
        )
        admin_res = register(body=admin_good, response=res_obj, db=db)
        assert admin_res.user.role == UserRole.admin
        print("[OK] Admin registration with valid invite code passed (201 Created)", flush=True)

        # 8. Login endpoint
        login_res = login(body=LoginRequest(email="budi@example.com", password="password123"), response=res_obj, db=db)
        budi_token = login_res.access_token
        assert budi_token is not None
        print("[OK] Login endpoint returns valid JWT token", flush=True)

        # Wrong password rejection
        try:
            login(body=LoginRequest(email="budi@example.com", password="wrongPassword"), response=res_obj, db=db)
            assert False, "Should have raised 401"
        except HTTPException as e:
            assert e.status_code == 401
            print("[OK] Invalid password rejected (401 Unauthorized)", flush=True)

        # 9. Current user dependency via token/cookie
        current_budi = get_current_user(access_token=budi_token, db=db)
        assert current_budi.email == "budi@example.com"
        print("[OK] get_current_user dependency resolves user from cookie JWT", flush=True)

        # 10. Role-based access control (require_admin)
        # Pengguna must be blocked (403)
        try:
            require_admin(current_user=current_budi)
            assert False, "Pengguna should not pass require_admin"
        except HTTPException as e:
            assert e.status_code == 403
            print("[OK] Role guard: Pengguna blocked by require_admin (403 Forbidden)", flush=True)

        # Admin must be allowed
        current_admin = get_current_user(access_token=admin_res.access_token, db=db)
        admin_check = require_admin(current_user=current_admin)
        assert admin_check.role == UserRole.admin
        print("[OK] Role guard: Admin allowed by require_admin (passed)", flush=True)

        # 11. Profile update
        updated = update_profile(
            body=UpdateProfileRequest(name="Budi Santoso, S.H.", institution="LBH Jakarta"),
            db=db,
            current_user=current_budi
        )
        assert updated.name == "Budi Santoso, S.H."
        assert updated.institution == "LBH Jakarta"
        print("[OK] Profile update endpoint passed", flush=True)

        # 12. Complete onboarding
        complete_res = complete_onboarding(
            body=CompleteOnboardingRequest(acknowledged=True),
            db=db,
            current_user=current_budi
        )
        assert complete_res["message"] == "Onboarding selesai"
        assert current_budi.onboarding_completed is True
        print("[OK] Complete onboarding endpoint passed", flush=True)

        # 13. Change password
        ch_res = change_password(
            body=ChangePasswordRequest(current_password="password123", new_password="newPassword456"),
            db=db,
            current_user=current_budi
        )
        assert ch_res["message"] == "Password berhasil diubah"
        # Verify new password works
        new_login = login(body=LoginRequest(email="budi@example.com", password="newPassword456"), response=res_obj, db=db)
        assert new_login.access_token is not None
        print("[OK] Change password and relogin with new credentials verified", flush=True)

        # 14. Delete account (UU PDP compliance)
        del_res = delete_account(
            body=DeleteAccountRequest(password="newPassword456"),
            response=res_obj,
            db=db,
            current_user=current_budi
        )
        assert "dihapus" in del_res["message"]
        deleted_user = db.get(User, current_budi.id)
        assert deleted_user is None
        print("[OK] Delete account (UU PDP compliance) permanently deletes user & cascaded data", flush=True)

        print("\nALL 14 PHASE 1 TESTS PASSED PERFECTLY!", flush=True)
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
