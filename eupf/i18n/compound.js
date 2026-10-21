/*
  Translations for the compound calculator (EU Personal Finance).
  Loaded on every language version of the page, with the same footer code.
  Each block below checks the page language itself and does nothing on other
  languages. The code was moved here unchanged from the localized page footers
  in Webflow (NL/PL), so the result is the same as before.
*/

/* ======================== PL ======================== */
/*
  PL — Kalkulator procentu składanego: lokalizacja runtime (v2, naprawiona)
  ------------------------------------------------------------
  POPRAWKA: poprzednia wersja przy szukaniu zdania podsumowania
  trafiała w kontener-rodzic i nadpisując jego innerHTML kasowała
  karty/wykres/tabelę (pusta strona). Teraz wybieramy NAJBARDZIEJ
  szczegółowy element (najkrótszy tekst) i nigdy duży kontener.

  Robi: € → zł, słowo "euro" → "złotych", zdanie podsumowania → PL,
  nagłówki tabeli → PL, wykres (Chart.js) € + etykiety → PL.

  GDZIE: Page settings > Custom code > "Before </body> tag",
  NA KOŃCU (pod <script src="...">). Tylko /pl/.
*/
(function () {
  if (!/^\/pl(\/|$)/.test(location.pathname)) return;

  var ZL = "zł";

  var TERM_MAP = {
    "Year": "Rok", "Years": "Lata", "Month": "Miesiąc", "Period": "Rok",
    "Invested capital": "Wpłacony kapitał", "Invested": "Wpłaty",
    "Investments": "Wpłaty", "Total investments": "Łączne wpłaty",
    "Contributions": "Wpłaty", "Interest": "Odsetki",
    "Accumulated interest": "Skumulowane odsetki", "Total interest": "Łączne odsetki",
    "Total capital": "Kapitał całkowity", "Capital": "Kapitał",
    "Final capital": "Kapitał końcowy", "Total": "Razem",
    "Balance": "Saldo", "Final balance": "Saldo końcowe"
  };

  function eurToZl(s) {
    if (!s || s.indexOf("€") === -1) return s;
    s = s.replace(/€\s*(\d[\d.,   ]*)/g, "$1 " + ZL);
    s = s.replace(/€/g, ZL);
    s = s.replace(/(\d)\s*zł/g, "$1 " + ZL);
    s = s.replace(/ {2,}(zł)/g, " $1");
    return s;
  }
  function wordEuro(s) { return s ? s.replace(/\beuro\b/gi, "złotych") : s; }

  function convertTextNodes(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var n, nodes = [];
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var v = node.nodeValue, nv = v;
      if (v.indexOf("€") !== -1) nv = eurToZl(nv);
      if (/\beuro\b/i.test(nv)) nv = wordEuro(nv);
      if (nv !== v) node.nodeValue = nv;
    });
  }

  function plLata(n) {
    n = parseInt(n, 10);
    if (n === 1) return "rok";
    var d = n % 10, dd = n % 100;
    if (d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14)) return "lata";
    return "lat";
  }

  /* ── Podsumowanie: wybierz NAJKRÓTSZY pasujący element ── */
  function findSummaryEl() {
    var cands = document.querySelectorAll("p, span, div");
    var best = null, bestLen = Infinity;
    for (var i = 0; i < cands.length; i++) {
      var t = cands[i].textContent || "";
      if (/initial investment of/i.test(t) && /accumulated interest/i.test(t) && t.length < bestLen) {
        best = cands[i]; bestLen = t.length;
      }
    }
    /* tylko jeśli to faktyczne zdanie (krótkie), nigdy duży kontener */
    return (best && bestLen < 700) ? best : null;
  }
  function num(x) { return (x || "").replace(/€/g, "").trim(); }
  function translateSummary() {
    var el = findSummaryEl();
    if (!el) return;
    var m = (el.textContent || "").match(/initial investment of\s*€?\s*([\d.,\s]+?)\s*and invest\s*€?\s*([\d.,\s]+?)\s*per month at an annual rate of\s*([\d.,]+)\s*%?\s*for\s*(\d+)\s*years?,?\s*you will reach a final capital of\s*€?\s*([\d.,\s]+?)\s*\.\s*This amount consists of\s*€?\s*([\d.,\s]+?)\s*in investments and\s*€?\s*([\d.,\s]+?)\s*in accumulated interest/i);
    if (!m) return;
    var ini = num(m[1]), mon = num(m[2]), rate = num(m[3]), yrs = parseInt(m[4], 10),
        fin = num(m[5]), inv = num(m[6]), intr = num(m[7]);
    el.innerHTML =
      "Zaczynając od początkowej inwestycji <strong>" + ini + " " + ZL + "</strong> " +
      "i wpłacając <strong>" + mon + " " + ZL + "</strong> miesięcznie " +
      "przy rocznej stopie <strong>" + rate + "%</strong> " +
      "przez <strong>" + yrs + " " + plLata(yrs) + "</strong>, " +
      "osiągniesz kapitał końcowy <strong>" + fin + " " + ZL + "</strong>. " +
      "Kwota ta składa się z <strong>" + inv + " " + ZL + " wpłat</strong> " +
      "oraz <strong>" + intr + " " + ZL + " narosłych odsetek</strong>.";
  }

  function translateTable() {
    document.querySelectorAll(".table-content th").forEach(function (c) {
      var t = (c.textContent || "").trim();
      if (TERM_MAP[t]) c.textContent = TERM_MAP[t];
    });
  }

  /* ── Wykres: bezpieczne opakowanie Chart.js ──────── */
  if (window.Chart && !window.__plChartWrapped) {
    var _Chart = window.Chart;
    function mapTerm(s) { return (typeof s === "string" && TERM_MAP[s]) ? TERM_MAP[s] : s; }
    /* Tooltip title comes as "1 year" / "N years" from calculadora-juros.js. */
    function yearsPl(r) {
      var m = /^\s*(\d+)\s+years?\s*$/i.exec(r);
      return m ? m[1] + " " + plLata(m[1]) : r;
    }
    function wrapCb(obj, key) {
      if (obj && typeof obj[key] === "function") {
        var orig = obj[key];
        obj[key] = function () {
          var r = orig.apply(this, arguments);
          return (typeof r === "string") ? yearsPl(eurToZl(r)) : r;
        };
      }
    }
    function patch(cfg) {
      try {
        if (cfg && cfg.data && cfg.data.datasets)
          cfg.data.datasets.forEach(function (d) { if (d && d.label) d.label = mapTerm(d.label); });
        var o = cfg && cfg.options;
        if (o && o.scales) ["x", "y"].forEach(function (ax) {
          if (o.scales[ax]) {
            if (o.scales[ax].ticks) wrapCb(o.scales[ax].ticks, "callback");
            if (o.scales[ax].title && typeof o.scales[ax].title.text === "string")
              o.scales[ax].title.text = mapTerm(o.scales[ax].title.text);
          }
        });
        if (o && o.plugins) {
          if (o.plugins.title && typeof o.plugins.title.text === "string")
            o.plugins.title.text = mapTerm(o.plugins.title.text);
          if (o.plugins.tooltip && o.plugins.tooltip.callbacks)
            ["label", "title", "afterLabel"].forEach(function (k) { wrapCb(o.plugins.tooltip.callbacks, k); });
        }
      } catch (e) {}
      return cfg;
    }
    function PLChart(ctx, cfg) { return new _Chart(ctx, patch(cfg)); }
    /* skopiuj WSZYSTKIE właściwości statyczne (też nie-enumerowalne: register, defaults...) */
    Object.getOwnPropertyNames(_Chart).forEach(function (k) {
      if (k === "length" || k === "name" || k === "prototype") return;
      try { Object.defineProperty(PLChart, k, Object.getOwnPropertyDescriptor(_Chart, k)); } catch (e) {}
    });
    PLChart.prototype = _Chart.prototype;
    window.Chart = PLChart;
    window.__plChartWrapped = true;
  }

  /* The compounding option "Roczny" lives in the select choices, which the Webflow
     localization API cannot edit. Fixed here, on the option and on the custom
     dropdown links Finsweet builds from it. Runs once right away too, before the
     deferred Finsweet script reads the options. */
  function fixFrequencyLabels() {
    var els = document.querySelectorAll("select option, a.dropdown-calculadora, .dropdown-toggle > div");
    for (var i = 0; i < els.length; i++) {
      if ((els[i].textContent || "").trim() === "Roczny") els[i].textContent = "Rocznie";
    }
  }
  fixFrequencyLabels();

  function run() {
    fixFrequencyLabels();
    translateSummary();
    convertTextNodes(document.body);
    translateTable();
  }
  var running = false;
  function safeRun() { if (running) return; running = true; try { run(); } finally { running = false; } }
  function start() {
    safeRun();
    setTimeout(safeRun, 300);
    setTimeout(safeRun, 1000);
    var deb;
    new MutationObserver(function () { clearTimeout(deb); deb = setTimeout(safeRun, 80); })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
    document.addEventListener("click", function (e) { if (e.target.closest("#calcular")) setTimeout(safeRun, 250); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
