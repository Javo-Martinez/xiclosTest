/*
 * Xiclos TV v2 - búsqueda predictiva con teclado propio
 * Este archivo mantiene su nombre porque lo carga el index.html empaquetado.
 * En Amazon (mientras siga con la versión anterior) carga la copia de common/legacy/js/search.js.
 * ES5 puro.
 */
if (window.XTV_BOOT && window.XTV_BOOT.legacy) {
  window.XTV_BOOT.load("search.js");
} else {
  /*
   * Xiclos TV v2 - búsqueda predictiva con teclado propio
   *
   * - Teclado de la app (A-Z, Ñ, 123) a la izquierda; resultados a la derecha
   *   que se actualizan mientras se escribe.
   * - Usa genericSearch (coincidencias parciales, sin tildes, en título,
   *   director y elenco). Al agregar una letra se filtran al instante los
   *   resultados que ya hay y después se completan con la respuesta.
   * - Fila "Personas" (directores y elenco) armada a partir de los resultados.
   * - Búsquedas recientes guardadas en la TV.
   * - Navegación por zonas (teclado, personas, películas, recientes) con
   *   reglas explícitas: en las listas, derecha/izquierda avanzan en orden
   *   y pasan de fila; no se navega por cercanía en pantalla.
   *
   * ES5 puro.
   */
  (function ($, XTV) {
    "use strict";

    var C = XTV.config;
    var P = XTV.paths;
    var util = XTV.util;

    var RECENT_KEY = "xtv_recent_searches";

    var LAYOUTS = {
      alpha: [
        "A", "B", "C", "D", "E", "F",
        "G", "H", "I", "J", "K", "L",
        "M", "N", "Ñ", "O", "P", "Q",
        "R", "S", "T", "U", "V", "W",
        "X", "Y", "Z", { a: "mode", label: "123" }, { a: "del", label: "Borrar", w: 2 },
        { a: "space", label: "Espacio", w: 3 }, { a: "clear", label: "Vaciar", w: 3 }
      ],
      num: [
        "1", "2", "3", "4", "5", "6",
        "7", "8", "9", "0", "-", ".",
        { a: "mode", label: "ABC", w: 2 }, { a: "del", label: "Borrar", w: 2 }, { a: "clear", label: "Vaciar", w: 2 },
        { a: "space", label: "Espacio", w: 6 }
      ]
    };

    var $root = null;
    var $input = null;
    var $keys = null;
    var $status = null;
    var $body = null;

    var state = {
      open: false,
      query: "",
      mode: "alpha",
      view: "recent", // recent | results | person
      person: null,
      items: [], // resultados mostrados
      focus: null,
      lastKey: null,
      gen: 0,
      shownFor: null
    };

    var cache = {}; // consulta normalizada -> resultados del servidor
    var scheduled = util.debounce(function () {
      fetchQuery(state.query);
    }, C.SEARCH_DELAY_MS);

    /* ======================================================================
     * Búsquedas recientes
     * ==================================================================== */
    function recents() {
      try {
        var list = JSON.parse(XTV.storage.get(RECENT_KEY) || "[]");
        return $.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    }

    function saveRecent(text) {
      text = $.trim(String(text || ""));
      if (text.length < C.SEARCH_MIN_CHARS) {
        return;
      }
      var key = util.norm(text);
      var list = recents();
      var out = [text];
      for (var i = 0; i < list.length && out.length < C.SEARCH_RECENT_MAX; i++) {
        if (util.norm(list[i]) !== key) {
          out.push(list[i]);
        }
      }
      XTV.storage.set(RECENT_KEY, JSON.stringify(out));
    }

    /* ======================================================================
     * Coincidencias y orden
     * ==================================================================== */
    function names(value) {
      if (!value) {
        return [];
      }
      var list = $.isArray(value) ? value : String(value).split(",");
      var out = [];
      for (var i = 0; i < list.length; i++) {
        var n = $.trim(util.plain(list[i]));
        if (n) {
          out.push(n);
        }
      }
      return out;
    }

    function wordStarts(text, q) {
      var words = text.split(/[\s\-.,:;'"()]+/);
      for (var i = 0; i < words.length; i++) {
        if (words[i].indexOf(q) === 0) {
          return true;
        }
      }
      return false;
    }

    // Puntaje de coincidencia de un texto normalizado (menor = mejor), -1 si no coincide
    function matchScore(text, q) {
      if (!text) {
        return -1;
      }
      if (text.indexOf(q) === 0) {
        return 0;
      }
      if (wordStarts(text, q)) {
        return 1;
      }
      if (text.indexOf(q) !== -1) {
        return 2;
      }
      return -1;
    }

    function itemScore(item, q) {
      var t = matchScore(util.norm(item.title), q);
      if (t !== -1) {
        return t;
      }
      if (matchScore(util.norm(names(item.director).join(", ")), q) !== -1) {
        return 3;
      }
      if (matchScore(util.norm(names(item.actors).join(", ")), q) !== -1) {
        return 4;
      }
      return 5; // el backend lo encontró por otro campo
    }

    function rank(items, q, localOnly) {
      var scored = [];
      for (var i = 0; i < items.length; i++) {
        var sc = itemScore(items[i], q);
        if (localOnly && sc === 5) {
          continue; // en el filtrado local solo quedan las coincidencias visibles
        }
        scored.push({ item: items[i], score: sc, index: i });
      }
      scored.sort(function (a, b) {
        return a.score - b.score || a.index - b.index;
      });
      var out = [];
      for (var j = 0; j < scored.length && j < C.SEARCH_MAX_RESULTS; j++) {
        out.push(scored[j].item);
      }
      return out;
    }

    function extractPeople(items, q) {
      var found = {};
      var list = [];
      function add(name, role) {
        var n = util.norm(name);
        var sc = matchScore(n, q);
        // Para personas solo cuentan el comienzo del nombre o de una palabra
        // ("berg" -> Bergman, pero "be" no trae a "Roberto")
        if (sc === -1 || sc === 2) {
          return;
        }
        if (found[n]) {
          if (role === "Director") {
            found[n].role = "Director";
          }
          return;
        }
        found[n] = { name: name, norm: n, role: role, score: sc };
        list.push(found[n]);
      }
      for (var i = 0; i < items.length; i++) {
        var d = names(items[i].director);
        for (var a = 0; a < d.length; a++) {
          add(d[a], "Director");
        }
        var e = names(items[i].actors);
        for (var b = 0; b < e.length; b++) {
          add(e[b], "Elenco");
        }
      }
      list.sort(function (x, y) {
        return x.score - y.score || (x.name < y.name ? -1 : x.name > y.name ? 1 : 0);
      });
      return list.slice(0, C.SEARCH_MAX_PEOPLE);
    }

    /* ======================================================================
     * Pedidos
     * ==================================================================== */
    function normQuery(text) {
      return $.trim(util.norm(text)).replace(/\s+/g, " ");
    }

    function request(text, onDone, onFail) {
      var key = normQuery(text);
      if (cache.hasOwnProperty(key)) {
        onDone(cache[key]);
        return;
      }
      var gen = ++state.gen;
      XTV.api.abort("suggest");
      setStatus("Buscando…");
      XTV.api
        .get(P.search, { searchTerms: $.trim(text).toUpperCase() }, "suggest")
        .done(function (res) {
          var data = (res && res.data) || [];
          cache[key] = data;
          if (gen === state.gen) {
            setStatus("");
            onDone(data);
          }
        })
        .fail(function (xhr, textStatus) {
          if (XTV.api.isAbort(xhr, textStatus) || gen !== state.gen) {
            return;
          }
          XTV.log.error("search", xhr, { terms: text });
          setStatus("No pudimos buscar. Probá de nuevo en unos segundos.");
          if (onFail) {
            onFail();
          }
        });
    }

    function fetchQuery(text) {
      if (!state.open || state.view === "person") {
        return;
      }
      var q = normQuery(text);
      if (q.length < C.SEARCH_MIN_CHARS) {
        return;
      }
      request(text, function (data) {
        if (normQuery(state.query) === q && state.view !== "person") {
          showResults(data, q, false);
        }
      });
    }

    // Filtrado inmediato con lo que ya se tiene (la consulta más larga que
    // sea prefijo de la actual)
    function localRefine(q) {
      var best = null;
      for (var key in cache) {
        if (cache.hasOwnProperty(key) && q.indexOf(key) === 0 && (!best || key.length > best.length)) {
          best = key;
        }
      }
      if (best !== null) {
        showResults(cache[best], q, best !== q);
        return best === q;
      }
      return false;
    }

    function queryChanged() {
      var q = normQuery(state.query);
      state.view = "results";
      state.person = null;
      if (!q) {
        scheduled.cancel();
        XTV.api.abort("suggest");
        state.gen++;
        setStatus("");
        showRecent();
        return;
      }
      if (q.length < C.SEARCH_MIN_CHARS) {
        scheduled.cancel();
        XTV.api.abort("suggest");
        state.gen++;
        setStatus("");
        showHint("Escribí al menos " + C.SEARCH_MIN_CHARS + " letras.");
        return;
      }
      var complete = localRefine(q);
      if (complete) {
        scheduled.cancel();
        setStatus("");
      } else {
        scheduled();
      }
    }

    /* ======================================================================
     * Render
     * ==================================================================== */
    function setStatus(text) {
      if ($status) {
        $status.text(text || "");
      }
    }

    function keyHtml(k) {
      if (typeof k === "string") {
        return '<div class="xs-key xs-f" data-k="' + util.esc(k) + '">' + util.esc(k) + "</div>";
      }
      var cls = "xs-key xs-f" + (k.w ? " w" + k.w : "") + (k.label.length > 3 ? " small" : "");
      return '<div class="' + cls + '" data-a="' + k.a + '">' + util.esc(k.label) + "</div>";
    }

    function renderKeys() {
      var layout = LAYOUTS[state.mode];
      var html = "";
      for (var i = 0; i < layout.length; i++) {
        html += keyHtml(layout[i]);
      }
      $keys.html(html);
    }

    function setBody(html) {
      $body.html(html);
      setShift(0);
      ensureFocusExists();
    }

    function showHint(text) {
      state.items = [];
      setBody('<p class="xs-hint">' + util.esc(text) + "</p>");
    }

    function showRecent() {
      state.view = "recent";
      state.items = [];
      var list = recents();
      if (!list.length) {
        setBody(
          '<p class="xs-hint">Escribí con el teclado para buscar películas, directores o actores.</p>'
        );
        return;
      }
      var html = '<p class="xs-label">Búsquedas recientes</p>';
      for (var i = 0; i < list.length; i++) {
        html += '<div class="xs-recent xs-f" data-recent="' + i + '">' + util.esc(list[i]) + "</div>";
      }
      html += '<div class="xs-recent clear xs-f" data-clear="1">Borrar búsquedas recientes</div>';
      setBody(html);
    }

    function moviesHtml(items) {
      var html = '<div class="xs-movies">';
      for (var i = 0; i < items.length; i++) {
        html +=
          '<div class="xs-movie xs-f" data-movie="' +
          i +
          '"><div class="ph"><img alt=""></div><div class="t">' +
          util.text(items[i].title) +
          "</div></div>";
      }
      return html + "</div>";
    }

    function showResults(data, q, preliminary) {
      var items = rank(data, q, preliminary);
      var people = extractPeople(data, q);
      state.items = items;
      state.people = people;
      state.shownFor = q;
      if (!items.length && !people.length) {
        if (preliminary) {
          return; // se espera la respuesta del servidor
        }
        showHint("No encontramos resultados para “" + $.trim(state.query) + "”.");
        return;
      }
      var html = "";
      if (people.length) {
        html += '<p class="xs-label">Personas</p><div class="xs-people">';
        for (var i = 0; i < people.length; i++) {
          var ini = people[i].name.split(/\s+/);
          ini = (ini[0] ? ini[0].charAt(0) : "") + (ini.length > 1 ? ini[ini.length - 1].charAt(0) : "");
          html +=
            '<div class="xs-person xs-f" data-person="' +
            i +
            '"><span class="xs-ini">' +
            util.esc(ini.toUpperCase()) +
            "</span>" +
            util.esc(people[i].name) +
            '<span class="role">' +
            (people[i].role === "Director" ? "Dirección" : "Elenco") +
            "</span></div>";
        }
        html += "</div>";
      }
      if (items.length) {
        html += '<p class="xs-label">Películas</p>' + moviesHtml(items);
      }
      setBody(html);
      loadPosters(0);
    }

    function showPerson(person) {
      state.view = "person";
      state.person = person;
      state.items = [];
      var title = (person.role === "Director" ? "Películas de " : "Películas con ") + person.name;
      setBody('<p class="xs-label">' + util.esc(title) + "</p>");
      saveRecent(person.name);
      request(person.name, function (data) {
        if (state.view !== "person" || state.person !== person) {
          return;
        }
        var mine = [];
        for (var i = 0; i < data.length; i++) {
          var all = names(data[i].director).concat(names(data[i].actors));
          for (var j = 0; j < all.length; j++) {
            if (util.norm(all[j]) === person.norm) {
              mine.push(data[i]);
              break;
            }
          }
        }
        if (!mine.length) {
          mine = data;
        }
        state.items = mine.slice(0, C.SEARCH_MAX_RESULTS);
        setBody('<p class="xs-label">' + util.esc(title) + "</p>" + moviesHtml(state.items));
        var first = $body.find(".xs-movie").get(0);
        if (first) {
          focus(first);
        }
        loadPosters(0);
      });
    }

    function posterLoaded() {
      this.className = "ok";
    }

    function loadPosters(upTo) {
      var imgs = $body.find(".xs-movie img");
      var limit = Math.max(upTo + 10, 10);
      for (var i = 0; i < imgs.length && i < limit; i++) {
        if (!imgs[i].getAttribute("src") && state.items[i] && state.items[i].poster) {
          imgs[i].onload = posterLoaded;
          imgs[i].setAttribute("src", state.items[i].poster);
        }
      }
    }

    /* ======================================================================
     * Foco
     * ==================================================================== */
    function zoneOf(el) {
      var $el = $(el);
      if ($el.hasClass("xs-key")) {
        return "keys";
      }
      if ($el.hasClass("xs-person")) {
        return "people";
      }
      if ($el.hasClass("xs-movie")) {
        return "movies";
      }
      if ($el.hasClass("xs-recent")) {
        return "recent";
      }
      return null;
    }

    function zoneItems(zone) {
      if (!$root) {
        return [];
      }
      var sel = { keys: ".xs-key", people: ".xs-person", movies: ".xs-movie", recent: ".xs-recent" }[zone];
      return $root.find(sel).get();
    }

    function backToKeys() {
      var k = state.lastKey && $.contains(document.documentElement, state.lastKey) ? state.lastKey : null;
      focus(k || $keys.find(".xs-key").get(0));
    }

    // Primer elemento de los resultados (personas, películas o recientes)
    function firstResult() {
      return zoneItems("people")[0] || zoneItems("movies")[0] || zoneItems("recent")[0] || null;
    }

    // Columnas de la grilla de películas según su posición real
    function movieColumns(list) {
      if (!list.length) {
        return 1;
      }
      var top = list[0].offsetTop;
      var n = 0;
      while (n < list.length && list[n].offsetTop === top) {
        n++;
      }
      return Math.max(1, n);
    }

    function navigate(action) {
      var el = state.focus;
      var zone = zoneOf(el);
      if (zone === "keys") {
        var next = XTV.nav.pick($(zoneItems("keys")), el, action);
        if (next) {
          focus(next);
        } else if (action === "RIGHT") {
          var first = firstResult();
          if (first) {
            focus(first);
          }
        }
        return;
      }
      var list = zoneItems(zone);
      var i = $.inArray(el, list);
      if (zone === "people") {
        if (action === "RIGHT") {
          if (i < list.length - 1) {
            focus(list[i + 1]);
          } else if (zoneItems("movies").length) {
            focus(zoneItems("movies")[0]);
          }
        } else if (action === "LEFT") {
          if (i > 0) {
            focus(list[i - 1]);
          } else {
            backToKeys();
          }
        } else if (action === "DOWN") {
          if (zoneItems("movies").length) {
            focus(zoneItems("movies")[0]);
          }
        }
        return;
      }
      if (zone === "movies") {
        var cols = movieColumns(list);
        if (action === "RIGHT") {
          if (i < list.length - 1) {
            focus(list[i + 1]);
          }
        } else if (action === "LEFT") {
          if (i > 0) {
            focus(list[i - 1]);
          } else {
            backToKeys();
          }
        } else if (action === "DOWN") {
          if (i + cols < list.length) {
            focus(list[i + cols]);
          } else if (Math.floor(i / cols) < Math.floor((list.length - 1) / cols)) {
            focus(list[list.length - 1]);
          }
        } else if (action === "UP") {
          if (i - cols >= 0) {
            focus(list[i - cols]);
          } else {
            var people = zoneItems("people");
            if (people.length) {
              focus(state.lastPerson && $.inArray(state.lastPerson, people) !== -1 ? state.lastPerson : people[0]);
            }
          }
        }
        return;
      }
      if (zone === "recent") {
        if (action === "DOWN" && i < list.length - 1) {
          focus(list[i + 1]);
        } else if (action === "UP" && i > 0) {
          focus(list[i - 1]);
        } else if (action === "LEFT") {
          backToKeys();
        }
        return;
      }
      backToKeys();
    }

    function focus(el) {
      if (!el) {
        return;
      }
      if (state.focus && state.focus !== el) {
        $(state.focus).removeClass("onFocus");
      }
      state.focus = el;
      $(el).addClass("onFocus");
      var zone = zoneOf(el);
      if (zone === "keys") {
        state.lastKey = el;
      } else if (zone === "people") {
        state.lastPerson = el;
      }
      ensureVisible(el);
      var idx = $(el).attr("data-movie");
      if (idx !== undefined) {
        loadPosters(parseInt(idx, 10));
      }
    }

    function ensureFocusExists() {
      if (!state.focus || !$.contains(document.documentElement, state.focus)) {
        state.focus = null;
        focus($keys.find(".xs-key").get(0));
      }
    }

    // Desplaza la columna de resultados para que el foco quede a la vista
    function setShift(px) {
      if (!$body) {
        return;
      }
      var value = "translateY(" + Math.round(-px) + "px)";
      $body.get(0).style.webkitTransform = value;
      $body.get(0).style.transform = value;
      $body.data("shift", px);
    }

    function ensureVisible(el) {
      if (!$body || !$.contains($body.get(0), el)) {
        return;
      }
      // .xs-body es position: relative, así que offsetTop es relativo a ella
      var shift = $body.data("shift") || 0;
      var top = el.offsetTop;
      var h = el.offsetHeight;
      var viewH = $body.parent().get(0).clientHeight - $body.get(0).offsetTop;
      if (top - shift < 0) {
        setShift(Math.max(0, top - 20));
      } else if (top + h - shift > viewH) {
        setShift(top + h - viewH + 20);
      }
    }

    /* ======================================================================
     * Acciones
     * ==================================================================== */
    function typeText(text) {
      if (state.query.length >= 35) {
        return;
      }
      state.query += text;
      $input.val(state.query);
      queryChanged();
    }

    function setQuery(text, immediate) {
      state.query = text;
      $input.val(text);
      if (immediate) {
        state.view = "results";
        state.person = null;
        var q = normQuery(text);
        if (q.length >= C.SEARCH_MIN_CHARS && !localRefine(q)) {
          scheduled.cancel();
          fetchQuery(text);
        } else if (q.length < C.SEARCH_MIN_CHARS) {
          queryChanged();
        }
      } else {
        queryChanged();
      }
    }

    function activate(el) {
      var $el = $(el);
      if ($el.attr("data-k") !== undefined) {
        typeText($el.attr("data-k"));
        return;
      }
      var a = $el.attr("data-a");
      if (a) {
        if (a === "del") {
          setQuery(state.query.substring(0, state.query.length - 1));
        } else if (a === "clear") {
          setQuery("");
        } else if (a === "space") {
          if (state.query && state.query.charAt(state.query.length - 1) !== " ") {
            typeText(" ");
          }
        } else if (a === "mode") {
          state.mode = state.mode === "alpha" ? "num" : "alpha";
          renderKeys();
          focus($keys.find('[data-a="mode"]').get(0));
        }
        return;
      }
      if ($el.attr("data-recent") !== undefined) {
        var list = recents();
        var text = list[parseInt($el.attr("data-recent"), 10)];
        if (text) {
          setQuery(text, true);
        }
        return;
      }
      if ($el.attr("data-clear") !== undefined) {
        XTV.storage.remove(RECENT_KEY);
        showRecent();
        focus($keys.find(".xs-key").get(0));
        return;
      }
      if ($el.attr("data-person") !== undefined) {
        var person = state.people[parseInt($el.attr("data-person"), 10)];
        if (person) {
          showPerson(person);
        }
        return;
      }
      if ($el.attr("data-movie") !== undefined) {
        var item = state.items[parseInt($el.attr("data-movie"), 10)];
        if (item) {
          saveRecent(state.view === "person" && state.person ? state.person.name : state.query);
          XTV.actions.openMovie(item, { screen: "search" });
        }
      }
    }

    /* ======================================================================
     * Pantalla
     * ==================================================================== */
    function build() {
      $root = $(
        '<div id="xtvSearch">' +
          '<div class="xs-left"><div class="xs-title">BUSCAR</div><div class="xs-field">' +
          '<span class="xs-sicon">' + XTV.icon("search", "") + "</span>" +
          '<input id="xsInput" class="xs-input" readonly tabindex="-1" maxlength="35" autocomplete="off" spellcheck="false"></div>' +
          '<div class="xs-keys"></div><div class="xs-tip">Los números del control también escriben</div></div>' +
          '<div class="xs-right"><img class="xs-logo" alt="Xiclos" src="' +
          util.esc(C.IMG + "logo.png") +
          '"><div class="xs-status"></div><div class="xs-body"></div></div>' +
          "</div>"
      );
      $input = $root.find("#xsInput");
      $keys = $root.find(".xs-keys");
      $status = $root.find(".xs-status");
      $body = $root.find(".xs-body");

      // Puntero
      $root.on("mousemove", ".xs-f", function () {
        if (XTV.pointer.isActive() && state.focus !== this) {
          focus(this);
        }
      });
      $root.on("click", ".xs-f", function (e) {
        e.preventDefault();
        focus(this);
        activate(this);
      });
    }

    function open(prefill) {
      if (!$root) {
        build();
      }
      XTV.modal.close(true);
      $("body").append($root);
      state.open = true;
      state.mode = "alpha";
      state.focus = null;
      state.lastKey = null;
      state.lastPerson = null;
      state.view = "recent";
      state.person = null;
      renderKeys();
      XTV.setLayer("search");
      if (XTV.menu && XTV.menu.setCurrent) {
        XTV.menu.setCurrent("buscar");
      }
      focus($keys.find(".xs-key").get(0));
      setQuery(prefill || "", !!prefill);
    }

    function close() {
      scheduled.cancel();
      XTV.api.abort("suggest");
      state.gen++;
      state.open = false;
      if ($root) {
        $root.detach();
      }
      if (XTV.state.layer === "search") {
        XTV.setLayer("grid");
        XTV.grid.refocus();
      }
    }

    function handleKey(action) {
      if (XTV.keys.isNav(action)) {
        navigate(action);
        return true;
      }
      if (action === "OK") {
        if (state.focus) {
          activate(state.focus);
        }
        return true;
      }
      if (action === "BACK") {
        if (state.view === "person") {
          state.view = "results";
          state.person = null;
          var q = normQuery(state.query);
          if (cache.hasOwnProperty(q)) {
            showResults(cache[q], q, false);
          } else {
            queryChanged();
          }
          focus($body.find(".xs-person").get(0) || $keys.find(".xs-key").get(0));
        } else {
          close();
        }
        return true;
      }
      if (action && /^D\d$/.test(action)) {
        typeText(action.charAt(1));
        return true;
      }
      if (action === "PLAY" || action === "PLAYPAUSE") {
        var idx = state.focus ? $(state.focus).attr("data-movie") : undefined;
        if (idx !== undefined && state.items[parseInt(idx, 10)]) {
          XTV.player.play(state.items[parseInt(idx, 10)]);
        }
        return true;
      }
      return XTV.keys.isNav(action) || action === "SPACE";
    }

    XTV.search = {
      open: open,
      close: close,
      handleKey: handleKey,
      isOpen: function () {
        return state.open;
      },
      refocus: function () {
        if (state.focus) {
          $(state.focus).addClass("onFocus");
        }
      }
    };
  })(window.jQuery, window.XTV);
}
