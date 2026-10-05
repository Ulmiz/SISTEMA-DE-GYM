export function renderCorteViewTemplate() {
  return `
    <section class="tab-view" id="view-corte">
      <div class="corte-container">
        <!-- Encabezado de Corte -->
        <div class="corte-header">
          <div>
            <h2>Corte de Caja Diario</h2>
            <p>Resumen de cobros del día actual, desglose por tipo de membresía y método de pago.</p>
          </div>
          <div class="corte-controls">
            <label for="corteDateFilter" class="field-label" style="margin-bottom: 0;">Fecha de Consulta:</label>
            <input type="date" id="corteDateFilter" class="touch-input corte-date-input">
            <button class="btn btn-outline" id="btnPrintCorte" title="Imprimir corte de caja">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              <span>Imprimir Corte</span>
            </button>
          </div>
        </div>

        <!-- Total Principal Destacado -->
        <div class="corte-total-hero">
          <div class="hero-label">TOTAL COBRADO EN EL DÍA</div>
          <div class="hero-amount" id="corteTotalAmount">$0.00</div>
          <div class="hero-meta" id="corteTotalTransactions">0 transacciones registradas</div>
        </div>

        <!-- Desgloses Clave (Requerimiento: Visitas, Mensualidades y Método de Pago) -->
        <div class="corte-breakdowns-grid">
          <!-- Desglose por Método de Pago -->
          <div class="corte-card">
            <div class="corte-card-header">
              <h4>💵 Por Método de Pago</h4>
            </div>
            <div class="corte-card-body">
              <div class="breakdown-row">
                <div class="row-left">
                  <span class="indicator-dot dot-cash"></span>
                  <span class="row-name">Efectivo</span>
                </div>
                <div class="row-right">
                  <span class="row-count" id="corteCashCount">0 pagos</span>
                  <span class="row-val" id="corteCashTotal">$0.00</span>
                </div>
              </div>
              <div class="breakdown-row">
                <div class="row-left">
                  <span class="indicator-dot dot-transfer"></span>
                  <span class="row-name">Transferencia</span>
                </div>
                <div class="row-right">
                  <span class="row-count" id="corteTransferCount">0 pagos</span>
                  <span class="row-val" id="corteTransferTotal">$0.00</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Desglose por Tipo de Pase -->
          <div class="corte-card">
            <div class="corte-card-header">
              <h4>🎫 Por Tipo de Pase</h4>
            </div>
            <div class="corte-card-body">
              <div class="breakdown-row">
                <div class="row-left">
                  <span class="row-name">Visitas (Día)</span>
                </div>
                <div class="row-right">
                  <span class="row-count" id="cortePassVisitaCount">0</span>
                  <span class="row-val" id="cortePassVisitaTotal">$0.00</span>
                </div>
              </div>
              <div class="breakdown-row">
                <div class="row-left">
                  <span class="row-name">Semanales</span>
                </div>
                <div class="row-right">
                  <span class="row-count" id="cortePassSemanalCount">0</span>
                  <span class="row-val" id="cortePassSemanalTotal">$0.00</span>
                </div>
              </div>
              <div class="breakdown-row">
                <div class="row-left">
                  <span class="row-name">Mensualidades</span>
                </div>
                <div class="row-right">
                  <span class="row-count" id="cortePassMensualCount">0</span>
                  <span class="row-val" id="cortePassMensualTotal">$0.00</span>
                </div>
              </div>
              <div class="breakdown-row">
                <div class="row-left">
                  <span class="row-name">Anuales</span>
                </div>
                <div class="row-right">
                  <span class="row-count" id="cortePassAnualCount">0</span>
                  <span class="row-val" id="cortePassAnualTotal">$0.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bitácora de Pagos del Día -->
        <div class="table-container corte-history-container">
          <div class="table-header-info">
            <h3>Detalle de Cobros Registrados</h3>
            <span class="corte-date-badge" id="corteTableDateBadge">Hoy</span>
          </div>
          <div class="table-responsive">
            <table class="traffic-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Ticket #</th>
                  <th>Socio / Cliente</th>
                  <th>Concepto / Pase</th>
                  <th>Método</th>
                  <th>Monto</th>
                  <th>Vencimiento Otorgado</th>
                  <th style="text-align: center;">Acción</th>
                </tr>
              </thead>
              <tbody id="corteTableBody">
                <!-- Se inyecta con JS -->
              </tbody>
            </table>
          </div>
          <div class="empty-state" id="emptyCorteState" style="display: none;">
            <div class="empty-icon">🧾</div>
            <h4>Sin cobros registrados para esta fecha</h4>
            <p>Los cobros generados aparecerán automáticamente en esta bitácora.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}
