import { getTodayString, formatDateToISO, addDaysToDate, formatDisplayDate, formatCurrency, showToast } from './modules/utils.js';
import { appState, loadDataFromStorage, saveMembersCache, loadMembersCache, saveTransactionsToStorage, savePricesToStorage, getMemberTrafficStatus, addTransaction, hideMember, isHiddenMember, setPendingPayment, isPendingPayment, isAuthenticated, saveSession, clearSession, getAuthToken, getAuthUser, PASS_DURATIONS, PASS_NAMES } from './modules/state.js';
import { renderMembersTable, applyRolePermissions, updateTodayStats } from './modules/ui.js';
import { api } from './modules/api.js';

// Importación de Componentes Modulares
import { renderLoginView } from './components/LoginView.js';
import { renderNavbar, renderRoleBanner } from './components/Navbar.js';
import { renderDashboardView } from './components/DashboardView.js';
import { renderSociosView } from './components/SociosView.js';
import { renderCorteViewTemplate } from './components/CorteView.js';
import { renderAdminView } from './components/AdminView.js';
import { renderPaymentModal } from './components/PaymentModal.js';
import { renderTicketModal } from './components/TicketModal.js';
import { renderAdminAuthModal } from './components/AdminAuthModal.js';

// Funciones expuestas a window para botones onClick en HTML (de modules/ui.js)
window.handleDeleteMember = handleDeleteMember;
window.openPaymentModal = openPaymentModal;
window.switchTab = switchTab;
window.reprintTicket = reprintTicket;
window.resetPaymentMethodSelection = resetPaymentMethodSelection;
window.updatePaymentMethodState = updatePaymentMethodState;
window.handleLogout = handleLogout;
window.handleLoginSubmit = handleLoginSubmit;

function mountComponents() {
  const loginContainer = document.getElementById('loginContainer');
  if (loginContainer) loginContainer.innerHTML = renderLoginView();

  const headerNav = document.getElementById('headerNav');
  if (headerNav) headerNav.innerHTML = renderNavbar();

  const roleBanner = document.getElementById('roleBanner');
  if (roleBanner) roleBanner.innerHTML = renderRoleBanner();

  const appMain = document.getElementById('appMain');
  if (appMain) {
    appMain.innerHTML = `
      ${renderDashboardView()}
      ${renderSociosView()}
      ${renderCorteViewTemplate()}
      ${renderAdminView()}
    `;
  }

  const modalContainer = document.getElementById('modalContainer');
  if (modalContainer) {
    modalContainer.innerHTML = `
      ${renderPaymentModal()}
      ${renderTicketModal()}
      ${renderAdminAuthModal()}
    `;
  }
}

// Carga los socios reales desde el backend; si no responde, usa la última copia local.
async function refreshMembers() {
  try {
    const members = await api.getMembers();
    appState.backendOnline = true;
    appState.members = members.filter(m => !isHiddenMember(m.id));
    saveMembersCache(appState.members);
    renderMembersTable();
    return true;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      clearSession();
      updateAuthUI();
      showToast('Sesión no autorizada o expirada. Inicia sesión nuevamente.', 'error');
      return false;
    }
    appState.backendOnline = false;
    appState.members = loadMembersCache().filter(m => !isHiddenMember(m.id));
    renderMembersTable();
    showToast(
      appState.members.length > 0 ? `${error.message} Mostrando la última copia local.` : error.message,
      'error'
    );
    return false;
  }
}

export function updateAuthUI() {
  const loginContainer = document.getElementById('loginContainer');
  const headerNav = document.getElementById('headerNav');
  const roleBanner = document.getElementById('roleBanner');
  const appMain = document.getElementById('appMain');

  const loggedIn = isAuthenticated();

  if (loginContainer) loginContainer.style.display = loggedIn ? 'none' : 'block';
  if (headerNav) headerNav.style.display = loggedIn ? 'flex' : 'none';
  if (roleBanner) roleBanner.style.display = loggedIn ? 'block' : 'none';
  if (appMain) appMain.style.display = loggedIn ? 'block' : 'none';

  if (loggedIn) {
    const user = appState.user;
    const displayName = user?.nombre || user?.username || (appState.role === 'admin' ? 'Administrador' : 'Recepcionista');
    const roleTag = (user?.rol || (appState.role === 'admin' ? 'ADMIN' : 'RECEPCIÓN')).toUpperCase();

    const nameEl = document.getElementById('userDisplayName');
    if (nameEl) nameEl.textContent = displayName;

    const tagEl = document.getElementById('userRoleTag');
    if (tagEl) tagEl.textContent = roleTag;

    const avatarEl = document.getElementById('userAvatarText');
    if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();

    const roleSelect = document.getElementById('roleSelect');
    if (roleSelect) roleSelect.value = appState.role;

    applyRolePermissions();
  }
}

export async function handleLoginSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  const alertEl = document.getElementById('loginAlert');
  const alertMsgEl = document.getElementById('loginAlertMessage');
  const submitBtn = document.getElementById('btnLoginSubmit');
  const btnText = document.getElementById('loginBtnText');
  const spinner = document.getElementById('loginSpinner');

  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!username || !password) {
    if (alertEl && alertMsgEl) {
      alertMsgEl.textContent = 'Por favor ingresa tanto tu usuario como tu contraseña.';
      alertEl.style.display = 'flex';
    }
    showToast('Ingresa usuario y contraseña para continuar', 'error');
    return false;
  }

  // Minuta Item 3: Validación de contraseña fuerte (cliente pidió esto explícitamente)
  // Reglas: mínimo 6 caracteres, ≥1 mayúscula, ≥1 minúscula, ≥1 número, ≥1 carácter especial
  const passwordRules = [
    { test: password.length >= 6,            msg: 'La contraseña debe tener al menos 6 caracteres.' },
    { test: /[A-Z]/.test(password),          msg: 'La contraseña debe contener al menos una letra mayúscula.' },
    { test: /[a-z]/.test(password),          msg: 'La contraseña debe contener al menos una letra minúscula.' },
    { test: /[0-9]/.test(password),          msg: 'La contraseña debe contener al menos un número.' },
    { test: /[^A-Za-z0-9]/.test(password),  msg: 'La contraseña debe contener al menos un carácter especial (ej. @, #, !, $).' },
  ];
  const failedRule = passwordRules.find(r => !r.test);
  if (failedRule) {
    if (alertEl && alertMsgEl) {
      alertMsgEl.textContent = failedRule.msg;
      alertEl.style.display = 'flex';
    }
    if (passwordInput) { passwordInput.focus(); passwordInput.select(); }
    return false;
  }

  if (submitBtn) submitBtn.disabled = true;
  if (btnText) btnText.textContent = 'Validando acceso...';
  if (spinner) spinner.style.display = 'inline-block';
  if (alertEl) alertEl.style.display = 'none';

  try {
    const data = await api.login({ username, password });

    // Guardar token y usuario en el cliente (localStorage + cookies)
    saveSession(data.token, data.usuario);

    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';

    // Redirección automática al panel operativo
    updateAuthUI();
    switchTab('dashboard');

    showToast(`¡Bienvenido, ${data.usuario.nombre || data.usuario.username}! Sesión iniciada con éxito.`, 'success');

    // Sincronizar datos reales de socios del backend
    await refreshMembers();
    return true;
  } catch (error) {
    if (alertEl && alertMsgEl) {
      alertMsgEl.textContent = error.message || 'Credenciales inválidas (usuario o contraseña incorrectos)';
      alertEl.style.display = 'flex';
    }
    showToast(error.message || 'Error al iniciar sesión', 'error');
    if (passwordInput) {
      passwordInput.focus();
      passwordInput.select();
    }
    return false;
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (btnText) btnText.textContent = 'Iniciar Sesión';
    if (spinner) spinner.style.display = 'none';
  }
}

export function handleLogout() {
  clearSession();
  updateAuthUI();
  showAuthStep('login');
  showToast('Has cerrado sesión correctamente.', 'info');
  const usernameInput = document.getElementById('loginUsername');
  if (usernameInput) {
    setTimeout(() => usernameInput.focus(), 100);
  }
}

// --- Control de Pasos de Recuperación de Contraseña (Figma) ---
let currentResetToken = null;

export function showAuthStep(step) {
  const steps = ['login', 'forgot', 'reset', 'success'];
  steps.forEach((s) => {
    const el = document.getElementById(`authStep${s.charAt(0).toUpperCase() + s.slice(1)}`);
    if (el) {
      if (s === step) {
        el.classList.add('active');
        el.style.display = 'flex';
      } else {
        el.classList.remove('active');
        el.style.display = 'none';
      }
    }
  });

  if (step === 'login') {
    const alertEl = document.getElementById('loginAlert');
    if (alertEl) alertEl.style.display = 'none';
    setTimeout(() => document.getElementById('loginUsername')?.focus(), 50);
  } else if (step === 'forgot') {
    const alertEl = document.getElementById('forgotAlert');
    if (alertEl) alertEl.style.display = 'none';
    setTimeout(() => document.getElementById('forgotEmail')?.focus(), 50);
  } else if (step === 'reset') {
    const alertEl = document.getElementById('resetAlert');
    if (alertEl) alertEl.style.display = 'none';
    setTimeout(() => document.getElementById('resetNewPassword')?.focus(), 50);
  }
}

export async function handleForgotSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const emailInput = document.getElementById('forgotEmail');
  const alertEl = document.getElementById('forgotAlert');
  const alertMsgEl = document.getElementById('forgotAlertMessage');
  const submitBtn = document.getElementById('btnForgotSubmit');
  const btnText = document.getElementById('forgotBtnText');
  const spinner = document.getElementById('forgotSpinner');

  const email = emailInput ? emailInput.value.trim() : '';

  if (!email) {
    if (alertEl && alertMsgEl) {
      alertMsgEl.textContent = 'Por favor ingresa tu correo electrónico registrado.';
      alertEl.style.display = 'flex';
    }
    showToast('Ingresa tu correo para continuar', 'error');
    return false;
  }

  if (submitBtn) submitBtn.disabled = true;
  if (btnText) btnText.textContent = 'Generando enlace...';
  if (spinner) spinner.style.display = 'inline-block';
  if (alertEl) alertEl.style.display = 'none';

  try {
    const res = await api.recuperarPassword({ email });
    currentResetToken = res.resetToken;
    showToast('Enlace de recuperación validado. Procede a crear tu nueva contraseña.', 'success');
    showAuthStep('reset');
    return true;
  } catch (error) {
    if (alertEl && alertMsgEl) {
      alertMsgEl.textContent = error.message || 'No existe cuenta registrada con ese correo.';
      alertEl.style.display = 'flex';
    }
    showToast(error.message || 'Error en la recuperación', 'error');
    return false;
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (btnText) btnText.textContent = 'Enviar enlace de recuperación';
    if (spinner) spinner.style.display = 'none';
  }
}

export async function handleResetSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const newPassInput = document.getElementById('resetNewPassword');
  const confirmPassInput = document.getElementById('resetConfirmPassword');
  const alertEl = document.getElementById('resetAlert');
  const alertMsgEl = document.getElementById('resetAlertMessage');
  const submitBtn = document.getElementById('btnResetSubmit');
  const btnText = document.getElementById('resetBtnText');
  const spinner = document.getElementById('resetSpinner');

  const nuevaPassword = newPassInput ? newPassInput.value : '';
  const confirmarPassword = confirmPassInput ? confirmPassInput.value : '';

  if (!nuevaPassword || !confirmarPassword) {
    if (alertEl && alertMsgEl) {
      alertMsgEl.textContent = 'Completa ambos campos de contraseña.';
      alertEl.style.display = 'flex';
    }
    showToast('Completa ambos campos', 'error');
    return false;
  }

  if (nuevaPassword !== confirmarPassword) {
    if (alertEl && alertMsgEl) {
      alertMsgEl.textContent = 'Las contraseñas no coinciden.';
      alertEl.style.display = 'flex';
    }
    showToast('Las contraseñas no coinciden', 'error');
    return false;
  }

  // Minuta Item 3: Mínimo 6 caracteres, mayúscula, minúscula, número y carácter especial
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
  if (!passwordRegex.test(nuevaPassword)) {
    if (alertEl && alertMsgEl) {
      alertMsgEl.textContent = 'La contraseña debe tener al menos 6 caracteres e incluir mayúsculas, minúsculas, números y un símbolo especial.';
      alertEl.style.display = 'flex';
    }
    showToast('Requisitos de contraseña no cumplidos', 'error');
    return false;
  }

  if (!currentResetToken) {
    if (alertEl && alertMsgEl) {
      alertMsgEl.textContent = 'Token de recuperación ausente o expirado. Solicita un nuevo enlace.';
      alertEl.style.display = 'flex';
    }
    showToast('Token ausente. Inicia de nuevo la recuperación.', 'error');
    showAuthStep('forgot');
    return false;
  }

  if (submitBtn) submitBtn.disabled = true;
  if (btnText) btnText.textContent = 'Actualizando contraseña...';
  if (spinner) spinner.style.display = 'inline-block';
  if (alertEl) alertEl.style.display = 'none';

  try {
    await api.resetPassword({
      token: currentResetToken,
      nuevaPassword,
      confirmarPassword,
    });

    currentResetToken = null;
    if (newPassInput) newPassInput.value = '';
    if (confirmPassInput) confirmPassInput.value = '';

    showToast('¡Contraseña actualizada con éxito!', 'success');
    showAuthStep('success');
    return true;
  } catch (error) {
    if (alertEl && alertMsgEl) {
      alertMsgEl.textContent = error.message || 'Error al restablecer la contraseña.';
      alertEl.style.display = 'flex';
    }
    showToast(error.message || 'Error al restablecer contraseña', 'error');
    return false;
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (btnText) btnText.textContent = 'Cambiar contraseña';
    if (spinner) spinner.style.display = 'none';
  }
}

// --- Modal de Autenticación para cambio directo a rol Admin (Minuta Item 5) ---
export function openAdminAuthModal() {
  const modal = document.getElementById('adminAuthModal');
  const alertEl = document.getElementById('adminAuthAlert');
  const emailInput = document.getElementById('adminAuthEmailInput');
  const passInput = document.getElementById('adminAuthPasswordInput');
  if (alertEl) alertEl.style.display = 'none';
  if (emailInput) emailInput.value = '';
  if (passInput) passInput.value = '';
  if (modal) modal.classList.add('active');
  setTimeout(() => emailInput?.focus(), 50);
}

export function closeAdminAuthModal() {
  const modal = document.getElementById('adminAuthModal');
  if (modal) modal.classList.remove('active');
  const roleSelect = document.getElementById('roleSelect');
  if (roleSelect) roleSelect.value = appState.role;
}

export async function handleAdminAuthSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const emailInput = document.getElementById('adminAuthEmailInput');
  const passInput = document.getElementById('adminAuthPasswordInput');
  const alertEl = document.getElementById('adminAuthAlert');
  const alertMsg = document.getElementById('adminAuthAlertMessage');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';

  // Validar que ambos campos estén llenos
  if (!email || !password) {
    if (alertEl && alertMsg) {
      alertMsg.textContent = !email
        ? 'Ingresa el correo del Administrador.'
        : 'Ingresa la contraseña del Administrador.';
      alertEl.style.display = 'flex';
    }
    return false;
  }

  try {
    // Validar correo y contraseña del admin contra el backend
    await api.login({ username: email, password });
    setRole('admin');
    const roleSelect = document.getElementById('roleSelect');
    if (roleSelect) roleSelect.value = 'admin';
    closeAdminAuthModal();
    showToast('🔑 Acceso de Administrador verificado y concedido.', 'success');
    return true;
  } catch (err) {
    if (alertEl && alertMsg) {
      alertMsg.textContent = 'Correo o contraseña de Administrador incorrectos.';
      alertEl.style.display = 'flex';
    }
    showToast('Credenciales de Administrador incorrectas', 'error');
    if (passInput) {
      passInput.focus();
      passInput.select();
    }
    return false;
  }
}

async function initApp() {
  mountComponents();
  loadDataFromStorage();
  setupEventListeners();
  updateTimeDisplay();
  setInterval(updateTimeDisplay, 1000);

  const corteDateFilter = document.getElementById('corteDateFilter');
  if (corteDateFilter) corteDateFilter.value = getTodayString();

  updateRegistrationEndDatePreview();
  populatePricesInAdminForm();
  applyRolePermissions();
  renderMembersTable();
  updateTodayStats(getTodayString);
  renderCorteView();

  // Siempre arrancamos mostrando el login.
  // Solo después de verificar el token con el backend se revela el dashboard.
  const hasStoredToken = isAuthenticated();

  if (!hasStoredToken) {
    // Sin token: mostrar login directamente
    updateAuthUI();
    return;
  }

  // Hay token guardado: validar contra el backend antes de mostrar nada
  try {
    const meData = await api.getMe();
    if (meData && meData.usuario) {
      appState.user = meData.usuario;
      updateAuthUI();          // token válido → muestra dashboard
      await refreshMembers();
    } else {
      // Respuesta inesperada: forzar login
      clearSession();
      updateAuthUI();
    }
  } catch (err) {
    // Token inválido o backend caído: siempre mostrar login
    clearSession();
    updateAuthUI();
    if (err.status === 401 || err.status === 403) {
      showToast('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', 'error');
    }
  }
}


function setRole(newRole) {
  appState.role = newRole;
  localStorage.setItem('powergym_current_role', newRole);
  applyRolePermissions();
  renderMembersTable();
  showToast(`Cambiado a perfil: ${newRole === 'admin' ? 'Administrador / Dueño' : 'Recepcionista'}`, 'info');
}

export function switchTab(tabId) {
  if (tabId === 'admin' && appState.role !== 'admin') {
    showToast('Acceso Denegado: Solo el Administrador/Dueño puede modificar precios', 'error');
    return;
  }
  const buttons = document.querySelectorAll('.nav-btn');
  const views = document.querySelectorAll('.tab-view');

  buttons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId));
  views.forEach(view => view.classList.toggle('active', view.id === `view-${tabId}`));

  if (tabId === 'dashboard') {
    renderMembersTable();
    updateTodayStats(getTodayString);
    refreshMembers(); // siempre contra datos reales del backend
    const search = document.getElementById('searchInput');
    if (search) search.focus();
  } else if (tabId === 'corte') {
    renderCorteView();
  } else if (tabId === 'admin') {
    populatePricesInAdminForm();
    updateAdminMetrics();
  }
}

function updateRegistrationEndDatePreview() {
  const passType = document.getElementById('memberPassType').value;
  // El backend ignora fechas manuales: siempre es fin de hoy + días exactos del pase.
  const endDate = addDaysToDate(getTodayString(), PASS_DURATIONS[passType] || PASS_DURATIONS.mensual);

  const calcEndDateText = document.getElementById('calcEndDateText');
  const calcDurationText = document.getElementById('calcDurationText');
  const calcPriceText = document.getElementById('calcPriceText');

  if (calcEndDateText) calcEndDateText.textContent = formatDisplayDate(endDate);
  if (calcDurationText) {
    calcDurationText.textContent = `${PASS_DURATIONS[passType]} días desde hoy (cálculo automático)`;
  }
  if (calcPriceText) calcPriceText.textContent = formatCurrency(appState.prices[passType] || 0);
}

async function handleMemberRegisterSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('memberName');
  const phoneInput = document.getElementById('memberPhone');
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  
  if (!name) {
    showToast('⚠️ No se pueden guardar socios sin nombre.', 'error');
    return;
  }

  // Minuta Item 6: El teléfono es opcional
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    const existingMember = appState.members.find(m => m.phone && m.phone.replace(/\D/g, '') === cleanPhone);
    if (existingMember) {
      showToast(`⚠️ El teléfono ${phone} ya pertenece a "${existingMember.name}". Búscalo en la lista para renovar su pase.`, 'error');
      switchTab('dashboard');
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.value = phone;
        appState.searchQuery = phone;
        renderMembersTable();
        searchInput.focus();
      }
      return;
    }
  }

  const passType = document.getElementById('memberPassType').value;
  const payNowChecked = document.getElementById('checkPayNow').checked;
  const paymentMethodInput = document.querySelector('input[name="immediatePaymentMethod"]:checked');
  const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'efectivo';
  const amount = appState.prices[passType] || 0;

  const submitBtn = document.getElementById('btnSubmitRegister');
  if (submitBtn) submitBtn.disabled = true;

  try {
    // 1) Alta real en el backend. Si no hay teléfono, pasamos identificador amigable
    const phonePayload = phone || `ST-${Date.now().toString().slice(-6)}`;
    let member = await api.createMember({ name, phone: phonePayload, passType });
    appState.members.unshift(member);
    saveMembersCache(appState.members);

    if (payNowChecked) {
      // 2) Cobro real: registra el pago y reinicia la vigencia desde la fecha de cobro.
      try {
        const { member: cobrado, payment } = await api.chargeMember(member.id, { amount, paymentMethod, passType });
        member = applyMemberUpdate(cobrado);
        const ticket = buildTransactionFromPayment(member, payment);
        addTransaction(ticket);
        renderMembersTable();
        renderCorteView();
        showTicketModal(ticket);
        showToast(`✅ Socio ${name} registrado y pago acreditado`, 'success');
      } catch (cobroError) {
        setPendingPayment(member.id, true);
        showToast(`Socio registrado, pero el cobro falló: ${cobroError.message}`, 'error');
      }
    } else {
      // Alta sin pago: acceso bloqueado hasta liquidar (Requerimiento 5).
      setPendingPayment(member.id, true);
      showToast(`✅ Socio ${name} registrado con éxito (Cobro pendiente)`, 'success');
      switchTab('dashboard');
    }

    document.getElementById('memberRegisterForm').reset();
    updateRegistrationEndDatePreview();
    renderMembersTable();
    updateTodayStats(getTodayString);
    renderCorteView();
  } catch (error) {
    if (error.status === 409) {
      // Teléfono duplicado: lo manda al listado buscándolo (Requerimiento 2).
      showToast(`⚠️ ${error.message}`, 'error');
      switchTab('dashboard');
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.value = phone;
        appState.searchQuery = phone;
        renderMembersTable();
        searchInput.focus();
      }
    } else {
      showToast(error.message, 'error');
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

export function openPaymentModal(memberId) {
  const member = appState.members.find(m => String(m.id) === String(memberId));
  if (!member) return;
  const modal = document.getElementById('paymentModal');
  document.getElementById('payMemberId').value = member.id;
  document.getElementById('payMemberNameDisplay').textContent = member.name;
  const phoneDisplay = (member.phone && !member.phone.startsWith('ST-')) ? member.phone : 'Sin teléfono';
  document.getElementById('payMemberPhoneDisplay').textContent = phoneDisplay;
  const traffic = getMemberTrafficStatus(member);
  const badge = document.getElementById('payMemberStatusBadge');
  badge.className = `pm-badge traffic-badge ${traffic.status}`;
  badge.textContent = traffic.label;
  
  // Minuta Item 9: Permitir cambiar de membresía al renovar
  const payPassType = document.getElementById('payPassType');
  payPassType.value = member.passType || 'mensual';
  payPassType.disabled = false;
  payPassType.title = 'Puedes modificar el tipo de pase a renovar';

  // Requerimiento 3.1: Modal emergente que obligue a elegir entre "Efectivo" o "Transferencia" para habilitar confirmación
  resetPaymentMethodSelection();

  updatePaymentModalCalculations();
  modal.classList.add('active');
}

export function resetPaymentMethodSelection() {
  const methodInputs = document.querySelectorAll('input[name="payMethod"]');
  methodInputs.forEach(input => {
    input.checked = false;
  });
  updatePaymentMethodState(null);
}

export function updatePaymentMethodState(selectedMethod) {
  const confirmBtn = document.getElementById('btnConfirmPayment');
  const badge = document.getElementById('payMethodBadge');
  const notice = document.getElementById('paySelectionNotice');

  if (selectedMethod) {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.title = 'Confirmar el cobro registrado';
    }
    if (badge) {
      badge.className = 'method-req-badge selected';
      badge.textContent = selectedMethod === 'efectivo' ? '💵 Efectivo elegido' : '💳 Transferencia elegida';
    }
    if (notice) {
      notice.className = 'payment-selection-notice ready';
      notice.innerHTML = `<span class="notice-icon">✅</span><span class="notice-text">Método seleccionado: <strong>${selectedMethod === 'efectivo' ? 'Efectivo' : 'Transferencia'}</strong>. Confirmación habilitada.</span>`;
    }
  } else {
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.title = 'Debes seleccionar Efectivo o Transferencia para habilitar la confirmación';
    }
    if (badge) {
      badge.className = 'method-req-badge pending';
      badge.textContent = 'Selección obligatoria';
    }
    if (notice) {
      notice.className = 'payment-selection-notice pending';
      notice.innerHTML = `<span class="notice-icon">⚠️</span><span class="notice-text">Selecciona <strong>Efectivo</strong> o <strong>Transferencia</strong> para habilitar la confirmación.</span>`;
    }
  }
}

function updatePaymentModalCalculations() {
  const memberId = document.getElementById('payMemberId').value;
  const member = appState.members.find(m => String(m.id) === String(memberId));
  if (!member) return;
  const passType = document.getElementById('payPassType')?.value || member.passType || 'mensual';

  // Requerimiento 1: la vigencia se reinicia desde la fecha de cobro.
  // Mismo cálculo que hace el backend: fin de hoy + días exactos del pase.
  const newDueDate = addDaysToDate(getTodayString(), PASS_DURATIONS[passType] || PASS_DURATIONS.mensual);
  const price = appState.prices[passType] || 0;

  document.getElementById('payNewDueDateText').textContent = formatDisplayDate(newDueDate);
  document.getElementById('payAmountText').textContent = formatCurrency(price);
}

async function handlePaymentSubmit(e) {
  e.preventDefault();
  const memberId = document.getElementById('payMemberId').value;
  const member = appState.members.find(m => String(m.id) === String(memberId));
  if (!member) return;

  const methodInput = document.querySelector('input[name="payMethod"]:checked');
  if (!methodInput) {
    updatePaymentMethodState(null);
    showToast('⚠️ Obligatorio: Debes seleccionar Efectivo o Transferencia para confirmar el cobro', 'warning');
    return;
  }

  const paymentMethod = methodInput.value;
  const passType = document.getElementById('payPassType')?.value || member.passType || 'mensual';
  const amount = appState.prices[passType] || 0;

  const confirmBtn = document.getElementById('btnConfirmPayment');
  if (confirmBtn) confirmBtn.disabled = true;

  try {
    // El backend registra el pago y renueva la vigencia desde la fecha de cobro con el pase seleccionado.
    const { member: cobrado, payment } = await api.chargeMember(member.id, { amount, paymentMethod, passType });
    const actualizado = applyMemberUpdate(cobrado);
    const ticket = buildTransactionFromPayment(actualizado, payment);
    addTransaction(ticket);

    document.getElementById('paymentModal').classList.remove('active');
    resetPaymentMethodSelection();
    renderMembersTable();
    updateTodayStats(getTodayString);
    renderCorteView();
    showTicketModal(ticket);
    showToast(`Cobro exitoso: ${formatCurrency(amount)} registrado (${paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia'})`, 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    const currentChecked = document.querySelector('input[name="payMethod"]:checked');
    if (confirmBtn) confirmBtn.disabled = !currentChecked;
  }
}

// Aplica un socio devuelto por el backend al estado local y cachea la lista.
function applyMemberUpdate(member) {
  const index = appState.members.findIndex(m => String(m.id) === String(member.id));
  if (index >= 0) appState.members[index] = member;
  else appState.members.unshift(member);
  setPendingPayment(member.id, false);
  saveMembersCache(appState.members);
  return member;
}

// Ticket local generado a partir del pago real registrado por el backend.
function buildTransactionFromPayment(member, payment) {
  const passType = member.passType;
  return {
    id: 'TKT-' + payment.id, memberId: member.id, memberName: member.name, memberPhone: member.phone,
    passType, passName: PASS_NAMES[passType] || passType,
    amount: payment.amount, paymentMethod: payment.paymentMethod,
    date: payment.date, time: payment.time,
    expirationDate: member.endDate, cashier: appState.role === 'admin' ? 'Administrador' : 'Recepcionista'
  };
}

function showTicketModal(ticket) {
  const modal = document.getElementById('ticketModal');
  if (!modal) return;
  document.getElementById('tktNumber').textContent = `#${ticket.id}`;
  document.getElementById('tktDate').textContent = `${formatDisplayDate(ticket.date)} ${ticket.time}`;
  document.getElementById('tktCashier').textContent = ticket.cashier || 'Recepcionista';
  document.getElementById('tktMemberName').textContent = ticket.memberName;
  document.getElementById('tktMemberPhone').textContent = ticket.memberPhone;
  document.getElementById('tktPassName').textContent = ticket.passName;
  document.getElementById('tktPaymentMethod').textContent = ticket.paymentMethod === 'efectivo' ? 'EFECTIVO' : 'TRANSFERENCIA';
  document.getElementById('tktAmount').textContent = formatCurrency(ticket.amount);
  document.getElementById('tktExpirationDate').textContent = formatDisplayDate(ticket.expirationDate);
  modal.classList.add('active');
}

export function reprintTicket(transactionId) {
  const tx = appState.transactions.find(t => t.id === transactionId);
  if (tx) showTicketModal(tx);
}

function renderCorteView() {
  const dateInput = document.getElementById('corteDateFilter');
  const selectedDate = dateInput ? dateInput.value : getTodayString();
  const transactionsOfDate = appState.transactions.filter(t => t.date === selectedDate);
  let totalAmount = 0, cashTotal = 0, cashCount = 0, transferTotal = 0, transferCount = 0;
  let passCounts = { visita: { count: 0, total: 0 }, semanal: { count: 0, total: 0 }, mensual: { count: 0, total: 0 }, anual: { count: 0, total: 0 } };

  transactionsOfDate.forEach(tx => {
    totalAmount += tx.amount;
    if (tx.paymentMethod === 'efectivo') { cashTotal += tx.amount; cashCount++; }
    else { transferTotal += tx.amount; transferCount++; }
    if (passCounts[tx.passType]) { passCounts[tx.passType].count++; passCounts[tx.passType].total += tx.amount; }
  });

  const totalAmountEl = document.getElementById('corteTotalAmount');
  const totalTransactionsEl = document.getElementById('corteTotalTransactions');
  if (totalAmountEl) totalAmountEl.textContent = formatCurrency(totalAmount);
  if (totalTransactionsEl) totalTransactionsEl.textContent = `${transactionsOfDate.length} transacción(es)`;

  const summaryTotalAmountEl = document.getElementById('corteSummaryTotalAmount');
  const summaryTotalTransactionsEl = document.getElementById('corteSummaryTotalTransactions');
  if (summaryTotalAmountEl) summaryTotalAmountEl.textContent = formatCurrency(totalAmount);
  if (summaryTotalTransactionsEl) summaryTotalTransactionsEl.textContent = `${transactionsOfDate.length} transacciones registradas`;

  const cashCountEl = document.getElementById('corteCashCount');
  const cashTotalEl = document.getElementById('corteCashTotal');
  const summaryCashCountEl = document.getElementById('corteSummaryCashCount');
  const summaryCashTotalEl = document.getElementById('corteSummaryCashTotal');
  if (cashCountEl) cashCountEl.textContent = `${cashCount} pago(s)`;
  if (cashTotalEl) cashTotalEl.textContent = formatCurrency(cashTotal);
  if (summaryCashCountEl) summaryCashCountEl.textContent = `${cashCount} pagos`;
  if (summaryCashTotalEl) summaryCashTotalEl.textContent = formatCurrency(cashTotal);

  const transferCountEl = document.getElementById('corteTransferCount');
  const transferTotalEl = document.getElementById('corteTransferTotal');
  const summaryTransferCountEl = document.getElementById('corteSummaryTransferCount');
  const summaryTransferTotalEl = document.getElementById('corteSummaryTransferTotal');
  if (transferCountEl) transferCountEl.textContent = `${transferCount} pago(s)`;
  if (transferTotalEl) transferTotalEl.textContent = formatCurrency(transferTotal);
  if (summaryTransferCountEl) summaryTransferCountEl.textContent = `${transferCount} pagos`;
  if (summaryTransferTotalEl) summaryTransferTotalEl.textContent = formatCurrency(transferTotal);

  Object.keys(passCounts).forEach(k => {
    const countId = `cortePass${k.charAt(0).toUpperCase() + k.slice(1)}Count`;
    const totalId = `cortePass${k.charAt(0).toUpperCase() + k.slice(1)}Total`;
    const countEl = document.getElementById(countId);
    const totalEl = document.getElementById(totalId);
    if (countEl) countEl.textContent = passCounts[k].count;
    if (totalEl) totalEl.textContent = formatCurrency(passCounts[k].total);
  });

  const badgeDate = document.getElementById('corteTableDateBadge');
  if (badgeDate) badgeDate.textContent = selectedDate === getTodayString() ? 'Hoy (' + formatDisplayDate(selectedDate) + ')' : formatDisplayDate(selectedDate);

  const tbody = document.getElementById('corteTableBody');
  const emptyCorte = document.getElementById('emptyCorteState');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (transactionsOfDate.length === 0) {
    emptyCorte.style.display = 'block';
  } else {
    emptyCorte.style.display = 'none';
    transactionsOfDate.forEach(tx => {
      const tr = document.createElement('tr');
      const methodBadge = tx.paymentMethod === 'efectivo' ? '<span style="color:#059669;">💵 Efectivo</span>' : '<span style="color:#2563eb;">💳 Transferencia</span>';
      tr.innerHTML = `
        <td><strong>${tx.time}</strong></td>
        <td><code>${tx.id}</code></td>
        <td><strong>${tx.memberName}</strong></td>
        <td><span class="pass-pill">${tx.passName}</span></td>
        <td>${methodBadge}</td>
        <td><strong>${formatCurrency(tx.amount)}</strong></td>
        <td><span>${formatDisplayDate(tx.expirationDate)}</span></td>
        <td style="text-align:center;"><button class="btn btn-outline" style="padding: 0.35rem 0.75rem; font-size:0.8rem;" onclick="reprintTicket('${tx.id}')">Reimprimir</button></td>
      `;
      tbody.appendChild(tr);
    });
  }
}

export function handleDeleteMember(memberId) {
  if (appState.role !== 'admin') {
    showToast('Acceso Denegado: Solo el Administrador/Dueño puede eliminar socios.', 'error');
    return;
  }
  const member = appState.members.find(m => String(m.id) === String(memberId));
  if (!member) return;
  if (!confirm(`¿Está seguro de ocultar al socio "${member.name}"?`)) return;

  // Requerimiento 14: borrado lógico (se oculta de la vista, se conserva el registro).
  hideMember(memberId);
  appState.members = appState.members.filter(m => String(m.id) !== String(memberId));
  saveMembersCache(appState.members);
  renderMembersTable();
  updateTodayStats(getTodayString);
  showToast(`Socio ${member.name} oculto de la lista (borrado lógico)`, 'info');
}

function populatePricesInAdminForm() {
  document.getElementById('priceVisita').value = appState.prices.visita;
  document.getElementById('priceSemanal').value = appState.prices.semanal;
  document.getElementById('priceMensual').value = appState.prices.mensual;
  document.getElementById('priceAnual').value = appState.prices.anual;
}

function handlePricesSubmit(e) {
  e.preventDefault();
  if (appState.role !== 'admin') {
    showToast('Acceso Denegado', 'error'); return;
  }
  appState.prices = {
    visita: parseFloat(document.getElementById('priceVisita').value) || 0,
    semanal: parseFloat(document.getElementById('priceSemanal').value) || 0,
    mensual: parseFloat(document.getElementById('priceMensual').value) || 0,
    anual: parseFloat(document.getElementById('priceAnual').value) || 0
  };
  savePricesToStorage();
  updateRegistrationEndDatePreview();
  showToast('Nuevos precios de membresías guardados', 'success');
}

function updateAdminMetrics() {
  const totalRevenue = appState.transactions.reduce((sum, t) => sum + t.amount, 0);
  const activeCount = appState.members.filter(m => getMemberTrafficStatus(m).status !== 'red').length;
  const ratio = appState.members.length > 0 ? Math.round((activeCount / appState.members.length) * 100) : 0;
  
  document.getElementById('metricTotalMembers').textContent = appState.members.length;
  document.getElementById('metricTotalRevenue').textContent = formatCurrency(totalRevenue);
  document.getElementById('metricActiveRatio').textContent = `${ratio}%`;
}

function updateTimeDisplay() {
  const el = document.getElementById('currentTimeDisplay');
  if (el) el.textContent = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function setupEventListeners() {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab'))));
  
  // Minuta Item 5: Alternancia de roles en dashboard con modal para rol Admin
  document.getElementById('roleSelect')?.addEventListener('change', (e) => {
    const targetRole = e.target.value;
    if (targetRole === 'admin') {
      if (appState.user?.rol === 'ADMIN' || appState.role === 'admin') {
        setRole('admin');
      } else {
        e.target.value = appState.role;
        openAdminAuthModal();
      }
    } else {
      setRole('recepcionista');
    }
  });

  // Modal de autenticación para cambiar a Admin
  document.getElementById('btnCloseAdminAuth')?.addEventListener('click', closeAdminAuthModal);
  document.getElementById('btnCancelAdminAuth')?.addEventListener('click', closeAdminAuthModal);
  document.getElementById('adminAuthForm')?.addEventListener('submit', handleAdminAuthSubmit);
  document.getElementById('btnToggleAdminAuthPassword')?.addEventListener('click', () => {
    const p = document.getElementById('adminAuthPasswordInput');
    if (p) p.type = p.type === 'password' ? 'text' : 'password';
  });
  
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value;
      if (clearSearchBtn) clearSearchBtn.style.display = appState.searchQuery ? 'flex' : 'none';
      renderMembersTable();
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        appState.searchQuery = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        renderMembersTable();
        searchInput.blur();
      }
    });
  }
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = ''; appState.searchQuery = ''; clearSearchBtn.style.display = 'none';
      renderMembersTable(); searchInput.focus();
    });
  }

  // Atajo de teclado para hora pico: presionar '/' o 'Ctrl+K' para buscar instantáneamente
  document.addEventListener('keydown', (e) => {
    if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      switchTab('dashboard');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });

  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      appState.activeFilter = pill.getAttribute('data-filter');
      renderMembersTable();
    });
  });

  document.getElementById('btnQuickRegister')?.addEventListener('click', () => { switchTab('socios'); setTimeout(() => document.getElementById('memberName')?.focus(), 100); });
  document.getElementById('filterCardActivos')?.addEventListener('click', () => selectFilterPill('green'));
  document.getElementById('filterCardPorVencer')?.addEventListener('click', () => selectFilterPill('yellow'));
  document.getElementById('filterCardVencidos')?.addEventListener('click', () => selectFilterPill('red'));
  document.getElementById('goToCajaCard')?.addEventListener('click', () => switchTab('corte'));
  document.getElementById('btnResetFilters')?.addEventListener('click', () => { if(searchInput) searchInput.value = ''; appState.searchQuery = ''; selectFilterPill('all'); });
  document.getElementById('memberPassType')?.addEventListener('change', updateRegistrationEndDatePreview);
  // Minuta Item 7: cobro obligatorio - immediatePayOptions siempre visible
  const immediatePayOpts = document.getElementById('immediatePayOptions');
  if (immediatePayOpts) immediatePayOpts.style.display = 'block';

  document.getElementById('memberRegisterForm')?.addEventListener('submit', handleMemberRegisterSubmit);
  document.getElementById('btnCancelRegister')?.addEventListener('click', () => switchTab('dashboard'));
  document.getElementById('payPassType')?.addEventListener('change', updatePaymentModalCalculations);
  document.getElementById('paymentForm')?.addEventListener('submit', handlePaymentSubmit);

  // Requerimiento 3.1: Habilitar botón de confirmación en cobro rápido al seleccionar Efectivo o Transferencia
  document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        updatePaymentMethodState(e.target.value);
      }
    });
  });

  const paymentSelectorContainer = document.getElementById('paymentMethodSelector');
  if (paymentSelectorContainer) {
    paymentSelectorContainer.addEventListener('click', () => {
      const activeRadio = document.querySelector('input[name="payMethod"]:checked');
      if (activeRadio) {
        updatePaymentMethodState(activeRadio.value);
      }
    });
  }

  document.getElementById('closePaymentModal')?.addEventListener('click', () => {
    document.getElementById('paymentModal').classList.remove('active');
    resetPaymentMethodSelection();
  });
  document.getElementById('btnCancelPayment')?.addEventListener('click', () => {
    document.getElementById('paymentModal').classList.remove('active');
    resetPaymentMethodSelection();
  });
  document.getElementById('closeTicketModal')?.addEventListener('click', () => document.getElementById('ticketModal').classList.remove('active'));
  document.getElementById('btnCloseTicket')?.addEventListener('click', () => document.getElementById('ticketModal').classList.remove('active'));
  document.getElementById('btnPrintReceipt')?.addEventListener('click', () => window.print());
  document.getElementById('corteDateFilter')?.addEventListener('change', renderCorteView);
  document.getElementById('btnPrintCorte')?.addEventListener('click', () => window.print());
  document.getElementById('pricesForm')?.addEventListener('submit', handlePricesSubmit);
  document.getElementById('btnLoadSampleData')?.addEventListener('click', async () => { if (await refreshMembers()) showToast('Datos sincronizados con el backend', 'success'); });
  document.getElementById('btnClearAllData')?.addEventListener('click', () => { if(confirm('¿Limpiar el historial local de tickets? No toca los datos del backend.')) { appState.transactions=[]; saveTransactionsToStorage(); updateTodayStats(getTodayString); renderCorteView(); showToast('Historial local de tickets limpiado', 'info'); }});

  // Módulo de Autenticación Principal
  document.getElementById('loginForm')?.addEventListener('submit', handleLoginSubmit);
  document.getElementById('btnLogout')?.addEventListener('click', handleLogout);

  // Estados visuales reactivos en campo de usuario/correo
  const usernameInput = document.getElementById('loginUsername');
  const groupLoginIdentifier = document.getElementById('groupLoginIdentifier');
  const statusIcon = document.getElementById('loginUsernameStatus');
  if (usernameInput) {
    usernameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (!val) {
        groupLoginIdentifier?.classList.remove('is-valid', 'is-invalid');
        if (statusIcon) statusIcon.innerHTML = '';
      } else if (val.includes('@') && val.includes('.') && val.length > 5) {
        groupLoginIdentifier?.classList.remove('is-invalid');
        groupLoginIdentifier?.classList.add('is-valid');
        if (statusIcon) {
          statusIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        }
      }
    });
  }

  // Navegación entre pasos de recuperación de contraseña (Figma)
  document.getElementById('btnGoToForgot')?.addEventListener('click', () => showAuthStep('forgot'));
  document.getElementById('btnCloseForgot')?.addEventListener('click', () => showAuthStep('login'));
  document.getElementById('btnBackToLoginFromForgot')?.addEventListener('click', () => showAuthStep('login'));
  document.getElementById('forgotForm')?.addEventListener('submit', handleForgotSubmit);

  document.getElementById('btnCloseReset')?.addEventListener('click', () => showAuthStep('login'));
  document.getElementById('btnBackToLoginFromReset')?.addEventListener('click', () => showAuthStep('login'));
  document.getElementById('resetForm')?.addEventListener('submit', handleResetSubmit);

  document.getElementById('btnCloseSuccess')?.addEventListener('click', () => showAuthStep('login'));
  document.getElementById('btnBackToLoginSuccess')?.addEventListener('click', () => showAuthStep('login'));

  // Mostrar u ocultar contraseña
  document.getElementById('btnTogglePassword')?.addEventListener('click', () => {
    const passInput = document.getElementById('loginPassword');
    const eyeOpen = document.getElementById('eyeIconOpen');
    const eyeClosed = document.getElementById('eyeIconClosed');
    if (!passInput) return;
    const isPass = passInput.type === 'password';
    passInput.type = isPass ? 'text' : 'password';
    if (eyeOpen) eyeOpen.style.display = isPass ? 'none' : 'block';
    if (eyeClosed) eyeClosed.style.display = isPass ? 'block' : 'none';
  });

  document.getElementById('btnToggleResetNew')?.addEventListener('click', () => {
    const inp = document.getElementById('resetNewPassword');
    if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('btnToggleResetConfirm')?.addEventListener('click', () => {
    const inp = document.getElementById('resetConfirmPassword');
    if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  // Feedback en tiempo real para la contraseña (Minuta QA: mínimo 6 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial)
  const loginPassInput = document.getElementById('loginPassword');
  const rulesPanel = document.getElementById('passwordRulesPanel');
  if (loginPassInput && rulesPanel) {
    const updateRuleIndicator = (elId, passed) => {
      const el = document.getElementById(elId);
      if (!el) return;
      const icon = el.querySelector('.rule-icon');
      if (passed) {
        el.style.color = '#16a34a'; // Verde éxito
        el.style.fontWeight = '600';
        if (icon) icon.textContent = '✅';
      } else {
        el.style.color = '#94a3b8'; // Gris por defecto
        el.style.fontWeight = 'normal';
        if (icon) icon.textContent = '⚪';
      }
    };

    loginPassInput.addEventListener('focus', () => {
      rulesPanel.style.display = 'block';
    });

    loginPassInput.addEventListener('input', () => {
      const val = loginPassInput.value;
      if (val.length > 0) {
        rulesPanel.style.display = 'block';
      }
      updateRuleIndicator('ruleLength', val.length >= 6);
      updateRuleIndicator('ruleUpper', /[A-Z]/.test(val));
      updateRuleIndicator('ruleLower', /[a-z]/.test(val));
      updateRuleIndicator('ruleNumber', /[0-9]/.test(val));
      updateRuleIndicator('ruleSpecial', /[^A-Za-z0-9]/.test(val));
    });

    loginPassInput.addEventListener('blur', () => {
      if (!loginPassInput.value) {
        rulesPanel.style.display = 'none';
      }
    });
  }
}

function selectFilterPill(filterName) {
  if (appState.activeFilter === filterName) {
    appState.activeFilter = 'all';
  } else {
    appState.activeFilter = filterName;
  }
  document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active-card'));
  if (appState.activeFilter !== 'all') {
    const cardMap = { green: 'filterCardActivos', yellow: 'filterCardPorVencer', red: 'filterCardVencidos' };
    const activeEl = document.getElementById(cardMap[appState.activeFilter]);
    if (activeEl) activeEl.classList.add('active-card');
  }
  renderMembersTable();
}

document.addEventListener('DOMContentLoaded', initApp);
