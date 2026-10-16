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
<<<<<<< HEAD
   * Mantiene el markup y las clases del CSS existente (#confirm,
   * .confirmField, .onFocus, etc.).
=======
   * Diseño: tarjeta centrada sobre el fondo oscurecido (.xm-*).
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
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
<<<<<<< HEAD
=======
          XTV.refocus();
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
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
<<<<<<< HEAD
            // La tecla la procesa el navegador (por ejemplo, mover el cursor del texto)
=======
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
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

<<<<<<< HEAD
      // Fondo con trapecios (igual que los modales anteriores)
      decorate: function ($el) {
        $el.append('<div class="trapezium2 modalTrapezium2"></div>');
        $el.append('<div class="trapezium modalTrapezium"></div>');
        $el.append('<div class="triangle"></div>');
        return $el;
=======
      // Fondo oscurecido + tarjeta centrada. Devuelve { $el, $card }.
      shell: function (id, cardClass) {
        var $el = $('<div class="xm-overlay"></div>').attr("id", id);
        var $card = $('<div class="xm-card"></div>');
        if (cardClass) {
          $card.addClass(cardClass);
        }
        $el.append($card);
        return { $el: $el, $card: $card };
      },

      button: function (label, primary, icon) {
        var $b = $('<button type="button" class="xm-btn"></button>');
        if (primary) {
          $b.addClass("primary");
        }
        if (icon) {
          $b.append(XTV.icon(icon, "xm-btn-icon"));
        }
        $b.append($("<span></span>").text(label));
        return $b;
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
      },

      /*
       * Confirmación SI / NO.
       * opts = { message, yes, no, onYes, onNo, focusYes }
       */
      confirm: function (opts) {
<<<<<<< HEAD
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
=======
        var sh = modal.shell("modalConfirm", "xm-small");
        sh.$card.append($('<p class="xm-message"></p>').text(opts.message));
        var $actions = $('<div class="xm-actions"></div>');
        var $yes = modal.button(opts.yes || "Sí", false);
        var $no = modal.button(opts.no || "No", false);
        $actions.append($yes).append($no);
        sh.$card.append($actions);

        modal.open({
          $el: sh.$el,
          items: ".xm-btn",
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
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
<<<<<<< HEAD
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
=======
       * Aviso con un solo botón.
       * opts = { message, onClose }
       */
      alert: function (opts) {
        var sh = modal.shell("alertSearch", "xm-small");
        sh.$card.append($('<p class="xm-message"></p>').text(opts.message));
        var $actions = $('<div class="xm-actions"></div>');
        var $ok = modal.button("Entendido", false);
        $actions.append($ok);
        sh.$card.append($actions);
        modal.open({
          $el: sh.$el,
          items: ".xm-btn",
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
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
<<<<<<< HEAD
   * Mismo markup y clases que la versión anterior (#newMenu, .icon,
   * .menuTitle, .newMenuActive).
=======
   * Riel de íconos fijo (#xtvMenu) y un panel que se desliza con
   * transform + opacity al abrirse. Sin cambios de ancho, para que sea
   * fluido también en TVs de 2017.
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
   * ES5 puro.
   */
  (function ($, XTV) {
    "use strict";

<<<<<<< HEAD
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
=======
    var $menu = null;
    var index = 0;
    var current = "home";
    var list = [];

    function entries() {
      var out = [
        { id: "buscar", icon: "search", text: "Buscar", run: function () { XTV.search.open(); } },
        { id: "home", icon: "home", text: "Inicio", run: function () { XTV.grid.goHome(true); } },
        { id: "cineclub", icon: "cineclub", text: "Cineclub", run: function () { XTV.grid.showCineclub(); } },
        { id: "explorar", icon: "compass", text: "Explorar", run: function () { XTV.browse.open(); } }
      ];
      if (XTV.session.isStudent()) {
        out.push({
          id: "alumnos",
          icon: "star",
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
          text: "Exclusivos",
          run: function () { XTV.grid.showList({ type: "students" }); }
        });
      }
<<<<<<< HEAD
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
=======
      out.push({ id: "salir", icon: "power", text: "Salir", group: true, run: function () { XTV.actions.confirmExit(); } });
      out.push({
        id: "cerrar_sesion",
        icon: "logout",
        text: "Cerrar sesión",
        run: function () { XTV.actions.confirmLogout(); }
      });
      return out;
    }

    function paint() {
      if (!$menu) {
        return;
      }
      var open = XTV.state.layer === "menu";
      $menu.toggleClass("open", open);
      $("body").toggleClass("xtv-menu-open", open);
      $menu.find(".xn-item").each(function (i) {
        var $it = $(this);
        $it.toggleClass("onFocus", open && i === index);
        $it.toggleClass("current", list[i] && list[i].id === current);
      });
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
    }

    var menu = (XTV.menu = {
      build: function () {
<<<<<<< HEAD
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
=======
        $("#xtvMenu, #newMenu").remove();
        list = entries();
        $menu = $(
          '<nav id="xtvMenu" aria-label="Menú principal"><div class="xn-scrim"></div><div class="xn-panel"></div><div class="xn-rail"></div><div class="xn-items"></div></nav>'
        );
        var $items = $menu.find(".xn-items");
        for (var i = 0; i < list.length; i++) {
          var $it = $('<button type="button" class="xn-item"></button>').attr("data-index", i);
          if (list[i].group) {
            $it.addClass("group");
          }
          $it.append('<span class="xn-bar"></span>');
          $it.append(XTV.icon(list[i].icon, "xn-icon"));
          $it.append($('<span class="xn-label"></span>').text(list[i].text));
          $items.append($it);
        }
        $("body").append($menu);

        // Puntero: pasar por un ítem lo enfoca; salir del menú no lo cierra
        // (un movimiento involuntario del control no cambia el foco).
        $menu.on("mousemove", ".xn-item", function () {
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
          if (!XTV.pointer.isActive()) {
            return;
          }
          var i = parseInt($(this).attr("data-index"), 10);
<<<<<<< HEAD
          if ((XTV.state.layer === "grid" || XTV.state.layer === "menu") && !(XTV.state.layer === "menu" && i === index)) {
            menu.open(i);
          }
        });
        $menu.on("click", ".icon, .menuTitle", function () {
          var i = parseInt($(this).attr("data-index"), 10);
          if (XTV.state.layer === "grid" || XTV.state.layer === "menu") {
=======
          var layer = XTV.state.layer;
          if ((layer === "grid" || layer === "menu") && !(layer === "menu" && i === index)) {
            menu.open(i);
          }
        });
        $menu.on("click", ".xn-item", function () {
          var i = parseInt($(this).attr("data-index"), 10);
          var layer = XTV.state.layer;
          if (layer === "grid" || layer === "menu") {
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
            index = i;
            menu.run();
          }
        });
<<<<<<< HEAD
=======
        // Con el puntero: salir del panel hacia el contenido cierra el menú
        $menu.on("click mousemove", ".xn-scrim", function (e) {
          if (e.type === "click" || (XTV.pointer.isActive() && e.clientX > $menu.find(".xn-panel").outerWidth())) {
            menu.close();
          }
        });
        paint();
      },

      // Sección actual (queda marcada con el menú cerrado)
      setCurrent: function (id) {
        current = id;
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
        paint();
      },

      open: function (focusIndex) {
        if (!$menu) {
          return;
        }
        if (typeof focusIndex === "number") {
          index = focusIndex;
<<<<<<< HEAD
=======
        } else {
          for (var i = 0; i < list.length; i++) {
            if (list[i].id === current) {
              index = i;
            }
          }
>>>>>>> 4e40a3d (Ajustes a la nueva versión con rediseño)
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
