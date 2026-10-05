export function renderTicketModal() {
  return `
    <div class="modal-overlay" id="ticketModal">
      <div class="modal-box ticket-modal-box">
        <div class="ticket-header-actions no-print">
          <span class="ticket-action-title">🧾 Comprobante de Pago Generado</span>
          <button class="modal-close-btn" id="closeTicketModal">&times;</button>
        </div>

        <!-- Formato Ticket Térmico / Imprimible -->
        <div class="thermal-receipt" id="thermalReceipt">
          <div class="receipt-header">
            <h2 class="receipt-gym-name">POWER GYM</h2>
            <p class="receipt-subtitle">Recepción & Control de Acceso</p>
            <p class="receipt-info-line">RFC: GYM980123-ABC</p>
            <p class="receipt-info-line">Tel: (55) 5432-1098</p>
            <div class="receipt-divider">================================</div>
            <div class="receipt-row-meta">
              <span>TICKET: <strong id="tktNumber">#0001</strong></span>
              <span id="tktDate">01/01/2026 12:00</span>
            </div>
            <div class="receipt-row-meta">
              <span>ATENDIÓ: <strong id="tktCashier">Recepcionista</strong></span>
            </div>
            <div class="receipt-divider">================================</div>
          </div>

          <div class="receipt-body">
            <div class="receipt-field">
              <span class="lbl">SOCIO:</span>
              <span class="val bold-val" id="tktMemberName">Juan Pérez</span>
            </div>
            <div class="receipt-field">
              <span class="lbl">TELÉFONO:</span>
              <span class="val" id="tktMemberPhone">5512345678</span>
            </div>
            <div class="receipt-field">
              <span class="lbl">CONCEPTO:</span>
              <span class="val" id="tktPassName">Pase Mensual (30 Días)</span>
            </div>
            <div class="receipt-field">
              <span class="lbl">FORMA DE PAGO:</span>
              <span class="val" id="tktPaymentMethod">Efectivo</span>
            </div>

            <div class="receipt-divider">--------------------------------</div>

            <div class="receipt-field receipt-total-row">
              <span class="lbl">TOTAL PAGADO:</span>
              <span class="val-total" id="tktAmount">$500.00 MXN</span>
            </div>

            <div class="receipt-divider">================================</div>

            <!-- DATO CLAVE SEGÚN REQUERIMIENTO: FECHA DE VENCIMIENTO -->
            <div class="receipt-expiration-box">
              <div class="exp-title">VÁLIDO HASTA:</div>
              <div class="exp-date" id="tktExpirationDate">30/NOV/2026</div>
              <div class="exp-sub">Favor de presentar este ticket o dar su nombre en el torniquete/recepción.</div>
            </div>

            <div class="receipt-divider">================================</div>
          </div>

          <div class="receipt-footer">
            <p>¡Gracias por entrenar con nosotros!</p>
            <p>Conserve su comprobante</p>
          </div>
        </div>

        <!-- Botones de Acción para el Ticket -->
        <div class="ticket-buttons-bar no-print">
          <button class="btn btn-secondary btn-large" id="btnCloseTicket">Cerrar</button>
          <button class="btn btn-primary btn-large" id="btnPrintReceipt">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            <span>Imprimir Ticket</span>
          </button>
        </div>
      </div>
    </div>
  `;
}
