# Minuta Exhaustiva de Requerimientos y Validación del Sistema

**Proyecto:** Sistema de Recepción y Administración de Gimnasio ("Power Point Recepción")
**Fecha de sesión:** 15 de octubre de 2026

**Participantes del equipo de desarrollo:** Ulmi Z., Lourdes Josefina Ruiz Santiago, Isael Ojeda

**Clientes / contraparte:**
- Eduardo Ríos (Administrador / Dueño)
- Jahdiel Tzec (Recepcionista / Cajero)

---

## 1. Antecedentes y propósito de la sesión

Ulmi abre la sesión señalando que el objetivo es recabar toda la información con exactitud para evitar futuras reuniones, considerando que solo quedan dos clases con Mario, y dejar el sistema confirmado en todos sus detalles.

---

## 2. Módulo de login, roles y gestión de accesos

- **Registro de socios vs. acceso de personal:** Ulmi muestra el mockup del login. Jahdiel pregunta si "registrar socio" crea una cuenta de empleado o inscribe a alguien del gimnasio. Ulmi aclara que el login es exclusivo para el personal.
- **Decisión de cuentas:** Ulmi propone prescindir de un módulo de registro de empleados y usar dos cuentas fijas (Recepcionista y Admin). Eduardo y Jahdiel aprueban la propuesta. Se elimina el botón "Registro socio" del login.
- **Asignación de usuarios:** Jahdiel sugiere que las cuentas lleven sus nombres/roles (Eduardo = Admin, Jahdiel = Recepcionista). Eduardo confirma que proporcionará su correo por el chat de la llamada para el rol Admin, y se usará un identificador de recepcionista para Jahdiel.
- **Políticas de seguridad de contraseña:** Jahdiel consulta si la contraseña debe tener ciertos caracteres. Eduardo especifica que debe contener por lo menos una mayúscula, una minúscula, un número y un carácter especial. Ante la pregunta de Lourdes sobre el rango, Eduardo define un **mínimo de 6 caracteres**.
- **Funcionalidad "Olvidaste tu contraseña":** Ulmi consulta si se conserva el botón de recuperar contraseña. Eduardo valida el diseño del botón. Ulmi acuerda subir un mockup del flujo de recuperación a Microsoft Teams para visto bueno antes de codificarlo.
- **Alternancia de roles en el dashboard:** Ulmi plantea dos opciones para alternar entre Recepcionista y Administrador:
  - a. Un switch en el dashboard que abre un modal solicitando correo y contraseña de Admin.
  - b. Un botón de Logout que saque al usuario a la pantalla principal.

  Jahdiel y Eduardo eligen el **cambio directo mediante ventana emergente** en el dashboard, sin cerrar sesión.

---

## 3. Alta de socios y política de cobros

- **Ajustes de espaciado (UI):** Ulmi muestra que se amplió el "respiro" visual, separando márgenes y padding en toda la interfaz.
- **Campos obligatorios en formulario:** En el diseño original, el equipo configuró como obligatorios Nombre, Teléfono y Pase (la fecha de vencimiento y el costo se calculan automáticamente). Isael pide confirmar si se mantienen. Jahdiel determina que:
  - **Nombre completo:** obligatorio
  - **Tipo de pase:** obligatorio
  - **Número de teléfono:** **opcional**
- **Métodos de pago:** Ulmi e Isael consultan si la selección de Efectivo y Transferencia es correcta. Jahdiel solicita asegurar el soporte para ambos métodos.
- **Cobro obligatorio vs. pago pendiente:** Ulmi muestra que desmarcar el cobro permitía dar de alta a un socio con "pago pendiente" (apareciendo en rojo). Ulmi propone quitar esa opción para exigir el pago al dar de alta. Jahdiel confirma que el pago debe ser **100% obligatorio** para poder registrar y dar de alta a un socio.

### Esquema tarifario vigente

| Tipo de pase | Duración / Vigencia | Precio (MXN) |
|---|---|---|
| Pase de 1 día (Visita) | 1 día | $50 |
| Pase semanal | 7 días | $180 |
| Pase mensual | 30 días | $500 |
| Pase anual | 365 días | $4,550 |

---

## 4. Dashboard principal, semáforo y renovaciones

- **Semáforo de estatus:** Se confirma la lógica visual en tiempo real:
  - 🟢 **Verde:** socios activos.
  - 🟡 **Amarillo:** por vencer.
  - 🔴 **Rojo:** bloqueados / vencidos.
- **Estructura de la tabla:** Columnas validadas: Semáforo, Nombre del socio, Teléfono, Tipo de pase, Vigencia/Vencimiento, Días restantes, Acciones directas.
- **Botón de acción en socios vencidos:** Jahdiel observa que los socios bloqueados tienen un botón "Desbloquear" y pregunta qué hace (si solo da acceso o cobra). Ulmi explica que cobra la renovación. Jahdiel pide cambiar el texto del botón de "Desbloquear" a **"Renovar y cobrar"**.
- **Flexibilidad en tipo de pase al renovar:** Ulmi explica que el sistema renovaba automáticamente el mismo pase que el socio tenía previamente. Jahdiel solicita que sea **modificable**, permitiendo que el socio elija un tipo de membresía distinto al renovar.
- **Estilos visuales:** Lourdes pregunta por el color de los botones, el nombre de renovar y la tarjeta redondeada de "Acceso bloqueado" a la izquierda. Jahdiel y Eduardo aprueban los colores y bordes redondeados.
- **Reloj en tiempo real y contador:** Jahdiel y Eduardo aprueban la visualización de la hora exacta en tiempo real, el contador "Mostrando X socios" y el texto de ejemplo (placeholder) en el buscador por nombre o teléfono.
- **Accesos duplicados y emojis:** Ulmi señala que existe redundancia con los botones "Nuevo socio" y "Corte de caja" tanto en cabecera como en cuerpo del panel. Jahdiel pide conservarlos. Además, Jahdiel resalta que para él los emojis son indispensables en los botones y tarjetas para evitar texto plano.

---

## 5. Módulo de corte de caja e historial

- **Encabezados de tablas:** Jahdiel solicita que las tres secciones ("Por método de pago", "Por tipo de pase" y "Detalle de cobros registrados") tengan **fondo azul oscuro con letras blancas**. Se acuerda retirar los emojis de esos tres encabezados para mantener la sobriedad con el fondo azul.
- **Tabla de detalle de cobros:** Columnas validadas: Hora, Número de ticket, Socio/Cliente, Concepto, Método (con emoji), Monto, Vencimiento otorgado y Acción de reimprimir ticket.

---

## 6. Panel de administrador e identidad

- **Eliminación de socios:** Se aprueba el botón con icono de bote de basura (con efecto hover), exclusivo para que el Administrador borre registros de la base de datos.
- **Precios (Admin):** Eduardo aprueba la vista con etiqueta "Acceso total habilitado", el control numérico para ajustar precios de pases con saltos de 5 en 5, el botón para guardar precios, las métricas comerciales (socios registrados, ingresos acumulados, tasa de socios activos) y las herramientas de mantenimiento (limpiar historial de tickets y sincronizar con backend).
- **Identidad visual:** Se aprueba el nombre "Power Point Recepción", el logotipo de la pesa y las leyendas de permisos según el rol activo.

---

## 7. Lista consolidada de tareas pendientes

| # | Módulo | Descripción de la tarea | Estado |
|---|---|---|---|
| 1 | Login | Quitar botón "Registro socio". | Pendiente |
| 2 | Login | Configurar cuentas fijas de Eduardo (Admin) y Jahdiel (Recepción). | Pendiente |
| 3 | Login | Configurar validación de contraseña (mínimo 6 caracteres, ≥ 1 mayúscula, ≥ 1 minúscula, ≥ 1 número, ≥ 1 carácter especial). | Pendiente |
| 4 | Login | Subir mockup de recuperación de contraseña a Microsoft Teams. | Pendiente |
| 5 | Dashboard | Implementar modal de autenticación para cambio directo a rol Admin. | Pendiente |
| 6 | Alta Socios | Configurar teléfono como campo opcional (Nombre y Pase obligatorios). | Pendiente |
| 7 | Alta Socios | Establecer el cobro como obligatorio al dar de alta (eliminar "pago pendiente"). | Pendiente |
| 8 | Renovación | Renombrar el botón "Desbloquear" a "Renovar y cobrar". | Pendiente |
| 9 | Renovación | Permitir la modificación del tipo de membresía durante el proceso de renovación. | Pendiente |
| 10 | Corte de Caja | Aplicar estilo con fondo azul oscuro y texto blanco (sin emojis) en los encabezados. | Pendiente |
