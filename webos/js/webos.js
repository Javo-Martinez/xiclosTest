/*
 * Xiclos TV v2 - plataforma LG (webOS)
 * Este archivo mantiene su nombre porque lo carga el index.html empaquetado.
 * ES5 puro.
 */
/*
 * Xiclos TV v2 - plataforma LG (webOS)
 * ES5 puro.
 */
(function (XTV) {
  "use strict";

  XTV.platform = {
    name: "webos",

    init: function () {},

    afterLogin: function () {},

    getTVInfo: function (callback) {
      var fallback = { deviceId: "Unknown", platform: "WebOS" };
      try {
        if (window.webOS && window.webOS.deviceInfo) {
          window.webOS.deviceInfo(function (info) {
            callback({ deviceId: (info && info.modelName) || "Unknown", platform: "WebOS" });
          });
          return;
        }
      } catch (e) {}
      callback(fallback);
    },

    // "Salir": cierra la app. platformBack() solo volvía al inicio de la TV
    // y la app seguía abierta en segundo plano.
    exit: function () {
      try {
        window.close();
      } catch (e) {}
      // Si el sistema no la cerró, al menos vuelve al inicio de la TV
      setTimeout(function () {
        try {
          if (window.webOS && window.webOS.platformBack) {
            window.webOS.platformBack();
          }
        } catch (e) {}
      }, 300);
    },

    hide: function () {
      this.exit();
    }
  };
})(window.XTV);
