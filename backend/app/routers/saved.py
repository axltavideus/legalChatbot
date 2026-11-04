"""Saved items router — Phase 6 will implement. Stub for Phase 1."""
from fastapi import APIRouter, Depends
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("")
def list_saved(current_user: User = Depends(get_current_user)):
    return {"message": "Phase 6 akan mengimplementasikan save & export"}

