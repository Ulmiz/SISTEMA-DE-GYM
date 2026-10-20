export function renderSociosView() {
  return `
    <section class="tab-view" id="view-socios">
      <div class="form-container-card">
        <div class="form-header">
          <div class="form-header-text">
            <h2>Dar de Alta a un Socio</h2>
            <p>Registra rápidamente al cliente. El sistema calcula la fecha de vencimiento automáticamente.</p>
          </div>
          <span class="required-note">* Nombre y tipo de pase obligatorios (Teléfono opcional)</span>
        </div>

        <form id="memberRegisterForm" novalidate>
          <div class="form-grid">
            <!-- Nombre -->
            <div class="form-field full-width">
              <label for="memberName" class="field-label">Nombre Completo del Socio <span class="req">*</span></label>
              <input 
                type="text" 
                id="memberName" 
                class="touch-input" 
                placeholder="Ej. Juan Pérez González"
                required
              >
              <span class="field-error" id="nameError">El nombre es obligatorio para guardar al socio.</span>
            </div>

            <!-- Teléfono (Opcional según Minuta) -->
            <div class="form-field">
              <label for="memberPhone" class="field-label">Número de Teléfono <span style="font-size:0.8rem; font-weight:normal; color:#64748b;">(Opcional)</span></label>
              <input 
                type="tel" 
                id="memberPhone" 
                class="touch-input" 
                placeholder="Ej. 5512345678"
              >
              <span class="field-error" id="phoneError"></span>
            </div>

            <!-- Tipo de Pase -->
            <div class="form-field">
              <label for="memberPassType" class="field-label">Tipo de Pase <span class="req">*</span></label>
              <select id="memberPassType" class="touch-input touch-select">
                <option value="visita">Visita (1 Día)</option>
                <option value="semanal">Semanal (7 Días)</option>
                <option value="mensual" selected>Mensual (30 Días)</option>
                <option value="anual">Anual (365 Días)</option>
              </select>
            </div>

            <!-- La fecha de inicio la genera el backend (now): el campo manual se eliminó -->
            <div class="form-field">
              <label class="field-label">Fecha de Inicio <span class="auto-badge">Automática</span></label>
              <div class="auto-calc-display">
                <span class="calc-date" id="calcStartDateText">HOY</span>
                <span class="calc-duration">Alta registrada por el sistema</span>
              </div>
            </div>

            <!-- Fecha de Vencimiento Calculada Automáticamente -->
            <div class="form-field">
              <label class="field-label">Fecha de Vencimiento <span class="auto-badge">Cálculo Automático</span></label>
              <div class="auto-calc-display" id="calculatedEndDateDisplay">
                <span class="calc-date" id="calcEndDateText">--/--/----</span>
                <span class="calc-duration" id="calcDurationText">30 días de vigencia</span>
              </div>
            </div>

            <!-- Precio a Cobrar Sugerido -->
            <div class="form-field">
              <label class="field-label">Costo del Pase</label>
              <div class="auto-calc-display price-display" id="calcPassPriceDisplay">
                <span class="calc-price" id="calcPriceText">$0.00</span>
                <span class="calc-duration">Según tarifa configurada</span>
              </div>
            </div>

            <!-- Cobro OBLIGATORIO (Minuta Item 7) -->
            <div class="form-field full-width payment-now-box">
              <!-- Input oculto para que el código JS que lee checkPayNow siga funcionando -->
              <input type="checkbox" id="checkPayNow" checked style="display:none;" disabled>

              <div style="
                display:flex; align-items:center; gap:0.6rem;
                background:#f0fdf4; border:1.5px solid #86efac;
                border-radius:10px; padding:0.75rem 1rem; margin-bottom:0.85rem;
              ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" style="flex-shrink:0;">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span style="font-size:0.875rem; color:#15803d; font-weight:600;">
                  El cobro es <strong>obligatorio</strong> al registrar un socio.
                  <span style="font-weight:400; color:#166534;"> Selecciona el método de pago para continuar.</span>
                </span>
              </div>

              <!-- Opciones de pago inmediato -->
              <div class="immediate-pay-options" id="immediatePayOptions">
                <div class="payment-method-selector">
                  <span class="field-label">Método de Pago:</span>
                  <div class="method-pills">
                    <label class="method-pill-label">
                      <input type="radio" name="immediatePaymentMethod" value="efectivo" checked>
                      <span class="pill-content">💵 Efectivo</span>
                    </label>
                    <label class="method-pill-label">
                      <input type="radio" name="immediatePaymentMethod" value="transferencia">
                      <span class="pill-content">💳 Transferencia</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Botones de Acción Grandes -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary btn-large" id="btnCancelRegister">Cancelar</button>
            <button type="submit" class="btn btn-primary btn-large" id="btnSubmitRegister">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>Guardar Socio y Registrar</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  `;
}
