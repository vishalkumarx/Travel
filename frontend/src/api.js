import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Resolve image url: external http(s) stays as-is, storage paths go through /files
export function imgUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API}/files/${path}`;
}

export function wsUrl(conversationId) {
  const base = BACKEND_URL.replace(/^http/, "ws");
  return `${base}/api/ws/chat/${conversationId}`;
}
