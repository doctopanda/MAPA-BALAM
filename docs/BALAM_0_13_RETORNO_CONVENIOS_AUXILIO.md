# BALAM v0.13 | Retorno vial independiente y catálogo institucional de auxilios

## Implementado
1. Botón **Calcular ruta de regreso real** en la calculadora de logística. Solicita una ruta OSRM independiente desde destino a origen; dibuja el recorrido azul discontinuo con casilla para mostrar/ocultar.
2. Distancias: mientras no exista ruta de regreso validada, se señala que ida y vuelta = 2 × recorrido de ida. Cuando la segunda ruta es válida, ida + regreso se suman y se recalculan litros, porcentaje de reserva y presupuesto; se mantienen separadas las longitudes.
3. Catálogo institucional de gasolineras con ticket, llanteras, talleres y auxilio carretero con validación RLS en Supabase (`public.balam_route_support_sites`).
4. Fichas cercanas a la ruta, con tipo, nombre, teléfono institucional, horario comunicado, condición de convenio, vigencia y distancia en línea recta al corredor (≤4 km); ninguna se representa como abierta o confirmada para auxilio en ese momento.
5. Editor privado para Administrador Maestro en el panel **Logística del traslado → Catálogo institucional validado**. Crear/editar/suspender, evidencia no confidencial y estatus borrador/validado/suspendido.
6. Auditoría DB `balam_route_support_audit`, alimentada por triggers. Solamente Administrador Maestro puede escribir catálogo; miembros autenticados habilitados leen únicamente fichas activas y validadas; anónimos no tienen lectura. Ninguna llave secreta en el cliente.
7. Gasolineras públicas OSM se conservan en su categoría *general/no verificada*. Nunca se atribuye aceptación de ticket desde OSM. Un ticket `accepted` requiere programa, evidencia, estatus validado y fecha de vencimiento; si está vencido la interfaz ya no muestra aceptación vigente.

## Datos existentes vs. capacidad
- **No se han ingresado proveedores ficticios.** La tabla y su bitácora comenzaron con cero registros. No hay evidencias de convenios institucionales preaprobados.
- El formulario no requiere pacientes ni información clínica. La evidencia debe ser una referencia documental no confidencial; no cargar contratos privados o secretos por esta vía.
- Horario y teléfono son campos de catálogo respaldables, no información de tiempo real. Si no se reportaron se muestran como **no documentados**.
- Distancia a la ruta es euclidiana aproximada. No hay prueba de desvío accesible, combustible disponible, asistencia efectiva ni tiempo de respuesta.
- El motor OSRM y el servicio Overpass son públicos de demostración, sin SLA operativo. No usar para despacho de ambulancias, servicios críticos ni decisiones clínicas sin validación.

## Fórmulas
- Longitud de ida = `road.distance/1000` del primer itinerario.
- Longitud de regreso real = `returnRoad.distance/1000` si OSRM confirma otra ruta.
- Longitud logística = `ida + regreso` si hay ruta independiente; de otro modo `2 * ida` y se etiqueta *estimada*.
- `litros = longitud_logística_km / rendimiento_km_por_L`.
- `litros_con_reserva = litros * (1 + reserva_pct / 100)`.
- `costo_MXN = litros_con_reserva * precio_MXN_por_L`.
- Precio, rendimiento y reserva editables. No equivalen a lectura de tanque o gasto medido.

## Controles y roles
- La autenticación es compartida con el módulo CRUM: `window.BALAM_SupabaseClient` y evento `balam:auth-updated`.
- La tabla `balam_access` verifica la condición `admin_maestro` y que el usuario está habilitado. RLS refuerza los controles independientemente de la UI.
- Políticas SQL en `sql/013_route_support_sites_rls.sql`. Trigger histórico escribe evento INSERT/UPDATE/DELETE con versiones JSON.
- Verificación real: transacción INSERT simulada como Maestro -> éxito seguido de ROLLBACK, 0 sitios finales y 0 eventos finales. Inserción simulada por usuario no habilitado -> denegada con PostgreSQL 42501.
- Revisado con Supabase Security Advisor: advertencia existente de Auth `Leaked Password Protection Disabled`. Referencia: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Próximas mejoras operativas
- Incorporar convenio real de tickets y proveedores por expediente validado (con fecha y responsable, sin información sensible en el frontend).
- Motor OSRM/Valhalla/GraphHopper propio o contratado, base de cierres y emergencias, tráfico y rutas aprobadas por CRUM.
- Selección por tipo de combustible diésel/gasolina/mezcla, consumo medido y autonomía inicial; validar con flota.
- Distancia real de desvío a gasolinera/taller y cálculo de tiempo adicional, en vez de proximidad euclidiana.

## Recuperación y QA
- Checkpoint anterior: `checkpoint/balam-v0.11.1-before-logistics-20261028`.
- Nueva rama de implementación: `feature/balam-v0.13-network-logistics`.
- Test automático `scripts/validate-map.cjs` valida sintaxis, funcionamiento estructural de retorno, formulario de Supabase, fórmulas de combustible y permisos representados en SQL.
- Pendiente prueba interactiva del demo OSRM de ida/regreso en el navegador del usuario y carga de primeros proveedores reales validados.

## Referencias
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- OSRM demo: https://github-wiki-see.page/m/Project-OSRM/osrm-backend/wiki/Demo-server
- Overpass public API: https://wiki.openstreetmap.org/wiki/Overpass_API
