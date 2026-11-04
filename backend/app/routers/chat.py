"""Chat router — Phase 4 will implement full RAG pipeline. Stub for Phase 1."""
from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("")
@limiter.limit("20/minute")
def ask_question(request: Request, current_user: User = Depends(get_current_user)):
    """Placeholder — implemented in Phase 4."""
    return {"message": "Phase 4 akan mengimplementasikan RAG Q&A"}

