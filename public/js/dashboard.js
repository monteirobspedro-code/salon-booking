let pollInterval = null;
let currentDate  = new Date().toISOString().slice(0, 10);

const DAY_NAMES = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const MONTH_NAMES = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('date-picker').value = currentDate;
  updateDateDisplay();
  await loadServices();
  await refresh();
  pollInterval = setInterval(refresh, 15000);
  wireEvents();
});

// ── Date display ──────────────────────────────────────────────────────────────
function updateDateDisplay() {
  const d = new Date(currentDate + 'T12:00:00');
  const today = new Date().toISOString().slice(0, 10);
  const label = `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  const el = document.getElementById('date-display');
  el.textContent = label;
  el.classList.toggle('is-today', currentDate === today);
  document.getElementById('date-picker').value = currentDate;
}

function shiftDay(delta) {
  const d = new Date(currentDate + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  currentDate = d.toISOString().slice(0, 10);
  updateDateDisplay();
  refresh();
}

// ── Data ──────────────────────────────────────────────────────────────────────
async function refresh() {
  const search = document.getElementById('search').value;
  const status = document.getElementById('filter-status').value;

  const [appts, stats] = await Promise.all([
    api.getAppointments({ date: currentDate, status, search }).catch(() => ({ data: [], meta: {} })),
    api.getStats(currentDate).catch(() => ({})),
  ]);

  renderTable(appts.data);
  if (stats.todayCount !== undefined) renderStats(stats);
}

function renderTable(rows) {
  const tbody = document.getElementById('appointments-body');
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">
      <div class="empty-icon">✦ ✦ ✦</div>
      <div>Aucun rendez-vous pour cette date.</div>
    </td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(renderRow).join('');
}

// ── Events ────────────────────────────────────────────────────────────────────
function wireEvents() {
  // Date navigation
  document.getElementById('btn-prev-day').addEventListener('click', () => shiftDay(-1));
  document.getElementById('btn-next-day').addEventListener('click', () => shiftDay(+1));
  document.getElementById('date-display').addEventListener('click', () => {
    document.getElementById('date-picker').showPicker?.();
    document.getElementById('date-picker').click();
  });
  document.getElementById('date-picker').addEventListener('change', e => {
    currentDate = e.target.value;
    updateDateDisplay();
    refresh();
  });

  // Search + filter pills
  document.getElementById('search').addEventListener('input', debounce(refresh, 400));

  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      document.getElementById('filter-status').value = pill.dataset.status;
      refresh();
    });
  });

  // Modal
  document.getElementById('btn-new').addEventListener('click', openModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal-2').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
  document.getElementById('f-date').addEventListener('change', loadSlots);
  document.getElementById('btn-submit').addEventListener('click', submitBooking);

  // Row actions (event delegation)
  document.getElementById('appointments-body').addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    const statusMap = { complete: 'completed', no_show: 'no_show', cancel: 'cancelled' };
    if (!statusMap[action]) return;

    if (action === 'cancel' && !confirm('Confirmer l\'annulation de ce rendez-vous ?')) return;

    btn.disabled = true;
    try {
      await api.updateStatus(id, statusMap[action]);
      showToast('Statut mis à jour.');
      refresh();
    } catch (err) {
      showToast(err.message);
      btn.disabled = false;
    }
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal() {
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('f-date').value = currentDate;
  loadSlots();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  ['f-phone', 'f-name', 'f-notes'].forEach(id => { document.getElementById(id).value = ''; });
}

async function loadServices() {
  const services = await api.getServices().catch(() => []);
  const sel = document.getElementById('f-service');
  sel.innerHTML = services.map(s =>
    `<option value="${s.id}">${s.name} – ${(s.price_cents / 100).toFixed(2)} CHF</option>`
  ).join('');
}

async function loadSlots() {
  const date = document.getElementById('f-date').value;
  const sel  = document.getElementById('f-slot');
  if (!date) { sel.innerHTML = '<option value="">Sélectionnez une date d\'abord</option>'; return; }

  sel.innerHTML = '<option>Chargement…</option>';
  const slots = await api.getSlots(date).catch(() => []);
  if (!slots.length) {
    sel.innerHTML = '<option value="">Aucun créneau disponible</option>';
    return;
  }
  sel.innerHTML = slots.map(s => `<option value="${s.value}">${s.label}</option>`).join('');
}

async function submitBooking() {
  const phone      = document.getElementById('f-phone').value.trim();
  const name       = document.getElementById('f-name').value.trim();
  const service_id = document.getElementById('f-service').value;
  const appt_date  = document.getElementById('f-date').value;
  const appt_time  = document.getElementById('f-slot').value;
  const notes      = document.getElementById('f-notes').value.trim();

  if (!phone || !service_id || !appt_date || !appt_time) {
    showToast('Veuillez remplir tous les champs obligatoires.'); return;
  }

  const btn = document.getElementById('btn-submit');
  btn.disabled = true;
  try {
    await api.createAppointment({ phone, name, service_id, appt_date, appt_time, notes });
    showToast('Rendez-vous créé !');
    closeModal();
    refresh();
  } catch (err) {
    showToast(err.message);
  } finally {
    btn.disabled = false;
  }
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}
