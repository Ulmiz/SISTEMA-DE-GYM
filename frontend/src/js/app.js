import { getTodayString, formatDateToISO, addDaysToDate, formatDisplayDate, formatCurrency, showToast } from './modules/utils.js';
import { appState, loadDataFromStorage, saveMembersCache, loadMembersCache, saveTransactionsToStorage, savePricesToStorage, getMemberTrafficStatus, addTransaction, hideMember, isHiddenMember, setPendingPayment, isPendingPayment, PASS_DURATIONS, PASS_NAMES } from './modules/state.js';
import { renderMembersTable, applyRolePermissions, updateTodayStats } from './modules/ui.js';
import { api } from './modules/api.js';

// Importación de Componentes Modulares
import { renderNavbar, renderRoleBanner } from './components/Navbar.js';
import { renderDashboardView } from './components/DashboardView.js';
import { renderSociosView } from './components/SociosView.js';
import { renderCorteViewTemplate } from './components/CorteView.js';
import { renderAdminView } from './components/AdminView.js';
import { renderPaymentModal } from './components/PaymentModal.js';
import { renderTicketModal } from './components/TicketModal.js';

// Funciones expuestas a window para botones onClick en HTML (de modules/ui.js)
window.handleDeleteMember = handleDeleteMember;
window.openPaymentModal = openPaymentModal;
window.switchTab = switchTab;
window.reprintTicket = reprintTicket;
window.resetPaymentMethodSelection = resetPaymentMethodSelection;
window.updatePaymentMethodState = updatePaymentMethodState;

function mountComponents() {
  const headerNav = document.getElementById('headerNav');
  if (headerNav) headerNav.innerHTML = renderNavbar();

  const roleBanner = document.getElementById('roleBanner');
  if (roleBanner) roleBanner.innerHTML = renderRoleBanner();

  const appMain = document.getElementById('appMain');
  if (appMain) {
    appMain.innerHTML = `
      ${renderDashboardView()}
      ${renderSociosView()}
      ${renderCorteViewTemplate()}
      ${renderAdminView()}
    `;
  }

  const modalContainer = document.getElementById('modalContainer');
  if (modalContainer) {
    modalContainer.innerHTML = `
      ${renderPaymentModal()}
      ${renderTicketModal()}
    `;
  }
}

// Carga los socios reales desde el backend; si no responde, usa la última copia local.
async function refreshMembers() {
  try {
    const members = await api.getMembers();
    appState.backendOnline = true;
    appState.members = members.filter(m => !isHiddenMember(m.id));
    saveMembersCache(appState.members);
    renderMembersTable();
    return true;
  } catch (error) {
    appState.backendOnline = false;
    appState.members = loadMembersCache().filter(m => !isHiddenMember(m.id));
    renderMembersTable();
    showToast(
      appState.members.length > 0 ? `${error.message} Mostrando la última copia local.` : error.message,
      'error'
    );
    return false;
  }
}

async function initApp() {
  mountComponents();
  loadDataFromStorage();
  setupEventListeners();
  updateTimeDisplay();
  setInterval(updateTimeDisplay, 1000);

  const corteDateFilter = document.getElementById('corteDateFilter');
  if (corteDateFilter) corteDateFilter.value = getTodayString();

  updateRegistrationEndDatePreview();
  populatePricesInAdminForm();
  applyRolePermissions();
  renderMembersTable();
  updateTodayStats(getTodayString);
  renderCorteView();

  await refreshMembers();
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
    refreshMembers(); // siempre contra datos reales del backend
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
  // El backend ignora fechas manuales: siempre es fin de hoy + días exactos del pase.
  const endDate = addDaysToDate(getTodayString(), PASS_DURATIONS[passType] || PASS_DURATIONS.mensual);

  const calcEndDateText = document.getElementById('calcEndDateText');
  const calcDurationText = document.getElementById('calcDurationText');
  const calcPriceText = document.getElementById('calcPriceText');

  if (calcEndDateText) calcEndDateText.textContent = formatDisplayDate(endDate);
  if (calcDurationText) {
    calcDurationText.textContent = `${PASS_DURATIONS[passType]} días desde hoy (cálculo automático)`;
  }
  if (calcPriceText) calcPriceText.textContent = formatCurrency(appState.prices[passType] || 0);
}

async function handleMemberRegisterSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('memberName');
  const phoneInput = document.getElementById('memberPhone');
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  
  if (!name || !phone) {
    showToast('⚠️ No se pueden guardar socios sin nombre o teléfono.', 'error');
    return;
  }

  // Requerimiento 2: Bloquear si intentan registrar el mismo teléfono
  const cleanPhone = phone.replace(/\D/g, '');
  const existingMember = appState.members.find(m => m.phone.replace(/\D/g, '') === cleanPhone);
  if (existingMember) {
    showToast(`⚠️ El teléfono ${phone} ya pertenece a "${existingMember.name}". Búscalo en la lista para renovar su pase.`, 'error');
    switchTab('dashboard');
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = phone;
      appState.searchQuery = phone;
      renderMembersTable();
      searchInput.focus();
    }
    return;
  }

  const passType = document.getElementById('memberPassType').value;
  const payNowChecked = document.getElementById('checkPayNow').checked;
  const paymentMethodInput = document.querySelector('input[name="immediatePaymentMethod"]:checked');
  const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'efectivo';
  const amount = appState.prices[passType] || 0;

  const submitBtn = document.getElementById('btnSubmitRegister');
  if (submitBtn) submitBtn.disabled = true;

  try {
    // 1) Alta real en el backend (la vigencia la calcula el servidor).
    let member = await api.createMember({ name, phone, passType });
    appState.members.unshift(member);
    saveMembersCache(appState.members);

    if (payNowChecked) {
      // 2) Cobro real: registra el pago y reinicia la vigencia desde la fecha de cobro.
      try {
        const { member: cobrado, payment } = await api.chargeMember(member.id, { amount, paymentMethod });
        member = applyMemberUpdate(cobrado);
        const ticket = buildTransactionFromPayment(member, payment);
        addTransaction(ticket);
        renderMembersTable();
        renderCorteView();
        showTicketModal(ticket);
        showToast(`✅ Socio ${name} registrado y pago acreditado`, 'success');
      } catch (cobroError) {
        setPendingPayment(member.id, true);
        showToast(`Socio registrado, pero el cobro falló: ${cobroError.message}`, 'error');
      }
    } else {
      // Alta sin pago: acceso bloqueado hasta liquidar (Requerimiento 5).
      setPendingPayment(member.id, true);
      showToast(`✅ Socio ${name} registrado con éxito (Cobro pendiente)`, 'success');
      switchTab('dashboard');
    }

    document.getElementById('memberRegisterForm').reset();
    updateRegistrationEndDatePreview();
    renderMembersTable();
    updateTodayStats(getTodayString);
    renderCorteView();
  } catch (error) {
    if (error.status === 409) {
      // Teléfono duplicado: lo manda al listado buscándolo (Requerimiento 2).
      showToast(`⚠️ ${error.message}`, 'error');
      switchTab('dashboard');
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.value = phone;
        appState.searchQuery = phone;
        renderMembersTable();
        searchInput.focus();
      }
    } else {
      showToast(error.message, 'error');
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

export function openPaymentModal(memberId) {
  const member = appState.members.find(m => String(m.id) === String(memberId));
  if (!member) return;
  const modal = document.getElementById('paymentModal');
  document.getElementById('payMemberId').value = member.id;
  document.getElementById('payMemberNameDisplay').textContent = member.name;
  document.getElementById('payMemberPhoneDisplay').textContent = member.phone;
  const traffic = getMemberTrafficStatus(member);
  const badge = document.getElementById('payMemberStatusBadge');
  badge.className = `pm-badge traffic-badge ${traffic.status}`;
  badge.textContent = traffic.label;
  // El backend renueva el pase vigente del socio: no se puede cambiar de tipo en el cobro.
  const payPassType = document.getElementById('payPassType');
  payPassType.value = member.passType || 'mensual';
  payPassType.disabled = true;
  payPassType.title = 'El cobro renueva el pase vigente del socio';

  // Requerimiento 3.1: Modal emergente que obligue a elegir entre "Efectivo" o "Transferencia" para habilitar confirmación
  resetPaymentMethodSelection();

  updatePaymentModalCalculations();
  modal.classList.add('active');
}

export function resetPaymentMethodSelection() {
  const methodInputs = document.querySelectorAll('input[name="payMethod"]');
  methodInputs.forEach(input => {
    input.checked = false;
  });
  updatePaymentMethodState(null);
}

export function updatePaymentMethodState(selectedMethod) {
  const confirmBtn = document.getElementById('btnConfirmPayment');
  const badge = document.getElementById('payMethodBadge');
  const notice = document.getElementById('paySelectionNotice');

  if (selectedMethod) {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.title = 'Confirmar el cobro registrado';
    }
    if (badge) {
      badge.className = 'method-req-badge selected';
      badge.textContent = selectedMethod === 'efectivo' ? '💵 Efectivo elegido' : '💳 Transferencia elegida';
    }
    if (notice) {
      notice.className = 'payment-selection-notice ready';
      notice.innerHTML = `<span class="notice-icon">✅</span><span class="notice-text">Método seleccionado: <strong>${selectedMethod === 'efectivo' ? 'Efectivo' : 'Transferencia'}</strong>. Confirmación habilitada.</span>`;
    }
  } else {
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.title = 'Debes seleccionar Efectivo o Transferencia para habilitar la confirmación';
    }
    if (badge) {
      badge.className = 'method-req-badge pending';
      badge.textContent = 'Selección obligatoria';
    }
    if (notice) {
      notice.className = 'payment-selection-notice pending';
      notice.innerHTML = `<span class="notice-icon">⚠️</span><span class="notice-text">Selecciona <strong>Efectivo</strong> o <strong>Transferencia</strong> para habilitar la confirmación.</span>`;
    }
  }
}

function updatePaymentModalCalculations() {
  const memberId = document.getElementById('payMemberId').value;
  const member = appState.members.find(m => String(m.id) === String(memberId));
  if (!member) return;
  const passType = member.passType || 'mensual';

  // Requerimiento 1: la vigencia se reinicia desde la fecha de cobro.
  // Mismo cálculo que hace el backend: fin de hoy + días exactos del pase.
  const newDueDate = addDaysToDate(getTodayString(), PASS_DURATIONS[passType] || PASS_DURATIONS.mensual);
  const price = appState.prices[passType] || 0;

  document.getElementById('payNewDueDateText').textContent = formatDisplayDate(newDueDate);
  document.getElementById('payAmountText').textContent = formatCurrency(price);
}

async function handlePaymentSubmit(e) {
  e.preventDefault();
  const memberId = document.getElementById('payMemberId').value;
  const member = appState.members.find(m => String(m.id) === String(memberId));
  if (!member) return;

  const methodInput = document.querySelector('input[name="payMethod"]:checked');
  if (!methodInput) {
    updatePaymentMethodState(null);
    showToast('⚠️ Obligatorio: Debes seleccionar Efectivo o Transferencia para confirmar el cobro', 'warning');
    return;
  }

  const paymentMethod = methodInput.value;
  const amount = appState.prices[member.passType] || 0;

  const confirmBtn = document.getElementById('btnConfirmPayment');
  if (confirmBtn) confirmBtn.disabled = true;

  try {
    // El backend registra el pago y renueva la vigencia desde la fecha de cobro.
    const { member: cobrado, payment } = await api.chargeMember(member.id, { amount, paymentMethod });
    const actualizado = applyMemberUpdate(cobrado);
    const ticket = buildTransactionFromPayment(actualizado, payment);
    addTransaction(ticket);

    document.getElementById('paymentModal').classList.remove('active');
    resetPaymentMethodSelection();
    renderMembersTable();
    updateTodayStats(getTodayString);
    renderCorteView();
    showTicketModal(ticket);
    showToast(`Cobro exitoso: ${formatCurrency(amount)} registrado (${paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia'})`, 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    const currentChecked = document.querySelector('input[name="payMethod"]:checked');
    if (confirmBtn) confirmBtn.disabled = !currentChecked;
  }
}

// Aplica un socio devuelto por el backend al estado local y cachea la lista.
function applyMemberUpdate(member) {
  const index = appState.members.findIndex(m => String(m.id) === String(member.id));
  if (index >= 0) appState.members[index] = member;
  else appState.members.unshift(member);
  setPendingPayment(member.id, false);
  saveMembersCache(appState.members);
  return member;
}

// Ticket local generado a partir del pago real registrado por el backend.
function buildTransactionFromPayment(member, payment) {
  const passType = member.passType;
  return {
    id: 'TKT-' + payment.id, memberId: member.id, memberName: member.name, memberPhone: member.phone,
    passType, passName: PASS_NAMES[passType] || passType,
    amount: payment.amount, paymentMethod: payment.paymentMethod,
    date: payment.date, time: payment.time,
    expirationDate: member.endDate, cashier: appState.role === 'admin' ? 'Administrador' : 'Recepcionista'
  };
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

  const totalAmountEl = document.getElementById('corteTotalAmount');
  const totalTransactionsEl = document.getElementById('corteTotalTransactions');
  if (totalAmountEl) totalAmountEl.textContent = formatCurrency(totalAmount);
  if (totalTransactionsEl) totalTransactionsEl.textContent = `${transactionsOfDate.length} transacción(es)`;

  const summaryTotalAmountEl = document.getElementById('corteSummaryTotalAmount');
  const summaryTotalTransactionsEl = document.getElementById('corteSummaryTotalTransactions');
  if (summaryTotalAmountEl) summaryTotalAmountEl.textContent = formatCurrency(totalAmount);
  if (summaryTotalTransactionsEl) summaryTotalTransactionsEl.textContent = `${transactionsOfDate.length} transacciones registradas`;

  const cashCountEl = document.getElementById('corteCashCount');
  const cashTotalEl = document.getElementById('corteCashTotal');
  const summaryCashCountEl = document.getElementById('corteSummaryCashCount');
  const summaryCashTotalEl = document.getElementById('corteSummaryCashTotal');
  if (cashCountEl) cashCountEl.textContent = `${cashCount} pago(s)`;
  if (cashTotalEl) cashTotalEl.textContent = formatCurrency(cashTotal);
  if (summaryCashCountEl) summaryCashCountEl.textContent = `${cashCount} pagos`;
  if (summaryCashTotalEl) summaryCashTotalEl.textContent = formatCurrency(cashTotal);

  const transferCountEl = document.getElementById('corteTransferCount');
  const transferTotalEl = document.getElementById('corteTransferTotal');
  const summaryTransferCountEl = document.getElementById('corteSummaryTransferCount');
  const summaryTransferTotalEl = document.getElementById('corteSummaryTransferTotal');
  if (transferCountEl) transferCountEl.textContent = `${transferCount} pago(s)`;
  if (transferTotalEl) transferTotalEl.textContent = formatCurrency(transferTotal);
  if (summaryTransferCountEl) summaryTransferCountEl.textContent = `${transferCount} pagos`;
  if (summaryTransferTotalEl) summaryTransferTotalEl.textContent = formatCurrency(transferTotal);

  Object.keys(passCounts).forEach(k => {
    const countId = `cortePass${k.charAt(0).toUpperCase() + k.slice(1)}Count`;
    const totalId = `cortePass${k.charAt(0).toUpperCase() + k.slice(1)}Total`;
    const countEl = document.getElementById(countId);
    const totalEl = document.getElementById(totalId);
    if (countEl) countEl.textContent = passCounts[k].count;
    if (totalEl) totalEl.textContent = formatCurrency(passCounts[k].total);
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
  const member = appState.members.find(m => String(m.id) === String(memberId));
  if (!member) return;
  if (!confirm(`¿Está seguro de ocultar al socio "${member.name}"?`)) return;

  // Requerimiento 14: borrado lógico (se oculta de la vista, se conserva el registro).
  hideMember(memberId);
  appState.members = appState.members.filter(m => String(m.id) !== String(memberId));
  saveMembersCache(appState.members);
  renderMembersTable();
  updateTodayStats(getTodayString);
  showToast(`Socio ${member.name} oculto de la lista (borrado lógico)`, 'info');
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

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        appState.searchQuery = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        renderMembersTable();
        searchInput.blur();
      }
    });
  }
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = ''; appState.searchQuery = ''; clearSearchBtn.style.display = 'none';
      renderMembersTable(); searchInput.focus();
    });
  }

  // Atajo de teclado para hora pico: presionar '/' o 'Ctrl+K' para buscar instantáneamente
  document.addEventListener('keydown', (e) => {
    if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      switchTab('dashboard');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });

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
  document.getElementById('checkPayNow')?.addEventListener('change', (e) => document.getElementById('immediatePayOptions').style.display = e.target.checked ? 'block' : 'none');
  document.getElementById('memberRegisterForm')?.addEventListener('submit', handleMemberRegisterSubmit);
  document.getElementById('btnCancelRegister')?.addEventListener('click', () => switchTab('dashboard'));
  document.getElementById('payPassType')?.addEventListener('change', updatePaymentModalCalculations);
  document.getElementById('paymentForm')?.addEventListener('submit', handlePaymentSubmit);

  // Requerimiento 3.1: Habilitar botón de confirmación en cobro rápido al seleccionar Efectivo o Transferencia
  document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        updatePaymentMethodState(e.target.value);
      }
    });
  });

  const paymentSelectorContainer = document.getElementById('paymentMethodSelector');
  if (paymentSelectorContainer) {
    paymentSelectorContainer.addEventListener('click', () => {
      const activeRadio = document.querySelector('input[name="payMethod"]:checked');
      if (activeRadio) {
        updatePaymentMethodState(activeRadio.value);
      }
    });
  }

  document.getElementById('closePaymentModal')?.addEventListener('click', () => {
    document.getElementById('paymentModal').classList.remove('active');
    resetPaymentMethodSelection();
  });
  document.getElementById('btnCancelPayment')?.addEventListener('click', () => {
    document.getElementById('paymentModal').classList.remove('active');
    resetPaymentMethodSelection();
  });
  document.getElementById('closeTicketModal')?.addEventListener('click', () => document.getElementById('ticketModal').classList.remove('active'));
  document.getElementById('btnCloseTicket')?.addEventListener('click', () => document.getElementById('ticketModal').classList.remove('active'));
  document.getElementById('btnPrintReceipt')?.addEventListener('click', () => window.print());
  document.getElementById('corteDateFilter')?.addEventListener('change', renderCorteView);
  document.getElementById('btnPrintCorte')?.addEventListener('click', () => window.print());
  document.getElementById('pricesForm')?.addEventListener('submit', handlePricesSubmit);
  document.getElementById('btnLoadSampleData')?.addEventListener('click', async () => { if (await refreshMembers()) showToast('Datos sincronizados con el backend', 'success'); });
  document.getElementById('btnClearAllData')?.addEventListener('click', () => { if(confirm('¿Limpiar el historial local de tickets? No toca los datos del backend.')) { appState.transactions=[]; saveTransactionsToStorage(); updateTodayStats(getTodayString); renderCorteView(); showToast('Historial local de tickets limpiado', 'info'); }});
}

function selectFilterPill(filterName) {
  if (appState.activeFilter === filterName) {
    appState.activeFilter = 'all';
  } else {
    appState.activeFilter = filterName;
  }
  document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active-card'));
  if (appState.activeFilter !== 'all') {
    const cardMap = { green: 'filterCardActivos', yellow: 'filterCardPorVencer', red: 'filterCardVencidos' };
    const activeEl = document.getElementById(cardMap[appState.activeFilter]);
    if (activeEl) activeEl.classList.add('active-card');
  }
  renderMembersTable();
}

document.addEventListener('DOMContentLoaded', initApp);
