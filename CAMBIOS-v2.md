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

## v2.6: "Activá Xiclos en tu TV" (vinculación con QR)

Cambian `common/js/login.js`, `common/js/config.js` y `common/css/custom.css` (este zip incluye también `common/js/JCPlayer.js` de la v2.5).

- Pantalla nueva en lugar del texto del PIN: **QR a la izquierda** como vía principal ("Escaneá con tu celular") y, a la derecha, "¿No podés escanear?" → 1. Entrá a **xiclos.com/sync** → 2. Escribí este código (6 dígitos en grupos de 3). Al pie: "La TV se activa sola en unos segundos." / "El código cambia cada minuto."
- Letra grande y alto contraste, tipografía **Atkinson Hyperlegible** (se carga de Google Fonts; si no llega, usa Roboto).
- **QR:** abre `https://xiclos.com/sync?codigo=XXXXXX`. Se genera en la TV con un generador QR de licencia MIT (Kazuhiko Arase) incluido dentro de `login.js`, sin servicios externos. Se regenera junto con el código cada minuto. La dirección y el nombre del parámetro están en `XTV.config` (`SYNC_URL`, `SYNC_PARAM`).
- Mismo flujo de antes: `newPin` para el código, consulta automática a `checkPin` cada 10 s y la TV entra sola. OK fuerza la consulta; Volver ofrece salir. Al renovar el código ya no aparece el indicador de carga.
- **Pendiente web:** que /sync precargue el código desde la dirección; corregir el texto de la tarjeta ("Escribí el código que ves en tu TV y tocá Vincular") y el subtítulo cortado.
- **Pendiente backend:** que el código anterior siga siendo válido unos minutos después de rotar. A futuro, dirección corta con 301 (xiclos.com/tv o /activar): se cambia en `SYNC_URL`.

## v2.5: estilo de los subtítulos

Cambian `common/js/JCPlayer.js` y `common/css/custom.css`.

- El botón **Subtítulos** abre un panel con tres columnas: **Idioma** (incluye "Desactivados"), **Tamaño** (Pequeño, **Mediano**, Grande) e **Color** (**Blanco**, Amarillo). En negrita, los valores predeterminados.
- Izquierda/derecha cambian de columna; arriba/abajo eligen y el cambio se ve en el acto; OK o Volver cierran.
- Tamaño y color se guardan en la TV y valen para todas las películas. Los subtítulos van sin fondo, con contorno oscuro para leerse sobre escenas claras.
- Funciona tanto si los subtítulos los dibuja el reproductor (LG, PC) como si los dibuja la TV (Samsung). **A verificar en una Samsung.**
- El botón aparece solo en las películas que tienen pistas de subtítulos (las que los traen quemados en la imagen no se pueden cambiar).

## v2.4: reproductor, ficha, Cineclub y marca

Cambian `common/js/config.js`, `common/js/JCPlayer.js`, `common/js/xiclos.js` y `common/css/custom.css`.

### Reproductor: barra propia

- Aparece con cualquier tecla y se oculta sola a los 5 s si el video está andando (pausado se queda). Muestra el título, la barra de progreso con el tiempo y los botones: **Pausa/Reproducir**, **Desde el inicio**, **Subtítulos** (si la película tiene) y **Transmitir** (solo donde el reproductor lo ofrece; en las TVs no aparece).
- Los controles propios del reproductor quedan ocultos; los subtítulos se siguen viendo y suben un poco cuando la barra está visible.
- **Teclas:**
  - Barra oculta: izquierda/derecha empiezan a adelantar/atrasar; OK, arriba o abajo solo muestran la barra; Volver sale del video.
  - En la barra de progreso: izquierda/derecha adelantan/atrasan; OK confirma el salto (o pausa); abajo baja a los botones; Volver oculta la barra (o cancela el salto que se estaba eligiendo).
  - En los botones: izquierda/derecha eligen, OK acciona, arriba vuelve a la barra.
  - En cualquier momento: Play, Pausa, Play/Pausa, adelantar/retroceder (pasos de 30 s o más), azul (siguiente subtítulo, incluye "Desactivados") y Stop (salir).
- **Adelantar y atrasar:**
  - Mientras se aprieta se mueve solo el indicador, con el tiempo de destino y la diferencia (por ejemplo "32:10 (+2:30)"). El salto real se hace una sola vez, 0,7 s después de soltar.
  - Si se mantiene apretado, el paso crece: 10 s el primer segundo, 30 s hasta los 2,5 s, 60 s hasta los 5 s y después 2 min. Toques sueltos siempre son de 10 s.
  - Los valores están en `XTV.config` (`SEEK_ACCEL`, `SEEK_COMMIT_MS`).
- **Subtítulos:** menú con los idiomas de la película y "Desactivados". La elección se recuerda en la TV para las próximas películas.
- **Desde el inicio:** vuelve a 0 y desde ahí se guarda el progreso.
- Con el Magic Remote, mover el puntero muestra la barra y los botones se pueden cliquear (también la barra de progreso).

### Ficha: "Seguir viendo"

- Si la película ya se empezó a ver: rótulo "Continuar viendo · quedan N min", botón principal **Seguir viendo** y al lado **Desde el principio**. Si no, queda como antes ("Ver ahora").
- Cómo se sabe que está empezada:
  - lo guardado desde esta TV (se recuerda en la TV cada vez que se guarda el progreso, y se borra al terminarla);
  - "Lo que ya viste" (`userHistory`), consultado al abrir la ficha (una vez por minuto como máximo), para lo visto en otros equipos. Si la respuesta trae el tiempo (`resumePoint`, `time`, `progress`…), se usa. Si no lo trae, figurar en la lista alcanza para mostrar los botones (se puede apagar con `RESUME_FROM_HISTORY_LIST` en `XTV.config`).
- **A verificar:** qué campos trae realmente `userHistory`, y que una película terminada salga de esa lista. Si no sale, conviene apagar `RESUME_FROM_HISTORY_LIST`.

### Cineclub sin carrusel destacado

- Mismo modelo que la Home: detalle y fondo de la película con foco arriba, y las tiras de los ciclos abajo.

### Marca

- Triángulo de 14,1vw y logo de 4,8vw de alto, a 3,3vw del borde superior y 2,8vw del derecho (×1,5 de la versión anterior), en el rojo institucional.

## v2.2: ajustes

Cambian `common/js/config.js`, `common/js/xiclos.js`, `common/js/JCPlayer.js`, `common/js/arrows.js` y `common/css/custom.css`.

- **Primer afiche cortado:** el borde del recorte de las tiras quedaba justo en el afiche con foco y la escala lo cortaba. Ahora hay 0,8 vw de margen.
- **Bordes:** 0,25 vw en afiches, carrusel, ficha, botones, teclado, Personas y Explorar. Los círculos (iniciales) y los puntos del carrusel no cambian.
- **Fondo en alta calidad:** el afiche llega como miniatura (`movies/<id>/slider-2_150x260.jpg`) y estirada se veía pixelada. Para el fondo se prueba, en orden:
  1. la horizontal del sitio web (`movies_landscape/<id>/slider-1.jpg`);
  2. el afiche original sin achicar (`movies/<id>/slider-2.jpg`);
  3. la miniatura.
  Si una no existe se pasa a la siguiente, y se recuerda para no volver a pedirla. El carrusel de Cineclub y la ficha usan lo mismo.
- **Cambio de fondo rápido:**
  - Mientras el foco está quieto se precargan, de a una, las imágenes de los afiches vecinos (2 a la derecha, 1 a la izquierda y 1 más a la derecha). Al moverse, el fondo ya está y cambia en ~120 ms.
  - Si la imagen todavía no llegó, el fondo anterior se apaga enseguida (no queda el de otra película) y la nueva aparece apenas termina de bajar.
  - Se guardan en memoria las últimas 24 imágenes cargadas y se muestran tal cual, sin volver a descargarlas.
- **Marca:** el triángulo de la esquina crece a 9,4 vw y el logo se apoya sobre la diagonal, mitad sobre el rojo y mitad sobre la imagen (variante D de la guía). El logo lleva una sombra suave para leerse sobre fondos claros.
- **Final de las tiras:** la tira se frena alineada a un afiche, así el primero que se ve a la izquierda tampoco queda cortado.
- **Retomar la película:**
  - El salto a la posición guardada se verifica 2 s después y se reintenta hasta 3 veces (algunas TVs ignoran el primero).
  - Mientras el salto no llegue, no se guarda nada: un salto fallido ya no pisa la posición con 0.
  - Si después de 3 intentos no llega, se sigue desde donde está y queda registrado en el log (`player-resume`).
  - Se guarda también al ocultarse la app (botón Home o cambio de app) y antes de salir con EXIT.
  - Si se vuelve a abrir la misma película enseguida, se espera a que termine el último guardado antes de pedir la posición.

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
