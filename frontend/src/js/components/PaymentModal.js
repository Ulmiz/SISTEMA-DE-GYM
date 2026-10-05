export function renderPaymentModal() {
  return `
    <div class="modal-overlay" id="paymentModal">
      <div class="modal-box payment-modal-box">
        <div class="modal-header">
          <div class="modal-header-icon">💳</div>
          <div>
            <h3 id="paymentModalTitle">Registrar Cobro al Socio</h3>
            <p id="paymentModalSubtitle">Selecciona el pase y el método de pago</p>
          </div>
          <button class="modal-close-btn" id="closePaymentModal">&times;</button>
        </div>

        <form id="paymentForm">
          <input type="hidden" id="payMemberId">

          <div class="payment-member-card">
            <div class="pm-info">
              <span class="pm-label">Cliente / Socio:</span>
              <span class="pm-name" id="payMemberNameDisplay">--</span>
            </div>
            <div class="pm-info">
              <span class="pm-label">Teléfono:</span>
              <span class="pm-val" id="payMemberPhoneDisplay">--</span>
            </div>
            <div class="pm-info">
              <span class="pm-label">Estado Actual:</span>
              <span class="pm-badge" id="payMemberStatusBadge">--</span>
            </div>
          </div>

          <div class="form-grid">
            <!-- Tipo de Pase a Cobrar -->
            <div class="form-field full-width">
              <label for="payPassType" class="field-label">Pase / Membresía a Contratar</label>
              <select id="payPassType" class="touch-input touch-select">
                <option value="visita">Visita (1 Día)</option>
                <option value="semanal">Semanal (7 Días)</option>
                <option value="mensual" selected>Mensual (30 Días)</option>
                <option value="anual">Anual (365 Días)</option>
              </select>
            </div>

            <!-- Nueva fecha de vencimiento proyectada -->
            <div class="form-field">
              <label class="field-label">Nueva Fecha de Vencimiento:</label>
              <div class="auto-calc-display">
                <strong id="payNewDueDateText" class="calc-date">--/--/----</strong>
              </div>
            </div>

            <!-- Monto a Cobrar -->
            <div class="form-field">
              <label class="field-label">Monto a Cobrar:</label>
              <div class="auto-calc-display price-display">
                <strong id="payAmountText" class="calc-price">$0.00</strong>
              </div>
            </div>

            <!-- Método de Pago (Efectivo o Transferencia) -->
            <div class="form-field full-width">
              <label class="field-label">Método de Pago <span class="req">*</span></label>
              <div class="payment-method-selector large-selector">
                <label class="method-pill-label">
                  <input type="radio" name="payMethod" value="efectivo" checked>
                  <div class="pill-content-card">
                    <span class="pill-emoji">💵</span>
                    <span class="pill-title">Efectivo</span>
                    <span class="pill-desc">Cobro en caja física</span>
                  </div>
                </label>

                <label class="method-pill-label">
                  <input type="radio" name="payMethod" value="transferencia">
                  <div class="pill-content-card">
                    <span class="pill-emoji">💳</span>
                    <span class="pill-title">Transferencia</span>
                    <span class="pill-desc">SPEI / Depósito / Tarjeta</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary btn-large" id="btnCancelPayment">Cancelar</button>
            <button type="submit" class="btn btn-primary btn-large" id="btnConfirmPayment">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Confirmar Pago y Generar Ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}
