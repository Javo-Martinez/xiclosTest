function setTV(){
	pdebugSetting = localStorage.getItem("debug_mode");
	console.log("pdebugMode2 es "+pdebugSetting);
	if (pdebugSetting == "on"){
		$("body").append("<div id='debugMode'>TESTER MODE</div>");
	}
	else{
		$("#debugMode").remove();
	}

}

function getTVInfo(callback){
	var tvInfo = {deviceId: "Unknown", platform: "WebOS" }
	try {
		console.log("LG", webOS)
		webOS.deviceInfo(function (info){
			console.log("DEVICE INFO", info)
			callback(
				{
					deviceId:info.modelName,
					platform: "WebOS"
				}    
			)
		})
	} catch (error) {
		console.log("GET TV INFO WEBOS", error)		
		callback(tvInfo)
	}
}

function setPremiere(){
	console.log("setPremiere = false")
	return false;
}

function hideApp(){
	console.log("Enter HideApp Function");
    $("#modalConfirm").remove();
        if ($("#modalPin").length == 0){
            setFocusOn();
        }
        else{
            curLevel = level.BODY
        }
	// webOS.platformBack();
	window.close();
}

