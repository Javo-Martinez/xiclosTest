var timer;
var jcp = null;
var isWebOS4 = false;

function findSubstring(mainString, subString) {
  var mainLength = mainString.length;
  var subLength = subString.length;

  for (var i = 0; i <= mainLength - subLength; i++) {
    var j;
    for (j = 0; j < subLength; j++) {
      if (mainString[i + j] != subString[j]) {
        break;
      }
    }
    if (j == subLength) {
      return true; // Substring found
    }
  }
  return false; // Substring not found
}

function setOnOff(msg) {
  if (msg == "online") {
    $("#modalOnOff").remove();
  } else {
    //Cuando se pierde la conexión
    $("body").append("<div id='modalOnOff'  class='modal'>");
    $("#modalOnOff").append("<div id='resultsModal'>");
    $("#resultsModal").append(
      "<p class='offlineWarning'>Su conexión de red se ha perdido.</p>"
    );
  }
}

function setFocus() {
  curLevel = level.NONE;
  var myID = $(".onFocus").attr("id");
  var currentID = $(".onFocus").attr("prodid");

  $(".onFocus").removeClass("onFocus");
  $(".content:first").find(".box:eq( 0 )").addClass("onFocus");
  $(".content:first").find(".box:eq( 0 )").addClass("activeContent");

  showProdDetails();

  if (!$("#" + myID).hasClass('icon')) {
    $("#" + myID).attr("onclick", "setPlayFocus()");
  }

  curLevel = level.BODY;
}

function setMenuFocus() {
  curLevel = level.MENU;

  //Obtengo el ID del proDetails de la película que está visible para seguir mostrando los detalles
  var visibleDiv = $(".prodDetails").filter(function() {
    return $(this).css("display") === "block";
  });
  var prodDetailID = visibleDiv.attr("id");
  $("#" + prodDetailID).css("display", "block");

  //Asigno clase para expandir el menú
  $("#newMenu").addClass("newMenuActive");


  //FOCO en el primer elemento del menú
  $(".onFocus").removeClass("onFocus");
  $("#div_vimeo_player").css("display", "block");
  $("#newMenu .icon:first-of-type").addClass("onFocus");
  $(".menuTitle").css("display", "block");
}

function setMenuFocusOff() {

  //Remuevo clase para expandir el menú
  $("#newMenu").removeClass("newMenuActive");
  $(".menuTitle").css("display", "none");
  curLevel = level.BODY;
  setFocus();
}

function setFocusOn() {

  var $checkFirstStrip = $(".gridContent:first");

  if ($checkFirstStrip.hasClass("menuStrip")) {
    setMenuFocus();
  } else {
    setFocus();
  }
}

function setPlayFocus() {
  curLevel = level.NONE;
  /*
  phasChapters = $(".onFocus").attr("prodType");
  if (phasChapters == "") {
    phasChapters = $(".activeContent").attr("prodType");
  }
  */
  psid = $(".onFocus").attr("prodid");
  //console.log("phasChapters: " + phasChapters);
  localStorage.setItem("detailedproduction", JSON.stringify(psid));

  $(".onFocus").removeClass("onFocus");
  $("#buttonContainer").show();
  $("#grid").hide();
  $(".navButton:first").addClass("onFocus");
}

function showConfirm(pAlertMsg, pLevel) {
  console.log("showConfirm");
  curLevel = level.CONFIRM;
  $(".onFocus").removeClass("onFocus");
  $("body").append("<div id='modalConfirm' class='modal'>");
  $("#modalConfirm").append('<div class="trapezium2 modalTrapezium2"></div>');
  $("#modalConfirm").append('<div class="trapezium modalTrapezium"></div>');
  $("#modalConfirm").append('<div class="triangle"></div>');
  $("#modalConfirm").append("<p id='confirm'>");
  $("#confirm").append("<p>" + pAlertMsg);
  $("#confirm").fadeIn("slow");
  $("#confirm").append(
    "<button id='confirmAction' class='confirmField' onmouseenter='confirmFocus()' onclick='hideApp()';>SI"
  );
  $("#confirm").append(
    "<button id='cancelAction' class='confirmField onFocus' onmouseenter='confirmFocus()' onclick='closeConfirm()';>NO"
  );
}

function showLogoutConfirm(pAlertMsg, pLevel) {
  console.log("showConfirm");
  curLevel = level.CONFIRM;
  $(".onFocus").removeClass("onFocus");
  $("body").append("<div id='modalConfirm' class='modal'>");
  $("#modalConfirm").append('<div class="trapezium2 modalTrapezium2"></div>');
  $("#modalConfirm").append('<div class="trapezium modalTrapezium"></div>');
  $("#modalConfirm").append('<div class="triangle"></div>');
  $("#modalConfirm").append("<p id='confirm'>");
  $("#confirm").append("<p>" + pAlertMsg);
  $("#confirm").fadeIn("slow");
  $("#confirm").append(
    "<button id='confirmAction' class='confirmField' onmouseenter='confirmFocus()' onclick='logout(true)';>SI"
  );
  $("#confirm").append(
    "<button id='cancelAction' class='confirmField onFocus' onmouseenter='confirmFocus()' onclick='closeConfirm()';>NO"
  );
}

function hideAppConfirm() {
  showConfirm("¿Realmente querés cerrar Xiclos?", "BODY");
}

function logoutConfirm() {
  showLogoutConfirm("¿Realmente querés cerrar tu sesión en Xiclos? Si cerrás tu sesión deberás volver a sincronizar tu dispositivo para disfrutar Xiclos nuevamente.", "BODY");
}

function closeConfirm() {
  if ($("#modalPin").length == 0) {
    setFocusOn();
  } else {
    curLevel = level.BODY;
  }
  $("#modalConfirm").remove();
}

function setAction(pvideoId, pprodid, rowid) {
  setLoader();
  curLevel = level.CONFIRM;
  const userSync = JSON.parse(localStorage.getItem("xiclos_sync"));
  const urlCheckBookmark = getPathCheckBookmark();
  $.ajax({
    url: urlCheckBookmark + "?movieid=" + pprodid,
    headers: {
      Authorization: "TV",
      U: JSON.stringify(userSync.User)
    },
    dataType: "json",
    type: "GET",
    cache: false,
    success: function(resultData) {
      const result = resultData.data;
      $(".onFocus").addClass("activeContent");
      $(".onFocus").removeClass("onFocus");
      var mycheck = result[0].bookmark;
      if (mycheck == 1) {
        var ptitle = "QUITAR DE MI LISTA";
        var bookmarked = "bookmarked";
      } else {
        var ptitle = "AGREGAR A MI LISTA";
        var bookmarked = "";
      }

      var imgID = rowid.replace("box", "img");
      var pmoviename = $("#" + rowid)
        .children(".posterTitle")
        .text();
      var pimage = $("#" + imgID).attr("src");
      var pimage = pimage.replace("-205x347", "");

      $("body").append("<div id='modalConfirmAction' class='modal'>");
      $("#modalConfirmAction").append("<p id='confirm' class='bookmarkModal'>");
      $("#confirm").append('<img src="' + pimage + '"/>');
      $("#confirm").append('<p class= "moviename">' + pmoviename);
      $("#confirm").append(
        "<button id='playMovie' class='confirmField bookmarkButton onFocus' onmouseenter='confirmFocus()' onclick='createPlayer(\"" +
        pvideoId +
        '",' +
        pprodid +
        ")';>VER AHORA "
      );
      $("#confirm").append(
        "<button id='manageBookmark' class='confirmField bookmarkButton " +
        bookmarked +
        "' onmouseenter='confirmFocus()' onclick='manageBookmark(" +
        pprodid +
        ',"' +
        rowid +
        "\")';>" +
        ptitle +
        ""
      );
      unsetLoader();
    },
    error: function(response) {
      console.log("ERROR setAction", response);
      unsetLoader();
    }
  });
}

function getGenreList() {
  setLoader();

  curLevel = level.CONFIRM;

  var url = getPathGenreList();
  const userSync = JSON.parse(localStorage.getItem("xiclos_sync"));
  $.ajax({
    url: url + "?type=Género",
    headers: {
      Authorization: "TV",
      U: JSON.stringify(userSync.User)
    },
    dataType: "json",
    type: "GET",
    cache: false,
    success: function(resultData) {
      const result = resultData.data;
      var resultLength = result.length;
      console.log("getGenreList result", result);
      if ($("#modalGenreList").length <= 0) {
        $("body").append("<div id='modalGenreList' class='modal'>");
      }

      $("#modalGenreList").append(
        '<div class="trapezium2 modalTrapezium2"></div>'
      );
      $("#modalGenreList").append(
        '<div class="trapezium modalTrapezium"></div>'
      );
      $("#modalGenreList").append('<div class="triangle"></div>');
      $("#modalGenreList").append('<p class= "moviename">EXPLORAR POR GÉNERO');

      $("#modalGenreList").append("<p id='confirm' class='bookmarkGenreList'>");
      $(".onFocus").removeClass("onFocus");

      for (i = 0; i < resultLength; i++) {
        if (i == 0) {
          classOnFocus = "onFocus";
        } else {
          classOnFocus = "";
        }
        myGenre = result[i].genre;

        $("#confirm").append(
          "<button id='playMovie' class='confirmField " +
          classOnFocus +
          " genreList' onmouseenter='confirmFocus()' onclick=performSearch(" +
          result[i].genreId +
          ",'genre','" +
          encodeURI(myGenre) +
          "');>" +
          result[i].genre.toUpperCase() +
          ""
        );
      }
    },
    error: function(response) {
      console.log("ERROR getGenreList:", response);
    }
  });

  setTimeout(function() {
    unsetLoader();
  }, 3000);
}

function closeConfirmAction() {
  $("#modalConfirm").remove();
  $("#grid").remove();
  initMainScreen();
}

function confirmFocus() {
  $(".onFocus").removeClass("onFocus");
  $(".confirmField:hover").addClass("onFocus");
}

function showConfirmBody(pAlertMsg, pLevel) {
  curLevel = level.CONFIRM;
  localStorage.setItem("current_context", "body");
  $(".onFocus").removeClass("onFocus");
  $("body").append("<div id='modalConfirm' class='modal'>");
  $("#modalConfirm").append("<p id='confirm'>");
  $("#confirm").append("<p>" + pAlertMsg);
  $("#confirm").fadeIn("slow");
  $("#confirm").append(
    "<button id='confirmAction' class='confirmField' onmouseenter='confirmFocus()' onclick=hideApp();>SI"
  );
  $("#confirm").append(
    "<button id='cancelAction' class='confirmField onFocus' onmouseenter='confirmFocus()' onclick=closeBodyConfirm();>NO"
  );
}

function closeBodyConfirm() {
  $("#gridContentMenu").remove();
  $("#modalConfirm").remove();

  if (!$(".box").hasClass("activeContent")) {
    $("#grid").remove();
    initMainScreen();
  } else {
    curLevel = level.BODY;
    $(".activeContent").addClass("onFocus");
    $(".activeContent").removeClass("activeContent");
  }
  $("#gridContentMenu").remove();
  $("#modalConfirm").remove();
}

function showConfirmSearch(pAlertMsg, pLevel) {
  curLevel = level.CONFIRM;
  localStorage.setItem("current_context", "serch");
  $(".onFocus").removeClass("onFocus");
  $("body").append("<div id='modalConfirm' class='modal'>");
  $("#modalConfirm").append("<p id='confirm'>");
  $("#confirm").append("<p>" + pAlertMsg);
  $("#confirm").fadeIn("slow");
  $("#confirm").append(
    "<button id='confirmAction' class='confirmField' onmouseenter='confirmFocus()' onclick=hideApp();>SI"
  );
  $("#confirm").append(
    "<button id='cancelAction' class='confirmField onFocus' onmouseenter='confirmFocus()' onclick=closeSearchConfirm();>NO"
  );
}

function customMessage(pmessage) {
  curLevel = level.NONE;
  $("body").append(
    "<div id='modalMessage' class='simpleModal'> <p class='customMessage'>" +
    pmessage +
    " </p>"
  );
  $("#modalMessage").fadeOut(5000);
  setTimeout(setLevel, 5000);
}

function closeModalConfirm() {
  $("#modalConfirm").remove();
}

function setLevel() {
  curLevel = level.BODY;
  $("#modalMessage").remove();
}

function closeModal() {
  console.log("closeModal");
  $("#modal").remove();
}

function closeModalDelay() {
  setTimeout(function() {
    closeModal();
  }, 3000);
}

function setLoader() {
  if ($("#modal").length <= 0) {
    $("body").append("<div id='modal' class='modal modalAnimation'>");
    $("#modal").append(
      "<div class='loading'><img src='" +
      getPathDomain() +
      "/tv/common/img/logo.png'></div>"
    );
  }
}

function unsetLoader() {
  if ($("#modal").get().length) {
    $("#modal").fadeOut(1000, function() {
      $("#modal").remove();
    });
  }
}

//BOOKMARKS
function manageBookmark(pprodid, pboxid, pmoviename, pimage) {
  console.log("manageBookmark", pprodid);
  //PARAMS
  setLoader();
  const userSync = JSON.parse(localStorage.getItem("xiclos_sync"));
  const operation = $("#manageBookmark").hasClass("bookmarked") ?
    "DELETE" :
    "PUT";
  const url = getPathSetBookmark();
  $.ajax({
    url: url + "?movieId=" + pprodid,
    headers: {
      Authorization: "TV",
      U: JSON.stringify(userSync.User)
    },
    dataType: "json",
    type: operation,
    cache: false,
    complete: function() {
      if ($("#manageBookmark").hasClass("bookmarked")) {
        $("#manageBookmark").removeClass("bookmarked");
        $("#manageBookmark").html("AGREGAR A MI LISTA");
      } else {
        $("#manageBookmark").addClass("bookmarked");
        $("#manageBookmark").html("QUITAR DE MI LISTA");
      }
      unsetLoader();
    },
    error: function(response) {
      console.log("ERROR manageBookmark", response);
      unsetLoader();
    }
  });
}

//USER HISTORY

function setUserHistory(pMovieId, pprodid, playerType) {
  var pResumePoint = 0;

  //BUSCO DATOS
  var detailsID = $(".activeContent")
    .attr("id")
    .replace("box", "detailsContainer");
  var duration = $("#" + detailsID)
    .children(".prodDuration")
    .text();

  //PASO A SEGUNDOS
  duration = parseFloat(duration) * 60;

  //PARAMS
  var _resumePoint = 0;
  if (playerType == "vimeo") {
    // TODO: Forzar fullscreen vimeo player
  } else {
    $("#div_vimeo_player").addClass("jw-flag-fullscreen"); // Fuerzo el inicio en fullscreen (LG no lo hace solito)
  }
  const url = getPathSetHistory();
  const userSync = JSON.parse(localStorage.getItem("xiclos_sync"));
  $.ajax({
    url: url + "?movieId=" + pprodid + "&resumePoint=" + pResumePoint,
    headers: {
      Authorization: "TV",
      U: JSON.stringify(userSync.User)
    },
    dataType: "json",
    type: "GET",
    cache: false,
    success: function(resultData) {
      console.log("setUserHistory: ", resultData);
      var result = resultData.data;
      console.log("resumePoint: ", result);
      _resumePoint = result.resumePoint;
      if (playerType == "vimeo") {
        console.log("CREATED VIMEO PLAYER");
        jcp = new JCPlayer();
        jcp.create(
          "div_vimeo_player",
          pMovieId,
          _resumePoint,
          duration,
          result.progressId,
          pprodid,
          "vimeo"
        );
      } else {
        console.log("CREATED JWPLAYER");
        jcp = new JCPlayer();
        jcp.create(
          "div_vimeo_player",
          pMovieId,
          _resumePoint,
          duration,
          result.progressId,
          pprodid,
          "jwplayer"
        );
      }
    },
    complete: function(result) {
      setCurLevelVideo();
    },
    error: function(response) {
      console.log("ERROR setUserHistory", response);
    }
  });
}

//Timer
var tid = "";

function createTimer(pFunction) {
  tid = setInterval(pFunction, 60000);
}

function abortTimer() {
  // to be called when you want to stop the timer
  if (tid != "") {
    clearInterval(tid);
  }
}

//Llamado al player desde el botón Ver Ahora
function createPlayer(pvideoId, pprodid) {
  curLevel = level.NONE;
  $("#modalConfirmAction").remove();
  $(".onFocus").removeClass("onFocus");
  setLoader();
  //TO DO: Setea el zindex en 10 para cuando este el curlevel en VIDEO o cuando creas el player
  if (!isNaN(Number(pvideoId)) && typeof Number(pvideoId) == "number") {
    setUserHistory(pvideoId, pprodid, "vimeo");
  } else {
    setUserHistory(pvideoId, pprodid, "jwplayer");
  }
}

function Destroy() {
  curLevel = level.BODY;
  if (jcp) {
    jcp.destroy();
    jcp = null;
  }
}
