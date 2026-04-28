import { createContext, useState, useContext, useCallback, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [token,     setToken]     = useState(null);
  const [adminUser, setAdminUser] = useState(null);  // { username, role }
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const isAdmin      = adminUser?.role === "admin" || adminUser?.role === "superadmin";
  const isSuperAdmin = adminUser?.role === "superadmin";

  // Attach token to every request when present
  useEffect(() => {
    if (token) {
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete API.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Global 401 interceptor — auto-logout if token expires mid-session
  useEffect(() => {
    const id = API.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401 && token) {
          logout();
          window.location.href = "/login?expired=1";
        }
        return Promise.reject(err);
      }
    );
    return () => API.interceptors.response.eject(id);
  }, [token]);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/login", { username, password });
      const { access_token, role } = res.data;
      setToken(access_token);
      setAdminUser({ username, role });
      return { ok: true, role };
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) setError("Too many attempts. Please wait 10 minutes.");
      else if (status === 401) setError("Incorrect username or password.");
      else setError("Login failed. Is the server running?");
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAdminUser(null);
    setError("");
  }, []);

  return (
    <AuthContext.Provider value={{ isAdmin, isSuperAdmin, adminUser, login, logout, loading, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}