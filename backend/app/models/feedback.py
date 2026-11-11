from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    booking_id   = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    rating       = Column(Integer, nullable=False)         # 1-5
    feedback_text = Column(Text, nullable=False)
    category     = Column(String(100), nullable=True)      # Room Cleanliness, Staff Service…
    created_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                          onupdate=lambda: datetime.now(timezone.utc))

    user    = relationship("User",    foreign_keys=[user_id])
    booking = relationship("Booking", foreign_keys=[booking_id])
    sentiment_result = relationship("SentimentResult", back_populates="feedback", uselist=False)
    themes  = relationship("FeedbackTheme", back_populates="feedback")


class SentimentResult(Base):
    __tablename__ = "sentiment_results"

    id              = Column(Integer, primary_key=True, index=True)
    feedback_id     = Column(Integer, ForeignKey("feedback.id", ondelete="CASCADE"), unique=True)
    sentiment       = Column(String(20), nullable=False)   # Positive / Neutral / Negative
    confidence_score = Column(Float, nullable=True)
    model_version   = Column(String(50), default="rule-based-v1")
    analyzed_at     = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    feedback = relationship("Feedback", back_populates="sentiment_result")


class FeedbackTheme(Base):
    __tablename__ = "feedback_themes"

    id          = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("feedback.id", ondelete="CASCADE"))
    theme       = Column(String(100), nullable=False)      # Room Cleanliness, Staff Service…
    created_at  = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    feedback = relationship("Feedback", back_populates="themes")
