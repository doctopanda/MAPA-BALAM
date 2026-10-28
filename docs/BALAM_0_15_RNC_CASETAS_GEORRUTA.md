# BALAM 0.15 | Casetas en el recorrido identificadas geográficamente

## Hallazgo oficial
- El INEGI publica **Plaza de Cobro** como geografía puntual en la **Red Nacional de Caminos (RNC)**. Existe el servicio geoespacial público `Hosted/plaza_cobro/FeatureServer/0` y la API SAKBÉ ofrece, para rutas calculadas por ese propio sistema, detalle de casetas con costo y geometría del punto.
- Servicio revisado: https://lcidsig.inegi.org.mx/server/rest/services/Hosted/plaza_cobro/FeatureServer/0
- RNC: https://www.inegi.org.mx/programas/rnc/
- API SAKBÉ: https://www.inegi.org.mx/servicios/Ruteo/
- Extracción realizada 2026-10-28 sobre área amplia del noroeste: **30 puntos**. Se excluyeron cuatro registros identificados con sección `Libramiento Mexicali` (Baja California). **26 puntos geográficos verificados**, agrupados en **15 plazas** para la zona Sonora.
- Cada plaza mantiene en `data/rnc/sonora_plazas_cobro.json` todos sus puntos por carril/sentido, su id RNC, nombre, administrador, sección y coordenadas; no se duplican precios por dos puntos de la misma plaza.
- El servicio registraba fechas de actualización geográfica 2023–2024; se trata de información de referencia geográfica, no confirmación operativa 2026. El servicio presentó un problema de cadena de certificado al inspeccionarlo; se retiró el script exploratorio del entregable y se conservaron sólo los puntos contrastados mediante sus identificadores.

## Interacción en mapa v0.15
1. Dibujar un traslado entre establecimientos de salud como en v0.14.
2. Abrir **Presupuesto total → Casetas geolocalizadas sobre el recorrido**.
3. Se presentan marcadores específicos `🛣️` sobre las plazas INEGI cercanas a la polilínea del motor de rutas. Los puntos se agrupan por plaza para evitar duplicar por carriles opuestos.
4. En la lista: **posible cruce** si ≤230 m en línea recta del recorrido, **cercana** si 230–650 m; la distancia NO prueba que la ruta cruce esa plaza. Las vías superpuestas pueden producir falsos positivos o faltantes.
5. Se puede mostrar todas las 15 plazas conocidas aunque no estén cerca del itinerario, para su revisión geográfica.
6. Si se identifica una plaza con vinculación inequívoca a la tabla CAPUFE 2026 y se elige una clase vehicular, el usuario puede pulsar **Confirmar ida** o **Confirmar regreso**. Esta acción modifica la cantidad de cruces de la caseta en el presupuesto anterior.
7. Para detectar casetas sobre el retorno es imprescindible **calcular el recorrido de regreso independiente**. Sin ese recorrido, la lista indica `sin ruta de retorno` y no anticipa cruces por el solo hecho de duplicar km.
8. La selección vuelve a cero al iniciar otro traslado para evitar que se cobren por error casetas del viaje anterior. No se agrega ningún costo sin confirmación explícita.

## Casetas de referencia vinculadas con tarifa CAPUFE 2026
- Estación Don, Fundición, Esperanza, Guaymas, Hermosillo 152, Magdalena: enlace por nombre inequívoco a tabla `data/capufe/sonora_tarifas_2026.json`.
- Altar, Nogales, Puente Colorado, Caseta Sahuaripa, Libramiento Hermosillo, Plaza Esperanza–Hornos, Auxiliar Esperanza–Hornos, San Luis Río Colorado–Estación El Doctor y Cruce Internacional SLRC II: sin tarifa CAPUFE inequívocamente enlazada al catálogo actual. Se muestra lugar, nombre y tramo sin importe estimado; no se cobra cero como si fuera exención.
- En particular **Plaza Esperanza–Hornos no se iguala automáticamente a tarifa LICO** sin expediente técnico, para evitar atribución incorrecta.

## Error de Overpass HTTP 502
- El origen de la captura aportada fue HTTP 502 de una consulta a Overpass; por ello la lista mostraba únicamente CLUES cercanas. Esto no significa que no existan servicios en el corredor.
- Ahora el módulo de servicios puede reintentar, **solo bajo una consulta manual explícita**, con `overpass.private.coffee` primero y `overpass-api.de` como respaldo. Ambos son servidores best effort, sin SLA. Si fallan, CLUES y RNC siguen disponibles independientemente.
- DENUE oficial continúa pendiente de importación. La presencia OSM de gasolineras, talleres y llanteras no prueba horarios o capacidad de ayuda.

## Alcance y próximo salto
- Para determinar un cruce con mayor certeza hay que vincular el itinerario a **segmentos específicos de la RNC, carril y sistema abierto/cerrado**, idealmente mediante la API oficial SAKBÉ y un token institucional de INEGI. SAKBÉ ofrece `punto_caseta`, `costo_caseta` y modos cuota/libre/óptima en itinerarios calculados en su propio motor. Su ruta puede diferir de la ruta del OSRM actual.
- Esta versión NO afirma **detección definitiva** de casetas por el mero buffer euclidiano. No es autorización de pago, ni ruta o costo oficial certificado.
- Tarifa depende del tipo de vehículo, ejes y posible exención; selección explícita por el operador.
- Checkpoint anterior: `checkpoint/balam-v0.14-before-rnc-casetas-20261028`.
- Validación automática: 26 puntos y 15 grupos, fuentes enlazadas, controles ida/regreso y proximidad a la polilínea.
- Pendiente: prueba visual en navegador de usuario y recorrido real; no se ha validado la coincidencia de casetas en cada itinerario particular.
