// Prueba de humo de la interfaz: monta frontend/public/index.html en jsdom,
// arranca el backend contra prisma/test.db (nunca toca prisma/dev.db) y ejerce
// los flujos reales: alta, cobro, semáforo, corte de caja y borrado lógico.
//
// Ejecutar con: npm test   (requiere que ../gym-backend tenga sus dependencias)
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

const candidateDirs = [
  path.resolve(fileURLToPath(new URL('../../sistema-Gym-Backend/', import.meta.url))),
  path.resolve('C:/Users/princ/OneDrive/Documentos/SYSTEM GYM/sistema-Gym-Backend'),
  path.resolve(fileURLToPath(new URL('../../../sistema-Gym-Backend/', import.meta.url))),
  path.resolve(fileURLToPath(new URL('../../../gym-backend/', import.meta.url))),
];
const BACKEND_DIR = candidateDirs.find(d => existsSync(d)) || candidateDirs[0];
const INDEX_HTML = fileURLToPath(new URL('../public/index.html', import.meta.url));

let failed = 0;
const ok = (cond, msg) => {
  if (cond) console.log('  ok   -', msg);
  else { failed = 1; console.error('  FALLO -', msg); }
};
const until = async (fn, ms = 4000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (fn()) return true;
    await new Promise((r) => setTimeout(r, 25));
  }
  return false;
};

if (!existsSync(BACKEND_DIR)) {
  console.error(`No se encontró el backend en ${BACKEND_DIR}`);
  process.exit(1);
}

// --- Base de datos de prueba (aislada) -------------------------------------
process.env.DATABASE_URL = 'file:./test.db';
const prismaCli = path.join(BACKEND_DIR, 'node_modules', 'prisma', 'build', 'index.js');
if (existsSync(prismaCli)) {
  execFileSync(process.execPath, [prismaCli, 'db', 'push', '--skip-generate', '--accept-data-loss'], {
    cwd: BACKEND_DIR,
    env: { ...process.env },
    stdio: 'pipe',
  });
}
const { default: prisma } = await import(pathToFileURL(path.join(BACKEND_DIR, 'src', 'prismaClient.js')).href);
const { default: bcrypt } = await import(pathToFileURL(path.join(BACKEND_DIR, 'node_modules', 'bcryptjs', 'index.js')).href);
await prisma.pago.deleteMany();
await prisma.socio.deleteMany();
await prisma.usuario.deleteMany();

// Sembrar cuentas fijas acordadas en la Minuta
const hashJahdiel = await bcrypt.hash('Jahdiel23?', 10);
const hashEduardo = await bcrypt.hash('Canuflax89.', 10);
await prisma.usuario.createMany({
  data: [
    { nombre: 'Jahdiel Tzec', username: 'jahdieltzec914@gmail.com', password: hashJahdiel, rol: 'RECEPCIONISTA' },
    { nombre: 'Eduardo Rios', username: 'Eduardo@hotmail.com', password: hashEduardo, rol: 'ADMIN' },
  ],
});
await prisma.$disconnect();

// --- Arranque del backend en un puerto libre -------------------------------
async function startBackend() {
  for (const port of [3999, 4011, 4023, 4037, 4049]) {
    const child = spawn(process.execPath, ['src/index.js'], {
      cwd: BACKEND_DIR,
      env: { ...process.env, DATABASE_URL: 'file:./test.db', PORT: String(port) },
      stdio: 'ignore',
    });
    let ready = false;
    for (let i = 0; i < 40 && !ready; i++) {
      if (child.exitCode !== null) break;
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/socios`);
        ready = res.ok;
      } catch {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    if (ready) return { child, port };
    child.kill();
  }
  throw new Error('No se pudo arrancar el backend en ningún puerto de prueba');
}

const { child, port } = await startBackend();
globalThis.__GYM_API_URL__ = `http://127.0.0.1:${port}/api`;

// --- DOM -------------------------------------------------------------------
const dom = new JSDOM(readFileSync(INDEX_HTML, 'utf8'), {
  url: 'http://localhost:8080/',
  pretendToBeVisual: true,
  runScripts: 'outside-only',
});
const { window } = dom;
globalThis.window = window;
globalThis.document = window.document;
globalThis.localStorage = window.localStorage;
globalThis.confirm = () => true;
window.confirm = () => true;
window.print = () => {};

// app.js se registra en DOMContentLoaded cuando el evento ya pasó: lo capturamos.
const domReady = [];
const originalAdd = window.document.addEventListener.bind(window.document);
window.document.addEventListener = (type, listener, opts) => {
  if (type === 'DOMContentLoaded') { domReady.push(listener); return; }
  return originalAdd(type, listener, opts);
};

const { appState } = await import('../src/js/modules/state.js');
await import('../src/js/app.js');
for (const listener of domReady) await listener();

const $ = (id) => window.document.getElementById(id);
const submit = (formId) => $(formId).dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
const rows = () => window.document.querySelectorAll('#membersTableBody tr');
const toasts = () => [...window.document.querySelectorAll('.toast')].map((t) => t.textContent);
const apiJson = async (p) => (await fetch(`${globalThis.__GYM_API_URL__}${p}`)).json();
const fecha = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// El backend guarda en UTC: para comparar con lo que ve el usuario hay que pasar a local.
const fechaLocal = (iso) => fecha(new Date(iso));
function pad(n) { return String(n).padStart(2, '0'); }
function diasDesdeHoy(n) { const d = new Date(); d.setDate(d.getDate() + n); return fecha(d); }
function limpiarBusqueda() {
  $('searchInput').value = '';
  $('searchInput').dispatchEvent(new window.Event('input', { bubbles: true }));
}

console.log('0) integración de login: conexión con backend, persistencia y redirección automática');
ok($('loginWrapper') !== null, 'el formulario de autenticación se monta en el DOM');
ok($('appMain').style.display === 'none', 'el panel operativo está oculto antes de iniciar sesión');
$('loginUsername').value = 'jahdieltzec914@gmail.com';
$('loginPassword').value = 'Jahdiel23?';
submit('loginForm');
ok(await until(() => $('appMain').style.display === 'block'), 'redirección automática al panel operativo tras inicio exitoso');
ok(appState.token !== null, 'token de sesión JWT guardado correctamente');
ok($('loginWrapper').parentElement.style.display === 'none' || $('loginContainer').style.display === 'none', 'formulario de login oculto tras autenticación');

console.log('1) arranque con backend vacío');
ok(rows().length === 0, 'la tabla arranca sin socios');
ok($('emptyState').style.display === 'block', 'se muestra el estado vacío');

console.log('2) alta de socio con cobro inmediato');
$('memberName').value = 'María de la Cruz';
$('memberPhone').value = '5511112222';
$('memberPassType').value = 'mensual';
$('checkPayNow').checked = true;
submit('memberRegisterForm');
ok(await until(() => $('ticketModal').classList.contains('active')), 'se emite el ticket del cobro');
ok($('tktMemberName').textContent === 'María de la Cruz', 'el ticket muestra el socio real');
ok($('tktAmount').textContent.includes('500'), `el ticket muestra el monto real (${$('tktAmount').textContent})`);
ok(await until(() => rows().length === 1), 'el socio aparece en la tabla');
const remotos = await apiJson('/socios');
ok(remotos.length === 1 && remotos[0].nombre === 'María de la Cruz', 'el socio existe en el backend');
ok(fechaLocal(remotos[0].fechaVencimiento) === diasDesdeHoy(30),
  `vigencia real en el backend: ${fechaLocal(remotos[0].fechaVencimiento)} == hoy + 30`);
ok(appState.transactions.length === 1 && appState.transactions[0].id.startsWith('TKT-'), `ticket registrado (${appState.transactions[0].id})`);

console.log('3) teléfono duplicado bloqueado (Requerimiento 2)');
$('btnCloseTicket').click();
$('memberName').value = 'Impostor';
$('memberPhone').value = '5511112222';
submit('memberRegisterForm');
await until(() => toasts().some((t) => t.includes('ya pertenece')));
ok(toasts().some((t) => t.includes('ya pertenece')), 'la alerta indica que el teléfono ya pertenece a otro socio');
ok((await apiJson('/socios')).length === 1, 'no se creó un duplicado en el backend');

console.log('4) alta sin pago = acceso bloqueado (Requerimiento 5)');
limpiarBusqueda(); // la alerta del duplicado dejó el buscador con el teléfono filtrado
$('memberRegisterForm').reset();
$('memberName').value = 'Pedro Pendiente';
$('memberPhone').value = '5533334444';
$('memberPassType').value = 'semanal';
$('checkPayNow').checked = false;
submit('memberRegisterForm');
ok(await until(() => rows().length === 2), 'el socio pendiente aparece en la tabla');
const filaPedro = [...rows()].find((tr) => tr.textContent.includes('Pedro Pendiente'));
ok(filaPedro && filaPedro.textContent.includes('Pase sin liquidar'), 'queda en rojo: acceso bloqueado hasta liquidar');

console.log('5) cobro desde el modal (Requerimiento 1: reinicia desde el cobro)');
const pedro = (await apiJson('/socios')).find((s) => s.telefono === '5533334444');
window.openPaymentModal(pedro.id);
ok($('paymentModal').classList.contains('active'), 'el modal de cobro se abre');
ok($('payPassType').disabled === false && $('payPassType').value === 'semanal', 'el pase inicia con el vigente pero es modificable (Minuta Item 9)');
$('paymentForm').querySelector('input[name="payMethod"][value="transferencia"]').checked = true;
submit('paymentForm');
ok(await until(() => !$('paymentModal').classList.contains('active')), 'el cobro se procesa y cierra el modal');
ok(await until(() => $('ticketModal').classList.contains('active')), 'se emite el ticket de la renovación');
const trasCobro = (await apiJson('/socios')).find((s) => s.telefono === '5533334444');
ok(fechaLocal(trasCobro.fechaVencimiento) === diasDesdeHoy(7),
  `vigencia reiniciada desde hoy: ${fechaLocal(trasCobro.fechaVencimiento)} == hoy + 7`);
$('btnCloseTicket').click();
const filaPedro2 = [...rows()].find((tr) => tr.textContent.includes('Pedro Pendiente'));
ok(filaPedro2 && !filaPedro2.textContent.includes('Pase sin liquidar'), 'sale de estado pendiente tras pagar');
ok(appState.transactions.length === 2, 'hay 2 tickets reales registrados');

console.log('6) corte de caja con cobros reales');
window.switchTab('corte');
// 500 (mensual, efectivo) + 180 (semanal, transferencia) = 680
ok($('corteTotalAmount').textContent.includes('680'), `total del día real: ${$('corteTotalAmount').textContent}`);
ok($('corteTotalTransactions').textContent.startsWith('2'), `transacciones: ${$('corteTotalTransactions').textContent}`);
ok($('corteCashCount').textContent.startsWith('1') && $('corteTransferCount').textContent.startsWith('1'), 'desglose efectivo/transferencia: 1 y 1');
ok(window.document.querySelectorAll('#corteTableBody tr').length === 2, 'la bitácora lista los 2 cobros');
ok($('cortePassSemanalCount').textContent === '1' && $('cortePassMensualCount').textContent === '1', 'desglose por tipo de pase correcto');

console.log('7) buscador en tiempo real (Requerimiento 6)');
window.switchTab('dashboard');
await until(() => rows().length === 2);
$('searchInput').value = '5511';
$('searchInput').dispatchEvent(new window.Event('input', { bubbles: true }));
ok(rows().length === 1 && rows()[0].textContent.includes('María'), 'filtra por teléfono');
$('searchInput').value = '';
$('searchInput').dispatchEvent(new window.Event('input', { bubbles: true }));
ok(rows().length === 2, 'limpia el filtro');

console.log('8) borrado lógico por el dueño (Requerimiento 14 + Minuta Item 5 modal de admin)');
$('roleSelect').value = 'admin';
$('roleSelect').dispatchEvent(new window.Event('change', { bubbles: true }));
if ($('adminAuthModal')?.classList.contains('active')) {
  $('adminAuthPasswordInput').value = 'Canuflax89.';
  submit('adminAuthForm');
  await until(() => appState.role === 'admin');
}
window.handleDeleteMember(pedro.id);
ok(await until(() => rows().length === 1), 'el socio desaparece de la vista');
ok((await apiJson('/socios')).length === 2, 'el registro sigue existiendo en el backend');
window.switchTab('dashboard');
await until(() => rows().length === 1);
ok(rows().length === 1 && !rows()[0].textContent.includes('Pedro'), 'sigue oculto tras recargar desde el backend');

console.log('9) métricas del panel admin');
window.switchTab('admin');
ok($('metricTotalMembers').textContent === '1', `métrica de socios visibles: ${$('metricTotalMembers').textContent}`);

// --- Limpieza --------------------------------------------------------------
child.kill();
process.exit(failed);
