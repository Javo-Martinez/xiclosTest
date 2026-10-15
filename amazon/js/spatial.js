/*
 * Xiclos TV v2 - sin uso en la v2
 * Este archivo mantiene su nombre porque lo carga el index.html empaquetado.
 * En Amazon (mientras siga con la versión anterior) carga la copia de amazon/legacy/js/spatial.js.
 * ES5 puro.
 */
if (window.XTV_BOOT && window.XTV_BOOT.legacy) {
  window.XTV_BOOT.loadAmazon("spatial.js");
} else {
  /* La v2 no usa este archivo. */
}
