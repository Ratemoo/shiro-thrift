import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, loading, error, setError, isAdmin } = useAuth();
  const navigate       = useNavigate();
  const [params]       = useSearchParams();
  const expired        = params.get("expired") === "1";

  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attempts,     setAttempts]     = useState(0);

  // If already logged in, go straight to admin panel
  useEffect(() => {
    if (isAdmin) navigate("/admin");
  }, [isAdmin]);

  useEffect(() => {
    return () => setError("");  // clear errors on unmount
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password) { setError("Both fields are required."); return; }
    const { ok } = await login(username.trim(), password);
    if (ok) {
      navigate("/admin");
    } else {
      setAttempts((a) => a + 1);
      setPassword("");
    }
  };

  return (
    <div className="login-page">
      {/* Decorative background */}
      <div className="login-bg">
        <div className="login-bg-circle login-bg-circle--1" />
        <div className="login-bg-circle login-bg-circle--2" />
        <div className="login-bg-circle login-bg-circle--3" />
      </div>

      {/* Brand link */}
      <a href="/" className="login-brand">
        <span className="login-brand-name">Shiro's</span>
        <span className="login-brand-sub">Thrift Collection</span>
      </a>

      {/* Card */}
      <div className="login-card">
        <div className="login-card-header">
          <div className="login-lock">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <p className="login-eyebrow">Restricted Access</p>
          <h1 className="login-title">Admin Sign In</h1>
          <p className="login-subtitle">Authorised personnel only</p>
        </div>

        <div className="login-divider" />

        <form className="login-form" onSubmit={handleSubmit} noValidate>

          {/* Expired session banner */}
          {expired && !error && (
            <div className="login-banner login-banner--warn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Your session expired. Please sign in again.
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="login-banner login-banner--error">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="Enter your username"
              value={username}
              autoComplete="username"
              autoFocus
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || attempts >= 5}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-wrap">
              <input
                className="form-input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || attempts >= 5}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading || attempts >= 5}
          >
            {loading ? <span className="login-spinner" /> : "Sign In"}
          </button>

          <a href="/" className="login-back-link">← Back to store</a>

          <p className="login-note">Sessions expire after 1 hour · {attempts >= 5 ? "Too many attempts — wait 10 min" : `${5 - attempts} attempt${5 - attempts !== 1 ? "s" : ""} remaining`}</p>
        </form>
      </div>
    </div>
  );
}