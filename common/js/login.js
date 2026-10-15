/*
 * Xiclos TV v2 - PIN, sesión y checkLogin()
 * Este archivo mantiene su nombre porque lo carga el index.html empaquetado.
 * En Amazon (mientras siga con la versión anterior) carga la copia de common/legacy/js/login.js.
 * ES5 puro.
 */
if (window.XTV_BOOT && window.XTV_BOOT.legacy) {
  window.XTV_BOOT.load("login.js");
} else {
  /*
   * Xiclos TV v2 - sincronización por PIN y sesión
   * Mismo flujo que la versión anterior, con estos cambios:
   * - Un error de red ya no borra la sincronización: se reintenta.
   * - Mientras se muestra el PIN, se consulta solo cada 10 s si el usuario
   *   ya lo ingresó (el botón "Sincronizar ahora" sigue funcionando).
   * - Cerrar sesión espera a que el backend confirme antes de recargar.
   * ES5 puro.
   */
  (function ($, XTV) {
    "use strict";

    var C = XTV.config;
    var P = XTV.paths;
    var util = XTV.util;

    var pinState = null; // { id, pin, seconds, countdown, poll }

    /* ----------------------------------------------------------------------
     * Pantalla del PIN
     * -------------------------------------------------------------------- */
    function clearPinTimers() {
      if (pinState) {
        if (pinState.countdown) {
          clearInterval(pinState.countdown);
        }
        if (pinState.poll) {
          clearInterval(pinState.poll);
        }
      }
    }

    function renderPin() {
      var $modal = $("#modalPin");
      if ($modal.length) {
        $modal.find("#pin").text(pinState.pin);
        $modal.find("#time").text(Math.max(0, pinState.seconds));
        return;
      }
      $("body").append(
        "<div id='modalPin' class='simpleModal'><p class='customMessage'>" +
          "<img src='" +
          util.esc(C.IMG + "logo.png") +
          "'>" +
          "<br/><br/>POR FAVOR, DESDE UNA PC O UN DISPOSITIVO MÓVIL" +
          "<br/>DIRIGITE AL SITIO WEB <span class='pinMessage'>xiclos.com</span>" +
          "<br/>CLICKEA EN LA PESTAÑA SINCRONIZAR DISPOSITIVO (PARA VERLA DEBE ESTAR LOGUEADO)" +
          "<br/> E INGRESÁ EL SIGUIENTE CÓDIGO <span class='pinMessage' id='pin'>" +
          util.esc(pinState.pin) +
          "</span> PARA SINCRONIZAR ESTE DISPOSITIVO CON TU CUENTA." +
          "<br/> RENOVAREMOS EL CÓDIGO EN <span class='pinMessage' id='time'>" +
          Math.max(0, pinState.seconds) +
          "</span> SEGUNDOS" +
          "<br/><br/> <button class='confirmField onFocus' id='syncNow'>Sincronizar Ahora</button></p></div>"
      );
      $("#syncNow").on("click", function () {
        checkLinkDevice(true);
      });
    }

    function helper(text) {
      var $h = $("#helperMsg");
      if (!$h.length) {
        $h = $("<p id='helperMsg' class='customMessage' style='margin-top:10px;'></p>");
        $("#modalPin").append($h);
      }
      $h.stop(true, true).text(text).show();
      clearTimeout(helper.timer);
      helper.timer = setTimeout(function () {
        $("#helperMsg").remove();
      }, 4000);
    }

    function requestPin(syncInfo) {
      clearPinTimers();
      XTV.loader.show("pin");
      XTV.api
        .request({ method: "POST", url: P.newPin, data: syncInfo, scope: "pin", auth: false })
        .done(function (res) {
          var data = res && res.data;
          if (data && data.User) {
            loggedIn(data);
            return;
          }
          if (!data || !data.ud_sync_code) {
            retryLater("newPin-empty", null);
            return;
          }
          pinState = { id: data.ud_id, pin: data.ud_sync_code, seconds: C.PIN_RENEW_SECONDS };
          XTV.setLayer("pin");
          renderPin();
          pinState.countdown = setInterval(function () {
            pinState.seconds--;
            if (pinState.seconds <= 0) {
              requestPin({ id: pinState.id });
            } else {
              renderPin();
            }
          }, 1000);
          pinState.poll = setInterval(function () {
            checkLinkDevice(false);
          }, C.PIN_POLL_SECONDS * 1000);
        })
        .fail(function (xhr, textStatus) {
          if (XTV.api.isAbort(xhr, textStatus)) {
            return;
          }
          retryLater("newPin", xhr, syncInfo);
        })
        .always(function () {
          XTV.loader.hide("pin");
        });
    }

    function retryLater(where, xhr, syncInfo) {
      XTV.log.error(where, xhr);
      XTV.message.show("No pudimos conectarnos con Xiclos. Reintentamos en unos segundos.", 4000);
      setTimeout(function () {
        if (pinState && pinState.id) {
          requestPin({ id: pinState.id });
        } else if (syncInfo) {
          requestPin(syncInfo);
        } else {
          startPin();
        }
      }, 8000);
    }

    function checkLinkDevice(manual) {
      if (!pinState || !pinState.id) {
        return;
      }
      if (manual) {
        helper("Sincronizando...");
      }
      XTV.api
        .request({ method: "POST", url: P.checkPin, data: { id: pinState.id }, scope: "pin", auth: false })
        .done(function (res) {
          var data = res && res.data;
          if (data && data.User) {
            loggedIn(data);
          } else if (manual) {
            helper("No encontramos un usuario sincronizado a este dispositivo.");
          }
        })
        .fail(function (xhr, textStatus) {
          if (XTV.api.isAbort(xhr, textStatus)) {
            return;
          }
          if (manual) {
            helper("No pudimos sincronizar este dispositivo.");
          }
        });
    }

    function startPin() {
      XTV.session.clear();
      var done = false;
      var go = function (info) {
        if (done) {
          return;
        }
        done = true;
        requestPin(info || { deviceId: "Unknown", platform: "Unknown" });
      };
      try {
        XTV.platform.getTVInfo(go);
      } catch (e) {
        go(null);
      }
      // Si la plataforma no responde, se sigue igual
      setTimeout(function () {
        go(null);
      }, 3000);
    }

    /* ----------------------------------------------------------------------
     * Sesión existente
     * -------------------------------------------------------------------- */
    function checkMembership(session) {
      XTV.loader.show("login");
      XTV.api
        .request({ method: "POST", url: P.checkPin, data: { id: session.ud_id }, scope: "login", auth: false })
        .done(function (res) {
          var data = res && res.data;
          if (data && data.User) {
            loggedIn(data);
          } else {
            // El backend dice que ya no está sincronizado
            startPin();
          }
        })
        .fail(function (xhr, textStatus) {
          if (XTV.api.isAbort(xhr, textStatus)) {
            return;
          }
          if (xhr && (xhr.status === 401 || xhr.status === 403 || xhr.status === 404)) {
            startPin();
            return;
          }
          // Error de red o del servidor: no se borra la sincronización
          XTV.log.error("checkMembership", xhr);
          XTV.message.show("No pudimos conectarnos con Xiclos. Reintentamos en unos segundos.", 4000);
          setTimeout(function () {
            checkMembership(session);
          }, 8000);
        })
        .always(function () {
          XTV.loader.hide("login");
        });
    }

    function loggedIn(syncUserDevice) {
      clearPinTimers();
      pinState = null;
      XTV.api.abort("pin");
      $("#modalPin").remove();
      XTV.session.set(syncUserDevice);
      XTV.app.enterMain();
    }

    // Los index.html empaquetados llaman a checkLogin() en el onload
    window.checkLogin = function () {
      XTV.app.boot();
    };

    /* ----------------------------------------------------------------------
     * API pública
     * -------------------------------------------------------------------- */
    XTV.login = {
      start: function () {
        XTV.session.keepOnlySync();
        var session = XTV.session.get();
        if (session && session.ud_id) {
          checkMembership(session);
        } else {
          startPin();
        }
      },

      handleKey: function (action) {
        if (action === "OK") {
          checkLinkDevice(true);
          return true;
        }
        if (action === "BACK") {
          XTV.actions.confirmExit();
          return true;
        }
        return XTV.keys.isNav(action);
      },

      logout: function () {
        var session = XTV.session.get();
        var finish = function () {
          if (finish.done) {
            return;
          }
          finish.done = true;
          XTV.session.clearKeepingDevice();
          try {
            XTV.platform.hide();
          } catch (e) {}
          window.location.reload();
        };
        XTV.loader.show("logout");
        if (session && session.ud_id) {
          XTV.api
            .request({
              method: "DELETE",
              url: P.unsync,
              data: { id: session.ud_id },
              timeout: 5000
            })
            .always(finish);
          setTimeout(finish, 6000);
        } else {
          finish();
        }
      }
    };
  })(window.jQuery, window.XTV);
}
