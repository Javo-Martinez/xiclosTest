function search() {
    console.log("getSearchPage");
    curLevel = level.SEARCH;
    $("body").append("<div id='modalSearch' class='modal'>");
    $(".onFocus").removeClass("onFocus");


    $("#modalSearch").append('<div class="trapezium2 modalTrapezium2"></div>');
    $("#modalSearch").append('<div class="trapezium modalTrapezium"></div>');
    $("#modalSearch").append('<div class="triangle"></div>');

    $("#modalSearch").append("<div id='searchWrapper'>");
    $("#searchWrapper").append("<div class='tira'><p>BÚSQUEDA DE PRODUCCIONES</p>");
    $("#searchWrapper").append("<input id='searchTerms' class='searchField searchTextBox onFocus' maxlength='35'>");
    $("#searchWrapper").append("<div id='searchButton' class= 'searchField searchButton' onclick='performSearch()'>BUSCAR");
    $("#searchWrapper").append("<div id='cancelButton' class= 'searchField searchButton' onclick='cancelSearch()'>CANCELAR");
    $("#searchTerms").focus();

            if ($("#newMenu").hasClass("newMenuActive")) {

                $("#newMenu").removeClass("newMenuActive");
                $(".menuTitle").css("display", "none");
            }
}


function performSearch(pid, searchType, pgenre) {


    if (pgenre === null || pgenre === undefined) {
        pgenre = '';
    }
    setLoader();
    var bookmarked = '';
    var students = '';
    var stripTitle = 'SEARCH';

    console.log("performSearch", searchType);
    if (searchType === "genre") {
        var url = getPathGenres();
        url = `${url}?genreId=${pid}`;
        stripTitle = decodeURI(pgenre);
        $("#modalGenreList").remove();
    } else if (searchType === "students") {
        url = getPathStudentsOnly();
        stripTitle = 'EXCLUSIVO PARA ALUMNOS';
        students = 'students';
    } else if (searchType === "history") {
        url = getPathUserHistory();
        stripTitle = 'LO QUE YA VISTE';
    } else if (searchType === "bookmark") {
        url = getPathUserBookmark();
        stripTitle = 'MI SELECCIÓN';
        bookmarked = 'bookmarked';
    } else {
        const terms = $("#searchTerms").val().toUpperCase()
        myTerms = '<span class="searchTerms">' + terms;
        url = `${getPathSearch()}?searchTerms=${terms}`
        stripTitle = 'RESULTADOS PARA ' + myTerms;
    }

    console.log("performSearch url " + url);
    const userSync = JSON.parse(localStorage.getItem("xiclos_sync"))
    console.log("USER", userSync.User)

    $.ajax({
        url: url,
        headers: {
            Authorization: "TV",
            U: JSON.stringify(userSync.User)
        },
        dataType: "json",
        type: "GET",
        success: function(resultData) {
            const result = resultData.data
            console.log("PERFORM SEARCH SUCCESS", url, resultData);

            $(".searchResult").remove();

            $(".onFocus").removeClass("onFocus");

            if ($("#newMenu").hasClass("newMenuActive")) {

                $("#newMenu").removeClass("newMenuActive");
                $(".menuTitle").css("display", "none");
            }


            ext = result.length;
            console.log("EXT", ext)
            if (ext !== 0) {

                $(".gridContent").css("display", "none");
                $("#grid").addClass("specialContentSearch");
                $("#grid").prepend("<div id='gridContent' class='gridContent searchResult " + bookmarked + students +"'>");
                $("#gridContent").append("<div id='headlineButton' class='verticalRectangle'></div>");
                $("#gridContent").append("<div id='stripTitle' class='stripTitle'>" + stripTitle);

                $("#gridContent").append("<div id='content' class='content'>");
                //setArrows();


                var firstElement = "";
                var lastElement = "";

                for (i = 0; i < ext; i++) {

                    if (i == 0) {
                        firstElement = 'firstElement';
                    } else if (i == detailLength - 1 && i != 0) {
                        lastElement = 'lastElement';
                    } else {
                        firstElement = '';
                        lastElement = '';
                    }

                    //RECORRO DETALLES
                    var detailLength = result.length;

                    if (i == 0) {
                        var onFocus = 'onFocus';
                    } else {
                        onFocus = '';
                    }

                    $("#content").append("<div id='box" + i + result[i].movieId + "' class='box " + firstElement + " " + lastElement + " " + onFocus + "' prodId='" + result[i].movieId + "' mediaId='" + result[i].mediaId + "' pindex='" + i + result[i].movieId + "'  onmouseover='focusDelay(\"" + 'box' + i + result[i].movieId + "\")' onmouseout='outOfFocus(\"" + 'box' + i + result[i].movieId + "\")'>");
                    $("#box" + i + result[i].movieId).append("<img id='img" + i + result[i].movieId + "' class='poster' src='" + result[i].poster + "'>");
                    $("#box" + i + result[i].movieId).append("<div class='posterTitle'>" + result[i].title + "</div>")

                    $("#header").append("<div id='prodDetails" + i + result[i].movieId + "' class='prodDetails searchResult'>");
                    $("#prodDetails" + i + result[i].movieId).append("<div id='detailsContainer" + i + result[i].movieId + "' class='detailsContainer searchResult'></div>'");
                    $("#detailsContainer" + i + result[i].movieId).append("<div class='prodTitle'>" + result[i].title + "</div>")
                    $("#detailsContainer" + i + result[i].movieId).append("<div class='prodSinopsis'>" + result[i].sinopsis + "</div>")
                    $("#detailsContainer" + i + result[i].movieId).append("<div class='prodAudience'>" + result[i].audience + "</div>")
                    $("#detailsContainer" + i + result[i].movieId).append("<div class='prodDuration'>" + result[i].duration + " minutos</div>")
                    // $("#detailsContainer" + i + result[i].movieId ).append("<div class='prodAudience'>"+result[i].language.replace('"','')+"</div>")
                    $("#detailsContainer" + i + result[i].movieId).append("<div class='prodYear'>" + result[i].year + "</div>")
                    $("#detailsContainer" + i + result[i].movieId).append("<div class='prodIMDB highlight'>IMDB: " + result[i].imdb + "</div>")
                    $("#detailsContainer" + i + result[i].movieId).append("<div style='clear:both'><br />");

                    if (result[i].genres.length !== 0) {
                        var genres = String(result[i].genres);
                        genres = genres.replace(/,/g, ", ");
                        $("#detailsContainer" + i + result[i].movieId).append("<div class='prodGenres'><span class='highlight'>Géneros:</span>  " + genres + "</div>")
                    }

                    var director = String(result[i].director);
                    director = director.replace(/,/g, ", ");
                    $("#detailsContainer" + i + result[i].movieId).append("<div class='prodDirector'><span class='highlight'> Director:</span> " + director + "</div>")

                    var actors = String(result[i].actors);
                    actors = actors.replace(/,/g, ", ");
                    $("#detailsContainer" + i + result[i].movieId).append("<div class='prodActors'><span class='highlight'>Elenco:</span>  " + actors + "</div> <br />")

                    if (i == 0) {
                        showProdDetails();

                    }
                }

                setTimeout(function() {
                    curLevel = level.BODY;
                    unsetLoader();

                $("#modalSearch").remove();
                $(".modal").remove();
                }, 3000);

            } else {
                $(".onFocus").removeClass("onFocus");
                if (searchType === "history") {
                    var alertMsg = "Todavía no viste ninguna película en Xiclos. <br />Próximamente encontrarás aquí todas aquellas que hayas visto";
                    showAlertSearch(alertMsg);
                } else if (searchType === "bookmark") {
                    var alertMsg = "Todavía no agregaste ninguna película a tu selección. <br />Cuando las agregues podrás encontrarlas aquí y verlas cuando quieras.";
                    showAlertSearch(alertMsg);
                } else {
                    var alertMsg = "No se encuentra el texto buscado: " + $("#searchTerms").val() + "<br />&iquest;Quieres realizar una nueva b&uacute;squeda?";
                    showConfirmSearch(alertMsg);

                }
                /*
                setTimeout(function() {
                    unsetLoader();
                    $("#modalSearch").remove();
                    curLevel = level.CONFIRM;
                }, 3000);
                */
            }
        },
        error: function(response) {
            logAction("search.performSearch", response, {
                msg: "Error on GET search.performSearch",
                url: url
            }, "error")

            unsetLoader();
        }
    });


}

function studentsOnly() {
    performSearch('', 'students');
}

function showConfirmSearch(pAlertMsg) {
    console.log("showConfirmSearch");
    curLevel = level.CONFIRM;
    $("body").append("<div id='modalConfirm' class='modal'>");
    $("#modalConfirm").append("<p id='confirm'>");
    $("#confirm").append('<p>' + pAlertMsg);
    $("#confirm").fadeIn('slow');
    $("#confirm").append("<button id='confirmAction' class='confirmField onFocus' onclick=reDoSearch();>SÍ");
    $("#confirm").append("<button id='cancelAction' class='confirmField' onclick=cancelSearch();>NO");
}

function showAlertSearch(pAlertMsg) {
    console.log("showAlertSearch");
    curLevel = level.CONFIRM;
    $("body").append("<div id='alertSearch' class='modal'>");
    $("#alertSearch").append('<div class="trapezium2 modalTrapezium2"></div>');
    $("#alertSearch").append('<div class="trapezium modalTrapezium"></div>');
    $("#alertSearch").append('<div class="triangle"></div>');
    $("#alertSearch").append("<p id='confirm'>");
    $("#confirm").append('<p>' + pAlertMsg);
    $("#confirm").fadeIn('slow');
    $("#confirm").append("<button id='confirmAction' class='confirmField onFocus' onclick=closeAlertSearch();>OK");
}

function closeAlertSearch() {
    $("#alertSearch").remove();
    $("#modal").remove();
    curLevel = level.BODY;
    setMenuFocus();
}

function cancelSearch() {
    $("#modalConfirm").remove();
    $("#modalSearch").remove();
    $("#modal").remove();

    if ($("#newMenu").hasClass("newMenuActive")) {

        $("#newMenu").removeClass("newMenuActive");
        $(".menuTitle").css("display", "none");
    }
    setFocus();
    curLevel = level.BODY;
    //setMenuFocus();

}

function reDoSearch() {
    $("#modalConfirm").remove();
    $("#modalSearch").remove();
    $("#modal").remove();
    search();
}

function endSearch() {
    $('.searchResult').remove();
}