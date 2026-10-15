/*
 * Xiclos TV v2 - navegador de PC (pruebas)
 * Este archivo mantiene su nombre porque lo carga el index.html empaquetado.
 * ES5 puro.
 */
/*
 * Xiclos TV v2 - navegador de PC (para pruebas)
 * Flechas, Enter y Escape (Volver) funcionan con el teclado.
 * ES5 puro.
 */
(function (XTV) {
  "use strict";

  XTV.platform = {
    name: "desktop",
    init: function () {},
    afterLogin: function () {},
    getTVInfo: function (callback) {
      callback({ deviceId: "Desktop", platform: "Desktop" });
    },
    exit: function () {
      XTV.log.info("[XTV] Salir (en una TV cerraría la app)");
    },
    hide: function () {
      this.exit();
    }
  };
})(window.XTV);
