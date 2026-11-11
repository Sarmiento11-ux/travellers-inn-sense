from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.security import decode_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/customer/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if not payload:
        raise credentials_exception
    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise credentials_exception
    return user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "staff"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user

def get_current_customer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required",
        )
    return current_user
