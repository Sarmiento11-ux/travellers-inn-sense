from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RoomCreate(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    base_price: float
    current_price: Optional[float] = None
    capacity: int = 2
    availability_status: str = "available"
    amenities: Optional[str] = None   # JSON string: '["Free Wi-Fi","AC"]'
    image_url: Optional[str] = None

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[float] = None
    current_price: Optional[float] = None
    capacity: Optional[int] = None
    availability_status: Optional[str] = None
    amenities: Optional[str] = None
    image_url: Optional[str] = None

class RoomOut(BaseModel):
    id: int
    name: str
    type: str
    description: Optional[str]
    base_price: float
    current_price: float
    capacity: int
    availability_status: str
    amenities: Optional[str]
    image_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
