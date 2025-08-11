/* ============== COMMON ==================== */
var URL_API_VERSION = "v1";

/* ============== AMBIENTE DE DESARROLLO ====================================== */

var URL_DOMAIN = "https://xiclos.com"; //Web local con carpeta api
var URL_PLAYER = "https://cdn.jwplayer.com/v2/media/";
var URL_DOMAIN_XICLOS = "https://xiclos.com"; //Web original
var URL_DOMAIN_BE = "https://us-central1-xiclos-prod.cloudfunctions.net/api/tv"; // "http://192.168.0.47:3001/tv" // Backend

var MOVIES_PAGE_SIZE = 9;
var SLIDERS_PAGE_SIZE = 8;

pdebugmode = localStorage.getItem("debug_mode");

//Deprecado
function getPathDomain() {
  return URL_DOMAIN;
}

function getPathHome() {
  return URL_DOMAIN_BE + "/home";
  // return URL_DOMAIN_XICLOS + "/api/" + URL_API_VERSION + "/home.php";
}

function getPathMoreMovies() {
  return URL_DOMAIN_BE + "/moreMovies";
}

function getPathCineclub() {
  return URL_DOMAIN_BE + "/home";
  // return URL_DOMAIN_XICLOS + "/api/" + URL_API_VERSION + "/cineclub.php";
}

function getPathNewPin() {
  return URL_DOMAIN_BE + "/newPin";
  // return URL_DOMAIN_XICLOS + "/api/" + URL_API_VERSION + "/newPin.php";
}

function getPathCheckPin() {
  // return URL_DOMAIN_XICLOS + "/api/" + URL_API_VERSION + "/checkPin.php";
  return URL_DOMAIN_BE + "/checkPin";
}

function getPathCheckBookmark() {
  return URL_DOMAIN_BE + "/checkBookmark";
  // return URL_DOMAIN_XICLOS + "/api/" + URL_API_VERSION + "/checkBookmark.php"
}

function getPathPlayer() {
  return URL_PLAYER;
}

function getPathGenres() {
  return URL_DOMAIN_BE + "/genres";
  // return  URL_DOMAIN_XICLOS + "/api/" + URL_API_VERSION+"/genres.php";
}

function getPathStudentsOnly() {
  return URL_DOMAIN_BE + "/studentsOnly";
  // return  URL_DOMAIN_XICLOS + "/api/" + URL_API_VERSION+"/studentsOnly.php";
}

function getPathSearch() {
  return URL_DOMAIN_BE + "/genericSearch";
  //     return URL_DOMAIN_XICLOS + "/api/" + URL_API_VERSION + "/genericSearch.php";
}

function getPathRestrictedSearch() {
  return URL_DOMAIN_BE + "/genericRestrictedSearch";
  //     return URL_DOMAIN_XICLOS + "/api/" + URL_API_VERSION + "/genericRestrictedSearch.php";
}

function getPathUserHistory() {
  return URL_DOMAIN_BE + "/userHistory";
  //     return URL_DOMAIN_XICLOS + "/api/" + URL_API_VERSION + "/userHistory.php?user=";
}

function getPathUserBookmark() {
  return URL_DOMAIN_BE + "/userBookmark";
  //     return URL_DOMAIN_XICLOS + "/api/" + URL_API_VERSION + "/userBookmark.php?user=";
}

function getPathGenreList() {
  return URL_DOMAIN_BE + "/genreslist";
  //return URL_DOMAIN_XICLOS + "/api/" + URL_API_VERSION + "/genreslist.php";
}

//Datos del usuario
function getPathGetUserData() {
  return URL_DOMAIN_BE + "/userData";
  // return URL_DOMAIN_XICLOS + "/api/" + URL_API_VERSION + "/getUserData.php";
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
