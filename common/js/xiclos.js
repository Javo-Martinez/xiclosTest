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
    var lastFocusedEl = null;
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
      var $main = $('<div id="mainContent"><div id="header"></div><div id="grid"></div></div>');
      if ($("#result").length) {
        $("#result").after($main);
      } else {
        $("body").append($main);
      }
      $header = $main.find("#header");
      $grid = $main.find("#grid");
      var $details = $('<div class="prodDetails" style="display:block"><div class="detailsContainer"></div></div>');
      $header.append($details);
      $detailsContainer = $details.find(".detailsContainer");

      // Puntero: pasar por un póster de la tira con foco lo enfoca sin
      // desplazar la tira (así el contenido no se mueve bajo el puntero).
      $grid.on("mousemove", ".box", function () {
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
        if (XTV.state.layer !== "grid" || s.rows[pos.row].col === pos.col) {
          return;
        }
        s.rows[pos.row].col = pos.col;
        focusChanged(true);
      });
      $grid.on("click", ".box", function () {
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
      var $row = $box.closest(".gridContent");
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
      var cls = "box";
      if (j === 0) {
        cls += " firstElement";
      } else if (j === n - 1) {
        cls += " lastElement";
      }
      return (
        '<div class="' +
        cls +
        '" data-col="' +
        j +
        '"><img class="poster" alt=""><div class="posterTitle">' +
        util.text(items[j].title) +
        "</div></div>"
      );
    }

    function buildRow(row, index) {
      var html =
        '<div class="gridContent" data-row="' +
        index +
        '"><div class="verticalRectangle"></div><div class="stripTitle">' +
        (row.titleHtml || util.text(row.title)) +
        '</div><div class="content"></div></div>';
      row.el = $(html).get(0);
      row.content = $(row.el).find(".content").get(0);
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
        var box = $grid ? $grid.find(".box:visible").get(0) : null;
        if (box) {
          layout.itemWidth = $(box).outerWidth(true) || 0;
          // Posición izquierda de la tira sin desplazamiento. offsetLeft no
          // incluye el transform, así que sirve aunque la tira esté corrida.
          var el = $(box).closest(".content").get(0);
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
            row.imgs[j].src = src;
          }
        }
      }
    }

    /* ======================================================================
     * Detalle y fondo
     * ==================================================================== */
    var setBackground = util.debounce(function (poster) {
      $("#mainContainer").css({
        "background-image": poster ? util.cssUrl(poster) : "none",
        "background-repeat": "no-repeat",
        "background-position": "0px 25%",
        "background-size": "cover"
      });
    }, C.BACKGROUND_DELAY_MS);

    function renderDetails(item) {
      if (!$detailsContainer) {
        return;
      }
      if (!item) {
        $detailsContainer.html("");
        setBackground(null);
        return;
      }
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
     * Foco
     * ==================================================================== */
    function currentBox() {
      var s = active();
      var row = s ? s.currentRow() : null;
      return row ? row.boxes[row.col] || null : null;
    }

    function syncFocusClass() {
      var el = currentBox();
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
      renderDetails(s.currentItem());
      ensureImages(row);
      if (s.rows.length > 1) {
        ensureImages(s.rows[(s.rowIndex + 1) % s.rows.length]);
      }
    }

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
      students: { path: "studentsOnly", title: "EXCLUSIVO PARA ALUMNOS" },
      history: { path: "userHistory", title: "LO QUE YA VISTE" },
      bookmark: { path: "userBookmark", title: "MI SELECCIÓN" },
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
        title = String(opts.genreName || "").toUpperCase();
      } else if (opts.type === "search") {
        var terms = String(opts.terms || "").toUpperCase();
        query = { searchTerms: terms };
        titleHtml = 'RESULTADOS PARA <span class="searchTerms">' + util.esc(terms) + "</span>";
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
          message: "No se encuentra el texto buscado: " + opts.terms + ". ¿Querés realizar una nueva búsqueda?",
          yes: "SÍ",
          no: "NO",
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
   * ES5 puro.
   */
  (function ($, XTV) {
    "use strict";

    var P = XTV.paths;
    var util = XTV.util;
    var modal = XTV.modal;

    /* ======================================================================
     * Ficha de película (VER AHORA / MI LISTA)
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

    function bookmarkLabel(bookmarked) {
      return bookmarked ? "QUITAR DE MI LISTA" : "AGREGAR A MI LISTA";
    }

    function showMovieModal(item, context, bookmarked, canBookmark) {
      var changed = false;
      var saving = false;
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
              $bookmark.text(bookmarkLabel(bookmarked)).toggleClass("bookmarked", bookmarked);
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
        $el: $el,
        items: ".confirmField",
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
     * Salir y cerrar sesión
     * ==================================================================== */
    function confirmExit() {
      modal.confirm({
        message: "¿Realmente querés cerrar Xiclos?",
        onYes: function () {
          XTV.platform.exit();
        }
      });
    }

    function confirmLogout() {
      modal.confirm({
        message:
          "¿Realmente querés cerrar tu sesión en Xiclos? Si cerrás tu sesión deberás volver a sincronizar tu dispositivo para disfrutar Xiclos nuevamente.",
        onYes: function () {
          XTV.login.logout();
        }
      });
    }

    XTV.actions = {
      openMovie: openMovie,
      genres: genres,
      confirmExit: confirmExit,
      confirmLogout: confirmLogout
    };
  })(window.jQuery, window.XTV);
}
