from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class AdminCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Optional[str] = "admin"   # "admin" | "superadmin"

class AdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None

class AdminResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str