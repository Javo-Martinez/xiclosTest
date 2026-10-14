//XICLOS
//SITE
$(function () {
  // Cuando se presiona una tecla sobre disparo la funcion keyDown
  $("body").keydown(function (event) {
    keyDown(event);
  });
});

$(".box").click(function (e) {
  e.preventdefault();
  $(".box").prop("disabled", true);
});

function focusDelay(pid) {
  timeout = setTimeout(function () {
    $(".onHover").removeClass("onHover");
    $(".onFocus").removeClass("onFocus");
    $(".activeContent").removeClass("activeContent");
    $("#" + pid)
      .addClass("onHover")
      .addClass("activeContent");
    console.log("in: #" + pid);

    var showDetail = pid.replace("box", "");

    $(".onHover")
      .addClass("onFocus")
      .attr("onclick", "showProdDetails(" + showDetail + ")");
    $("#" + pid).addClass("onFocus");
    //$('.onFocus').attr("onclick", "alert('No me peguen, soy onFocus')");
    showProdDetails(showDetail);
  }, 1000);
}

function outOfFocus(pid) {
  $("#" + pid).removeClass("onHover");
  $("#" + pid)
    .prop("onclick", null)
    .off("click");
  console.log("out");
  clearTimeout(timeout);
}

function menuFocus(pid) {
  $(".onHover").removeClass("onHover");
  $(".onFocus").removeClass("onFocus");
  $(".activeMenu").removeClass("activeMenu");
  $("#" + pid).addClass("onHover");

  var myOnclick = $("#" + pid).attr("clickparam");

  $("#" + pid).attr("onclick", myOnclick);
  console.log("in: #" + pid);
  $(".onHover").addClass("onFocus");
  $(".onFocus").attr("cursor", "pointer");
  $(".onFocus").addClass("activeMenu");
}

function menuFocusDelay(pid) {
  timeout = setTimeout(function () {
    menuFocus(pid);
  }, 500);
}

function outOfMenuFocus(pid) {
  $("#" + pid).removeClass("onHover");
  $("#" + pid).removeAttr("onclick");
  clearTimeout(timeout);
}

//SETUP
function initMainScreen() {
  console.log("INIT MAIN SCREEN", new Date());
  $("#modalPin").remove();
  setHome();
  getStrips();
  localStorage.removeItem("currentProduction");
  localStorage.removeItem("published_strips");
  localStorage.removeItem("detailedproduction");
}

function setHome() {
  curLevel = level.BODY;
  $("#header").css("display", "none");
  $("#results").remove();
}

function getStripsSuccess(resultData, offset) {
  const result = resultData.data;
  ext = result.length + offset;
  if ($("#header").length == 0) {
    $("body").append("<div id='header'>");
  }
  if ($("#grid").length == 0) {
    $("body").append("<div id='grid'>");
  }
  localStorage.setItem("published_strips", ext);
  if (offset == 0) {
    setArrows();
  }
  //setStripStructure();
  var myEndRow = 0;
  for (i = offset; i < ext; i++) {
    var sl = result[i - offset];
    $("#grid").append(
      "<div id='gridContent" + i + "' class='gridContent' sortId=" + i + ">"
    );
    $("#gridContent" + i).append(
      "<div id='headlineButton' class='verticalRectangle'></div>"
    );
    $("#gridContent" + i).append(
      "<div id='stripTitle' class='stripTitle'>" + sl.tira
    );
    $("#gridContent" + i).append(
      "<div id='content" + i + "' class='content' sortId=" + i + ">"
    );
    //RECORRO DETALLES
    var detailLength = sl.detalle.length;
    for (j = 0; j < detailLength; j++) {
      myEndRow++;

      if (j == 0 && i == 0) {
        var onFocus = "onFocus";
      } else {
        onFocus = "";
      }

      $("#content" + i).append(
        "<div id='box" +
          myEndRow +
          i +
          j +
          "' class='box " +
          onFocus +
          "' prodId='" +
          sl.detalle[j].movieId +
          "' mediaId='" +
          sl.detalle[j].mediaId +
          "' pindex='" +
          i +
          "'  onmouseover='focusDelay(\"" +
          "box" +
          myEndRow +
          i +
          j +
          "\")' onmouseout='outOfFocus(\"" +
          "box" +
          myEndRow +
          i +
          j +
          "\")'>"
      );
      $("#box" + myEndRow + i + j).append(
        "<img id='img" +
          myEndRow +
          i +
          j +
          "' class='poster' src='" +
          sl.detalle[j].poster +
          "'>"
      );
      $("#box" + myEndRow + i + j).append(
        "<div class='posterTitle'>" + sl.detalle[j].title + "</div>"
      );

      $("#header").append(
        "<div id='prodDetails" + myEndRow + i + j + "' class='prodDetails'>"
      );
      $("#prodDetails" + myEndRow + i + j).append(
        "<div id='detailsContainer" +
          myEndRow +
          i +
          j +
          "' class='detailsContainer'></div>'"
      );
      $("#detailsContainer" + myEndRow + i + j).append(
        "<div class='prodTitle'>" + sl.detalle[j].title + "</div>"
      );
      $("#detailsContainer" + myEndRow + i + j).append(
        "<div class='prodSinopsis'>" + sl.detalle[j].sinopsis + "</div>"
      );
      $("#detailsContainer" + myEndRow + i + j).append(
        "<div class='prodAudience'>" + sl.detalle[j].audience + "</div>"
      );
      $("#detailsContainer" + myEndRow + i + j).append(
        "<div class='prodDuration'>" + sl.detalle[j].duration + " minutos</div>"
      );
      $("#detailsContainer" + myEndRow + i + j).append(
        "<div class='prodYear'>" + sl.detalle[j].year + "</div>"
      );
      $("#detailsContainer" + myEndRow + i + j).append(
        "<div class='prodIMDB highlight'>IMDB: " + sl.detalle[j].imdb + "</div>"
      );
      $("#detailsContainer" + myEndRow + i + j).append(
        "<div style='clear:both'><br />"
      );

      if (sl.detalle[j].genres.length !== 0) {
        var genres = String(sl.detalle[j].genres);
        genres = genres.replace(/,/g, ", ");
        $("#detailsContainer" + myEndRow + i + j).append(
          "<div class='prodGenres'><span class='highlight'>Géneros:</span> " +
            genres +
            "</div>"
        );
      }

      var director = String(sl.detalle[j].director);
      director = director.replace(/,/g, ", ");
      $("#detailsContainer" + myEndRow + i + j).append(
        "<div class='prodDirector'><span class='highlight'>Director:</span> " +
          director +
          "</div>"
      );

      var actors = String(sl.detalle[j].actors);
      actors = actors.replace(/,/g, ", ");
      $("#detailsContainer" + myEndRow + i + j).append(
        "<div class='prodActors'><span class='highlight'>Elenco:</span> " +
          actors +
          "</div> <br />"
      );

      if (j == 0 && i == 0) {
        showProdDetails();
      }
    }
  }
  console.log("OFFSET", offset);
  if (offset == 0) {
    unsetLoader();
    // setTimeout( function(){
    //     $("#modal").remove();
    // },3000);
  } else {
    console.log("MENU STRIP");
    getMenuStrip();
  }

  console.log("END GET STRIPTS", offset, new Date());
}

function getStrips() {
  setLoader();
  var urlStrips = getPathHome();

  $("#div_vimeo_player").css("display", "block");
  $("#mainContainer").css("display", "block");
  $("#result").css("display", "block");
  $("#logoXiclos").css("display", "block");
  $(".trapezium2").css("display", "block");
  $(".trapezium").css("display", "block");
  $(".triangle").css("display", "block");

  //Establezco el número máximo de tiras publicadas
  const userSync = JSON.parse(localStorage.getItem("xiclos_sync"));
  $.ajax({
    url: urlStrips + "?offset=0&limit=4",
    headers: {
      Authorization: "TV",
      U: JSON.stringify(userSync.User)
    },
    dataType: "json",
    type: "GET",
    success: function (data) {
      getStripsSuccess(data, 0);
      $.ajax({
        url: urlStrips + "?offset=4&limit=1000",
        headers: {
          Authorization: "TV",
          U: JSON.stringify(userSync.User)
        },
        dataType: "json",
        type: "GET",
        success: function (data) {
          getStripsSuccess(data, 4);
        },
        error: function (responseInt) {
          console.log("ERROR getStrips intern", responseInt);
        }
      });
    },
    error: function (responseExt) {
      console.log("ERROR getStrips extern", responseExt);
      unsetLoader();
    }
  });
}

function getCineclub() {
  setLoader();
  var urlStrips = getPathCineclub();

  //Establezco el número máximo de tiras publicadas
  const userSync = JSON.parse(localStorage.getItem("xiclos_sync"));

  $.ajax({
    url: urlStrips + "?videoclub=1",
    headers: {
      Authorization: "TV",
      U: JSON.stringify(userSync.User)
    },
    dataType: "json",
    type: "GET",
    success: function (resultData) {
      const result = resultData.data;
      $("#header").remove();
      $("#grid").remove();

      $("body").append("<div id='header'>");
      $("body").append("<div id='grid' class='cineclub'>");
      console.log("result cineclub: ", result);
      setArrows();
      ext = result.length;
      var myEndRow = 0;
      for (i = 0; i < ext; i++) {
        if (i == 0) {
          var fisrtStrip = "firstStrip";
        } else {
          fisrtStrip = "";
        }

        if (i == ext - 1) {
          var lastStrip = "lastStrip";
        } else {
          lastStrip = "";
        }
        $("#grid").append(
          "<div id='gridContent" + i + "' class='gridContent' sortId=" + i + ">"
        );
        $("#gridContent" + i).append(
          "<div id='headlineButton' class='verticalRectangle'></div>"
        );
        $("#gridContent" + i).append(
          "<div id='stripTitle' class='stripTitle'>" + result[i].tira
        );
        $("#gridContent" + i).append(
          "<div id='content" + i + "' class='content' sortId=" + i + ">"
        );
        //RECORRO DETALLES
        var detailLength = result[i].detalle.length;
        for (j = 0; j < detailLength; j++) {
          myEndRow++;

          if (j == 0 && i == 0) {
            var onFocus = "onFocus";
          } else {
            onFocus = "";
          }

          $("#content" + i).append(
            "<div id='box" +
              myEndRow +
              i +
              j +
              "' class='box " +
              onFocus +
              "' prodId='" +
              result[i].detalle[j].movieId +
              "' mediaId='" +
              result[i].detalle[j].mediaId +
              "' pindex='" +
              i +
              "'  onmouseover='focusDelay(\"" +
              "box" +
              myEndRow +
              i +
              j +
              "\")' onmouseout='outOfFocus(\"" +
              "box" +
              myEndRow +
              i +
              j +
              "\")'>"
          );
          $("#box" + myEndRow + i + j).append(
            "<img id='img" +
              myEndRow +
              i +
              j +
              "' class='poster' src='" +
              result[i].detalle[j].poster +
              "'>"
          );
          $("#box" + myEndRow + i + j).append(
            "<div class='posterTitle'>" + result[i].detalle[j].title + "</div>"
          );

          $("#header").append(
            "<div id='prodDetails" + myEndRow + i + j + "' class='prodDetails'>"
          );
          $("#prodDetails" + myEndRow + i + j).append(
            "<div id='detailsContainer" +
              myEndRow +
              i +
              j +
              "' class='detailsContainer'></div>'"
          );
          $("#detailsContainer" + myEndRow + i + j).append(
            "<div class='prodTitle'>" + result[i].detalle[j].title + "</div>"
          );
          $("#detailsContainer" + myEndRow + i + j).append(
            "<div class='prodSinopsis'>" +
              result[i].detalle[j].sinopsis +
              "</div>"
          );
          $("#detailsContainer" + myEndRow + i + j).append(
            "<div class='prodAudience'>" +
              result[i].detalle[j].audience +
              "</div>"
          );
          $("#detailsContainer" + myEndRow + i + j).append(
            "<div class='prodDuration'>" +
              result[i].detalle[j].duration +
              " minutos</div>"
          );
          // $("#detailsContainer" + myEndRow + i + j).append("<div class='prodAudience'>"+result[i].detalle[j].language.replace('"','') +"</div>")
          $("#detailsContainer" + myEndRow + i + j).append(
            "<div class='prodYear'>" + result[i].detalle[j].year + "</div>"
          );
          $("#detailsContainer" + myEndRow + i + j).append(
            "<div class='prodIMDB highlight'>IMDB: " +
              result[i].detalle[j].imdb +
              "</div>"
          );
          $("#detailsContainer" + myEndRow + i + j).append(
            "<div style='clear:both'><br />"
          );

          if (result[i].detalle[j].genres.length !== 0) {
            var genres = String(result[i].detalle[j].genres);
            genres = genres.replace(/,/g, ", ");
            $("#detailsContainer" + myEndRow + i + j).append(
              "<div class='prodGenres'><span class='highlight'>Géneros:</span> " +
                genres +
                "</div>"
            );
          }

          var director = String(result[i].detalle[j].director);
          director = director.replace(/,/g, ", ");
          $("#detailsContainer" + myEndRow + i + j).append(
            "<div class='prodDirector'><span class='highlight'>Director:</span>" +
              director +
              "</div>"
          );

          var actors = String(result[i].detalle[j].actors);
          actors = actors.replace(/,/g, ", ");
          $("#detailsContainer" + myEndRow + i + j).append(
            "<div class='prodActors'><span class='highlight'>Elenco:</span> " +
              actors +
              "</div> <br />"
          );

          if (j == 0 && i == 0) {
            showProdDetails();
          }
        }
      }

      //getMenuStrip();

      setTimeout(function () {
        $("#modal").remove();
      }, 3000);
    },
    error: function (response) {
      console.log("ERROR getCineclub", response);
      unsetLoader();
    }
  });
}

function searchByGenre(genreid) {
  performSearch(genreid, "genre");
}

function showProdDetails() {
  $(".prodDetails").css("display", "none");
  var myID = $(".onFocus").attr("id");
  if (myID) {
    var detailID = myID;
    localStorage.setItem("focusedBox", myID);
    myID = myID.replace("box", "", myID);
    $("#prodDetails" + myID).css("display", "block");
    $("#searchProdDetails" + myID).css("display", "block");
    var src = $("#img" + myID).attr("src");
    $("#mainContainer").css("background", "url('" + src + "')");
    $("#mainContainer").css("background-repeat", "no-repeat");
    $("#mainContainer").css("background-position", "0px 25%");
    $("#mainContainer").css("background-size", "cover");
    var videoId = $("#box" + myID).attr("mediaId");
    var prodId = $("#box" + myID).attr("prodid");
    $(".box.onFocus").attr(
      "onclick",
      "setAction('" + videoId + "'," + prodId + ",'" + detailID + "')"
    );
  }
}

function isAlumno(subscriptions) {
  for (var i = 0; i < subscriptions.length; i++) {
    var su = subscriptions[i];
    if (
      su.su_name == "EXCLUSIVOALUMNOS01" ||
      su.su_name == "EXCLUSIVOALUMNOS01ANTIGUO"
    )
      return true;
  }
  return false;
}

function getMenuStrip() {
  $("#grid").append("<div id='gridContentMenu' class='gridContent menuStrip'>");
  $("#gridContentMenu").append(
    "<div id='stripTitle' class='stripTitle'>OPCIONES"
  );
  $("#gridContentMenu").append("<div id='contentMenu' class='content'>");
  $("#contentMenu").append(
    "<div id='boxMenu1' class='menu' onmouseover='menuFocusDelay(\"boxMenu1\")' onmouseout='outOfMenuFocus(\"boxMenu1\")' clickparam='search()'> <p>BUSCAR</p> </div>"
  );
  $("#contentMenu").append(
    "<div id='boxMenu3' class='menu' onmouseover='menuFocusDelay(\"boxMenu3\")' onmouseout='outOfMenuFocus(\"boxMenu3\")' clickparam='getGenreList()'> <p>EXPLORAR</p> </div>"
  );
  $("#contentMenu").append(
    "<div id='boxMenu5' class='menu' onmouseover='menuFocusDelay(\"boxMenu5\")' onmouseout='outOfMenuFocus(\"boxMenu5\")' clickparam='getCineclub()'> <p>CINECLUB</p> </div>"
  );
  $("#contentMenu").append(
    "<div id='boxMenu2' class='menu' onmouseover='menuFocusDelay(\"boxMenu2\")' onmouseout='outOfMenuFocus(\"boxMenu2\")' clickparam='performSearch(0,\"bookmark\")'> <p>MI LISTA</p> </div>"
  );
  var user = localStorage.getItem("xiclos_sync");
  user = user && JSON.parse(user);
  if (user && user.User && user.User.subscriptions) {
    console.log(
      "USER",
      user && user.User && user.User.subscriptions[0],
      isAlumno
    );
    const _isAlumno = isAlumno(user.User.subscriptions);
    if (_isAlumno) {
      $("#contentMenu").append(
        "<div id='boxMenu6' class='menu' onmouseover='menuFocusDelay(\"boxMenu6\")' onmouseout='outOfMenuFocus(\"boxMenu6\")' clickparam='studentsOnly()'> <p>EXCLUSIVO</p> </div>"
      );
    }
  }
  $("#contentMenu").append(
    "<div id='boxMenu4' class='menu' onmouseover='menuFocusDelay(\"boxMenu4\")' onmouseout='outOfMenuFocus(\"boxMenu4\")' clickparam='performSearch(0,\"history\")'> <p>CONTINUAR VIENDO</p> </div>"
  );
  $("#contentMenu").append(
    "<div id='boxMenu7' class='menu' onmouseover='menuFocusDelay(\"boxMenu7\")' onmouseout='outOfMenuFocus(\"boxMenu7\")' clickparam='hideAppConfirm()'> <p>SALIR</p> </div>"
  );
  $("#contentMenu").append(
    "<div id='boxMenu8' class='menu' onmouseover='menuFocusDelay(\"boxMenu8\")' onmouseout='outOfMenuFocus(\"boxMenu8\")' clickparam='logoutConfirm()'> <p>CERRAR SESIÓN</p> </div>"
  );
}

//A CONFIRMAR USO
function exploreFocus(pid) {
  $(".onHover").removeClass("onHover");
  $(".onFocus").removeClass("onFocus");
  $(".activeExplore").removeClass("activeExplore");
  $("#" + pid).addClass("onHover");

  var myOnclick = $("#" + pid).attr("clickparam");

  $("#" + pid).attr("onclick", "getGenreSearch('" + myOnclick + "')");
  // console.log('in: #'+pid);
  $(".onHover").addClass("onFocus");
  $(".onFocus").attr("cursor", "pointer");
  $(".onFocus").addClass("activeExplore");
}

function exploreFocusDelay(pid) {
  timeout = setTimeout(function () {
    exploreFocus(pid);
  }, 1000);
}

function outOfExploreFocus(pid) {
  $("#" + pid).removeClass("onHover");
  $("#" + pid).removeAttr("onclick");
  clearTimeout(timeout);
}

//OTHERS
function getNextStrip() {
  num = JSON.parse(localStorage.getItem("last_charged_strip"));
  localStorage.setItem("last_charged_strip", num + 1);
}

//FAVORITOS
function createLinkBookmark(psid, classpremium) {
  console.log("createLinkBookmark");
  myString = "addBookmark(" + psid + "," + '"' + classpremium + '"' + ")";
  return myString;
}

function createLinkPlay(psid) {
  console.log("createLinkPlay");
  myString = "playProd(" + psid + ")";
  return myString;
}
