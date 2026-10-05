import { getDateOffset, getTodayString } from './utils.js';

const STORAGE_KEYS = {
  MEMBERS: 'powergym_members',
  TRANSACTIONS: 'powergym_transactions',
  PRICES: 'powergym_prices',
  CURRENT_ROLE: 'powergym_current_role'
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

// Semilla de demostración
const SEED_MEMBERS = [
  { id: 'MEM-001', name: 'Carlos Mendoza Ruiz', phone: '5541982341', passType: 'mensual', startDate: getDateOffset(-10), endDate: getDateOffset(20), status: 'active' },
  { id: 'MEM-002', name: 'Mariana Silva Torres', phone: '5512789045', passType: 'mensual', startDate: getDateOffset(-28), endDate: getDateOffset(2), status: 'active' },
  { id: 'MEM-003', name: 'Rodrigo Vega Gómez', phone: '5567891234', passType: 'visita', startDate: getDateOffset(-2), endDate: getDateOffset(-1), status: 'expired' },
  { id: 'MEM-004', name: 'Laura Hernández Peña', phone: '5578123456', passType: 'semanal', startDate: getDateOffset(-6), endDate: getDateOffset(1), status: 'active' },
  { id: 'MEM-005', name: 'Alejandro Cruz Mora', phone: '5589012345', passType: 'anual', startDate: getDateOffset(-60), endDate: getDateOffset(305), status: 'active' },
  { id: 'MEM-006', name: 'Sofía Castro Morales', phone: '5534567890', passType: 'mensual', startDate: getDateOffset(-40), endDate: getDateOffset(-10), status: 'expired' }
];

export const appState = {
  role: 'recepcionista', // 'recepcionista' | 'admin'
  prices: { ...DEFAULT_PRICES },
  members: [],
  transactions: [],
  activeFilter: 'all',
  searchQuery: ''
};

export function loadDataFromStorage() {
  const storedPrices = localStorage.getItem(STORAGE_KEYS.PRICES);
  if (storedPrices) {
    try { appState.prices = JSON.parse(storedPrices); } catch (e) { appState.prices = { ...DEFAULT_PRICES }; }
  } else {
    appState.prices = { ...DEFAULT_PRICES };
    localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(appState.prices));
  }

  const storedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
  if (storedMembers) {
    try { appState.members = JSON.parse(storedMembers); } catch (e) { appState.members = [...SEED_MEMBERS]; }
  } else {
    appState.members = [...SEED_MEMBERS];
    saveMembersToStorage();
  }

  const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (storedTransactions) {
    try { appState.transactions = JSON.parse(storedTransactions); } catch (e) { appState.transactions = []; }
  } else {
    seedInitialTransactions();
  }

  const storedRole = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE);
  if (storedRole) {
    appState.role = storedRole;
  }
}

export function saveMembersToStorage() {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(appState.members));
}

export function saveTransactionsToStorage() {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(appState.transactions));
}

export function savePricesToStorage() {
  localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(appState.prices));
}

export function seedInitialTransactions() {
  const today = getTodayString();
  appState.transactions = [
    {
      id: 'TKT-1001',
      memberId: 'MEM-001',
      memberName: 'Carlos Mendoza Ruiz',
      memberPhone: '5541982341',
      passType: 'mensual',
      passName: 'Pase Mensual (30 Días)',
      amount: appState.prices.mensual,
      paymentMethod: 'efectivo',
      date: today,
      time: '08:30',
      expirationDate: getDateOffset(20),
      cashier: 'Recepcionista'
    },
    {
      id: 'TKT-1002',
      memberId: 'MEM-004',
      memberName: 'Laura Hernández Peña',
      memberPhone: '5578123456',
      passType: 'semanal',
      passName: 'Pase Semanal (7 Días)',
      amount: appState.prices.semanal,
      paymentMethod: 'transferencia',
      date: today,
      time: '09:15',
      expirationDate: getDateOffset(1),
      cashier: 'Recepcionista'
    }
  ];
  saveTransactionsToStorage();
}

export function resetSeedData() {
  appState.members = [...SEED_MEMBERS];
  saveMembersToStorage();
  seedInitialTransactions();
}

export function getMemberTrafficStatus(member) {
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
