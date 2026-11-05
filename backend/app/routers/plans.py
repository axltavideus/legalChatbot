"""Plans & Subscription interest router (mockup validation)."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import get_current_user
from app.models.user import User
from app.models.plan_interest import PlanInterest

router = APIRouter()


class PlanInterestRequest(BaseModel):
    plan_name: str


class PlanInterestResponse(BaseModel):
    message: str
    plan_name: str


@router.post("/interest", response_model=PlanInterestResponse, status_code=status.HTTP_201_CREATED)
def record_plan_interest(
    body: PlanInterestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save user interest in a subscription tier."""
    cleaned_plan = body.plan_name.strip()
    if not cleaned_plan:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nama paket tidak boleh kosong.")

    interest = PlanInterest(
        user_id=current_user.id,
        plan_name=cleaned_plan,
    )
    db.add(interest)
    db.commit()

    return PlanInterestResponse(
        message=f"Terima kasih atas minat Anda pada Paket {cleaned_plan}! Pilihan Anda telah tercatat dan tim kami akan segera menghubungi Anda saat paket ini resmi dirilis.",
        plan_name=cleaned_plan,
    )


@router.get("/interest")
def list_my_interests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List plans the current user has expressed interest in."""
    interests = (
        db.query(PlanInterest)
        .filter(PlanInterest.user_id == current_user.id)
        .order_by(PlanInterest.created_at.desc())
        .all()
    )
    return [{"plan_name": i.plan_name, "created_at": i.created_at} for i in interests]

