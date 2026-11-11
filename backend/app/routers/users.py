from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User, UserRole
from app.core.dependencies import get_current_user, get_current_admin
from app.core.security import get_password_hash

router = APIRouter(tags=["Users"])

class UserCreateAdmin(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: str = "admin"

class UserProfileUpdate(BaseModel):
    first_name: str = None
    last_name: str = None
    email: EmailStr = None
    password: str = None

class UserUpdateAdmin(BaseModel):
    first_name: str = None
    last_name: str = None
    email: EmailStr = None
    password: str = None
    role: str = None
    is_active: bool = None

def _out(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.full_name,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "email": u.email,
        "role": u.role.value,
        "is_active": u.is_active,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }

@router.get("/api/users/me", response_model=dict)
def me(current_user: User = Depends(get_current_user)):
    return _out(current_user)

@router.put("/api/users/me", response_model=dict)
def update_my_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.email and payload.email != current_user.email:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already exists")
        current_user.email = payload.email

    if payload.first_name is not None and payload.first_name.strip():
        current_user.first_name = payload.first_name.strip()
    if payload.last_name is not None and payload.last_name.strip():
        current_user.last_name = payload.last_name.strip()
    if payload.password and payload.password.strip():
        if len(payload.password.strip()) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        current_user.password_hash = get_password_hash(payload.password.strip())

    db.commit()
    db.refresh(current_user)
    return _out(current_user)

@router.get("/api/admin/users", response_model=List[dict])
def list_users(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    users = (
        db.query(User)
        .filter(User.role.in_([UserRole.admin, UserRole.staff]))
        .order_by(User.created_at.desc())
        .all()
    )
    return [_out(u) for u in users]

@router.post("/api/admin/users", response_model=dict, status_code=201)
def create_user(payload: UserCreateAdmin, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    try:
        role = UserRole(payload.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")
    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _out(user)

@router.put("/api/admin/users/{user_id}", response_model=dict)
def update_user(user_id: int, payload: UserUpdateAdmin, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.first_name is not None: user.first_name = payload.first_name
    if payload.last_name  is not None: user.last_name  = payload.last_name
    if payload.email      is not None: user.email       = payload.email
    if payload.password   is not None: user.password_hash = get_password_hash(payload.password)
    if payload.role       is not None:
        try:
            user.role = UserRole(payload.role)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")
    if payload.is_active  is not None: user.is_active   = payload.is_active
    db.commit()
    db.refresh(user)
    return _out(user)

@router.delete("/api/admin/users/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
