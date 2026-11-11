import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.room import Room
from app.schemas.room import RoomCreate, RoomUpdate, RoomOut
from app.core.dependencies import get_current_admin

router = APIRouter(tags=["Rooms"])

def _to_out(r: Room) -> dict:
    out = RoomOut.model_validate(r).model_dump()
    # Parse amenities from JSON string to list for frontend
    try:
        out["amenities"] = json.loads(r.amenities) if r.amenities else []
    except Exception:
        out["amenities"] = [r.amenities] if r.amenities else []
    return out

@router.get("/api/rooms", response_model=List[dict])
def list_rooms(db: Session = Depends(get_db)):
    rooms = db.query(Room).all()
    return [_to_out(r) for r in rooms]

@router.get("/api/rooms/{room_id}", response_model=dict)
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return _to_out(room)

@router.post("/api/admin/rooms", response_model=dict, status_code=201)
def create_room(payload: RoomCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    amenities = json.dumps(payload.amenities) if isinstance(payload.amenities, list) else payload.amenities
    room = Room(
        name=payload.name,
        type=payload.type,
        description=payload.description,
        base_price=payload.base_price,
        current_price=payload.current_price or payload.base_price,
        capacity=payload.capacity,
        availability_status=payload.availability_status,
        amenities=amenities,
        image_url=payload.image_url,
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return _to_out(room)

@router.put("/api/admin/rooms/{room_id}", response_model=dict)
def update_room(room_id: int, payload: RoomUpdate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    for field, val in payload.model_dump(exclude_unset=True).items():
        if field == "amenities" and isinstance(val, list):
            val = json.dumps(val)
        setattr(room, field, val)
    db.commit()
    db.refresh(room)
    return _to_out(room)

@router.patch("/api/admin/rooms/{room_id}/clean", response_model=dict)
def mark_room_cleaned(room_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    """Housekeeping: mark room as cleaned and ready for guests."""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room.availability_status = "available"
    db.commit()
    db.refresh(room)
    return _to_out(room)

@router.delete("/api/admin/rooms/{room_id}", status_code=204)
def delete_room(room_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(room)
    db.commit()
