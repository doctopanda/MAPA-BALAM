# BALAM 0.9 · SMN/CONAGUA + CRUM en un mismo mapa

## Propósito
Se incorpora a MAPA BALAM una segunda capa **independiente y superponible** de pronóstico meteorológico, sin afectar la cartografía municipal/AGEB/manzana, los indicadores SIESA ni el acceso a CRUM.

## Fuente y naturaleza
- Fuente oficial: [SMN, Web Service API](https://smn.conagua.gob.mx/es/web-service-api).
- Endpoint público: `https://smn.conagua.gob.mx/tools/GUI/webservices/?method=1`.
- Variables: máxima/mínima °C, precipitación mm/día, probabilidad %, velocidad y rachas km/h, nubosidad.
- El archivo final está en `data/smn/sonora_latest.json`, únicamente para **Sonora**, municipio INEGI `26xxx`, con metadatos de fuente y descarga.
- Actualización programada mediante GitHub Actions cada tres horas, con autotest, validación y bloqueo de respuestas incompletas. No se hace una consulta nacional desde el navegador.
- El sitio consulta `raw.githubusercontent.com/doctopanda/MAPA-BALAM/main/data/smn/sonora_latest.json` para leer nuevos cortes sin esperar un nuevo despliegue Pages por GitHub Actions.
- En un corte de 2026-10-28 se comprobaron 72 municipios, seis distritos y pronósticos para cuatro fechas (28 al 31 de octubre). Esto es **dato modelado de pronóstico**, no observación in situ.

## Convenciones de riesgo
**El SMN NO ha emitido la clasificación de riesgo BALAM.** Los umbrales siguientes son banderas operativas exploratorias, no alertas oficiales:

| Condición pronosticada | Umbral exploratorio |
|---|---|
| Precipitación | >= 30 mm/día |
| Rachas | >= 60 km/h |
| Temperatura máxima | >= 40 °C |
| Temperatura mínima | <= 5 °C |

Los valores bajos, incluso cero banderas activadas, **no garantizan seguridad**. No incluye pronóstico de inundación, nivel fluvial, trayectoria de ciclones ni índice de vulnerabilidad municipal. Esos productos requieren sus fuentes y reglas particulares.

## Interfaz
- Sidebar plegable **Clima y vigilancia · SMN** con casilla de activación, variable (temperatura/lluvia/racha/señales), fecha (pronóstico 3 días), ámbito (distritos activos/todo Sonora), fecha de descarga y enlaces oficiales.
- Al pulsar municipio activo: ficha SMN de pronóstico por día, valores crudos, señales BALAM y medidas preventivas genéricas.
- **CRUM** sigue siendo un recurso diferente: capa de unidades inventariadas sobre mapa SMN, solo visible con autenticación. En la ficha hay recuento municipal CRUM **solo después de iniciar sesión**. CRUM no representa despacho en tiempo real.
- La capa SMN es pública, no contiene datos personales. Ningún dato nominal SIESA/CRUM se sube al repositorio.

## Caducidad
La interfaz oculta los colores meteorológicos cuando `fetched_at` tiene más de **12 horas**; quedan disponibles los enlaces al SMN. Una descarga fallida no reemplaza el último JSON correcto, pero este se vuelve **obsoleto y no se muestra como riesgo actual**.

## Próxima etapa
- Integrar las alertas oficiales por fenómeno/ámbito y su fecha de vigencia, **separadas** del pronóstico numérico.
- Vincular datos hidrológicos, monitor de sequía y análisis de exposición por municipio sin inferir falsas emergencias.
- Validar intersecciones espaciales de amenaza y recursos CRUM con criterios operativos autorizados; nunca presentar una cercanía geográfica como disponibilidad efectiva.
