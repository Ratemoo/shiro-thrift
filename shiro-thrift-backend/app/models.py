from sqlalchemy import Column, Integer, String, Float, ForeignKey
from .database import Base

class Product(Base):
    __tablename__ = "products"

    id= Column(Integer, primary_key=True, index=True)
    name= Column(String)
    category= Column(String)
    price= Column(Float)
    original_price= Column(Float, nullable=True)
    description= Column(String)
    badge= Column(String)
    status= Column(String)
    image_url= Column(String)
    created_by = Column(Integer, ForeignKey("admin_users.id"))