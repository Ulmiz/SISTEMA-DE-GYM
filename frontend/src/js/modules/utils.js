export function getTodayString() {
  const now = new Date();
  return formatDateToISO(now);
}

export function formatDateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDateToISO(d);
}

export function addDaysToDate(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return formatDateToISO(d);
}

// Cómputo exacto de pases según Requerimientos.md (Bloque 1, Pregunta 3)
export function calculatePassDueDate(startDateString, passType) {
  if (passType === 'visita') {
    // Visita vence al cierre del mismo día
    return startDateString;
  }
  if (passType === 'semanal') {
    return addDaysToDate(startDateString, 7);
  }
  if (passType === 'mensual') {
    // Mensual: Mismo día del mes siguiente
    const [year, month, day] = startDateString.split('-').map(Number);
    // new Date(year, month, day) donde 'month' (1-12) representa el mes siguiente ya que en JS los meses son 0-11
    const nextMonth = new Date(year, month, day);
    return formatDateToISO(nextMonth);
  }
  if (passType === 'anual') {
    const [year, month, day] = startDateString.split('-').map(Number);
    const nextYear = new Date(year + 1, month - 1, day);
    return formatDateToISO(nextYear);
  }
  return addDaysToDate(startDateString, 30);
}

export function formatDisplayDate(dateString) {
  if (!dateString) return '--/--/----';
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase();
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

export function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}
