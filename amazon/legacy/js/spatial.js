testerAccounts = ["mrtnz.jvr@gmail.com", "javomartinez@hotmail.com"];

var level = {
  NONE: 0,
  BODY: 1,
  CONFIRM: 2,
  LOGIN: 3,
  SEARCH: 4,
  VIDEO: 5
};

var curLevel = level.BODY;

function setCurLevelBody() {
  curLevel = level.BODY;
}

function setCurLevelVideo() {
  curLevel = level.VIDEO;
}

// Busco la funcion adecuada dependindo de la tecla presionada
function keyDown(event) {
  switch (event.keyCode) {
    case VK_LEFT:
      if (curLevel == level.NONE) {
        break;
      }
      if (curLevel == level.BODY) {
        moveInBody(event.keyCode);
        break;
      }
      if (curLevel == level.CONFIRM) {
        moveInCONFIRM(event.keyCode);
        break;
      }
      if (curLevel == level.SEARCH) {
        moveInSearch(event.keyCode);
        break;
      }
      if (curLevel == level.LOGIN) {
        moveInLogin(event.keyCode);
        break;
      }
      break;
    case VK_RIGHT:
      if (curLevel == level.NONE) {
        break;
      }
      if (curLevel == level.BODY) {
        moveInBody(event.keyCode);
        break;
      }
      if (curLevel == level.CONFIRM) {
        moveInCONFIRM(event.keyCode);
        break;
      }
      if (curLevel == level.SEARCH) {
        moveInSearch(event.keyCode);
        break;
      }
      if (curLevel == level.LOGIN) {
        moveInLogin(event.keyCode);
        break;
      }
      break;
    case VK_DOWN:
      if (curLevel == level.NONE) {
        break;
      }
      if (curLevel == level.BODY) {
        moveInBody(event.keyCode);
        break;
      }
      if (curLevel == level.CONFIRM) {
        moveInCONFIRM(event.keyCode);
        break;
      }
      if (curLevel == level.SEARCH) {
        moveInSearch(event.keyCode);
        break;
      }
      if (curLevel == level.LOGIN) {
        moveInLogin(event.keyCode);
        break;
      }
      break;
    case VK_UP:
      if (curLevel == level.NONE) {
        break;
      }
      if (curLevel == level.BODY) {
        moveInBody(event.keyCode);
        break;
      }
      if (curLevel == level.CONFIRM) {
        moveInCONFIRM(event.keyCode);
        break;
      }
      if (curLevel == level.SEARCH) {
        moveInSearch(event.keyCode);
        break;
      }
      if (curLevel == level.LOGIN) {
        moveInLogin(event.keyCode);
        break;
      }
      break;
    case VK_ENTER:
      if (jcp) {
        jcp.playPause();
      }
      if (curLevel == level.SEARCH && $("#searchTerms").hasClass("onFocus")) {
        $("#searchTerms").removeClass("onFocus");
        $("#searchTerms").blur();
        $("#searchButton").addClass("onFocus");
        break;
      } else {
        emuleClick();
        break;
      }
    case VK_EXIT:
      hideApp();
      break;
    case VK_ESCAPE:
    case VK_RETURN:
    case VK_BACK:
      if (jcp) {
        // TODO: Revisar esto
        // $("#div_vimeo_player").removeClass("player-wraper");
        jcp.destroy();
        jcp = null;
      }
      if (curLevel == level.BODY) {
        if ($("#grid").hasClass("cineclub")) {
          $("#header").remove();
          $("#grid").remove();
          getStrips();
        } else if ($("#gridContent").hasClass("searchResult")) {
          $(".searchResult").remove();
          setMenuFocus();
        } else {
          showConfirm("¿Confirmas que querés cerrar Xiclos?");
        }
      } else if (curLevel == level.CONFIRM) {
        setLoader();

        if ($("#gridContent").hasClass("bookmarked")) {
          performSearch(0, "bookmark");
        }

        $(".modal").remove();
        curLevel = level.BODY;

        if ($("#modalPin").length == 0) {
          setFocusOn();

          setTimeout(function () {
            unsetLoader();
          }, 3000);
        }
      } else if (curLevel == level.SEARCH) {
        cancelSearch();
        break;
      } else {
        if ($("#modalPIN").length > 0) {
          showConfirm("¿Confirmas que querés cerrar Xiclos?");
        } else {
          Destroy();
          setFocusOn();
        }
        break;
      }
      break;
    case VK_DONE:
      if (curLevel == level.SEARCH) {
        moveInSearch(event.keyCode);
        break;
      } else {
        moveInLogin(event.keyCode);
        break;
      }
    case VK_RETURNHUB:
      if ($("#searchWrapper").length > 0) {
        if (curLevel == level.CONFIRM) {
          $("#header").html("");
        } else {
          var alertMsg = "¿Realmente querés salir?";
          showConfirmSearch(alertMsg);
        }
        break;
      } else if (curLevel == level.CONFIRM) {
        holdFocus(beforeActionLevel);
        break;
      } else {
        var alertMsg = "¿Realmente querés salir?";
        if ($("#loginzone").length > 0) {
          curLevel = level.BODY;
        }
        $(".onFocus").addClass("focusLost");
        $(".onFocus").removeClass("onFocus");
        beforeActionLevel = curLevel;
        showConfirm(alertMsg, curLevel);
        break;
      }
    case VK_INFO: {
      window.location.reload();
      break;
    }
    case VK_BLUE:
      if (curLevel == level.VIDEO) {
        if (jcp) {
          jcp.onButtonBlue();
        }
        break;
      }
      break;
    default:
      break;
  }
}

// Funcion para navegar el Header
// key : codigo ASCII de boton presionado
function moveInLogin(key) {
  switch (key) {
    case VK_DONE:
      if ($("#userID").hasClass("onFocus")) {
        $("#userID").removeClass("onFocus");
        $("#usrPassword").addClass("onFocus").focus();
      } else if ($("#usrPassword").hasClass("onFocus")) {
        $("#usrPassword").removeClass("onFocus");
        $("#loginButton").addClass("onFocus").focus();
      }
      break;
    case VK_DOWN:
      if ($("#userID").hasClass("onFocus")) {
        $("#userID").removeClass("onFocus");
        $("#usrPassword").addClass("onFocus").focus();
      } else if ($("#usrPassword").hasClass("onFocus")) {
        $("#usrPassword").removeClass("onFocus");
        $("#loginButton").addClass("onFocus").focus();
      } else if ($("#loginButton").hasClass("onFocus")) {
        $("#loginButton").removeClass("onFocus");
        $("#userID").addClass("onFocus").focus();
      }
      break;
    case VK_UP:
      if ($("#userID").hasClass("onFocus")) {
        $("#userID").removeClass("onFocus");
        $("#loginButton").addClass("onFocus").focus();
      } else if ($("#usrPassword").hasClass("onFocus")) {
        $("#usrPassword").removeClass("onFocus");
        $("#userID").addClass("onFocus").focus();
      } else if ($("#loginButton").hasClass("onFocus")) {
        $("#loginButton").removeClass("onFocus");
        $("#usrPassword").addClass("onFocus").focus();
      }
      break;
    default:
      break;
  }
}

function moveInCONFIRM(key) {
  var onFocus = $(".onFocus");
  console.log("moveInCONFIRM", onFocus);
  switch (key) {
    case VK_LEFT:
      if (onFocus.prev().hasClass("confirmField")) {
        changeFocus(onFocus.prev());
      }
      break;
    case VK_RIGHT:
      if (onFocus.next().hasClass("confirmField")) {
        changeFocus(onFocus.next());
      }
      break;
    case VK_DOWN:
      if (onFocus.nextAll().eq(2).hasClass("confirmField")) {
        changeFocus(onFocus.nextAll().eq(2));
      }
      break;
    case VK_UP:
      if (onFocus.prevAll().eq(2).hasClass("confirmField")) {
        changeFocus(onFocus.prevAll().eq(2));
      }
      break;
    default:
      break;
  }
}

// Funcion para navegar el Body
// key : codigo ASCII de boton presionado
function moveInBody(key) {
  var onFocus = $(".onFocus");
  // var initRow = $(".initRow:last");
  switch (key) {
    case VK_LEFT:
      curLevel = level.NONE;
      console.log(
        "FROM",
        $(".activeContent").attr("data-fetch-from"),
        "TO",
        $(".activeContent").attr("data-fetch-to")
      );
      $(".activeContent").removeClass("activeContent");
      if (
        $(".onFocus").hasClass("box") &&
        $(".box:first").hasClass("toAppend")
      ) {
        console.log("IF 1");
        var $me = $(".toAppend");
        var focusClass = "box";
        $me.animate({ "margin-left": 0 }, "slow");
        $(".toAppend").removeClass("toAppend");
      } else if (
        $(".onFocus").hasClass("box") &&
        !$(".box:first").hasClass("toAppend")
      ) {
        console.log("IF 2");
        var $last = $(".content:first .box:last");
        $last.addClass("toAppend");
        $last.parent().prepend($last);
        $last.css("margin-left", -250);
        var $me = $(".toAppend");
        var focusClass = "box";
        $me.animate({ "margin-left": 0 }, "slow");
        $(".toAppend").removeClass("toAppend");
      } else if ($(".onFocus").hasClass("menu")) {
        console.log("IF 3");
        var $me = $(".content:first .menu:last");
        var focusClass = "menu";
        $me.addClass("toAppend");
        $me.parent().prepend($me);

        $me.css("margin-left", -250);
        var $me = $(".toAppend");
        $me.animate({ "margin-left": 0 }, "slow");
        $(".toAppend").removeClass("toAppend");
      }

      changeFocus($(".onFocus").prev());
      myID = $(".onFocus").attr("id");
      $(".onFocus").addClass("activeContent");

      if (typeof myDelay !== "undefined") {
        clearTimeout(myDelay);
        curLevel = level.BODY;
      }
      curLevel = level.BODY;

      if (focusClass === "menu") {
        var clickParam = $(".onFocus").attr("clickparam");
        $(".onFocus").attr("onclick", clickParam);
      } else {
        showProdDetails();
      }

      break;
    case VK_RIGHT:
      curLevel = level.NONE;
      console.log(
        "FROM",
        $(".activeContent").attr("data-fetch-from"),
        "TO",
        $(".activeContent").attr("data-fetch-to")
      );
      if ($(".activeContent").attr("data-fetch-from")) {
        //TODO FETCH MOVIE FROM data-fetch-from TO data-fetch-to
      }
      $(".activeContent").removeClass("activeContent");

      if (
        $(".onFocus").hasClass("box") &&
        $(".box:first").hasClass("toAppend")
      ) {
        var $me = $(".onFocus");
        var focusClass = "box";
        var $me = $(".toAppend");
        var focusClass = "box";
        $me.animate({ "margin-left": 0 }, "slow");
        changeFocus($(".onFocus").next());
      } else if (
        $(".onFocus").hasClass("box") &&
        !$(".box:first").hasClass("toAppend")
      ) {
        var focusClass = "box";
        //CAMBIAR EL FOCO
        changeFocus($(".onFocus").next());
        //ASIGNAR $me
        var $me = $(".onFocus");
        //MOVER LA TIRA
        $width = $(".onFocus").width() + 20;
        var $first = $(".content:first .box:first");
        var $second = $(".content:first .box:nth-child(2)");
        var $toAppend = $first;
        if ($me.attr("id") === $second.attr("id")) {
          $me.css("margin-left", $width);
        } else {
          $second.css("margin-left", $width);
        }
        $first.parent().append($toAppend);
        $toAppend.css("margin-left", 0);

        //ANIMO EL PRIMER ELEMENTO HACIA LA IZQUIERDA
        var $first = $(".content:first .box:first");
        $first.animate({ "margin-left": 0 }, "slow");
      } else if ($(".onFocus").hasClass("menu")) {
        var focusClass = "menu";
        //CAMBIAR EL FOCO
        changeFocus($(".onFocus").next());
        //ASIGNAR $me
        var $me = $(".onFocus");
        //MOVER LA TIRA
        $width = $(".onFocus").width() + 20;
        var $first = $(".content:first .menu:first");
        var $second = $(".content:first .menu:nth-child(2)");
        var $toAppend = $first;
        if ($me.attr("id") === $second.attr("id")) {
          $me.css("margin-left", $width);
        } else {
          $second.css("margin-left", $width);
        }
        $first.parent().append($toAppend);
        $toAppend.css("margin-left", 0);

        //ANIMO EL PRIMER ELEMENTO HACIA LA IZQUIERDA
        var $first = $(".content:first .menu:first");
        $first.animate({ "margin-left": 0 }, "slow");
      } else if ($(".onFocus").hasClass("explore")) {
        var $me = $(".explore:first");
        var focusClass = "explore";
      }

      $(".onFocus").addClass("activeContent");

      if (focusClass === "menu") {
        var clickParam = $(".onFocus").attr("clickparam");
        $(".onFocus").attr("onclick", clickParam);
      } else {
        showProdDetails();
      }

      curLevel = level.BODY;

      break;
    case VK_UP:
      endSearch();
      moveUp();
      break;
    case VK_DOWN:
      console.log("#searchResult " + $(".searchResult").length);
      localStorage.setItem("currentProduction", "0");
      localStorage.setItem("detailedproduction", "0");
      if ($(".searchResult").length > 0) {
        endSearch();
        setMenuFocus();
      } else {
        if (
          $("#arrowL").css("display") == "none" &&
          $("#arrowR").css("display") == "none"
        ) {
          showLeftRigthArrow();
        }
        $(".activeContent").removeClass("activeContent");
        var $me = $(".gridContent:first");
        $me.parent().append($me);
        if (typeof myDelay !== "undefined") {
          clearTimeout(myDelay);
        }

        myDelay = setTimeout(function () {
          setFocusOn();
          if ($(".onFocus").hasClass("menu")) {
            $("#mainContainer").css(
              "background",
              'url("../common/img/projector.jpg")'
            );
          }
        }, 200);
      }
      break;
    default:
      break;
  }
}

function moveUp() {
  var $first = $(".gridContent:first");

  $(".activeContent").removeClass("activeContent");

  var $me = $(".gridContent:last");
  $me.parent().prepend($me);
  if (typeof myDelay !== "undefined") {
    clearTimeout(myDelay);
  }

  myDelay = setTimeout(function () {
    setFocusOn();
    if ($(".onFocus").hasClass("menu")) {
      $("#mainContainer").css(
        "background",
        'url("../common/img/projector.jpg")'
      );
    }
  }, 200);
}

function moveInSearch(key) {
  var onFocus = $(".onFocus");
  var navButton = $(".navButton");
  switch (key) {
    case VK_UP:
      if (onFocus.prev().hasClass("searchField")) {
        changeFocus(onFocus.prev());
      }
      break;
    case VK_ENTER:
    case VK_DONE:
      console.log("Soy DONE");
      //if ($("#searchTerms").hasClass('onFocus')) {
      if ($("#searchButton").hasClass("onFocus")) {
        console.log("Soy getSearch");
        $("#searchTerms").blur();
        performSearch();
        break;
      } else if ($("#cancelButton").hasClass("onFocus")) {
        console.log("Soy cancelSearch");
        cancelSearch();
        break;
      } else {
        console.log("l'entro al else...");
        $("#searchTerms").blur();
        changeFocus(onFocus.next());
        break;
      }
    case VK_DOWN:
      if (onFocus.next().hasClass("searchField")) {
        changeFocus(onFocus.next());
      }
      break;
    case VK_LEFT:
      if (onFocus.prev().hasClass("searchField")) {
        changeFocus(onFocus.prev());
      }
      break;
    case VK_RIGHT:
      if (onFocus.next().hasClass("searchField")) {
        changeFocus(onFocus.next());
      }
      // TODO: Revisar si esto va
      if ($("#searchTerms").hasClass("onFocus")) {
        $("#searchTerms").focus();
      } else {
        $("#searchTerms").focusout();
      }
      break;
    default:
      break;
  }
}

function changeFocus(newfocusOb) {
  //Remuevo el attr onClick
  var myID = $(".onFocus").attr("id");
  // console.log('myID: ' + myID);
  if ($("#" + myID).hasClass("box")) {
    $("#" + myID).removeAttr("onclick");
  }
  $(".onFocus").removeClass("onFocus");
  newfocusOb.addClass("onFocus");
  // if (curLevel == level.BODY) {
  //     setHeader();
  // }
}

// Funcion que emula cliquear sobre la div en foco.
function emuleClick() {
  //Validar si existe un video y que estado tiene para saber que hacer acá..
  console.log("EMULE CLICK", $(".onFocus"));
  if ($(".onFocus").attr("href") != undefined) {
    console.log("EMULE CLICK 1");
    alert("emuleClick 1");
    window.location = $(".onFocus").attr("href");
  } else if ($(".onFocus").parent("a").attr("href") != undefined) {
    console.log("EMULE CLICK 2");
    alert("emuleClick 2");
    window.location = $(".onFocus").parent("a").attr("href");
  } else {
    console.log("EMULE CLICK 3");
    $(".onFocus").click();
  }
}

//Funciones para navegación por flechas
function moveToRight() {
  curLevel = level.NONE;
  i = 0;
  while (i <= 8) {
    if ($(".onFocus").hasClass("box")) {
      var $me = $(".box:first");
    } else if ($(".onFocus").hasClass("menu")) {
      var $me = $(".menu:first");
    } else if ($(".onFocus").hasClass("explore")) {
      var $me = $(".explore:first");
    }
    $me.parent().append($me);
    $("#modalCrew").remove();
    i++;
  }

  setFocusOn();
}

function moveToLeft() {
  curLevel = level.NONE;
  i = 0;
  while (i <= 8) {
    if ($(".onFocus").hasClass("box")) {
      var $me = $(".content:first .box:last");
    } else if ($(".onFocus").hasClass("menu")) {
      var $me = $(".content:first .menu:last");
    } else if ($(".onFocus").hasClass("explore")) {
      var $me = $(".content:first .explore:last");
    }
    $me.parent().prepend($me);
    $("#modalCrew").remove();
    console.log("MOVE LEFT", i, $me);
    i++;
  }

  setFocusOn();
}

function moveToUp() {
  endSearch();
  if (
    $("#arrowL").css("display") == "none" &&
    $("#arrowR").css("display") == "none"
  ) {
    showLeftRigthArrow();
  }

  var $first = $(".gridContent:first");

  var $me = $(".gridContent:last");
  $me.parent().prepend($me);

  setFocusOn();

  var $myPid = $(".onFocus");
  $("#" + $myPid[0].id).click(setPlayFocus);
}

function moveToDown(pOrigin) {
  endSearch();
  if (
    $("#arrowL").css("display") == "none" &&
    $("#arrowR").css("display") == "none"
  ) {
    showLeftRigthArrow();
  }
  var $me = $(".gridContent:first");
  $me.parent().append($me);

  setFocusOn();

  var $myPid = $(".onFocus");
  $("#" + $myPid[0].id).click(setPlayFocus);
}

function removeDivsFirstRow() {
  if ($("#searchResult").length > 0) {
    $("#searchResult").remove();
  }
  if ($(".menuExplore").length > 0) {
    $("#menuExplore").remove();
  }
}
