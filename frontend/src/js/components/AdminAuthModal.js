export function renderAdminAuthModal() {
  return `
    <div class="modal-overlay" id="adminAuthModal">

      <div style="
        background: #ffffff;
        border-radius: 18px;
        box-shadow: 0 32px 64px rgba(0,0,0,0.28), 0 0 0 1px rgba(15,23,42,0.07);
        width: 100%;
        max-width: 440px;
        overflow: hidden;
        animation: adminModalIn 0.28s cubic-bezier(0.34,1.56,0.64,1);
        font-family: 'Outfit', 'Inter', sans-serif;
      ">

        <!-- Barra acento superior -->
        <div style="height:5px; background:linear-gradient(90deg,#2563eb,#7c3aed); width:100%;"></div>

        <!-- Contenido principal -->
        <div style="padding: 1.6rem 1.75rem 1.75rem;">

          <!-- Fila: ícono + cerrar -->
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.1rem;">
            <div style="
              width:50px; height:50px; border-radius:14px;
              background:linear-gradient(135deg,#eff6ff,#dbeafe);
              display:flex; align-items:center; justify-content:center;
              color:#2563eb;
              box-shadow:0 2px 10px rgba(37,99,235,0.15);
            ">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>

            <button id="btnCloseAdminAuth" type="button" title="Cancelar" style="
              width:34px; height:34px; border-radius:8px;
              background:#f1f5f9; border:none; cursor:pointer;
              display:flex; align-items:center; justify-content:center;
              color:#64748b; transition:background 0.15s, color 0.15s;
            " onmouseenter="this.style.background='#fee2e2';this.style.color='#dc2626'"
               onmouseleave="this.style.background='#f1f5f9';this.style.color='#64748b'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Título y subtítulo -->
          <h3 style="font-size:1.25rem; font-weight:800; color:#0f172a; margin:0 0 0.35rem; letter-spacing:-0.02em;">
            Autenticación de Administrador
          </h3>
          <p style="font-size:0.875rem; color:#64748b; line-height:1.6; margin:0 0 1.4rem;">
            Ingresa el <strong style="color:#1e293b;">correo y contraseña</strong> del Administrador
            para activar los permisos avanzados sin cerrar sesión.
          </p>

          <!-- Alerta de error -->
          <div id="adminAuthAlert" role="alert" style="
            display:none; margin-bottom:1rem;
            background:#fef2f2; border:1.5px solid #fecaca; border-radius:10px;
            padding:0.7rem 1rem; gap:0.5rem;
            align-items:center; color:#dc2626; font-size:0.875rem; font-weight:600;
          ">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span id="adminAuthAlertMessage">Credenciales incorrectas</span>
          </div>

          <!-- Formulario -->
          <form id="adminAuthForm" novalidate>

            <!-- Campo correo -->
            <div style="margin-bottom:1rem;">
              <label for="adminAuthEmailInput" style="
                display:block; font-size:0.78rem; font-weight:700;
                color:#475569; margin-bottom:0.45rem; letter-spacing:0.05em; text-transform:uppercase;
              ">Correo del Administrador</label>

              <div style="position:relative; display:flex; align-items:center;">
                <svg style="position:absolute; left:14px; color:#94a3b8; pointer-events:none; flex-shrink:0;"
                  width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M22 7l-10 7L2 7"></path>
                </svg>
                <input
                  type="email"
                  id="adminAuthEmailInput"
                  class="auth-input"
                  placeholder="correo@administrador.com"
                  autocomplete="username"
                  required
                  style="padding-left:44px;"
                />
              </div>
            </div>

            <!-- Campo contraseña -->
            <div style="margin-bottom:1.25rem;">
              <label for="adminAuthPasswordInput" style="
                display:block; font-size:0.78rem; font-weight:700;
                color:#475569; margin-bottom:0.45rem; letter-spacing:0.05em; text-transform:uppercase;
              ">Contraseña de Administrador</label>

              <div style="position:relative; display:flex; align-items:center;">
                <svg style="position:absolute; left:14px; color:#94a3b8; pointer-events:none; flex-shrink:0;"
                  width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>

                <input
                  type="password"
                  id="adminAuthPasswordInput"
                  class="auth-input"
                  placeholder="Contraseña del administrador"
                  autocomplete="current-password"
                  required
                  style="padding-left:44px; padding-right:44px;"
                />

                <button type="button" id="btnToggleAdminAuthPassword" tabindex="-1"
                  title="Mostrar u ocultar" style="
                  position:absolute; right:12px;
                  background:none; border:none; cursor:pointer; color:#94a3b8;
                  display:flex; align-items:center; padding:4px;
                ">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Separador -->
            <div style="height:1px; background:#f1f5f9; margin:0 0 1.25rem;"></div>

            <!-- Botones de acción -->
            <div style="display:flex; gap:0.75rem; align-items:center; justify-content:flex-end;">

              <button type="button" id="btnCancelAdminAuth" style="
                height:42px; padding:0 1.25rem;
                background:#f8fafc; border:1.5px solid #e2e8f0;
                border-radius:10px; font-size:0.875rem; font-weight:600;
                color:#475569; cursor:pointer; font-family:inherit;
                transition:background 0.15s, border-color 0.15s;
              " onmouseenter="this.style.background='#f1f5f9';this.style.borderColor='#cbd5e1'"
                 onmouseleave="this.style.background='#f8fafc';this.style.borderColor='#e2e8f0'">
                Cancelar
              </button>

              <button type="submit" id="btnConfirmAdminAuth" style="
                height:42px; padding:0 1.35rem;
                background:linear-gradient(135deg,#2563eb,#1d4ed8);
                border:none; border-radius:10px;
                font-size:0.875rem; font-weight:700;
                color:#ffffff; cursor:pointer; font-family:inherit;
                display:flex; align-items:center; gap:0.45rem;
                box-shadow:0 4px 14px rgba(37,99,235,0.35);
                transition:transform 0.15s, box-shadow 0.15s;
              " onmouseenter="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 20px rgba(37,99,235,0.45)'"
                 onmouseleave="this.style.transform='none';this.style.boxShadow='0 4px 14px rgba(37,99,235,0.35)'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Confirmar y Cambiar
              </button>

            </div>
          </form>
        </div>
      </div>

    </div>
  `;
}
