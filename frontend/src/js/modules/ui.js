import { appState, getMemberTrafficStatus, PASS_NAMES } from './state.js';
import { formatCurrency, formatDisplayDate, escapeHtml } from './utils.js';
import { switchTab, openPaymentModal, handleDeleteMember, reprintTicket } from '../app.js'; 
// We will define these actions in app.js and export them, or better, pass callbacks or use events.
// For simplicity, we can keep the DOM rendering logic here and attach the global window functions for inline onclick,
// or we can attach event listeners dynamically. The original used inline onclick attributes.
// Let's bind them to window object in app.js so inline onclicks still work.

export function renderMembersTable() {
  const tbody = document.getElementById('membersTableBody');
  const emptyState = document.getElementById('emptyState');
  if (!tbody) return;

  const query = appState.searchQuery.toLowerCase().trim();
  const filter = appState.activeFilter;

  let greenCount = 0; let yellowCount = 0; let redCount = 0;

  const evaluatedMembers = appState.members.map(member => {
    const traffic = getMemberTrafficStatus(member);
    if (traffic.status === 'green') greenCount++;
    if (traffic.status === 'yellow') yellowCount++;
    if (traffic.status === 'red') redCount++;
    return { ...member, traffic };
  });

  const countActivos = document.getElementById('countActivos');
  if (countActivos) countActivos.textContent = greenCount;
  const countPorVencer = document.getElementById('countPorVencer');
  if (countPorVencer) countPorVencer.textContent = yellowCount;
  const countVencidos = document.getElementById('countVencidos');
  if (countVencidos) countVencidos.textContent = redCount;
  const countAll = document.getElementById('countAll');
  if (countAll) countAll.textContent = appState.members.length;

  const filtered = evaluatedMembers.filter(m => {
    if (filter !== 'all' && m.traffic.status !== filter) return false;
    if (query) {
      const matchName = m.name.toLowerCase().includes(query);
      const matchPhone = m.phone.includes(query);
      return matchName || matchPhone;
    }
    return true;
  });

  const resultsBadge = document.getElementById('resultsCountBadge');
  if (resultsBadge) {
    if (query || filter !== 'all') {
      resultsBadge.textContent = `Mostrando ${filtered.length} de ${appState.members.length} socios`;
    } else {
      resultsBadge.textContent = `Mostrando ${appState.members.length} socios`;
    }
  }

  tbody.innerHTML = '';
  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    return;
  } else {
    emptyState.style.display = 'none';
  }

  const isAdmin = appState.role === 'admin';

  filtered.forEach(member => {
    const tr = document.createElement('tr');
    const statusClass = member.traffic.status;
    if (statusClass === 'red') {
      tr.classList.add('row-blocked');
    }

    const statusBadge = `<span class="traffic-badge ${statusClass}"><span class="badge-dot"></span><span>${member.traffic.label}</span></span>`;
    
    // Minuta Item 8: Botón de acción en vencidos/bloqueados renombrado a 'Renovar y cobrar'
    const cobrarBtnHtml = statusClass === 'red'
      ? `<button class="btn-cobrar-table btn-urgent-cobrar" onclick="window.openPaymentModal('${member.id}')" title="Renovar membresía y cobrar"><span>⚡ Renovar y cobrar</span></button>`
      : `<button class="btn-cobrar-table" onclick="window.openPaymentModal('${member.id}')" title="Cobrar o renovar membresía"><span>💳 Renovar</span></button>`;

    const deleteButtonHtml = isAdmin 
      ? `<button class="btn-action-icon danger" onclick="window.handleDeleteMember('${member.id}')" title="Eliminar socio (Permiso de Dueño)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`
      : `<button class="btn-action-icon" disabled title="Solo el Administrador/Dueño puede borrar registros" style="opacity: 0.25; cursor: not-allowed;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></button>`;

    const phoneDisplay = (member.phone && !member.phone.startsWith('ST-')) ? escapeHtml(member.phone) : 'Sin teléfono';

    tr.innerHTML = `
      <td>${statusBadge}</td>
      <td><span class="member-cell-name">${escapeHtml(member.name)}</span><span class="member-cell-id">ID: ${member.id}</span></td>
      <td><strong>📞 ${phoneDisplay}</strong></td>
      <td><span class="pass-pill">${PASS_NAMES[member.passType] || member.passType}</span></td>
      <td><span>${formatDisplayDate(member.endDate)}</span></td>
      <td><span class="days-left-tag ${statusClass}">${member.traffic.daysText}</span></td>
      <td>
        <div class="table-actions">
          ${cobrarBtnHtml}
          ${deleteButtonHtml}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

export function applyRolePermissions() {
  const isAdmin = appState.role === 'admin';
  const roleBanner = document.getElementById('roleBanner');
  const roleBadge = document.getElementById('roleBadge');
  const roleDesc = document.getElementById('roleDesc');
  const tabAdminBtn = document.getElementById('tabAdminBtn');

  if (isAdmin) {
    roleBanner.classList.add('admin-mode');
    roleBadge.textContent = '🔑 Modo Administrador / Dueño';
    roleDesc.textContent = 'Acceso total habilitado: Puede modificar precios de membresías, ver reportes y gestionar datos.';
    if (tabAdminBtn) tabAdminBtn.style.display = 'inline-flex';
  } else {
    roleBanner.classList.remove('admin-mode');
    roleBadge.textContent = '👤 Modo Recepcionista';
    roleDesc.textContent = 'Permisos de guardia: Registrar socios, Cobrar y Consultar Semáforo. (Precios y borrado protegidos por el Dueño).';
    if (tabAdminBtn) tabAdminBtn.style.display = 'none';

    const activeTab = document.querySelector('.nav-btn.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'admin') {
      window.switchTab('dashboard');
    }
  }
}

export function updateTodayStats(getTodayString) {
  const today = getTodayString();
  const todayTx = appState.transactions.filter(t => t.date === today);
  const total = todayTx.reduce((sum, t) => sum + t.amount, 0);
  const todayIncomeEl = document.getElementById('todayTotalIncome');
  if (todayIncomeEl) {
    todayIncomeEl.textContent = formatCurrency(total);
  }
}
