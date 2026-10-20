// Cliente HTTP del backend Node/Express (proyecto ../gym-backend).
// Endpoints consumidos:
//   GET  /api/socios            -> listado de socios con estatus calculado
//   POST /api/socios            -> alta de socio (409 si el teléfono ya existe)
//   POST /api/socios/:id/cobrar -> pago + renovación de vigencia
import { formatDateToISO } from './utils.js';
import { getAuthToken } from './state.js';

// Backend por defecto; los tests pueden sobreescribirlo con globalThis.__GYM_API_URL__.
const API_URL = globalThis.__GYM_API_URL__ || 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // 0 = sin conexión con el backend
  }
}

async function request(path, { method = 'GET', body, requiresAuth = true } = {}) {
  let response;
  const headers = {};
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el backend. Verifica que esté corriendo en http://localhost:3000', 0);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError((data && data.error) || `Error ${response.status} del servidor`, response.status);
  }
  return data;
}

// Fechas del backend en ISO UTC -> 'YYYY-MM-DD' local para el front.
function toLocalDate(iso) {
  if (!iso) return '';
  return formatDateToISO(new Date(iso));
}

function toLocalTime(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Forma del backend (nombre/telefono/tipoPase/monto...ES) -> forma del front (name/phone/passType...).
export function mapSocioToMember(socio) {
  return {
    id: socio.id,
    name: socio.nombre,
    phone: socio.telefono,
    passType: String(socio.tipoPase || '').toLowerCase(),
    startDate: toLocalDate(socio.fechaInicio),
    endDate: toLocalDate(socio.fechaVencimiento),
    status: socio.estatusColor === 'rojo' ? 'expired' : 'active',
    estatusColor: socio.estatusColor,
    diasRestantes: socio.diasRestantes,
  };
}

export function mapPago(pago) {
  return {
    id: pago.id,
    socioId: pago.socioId,
    amount: pago.monto,
    paymentMethod: String(pago.metodoPago || '').toLowerCase(),
    date: toLocalDate(pago.fechaPago),
    time: toLocalTime(pago.fechaPago),
  };
}

export const api = {
  getMembers: async () => {
    const socios = await request('/socios');
    return (Array.isArray(socios) ? socios : []).map(mapSocioToMember);
  },

  createMember: async ({ name, phone, passType }) => {
    const socio = await request('/socios', {
      method: 'POST',
      body: {
        nombre: name,
        telefono: phone,
        tipoPase: String(passType).toUpperCase(),
      },
    });
    return mapSocioToMember(socio);
  },

  // Registra el pago y renueva la vigencia desde la fecha de cobro.
  chargeMember: async (memberId, { amount, paymentMethod, passType }) => {
    const body = {
      monto: amount,
      metodoPago: String(paymentMethod).toUpperCase(),
    };
    if (passType) {
      body.tipoPase = String(passType).toUpperCase();
    }
    const data = await request(`/socios/${memberId}/cobrar`, {
      method: 'POST',
      body,
    });
    return {
      member: mapSocioToMember(data.socio),
      payment: mapPago(data.pago),
      mensaje: data.mensaje,
    };
  },

  // Autenticación: Inicio de sesión con username y password
  login: async ({ username, password }) => {
    return await request('/auth/login', {
      method: 'POST',
      body: { username, password },
      requiresAuth: false,
    });
  },

  // Obtiene los datos del usuario logueado usando el token Bearer
  getMe: async () => {
    return await request('/auth/me', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  // Registro de nuevo usuario (para administración)
  registerUser: async ({ nombre, username, password, rol }) => {
    return await request('/auth/register', {
      method: 'POST',
      body: { nombre, username, password, rol },
      requiresAuth: true,
    });
  },

  // Solicitar recuperación de contraseña (envía enlace/token)
  recuperarPassword: async ({ email }) => {
    return await request('/auth/recuperar-password', {
      method: 'POST',
      body: { email },
      requiresAuth: false,
    });
  },

  // Confirmar y cambiar contraseña con token
  resetPassword: async ({ token, nuevaPassword, confirmarPassword }) => {
    return await request('/auth/reset-password', {
      method: 'POST',
      body: { token, nuevaPassword, confirmarPassword },
      requiresAuth: false,
    });
  },
};
