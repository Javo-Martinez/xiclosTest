/*
 * Xiclos TV v2 - plataforma Amazon (encendida: ver AMAZON_V2 en common/js/jquery.min.js)
 * Este archivo mantiene su nombre porque lo carga el index.html empaquetado.
 * En Amazon (mientras siga con la versión anterior) carga la copia de amazon/legacy/js/amazon.js.
 * ES5 puro.
 */
if (window.XTV_BOOT && window.XTV_BOOT.legacy) {
  window.XTV_BOOT.loadAmazon("amazon.js");
} else {
  /*
   * Xiclos TV v2 - plataforma Amazon Fire TV (Fire OS)
   * Se apaga con AMAZON_V2 = false en common/js/jquery.min.js.
   * Basado en lo que hoy hace amazon/js/amazon.js y amazon/js/keycode.js.
   * Sin probar en un Fire TV: validar antes de activarlo.
   * ES5 puro.
   */
  (function (XTV) {
    "use strict";

    var lastBack = 0;

    XTV.platform = {
      name: "amazon",

      // Códigos propios del control de Fire TV (amazon/js/keycode.js)
      keys: {
        27: "BACK",
        8: "BACK",
        179: "PLAYPAUSE",
        227: "RW",
        228: "FF",
        9: "DONE"
      },

      init: function () {
        // El index.html de Amazon carga su propio custom.css; la v2 usa el común
        try {
          var links = document.getElementsByTagName("link");
          var hasCommon = false;
          for (var i = 0; i < links.length; i++) {
            var href = links[i].href || "";
            if (/amazon\/css\/custom\.css/.test(href)) {
              links[i].disabled = true;
            }
            if (/common\/css\/custom\.css/.test(href)) {
              hasCommon = true;
            }
          }
          if (!hasCommon) {
            var link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = (window.XTV_BOOT ? window.XTV_BOOT.root : "../") + "common/css/custom.css";
            document.getElementsByTagName("head")[0].appendChild(link);
          }
        } catch (e) {}

        // El index.html de Amazon no trae la pieza de marca (triángulo y logo)
        // que sí traen los de LG y Samsung: se crea acá.
        try {
          var body = document.body;
          if (!document.querySelector(".triangle")) {
            var tri = document.createElement("div");
            tri.className = "triangle";
            body.insertBefore(tri, body.firstChild);
          }
          if (!document.getElementById("result")) {
            var res = document.createElement("div");
            res.id = "result";
            var img = document.createElement("img");
            img.src = (XTV.config && XTV.config.IMG ? XTV.config.IMG : "https://xiclos.com/tv/common/img/") + "logo.png";
            img.alt = "Xiclos";
            res.appendChild(img);
            var main = document.getElementById("mainContainer");
            body.insertBefore(res, main ? main.nextSibling : null);
          }
          // Contenedor de la versión anterior, sin uso en la v2
          var old = document.getElementById("results");
          if (old) {
            old.style.display = "none";
          }
        } catch (e) {}

        // El botón Volver del Fire TV puede llegar como cambio de historial
        // (el index.html de Amazon ya mantiene un estado en el historial).
        document.addEventListener(
          "keydown",
          function (e) {
            if (e.keyCode === 27 || e.keyCode === 8) {
              lastBack = new Date().getTime();
            }
          },
          true
        );
        window.addEventListener("popstate", function () {
          if (new Date().getTime() - lastBack > 400 && XTV.app && XTV.app.dispatch) {
            XTV.app.dispatch("BACK");
          }
        });
      },

      afterLogin: function () {},

      getTVInfo: function (callback) {
        callback({ deviceId: "Unknown", platform: "Amazon Platform" });
      },

      // Cierra la app (mismo método que usaba la versión anterior)
      exit: function () {
        try {
          window.open("", "_self").close();
        } catch (e) {
          try {
            window.close();
          } catch (e2) {}
        }
      },

      hide: function () {
        this.exit();
      }
    };
  })(window.XTV);
}
