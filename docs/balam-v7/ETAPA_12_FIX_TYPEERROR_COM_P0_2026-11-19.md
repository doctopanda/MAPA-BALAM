# BALAM V7 / Etapa 12 - TypeError COM en P0 de enfermería

Fecha: 19/11/2026. Estado: código corregido y probado localmente con simulación COM. Validación real Excel Windows pendiente.

## Evidencia del usuario
- Resultado JSON BALAM_P0_ENF_QA_RESULTADO.json, protocolo BALAM_V7_P0_ENF_AB.
- SHA-256 original verificado y original intacto; copias ficticias creadas.
- Estado ERROR_EXCEL_COM, tipo TypeError, HRESULT no disponible.
- El JSON previo no registra la etapa exacta; NO se puede demostrar cuál instrucción falló.

## Hipótesis técnica y corrección
- La API anterior llamaba `Worksheet.PivotTables('TablaDinámica3')`, potencialmente incompatible con la implementación COM pywin32 de Excel 16.
- Se usa ahora `Worksheet.PivotTables().Item('TablaDinámica3')`, con búsqueda por índice como alternativa.
- Se abren exclusivamente las copias sintéticas en modo lectura/escritura temporal, con macros desactivadas, sin actualizar vínculos externos y `Close(SaveChanges=False)`.
- La auditoría JSON incluye caso (CONTROL_PXS0 / CASO_PXS1), etapa detallada, tipo, HRESULT cuando esté disponible y número de línea técnica, sin exportar nombres/rutas de pacientes.
- Se conserva la lógica numérica para F38 y controles F39:F43; el caso solo aprueba cuando ambos pivotes reportan refresco correcto.

## Verificaciones efectuadas
- El script Python modificado compila correctamente.
- Prueba mock COM: un wrapper que solo permite `PivotTables().Item(...)` pasa; cálculo sintético de F38: 0 y 1.
- Prueba mock de excepción en localización de pivote identifica `localizar_tabla_dinamica_3` y el caso correspondiente.
- Antes del ajuste final, la generación real de dos copias de prueba con `--solo-preparar` terminó PENDIENTE_EXCEL_WINDOWS, sin cambio en el original.
- ZIP final de seis archivos verificado por CRC, sin .xlsm, .xlsx, .pdf, PII ni claves secretas.

## Entrega
- BALAM_V7_P0_ENFERMERIA_COM_DIAGNOSTICO_CORREGIDO.zip, entregado directamente a través de ChatGPT.
- No se habilita PowerShell ni se modifican políticas Windows. Se conserva el launcher que antes detectó Python y pywin32 correctamente.
- No se publica el XLSM original ni las copias en GitHub.

## Condición de avance
Ejecutar EJECUTAR_P0_ENFERMERIA.cmd y recibir BALAM_P0_ENF_QA_RESULTADO.json. Si el resultado sigue ERROR_EXCEL_COM, usar las nuevas claves `detalle_error.etapa`, `caso` y `tipo` para aislar el punto. Solo marcar PASS_P0_ENF_NUMERICO si `delta_f38=1`, todos los controles tienen delta 0 y PXS en la base es 0/1.

PR #19 continúa borrador. `main` y checkpoints intactos.