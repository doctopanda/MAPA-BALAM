# MAPA BALAM 🐆

Mapa territorial y observatorio BALAM para Sonora.

## 🚀 Abrir BALAM · enlaces directos

**Selecciona una aplicación y ábrela con un clic.** Tanto BALAM Mapa como BALAM Visor son aplicaciones web adaptables: se utiliza la **misma dirección en computadora y celular**, con interfaz adecuada a cada pantalla.

| Producto | 💻 Escritorio | 📱 Celular / WebApp | Acceso |
| --- | --- | --- | --- |
| **BALAM Mapa** · distritos, municipios, AGEB, demografía, clima y capas | [🌐 Abrir Mapa](https://doctopanda.github.io/MAPA-BALAM/) | [📱 Abrir Mapa móvil](https://doctopanda.github.io/MAPA-BALAM/) | Público; la capa CRUM requiere iniciar sesión |
| **BALAM Visor v6.2** · panorama, indicadores, CONAPO y fuentes | [🌐 Abrir Visor](https://doctopanda.github.io/MAPA-BALAM/visor/) | [📱 Abrir Visor móvil](https://doctopanda.github.io/MAPA-BALAM/visor/) | Público, únicamente datos agregados |
| **BALAM CRUM** · panel específico | [🔒 Abrir CRUM](https://doctopanda.github.io/MAPA-BALAM/crum.html) | [🔒 Abrir CRUM desde celular](https://doctopanda.github.io/MAPA-BALAM/crum.html) | Inicio de sesión y permisos requeridos |

### Accesos rápidos

- 🗺️ **[ENTRAR A BALAM MAPA](https://doctopanda.github.io/MAPA-BALAM/)**
- 📊 **[ENTRAR A BALAM VISOR](https://doctopanda.github.io/MAPA-BALAM/visor/)**
- 🚑 **[ENTRAR AL PANEL CRUM (AUTENTICACIÓN)](https://doctopanda.github.io/MAPA-BALAM/crum.html)**

### Cómo abrir las versiones móviles

Abre el enlace del producto directamente desde el navegador del teléfono. Puedes agregarlo a la pantalla de inicio desde el menú del navegador (en Android, **Instalar aplicación** o **Añadir a pantalla principal**; en iOS, **Compartir → Añadir a pantalla de inicio**, según navegador). La instalación no convierte los datos conectados en información disponible sin internet; algunas secciones requieren red.

**Importante:** BALAM Visor v6.0 no es todavía el visor operativo privado v5.3.3 completo. La captura SIESA, GOLIPCA, auditoría y nominales no se publican como una página abierta de GitHub. No se ofrece un enlace público a archivos HTML locales de respaldo como si fueran servicios web.

### Versiones y estado

| Componente | Versión de referencia | Publicación |
| --- | --- | --- |
| BALAM Mapa | v0.18 · diseño adaptable | GitHub Pages |
| BALAM Visor | v6.1 · GOLIPCA y observatorio público | GitHub Pages en `/visor/` |
| BALAM CRUM | Visor protegido | GitHub Pages con autenticación |
| BALAM Visor operativo legado | v5.3.3 · archivo local | **No publicado**; requiere migración autenticada |

---

## 📌 Convención para próximos productos

Cada repositorio nuevo de este ecosistema deberá comenzar su `README.md` con un bloque **«🚀 Abrir aplicación»**, antes de la información técnica, que incluya:

1. **Enlace clicable al sitio de escritorio** y **enlace clicable al acceso móvil/PWA**. Si es una aplicación adaptable, indicar que ambos enlaces llevan a la misma URL.
2. **Enlaces separados para mapas, visores, tableros o módulos**, cuando exista una dirección real para cada uno. Nunca publicar enlaces ficticios o rutas sin desplegar.
3. **Estado del producto** (publicado, en pruebas, protegido o solo local), versión y fecha del corte de datos cuando corresponda.
4. **Cómo instalar en celular** y qué partes requieren conexión a internet.
5. **Acceso y privacidad**: identificar explícitamente el inicio de sesión requerido; no colocar enlaces a bases nominales, contraseñas ni tokens.

Esta sección debe actualizarse **en el mismo cambio que publique una nueva página o modifique su URL**, para que el README siga siendo el directorio vigente de acceso.

---

## 💻📱 BALAM Visor v6.2 · cambio manual de presentación (03/11/2026)

En **[BALAM Visor](https://doctopanda.github.io/MAPA-BALAM/visor/)**, el botón de la cabecera ofrece **«Vista escritorio»** cuando se está en móvil y **«Vista móvil»** cuando se está en escritorio. Cambia el diseño **sin recargar datos, perder el distrito o el módulo abierto** y conserva la preferencia en este navegador.

- **Móvil:** contenido ajustado a una columna visual compacta, barra inferior con cinco accesos, chips horizontales y tarjetas apilables.
- **Escritorio:** menú lateral, paneles y tarjetas simultáneos, gráficos y módulos en cuadrícula.
- **Forzar escritorio desde celular:** activa un lienzo más ancho que permite desplazamiento horizontal para consultar el tablero sin reducir los datos.
- **Forzar móvil desde computadora:** muestra la misma interfaz estrecha de celular centrada en la ventana.
- No se trata de dos fuentes o sistemas distintos: ambos modos consultan los mismos agregados públicos y aplican las mismas restricciones.

---

## 📱 BALAM Visor v6.1 · navegación fluida y GOLIPCA (02/11/2026)

La ruta **[BALAM Visor para celular y escritorio](https://doctopanda.github.io/MAPA-BALAM/visor/)** abre la misma PWA adaptable. La actualización toma como referencia la navegación modular del observatorio Allere Alumnae: accesos horizontales, tarjetas contextualizadas, cinco accesos inferiores y carga separada por pantalla.

- **Panorama ampliado:** población proyectada CONAPO, municipios, unidades de atención y operación documentadas, lectura interpretativa, principales módulos SIESA y siete accesos GOLIPCA.
- **SIESA:** indicadores del corte publicado DS05 (12/10/2026) y selección municipal para desglosar nueve áreas de captura. Los registros de módulos no equivalen a personas únicas.
- **GOLIPCA:** G Gerencia y Rectoría, O Operaciones, L Logística, I Inteligencia en Salud, P Programas, C CECOSABI, A Administración. Cada eje identifica fuente y alcance; se presentan agregados solo cuando existe respaldo público.
- **CECOSABI:** 977 letrinas encaladas en el corte publicado. No se hace inferencia de municipio sin llave territorial validada.
- **Módulos:** acceso rápido a Mapa, CRUM autenticado, CONAPO, SIESA, Inteligencia, CECOSABI y fuentes.
- **Seguridad:** la PWA no contiene base nominal, claves o funciones de escritura. Logística y administración protegida quedan correctamente señaladas como pendientes de integración.
- **Identidad:** se recupera la marca original BALAM del mapa para la cabecera y el icono instalable de Visor.

**Prueba de regresión:** `node scripts/test-visor-mobile.cjs`, incorporada al flujo de validación del repositorio. Comprueba navegación, GOLIPCA, CECOSABI y que los distritos sin corte SIESA no muestren falsos ceros.

---

## Histórico técnico y evolución

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

## v0.8 · Sidebar plegable y capas AGEB/manzanas independientes (23/10/2026)

- Se quitó el botón específico **«Elegir DS05»**. La lista de seis distritos y el **selector rápido** ahora son los controles principales; ninguno se selecciona automáticamente salvo enlace `?ds=DSxx` explícito.
- El panel lateral es plegable: herramientas, lectura analítica, distritos, ficha de municipio, reglas, AGEB/manzanas y catálogo CRUM. Se ofrecen opciones para desplegar o comprimir todo.
- Las capas **AGEB activas** (seleccionadas para análisis) y **AGEB inactivas** (no seleccionadas) pueden mostrarse u ocultarse de manera independiente. *«Activa» no se refiere al estado sanitario de una AGEB.*
- **Manzanas** es una capa independiente que comienza apagada. Seleccionar AGEB no desencadena consultas de manzanas hasta activarla. Al apagarla se retiran las manzanas; solicitudes pendientes no pueden volver a dibujarlas. El sistema consulta INEGI por municipio/AGEB según demanda.
- La versión privada **BALAM SIESA v5.3.1** incorpora en el menú MAPAS un selector que abre el distrito elegido en este visor. El cambio no modifica el corte local SIESA ni crea información para otros distritos.
- El mapa mantiene su estilo OpenStreetMap, los seis colores regionales, las políticas RLS y el inventario CRUM privado.
