import { apiFetch } from './apiBase';

export const roomsApi = {
  list:   ()         => apiFetch('/api/rooms'),
  get:    (id)       => apiFetch(`/api/rooms/${id}`),
  create: (data)     => apiFetch('/api/admin/rooms', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/api/admin/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  markCleaned: (id)  => apiFetch(`/api/admin/rooms/${id}/clean`, { method: 'PATCH' }),
  delete: (id)       => apiFetch(`/api/admin/rooms/${id}`, { method: 'DELETE' }),
};

export const bookingsApi = {
  create:    (data) => apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
  myBookings: ()    => apiFetch('/api/bookings/my'),
  cancel:     (id)  => apiFetch(`/api/bookings/${id}/cancel`, { method: 'PATCH' }),
  checkoutMy: (id)  => apiFetch(`/api/bookings/${id}/checkout`, { method: 'PATCH' }),
  extendMy:   (id, new_check_out) =>
    apiFetch(`/api/bookings/${id}/extend`, { method: 'PATCH', body: JSON.stringify({ new_check_out }) }),
  adminAll:   ()    => apiFetch('/api/admin/bookings'),
  adminGet:   (id)  => apiFetch(`/api/admin/bookings/${id}`),
  extend:     (id, new_check_out) =>
    apiFetch(`/api/admin/bookings/${id}/extend`, { method: 'PATCH', body: JSON.stringify({ new_check_out }) }),
  updateStatus: (id, status, payment_status = undefined) =>
    apiFetch(`/api/admin/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, payment_status }) }),
  updatePayment: (id, payment_status) =>
    apiFetch(`/api/admin/bookings/${id}/payment`, { method: 'PUT', body: JSON.stringify({ payment_status }) }),
  delete: (id) => apiFetch(`/api/admin/bookings/${id}`, { method: 'DELETE' }),
};

export const feedbackApi = {
  submit:   (data) => apiFetch('/api/feedback', { method: 'POST', body: JSON.stringify(data) }),
  myFeedback: ()   => apiFetch('/api/feedback/my'),
  adminAll:   ()   => apiFetch('/api/admin/feedback'),
  adminGet:   (id) => apiFetch(`/api/admin/feedback/${id}`),
  delete:     (id) => apiFetch(`/api/admin/feedback/${id}`, { method: 'DELETE' }),
};

export const pricingApi = {
  list:     ()   => apiFetch('/api/admin/pricing'),
  generate: ()   => apiFetch('/api/admin/pricing/generate', { method: 'POST' }),
  approve:  (id) => apiFetch(`/api/admin/pricing/${id}/approve`, { method: 'PUT' }),
  reject:   (id) => apiFetch(`/api/admin/pricing/${id}/reject`, { method: 'PUT' }),
};

export const analyticsApi = {
  dashboard: ()    => apiFetch('/api/admin/dashboard'),
  sentiment: ()    => apiFetch('/api/admin/analytics/sentiment'),
  feedback:  ()    => apiFetch('/api/admin/analytics/feedback'),
  themes:    ()    => apiFetch('/api/admin/analytics/themes'),
  bookings:  ()    => apiFetch('/api/admin/analytics/bookings'),
  rooms:     ()    => apiFetch('/api/admin/analytics/rooms'),
  reports: {
    feedback: () => apiFetch('/api/admin/reports/feedback'),
    bookings: () => apiFetch('/api/admin/reports/bookings'),
    pricing:  () => apiFetch('/api/admin/reports/pricing'),
  },
};

export const usersApi = {
  me:            ()         => apiFetch('/api/users/me'),
  updateProfile: (data)     => apiFetch('/api/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  list:          ()         => apiFetch('/api/admin/users'),
  create:        (data)     => apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  update:        (id, data) => apiFetch(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:        (id)       => apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' }),
};
