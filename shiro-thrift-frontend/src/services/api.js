import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export function resolveAssetUrl(value) {
  if (!value) return value;
  if (value.startsWith("blob:") || value.startsWith("data:")) return value;

  try {
    if (/^https?:\/\//i.test(value)) {
      const url = new URL(value);
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        return new URL(url.pathname, API_BASE_URL).toString();
      }
      return value;
    }

    const path = value.startsWith("/") ? value : `/${value}`;
    return new URL(path, API_BASE_URL).toString();
  } catch {
    return value;
  }
}

export default API;
