# BALAM v7 · Etapa 14 · Matriz P0 de cinco indicadores de enfermería

**Fecha:** 19 de noviembre de 2026. **Estado:** paquete de pruebas preparado, revisión sintáctica y simulación COM aprobadas; **Excel Windows real PENDIENTE**.

## Prueba P0 antecedente aprobada
`Base_enf!M2 (PXS) → Repor_enf TablaDinámica3 → Reporte_Ejecutivo!F38` obtuvo `PASS_P0_ENF_NUMERICO` en Excel 16.0, con +1 en F38 y F39:F43 sin variación. Registro: `ETAPA_13_PASS_P0_ENFERMERIA_SIGNOS_VITALES_2026-11-19.md`.

## Alcance de la matriz nueva (cada fila se ensaya por separado)

| Campo de origen, Base_enf | Celda | Fórmula ejecutiva de destino |
|---|---|---|
| A_MEDICAMENTO | N2 | F39: GETPIVOTDATA("APLICACION DE MEDICAMENTO", Repor_enf!$C$18) |
| CURACION | O2 | F40: GETPIVOTDATA(" CURACION", Repor_enf!$C$18) |
| DXT | P2 | F41: GETPIVOTDATA(" DXT", Repor_enf!$C$18) |
| SOMATOMETRIA | R2 | F42: GETPIVOTDATA(" SOMATOMETRÍA", Repor_enf!$C$18) |
| GEL_ANTI | T2 | F43: GETPIVOTDATA(" GEL ANTIBACTERIAL", Repor_enf!$C$18) |

Estos encabezados y fórmulas fueron verificados directamente en la plantilla SIESA original. Se mantiene F38 (PXS) como control negativo junto a los otros indicadores.

## Estrategia revisada
Se creó `BALAM_V7_P0_ENFERMERIA_MATRIZ_F39_F43_WINDOWS.zip` para ejecución local. **No se publica el XLSM ni el contenido de cachés en GitHub**.

- Comprobación del SHA-256 institucional de SIESA original, sin sobrescribirlo.
- Se prepara **una única copia** XLSM con una fila de prueba semántica para Base_enf y cinco valores inicialmente en cero. Copias adicionales se descartaron por su alto costo.
- En Excel Windows con macros deshabilitadas, vínculos externos desactivados y sin guardar el libro: se mide el baseline F38:F43; luego, uno a uno, se escribe un único 1, refresca TablaDinámica3, recalcula y observa el resultado. Después devuelve la celda a cero, refresca y **exige recuperación exacta de baseline** antes del siguiente indicador.
- Cada resultado se acepta solo si su celda aumenta +1, las otras cinco permanecen en cero, el dato de entrada fue 1 y la reversión se verificó.
- Entrega exclusiva del JSON `BALAM_P0_ENF_MATRIZ_QA_RESULTADO.json`, sin archivos clínicos ni XLSM.

## Verificaciones realizadas antes de entregar
- Python compila sin errores.
- Un ensayo local `--solo-preparar` validó SHA, generó una copia sintética desde el XLSM original y terminó en `PENDIENTE_EXCEL_WINDOWS`.
- Prueba simulada de Excel COM cubrió los cinco campos: +1 en F39:F43 de forma individual, resto en cero y reversión a baseline: **PASS SIMULADO**.
- ZIP CRC correcto, sin XLSM/XLSX/PDF, registros reales ni claves privadas.
- **No se afirma PASS de Excel real ni homologación oficial**.

## Bloqueos permanentes
- Confirmar resultados de Windows mediante JSON.
- Validar equivalencia del flujo SIESA oficial, VBA autorizado, catálogos, filtros reales, impresión y reportes aceptados.
- Continuar con controles de RLS, auditoría de lecturas y roles institucionales en BALAM.
- Mantener la rama `main` y checkpoints intactos; PR #19 en borrador.
