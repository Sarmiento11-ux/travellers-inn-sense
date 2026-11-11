import random, string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import CustomerRegister, LoginRequest, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def _wrong_password_detail(entered: str) -> str:
    return "Incorrect password."

def _token_for(user: User) -> Token:
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(
        access_token=token,
        user={
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "role": user.role.value,
        },
    )

@router.post("/customer/register", response_model=Token, status_code=201)
def customer_register(payload: CustomerRegister, db: Session = Depends(get_db)):
    clean_email = payload.email.lower().strip()
    if db.query(User).filter(func.lower(User.email) == clean_email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    parts = payload.name.strip().split(" ", 1)
    first = parts[0]
    last  = parts[1] if len(parts) > 1 else ""
    user  = User(
        first_name=first,
        last_name=last,
        email=clean_email,
        password_hash=get_password_hash(payload.password),
        role=UserRole.customer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_for(user)

@router.post("/customer/login", response_model=Token)
def customer_login(payload: LoginRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.lower().strip()
    user = db.query(User).filter(func.lower(User.email) == clean_email, User.role == UserRole.customer).first()
    if not user:
        raise HTTPException(status_code=401, detail="No customer account found with this email.")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail=_wrong_password_detail(payload.password))
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    return _token_for(user)

@router.post("/admin/login", response_model=Token)
def admin_login(payload: LoginRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.lower().strip()
    user = db.query(User).filter(
        func.lower(User.email) == clean_email,
        User.role.in_([UserRole.admin, UserRole.staff])
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="No admin account found with this email.")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail=_wrong_password_detail(payload.password))
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    return _token_for(user)
