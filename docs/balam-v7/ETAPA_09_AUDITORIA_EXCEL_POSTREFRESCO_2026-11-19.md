# BALAM v7 · Etapa 09: Auditoría Excel Windows postrefresco

**Corte:** 19/11/2026. **Estado:** validación técnica parcial. No autoriza homologación oficial.

## Evidencia Windows recibida
- Windows Microsoft Excel 16.0 abrió 71 hojas, detectó y actualizó 42 pivotes sin errores reportados.
- El original quedó intacto; se generaron 6 filas sintéticas en copia, sin VBA ejecutado ni actualización de vínculos externos.
- PDF privado de `Reporte_Ejecutivo`: 4 páginas.

## Dictamen sobre los datos
Se verificó la persistencia de 6 filas sintéticas, pero sus campos son marcadores estructurales, **no capturas epidemiológicas semánticas**. En las bases hay textos como DEMO_FIELD_01/02 en columnas FECHA, LONGITUD u OPERATIVO; por tanto el refresco de pivotes no prueba los indicadores del reporte.

El validador sintético adicional identificó **29 hallazgos bloqueantes** en 6 filas (18 marcadores sin significado, 4 fechas inválidas, 3 operativos no válidos, 2 coordenadas no numéricas, 2 campos de indicador vacíos), con una huella de contenido duplicada. **0 filas aptas para evaluar conteos oficiales**.

## Problemas heredados detectados y corroborados
- El valor **2 localidades/colonias** de riesgos sanitarios proviene de `Reporte_Ejecutivo!C62` referenciando `'Localidades trab'!C13`, y ya estaba presente en el XLSM original.
- `ReporteVE`: 16 celdas con `#DIV/0!`. `ReportePromo`: 2 celdas `#REF!`. Estos errores están presentes tanto en original como en la copia refrescada.
- El PDF posee 4 páginas, con tablas fraccionadas y páginas 3 y 4 parcialmente huérfanas de rótulos. **Impresión oficial exacta no validada**.
- Excel reescribió 235 componentes ZIP, incluido `xl/vbaProject.bin`. El SHA-256 VBA pasó de `5501aa52656540cd5ea4ed3135b1b062fed2ff0d6e4dea8e88012d964fb7929a` a `60452210fc3a2d5a04880af48282b72f9147980b57b07d8beebf70a823c8211c`. El VBA sigue presente, pero **no puede afirmarse igualdad binaria tras el guardado**. Diferencia de bytes no equivale por sí sola a corrupción o cambio de lógica.

## Criterio de liberación actualizado
**P0**: circuito controlado `Base_enf → Repor_enf → Reporte_Ejecutivo` con **una captura sintética semánticamente correcta**, módulos con valor esperado, base antes/después, pruebas de agregación, revisión de los filtros del operativo y comparación de impresión.
Extender a Promoción, Psicología, Vigilancia y demás áreas después del primer PASS.
No ejecutar VBA para pruebas automatizadas sin autorización de TI. No incluir XLSM/PDF privados en GitHub.

El repositorio debe permanecer en la rama `feature/balam-v7-captura-distrital-siesa` con PR #19 borrador. No modificar `main` ni las ramas checkpoint.

**Resultado:** PASS técnico Excel, NO CERTIFICADO en semántica ni reportes institucionales.
