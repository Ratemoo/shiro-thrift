import uuid, hmac, hashlib
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime

from ..database import SessionLocal
from ..order_model import Order
from ..mpesa import stk_push, query_stk_status
import os

router = APIRouter()

CALLBACK_SECRET = os.getenv("CALLBACK_SECRET", "")  # used to verify Safaricom callbacks

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── SCHEMAS ───────────────────────────────────────────────
class CartItem(BaseModel):
    id:       int
    name:     str
    price:    float
    qty:      int
    image_url: str | None = None

class CheckoutRequest(BaseModel):
    phone:      str
    cart_items: List[CartItem]

class StatusRequest(BaseModel):
    checkout_request_id: str

# ── HELPERS ───────────────────────────────────────────────
def make_order_ref() -> str:
    ts  = datetime.now().strftime("%d%H%M%S")
    uid = uuid.uuid4().hex[:4].upper()
    return f"STC-{ts}-{uid}"

# ── INITIATE PAYMENT ──────────────────────────────────────
@router.post("/checkout")
async def checkout(body: CheckoutRequest, db: Session = Depends(get_db)):
    if not body.cart_items:
        raise HTTPException(400, "Cart is empty")

    total     = round(sum(i.price * i.qty for i in body.cart_items))
    order_ref = make_order_ref()

    # Save order as pending before calling M-Pesa
    order = Order(
        order_ref   = order_ref,
        phone       = body.phone,
        amount      = total,
        cart_items  = [i.dict() for i in body.cart_items],
        status      = "pending",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Trigger STK Push
    try:
        result = await stk_push(body.phone, int(total), order_ref)
    except HTTPException as e:
        order.status = "failed"
        db.commit()
        raise e

    # Store M-Pesa request IDs
    order.checkout_request_id = result["checkout_request_id"]
    order.merchant_request_id = result["merchant_request_id"]
    db.commit()

    return {
        "order_ref":            order_ref,
        "checkout_request_id":  result["checkout_request_id"],
        "message":              result["customer_message"] or "Check your phone for the M-Pesa prompt.",
        "amount":               total,
    }


# ── SAFARICOM CALLBACK ────────────────────────────────────
@router.post("/mpesa/callback")
async def mpesa_callback(request: Request, db: Session = Depends(get_db)):
    """
    Safaricom POSTs payment results here.
    URL must be publicly accessible (your Render URL).
    """
    body = await request.json()

    try:
        stk_callback = body["Body"]["stkCallback"]
        checkout_id  = stk_callback["CheckoutRequestID"]
        result_code  = stk_callback["ResultCode"]

        order = db.query(Order).filter(Order.checkout_request_id == checkout_id).first()
        if not order:
            return {"ResultCode": 0, "ResultDesc": "Accepted"}  # Safaricom expects 200

        if result_code == 0:
            # Payment successful — extract receipt
            items = {
                item["Name"]: item["Value"]
                for item in stk_callback.get("CallbackMetadata", {}).get("Item", [])
            }
            order.mpesa_receipt = str(items.get("MpesaReceiptNumber", ""))
            order.status        = "paid"
        else:
            order.status = "failed"

        db.commit()

    except Exception:
        pass  # Never return an error to Safaricom — always return 200

    return {"ResultCode": 0, "ResultDesc": "Accepted"}


# ── POLL STATUS (frontend polling) ────────────────────────
@router.post("/status")
async def payment_status(body: StatusRequest, db: Session = Depends(get_db)):
    """
    Frontend polls this every 3 seconds after STK push.
    First checks our DB; if still pending, queries Daraja directly.
    """
    order = db.query(Order).filter(
        Order.checkout_request_id == body.checkout_request_id
    ).first()

    if not order:
        raise HTTPException(404, "Order not found")

    # Already resolved in our DB
    if order.status in ("paid", "failed", "cancelled"):
        return {
            "status":       order.status,
            "receipt":      order.mpesa_receipt,
            "order_ref":    order.order_ref,
            "amount":       order.amount,
        }

    # Still pending — query Daraja
    try:
        daraja = await query_stk_status(body.checkout_request_id)
        code   = int(daraja.get("ResultCode", -1))

        if code == 0:
            order.status = "paid"
            db.commit()
        elif code in (1032, 1037, 2001):
            # 1032 = cancelled by user, 1037 = timeout, 2001 = wrong PIN
            order.status = "failed"
            db.commit()
    except Exception:
        pass  # timeout — stay pending

    return {
        "status":    order.status,
        "receipt":   order.mpesa_receipt,
        "order_ref": order.order_ref,
        "amount":    order.amount,
    }


# ── ORDER LOOKUP (admin) ──────────────────────────────────
@router.get("/orders")
def list_orders(db: Session = Depends(get_db)):
    """Returns all orders — add require_admin dep in main.py if desired."""
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(200).all()
    return orders