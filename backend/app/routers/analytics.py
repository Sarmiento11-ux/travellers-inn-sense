from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from app.database.database import get_db
from app.models.feedback import Feedback, SentimentResult, FeedbackTheme
from app.models.booking import Booking
from app.models.room import Room
from app.models.pricing import PricingRecommendation
from app.core.dependencies import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Analytics"])

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    total_fb  = db.query(Feedback).count()
    positive  = db.query(SentimentResult).filter(SentimentResult.sentiment == "Positive").count()
    neutral   = db.query(SentimentResult).filter(SentimentResult.sentiment == "Neutral").count()
    negative  = db.query(SentimentResult).filter(SentimentResult.sentiment == "Negative").count()
    avg_rating = db.query(func.avg(Feedback.rating)).scalar() or 0
    total_bkg = db.query(Booking).count()
    pending_pr = db.query(PricingRecommendation).filter(PricingRecommendation.status == "pending").count()

    recent_fb = db.query(Feedback).order_by(Feedback.created_at.desc()).limit(5).all()
    recent = []
    for fb in recent_fb:
        sr = fb.sentiment_result
        recent.append({
            "id": fb.id,
            "guest_name": fb.user.full_name if fb.user else "Unknown",
            "rating": fb.rating,
            "category": fb.category,
            "feedback_text": fb.feedback_text,
            "sentiment": sr.sentiment if sr else None,
            "created_at": fb.created_at.isoformat() if fb.created_at else None,
        })

    return {
        "total_feedback": total_fb,
        "positive_feedback": positive,
        "neutral_feedback": neutral,
        "negative_feedback": negative,
        "average_rating": round(float(avg_rating), 2),
        "total_bookings": total_bkg,
        "pending_pricing_recommendations": pending_pr,
        "recent_feedback": recent,
    }

@router.get("/analytics/sentiment")
def sentiment_analytics(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    total = db.query(SentimentResult).count()
    positive = db.query(SentimentResult).filter(SentimentResult.sentiment == "Positive").count()
    neutral  = db.query(SentimentResult).filter(SentimentResult.sentiment == "Neutral").count()
    negative = db.query(SentimentResult).filter(SentimentResult.sentiment == "Negative").count()

    # All feedback with sentiment
    rows = (
        db.query(Feedback, SentimentResult)
        .outerjoin(SentimentResult, Feedback.id == SentimentResult.feedback_id)
        .order_by(Feedback.created_at.desc())
        .all()
    )
    items = []
    for fb, sr in rows:
        items.append({
            "id": fb.id,
            "guest_name": fb.user.full_name if fb.user else "Unknown",
            "rating": fb.rating,
            "category": fb.category,
            "feedback_text": fb.feedback_text,
            "sentiment": sr.sentiment if sr else None,
            "confidence_score": sr.confidence_score if sr else None,
            "created_at": fb.created_at.isoformat() if fb.created_at else None,
        })

    return {
        "total": total,
        "positive": positive,
        "neutral": neutral,
        "negative": negative,
        "positive_pct": round(positive / total * 100, 1) if total else 0,
        "neutral_pct":  round(neutral  / total * 100, 1) if total else 0,
        "negative_pct": round(negative / total * 100, 1) if total else 0,
        "items": items,
    }

@router.get("/analytics/feedback")
def feedback_analytics(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    avg_rating = db.query(func.avg(Feedback.rating)).scalar() or 0
    by_category = (
        db.query(Feedback.category, func.count(Feedback.id))
        .group_by(Feedback.category)
        .all()
    )
    return {
        "total": db.query(Feedback).count(),
        "average_rating": round(float(avg_rating), 2),
        "by_category": [{"category": c, "count": n} for c, n in by_category],
    }

@router.get("/analytics/themes")
def themes_analytics(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    by_theme = (
        db.query(FeedbackTheme.theme, func.count(FeedbackTheme.id))
        .group_by(FeedbackTheme.theme)
        .order_by(func.count(FeedbackTheme.id).desc())
        .all()
    )
    return [{"theme": t, "count": n} for t, n in by_theme]

@router.get("/analytics/bookings")
def bookings_analytics(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    total = db.query(Booking).count()
    by_status = (
        db.query(Booking.status, func.count(Booking.id))
        .group_by(Booking.status).all()
    )
    total_rev = db.query(func.sum(Booking.booking_amount)).filter(
        Booking.status.in_(["confirmed", "completed"])
    ).scalar() or 0
    return {
        "total": total,
        "by_status": [{"status": s, "count": n} for s, n in by_status],
        "total_revenue": round(float(total_rev), 2),
    }

@router.get("/analytics/rooms")
def rooms_analytics(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    rooms = db.query(Room).all()
    result = []
    for r in rooms:
        bkg_count = db.query(Booking).filter(Booking.room_id == r.id).count()
        result.append({
            "id": r.id,
            "name": r.name,
            "type": r.type,
            "current_price": r.current_price,
            "availability_status": r.availability_status,
            "booking_count": bkg_count,
        })
    return result

@router.get("/reports/feedback")
def report_feedback(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    total = db.query(Feedback).count()
    avg   = db.query(func.avg(Feedback.rating)).scalar() or 0
    pos   = db.query(SentimentResult).filter(SentimentResult.sentiment=="Positive").count()
    neu   = db.query(SentimentResult).filter(SentimentResult.sentiment=="Neutral").count()
    neg   = db.query(SentimentResult).filter(SentimentResult.sentiment=="Negative").count()
    return {"total_feedback": total, "average_rating": round(float(avg),2),
            "positive": pos, "neutral": neu, "negative": neg}

@router.get("/reports/bookings")
def report_bookings(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    total = db.query(Booking).count()
    confirmed  = db.query(Booking).filter(Booking.status=="confirmed").count()
    completed  = db.query(Booking).filter(Booking.status=="completed").count()
    cancelled  = db.query(Booking).filter(Booking.status=="cancelled").count()
    revenue    = db.query(func.sum(Booking.booking_amount)).filter(
        Booking.status.in_(["confirmed","completed"])).scalar() or 0
    return {"total": total, "confirmed": confirmed, "completed": completed,
            "cancelled": cancelled, "total_revenue": round(float(revenue),2)}

@router.get("/reports/pricing")
def report_pricing(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    total    = db.query(PricingRecommendation).count()
    pending  = db.query(PricingRecommendation).filter(PricingRecommendation.status=="pending").count()
    approved = db.query(PricingRecommendation).filter(PricingRecommendation.status=="approved").count()
    rejected = db.query(PricingRecommendation).filter(PricingRecommendation.status=="rejected").count()
    avg_rec  = db.query(func.avg(PricingRecommendation.recommended_price)).scalar() or 0
    return {"total": total, "pending": pending, "approved": approved,
            "rejected": rejected, "avg_recommended_price": round(float(avg_rec),2)}
