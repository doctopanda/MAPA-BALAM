# BALAM v7 - Etapa 05: puente SIESA, filas indexadas y reconstrucción de prueba

Fecha: 18 de noviembre de 2026. Estado: STAGING, exclusivamente pruebas sintéticas.

## Implementado
- Lector de hojas OOXML XLSX/XLSM en scripts/balam_siesa_bridge_v7.py: 18 bases, 1431 columnas, validación de encabezados, límites ZIP, sin ejecutar VBA ni cargar valores personales a la nube.
- Normalización de espacios únicamente en cabeceras; 5 diferencias inocuas en Base_vec, Basered y BASELABHUM.
- Extracción local solo de libros con marcador BALAM_SYNTHETIC_V7_TEST_ONLY; textos sintéticos DEMO_/PRUEBA_/TEST_.
- Supabase privado: balam_capture.siesa_filas_indice (RLS). Solo huellas SHA256, posición, hoja, lote, distrito y operativo; NO contenido de celdas.
- RPC públicas SECURITY INVOKER limitadas a authenticated: balam_v7_index_siesa_rows y balam_v7_index_siesa_summary. Primera indexación e idempotencia probadas en transacciones rollback.
- Interfaz autenticada con selector JSON de índices, correspondencia del hash Excel y revisión de duplicados.
- Paquete local sintético que incluye un XLSX reconstruido, el mismo orden de 18 bases y las 6 filas ficticias. Comparación de contenido SHA256 ida y vuelta superada.

## Evidencia
| Ensayo | Resultado |
| --- | --- |
| Compatibilidad con 18 bases originales | PASS |
| Rechazo de demo-export del XLSM original | PASS: bloqueado |
| Identificación de 6 filas sintéticas y 1 duplicado de contenido | PASS |
| Reconstrucción XLSX: 18 bases, mismas 6 filas y hashes | PASS |
| API de huellas: 3 indexadas, 1 duplicado, 0 filas importadas | PASS en ROLLBACK |
| JavaScript: sintaxis y referencias de HTML | PASS |
| Cuentas distritales reales / navegador / MFA | PENDIENTE |
| Reportes oficiales SIESA XLSM idénticos | PENDIENTE |

## Restricciones institucionales
- Indexar filas no equivale a importar datos clínicos, personas o actividades.
- El reporte institucional aceptado exige una copia funcional del XLSM SIESA, macros, pivotes, márgenes, logos y prueba de impresión en Excel Windows.
- No se deben usar ni exportar pacientes reales sin homologación, controles nominales por especialidad, auditoría de lecturas y autorización institucional.
- Los puntos de control y main no se han modificado. El PR 19 debe seguir en borrador.

Documentación previa: docs/balam-v7/ETAPA_04_PUENTE_SIESA_TEST_ONLY.md.