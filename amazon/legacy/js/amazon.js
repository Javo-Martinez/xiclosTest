window.onload = function () {

   console.log("window.onload");
    
};


function setTV(){
   console.log("setTV");
}

function hideApp()
{
   console.log("hideApp");
   window.open("", "_self").close();
}

function setPremiere() {
    console.log("setPremiere = true")
    return true;
}

function getTradeMark()
{
   console.log("getTradeMark");
   return "amazon";
}

function getTVInfo(callback){
   console.log('getInfoTV');
   var tvInfo = {deviceId: "Unknown",platform: "Amazon Platform" }
   callback(tvInfo)
}