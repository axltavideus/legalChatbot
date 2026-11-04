"""Corpus router — Phase 3 will implement upload/parse/embed. Stub for Phase 1."""
from fastapi import APIRouter, Depends
from app.services.auth_service import require_admin
from app.models.user import User

router = APIRouter()


@router.get("")
def list_regulations(current_user: User = Depends(require_admin)):
    return {"message": "Phase 3 akan mengimplementasikan corpus management"}

