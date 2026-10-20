/*
 * Xiclos TV v2 - modales y menú lateral
 * Este archivo mantiene su nombre porque lo carga el index.html empaquetado.
 * En Amazon (mientras siga con la versión anterior) carga la copia de common/legacy/js/utils.js.
 * ES5 puro.
 */
if (window.XTV_BOOT && window.XTV_BOOT.legacy) {
  window.XTV_BOOT.load("utils.js");
} else {
  /*
   * Xiclos TV v2 - modales
   * Un solo modal abierto a la vez. Al cerrarse devuelve las teclas a la
   * capa que estaba activa antes de abrirlo.
   * Mantiene el markup y las clases del CSS existente (#confirm,
   * .confirmField, .onFocus, etc.).
   * ES5 puro.
   */
  (function ($, XTV) {
    "use strict";

    var current = null;

    function focusItem(el) {
      if (!current || !el) {
        return;
      }
      current.$el.find(".onFocus").removeClass("onFocus");
      $(el).addClass("onFocus");
      current.focused = el;
      if (current.def.onFocus) {
        current.def.onFocus(el);
      }
    }

    function items() {
      return current ? current.$el.find(current.def.items) : $();
    }

    var modal = (XTV.modal = {
      /*
       * def = {
       *   $el: elemento jQuery ya armado,
       *   items: selector de los elementos navegables,
       *   focus: elemento o selector con foco inicial,
       *   onActivate: function(el) al apretar OK o hacer click,
       *   onBack: function() (si no está, Volver cierra el modal),
       *   onKey: function(action, event) -> true si la manejó,
       *   onClose: function() al cerrarse
       * }
       */
      open: function (def) {
        modal.close(true);
        var prevLayer = XTV.state.layer;
        if (prevLayer === "modal") {
          prevLayer = "grid";
        }
        current = { def: def, $el: def.$el, prevLayer: prevLayer, focused: null };
        $("body").append(def.$el);
        XTV.setLayer("modal");

        // Puntero (Magic Remote / mouse)
        def.$el.on("mousemove", def.items, function () {
          if (XTV.pointer.isActive() && current && current.focused !== this) {
            focusItem(this);
          }
        });
        def.$el.on("click", def.items, function (e) {
          e.preventDefault();
          focusItem(this);
          modal.activate();
        });

        var initial = def.focus
          ? typeof def.focus === "string"
            ? def.$el.find(def.focus).get(0)
            : def.focus
          : items().get(0);
        focusItem(initial);
      },

      close: function (silent) {
        if (!current) {
          return;
        }
        var closing = current;
        current = null;
        closing.$el.remove();
        if (XTV.state.layer === "modal") {
          XTV.setLayer(closing.prevLayer);
        }
        if (!silent && closing.def.onClose) {
          closing.def.onClose();
        }
      },

      isOpen: function () {
        return !!current;
      },

      focused: function () {
        return current ? current.focused : null;
      },

      focus: focusItem,

      activate: function () {
        if (current && current.focused && current.def.onActivate) {
          current.def.onActivate(current.focused);
        }
      },

      handleKey: function (action, event) {
        if (!current) {
          return false;
        }
        if (current.def.onKey) {
          var handled = current.def.onKey(action, event);
          if (handled === true) {
            return true;
          }
          if (handled === "native") {
            // La tecla la procesa el navegador (por ejemplo, mover el cursor del texto)
            return false;
          }
        }
        if (XTV.keys.isNav(action)) {
          var next = XTV.nav.pick(items(), current.focused, action);
          if (next) {
            focusItem(next);
          }
          return true;
        }
        if (action === "OK") {
          modal.activate();
          return true;
        }
        if (action === "BACK") {
          if (current.def.onBack) {
            current.def.onBack();
          } else {
            modal.close();
          }
          return true;
        }
        return false;
      },

      /* --------------------------------------------------------------
       * Plantillas
       * ------------------------------------------------------------ */

      // Fondo con trapecios (igual que los modales anteriores)
      decorate: function ($el) {
        $el.append('<div class="trapezium2 modalTrapezium2"></div>');
        $el.append('<div class="trapezium modalTrapezium"></div>');
        $el.append('<div class="triangle"></div>');
        return $el;
      },

      /*
       * Confirmación SI / NO.
       * opts = { message, yes, no, onYes, onNo, focusYes }
       */
      confirm: function (opts) {
        var $el = $('<div id="modalConfirm" class="modal"></div>');
        modal.decorate($el);
        var $confirm = $('<p id="confirm"></p>');
        $confirm.append($("<p></p>").text(opts.message));
        var $yes = $('<button id="confirmAction" class="confirmField"></button>').text(
          opts.yes || "SI"
        );
        var $no = $('<button id="cancelAction" class="confirmField"></button>').text(
          opts.no || "NO"
        );
        $confirm.append($yes).append($no);
        $el.append($confirm);

        modal.open({
          $el: $el,
          items: ".confirmField",
          focus: opts.focusYes ? $yes.get(0) : $no.get(0),
          onActivate: function (el) {
            modal.close(true);
            if (el === $yes.get(0)) {
              if (opts.onYes) {
                opts.onYes();
              }
            } else if (opts.onNo) {
              opts.onNo();
            }
          },
          onBack: function () {
            modal.close(true);
            if (opts.onNo) {
              opts.onNo();
            }
          }
        });
      },

      /*
       * Aviso con un solo botón OK.
       * opts = { message, onClose }
       */
      alert: function (opts) {
        var $el = $('<div id="alertSearch" class="modal"></div>');
        modal.decorate($el);
        var $confirm = $('<p id="confirm"></p>');
        $confirm.append($("<p></p>").text(opts.message));
        var $ok = $('<button id="confirmAction" class="confirmField"></button>').text("OK");
        $confirm.append($ok);
        $el.append($confirm);
        modal.open({
          $el: $el,
          items: ".confirmField",
          onActivate: function () {
            modal.close(true);
            if (opts.onClose) {
              opts.onClose();
            }
          },
          onBack: function () {
            modal.close(true);
            if (opts.onClose) {
              opts.onClose();
            }
          }
        });
      }
    });
  })(window.jQuery, window.XTV);

  /*
   * Xiclos TV v2 - menú lateral
   * Mismo markup y clases que la versión anterior (#newMenu, .icon,
   * .menuTitle, .newMenuActive).
   * ES5 puro.
   */
  (function ($, XTV) {
    "use strict";

    var util = XTV.util;
    var C = XTV.config;

    var $menu = null;
    var index = 0;

    function entries() {
      var list = [
        { id: "buscar", img: "buscar.png", text: "Buscar", run: function () { XTV.search.open(); } },
        { id: "home", img: "home.png", text: "Inicio", run: function () { XTV.grid.goHome(true); } },
        { id: "cineclub", img: "cineclub.png", text: "Cineclub", run: function () { XTV.grid.showCineclub(); } },
        { id: "explorar", img: "explorar.png", text: "Explorar", run: function () { XTV.actions.genres(); } }
      ];
      if (XTV.session.isStudent()) {
        list.push({
          id: "alumnos",
          img: "exclusivo.png",
          text: "Exclusivos",
          run: function () { XTV.grid.showList({ type: "students" }); }
        });
      }
      list.push({ id: "salir", img: "salir.png", text: "Salir", run: function () { XTV.actions.confirmExit(); } });
      list.push({
        id: "cerrar_sesion",
        img: "cerrar_sesion.png",
        text: "Cerrar sesión",
        run: function () { XTV.actions.confirmLogout(); }
      });
      return list;
    }

    var list = [];

    function icons() {
      return $menu ? $menu.find(".icon") : $();
    }

    function paint() {
      if (!$menu) {
        return;
      }
      var active = XTV.state.layer === "menu";
      $menu.toggleClass("newMenuActive", active);
      $menu.find(".menuTitle").css("display", active ? "block" : "none");
      icons().removeClass("onFocus");
      if (active) {
        icons().eq(index).addClass("onFocus");
      }
    }

    var menu = (XTV.menu = {
      build: function () {
        $("#newMenu").remove();
        list = entries();
        var html = "";
        for (var i = 0; i < list.length; i++) {
          html +=
            '<img src="' +
            util.esc(C.IMG + list[i].img) +
            '" class="icon" id="' +
            list[i].id +
            '" data-index="' +
            i +
            '" style="cursor:pointer">' +
            '<p class="menuTitle" data-index="' +
            i +
            '">' +
            util.esc(list[i].text) +
            "</p>";
        }
        $menu = $('<div id="newMenu">' + html + "</div>");
        if ($("#result").length) {
          $("#result").after($menu);
        } else {
          $("body").append($menu);
        }

        // Puntero: pasar por un ícono lo enfoca; salir del menú no lo cierra
        // (así un movimiento involuntario del control no cambia el foco).
        $menu.on("mousemove", ".icon, .menuTitle", function () {
          if (!XTV.pointer.isActive()) {
            return;
          }
          var i = parseInt($(this).attr("data-index"), 10);
          if ((XTV.state.layer === "grid" || XTV.state.layer === "menu") && !(XTV.state.layer === "menu" && i === index)) {
            menu.open(i);
          }
        });
        $menu.on("click", ".icon, .menuTitle", function () {
          var i = parseInt($(this).attr("data-index"), 10);
          if (XTV.state.layer === "grid" || XTV.state.layer === "menu") {
            index = i;
            menu.run();
          }
        });
        paint();
      },

      open: function (focusIndex) {
        if (!$menu) {
          return;
        }
        if (typeof focusIndex === "number") {
          index = focusIndex;
        }
        XTV.setLayer("menu");
        paint();
      },

      close: function () {
        if (XTV.state.layer === "menu") {
          XTV.setLayer("grid");
        }
        paint();
      },

      run: function () {
        var entry = list[index];
        menu.close();
        if (entry) {
          entry.run();
        }
      },

      paint: paint,

      handleKey: function (action) {
        var n = list.length;
        if (action === "UP") {
          index = (index - 1 + n) % n;
          paint();
          return true;
        }
        if (action === "DOWN") {
          index = (index + 1) % n;
          paint();
          return true;
        }
        if (action === "RIGHT" || action === "BACK") {
          menu.close();
          return true;
        }
        if (action === "OK") {
          menu.run();
          return true;
        }
        if (action === "LEFT") {
          return true;
        }
        return false;
      }
    });
  })(window.jQuery, window.XTV);
}
