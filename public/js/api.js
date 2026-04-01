async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

const api = {
  getAppointments: (params = {}) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString();
    return apiFetch(`/api/appointments${qs ? '?' + qs : ''}`);
  },
  createAppointment: (body) => apiFetch('/api/appointments', { method: 'POST', body }),
  updateStatus: (id, status) => apiFetch(`/api/appointments/${id}`, { method: 'PATCH', body: { status } }),
  deleteAppointment: (id) => apiFetch(`/api/appointments/${id}`, { method: 'DELETE' }),
  getStats: (date) => apiFetch(`/api/stats${date ? '?date=' + date : ''}`),
  getSlots: (date) => apiFetch(`/api/appointments/availability/slots?date=${date}`),
  getServices: () => apiFetch('/api/appointments/services/list'),
};
