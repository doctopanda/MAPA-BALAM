# BALAM v7 - Etapa 11: corrección de detección Python en el P0 A/B

**Fecha:** 19/11/2026. **Estado:** nuevo iniciador CMD generado; prueba real en Windows pendiente.

## Síntoma
El usuario ejecutó `EJECUTAR_P0_ENFERMERIA.cmd` y recibió: «ERROR: Python no esta disponible», pese a haber ejecutado antes la validación Excel con Python y pywin32.

## Causa encontrada
El iniciador anterior anidaba un comando `where python` dentro de una rama `else` que comprobaba `%errorlevel%`. CMD expande `%errorlevel%` durante el análisis del bloque, ANTES de ejecutar `where python`, de forma que leía el resultado anterior de `where py`. Esto puede dar un falso negativo cuando `py` no está instalado en PATH pero `python` sí está disponible.

## Corrección aplicada en el paquete entregado
- ZIP nuevo: `BALAM_V7_P0_ENFERMERIA_WINDOWS_CORREGIDO.zip` (entregado por conversación, no se publican archivos XLSM).
- Iniciador sin PowerShell y sin comprobaciones `%errorlevel%` en bloques anidados.
- Prueba directamente `py -3`, `python`, `python3` y rutas usuales de instalación; comprueba Python >=3.9 y que `pythoncom` y `win32com.client` estén disponibles.
- Si no localiza un intérprete, permite indicar una ruta completa a `python.exe` o salir sin cambios.
- No instala nada, no cambia ExecutionPolicy ni políticas de TI.
- El script Python de prueba A/B NO cambió respecto de la entrega previa: dos copias sintéticas M2=0/1, VBA deshabilitado, verificación de resultado F38 y controles F39:F43.

## Verificaciones locales de la corrección
- Archivo ZIP leído y probado íntegro (CRC correcto).
- Cuatro archivos técnicos del paquete anterior conservan sus mismos bytes.
- Programa Python compilado sin errores de sintaxis.
- Comprobación estática del CMD superada: sin patrón antiguo `%errorlevel% equ`, búsqueda directa de intérprete con pywin32.

**Pendiente:** resultado real de Windows. El P0 de enfermería NO puede marcarse como PASS numérico hasta recibir `BALAM_P0_ENF_QA_RESULTADO.json` y corroborar que `Reporte_Ejecutivo!F38` aumenta exactamente 1.

PR #19 permanece en borrador y no se modificó la rama main.