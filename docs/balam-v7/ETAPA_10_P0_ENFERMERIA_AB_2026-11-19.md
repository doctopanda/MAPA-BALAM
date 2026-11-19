# BALAM v7 · Etapa 10 · Prueba diferencial P0 de enfermería

Fecha: 19/11/2026. Estado: generación y aislamiento local **PASS**; medición de Excel Windows **PENDIENTE**. No certifica reportes oficiales.

## Ruta demostrada mediante relaciones OOXML originales
- Base_enf: 38 campos de cabecera; PXS es la columna M (índice 13), FECHA es B.
- Cache de pivote ID 10: origen `Base_enf!A1:AI20000`.
- Hoja `Repor_enf`: cuatro tablas dinámicas usan esta caché, y `TablaDinámica3` (región C18:D37) agrega `PXS` con nombre `PXS signos vitales`.
- `Reporte_Ejecutivo!F38 = GETPIVOTDATA("PXS signos vitales",Repor_enf!$C$18)`.
- F39:F43 dependen de otros campos (medicamentos, curaciones, DXT, somatometría y gel).
- Nota de trazabilidad: el mapeo de caché anotado en una auditoría estática anterior era incorrecto para este circuito; se corrigió releyendo las relaciones workbook→caché→tabla dinámica.

## Diseño de prueba controlada
Se preparó `BALAM_V7_P0_ENFERMERIA_AB_WINDOWS.zip` sin PowerShell, sin XLSM ni datos reales. Abre el SIESA original solo para verificar SHA256; genera dos copias privadas con la misma fila ficticia en Base_enf:
- CONTROL: M2/PXS = 0
- CASO: M2/PXS = 1
- FECHA y FECHA_CAP usan números de serie Excel; los demás campos cuantitativos M:AE se fijan en 0. Los textos llevan prefijo TEST_/PRUEBA_.
- Los otros campos se mantienen idénticos en ambas copias, incluso los del operativo, fecha y localidad.

## Verificación local ejecutada
- SHA256 maestro verificado: `6484c30f9112bfcc2cd3ef0087f85dcbcb45f71e776f1e39d1bda05d77a312f3`.
- Se generaron y verificaron dos copias XLSM sin sobrescribir el original.
- Comparación de los componentes ZIP: la **única parte distinta entre ambas copias** es `xl/worksheets/sheet26.xml`.
- Comparación de celdas: la **única celda distinta** es `M2`, 0 contra 1.
- VBA y demás componentes son idénticos entre las copias; cada copia conserva los 42 pivotes.
- Kit ZIP verificado, sin XLSM/XLSX, macros compiladas ni datos personales.

## Prueba que debe ejecutarse en Windows
Ejecutar `EJECUTAR_P0_ENFERMERIA.cmd` con Microsoft Excel y pywin32 ya autorizados. El programa usa COM con `AutomationSecurity=3`, desactiva VBA, omite vínculos externos y abre las dos copias en modo lectura. Refresca solo `Repor_enf.TablaDinámica3`, recalcula y lee F38 y los controles F39:F43.

**Aceptación P0 limitada:** diferencia `F38_CASO - F38_CONTROL == 1`, diferencia de F39:F43 igual a 0, lectura directa de Base_enf!M2 de cada copia igual a 0/1 y sin errores de refresco. Entregar únicamente `BALAM_P0_ENF_QA_RESULTADO.json` para revisión.

**No equivale a homologación institucional completa:** los valores de geografía/institución están marcados como sintéticos y no representan todos los catálogos. Si el pivote tiene filtros que excluyen el operativo de prueba, el ensayo puede fallar y se investigarán sus reglas en Excel. No se ejecuta VBA ni se certifica formato de impresión.

El ZIP se entregó directamente en la conversación al usuario; no se publica el archivo de la plantilla ni sus copias en GitHub. `main` y ramas checkpoint continúan intactas.