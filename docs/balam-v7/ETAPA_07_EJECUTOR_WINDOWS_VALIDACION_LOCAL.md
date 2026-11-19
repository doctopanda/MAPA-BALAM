# BALAM v7 - Ejecutor privado de validación SIESA en Windows

Fecha: 19 de noviembre de 2026. Estado: herramienta entregada; no se ha ejecutado Excel Windows desde ChatGPT.

## Qué se creó
Paquete privado `BALAM_V7_SIESA_WINDOWS_UN_CLIC.zip` entregado al usuario con:
- `EJECUTAR_VALIDACION_BALAM_SIESA.cmd` iniciador simple para Windows.
- `BALAM_V7_EJECUTOR_WINDOWS_1CLIC.ps1` automatización COM de Excel, con `AutomationSecurity=3` (VBA deshabilitado), sin actualización de vínculos externos.
- Scripts Python locales que construyen la copia sintética de la plantilla original.
- Diccionario de 1,431 columnas y seis filas de ejemplo, sin pacientes reales.
- Instrucciones y advertencias de seguridad.

## Comprobaciones realizadas aquí
- El original `SIESA_64bitsV2401 - SON.xlsm` coincide con la huella SHA-256 previamente registrada: `6484c30f9112bfcc2cd3ef0087f85dcbcb45f71e776f1e39d1bda05d77a312f3`.
- La inyección local, ejecutada desde el ZIP entregado, FINALIZÓ con código 0.
- Se insertaron exactamente 6 filas sintéticas en 18 hojas fuente (encabezados válidos).
- `vbaProject.bin` conserva su SHA-256, y hay 42 definiciones de pivotes.
- No se sobrescribió el XLSM original; se eliminó la copia temporal al finalizar.

## Qué deberá comprobarse en Windows
El script selecciona la plantilla, verifica hash, crea copia sintética y abre esa copia en Excel. Enumera reportes y pivotes. Ofrece pruebas optativas de refresco de cachés de pivotes locales y PDF en carpeta PRIVADA. No ejecuta VBA; por eso la homologación oficial sigue pendiente.

## Límites y precauciones
- El script PowerShell no fue ejecutado en Windows ni ha pasado QA en hardware del usuario: funcionalidad COM pendiente de confirmar.
- No eludir políticas de ejecución ni de seguridad TI; Python 3 y Excel escritorio deben estar disponibles.
- El PDF/XLSM resultante puede heredar cachés; no compartir ni publicar sin evaluación de información personal.
- Los reportes oficiales solo se consideran equivalentes después de compararlos con modelos aceptados y validar la ejecución de macros de SIESA.
- El kit ZIP NO se sube a GitHub público. Este documento contiene únicamente la bitácora técnica.

Enlace de revisión del proyecto: https://github.com/doctopanda/MAPA-BALAM/pull/19