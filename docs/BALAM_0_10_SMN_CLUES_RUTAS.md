# BALAM 0.10 · SMN, sequía, CLUES y rutas de referencia

## Datos verificados
- Pronóstico oficial SMN: 72 municipios, seis distritos, cortes horarios por GitHub Actions cada 3 horas y caducidad visible de 12 horas.
- Sequía: Monitor de Sequía de México, corte 2026-10-15: D0=1, D1=5, D2=1, D3=0, D4=0, sin categoría=65. D0 no es sequía D1-D4; celdas en blanco no significan ausencia de riesgo general.
- CLUES: catálogo DGIS de septiembre de 2026 con 1,598 establecimientos georreferenciados (877 EN OPERACION, 717 FUERA DE OPERACION, 4 PENDIENTE DE ENTRAR EN OPERACION), 86 filas descartadas por coordenadas inválidas.
- Niveles de atención explícitos en CLUES: primero 1359, segundo 151, tercero 9; 79 sin clasificación verificable. No se infiere el nivel desde el nombre.
- CRUM permanece como catálogo protegido separado por Supabase Auth y RLS.

## Ficha y cartografía
- El mapa presenta temperatura, precipitación, probabilidad, viento y fecha de emisión del pronóstico municipal.
- El Monitor de Sequía oficial se representa como capa independiente con fecha del corte.
- No se inventa aviso ciclónico, amenaza de deslave, inundación o riesgo clínico municipal. Por ahora son fuentes enlazadas, no evaluaciones territorializadas ya integradas.
- Los polígonos tienen color más legible y son no interactivos para permitir clics en municipios bajo ellos.
- Por municipio se puede filtrar la red de establecimientos por institución (distinta de derechohabiencia real), nivel, estatus y territorio.

## Rutas viales
- Seleccionar CLUES origen y destino. Mediante consentimiento explícito se consulta una ruta puntual OSRM demo sobre carreteras OpenStreetMap; se pinta solo cuando el servicio devuelve geometría vial válida.
- Una flecha animada indica dirección PLANIFICADA, NO desplazamiento de ambulancia en tiempo real.
- El demo OSRM es un servicio no garantizado y sin SLA; las pruebas tienen límite de frecuencia de 1 solicitud/1.5 segundos. Para uso institucional de regulación médica se requiere motor de rutas propio o contratado, información de cierres y disponibilidad verificada de unidades.
- No se transmiten folios, pacientes, domicilios personales, diagnósticos ni otros datos sensibles al proveedor vial.
- Estado EN OPERACION en CLUES no implica camas libres, especialidades, aceptación de referencia o capacidad resolutiva actual.

## Arquitectura y seguridad
- GitHub Pages solo contiene datos públicos institucionales y pronósticos agregados, sin bases nominales SIESA.
- No se publican tablas protegidas CRUM ni secretos de Supabase.
- Scripts: scripts/clues_sonora.py, scripts/drought_sonora.py, scripts/validate-map.cjs.
- Checkpoint previo: checkpoint/balam-mapa-v0.9-before-network-20261028.
- QA automático: sintaxis JavaScript, 72 municipios SMN, 72 sequía, 1598 CLUES y unicidad de claves CLUES. Queda pendiente prueba de usuario en navegador para rutas OSRM y UI.

## Fuentes
- https://smn.conagua.gob.mx/es/web-service-api
- https://smn.conagua.gob.mx/es/climatologia/monitor-de-sequia/monitor-de-sequia-en-mexico
- https://gobi.salud.gob.mx/Bases_Clues.html
- https://www.atlasnacionalderiesgos.gob.mx/
- https://project-osrm.org/docs/v5.15.2/api/
- https://github-wiki-see.page/m/Project-OSRM/osrm-backend/wiki/Demo-server
