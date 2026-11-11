from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

class CustomerRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

class AdminRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
