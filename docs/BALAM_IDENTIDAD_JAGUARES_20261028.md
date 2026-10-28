# Identidad BALAM | Pin cartográfico y jaguar de cuerpo completo

## Pin de ruta aprobado (2026-10-28)
- Archivo usado por MAPA BALAM: `assets/brand/jaguar-pin-ruta-balam.webp`.
- Origen: imagen proporcionada por el usuario `Pin de Jaguar Tropical(1).png`.
- Adaptación técnica: WebP pequeño de fondo transparente, recortado al borde visible del pin. Nunca se sustituye por un jaguar diferente ni por el logo cuadrado del encabezado.
- El mapa coloca la punta del pin en el punto de la ruta devuelto por el planificador; la animación representa una planificación exploratoria, no el traslado de una ambulancia.
- El estado anterior se conserva en la rama `checkpoint/map-balam-v0.11-antes-jaguar-pin-20261028`.

## Ilustración de cuerpo completo reservada para visor BALAM
- Fuente original aportada: `Jaguar tropical en tonos teal y rosa(1).png`.
- Composición: jaguar completo caminando a la derecha, vegetación tropical turquesa, verde y rosa, fondo teal horizontal.
- Guardada como referencia visual persistente de BALAM con el nombre `Jaguar tropical en tonos teal y rosa`.
- No se usa como marcador cartográfico. Está reservada para la próxima mejora visual del visor BALAM SIESA, evitando aumentar la carga del mapa.

## QA
- Verificar `assets/brand/jaguar-pin-ruta-balam.webp` como WebP con firma RIFF.
- Verificar que el código de `assets/health-network.js` apunte al recurso del pin.
- Verificar que no permanezca la clase del cuadrado `balam-jaguar-clip`.
- Comprobar visualmente el tamaño y anclaje en Chrome con una ruta válida. El servidor de rutas OSRM sigue siendo una demostración sin garantías clínicas.
