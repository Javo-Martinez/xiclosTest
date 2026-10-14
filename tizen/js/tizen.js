window.onload = function() {
    // add eventListener for tizenhwkey
	
    document.addEventListener('tizenhwkey', function(e) {
        if (e.keyName == "back")
            try {
                tizen.application.getCurrentApplication().exit();
            } catch (ignore) {}
    });
    var textbox = document.querySelector('.contents');
    textbox.addEventListener("click", function() {
        box = document.querySelector('#textbox');
        box.innerHTML = box.innerHTML == "Basic" ? "Sample" : "Basic";
    });

};

function getTVInfo(callback){
    var tvInfo = {deviceId: "Unknown",platform: "TIZEN" }
    try{
        // console.log("TIZEN", tizen)
        // console.log("CAPABILITIES", tizen.systeminfo.getCapabilities())
        const info = tizen.systeminfo.getCapabilities()
        tvInfo = {
            deviceId:info.duid,
            platform: info.platformName
        }   
    }catch(e){
        console.log("GET TV INFO TIZEN ERROR", e)
    } 
    callback(tvInfo)
}

function setTV() {
    /* Set a user agent string */
    console.log("setTV function")
    console.log(tizen)
    var userAgent = "Mozilla/5.0 (Linux; Tizen 2.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36";
    //var userAgent = "SARASA";
    tizen.websetting.setUserAgentString(userAgent);
    tizen.tvinputdevice.registerKey("MediaPlay");
    tizen.tvinputdevice.registerKey("MediaPause");
    tizen.tvinputdevice.registerKey("MediaStop");
    tizen.tvinputdevice.registerKey("MediaRewind");
    tizen.tvinputdevice.registerKey("MediaFastForward");
    tizen.tvinputdevice.registerKey("MediaTrackPrevious");
    tizen.tvinputdevice.registerKey("MediaTrackNext");
    tizen.tvinputdevice.registerKey("Exit");
    tizen.tvinputdevice.registerKey("ColorF3Blue");
    tizen.tvinputdevice.registerKey("ColorF2Yellow");
    tizen.tvinputdevice.registerKey("0");
    tizen.tvinputdevice.registerKey("1");
    tizen.tvinputdevice.registerKey("2");
    tizen.tvinputdevice.registerKey("3");
    tizen.tvinputdevice.registerKey("4");
    tizen.tvinputdevice.registerKey("5");
    tizen.tvinputdevice.registerKey("6");
    tizen.tvinputdevice.registerKey("7");
    tizen.tvinputdevice.registerKey("8");
    tizen.tvinputdevice.registerKey("9");
    tizen.tvinputdevice.registerKey("Caption");
    pdebugSetting = localStorage.getItem("debug_mode");
    console.log("pdebugMode2 es " + pdebugSetting);
    if (pdebugSetting == "on") {
        $("body").append("<div id='debugMode'>TESTER MODE</div>");
    } else {
        $("#debugMode").remove();
    }
}

function hideApp() {
//    tizen.application.getCurrentApplication().exit();
    $("#modalConfirm").remove();
    if ($("#modalPin").length == 0){
        setFocusOn();
    }
    else{
        curLevel = level.BODY;
    }
    tizen.application.getCurrentApplication().hide();
}

function setPremiere(){
    console.log("setPremiere = true")
    return true;
}