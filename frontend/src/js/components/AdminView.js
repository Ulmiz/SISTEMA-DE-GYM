export function renderAdminView() {
  return `
    <section class="tab-view" id="view-admin">
      <div class="admin-panel-container">
        <!-- Tarjeta de Control de Precios (Solo Admin) -->
        <div class="admin-card">
          <div class="admin-card-header">
            <div class="header-with-badge">
              <h2>Configuración de Precios de Pases</h2>
              <span class="admin-lock-badge">🔒 Solo Administrador / Dueño</span>
            </div>
            <p>Modifica el costo oficial de las membresías. Los cambios se aplican automáticamente en los nuevos cobros.</p>
          </div>

          <form id="pricesForm" class="prices-grid">
            <div class="price-input-box">
              <label for="priceVisita">Pase de Visita (1 Día)</label>
              <div class="price-input-wrapper">
                <span class="currency-symbol">$</span>
                <input type="number" id="priceVisita" min="0" step="5" class="touch-input price-input">
              </div>
              <span class="price-hint">Acceso de un solo día</span>
            </div>

            <div class="price-input-box">
              <label for="priceSemanal">Pase Semanal (7 Días)</label>
              <div class="price-input-wrapper">
                <span class="currency-symbol">$</span>
                <input type="number" id="priceSemanal" min="0" step="5" class="touch-input price-input">
              </div>
              <span class="price-hint">Vigencia de 1 semana</span>
            </div>

            <div class="price-input-box">
              <label for="priceMensual">Pase Mensual (30 Días)</label>
              <div class="price-input-wrapper">
                <span class="currency-symbol">$</span>
                <input type="number" id="priceMensual" min="0" step="10" class="touch-input price-input">
              </div>
              <span class="price-hint">Membresía estándar</span>
            </div>

            <div class="price-input-box">
              <label for="priceAnual">Pase Anual (365 Días)</label>
              <div class="price-input-wrapper">
                <span class="currency-symbol">$</span>
                <input type="number" id="priceAnual" min="0" step="50" class="touch-input price-input">
              </div>
              <span class="price-hint">Membresía completa año</span>
            </div>

            <div class="price-actions full-width">
              <button type="submit" class="btn btn-primary btn-large" id="btnSavePrices">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                </svg>
                <span>Guardar Nuevos Precios</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Reporte Global de Socios & Opciones de Datos (Solo Admin) -->
        <div class="admin-card">
          <div class="admin-card-header">
            <div class="header-with-badge">
              <h2>Métricas Globales del Negocio</h2>
              <span class="admin-lock-badge">🔒 Solo Administrador / Dueño</span>
            </div>
            <p>Resumen consolidado para la toma de decisiones del dueño del gimnasio.</p>
          </div>

          <div class="admin-metrics-grid">
            <div class="metric-pill">
              <span class="metric-title">Total de Socios Registrados</span>
              <span class="metric-val" id="metricTotalMembers">0</span>
            </div>
            <div class="metric-pill">
              <span class="metric-title">Ingresos Históricos Acumulados</span>
              <span class="metric-val" id="metricTotalRevenue">$0.00</span>
            </div>
            <div class="metric-pill">
              <span class="metric-title">Tasa de Socios Activos</span>
              <span class="metric-val" id="metricActiveRatio">0%</span>
            </div>
          </div>

          <!-- Zona de Riesgo / Gestión de Datos -->
          <div class="admin-danger-zone">
            <h4>Zona de Mantenimiento de Datos (Exclusivo Administrador)</h4>
            <p>Estas opciones solo están disponibles con el rol de Administrador/Dueño según el requerimiento.</p>
            <div class="danger-actions">
              <button class="btn btn-outline" id="btnLoadSampleData">Restaurar Datos de Demostración</button>
              <button class="btn btn-danger" id="btnClearAllData">Reiniciar Base de Datos</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
