import { useEffect, useState } from "react";
import API, { resolveAssetUrl } from "../services/api";

const EMPTY = { name: "", category: "", price: "", original_price: "", description: "", badge: "", status: "available", image_url: "" };
const CATEGORIES = ["Men", "Women", "Kids", "Accessories", "Shoes"];
const BADGES     = ["", "New", "Sale", "Sold Out", "Popular", "Limited"];
const STATUSES   = ["available", "sold"];

export default function AdminPanel({ mode: initMode, onClose, onRefresh, onModeChange, inline = false }) {
  const [mode,         setMode]         = useState(initMode || "manage");
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [form,         setForm]         = useState(EMPTY);
  const [editingId,    setEditingId]    = useState(null);
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");

  useEffect(() => { setMode(initMode || "manage"); }, [initMode]);

  const load = () => {
    setLoading(true);
    API.get("/products/").then((r) => setProducts(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(EMPTY); setEditingId(null); setImageFile(null); setImagePreview(""); setError(""); };

  const changeMode = (m) => { setMode(m); onModeChange?.(m); };

  const openEdit = (p) => {
    setForm({ name: p.name || "", category: p.category || "", price: p.price || "", original_price: p.original_price || "", description: p.description || "", badge: p.badge || "", status: p.status || "available", image_url: p.image_url || "" });
    setEditingId(p.id); setImagePreview(resolveAssetUrl(p.image_url) || ""); setImageFile(null); setError("");
    changeMode("edit");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImageFile(file); setImagePreview(URL.createObjectURL(file));
  };

  const flash = (msg, isError = false) => {
    isError ? setError(msg) : setSuccess(msg);
    setTimeout(() => isError ? setError("") : setSuccess(""), 3000);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.price || !form.status) return flash("Name, category, price and status are required.", true);
    setSaving(true);
    try {
      let image_url = form.image_url;
      if (imageFile) { const r = await API.post("/products/upload", (() => { const fd = new FormData(); fd.append("file", imageFile); return fd; })()); image_url = r.data.image_url; }
      const payload = { name: form.name, category: form.category, price: parseFloat(form.price), original_price: form.original_price ? parseFloat(form.original_price) : null, description: form.description || null, badge: form.badge || null, status: form.status, image_url: image_url || null };
      if (mode === "add") { await API.post("/products/", payload); flash("Piece added!"); }
      else { await API.put(`/products/${editingId}`, payload); flash("Piece updated!"); }
      load(); onRefresh?.(); resetForm(); changeMode("manage");
    } catch { flash("Something went wrong.", true); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
    await API.delete(`/products/${id}`); load(); onRefresh?.();
  };

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const content = (
    <>
      {success && <div className="flash flash--success">{success}</div>}
      {error   && <div className="flash flash--error">{error}</div>}

      {/* ── MANAGE ── */}
      {mode === "manage" && (
        <div className={inline ? "" : "modal-body"}>
          {loading ? (
            <div className="skeleton-list">{[...Array(5)].map((_, i) => <div key={i} className="admin-skeleton" />)}</div>
          ) : products.length === 0 ? (
            <div className="admin-empty"><p>No pieces yet.</p><button className="admin-add-btn" onClick={() => changeMode("add")}>Add First Piece</button></div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Piece</th><th>Category</th><th>Price (KES)</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="admin-row">
                      <td className="admin-name">{p.image_url && <img src={resolveAssetUrl(p.image_url)} alt={p.name} className="admin-thumb" />}<span>{p.name}</span></td>
                      <td className="admin-cat">{p.category}</td>
                      <td className="admin-price">{Number(p.price).toLocaleString()}</td>
                      <td><span className={`status-pill status-pill--${p.status}`}>{p.status}</span></td>
                      <td><div className="admin-actions"><button className="admin-edit-btn" onClick={() => openEdit(p)}>Edit</button><button className="admin-delete-btn" onClick={() => handleDelete(p.id, p.name)}>Remove</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ADD / EDIT FORM ── */}
      {(mode === "add" || mode === "edit") && (
        <div className={inline ? "" : "modal-body"}>
          <div className="product-form">
            <div className="form-image-section">
              <div className="image-upload-zone" onClick={() => document.getElementById("img-input").click()}>
                {imagePreview ? (<><img src={imagePreview} alt="Preview" className="image-preview" /><div className="image-change-overlay">Change Photo</div></>) : (
                  <div className="image-upload-placeholder">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <p>Upload Photo</p><span>JPG · PNG · WEBP</span>
                  </div>
                )}
              </div>
              <input id="img-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
              <p className="form-hint">— or paste a URL —</p>
              <input className="form-input" type="text" placeholder="https://..." value={form.image_url} onChange={(e) => { f("image_url", e.target.value); if (!imageFile) setImagePreview(e.target.value); }} />
            </div>
            <div className="form-fields">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Name <span className="req">*</span></label><input className="form-input" placeholder="e.g. Vintage Denim Jacket" value={form.name} onChange={(e) => f("name", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Category <span className="req">*</span></label><select className="form-input form-select" value={form.category} onChange={(e) => f("category", e.target.value)}><option value="">Select…</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Price (KES) <span className="req">*</span></label><input className="form-input" type="number" placeholder="1500" value={form.price} onChange={(e) => f("price", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Original Price (KES)</label><input className="form-input" type="number" placeholder="2500" value={form.original_price} onChange={(e) => f("original_price", e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input form-textarea" placeholder="Condition, material, size..." value={form.description} onChange={(e) => f("description", e.target.value)} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Badge</label><select className="form-input form-select" value={form.badge} onChange={(e) => f("badge", e.target.value)}>{BADGES.map((b) => <option key={b} value={b}>{b || "None"}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Status <span className="req">*</span></label><select className="form-input form-select" value={form.status} onChange={(e) => f("status", e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></div>
              </div>
              <div className="form-actions">
                <button className="form-cancel-btn" onClick={() => { resetForm(); changeMode("manage"); }}>Cancel</button>
                <button className="form-submit-btn" onClick={handleSubmit} disabled={saving}>{saving ? "Saving…" : mode === "add" ? "Add to Collection" : "Save Changes"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Inline mode — used inside AdminPage (no modal wrapper)
  if (inline) return <div className="admin-panel-inline">{content}</div>;

  // Modal mode — used on the storefront
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="admin-eyebrow">Collection Management</p>
            <h2 className="modal-title">{mode === "manage" ? "Manage Pieces" : mode === "add" ? "Add New Piece" : "Edit Piece"}</h2>
          </div>
          <div className="modal-header-actions">
            {mode !== "manage" && <button className="modal-back-btn" onClick={() => { resetForm(); changeMode("manage"); }}>← Back</button>}
            {mode === "manage" && <button className="admin-add-btn" onClick={() => changeMode("add")}>+ Add New Piece</button>}
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-divider" />
        {content}
      </div>
    </div>
  );
}
