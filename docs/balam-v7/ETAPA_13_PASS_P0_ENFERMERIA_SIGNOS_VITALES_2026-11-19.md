# BALAM v7 · Etapa 13 · Primer indicador SIESA validado numéricamente

**Fecha del ensayo:** 19 de noviembre de 2026, 20:09:41 UTC, según registro generado en Excel de Windows.
**Estado:** `PASS_P0_ENF_NUMERICO` para *toma de signos vitales* únicamente. No equivale a homologación institucional completa.

## Fuente de evidencia
El usuario entregó `BALAM_P0_ENF_QA_RESULTADO(1).json` generado por el ejecutor A/B de BALAM. Solo se transcriben indicadores y códigos técnicos, sin rutas privadas ni expedientes. El SHA256 de la plantilla original reconocido es:
`6484c30f9112bfcc2cd3ef0087f85dcbcb45f71e776f1e39d1bda05d77a312f3`.

## Resultado de control vs intervención

| Variable | Control (PXS=0) | Caso (PXS=1) | Delta | Criterio |
|---|---:|---:|---:|---|
| `Base_enf!M2` (PXS) | 0.0 | 1.0 | +1.0 | Entrada verificada |
| `Repor_enf` (TablaDinámica3, valor directo) | 0.0 | 1.0 | +1.0 | Agregación validada |
| `Reporte_Ejecutivo!F38` | 0.0 | 1.0 | **+1.0** | **PASS P0** |
| `F39` | 0.0 | 0.0 | 0.0 | Control estable |
| `F40` | 0.0 | 0.0 | 0.0 | Control estable |
| `F41` | 0.0 | 0.0 | 0.0 | Control estable |
| `F42` | 0.0 | 0.0 | 0.0 | Control estable |
| `F43` | 0.0 | 0.0 | 0.0 | Control estable |

- Excel 16.0 pudo abrir **ambas copias**, identificar **TablaDinámica3**, confirmar **origen local** y refrescarla sin error.
- Fórmula de F38 confirmada por Excel: `=GETPIVOTDATA("PXS signos vitales",Repor_enf!$C$18)`.
- Ambas lecturas finalizaron en `lectura_completa`.
- `macros_ejecutadas=false`, `vinculos_externos_actualizados=false`, `datos_sinteticos=true` y `original_intacto_final=true`.

## Interpretación
Esta es la **primera validación diferencial end-to-end** del recorrido `Base_enf → Repor_enf → Reporte_Ejecutivo` de BALAM/SIESA. Comprueba que alterar una unidad en `PXS` produce una unidad en el campo ejecutivo correcto, sin cambios colaterales F39:F43, bajo el escenario sintético controlado.

**NO certifica**: resto del módulo de enfermería, catálogos reales de operativo/institución/localidad, ejecución de VBA, impresión exacta, otros módulos SIESA, exportación del reporte oficial o procesamiento de registros nominales.

## Siguiente matriz P0 propuesta
1. Expandir el mismo ensayo diferencial a los demás indicadores de enfermería del Reporte Ejecutivo, contrastando **la fórmula real y el encabezado de su campo de origen** antes de automatizar la modificación de la celda fuente.
2. Ejecutar ensayos independientes +1 con controles negativos: cada indicador objetivo aumenta solo en su celda; los restantes permanecen en 0.
3. Guardar solo JSON con origen, celda de entrada, pivote, indicador, valores control/caso, delta y estado. Mantener XLSM y PDFs privados, y `main` / ramas checkpoint intactos.

## Decisión
Marcar **P0-ENF-SIGNOS-VITALES = PASS NUMÉRICO**, no homologación general. Mantener PR #19 en borrador hasta cubrir los otros indicadores, captura nominal segura y validaciones institucionales.
