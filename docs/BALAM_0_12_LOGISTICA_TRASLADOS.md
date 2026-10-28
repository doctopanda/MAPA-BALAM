# BALAM 0.12 | Planificador logístico de traslados

## Propósito
Extender el recorrido entre establecimientos CLUES con una estimación transparente de ida y vuelta de combustible, además de un inventario visual **no verificado operativamente** de auxilios próximos a la ruta.

## Estimación de combustible
- Distancia de ida: distancia oficial en metros devuelta por motor vial OSRM y convertida a kilómetros; la ruta nunca se genera mediante distancia euclidiana.
- Distancia de ida y vuelta estimada: `2 × kilómetros de ida`. **No equivale a recalcular el retorno por sentidos de circulación**, bloqueos, variaciones de pendiente, desvíos, circulación en vacío ni peso de pacientes.
- Litros: `(2 × km de ida) / rendimiento de la unidad (km/L)`.
- Litros con reserva: `litros × (1 + porcentaje de reserva / 100)`.
- Costo MXN: `litros con reserva × precio ingresado MXN/L`.
- Configuración editable; valores iniciales **ejemplificativos** `8 km/L`, `25 MXN/L`, `15% de reserva`; no son precios públicos actuales ni valores normales certificados de consumo.
- Ejemplo de prueba: `120 km ida → 240 km ida/vuelta → 30 L base → 34.5 L con reserva → 862.50 MXN` a 25 MXN/L.

## Servicios a lo largo de la ruta
- La consulta a Overpass API ocurre **solo al pulsar Buscar servicios**, nunca automáticamente al cargar o trazar una ruta. Se limita a 1 solicitud cada 45 segundos y emplea un corredor simplificado de máximo 22 vértices.
- Categorías OSM: `amenity=fuel` gasolineras, `shop=tyres` llanteras, `shop=car_repair` talleres. Unidades CLUES del catálogo público (estatus administrativo EN OPERACION) dentro de 2.5 km en línea recta del trazado pueden verse como **puntos geográficos de apoyo potencial**, sin considerar automáticamente que ofrecen urgencias.
- Los resultados OSM se limitan aproximadamente a 1.8 km en línea recta del corredor y máximo 60 marcadores/lista. El buscador no determina desvío real por vialidad ni horarios; tampoco puede garantizar exhaustividad.
- Un botón Ocultar servicios limpia marcadores de apoyo sin eliminar la ruta ni la calculadora. Al cambiar de ruta se limpian servicios de la anterior.
- Si Overpass está saturado, la vista puede mostrar solo CLUES verificadas como registros administrativos. El fallo nunca se presenta como ausencia de gasolineras.

## Tickets y vales institucionales
- **No se ha cargado un catálogo verificado de gasolineras que acepten tickets, convenios, facturación o vales institucionales**. El mapa muestra presencia en OSM, pero no inventa ese atributo.
- Para activar este subcatálogo necesitaremos proveedor, convenio, aceptación formal, estaciones con domicilio/ubicación, tipo de combustible, fecha de vigencia, restricciones de surtido, horarios, y responsable de validación. Por gobernanza BALAM, edición reservada a Administrador Maestro en Supabase con RLS; lectura según permisos.

## Seguridad y operación
- Ningún paciente, folio, domicilio particular, motivo de traslado o dato de salud se envía al motor vial ni a Overpass. Las solicitudes contienen solo coordenadas de la ruta entre instalaciones públicas.
- El servicio público de rutas OSRM es de demostración, no apto para regulación o despacho. Overpass también es best effort. Para uso operativo se requiere proveedor con SLA, catálogo de servicios verificado y rutas con cierres/eventos en tiempo real.
- El valor del combustible es una **estimación de presupuesto logístico**, no combustible disponible en tanque, autonomía garantizada ni precio vigente.

## QA y recuperación
- `scripts/validate-map.cjs` comprueba la función de costo de combustible con caso controlado, controles de la interfaz, que Overpass se active exclusivamente por botón y que la etiqueta de ticket no invente convenios.
- Checkpoint recuperable `checkpoint/balam-v0.11.1-before-logistics-20261028`.
- La prueba visual y de disponibilidad del servicio público de Overpass en navegador real está pendiente.

## Fuentes de la técnica
- OSRM official docs: https://project-osrm.org/docs/v26.5.0/http
- Overpass QL alrededor de líneas: https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL
- Etiquetas OSM: https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dfuel y https://wiki.openstreetmap.org/wiki/Tag:shop%3Dcar_repair
