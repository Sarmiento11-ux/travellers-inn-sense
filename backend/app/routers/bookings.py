import random, string
from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.booking import Booking
from app.models.room import Room
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingStatusUpdate, BookingPaymentUpdate, BookingExtend, BookingOut
from app.core.dependencies import get_current_user, get_current_admin

router = APIRouter(tags=["Bookings"])

def _ref() -> str:
    return "BKG-" + "".join(random.choices(string.digits, k=6))

def _enrich(b: Booking) -> dict:
    d = {
        "id": b.id,
        "booking_reference": b.booking_reference,
        "user_id": b.user_id,
        "room_id": b.room_id,
        "check_in": str(b.check_in),
        "check_out": str(b.check_out),
        "number_of_guests": b.number_of_guests,
        "booking_amount": b.booking_amount,
        "status": b.status,
        "payment_status": b.payment_status or "unpaid",
        "payment_method": b.payment_method or "Pay at Front Desk",
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "guest_name": b.user.full_name if b.user else None,
        "room_name": b.room.name if b.room else None,
    }
    return d

@router.post("/api/bookings", response_model=dict, status_code=201)
def create_booking(payload: BookingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    room = db.query(Room).filter(Room.id == payload.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room.availability_status != "available":
        raise HTTPException(status_code=400, detail="Room is not available")
    if payload.number_of_guests > room.capacity:
        raise HTTPException(status_code=400, detail=f"Room capacity is {room.capacity} guests")

    if payload.check_out <= payload.check_in:
        raise HTTPException(status_code=400, detail="Check-out date must be after check-in date (at least 1 night stay)")

    # Overlap check
    conflict = (
        db.query(Booking)
        .filter(
            Booking.room_id == payload.room_id,
            Booking.status != "cancelled",
            Booking.check_in < payload.check_out,
            Booking.check_out > payload.check_in,
        )
        .first()
    )
    if conflict:
        raise HTTPException(status_code=409, detail="Room is already booked for selected dates")

    nights = (payload.check_out - payload.check_in).days
    if nights < 1:
        raise HTTPException(status_code=400, detail="Reservation must be for at least 1 night")

    amount = room.current_price * nights

    booking = Booking(
        booking_reference=_ref(),
        user_id=current_user.id,
        room_id=payload.room_id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        number_of_guests=payload.number_of_guests,
        booking_amount=amount,
        status="confirmed",
        payment_status="unpaid",
        payment_method="Pay at Front Desk",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return _enrich(booking)

@router.patch("/api/bookings/{booking_id}/cancel", response_model=dict)
def cancel_my_booking(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Allow the booking owner to cancel their own confirmed booking."""
    b = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if b.status in ("cancelled", "completed", "checked_in"):
        raise HTTPException(status_code=400, detail=f"Booking cannot be cancelled — it is already {b.status}.")
    b.status = "cancelled"
    db.commit()
    db.refresh(b)
    return _enrich(b)

@router.patch("/api/bookings/{booking_id}/checkout", response_model=dict)
def checkout_my_booking(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Allow customer to check out anytime, even before scheduled check-out date."""
    b = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if b.status not in ("confirmed", "checked_in"):
        raise HTTPException(status_code=400, detail=f"Cannot check out a booking with status '{b.status}'. Only confirmed or checked-in active bookings can be checked out.")
    
    b.status = "completed"
    # Housekeeping lifecycle: mark room as needs_cleaning
    if b.room:
        b.room.availability_status = "needs_cleaning"
    db.commit()
    db.refresh(b)
    return _enrich(b)

@router.patch("/api/bookings/{booking_id}/extend", response_model=dict)
def extend_my_booking(booking_id: int, payload: BookingExtend, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Allow customer to choose and extend the check-out date of their own confirmed booking."""
    b = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if b.status != "confirmed":
        raise HTTPException(status_code=400, detail=f"Cannot extend booking with status '{b.status}'. Only confirmed bookings can be extended.")
    if payload.new_check_out <= b.check_out:
        raise HTTPException(status_code=400, detail="New check-out date must be strictly after current check-out date.")

    # Check for room conflict in the extended dates
    conflict = (
        db.query(Booking)
        .filter(
            Booking.room_id == b.room_id,
            Booking.id != b.id,
            Booking.status != "cancelled",
            Booking.check_in < payload.new_check_out,
            Booking.check_out > b.check_out,
        )
        .first()
    )
    if conflict:
        raise HTTPException(
            status_code=409,
            detail=f"Room is already booked by another reservation from {conflict.check_in} to {conflict.check_out}. Cannot extend for these dates."
        )

    old_nights = max(1, (b.check_out - b.check_in).days)
    rate_per_night = b.room.current_price if b.room else (b.booking_amount / old_nights)
    total_nights = (payload.new_check_out - b.check_in).days
    b.check_out = payload.new_check_out
    b.booking_amount = rate_per_night * total_nights
    db.commit()
    db.refresh(b)
    return _enrich(b)

@router.get("/api/bookings/my", response_model=List[dict])
def my_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bookings = db.query(Booking).filter(Booking.user_id == current_user.id).order_by(Booking.created_at.desc()).all()
    return [_enrich(b) for b in bookings]

@router.get("/api/admin/bookings", response_model=List[dict])
def all_bookings(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).all()
    return [_enrich(b) for b in bookings]

@router.get("/api/admin/bookings/{booking_id}", response_model=dict)
def get_booking(booking_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _enrich(b)

@router.put("/api/admin/bookings/{booking_id}/status", response_model=dict)
def update_booking_status(booking_id: int, payload: BookingStatusUpdate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Admin cannot cancel bookings — only customer can cancel
    if payload.status == "cancelled":
        raise HTTPException(
            status_code=403,
            detail="Admins cannot cancel bookings. Only customers are authorized to cancel their bookings."
        )
    
    valid_statuses = ("confirmed", "checked_in", "completed")
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use: {valid_statuses}")

    if payload.status == "checked_in":
        if b.status != "confirmed":
            raise HTTPException(status_code=400, detail=f"Cannot check in a booking with status '{b.status}'.")
        b.status = "checked_in"
        if payload.payment_status:
            b.payment_status = payload.payment_status
    elif payload.status == "completed":
        if b.status not in ("confirmed", "checked_in"):
            raise HTTPException(status_code=400, detail=f"Cannot complete a booking with status '{b.status}'.")
        b.status = "completed"
        # Housekeeping: room needs cleaning once guest departs
        if b.room:
            b.room.availability_status = "needs_cleaning"
        if payload.payment_status:
            b.payment_status = payload.payment_status
        else:
            b.payment_status = "paid"
    else:
        b.status = payload.status

    db.commit()
    db.refresh(b)
    return _enrich(b)

@router.put("/api/admin/bookings/{booking_id}/payment", response_model=dict)
def update_booking_payment(booking_id: int, payload: BookingPaymentUpdate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    """Update payment status (paid / unpaid) at front desk."""
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    if payload.payment_status not in ("paid", "unpaid"):
        raise HTTPException(status_code=400, detail="Invalid payment_status. Use 'paid' or 'unpaid'.")
    b.payment_status = payload.payment_status
    db.commit()
    db.refresh(b)
    return _enrich(b)

@router.patch("/api/admin/bookings/{booking_id}/extend", response_model=dict)
def extend_booking(booking_id: int, payload: BookingExtend, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    """Extend a confirmed booking with a new check-out date."""
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    if b.status != "confirmed":
        raise HTTPException(status_code=400, detail=f"Cannot extend booking with status '{b.status}'. Only confirmed bookings can be extended.")
    if payload.new_check_out <= b.check_out:
        raise HTTPException(status_code=400, detail="New check-out date must be after current check-out date.")

    # Check for room overlap in the extended range
    conflict = (
        db.query(Booking)
        .filter(
            Booking.room_id == b.room_id,
            Booking.id != b.id,
            Booking.status != "cancelled",
            Booking.check_in < payload.new_check_out,
            Booking.check_out > b.check_out,
        )
        .first()
    )
    if conflict:
        raise HTTPException(
            status_code=409,
            detail=f"Room is already booked from {conflict.check_in} to {conflict.check_out}. Cannot extend stay."
        )

    old_nights = max(1, (b.check_out - b.check_in).days)
    rate_per_night = b.room.current_price if b.room else (b.booking_amount / old_nights)
    total_nights = (payload.new_check_out - b.check_in).days
    b.check_out = payload.new_check_out
    b.booking_amount = rate_per_night * total_nights
    db.commit()
    db.refresh(b)
    return _enrich(b)

@router.delete("/api/admin/bookings/{booking_id}", status_code=204)
def delete_booking(booking_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    db.delete(b)
    db.commit()
