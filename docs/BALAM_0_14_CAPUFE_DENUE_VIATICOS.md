# BALAM v0.14 | CAPUFE, viáticos manuales y preparativo DENUE Sonora

## Avance aplicado
- Calculadora unificada de traslado: combustible calculado con ida + regreso (si regreso enrutado), peajes CAPUFE ida/vuelta y viáticos opcionales.
- Tabla oficial CAPUFE RED FONADIN 2026 con IVA, vigencia publicada 13 de abril de 2026, portada oficial: https://pot.capufe.mx/gobmx/transparencia/tarifas.html; PDF https://pot.capufe.mx/gobmx/transparencia/Doc/TransparenciaF/Tarifas/Vigentes/2026/Tarifas-vigentes-2026.pdf (página 3).
- Siete casetas / tramos individuales Sonora, tarifa por clase A, B2, C2; se excluye la fila agregada Estación Don–Nogales porque sumarla a las plazas individuales duplicaría el costo.
- **Selección de cruces manual, por sentido ida / regreso y clase vehicular**. El trazado OSRM no confirma qué plazas se cruzan ni determina clase/exenciones. Antes de facturar, verificar cruce y tarifa en caseta.
- Viáticos: casilla opcional, alimentación MXN, hospedaje MXN, otros MXN. Con casilla apagada el subtotal es cero aunque los campos conserven importes para consulta.
- Exportación CSV de presupuesto estimado con distancias, litros, combustible, peajes separados y viáticos, sin pacientes, folios ni datos clínicos.
- La tabla oficial es un corte de referencia verificable; BALAM no hace lectura automática del PDF de CAPUFE ni promete tarifas futuras vigentes sin revisión.

## Tarifas CAPUFE 2026 registradas (MXN por cruce, IVA incluido)
| Plaza | Tramo | Autos A | Autobús B2 | Camión C2 |
|---|---|---:|---:|---:|
| Estación Don | Estación Don–Navojoa | 114 | 194 | 191 |
| Fundición | Navojoa–Ciudad Obregón | 114 | 194 | 191 |
| Esperanza | Ciudad Obregón–Guaymas | 114 | 194 | 190 |
| Guaymas | Libramiento Guaymas | 48 | 106 | 107 |
| Hermosillo | Hermosillo–Magdalena de Kino | 114 | 195 | 191 |
| Magdalena | Libramiento Magdalena de Kino | 38 | 64 | 64 |
| Libramiento Cd. Obregón (LICO) | Ciudad Obregón–Guaymas | 105 | 176 | 172 |

## Fórmula de presupuesto
1. `kilometros_totales = kilometros_ida + (kilometros_regreso_real || kilometros_ida)`; el duplicado es aproximación, no regreso detectado.
2. `litros = (kilometros_totales / rendimiento_km_l) × (1 + reserva_pct/100)`.
3. `combustible_mxn = litros × precio_mxn_l`.
4. `casetas_ida_mxn = Σ (cruces_ida × tarifa_clase)`, igual para regreso.
5. `viaticos_mxn = incluir_viaticos ? (alimentación + hospedaje + otros) : 0`.
6. `total = combustible + casetas_ida + casetas_regreso + viaticos`.
7. Prueba unitaria: 120 km ida + 117 km vuelta, 8 km/L, $25/L, 15% reserva, peaje $114 en cada sentido y $290 viáticos = **$1,369.71875 MXN** (visualización $1,369.72). Sin viáticos = $1,079.71875.

## DENUE (no atribuir datos inexistentes)
- Fuente oficial: https://www.inegi.org.mx/app/descarga/?ti=6, DENUE mayo de 2026. Alternativa API: https://www.inegi.org.mx/servicios/api-denue/ (requiere token).
- Normalizador `scripts/import_denue_sonora.py`, lectura CSV o ZIP oficial, filtra entidad 26 Sonora, coordenadas, clave 26xxx e ID, y SCIAN 468411 (gasolineras), 811191/468213 (llantas), 811111/811112/811116 (talleres).
- Salida pública normalizada `data/denue/sonora_route_services.json` sin token, con fuente, corte, totales y problemas de calidad. Un archivo sin filas válidas **no sobrescribe** el último corte.
- La capa DENUE en el mapa está conectada pero **desactivada hasta que se procese la exportación oficial**; los negocios OSM siguen disponibles independientemente. No afirma horarios, aceptación de tickets ni disponibilidad.
- Para cargar: descargar los CSV o ZIP DENUE **de Sonora** (incluyendo comercio al por menor y servicios de reparación); ejecutar `python scripts/import_denue_sonora.py --source denue_sonora.csv` o con ZIP; validar salida; subir el JSON revisado al repositorio. El token INEGI no debe colocarse en GitHub Pages.
- El cargador exige validación adicional de municipios si la exportación no trae clave completa. Se recomienda primero una importación de prueba, comparar cantidad con conteos oficiales y hacer revisión manual de una muestra de establecimientos.

## Gobierno de datos y limitaciones
- DENUE es un directorio económico; no confirma que un negocio esté abierto, atienda ambulancias, tenga diésel o esté alcanzable desde una carretera.
- El catálogo institucional de estaciones **con ticket** sigue separado y editable únicamente por Administrador Maestro en Supabase, con RLS y bitácora. No se acepta ticket basándose solo en DENUE.
- La clase aplicable a ambulancias en CAPUFE y eventuales exenciones deben verificarse en el punto de cobro; la clasificación no se deduce del tipo de vehículo CLUES/CRUM.
- Para una versión posterior: georreferenciar plazas con fuente oficial y cruzar geométricamente rutas con **dirección de cobro**; evitar detecciones falsas por proximidad. Conectar Finanzas para tabuladores y viáticos autorizados con control histórico.
- Esta versión no sustituye despacho, autorización de gasto o ruta verificada con cierres viales.

## Checkpoint y pruebas
- `checkpoint/balam-v0.13-before-denue-tolls-20261028` conserva el mapa anterior.
- `scripts/validate-map.cjs` verifica el esquema, siete tarifas, fuente, suma de peajes por sentido, inclusión opcional de viáticos, rutas y protección de servicios no cargados.
- `scripts/test_denue_import.py` usa solo casos sintéticos, no publica negocios inventados.
- Pendiente: ejecución visual completa en navegador y primera importación real de DENUE para Sonora.
