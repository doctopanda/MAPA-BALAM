# MAPA BALAM 🐆

Mapa territorial del Observatorio BALAM para Sonora.

## v0.3 · visor estatal multi-distrito

- Los **6 Distritos de Salud** pueden activarse por casillas, de forma individual o simultánea.
- Cada distrito activo tiene su **propio selector de lectura**.
- Sonora permanece como contexto territorial completo.
- Navegación cartográfica progresiva: **municipio → AGEB → manzana**.
- AGEB y manzanas se cargan bajo demanda desde el servicio GeoJSON de INEGI.
- El encabezado usa el logotipo oficial BALAM con jaguar.
- La arquitectura acepta archivos de datos independientes por distrito (`dataUrl` en `data/districts.json`).

## Lecturas preparadas

Territorio · SIESA/captura canónica · acciones operativas · Atención Médica · Enfermería · Odontología · Promoción · Vigilancia · Vacunación · Vectores · Salud Mental · CECOSABI/saneamiento · Bases maestras · Necesidad · Respuesta · Brecha.

Actualmente el corte territorial municipal integrado corresponde a DS05. En los demás distritos, seleccionar una fuente aún no alimentada se representa como **sin corte cargado**, nunca como cero.

## División territorial

Las cabeceras de los seis distritos corresponden a la guía estatal vigente: Hermosillo, Caborca, Santa Ana, Cajeme, Navojoa y San Luis Río Colorado. La agrupación municipal del archivo `data/districts.json` se versiona explícitamente para poder auditar cualquier cambio de regionalización.

## Privacidad

Este repositorio es público. **Nunca** deben publicarse nombres, CURP, teléfonos, domicilios individuales, expedientes clínicos u otros identificadores personales.

BALAM publica únicamente agregados territoriales y geometría pública.

## 🚑 CRUM integrado a BALAM (octubre 2026)

La vista `index.html` incorpora una capa CRUM **protegida por autenticación** desde el panel lateral, y `crum.html` ofrece un visor privado especializado. La información CRUM está en Supabase `blkvamobfcyvlimnizaf`, con 429 registros, 29 instituciones y 9 localizaciones pendientes de validación municipal. La cuenta maestra confirmada se asigna por `balam_access` (no se publican credenciales personales).

- Inicio de sesión Supabase Auth para ver los puntos; la publicación estática **no contiene** inventario bruto.
- Los seis distritos se pueden activar juntos, con filtros CRUM independientes por distrito, institución, tipo y búsqueda.
- Todo miembro activo BALAM consulta CRUM de todo Sonora; solo `admin_maestro` puede modificar el inventario según RLS.
- SIESA conserva independencia de origen, tratamiento y permisos. Las unidades inventariadas **no** equivalen a ambulancias disponibles, GPS vivo, tiempos de respuesta o despacho.
- La carga inicial está completada, pero la sincronización futura con el observatorio CRUM requiere fuente/API autorizada.
- Dependencias Leaflet 1.9.4 y supabase-js 2.57.0 cargadas desde CDNs; se requiere conexión a internet para estos recursos.

## v0.6 · Mapa único estatal (23/10/2026)

- La plataforma BALAM SIESA **ya no ejecuta un segundo mapa Leaflet local**. Desde BALAM v5.2 únicamente abre este visor mediante enlace seguro.
- **Inicio con 0 distritos activos.** El usuario selecciona uno o varios de los seis; `?ds=DS01` (también `?ds=DS01,DS04`) preselecciona solo cuando el vínculo lo solicita explícitamente.
- **Restaurar** limpia todas las selecciones y regresa a Sonora. **Elegir DS05** queda como atajo optativo, no automático.
- Seis tonalidades propias de BALAM (HEX de diseño, no códigos oficiales Pantone): DS01 mezquite `#318775`, DS02 arcilla `#C7818C`, DS03 pino `#648968`, DS04 Yaqui/Golfo `#3B9EA8`, DS05 cobre del Mayo `#AA796A`, DS06 delta del Colorado `#6686AA`.
- Geometría pública: municipios INEGI y detalle progresivo AGEB/manzana bajo demanda. **Calles OpenStreetMap activadas por defecto**, con polígonos distritales BALAM semitransparentes y control para ajustar su color. Se usa el servidor OSM oficial con atribución; si falla la descarga de teselas (403/red), el mapa regresa automáticamente a polígonos solamente. La casilla *Calles OpenStreetMap* permite alternar vistas sin perder distritos.
- SIESA: el único corte municipal con procedencia verificada en el visor público sigue siendo **DS05, corte 12/10/2026**. DS01, DS02, DS03, DS04 y DS06 muestran **«sin corte SIESA cargado»** y no se rellena un cero ficticio.
- CRUM: los usuarios autenticados y autorizados ven inventario por distrito bajo RLS, sin publicar el archivo de coordenadas en GitHub. Los puntos CRUM se filtran inicialmente por los distritos seleccionados, no por todo Sonora.
- La versión anterior con mapa poligonal DS05 interno permanece guardada exclusivamente como respaldo privado; **no se subió a este repositorio**.

## v0.7 · Cartografía híbrida BALAM + OpenStreetMap

- Visor por defecto: carreteras, ciudades, localidades y relieve esquemático del estilo OpenStreetMap estándar, debajo de la capa poligonal BALAM.
- Colores territoriales por distrito persistentes, con deslizador de 12–70% de opacidad máxima cuando OSM está activo.
- Vista poligonal sin teselas disponible mediante la casilla superior o automáticamente cuando el proveedor no responde.
- El sitio no almacena ni precarga teselas; únicamente realiza consultas interactivas de la extensión visible, conforme a la política OSM. No usa CARTO Voyager sin clave, porque ese proveedor requiere API key.
