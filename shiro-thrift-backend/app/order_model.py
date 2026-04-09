from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from .database import Base

class Order(Base):
    __tablename__ = "orders"

    id                  = Column(Integer, primary_key=True, index=True)
    order_ref           = Column(String, unique=True, index=True)   # e.g. STC-1712345678
    phone               = Column(String, nullable=False)
    amount              = Column(Float,  nullable=False)
    cart_items          = Column(JSON,   nullable=False)             # snapshot of cart

    # M-Pesa fields
    checkout_request_id = Column(String, index=True, nullable=True)
    merchant_request_id = Column(String, nullable=True)
    mpesa_receipt       = Column(String, nullable=True)             # filled on success callback

    # "pending" | "paid" | "failed" | "cancelled"
    status              = Column(String, default="pending", index=True)

    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())