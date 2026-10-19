/*
 * Xiclos TV v2 - arranque y manejador único de teclas
 * Este archivo mantiene su nombre porque lo carga el index.html empaquetado.
 * En Amazon (mientras siga con la versión anterior) carga la copia de common/legacy/js/arrows.js.
 * ES5 puro.
 */
if (window.XTV_BOOT && window.XTV_BOOT.legacy) {
  window.XTV_BOOT.load("arrows.js");
} else {
  /*
   * Xiclos TV v2 - arranque y despacho de teclas
   * Un único manejador de teclas. Según la capa activa, la tecla va a un
   * solo destino; no hay casos que "se caigan" al siguiente.
   * ES5 puro.
   */
  (function ($, XTV) {
    "use strict";

    var lastNav = { action: null, time: 0 };
    var NAV_REPEAT_MS = 60; // descarta repeticiones demasiado rápidas del control

    // Si hay un video, primero se guarda la posición (máximo 1,5 s)
    function afterFlush(go) {
      var pending = XTV.player && XTV.player.flush ? XTV.player.flush() : null;
      if (pending && pending.always) {
        var t = setTimeout(go, 1500);
        pending.always(function () {
          clearTimeout(t);
          go();
        });
      } else {
        go();
      }
    }

    // Cierra la app (Salir, EXIT y también HOME)
    var quitting = false;
    function quit() {
      if (quitting) {
        return;
      }
      quitting = true;
      afterFlush(function () {
        try {
          XTV.platform.exit();
        } catch (e) {}
        // Si el sistema no la cerró, se puede volver a intentar
        setTimeout(function () {
          quitting = false;
        }, 2000);
      });
    }

    /*
     * HOME: el televisor no cierra la app, la deja en segundo plano, y al
     * volver aparecía donde estaba (por ejemplo, con el video trabado).
     * Ahora, al pasar a segundo plano se cierra como con Salir; y si el
     * sistema igual la mantiene viva, al volver arranca de cero.
     */
    var wentHidden = false;
    function isTV() {
      var n = XTV.platform && XTV.platform.name;
      return n === "webos" || n === "tizen" || n === "amazon";
    }
    function onVisibility() {
      if (!isTV()) {
        return;
      }
      if (document.hidden || document.webkitHidden) {
        wentHidden = true;
        quit();
      } else if (wentHidden) {
        wentHidden = false;
        window.location.reload();
      }
    }

    function dispatch(action, event) {
      // Teclas globales
      if (action === "EXIT") {
        quit();
        return true;
      }
      if (action === "INFO") {
        afterFlush(function () {
          window.location.reload();
        });
        return true;
      }

      // Sin conexión: solo se puede salir
      if (XTV.net.isOffline()) {
        return true;
      }

      // Un mensaje breve se cierra con cualquier tecla
      if (XTV.message.isVisible()) {
        XTV.message.hide();
        return true;
      }

      // Operación en curso: Volver la cancela, el resto se ignora
      if (XTV.busy.active()) {
        if (action === "BACK") {
          XTV.busy.cancel();
        }
        return true;
      }

      switch (XTV.state.layer) {
        case "modal":
          return XTV.modal.handleKey(action, event);
        case "menu":
          return XTV.menu.handleKey(action);
        case "grid":
          return XTV.grid.handleKey(action);
        case "video":
          return XTV.player.handleKey(action);
        case "search":
          return XTV.search.handleKey(action, event);
        case "browse":
          return XTV.browse.handleKey(action);
        case "pin":
          return XTV.login.handleKey(action);
        default:
          return action === "BACK";
      }
    }

    function onKeyDown(event) {
      var action = XTV.keys.action(event);
      if (!action) {
        return;
      }
      XTV.pointer.keyPressed();
      if (XTV.keys.isNav(action)) {
        var t = XTV.util.now();
        if (action === lastNav.action && t - lastNav.time < NAV_REPEAT_MS) {
          event.preventDefault();
          return;
        }
        lastNav.action = action;
        lastNav.time = t;
      }
      var handled = false;
      try {
        handled = dispatch(action, event);
      } catch (e) {
        XTV.log.error("key-" + action, null, { message: e && e.message, layer: XTV.state.layer });
        handled = true;
      }
      if (handled) {
        event.preventDefault();
        // Evita que el player u otros componentes procesen la misma tecla
        event.stopPropagation();
      }
    }

    function showChrome() {
      // Amazon: oculta el fondo de inicio de su index.html
      $("#results.initApp").hide();
      $("#div_vimeo_player, #mainContainer, #result, #logoXiclos, .trapezium, .trapezium2, .triangle").css(
        "display",
        "block"
      );
    }

    XTV.app = {
      // Para acciones que no llegan como tecla (por ejemplo, Volver en Amazon)
      dispatch: function (action) {
        try {
          return dispatch(action, null);
        } catch (e) {
          XTV.log.error("dispatch-" + action, null, { message: e && e.message });
          return true;
        }
      },

      boot: function () {
        if (XTV.app.booted) {
          return;
        }
        XTV.app.booted = true;
        $("body").addClass("xtv");
        // Pesos de Roboto que usa el diseño (el index.html solo carga el 400)
        $("head").append('<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500&amp;display=swap">');
        XTV.net.init();
        XTV.pointer.init();
        try {
          XTV.platform.init();
        } catch (e) {
          XTV.log.error("platform-init", null, { message: e && e.message });
        }
        // Fase de captura: el handler corre antes que el del player
        window.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("visibilitychange", onVisibility);
        document.addEventListener("webkitvisibilitychange", onVisibility);
        // LG: volver a abrir la app mientras seguía viva en segundo plano
        document.addEventListener("webOSRelaunch", function () {
          if (wentHidden || XTV.state.layer === "video") {
            window.location.reload();
          }
        });
        // La librería del player se pide en segundo plano
        XTV.player.preload();
        XTV.setLayer("boot");
        XTV.login.start();
      },

      quit: quit,

      enterMain: function () {
        showChrome();
        try {
          XTV.platform.afterLogin();
        } catch (e) {}
        if (XTV.storage.get("debug_mode") === "on") {
          if (!$("#debugMode").length) {
            $("body").append("<div id='debugMode'>TESTER MODE</div>");
          }
        } else {
          $("#debugMode").remove();
        }
        XTV.menu.build();
        XTV.grid.goHome(true);
      }
    };

  })(window.jQuery, window.XTV);
}
