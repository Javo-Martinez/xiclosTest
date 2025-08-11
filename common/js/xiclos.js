//XICLOS
//SITE
$(function() {
    // Cuando se presiona una tecla sobre disparo la funcion keyDown
    $('body').keydown(function(event) {
        keyDown(event);
    });
});


$(".box").click(function(e) {
    e.preventdefault();
    $('.box').prop('disabled', true);
});

function focusDelay(pid) {
    timeout = setTimeout(
        function() {
            $('.onHover').removeClass('onHover');
            $('.onFocus').removeClass('onFocus');
            $('.activeContent').removeClass('activeContent');
            $("#" + pid).addClass('onHover').addClass('activeContent');
            console.log('in: #' + pid);

            var showDetail = pid.replace("box", "")

            $('.onHover').addClass('onFocus').attr("onclick", "showProdDetails(" + showDetail + ")");
            $("#" + pid).addClass('onFocus');
            showProdDetails(showDetail);

        }, 1000);

}

function outOfFocus(pid) {
    $("#" + pid).removeClass('onHover');
    $("#" + pid).prop("onclick", null).off("click");
    console.log('out');
    clearTimeout(timeout);
}

function menuFocus(pid) {
    $('.onHover').removeClass('onHover');
    $('.onFocus').removeClass('onFocus');
    $('.activeMenu').removeClass('activeMenu');
    $("#" + pid).addClass('onHover');

    var myOnclick = $("#" + pid).attr('clickparam');

    $("#" + pid).attr("onclick", myOnclick)
    console.log('in: #' + pid);
    $('.onHover').addClass('onFocus');
    $('.onFocus').attr("cursor", "pointer");
    $('.onFocus').addClass('activeMenu');
}

function menuFocusDelay(pid) {
    timeout = setTimeout(
        function() {

            menuFocus(pid);
        }, 500);
}

function outOfMenuFocus(pid) {
    $("#" + pid).removeClass('onHover');
    //$("#"+pid).removeAttr("onclick");
    clearTimeout(timeout);
}

//SETUP
function initMainScreen() {
    console.log("INIT MAIN SCREEN", new Date())
    $("#modalPin").remove();
    setHome();
    getStrips();
    localStorage.removeItem("currentProduction");
    localStorage.removeItem("published_strips");
    localStorage.removeItem("detailedproduction");

}

function setHome() {

    curLevel = level.BODY;
    $("#header").css("display", "none")
    $("#results").remove();
}


function returnHome() {
    /*
    if ($('#gridContent').hasClass("bookmarked") || $('#gridContent').hasClass("students")) {
        $('#gridContent').remove();
        alert("sarasa 1")
    }
    $('.gridContent').css("display", "block");
    setFocus();

    if ($("#newMenu").hasClass("newMenuActive")) {

        $("#newMenu").removeClass("newMenuActive");
        $(".menuTitle").css("display", "none");
    }

    if ($("#grid").hasClass('cineclub') ||$("#grid").hasClass('specialContentSearch') || $("#gridContent").hasClass('searchResult')) {
        $("#header").remove();
        $("#grid").remove();
        getStrips();
    }
    */

        $("#newMenu").removeClass("newMenuActive");
        $(".menuTitle").css("display", "none");
        $("#header").remove();
        $("#grid").remove();
    
        getStrips();
        setFocus();

    timeout = setTimeout(
        function() {

            setFocus();
        }, 500);



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

        function getStripsSuccess(resultData, offset) {
            console.log("START GET STRIPTS", offset, new Date())

            const result = resultData.data
            ext = result.length + offset;

            if ($("#newMenu").length === 0) {
                $("#result").after("<div id='newMenu' onmouseover='setMenuFocus()' onmouseout='setMenuFocusOff()'></div>");

                function addMenuItem(id, imgSrc, text, onClick) {
                   $('#newMenu').append(
                    '<img src="' + imgSrc + '" class="icon" id="' + id + '" ' +
                    'onmouseover="menuFocusDelay(\'' + id + '\')" ' +
                    'onmouseout="outOfMenuFocus(\'' + id + '\')" ' +
                    'onclick="' + onClick + '" ' +
                    'style="cursor: pointer;">' +
                    '<p class="menuTitle">' + text + '</p>'
                );
                                
                }

                addMenuItem("buscar", "https://javo-martinez.github.io/xiclosTest/common/img/buscar.png", "Buscar", "search()");
                addMenuItem("home", "../common/img/home.png", "Inicio", "returnHome()");
                //addMenuItem("favoritos", "../common/img/favoritos.png", "Mis favoritos", "performSearch(0,'bookmark')");
                addMenuItem("cineclub", "../common/img/cineclub.png", "Cineclub", "getCineclub()");
                addMenuItem("explorar", "../common/img/explorar.png", "Explorar", "getGenreList()");

                var user = localStorage.getItem("xiclos_sync");
                user = user && JSON.parse(user);

                if (user && user.User && user.User.subscriptions) {
                    console.log("USER", user.User.subscriptions[0], isAlumno);
                    const _isAlumno = isAlumno(user.User.subscriptions);
                    if (_isAlumno) {
                        addMenuItem("alumnos", "../common/img/alumnos.png", "Alumnos", "studentsOnly()");
                    }
                }

                addMenuItem("salir", "../common/img/salir.png", "Salir", "hideAppConfirm()");
                addMenuItem("cerrar_sesion", "../common/img/cerrar_sesion.png", "Cerrar sesión", "logoutConfirm()");
            }

            if ($("#mainContent").length === 0) {
                $("#result").after("<div id='mainContent'>");
            }

            if ($("#header").length == 0) {
                $("#mainContent").append("<div id='header'>");
            }
            if ($("#grid").length == 0) {
                $("#mainContent").append("<div id='grid'>");
            }

            localStorage.setItem("published_strips", ext);
            /*    if(offset==0){
                    setArrows();
                }
            */
            //setStripStructure();
            var myEndRow = 0;
            for (i = offset; i < ext; i++) {
                var sl = result[i - offset]

                $("#grid").append("<div id='gridContent" + i + "' class='gridContent' sortId=" + i + ">");
                $("#gridContent" + i).append("<div id='headlineButton' class='verticalRectangle'></div>");
                $("#gridContent" + i).append("<div id='stripTitle' class='stripTitle'>" + sl.tira);
                $("#gridContent" + i).append("<div id='content" + i + "' class='content' sortId=" + i + ">");
                //RECORRO DETALLES
                var detailLength = sl.detalle.length;
                var firstElement = "";
                var lastElement = "";

                for (j = 0; j < detailLength; j++) {

                    myEndRow++;

                    if (j == 0) {
                        firstElement = 'firstElement';
                    } else if (j == detailLength - 1 && j != 0) {
                        lastElement = 'lastElement';
                    } else {
                        firstElement = '';
                        lastElement = '';
                    }

                    if (j == 0 && i == 0) {
                        var onFocus = 'onFocus';
                    } else {
                        onFocus = '';
                    }

                    $("#content" + i).append("<div id='box" + myEndRow + i + j + "' class='box " + firstElement + " " + lastElement + " " + onFocus + "' prodId='" + sl.detalle[j].movieId + "' mediaId='" + sl.detalle[j].mediaId + "' pindex='" + i + "'  onmouseover='focusDelay(\"" + 'box' + myEndRow + i + j + "\")' onmouseout='outOfFocus(\"" + 'box' + myEndRow + i + j + "\")'>");
                    $("#box" + myEndRow + i + j).append("<img id='img" + myEndRow + i + j + "' class='poster' src='" + sl.detalle[j].poster + "'>");
                    $("#box" + myEndRow + i + j).append("<div class='posterTitle'>" + sl.detalle[j].title + "</div>")

                    $("#header").append("<div id='prodDetails" + myEndRow + i + j + "' class='prodDetails'>");
                    //$("#prodDetails" + myEndRow + i).append("<div class='trapezium2'></div>");
                    //$("#prodDetails" + myEndRow + i).append("<img id='prodPoster"+myEndRow + i+"'class='prodPoster' src='"+getPathDomain()+sl.detalle[j].poster.replace('-205x347','')+"'></img>")
                    $("#prodDetails" + myEndRow + i + j).append("<div id='detailsContainer" + myEndRow + i + j + "' class='detailsContainer'></div>'");
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodTitle'>" + sl.detalle[j].title + "</div>")
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodSinopsis'>" + sl.detalle[j].sinopsis + "</div>")
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodAudience'>" + sl.detalle[j].audience + "</div>")
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodDuration'>" + sl.detalle[j].duration + " minutos</div>")
                    // $("#detailsContainer" + myEndRow + i + j).append("<div class='prodAudience'>"+sl.detalle[j].language.replace('"','') +"</div>")
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodYear'>" + sl.detalle[j].year + "</div>")
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodIMDB highlight'>IMDB: " + sl.detalle[j].imdb + "</div>")
                    $("#detailsContainer" + myEndRow + i + j).append("<div style='clear:both'><br />");

                    if (sl.detalle[j].genres.length !== 0) {
                        var genres = String(sl.detalle[j].genres);
                        genres = genres.replace(/,/g, ", ");
                        $("#detailsContainer" + myEndRow + i + j).append("<div class='prodGenres'><span class='highlight'>Géneros:</span> " + genres + "</div>")
                    }

                    var director = String(sl.detalle[j].director);
                    director = director.replace(/,/g, ", ");
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodDirector'><span class='highlight'>Director:</span> " + director + "</div>")

                    var actors = String(sl.detalle[j].actors);
                    actors = actors.replace(/,/g, ", ");
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodActors'><span class='highlight'>Elenco:</span> " + actors + "</div> <br />")

                    if (j == 0 && i == 0) {
                        showProdDetails();

                    }

                }

            }
            console.log("OFFSET", offset)
            if (offset == 0) {

                setTimeout(function() {
                  unsetLoader()
                }, 5000);
            }

            console.log("END GET STRIPTS", offset, new Date())

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
    const userSync = JSON.parse(localStorage.getItem("xiclos_sync"))
    $.ajax({
        url: `${urlStrips}?offset=0&limit=4`,
        headers: {
            Authorization: "TV",
            U: JSON.stringify(userSync.User)
        },
        dataType: "json",
        type: "GET",
        success: (data) => {
            getStripsSuccess(data, 0)
            $.ajax({
                url: `${urlStrips}?offset=4&limit=1000`,
                headers: {
                    Authorization: "TV",
                    U: JSON.stringify(userSync.User)
                },
                dataType: "json",
                type: "GET",
                success: (data) => getStripsSuccess(data, 4),
                error: function(response) {
                    logAction("getStrips", response, {
                        msg: "Error on GET getStrips",
                        url: `${urlStrips}?offset=0&limit=4`
                    }, "error")

                }
            });
        },
        error: function(response) {
            logAction("getStrips", response, {
                msg: "Error on GET getStrips",
                url: `${urlStrips}?offset=0&limit=4`
            }, "error")

            unsetLoader();
        }
    });



}

function getCineclub() {
    setLoader();
    var urlStrips = getPathCineclub();


    //Establezco el número máximo de tiras publicadas
    const userSync = JSON.parse(localStorage.getItem("xiclos_sync"))



            $(".onFocus").removeClass("onFocus");

            if ($("#newMenu").hasClass("newMenuActive")) {

                $("#newMenu").removeClass("newMenuActive");
                $(".menuTitle").css("display", "none");
            }


    $.ajax({
        url: `${urlStrips}?videoclub=1`,
        headers: {
            Authorization: "TV",
            U: JSON.stringify(userSync.User)
        },
        dataType: "json",
        type: "GET",
        success: function(resultData) {
            const result = resultData.data
            $("#header").remove();
            $("#grid").remove();


            if ($("#header").length == 0) {
                $("#mainContent").append("<div id='header'>");
            }
            if ($("#grid").length == 0) {
                $("#mainContent").append("<div id='grid' class='cineclub'>");
            }

            console.log('result cineclub: ', result);
            //setArrows();

            ext = result.length;
            var firstElement = "";
            var lastElement = "";



            var myEndRow = 0;
            for (i = 0; i < ext; i++) {

                $("#grid").append("<div id='gridContent" + i + "' class='gridContent' sortId=" + i + ">");
                $("#gridContent" + i).append("<div id='headlineButton' class='verticalRectangle'></div>");
                $("#gridContent" + i).append("<div id='stripTitle' class='stripTitle'>" + result[i].tira);
                $("#gridContent" + i).append("<div id='content" + i + "' class='content' sortId=" + i + ">");
                //RECORRO DETALLES
                var detailLength = result[i].detalle.length;
                var firstElement = "";
                var lastElement = "";

                for (j = 0; j < detailLength; j++) {

                    myEndRow++;


                    if (j == 0) {
                        firstElement = 'firstElement';
                    } else if (j == detailLength - 1 && j != 0) {
                        lastElement = 'lastElement';
                    } else {
                        firstElement = '';
                        lastElement = '';
                    }

                    if (j == 0 && i == 0) {
                        var onFocus = 'onFocus';
                    } else {
                        onFocus = '';
                    }    

                    $("#content" + i).append("<div id='box" + myEndRow + i + j + "' class='box  " + firstElement + " " + lastElement + " " + onFocus + "' prodId='" + result[i].detalle[j].movieId + "' mediaId='" + result[i].detalle[j].mediaId + "' pindex='" + i + "'  onmouseover='focusDelay(\"" + 'box' + myEndRow + i + j + "\")' onmouseout='outOfFocus(\"" + 'box' + myEndRow + i + j + "\")'>");
                    $("#box" + myEndRow + i + j).append("<img id='img" + myEndRow + i + j + "' class='poster' src='" + result[i].detalle[j].poster + "'>");
                    $("#box" + myEndRow + i + j).append("<div class='posterTitle'>" + result[i].detalle[j].title + "</div>")

                    $("#header").append("<div id='prodDetails" + myEndRow + i + j + "' class='prodDetails'>");

                    $("#prodDetails" + myEndRow + i + j).append("<div id='detailsContainer" + myEndRow + i + j + "' class='detailsContainer'></div>'");
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodTitle'>" + result[i].detalle[j].title + "</div>")
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodSinopsis'>" + result[i].detalle[j].sinopsis + "</div>")
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodAudience'>" + result[i].detalle[j].audience + "</div>")
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodDuration'>" + result[i].detalle[j].duration + " minutos</div>")
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodYear'>" + result[i].detalle[j].year + "</div>")
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodIMDB highlight'>IMDB: " + result[i].detalle[j].imdb + "</div>")
                    $("#detailsContainer" + myEndRow + i + j).append("<div style='clear:both'><br />");

                    if (result[i].detalle[j].genres.length !== 0) {
                        var genres = String(result[i].detalle[j].genres);   
                        genres = genres.replace(/,/g, ", ");
                        $("#detailsContainer" + myEndRow + i + j).append("<div class='prodGenres'><span class='highlight'>Géneros:</span> " + genres + "</div>")
                    }

                    var director = String(result[i].detalle[j].director);
                    director = director.replace(/,/g, ", ");
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodDirector'><span class='highlight'>Director:</span>" + director + "</div>")

                    var actors = String(result[i].detalle[j].actors);
                    actors = actors.replace(/,/g, ", ");
                    $("#detailsContainer" + myEndRow + i + j).append("<div class='prodActors'><span class='highlight'>Elenco:</span> " + actors + "</div> <br />")
                    

            if (j == 0 && i == 0) {
                showProdDetails();

            }

                }

            }

            setTimeout(function() {
                $("#modal").remove();
            }, 3000);
            curLevel = level.BODY;
            setFocus();


        },
        error: function(response) {
            logAction("getCineclub", response, {
                msg: "Error on GET getCineclub",
                url: `${urlStrips}?videoclub=1`
            }, "error")

            unsetLoader();
        }
    });
}



function searchByGenre(genreid) {
    performSearch(genreid, "genre");
}

function showProdDetails() {
    $(".prodDetails").css("display", "none");
    var myID = $(".onFocus").attr('id');
    if (myID) {
        var detailID = myID;
        localStorage.setItem("focusedBox", myID);

        myID = myID.replace("box", "", myID)

        $("#prodDetails" + myID).css("opacity", 0).css("display", "block").animate({
            opacity: 1
        }, 500)

        $("#searchProdDetails" + myID).css("display", "block");
        var src = $('#img' + myID).attr('src');
        $("#mainContainer").css("background", "url('" + src + "')");
        $("#mainContainer").css("background-repeat", "no-repeat");
        $("#mainContainer").css("background-position", "0px 25%");
        $("#mainContainer").css("background-size", "cover");

        var videoId = $('#box' + myID).attr('mediaId');
        var prodId = $('#box' + myID).attr('prodid');
        $('.box.onFocus').attr("onclick", "setAction('" + videoId + "'," + prodId + ",'" + detailID + "')");
    }


}


//A CONFIRMAR USO
function exploreFocus(pid) {
    $('.onHover').removeClass('onHover');
    $('.onFocus').removeClass('onFocus');
    $('.activeExplore').removeClass('activeExplore');
    $("#" + pid).addClass('onHover');

    var myOnclick = $("#" + pid).attr('clickparam');

    $("#" + pid).attr("onclick", "getGenreSearch('" + myOnclick + "')")
    // console.log('in: #'+pid);
    $('.onHover').addClass('onFocus');
    $('.onFocus').attr("cursor", "pointer");
    $('.onFocus').addClass('activeExplore');
}

function exploreFocusDelay(pid) {
    timeout = setTimeout(
        function() {
            exploreFocus(pid);
        }, 1000);
}

function outOfExploreFocus(pid) {
    $("#" + pid).removeClass('onHover');
    $("#" + pid).removeAttr("onclick");
    clearTimeout(timeout);
}


//OTHERS
function getNextStrip() {
    num = JSON.parse(localStorage.getItem("last_charged_strip"));
    //getEachStrip(num + 1);
    localStorage.setItem("last_charged_strip", num + 1);
}


//FAVORITOS
function createLinkBookmark(psid, classpremium) {
    console.log("createLinkBookmark");
    myString = "addBookmark(" + psid + ',' + '"' + classpremium + '"' + ")";
    return (myString);
}

function createLinkPlay(psid) {
    console.log("createLinkPlay");
    myString = "playProd(" + psid + ")";
    return (myString);
}

