from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from app.database.base import Base

class Booking(Base):
    __tablename__ = "bookings"

    id                = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(20), unique=True, nullable=False, index=True)
    user_id           = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    room_id           = Column(Integer, ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    check_in          = Column(Date, nullable=False)
    check_out         = Column(Date, nullable=False)
    number_of_guests  = Column(Integer, nullable=False, default=1)
    booking_amount    = Column(Float, nullable=False, default=0.0)
    status            = Column(String(30), default="confirmed")  # confirmed / checked_in / completed / cancelled
    payment_status    = Column(String(30), default="unpaid")     # unpaid / paid
    payment_method    = Column(String(50), default="Pay at Front Desk")
    created_at        = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at        = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                               onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[user_id])
    room = relationship("Room", foreign_keys=[room_id])

    __table_args__ = (
        CheckConstraint("check_out > check_in", name="check_booking_dates"),
    )
