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
