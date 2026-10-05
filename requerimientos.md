================================================================================
          CUESTIONARIO TÉCNICO DE REQUERIMIENTOS - SISTEMA DE GIMNASIO
================================================================================
Fecha: 03/10/26
Cliente / Entrevistado: Jadhiel
Responsable Técnico: Juan Rafael (frontend)

--------------------------------------------------------------------------------
BLOQUE 1: REGISTRO DE SOCIOS Y VIGENCIAS (MÓDULO 1)
--------------------------------------------------------------------------------
1. Renovaciones con días a favor:
   Si a un socio aún le faltan 4 días de mensualidad y paga hoy: ¿el nuevo mes 
   se le acumula al final de esos días, o se reinicia la cuenta a partir de hoy?
   [ ] Se acumula al final de la vigencia actual
   [ x ] Se reinicia desde la fecha de cobro
   Notas: ______________________________________________________________________

2. Control de duplicados y reingresos:
   Si un socio dejó de ir hace meses y regresa, ¿se le busca para renovar o el 
   sistema debe bloquear/alertar si intentan registrar el mismo teléfono?
   Notas: Bloquear

3. Cómputo exacto de los pases:
   • Visita:  [ x ] Vence al cierre del día      [ ] 24 horas exactas
   • Mensual: [ ] 30 días naturales            [ x ] Mismo día del mes siguiente
   Notas: ______________________________________________________________________

--------------------------------------------------------------------------------
BLOQUE 2: DASHBOARD Y DINÁMICA EN HORA PICO (MÓDULO 2)
--------------------------------------------------------------------------------
4. Semáforo preventivo (Color Amarillo):
   ¿Con cuántos días de anticipación antes de vencer debe pintarse en amarillo?
   [ ] 3 días antes        [ ] 5 días antes        [ x ] Otro:2 días

5. Acción ante socio en Rojo (Vencido):
   ¿El sistema solo muestra la alerta visual para cobrar o bloquea el acceso?
   [ ] Solo alerta visual informativa
   [ x ] Bloqueo de entrada hasta liquidar pase
   Notas: ______________________________________________________________________

6. Regla de máximo 2 clics para checar estado:
   ¿Cómo prefieren buscar al cliente en horas pico?
   [ x ] Buscador en tiempo real por nombre o teléfono
   [ ] Filtros rápidos por color (ver solo amarillos o rojos)
   Notas: ______________________________________________________________________

--------------------------------------------------------------------------------
BLOQUE 3: COBROS, TICKETS Y FORMAS DE PAGO (MÓDULO 3)
--------------------------------------------------------------------------------
7. Pagos por transferencia:
   ¿Se debe capturar obligatoriamente folio/clave de rastreo o solo marcarlo?
   [ ] Requiere folio o clave obligatoria
   [ x ] Registro directo con un solo clic
   Notas: ______________________________________________________________________

8. Manejo de adeudos o pagos incompletos:
   ¿Se permiten pagos parciales/fiados o se exige el 100% para activar vigencia?
   [ x ] Requiere liquidación del 100%
   [ ] Permite registrar anticipos y saldos pendientes
   Notas: ______________________________________________________________________

9. Emisión de comprobantes:
   ¿Cómo se entregará el ticket de cobro?
   [ ] Mini impresora térmica física (58mm / 80mm)
   [ x ] Digital en pantalla / envío por WhatsApp
   Notas: _QUE SE GENERE UN PDF___
--------------------------------------------------------------------------------
BLOQUE 4: CORTE DE CAJA (MÓDULO 4)
--------------------------------------------------------------------------------
10. Modalidad del corte:
    [ ] Por turno individual (mañana / tarde)
    [ x ] Cierre único global del día completo

11. Fondo inicial de efectivo:
    ¿Se captura una base inicial de cambio en caja por la mañana?
    [ ] Sí, registrar fondo de apertura
    [ x ] No, solo sumar ventas netas del día

12. Formato de consulta:
    [ ] Visualización exclusiva en pantalla
    [ x ] Exportable a Excel / PDF para el dueño (pdf dijo)

--------------------------------------------------------------------------------
BLOQUE 5: SEGURIDAD, PRECIOS Y CUENTAS (MÓDULO 5)
--------------------------------------------------------------------------------
13. Actualización de tarifas:
    Al subir el precio de un pase, ¿los que ya pagaron se mantienen intactos?
    [ x ] Sí, conservan su precio y fecha sin cambios
    [ ] Notas: _________________________________________________________________

14. Política de borrado de datos:
    Si el dueño borra un registro, ¿debe ser borrado lógico para no descuadrar 
    el histórico de caja?
    [ x ] Sí (ocultar de la vista pero conservar registro contable)
    [ ] Borrado permanente de la base de datos

15. Manejo de sesiones en recepción:
    [ x ] Cada recepcionista entra con usuario/contraseña propio
    [ ] Una sola sesión general abierta fija en la tablet/PC
================================================================================