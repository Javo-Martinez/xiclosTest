function setArrows() {
  //Left Arrow
  if ($(".arrowL").length == 0) {
    $("#grid").append(
      "<div id='arrowL' class= 'navigationArrow arrowL' onclick= 'moveToLeft()'>"
    );
    $("#arrowL").append(
      "<svg id='svgicon-left' class='navArrow' fill='#eb564a' viewBox='0 0 24 24'><path d='M18.629 15.997l-7.083-7.081L13.462 7l8.997 8.997L13.457 25l-1.916-1.916z'></path></svg>"
    );
  }

  //Right Arrow
  if ($(".arrowR").length == 0) {
    $("#grid").append(
      "<div id='arrowR' class= 'navigationArrow arrowR' onclick= 'moveToRight()'>"
    );
    $("#arrowR").append(
      "<svg id='svgicon-right' class='navArrow' fill='#eb564a' viewBox='0 0 24 24'><path d='M18.629 15.997l-7.083-7.081L13.462 7l8.997 8.997L13.457 25l-1.916-1.916z'></path></svg>"
    );
  }

  //Top Arrow
  if ($(".arrowT").length == 0) {
    $("#grid").append(
      "<div id='arrowT' class= 'navigationArrow arrowT' onclick= 'moveToUp()'>"
    );
    $("#arrowT").append(
      "<svg id='svgicon-top' class='navArrow' fill='#eb564a' viewBox='0 0 24 24'><path d='M18.629 15.997l-7.083-7.081L13.462 7l8.997 8.997L13.457 25l-1.916-1.916z'></path></svg>"
    );
  }

  //Bottom Arrow
  if ($(".arrowB").length == 0) {
    $("#grid").append(
      "<div id='arrowB' class= 'navigationArrow arrowB' onclick= 'moveToDown()'>"
    );
    $("#arrowB").append(
      "<svg id='svgicon-bottom' class='navArrow' fill='#eb564a' viewBox='0 0 24 24'><path d='M18.629 15.997l-7.083-7.081L13.462 7l8.997 8.997L13.457 25l-1.916-1.916z'></path></svg>"
    );
  }
}
