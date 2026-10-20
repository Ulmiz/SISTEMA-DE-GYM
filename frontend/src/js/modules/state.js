const STORAGE_KEYS = {
  MEMBERS_CACHE: 'powergym_members', // respaldo de la última lectura exitosa del backend
  TRANSACTIONS: 'powergym_transactions', // ledger local de tickets emitidos
  PRICES: 'powergym_prices',
  CURRENT_ROLE: 'powergym_current_role',
  PENDING_PAYMENTS: 'powergym_pending_payments', // socios dados de alta sin liquidar
  HIDDEN_MEMBERS: 'powergym_hidden_members', // borrado lógico (ocultos de la vista)
  AUTH_TOKEN: 'powergym_auth_token', // JWT de sesión
  AUTH_USER: 'powergym_auth_user', // datos del usuario autenticado
};

export const DEFAULT_PRICES = {
  visita: 50,
  semanal: 180,
  mensual: 500,
  anual: 4500
};

export const PASS_DURATIONS = {
  visita: 1,
  semanal: 7,
  mensual: 30,
  anual: 365
};

export const PASS_NAMES = {
  visita: 'Visita (1 Día)',
  semanal: 'Pase Semanal (7 Días)',
  mensual: 'Pase Mensual (30 Días)',
  anual: 'Pase Anual (365 Días)'
};

export const appState = {
  role: 'recepcionista', // 'recepcionista' | 'admin'
  user: null, // { id, username, nombre, rol }
  token: null, // JWT activo
  prices: { ...DEFAULT_PRICES },
  members: [], // siempre desde el backend (GET /api/socios)
  transactions: [], // tickets emitidos por cobros reales (la API no expone el historial)
  pendingPaymentIds: [],
  hiddenMemberIds: [],
  activeFilter: 'all',
  searchQuery: '',
  backendOnline: false
};

function normalizeId(id) {
  return String(id);
}

function readJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw);
    return value ?? fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Autenticación y Persistencia de Sesión (localStorage + cookies) -------

export function getCookie(name) {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export function setCookie(name, value, days = 7) {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Strict`;
}

export function removeCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Strict`;
}

export function getAuthToken() {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) return token;
  return getCookie(STORAGE_KEYS.AUTH_TOKEN);
}

export function getAuthUser() {
  return readJson(STORAGE_KEYS.AUTH_USER, null);
}

export function saveSession(token, usuario) {
  appState.token = token;
  appState.user = usuario;

  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  writeJson(STORAGE_KEYS.AUTH_USER, usuario);
  setCookie(STORAGE_KEYS.AUTH_TOKEN, token, 7);

  if (usuario && usuario.rol) {
    const mappedRole = String(usuario.rol).toLowerCase() === 'admin' ? 'admin' : 'recepcionista';
    appState.role = mappedRole;
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, mappedRole);
  }
}

export function clearSession() {
  appState.token = null;
  appState.user = null;

  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  removeCookie(STORAGE_KEYS.AUTH_TOKEN);
}

export function isAuthenticated() {
  return Boolean(appState.token || getAuthToken());
}

export function loadDataFromStorage() {
  appState.token = getAuthToken();
  appState.user = getAuthUser();

  const storedPrices = localStorage.getItem(STORAGE_KEYS.PRICES);
  if (storedPrices) {
    try { appState.prices = JSON.parse(storedPrices); } catch (e) { appState.prices = { ...DEFAULT_PRICES }; }
  } else {
    appState.prices = { ...DEFAULT_PRICES };
    writeJson(STORAGE_KEYS.PRICES, appState.prices);
  }

  appState.transactions = readJson(STORAGE_KEYS.TRANSACTIONS, []);
  appState.pendingPaymentIds = readJson(STORAGE_KEYS.PENDING_PAYMENTS, []);
  appState.hiddenMemberIds = readJson(STORAGE_KEYS.HIDDEN_MEMBERS, []);
  appState.members = loadMembersCache();

  if (appState.user && appState.user.rol) {
    appState.role = String(appState.user.rol).toLowerCase() === 'admin' ? 'admin' : 'recepcionista';
  } else {
    const storedRole = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE);
    if (storedRole) {
      appState.role = storedRole;
    }
  }
}

// --- Socios ---------------------------------------------------------------

export function loadMembersCache() {
  return readJson(STORAGE_KEYS.MEMBERS_CACHE, []);
}

export function saveMembersCache(members) {
  writeJson(STORAGE_KEYS.MEMBERS_CACHE, members);
}

// --- Cobros / tickets -----------------------------------------------------

export function saveTransactionsToStorage() {
  writeJson(STORAGE_KEYS.TRANSACTIONS, appState.transactions);
}

export function savePricesToStorage() {
  writeJson(STORAGE_KEYS.PRICES, appState.prices);
}

export function addTransaction(transaction) {
  const existe = appState.transactions.some(t => t.id === transaction.id);
  if (existe) return false;
  appState.transactions.unshift(transaction);
  saveTransactionsToStorage();
  return true;
}

// --- Borrado lógico (Requerimiento 14: ocultar sin borrar el registro) ----

export function isHiddenMember(id) {
  return appState.hiddenMemberIds.map(normalizeId).includes(normalizeId(id));
}

export function hideMember(id) {
  const normalizado = normalizeId(id);
  if (isHiddenMember(normalizado)) return;
  appState.hiddenMemberIds.push(normalizado);
  writeJson(STORAGE_KEYS.HIDDEN_MEMBERS, appState.hiddenMemberIds);
}

// --- Socios dados de alta sin liquidar (acceso bloqueado hasta pagar) -----

export function isPendingPayment(id) {
  return appState.pendingPaymentIds.map(normalizeId).includes(normalizeId(id));
}

export function setPendingPayment(id, pending) {
  const normalizado = normalizeId(id);
  const resto = appState.pendingPaymentIds.filter(i => normalizeId(i) !== normalizado);
  appState.pendingPaymentIds = pending ? [...resto, normalizado] : resto;
  writeJson(STORAGE_KEYS.PENDING_PAYMENTS, appState.pendingPaymentIds);
}

export function getMemberTrafficStatus(member) {
  // Requerimiento 5: sin liquidar = bloqueo de entrada, aunque la vigencia en el backend sea futura.
  if (isPendingPayment(member.id)) {
    return { status: 'red', label: '⛔ Acceso Bloqueado', daysLeft: -999, daysText: 'Pase sin liquidar' };
  }

  if (!member.endDate) {
    return { status: 'red', label: '⛔ Acceso Bloqueado', daysLeft: -999, daysText: 'Sin Pase / Vencido' };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = member.endDate.split('-').map(Number);
  const endDate = new Date(year, month - 1, day, 23, 59, 59);

  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Requerimiento 5: Bloqueo de entrada hasta liquidar pase
    return {
      status: 'red',
      label: '⛔ Acceso Bloqueado',
      daysLeft: diffDays,
      daysText: `Venció hace ${Math.abs(diffDays)} d`
    };
  } else if (diffDays <= 2) {
    // Requerimiento 4: Semáforo preventivo amarillo a 2 días de anticipación
    return {
      status: 'yellow',
      label: '⚠️ Por Vencer (≤2d)',
      daysLeft: diffDays,
      daysText: diffDays === 0 ? '¡Vence Hoy!' : `${diffDays} día(s) restante(s)`
    };
  } else {
    return {
      status: 'green',
      label: '✅ Acceso Permitido',
      daysLeft: diffDays,
      daysText: `${diffDays} días restantes`
    };
  }
}
