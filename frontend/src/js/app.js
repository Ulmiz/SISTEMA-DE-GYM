import { getTodayString, formatDateToISO, getDateOffset, addDaysToDate, formatDisplayDate, formatCurrency, showToast } from './modules/utils.js';
import { appState, loadDataFromStorage, saveMembersToStorage, saveTransactionsToStorage, savePricesToStorage, getMemberTrafficStatus, resetSeedData, PASS_DURATIONS, PASS_NAMES } from './modules/state.js';
import { renderMembersTable, applyRolePermissions, updateTodayStats } from './modules/ui.js';
import { api } from './modules/api.js';

// Funciones expuestas a window para botones onClick en HTML (de modules/ui.js)
window.handleDeleteMember = handleDeleteMember;
window.openPaymentModal = openPaymentModal;
window.switchTab = switchTab;
window.reprintTicket = reprintTicket;

function initApp() {
  loadDataFromStorage();
  setupEventListeners();
  updateTimeDisplay();
  setInterval(updateTimeDisplay, 1000);

  const today = getTodayString();
  const startDateInput = document.getElementById('memberStartDate');
  if (startDateInput) startDateInput.value = today;
  const corteDateFilter = document.getElementById('corteDateFilter');
  if (corteDateFilter) corteDateFilter.value = today;

  updateRegistrationEndDatePreview();
  populatePricesInAdminForm();
  applyRolePermissions();
  renderMembersTable();
  updateTodayStats(getTodayString);
  renderCorteView();
}

function setRole(newRole) {
  appState.role = newRole;
  localStorage.setItem('powergym_current_role', newRole);
  applyRolePermissions();
  renderMembersTable();
  showToast(`Cambiado a perfil: ${newRole === 'admin' ? 'Administrador / Dueño' : 'Recepcionista'}`, 'info');
}

export function switchTab(tabId) {
  if (tabId === 'admin' && appState.role !== 'admin') {
    showToast('Acceso Denegado: Solo el Administrador/Dueño puede modificar precios', 'error');
    return;
  }
  const buttons = document.querySelectorAll('.nav-btn');
  const views = document.querySelectorAll('.tab-view');

  buttons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId));
  views.forEach(view => view.classList.toggle('active', view.id === `view-${tabId}`));

  if (tabId === 'dashboard') {
    renderMembersTable();
    updateTodayStats(getTodayString);
    const search = document.getElementById('searchInput');
    if (search) search.focus();
  } else if (tabId === 'corte') {
    renderCorteView();
  } else if (tabId === 'admin') {
    populatePricesInAdminForm();
    updateAdminMetrics();
  }
}

function updateRegistrationEndDatePreview() {
  const passType = document.getElementById('memberPassType').value;
  const startDate = document.getElementById('memberStartDate').value || getTodayString();
  const duration = PASS_DURATIONS[passType] || 30;
  const endDate = addDaysToDate(startDate, duration);

  const calcEndDateText = document.getElementById('calcEndDateText');
  const calcDurationText = document.getElementById('calcDurationText');
  const calcPriceText = document.getElementById('calcPriceText');

  if (calcEndDateText) calcEndDateText.textContent = formatDisplayDate(endDate);
  if (calcDurationText) calcDurationText.textContent = `${duration} días de vigencia`;
  if (calcPriceText) calcPriceText.textContent = formatCurrency(appState.prices[passType] || 0);
}

function handleMemberRegisterSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('memberName');
  const phoneInput = document.getElementById('memberPhone');
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  
  if (!name || !phone) {
    showToast('⚠️ No se pueden guardar socios sin nombre o teléfono.', 'error');
    return;
  }

  const passType = document.getElementById('memberPassType').value;
  const startDate = document.getElementById('memberStartDate').value || getTodayString();
  const duration = PASS_DURATIONS[passType] || 30;
  const endDate = addDaysToDate(startDate, duration);

  const payNowChecked = document.getElementById('checkPayNow').checked;
  const paymentMethodInput = document.querySelector('input[name="immediatePaymentMethod"]:checked');
  const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'efectivo';
  
  const newMemberId = 'MEM-' + String(appState.members.length + 1).padStart(3, '0');
  const newMember = {
    id: newMemberId, name, phone, passType, startDate,
    endDate: payNowChecked ? endDate : getDateOffset(-1),
    status: payNowChecked ? 'active' : 'expired'
  };

  appState.members.unshift(newMember);
  saveMembersToStorage();

  if (payNowChecked) {
    const amount = appState.prices[passType] || 0;
    const ticket = createTransaction(newMember, passType, amount, paymentMethod, endDate);
    showTicketModal(ticket);
    showToast(`✅ Socio ${name} registrado y pago acreditado`, 'success');
  } else {
    showToast(`✅ Socio ${name} registrado con éxito (Cobro pendiente)`, 'success');
    switchTab('dashboard');
  }

  document.getElementById('memberRegisterForm').reset();
  document.getElementById('memberStartDate').value = getTodayString();
  updateRegistrationEndDatePreview();
  renderMembersTable();
  updateTodayStats(getTodayString);
}

export function openPaymentModal(memberId) {
  const member = appState.members.find(m => m.id === memberId);
  if (!member) return;
  const modal = document.getElementById('paymentModal');
  document.getElementById('payMemberId').value = member.id;
  document.getElementById('payMemberNameDisplay').textContent = member.name;
  document.getElementById('payMemberPhoneDisplay').textContent = member.phone;
  const traffic = getMemberTrafficStatus(member);
  const badge = document.getElementById('payMemberStatusBadge');
  badge.className = `pm-badge traffic-badge ${traffic.status}`;
  badge.textContent = traffic.label;
  document.getElementById('payPassType').value = member.passType || 'mensual';
  updatePaymentModalCalculations();
  modal.classList.add('active');
}

function updatePaymentModalCalculations() {
  const memberId = document.getElementById('payMemberId').value;
  const member = appState.members.find(m => m.id === memberId);
  const passType = document.getElementById('payPassType').value;
  const duration = PASS_DURATIONS[passType] || 30;

  let baseDate = getTodayString();
  if (member && member.endDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [y, m, d] = member.endDate.split('-').map(Number);
    const end = new Date(y, m - 1, d);
    if (end > today) baseDate = member.endDate;
  }
  const newDueDate = addDaysToDate(baseDate, duration);
  const price = appState.prices[passType] || 0;

  document.getElementById('payNewDueDateText').textContent = formatDisplayDate(newDueDate);
  document.getElementById('payAmountText').textContent = formatCurrency(price);
}

function handlePaymentSubmit(e) {
  e.preventDefault();
  const memberId = document.getElementById('payMemberId').value;
  const member = appState.members.find(m => m.id === memberId);
  if (!member) return;

  const passType = document.getElementById('payPassType').value;
  const duration = PASS_DURATIONS[passType] || 30;
  const methodInput = document.querySelector('input[name="payMethod"]:checked');
  const paymentMethod = methodInput ? methodInput.value : 'efectivo';
  const amount = appState.prices[passType] || 0;

  let baseDate = getTodayString();
  if (member.endDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [y, m, d] = member.endDate.split('-').map(Number);
    const end = new Date(y, m - 1, d);
    if (end > today) baseDate = member.endDate;
  }
  const newDueDate = addDaysToDate(baseDate, duration);
  member.passType = passType;
  member.endDate = newDueDate;
  member.status = 'active';
  saveMembersToStorage();

  const ticket = createTransaction(member, passType, amount, paymentMethod, newDueDate);
  document.getElementById('paymentModal').classList.remove('active');
  renderMembersTable();
  updateTodayStats(getTodayString);
  renderCorteView();
  showTicketModal(ticket);
  showToast(`Cobro exitoso: ${formatCurrency(amount)} registrado`, 'success');
}

function createTransaction(member, passType, amount, paymentMethod, expirationDate) {
  const now = new Date();
  const ticketNumber = 'TKT-' + (1000 + appState.transactions.length + 1);
  const transaction = {
    id: ticketNumber, memberId: member.id, memberName: member.name, memberPhone: member.phone,
    passType, passName: PASS_NAMES[passType] || passType, amount, paymentMethod,
    date: getTodayString(), time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    expirationDate, cashier: appState.role === 'admin' ? 'Administrador' : 'Recepcionista'
  };
  appState.transactions.unshift(transaction);
  saveTransactionsToStorage();
  return transaction;
}

function showTicketModal(ticket) {
  const modal = document.getElementById('ticketModal');
  if (!modal) return;
  document.getElementById('tktNumber').textContent = `#${ticket.id}`;
  document.getElementById('tktDate').textContent = `${formatDisplayDate(ticket.date)} ${ticket.time}`;
  document.getElementById('tktCashier').textContent = ticket.cashier || 'Recepcionista';
  document.getElementById('tktMemberName').textContent = ticket.memberName;
  document.getElementById('tktMemberPhone').textContent = ticket.memberPhone;
  document.getElementById('tktPassName').textContent = ticket.passName;
  document.getElementById('tktPaymentMethod').textContent = ticket.paymentMethod === 'efectivo' ? 'EFECTIVO' : 'TRANSFERENCIA';
  document.getElementById('tktAmount').textContent = formatCurrency(ticket.amount);
  document.getElementById('tktExpirationDate').textContent = formatDisplayDate(ticket.expirationDate);
  modal.classList.add('active');
}

export function reprintTicket(transactionId) {
  const tx = appState.transactions.find(t => t.id === transactionId);
  if (tx) showTicketModal(tx);
}

function renderCorteView() {
  const dateInput = document.getElementById('corteDateFilter');
  const selectedDate = dateInput ? dateInput.value : getTodayString();
  const transactionsOfDate = appState.transactions.filter(t => t.date === selectedDate);
  let totalAmount = 0, cashTotal = 0, cashCount = 0, transferTotal = 0, transferCount = 0;
  let passCounts = { visita: { count: 0, total: 0 }, semanal: { count: 0, total: 0 }, mensual: { count: 0, total: 0 }, anual: { count: 0, total: 0 } };

  transactionsOfDate.forEach(tx => {
    totalAmount += tx.amount;
    if (tx.paymentMethod === 'efectivo') { cashTotal += tx.amount; cashCount++; }
    else { transferTotal += tx.amount; transferCount++; }
    if (passCounts[tx.passType]) { passCounts[tx.passType].count++; passCounts[tx.passType].total += tx.amount; }
  });

  document.getElementById('corteTotalAmount').textContent = formatCurrency(totalAmount);
  document.getElementById('corteTotalTransactions').textContent = `${transactionsOfDate.length} transacción(es)`;
  document.getElementById('corteCashCount').textContent = `${cashCount} pago(s)`;
  document.getElementById('corteCashTotal').textContent = formatCurrency(cashTotal);
  document.getElementById('corteTransferCount').textContent = `${transferCount} pago(s)`;
  document.getElementById('corteTransferTotal').textContent = formatCurrency(transferTotal);

  Object.keys(passCounts).forEach(k => {
    document.getElementById(`cortePass${k.charAt(0).toUpperCase() + k.slice(1)}Count`).textContent = passCounts[k].count;
    document.getElementById(`cortePass${k.charAt(0).toUpperCase() + k.slice(1)}Total`).textContent = formatCurrency(passCounts[k].total);
  });

  const badgeDate = document.getElementById('corteTableDateBadge');
  if (badgeDate) badgeDate.textContent = selectedDate === getTodayString() ? 'Hoy (' + formatDisplayDate(selectedDate) + ')' : formatDisplayDate(selectedDate);

  const tbody = document.getElementById('corteTableBody');
  const emptyCorte = document.getElementById('emptyCorteState');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (transactionsOfDate.length === 0) {
    emptyCorte.style.display = 'block';
  } else {
    emptyCorte.style.display = 'none';
    transactionsOfDate.forEach(tx => {
      const tr = document.createElement('tr');
      const methodBadge = tx.paymentMethod === 'efectivo' ? '<span style="color:#059669;">💵 Efectivo</span>' : '<span style="color:#2563eb;">💳 Transferencia</span>';
      tr.innerHTML = `
        <td><strong>${tx.time}</strong></td>
        <td><code>${tx.id}</code></td>
        <td><strong>${tx.memberName}</strong></td>
        <td><span class="pass-pill">${tx.passName}</span></td>
        <td>${methodBadge}</td>
        <td><strong>${formatCurrency(tx.amount)}</strong></td>
        <td><span>${formatDisplayDate(tx.expirationDate)}</span></td>
        <td style="text-align:center;"><button class="btn btn-outline" style="padding: 0.35rem 0.75rem; font-size:0.8rem;" onclick="reprintTicket('${tx.id}')">Reimprimir</button></td>
      `;
      tbody.appendChild(tr);
    });
  }
}

export function handleDeleteMember(memberId) {
  if (appState.role !== 'admin') {
    showToast('Acceso Denegado: Solo el Administrador/Dueño puede eliminar socios.', 'error');
    return;
  }
  const member = appState.members.find(m => m.id === memberId);
  if (!member) return;
  if (!confirm(`¿Está seguro de eliminar al socio "${member.name}"?`)) return;

  appState.members = appState.members.filter(m => m.id !== memberId);
  saveMembersToStorage();
  renderMembersTable();
  updateTodayStats(getTodayString);
  showToast(`Socio ${member.name} eliminado`, 'info');
}

function populatePricesInAdminForm() {
  document.getElementById('priceVisita').value = appState.prices.visita;
  document.getElementById('priceSemanal').value = appState.prices.semanal;
  document.getElementById('priceMensual').value = appState.prices.mensual;
  document.getElementById('priceAnual').value = appState.prices.anual;
}

function handlePricesSubmit(e) {
  e.preventDefault();
  if (appState.role !== 'admin') {
    showToast('Acceso Denegado', 'error'); return;
  }
  appState.prices = {
    visita: parseFloat(document.getElementById('priceVisita').value) || 0,
    semanal: parseFloat(document.getElementById('priceSemanal').value) || 0,
    mensual: parseFloat(document.getElementById('priceMensual').value) || 0,
    anual: parseFloat(document.getElementById('priceAnual').value) || 0
  };
  savePricesToStorage();
  updateRegistrationEndDatePreview();
  showToast('Nuevos precios de membresías guardados', 'success');
}

function updateAdminMetrics() {
  const totalRevenue = appState.transactions.reduce((sum, t) => sum + t.amount, 0);
  const activeCount = appState.members.filter(m => getMemberTrafficStatus(m).status !== 'red').length;
  const ratio = appState.members.length > 0 ? Math.round((activeCount / appState.members.length) * 100) : 0;
  
  document.getElementById('metricTotalMembers').textContent = appState.members.length;
  document.getElementById('metricTotalRevenue').textContent = formatCurrency(totalRevenue);
  document.getElementById('metricActiveRatio').textContent = `${ratio}%`;
}

function updateTimeDisplay() {
  const el = document.getElementById('currentTimeDisplay');
  if (el) el.textContent = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function setupEventListeners() {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab'))));
  document.getElementById('roleSelect')?.addEventListener('change', (e) => setRole(e.target.value));
  
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value;
      if (clearSearchBtn) clearSearchBtn.style.display = appState.searchQuery ? 'flex' : 'none';
      renderMembersTable();
    });
  }
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = ''; appState.searchQuery = ''; clearSearchBtn.style.display = 'none';
      renderMembersTable(); searchInput.focus();
    });
  }

  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      appState.activeFilter = pill.getAttribute('data-filter');
      renderMembersTable();
    });
  });

  document.getElementById('btnQuickRegister')?.addEventListener('click', () => { switchTab('socios'); setTimeout(() => document.getElementById('memberName')?.focus(), 100); });
  document.getElementById('filterCardActivos')?.addEventListener('click', () => selectFilterPill('green'));
  document.getElementById('filterCardPorVencer')?.addEventListener('click', () => selectFilterPill('yellow'));
  document.getElementById('filterCardVencidos')?.addEventListener('click', () => selectFilterPill('red'));
  document.getElementById('goToCajaCard')?.addEventListener('click', () => switchTab('corte'));
  document.getElementById('btnResetFilters')?.addEventListener('click', () => { if(searchInput) searchInput.value = ''; appState.searchQuery = ''; selectFilterPill('all'); });
  document.getElementById('memberPassType')?.addEventListener('change', updateRegistrationEndDatePreview);
  document.getElementById('memberStartDate')?.addEventListener('change', updateRegistrationEndDatePreview);
  document.getElementById('checkPayNow')?.addEventListener('change', (e) => document.getElementById('immediatePayOptions').style.display = e.target.checked ? 'block' : 'none');
  document.getElementById('memberRegisterForm')?.addEventListener('submit', handleMemberRegisterSubmit);
  document.getElementById('btnCancelRegister')?.addEventListener('click', () => switchTab('dashboard'));
  document.getElementById('payPassType')?.addEventListener('change', updatePaymentModalCalculations);
  document.getElementById('paymentForm')?.addEventListener('submit', handlePaymentSubmit);
  document.getElementById('closePaymentModal')?.addEventListener('click', () => document.getElementById('paymentModal').classList.remove('active'));
  document.getElementById('btnCancelPayment')?.addEventListener('click', () => document.getElementById('paymentModal').classList.remove('active'));
  document.getElementById('closeTicketModal')?.addEventListener('click', () => document.getElementById('ticketModal').classList.remove('active'));
  document.getElementById('btnCloseTicket')?.addEventListener('click', () => document.getElementById('ticketModal').classList.remove('active'));
  document.getElementById('btnPrintReceipt')?.addEventListener('click', () => window.print());
  document.getElementById('corteDateFilter')?.addEventListener('change', renderCorteView);
  document.getElementById('btnPrintCorte')?.addEventListener('click', () => window.print());
  document.getElementById('pricesForm')?.addEventListener('submit', handlePricesSubmit);
  document.getElementById('btnLoadSampleData')?.addEventListener('click', () => { if(confirm('¿Recargar prueba?')) { resetSeedData(); renderMembersTable(); renderCorteView(); showToast('Recargado', 'success'); }});
  document.getElementById('btnClearAllData')?.addEventListener('click', () => { if(confirm('¿Borrar todo?')) { appState.members=[]; appState.transactions=[]; saveMembersToStorage(); saveTransactionsToStorage(); renderMembersTable(); renderCorteView(); showToast('Borrado', 'info'); }});
}

function selectFilterPill(filterName) {
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.toggle('active', p.getAttribute('data-filter') === filterName));
  appState.activeFilter = filterName;
  renderMembersTable();
}

document.addEventListener('DOMContentLoaded', initApp);
