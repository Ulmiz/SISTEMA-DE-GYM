# Sistema de Gimnasio — Documentación del Proyecto

> Documento único que reúne: **qué es el proyecto**, **qué contiene**, **los requerimientos** y **todos los cambios realizados**.
> Fecha de actualización: 13/10/2026 · Rama: `dev` · 3 commits + cambios sin confirmar.

---

## 1. Descripción general

Sistema web para la recepción de un gimnasio: alta de socios, control de vigencias con semáforo de colores, cobros en efectivo/transferencia con ticket, corte de caja diario y roles (recepcionista / administrador).

Objetivo del cliente (literal del requerimiento): *“un sistema web sencillo para la recepción. Lo importante es que sea rápido en horas pico, sin pantallas cargadas ni procesos largos.”*

### Stack

| Capa | Tecnología | Ubicación |
|------|-----------|-----------|
| Frontend | JavaScript vanilla (ES modules), HTML5, CSS3 — sin build ni framework | `frontend/` |
| Backend | Express 5 + Prisma + SQLite | `../gym-backend` (repo hermano) |
| Servidor estático | `frontend/server.mjs` (puerto 8081) | `frontend/server.mjs` |
| Pruebas | `jsdom` (interfaz) · `node:test` (API) | `frontend/test/ui.smoke.mjs` |

---

## 2. Qué contiene el proyecto

### 2.1 Estructura de archivos

```
.
├── package.json                  # scripts raíz: dev, test, test:backend, test:all
├── package-lock.json
├── requerimientos.md             # cuestionario técnico contestado (15 preguntas)
├── Requerimientos para el Sistema del.md   # requerimiento original del cliente
├── RESUMEN-INTEGRACION.md        # traspaso front ↔ backend
├── DOCUMENTACION-PROYECTO.md     # este documento
└── frontend/
    ├── package.json              # type: module
    ├── server.mjs                # servidor estático :8081
    ├── public/index.html         # shell de la SPA (carga app.js como módulo)
    ├── src/
    │   ├── css/styles.css        # estilos completos (semáforo, vistas, responsive)
    │   └── js/
    │       ├── app.js            # orquestador: router de vistas, flujos async, cobros, corte
    │       ├── components/
    │       │   ├── Navbar.js         # navegación + selector de rol
    │       │   ├── DashboardView.js  # recepción: buscador, filtros, semáforo, contadores
    │       │   ├── SociosView.js     # alta de socios (con/sin cobro)
    │       │   ├── CorteView.js       # corte de caja (tarjetas + desgloses)
    │       │   ├── AdminView.js      # precios, métricas, mantenimiento
    │       │   ├── PaymentModal.js   # modal de cobro (efectivo / transferencia)
    │       │   └── TicketModal.js     # ticket imprimible (window.print)
    │       └── modules/
    │           ├── api.js        # cliente HTTP real contra /api (getMembers, createMember, chargeMember)
    │           ├── state.js      # estado, caché de socios, ledger de tickets, overlays, precios
    │           ├── ui.js         # helpers de render/DOM
    │           └── utils.js      # fechas, moneda, colores, semáforo
    └── test/ui.smoke.mjs         # suite de interfaz (aserciones con jsdom)
```

### 2.2 Vistas / módulos funcionales

1. **Recepción y Semáforo** — buscador en tiempo real por nombre o teléfono, filtros por color, contadores (verde/amarillo/rojo), botón *Cobrar* directo desde la fila, *Desbloquear* para socios sin liquidar.
2. **Alta de socio** — nombre, teléfono, tipo de pase (Visita/Semanal/Mensual/Anual); el sistema calcula el vencimiento; puede darse de alta con cobro inmediato o sin pago.
3. **Cobro y ticket** — efectivo o transferencia, liquidación del 100 %, ticket con folio `TKT-<id>` imprimible.
4. **Corte de caja** — total del día, desglose por método de pago y por tipo de pase, tarjetas de resumen y bitácora de transacciones.
5. **Precios y Admin** — catálogo de precios, métricas globales, zona de mantenimiento (borrado lógico, solo dueño).

### 2.3 Persistencia

- **Backend (SQLite / Prisma):** `Socio` (teléfono único), `Pago`, `Usuario` (sin usar aún), enums `TipoPase` y `MetodoPago`.
- **Local (`localStorage`):** precios del admin, rol, ledger de tickets, caché de socios, listas de *pendientes de pago* y *ocultos*.

### 2.4 Comandos

```bash
cd ../gym-backend && npm start   # backend :3000 (docs en /api-docs)
npm run dev                      # frontend :8081
npm test                         # interfaz (jsdom)
npm run test:backend             # API (node:test)
npm run test:all                 # ambas suites
```

---

## 3. Requerimientos

### 3.1 Requerimiento original del cliente (`Requerimientos para el Sistema del.md`)

**1. Diseño de pantalla**
- Estilo limpio, botones grandecitos para tablet o monitor.
- Paleta permitida: verde, amarillo, rojo.
- Fondo blanco o gris claro para no cansar la vista.

**2. Módulos pedidos**
- **Módulo 1 — Registrar socios:** alta con nombre, teléfono, fecha de inicio y tipo de pase (Visita, Semanal, Mensual, Anual); el sistema calcula la fecha de vencimiento.
- **Módulo 2 — Dashboard:** pantalla de trabajo diaria, lista rápida de colores tipo semáforo, botón de *Cobrar* directo desde la lista.
- **Módulo 3 — Cobro y comprobantes:** pago en efectivo o transferencia, ticket básico con fecha de vencimiento.
- **Módulo 4 — Corte de caja:** total cobrado del día, desglose de visitas, mensualidades y total por método de pago.
- **Módulo 5 — Accesos:** recepcionista (cobrar, registrar socios, ver lista) y Administrador/Dueño (único con permiso para cambiar precios, borrar datos y ver reportes globales).

**3. Condiciones de entrega**
1. Checar el estado de un cliente debe tomar **máximo 2 clics**.
2. No se pueden guardar socios **sin teléfono ni nombre**.
3. El recepcionista **no** debe tener acceso a borrar registros ni cambiar precios.

### 3.2 Cuestionario técnico contestado (`requerimientos.md` — 15 preguntas)

**Bloque 1 · Registro y vigencias**
| # | Decisión tomada |
|---|-----------------|
| 1 | La renovación **se reinicia desde la fecha de cobro** (no acumula días a favor) |
| 2 | Teléfono repetido → **bloquear** el registro (409) |
| 3 | Pase *Visita*: **vence al cierre del día** · Pase *Mensual*: **mismo día del mes siguiente** |

**Bloque 2 · Dashboard y hora pico**
| # | Decisión tomada |
|---|-----------------|
| 4 | Semáforo amarillo con **2 días** de anticipación al vencimiento |
| 5 | Socio en rojo → **bloqueo de entrada** hasta liquidar el pase |
| 6 | Búsqueda en **tiempo real por nombre o teléfono** |

**Bloque 3 · Cobros y comprobantes**
| # | Decisión tomada |
|---|-----------------|
| 7 | Transferencia: **registro directo con un solo clic** (sin folio obligatorio) |
| 8 | Se exige **liquidación del 100 %** para activar vigencia (sin anticipos) |
| 9 | Ticket **digital en pantalla** → *se pide en PDF* |

**Bloque 4 · Corte de caja**
| # | Decisión tomada |
|---|-----------------|
| 10 | **Cierre único global** del día completo (no por turno) |
| 11 | **Sin fondo inicial**: solo sumar ventas netas del día |
| 12 | Exportable a **Excel / PDF** (*el dueño dijo PDF*) |

**Bloque 5 · Seguridad, precios y cuentas**
| # | Decisión tomada |
|---|-----------------|
| 13 | Al subir precios, **los pagos anteriores conservan su precio y fecha** |
| 14 | Borrado **lógico** (ocultar de la vista, conservar el registro contable) |
| 15 | Cada recepcionista entra con **usuario/contraseña propio** |

### 3.3 Estado de cumplimiento

| Requerimiento | Estado | Nota |
|---|---|---|
| Semáforo verde/amarillo/rojo | ✅ | Amarillo a ≤2 días, rojo vencido |
| Máximo 2 clics para ver estado | ✅ | Buscador en tiempo real + fila con botón *Cobrar* |
| Validación nombre/teléfono obligatorios | ✅ | Validación en front + 400/409 del backend |
| Teléfono único (bloqueo de duplicados) | ✅ | 409 → salta al buscador |
| Renovación desde la fecha de cobro | ✅ | Regla alineada en backend y front |
| Alta + cálculo de vencimiento | ⚠️ | Backend usa fin de día +1/7/30/365 días |
| Cobro efectivo/transferencia 100 % (Req. 3.1) | ✅ | Modal de cobro rápido con selección obligatoria (Efectivo o Transferencia) para habilitar confirmación |
| Ticket | ⚠️ | Modal imprimible; **falta PDF** (req. 9) |
| Corte de caja con desgloses | ⚠️ | Funciona sobre ledger local; **falta `GET /api/pagos`** |
| Exportar corte a PDF/Excel | ❌ | Solo impresión del navegador (req. 12) |
| Roles y permisos | ⚠️ | Selector de rol **cosmético**; **falta login real** (req. 15) |
| Borrado lógico | ⚠️ | Solo local en front; **falta campo `activo` en BD** (req. 14) |
| Precios viajan al backend | ❌ | Viven en `localStorage` |

---

## 4. Todos los cambios (historial Git)

### Commit 1 — `2c3b8e9` · *First commit "Frontend prototipo"*
Prototipo inicial monolítico.

| Archivo | Cambio |
|---|---|
| `Requerimientos para el Sistema del.md` | +44 — requerimiento del cliente |
| `frontend/public/index.html` | +724 — SPA completa en un solo archivo |
| `frontend/src/css/styles.css` | +1852 — estilos base |
| `frontend/src/js/app.js` | +400 — lógica de vistas y flujos |
| `frontend/src/js/modules/{api,state,ui,utils}.js` | +358 — módulos (api era mock) |
| `package.json` | +13 |

**Total: 9 archivos, +3391 líneas.**

### Commit 2 — `445093c` · *modularizar proyecto web, dashboard y ajustes de UX*
Se rompe el HTML monolítico en componentes y se añaden vistas nuevas.

| Archivo | Cambio |
|---|---|
| `frontend/public/index.html` | +10/−702 — se vacía el HTML, ahora solo es el shell |
| `frontend/src/js/components/Navbar.js` | +66 — navegación y selector de rol |
| `frontend/src/js/components/DashboardView.js` | +108 — recepción con semáforo |
| `frontend/src/js/components/SociosView.js` | +126 — alta de socios |
| `frontend/src/js/components/CorteView.js` | +143 — corte de caja |
| `frontend/src/js/components/AdminView.js` | +102 — precios y mantenimiento |
| `frontend/src/js/components/PaymentModal.js` | +98 — modal de cobro |
| `frontend/src/js/components/TicketModal.js` | +86 — ticket imprimible |
| `frontend/src/js/app.js` | +101/−25 — orquestador de componentes |
| `frontend/src/js/modules/{state,ui,utils}.js` | +74/−13 — estado y helpers |
| `frontend/src/css/styles.css` | +91/−14 — estilos de nuevos componentes |
| `requerimientos.md` | +100 — cuestionario técnico contestado |

**Total: 14 archivos, +1105 / −754 líneas.**

### Commit 3 — `3980fea` · *conectar el frontend con el backend real de socios*
Integración front ↔ backend documentada en `RESUMEN-INTEGRACION.md`.

| Archivo | Cambio |
|---|---|
| `frontend/src/js/modules/api.js` | Mock → cliente HTTP real (`getMembers`, `createMember`, `chargeMember`), `ApiError` con el `error` del servidor |
| `frontend/src/js/app.js` | +148/−86 — flujos async, botones bloqueados en petición, manejo de 409/404/400, fix de ids numéricos |
| `frontend/src/js/modules/state.js` | +97/−89 — sin datos semilla: caché de backend, ledger de tickets, overlays de *pendiente de pago* y *borrado lógico* |
| `frontend/src/js/modules/api.js` | +108/−12 — mock → cliente HTTP real |
| `frontend/src/js/components/{AdminView,SociosView}.js` | sin campo de fecha manual, select de pase bloqueado en cobro, botones de admin renombrados |
| `frontend/server.mjs` | +42 — servidor estático `npm run dev` (:8081) |
| `frontend/test/ui.smoke.mjs` | +210 — suite de interfaz con jsdom |
| `frontend/package.json`, `package.json`, `package-lock.json`, `.gitignore` | infra: scripts `dev` / `test` / `test:backend` / `test:all`, devDep `jsdom` |
| `RESUMEN-INTEGRACION.md` | +151 — documentación de traspaso |

**Total: 12 archivos, +1312 / −198 líneas.**
**Regla de negocio aplicada aquí:** la vigencia se **reinicia desde la fecha de cobro** (no acumula días a favor), en backend, swagger y tests.

### Cambios sin confirmar (working tree actual)

3 archivos modificados, **+136 / −25 líneas**: rediseño de la vista *Corte de Caja*.

**`frontend/src/js/components/CorteView.js`** (+26/−2)
- Contenedor renombrado de `.corte-container` → `.corte-caja-container`.
- Nuevo **grid de tarjetas de resumen** (`.resumen-tarjetas-grid`) con 3 tarjetas: *Total recaudado*, *Efectivo*, *Transferencias*, cada una con sus IDs `corteSummary*` (monto + conteo).
- Los desgloses por método y por tipo de pase pasan a la sección “Desgloses Detallados”.

**`frontend/src/js/app.js`** (+33/−8)
- `renderCorteView()` ahora rellena **tanto los IDs nuevos (`corteSummary*`) como los originales**.
- Todas las asignaciones pasan a estar **protegidas con `if (el)`**, de modo que la vista no truena si algún nodo no existe en el DOM.

**`frontend/src/css/styles.css`** (+77/−15)
- Nuevo `.corte-caja-container` (max-width 1200px, padding 2rem, gap 2rem).
- Nuevos estilos de **tarjeta de resumen**: `.resumen-tarjetas-grid`, `.tarjeta-resumen`, `.tarjeta-titulo`, `.tarjeta-valor`, `.tarjeta-sub` con hover (`translateY(-2px)` + shadow).
- Grids con `repeat(auto-fit, minmax(280px, 1fr))` en lugar de columnas fijas → **responsive de verdad**.
- `.corte-card` renovada: bordes 12px, header con `var(--bg-subtle)`, hover consistente con las tarjetas.
- Tipografía: `.row-val` sube a 1.25rem, `.row-key` con `font-weight: 600`.
- Media query: `.resumen-tarjetas-grid` cae a **1 columna** en pantallas pequeñas.

---

## 5. Verificación

Ejecutado el 13/10/2026 con los cambios sin confirmar aplicados:

| Suite | Resultado |
|---|---|
| `npm test` (interfaz, jsdom) | **31 aserciones OK, 0 fallos, exit 0** ✅ |
| Corte de caja dentro de la suite | total `$680.00`, 2 transacciones, desglose efectivo/transferencia 1 y 1 ✅ |
| `npm run test:backend` (API, node:test) | **21/21 tests, 0 fallos, exit 0** ✅ |
| Navegador real (Edge headless) | carga sin errores de consola ni recursos fallidos; 3 badges de color, contadores y estado vacío correctos (documentado) |

> Nota: `RESUMEN-INTEGRACION.md` menciona 33 aserciones de interfaz; el conteo actual es **31** con exit 0. Ninguna falla.
>
> Ambas suites se ejecutaron en local el 13/10/2026 **con los cambios sin confirmar aplicados**: `npm test` → exit 0, `npm run test:backend` → 21/21, exit 0. La prueba de navegador real (Edge headless) proviene de la documentación previa y **no se re-ejecutó** en esta iteración.

---

## 6. Pendientes / backlog

1. `GET /api/pagos?fecha=...` → corte de caja histórico real desde la API.
2. Borrado lógico real en backend (endpoint + campo `activo`, requerimiento 14).
3. Permitir cambiar `tipoPase` en el cobro (o `PATCH /socios/:id`).
4. Alinear `VISITA` / `MENSUAL` / semáforo con `requerimientos.md` **o** actualizar el documento.
5. Login por usuario/contraseña con el modelo `Usuario` (requerimiento 15).
6. Exportar corte a **PDF/Excel** (req. 12) y ticket en **PDF** (req. 9).
7. Catálogo de precios en el backend para validar el monto cobrado.
8. Pruebas de clics en navegador real (Puppeteer/Playwright con Edge).

---

## 7. Documentos relacionados

- **`requerimientos.md`** — cuestionario técnico de 15 preguntas con las decisiones marcadas.
- **`Requerimientos para el Sistema del.md`** — requerimiento original del cliente.
- **`RESUMEN-INTEGRACION.md`** — estado detallado de la integración front ↔ backend, comandos verificados y apéndice de seeds/backdate.
- **`../gym-backend`** — repositorio del backend (Express + Prisma + SQLite, 21 tests).
