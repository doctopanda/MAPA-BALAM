# BALAM v7 · Etapa 3: Correcciones auditadas y prevalidación SIESA
**Fecha:** 2026-11-18  
**Estado:** implementación en la rama de desarrollo, SOLO STAGING CON DATOS FICTICIOS.  
**PR:** https://github.com/doctopanda/MAPA-BALAM/pull/19

## 1. Cambios funcionales ya aplicados

**Corrección sin sobrescritura distrital.** Una cuenta autorizada del distrito registra una solicitud de modificación de **cantidad de acción**. La solicitud conserva identificador de acción, operativo, distrito, cantidad anterior, cantidad propuesta, motivo codificado, autor, fecha y decisión. Solo Administrador Estatal o Maestro resuelve y aplica el valor, de forma transaccional. La aplicación directa de otros campos clínicos, nombres, diagnósticos o geografía NO está habilitada. Las solicitudes aprobadas y rechazadas permanecen registradas. Las cantidades aprobadas generan una marca de auditoría adicional.

**Revisión de huellas SIESA.** Un capturista autorizado puede identificar un XLSX/XLSM local mediante SHA-256, tamaño, extensión, operativo y distrito. El navegador no envía filas ni contenido del archivo; la base guarda solamente una huella, un alias anónimo y el estado `identificado_sin_validar`. El índice `unique(operativo_id,distrito_id,sha256)` impide duplicar la misma huella dentro del operativo/distrito. El valor `filas_importadas` es SIEMPRE 0 en esta fase. No se ha implementado aún importación de registros ni reportes finales.

**Interfaz.** `captura/secure.html` y `captura/secure-app.js` incluyen área desplegable, acciones, selección de historial, propuesta de corrección, resolución por administración y elección de archivo SIESA para prevalidación local. La consulta de paciente exige folio completo. `captura/index.html` sigue siendo prototipo desconectado.

## 2. Inspección controlada de la plantilla de origen

Se ejecutó un prevalidador estructural local sobre el XLSM original del usuario, sin publicar datos de pacientes ni archivos nominales.

| Métrica | Resultado |
|---|---:|
| Hojas del libro | 71 |
| Hojas fuente del diccionario SIESA | 18 de 18 presentes |
| Discrepancias de encabezados frente al diccionario | 0 |
| Definiciones de caché de tablas dinámicas | 25 |
| Proyecto VBA presente | Sí |
| Filas con dos o más valores no fórmula en las 18 bases | 0 en este ejemplar |
| Celdas residuales en BaseVE | 791 celdas con valor 0 en una sola columna |
| Otros valores aislados | 1 marca `fecha_cap` en `operativos` y 5 en `base_reporta` |

**Interpretación:** los 791 ceros NO son 791 pacientes o acciones validadas. Tampoco demuestran ausencia universal de registros: antes de importar cualquier archivo nuevo deben ejecutarse reglas por campos clave, tipo de hoja, operativo y fecha. No copiar cachés de pivotes como fuente de casos o acciones.

**Prevalidador local:** `siesa_v2401_prevalidador_seguro.py` entregado como archivo de trabajo separado; su manifiesto JSON no expone filas, nombres o valores nominales y no equivale a una importación.

## 3. Pruebas ejecutadas

| Componente | Verificación | Estado |
|---|---|---|
| Correcciones | Crear solicitud, resolver como administrador, cambiar cantidad, bloquear segunda resolución | PASS en transacción revertida |
| Huella SIESA | Registro inicial, idempotencia de SHA-256, formato inválido | PASS en transacción revertida |
| UI protegida | Sintaxis JS después de recuperar una expresión incompleta y retirar duplicado de código | PASS |
| UI protegida | Todos los IDs referenciados existen en HTML | PASS |
| Protecciones de base | Triggers de inserción y actualización de cantidad presentes | VERIFICADO en catálogo SQL |
| Persistencia después de pruebas | 0 operativos, 0 personas, 0 acciones, 0 solicitudes, 0 lotes, 0 eventos | VERIFICADO |
| Acceso anónimo a RPC de captura | Sin permisos EXECUTE | Verificado en etapa anterior |
| Prueba real con navegadores y cuentas distritales | Pendiente | NO REALIZADA |
| Excel oficial idéntico a SIESA V2401 | Pendiente | NO HOMOLOGADO |

### Migraciones de esta intervención
- `balam_v7_district_corrections_audited_20261118`
- `balam_v7_siesa_file_fingerprint_staging_20261118`
- `balam_v7_audit_corrections_and_quantity_changes_20261118`

No se alteraron políticas de CRUM, ni se fusionó a `main`. Se mantiene el checkpoint anterior.

## 4. Bloqueos para uso institucional real

1. Homologar **cada campo SIESA** con las tablas BALAM, tipos, catálogos, denominadores, semántica y reporte destino.
2. Construir importador real con staging, detección de duplicados por fila, validación por tipo y rechazo sin pérdidas.
3. Construir camino de regreso: base BALAM → copia XLSM SIESA → Excel Windows recálculo/pivotes → reportes **exactamente iguales** a referencia institucional.
4. Completar pruebas de usuario por distritos y separación de módulos clínicos sensibles, inclusive psicología.
5. Endurecer autenticación, auditoría de acceso, errores de captura, concurrencia, control de cierre de operativos y auditoría nominal.
6. Mantener nombres `PRUEBA `, claves `TEST-` y acciones `DEMO_` como barrera de staging; jamás quitar esta protección antes de autorización formal.

**Advertencia preexistente:** Supabase Security Advisor señala `Leaked Password Protection Disabled`. Revisar antes de producción: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Conclusión
Se añadió la base técnica para seguimiento y corrección auditada, pero **BALAM todavía NO importa las filas de un XLSX ni genera reportes oficiales SIESA**. Esos entregables siguen siendo requisito P0 antes de considerar una versión productiva.
