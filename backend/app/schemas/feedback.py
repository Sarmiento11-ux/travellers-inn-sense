from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime

class FeedbackCreate(BaseModel):
    rating: int
    feedback_text: str
    category: Optional[str] = "General"
    booking_id: Optional[int] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v

class FeedbackOut(BaseModel):
    id: int
    user_id: Optional[int]
    booking_id: Optional[int]
    rating: int
    feedback_text: str
    category: Optional[str]
    created_at: datetime
    guest_name: Optional[str] = None
    sentiment: Optional[str] = None
    confidence_score: Optional[float] = None
    themes: Optional[List[str]] = []

    model_config = {"from_attributes": True}

class SentimentOut(BaseModel):
    feedback_id: int
    sentiment: str
    confidence_score: Optional[float]
    model_version: str
    analyzed_at: datetime

    model_config = {"from_attributes": True}
