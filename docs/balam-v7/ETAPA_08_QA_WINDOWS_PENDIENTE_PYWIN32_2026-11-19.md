# BALAM v7 · Resultado real de Windows, fase de inspección Excel

Fecha: 19 de noviembre de 2026. Evidencia suministrada: `BALAM_QA_WINDOWS_RESULTADO.json`.

## Datos declarados por el ejecutor
- Motor: `BALAM-V7-SIESA-WINDOWS-PYTHON-NO-POWERSHELL`.
- Huella SHA-256 de plantilla original validada: `6484c30f9112bfcc2cd3ef0087f85dcbcb45f71e776f1e39d1bda05d77a312f3`.
- Plantilla intacta: true.
- Copia sintética creada: true.
- Filas sintéticas: 6.
- Proyecto VBA intacto: true.
- Definiciones XML de tablas dinámicas: 42.
- VBA ejecutado: false.
- Enlaces externos actualizados: false.
- Estado de Excel de escritorio: **PENDIENTE_PYWIN32**.
- Versión de Excel detectada: null.
- Hojas y pivotes reconocidos por Excel: null.
- Pivotes actualizados: 0.
- PDF local generado: false.
- Homologación oficial: NO_CERTIFICADA.

## Interpretación
La fase de integridad y generación sintética fue completada en el equipo Windows; la fase de automatización Excel **no se ejecutó** porque no se encontró el paquete Python `pywin32` en ese intérprete. El resultado no demuestra falla de macros, pivotes ni SIESA. No se han confirmado equivalencias de reportes oficiales.

## Intervención propuesta sin eludir seguridad de TI
Se preparó un kit local `BALAM_V7_CONTINUAR_VALIDACION_EXCEL.zip`. Incluye `COMPLETAR_VALIDACION_EXCEL_SI_AUTORIZADO.cmd`, que primero verifica si existe `pywin32` y, solo con confirmación explícita del usuario y si la institución permite instalaciones desde PyPI, lo instala en el Python del usuario con `pip install --user --only-binary=:all: pywin32`. No ejecuta PowerShell, ni cambia ExecutionPolicy, ni requiere acceso administrativo. Si no está permitido, se cancela sin cambio. El kit ZIP **NO se publica en GitHub**, ya que se distribuyó directamente al usuario.

## Estado
**PENDIENTE:** ejecutar prueba de apertura de copia en Microsoft Excel mediante COM, contar hojas y pivotes reconocidos, comprobar opción de actualización de pivotes locales de origen permitido, inspeccionar reportes y hacer comparación oficial. Mantener macros deshabilitadas por seguridad y no compartir copias XLSM/PDF con cachés potencialmente nominales.

No se modificó `main` ni el SIESA original.