import { useEffect, useState } from "react";
import API from "../services/api";
import ProductCard from "../components/ProductCard";
import ContactSection from "../components/ContactSection";

export default function Home({ activeCategory }) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = () => {
    setLoading(true);
    API.get("/products/")
      .then((r) => setProducts(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : products;

  return (
    <main className="home">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">Nairobi's Finest Resale</p>
          <h1 className="hero-title">
            Wear Stories,<br />
            <em>Not Just Clothes</em>
          </h1>
          <p className="hero-sub">
            Carefully curated pre-loved pieces — luxury quality, conscious price.
          </p>
          <div className="hero-cta-group">
            <a href="#collection" className="hero-cta">Explore the Collection</a>
            <a href="#contact" className="hero-cta hero-cta--ghost">Contact Us</a>
          </div>
        </div>
        <div className="hero-deco">
          <div className="hero-circle hero-circle--1" />
          <div className="hero-circle hero-circle--2" />
          <div className="hero-circle hero-circle--3" />
        </div>
      </section>

      {/* ── Collection ── */}
      <section className="collection" id="collection">
        <div className="collection-header">
          <p className="section-eyebrow">The Edit</p>
          <h2 className="section-title">
            {activeCategory ? `${activeCategory}'s Collection` : "Current Collection"}
          </h2>
          <div className="section-rule" />
          {!loading && (
            <p className="section-count">
              {filtered.length} piece{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {loading ? (
          <div className="products-grid">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No pieces in this category yet.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ── Contact ── */}
      <ContactSection />

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-left">
          <p className="footer-brand">Shiro's Thrift Collection</p>
          <p className="footer-tagline">Curated resale · Nairobi, Kenya</p>
        </div>
        <div className="footer-links">
          <a href="#collection" className="footer-link">Collection</a>
          <a href="#contact"    className="footer-link">Contact</a>
          <a href="tel:+254720039832" className="footer-link">+254 720 039 832</a>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} Shiro's Thrift Collection</p>
      </footer>
    </main>
  );
}