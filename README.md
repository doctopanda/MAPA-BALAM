# MAPA BALAM 🐆

Mapa territorial del Observatorio Distrital BALAM para Sonora, con foco analítico en el Distrito de Salud 05.

## Arquitectura
- Sonora completo como contexto territorial.
- Distrito 05 resaltado: Álamos (003), Etchojoa (026), Huatabampo (033), Navojoa (042) y Benito Juárez (071).
- Las manzanas se cargan bajo demanda por municipio para mantener el mapa ligero.
- Los indicadores visibles son agregados territoriales procesados por BALAM. No se publican datos nominales.

## Capas iniciales
Territorio · Captura canónica · Atención Médica · Promoción · Vigilancia · Enfermería · CECOSABI / Encalamiento.

## Fuentes cartográficas
La geometría municipal se consume desde un GeoJSON público derivado del Marco Geoestadístico INEGI. El detalle de manzanas se solicita dinámicamente desde un servicio cartográfico público ArcGIS, únicamente al seleccionar un municipio del DS05.

## Privacidad
Este repositorio es público. Nunca deben incorporarse nombres, CURP, teléfonos, domicilios individuales, expedientes clínicos u otros identificadores personales.

BALAM = inteligencia territorial sanitaria, no base nominal pública.
