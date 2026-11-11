from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.pricing import PricingRecommendation
from app.models.room import Room
from app.models.user import User
from app.core.dependencies import get_current_admin
from app.services.pricing_service import generate_pricing_recommendations

router = APIRouter(prefix="/api/admin/pricing", tags=["Pricing"])

def _enrich(pr: PricingRecommendation) -> dict:
    return {
        "id": pr.id,
        "room_id": pr.room_id,
        "room_name": pr.room.name if pr.room else None,
        "room_type": pr.room.type if pr.room else None,
        "current_price": pr.current_price,
        "recommended_price": pr.recommended_price,
        "live_room_price": pr.room.current_price if pr.room else pr.recommended_price,
        "price_difference": pr.price_difference,
        "demand_level": pr.demand_level,
        "availability_level": pr.availability_level,
        "recommendation_reason": pr.recommendation_reason,
        "status": pr.status,
        "generated_at": pr.generated_at.isoformat() if pr.generated_at else None,
        "reviewed_at": pr.reviewed_at.isoformat() if pr.reviewed_at else None,
        "reviewed_by": pr.reviewed_by.full_name if pr.reviewed_by else None,
    }

@router.get("", response_model=List[dict])
def list_recommendations(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    prs = db.query(PricingRecommendation).order_by(PricingRecommendation.generated_at.desc()).all()
    return [_enrich(pr) for pr in prs]

@router.post("/generate", response_model=List[dict], status_code=201)
def generate_recommendations(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    prs = generate_pricing_recommendations(db)
    return [_enrich(pr) for pr in prs]

@router.put("/{rec_id}/approve", response_model=dict)
def approve_recommendation(rec_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    pr = db.query(PricingRecommendation).filter(PricingRecommendation.id == rec_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    pr.status = "approved"
    pr.reviewed_at = datetime.now(timezone.utc)
    pr.reviewed_by_id = admin.id

    # Automatically update room current_price to recommended_price upon approval
    if pr.room_id:
        room = db.query(Room).filter(Room.id == pr.room_id).first()
        if room:
            room.current_price = pr.recommended_price
            room.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(pr)
    return _enrich(pr)

@router.put("/{rec_id}/reject", response_model=dict)
def reject_recommendation(rec_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    pr = db.query(PricingRecommendation).filter(PricingRecommendation.id == rec_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    pr.status = "rejected"
    pr.reviewed_at = datetime.now(timezone.utc)
    pr.reviewed_by_id = admin.id
    db.commit()
    db.refresh(pr)
    return _enrich(pr)
