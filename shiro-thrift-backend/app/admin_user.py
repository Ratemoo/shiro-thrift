from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from .database import Base

class AdminUser(Base):
    __tablename__ = "admin_users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String, unique=True, nullable=False, index=True)
    email           = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role            = Column(String, default="admin")   # "admin" | "superadmin"
    is_active       = Column(Boolean, default=True)     # superadmin can deactivate accounts
    created_at      = Column(DateTime(timezone=True), server_default=func.now())