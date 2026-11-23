# BALAM v7 · Captura Distrital + Puente SIESA
**Corte de diseño:** 2026-11-18  
**Estado:** construcción en rama `feature/balam-v7-captura-distrital-siesa`; sin despliegue productivo.

## Control de versiones y puntos de restauración
- Repositorio principal `doctopanda/MAPA-BALAM`: SHA inmutable `fee7eef4c46cf49cc5424ac1f3171b5f1cf0ac10`, rama `checkpoint/balam-pre-captura-siesa-2026-11-18`.
- Repositorio cartográfico `doctopanda/MAPA-BALAM-2`: SHA `2c73f47ccd5bebc8b251562a52391b885205f56d`, rama `checkpoint/balam-cartografia-2026-11-18`.
- La rama `main` no se modifica como parte de esta fase.
- Respaldo de aplicaciones operativas locales con nominales requiere almacenamiento privado y registro SHA-256 independiente. Nunca subir nominales a GitHub.

## Contrato funcional
1. **Operativos**: abrir nuevo operativo basado en el catálogo SIESA V2401, asignar fecha inicial y final, distrito(s), localidades, responsables y estado (borrador/activo/cerrado). Una captura siempre pertenece a un operativo y a un distrito.
2. **Captura distrital**: el capturista/supervisor autenticado ve y escribe SOLO registros del distrito asignado y operativos expresamente autorizados. El estado del operativo controla cambios. El supervisor puede monitorear pendientes/errores de su distrito; estatal/maestro tienen alcance ampliado autorizado.
3. **Persona única**: registrar a la persona una sola vez dentro de su alcance; buscar por folio y atributos de identidad autorizados; desambiguar antes de vincular. El modelo diferencia persona, inscripción al operativo, atención y acciones. No reutilizar una nota psicológica como dato general visible a otros módulos.
4. **Captura compacta**: usar desplegables con búsqueda por folio, área y acción; precargar datos demográficos aprobados. Permitir varias acciones de diferentes áreas en la misma atención sin capturar de nuevo datos de identificación.
5. **Vaciado físico**: capturar transcripciones y validarlas contra el formulario físico; conservar responsable, fecha de transcripción, fecha de atención, procedencia y motivo de corrección. No tratar una fila como persona única.
6. **Importación Excel SIESA**: recibir archivos y hojas estructuradas, procesar en staging por lote, comparar SHA-256, conservar nombre/version/periodo/hoja/filas origen. Duplicados y errores se revisan antes de consolidar.
7. **Informes SIESA exactos**: exportar desde BALAM los registros al esquema de las bases SIESA; cargar una COPIA de plantilla XLSM validada y recalcular/refrescar pivotes en Excel de escritorio; comparar celdas, conteos y salidas impresas con modelos oficiales. No afirmar equivalencia hasta pruebas.
8. **BALAM público**: solamente vistas agregadas autorizadas. Nunca publicar nominales, CURP, fichas, XLSM poblados o credenciales en GitHub Pages.
9. **Auditoría**: registrar usuario, rol, distrito, operativo, registro, acción (INSERT/UPDATE/DELETE/EXPORT), marcas temporales y diferencias autorizadas; conservar historial sin sobreescritura silenciosa.

## Modelo de dominio propuesto
- `operativos`: id, clave, nombre, inicio/fin, estatus, plantilla_siesa_version, created_by.
- `asignaciones_operativo`: operativo_id, distrito_id, user_id, rol, activo, inicio/fin de vigencia.
- `personas` (**privado**): id UUID y datos de identidad protegidos; no exponer consultas amplias por coincidencias a capturistas.
- `participaciones`: persona_id + operativo_id + distrito_id + folio de operativo, unique por operativo/persona/territorio bajo reglas verificadas.
- `atenciones`: id, participación_id, fecha real de servicio, localidad/código territorial, responsable, método de origen.
- `acciones`: id, atención_id, módulo, código de acción, cantidad, unidad_de_medida, estado y clave SIESA homologada.
- `lotes_importacion`: hash, fuente, operativo, distrito, versión SIESA, validación y resultado.
- `mapeo_siesa`: versión, módulo, código de acción, hoja, columna, reglas de denominador/agregación.
- `auditoria`: quién/cuándo/qué, sin incluir diagnósticos o identificadores completos en logs generales.
- `exportaciones`: operativo, distrito(s) permitido(s), corte, lotes incl., hash de salida, plantilla y aprobaciones.

## Seguridad de base de datos (bloqueante)
- Antes de introducir datos reales, inventariar esquema de BALAM, `balam_access`, triggers, RLS y objetos expuestos por Data API.
- Reglas RLS efectivas en la base, **no** solo filtros en JavaScript. Usar asignaciones verificadas por `auth.uid()`, vigencia, distrito y operativo. No usar claims editables por el usuario.
- Aplicar política SELECT + INSERT + UPDATE (USING y WITH CHECK) por tabla, y probar negaciones entre DS01 y DS06. Nadie debe poder reasignar distrito/operativo modificando un campo.
- Las tablas nominales pueden usar esquema privado y API/RPC restringida auditada. No exponer service_role ni secretos al navegador.
- La búsqueda de pacientes debe limitar resultados y proteger contra enumeración; cifrado/seguridad clínica y controles institucionales según aprobación.
- Descargas nominales: permisos explícitos + trazabilidad; no habilitarlas a capturistas por defecto.
- Revisar si el esquema actual admite submódulos; no ejecutar SQL de producción sin pruebas de regresión CRUM.
- Probar con datos sintéticos, al menos roles Pendiente, Capturista DS05, Supervisor DS05, Supervisor DS06, Estatal y Maestro.
- Deshabilitar cache en el navegador de respuestas que contienen datos sensibles y limpiar sesión adecuadamente.

## Hitos y pruebas de aceptación
| Fase | Criterio de salida | Estado |
| --- | --- | --- |
| 0. Preservación | Ramas checkpoint apuntando a SHA establecidos | COMPLETADA |
| 1. Prototipo UI | Crear operativo/paciente ficticios, reutilizar datos, desplegables, agregar acciones, historial temporal | DESARROLLADA, QA de navegador pendiente |
| 2. Integración Auth/RLS | Capturista DS05 no lee/escribe DS06, y no puede alterar operativo sin autorización | PENDIENTE |
| 3. Persistencia | CRUD transaccional con auditoría, folios únicos e idempotencia | PENDIENTE |
| 4. Vaciado y Excel | Lotes por distrito, control de errores y deduplicación | PENDIENTE |
| 5. Reporte homologado | SIESA V2401 produce Excel/PDF idénticos a referencias validadas para mismo corte | PENDIENTE |
| 6. Despliegue protegido | QA de seguridad y autorización institucional; enlaces del README solo tras publicar | PENDIENTE |

## Pruebas de conteo
- Una persona + tres atenciones + diez acciones no equivale a diez personas.
- Varias acciones en una visita se exportan de forma que SIESA conserve las unidades y sus definiciones originales.
- Corregir una atención no multiplica actividades en importaciones subsiguientes.
- Reportes siempre fijan operativo, distrito(s), fecha de corte y versión de catálogo.
- Cero observado no equivale a falta de datos.

## Enlaces de acceso actuales, SIN CAMBIOS
- Mapa: https://doctopanda.github.io/MAPA-BALAM/
- Visor WebApp: https://doctopanda.github.io/MAPA-BALAM/visor/
- Visor Escritorio: https://doctopanda.github.io/MAPA-BALAM/escritorio/
- La ruta `captura/` está solo en la rama de desarrollo; no ofrecer como módulo real publicado.
