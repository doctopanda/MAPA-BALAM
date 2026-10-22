# BALAM 6.0 | Preparación de capa CRUM y Supabase

Estado: preparación, no conexión en vivo. Documento de arquitectura, 22 de octubre de 2026.

## Situación real

El MAPA-BALAM ya permite encender los seis distritos (data/districts.json). Solo DS05 tiene actualmente un dataUrl de métricas con corte. El portal CRUM facilitado por el usuario muestra una SPA con verificación de acceso, no una API pública confirmada.

El inventario CSV revisado (no se añade a GitHub por contener coordenadas operativas) tiene 429 registros de inventario de 29 instituciones, distribuidos preliminarmente en DS01=150, DS02=26, DS03=83, DS04=77, DS05=47, DS06=37 y 9 registros sin asignación validada. No significa 429 ambulancias operativas. La página fuente declara un universo de 135 ambulancias en 28 localidades, que debe reconciliarse con CRUM.

## Contrato para la integración

1. Ingesta por backend a Supabase de BALAM: asset_key estable derivada de institución+unidad, lote SHA-256, código municipal INEGI, distrito, clasificación, ubicación base, timestamp de importación y bitácora de cambios.
2. Esquemas protegidos por RLS: estatal/maestro ve todos los distritos; distrital solo el ámbito asignado. Clave secreta solo en backend. Evitar subir CSV/raw a GitHub Pages.
3. Tablas dedicadas: balam_crum_assets, balam_crum_imports, balam_crum_asset_versions, balam_metric_snapshots, balam_crum_approved_public_counts, balam_access.
4. UI interna lee solo los cortes y filtros solicitados. La capa pública solo puede alimentarse de agregados revisados, sin claves de unidad ni coordenadas precisas. El catálogo deja CRUM deshabilitado hasta tener datos y autorización reales.
5. No deducir disponibilidad, actividad actual, tiempos de respuesta ni estado GPS con el CSV. Mantener faltantes como desconocidos.

## Condiciones de activación

- Identificar proyecto Supabase de BALAM, distinto de EDITH/PULSO/Nutriendo Futuros salvo autorización expresa.
- Aprobar contrato y mecanismo legítimo de sincronización con CRUM (endpoint/API o exportación periódica autorizada).
- Aplicar migración, cargar y auditar CSV privado, probar RLS y validar inventario con responsable CRUM.
- Solo entonces habilitar el catálogo de fuente y el dataUrl de lectura agregada aprobado. No modificar el visor público para leer información protegida.

## Fuentes de contexto
- https://salud.sonora.gob.mx/index.php/acerca-de/distritos
- https://github.com/doctopanda/MAPA-BALAM/blob/main/data/districts.json
- https://supabase.com/docs/guides/database/postgres/row-level-security
