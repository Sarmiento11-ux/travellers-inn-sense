from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime

class BookingCreate(BaseModel):
    room_id: int
    check_in: date
    check_out: date
    number_of_guests: int = 1

    @field_validator("check_out")
    @classmethod
    def checkout_after_checkin(cls, v, info):
        ci = info.data.get("check_in")
        if ci and v <= ci:
            raise ValueError("check_out must be after check_in")
        return v

class BookingStatusUpdate(BaseModel):
    status: str  # confirmed / checked_in / completed / cancelled
    payment_status: Optional[str] = None  # unpaid / paid

class BookingPaymentUpdate(BaseModel):
    payment_status: str  # unpaid / paid

class BookingExtend(BaseModel):
    new_check_out: date

class BookingOut(BaseModel):
    id: int
    booking_reference: str
    user_id: Optional[int]
    room_id: Optional[int]
    check_in: date
    check_out: date
    number_of_guests: int
    booking_amount: float
    status: str
    payment_status: Optional[str] = "unpaid"
    payment_method: Optional[str] = "Pay at Front Desk"
    created_at: datetime
    guest_name: Optional[str] = None
    room_name: Optional[str] = None

    model_config = {"from_attributes": True}
