/*
 * Xiclos TV v2 - grilla, pantallas y acciones
 * Este archivo mantiene su nombre porque lo carga el index.html empaquetado.
 * En Amazon (mientras siga con la versión anterior) carga la copia de common/legacy/js/xiclos.js.
 * ES5 puro.
 */
if (window.XTV_BOOT && window.XTV_BOOT.legacy) {
  window.XTV_BOOT.load("xiclos.js");
} else {
  /*
   * Xiclos TV v2 - grilla de tiras, detalle y pantallas
   *
   * Pantallas: "home", "cineclub" y "list" (búsqueda, género, exclusivos,
   * historial, mi lista). Cada una guarda sus tiras, la tira con foco y la
   * posición dentro de cada tira, así que al volver se recupera todo.
   *
   * - Horizontal: lineal, con principio y fin. Desde el primer póster,
   *   izquierda abre el menú.
   * - Vertical: circular. La tira con foco siempre queda arriba.
   * - Tiras y pósters se cargan a medida que hacen falta.
   *
   * ES5 puro.
   */
  (function ($, XTV) {
    "use strict";

    var C = XTV.config;
    var P = XTV.paths;
    var util = XTV.util;

    var screens = {};
    var activeName = null;
    var $grid = null;
    var $header = null;
    var $detailsContainer = null;
<<<<<<< HEAD
    var lastFocusedEl = null;
=======
    var $feature = null;
    var lastFocusedEl = null;
    var bgState = { idx: 0, src: null };
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
    var layout = { itemWidth: 0, baseLeft: 0 };

    /* ======================================================================
     * Pantalla
     * ==================================================================== */
    function Screen(name, gridClass) {
      this.name = name;
      this.gridClass = gridClass || "";
      this.rows = [];
      this.rowIndex = 0;
      this.complete = true;
      this.loading = false;
      this.nextOffset = 0;
      this.pendingDown = false;
      this.loadingFirst = false;
      this.gen = 0;
      this.meta = {};
      this.$rows = $('<div class="xtvRows"></div>');
      this.$rows.attr("data-screen", name);
    }

    Screen.prototype.reset = function () {
      this.gen++;
      this.rows = [];
      this.rowIndex = 0;
      this.complete = true;
      this.loading = false;
      this.nextOffset = 0;
      this.pendingDown = false;
      this.$rows.empty();
    };

    Screen.prototype.currentRow = function () {
      return this.rows[this.rowIndex] || null;
    };

    Screen.prototype.currentItem = function () {
      var row = this.currentRow();
      return row ? row.items[row.col] || null : null;
    };

    function screen(name) {
      ensureLayout();
      if (!screens[name]) {
        var gridClass = name === "cineclub" ? "cineclub" : name === "list" ? "specialContentSearch" : "";
        screens[name] = new Screen(name, gridClass);
        $grid.append(screens[name].$rows);
        screens[name].$rows.hide();
      }
      return screens[name];
    }

    function active() {
      return activeName ? screens[activeName] : null;
    }

    /* ======================================================================
     * Estructura base (#mainContent > #header + #grid)
     * ==================================================================== */
    function ensureLayout() {
      if ($grid) {
        return;
      }
      $("#mainContent").remove();
<<<<<<< HEAD
      var $main = $('<div id="mainContent"><div id="header"></div><div id="grid"></div></div>');
=======
      var $main = $(
        '<div id="mainContent"><div id="xtvHeader"><div class="xd"></div></div><div id="xtvFeature"></div><div id="xtvGrid"></div></div>'
      );
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
      if ($("#result").length) {
        $("#result").after($main);
      } else {
        $("body").append($main);
      }
<<<<<<< HEAD
      $header = $main.find("#header");
      $grid = $main.find("#grid");
      var $details = $('<div class="prodDetails" style="display:block"><div class="detailsContainer"></div></div>');
      $header.append($details);
      $detailsContainer = $details.find(".detailsContainer");

      // Puntero: pasar por un póster de la tira con foco lo enfoca sin
      // desplazar la tira (así el contenido no se mueve bajo el puntero).
      $grid.on("mousemove", ".box", function () {
=======
      $header = $main.find("#xtvHeader");
      $grid = $main.find("#xtvGrid");
      $detailsContainer = $main.find(".xd");
      $feature = $main.find("#xtvFeature");
      // Fondo: dos capas para el fundido cruzado y los degradados de lectura
      $("#mainContainer")
        .empty()
        .append('<div class="xb-layer"></div><div class="xb-layer"></div><div class="xb-scrim"></div>');
      $feature.on("click", ".xf-card", function () {
        var s = active();
        if (s && s.feature && XTV.state.layer === "grid") {
          s.onFeature = true;
          focusChanged(false);
          openCurrent();
        }
      });

      // Puntero: pasar por un póster de la tira con foco lo enfoca sin
      // desplazar la tira (así el contenido no se mueve bajo el puntero).
      $grid.on("mousemove", ".xr-item", function () {
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
        if (!XTV.pointer.isActive()) {
          return;
        }
        var pos = positionOf(this);
        var s = active();
        if (!pos || !s || pos.row !== s.rowIndex) {
          return;
        }
        if (XTV.state.layer === "menu") {
          XTV.menu.close();
        }
<<<<<<< HEAD
        if (XTV.state.layer !== "grid" || s.rows[pos.row].col === pos.col) {
          return;
        }
        s.rows[pos.row].col = pos.col;
        focusChanged(true);
      });
      $grid.on("click", ".box", function () {
=======
        if (XTV.state.layer !== "grid" || (s.rows[pos.row].col === pos.col && !s.onFeature)) {
          return;
        }
        s.onFeature = false;
        s.rows[pos.row].col = pos.col;
        focusChanged(true);
      });
      $grid.on("click", ".xr-item", function () {
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
        var pos = positionOf(this);
        var s = active();
        if (!pos || !s) {
          return;
        }
        if (XTV.state.layer === "menu") {
          XTV.menu.close();
        }
        if (XTV.state.layer !== "grid") {
          return;
        }
        if (pos.row !== s.rowIndex) {
          s.rowIndex = pos.row;
          applyOrder(s);
        }
<<<<<<< HEAD
=======
        s.onFeature = false;
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
        s.rows[pos.row].col = pos.col;
        focusChanged(true);
        openCurrent();
      });

      $(window).on("resize", function () {
        layout.itemWidth = 0;
        var s = active();
        if (s) {
          for (var i = 0; i < s.rows.length; i++) {
            applyScroll(s.rows[i], false);
          }
          focusChanged(false);
        }
      });
    }

    function positionOf(boxEl) {
      var $box = $(boxEl);
<<<<<<< HEAD
      var $row = $box.closest(".gridContent");
=======
      var $row = $box.closest(".xr-row");
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
      if (!$row.length) {
        return null;
      }
      return {
        row: parseInt($row.attr("data-row"), 10),
        col: parseInt($box.attr("data-col"), 10)
      };
    }

    /* ======================================================================
     * Tiras
     * ==================================================================== */
    function boxHtml(items, j) {
      var n = items.length;
<<<<<<< HEAD
      var cls = "box";
=======
      var cls = "xr-item";
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
      if (j === 0) {
        cls += " firstElement";
      } else if (j === n - 1) {
        cls += " lastElement";
      }
<<<<<<< HEAD
      return (
        '<div class="' +
        cls +
        '" data-col="' +
        j +
        '"><img class="poster" alt=""><div class="posterTitle">' +
        util.text(items[j].title) +
        "</div></div>"
      );
=======
      return '<div class="' + cls + '" data-col="' + j + '"><div class="xr-poster"><img alt=""></div></div>';
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
    }

    function buildRow(row, index) {
      var html =
<<<<<<< HEAD
        '<div class="gridContent" data-row="' +
        index +
        '"><div class="verticalRectangle"></div><div class="stripTitle">' +
        (row.titleHtml || util.text(row.title)) +
        '</div><div class="content"></div></div>';
      row.el = $(html).get(0);
      row.content = $(row.el).find(".content").get(0);
=======
        '<div class="xr-row" data-row="' +
        index +
        '"><div class="xr-title"><span class="xr-name">' +
        (row.titleHtml || util.text(row.title)) +
        '</span><span class="xr-sub"></span></div><div class="xr-track"></div></div>';
      row.el = $(html).get(0);
      row.content = $(row.el).find(".xr-track").get(0);
      row.sub = $(row.el).find(".xr-sub").get(0);
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
      row.boxes = row.content.children;
      row.imgs = row.content.getElementsByTagName("img");
      row.loaded = {};
      row.rendered = 0;
      row.col = row.col || 0;
      row.offset = 0;
      // Las tiras largas (por ejemplo Estrenos) se crean de a tandas: el
      // costo inicial es el mismo tenga 20 o 300 películas.
      renderUpTo(row, C.ROW_CHUNK);
    }

    function renderUpTo(row, count) {
      var target = Math.min(row.items.length, count);
      if (target <= row.rendered) {
        return;
      }
      var html = "";
      for (var j = row.rendered; j < target; j++) {
        html += boxHtml(row.items, j);
      }
      row.content.insertAdjacentHTML("beforeend", html);
      row.rendered = target;
    }

    // Siempre hay pósters creados por delante del foco
    function ensureRendered(row) {
      if (row && row.rendered < row.items.length && row.col + C.ROW_CHUNK_AHEAD >= row.rendered) {
        renderUpTo(row, row.col + C.ROW_CHUNK_AHEAD + C.ROW_CHUNK);
      }
    }

    // data: [{tira, detalle: [...]}, ...]
    function appendStrips(s, data) {
      var added = 0;
      for (var i = 0; i < data.length; i++) {
        var strip = data[i];
        if (!strip || !strip.detalle || !strip.detalle.length) {
          continue; // las tiras vacías no se muestran (no se puede navegar en ellas)
        }
        addRow(s, { title: strip.tira, items: strip.detalle });
        added++;
      }
      return added;
    }

    function addRow(s, row) {
      var index = s.rows.length;
      buildRow(row, index);
      s.rows.push(row);
      s.$rows.append(row.el);
      prepareRowWidth(row);
    }

    function itemWidth() {
      if (!layout.itemWidth) {
<<<<<<< HEAD
        var box = $grid ? $grid.find(".box:visible").get(0) : null;
=======
        var box = $grid ? $grid.find(".xr-item:visible").get(0) : null;
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
        if (box) {
          layout.itemWidth = $(box).outerWidth(true) || 0;
          // Posición izquierda de la tira sin desplazamiento. offsetLeft no
          // incluye el transform, así que sirve aunque la tira esté corrida.
<<<<<<< HEAD
          var el = $(box).closest(".content").get(0);
=======
          var el = $(box).closest(".xr-track").get(0);
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
          var left = 0;
          while (el) {
            left += el.offsetLeft || 0;
            el = el.offsetParent;
          }
          layout.baseLeft = left;
        }
      }
      return layout.itemWidth || 240;
    }

    function viewportWidth() {
      return window.innerWidth || $(window).width() || 1920;
    }

    function prepareRowWidth(row) {
      // Ancho explícito: los motores viejos no soportan width: max-content
      // y los pósters se partirían en varias líneas.
      var w = layout.itemWidth || 0;
      if (w) {
        row.content.style.width = row.items.length * w + 20 + "px";
      }
    }

    function applyScroll(row, fromPointer) {
      if (!row) {
        return;
      }
      var w = itemWidth();
      if (!row.content.style.width) {
        prepareRowWidth(row);
      }
      var n = row.items.length;
      var avail = viewportWidth() - layout.baseLeft - 30;
      var maxOffset = Math.max(0, n * w - avail);
      var target = Math.min(row.col * w, maxOffset);
      if (fromPointer) {
        // Con el puntero solo se desplaza si el póster no se ve completo
        var left = row.col * w - row.offset;
        if (left >= 0 && left + w <= avail) {
          target = row.offset;
        }
      }
      target = Math.max(0, target);
      if (target !== row.offset || fromPointer === false) {
        row.offset = target;
        util.setTranslateX(row.content, target);
      }
    }

    // La tira con foco queda primera; el resto sigue en orden circular.
    function applyOrder(s) {
      var n = s.rows.length;
      var parent = s.$rows.get(0);
      for (var k = 0; k < n; k++) {
        parent.appendChild(s.rows[(s.rowIndex + k) % n].el);
      }
    }

<<<<<<< HEAD
=======
    // Fundido al cargar el póster
    function imgLoaded() {
      this.className = "ok";
    }

>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
    function ensureImages(row) {
      if (!row) {
        return;
      }
      var w = itemWidth();
      var avail = viewportWidth() - layout.baseLeft;
      var first = Math.floor(row.offset / w);
      var count = Math.ceil(avail / w);
      var from = Math.max(0, first - C.POSTERS_BEHIND);
      var to = Math.min(row.rendered - 1, first + count + C.POSTERS_AHEAD);
      for (var j = from; j <= to; j++) {
        if (!row.loaded[j]) {
          row.loaded[j] = true;
          var src = row.items[j].poster;
          if (src) {
<<<<<<< HEAD
=======
            row.imgs[j].onload = imgLoaded;
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
            row.imgs[j].src = src;
          }
        }
      }
    }

    /* ======================================================================
     * Detalle y fondo
     * ==================================================================== */
<<<<<<< HEAD
    var setBackground = util.debounce(function (poster) {
      $("#mainContainer").css({
        "background-image": poster ? util.cssUrl(poster) : "none",
        "background-repeat": "no-repeat",
        "background-position": "0px 25%",
        "background-size": "cover"
      });
    }, C.BACKGROUND_DELAY_MS);

=======
    function bigPoster(url) {
      return String(url || "").replace("-205x347", "");
    }

    // Fondo con fundido cruzado entre dos capas (solo opacity, sin blur)
    var setBackground = util.debounce(function (poster) {
      var layers = $("#mainContainer .xb-layer").get();
      if (layers.length < 2 || poster === bgState.src) {
        return;
      }
      bgState.src = poster;
      var cur = layers[bgState.idx];
      if (!poster) {
        cur.style.opacity = "0";
        return;
      }
      var img = new Image();
      img.onload = function () {
        if (bgState.src !== poster) {
          return;
        }
        var next = layers[1 - bgState.idx];
        next.style.backgroundImage = util.cssUrl(poster);
        next.style.opacity = "1";
        layers[bgState.idx].style.opacity = "0";
        bgState.idx = 1 - bgState.idx;
      };
      img.src = poster;
    }, C.BACKGROUND_DELAY_MS);

    function metaHtml(item) {
      var parts = [];
      if (!util.isEmpty(item.duration)) {
        parts.push(util.text(item.duration) + " min");
      }
      if (!util.isEmpty(item.year)) {
        parts.push(util.text(item.year));
      }
      if (!util.isEmpty(item.imdb)) {
        parts.push("IMDb " + util.text(item.imdb));
      }
      var h = '<div class="xd-meta">';
      if (!util.isEmpty(item.audience)) {
        h += '<span class="xd-age">' + util.text(item.audience) + "</span>";
      }
      h += "<span>" + parts.join('</span><span class="xd-dot">·</span><span>') + "</span></div>";
      return h;
    }

    function creditsHtml(item, withActors) {
      var h = '<div class="xd-credits">';
      if (!util.isEmpty(item.genres)) {
        h += '<div><span class="xd-lbl">Géneros</span>' + util.text(util.joinList(item.genres)) + "</div>";
      }
      if (!util.isEmpty(item.director)) {
        h += '<div><span class="xd-lbl">Dirección</span>' + util.text(util.joinList(item.director)) + "</div>";
      }
      if (withActors && !util.isEmpty(item.actors)) {
        h += '<div><span class="xd-lbl">Elenco</span>' + util.text(util.joinList(item.actors)) + "</div>";
      }
      return h + "</div>";
    }

>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
    function renderDetails(item) {
      if (!$detailsContainer) {
        return;
      }
      if (!item) {
        $detailsContainer.html("");
        setBackground(null);
        return;
      }
<<<<<<< HEAD
      var h = '<div class="prodTitle">' + util.text(item.title) + "</div>";
      h += '<div class="prodSinopsis">' + util.text(item.sinopsis) + "</div>";
      if (!util.isEmpty(item.audience)) {
        h += '<div class="prodAudience">' + util.text(item.audience) + "</div>";
      }
      if (!util.isEmpty(item.duration)) {
        h += '<div class="prodDuration">' + util.text(item.duration) + " minutos</div>";
      }
      if (!util.isEmpty(item.year)) {
        h += '<div class="prodYear">' + util.text(item.year) + "</div>";
      }
      if (!util.isEmpty(item.imdb)) {
        h += '<div class="prodIMDB highlight">IMDB: ' + util.text(item.imdb) + "</div>";
      }
      h += '<div style="clear:both"><br></div>';
      if (!util.isEmpty(item.genres)) {
        h +=
          '<div class="prodGenres"><span class="highlight">Géneros:</span> ' +
          util.text(util.joinList(item.genres)) +
          "</div>";
      }
      if (!util.isEmpty(item.director)) {
        h +=
          '<div class="prodDirector"><span class="highlight">Director:</span> ' +
          util.text(util.joinList(item.director)) +
          "</div>";
      }
      if (!util.isEmpty(item.actors)) {
        h +=
          '<div class="prodActors"><span class="highlight">Elenco:</span> ' +
          util.text(util.joinList(item.actors)) +
          "</div><br>";
      }
      $detailsContainer.html(h);
      setBackground(item.poster);
    }

    /* ======================================================================
=======
      var h = '<div class="xd-title">' + util.text(item.title) + "</div>";
      h += metaHtml(item);
      h += '<div class="xd-syn">' + util.text(item.sinopsis) + "</div>";
      h += creditsHtml(item, true);
      var el = $detailsContainer.get(0);
      el.innerHTML = h;
      // Fundido corto del texto
      $detailsContainer.removeClass("in");
      void el.offsetWidth;
      $detailsContainer.addClass("in");
      setBackground(bigPoster(item.poster));
    }

    /* ======================================================================
     * Cineclub: carrusel destacado
     * La película mejor puntuada en IMDb de cada ciclo (tira), sin
     * repetidas, hasta 5. Avanza solo cada 8 s si el foco no está encima.
     * ==================================================================== */
    function rating(v) {
      var n = parseFloat(String(v === null || v === undefined ? "" : v).replace(",", "."));
      return isNaN(n) ? -1 : n;
    }

    function buildFeature(s) {
      var used = {};
      var picks = [];
      for (var r = 0; r < s.rows.length; r++) {
        var sorted = s.rows[r].items.slice(0).sort(function (a, b) {
          return rating(b.imdb) - rating(a.imdb);
        });
        for (var k = 0; k < sorted.length; k++) {
          var id = String(sorted[k].movieId);
          if (!used[id]) {
            used[id] = true;
            picks.push({ item: sorted[k], cycle: s.rows[r].title, order: r });
            break;
          }
        }
      }
      if (picks.length > C.FEATURE_MAX) {
        picks.sort(function (a, b) {
          return rating(b.item.imdb) - rating(a.item.imdb);
        });
        picks = picks.slice(0, C.FEATURE_MAX);
        picks.sort(function (a, b) {
          return a.order - b.order;
        });
      }
      s.feature = { items: picks, index: 0 };
      s.onFeature = picks.length > 0;
    }

    function renderFeature() {
      var s = active();
      if (!$feature) {
        return;
      }
      if (!s || !s.feature || !s.feature.items.length) {
        $feature.html("");
        return;
      }
      var f = s.feature;
      var cur = f.items[f.index];
      var next = f.items[(f.index + 1) % f.items.length];
      var it = cur.item;
      var big = bigPoster(it.poster);
      var h = '<div class="xf-head"><div class="xf-h1">Cineclub</div></div>';
      if (f.items.length > 1) {
        h += '<div class="xf-peek" style="background-image:' + util.esc(util.cssUrl(bigPoster(next.item.poster))) + '"></div>';
      }
      h += '<div class="xf-card' + (s.onFeature && XTV.state.layer === "grid" ? " onFocus" : "") + '">';
      h += '<div class="xf-bg" style="background-image:' + util.esc(util.cssUrl(big)) + '"></div><div class="xf-scrim"></div>';
      h += '<div class="xf-poster"><img alt="" src="' + util.esc(it.poster || "") + '"></div>';
      h += '<div class="xf-info"><div class="xf-eyebrow">Ciclo · ' + util.text(cur.cycle) + "</div>";
      h += '<div class="xf-title">' + util.text(it.title) + "</div>" + metaHtml(it);
      h += '<div class="xf-syn">' + util.text(it.sinopsis) + "</div>";
      h += '<div class="xf-cta"><span class="xm-btn primary">' + XTV.icon("play", "xm-btn-icon") + "<span>Ver detalle</span></span></div></div>";
      if (f.items.length > 1) {
        h += '<div class="xf-dots">';
        for (var i = 0; i < f.items.length; i++) {
          h += '<span class="' + (i === f.index ? "on" : "") + '"></span>';
        }
        h += "</div>";
      }
      h += "</div>";
      $feature.html(h);
    }

    setInterval(function () {
      var s = active();
      if (
        s &&
        s.name === "cineclub" &&
        s.feature &&
        s.feature.items.length > 1 &&
        !s.onFeature &&
        XTV.state.layer === "grid"
      ) {
        s.feature.index = (s.feature.index + 1) % s.feature.items.length;
        renderFeature();
      }
    }, 8000);

    /* ======================================================================
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
     * Foco
     * ==================================================================== */
    function currentBox() {
      var s = active();
      var row = s ? s.currentRow() : null;
      return row ? row.boxes[row.col] || null : null;
    }

    function syncFocusClass() {
<<<<<<< HEAD
      var el = currentBox();
=======
      var s = active();
      var el = s && s.onFeature ? null : currentBox();
      if ($feature) {
        $feature.find(".xf-card").toggleClass("onFocus", !!(s && s.onFeature && XTV.state.layer === "grid"));
      }
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
      if (lastFocusedEl && lastFocusedEl !== el) {
        $(lastFocusedEl).removeClass("onFocus activeContent");
      }
      lastFocusedEl = el;
      if (!el) {
        return;
      }
      if (XTV.state.layer === "grid") {
        $(el).addClass("onFocus").removeClass("activeContent");
      } else {
        // El póster queda recordado pero sin resaltar (menú, modal, video)
        $(el).removeClass("onFocus").addClass("activeContent");
      }
    }

    function focusChanged(fromPointer) {
      var s = active();
      if (!s) {
        return;
      }
      var row = s.currentRow();
      ensureRendered(row);
      if (row && !fromPointer) {
        applyScroll(row, false);
      } else if (row) {
        applyScroll(row, true);
      }
      syncFocusClass();
<<<<<<< HEAD
      renderDetails(s.currentItem());
=======
      if (s.name === "cineclub") {
        renderSub(s);
      } else {
        renderDetails(s.currentItem());
      }
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
      ensureImages(row);
      if (s.rows.length > 1) {
        ensureImages(s.rows[(s.rowIndex + 1) % s.rows.length]);
      }
    }

<<<<<<< HEAD
=======
    // En Cineclub, el título y año del póster con foco junto al nombre del ciclo
    function renderSub(s) {
      for (var i = 0; i < s.rows.length; i++) {
        var row = s.rows[i];
        var txt = "";
        if (i === s.rowIndex && !s.onFeature) {
          var it = row.items[row.col];
          if (it) {
            txt = " · " + util.plain(it.title) + (util.isEmpty(it.year) ? "" : " (" + util.plain(it.year) + ")");
          }
        }
        if (row.sub) {
          row.sub.textContent = txt;
        }
      }
    }

    function sectionOf(name) {
      var s = screens[name];
      if (name === "list" && s && s.meta) {
        if (s.meta.type === "students") {
          return "alumnos";
        }
        if (s.meta.type === "genre") {
          return "explorar";
        }
        if (s.meta.type === "search") {
          return "buscar";
        }
      }
      return name === "cineclub" ? "cineclub" : "home";
    }

>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
    /* ======================================================================
     * Cambio de pantalla
     * ==================================================================== */
    function switchTo(name) {
      ensureLayout();
      var s = screen(name);
      activeName = name;
      for (var key in screens) {
        if (screens.hasOwnProperty(key)) {
          if (key === name) {
            screens[key].$rows.show();
          } else {
            screens[key].$rows.hide();
          }
        }
      }
      $grid.removeClass("cineclub specialContentSearch");
      if (s.gridClass) {
        $grid.addClass(s.gridClass);
      }
<<<<<<< HEAD
=======
      $("body")
        .removeClass("xtv-screen-home xtv-screen-cineclub xtv-screen-list")
        .addClass("xtv-screen-" + name);
      if (XTV.menu && XTV.menu.setCurrent) {
        XTV.menu.setCurrent(sectionOf(name));
      }
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
      if (XTV.state.layer !== "grid") {
        XTV.setLayer("grid");
      }
      // Las medidas pueden haber cambiado mientras la pantalla estaba oculta
      for (var i = 0; i < s.rows.length; i++) {
        if (!s.rows[i].content.style.width) {
          prepareRowWidth(s.rows[i]);
        }
      }
      applyOrder(s);
<<<<<<< HEAD
=======
      renderFeature();
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
      focusChanged(false);
    }

    /* ======================================================================
     * Home (carga progresiva)
     * ==================================================================== */
    function loadHome() {
      ensureLayout();
      var s = screen("home");
      XTV.api.abort("home");
      s.reset();
      s.complete = false;
      s.loadingFirst = true;
      var gen = s.gen;

      XTV.loader.show("home");
      XTV.api
        .get(P.home, { offset: 0, limit: C.HOME_FIRST_PAGE, userList: true }, "home")
        .done(function (res) {
          if (gen !== s.gen) {
            return;
          }
          var data = (res && res.data) || [];
          appendStrips(s, data);
          s.nextOffset = C.HOME_FIRST_PAGE;
          s.loadingFirst = false;
          if (!data.length) {
            s.complete = true;
          }
          afterRowsAdded(s);
          if (!s.rows.length && s.complete) {
            XTV.message.show("No hay contenido disponible en este momento.");
          }
        })
        .fail(function (xhr, textStatus) {
          if (XTV.api.isAbort(xhr, textStatus) || gen !== s.gen) {
            return;
          }
          XTV.log.error("home", xhr, { offset: 0 });
          s.complete = true;
          XTV.message.show("No pudimos cargar el contenido. Reintentamos en unos segundos.", 4000);
          setTimeout(function () {
            if (gen === s.gen && activeName === "home" && !s.rows.length) {
              loadHome();
            }
          }, 6000);
        })
        .always(function () {
          if (gen === s.gen) {
            s.loadingFirst = false;
            XTV.loader.hide("home");
          }
        });
    }

    function loadMoreHome() {
      var s = screen("home");
      if (s.loading || s.complete || s.loadingFirst) {
        return;
      }
      s.loading = true;
      var gen = s.gen;
      XTV.api
        .get(P.home, { offset: s.nextOffset, limit: C.HOME_PAGE }, "home")
        .done(function (res) {
          if (gen !== s.gen) {
            return;
          }
          var data = (res && res.data) || [];
          appendStrips(s, data);
          s.nextOffset += C.HOME_PAGE;
          if (data.length < C.HOME_PAGE) {
            s.complete = true;
          }
          s.loading = false;
          afterRowsAdded(s);
        })
        .fail(function (xhr, textStatus) {
          if (gen !== s.gen) {
            return;
          }
          s.loading = false;
          s.pendingDown = false;
          if (!XTV.api.isAbort(xhr, textStatus)) {
            XTV.log.error("home-more", xhr, { offset: s.nextOffset });
          }
        });
    }

    function afterRowsAdded(s) {
      if (activeName === s.name) {
        if (!layout.itemWidth) {
          itemWidth();
          for (var i = 0; i < s.rows.length; i++) {
            prepareRowWidth(s.rows[i]);
          }
        }
        applyOrder(s);
        if (s.pendingDown) {
          s.pendingDown = false;
          if (s.rowIndex < s.rows.length - 1) {
            s.rowIndex++;
            applyOrder(s);
          }
        }
        focusChanged(false);
      }
      maybeLoadMore(s);
    }

    function maybeLoadMore(s) {
      if (s.name !== "home" || s.complete || s.loading) {
        return;
      }
      if (s.rows.length - 1 - s.rowIndex < C.HOME_PREFETCH_ROWS) {
        loadMoreHome();
      }
    }

    /* ======================================================================
     * Cineclub y listas
     * ==================================================================== */
    function showCineclub() {
      var s = screen("cineclub");
      XTV.api.abort("cineclub");
      var gen = ++s.gen;
      XTV.busy.start("cineclub", function () {
        XTV.api.abort("cineclub");
      });
      XTV.api
        .get(P.home, { videoclub: 1 }, "cineclub")
        .done(function (res) {
          if (gen !== s.gen) {
            return;
          }
          XTV.busy.end("cineclub");
          var data = (res && res.data) || [];
          s.reset();
          appendStrips(s, data);
          if (!s.rows.length) {
            XTV.modal.alert({ message: "No hay películas en Cineclub en este momento." });
            return;
          }
<<<<<<< HEAD
=======
          buildFeature(s);
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
          switchTo("cineclub");
        })
        .fail(function (xhr, textStatus) {
          if (XTV.api.isAbort(xhr, textStatus) || gen !== s.gen) {
            return;
          }
          XTV.busy.end("cineclub");
          XTV.log.error("cineclub", xhr);
          XTV.message.show("No pudimos cargar Cineclub. Probá de nuevo en unos minutos.");
        });
    }

    var LIST_TYPES = {
      genre: { path: "genres", title: "" },
<<<<<<< HEAD
      students: { path: "studentsOnly", title: "EXCLUSIVO PARA ALUMNOS" },
      history: { path: "userHistory", title: "LO QUE YA VISTE" },
      bookmark: { path: "userBookmark", title: "MI SELECCIÓN" },
=======
      students: { path: "studentsOnly", title: "Exclusivo para alumnos" },
      history: { path: "userHistory", title: "Lo que ya viste" },
      bookmark: { path: "userBookmark", title: "Mi selección" },
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
      search: { path: "search", title: "" }
    };

    /*
     * opts = { type: genre|students|history|bookmark|search,
     *          genreId, genreName, terms, onEmpty }
     */
    function showList(opts) {
      var def = LIST_TYPES[opts.type];
      if (!def) {
        return;
      }
      var s = screen("list");
      XTV.api.abort("list");
      var gen = ++s.gen;
      var query = null;
      var title = def.title;
      var titleHtml = null;
      if (opts.type === "genre") {
        query = { genreId: opts.genreId };
<<<<<<< HEAD
        title = String(opts.genreName || "").toUpperCase();
      } else if (opts.type === "search") {
        var terms = String(opts.terms || "").toUpperCase();
        query = { searchTerms: terms };
        titleHtml = 'RESULTADOS PARA <span class="searchTerms">' + util.esc(terms) + "</span>";
=======
        title = String(opts.genreName || "");
      } else if (opts.type === "search") {
        var terms = String(opts.terms || "");
        query = { searchTerms: terms.toUpperCase() };
        titleHtml = 'Resultados para <span class="xr-hl">' + util.esc(terms) + "</span>";
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
      }

      XTV.busy.start("list", function () {
        XTV.api.abort("list");
      });
      XTV.api
        .get(P[def.path], query, "list")
        .done(function (res) {
          if (gen !== s.gen) {
            return;
          }
          XTV.busy.end("list");
          var data = (res && res.data) || [];
          if (!data.length) {
            if (opts.onEmpty) {
              opts.onEmpty();
            } else {
              listEmpty(opts);
            }
            return;
          }
          s.reset();
          s.meta = opts;
          addRow(s, { title: title, titleHtml: titleHtml, items: data });
          switchTo("list");
        })
        .fail(function (xhr, textStatus) {
          if (XTV.api.isAbort(xhr, textStatus) || gen !== s.gen) {
            return;
          }
          XTV.busy.end("list");
          XTV.log.error("list-" + opts.type, xhr, { query: query });
          XTV.message.show("No pudimos cargar el contenido. Probá de nuevo en unos minutos.");
        });
    }

    function listEmpty(opts) {
      var msg;
      if (opts.type === "history") {
        msg = "Todavía no viste ninguna película en Xiclos. Próximamente encontrarás aquí todas aquellas que hayas visto.";
      } else if (opts.type === "bookmark") {
        msg = "Todavía no agregaste ninguna película a tu selección. Cuando las agregues podrás encontrarlas aquí y verlas cuando quieras.";
      } else if (opts.type === "search") {
        XTV.modal.confirm({
<<<<<<< HEAD
          message: "No se encuentra el texto buscado: " + opts.terms + ". ¿Querés realizar una nueva búsqueda?",
          yes: "SÍ",
          no: "NO",
=======
          message: "No encontramos resultados para “" + opts.terms + "”. ¿Querés hacer otra búsqueda?",
          yes: "Buscar de nuevo",
          no: "Cancelar",
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
          focusYes: true,
          onYes: function () {
            XTV.search.open(opts.terms);
          }
        });
        return;
      } else {
        msg = "No encontramos producciones para esta selección.";
      }
      XTV.modal.alert({ message: msg });
    }

    function reloadList() {
      var s = screens.list;
      if (!s || !s.meta || !s.meta.type) {
        return;
      }
      var meta = s.meta;
      showList({
        type: meta.type,
        genreId: meta.genreId,
        genreName: meta.genreName,
        terms: meta.terms,
        onEmpty: function () {
          goHome(false);
          listEmpty(meta);
        }
      });
    }

    function goHome(refresh) {
      var s = screen("home");
      if (refresh || (!s.rows.length && !s.loadingFirst)) {
        switchTo("home");
        loadHome();
      } else {
        switchTo("home");
      }
    }

    /* ======================================================================
     * Acciones sobre el póster con foco
     * ==================================================================== */
<<<<<<< HEAD
    function openCurrent() {
      var s = active();
      var item = s ? s.currentItem() : null;
      if (item) {
        XTV.actions.openMovie(item, { screen: activeName, listType: s.meta && s.meta.type });
      }
    }

    /* ======================================================================
     * Teclas
     * ==================================================================== */
    function moveHorizontal(delta) {
      var s = active();
      var row = s ? s.currentRow() : null;
      if (!row) {
        return;
      }
      var next = row.col + delta;
      if (next < 0) {
        XTV.menu.open(0);
        return;
      }
      if (next > row.items.length - 1) {
        return;
      }
      row.col = next;
      focusChanged(false);
    }

    function moveVertical(delta) {
      var s = active();
      if (!s || s.rows.length < 2) {
        if (s && delta > 0 && !s.complete && !s.loadingFirst && s.name === "home") {
          s.pendingDown = true;
          loadMoreHome();
        }
        return;
      }
      var n = s.rows.length;
      if (delta > 0 && s.rowIndex === n - 1 && !s.complete && s.name === "home") {
        // Llegó al final de lo cargado: se pide más y se baja al llegar
        s.pendingDown = true;
        loadMoreHome();
        return;
      }
      s.rowIndex = (s.rowIndex + delta + n) % n;
      applyOrder(s);
      focusChanged(false);
      maybeLoadMore(s);
    }

    function handleKey(action) {
      var s = active();
      switch (action) {
        case "LEFT":
          moveHorizontal(-1);
          return true;
        case "RIGHT":
          moveHorizontal(1);
          return true;
        case "UP":
          moveVertical(-1);
          return true;
        case "DOWN":
          moveVertical(1);
          return true;
        case "OK":
          openCurrent();
          return true;
        case "PLAY":
        case "PLAYPAUSE":
          if (s && s.currentItem()) {
            XTV.player.play(s.currentItem());
          }
          return true;
        case "BACK":
          if (activeName && activeName !== "home") {
            goHome(false);
          } else {
            XTV.actions.confirmExit();
          }
          return true;
=======
    function currentItem() {
      var s = active();
      if (s && s.onFeature && s.feature && s.feature.items.length) {
        return s.feature.items[s.feature.index].item;
      }
      return s ? s.currentItem() : null;
    }

    function openCurrent() {
      var s = active();
      var item = currentItem();
      if (item) {
        XTV.actions.openMovie(item, { screen: activeName, listType: s.meta && s.meta.type });
      }
    }

    /* ======================================================================
     * Teclas
     * ==================================================================== */
    function moveHorizontal(delta) {
      var s = active();
      var row = s ? s.currentRow() : null;
      if (!row) {
        return;
      }
      var next = row.col + delta;
      if (next < 0) {
        XTV.menu.open();
        return;
      }
      if (next > row.items.length - 1) {
        return;
      }
      row.col = next;
      focusChanged(false);
    }

    // Carrusel de Cineclub: izquierda/derecha cambian de tarjeta
    function featureKey(s, action) {
      var f = s.feature;
      if (action === "LEFT") {
        if (f.index > 0) {
          f.index--;
          renderFeature();
        } else {
          XTV.menu.open();
        }
        return true;
      }
      if (action === "RIGHT") {
        if (f.index < f.items.length - 1) {
          f.index++;
          renderFeature();
        }
        return true;
      }
      if (action === "DOWN" || action === "UP") {
        s.onFeature = false;
        s.rowIndex = action === "DOWN" ? 0 : s.rows.length - 1;
        applyOrder(s);
        renderFeature();
        focusChanged(false);
        return true;
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
      }
      return false;
    }

<<<<<<< HEAD
    XTV.grid = {
      goHome: goHome,
      showCineclub: showCineclub,
      showList: showList,
      reloadList: reloadList,
      handleKey: handleKey,
      syncFocusClass: syncFocusClass,
      activeName: function () {
        return activeName;
      },
      currentItem: function () {
        var s = active();
        return s ? s.currentItem() : null;
      },
      refocus: function () {
        focusChanged(false);
      }
    };
  })(window.jQuery, window.XTV);

  /*
   * Xiclos TV v2 - acciones: ficha de película, Mi lista, géneros,
   * salir y cerrar sesión.
=======
    function moveVertical(delta) {
      var s = active();
      // En Cineclub el carrusel es una fila más del ciclo vertical
      if (s && s.feature && s.feature.items.length) {
        if ((delta < 0 && s.rowIndex === 0) || (delta > 0 && s.rowIndex === s.rows.length - 1)) {
          s.onFeature = true;
          renderFeature();
          focusChanged(false);
          return;
        }
      }
      if (!s || s.rows.length < 2) {
        if (s && delta > 0 && !s.complete && !s.loadingFirst && s.name === "home") {
          s.pendingDown = true;
          loadMoreHome();
        }
        return;
      }
      var n = s.rows.length;
      if (delta > 0 && s.rowIndex === n - 1 && !s.complete && s.name === "home") {
        // Llegó al final de lo cargado: se pide más y se baja al llegar
        s.pendingDown = true;
        loadMoreHome();
        return;
      }
      s.rowIndex = (s.rowIndex + delta + n) % n;
      applyOrder(s);
      focusChanged(false);
      maybeLoadMore(s);
    }

    function handleKey(action) {
      var s = active();
      if (s && s.onFeature && s.feature && s.feature.items.length && featureKey(s, action)) {
        return true;
      }
      switch (action) {
        case "LEFT":
          moveHorizontal(-1);
          return true;
        case "RIGHT":
          moveHorizontal(1);
          return true;
        case "UP":
          moveVertical(-1);
          return true;
        case "DOWN":
          moveVertical(1);
          return true;
        case "OK":
          openCurrent();
          return true;
        case "PLAY":
        case "PLAYPAUSE":
          if (currentItem()) {
            XTV.player.play(currentItem());
          }
          return true;
        case "BACK":
          if (activeName && activeName !== "home") {
            goHome(false);
          } else {
            XTV.actions.confirmExit();
          }
          return true;
      }
      return false;
    }

    XTV.grid = {
      goHome: goHome,
      showCineclub: showCineclub,
      showList: showList,
      reloadList: reloadList,
      handleKey: handleKey,
      syncFocusClass: syncFocusClass,
      activeName: function () {
        return activeName;
      },
      currentItem: currentItem,
      refocus: function () {
        if (activeName) {
          $("body").removeClass("xtv-screen-home xtv-screen-cineclub xtv-screen-list").addClass("xtv-screen-" + activeName);
          if (XTV.menu && XTV.menu.setCurrent) {
            XTV.menu.setCurrent(sectionOf(activeName));
          }
        }
        focusChanged(false);
      },
      metaHtml: metaHtml,
      creditsHtml: creditsHtml,
      bigPoster: bigPoster
    };
  })(window.jQuery, window.XTV);

  /*
   * Xiclos TV v2 - acciones: ficha de película, Mi lista, salir y cerrar sesión.
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
   * ES5 puro.
   */
  (function ($, XTV) {
    "use strict";

    var P = XTV.paths;
    var util = XTV.util;
    var modal = XTV.modal;

    /* ======================================================================
<<<<<<< HEAD
     * Ficha de película (VER AHORA / MI LISTA)
=======
     * Ficha de película (tarjeta centrada)
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
     * ==================================================================== */
    function openMovie(item, context) {
      var gen = ++openMovie.gen;
      XTV.busy.start("movie", function () {
        XTV.api.abort("movie");
      });
      XTV.api
        .get(P.checkBookmark, { movieid: item.movieId }, "movie")
        .done(function (res) {
          if (gen !== openMovie.gen) {
            return;
          }
          XTV.busy.end("movie");
          var data = res && res.data;
          var bookmarked = !!(data && data[0] && String(data[0].bookmark) === "1");
          showMovieModal(item, context, bookmarked, true);
        })
        .fail(function (xhr, textStatus) {
          if (XTV.api.isAbort(xhr, textStatus) || gen !== openMovie.gen) {
            return;
          }
          XTV.busy.end("movie");
          XTV.log.error("checkBookmark", xhr, { movieId: item.movieId });
          // Sin el estado de Mi lista igual se puede ver la película
          showMovieModal(item, context, false, false);
        });
    }
    openMovie.gen = 0;

<<<<<<< HEAD
    function bookmarkLabel(bookmarked) {
      return bookmarked ? "QUITAR DE MI LISTA" : "AGREGAR A MI LISTA";
=======
    function setBookmarkButton($b, bookmarked) {
      $b.empty()
        .append(XTV.icon(bookmarked ? "check" : "plus", "xm-btn-icon"))
        .append($("<span></span>").text(bookmarked ? "En Mi lista" : "Agregar a Mi lista"))
        .toggleClass("bookmarked", bookmarked);
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
    }

    function showMovieModal(item, context, bookmarked, canBookmark) {
      var changed = false;
      var saving = false;
<<<<<<< HEAD
      var $el = $('<div id="modalConfirmAction" class="modal"></div>');
      var $confirm = $('<p id="confirm" class="bookmarkModal"></p>');
      var poster = String(item.poster || "").replace("-205x347", "");
      if (poster) {
        $confirm.append($('<img alt="">').attr("src", poster));
      }
      $confirm.append($('<p class="moviename"></p>').text(util.plain(item.title)));
      var $play = $('<button id="playMovie" class="confirmField bookmarkButton"></button>').text(
        "VER AHORA"
      );
      $confirm.append($play);
      var $bookmark = null;
      if (canBookmark) {
        $bookmark = $('<button id="manageBookmark" class="confirmField bookmarkButton"></button>')
          .text(bookmarkLabel(bookmarked))
          .toggleClass("bookmarked", bookmarked);
        $confirm.append($bookmark);
      }
      $el.append($confirm);
=======
      var sh = modal.shell("modalConfirmAction", "xm-movie");
      var poster = XTV.grid.bigPoster(item.poster);
      var $poster = $('<div class="xm-poster"></div>');
      if (poster) {
        $poster.append($('<img alt="">').attr("src", poster));
      }
      var $info = $('<div class="xm-info"></div>');
      $info.append($('<div class="xm-title"></div>').text(util.plain(item.title)));
      $info.append(XTV.grid.metaHtml(item));
      $info.append($('<div class="xm-syn"></div>').text(util.plain(item.sinopsis)));
      $info.append(XTV.grid.creditsHtml(item, false));
      var $actions = $('<div class="xm-actions"></div>');
      var $play = modal.button("Ver ahora", true, "play");
      $actions.append($play);
      var $bookmark = null;
      if (canBookmark) {
        $bookmark = $('<button type="button" class="xm-btn"></button>');
        setBookmarkButton($bookmark, bookmarked);
        $actions.append($bookmark);
      }
      $info.append($actions);
      sh.$card.append($poster).append($info);
      sh.$el.append('<div class="xm-hint">Volver para cerrar</div>');
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)

      function toggleBookmark() {
        if (saving) {
          return;
        }
        saving = true;
        XTV.loader.show("bookmark");
        XTV.api
          .request({
            method: bookmarked ? "DELETE" : "PUT",
            url: P.setBookmark,
            query: { movieId: item.movieId },
            scope: "bookmark"
          })
          .done(function () {
            bookmarked = !bookmarked;
            changed = true;
            if ($bookmark) {
<<<<<<< HEAD
              $bookmark.text(bookmarkLabel(bookmarked)).toggleClass("bookmarked", bookmarked);
=======
              setBookmarkButton($bookmark, bookmarked);
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
            }
          })
          .fail(function (xhr, textStatus) {
            if (XTV.api.isAbort(xhr, textStatus)) {
              return;
            }
            XTV.log.error("setBookmark", xhr, { movieId: item.movieId });
            XTV.message.show("No pudimos actualizar tu lista. Probá de nuevo en unos minutos.");
          })
          .always(function () {
            saving = false;
            XTV.loader.hide("bookmark");
          });
      }

      modal.open({
<<<<<<< HEAD
        $el: $el,
        items: ".confirmField",
=======
        $el: sh.$el,
        items: ".xm-btn",
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
        focus: $play.get(0),
        onActivate: function (el) {
          if (el === $play.get(0)) {
            modal.close(true);
            XTV.player.play(item);
          } else {
            toggleBookmark();
          }
        },
        onClose: function () {
          // Si se sacó una película de "Mi selección", la lista se actualiza
          if (changed && context && context.listType === "bookmark") {
            XTV.grid.reloadList();
          }
        },
        onKey: function (action) {
          if (action === "PLAY" || action === "PLAYPAUSE") {
            modal.close(true);
            XTV.player.play(item);
            return true;
          }
          return false;
        }
      });
    }

    /* ======================================================================
<<<<<<< HEAD
     * Explorar por género
     * ==================================================================== */
    function genres() {
      var gen = ++genres.gen;
      XTV.busy.start("genres", function () {
        XTV.api.abort("genres");
      });
      XTV.api
        .get(P.genresList, { type: "Género" }, "genres")
        .done(function (res) {
          if (gen !== genres.gen) {
            return;
          }
          XTV.busy.end("genres");
          var data = (res && res.data) || [];
          if (!data.length) {
            modal.alert({ message: "No hay géneros disponibles en este momento." });
            return;
          }
          var $el = $('<div id="modalGenreList" class="modal"></div>');
          modal.decorate($el);
          $el.append('<p class="moviename">EXPLORAR POR GÉNERO</p>');
          var $confirm = $('<p id="confirm" class="bookmarkGenreList"></p>');
          for (var i = 0; i < data.length; i++) {
            $confirm.append(
              $('<button class="confirmField genreList"></button>')
                .text(util.plain(data[i].genre).toUpperCase())
                .attr("data-index", i)
            );
          }
          $el.append($confirm);
          modal.open({
            $el: $el,
            items: ".confirmField",
            onActivate: function (el) {
              var g = data[parseInt($(el).attr("data-index"), 10)];
              modal.close(true);
              XTV.grid.showList({ type: "genre", genreId: g.genreId, genreName: util.plain(g.genre) });
            }
          });
        })
        .fail(function (xhr, textStatus) {
          if (XTV.api.isAbort(xhr, textStatus) || gen !== genres.gen) {
            return;
          }
          XTV.busy.end("genres");
          XTV.log.error("genresList", xhr);
          XTV.message.show("No pudimos cargar los géneros. Probá de nuevo en unos minutos.");
        });
    }
    genres.gen = 0;

    /* ======================================================================
=======
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
     * Salir y cerrar sesión
     * ==================================================================== */
    function confirmExit() {
      modal.confirm({
<<<<<<< HEAD
        message: "¿Realmente querés cerrar Xiclos?",
=======
        message: "¿Querés cerrar Xiclos?",
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
        onYes: function () {
          XTV.platform.exit();
        }
      });
    }

    function confirmLogout() {
      modal.confirm({
        message:
<<<<<<< HEAD
          "¿Realmente querés cerrar tu sesión en Xiclos? Si cerrás tu sesión deberás volver a sincronizar tu dispositivo para disfrutar Xiclos nuevamente.",
=======
          "¿Querés cerrar tu sesión? Vas a tener que volver a sincronizar este dispositivo para usar Xiclos.",
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
        onYes: function () {
          XTV.login.logout();
        }
      });
    }

    XTV.actions = {
      openMovie: openMovie,
<<<<<<< HEAD
      genres: genres,
=======
      genres: function () {
        XTV.browse.open();
      },
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
      confirmExit: confirmExit,
      confirmLogout: confirmLogout
    };
  })(window.jQuery, window.XTV);
<<<<<<< HEAD
=======

  /*
   * Xiclos TV v2 - Explorar
   * Pantalla propia (capa "browse") con la grilla de géneros y, al elegir
   * uno, la grilla de sus películas. Navegación lineal: derecha/izquierda
   * avanzan en orden y pasan de fila; arriba/abajo saltan una fila.
   * Izquierda en el primer elemento abre el menú.
   * ES5 puro.
   */
  (function ($, XTV) {
    "use strict";

    var P = XTV.paths;
    var util = XTV.util;

    var $root = null;
    var $body = null;
    var st = { view: "genres", genres: [], movies: [], genre: null, focus: 0, genreFocus: 0, gen: 0, open: false };

    function build() {
      $root = $(
        '<div id="xtvBrowse"><div class="xbw-head"><div class="xbw-crumb"></div><div class="xbw-h1"></div></div><div class="xbw-view"><div class="xbw-body"></div></div></div>'
      );
      $body = $root.find(".xbw-body");
      $root.on("mousemove", ".xbw-f", function () {
        if (!XTV.pointer.isActive()) {
          return;
        }
        var i = parseInt($(this).attr("data-i"), 10);
        if (i !== st.focus) {
          setFocus(i);
        }
      });
      $root.on("click", ".xbw-f", function () {
        setFocus(parseInt($(this).attr("data-i"), 10));
        activate();
      });
    }

    function items() {
      return $body ? $body.find(".xbw-f").get() : [];
    }

    function cols() {
      var list = items();
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

    function setShift(px) {
      var el = $body.get(0);
      var v = "translateY(" + Math.round(-px) + "px)";
      el.style.webkitTransform = v;
      el.style.transform = v;
      $body.data("shift", px);
    }

    function ensureVisible(el) {
      var shift = $body.data("shift") || 0;
      var top = el.offsetTop;
      var h = el.offsetHeight;
      var viewH = $body.parent().get(0).clientHeight;
      if (top - shift < 0) {
        setShift(Math.max(0, top - 10));
      } else if (top + h - shift > viewH) {
        setShift(top + h - viewH + 10);
      }
    }

    function loadPosters(upTo) {
      var imgs = $body.find(".xbw-movie img").get();
      for (var i = 0; i < imgs.length && i <= upTo + 14; i++) {
        if (!imgs[i].getAttribute("src") && st.movies[i] && st.movies[i].poster) {
          imgs[i].onload = function () {
            this.className = "ok";
          };
          imgs[i].setAttribute("src", st.movies[i].poster);
        }
      }
    }

    function setFocus(i) {
      var list = items();
      if (!list.length) {
        return;
      }
      i = Math.max(0, Math.min(list.length - 1, i));
      $(list[st.focus]).removeClass("onFocus");
      st.focus = i;
      $(list[i]).addClass("onFocus");
      ensureVisible(list[i]);
      if (st.view === "movies") {
        loadPosters(i);
      }
    }

    function header(crumb, title) {
      $root.find(".xbw-crumb").text(crumb || "");
      $root.find(".xbw-h1").text(title);
    }

    function renderGenres() {
      st.view = "genres";
      header("", "Explorar");
      var h = '<div class="xbw-genres">';
      for (var i = 0; i < st.genres.length; i++) {
        h +=
          '<button type="button" class="xbw-genre xbw-f" data-i="' +
          i +
          '"><span class="xbw-accent"></span><span class="xbw-gname">' +
          util.text(st.genres[i].genre) +
          "</span></button>";
      }
      $body.html(h + "</div>");
      setShift(0);
      st.focus = 0;
      setFocus(st.genreFocus);
    }

    function renderMovies() {
      st.view = "movies";
      header("Explorar ›", util.plain(st.genre.genre));
      var h = '<div class="xbw-movies">';
      for (var i = 0; i < st.movies.length; i++) {
        h +=
          '<div class="xbw-movie xbw-f" data-i="' +
          i +
          '"><div class="xbw-ph"><img alt=""></div><div class="xbw-t">' +
          util.text(st.movies[i].title) +
          "</div></div>";
      }
      $body.html(h + "</div>");
      setShift(0);
      st.focus = 0;
      setFocus(0);
    }

    function show() {
      $("body").append($root);
      st.open = true;
      XTV.setLayer("browse");
      if (XTV.menu && XTV.menu.setCurrent) {
        XTV.menu.setCurrent("explorar");
      }
    }

    function open() {
      if (!$root) {
        build();
      }
      var gen = ++st.gen;
      if (st.genres.length) {
        show();
        st.genreFocus = 0;
        renderGenres();
        return;
      }
      XTV.busy.start("genres", function () {
        XTV.api.abort("genres");
      });
      XTV.api
        .get(P.genresList, { type: "Género" }, "genres")
        .done(function (res) {
          if (gen !== st.gen) {
            return;
          }
          XTV.busy.end("genres");
          var data = (res && res.data) || [];
          if (!data.length) {
            XTV.modal.alert({ message: "No hay géneros disponibles en este momento." });
            return;
          }
          st.genres = data;
          st.genreFocus = 0;
          show();
          renderGenres();
        })
        .fail(function (xhr, textStatus) {
          if (XTV.api.isAbort(xhr, textStatus) || gen !== st.gen) {
            return;
          }
          XTV.busy.end("genres");
          XTV.log.error("genresList", xhr);
          XTV.message.show("No pudimos cargar los géneros. Probá de nuevo en unos minutos.");
        });
    }

    function openGenre(g) {
      var gen = ++st.gen;
      XTV.busy.start("genre", function () {
        XTV.api.abort("browse");
      });
      XTV.api
        .get(P.genres, { genreId: g.genreId }, "browse")
        .done(function (res) {
          if (gen !== st.gen) {
            return;
          }
          XTV.busy.end("genre");
          var data = (res && res.data) || [];
          if (!data.length) {
            XTV.modal.alert({ message: "No encontramos películas de este género." });
            return;
          }
          st.genre = g;
          st.movies = data;
          renderMovies();
        })
        .fail(function (xhr, textStatus) {
          if (XTV.api.isAbort(xhr, textStatus) || gen !== st.gen) {
            return;
          }
          XTV.busy.end("genre");
          XTV.log.error("genres", xhr, { genreId: g.genreId });
          XTV.message.show("No pudimos cargar este género. Probá de nuevo en unos minutos.");
        });
    }

    function close(toMenu) {
      st.gen++;
      XTV.api.abort("browse");
      st.open = false;
      if ($root) {
        $root.detach();
      }
      if (XTV.state.layer === "browse") {
        XTV.setLayer("grid");
        XTV.grid.refocus();
      }
      if (toMenu) {
        XTV.menu.open();
      }
    }

    function activate() {
      if (st.view === "genres") {
        st.genreFocus = st.focus;
        openGenre(st.genres[st.focus]);
      } else {
        var item = st.movies[st.focus];
        if (item) {
          XTV.actions.openMovie(item, { screen: "browse" });
        }
      }
    }

    function handleKey(action) {
      var list = items();
      var n = list.length;
      var c = cols();
      var i = st.focus;
      switch (action) {
        case "RIGHT":
          if (i < n - 1) {
            setFocus(i + 1);
          }
          return true;
        case "LEFT":
          if (i > 0) {
            setFocus(i - 1);
          } else {
            close(true);
          }
          return true;
        case "DOWN":
          if (i + c < n) {
            setFocus(i + c);
          } else if (Math.floor(i / c) < Math.floor((n - 1) / c)) {
            setFocus(n - 1);
          }
          return true;
        case "UP":
          if (i - c >= 0) {
            setFocus(i - c);
          }
          return true;
        case "OK":
          activate();
          return true;
        case "PLAY":
        case "PLAYPAUSE":
          if (st.view === "movies" && st.movies[i]) {
            XTV.player.play(st.movies[i]);
          }
          return true;
        case "BACK":
          if (st.view === "movies") {
            renderGenres();
          } else {
            close(false);
          }
          return true;
      }
      return false;
    }

    XTV.browse = {
      open: open,
      close: close,
      handleKey: handleKey,
      isOpen: function () {
        return st.open;
      },
      refocus: function () {
        var list = items();
        if (list[st.focus]) {
          $(list[st.focus]).addClass("onFocus");
        }
        if (XTV.menu && XTV.menu.setCurrent) {
          XTV.menu.setCurrent("explorar");
        }
      }
    };
  })(window.jQuery, window.XTV);
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
}
