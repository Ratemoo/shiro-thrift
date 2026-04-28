import { useState } from "react";
import { useCart } from "../context/CartContext";
import CheckoutModal from "./CheckoutModal";

export default function Cart({ onClose }) {
  const { cart, total, removeFromCart, updateQty } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);

  return (
    <>
      <div className="cart-overlay" onClick={onClose}>
        <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="cart-header">
            <h2 className="cart-title">Your Bag</h2>
            <button className="cart-close" onClick={onClose}>✕</button>
          </div>
          <div className="cart-divider" />

          {cart.length === 0 ? (
            <div className="cart-empty">
              <p>Your bag is empty.</p>
              <span>Discover curated pieces below.</span>
            </div>
          ) : (
            <>
              <ul className="cart-items">
                {cart.map((item) => (
                  <li key={item.id} className="cart-item">
                    <img src={item.image_url || "/placeholder.jpg"} alt={item.name} className="cart-item-img" />
                    <div className="cart-item-details">
                      <p className="cart-item-name">{item.name}</p>
                      <p className="cart-item-cat">{item.category}</p>
                      <div className="cart-item-qty-wrap">
                        <button className="qty-btn" onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                        <span className="qty-num">{item.qty}</span>
                        <button className="qty-btn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                      </div>
                    </div>
                    <div className="cart-item-right">
                      <span className="cart-item-price">KES {Number(item.price * item.qty).toLocaleString()}</span>
                      <button className="cart-item-remove" onClick={() => removeFromCart(item.id)}>✕</button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="cart-divider" />
              <div className="cart-total">
                <span>Total</span>
                <span>KES {Number(total).toLocaleString()}</span>
              </div>
              <button className="checkout-btn" onClick={() => setCheckingOut(true)}>
                Pay with M-Pesa
              </button>
              <p className="cart-mpesa-note">🔒 Secured by Safaricom Daraja</p>
            </>
          )}
        </div>
      </div>

      {checkingOut && (
        <CheckoutModal onClose={() => { setCheckingOut(false); onClose(); }} />
      )}
    </>
  );
}