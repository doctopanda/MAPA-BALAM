# SIESA V2401 · Referencia maestra para BALAM v7

**Fecha de comprobación:** 19 de noviembre de 2026  
**Estado:** verificación estructural y comparación binaria. No equivale a homologación de reportes.

## Decisión de referencia
El archivo `SIESA_64bitsV2401 - SON.xlsm`, que el usuario consiguió abrir en Excel de Windows después del cambio de configuración regional, es **idéntico byte por byte** al archivo original `SIESA_64bitsV2401 - SON OSS HURACAN POLO SON.xlsm` que inició el análisis.

**SHA-256 completo (ambas copias):**
`6484c30f9112bfcc2cd3ef0087f85dcbcb45f71e776f1e39d1bda05d77a312f3`

**Proyecto VBA, SHA-256:**
`5501aa52656540cd5ea4ed3135b1b062fed2ff0d6e4dea8e88012d964fb7929a`

| Verificación | Resultado |
| --- | --- |
| Tamaño de archivo | 12,529,256 bytes |
| Partes ZIP internas | 398 |
| CRC ZIP | Correcto |
| Hojas | 71 |
| Hojas visibles al abrir XML | 1 (Hoja1); las demás están ocultas |
| Definiciones de tablas dinámicas | 42 |
| Cachés de pivotes | 25 |
| Enlaces a otros libros | 8 |
| Proyecto VBA | Presente y no alterado |
| Identidad frente a original Huracán Polo | Idéntico |
| Identidad frente a versión reparada experimental | Diferente |

### Consecuencias para BALAM
1. **Usar la plantilla original** como referencia institucional de hojas, macros, formularios y reportes. No usar la versión reparada como autoridad funcional.
2. La apertura satisfactoria tras cambiar el ajuste de compatibilidad Windows UTF-8 es evidencia práctica de un problema del entorno. No prueba por sí misma que VBA, reportes y pivotes actualicen correctamente.
3. Mantener la plantilla original sin modificaciones y fuera del GitHub público. Las pruebas se realizan sobre **copias privadas con datos sintéticos**.
4. No copiar datos de las cachés dinámicas como si fueran registros nuevos. Las 18 bases de captura se reconocen, pero hay residuos y catálogos que deben separarse de nuevas capturas.
5. Las hojas de presentación inicialmente ocultas pueden depender de lógica VBA. No cambiar arbitrariamente su visibilidad en la plantilla maestra.
6. Hay 42 definiciones de tablas dinámicas pero ningún elemento `pivotTableParts` en los XML de hoja. Esto exige **prueba de actualización real en Excel Windows**; sin ella no se puede atribuir a un error ni afirmar equivalencia de reportes.
7. El formato institucional de salida seguirá siendo **el XLSM de referencia** y sus productos aceptados; BALAM sirve para capturar, auditar, seguir operativos y pasar datos a una copia del XLSM.

### Compuerta de homologación
Antes de producir reportes institucionales desde BALAM, ejecutar en el equipo Windows de prueba, con archivos sintéticos:

- Abrir una copia del SIESA original; verificar que no haya mensaje de reparación.
- Validar inicio de formulario y navegación por cada módulo.
- Capturar una muestra sintética de enfermería, psicología y promoción.
- Ejecutar generación y actualización de tablas dinámicas desde el flujo normal de SIESA.
- Comparar tablas, indicadores, hojas, logos, encabezados, márgenes, áreas de impresión y hojas exportadas contra modelos institucionales aceptados.
- Registrar reporte, fecha, operativo, versión, hash y resultado (PASS/FAIL) de cada módulo.
- Investigar los ocho vínculos externos para impedir dependencias a rutas faltantes.

**No modificar `main`, los checkpoints ni el proyecto SIESA original.** Continuar pruebas en `feature/balam-v7-captura-distrital-siesa` y PR #19 en borrador.

> El archivo XLSM original no está almacenado en GitHub, únicamente esta huella digital y las instrucciones para su validación.
