/**
 * API Base Configuration
 * Connects the React frontend to the FastAPI backend.
 */

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** Get the stored JWT token */
export function getToken() {
  return localStorage.getItem('authToken');
}

/** Store tokens after login */
export function setAuthData(token, user) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('currentUser', JSON.stringify(user));
  if (user.role === 'customer') {
    localStorage.setItem('customerAuth', 'true');
  } else {
    localStorage.setItem('adminAuth', 'true');
  }
}

/** Clear all auth data */
export function clearAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('customerAuth');
  localStorage.removeItem('adminAuth');
}

/** Core fetch wrapper with auth header + error handling */
export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (Array.isArray(err.detail) && err.detail.length > 0) {
        detail = err.detail.map(d => d.msg ? d.msg.replace('Value error, ', '') : JSON.stringify(d)).join('; ');
      } else if (typeof err.detail === 'string') {
        detail = err.detail;
      } else if (err.message) {
        detail = err.message;
      } else {
        detail = JSON.stringify(err);
      }
    } catch {}
    throw new Error(detail);
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}
