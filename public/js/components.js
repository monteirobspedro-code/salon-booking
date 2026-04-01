const STATUS_LABELS = {
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  completed: 'Terminé',
  no_show:   'Absent',
};

function renderBadge(status) {
  return `<span class="badge badge-${status}">${STATUS_LABELS[status] || status}</span>`;
}

function renderRow(appt) {
  const name  = appt.client_name || '–';
  const phone = (appt.phone || '').replace('whatsapp:', '');
  const today = new Date().toISOString().slice(0, 10);
  const isToday = appt.appt_date === today;

  return `<tr data-id="${appt.id}" class="${isToday ? 'is-today' : ''}">
    <td class="cell-id">#${appt.id}</td>
    <td class="cell-time">${appt.appt_time}</td>
    <td>
      <div class="cell-client-name">${escHtml(name)}</div>
      ${phone ? `<div class="cell-client-phone">${escHtml(phone)}</div>` : ''}
    </td>
    <td class="cell-service">${escHtml(appt.service_name)}</td>
    <td>${renderBadge(appt.status)}</td>
    <td>
      <div class="actions">
        ${appt.status === 'confirmed' ? `
          <button class="act-btn done"   data-action="complete" data-id="${appt.id}">Terminé</button>
          <button class="act-btn absent" data-action="no_show"  data-id="${appt.id}">Absent</button>
        ` : ''}
        ${appt.status !== 'cancelled' ? `
          <button class="act-btn cancel" data-action="cancel" data-id="${appt.id}">Annuler</button>
        ` : ''}
      </div>
    </td>
  </tr>`;
}

function renderStats(stats) {
  document.getElementById('stat-total').textContent     = stats.todayCount;
  document.getElementById('stat-confirmed').textContent = stats.confirmedCount;
  document.getElementById('stat-cancelled').textContent = stats.cancelledCount;
  document.getElementById('stat-completed').textContent = stats.completedCount;
  document.getElementById('stat-revenue').textContent   = formatPrice(stats.revenue);
}

function formatPrice(cents) {
  return (cents / 100).toFixed(2) + ' CHF';
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}
