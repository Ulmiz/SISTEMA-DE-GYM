// Test unitario del Requerimiento 3.1:
// Modal emergente de cobro rápido con selección obligatoria de método de pago (Efectivo o Transferencia).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const INDEX_HTML = fileURLToPath(new URL('../public/index.html', import.meta.url));

let failed = 0;
const ok = (cond, msg) => {
  if (cond) console.log('  ok   -', msg);
  else { failed = 1; console.error('  FALLO -', msg); }
};

console.log('Iniciando validación del Requerimiento 3.1 (Modal de cobro rápido)...');

// Mock instantáneo de fetch para evitar timeouts de red cuando no hay backend levantado
globalThis.fetch = async () => ({
  ok: true,
  status: 200,
  json: async () => [],
});

const dom = new JSDOM(readFileSync(INDEX_HTML, 'utf8'), {
  url: 'http://localhost:8080/',
  pretendToBeVisual: true,
  runScripts: 'outside-only',
});

const { window } = dom;
globalThis.window = window;
globalThis.document = window.document;
globalThis.localStorage = window.localStorage;
window.fetch = globalThis.fetch;

const domReady = [];
const originalAdd = window.document.addEventListener.bind(window.document);
window.document.addEventListener = (type, listener, opts) => {
  if (type === 'DOMContentLoaded') { domReady.push(listener); return; }
  return originalAdd(type, listener, opts);
};

const { appState } = await import('../src/js/modules/state.js');
await import('../src/js/app.js');
for (const listener of domReady) await listener();

// Mock de un socio registrado
appState.members = [
  {
    id: 'socio-301',
    name: 'Jadhiel Gym',
    phone: '5599887766',
    passType: 'mensual',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
  }
];

const $ = (id) => window.document.getElementById(id);
const getCheckedRadio = () => window.document.querySelector('input[name="payMethod"]:checked');

console.log('\n1) Al abrir el modal, ningún método debe estar marcado y el botón debe estar deshabilitado:');
window.openPaymentModal('socio-301');
ok($('paymentModal').classList.contains('active'), 'el modal de cobro rápido se abrió');
ok(getCheckedRadio() === null, 'ningún radio está seleccionado por defecto (obliga a elegir)');
ok($('btnConfirmPayment').disabled === true, 'el botón de confirmación inicia DESHABILITADO');
ok($('payMethodBadge').textContent.trim() === 'Selección obligatoria', 'el badge indica selección obligatoria');
ok($('payMethodBadge').classList.contains('pending'), 'badge tiene estilo pending');
ok($('paySelectionNotice').classList.contains('pending'), 'aviso de ayuda tiene estilo pending');

console.log('\n2) Al seleccionar Efectivo, el botón de confirmar se habilita inmediatamente:');
const cashRadio = window.document.querySelector('input[name="payMethod"][value="efectivo"]');
cashRadio.checked = true;
cashRadio.dispatchEvent(new window.Event('change', { bubbles: true }));
ok(getCheckedRadio()?.value === 'efectivo', 'Efectivo está marcado');
ok($('btnConfirmPayment').disabled === false, 'el botón de confirmar se HABILITÓ');
ok($('payMethodBadge').textContent.includes('Efectivo'), 'el badge muestra que Efectivo fue seleccionado');
ok($('payMethodBadge').classList.contains('selected'), 'el badge tiene estilo selected');
ok($('paySelectionNotice').classList.contains('ready'), 'el aviso tiene estilo ready');

console.log('\n3) Al seleccionar Transferencia, el botón sigue habilitado con los datos correspondientes:');
const transferRadio = window.document.querySelector('input[name="payMethod"][value="transferencia"]');
transferRadio.checked = true;
transferRadio.dispatchEvent(new window.Event('change', { bubbles: true }));
ok(getCheckedRadio()?.value === 'transferencia', 'Transferencia está marcada');
ok($('btnConfirmPayment').disabled === false, 'el botón de confirmar permanece habilitado');
ok($('payMethodBadge').textContent.includes('Transferencia'), 'el badge muestra Transferencia');
ok($('payMethodBadge').classList.contains('selected'), 'el badge mantiene estilo selected');

console.log('\n4) Al cerrar o cancelar y reabrir, se resetea la selección:');
$('btnCancelPayment').click();
ok(!$('paymentModal').classList.contains('active'), 'el modal se cierra con Cancelar');
window.openPaymentModal('socio-301');
ok(getCheckedRadio() === null, 'la selección se reseteó a vacío al reabrir');
ok($('btnConfirmPayment').disabled === true, 'el botón volvió a deshabilitarse para obligar a elegir nuevamente');

console.log('\n5) Intento de submit sin selección:');
window.resetPaymentMethodSelection();
$('paymentForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
ok($('paymentModal').classList.contains('active'), 'el formulario no procesó el cobro');
ok($('btnConfirmPayment').disabled === true, 'el botón sigue deshabilitado');

if (failed) {
  console.error('\n❌ Hubo fallas en las pruebas del requerimiento 3.1.');
  process.exit(1);
} else {
  console.log('\n✅ Todas las pruebas del Requerimiento 3.1 pasaron exitosamente.');
  process.exit(0);
}
