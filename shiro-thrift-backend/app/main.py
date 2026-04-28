from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from .routes import product
from .routes import auth_routes
from .routes import payment_routes
from .database import engine, Base
from . import models, admin_user, order_model  # registers all tables
import os
from pathlib import Path

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
ENVIRONMENT  = os.getenv("ENVIRONMENT", "development")
BACKEND_ROOT = Path(__file__).resolve().parents[1]
UPLOADS_DIR = BACKEND_ROOT / "uploads"

app = FastAPI(
    title="Shiro's Thrift API",
    # Hide docs in production
    docs_url="/docs"  if ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if ENVIRONMENT != "production" else None,
)

# Create all DB tables
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

# ── SECURITY MIDDLEWARE ───────────────────────────────────
# Only trust requests from known hosts in production
if ENVIRONMENT == "production":
    RENDER_HOST = os.getenv("RENDER_EXTERNAL_HOSTNAME", "")
    if RENDER_HOST:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=[RENDER_HOST, f"*.{RENDER_HOST}"])

# ── CORS ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── ROUTERS ───────────────────────────────────────────────
app.include_router(auth_routes.router,    prefix="/auth",     tags=["Auth"])
app.include_router(product.router,        prefix="/products", tags=["Products"])
app.include_router(payment_routes.router, prefix="/payments", tags=["Payments"])

# ── STATIC FILES ──────────────────────────────────────────
UPLOADS_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

@app.get("/health")
def health():
    return {"status": "ok"}
