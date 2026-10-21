/*
  Number input fix for calculators whose page code reads the inputs with
  parseFloat(value.replace(/,/g, "")) (savings and early-repayment pages,
  mainly the PL/NL versions, whose code embeds cannot be edited from here).

  The input formatter shows amounts as "10.000" and rates as "3,5", which
  that parser reads as 10 and 35. Right before the page code runs (capture
  phase of the "Calcular" click, or of the objective radio change), every
  formatted input gets a plain value ("10000", "3.5"). The visible values
  are put back straight after, so the visitor sees no change.

  Values that are already plain stay the same, so this is harmless on pages
  whose own parser is already fixed.
*/
(function () {
  "use strict";

  function toPlain(el) {
    var raw = String(el.value).replace(/\s/g, "");
    if (!raw) return raw;
    var fmt = el.getAttribute("data-format");
    if (fmt === "currency" || fmt === "positive-integer-number") {
      return raw.replace(/[.,]/g, "");
    }
    var m = raw.match(/^(.*)[.,](\d{1,2})$/);
    if (m) return m[1].replace(/[.,]/g, "") + "." + m[2];
    return raw.replace(/[.,]/g, "");
  }

  function normalise() {
    var inputs = document.querySelectorAll("input[data-format]");
    var saved = [];
    Array.prototype.forEach.call(inputs, function (el) {
      if (el.type === "radio" || el.type === "checkbox") return;
      var plain = toPlain(el);
      if (plain !== el.value) {
        saved.push([el, el.value]);
        el.value = plain;
      }
    });
    if (saved.length) {
      setTimeout(function () {
        saved.forEach(function (s) {
          /* only restore if the page code did not change the value itself */
          if (s[0].value === toPlain(s[0])) s[0].value = s[1];
        });
      }, 0);
    }
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t && t.closest && t.closest("#calcular")) normalise();
  }, true);

  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t && t.matches && t.matches('input[type="radio"][data-type="objetivo"]')) normalise();
  }, true);

  /* exposed for tests */
  window.__eupfToPlain = toPlain;
})();
