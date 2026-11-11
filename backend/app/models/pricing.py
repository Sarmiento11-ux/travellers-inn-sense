from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base

class PricingRecommendation(Base):
    __tablename__ = "pricing_recommendations"

    id                   = Column(Integer, primary_key=True, index=True)
    room_id              = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"))
    current_price        = Column(Float, nullable=False)
    recommended_price    = Column(Float, nullable=False)
    price_difference     = Column(Float, nullable=False)
    demand_level         = Column(String(30), nullable=False)        # High / Moderate / Low
    availability_level   = Column(String(30), nullable=False)        # Limited / Normal / High
    recommendation_reason = Column(Text, nullable=True)
    status               = Column(String(20), default="pending")     # pending / approved / rejected
    generated_at         = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    reviewed_at          = Column(DateTime(timezone=True), nullable=True)
    reviewed_by_id       = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    room        = relationship("Room", foreign_keys=[room_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
