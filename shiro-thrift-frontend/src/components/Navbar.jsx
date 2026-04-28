import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  { label: "Men",         value: "Men" },
  { label: "Women",       value: "Women" },
  { label: "Kids",        value: "Kids" },
  { label: "Accessories", value: "Accessories" },
  { label: "Shoes",       value: "Shoes" },
];

export default function Navbar({ activeCategory, setActiveCategory, openCart }) {
  const { cartCount }         = useCart();
  const { isAdmin, adminUser, logout } = useAuth();
  const navigate              = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function outside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setAdminOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  return (
    <header className="header">
      <div className="top-bar">
        <span className="top-bar-text">Free delivery on orders over KES 5,000 · Nairobi, Kenya</span>
      </div>

      <nav className="navbar">
        {/* Left — Admin */}
        <div className="navbar-left" ref={dropdownRef}>
          {isAdmin ? (
            <div className="admin-dropdown-wrap">
              <button className="admin-nav-btn admin-nav-btn--active" onClick={() => setAdminOpen((v) => !v)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 12a5 5 0 100-10 5 5 0 000 10z"/><path d="M2 20a10 10 0 0120 0"/>
                </svg>
                {adminUser?.username}
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ transition: "transform 0.25s", transform: adminOpen ? "rotate(180deg)" : "rotate(0)" }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {adminOpen && (
                <div className="admin-dropdown">
                  <p className="dropdown-label">Signed in as <strong>{adminUser?.username}</strong></p>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => { navigate("/admin"); setAdminOpen(false); }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                    </svg>
                    Admin Dashboard
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item dropdown-item--danger" onClick={() => { logout(); setAdminOpen(false); }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="admin-nav-btn" onClick={() => navigate("/login")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Admin
            </button>
          )}
        </div>

        {/* Center — Brand */}
        <div className="navbar-brand" onClick={() => { setActiveCategory(null); setMenuOpen(false); }}>
          <h1 className="brand-name">Shiro's</h1>
          <span className="brand-sub">Thrift Collection</span>
        </div>

        {/* Right — Cart */}
        <div className="navbar-right">
          <button className="cart-btn" onClick={openCart}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span className="cart-label">Bag</span>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
          <button className="hamburger" onClick={() => setMenuOpen((v) => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Category nav */}
      <nav className={`cat-nav ${menuOpen ? "cat-nav--open" : ""}`}>
        <button className={`cat-link ${!activeCategory ? "cat-link--active" : ""}`} onClick={() => { setActiveCategory(null); setMenuOpen(false); }}>All Pieces</button>
        {CATEGORIES.map((cat) => (
          <button key={cat.value} className={`cat-link ${activeCategory === cat.value ? "cat-link--active" : ""}`} onClick={() => { setActiveCategory(cat.value); setMenuOpen(false); }}>
            {cat.label}
          </button>
        ))}
      </nav>
    </header>
  );
}