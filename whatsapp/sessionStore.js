const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const store = new Map();

function get(phone) {
  const session = store.get(phone);
  if (!session) return null;
  if (Date.now() - session.updatedAt > TIMEOUT_MS) {
    store.delete(phone);
    return null;
  }
  return session;
}

function set(phone, state, data = {}) {
  const existing = store.get(phone) || {};
  store.set(phone, {
    state,
    data: { ...(existing.data || {}), ...data },
    updatedAt: Date.now(),
  });
}

function reset(phone) {
  store.delete(phone);
}

// Cleanup expired sessions every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - TIMEOUT_MS;
  for (const [phone, session] of store.entries()) {
    if (session.updatedAt < cutoff) store.delete(phone);
  }
}, 10 * 60 * 1000);

module.exports = { get, set, reset };
