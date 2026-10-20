/*
 * Xiclos TV v2 - plataforma Samsung (Tizen)
 * Este archivo mantiene su nombre porque lo carga el index.html empaquetado.
 * ES5 puro.
 */
/*
 * Xiclos TV v2 - plataforma Samsung (Tizen)
 * ES5 puro.
 */
(function (XTV) {
  "use strict";

  var KEYS = [
    "MediaPlay",
    "MediaPause",
    "MediaPlayPause",
    "MediaStop",
    "MediaRewind",
    "MediaFastForward",
    "MediaTrackPrevious",
    "MediaTrackNext",
    "Exit",
    "Info",
    "ColorF3Blue",
    "ColorF2Yellow",
    "Caption",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
  ];

  XTV.platform = {
    name: "tizen",

    init: function () {
      if (!window.tizen || !window.tizen.tvinputdevice) {
        return;
      }
      for (var i = 0; i < KEYS.length; i++) {
        try {
          window.tizen.tvinputdevice.registerKey(KEYS[i]);
        } catch (e) {
          // Algunas teclas no existen en todos los modelos
        }
      }
    },

    afterLogin: function () {
      // Igual que la versión anterior: el reproductor se comporta mejor
      // con este user agent en los modelos más viejos.
      try {
        window.tizen.websetting.setUserAgentString(
          "Mozilla/5.0 (Linux; Tizen 2.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36"
        );
      } catch (e) {}
    },

    getTVInfo: function (callback) {
      var info = { deviceId: "Unknown", platform: "TIZEN" };
      try {
        if (window.webapis && window.webapis.productinfo && window.webapis.productinfo.getDuid) {
          info.deviceId = window.webapis.productinfo.getDuid();
        } else {
          var caps = window.tizen.systeminfo.getCapabilities();
          info.deviceId = caps.duid;
          info.platform = caps.platformName || info.platform;
        }
      } catch (e) {}
      callback(info);
    },

    // "Salir": cierra la app (antes solo la ocultaba y al volver a abrirla
    // aparecía donde había quedado)
    exit: function () {
      try {
        window.tizen.application.getCurrentApplication().exit();
      } catch (e) {
        try {
          window.tizen.application.getCurrentApplication().hide();
        } catch (e2) {}
      }
    },

    hide: function () {
      this.exit();
    }
  };
})(window.XTV);
