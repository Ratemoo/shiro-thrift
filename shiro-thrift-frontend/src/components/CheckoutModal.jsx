import { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext";
import API from "../services/api";

const STEPS = { FORM: "form", WAITING: "waiting", SUCCESS: "success", FAILED: "failed" };
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS        = 40; // ~2 minutes

export default function CheckoutModal({ onClose }) {
  const { cart, total, clearCart } = useCart();
  const [step,    setStep]    = useState(STEPS.FORM);
  const [phone,   setPhone]   = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [order,   setOrder]   = useState(null); // { order_ref, checkout_request_id, amount }
  const [receipt, setReceipt] = useState(null);
  const pollRef  = useRef(null);
  const pollCount = useRef(0);

  // Cleanup polling on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

  const stopPolling = () => clearInterval(pollRef.current);

  const startPolling = (checkoutRequestId) => {
    pollCount.current = 0;
    pollRef.current   = setInterval(async () => {
      pollCount.current++;
      if (pollCount.current > MAX_POLLS) {
        stopPolling();
        setStep(STEPS.FAILED);
        setError("Payment timed out. Please try again.");
        return;
      }
      try {
        const res = await API.post("/payments/status", {
          checkout_request_id: checkoutRequestId,
        });
        const { status, receipt: rec } = res.data;
        if (status === "paid") {
          stopPolling();
          setReceipt(rec);
          setStep(STEPS.SUCCESS);
          clearCart();
        } else if (status === "failed") {
          stopPolling();
          setStep(STEPS.FAILED);
          setError("Payment was cancelled or failed. Please try again.");
        }
      } catch {
        // network blip — keep polling
      }
    }, POLL_INTERVAL_MS);
  };

  const handleSubmit = async () => {
    setError("");
    const cleaned = phone.trim().replace(/\s/g, "").replace("+", "");
    if (!cleaned) { setError("Please enter your M-Pesa phone number."); return; }
    if (cart.length === 0) { setError("Your cart is empty."); return; }

    setLoading(true);
    try {
      const res = await API.post("/payments/checkout", {
        phone: cleaned,
        cart_items: cart.map(({ id, name, price, qty, image_url }) => ({
          id, name, price, qty, image_url,
        })),
      });
      setOrder(res.data);
      setStep(STEPS.WAITING);
      startPolling(res.data.checkout_request_id);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to initiate payment. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setStep(STEPS.FORM);
    setError("");
    setOrder(null);
    setReceipt(null);
  };

  return (
    <div className="modal-overlay" onClick={step === STEPS.SUCCESS ? onClose : undefined}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── FORM ── */}
        {step === STEPS.FORM && (
          <>
            <div className="checkout-header">
              <div>
                <p className="admin-eyebrow">Secure Payment</p>
                <h2 className="modal-title">M-Pesa Checkout</h2>
              </div>
              <button className="modal-close-btn" onClick={onClose}>✕</button>
            </div>
            <div className="modal-divider" />

            <div className="checkout-body">
              {/* Order summary */}
              <div className="checkout-summary">
                <p className="checkout-summary-label">Order Summary</p>
                <ul className="checkout-items">
                  {cart.map((item) => (
                    <li key={item.id} className="checkout-item">
                      <span className="checkout-item-name">{item.name} <span className="checkout-item-qty">×{item.qty}</span></span>
                      <span className="checkout-item-price">KES {Number(item.price * item.qty).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                <div className="checkout-total-row">
                  <span>Total</span>
                  <span className="checkout-total-amount">KES {Number(total).toLocaleString()}</span>
                </div>
              </div>

              <div className="modal-divider" />

              {/* Phone input */}
              <div className="form-group" style={{ marginTop: "20px" }}>
                <label className="form-label">M-Pesa Phone Number</label>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">🇰🇪 +254</span>
                  <input
                    className="form-input phone-input"
                    type="tel"
                    placeholder="712 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    maxLength={15}
                    autoFocus
                  />
                </div>
                <p className="form-hint" style={{ textAlign: "left", marginTop: "6px" }}>
                  You'll receive an STK Push prompt on this number
                </p>
              </div>

              {error && <div className="flash flash--error" style={{ marginTop: "4px" }}>{error}</div>}

              <button
                className="checkout-pay-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <span className="login-spinner" /> : `Pay KES ${Number(total).toLocaleString()} via M-Pesa`}
              </button>

              <p className="checkout-security-note">
                🔒 Secured by Safaricom Daraja · No card details stored
              </p>
            </div>
          </>
        )}

        {/* ── WAITING ── */}
        {step === STEPS.WAITING && (
          <div className="checkout-state-screen">
            <div className="mpesa-pulse">
              <div className="mpesa-pulse-ring" />
              <div className="mpesa-pulse-ring mpesa-pulse-ring--2" />
              <div className="mpesa-logo">M</div>
            </div>
            <h2 className="checkout-state-title">Check Your Phone</h2>
            <p className="checkout-state-sub">
              We've sent an M-Pesa prompt to <strong>{phone}</strong>.<br />
              Enter your PIN to complete payment of <strong>KES {order && Number(order.amount).toLocaleString()}</strong>.
            </p>
            <p className="checkout-state-note">Ref: {order?.order_ref}</p>
            <div className="checkout-dots">
              <span /><span /><span />
            </div>
            <button className="form-cancel-btn" style={{ marginTop: "24px", width: "200px" }} onClick={() => { stopPolling(); onClose(); }}>
              Cancel
            </button>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === STEPS.SUCCESS && (
          <div className="checkout-state-screen">
            <div className="checkout-success-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 className="checkout-state-title">Payment Confirmed!</h2>
            <p className="checkout-state-sub">
              Thank you for your purchase. Your order is confirmed.
            </p>
            {receipt && (
              <div className="receipt-box">
                <p className="receipt-label">M-Pesa Receipt</p>
                <p className="receipt-code">{receipt}</p>
                <p className="receipt-ref">Order: {order?.order_ref}</p>
              </div>
            )}
            <button className="checkout-pay-btn" style={{ marginTop: "28px" }} onClick={onClose}>
              Continue Shopping
            </button>
          </div>
        )}

        {/* ── FAILED ── */}
        {step === STEPS.FAILED && (
          <div className="checkout-state-screen">
            <div className="checkout-failed-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 className="checkout-state-title">Payment Failed</h2>
            <p className="checkout-state-sub">{error || "The payment was not completed."}</p>
            <div className="checkout-failed-actions">
              <button className="checkout-pay-btn" onClick={handleRetry}>Try Again</button>
              <button className="form-cancel-btn" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}