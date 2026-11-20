# BALAM v7 | ETAPA 06: prueba de integración en COPIA XLSM (sin ejecutar macros)

**Fecha**: 18 de noviembre de 2026. **Estado**: desarrollo y pruebas con datos exclusivamente ficticios. NO fusionar a `main`.

## Resultado técnico local
- Se probó la inserción de **6 filas sintéticas** en una **copia** del XLSM SIESA V2401 previamente reparado; nunca se sobrescribió el original.
- Se modificaron únicamente 5 archivos XML de hojas fuente. Los demás componentes OOXML conservaron su contenido original, incluido `xl/vbaProject.bin` (SHA-256 igual).
- Se mantuvieron los **42 pivotes** y 18/18 cabeceras reconocidas. El nuevo XLSM es un contenedor ZIP íntegro, con todos los XML legibles.
- Se recuperaron exactamente las 6 filas por el lector BALAM SIESA; la fuente previa tenía 0 filas candidatas por el criterio técnico del lector.
- Pruebas negativas: se bloqueó texto no sintético aun con hash coherente; se rechazó reutilizar un XLSM ya alimentado como plantilla.
- **No se ha abierto el nuevo XLSM en Excel Windows**. No se refrescaron sus cachés ni se certificaron resultados o formatos de impresión.

## Scripts de prueba entregados de forma separada (NO copiar datos nominales a GitHub)
- `balam_siesa_xlsm_roundtrip_v7.py`: inyector local con verificación de copia. Requiere `scripts/balam_siesa_bridge_v7.py` y el diccionario de 1431 campos.
- `balam_siesa_validacion_excel_windows_v7.ps1`: inspección en Excel de escritorio con macros forzadas desactivadas; actualización de **pivotes directos de hoja** opcional solo en una copia TEST, sin `RefreshAll` global.
- `BALAM_V7_PRUEBA_INTEGRIDAD_XLSM.json`: manifiesto de integridad libre de contenido clínico.
- `BALAM_V7_SIESA_XLSM_VALIDACION_LOCAL_KIT.zip`: kit reproducible con scripts, diccionario y JSONL sintético, **sin plantilla XLSM**.

## Límites de seguridad
- No adjuntar el `.xlsm` resultante a PR ni publicar en Pages: conserva cachés antiguas del archivo base que podrían contener datos nominales.
- La presencia de un proyecto VBA binario idéntico NO certifica su ejecución correcta en otro equipo.
- El nuevo XLSM **no es todavía un reporte institucional**. Excel debe abrir la copia sin reparación, actualizar cachés pertinentes y completar pruebas celda a celda y PDF impreso contra un reporte oficial aceptado.
- No se habilita ingesta de datos reales ni se eliminan restricciones `TEST-`, `PRUEBA`, `DEMO_` del esquema privado de BALAM.
- Para generar los reportes exactos se requiere homologar todos los campos y confirmar cuál versión XLSM/reportes aceptan institucionalmente.

## Próxima compuerta P0
1. Ejecutar la validación Windows del XLSM con macros desactivadas, identificar pivotes y hojas por reporte.
2. Confirmar funcionamiento de SIESA V2401 con su proceso normal en el Excel de usuario, solo con información sintética.
3. Recibir un reporte oficial **de referencia, desidentificado**, para comparación de formato y cifras.
4. Recién después, implementar ingesta privada de registros, exportación segura a copia XLSM y homologación funcional.

**Checkpoint principal**: `fee7eef4c46cf49cc5424ac1f3171b5f1cf0ac10`. **PR**: https://github.com/doctopanda/MAPA-BALAM/pull/19