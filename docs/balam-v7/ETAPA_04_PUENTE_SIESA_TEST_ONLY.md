# BALAM v7 · Puente SIESA V2401: fase de extracción/indexado

**Fecha:** 2026-11-18. **ESTADO: SOLO PRUEBAS**. El libro original y los puntos de control en GitHub permanecen intactos.

## Inspección real de SIESA
- 18 bases oficiales, 1,431 columnas, 25 definiciones de caché de pivotes.
- El libro nominalizado original no se expone ni se carga a GitHub.
- Se detectaron 5 discrepancias de espacios en encabezados originales: 3 Base_vec, 1 Basered y 1 BASELABHUM. Se normalizan ÚNICAMENTE espacios de cabecera para verificar compatibilidad; se conservan valores y posiciones para la homologación de salida.
- BaseVE tiene celdas residuales con 0, no equivalentes a pacientes ni acciones.
- No utilizar los cachés de tablas dinámicas como fuente de capturas nuevas.

## Implementación de desarrollo
1. Lector Python local `balam_siesa_bridge_v7.py`: OOXML ZIP/ElementTree, límite de tamaño, validación de 18 bases, cabeceras y filas candidatas. No ejecuta VBA, no conecta a la red ni exporta valores personales por defecto.
2. Un archivo Excel **sintético** de prueba contiene las 18 bases + hoja `_BALAM_DEMO_ONLY` con marcador `BALAM_SYNTHETIC_V7_TEST_ONLY`; extracción de valores solo permitida cuando existe ese marcador y todos los textos de captura comienzan por DEMO_/PRUEBA_/TEST_. Esto no reemplaza protección institucional ni permite uso real.
3. La extracción de prueba produjo 6 filas candidatas, identificó 1 contenido duplicado y verificó 1,431 cabeceras.
4. Supabase `balam_capture.siesa_filas_indice` almacena solamente lote, operativo, distrito, hoja, número de fila y huella SHA-256. **NO ALMACENA CONTENIDOS DE CELDAS**.
5. RPC `balam_v7_index_siesa_rows` valida hasta 100 huellas por llamada, evita reindexado accidental de igual fila, y bloquea huellas inconsistentes. `balam_v7_index_siesa_summary` informa filas indexadas, contenidos repetidos y `filas_importadas=0`.
6. La UI protegida `captura/secure.html` ofrece índice JSON sintético con hash del Excel coincidente y bloquea campos extra. Los 7 permisos previos se mantienen. No publicar en GitHub Pages / main.

## Resultados verificados
- Escaneo del SIESA XLSM original: 18/18 bases compatibles, 0 filas candidatas según criterio de al menos dos celdas no fórmula.
- Modo exportación de filas del XLSM original: RECHAZADO por no contener marcador sintético.
- Excel sintético: 18/18 bases, 6 filas, 1 duplicado.
- Supabase: 3 huellas de fila indexadas, segunda carga idempotente, 1 duplicidad detectada, **0 filas importadas**, transacción revertida.
- No hay inserciones de pacientes, casos ni archivos originales al repositorio.

## Pendiente para cumplir el requisito institucional P0
- Mapeo de cada campo por módulo: claves, tipo, unidades, fechas, catálogos y reglas de agregación, con aprobación humana.
- Motor privado de ingesta nominal y auditoría de lecturas, cifrado y asignación por distrito. El indexado de SHA no equivale a importar un Excel.
- Prueba de transformación BALAM → **COPIA** XLSM SIESA V2401 en Excel Windows con hojas, formularios, macros y pivotes.
- Comparación celda a celda y de páginas impresas de cada reporte contra la plantilla aceptada.
- Pruebas de seguridad con cuentas reales de distintos distritos y autorización institucional.
- Nunca presentar resultados de este prototipo como reportes oficiales.

## Datos y privacidad
La prevalidación anónima incluye hashes de valores; estos también merecen protección y alcance distrital. El repositorio GitHub debe contener solo código, estructura y datos ficticios. El manifiesto local `BALAM_V7_SIESA_INDICE_SINTETICO.json` aporta únicamente huellas en el ejemplo; en el uso futuro la ingesta estará en un servicio privado y autenticado.

**Lectura recomendada:** https://supabase.com/docs/guides/database/postgres/row-level-security
