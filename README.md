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
