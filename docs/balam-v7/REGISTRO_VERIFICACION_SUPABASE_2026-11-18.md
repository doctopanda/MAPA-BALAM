# BALAM v7 · Intervención validada de Captura Distrital
**Corte:** 18 de noviembre de 2026  
**Estado:** STAGING protegido con pruebas sintéticas. **PROHIBIDO usar pacientes reales.**  
**Rama:** \`feature/balam-v7-captura-distrital-siesa\`  
**PR:** https://github.com/doctopanda/MAPA-BALAM/pull/19

## Puntos de control inmutables
- BALAM principal: \`fee7eef4c46cf49cc5424ac1f3171b5f1cf0ac10\` (rama \`checkpoint/balam-pre-captura-siesa-2026-11-18\`).
- BALAM cartográfico alterno: \`2c73f47ccd5bebc8b251562a52391b885205f56d\` (rama \`checkpoint/balam-cartografia-2026-11-18\`).
- No se alteró \`main\`. El BALAM operativo local antiguo con nominales requiere resguardo privado independiente.

## Base de datos verificada
- Cuenta Supabase conectada: BALAM.
- Proyecto: \`blkvamobfcyvlimnizaf\`; se usó su base ACTUAL, pero las tablas creadas viven en un **esquema privado nuevo** (\`balam_capture\`) que NO está expuesto por Data API.
- Tablas nuevas: \`operativos\`, \`operativo_distritos\`, \`personas\`, \`participaciones\`, \`atenciones\`, \`acciones\`, \`auditoria\`; hay una secuencia \`folio_seq\`.
- Las siete tablas tienen RLS habilitado. Las políticas se basan en \`public.balam_access\`, su \`is_enabled\`, su \`role\`, su \`district_ids\` y \`auth.uid()\`. Jamás se usan \`user_metadata\` editables.
- Roles **existentes**: \`admin_maestro\`, \`admin_estatal\`, \`supervisor_distrital\`, \`alimentador_distrital\`, \`consulta\`. La captura NO acepta el rol \`consulta\`.
- Al 18/11/2026, \`balam_access\` tenía 1 administrador maestro y no se identificaron cuentas distritales para una prueba real.
- El esquema cuenta con políticas INSERT/SELECT. No se habilitó UPDATE o DELETE sobre las fichas nominales: correcciones y auditoría completa quedan pendientes.
- Los controles de prueba en SQL bloquean claves de operativo que no inician con \`TEST-\`, nombres no sintéticos y acciones cuyo código no sea \`DEMO_\`. Los nombres ficticios deben comenzar por \`PRUEBA \` o \`PACIENTE FICTICIO \`.
- La secuencia de folios crea \`BAL-DSXX-00000000\` con valor secuencial global. Los números pueden presentar saltos porque PostgreSQL no revierte secuencias tras un ROLLBACK. Unicidad se garantiza dentro de operativo y distrito.

### Migraciones aplicadas (con historial de Supabase)
1. \`20261118190741\` · \`balam_v7_capture_private_schema_20261118\`
2. \`20261118190821\` · \`balam_v7_capture_correlated_rls_hardening_20261118\`
3. \`20261118191239\` · \`balam_v7_secure_capture_rpc_20261118\`
4. \`20261118191451\` · \`balam_v7_test_only_guard_20261118\`
5. \`balam_v7_secure_exact_folio_search_20261118\` · endurecimiento posterior (confirmar nueva versión en listado de migraciones).

**IMPORTANTE:** el archivo \`ESQUEMA_PRIVADO_BORRADOR_NO_EJECUTAR.sql\` del repositorio es un borrador arquitectónico anterior y NO es el esquema aplicado en Supabase. No ejecutarlo. La implementación vigente está en las migraciones efectivas de Supabase.

## Endpoints RPC públicos, con Security Invoker y sin permiso anónimo
Cada función está en \`public\`, pero solo se concede \`EXECUTE\` a \`authenticated\`, verifica alcance y depende de RLS. Todas están definidas con \`SECURITY INVOKER\`, no \`SECURITY DEFINER\`.

- \`balam_v7_list_operativos(p_distrito)\`: lista solo operativos visibles en un distrito autorizado.
- \`balam_v7_create_operativo(p_codigo,p_nombre,p_fecha_inicio,p_distritos)\`: administrador crea operativo en borrador.
- \`balam_v7_activate_operativo(p_operativo)\`: administrador activa el operativo.
- \`balam_v7_search_patient(p_operativo,p_distrito,p_folio)\`: folio **completo exacto** y restringido a operativo/distrito.
- \`balam_v7_register_patient(p_operativo,p_distrito,p_nombre,p_fecha_nacimiento,p_sexo,p_persona_existente)\`: inserta paciente sintético y genera folio o reutiliza persona existente del mismo distrito.
- \`balam_v7_register_attention(p_operativo,p_distrito,p_participacion,p_fecha_atencion,p_codigo_localidad,p_acciones)\`: captura transaccional con múltiples acciones.
- \`balam_v7_history(p_operativo,p_distrito,p_participacion)\`: devuelve historial autorizado por operativo y distrito.

El navegador **nunca** recibe claves de servidor ni ejecuta SQL arbitrario. Solo usa una clave pública \`sb_publishable_\` que ya usa BALAM CRUM, y Auth del proyecto existente.

## Páginas nuevas
- \`captura/index.html\`: demostración totalmente local, sin conexión ni persistencia.
- \`captura/secure.html\` + \`captura/secure-app.js\`: interfaz autenticada para pruebas con la base. No enlazada desde \`main\`, NO desplegada en GitHub Pages.
- El login usa \`persistSession:false\`; evita guardar sesión en navegador después de cerrar la página. Todas las respuestas se muestran como texto, no se inyecta HTML proveniente de pacientes.
- UX basada en desplegables por distrito, operativo, paciente, área y acción.

## Matriz de pruebas ya ejecutadas
| Prueba | Resultado |
| --- | --- |
| Autenticación sintética de administrador en sesión SQL | PASS |
| Nuevo operativo TEST + activación | PASS |
| Paciente sintético + folio automático | PASS |
| Atención con dos acciones de diferentes módulos | PASS |
| Historial de acciones + búsqueda de folio | PASS |
| Capturista con rol \`alimentador_distrital\` DS05 lee DS05 | PASS |
| Usuario DS05 NO lee personas, participaciones, atenciones ni acciones de DS06 | PASS |
| Usuario DS05 NO inserta paciente en DS06 | PASS |
| Usuario DS05 NO consulta vía RPC folio de DS06 | PASS |
| Nombre no sintético bloqueado por CHECK | PASS |
| Búsqueda de folio parcial rechazada | PASS |
| Código no \`DEMO_\` rechazado y atención se revierte completa | PASS |
| \`anon\` sin EXECUTE en las 7 RPC | PASS |
| \`anon\` sin USAGE del esquema privado | PASS |
| Sintaxis JS y concordancia de IDs DOM de pantalla segura | PASS |
| Pruebas reales de navegador con cuentas distritales | PENDIENTE |
| Reportes EXÁCTAMENTE iguales a SIESA V2401 | PENDIENTE |

Las pruebas SQL usaron transacciones \`BEGIN\`/\`ROLLBACK\`. Se verificó que tras las pruebas siguen **0 operativos, 0 pacientes, 0 atenciones, 0 acciones y 0 auditorías** en el esquema. La cuenta \`admin_maestro\` sigue intacta.

## Advertencia de seguridad externa
Supabase Security Advisor reporta **Leaked Password Protection Disabled** (\`WARN\`). La opción es de configuración global del proyecto; no fue alterada en esta intervención. Referencia: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Bloqueos formales para habilitar pacientes y operativos reales
1. Pruebas de inicio de sesión de usuarios distritales REALES autorizados, además de MFA según políticas institucionales, revisión de alertas del Auth.
2. Pruebas UI en Windows, móvil, redes lentas y reconexión. El mero PASS sintáctico no confirma la experiencia de usuario.
3. Auditoría ampliada de READ/UPDATE/EXPORT y correcciones de expediente, deduplicación, folios e identidad. La primera etapa registra INSERT, no todas las modificaciones.
4. Acuerdo formal de campos SIESA y validación de catálogos, denominadores y unidades de medida.
5. Implementar importador XLSX de bases SIESA con lote, SHA-256 y conciliación.
6. Habilitar generación Excel desde copia autorizada de SIESA V2401, recálculo de macros/pivotes y comparación **exacta** con reportes aceptados.
7. Revisión de seguridad y autorización institucional; levantar guardas \`TEST-\` y \`PRUEBA\` solo en migración aprobada.
8. Mantener BALAM público y CRUM sin cambios; publicar únicamente tras pruebas.

**Decisión:** BALAM será el motor de registro, vinculación y seguimiento, pero SIESA seguirá definiendo los informes oficiales aceptados. Nunca sustituir formatos con un diseño parecido.
