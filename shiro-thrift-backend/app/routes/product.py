from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import SessionLocal
from ..auth import require_admin
import shutil, os, uuid

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── PUBLIC ────────────────────────────────────────────────
@router.get("/", response_model=list[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p

# ── ADMIN PROTECTED ───────────────────────────────────────
@router.post("/upload", dependencies=[Depends(require_admin)])
def upload_image(file: UploadFile = File(...)):
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only image files allowed (JPEG, PNG, WEBP)")
    ext           = file.filename.rsplit(".", 1)[-1].lower()
    safe_name     = f"{uuid.uuid4().hex}.{ext}"
    path          = os.path.join(UPLOAD_DIR, safe_name)
    with open(path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    return {"image_url": f"http://localhost:8000/uploads/{safe_name}"}

@router.post("/", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), payload: dict = Depends(require_admin)):
    p = models.Product(**product.dict(), created_by=payload.get("id"))
    db.add(p); db.commit(); db.refresh(p)
    return p

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, updated: schemas.ProductCreate, db: Session = Depends(get_db), payload: dict = Depends(require_admin)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if p.created_by != payload.get("id") and payload.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="Not allowed to edit this product")
    
    for field, value in updated.dict().items():
        setattr(p, field, value)
    db.commit(); db.refresh(p)
    return p

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), payload: dict = Depends(require_admin)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if p.created_by != payload.get("id") and payload.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail= "Not allowed to delete this product")
    db.delete(p); db.commit()
    return {"message": "Deleted"}