export function renderDashboardView() {
  return `
    <section class="tab-view active" id="view-dashboard">
      <!-- Tarjetas de Resumen Rápido -->
      <div class="quick-stats-grid">
        <div class="stat-card stat-green" id="filterCardActivos" title="Socios con pase vigente">
          <div class="stat-icon">🟢</div>
          <div class="stat-info">
            <span class="stat-number" id="countActivos">0</span>
            <span class="stat-name">Socios Activos</span>
          </div>
          <span class="stat-status-hint">Acceso Permitido</span>
        </div>

        <div class="stat-card stat-yellow" id="filterCardPorVencer" title="Socios por vencer en 2 días">
          <div class="stat-icon">🟡</div>
          <div class="stat-info">
            <span class="stat-number" id="countPorVencer">0</span>
            <span class="stat-name">Por Vencer (≤2 días)</span>
          </div>
          <span class="stat-status-hint">Avisar en Puerta</span>
        </div>

        <div class="stat-card stat-red" id="filterCardVencidos" title="Socios con pase vencido">
          <div class="stat-icon">🔴</div>
          <div class="stat-info">
            <span class="stat-number" id="countVencidos">0</span>
            <span class="stat-name">Bloqueados (Vencidos)</span>
          </div>
          <span class="stat-status-hint">Acceso Denegado</span>
        </div>

        <div class="stat-card stat-blue" id="goToCajaCard" title="Ir a corte de caja de hoy">
          <div class="stat-icon">💵</div>
          <div class="stat-info">
            <span class="stat-number" id="todayTotalIncome">$0.00</span>
            <span class="stat-name">Caja Cobrada Hoy</span>
          </div>
          <span class="stat-status-hint">Ver Detalle ➜</span>
        </div>
      </div>

      <!-- Barra de Acción Rápida para Horas Pico (Buscador en Tiempo Real en 1 Clic) -->
      <div class="reception-action-bar">
        <div class="search-input-group">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            id="searchInput" 
            class="touch-input search-input" 
            placeholder="Buscar por nombre o teléfono (ej. Carlos, 5543...)"
            autocomplete="off"
            autofocus
          >
          <kbd class="search-shortcut-key" title="Presiona '/' en tu teclado para buscar inmediatamente">/</kbd>
          <button class="clear-search-btn" id="clearSearchBtn" title="Limpiar búsqueda">&times;</button>
        </div>

        <button class="btn btn-primary btn-large" id="btnQuickRegister">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Nuevo Socio</span>
        </button>
      </div>

      <!-- Semáforo / Lista Rápida de Socios -->
      <div class="table-container">
        <div class="table-header-info">
          <div class="table-header-left">
            <h3>Lista Rápida de Clientes & Estado de Acceso</h3>
            <span class="results-counter-pill" id="resultsCountBadge">Mostrando socios</span>
          </div>
          <span class="condition-badge" title="Requisito cumplido: Checar el estado toma máximo 2 clics">⚡ Validación en Tiempo Real</span>
        </div>

        <div class="table-responsive">
          <table class="traffic-table" id="membersTable">
            <thead>
              <tr>
                <th style="width: 150px;">Semáforo</th>
                <th>Socio / Cliente</th>
                <th>Teléfono</th>
                <th>Tipo de Pase</th>
                <th>Vigencia / Vencimiento</th>
                <th>Días Restantes</th>
                <th style="width: 220px; text-align: center;">Acciones Directas</th>
              </tr>
            </thead>
            <tbody id="membersTableBody">
              <!-- Renderizado dinámico desde ui.js -->
            </tbody>
          </table>
        </div>

        <!-- Estado vacío cuando no hay resultados -->
        <div class="empty-state" id="emptyState" style="display: none;">
          <div class="empty-icon">🔍</div>
          <h4>No se encontraron socios</h4>
          <p id="emptyStateMsg">No hay socios que coincidan con el término de búsqueda.</p>
          <button class="btn btn-outline" id="btnResetFilters">Limpiar Búsqueda</button>
        </div>
      </div>
    </section>
  `;
}
