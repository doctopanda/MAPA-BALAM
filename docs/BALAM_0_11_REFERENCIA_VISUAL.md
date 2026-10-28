# BALAM 0.11 · Iconografía y flujo de referencia cartográfica

## Cambios
- Municipio: el selector de CLUES muestra nombres humanos de los 72 municipios de Sonora, conservando las claves 26xxx para auditoría. El nombre proviene del catálogo normalizado y/o del polígono INEGI.
- CRUM: marcadores propios con silueta de ambulancia y contador cuando varias unidades comparten coordenadas. Consulta supeditada a autenticación y RLS; no son posiciones GPS en vivo.
- CLUES: casitas con cruz de salud, diferenciadas por nivel registrado y tamaño (primero 27px, segundo 35px, tercero 44px, sin nivel 25px). Los colores no significan disponibilidad.
- Ruta: sello oficial de BALAM del encabezado, recortado en un pequeño marcador que recorre la geometría vial validada. No se crea una nueva mascota ni usa un jaguar diferente.
- Selección con clic: el primer establecimiento seleccionado es el origen; BALAM muestra los destinos de nivel superior y estatus administrativo EN OPERACION del catálogo CLUES de septiembre de 2026.
- Si origen es primer nivel: solo se permiten destinos de segundo nivel. Si origen es segundo nivel: solo se permiten destinos de tercer nivel. No hay destino automático para tercero ni unidades sin nivel conocido.
- La búsqueda de destinos incluye Sonora (no solo el municipio actual) para no ocultar posibles niveles superiores en otro distrito.
- Se selecciona el destino haciendo clic en la casita destacada, o desde el campo de destino del sidebar. Botón Dibujar ruta vial requiere aceptación explícita de consulta a OSRM demo.
- La flecha/jaguar animado NO indica ambulancia en movimiento ni traslado de paciente; el servicio de rutas no verifica puentes, cierres, tráfico, capacidad resolutiva, derechohabiencia, acceso a especialidad ni aceptación del receptor.

## Limitaciones y salvaguardas
- Clasificación por nivel y estatus es filtro exploratorio de referencia, no decisión médica ni referencia autorizada. Se requiere cartera de servicios, capacidad de referencia, reglas institucionales, convenios, disponibilidad operativa y validación humana.
- No se transmiten datos de pacientes al servicio externo. Solicitud contiene coordenadas públicas de unidades CLUES.
- El mapa y CLUES son recursos públicos; CRUM sigue privado.
- Se mantiene checkpoint previo: checkpoint/map-balam-v0.10-pre-iconos-referencias-20261028.
- QA automatizado agrega comprobación de nombres CLUES, iconos de ambulancia, casitas, flujo de clic y restricción de niveles; aún queda prueba visual manual de la ruta OSRM en navegador.

## Uso
1. Elegir distrito BALAM y activar Red de salud · CLUES.
2. Filtrar por municipio, institución, estatus y nivel. Los nombres aparecen en lugar de solo 260xx.
3. Pulsar la casita del origen de primer nivel.
4. Elegir una casita resaltada de segundo nivel, en la vista o en el selector de destino.
5. Aceptar la consulta puntual de rutas y pulsar Dibujar ruta vial. El jaguar oficial se desplaza por la ruta devuelta.
6. Usar Cambiar origen / reiniciar selección para una nueva referencia.

Fuente CLUES: https://gobi.salud.gob.mx/Bases_Clues.html
Servicio de pruebas OSRM: https://project-osrm.org/docs/v5.15.2/api/
