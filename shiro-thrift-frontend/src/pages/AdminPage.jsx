import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminPanel from "../components/AdminPanel";
import API from "../services/api";

export default function AdminPage() {
  const { adminUser, isSuperAdmin, logout } = useAuth();
  const navigate   = useNavigate();
  const [tab, setTab] = useState("collection"); // "collection" | "team"
  const [adminMode, setAdminMode] = useState("manage");

  // Team management state (superadmin only)
  const [admins,    setAdmins]    = useState([]);
  const [teamLoad,  setTeamLoad]  = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [newAdmin,  setNewAdmin]  = useState({ username: "", email: "", password: "", role: "admin" });
  const [teamMsg,   setTeamMsg]   = useState({ text: "", type: "" });

  const loadAdmins = async () => {
    setTeamLoad(true);
    try {
      const res = await API.get("/auth/admins");
      setAdmins(res.data);
    } finally {
      setTeamLoad(false);
    }
  };

  useEffect(() => {
    if (tab === "team" && isSuperAdmin) loadAdmins();
  }, [tab]);

  const flash = (text, type = "success") => {
    setTeamMsg({ text, type });
    setTimeout(() => setTeamMsg({ text: "", type: "" }), 3500);
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.username || !newAdmin.email || !newAdmin.password) {
      return flash("All fields are required.", "error");
    }
    if (newAdmin.password.length < 10) {
      return flash("Password must be at least 10 characters.", "error");
    }
    try {
      await API.post("/auth/admins", newAdmin);
      flash(`Admin '${newAdmin.username}' created successfully.`);
      setNewAdmin({ username: "", email: "", password: "", role: "admin" });
      setShowForm(false);
      loadAdmins();
    } catch (err) {
      flash(err.response?.data?.detail || "Failed to create admin.", "error");
    }
  };

  const handleToggleActive = async (admin) => {
    try {
      await API.patch(`/auth/admins/${admin.id}`, { is_active: !admin.is_active });
      flash(`${admin.username} ${admin.is_active ? "deactivated" : "activated"}.`);
      loadAdmins();
    } catch {
      flash("Failed to update admin.", "error");
    }
  };

  const handleDelete = async (admin) => {
    if (!window.confirm(`Permanently remove '${admin.username}'?`)) return;
    try {
      await API.delete(`/auth/admins/${admin.id}`);
      flash(`${admin.username} removed.`);
      loadAdmins();
    } catch (err) {
      flash(err.response?.data?.detail || "Failed to remove admin.", "error");
    }
  };

  const f = (key, val) => setNewAdmin((p) => ({ ...p, [key]: val }));

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand" onClick={() => navigate("/")}>
          <span className="sidebar-brand-name">Shiro's</span>
          <span className="sidebar-brand-sub">Admin</span>
        </div>

        <div className="sidebar-admin-info">
          <div className="sidebar-avatar">{adminUser?.username?.[0]?.toUpperCase()}</div>
          <div>
            <p className="sidebar-username">{adminUser?.username}</p>
            <p className="sidebar-role">{adminUser?.role}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${tab === "collection" ? "sidebar-link--active" : ""}`}
            onClick={() => setTab("collection")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            Collection
          </button>

          {isSuperAdmin && (
            <button
              className={`sidebar-link ${tab === "team" ? "sidebar-link--active" : ""}`}
              onClick={() => setTab("team")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              Admin Team
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <a href="/" className="sidebar-link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            View Store
          </a>
          <button className="sidebar-link sidebar-link--danger" onClick={() => { logout(); navigate("/login"); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">

        {/* ── COLLECTION TAB ── */}
        {tab === "collection" && (
          <div className="admin-tab-content">
            <div className="admin-page-header">
              <div>
                <p className="admin-eyebrow">Inventory</p>
                <h1 className="admin-page-title">Collection Management</h1>
              </div>
              <div className="admin-page-actions">
                <button
                  className={`tab-toggle-btn ${adminMode === "manage" ? "tab-toggle-btn--active" : ""}`}
                  onClick={() => setAdminMode("manage")}
                >Manage Pieces</button>
                <button
                  className={`tab-toggle-btn ${adminMode === "add" ? "tab-toggle-btn--active" : ""}`}
                  onClick={() => setAdminMode("add")}
                >+ Add New</button>
              </div>
            </div>
            <div className="admin-page-divider" />
            <AdminPanel mode={adminMode} onModeChange={setAdminMode} inline />
          </div>
        )}

        {/* ── TEAM TAB (superadmin only) ── */}
        {tab === "team" && isSuperAdmin && (
          <div className="admin-tab-content">
            <div className="admin-page-header">
              <div>
                <p className="admin-eyebrow">Access Control</p>
                <h1 className="admin-page-title">Admin Team</h1>
              </div>
              <button className="admin-add-btn" onClick={() => setShowForm((v) => !v)}>
                {showForm ? "✕ Cancel" : "+ Add Admin"}
              </button>
            </div>
            <div className="admin-page-divider" />

            {teamMsg.text && (
              <div className={`flash flash--${teamMsg.type} mb-flash`}>{teamMsg.text}</div>
            )}

            {/* Add admin form */}
            {showForm && (
              <div className="team-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Username <span className="req">*</span></label>
                    <input className="form-input" placeholder="username" value={newAdmin.username} onChange={(e) => f("username", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email <span className="req">*</span></label>
                    <input className="form-input" type="email" placeholder="email@example.com" value={newAdmin.email} onChange={(e) => f("email", e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password <span className="req">*</span></label>
                    <input className="form-input" type="password" placeholder="Min 10 characters" value={newAdmin.password} onChange={(e) => f("password", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-input form-select" value={newAdmin.role} onChange={(e) => f("role", e.target.value)}>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button className="form-cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                  <button className="form-submit-btn" onClick={handleCreateAdmin}>Create Admin Account</button>
                </div>
              </div>
            )}

            {/* Team table */}
            {teamLoad ? (
              <div className="skeleton-list">{[...Array(3)].map((_, i) => <div key={i} className="admin-skeleton" />)}</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a) => (
                      <tr key={a.id} className="admin-row">
                        <td>
                          <div className="team-user">
                            <div className="team-avatar">{a.username[0].toUpperCase()}</div>
                            {a.username}
                          </div>
                        </td>
                        <td className="admin-cat">{a.email}</td>
                        <td>
                          <span className={`role-pill role-pill--${a.role}`}>{a.role}</span>
                        </td>
                        <td>
                          <span className={`status-pill status-pill--${a.is_active ? "available" : "sold"}`}>
                            {a.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button className="admin-edit-btn" onClick={() => handleToggleActive(a)}>
                              {a.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button className="admin-delete-btn" onClick={() => handleDelete(a)}>Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}