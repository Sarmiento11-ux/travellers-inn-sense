from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum
from app.database.base import Base
import enum

class UserRole(str, enum.Enum):
    customer = "customer"
    admin = "admin"
    staff = "staff"

class User(Base):
    __tablename__ = "users"

    id           = Column(Integer, primary_key=True, index=True)
    first_name   = Column(String(100), nullable=False)
    last_name    = Column(String(100), nullable=False)
    email        = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    contact_number = Column(String(30), nullable=True)
    role         = Column(SAEnum(UserRole), default=UserRole.customer, nullable=False)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                          onupdate=lambda: datetime.now(timezone.utc))

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
