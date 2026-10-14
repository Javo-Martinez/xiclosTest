function checkLogin() {
  console.log("CHECK LOGIN MOCK");
}
/* ============== COMMON ==================== */
var URL_API_VERSION = "v1";

/* ============== AMBIENTE DE DESARROLLO ====================================== */

var URL_DOMAIN = "https://xiclos.com"; //Web local con carpeta api
var URL_PLAYER = "https://cdn.jwplayer.com/v2/media/";
var URL_DOMAIN_XICLOS = "https://xiclos.com"; //Web original
var URL_DOMAIN_BE = "https://us-central1-xiclos-prod.cloudfunctions.net/api/tv"; // "http://192.168.0.47:3001/tv" // Backend

// Importaciones:
var MOVIES_PAGE_SIZE = 9;
var SLIDERS_PAGE_SIZE = 8;

pdebugmode = localStorage.getItem("debug_mode");

// var USER_AGENT_EXAMPLES = [
//   "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36 WebAppManager",
//   "Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.5) AppleWebKit/537.36 (KHTML, like Gecko) 69.0.3497.106/5.5 TV Safari/537.36",
//   "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.34 Safari/537.36 WebAppManager",
//   "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.34 Safari/537.36 WebAppManager",
//   "Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) 76.0.3809.146/6.0 TV Safari/537.36",
//   "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 WebAppManager",
//   "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MTC20F; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.124 Mobile Safari/537.36 cordova-amazon-fireos/3.4.0 AmazonWebAppPlatform/3.4.0;2.0",
//   "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MTC20F; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.124 Mobile Safari/537.36 cordova-amazon-fireos/3.4.0 AmazonWebAppPlatform/3.4.0;2.0",
//   "Mozilla/5.0 (SMART-TV; Linux; Tizen) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.75 Safari/537.36 Tizen",
//   "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.34 Safari/537.36 WebAppManager",
//   "Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.5) AppleWebKit/537.36 (KHTML, like Gecko) 69.0.3497.106/5.5 TV Safari/537.36",
//   "Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.5) AppleWebKit/537.36 (KHTML, like Gecko) 69.0.3497.106/5.5 TV Safari/537.36",
//   "Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.5) AppleWebKit/537.36 (KHTML, like Gecko) 69.0.3497.106/5.5 TV Safari/537.36",
//   "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.34 Safari/537.36 WebAppManager",
//   "Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/5.0 TV Safari/537.36"
// ];

//Deprecado
function getPathDomain() {
  return URL_DOMAIN;
}

function getPathHome() {
  return URL_DOMAIN_BE + "/home";
}

function getPathMoreMovies() {
  return URL_DOMAIN_BE + "/moreMovies";
}

function getPathCineclub() {
  return URL_DOMAIN_BE + "/home";
}

function getPathNewPin() {
  return URL_DOMAIN_BE + "/newPin";
}

function getPathCheckPin() {
  return URL_DOMAIN_BE + "/checkPin";
}

function getPathCheckBookmark() {
  return URL_DOMAIN_BE + "/checkBookmark";
}

function getPathPlayer() {
  return URL_PLAYER;
}

function getPathGenres() {
  return URL_DOMAIN_BE + "/genres";
}

function getPathStudentsOnly() {
  return URL_DOMAIN_BE + "/studentsOnly";
}

function getPathSearch() {
  return URL_DOMAIN_BE + "/genericSearch";
}

function getPathRestrictedSearch() {
  return URL_DOMAIN_BE + "/genericRestrictedSearch";
}

function getPathUserHistory() {
  return URL_DOMAIN_BE + "/userHistory";
}

function getPathUserBookmark() {
  return URL_DOMAIN_BE + "/userBookmark";
}

function getPathGenreList() {
  return URL_DOMAIN_BE + "/genreslist";
}

//Datos del usuario
function getPathGetUserData() {
  return URL_DOMAIN_BE + "/userData";
}

//Agrega o elimina favoritos
function getPathSetBookmark() {
  return URL_DOMAIN_BE + "/setBookmark";
}

function getPathUptHistory() {
  return URL_DOMAIN_BE + "/updHistory";
}

function getPathDeleteHistory() {
  return URL_DOMAIN_BE + "/deletedHistory";
}

function getPathSetHistory() {
  return URL_DOMAIN_BE + "/setHistory";
}

function getPathGetResumePoint() {
  return URL_DOMAIN_BE + "/getResumePoint";
}

function getPathUnsync() {
  return URL_DOMAIN_BE + "/unsync";
}

function getPathLog() {
  return URL_DOMAIN_BE + "/log";
}

function getPathLogErrorNotification() {
  return URL_DOMAIN_BE + "/log-notification";
}

function isES6Supported(userAgent) {
  if (!userAgent || typeof userAgent !== "string") {
    return false;
  }

  var ua = userAgent.toLowerCase();

  if (ua.indexOf("tizen") !== -1) {
    var tizenMatch = ua.match(/tizen\s+(\d+\.\d+)/);
    if (tizenMatch) {
      var tizenVersion = parseFloat(tizenMatch[1]);
      // Tizen 5.0+ soporta ES6
      return tizenVersion >= 5.0;
    }
  }

  var chromeMatch = ua.match(/chrome\/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
  if (chromeMatch) {
    // LG webOS 5.0 con Chromium 68+ soporta ES6
    return parseInt(chromeMatch[1], 10) >= 68;
  }

  return false;
}

function loadScriptsSequentially(scriptsToLoad, index, callback) {
  // Si ya cargamos todos los scripts, llamar al callback
  if (index >= scriptsToLoad.length) {
    if (callback) callback();
    return;
  }

  var scriptSrc = scriptsToLoad[index];
  var script = document.createElement("script");
  script.src = scriptSrc;
  script.type = "text/javascript";

  script.onload = function () {
    if (typeof console !== "undefined" && console.log) {
      console.log("Script " + scriptSrc + " cargado correctamente");
    }
    // Cargar el siguiente script
    loadScriptsSequentially(scriptsToLoad, index + 1, callback);
  };

  script.onerror = function () {
    if (typeof console !== "undefined" && console.error) {
      console.error("Error cargando script: " + scriptSrc);
    }
    // Continuar con el siguiente script aunque este falle
    loadScriptsSequentially(scriptsToLoad, index + 1, callback);
  };

  document.head.appendChild(script);
}

function allScriptsLoaded() {
  console.log("Todos los scripts cargados correctamente");
  initXiclosTV();
}

function configureWebOSViewport() {
  var existingViewport = document.querySelector('meta[name="viewport"]');
  if (existingViewport) {
    existingViewport.remove();
  }

  console.log("configureWebOSViewport");

  var viewportMeta = document.createElement("meta");
  viewportMeta.name = "viewport";
  viewportMeta.content =
    "width=device-width, height=device-height, initial-scale=1.0, user-scalable=no";

  document.head.insertBefore(viewportMeta, document.head.firstChild);
}

// Configuración de tipo de TV
(function () {
  configureWebOSViewport();
  window.addEventListener("DOMContentLoaded", function () {
    var userAgent = navigator.userAgent;
    console.log("User Agent:", userAgent);

    console.log("is ES6 supported: ", isES6Supported(userAgent));
    // Lista de scripts a cargar
    var scriptsToLoad = [];
    var cssToLoad = [];

    var webKitAndChromium = isES6Supported(userAgent);
    var isFireStickDevice = false;

    if (typeof getTVInfo == "function") {
      getTVInfo(function (tvInfo) {
        if (tvInfo.platform.toLowerCase().indexOf("amazon") !== -1) {
          isFireStickDevice = true;
        }
      });
    }

    console.log("isFireStickDevice: ", isFireStickDevice);

    if (webKitAndChromium && !isFireStickDevice) {
      scriptsToLoad = [
        getPathDomain() + "/tv/common/v1/js/login.js",
        getPathDomain() + "/tv/common/v1/js/JCPlayer.js",
        getPathDomain() + "/tv/common/v1/js/spatial.js",
        getPathDomain() + "/tv/common/v1/js/utils.js",
        getPathDomain() + "/tv/common/v1/js/search.js",
        getPathDomain() + "/tv/common/v1/js/xiclos.js",
        getPathDomain() + "/tv/common/v1/js/arrows.js"
      ];
      cssToLoad = [
        getPathDomain() + "/tv/common/v1/css/arrows.css",
        getPathDomain() + "/tv/common/v1/css/custom.css",
        getPathDomain() + "/tv/common/v1/css/site.css",
        getPathDomain() + "/tv/common/v1/css/slider.css",
        getPathDomain() + "/tv/common/v1/css/style.css"
      ];
    } else {
      if (isFireStickDevice) {
        scriptsToLoad = [
          getPathDomain() + "/tv/common/legacy/js/login.js",
          getPathDomain() + "/tv/common/legacy/js/JCPlayer.js",
          getPathDomain() + "/tv/common/legacy/js/utils.js",
          getPathDomain() + "/tv/common/legacy/js/search.js",
          getPathDomain() + "/tv/common/legacy/js/xiclos.js",
          getPathDomain() + "/tv/common/legacy/js/arrows.js"
        ];
        cssToLoad = [
          getPathDomain() + "/tv/common/legacy/css/arrows.css",
          getPathDomain() + "/tv/common/legacy/css/site.css",
          getPathDomain() + "/tv/common/legacy/css/slider.css",
          getPathDomain() + "/tv/common/legacy/css/style.css"
        ];
      } else {
        scriptsToLoad = [
          getPathDomain() + "/tv/common/legacy/js/login.js",
          getPathDomain() + "/tv/common/legacy/js/JCPlayer.js",
          getPathDomain() + "/tv/common/legacy/js/spatial.js",
          getPathDomain() + "/tv/common/legacy/js/utils.js",
          getPathDomain() + "/tv/common/legacy/js/search.js",
          getPathDomain() + "/tv/common/legacy/js/xiclos.js",
          getPathDomain() + "/tv/common/legacy/js/arrows.js"
        ];
        cssToLoad = [
          getPathDomain() + "/tv/common/legacy/css/arrows.css",
          getPathDomain() + "/tv/common/legacy/css/custom.css",
          getPathDomain() + "/tv/common/legacy/css/site.css",
          getPathDomain() + "/tv/common/legacy/css/slider.css",
          getPathDomain() + "/tv/common/legacy/css/style.css"
        ];
      }
    }
/*
    // Carga de CSS
    for (var i = 0; i < cssToLoad.length; i++) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssToLoad[i];
      document.head.appendChild(link);
    }

    // Carga de JS
    loadScriptsSequentially(scriptsToLoad, 0, function () {
      allScriptsLoaded();
    });

*/    

          allScriptsLoaded();
  });
})();
