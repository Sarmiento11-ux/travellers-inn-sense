import { apiFetch, setAuthData } from './apiBase';

export const authApi = {
  /** Customer registration */
  register: (name, email, password) =>
    apiFetch('/api/auth/customer/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }).then(data => { setAuthData(data.access_token, data.user); return data; }),

  /** Customer login */
  customerLogin: (email, password) =>
    apiFetch('/api/auth/customer/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then(data => { setAuthData(data.access_token, data.user); return data; }),

  /** Admin login */
  adminLogin: (email, password) =>
    apiFetch('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then(data => { setAuthData(data.access_token, data.user); return data; }),

  /** Current user profile */
  me: () => apiFetch('/api/users/me'),
};
