# Xiclos TV v2: reemplazo directo

La v2 se publica **reemplazando en el servidor los JS y CSS que cargan los `index.html` empaquetados**, con los mismos nombres. Los `index.html` de las tiendas no se tocan, así que no hay que homologar.

- **LG y Samsung** pasan a la v2.
- **Amazon** sigue con la versión anterior. Su adaptador para la v2 ya está programado, pero apagado.

## Qué publicar

Subir al servidor, respetando las rutas:

| Archivo | Contenido |
|---|---|
| `common/js/jquery.min.js` | **Arranque**: decide la versión según la plataforma y carga jQuery 1.12.4. Conserva el nombre porque es el primer archivo que cargan los tres `index.html` |
| `common/js/config.js` | Configuración y núcleo: estado, teclas, API con cancelación, loader, log |
| `common/js/login.js` | PIN, sesión y `checkLogin()` (lo llama el `onload` del `index.html`) |
| `common/js/JCPlayer.js` | Reproductor |
| `common/js/utils.js` | Modales y menú lateral |
| `common/js/search.js` | Búsqueda predictiva con teclado propio |
| `common/js/xiclos.js` | Grilla, pantallas (Home, Cineclub, listas) y acciones |
| `common/js/arrows.js` | Arranque y manejador único de teclas |
| `common/js/spatial.js` | La v2 no lo usa (queda vacío para LG y Samsung) |
| `webos/js/webos.js` | Adaptador LG |
| `tizen/js/tizen.js` | Adaptador Samsung |
| `amazon/js/amazon.js`, `amazon/js/spatial.js` | Adaptador Amazon (apagado) o, mientras tanto, carga de la versión anterior |
| `desktop/js/desktop.js` | Adaptador para el navegador de la PC |
| `common/css/custom.css` | CSS actual + ajustes de la v2 y de la búsqueda al final (Amazon no carga este archivo) |
| `common/legacy/` (carpeta nueva) | Copia de la versión anterior para Amazon |
| `amazon/legacy/` (carpeta nueva) | Copia de `amazon.js` y `spatial.js` actuales |

**No se publican:** los `index.html` y la carpeta `pruebas/`. `site.css`, `slider.css`, los `keycode.js` y `webOSPlatform.js` no cambiaron.

Todo el JavaScript es ES5 (validado con un parser en modo ES5) y funciona con jQuery 1.12.4.

## Cómo decide la versión

`common/js/jquery.min.js` es el primer archivo que cargan los tres `index.html`. Ahí se detecta la plataforma por el user agent:

- **LG, Samsung y PC:** se carga jQuery 1.12.4 desde el CDN (con la copia local como respaldo) y cada archivo ejecuta su parte de la v2.
- **Amazon:** cada archivo, en lugar de su código, carga en el mismo lugar del orden su copia de `common/legacy/js/` o `amazon/legacy/js/`. El resultado es idéntico a cargar la versión anterior. Además, igual que hacía el selector de versión anterior, agrega `common/legacy/css/site.css` y `slider.css`.

**Para pasar Amazon a la v2:** `AMAZON_V2 = true` al principio de `common/js/jquery.min.js`. El adaptador no está probado en un Fire TV: validarlo antes.

### A verificar antes de publicar

`common/legacy/` tiene **la versión anterior tal como estaba en el primer commit del repo** (menú como tira "OPCIONES", que es lo que maneja `amazon/js/spatial.js`). Si Amazon corre hoy otra versión en producción, reemplacen el contenido de esa carpeta por los archivos exactos que usa hoy. El mecanismo no depende del contenido.

## v2.1: diseño y navegación de la búsqueda

Archivos que cambian respecto de la v2: `common/js/config.js`, `utils.js`, `search.js`, `xiclos.js`, `arrows.js`, `JCPlayer.js` y `common/css/custom.css`. El resto queda igual.

### Navegación de la búsqueda

- Derecha desde el teclado cae en la **primera persona**.
- En Personas, derecha e izquierda avanzan de a una, en orden. Derecha desde la última pasa al **primer afiche**; izquierda desde la primera vuelve al teclado.
- En los afiches, derecha al final de una fila sigue en la primera de la siguiente e izquierda al principio de una fila vuelve a la última de la anterior. Solo el primer afiche de la primera fila sale al teclado.
- Arriba desde la primera fila de afiches sube a Personas.
- Se quitó **"Teclado TV"**: el campo es de solo lectura y se escribe con el teclado propio o los números del control. La fila inferior queda 123 · Borrar · Espacio · Vaciar.

### Diseño

- **Marca:** acento C, un triángulo rojo chico en la esquina superior derecha con el logo al lado. Reemplaza los triángulos y el trapecio grandes.
- **Fondo:** afiche en color con degradés hacia el fondo (propuesta A), sin gris ni desenfoque. Cambia con un fundido.
- **Tipografía:** Roboto 300/400/500 (Google Fonts). Los títulos de las tiras van en minúscula inicial.
- **Afiches:** foco con escala 1,06 y anillo rojo interno, sin borde que se corte. Las imágenes aparecen con un fundido al cargar.
- **Menú lateral:** íconos en la columna cerrada, con barra roja en la sección actual. Al abrir, el panel ya no es negro sólido: es un degradé que se desvanece hacia la derecha sin borde, entra con desplazamiento y opacidad (200 ms) y el contenido se oscurece con un velo en degradé. Mover el puntero al contenido lo cierra.
- **Ficha:** tarjeta centrada con afiche, datos, sinopsis, créditos y botones "Ver ahora" y "Agregar a Mi lista" / "En Mi lista".
- **Confirmaciones y avisos:** mismas tarjetas, con botones redondeados.
- **Cineclub:** carrusel destacado arriba de las tiras con la película mejor puntuada en IMDb de cada ciclo (máximo 5, sin repetir). Por ahora fijo, sin rotación aleatoria. Avanza solo cada 8 s mientras no tiene el foco. En la tira enfocada, el título suma la película elegida.
- **Explorar:** pantalla propia con géneros en tarjetas y, al elegir uno, la grilla de películas.
- **Búsqueda:** campo con ícono, Personas con iniciales y rol ("Dirección" / "Elenco").

Animaciones solo con `transform` y `opacity`, sin desenfoques, pensando en las TVs de 2017.

## Búsqueda predictiva

- **Pantalla:** teclado propio a la izquierda (A-Z, Ñ, 123, Espacio, Borrar, Vaciar) y resultados a la derecha, que se actualizan mientras se escribe.
- **Búsqueda:** usa `genericSearch` desde la 2.ª letra, 350 ms después de la última tecla, cancelando el pedido anterior. Al agregar una letra, los resultados que ya hay se filtran al instante y después se completan con la respuesta. Las búsquedas ya hechas quedan en memoria.
- **Personas:** directores y elenco que coinciden con lo escrito, tomados de los resultados. Al elegir uno se ven sus películas.
- **Orden de las películas:** primero las que empiezan con lo escrito, después las que lo contienen, y al final las coincidencias por director o elenco.
- **Búsquedas recientes:** las últimas 8 se guardan en la TV, se muestran antes de escribir y se pueden borrar. No se pierden al cerrar sesión.
- **Teclas numéricas del control:** escriben números.
- **Desde los resultados** se abre la ficha o se reproduce. Al salir del video se vuelve a la búsqueda tal como estaba.

## Rendimiento

- **Home:** primero 4 tiras y después de a 6 con `offset` a medida que se baja, pidiendo por adelantado cuando faltan 3.
- **Tiras largas (Estrenos):** se crean 24 pósters de entrada y se agregan más al avanzar, siempre con 12 de margen por delante del foco.
- **Imágenes:** se cargan solo las visibles y 4 por delante.
- **Detalle:** un solo panel (antes había uno oculto por película). El fondo cambia 250 ms después de que el foco se detiene.

Todos estos valores se ajustan en `XTV.config`, dentro de `common/js/config.js`.

## Cambios de comportamiento

- **PIN:** además del botón, cada 10 s se consulta solo si el usuario ya lo ingresó.
- **Sesión:** un error de red al arrancar ya no borra la sincronización; se reintenta.
- **Cerrar sesión:** espera la confirmación de `unsync` (máximo 6 s) antes de recargar.
- **Teclas:** Play en un póster reproduce directo. En el video, izquierda/derecha ±10 s, adelantar/retroceder ±30 s y azul cambia los subtítulos.

## Cómo probar en la PC

1. Desde la raíz del repo: `python -m http.server 8000`
2. Abrir:
   - `http://localhost:8000/pruebas/lg.html`: copia del `index.html` de LG con rutas locales y el mismo orden de carga.
   - `http://localhost:8000/pruebas/samsung.html`: ídem Samsung.
   - `http://localhost:8000/pruebas/amazon.html`: ídem Amazon, forzando la plataforma Amazon. Debe verse la versión anterior.
3. Flechas, Enter, Escape (Volver), Espacio (play/pausa) y números.

## Lista de prueba en TVs

Al menos una LG y una Samsung de 2017 y una nueva de cada una:

- [ ] PIN: aparece, se renueva a los 60 s y entra solo al sincronizar desde la web
- [ ] Reingreso con sesión guardada; abrir la app sin red (debe reintentar, no pedir PIN)
- [ ] Home: recorrer Estrenos hasta el final y volver; bajar por todas las tiras hasta dar la vuelta
- [ ] Al volver a una tira, el foco está donde se dejó
- [ ] Mantener apretada una flecha: no se desalinea ni se pierde el foco
- [ ] Cineclub: carrusel destacado (avanza solo cada 8 s, se navega con izquierda/derecha, OK abre la ficha)
- [ ] Explorar: géneros → películas → ficha; Volver retrocede un nivel
- [ ] Menú: abre y cierra suave; con el Magic Remote, mover el puntero al contenido lo cierra
- [ ] Menú: Buscar, Inicio, Cineclub, Explorar, Exclusivos (cuenta de alumno), Salir, Cerrar sesión
- [ ] Ficha: Ver ahora, agregar y quitar de Mi lista
- [ ] Volver mientras carga una ficha o el video: no aparece nada después
- [ ] Video: OK, Play, Pausa, flechas, adelantar/retroceder, azul, Volver, Stop; reanuda donde se dejó
- [ ] Búsqueda:
  - [ ] escribir con el teclado propio; resultados mientras se escribe
  - [ ] búsqueda sin tildes ("almodovar"); Personas; entrar a una persona
  - [ ] números con 123 y con las teclas del control
  - [ ] búsquedas recientes; borrar recientes
  - [ ] búsqueda sin resultados
  - [ ] navegación: teclado → Personas → afiches y vuelta, con derecha/izquierda
  - [ ] reproducir desde la búsqueda y volver
- [ ] Magic Remote de LG: hover y click en pósters, menú, teclado y botones; después volver a las flechas
- [ ] Desconectar la red con la app abierta
- [ ] TVs HD (1280×720) y Full HD (1920×1080)
- [ ] **Amazon:** sigue funcionando y viéndose como hoy

## Qué no incluye

- Probar el adaptador de Amazon en un Fire TV.
- Cambios en el backend (por ejemplo, reducir el tamaño de la respuesta de `home`).
- Rediseño estilo mobile.
- En la ficha: botón "Desde el principio" y barra de progreso de "Continuar viendo" (están en la guía de diseño, falta el dato del backend).
