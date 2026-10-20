export function renderLoginView() {
  return `
    <div class="auth-layout" id="loginWrapper">
      <div class="auth-container">
        
        <!-- PANEL IZQUIERDO: Tarjeta informativa fija (Figma) -->
        <aside class="auth-sidebar-card">
          <div class="sidebar-top">
            <!-- Logo POWERGYM -->
            <div class="sidebar-brand">
              <div class="brand-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
              <span class="brand-title-styled">POWER<span class="brand-accent">GYM</span></span>
            </div>

            <!-- Ilustración central: imagen Deadlift -->
            <div class="hero-avatar-circle">
              <img src="/src/img/Deadlift.png" alt="PowerGym atleta" width="72" height="72" style="display:block; object-fit:contain;">
            </div>

            <div class="sidebar-headings">
              <h2 class="sidebar-title">Sistema de Recepción</h2>
              <p class="sidebar-subtitle">Gestión de socios, accesos y pagos en un solo lugar</p>
            </div>

            <!-- 3 Tarjetas de Características -->
            <div class="sidebar-features">
              <div class="feature-item">
                <div class="feature-icon-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
                <div class="feature-text">
                  <span class="feature-name">Registro de socios</span>
                  <span class="feature-desc">Alta, renovación y consulta</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <polyline points="9 12 11 14 15 10"></polyline>
                  </svg>
                </div>
                <div class="feature-text">
                  <span class="feature-name">Control de acceso</span>
                  <span class="feature-desc">Permisos y bloqueos</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
                <div class="feature-text">
                  <span class="feature-name">Caja y cobros</span>
                  <span class="feature-desc">Pagos y vencimientos</span>
                </div>
              </div>
            </div>
          </div>

          <div class="sidebar-footer">
            <span class="footer-copy">© 2026 POWERGYM</span>
            <span class="footer-badge"><span class="blue-dot"></span> PUNTO DE RECEPCIÓN</span>
          </div>
        </aside>

        <!-- PANEL DERECHO: Vistas dinámicas (Login, Recuperar, Reset, Éxito) -->
        <main class="auth-main-panel">
          
          <!-- ==========================================
               PASO 1: Formulario de Inicio de Sesión
               ========================================== -->
          <div class="auth-view-step active" id="authStepLogin">
            <div class="auth-content-box">
              <div class="auth-header">
                <h1 class="auth-title">¡Bienvenido de vuelta!</h1>
                <p class="auth-subtitle">Inicia sesión para acceder al sistema de POWERGYM.</p>
              </div>

              <div class="auth-error-alert" id="loginAlert" style="display: none;" role="alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span id="loginAlertMessage">Credenciales inválidas</span>
              </div>

              <form id="loginForm" class="auth-form" novalidate>
                <!-- Campo Correo o Teléfono con Estados Visuales -->
                <div class="auth-field-group" id="groupLoginIdentifier">
                  <label for="loginUsername" class="auth-label">Correo electrónico o teléfono</label>
                  <div class="auth-input-wrapper">
                    <svg class="auth-input-icon-left" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="M22 7l-10 7L2 7"></path>
                    </svg>
                    <input
                      type="text"
                      id="loginUsername"
                      name="username"
                      class="auth-input"
                      placeholder="nombre@powergym.com"
                      autocomplete="username"
                      required
                    />
                    <div class="auth-input-status-icon" id="loginUsernameStatus"></div>
                  </div>
                  <div class="auth-helper-msg" id="loginUsernameHelper">Ingresa tu correo electrónico o número de teléfono.</div>
                </div>

                <!-- Campo Contraseña -->
                <div class="auth-field-group">
                  <label for="loginPassword" class="auth-label">Contraseña</label>
                  <div class="auth-input-wrapper">
                    <svg class="auth-input-icon-left" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <input
                      type="password"
                      id="loginPassword"
                      name="password"
                      class="auth-input"
                      placeholder="Introduce tu contraseña"
                      autocomplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      id="btnTogglePassword"
                      class="auth-input-btn-eye"
                      title="Mostrar u ocultar contraseña"
                      tabindex="-1"
                    >
                      <svg id="eyeIconOpen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      <svg id="eyeIconClosed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Indicador de requisitos de contraseña en tiempo real (Minuta) -->
                <div id="passwordRulesPanel" style="
                  margin-top: 0.6rem;
                  margin-bottom: 0.5rem;
                  display: none;
                  background: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  padding: 0.6rem 0.8rem;
                  font-size: 0.78rem;
                ">
                  <div style="font-weight: 600; color: #475569; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 4px;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span>Requisitos de seguridad (Minuta QA):</span>
                  </div>
                  <ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px;">
                    <li id="ruleLength" style="display: flex; align-items: center; gap: 6px; color: #94a3b8; transition: color 0.15s ease;">
                      <span class="rule-icon" style="font-size: 0.75rem;">⚪</span>
                      <span>Mínimo 6 caracteres</span>
                    </li>
                    <li id="ruleUpper" style="display: flex; align-items: center; gap: 6px; color: #94a3b8; transition: color 0.15s ease;">
                      <span class="rule-icon" style="font-size: 0.75rem;">⚪</span>
                      <span>Al menos 1 mayúscula (A-Z)</span>
                    </li>
                    <li id="ruleLower" style="display: flex; align-items: center; gap: 6px; color: #94a3b8; transition: color 0.15s ease;">
                      <span class="rule-icon" style="font-size: 0.75rem;">⚪</span>
                      <span>Al menos 1 minúscula (a-z)</span>
                    </li>
                    <li id="ruleNumber" style="display: flex; align-items: center; gap: 6px; color: #94a3b8; transition: color 0.15s ease;">
                      <span class="rule-icon" style="font-size: 0.75rem;">⚪</span>
                      <span>Al menos 1 número (0-9)</span>
                    </li>
                    <li id="ruleSpecial" style="display: flex; align-items: center; gap: 6px; color: #94a3b8; transition: color 0.15s ease;">
                      <span class="rule-icon" style="font-size: 0.75rem;">⚪</span>
                      <span>Al menos 1 carácter especial (@, #, $, !, %, etc.)</span>
                    </li>
                  </ul>
                </div>

                <!-- Recordar sesión y enlace ¿Olvidaste tu contraseña? -->
                <div class="auth-options-row">
                  <label class="auth-checkbox-label">
                    <input type="checkbox" id="checkRememberSession" class="auth-checkbox">
                    <span>Recordar sesión</span>
                  </label>
                  <button type="button" class="auth-link-btn" id="btnGoToForgot">¿Olvidaste tu contraseña?</button>
                </div>

                <!-- Botón Principal INICIAR SESIÓN -->
                <button type="submit" id="btnLoginSubmit" class="btn-royal-blue">
                  <span id="loginBtnText">INICIAR SESIÓN</span>
                  <svg class="btn-arrow-right" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                  <div class="auth-btn-spinner" id="loginSpinner" style="display: none;"></div>
                </button>

                <div class="auth-security-caption">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>Acceso seguro y protegido para el personal autorizado.</span>
                </div>
              </form>
            </div>

            <div class="auth-panel-footer">
              <span class="footer-copy">© 2026 POWERGYM</span>
              <div class="footer-links">
                <a href="#privacidad" id="linkPrivacidad">Privacidad</a>
                <a href="#ayuda" id="linkAyuda">Ayuda</a>
              </div>
            </div>
          </div>

          <!-- ==========================================
               PASO 2: ¿Olvidaste tu contraseña? (Figma Image 4)
               ========================================== -->
          <div class="auth-view-step" id="authStepForgot">
            <div class="auth-card-modal">
              <div class="modal-card-header">
                <div class="modal-icon-square icon-blue">
                  <img src="/src/img/key-round.png" alt="Recuperar contraseña" width="24" height="24" style="display:block;">
                </div>
                <button type="button" class="btn-modal-close" id="btnCloseForgot" title="Cerrar">✕</button>
              </div>

              <h2 class="modal-title">¿Olvidaste tu contraseña?</h2>
              <p class="modal-subtitle">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>

              <div class="auth-error-alert" id="forgotAlert" style="display: none;" role="alert">
                <span id="forgotAlertMessage"></span>
              </div>

              <form id="forgotForm" class="auth-form" novalidate>
                <div class="auth-field-group">
                  <label for="forgotEmail" class="auth-label">Correo electrónico</label>
                  <div class="auth-input-wrapper">
                    <svg class="auth-input-icon-left" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="M22 7l-10 7L2 7"></path>
                    </svg>
                    <input
                      type="email"
                      id="forgotEmail"
                      name="email"
                      class="auth-input"
                      placeholder="nombre@powergym.com"
                      required
                    />
                  </div>
                  <div class="auth-helper-msg">Usa el correo asociado a tu cuenta de personal.</div>
                </div>

                <button type="submit" id="btnForgotSubmit" class="btn-royal-blue">
                  <span id="forgotBtnText">Enviar enlace de recuperación</span>
                  <svg class="btn-arrow-right" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                  <div class="auth-btn-spinner" id="forgotSpinner" style="display: none;"></div>
                </button>

                <div class="modal-back-link-wrapper">
                  <button type="button" class="btn-back-link" id="btnBackToLoginFromForgot">
                    ← Volver al inicio de sesión
                  </button>
                </div>

                <div class="modal-divider"></div>

                <div class="modal-footer-caption">
                  <span>¿No tienes acceso a tu correo?</span>
                  <p>Contacta al administrador del gimnasio.</p>
                </div>
              </form>
            </div>
            <div class="auth-panel-footer">
              <span class="footer-copy">© 2026 POWERGYM</span>
              <div class="footer-links">
                <a href="#privacidad">Privacidad</a>
                <a href="#ayuda">Ayuda</a>
              </div>
            </div>
          </div>

          <!-- ==========================================
               PASO 3: Crea tu nueva contraseña (Figma Image 3)
               ========================================== -->
          <div class="auth-view-step" id="authStepReset">
            <div class="auth-card-modal">
              <div class="modal-card-header">
                <div class="modal-icon-square icon-blue">
                  <img src="/src/img/key-round.png" alt="Nueva contraseña" width="24" height="24" style="display:block;">
                </div>
                <button type="button" class="btn-modal-close" id="btnCloseReset" title="Cerrar">✕</button>
              </div>

              <h2 class="modal-title">Crea tu nueva contraseña</h2>
              <p class="modal-subtitle">Elige una contraseña segura para recuperar el acceso a tu cuenta de POWERGYM.</p>

              <div class="auth-error-alert" id="resetAlert" style="display: none;" role="alert">
                <span id="resetAlertMessage"></span>
              </div>

              <form id="resetForm" class="auth-form" novalidate>
                <!-- Nueva Contraseña -->
                <div class="auth-field-group">
                  <label for="resetNewPassword" class="auth-label">Nueva contraseña</label>
                  <div class="auth-input-wrapper">
                    <svg class="auth-input-icon-left" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <input
                      type="password"
                      id="resetNewPassword"
                      class="auth-input"
                      placeholder="••••••••••••"
                      required
                    />
                    <button type="button" class="auth-input-btn-eye" id="btnToggleResetNew">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                  </div>
                  <div class="auth-helper-msg">Usa al menos 8 caracteres e incluye mayúsculas, minúsculas, números y un símbolo.</div>
                </div>

                <!-- Confirmar Contraseña -->
                <div class="auth-field-group">
                  <label for="resetConfirmPassword" class="auth-label">Confirmar contraseña</label>
                  <div class="auth-input-wrapper">
                    <svg class="auth-input-icon-left" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <input
                      type="password"
                      id="resetConfirmPassword"
                      class="auth-input"
                      placeholder="••••••••••••"
                      required
                    />
                    <button type="button" class="auth-input-btn-eye" id="btnToggleResetConfirm">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                  </div>
                  <div class="auth-helper-msg" id="confirmPasswordHelper"></div>
                </div>

                <button type="submit" id="btnResetSubmit" class="btn-royal-blue">
                  <span id="resetBtnText">Cambiar contraseña</span>
                  <svg class="btn-arrow-right" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                  <div class="auth-btn-spinner" id="resetSpinner" style="display: none;"></div>
                </button>

                <div class="modal-back-link-wrapper">
                  <button type="button" class="btn-back-link" id="btnBackToLoginFromReset">
                    ← Volver al inicio de sesión
                  </button>
                </div>

                <div class="modal-divider"></div>

                <div class="auth-security-caption">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>Acceso seguro para el personal autorizado.</span>
                </div>
              </form>
            </div>
            <div class="auth-panel-footer">
              <span class="footer-copy">© 2026 POWERGYM</span>
              <div class="footer-links">
                <a href="#privacidad">Privacidad</a>
                <a href="#ayuda">Ayuda</a>
              </div>
            </div>
          </div>

          <!-- ==========================================
               PASO 4: Contraseña actualizada (Figma Image 2)
               ========================================== -->
          <div class="auth-view-step" id="authStepSuccess">
            <div class="auth-card-modal">
              <div class="modal-card-header">
                <div class="modal-icon-square icon-success">
                  <img src="/src/img/circle-check.png" alt="Contraseña actualizada" width="24" height="24" style="display:block;">
                </div>
                <button type="button" class="btn-modal-close" id="btnCloseSuccess" title="Cerrar">✕</button>
              </div>

              <h2 class="modal-title">Contraseña actualizada</h2>
              <p class="modal-subtitle">Tu contraseña se cambió correctamente. Ya puedes iniciar sesión en POWERGYM con tu nueva contraseña.</p>

              <button type="button" id="btnBackToLoginSuccess" class="btn-royal-blue">
                <span>Volver al inicio de sesión</span>
                <svg class="btn-arrow-right" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

              <div class="modal-divider" style="margin-top: 1.75rem;"></div>

              <div class="auth-security-caption">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Acceso seguro para el personal autorizado.</span>
              </div>
            </div>
            <div class="auth-panel-footer">
              <span class="footer-copy">© 2026 POWERGYM</span>
              <div class="footer-links">
                <a href="#privacidad">Privacidad</a>
                <a href="#ayuda">Ayuda</a>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  `;
}
