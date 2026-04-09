"""
Safaricom Daraja API — M-Pesa STK Push (Lipa Na M-Pesa Online)
Handles: access token, STK push, callback verification
"""
import base64
import httpx
from datetime import datetime
from fastapi import HTTPException
import os
from dotenv import load_dotenv

load_dotenv()

# ── CONFIG ────────────────────────────────────────────────
MPESA_ENV            = os.getenv("MPESA_ENV", "sandbox")          # "sandbox" | "production"
MPESA_CONSUMER_KEY   = os.getenv("MPESA_CONSUMER_KEY", "")
MPESA_CONSUMER_SECRET= os.getenv("MPESA_CONSUMER_SECRET", "")
MPESA_SHORTCODE      = os.getenv("MPESA_SHORTCODE", "")           # Paybill or Till number
MPESA_PASSKEY        = os.getenv("MPESA_PASSKEY", "")
MPESA_CALLBACK_URL   = os.getenv("MPESA_CALLBACK_URL", "")        # Must be HTTPS public URL

BASE_URL = (
    "https://sandbox.safaricom.co.ke"
    if MPESA_ENV == "sandbox"
    else "https://api.safaricom.co.ke"
)

# ── ACCESS TOKEN ──────────────────────────────────────────
async def get_access_token() -> str:
    """Fetch OAuth token from Daraja. Valid for 1 hour."""
    if not MPESA_CONSUMER_KEY or not MPESA_CONSUMER_SECRET:
        raise HTTPException(500, "M-Pesa credentials not configured")

    credentials = base64.b64encode(
        f"{MPESA_CONSUMER_KEY}:{MPESA_CONSUMER_SECRET}".encode()
    ).decode()

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{BASE_URL}/oauth/v1/generate?grant_type=client_credentials",
            headers={"Authorization": f"Basic {credentials}"},
            timeout=15,
        )

    if res.status_code != 200:
        raise HTTPException(502, "Failed to get M-Pesa access token")

    return res.json().get("access_token", "")


# ── PASSWORD ──────────────────────────────────────────────
def generate_password() -> tuple[str, str]:
    """
    Returns (password, timestamp).
    Password = base64(shortcode + passkey + timestamp)
    """
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    raw = f"{MPESA_SHORTCODE}{MPESA_PASSKEY}{timestamp}"
    password = base64.b64encode(raw.encode()).decode()
    return password, timestamp


# ── STK PUSH ──────────────────────────────────────────────
async def stk_push(phone: str, amount: int, order_ref: str) -> dict:
    """
    Initiates an STK Push to the customer's phone.

    phone      — format: 2547XXXXXXXX (no + prefix)
    amount     — KES amount (whole number)
    order_ref  — short reference shown to customer (max 12 chars)
    """
    # Sanitise phone: strip +, spaces, leading 0 → 2547XXXXXXXX
    phone = phone.strip().replace(" ", "").replace("+", "")
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    if not phone.startswith("254") or len(phone) != 12:
        raise HTTPException(400, "Invalid phone number. Use format: 0712345678 or 254712345678")

    if amount < 1:
        raise HTTPException(400, "Amount must be at least KES 1")

    token    = await get_access_token()
    password, timestamp = generate_password()

    payload = {
        "BusinessShortCode": MPESA_SHORTCODE,
        "Password":          password,
        "Timestamp":         timestamp,
        "TransactionType":   "CustomerPayBillOnline",
        "Amount":            amount,
        "PartyA":            phone,
        "PartyB":            MPESA_SHORTCODE,
        "PhoneNumber":       phone,
        "CallBackURL":       MPESA_CALLBACK_URL,
        "AccountReference":  order_ref[:12],
        "TransactionDesc":   f"Shiro's Thrift - {order_ref}",
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{BASE_URL}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type":  "application/json",
            },
            timeout=30,
        )

    data = res.json()

    if res.status_code != 200 or data.get("ResponseCode") != "0":
        error_msg = data.get("errorMessage") or data.get("ResponseDescription", "STK Push failed")
        raise HTTPException(502, f"M-Pesa error: {error_msg}")

    return {
        "checkout_request_id": data["CheckoutRequestID"],
        "merchant_request_id": data["MerchantRequestID"],
        "response_description": data.get("ResponseDescription", ""),
        "customer_message":     data.get("CustomerMessage", ""),
    }


# ── STK PUSH STATUS CHECK ─────────────────────────────────
async def query_stk_status(checkout_request_id: str) -> dict:
    """Poll the status of an STK Push request."""
    token    = await get_access_token()
    password, timestamp = generate_password()

    payload = {
        "BusinessShortCode": MPESA_SHORTCODE,
        "Password":          password,
        "Timestamp":         timestamp,
        "CheckoutRequestID": checkout_request_id,
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{BASE_URL}/mpesa/stkpushquery/v1/query",
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type":  "application/json",
            },
            timeout=15,
        )

    return res.json()