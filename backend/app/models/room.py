from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, ARRAY, DateTime
from app.database.base import Base

class Room(Base):
    __tablename__ = "rooms"

    id                = Column(Integer, primary_key=True, index=True)
    name              = Column(String(150), nullable=False)
    type              = Column(String(100), nullable=False)   # e.g. "Standard", "Deluxe"
    description       = Column(Text, nullable=True)
    base_price        = Column(Float, nullable=False)
    current_price     = Column(Float, nullable=False)
    capacity          = Column(Integer, nullable=False, default=2)
    availability_status = Column(String(30), default="available")  # available / maintenance
    amenities         = Column(Text, nullable=True)              # JSON array stored as text
    image_url         = Column(Text, nullable=True)
    created_at        = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at        = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                               onupdate=lambda: datetime.now(timezone.utc))
