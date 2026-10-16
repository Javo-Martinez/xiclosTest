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
   * - Teclas: OK / Play / Pausa / Play-Pausa, izquierda-derecha (10 s),
   *   adelantar-retroceder (30 s), azul (subtítulos), Volver / Stop (salir).
   * - El progreso se guarda cada 15 s, al pausar y al salir. Al pasar el
   *   95 % se borra del historial, como antes.
   *
   * ES5 puro.
   */
  (function ($, XTV) {
    "use strict";

    var C = XTV.config;
    var P = XTV.paths;
    var CONTAINER_ID = "div_vimeo_player";

    var ua = navigator.userAgent || "";
    var isLG = /web0s|webos/i.test(ua);
    // Mismo criterio que la versión anterior
    var renderCaptionsNatively = !/chrome|chromium|crios/i.test(ua);

    var session = null; // reproducción en curso
    var gen = 0;
    var library = null;

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
    function saveProgress(s, seconds) {
      if (!s || s.done || !s.tracking) {
        return;
      }
      seconds = Math.floor(seconds);
      if (seconds <= 0) {
        return;
      }
      s.lastSaved = seconds;
      XTV.api
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
    }

    function markDone(s) {
      if (!s || s.done) {
        return;
      }
      s.done = true;
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
    function play(item) {
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

      var history = XTV.api.get(P.setHistory, { movieId: item.movieId, resumePoint: 0 }, "player");

      $.when(loadLibrary(), history)
        .done(function (libArgs, historyArgs) {
          if (!alive()) {
            return;
          }
          var res = historyArgs && historyArgs[0];
          var data = (res && res.data) || {};
          s.resumePoint = Math.max(0, parseFloat(data.resumePoint) || 0);
          s.progressId = data.progressId;
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
      });

      player.on("firstFrame", function () {
        if (session !== s) {
          return;
        }
        if (s.resumePoint > 5) {
          var doSeek = function () {
            if (session === s) {
              player.seek(s.resumePoint);
            }
          };
          if (isLG) {
            setTimeout(doSeek, 500);
          } else {
            doSeek();
          }
        } else {
          s.tracking = true;
        }
      });

      player.on("seeked", function () {
        s.tracking = true;
      });

      player.on("time", function (e) {
        if (session !== s || s.done) {
          return;
        }
        var pos = e.position || 0;
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

      player.on("captionsList", function (list) {
        if (list && list.tracks && list.tracks.length > 1) {
          try {
            player.setCurrentCaptions(1);
          } catch (e) {}
        }
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
      if (s && XTV.state.layer === "video") {
        XTV.setLayer(s.returnLayer || "grid");
        XTV.refocus();
      }
    }

    function seekBy(seconds) {
      var s = session;
      if (!s || !s.player || s.loading) {
        return;
      }
      try {
        var pos = s.player.getPosition() || 0;
        var dur = durationOf(s);
        var target = Math.max(0, pos + seconds);
        if (dur > 0) {
          target = Math.min(target, dur - 1);
        }
        s.player.seek(target);
      } catch (e) {}
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

    function nextCaptions() {
      var s = session;
      if (!s || !s.player || s.loading) {
        return;
      }
      try {
        var list = s.player.getCaptionsList() || [];
        if (!list.length) {
          return;
        }
        var next = s.player.getCurrentCaptions() + 1;
        if (next >= list.length) {
          next = 0;
        }
        s.player.setCurrentCaptions(next);
      } catch (e) {}
    }

    function handleKey(action) {
      switch (action) {
        case "BACK":
        case "STOP":
          stop(true);
          return true;
        case "OK":
        case "SPACE":
        case "PLAYPAUSE":
          togglePlay();
          return true;
        case "PLAY":
          togglePlay("play");
          return true;
        case "PAUSE":
          togglePlay("pause");
          return true;
        case "LEFT":
          seekBy(-C.SEEK_SHORT_SECONDS);
          return true;
        case "RIGHT":
          seekBy(C.SEEK_SHORT_SECONDS);
          return true;
        case "RW":
          seekBy(-C.SEEK_LONG_SECONDS);
          return true;
        case "FF":
          seekBy(C.SEEK_LONG_SECONDS);
          return true;
        case "BLUE":
          nextCaptions();
          return true;
        case "UP":
        case "DOWN":
          return true;
      }
      return false;
    }

    XTV.player = {
      preload: loadLibrary,
      play: play,
      stop: stop,
      handleKey: handleKey,
      isActive: function () {
        return !!session;
      }
    };
  })(window.jQuery, window.XTV);
}
