var testerAccounts = ["mrtnz.jvr@gmail.com", "javomartinez@hotmail.com"];

var level = {
    "NONE": 0,
    "BODY": 1,
    "CONFIRM": 2,
    "LOGIN": 3,
    "SEARCH": 4,
    "VIDEO": 5,
    "MENU": 6
};

//var keyControl = '0';

var curLevel = level.BODY;

function setCurLevelBody() {
    curLevel = level.BODY;
}

function setCurLevelVideo() {
    curLevel = level.VIDEO;
}

// Busco la funcion adecuada dependindo de la tecla presionada
function keyDown(event) {
    switch (event.keyCode) {
        case VK_LEFT: {
            if (curLevel == level.NONE) {
                break;
            }
            if (curLevel == level.BODY) {
                moveInBody(event.keyCode);
                break;
            }
            if (curLevel == level.CONFIRM) {
                moveInCONFIRM(event.keyCode);
                break;
            }
            if (curLevel == level.SEARCH) {
                moveInSearch(event.keyCode);
                break;
            }
            if (curLevel == level.LOGIN) {
                moveInLogin(event.keyCode);
                break;
            }
            if (curLevel == level.MENU) {
                break;
            }
        }
        case VK_RIGHT: {
            if (curLevel == level.NONE) {
                break;
            }
            if (curLevel == level.BODY) {
                moveInBody(event.keyCode);
                break;
            }
            if (curLevel == level.CONFIRM) {
                moveInCONFIRM(event.keyCode);
                break;
            }
            if (curLevel == level.SEARCH) {
                moveInSearch(event.keyCode);
                break;
            }
            if (curLevel == level.LOGIN) {
                moveInLogin(event.keyCode);
                break;
            }
            if (curLevel == level.MENU) {
                moveInMENU(event.keyCode);
                break;
            }

        }
        case VK_DOWN: {
            if (curLevel == level.NONE) {
                break;
            }
            if (curLevel == level.BODY) {
                moveInBody(event.keyCode);
                break;
            }
            if (curLevel == level.CONFIRM) {
                moveInCONFIRM(event.keyCode);
                break;
            }
            if (curLevel == level.SEARCH) {
                moveInSearch(event.keyCode);
                break;
            }
            if (curLevel == level.LOGIN) {
                moveInLogin(event.keyCode);
                break;
            }
            if (curLevel == level.MENU) {
                moveInMENU(event.keyCode);
                break;
            }
        }
        case VK_UP: {
            if (curLevel == level.NONE) {
                break;
            }
            if (curLevel == level.BODY) {
                moveInBody(event.keyCode);
                break;
            }
            if (curLevel == level.CONFIRM) {
                moveInCONFIRM(event.keyCode);
                break;
            }
            if (curLevel == level.SEARCH) {
                moveInSearch(event.keyCode);
                break;
            }
            if (curLevel == level.LOGIN) {
                moveInLogin(event.keyCode);
                break;
            }
            if (curLevel == level.MENU) {
                moveInMENU(event.keyCode);
                break;
            }
        }
        case VK_ENTER: {
            emuleClick();
            break;
        }

        case VK_EXIT: {
            hideApp();
            break;
        }
        case VK_ESCAPE:
        case VK_RETURN:
        case VK_BACK: {
            if (jcp) {
                jcp.destroy();
                jcp = null;
            }

            if (curLevel == level.BODY) {
                if ($("#grid").hasClass('cineclub')) {
                    $("#header").remove();
                    $("#grid").remove();
                    getStrips();
                } else if ($("#gridContent").hasClass('searchResult')) {

                    $(".searchResult").remove();
                    setMenuFocus();
                } else {
                    console.log("ESCAPE: 1");
                    showConfirm("¿Confirmas que querés cerrar Xiclos?");
                }
            } else if (curLevel == level.CONFIRM) {
                console.log("ESCAPE: 2")
                setLoader();

                if ($('#gridContent').hasClass('bookmarked')) {
                    performSearch(0, "bookmark");
                }

                $(".modal").remove();
                curLevel = level.BODY

                if ($("#modalPin").length == 0) {
                    //setFocusOn();
                    if ($("#newMenu").hasClass("newMenuActive")) {
                        $("#newMenu").removeClass("newMenuActive");
                        $(".menuTitle").css("display", "none");
                    }

                    if ($("#grid").hasClass('cineclub')) {
                        $("#header").remove();
                        $("#grid").remove();
                        getStrips();
                    }


                    setFocus();

                    setTimeout(function() {
                        unsetLoader();
                    }, 3000);
                }

            } else if (curLevel == level.SEARCH) {
                cancelSearch();
                break;
            } else {

                if ($("#modalPIN").length > 0) {
                    showConfirm("¿Confirmas que querés cerrar Xiclos?");
                } else {
                    Destroy();
                    console.log("ESCAPE: 3");
                    setFocusOn();
                }
                break;
            }
        }


        case VK_DONE: {
            if (curLevel == level.SEARCH) {
                moveInSearch(event.keyCode);
                break;
            } else {
                moveInLogin(event.keyCode);
                break;
            }
        }

        case VK_RETURNHUB: {
            if ($("#searchWrapper").length > 0) {
                if (curLevel == level.CONFIRM) {
                    $('#header').html("");
                } else {
                    var alertMsg = "¿Realmente querés salir?";
                    showConfirmSearch(alertMsg);
                }
                break;
            } else if (curLevel == level.CONFIRM) {
                console.log("beforeActionLevel RETURNHUB: " + beforeActionLevel)
                holdFocus(beforeActionLevel);
                break;
            } else {
                var alertMsg = "¿Realmente querés salir?";
                if ($("#loginzone").length > 0) {
                    curLevel = level.BODY;
                }
                $('.onFocus').addClass('focusLost');
                $('.onFocus').removeClass('onFocus');
                beforeActionLevel = curLevel;
                showConfirm(alertMsg, curLevel)
                break;
            }
        }
        case VK_INFO: {
            window.location.reload();
            break;
        }
        case VK_BLUE: {
            if (curLevel == level.VIDEO) {
                jcp.onButtonBlue()
                break
            }
        }
        //agregado merge
        break;
    default:
        break;
    }
}

// Funcion para navegar el Header
// key : codigo ASCII de boton presionado
function moveInLogin(key) {
    switch (key) {
        case VK_DONE: {
            if ($('#userID').hasClass('onFocus')) {
                $('#userID').removeClass('onFocus');
                $('#usrPassword').addClass('onFocus').focus();
            } else if ($('#usrPassword').hasClass('onFocus')) {
                $('#usrPassword').removeClass('onFocus');
                $('#loginButton').addClass('onFocus').focus();
            }
            break;
        }
        case VK_DOWN: {
            if ($('#userID').hasClass('onFocus')) {
                $('#userID').removeClass('onFocus');
                $('#usrPassword').addClass('onFocus').focus();
            } else if ($('#usrPassword').hasClass('onFocus')) {
                $('#usrPassword').removeClass('onFocus');
                $('#loginButton').addClass('onFocus').focus();
            } else if ($('#loginButton').hasClass('onFocus')) {
                $('#loginButton').removeClass('onFocus');
                $('#userID').addClass('onFocus').focus();
            }
            break;
        }
        case VK_UP: {
            if ($('#userID').hasClass('onFocus')) {
                $('#userID').removeClass('onFocus');
                $('#loginButton').addClass('onFocus').focus();
            } else if ($('#usrPassword').hasClass('onFocus')) {
                $('#usrPassword').removeClass('onFocus');
                $('#userID').addClass('onFocus').focus();
            } else if ($('#loginButton').hasClass('onFocus')) {
                $('#loginButton').removeClass('onFocus');
                $('#usrPassword').addClass('onFocus').focus();
            }
            break;
        }
        //agregado merge      
        break;
    default:
        break;
    }
}

function moveInCONFIRM(key) {
    var onFocus = $('.onFocus');
    console.log("moveInCONFIRM", onFocus)
    switch (key) {
        case VK_LEFT: {
            if (onFocus.prev().hasClass('confirmField')) {
                changeFocus(onFocus.prev());
            }
            break;
        }
        case VK_RIGHT: {
            if (onFocus.next().hasClass('confirmField')) {
                changeFocus(onFocus.next());
            }
            break;
        }
        case VK_DOWN: {
            if (onFocus.nextAll().eq(2).hasClass('confirmField')) {
                changeFocus(onFocus.nextAll().eq(2));
            }
            break;
        }
        case VK_UP: {

            if (onFocus.prevAll().eq(2).hasClass('confirmField')) {
                changeFocus(onFocus.prevAll().eq(2));
            }
            break;
        }
        //agregado merge      
        break;
    default:
        break;
    }
}

function moveInMENU(key) {
    var onFocus = $('.onFocus');
    console.log("moveInMENU", onFocus)
    switch (key) {
        case VK_LEFT: {
            break;
        }
        case VK_RIGHT: {
            $('.onFocus').removeClass("onFocus");
            $("#newMenu").removeClass("newMenuActive");
            $(".menuTitle").css("display", "none");
            setFocusOn();
            break;
        }
        case VK_DOWN: {


            var $next = $(".onFocus").removeClass("onFocus").nextAll(".icon").first();
            if ($next.length === 0) { // Si no hay más .icon después, vuelve al primero
                $next = $("#newMenu .icon").first();
            }
            $next.addClass("onFocus");

            break;
        }
        case VK_UP: {

            var $prev = $(".onFocus").removeClass("onFocus").prevAll(".icon").first();
            if ($prev.length === 0) { // Si no hay más .icon antes, vuelve al último
                $prev = $("#newMenu .icon").last();
            }
            $prev.addClass("onFocus");
            break;
        }
    }
}


// Funcion para navegar el Body
// key : codigo ASCII de boton presionado
function moveInBody(key) {
    var onFocus = $('.onFocus');
    // var initRow = $(".initRow:last");
    switch (key) {
        case VK_LEFT: {
            console.log("LEFT", key)
            curLevel = level.NONE;

            $('.activeContent').removeClass("activeContent");



            if ($(".onFocus").hasClass("box")) {

                //OBTENER ELEMENTOS
                var $me = $(".onFocus");
                var elementID = $me.attr("id");
                var prevElementID = $me.prev().attr("id");
                var parentElementID = $me.parent().attr("id");

                //OBTENER POSICIONES
                var position = $("#" + elementID).offset();
                var parentPosition = $("#" + parentElementID).offset();
                var prevElementPosition = $("#" + prevElementID).offset();

                //OBTENER VALOR PARA MOVER LA GRILLA
                var ancho = $(".box").width(); //Ancho de la clase .box
                var margenDerecho = $(".gridContent").css("margin-right"); //margin left del parent (gridContent)
                var $width = parseFloat(margenDerecho) - parseFloat(ancho);

                //DETERMINO SI EL PRIMER ELEMENTO ESTA FULL VISIBLE

                var img = $("#" + parentElementID + " .firstElement img");
                var imageId = img.attr("id");


                //MOVER LA TIRA


                if (parseFloat(parentPosition.left) < 0) {

                    $me.parent().css("margin-left", parseFloat(parentPosition.left) + 160); //parseFloat($width));
                }

                if (!$me.hasClass("firstElement")) {

                    changeFocus($('.onFocus').prev());
                    showProdDetails();

                } else {
                    setMenuFocus();
                    break;
                }


            } else if ($(".onFocus").hasClass("explore")) {
                var $me = $(".explore:first");
                var focusClass = "explore";
            }

            $('.onFocus').addClass("activeContent");

            curLevel = level.BODY;
            break;
        }
        case VK_RIGHT: {
            curLevel = level.NONE;

            $('.activeContent').removeClass("activeContent");

            if ($(".onFocus").hasClass("box")) {

                //changeFocus($('.onFocus').next()); 

                //OBTENER ELEMENTOS
                var $me = $(".onFocus");
                var elementID = $me.attr("id");
                var nextElementID = $me.next().attr("id");
                var parentElementID = $me.parent().attr("id");

                //OBTENER POSICIONES
                var position = $("#" + elementID).offset();
                var parentPosition = $("#" + parentElementID).offset();
                var nextElementPosition = $("#" + nextElementID).offset();

                //OBTENER VALOR PARA MOVER LA GRILLA
                var ancho = $(".box").width(); //Ancho de la clase .box
                var margenIzquierdo = $(".gridContent").css("margin-left"); //margin left del parent (gridContent)
                var $width = parseFloat(ancho) + parseFloat(margenIzquierdo);

                if (!$me.hasClass("lastElement")) {

                    changeFocus($('.onFocus').next());
                    showProdDetails();

                    //MOVER LA TIRA
                    $me.parent().css("margin-left", parseFloat(parentPosition.left) - parseFloat($width));

                }
            } else if ($(".onFocus").hasClass("explore")) {
                var $me = $(".explore:first");
                var focusClass = "explore";
            }

            $('.onFocus').addClass("activeContent");
            curLevel = level.BODY;
            break;
        }
        case VK_UP: {
            console.log("VK_UP");
            endSearch();
            moveUp();
            break;
        }
        case VK_DOWN: {
                console.log("VK_DOWN");

            if (!$("#gridContent").hasClass("bookmarked")) {
                console.log("#searchResult " + $(".searchResult").length);
                localStorage.setItem("currentProduction", "0");
                localStorage.setItem("detailedproduction", "0");

                if ($(".searchResult").length > 0) {

                    break;

                } else {

                    $(".activeContent").removeClass('activeContent');
                    var $me = $(".gridContent:first");
                    $me.parent().append($me);
                    if (typeof myDelay !== "undefined") {
                        clearTimeout(myDelay);
                    }

                    myDelay = setTimeout(
                        function() {
                            setFocusOn();
                            if ($(".onFocus").hasClass('menu')) {
                                $("#mainContainer").css("background", 'url("../common/img/projector.jpg")');
                            }
                        }, 200);

                }
            }
            break;
        }
    }
}

function moveUp() {

    var $first = $(".gridContent:first");

    $(".activeContent").removeClass('activeContent');

    var $me = $(".gridContent:last");
    $me.parent().find(".content").css("margin-left", "40px");
    $me.parent().prepend($me);
    if (typeof myDelay !== "undefined") {
        clearTimeout(myDelay);
    }

    myDelay = setTimeout(
        function() {
            setFocusOn();
            if ($(".onFocus").hasClass('menu')) {
                $("#mainContainer").css("background", 'url("../common/img/projector.jpg")');
            }
        }, 200);
}

function moveInSearch(key) {
    var onFocus = $('.onFocus');
    var navButton = $('.navButton');
    switch (key) {
        case VK_UP: {
            if (onFocus.prev().hasClass('searchField')) {
                changeFocus(onFocus.prev());
            }
            break;
        }
        case VK_ENTER:
        case VK_DONE: {
            if ($("#searchButton").hasClass('onFocus')) {
                $("#searchTerms").blur();
                performSearch();
                break;
            } else if ($("#cancelButton").hasClass('onFocus')) {
                cancelSearch();
                break;
            } else {
                $("#searchTerms").blur();
                changeFocus(onFocus.next());
                break;
            }
        }
        case VK_DOWN: {
            if (onFocus.next().hasClass('searchField')) {
                changeFocus(onFocus.next());
            }
            break;
        }
        case VK_LEFT: {
            if (onFocus.prev().hasClass('searchField')) {
                changeFocus(onFocus.prev());
            }
            break;
        }
        case VK_RIGHT: {
            if (onFocus.next().hasClass('searchField')) {
                changeFocus(onFocus.next());
            }
            break;
        }
        if ($("#searchTerms").hasClass("onFocus")) {
            $("#searchTerms").focus();
        } else {
            $("#searchTerms").focusout();
        }
        //agregado merge      
        break;
    default:
        break;
    }
}

function changeFocus(newfocusOb) {
    //Remuevo el attr onClick
    var myID = $('.onFocus').attr('id');
    if ($("#" + myID).hasClass('box')) {
        $("#" + myID).removeAttr("onclick");
    }
    $('.onFocus').removeClass('onFocus');
    newfocusOb.addClass('onFocus');
}


// Funcion que emula cliquear sobre la div en foco.
function emuleClick() {
    //Validar si existe un video y que estado tiene para saber que hacer acá..
    console.log("EMULE CLICK", $(".onFocus"))
    if ($(".onFocus").attr('href') != undefined) {
        console.log("EMULE CLICK 1")
        window.location = $(".onFocus").attr('href');
    } else if ($(".onFocus").parent('a').attr('href') != undefined) {
        console.log("EMULE CLICK 2")
        window.location = $(".onFocus").parent('a').attr('href');
    } else {
        console.log("EMULE CLICK 3")
        $(".onFocus").click();
    }
}


//Funciones para navegación por flechas
function moveToRight() {
    curLevel = level.NONE;
    i = 0
    while (i <= 8) {
        if ($(".onFocus").hasClass("box")) {
            var $me = $(".box:first");
        } else if ($(".onFocus").hasClass("menu")) {
            var $me = $(".menu:first");
        } else if ($(".onFocus").hasClass("explore")) {
            var $me = $(".explore:first");
        }
        $me.parent().append($me);
        $("#modalCrew").remove();
        i++;
    }

    setFocusOn();

}

function moveToLeft() {
    curLevel = level.NONE;
    i = 0
    while (i <= 8) {
        if ($(".onFocus").hasClass("box")) {
            var $me = $(".content:first .box:last");
        } else if ($(".onFocus").hasClass("menu")) {
            var $me = $(".content:first .menu:last");
        } else if ($(".onFocus").hasClass("explore")) {
            var $me = $(".content:first .explore:last");
        }
        $me.parent().prepend($me);
        $("#modalCrew").remove();
        console.log("MOVE LEFT", i, $me)
        i++;
    }

    setFocusOn();

}


function moveToUp() {
    endSearch();
    var $first = $(".gridContent:first");

    var $me = $(".gridContent:last");
    $me.parent().prepend($me);


    setFocusOn();

    var $myPid = $(".onFocus");
    $("#" + $myPid[0].id).click(setPlayFocus);


}

function moveToDown(pOrigin) {
    endSearch();
    if ($('#arrowL').css('display') == 'none' && $('#arrowR').css('display') == 'none') {
        showLeftRigthArrow();
    }
    var $me = $(".gridContent:first");
    $me.parent().append($me);

    setFocusOn();

    var $myPid = $(".onFocus");
    $("#" + $myPid[0].id).click(setPlayFocus);
}

function removeDivsFirstRow() {
    if ($("#searchResult").length > 0) {
        $("#searchResult").remove();
    }
    if ($(".menuExplore").length > 0) {
        $("#menuExplore").remove();
    }
}