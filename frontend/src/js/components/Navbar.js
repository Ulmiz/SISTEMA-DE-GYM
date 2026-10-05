export function renderNavbar() {
  return `
    <div class="nav-brand">
      <div class="brand-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4M6 12h12"/>
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-title">POWER<span class="highlight">GYM</span></span>
        <span class="brand-tag">Punto de Recepción</span>
      </div>
    </div>

    <!-- Navegación de Pestañas Principales (Botones Grandes) -->
    <nav class="nav-tabs" id="mainNav">
      <button class="nav-btn active" data-tab="dashboard">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
        </svg>
        <span>Recepción & Semáforo</span>
      </button>
      <button class="nav-btn" data-tab="socios">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span>Registrar Socio</span>
      </button>
      <button class="nav-btn" data-tab="corte">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="12" y1="15" x2="12" y2="15"/>
        </svg>
        <span>Corte de Caja</span>
      </button>
      <button class="nav-btn admin-only-tab" data-tab="admin" id="tabAdminBtn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span>Precios & Admin</span>
      </button>
    </nav>

    <!-- Selector de Rol (Módulo 5) -->
    <div class="user-role-control">
      <div class="role-selector-box">
        <label for="roleSelect" class="role-label">Operando como:</label>
        <div class="role-badge-wrapper">
          <select id="roleSelect" class="role-select">
            <option value="recepcionista">👤 Recepcionista</option>
            <option value="admin">🔑 Administrador / Dueño</option>
          </select>
        </div>
      </div>
      <div class="current-time" id="currentTimeDisplay">--:--</div>
    </div>
  `;
}

export function renderRoleBanner() {
  return `
    <div class="role-banner-content">
      <span class="role-badge" id="roleBadge">Modo Recepcionista</span>
      <span class="role-desc" id="roleDesc">Permisos: Registrar socios, Cobrar y Consultar Semáforo. Protegido: Cambio de precios y eliminación restringida a Dueño.</span>
    </div>
  `;
}
