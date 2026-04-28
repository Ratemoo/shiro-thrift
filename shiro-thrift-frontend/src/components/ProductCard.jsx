import { useState } from "react";
import { useCart } from "../context/CartContext";
import { resolveAssetUrl } from "../services/api";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isSold = product.status === "sold";

  const handleAdd = () => {
    if (isSold) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  return (
    <div
      className={`product-card ${hovered ? "product-card--hovered" : ""} ${isSold ? "product-card--sold" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="product-image-wrap">
        <img
          src={resolveAssetUrl(product.image_url) || "/placeholder.jpg"}
          alt={product.name}
          className="product-image"
        />

        <div className="product-image-overlay">
          <span className="overlay-label">{isSold ? "Sold Out" : "View Piece"}</span>
        </div>

        {/* Badges */}
        <div className="product-badges">
          {product.badge && (
            <span className={`product-badge product-badge--${product.badge.toLowerCase().replace(" ", "-")}`}>
              {product.badge}
            </span>
          )}
          {discount && (
            <span className="product-badge product-badge--sale">−{discount}%</span>
          )}
          {isSold && (
            <span className="product-badge product-badge--sold">Sold</span>
          )}
        </div>
      </div>

      <div className="product-info">
        <p className="product-category">{product.category}</p>
        <h3 className="product-name">{product.name}</h3>
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}
        <div className="product-footer">
          <div className="product-pricing">
            <span className="product-price">KES {Number(product.price).toLocaleString()}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="product-original-price">KES {Number(product.original_price).toLocaleString()}</span>
            )}
          </div>
          <button
            className={`add-btn ${added ? "add-btn--added" : ""} ${isSold ? "add-btn--sold" : ""}`}
            onClick={handleAdd}
            disabled={isSold}
          >
            {isSold ? "Sold" : added ? "✓ Added" : "Add to Bag"}
          </button>
        </div>
      </div>
    </div>
  );
}
