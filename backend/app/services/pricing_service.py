"""
Pricing Service
Reads DB booking/availability data, calls pricing_model, stores recommendation.
IMPORTANT: Does NOT update rooms.current_price automatically.
"""
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.room import Room
from app.models.booking import Booking
from app.models.pricing import PricingRecommendation
from app.ml.pricing_model import generate_recommendation

def generate_pricing_recommendations(db: Session) -> list[PricingRecommendation]:
    """
    Generate a fresh recommendation for every room in the database.
    Existing pending recommendations are replaced.
    Returns list of new PricingRecommendation objects.
    """
    rooms = db.query(Room).all()
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    created = []

    for room in rooms:
        # ── Demand: bookings for this room in the last 30 days ────────────
        booking_count = (
            db.query(Booking)
            .filter(
                Booking.room_id == room.id,
                Booking.status != "cancelled",
                Booking.created_at >= cutoff,
            )
            .count()
        )

        # ── Availability: rooms of same type currently available ──────────
        available_same_type = (
            db.query(Room)
            .filter(
                Room.type == room.type,
                Room.availability_status == "available",
            )
            .count()
        )

        rec_price, demand, avail, reason = generate_recommendation(
            current_price=room.current_price,
            booking_count_30d=booking_count,
            available_rooms_same_type=available_same_type,
        )

        # Remove old pending recommendation for same room
        db.query(PricingRecommendation).filter(
            PricingRecommendation.room_id == room.id,
            PricingRecommendation.status == "pending",
        ).delete()

        pr = PricingRecommendation(
            room_id=room.id,
            current_price=room.current_price,
            recommended_price=rec_price,
            price_difference=round(rec_price - room.current_price, 2),
            demand_level=demand,
            availability_level=avail,
            recommendation_reason=reason,
            status="pending",
        )
        db.add(pr)
        created.append(pr)

    db.commit()
    for pr in created:
        db.refresh(pr)
    return created
