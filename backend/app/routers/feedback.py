from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.feedback import Feedback, SentimentResult, FeedbackTheme
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackOut
from app.core.dependencies import get_current_user, get_current_admin
from app.services.feedback_service import create_feedback_with_analysis

router = APIRouter(tags=["Feedback"])

def _enrich(fb: Feedback) -> dict:
    sr = fb.sentiment_result
    themes = [t.theme for t in (fb.themes or [])]
    return {
        "id": fb.id,
        "user_id": fb.user_id,
        "booking_id": fb.booking_id,
        "rating": fb.rating,
        "feedback_text": fb.feedback_text,
        "category": fb.category,
        "created_at": fb.created_at.isoformat() if fb.created_at else None,
        "guest_name": fb.user.full_name if fb.user else None,
        "sentiment": sr.sentiment if sr else None,
        "confidence_score": sr.confidence_score if sr else None,
        "themes": themes,
    }

@router.post("/api/feedback", response_model=dict, status_code=201)
def submit_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fb = create_feedback_with_analysis(
        db=db,
        user=current_user,
        rating=payload.rating,
        feedback_text=payload.feedback_text,
        category=payload.category or "General",
        booking_id=payload.booking_id,
    )
    return _enrich(fb)

@router.get("/api/feedback/my", response_model=List[dict])
def my_feedback(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fbs = db.query(Feedback).filter(Feedback.user_id == current_user.id).order_by(Feedback.created_at.desc()).all()
    return [_enrich(fb) for fb in fbs]

@router.get("/api/admin/feedback", response_model=List[dict])
def all_feedback(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    fbs = db.query(Feedback).order_by(Feedback.created_at.desc()).all()
    return [_enrich(fb) for fb in fbs]

@router.get("/api/admin/feedback/{feedback_id}", response_model=dict)
def get_feedback(feedback_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return _enrich(fb)

@router.delete("/api/admin/feedback/{feedback_id}", status_code=204)
def delete_feedback(feedback_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    db.delete(fb)
    db.commit()
