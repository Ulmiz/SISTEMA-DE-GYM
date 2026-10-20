# Resumen de integración Front ↔ Backend (para traspaso)

Fecha: 06/10/2026 · Ramas: `dev` (front) · backend en `../gym-backend`
Servidores: front `http://localhost:8081` (`npm run dev`) · back `http://localhost:3000` (`npm start`)

---

## 1. QUÉ EXISTE

### Backend (`../gym-backend`) — Express 5 + Prisma + SQLite
- **Modelos**: `Socio` (nombre, `telefono` **único**, fechaInicio, fechaVencimiento, tipoPase), `Pago` (monto, metodoPago, fechaPago), `Usuario` (sin usar), enums `TipoPase` (VISITA/SEMANAL/MENSUAL/ANUAL) y `MetodoPago` (EFECTIVO/TRANSFERENCIA).
- **Endpoints**:
  - `GET  /api/socios` → lista ordenada por vencimiento, con `estatusColor` y `diasRestantes`.
  - `POST /api/socios` → alta; la vigencia la calcula el servidor (fin de día + 1/7/30/365); teléfono repetido → **409**; ignora fechas del body.
  - `POST /api/socios/:id/cobrar` → registra `Pago` y renueva la vigencia.
  - `GET /api-docs` (Swagger) y `/api-docs.json`.
- **Regla de renovación (cambiada en esta integración)**: la vigencia **se reinicia desde la fecha de cobro** (hoy + días del pase), no acumula días a favor → igual que `requerimientos.md` Bloque 1 pregunta 1. Swagger y tests actualizados.
- **BDs**: `prisma/dev.db` (datos reales) y `prisma/test.db` (solo tests).
- **Scripts**: `npm start`, `npm run dev`, `npm test` (21 tests, `node:test`).

### Frontend (`frontend/`) — JavaScript vanilla (ES modules), sin build
- **Módulos**: `modules/api.js` (cliente HTTP real), `modules/state.js` (estado, caché, overlays), `modules/ui.js`, `modules/utils.js`; **componentes**: `Navbar`, `DashboardView`, `SociosView`, `CorteView`, `AdminView`, `PaymentModal`, `TicketModal`.
- **Vistas**: Recepción & Semáforo (buscador, filtros por color, contadores), Alta de socio (con/sin cobro), Corte de Caja (totales por método y pase + bitácora), Precios & Admin (precios, métricas, zona de mantenimiento).
- **Persistencia local (`localStorage`)**: precios del admin, rol, ledger de tickets, caché de la última lista de socios, listas de *pendientes de pago* y *ocultos*.
- **Herramientas**: `frontend/server.mjs` (servidor estático, `npm run dev`), `frontend/package.json` (`type: module`), `frontend/test/ui.smoke.mjs` (33 aserciones con jsdom), scripts `dev` / `test` / `test:backend` / `test:all`, `.gitignore`, devDep `jsdom`.

---

## 2. QUÉ FUNCIONA (verificado)

**Automatizado**
- `npm run test:all` → **interfaz 33/33 + API 21/21, exit 0**.
- Suite de interfaz: arranque vacío, alta con cobro (ticket con monto real y `TKT-<id>` del pago), duplicado 409, alta sin pago en rojo, cobro que reinicia vigencia (+7), corte $680 (500+180) con desglose, buscador, borrado lógico y métricas. Usa `test.db`, **nunca** `dev.db`.
- Suite de backend: validaciones 400/404/409, cálculo de vigencias, unicidad de teléfono en SQLite, orden del listado, cobro con reinicio (incluye pase vencido).
- **Navegador real (Edge headless)**: carga sin errores de consola ni recursos fallidos; con datos → 3 badges (verde/amarillo/rojo), contadores 1/1/1, *Desbloquear* ×1, *Renovar* ×2; con BD vacía → estado vacío correcto. CORS 8081 → 3000 OK.

**Manuales (en http://localhost:8081)**
- Alta real y persistente (sobrevive recarga: viene del backend) · semáforo de 3 colores · bloqueo "Pase sin liquidar" hasta pagar · renovación desde la fecha de cobro · alerta de teléfono duplicado que salta al buscador · corte de caja con los cobros hechos · borrado lógico por el dueño · precios locales del admin.

**Comandos de apoyo verificados**: seed por `curl` (3×201), backdate de vencimientos (ver amarillo/rojo), listado de pagos con Prisma, limpieza por teléfono (0 restantes).

---

## 3. QUÉ NO FUNCIONA / LO QUE FALTA

### Backend (sin endpoint o sin modelar)
- **No existe `GET /api/pagos`** → el histórico de caja no se puede leer desde la API.
- **No existe `DELETE /api/socios/:id`** ni borrado lógico en BD (campo `activo`).
- **No existe cambio de `tipoPase`** de un socio → no se puede "mejorar" de pase en un cobro.
- **No hay catálogo de precios**: el front envía el `monto` y el backend solo exige que sea > 0 (no valida tarifa oficial).
- **Autenticación implementada**: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` con JWT, tokens protegidos en `localStorage` y cookies, formulario de login interactivo y redirección automática al panel operativo (Requerimiento 15 completado).
- **La alta siempre otorga vigencia**: el modelo no representa "socio sin liquidar" (estado que el front simula en local).
- **Sin filtros/paginación/búsqueda** en la API (todo el filtrado es del cliente).
- **Discrepancias con `requerimientos.md`**: `VISITA` vence **mañana** (+1 día) en vez del cierre del día de hoy; `MENSUAL` es **+30 días naturales** en vez de "mismo día del mes siguiente"; `estatusColor` pinta amarillo a ≤3 días (el requisito y el front usan ≤2).

### Frontend (limitaciones conocidas)
- **Corte de Caja y "Caja Cobrada Hoy" dependen del ledger local** (`localStorage`): si cambias de equipo o limpias el storage, ese histórico no se reconstruye (los pagos quedan en la BD pero no hay endpoint para leerlos).
- **Borrado lógico local**: el socio sigue en la BD; reusar ese teléfono devolverá **409**.
- **Modal de cobro no permite cambiar el tipo de pase** (select deshabilitado) porque el backend renueva el pase vigente.
- Se eliminó el campo "Fecha de Inicio" (el backend lo ignora); el preview replica el cálculo del backend, que difiere de `requerimientos.md` (ver arriba).
- **Selector de rol es solo cosmético** (permisos locales, sin sesión real).
- **Ticket**: requerimiento 9 pide PDF; hoy es modal imprimible con `window.print()`. Corte: requerimiento 12 pide Excel/PDF, hoy solo impresión del navegador.
- **Los precios viven en `localStorage`** (no viajan al backend): se pierden al cambiar de equipo.
- **Sin prueba de clics en navegador real** (jsdom cubre los flujos; Edge headless cubre render + red).

---

## 4. QUÉ SE ABARCÓ EN ESTA INTEGRACIÓN
1. `modules/api.js` pasó de mock a cliente real (`getMembers` / `createMember` / `chargeMember`) con mappers socio↔miembro, fechas ISO→local y `ApiError` con el `error` del servidor.
2. Flujos de `app.js` convertidos a async con llamadas reales, botones bloqueados durante la petición, manejo de 409/404/400 y fix de ids numéricos (`String(id)`) — antes el modal de cobro no encontraba al socio.
3. `state.js` sin datos semilla: caché del backend, ledger de tickets, overlay de *pendiente de pago* (rojo hasta liquidar) y de *borrado lógico*.
4. Ajustes de UI: sin campo de fecha manual, preview = cálculo del backend, select de pase bloqueado en el cobro, botones de admin renombrados.
5. **Backend**: regla de renovación "reinicia desde el cobro" + swagger + tests (21 en total).
6. Infra: servidor estático `npm run dev`, scripts de prueba `test`/`test:backend`/`test:all`, suite de interfaz con jsdom, `frontend/package.json`, `.gitignore`.

---

## 5. BACKLOG SUGERIDO (siguiente paso)
1. `GET /api/pagos?fecha=...` → corte de caja real histórico (y "caja hoy" desde la API).
2. Borrado real en backend (endpoint + campo `activo` = borrado lógico del requerimiento 14).
3. Permitir cambiar `tipoPase` en el cobro (o endpoint `PATCH /socios/:id`).
4. Alinear `VISITA`/`MENSUAL`/semáforo con `requerimientos.md` **o** actualizar el documento.
- [x] 5. Login por usuario/contraseña con el modelo `Usuario` y JWT (requerimiento 15 - Completado).
6. Exportar corte a Excel/PDF (req 12) y ticket en PDF (req 9).
7. Catálogo de precios en el backend para validar el monto cobrado.
8. Si se quiere cubrición de clics en navegador real: Puppeteer/Playwright con Edge.

## 6. CÓMO SE CORRE / SE PRUEBA
```bash
cd ../gym-backend && npm start        # backend :3000  (docs /api-docs)
npm run dev                            # front  :8081
npm run test:all                       # 33 aserciones de interfaz + 21 tests de API (exit 0)
```
Datos demo cargados: `5590000011` (verde), `5590000012` (amarillo), `5590000013` (rojo).

---

## 7. APÉNDICE — comandos verificados (todos ejecutados con éxito)

**Sembrar socios (3× `201`):**
```bash
for b in '{"nombre":"Demo Verde Mensual","telefono":"5590000011","tipoPase":"MENSUAL"}' \
         '{"nombre":"Demo Amarillo Semanal","telefono":"5590000012","tipoPase":"SEMANAL"}' \
         '{"nombre":"Demo Rojo Vencido","telefono":"5590000013","tipoPase":"MENSUAL"}'; do
  curl -s -o /dev/null -w '%{http_code} ' -X POST http://localhost:3000/api/socios \
    -H 'Content-Type: application/json' -d "$b"
done
```

**Backdate para ver amarillo/rojo** (el backend siempre crea socios vigentes):
```bash
cd ../gym-backend && DATABASE_URL='file:./dev.db' node -e "
const p=require('./src/prismaClient');const h=new Date();
const finHoy=new Date(h.getFullYear(),h.getMonth(),h.getDate(),23,59,59,999);
const venc=new Date(h.getFullYear(),h.getMonth(),h.getDate()-3,23,59,59,999);
(async()=>{await p.socio.update({where:{telefono:'5590000012'},data:{fechaVencimiento:finHoy}});
await p.socio.update({where:{telefono:'5590000013'},data:{fechaVencimiento:venc}});
console.log('backdate ok');await p.\$disconnect()})()"
```

**Ver los pagos** (la API no los expone):
```bash
cd ../gym-backend && DATABASE_URL='file:./dev.db' node -e "
const p=require('./src/prismaClient');
(async()=>{const g=await p.pago.findMany({include:{socio:{select:{nombre:true,telefono:true}}}});
console.log('pagos:',g.length);
g.forEach(x=>console.log(' ',x.id,x.socio.nombre,x.monto,x.metodoPago,x.fechaPago.toISOString()));
await p.\$disconnect()})()"
```

**Limpiar solo los datos demo** (borra pagos y luego socios por teléfono):
```bash
cd ../gym-backend && DATABASE_URL='file:./dev.db' node -e "
const p=require('./src/prismaClient');const tels=['5590000011','5590000012','5590000013'];
(async()=>{const d=await p.pago.deleteMany({where:{socio:{telefono:{in:tels}}}});
const s=await p.socio.deleteMany({where:{telefono:{in:tels}}});
console.log('pagos borrados:',d.count,'| socios borrados:',s.count,'| restantes:',await p.socio.count());
await p.\$disconnect()})()"
```

**Render rápido en navegador sin abrirlo (Edge headless):**
```bash
rm -rf 'C:\Users\gpass\AppData\Local\Temp\edge-profile'
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless --disable-gpu \
  --user-data-dir='C:\Users\gpass\AppData\Local\Temp\edge-profile' \
  --virtual-time-budget=9000 --dump-dom http://localhost:8081/ > /tmp/front.html 2>/dev/null
grep -c member-cell-name /tmp/front.html || true     # nº de filas (0 = BD vacía, ok)
grep -o 'id="emptyState"[^>]*' /tmp/front.html      # "display: block" cuando no hay datos
```

**Nota de cobertura:** no hay pruebas de clics en navegador real (se usa jsdom) ni tests de exportación a PDF ni de autenticación, porque esas funciones aún no existen.
