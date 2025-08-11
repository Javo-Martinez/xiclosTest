//LOGOUT
function logout(hide) {
  // TODO Desincronizar el dispositivo a través del backend
  if (localStorage.getItem("xiclos_sync") !== null) {
    var userSync = localStorage.getItem("xiclos_sync");

    userSync = JSON.parse(userSync);
    const ud = { id: userSync.ud_id };
    $.ajax({
      url: getPathUnsync(),
      headers: {
        Authorization: "TV",
        U: JSON.stringify(userSync.User)
      },
      dataType: "json",
      type: "DELETE",
      data: ud,
      success: function () {
        console.log("DESINCRONIZADO", ud);
      },
      error: function (response) {
        console.log("ERROR logout", response);
      }
    });
  }
  localStorage.clear();
  hide && hideApp();
  location.reload();
}

//Chequea si el usuario está logueado
function checkLogin() {
  try {
    setLoader();
    $.getScript("https://cdn.jwplayer.com/libraries/uAC0h9eo.js");
    $("#mainContainer").css("background", "transparent");
    if (localStorage.getItem("xiclos_sync") !== null) {
      const userSyncString = localStorage.getItem("xiclos_sync");
      localStorage.clear();
      localStorage.setItem("xiclos_sync", userSyncString);
      const userSync = JSON.parse(userSyncString);
      checkMembership(userSync.ud_id);
    } else {
      var tvInfo = { deviceId: "Unknown", platform: "Unknown" };
      try {
        getTVInfo(getLinkPin);
      } catch (e) {
        console.log("ERROR checkLogin", e);
        getLinkPin(tvInfo);
      }
    }
  } catch (e2) {
    console.log("ERROR checkLogin", e2);
  }
}

function renderModalContent(id, newPin, seg) {
  if ($("#modalPin").get().length) {
    $("#pin").text(newPin);
    if (seg >= 0) {
      $("#time").text(seg);
    }
  } else {
    $("body").append("<div id='modalPin' class='simpleModal'>");
    $("#modalPin").append(
      "<p class='customMessage'>" +
        "<img src='" +
        getPathDomain() +
        "/tv/common/img/logo.png'>" +
        "<br/><br/>POR FAVOR, DESDE UNA PC O UN DISPOSITIVO MÓVIL" +
        "<br/>DIRIGITE AL SITIO WEB <span class='pinMessage'>xiclos.com</span>" +
        "<br/>CLICKEA EN LA PESTAÑA SINCRONIZAR DISPOSITIVO (PARA VERLA DEBE ESTAR LOGUEADO)" +
        "<br/> E INGRESÁ EL SIGUIENTE CÓDIGO <span class='pinMessage' id='pin'>" +
        newPin +
        "</span> PARA SINCRONIZAR ESTE DISPOSITIVO CON TU CUENTA." +
        "<br/> RENOVAREMOS EL CÓDIGO EN <span class='pinMessage' id='time'>" +
        seg +
        "</span> SEGUNDOS" +
        "<br/>" +
        "<br/> <button class='confirmField onFocus' autofocus " +
        (id ? "onclick=checkLinkDevice(" + id + ")" : "disabled") +
        ">Sincronizar Ahora</button>"
    );
  }
  unsetLoader();
}

//Solicita un pin de sincronización
var counter = "";
function getLinkPin(syncInfo) {
  abortTimer();
  var PINUrl = getPathNewPin();
  $.ajax({
    url: PINUrl,
    headers: {
      Authorization: "TV"
    },
    dataType: "json",
    type: "POST",
    data: syncInfo,
    success: function (result) {
      if (counter != "") {
        clearInterval(counter);
      }
      console.log("pinresult: ", result);
      var syncUserDevice = result.data; //Si ya sincronicé esto me trae el usuario, y sino me trae el "dispositivo"
      if (syncUserDevice && syncUserDevice.User) {
        localStorage.clear();
        localStorage.setItem("xiclos_sync", JSON.stringify(syncUserDevice));
        initMainScreen();
        setTV();
      } else {
        var newPin = result.data.ud_sync_code;
        var seg = 60;
        counter = setInterval(function () {
          renderModalContent(syncUserDevice.ud_id, newPin, seg--);
        }, 1000);
        createTimer(function () {
          getLinkPin({ id: syncUserDevice.ud_id });
        });
      }
    },
    error: function (response) {
      console.log("ERROR getLinkPin", response);
      logout(false);
    }
  });
}

function checkLinkDevice(id) {
  if ($("#helperMsg").get().length) {
    $("#helperMsg").text("Sincronizando...");
    $("#helperMsg").fadeIn("slow", "ease");
  } else {
    $("#modalPin").append(
      "<p id='helperMsg' class='customMessage' style='margin-top:10px;'>Sincronizando...</>"
    );
    $("#helperMsg").fadeIn("slow", "ease");
  }

  const checkUrl = getPathCheckPin();
  $.ajax({
    url: checkUrl,
    headers: {
      Authorization: "TV"
    },
    dataType: "json",
    type: "POST",
    data: {
      id: id
    },
    success: function (result) {
      var syncUserDevice = result.data; //Si ya sincronicé esto me trae el usuario, y sino me trae el "dispositivo"
      if (syncUserDevice && syncUserDevice.User) {
        abortTimer();
        if (counter != "") {
          clearInterval(counter);
        }
        localStorage.clear();
        localStorage.setItem("xiclos_sync", JSON.stringify(syncUserDevice));
        initMainScreen();
        setTV();
      } else {
        $("#helperMsg").text(
          "No encontramos un usuario sincronizado a este dispositivo."
        );
        $("#helperMsg").fadeOut(4000, function () {
          $("#helperMsg").remove();
        });
      }
    },
    error: function (response) {
      console.log("ERROR checkLinkDevice", response);
      $("#helperMsg").text("No pudimos sincronizar este dispositivo.");
      $("#helperMsg").fadeOut(4000, function () {
        $("#helperMsg").remove();
      });
    }
  });
}

//Cheque que el usuario logueado sea miembro
function checkMembership(id) {
  const checkUrl = getPathCheckPin();
  $.ajax({
    url: checkUrl,
    headers: {
      Authorization: "TV"
    },
    dataType: "json",
    type: "POST",
    data: {
      id: id
    },
    success: function (result) {
      var syncUserDevice = result.data;
      if (syncUserDevice && syncUserDevice.User) {
        localStorage.setItem("xiclos_sync", JSON.stringify(syncUserDevice));
        initMainScreen(); //Renderiza la pantalla inicial del usuario logueado
        setTV();
      } else {
        // console.log("Falló checkMembership")
        logout(false); //renderiza el logout
      }
      // unsetLoader()
    },
    error: function (response) {
      console.log("ERROR checkMembership", response);
      unsetLoader();
      logout(false); //renderiza el logout
    }
  });
}
