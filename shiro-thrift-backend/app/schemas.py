from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    name: str 
    category: str 
    price: float 
    original_price: Optional[float] = None
    description: Optional[str] = None
    badge: Optional[ str] = None
    status: str 
    image_url: Optional[str]=None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: str | None= None  
    category: str | None=None
    price: float |None= None
    original_price: Optional[float] |None = None
    description: Optional[str] |None = None
    badge: Optional[ str] | None = None
    status: str |None = None
    image_url: Optional[str] | None=None

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True

