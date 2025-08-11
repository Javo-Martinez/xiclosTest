var VK_ENTER = 13;
var VK_PAUSE = 19;
var VK_PAGE_UP = 33;
var VK_PAGE_DOWN = 34;
var VK_LEFT = 37;
var VK_UP = 38;
var VK_RIGHT = 39;
var VK_DOWN = 40;
var VK_0 = 48;
var VK_1 = 49;
var VK_2 = 50;
var VK_3 = 51;
var VK_4 = 52;
var VK_5 = 53;
var VK_6 = 54;
var VK_7 = 55;
var VK_8 = 56;
var VK_9 = 57;
var VK_D = 68;
var VK_RED = 403;
var VK_GREEN = 404;
var VK_YELLOW = 405;
var VK_BLUE = 406;
var VK_REWIND = 412;
var VK_STOP = 413;
var VK_PLAY = 415;
var VK_FAST_FWD = 417;
var VK_INFO = 457;
var VK_BACK = 461;
var VK_DONE = 65376;
var VK_RETURN = 10009;
var VK_RETURNHUB = 65385;
var VK_EXIT = 10182;
var VK_CAPTION = 10221;
var VK_ESCAPE = 27;
var VK_SPACE = 32;

var renderCaptionsNativelyVar = true;
if (navigator.userAgent.match(/chrome|chromium|crios/i)) {
  console.log("IF userAgent function");
  console.log("UserAgent: ", navigator.userAgent);
  console.log(getPathLogErrorNotification());
  renderCaptionsNativelyVar = false;
} else {
  console.log("Else userAgent function");
  console.log("UserAgent: ", navigator.userAgent);
  renderCaptionsNativelyVar = true;
}
var isLGTV = false;
if (navigator.userAgent.match(/WebOS|webOS|webos|Web0S|web0s|web0S/i)) {
  isLGTV = true;
}

console.log("Outside userAgent function");

function JCPlayer() {
  this.debug = false;
  this.delayedSeek = false;
  this.verbose = false;
  this.initialSeek = null;
  this.heartbeatURL = null;
  this.heartbeatInterval = 60;
  this.heartbeatOnPause = true;
  this.heartbeatOnSeek = true;
  this.heartbeatOnEnd = true;
  this.heartbeatOnInterval = true;
  this.heartbeatOnDestroy = true;
  this.HEARTBEAT_TEMPLATE_SECONDS = "__SECONDS__";
  this.DEBUG_DIV_ID = "jcplayer_debug_id";

  var _lastHeartbeat = 0;
  var that = this;
  var _player = null;
  var _trackCurrent = -1;

  this.onPlay = function (event) {};
  this.onPause = function (event) {};
  this.onEnded = function (event) {};
  this.onTimeUpdate = onTimeUpdate.bind(this); //function(event){};
  this.onHeartbeat = function (event, heartbeat, reason) {};

  this.onKeyDown = function (event) {};

  this.onClose = function () {};
  this.onUp = function () {};
  this.onDown = function () {};
  this.onLeft = function () {};
  this.onRight = function () {};
  this.onNumber = function (number) {};
  this.onPlayPause = function (isPlay) {};
  this.onStop = function () {};

  this.onButtonRed = function () {};
  this.onButtonGreen = function () {};
  this.onButtonYellow = function () {};

  this.onButtonBlue = onButtonBlue.bind(this);

  function _doDebugOutput(msg) {
    var divElem = document.getElementById(that.DEBUG_DIV_ID);
    if (divElem) {
      divElem.innerHTML += msg + "\n";
      divElem.scrollTop = divElem.scrollHeight;
    }
  }

  function _doHandleError(error) {
    _onError(error, "_doHandleError");
  }

  function _doHeartbeat(e, reason) {
    _lastHeartbeat = Math.round(e.seconds);
    if (that.heartbeatURL !== null) {
      var url = that.heartbeatURL.replace(
        that.HEARTBEAT_TEMPLATE_SECONDS,
        _lastHeartbeat
      );
      getCORS(url);
    }
    that.onHeartbeat(e, _lastHeartbeat, reason);
  }

  function _onError(e, description) {
    description = description || "onErrorEvent";

    m =
      description +
      ' {name: "' +
      e.name +
      '", method: "' +
      e.method +
      '", message: "' +
      e.message +
      '"}';
    _doDebugOutput(m);
  }

  this.create = function (
    elementOrId,
    IdJWMedia,
    resumePoint,
    durationMovie,
    progressIdMovie,
    movieIdMovie,
    playerType
  ) {
    setLoader();
    var idMedia = IdJWMedia;
    var API_JWPLAYER = getPathPlayer();
    var _url = API_JWPLAYER + idMedia;

    var VIMEO_URL_LINK =
      "https://us-central1-xiclos-prod.cloudfunctions.net/api/api/v2/vimeo/" +
      idMedia;

    console.log("ACA", playerType);

    if (playerType == "vimeo") {
      $.ajax({
        url: VIMEO_URL_LINK + "?hls=false",
        type: "GET",
        success: function (result) {
          console.log("VIMEO CREATE RESULT", result);
          _player = jwplayer(elementOrId);

          _player.setup({
            playlist: [result.data],
            autostart: false,
            responsive: true,
            displayPlaybackLabel: true,
            renderCaptionsNatively: renderCaptionsNativelyVar,
            stretching: "uniform"
          });

          _player.on("play", function () {
            $("#div_vimeo_player").focus();
          });

          _player.on("pause", function () {
            var positionOnPause = _player.getPosition();
            const userSync = JSON.parse(localStorage.getItem("xiclos_sync"));
            var posFloor = Math.floor(positionOnPause);
            console.log("asdasd", posFloor, durationMovie, posFloor % 15);
            if (posFloor > durationMovie * 0.95) {
              console.log(
                "Borrar progreso .. ID MP PROGRESS ",
                progressIdMovie
              );
              const urlPathDeleteHistory = getPathDeleteHistory();
              $.ajax({
                url: urlPathDeleteHistory,
                headers: {
                  Authorization: "TV",
                  U: JSON.stringify(userSync.User)
                },
                dataType: "json",
                data: { id: progressIdMovie },
                type: "DELETE",
                success: function () {
                  console.log("progress deleted - movie finish");
                },
                error: function (err) {
                  console.log("progress deleted", err);
                }
              });
            } else {
              // actualizar progreso
              console.log(
                "ACTULIZO PROGRESO",
                posFloor,
                durationMovie,
                progressIdMovie,
                movieIdMovie
              );
              const urlPathUpdateHistory = getPathUptHistory();
              $.ajax({
                url: urlPathUpdateHistory + "?id=" + movieIdMovie,
                headers: {
                  Authorization: "TV",
                  U: JSON.stringify(userSync.User)
                },
                dataType: "json",
                data: { time: posFloor },
                type: "PUT",
                success: function () {
                  console.log("progress updated");
                },
                error: function (err) {
                  console.log("progress updated error", err);
                }
              });
            }
          });

          _player.on("setupError", function (err) {
            console.log("onSetupError Jwplayer", err);
          });

          _player.on("error", function (err) {
            console.log("onError Jwplayer", err);
            var urlOnError = getPathLogErrorNotification();
            var bodyOnError = {
              message: "onError jwplayer",
              data: err,
              type: "ERROR"
            };
            $.ajax({
              url: urlOnError,
              headers: {
                Authorization: "TV"
              },
              dataType: "json",
              type: "POST",
              data: bodyOnError,
              success: function (result) {
                console.log("onSetupError logged on notifications DB");
              },
              error: function (response) {
                console.log("onSetupError failed to log");
                console.log(response);
              }
            });
          });

          _player.on("captionsList", function (trackList) {
            console.log("CaptionList");
            if (trackList && trackList.tracks && trackList.tracks.length > 1) {
              console.log("SetCurrentCaptions");
              _player.setCurrentCaptions(1);
            }
          });

          _player.on("firstFrame", function (ev) {
            if (isLGTV) {
              setTimeout(function playTimeOut() {
                _player.seek(resumePoint);
              }, 500);
            } else {
              _player.seek(resumePoint);
            }
          });

          // _player.seek(resumePoint);
          _player.play();

          onTimeUpdate(durationMovie, progressIdMovie, movieIdMovie);

          unsetLoader();
        },
        error: function (response) {
          console.log("ERROR VIMEO this.create", response);
          unsetLoader();
        }
      });
    } else {
      $.ajax({
        url: _url,
        type: "GET",
        success: function (result) {
          console.log("JCP CREATE RESULT", result);
          var sources = [];
          const mp4String = "video/mp4";

          function isSubstring(str, sub) {
            if (sub.length > str.length) return false;
            for (var i = 0; i < str.length - sub.length + 1; i++) {
              if (str[i] !== sub[0]) continue;
              var exists = true;
              for (var j = 1; j < sub.length && exists; j++) {
                if (str[i + j] == sub[j]) continue;
                exists = false;
              }
              if (exists) return true;
            }
            return false;
          }

          for (var i = 0; i < result.playlist[0].sources.length; i++) {
            if (isSubstring(result.playlist[0].sources[i].type, mp4String)) {
              if (sources.length == 0) {
                sources[0] = result.playlist[0].sources[i];
              } else {
                sources[sources.length] = result.playlist[0].sources[i];
              }
            }
          }
          function bubbleSort(array) {
            var done = false;
            while (!done) {
              done = true;
              for (var i = 1; i < array.length; i += 1) {
                if (array[i - 1].width < (array[i].width || 0)) {
                  done = false;
                  var tmp = array[i - 1];
                  array[i - 1] = array[i];
                  array[i] = tmp;
                }
              }
            }
            return array;
          }
          sources = bubbleSort(sources);
          console.log("JCP SOURCES: ", sources);
          const tracks = result.playlist[0].tracks;
          console.log("JCP TRACKS:", tracks);
          console.log("JCP CREATE RESULT 2", [
            { sources: sources, tracks: tracks }
          ]);
          _player = jwplayer(elementOrId);

          _player.setup({
            playlist: [{ sources: sources, tracks: tracks }],
            autostart: false,
            responsive: true,
            displayPlaybackLabel: true,
            renderCaptionsNatively: renderCaptionsNativelyVar,
            stretching: "uniform"
          });

          _player.on("play", function () {
            $("#div_vimeo_player").focus();
          });

          _player.on("pause", function () {
            var positionOnPause = _player.getPosition();
            const userSync = JSON.parse(localStorage.getItem("xiclos_sync"));
            var posFloor = Math.floor(positionOnPause);
            if (posFloor > durationMovie * 0.95) {
              console.log(
                "Borrar progreso .. ID MP PROGRESS ",
                progressIdMovie
              );
              const urlPathDeleteHistory = getPathDeleteHistory();
              $.ajax({
                url: urlPathDeleteHistory,
                headers: {
                  Authorization: "TV",
                  U: JSON.stringify(userSync.User)
                },
                dataType: "json",
                data: { id: progressIdMovie },
                type: "DELETE",
                success: function () {
                  console.log("progress deleted - movie finish");
                },
                error: function (err) {
                  console.log("progress deleted", err);
                }
              });
            } else {
              // actualizar progreso
              console.log(
                "ACTULIZO PROGRESO",
                posFloor,
                durationMovie,
                progressIdMovie,
                movieIdMovie
              );
              const urlPathUpdateHistory = getPathUptHistory();
              $.ajax({
                url: urlPathUpdateHistory + "?id=" + movieIdMovie,
                headers: {
                  Authorization: "TV",
                  U: JSON.stringify(userSync.User)
                },
                dataType: "json",
                data: { time: posFloor },
                type: "PUT",
                success: function () {
                  console.log("progress updated");
                },
                error: function (err) {
                  console.log("progress updated error", err);
                }
              });
            }
          });

          _player.on("setupError", function (err) {
            console.log("onSetupError Jwplayer", err);
          });

          _player.on("error", function (err) {
            console.log("onError Jwplayer", err);
            var urlOnError = getPathLogErrorNotification();
            var bodyOnError = {
              message: "onError jwplayer",
              data: err,
              type: "ERROR"
            };
            $.ajax({
              url: urlOnError,
              headers: {
                Authorization: "TV"
              },
              dataType: "json",
              type: "POST",
              data: bodyOnError,
              success: function (result) {
                console.log("onSetupError logged on notifications DB");
              },
              error: function (response) {
                console.log("onSetupError failed to log");
                console.log(response);
              }
            });
          });

          _player.on("captionsList", function (trackList) {
            console.log("CaptionList");
            if (trackList && trackList.tracks && trackList.tracks.length > 1) {
              console.log("SetCurrentCaptions");
              _player.setCurrentCaptions(1);
            }
          });

          _player.on("firstFrame", function (ev) {
            if (isLGTV) {
              setTimeout(function playTimeOut() {
                _player.seek(resumePoint);
              }, 500);
            } else {
              _player.seek(resumePoint);
            }
          });

          _player.seek(resumePoint);

          onTimeUpdate(durationMovie, progressIdMovie, movieIdMovie);

          unsetLoader();
        },
        error: function (response) {
          console.log("ERROR JCPlayer this.create", response);
          unsetLoader();
        }
      });
    }
  };

  function onButtonBlue() {
    var captions = _player.getCaptionsList();
    var currIndex = _player.getCurrentCaptions();
    var nextIndex = currIndex + 1;
    if (nextIndex >= captions.length) {
      nextIndex = 0;
    }
    _player.setCurrentCaptions(nextIndex);
  }

  function onTimeUpdate(duration, progressId, idMovie) {
    var verify = true;
    const userSync = JSON.parse(localStorage.getItem("xiclos_sync"));
    setTimeout(function () {
      _player.on("time", function (e) {
        const position = e.position;
        var posFloor = Math.floor(position);
        if (posFloor > duration * 0.95 && verify) {
          // borrar progreso
          console.log("Borrar progreso .. ID MP PROGRESS ", progressId);
          verify = false;
          _player.off("time");
          const urlPathDeleteHistory = getPathDeleteHistory();
          $.ajax({
            url: urlPathDeleteHistory,
            headers: {
              Authorization: "TV",
              U: JSON.stringify(userSync.User)
            },
            dataType: "json",
            data: { id: progressId },
            type: "DELETE",
            success: function () {
              console.log("progress deleted - movie finish");
            },
            error: function (err) {
              console.log("progress deleted", err);
            }
          });
          verify = false;
        } else if (posFloor % 15 == 0 && verify && posFloor < duration - 30) {
          // actualizar progreso
          console.log(
            "ACTULIZO PROGRESO",
            posFloor,
            duration,
            progressId,
            idMovie
          );
          const urlPathUpdateHistory = getPathUptHistory();
          $.ajax({
            url: urlPathUpdateHistory + "?id=" + idMovie,
            headers: {
              Authorization: "TV",
              U: JSON.stringify(userSync.User)
            },
            dataType: "json",
            data: { time: posFloor },
            type: "PUT",
            success: function () {
              console.log("progress updated");
            },
            error: function (err) {
              console.log("progress updated error", err);
            }
          });

          verify = false;
          setTimeout(function () {
            verify = true;
          }, 1000);
        }
      });
    }, 10000);
  }

  this.play = function () {
    if (_player) {
      try {
        //_player.play();
      } catch (e) {
        _doHandleError(e);
      }
    }
  };

  this.pause = function () {
    if (_player) {
      try {
        _player.pause();
      } catch (e) {
        _doHandleError(e);
      }
    }
  };

  this.playPause = function () {
    if (_player) {
      try {
        if (_player.getState() == "paused") {
          _player.play();
        } else {
          _player.pause();
        }
      } catch (e) {
        _doHandleError(e);
      }
    }
  };

  this.destroy = function () {
    if (that.debug) {
      m = "destroy ";
      _doDebugOutput(m);
      _doDebugOutput("==============================");
      _doDebugOutput("");
    }
    if (_player) {
      _player.remove();
    }
  };
}

function getCORS(url, success) {
  var xhr = new XMLHttpRequest();
  if (!("withCredentials" in xhr)) xhr = new XDomainRequest(); // fix IE8/9
  xhr.open("GET", url);
  xhr.onload = success;
  xhr.send();
  return xhr;
}
