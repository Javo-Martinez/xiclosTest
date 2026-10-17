/*
 * Xiclos TV v2 - configuración y núcleo (estado, teclas, API, loader)
 * Este archivo mantiene su nombre porque lo carga el index.html empaquetado.
 * En Amazon (mientras siga con la versión anterior) carga la copia de common/legacy/js/config.js.
 * ES5 puro.
 */
if (window.XTV_BOOT && window.XTV_BOOT.legacy) {
  window.XTV_BOOT.load("config.js");
} else {
  /*
   * Xiclos TV v2 - configuración
   * ES5 puro: este archivo tiene que poder cargarse en TVs desde 2017
   * (webOS 3.5 / Chromium 38, Tizen 3 / Chromium 47).
   */
  var XTV = window.XTV || {};
  window.XTV = XTV;

  XTV.config = {
    VERSION: "2.0.0",

    DOMAIN: "https://xiclos.com",
    API: "https://us-central1-xiclos-prod.cloudfunctions.net/api/tv",
    VIMEO_API: "https://us-central1-xiclos-prod.cloudfunctions.net/api/api/v2/vimeo/",
    JW_MEDIA_API: "https://cdn.jwplayer.com/v2/media/",
    JW_LIBRARY: "https://cdn.jwplayer.com/libraries/uAC0h9eo.js",

    // Imágenes que hoy se sirven desde xiclos.com (íconos del menú, logo, etc.)
    IMG: "https://xiclos.com/tv/common/img/",

    // Carga progresiva de la home
    HOME_FIRST_PAGE: 4, // primer pedido (incluye las listas del usuario)
    HOME_PAGE: 6, // tiras por cada pedido siguiente
    HOME_PREFETCH_ROWS: 3, // cuántas tiras antes del final se pide la siguiente página

    // Tiras largas: pósters que se crean de entrada y margen por delante del foco
    ROW_CHUNK: 24,
    ROW_CHUNK_AHEAD: 12,

    // Búsqueda
    SEARCH_MIN_CHARS: 2,
    SEARCH_DELAY_MS: 350,
    SEARCH_MAX_RESULTS: 30,
    SEARCH_MAX_PEOPLE: 8,
    SEARCH_RECENT_MAX: 8,

    // Carrusel de Cineclub: cantidad máxima de tarjetas

    // Pósters: cuántos se cargan por delante y por detrás de lo visible
    POSTERS_AHEAD: 4,
    POSTERS_BEHIND: 2,

    // Retraso para cambiar el fondo desenfocado (evita recalcularlo con cada tecla)
    BACKGROUND_DELAY_MS: 120,

    // PIN de sincronización
    PIN_RENEW_SECONDS: 60,
    // Vinculación: el QR abre SYNC_URL?SYNC_PARAM=<código>
    SYNC_URL: "https://xiclos.com/sync",
    SYNC_PARAM: "codigo",
    PIN_POLL_SECONDS: 10,

    // Player
    PROGRESS_SAVE_SECONDS: 15,
    PROGRESS_DONE_RATIO: 0.95,
    SEEK_SHORT_SECONDS: 10,
    SEEK_LONG_SECONDS: 30,
    // Adelantar/atrasar: el paso crece según cuánto hace que se mantiene
    // apretado ([milisegundos desde que empezó, segundos por paso])
    SEEK_ACCEL: [[0, 10], [1000, 30], [2500, 60], [5000, 120]],
    SEEK_COMMIT_MS: 700, // salto real después de esta pausa sin teclas
    SEEK_CHAIN_MS: 600, // teclas más espaciadas que esto reinician la aceleración
    PLAYER_UI_HIDE_MS: 5000, // la barra se oculta sola si no se toca nada
    RESUME_MIN_SECONDS: 30, // menos que esto no cuenta como "Seguir viendo"
    // Una película que figura en "Lo que ya viste" cuenta como empezada aunque
    // la respuesta no traiga el tiempo
    RESUME_FROM_HISTORY_LIST: true,

    // Peticiones
    REQUEST_TIMEOUT_MS: 20000,
    LOADER_MAX_MS: 30000,

    // Cuentas de prueba (para habilitar la v2 de forma gradual)
    TESTER_ACCOUNTS: ["mrtnz.jvr@gmail.com", "javomartinez@hotmail.com"]
  };

  XTV.paths = (function (api) {
    return {
      home: api + "/home",
      newPin: api + "/newPin",
      checkPin: api + "/checkPin",
      checkBookmark: api + "/checkBookmark",
      setBookmark: api + "/setBookmark",
      genres: api + "/genres",
      genresList: api + "/genreslist",
      studentsOnly: api + "/studentsOnly",
      search: api + "/genericSearch",
      userHistory: api + "/userHistory",
      userBookmark: api + "/userBookmark",
      setHistory: api + "/setHistory",
      updateHistory: api + "/updHistory",
      deleteHistory: api + "/deletedHistory",
      unsync: api + "/unsync",
      logNotification: api + "/log-notification"
    };
  })(XTV.config.API);

  /*
   * Xiclos TV v2 - núcleo
   * Utilidades, sesión, teclas, API, log, loader y estado global.
   * ES5 puro.
   */
  (function ($, XTV) {
    "use strict";

    var C = XTV.config;

    /* ======================================================================
     * Utilidades
     * ==================================================================== */
    var util = (XTV.util = {});

    util.esc = function (value) {
      if (value === null || value === undefined) {
        return "";
      }
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };

    // Convierte HTML/entidades que vienen del backend (WordPress) a texto
    // plano, sin ejecutar nada: se parsea en un documento inerte.
    var inertDoc = null;
    util.plain = function (value) {
      if (value === null || value === undefined) {
        return "";
      }
      var s = String(value);
      if (s.indexOf("<") === -1 && s.indexOf("&") === -1) {
        return s;
      }
      try {
        if (!inertDoc) {
          inertDoc = document.implementation.createHTMLDocument("");
        }
        var div = inertDoc.createElement("div");
        div.innerHTML = s;
        return div.textContent || "";
      } catch (e) {
        return s.replace(/<[^>]*>/g, "");
      }
    };

    // Texto del backend listo para insertar en HTML
    util.text = function (value) {
      return util.esc(util.plain(value));
    };

    // "a,b" o ["a","b"] -> "a, b"
    util.joinList = function (value) {
      if (value === null || value === undefined) {
        return "";
      }
      if ($.isArray(value)) {
        return value.join(", ");
      }
      return String(value).replace(/\s*,\s*/g, ", ");
    };

    util.isEmpty = function (value) {
      if (value === null || value === undefined) {
        return true;
      }
      if ($.isArray(value)) {
        return value.length === 0;
      }
      return String(value).replace(/\s+/g, "") === "";
    };

    util.debounce = function (fn, ms) {
      var timer = null;
      var debounced = function () {
        var args = arguments;
        var self = this;
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(function () {
          timer = null;
          fn.apply(self, args);
        }, ms);
      };
      debounced.cancel = function () {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      };
      return debounced;
    };

    util.now = function () {
      return new Date().getTime();
    };

    util.cssUrl = function (url) {
      return 'url("' + String(url || "").replace(/["\\\n\r]/g, "") + '")';
    };

    util.setTranslateX = function (el, px) {
      var value = "translateX(" + Math.round(-px) + "px)";
      el.style.webkitTransform = value;
      el.style.transform = value;
    };

    /* ======================================================================
     * Almacenamiento y sesión
     * ==================================================================== */
    var storage = (XTV.storage = {
      get: function (key) {
        try {
          return window.localStorage.getItem(key);
        } catch (e) {
          return null;
        }
      },
      set: function (key, value) {
        try {
          window.localStorage.setItem(key, value);
        } catch (e) {}
      },
      remove: function (key) {
        try {
          window.localStorage.removeItem(key);
        } catch (e) {}
      },
      clear: function () {
        try {
          window.localStorage.clear();
        } catch (e) {}
      }
    });

    var SYNC_KEY = "xiclos_sync";

    XTV.session = {
      get: function () {
        var raw = storage.get(SYNC_KEY);
        if (!raw) {
          return null;
        }
        try {
          return JSON.parse(raw);
        } catch (e) {
          return null;
        }
      },
      set: function (syncUserDevice) {
        storage.set(SYNC_KEY, JSON.stringify(syncUserDevice));
      },
      // Deja solo la sincronización (mismo comportamiento que la versión anterior)
      keepOnlySync: function () {
        var keep = [SYNC_KEY, "debug_mode", "xtv_recent_searches"];
        var saved = {};
        for (var i = 0; i < keep.length; i++) {
          saved[keep[i]] = storage.get(keep[i]);
        }
        storage.clear();
        for (var k in saved) {
          if (saved.hasOwnProperty(k) && saved[k] !== null) {
            storage.set(k, saved[k]);
          }
        }
      },
      // Cierra la sesión pero conserva las búsquedas recientes del dispositivo
      clearKeepingDevice: function () {
        var recent = storage.get("xtv_recent_searches");
        storage.clear();
        if (recent) {
          storage.set("xtv_recent_searches", recent);
        }
      },
      clear: function () {
        storage.clear();
      },
      user: function () {
        var s = this.get();
        return s && s.User ? s.User : null;
      },
      isStudent: function () {
        var user = this.user();
        var subs = (user && user.subscriptions) || [];
        for (var i = 0; i < subs.length; i++) {
          if (
            subs[i] &&
            (subs[i].su_name === "EXCLUSIVOALUMNOS01" ||
              subs[i].su_name === "EXCLUSIVOALUMNOS01ANTIGUO")
          ) {
            return true;
          }
        }
        return false;
      }
    };

    /* ======================================================================
     * Teclas
     * Un solo mapa para Tizen, webOS y teclado de PC.
     * ==================================================================== */
    var KEYMAP = {
      13: "OK",
      37: "LEFT",
      38: "UP",
      39: "RIGHT",
      40: "DOWN",
      27: "BACK", // Escape (PC)
      461: "BACK", // webOS
      10009: "BACK", // Tizen
      10182: "EXIT", // Tizen
      415: "PLAY",
      19: "PAUSE",
      10252: "PLAYPAUSE", // Tizen
      413: "STOP",
      417: "FF",
      412: "RW",
      406: "BLUE",
      457: "INFO",
      65376: "DONE", // Tizen IME: "Listo"
      65385: "CANCEL", // Tizen IME: "Cancelar"
      32: "SPACE",
      // Teclas numéricas del control (en la búsqueda escriben números)
      48: "D0", 49: "D1", 50: "D2", 51: "D3", 52: "D4",
      53: "D5", 54: "D6", 55: "D7", 56: "D8", 57: "D9"
    };

    XTV.keys = {
      action: function (event) {
        var code = event.keyCode;
        var extra = XTV.platform && XTV.platform.keys;
        var action = (extra && extra[code]) || KEYMAP[code] || null;
        // Backspace en un campo de texto borra, no es "Volver"
        if (action === "BACK" && code === 8) {
          var el = document.activeElement;
          if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA") && !el.readOnly) {
            return null;
          }
        }
        return action;
      },
      isNav: function (action) {
        return (
          action === "LEFT" ||
          action === "RIGHT" ||
          action === "UP" ||
          action === "DOWN"
        );
      }
    };

    /* ======================================================================
     * Log de errores
     * Reemplaza a logAction(), que no existía en la versión anterior.
     * ==================================================================== */
    var logCount = 0;
    XTV.log = {
      info: function () {
        if (window.console && console.log) {
          console.log.apply(console, arguments);
        }
      },
      error: function (action, xhr, extra) {
        var detail = {
          action: action,
          status: xhr ? xhr.status : null,
          statusText: xhr ? xhr.statusText : null,
          extra: extra || null,
          version: C.VERSION,
          platform: XTV.platform ? XTV.platform.name : "unknown",
          ua: navigator.userAgent
        };
        if (window.console && console.error) {
          console.error("[XTV]", action, detail);
        }
        // Límite para no inundar el backend si algo falla en loop
        if (logCount >= 20) {
          return;
        }
        logCount++;
        try {
          $.ajax({
            url: XTV.paths.logNotification,
            headers: { Authorization: "TV" },
            dataType: "json",
            type: "POST",
            data: {
              message: "TV v2: " + action,
              data: JSON.stringify(detail),
              type: "ERROR"
            },
            timeout: 10000
          });
        } catch (e) {}
      }
    };

    /* ======================================================================
     * API
     * Todas las peticiones pasan por acá. Cada una pertenece a un "scope"
     * (por ejemplo "home", "list", "player") y se pueden cancelar en bloque
     * cuando el usuario se va de esa pantalla.
     * ==================================================================== */
    var scopes = {};

    XTV.api = {
      request: function (opts) {
        var headers = { Authorization: "TV" };
        if (opts.auth !== false) {
          var user = XTV.session.user();
          if (user) {
            headers.U = JSON.stringify(user);
          }
        }
        var url = opts.url;
        if (opts.query) {
          url += (url.indexOf("?") === -1 ? "?" : "&") + $.param(opts.query);
        }
        var ajaxOpts = {
          url: url,
          type: opts.method || "GET",
          dataType: "json",
          data: opts.data,
          cache: opts.cache === undefined ? false : opts.cache,
          timeout: opts.timeout || C.REQUEST_TIMEOUT_MS
        };
        if (opts.headers !== false) {
          ajaxOpts.headers = headers;
        }
        var xhr = $.ajax(ajaxOpts);
        var scope = opts.scope;
        if (scope) {
          if (!scopes[scope]) {
            scopes[scope] = [];
          }
          scopes[scope].push(xhr);
          xhr.always(function () {
            var list = scopes[scope] || [];
            for (var i = list.length - 1; i >= 0; i--) {
              if (list[i] === xhr) {
                list.splice(i, 1);
              }
            }
          });
        }
        return xhr;
      },

      get: function (url, query, scope, extra) {
        var opts = $.extend({ url: url, query: query, scope: scope }, extra || {});
        return this.request(opts);
      },

      abort: function (scope) {
        var list = scopes[scope];
        if (!list) {
          return;
        }
        scopes[scope] = [];
        for (var i = 0; i < list.length; i++) {
          try {
            list[i].abort();
          } catch (e) {}
        }
      },

      // true si el error es por cancelación propia (no hay que mostrar nada)
      isAbort: function (xhr, textStatus) {
        return textStatus === "abort" || (xhr && xhr.statusText === "abort");
      }
    };

    /* ======================================================================
     * Loader
     * Se muestra mientras haya al menos una operación pendiente. Cada
     * operación se identifica con una clave, así que cerrar una no cierra
     * la de otra. Tiene un tope de tiempo para no quedar trabado nunca.
     * ==================================================================== */
    var pending = {};
    var loaderTimer = null;

    function loaderCount() {
      var n = 0;
      for (var k in pending) {
        if (pending.hasOwnProperty(k)) {
          n++;
        }
      }
      return n;
    }

    function renderLoader() {
      var $modal = $("#modal");
      if (loaderCount() > 0) {
        if (!$modal.length) {
          $("body").append(
            '<div id="modal" class="modal modalAnimation"><div class="loading"><img src="' +
              util.esc(C.IMG + "logo.png") +
              '"></div></div>'
          );
        }
        if (!loaderTimer) {
          loaderTimer = setTimeout(function () {
            loaderTimer = null;
            if (loaderCount() > 0) {
              XTV.log.error("loader-timeout", null, { pending: pending });
              pending = {};
              renderLoader();
            }
          }, C.LOADER_MAX_MS);
        }
      } else {
        $modal.remove();
        if (loaderTimer) {
          clearTimeout(loaderTimer);
          loaderTimer = null;
        }
      }
    }

    XTV.loader = {
      show: function (key) {
        pending[key || "default"] = true;
        renderLoader();
      },
      hide: function (key) {
        delete pending[key || "default"];
        renderLoader();
      },
      isVisible: function () {
        return loaderCount() > 0;
      }
    };

    /* ======================================================================
     * Operación en curso ("busy")
     * Mientras se espera algo que cambia de pantalla (abrir una película,
     * cargar una lista, iniciar el player) las flechas se ignoran y Volver
     * cancela la operación. Evita acciones sobre una pantalla que se va.
     * ==================================================================== */
    var busy = null;

    XTV.busy = {
      start: function (key, onCancel) {
        if (busy && busy.key !== key && busy.onCancel) {
          // Una operación nueva reemplaza a la anterior
          var prev = busy;
          busy = null;
          prev.onCancel();
          XTV.loader.hide(prev.key);
        }
        busy = { key: key, onCancel: onCancel };
        XTV.loader.show(key);
      },
      end: function (key) {
        if (busy && busy.key === key) {
          busy = null;
        }
        XTV.loader.hide(key);
      },
      cancel: function () {
        if (!busy) {
          return false;
        }
        var current = busy;
        busy = null;
        XTV.loader.hide(current.key);
        if (current.onCancel) {
          current.onCancel();
        }
        return true;
      },
      active: function () {
        return !!busy;
      }
    };

    /* ======================================================================
     * Mensaje breve a pantalla completa (reemplaza customMessage)
     * Cualquier tecla lo cierra.
     * ==================================================================== */
    var messageTimer = null;
    var messageOnClose = null;

    XTV.message = {
      show: function (text, ms, onClose) {
        this.hide(true);
        $("body").append(
          '<div id="modalMessage" class="simpleModal" style="z-index:10008"><p class="customMessage">' +
            util.esc(text) +
            "</p></div>"
        );
        messageOnClose = onClose || null;
        messageTimer = setTimeout(function () {
          XTV.message.hide();
        }, ms || 3500);
      },
      hide: function (silent) {
        if (messageTimer) {
          clearTimeout(messageTimer);
          messageTimer = null;
        }
        var wasVisible = $("#modalMessage").length > 0;
        $("#modalMessage").remove();
        var cb = messageOnClose;
        messageOnClose = null;
        if (wasVisible && !silent && cb) {
          cb();
        }
      },
      isVisible: function () {
        return $("#modalMessage").length > 0;
      }
    };

    /* ======================================================================
     * Conexión
     * El aviso tiene su propio id y nadie más lo borra.
     * ==================================================================== */
    XTV.net = {
      init: function () {
        window.addEventListener("offline", function () {
          XTV.net.render(false);
        });
        window.addEventListener("online", function () {
          XTV.net.render(true);
        });
      },
      render: function (online) {
        $("#modalOnOff").remove();
        if (!online) {
          $("body").append(
            '<div id="modalOnOff" class="modal" style="z-index:10010"><div id="resultsModal"><p class="offlineWarning">Su conexión de red se ha perdido.</p></div></div>'
          );
        }
      },
      isOffline: function () {
        return $("#modalOnOff").length > 0;
      }
    };

    // Los index.html empaquetados llaman a setOnOff('online' | 'offline')
    window.setOnOff = function (msg) {
      XTV.net.render(msg !== "offline");
    };

    /* ======================================================================
     * Estado global
     * layer indica quién recibe las teclas:
     *   boot, pin, grid, menu, modal, video
     * ==================================================================== */
    XTV.state = {
      layer: "boot"
    };

    XTV.setLayer = function (layer) {
      var prev = XTV.state.layer;
      XTV.state.layer = layer;
      if (document.body) {
        $(document.body)
          .removeClass("xtv-layer-" + prev)
          .addClass("xtv-layer-" + layer);
      }
      if (XTV.grid && XTV.grid.syncFocusClass) {
        XTV.grid.syncFocusClass();
      }
    };

    // Vuelve a pintar el foco de la capa activa (al volver del player)
    XTV.refocus = function () {
      if (XTV.state.layer === "search" && XTV.search && XTV.search.refocus) {
        XTV.search.refocus();
      } else if (XTV.state.layer === "browse" && XTV.browse && XTV.browse.refocus) {
        XTV.browse.refocus();
      } else if (XTV.grid && XTV.grid.refocus) {
        XTV.grid.refocus();
      }
    };

    // Normaliza para comparar: minúsculas y sin tildes (la ñ se conserva)
    var ACCENTS = { "\u00e1": "a", "\u00e0": "a", "\u00e4": "a", "\u00e2": "a", "\u00e3": "a", "\u00e9": "e", "\u00e8": "e", "\u00eb": "e", "\u00ea": "e",
      "\u00ed": "i", "\u00ec": "i", "\u00ef": "i", "\u00ee": "i", "\u00f3": "o", "\u00f2": "o", "\u00f6": "o", "\u00f4": "o", "\u00f5": "o",
      "\u00fa": "u", "\u00f9": "u", "\u00fc": "u", "\u00fb": "u", "\u00e7": "c" };
    util.norm = function (value) {
      var s = util.plain(value).toLowerCase();
      return s.replace(/[\u00e1\u00e0\u00e4\u00e2\u00e3\u00e9\u00e8\u00eb\u00ea\u00ed\u00ec\u00ef\u00ee\u00f3\u00f2\u00f6\u00f4\u00f5\u00fa\u00f9\u00fc\u00fb\u00e7]/g, function (ch) {
        return ACCENTS[ch] || ch;
      });
    };

    /* ======================================================================
     * Puntero (Magic Remote de LG / mouse)
     * El hover solo cuenta si el puntero se movió de verdad. Cuando el
     * contenido se desplaza con las flechas, el navegador dispara eventos de
     * mouse sobre lo que quedó debajo del cursor; sin este control el foco
     * saltaría solo.
     * ==================================================================== */
    var pointer = { active: false, x: -1, y: -1 };
    XTV.pointer = {
      init: function () {
        document.addEventListener(
          "mousemove",
          function (e) {
            if (e.clientX !== pointer.x || e.clientY !== pointer.y) {
              pointer.x = e.clientX;
              pointer.y = e.clientY;
              pointer.active = true;
            }
          },
          true
        );
        // webOS avisa cuando oculta el cursor
        document.addEventListener("cursorStateChange", function (e) {
          if (e && e.detail && e.detail.visibility === false) {
            pointer.active = false;
          }
        });
      },
      // Se llama con cada tecla del control: el puntero deja de mandar
      keyPressed: function () {
        pointer.active = false;
      },
      isActive: function () {
        return pointer.active;
      }
    };

    /* ======================================================================
     * Íconos (SVG de trazo, heredan el color del texto)
     * ==================================================================== */
    var ICONS = {
      search: '<path d="M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM16.2 16.2L20 20"/>',
      home: '<path d="M4 11l8-7l8 7M6 9.5V20h12V9.5"/>',
      cineclub: '<path d="M4 6h16v12H4zM4 10h16M9 6v4M15 6v4"/>',
      compass: '<path d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM15.5 8.5l-2 5l-5 2l2-5z"/>',
      star: '<path d="M12 4l2.4 5l5.6.6l-4.2 3.8l1.2 5.6L12 16.2L7 19l1.2-5.6L4 9.6l5.6-.6z"/>',
      power: '<path d="M12 3v8M6.5 6.5a8 8 0 1 0 11 0"/>',
      logout: '<path d="M10 5H5v14h5M15 8l4 4l-4 4M19 12H9"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
      backspace: '<path d="M9 5h11v14H9l-6-7zM12.5 9.5l5 5M17.5 9.5l-5 5"/>',
      space: '<path d="M3 10v5h18v-5"/>',
      play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
      pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" stroke="none"/>',
      restart: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4"/>',
      cc: '<path d="M3 6h18v12H3zM10.5 10.2a2.3 2.3 0 1 0 0 3.6M17 10.2a2.3 2.3 0 1 0 0 3.6"/>',
      cast: '<path d="M3 8V6h18v12h-6M3 12a6 6 0 0 1 6 6M3 15.5a2.5 2.5 0 0 1 2.5 2.5M3 18h.01"/>'
    };

    XTV.icon = function (name, cls) {
      return (
        '<svg class="' +
        (cls || "") +
        '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        (ICONS[name] || "") +
        "</svg>"
      );
    };

    /* ======================================================================
     * Navegación geométrica entre elementos (modales, menús)
     * Elige el elemento más cercano en la dirección pedida según su
     * posición en pantalla, así no depende del orden del DOM.
     * ==================================================================== */
    XTV.nav = {
      pick: function ($items, current, direction) {
        if (!current) {
          return $items.get(0) || null;
        }
        var cr = current.getBoundingClientRect();
        var cx = cr.left + cr.width / 2;
        var cy = cr.top + cr.height / 2;
        var best = null;
        var bestScore = Infinity;
        $items.each(function () {
          if (this === current) {
            return;
          }
          var r = this.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) {
            return;
          }
          var x = r.left + r.width / 2;
          var y = r.top + r.height / 2;
          var dx = x - cx;
          var dy = y - cy;
          var primary;
          var secondary;
          if (direction === "RIGHT") {
            primary = dx;
            secondary = dy;
          } else if (direction === "LEFT") {
            primary = -dx;
            secondary = dy;
          } else if (direction === "DOWN") {
            primary = dy;
            secondary = dx;
          } else {
            primary = -dy;
            secondary = dx;
          }
          if (primary <= 1) {
            return;
          }
          var score = primary + Math.abs(secondary) * 3;
          if (score < bestScore) {
            bestScore = score;
            best = this;
          }
        });
        return best;
      }
    };
  })(window.jQuery, window.XTV);
}
