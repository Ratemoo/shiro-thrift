from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from collections import defaultdict
from datetime import datetime, timedelta

from ..database import SessionLocal
from ..admin_user import AdminUser
from ..auth import verify_password, create_access_token, require_admin, hash_password
from ..admin_schemas import LoginRequest, TokenResponse, AdminCreate, AdminUpdate, AdminResponse

router = APIRouter()

# ── RATE LIMITING ─────────────────────────────────────────
_failures: dict = defaultdict(list)
MAX_ATTEMPTS    = 5
WINDOW_MINUTES  = 10

def check_rate_limit(ip: str):
    now    = datetime.utcnow()
    cutoff = now - timedelta(minutes=WINDOW_MINUTES)
    _failures[ip] = [t for t in _failures[ip] if t > cutoff]
    if len(_failures[ip]) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed attempts. Wait {WINDOW_MINUTES} minutes."
        )

def record_failure(ip: str): _failures[ip].append(datetime.utcnow())
def clear_failures(ip: str):  _failures[ip] = []

# ── DB DEPENDENCY ─────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── REQUIRE SUPERADMIN ────────────────────────────────────
def require_superadmin(payload: dict = Depends(require_admin)):
    if payload.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin access required")
    return payload

# ═══════════════════════════════════════════════════════════
# PUBLIC
# ═══════════════════════════════════════════════════════════

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host
    check_rate_limit(ip)

    admin = db.query(AdminUser).filter(AdminUser.username == body.username).first()

    # Always run bcrypt even if user not found — prevents timing attacks
    dummy = "$2b$12$pTTz4SoMsSsb5o0M6u.6oeqiXDpyYqgYpPM5rMZN8sH6zPztzF962"
    try:
        ok    = verify_password(body.password, admin.hashed_password if admin else dummy)
    except Exception:
        ok= False

    if not admin or not ok or not admin.is_active:
        record_failure(ip)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    clear_failures(ip)
    token = create_access_token({"sub": admin.username, "role": admin.role, "id": admin.id})
    return {"access_token": token, "token_type": "bearer", "username": admin.username, "role": admin.role}

# ═══════════════════════════════════════════════════════════
# SUPERADMIN ONLY — manage admin accounts
# ═══════════════════════════════════════════════════════════

@router.get("/admins", response_model=list[AdminResponse], dependencies=[Depends(require_superadmin)])
def list_admins(db: Session = Depends(get_db)):
    return db.query(AdminUser).all()

@router.post("/admins", response_model=AdminResponse, dependencies=[Depends(require_superadmin)])
def create_admin(body: AdminCreate, db: Session = Depends(get_db)):
    if len(body.password) < 10:
        raise HTTPException(status_code=400, detail="Password must be at least 10 characters")
    if db.query(AdminUser).filter(AdminUser.username == body.username).first():
        raise HTTPException(status_code=409, detail="Username already exists")
    if db.query(AdminUser).filter(AdminUser.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already exists")

    admin = AdminUser(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin

@router.patch("/admins/{admin_id}", response_model=AdminResponse, dependencies=[Depends(require_superadmin)])
def update_admin(admin_id: int, body: AdminUpdate, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    for field, value in body.dict(exclude_unset=True).items():
        setattr(admin, field, value)
    db.commit()
    db.refresh(admin)
    return admin

@router.delete("/admins/{admin_id}", dependencies=[Depends(require_superadmin)])
def delete_admin(admin_id: int, db: Session = Depends(get_db), payload: dict = Depends(require_superadmin)):
    # Prevent self-deletion
    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    if admin.username == payload.get("sub"):
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    db.delete(admin)
    db.commit()
    return {"message": "Admin removed"}