/*
 * Xiclos TV v2 - reproductor
 * Este archivo mantiene su nombre porque lo carga el index.html empaquetado.
 * En Amazon (mientras siga con la versión anterior) carga la copia de common/legacy/js/JCPlayer.js.
 * ES5 puro.
 */
if (window.XTV_BOOT && window.XTV_BOOT.legacy) {
  window.XTV_BOOT.load("JCPlayer.js");
} else {
  /*
   * Xiclos TV v2 - reproductor (reemplaza JCPlayer.js)
   *
   * - Volver o Stop durante la carga cancela: la película no arranca después.
   * - Barra propia (aparece con cualquier tecla): progreso, Play/Pausa,
   *   "Desde el inicio", "Subtítulos" y, donde el reproductor lo ofrece,
   *   "Transmitir". Las teclas de cada parte están en handleKey.
   * - Adelantar/atrasar acumula: mientras se aprieta se mueve solo el
   *   indicador y se salta una vez al soltar. El paso crece si se mantiene.
   * - El progreso se guarda cada 15 s, al pausar y al salir. Al pasar el
   *   95 % se borra del historial, como antes.
   *
   * ES5 puro.
   */
  (function ($, XTV) {
    "use strict";

    var C = XTV.config;
    var P = XTV.paths;
    var util = XTV.util;
    var CONTAINER_ID = "div_vimeo_player";

    var ua = navigator.userAgent || "";
    var isLG = /web0s|webos/i.test(ua);
    // Mismo criterio que la versión anterior
    var renderCaptionsNatively = !/chrome|chromium|crios/i.test(ua);

    var session = null; // reproducción en curso
    var gen = 0;
    var library = null;

    /* ----------------------------------------------------------------------
     * Posiciones guardadas (para "Seguir viendo" en la ficha)
     * Lo que se guarda desde esta TV se recuerda acá; además se consulta
     * "Lo que ya viste" para lo visto en otros equipos.
     * -------------------------------------------------------------------- */
    var RESUME_KEY = "xtv_resume";
    var RESUME_MAX = 200;
    var historyCache = { at: 0, req: null, map: null };

    function resumeMap() {
      try {
        return JSON.parse(XTV.storage.get(RESUME_KEY) || "{}") || {};
      } catch (e) {
        return {};
      }
    }

    function resumeSet(movieId, seconds) {
      if (movieId === undefined || movieId === null) {
        return;
      }
      var m = resumeMap();
      var k = String(movieId);
      if (seconds > 0) {
        m[k] = { t: Math.floor(seconds), at: new Date().getTime() };
      } else {
        delete m[k];
      }
      // Solo las más recientes
      var keys = [];
      for (var id in m) {
        if (m.hasOwnProperty(id)) {
          keys.push(id);
        }
      }
      if (keys.length > RESUME_MAX) {
        keys.sort(function (a, b) {
          return m[a].at - m[b].at;
        });
        for (var i = 0; i < keys.length - RESUME_MAX; i++) {
          delete m[keys[i]];
        }
      }
      XTV.storage.set(RESUME_KEY, JSON.stringify(m));
      historyCache.at = 0; // la lista del servidor puede haber cambiado
    }

    // Segundos guardados que trae un objeto de película, si los trae
    function secondsIn(obj) {
      var f = ["resumePoint", "resume_point", "resumepoint", "time", "progress", "position", "seconds"];
      for (var i = 0; i < f.length; i++) {
        var v = parseFloat(obj && obj[f[i]]);
        if (v > 0) {
          return v;
        }
      }
      return 0;
    }

    function historyMap() {
      var now = new Date().getTime();
      if (historyCache.map && now - historyCache.at < 60000) {
        return $.Deferred().resolve(historyCache.map).promise();
      }
      if (historyCache.req && historyCache.req.state() === "pending") {
        return historyCache.req;
      }
      var d = $.Deferred();
      historyCache.req = d.promise();
      XTV.api
        .get(P.userHistory, null, "movie", { timeout: 4000 })
        .done(function (res) {
          var map = {};
          var data = (res && res.data) || [];
          for (var i = 0; i < data.length; i++) {
            if (data[i] && data[i].movieId !== undefined) {
              map[String(data[i].movieId)] = secondsIn(data[i]) || -1; // -1: figura sin tiempo
            }
          }
          historyCache.map = map;
          historyCache.at = new Date().getTime();
          d.resolve(map);
        })
        .fail(function () {
          d.resolve(historyCache.map || {});
        });
      return historyCache.req;
    }

    // Promesa con { seconds } si la película está empezada, o null
    function lookupResume(item) {
      var d = $.Deferred();
      if (!item) {
        return d.resolve(null).promise();
      }
      var id = String(item.movieId);
      var local = resumeMap()[id];
      var own = secondsIn(item);
      historyMap().done(function (map) {
        var remote = map[id];
        var secs = Math.max(local ? local.t : 0, own, remote > 0 ? remote : 0);
        if (secs >= C.RESUME_MIN_SECONDS) {
          d.resolve({ seconds: secs });
        } else if (remote === -1 && C.RESUME_FROM_HISTORY_LIST && !(local && local.t === 0)) {
          d.resolve({ seconds: 0 });
        } else {
          d.resolve(null);
        }
      });
      return d.promise();
    }

    function loadLibrary() {
      if (window.jwplayer) {
        return $.Deferred().resolve().promise();
      }
      if (!library || library.state() === "rejected") {
        library = $.ajax({ url: C.JW_LIBRARY, dataType: "script", cache: true, timeout: 20000 });
      }
      return library;
    }

    /* ----------------------------------------------------------------------
     * Fuentes
     * -------------------------------------------------------------------- */
    function isVimeo(mediaId) {
      return /^\d+$/.test(String(mediaId || ""));
    }

    function fetchPlaylistItem(mediaId) {
      var d = $.Deferred();
      if (isVimeo(mediaId)) {
        XTV.api
          .request({ url: C.VIMEO_API + mediaId, query: { hls: false }, scope: "player", headers: false, auth: false })
          .done(function (res) {
            if (res && res.data) {
              d.resolve(res.data);
            } else {
              d.reject(null, "empty");
            }
          })
          .fail(function (xhr, textStatus) {
            d.reject(xhr, textStatus);
          });
      } else {
        XTV.api
          .request({ url: C.JW_MEDIA_API + mediaId, scope: "player", headers: false, auth: false })
          .done(function (res) {
            var item = res && res.playlist && res.playlist[0];
            if (!item) {
              d.reject(null, "empty");
              return;
            }
            var sources = [];
            var all = item.sources || [];
            for (var i = 0; i < all.length; i++) {
              if (String(all[i].type || "").indexOf("video/mp4") !== -1) {
                sources.push(all[i]);
              }
            }
            // Mayor resolución primero (igual que antes)
            sources.sort(function (a, b) {
              return (b.width || 0) - (a.width || 0);
            });
            d.resolve({ sources: sources, tracks: item.tracks });
          })
          .fail(function (xhr, textStatus) {
            d.reject(xhr, textStatus);
          });
      }
      return d.promise();
    }

    /* ----------------------------------------------------------------------
     * Historial / progreso
     * -------------------------------------------------------------------- */
    var lastSave = null;
    var RESUME_TOLERANCE = 15; // segundos de margen para dar por bueno el salto
    var RESUME_RETRIES = 3;

    function saveProgress(s, seconds) {
      if (!s || s.done || !s.tracking) {
        return;
      }
      seconds = Math.floor(seconds);
      if (seconds <= 0) {
        return;
      }
      s.lastSaved = seconds;
      resumeSet(s.item.movieId, seconds);
      lastSave = XTV.api
        .request({
          method: "PUT",
          url: P.updateHistory,
          query: { id: s.item.movieId },
          data: { time: seconds }
        })
        .fail(function (xhr, textStatus) {
          if (!XTV.api.isAbort(xhr, textStatus)) {
            XTV.log.error("updHistory", xhr, { movieId: s.item.movieId });
          }
        });
      return lastSave;
    }

    // Promesa que se resuelve cuando termina el último guardado (bien o mal),
    // con un máximo de 3 s para no trabar la reproducción.
    function afterLastSave() {
      var d = $.Deferred();
      var xhr = lastSave;
      if (!xhr || xhr.state() !== "pending") {
        return d.resolve().promise();
      }
      var t = setTimeout(function () {
        d.resolve();
      }, 3000);
      xhr.always(function () {
        clearTimeout(t);
        d.resolve();
      });
      return d.promise();
    }

    function markDone(s) {
      if (!s || s.done) {
        return;
      }
      s.done = true;
      resumeSet(s.item.movieId, 0);
      if (s.progressId === undefined || s.progressId === null) {
        return;
      }
      XTV.api
        .request({ method: "DELETE", url: P.deleteHistory, data: { id: s.progressId } })
        .fail(function (xhr, textStatus) {
          if (!XTV.api.isAbort(xhr, textStatus)) {
            XTV.log.error("deletedHistory", xhr, { progressId: s.progressId });
          }
        });
    }

    function durationOf(s) {
      var d = 0;
      try {
        d = s.player.getDuration();
      } catch (e) {}
      if (!(d > 0)) {
        d = (parseFloat(s.item.duration) || 0) * 60;
      }
      return d;
    }

    /* ----------------------------------------------------------------------
     * Ciclo de vida
     * -------------------------------------------------------------------- */
    // opts.fromStart: empieza desde 0 aunque haya una posición guardada
    function play(item, opts) {
      opts = opts || {};
      if (!item || !item.mediaId) {
        XTV.message.show("Esta película no está disponible en este momento.");
        return;
      }
      stop(false);
      var myGen = ++gen;
      session = {
        gen: myGen,
        item: item,
        player: null,
        loading: true,
        resumePoint: 0,
        resumeTries: 0,
        progressId: null,
        lastSaved: 0,
        tracking: false,
        done: false
      };
      var s = session;
      XTV.modal.close(true);
      // Capa a la que se vuelve al salir (grilla o búsqueda)
      s.returnLayer = XTV.state.layer === "search" || XTV.state.layer === "browse" ? XTV.state.layer : "grid";
      XTV.setLayer("video");
      XTV.loader.show("player");

      function alive() {
        return session === s && s.gen === gen;
      }

      // Si se vuelve a abrir enseguida, primero se espera el último guardado:
      // si no, el historial podría devolver la posición anterior.
      var history = afterLastSave().then(function () {
        return XTV.api.get(P.setHistory, { movieId: item.movieId, resumePoint: 0 }, "player");
      });

      $.when(loadLibrary(), history)
        .done(function (libArgs, historyArgs) {
          if (!alive()) {
            return;
          }
          var res = historyArgs && historyArgs[0];
          var data = (res && res.data) || {};
          s.resumePoint = Math.max(0, parseFloat(data.resumePoint) || 0);
          s.progressId = data.progressId;
          if (opts.fromStart) {
            s.resumePoint = 0;
          } else if (s.resumePoint > 0) {
            resumeSet(item.movieId, s.resumePoint);
          }
          s.lastSaved = s.resumePoint;
          fetchPlaylistItem(item.mediaId)
            .done(function (playlistItem) {
              if (!alive()) {
                return;
              }
              setup(s, playlistItem);
            })
            .fail(function (xhr, textStatus) {
              if (!alive() || XTV.api.isAbort(xhr, textStatus)) {
                return;
              }
              fail(s, "media", xhr);
            });
        })
        .fail(function (xhr, textStatus) {
          if (!alive() || XTV.api.isAbort(xhr, textStatus)) {
            return;
          }
          fail(s, "setHistory/library", xhr);
        });
    }

    function setup(s, playlistItem) {
      if (typeof window.jwplayer !== "function") {
        fail(s, "jwplayer-missing", null);
        return;
      }
      $("#" + CONTAINER_ID).css("display", "block");
      var player = window.jwplayer(CONTAINER_ID);
      s.player = player;
      player.setup({
        playlist: [playlistItem],
        autostart: false,
        responsive: true,
        displayPlaybackLabel: true,
        renderCaptionsNatively: renderCaptionsNatively,
        stretching: "uniform"
      });

      player.on("ready", function () {
        if (session !== s) {
          return;
        }
        s.loading = false;
        XTV.loader.hide("player");
        // Pantalla completa forzada (LG no lo hace sola)
        try {
          $(player.getContainer()).addClass("jw-flag-fullscreen");
        } catch (e) {}
        player.play();
        uiStart(s);
      });

      player.on("firstFrame", function () {
        if (session !== s) {
          return;
        }
        if (s.resumePoint > 5) {
          resumeSeek(s, isLG ? 500 : 0);
        } else {
          s.tracking = true;
        }
      });

      // Un salto solo habilita el guardado si llegó a destino (o si lo pidió
      // el usuario). Si no, un salto fallido que deja el video en 0 pisaría
      // la posición guardada.
      player.on("seeked", function () {
        if (session !== s || s.tracking) {
          return;
        }
        var pos = 0;
        try {
          pos = player.getPosition() || 0;
        } catch (e) {}
        if (pos >= s.resumePoint - RESUME_TOLERANCE) {
          s.tracking = true;
        }
      });

      player.on("time", function (e) {
        if (session !== s || s.done) {
          return;
        }
        var pos = e.position || 0;
        uiTick();
        if (!s.tracking && pos >= s.resumePoint - 5) {
          s.tracking = true;
        }
        if (!s.tracking) {
          return;
        }
        var dur = e.duration > 0 ? e.duration : durationOf(s);
        if (dur > 0 && pos > dur * C.PROGRESS_DONE_RATIO) {
          markDone(s);
          return;
        }
        if (Math.abs(pos - s.lastSaved) >= C.PROGRESS_SAVE_SECONDS) {
          saveProgress(s, pos);
        }
      });

      player.on("pause", function () {
        if (session !== s) {
          return;
        }
        var pos = 0;
        try {
          pos = player.getPosition();
        } catch (e) {}
        var dur = durationOf(s);
        if (dur > 0 && pos > dur * C.PROGRESS_DONE_RATIO) {
          markDone(s);
        } else {
          saveProgress(s, pos);
        }
      });

      player.on("complete", function () {
        if (session !== s) {
          return;
        }
        markDone(s);
        stop(true);
      });

      // Subtítulos: se respeta la última elección (idioma o desactivados);
      // si no hay ninguna, el primero disponible, como antes.
      player.on("captionsList", function (list) {
        var tracks = (list && list.tracks) || [];
        if (tracks.length < 2) {
          return;
        }
        var pref = XTV.storage.get(CAPS_KEY);
        var idx = 1;
        if (pref === "off") {
          idx = 0;
        } else if (pref) {
          for (var i = 1; i < tracks.length; i++) {
            if (tracks[i].label === pref) {
              idx = i;
            }
          }
        }
        try {
          if (player.getCurrentCaptions() !== idx) {
            player.setCurrentCaptions(idx);
          }
        } catch (e) {}
        uiRender();
      });
      player.on("play", uiRender);
      player.on("pause", function () {
        uiRender();
        uiShow();
      });

      var onError = function (err) {
        if (session !== s) {
          return;
        }
        fail(s, "jwplayer", null, err);
      };
      player.on("setupError", onError);
      player.on("error", onError);
    }

    // Salta a la posición guardada y verifica 2 s después que haya llegado.
    // Algunos televisores ignoran el primer salto si el video todavía está
    // cargando: se reintenta hasta RESUME_RETRIES veces.
    function resumeSeek(s, delay) {
      setTimeout(function () {
        if (session !== s || s.tracking) {
          return;
        }
        s.resumeTries++;
        try {
          s.player.seek(s.resumePoint);
        } catch (e) {}
        setTimeout(function () {
          if (session !== s || s.tracking) {
            return;
          }
          var pos = 0;
          try {
            pos = s.player.getPosition() || 0;
          } catch (e) {}
          if (pos >= s.resumePoint - RESUME_TOLERANCE) {
            s.tracking = true;
          } else if (s.resumeTries < RESUME_RETRIES) {
            resumeSeek(s, 0);
          } else {
            // No hubo caso: se sigue desde donde está y se guarda desde ahí
            XTV.log.error("player-resume", null, {
              movieId: s.item.movieId,
              resumePoint: s.resumePoint,
              position: pos
            });
            s.tracking = true;
          }
        }, 2000);
      }, delay);
    }

    // Guarda la posición actual sin salir del video (al ocultarse la app,
    // al salir con EXIT, etc.).
    function flush() {
      var s = session;
      if (!s || !s.player || s.done || !s.tracking) {
        return null;
      }
      var pos = 0;
      try {
        pos = s.player.getPosition();
      } catch (e) {}
      var dur = durationOf(s);
      if (dur > 0 && pos > dur * C.PROGRESS_DONE_RATIO) {
        markDone(s);
        return null;
      }
      if (Math.abs(pos - s.lastSaved) >= 2) {
        return saveProgress(s, pos);
      }
      return null;
    }

    function onHidden() {
      var hidden = document.hidden || document.webkitHidden;
      if (hidden) {
        flush();
      }
    }
    document.addEventListener("visibilitychange", onHidden);
    document.addEventListener("webkitvisibilitychange", onHidden);
    window.addEventListener("pagehide", flush);

    function fail(s, where, xhr, err) {
      XTV.log.error("player-" + where, xhr, {
        movieId: s.item.movieId,
        mediaId: s.item.mediaId,
        error: err ? { code: err.code, message: err.message } : null
      });
      stop(false);
      XTV.message.show("No pudimos reproducir esta película. Probá de nuevo en unos minutos.");
    }

    // Sale del player. Si saveFirst, guarda la posición actual.
    function stop(saveFirst) {
      var s = session;
      session = null;
      gen++;
      XTV.api.abort("player");
      XTV.loader.hide("player");
      if (s && s.player) {
        if (saveFirst !== false && !s.done && s.tracking) {
          var pos = 0;
          try {
            pos = s.player.getPosition();
          } catch (e) {}
          var dur = durationOf(s);
          if (dur > 0 && pos > dur * C.PROGRESS_DONE_RATIO) {
            markDone(s);
          } else if (Math.abs(pos - s.lastSaved) >= 2) {
            saveProgress(s, pos);
          }
        }
        try {
          s.player.remove();
        } catch (e) {}
      }
      $("#" + CONTAINER_ID).removeClass("jw-flag-fullscreen");
      uiStop();
      if (s && XTV.state.layer === "video") {
        XTV.setLayer(s.returnLayer || "grid");
        XTV.refocus();
      }
    }

    function togglePlay(force) {
      var s = session;
      if (!s || !s.player || s.loading) {
        return;
      }
      try {
        var state = s.player.getState();
        if (force === "play" || (force !== "pause" && state !== "playing" && state !== "buffering")) {
          s.player.play();
        } else {
          s.player.pause();
        }
      } catch (e) {}
    }

    /* ----------------------------------------------------------------------
     * Barra propia
     * -------------------------------------------------------------------- */
    var CAPS_KEY = "xtv_captions";
    var ui = {
      $el: null,
      shown: false,
      zone: "bar", // bar | btn | menu
      btn: 0,
      menu: null, // { items: [...], index }
      hideTimer: null,
      toastTimer: null,
      scrub: { target: null, timer: null, last: 0, start: 0 }
    };

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    function fmt(sec) {
      sec = Math.max(0, Math.floor(sec || 0));
      var h = Math.floor(sec / 3600);
      var m = Math.floor((sec % 3600) / 60);
      var x = sec % 60;
      return h ? h + ":" + pad(m) + ":" + pad(x) : m + ":" + pad(x);
    }

    function position() {
      var s = session;
      try {
        return (s && s.player && s.player.getPosition()) || 0;
      } catch (e) {
        return 0;
      }
    }

    function isPlaying() {
      var s = session;
      try {
        var st = s && s.player ? s.player.getState() : "";
        return st === "playing" || st === "buffering";
      } catch (e) {
        return false;
      }
    }

    function buildUI() {
      if (ui.$el) {
        return;
      }
      ui.$el = $(
        '<div id="xtvPlayerUI">' +
          '<div class="xp-shade"></div>' +
          '<div class="xp-top"><div class="xp-title"></div></div>' +
          '<div class="xp-bottom">' +
          '<div class="xp-bar"><div class="xp-track"><div class="xp-fill"></div><div class="xp-knob"></div></div><div class="xp-tip"></div></div>' +
          '<div class="xp-row"><div class="xp-btns"></div><div class="xp-time"></div></div>' +
          "</div>" +
          '<div class="xp-menu"></div>' +
          '<div class="xp-toast"></div>' +
          "</div>"
      );
      $("body").append(ui.$el);
      // Con el puntero (Magic Remote): moverlo muestra la barra
      $(document).on("mousemove", function () {
        if (session && XTV.state.layer === "video" && XTV.pointer && XTV.pointer.isActive()) {
          uiShow();
        }
      });
      ui.$el.on("click", ".xp-btn", function () {
        ui.zone = "btn";
        ui.btn = $(this).index();
        activate();
      });
      ui.$el.on("click", ".xp-opt", function () {
        if (ui.menu) {
          ui.menu.col = parseInt(this.getAttribute("data-col"), 10) || 0;
          ui.menu.idx[ui.menu.col] = parseInt(this.getAttribute("data-i"), 10) || 0;
          applyPanel();
          uiRender();
        }
      });
      ui.$el.on("click", ".xp-track", function (e) {
        var s = session;
        var dur = s ? durationOf(s) : 0;
        var r = this.getBoundingClientRect();
        if (dur > 0 && r.width > 0) {
          ui.scrub.target = Math.max(0, Math.min(dur - 1, ((e.clientX - r.left) / r.width) * dur));
          commitScrub();
        }
      });
    }

    function castButton() {
      var s = session;
      if (!s || !s.player) {
        return null;
      }
      try {
        var $c = $(s.player.getContainer());
        if (!$c.hasClass("jw-flag-cast-available") && !$c.hasClass("jw-flag-airplay-available")) {
          return null;
        }
        var $b = $c.find("google-cast-launcher, .jw-icon-cast, .jw-icon-airplay").first();
        return $b.length ? $b.get(0) : null;
      } catch (e) {
        return null;
      }
    }

    function captions() {
      var s = session;
      var list = [];
      var cur = 0;
      try {
        list = s.player.getCaptionsList() || [];
        cur = s.player.getCurrentCaptions() || 0;
      } catch (e) {}
      return { list: list, cur: cur };
    }

    function captionLabel(track, i) {
      if (!i) {
        return "Desactivados";
      }
      return (track && track.label) || "Subtítulos " + i;
    }

    // Botones según lo que ofrece esta película / equipo
    function buttons() {
      var b = [{ id: "play", icon: isPlaying() ? "pause" : "play", label: isPlaying() ? "Pausa" : "Reproducir" }];
      b.push({ id: "restart", icon: "restart", label: "Desde el inicio" });
      var c = captions();
      if (c.list.length > 1) {
        b.push({ id: "captions", icon: "cc", label: "Subtítulos: " + captionLabel(c.list[c.cur], c.cur) });
      }
      if (castButton()) {
        b.push({ id: "cast", icon: "cast", label: "Transmitir" });
      }
      return b;
    }

    function uiRender() {
      var s = session;
      if (!ui.$el || !s) {
        return;
      }
      ui.$el.toggleClass("on", ui.shown);
      $("body").toggleClass("xtv-player-ui", ui.shown);
      if (!ui.shown) {
        return;
      }
      var list = buttons();
      if (ui.btn >= list.length) {
        ui.btn = list.length - 1;
      }
      var h = "";
      for (var i = 0; i < list.length; i++) {
        var f = ui.zone === "btn" && i === ui.btn;
        h +=
          '<div class="xp-btn' + (f ? " onFocus" : "") + '" data-id="' + list[i].id + '">' +
          XTV.icon(list[i].icon, "xp-icon") +
          "<span>" + util.esc(list[i].label) + "</span></div>";
      }
      ui.$el.find(".xp-btns").html(h);
      ui.$el.find(".xp-bar").toggleClass("onFocus", ui.zone === "bar");
      // Panel de subtítulos: Idioma | Tamaño | Color
      var $menu = ui.$el.find(".xp-menu");
      if (ui.menu) {
        var cols = panelColumns();
        var m = "";
        for (var c = 0; c < cols.length; c++) {
          m += '<div class="xp-col' + (c === ui.menu.col ? " active" : "") + '"><div class="xp-col-h">' + cols[c].title + "</div>";
          for (var j = 0; j < cols[c].items.length; j++) {
            var sel = j === ui.menu.idx[c];
            m +=
              '<div class="xp-opt' + (sel && c === ui.menu.col ? " onFocus" : "") + (sel ? " current" : "") +
              '" data-col="' + c + '" data-i="' + j + '">' +
              (sel ? XTV.icon("check", "xp-icon") : '<span class="xp-icon"></span>') +
              "<span>" + util.esc(cols[c].items[j]) + "</span></div>";
          }
          m += "</div>";
        }
        $menu.html(m).addClass("on");
        var $btn = ui.$el.find('.xp-btn[data-id="captions"]');
        if ($btn.length) {
          $menu.css("left", $btn.get(0).offsetLeft + "px");
        }
      } else {
        $menu.removeClass("on").empty();
      }
      uiTick();
    }

    function uiTick() {
      var s = session;
      if (!ui.$el || !ui.shown || !s) {
        return;
      }
      var dur = durationOf(s);
      var pos = position();
      var shownPos = ui.scrub.target !== null ? ui.scrub.target : pos;
      var pct = dur > 0 ? Math.max(0, Math.min(100, (shownPos / dur) * 100)) : 0;
      ui.$el.find(".xp-fill").css("width", pct + "%");
      ui.$el.find(".xp-knob").css("left", pct + "%");
      var $tip = ui.$el.find(".xp-tip");
      if (ui.scrub.target !== null) {
        var delta = ui.scrub.target - pos;
        $tip
          .text(fmt(ui.scrub.target) + "  (" + (delta >= 0 ? "+" : "−") + fmt(Math.abs(delta)) + ")")
          .css("left", pct + "%")
          .addClass("on");
      } else {
        $tip.removeClass("on");
      }
      ui.$el.find(".xp-time").text(fmt(shownPos) + " / " + fmt(dur));
    }

    function scheduleHide() {
      clearTimeout(ui.hideTimer);
      ui.hideTimer = setTimeout(function () {
        // Pausado, con el menú abierto o eligiendo destino, la barra se queda
        if (session && isPlaying() && !ui.menu && ui.scrub.target === null) {
          uiHide();
        } else if (session) {
          scheduleHide();
        }
      }, C.PLAYER_UI_HIDE_MS);
    }

    function uiShow(zone) {
      if (!session || !ui.$el) {
        return;
      }
      if (!ui.shown) {
        ui.shown = true;
        ui.zone = zone || "bar";
      }
      uiRender();
      scheduleHide();
    }

    function uiHide() {
      ui.shown = false;
      ui.menu = null;
      ui.zone = "bar";
      clearTimeout(ui.hideTimer);
      uiRender();
    }

    function uiStart(s) {
      buildUI();
      ui.btn = 0;
      ui.menu = null;
      ui.scrub.target = null;
      ui.$el.find(".xp-title").text(util.plain(s.item.title));
      ui.$el.addClass("active");
      uiShow("bar");
    }

    function uiStop() {
      clearTimeout(ui.scrub.timer);
      clearTimeout(ui.hideTimer);
      ui.scrub.target = null;
      ui.menu = null;
      ui.shown = false;
      if (ui.$el) {
        ui.$el.removeClass("on active");
      }
      $("body").removeClass("xtv-player-ui");
    }

    function toast(text) {
      if (!ui.$el) {
        return;
      }
      var $t = ui.$el.find(".xp-toast");
      $t.text(text).addClass("on");
      clearTimeout(ui.toastTimer);
      ui.toastTimer = setTimeout(function () {
        $t.removeClass("on");
      }, 2500);
    }

    /* Adelantar / atrasar acumulando */
    function scrub(dir, long) {
      var s = session;
      if (!s || !s.player || s.loading) {
        return;
      }
      var sc = ui.scrub;
      var now = new Date().getTime();
      if (now - sc.last > C.SEEK_CHAIN_MS) {
        sc.start = now;
      }
      sc.last = now;
      var step = C.SEEK_SHORT_SECONDS;
      var acc = C.SEEK_ACCEL || [];
      for (var i = 0; i < acc.length; i++) {
        if (now - sc.start >= acc[i][0]) {
          step = acc[i][1];
        }
      }
      if (long) {
        step = Math.max(step, C.SEEK_LONG_SECONDS);
      }
      var dur = durationOf(s);
      var base = sc.target !== null ? sc.target : position();
      var t = Math.max(0, base + dir * step);
      if (dur > 0) {
        t = Math.min(t, dur - 1);
      }
      sc.target = t;
      uiShow("bar");
      ui.zone = "bar";
      uiRender();
      clearTimeout(sc.timer);
      sc.timer = setTimeout(commitScrub, C.SEEK_COMMIT_MS);
    }

    function commitScrub() {
      var s = session;
      var sc = ui.scrub;
      clearTimeout(sc.timer);
      if (!s || !s.player || sc.target === null) {
        sc.target = null;
        return;
      }
      var t = sc.target;
      sc.target = null;
      try {
        s.player.seek(t);
        s.tracking = true;
      } catch (e) {}
      uiRender();
      scheduleHide();
    }

    function cancelScrub() {
      clearTimeout(ui.scrub.timer);
      ui.scrub.target = null;
      uiRender();
    }

    function restart() {
      var s = session;
      if (!s || !s.player) {
        return;
      }
      cancelScrub();
      try {
        s.player.seek(0);
        s.tracking = true;
        if (!isPlaying()) {
          s.player.play();
        }
      } catch (e) {}
      toast("Desde el inicio");
      uiRender();
    }

    /* Estilo de subtítulos: tamaño y color, guardados en la TV.
     * Se aplica con clases en <body>: el CSS cubre tanto los subtítulos que
     * dibuja el reproductor (LG, PC) como los que dibuja la TV (Samsung). */
    var CAP_SIZES = [
      { id: "s", label: "Pequeño" },
      { id: "m", label: "Mediano" },
      { id: "l", label: "Grande" },
      { id: "xl", label: "Extra grande" }
    ];
    var CAP_COLORS = [
      { id: "white", label: "Blanco" },
      { id: "yellow", label: "Amarillo" }
    ];
    var CAP_SIZE_KEY = "xtv_cap_size";
    var CAP_COLOR_KEY = "xtv_cap_color";

    function indexOfId(list, id, def) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) {
          return i;
        }
      }
      return def;
    }

    function capStyle() {
      return {
        size: indexOfId(CAP_SIZES, XTV.storage.get(CAP_SIZE_KEY), 1),
        color: indexOfId(CAP_COLORS, XTV.storage.get(CAP_COLOR_KEY), 0)
      };
    }

    function applyCapStyle() {
      var st = capStyle();
      var $b = $("body");
      for (var i = 0; i < CAP_SIZES.length; i++) {
        $b.removeClass("xtv-cap-" + CAP_SIZES[i].id);
      }
      for (var j = 0; j < CAP_COLORS.length; j++) {
        $b.removeClass("xtv-cap-" + CAP_COLORS[j].id);
      }
      $b.addClass("xtv-cap-" + CAP_SIZES[st.size].id).addClass("xtv-cap-" + CAP_COLORS[st.color].id);
    }
    applyCapStyle();

    function panelColumns() {
      var c = captions();
      var langs = [];
      for (var i = 0; i < c.list.length; i++) {
        langs.push(captionLabel(c.list[i], i));
      }
      var sizes = [];
      for (var j = 0; j < CAP_SIZES.length; j++) {
        sizes.push(CAP_SIZES[j].label);
      }
      var colors = [];
      for (var k = 0; k < CAP_COLORS.length; k++) {
        colors.push(CAP_COLORS[k].label);
      }
      return [
        { title: "Idioma", items: langs },
        { title: "Tamaño", items: sizes },
        { title: "Color", items: colors }
      ];
    }

    function openCaptions() {
      var c = captions();
      if (c.list.length < 2) {
        return;
      }
      var st = capStyle();
      ui.menu = { col: 0, idx: [c.cur, st.size, st.color] };
      ui.zone = "menu";
      uiRender();
    }

    // Aplica en el acto lo elegido en la columna activa
    function applyPanel() {
      var m = ui.menu;
      if (!m) {
        return;
      }
      if (m.col === 0) {
        if (captions().cur !== m.idx[0]) {
          setCaptions(m.idx[0]);
        }
      } else if (m.col === 1) {
        XTV.storage.set(CAP_SIZE_KEY, CAP_SIZES[m.idx[1]].id);
        applyCapStyle();
      } else {
        XTV.storage.set(CAP_COLOR_KEY, CAP_COLORS[m.idx[2]].id);
        applyCapStyle();
      }
    }

    function setCaptions(i) {
      var s = session;
      var c = captions();
      if (!s || i < 0 || i >= c.list.length) {
        return;
      }
      try {
        s.player.setCurrentCaptions(i);
      } catch (e) {}
      XTV.storage.set(CAPS_KEY, i ? c.list[i].label || "" : "off");
      toast("Subtítulos: " + captionLabel(c.list[i], i));
    }

    function closePanel() {
      ui.menu = null;
      ui.zone = "btn";
      uiRender();
    }

    // Azul: pasa al siguiente (incluye "Desactivados")
    function nextCaptions() {
      var c = captions();
      if (c.list.length < 2) {
        return;
      }
      setCaptions((c.cur + 1) % c.list.length);
      uiRender();
    }

    function activate() {
      var list = buttons();
      var b = list[ui.btn];
      if (!b) {
        return;
      }
      if (b.id === "play") {
        togglePlay();
      } else if (b.id === "restart") {
        restart();
      } else if (b.id === "captions") {
        openCaptions();
      } else if (b.id === "cast") {
        var el = castButton();
        if (el) {
          try {
            el.click();
          } catch (e) {}
        }
      }
      uiRender();
    }

    function handleKey(action) {
      var s = session;
      if (action === "STOP") {
        stop(true);
        return true;
      }
      if (!s) {
        return true;
      }
      var wasShown = ui.shown;
      if (action !== "BACK") {
        uiShow();
      } else {
        scheduleHide();
      }

      // Teclas que hacen lo mismo en cualquier lugar
      switch (action) {
        case "PLAY":
          togglePlay("play");
          uiRender();
          return true;
        case "PAUSE":
          togglePlay("pause");
          uiRender();
          return true;
        case "PLAYPAUSE":
        case "SPACE":
          togglePlay();
          uiRender();
          return true;
        case "RW":
          if (ui.zone !== "menu") {
            scrub(-1, true);
          }
          return true;
        case "FF":
          if (ui.zone !== "menu") {
            scrub(1, true);
          }
          return true;
        case "BLUE":
          nextCaptions();
          return true;
      }

      // Panel de subtítulos abierto: izquierda/derecha cambian de columna,
      // arriba/abajo eligen (se aplica en el acto), OK o Volver cierran
      if (ui.zone === "menu" && ui.menu) {
        var m = ui.menu;
        var cols = panelColumns();
        if (action === "LEFT") {
          m.col = Math.max(0, m.col - 1);
        } else if (action === "RIGHT") {
          m.col = Math.min(cols.length - 1, m.col + 1);
        } else if (action === "UP" || action === "DOWN") {
          var n = cols[m.col].items.length;
          m.idx[m.col] = Math.max(0, Math.min(n - 1, m.idx[m.col] + (action === "UP" ? -1 : 1)));
          applyPanel();
        } else if (action === "OK" || action === "BACK") {
          closePanel();
          return true;
        }
        uiRender();
        return true;
      }

      if (action === "BACK") {
        if (ui.scrub.target !== null) {
          cancelScrub(); // Volver mientras se elige destino: se queda donde estaba
        } else if (wasShown) {
          uiHide();
        } else {
          stop(true);
        }
        return true;
      }

      // Barra de progreso
      if (ui.zone === "bar") {
        switch (action) {
          case "LEFT":
            scrub(-1, false);
            return true;
          case "RIGHT":
            scrub(1, false);
            return true;
          case "OK":
            if (!wasShown) {
              return true; // la primera tecla solo muestra la barra
            }
            if (ui.scrub.target !== null) {
              commitScrub();
            } else {
              togglePlay();
            }
            uiRender();
            return true;
          case "DOWN":
            if (wasShown) {
              commitScrub();
              ui.zone = "btn";
              uiRender();
            }
            return true;
        }
        return true;
      }

      // Botones
      switch (action) {
        case "LEFT":
          ui.btn = Math.max(0, ui.btn - 1);
          break;
        case "RIGHT":
          ui.btn = Math.min(buttons().length - 1, ui.btn + 1);
          break;
        case "UP":
          ui.zone = "bar";
          break;
        case "OK":
          activate();
          return true;
      }
      uiRender();
      return true;
    }

    XTV.player = {
      preload: loadLibrary,
      play: play,
      stop: stop,
      flush: flush,
      lookupResume: lookupResume,
      handleKey: handleKey,
      isActive: function () {
        return !!session;
      }
    };
  })(window.jQuery, window.XTV);
}
