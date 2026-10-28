# BALAM v0.16 · Catálogo local de servicios carreteros sin dependencia de Overpass

## Incidencia original
La captura de BALAM 2026-10-28 mostraba `HTTP 502` de Overpass y 60 puntos CLUES, con 0 gasolineras, 0 llanteras y 0 talleres. No es evidencia de ausencia de negocios en las carreteras.

## Solución
- Pipeline público de GitHub Actions que descarga la base OSM México desde Geofabrik y la procesa mediante Osmium CLI.
- Filtro `amenity=fuel`, `shop=tyres`, `shop=car_repair` y geocerca por los polígonos de los municipios de Sonora usados por el visor BALAM.
- Publicación de `data/road-services/sonora_osm_latest.json` con registros reales, OSM ID, categoría, nombre, municipio, latitud/longitud, corte y atribución ODbL.
- Validador impide sobrescribir una versión vigente con un extracto vacío o sospechosamente incompleto.
- Actualización programada semanal: GitHub Actions `road-services-sonora.yml`. Si falla la descarga o el filtro, se conserva el corte anterior; no se pierden los datos históricos del mapa.
- Frontend `assets/logistics-route.js` consulta el JSON local cuando se pulsa `Buscar servicios a lo largo del trayecto`. No necesita Overpass ni CAPTCHA para leer la capa. Si todavía no hay catálogo validado, conserva la consulta Overpass como alternativa exploratoria.
- Priorización justa en la lista: hasta 35 gasolineras, 25 llanteras, 30 talleres, 20 CLUES en lugar de permitir que 60 CLUES oculten resultados comerciales.
- Filtro de puntos a unos 2.5 km del recorrido en línea recta. No implica un acceso vial real, apertura, servicio activo, precio, existencias o convenio/ticket válido.

## Diferencias entre fuentes
- **OpenStreetMap/Geofabrik**: fuente colaborativa geolocalizada, no oficial ni equivalente a la descarga DENUE del INEGI.
- **DENUE INEGI**: catálogo económico oficial independiente; la importación de su archivo oficial sigue pendiente.
- **CRUM/CLUES**: registros sanitarios independientes; no se confunden con establecimientos comerciales.
- **Convenios de tickets**: catálogo de Supabase que solo el Administrador Maestro puede verificar y editar. Ningún dato colaborativo OSM atribuye convenio.

## Transparencia
- Fuente: https://download.geofabrik.de/north-america/mexico.html
- Derechos: © OpenStreetMap contributors, Open Database License (ODbL): https://www.openstreetmap.org/copyright
- Geocerca: https://raw.githubusercontent.com/MacWilliXD/INEGI-geojson/main/geojson_descargas/AGEM_26.geojson
- El script no publica ningún establecimiento de prueba y no procesa datos de pacientes.
- Los servicios públicos Overpass pueden seguir fallando, pero no son necesarios para usar un catálogo generado.

## QA
- `scripts/validate-map.cjs` valida que el JSON contenga registros cuando haya corte válido, municipios 26xxx y categorías OSM, así como carga offline en frontend y priorización de servicios.
- Checkpoint: `checkpoint/balam-v0.15-antes-catalogo-offline-20261028`.
- Para declarar la versión plenamente operativa se requiere **confirmar el primer corte del pipeline y verificar en el navegador una ruta con establecimientos comerciales de OSM**.