from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PricingOut(BaseModel):
    id: int
    room_id: int
    room_name: Optional[str] = None
    room_type: Optional[str] = None
    current_price: float
    recommended_price: float
    price_difference: float
    demand_level: str
    availability_level: str
    recommendation_reason: Optional[str]
    status: str
    generated_at: datetime
    reviewed_at: Optional[datetime]

    model_config = {"from_attributes": True}
