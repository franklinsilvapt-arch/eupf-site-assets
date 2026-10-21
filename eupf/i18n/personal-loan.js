/*
  Translations for the personal-loan calculator (EU Personal Finance).
  Loaded on every language version of the page, with the same footer code.
  Each block below checks the page language itself and does nothing on other
  languages. The code was moved here unchanged from the localized page footers
  in Webflow (NL/PL), so the result is the same as before.
*/

/* ======================== PL ======================== */
/*
  PL — Kalkulator kredytu gotówkowego: lokalizacja runtime
  ------------------------------------------------------------
  Skrypt liczący jest WBUDOWANY w stopce strony i generuje (po
  angielsku, w €): disclaimer, tabelę i wykres. Ten skrypt nie
  rusza tamtego — naprawia wynik w przeglądarce, tylko na /pl/:

   • € → zł, z polskim formatem liczb (10 888,24 zł)
   • disclaimer ("If you borrow…") → polski (z RRSO)
   • nagłówki tabeli → polski
   • wykres (Chart.js): serie/oś/tooltip/€ → polski

  GDZIE: Page settings > Custom code > "Before </body> tag",
  NA KOŃCU, PONIŻEJ istniejącego <script>(function(){…})()</script>.
*/
(function () {
  if (!/^\/pl(\/|$)/.test(location.pathname)) return;

  var ZL = "zł";

  /* US "10,888.24" -> PL "10 888,24" (spacja nierozdzielająca jako tysiące) */
  function usToPl(num) {
    var neg = num.indexOf("-") === 0;
    num = num.replace("-", "");
    var parts = num.replace(/,/g, "").split(".");
    var intp = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    var dec = parts[1] ? "," + parts[1] : "";
    return (neg ? "-" : "") + intp + dec;
  }
  /* € (format US) -> zł (format PL) */
  function eurToZl(s) {
    if (!s || s.indexOf("€") === -1) return s;
    s = s.replace(/(-?\d[\d,]*(?:\.\d+)?)\s*€/g, function (_, num) { return usToPl(num) + " " + ZL; });
    s = s.replace(/€/g, ZL);
    return s;
  }
  function wordEuro(s) { return s ? s.replace(/\beuro\b/gi, "złotych") : s; }

  /* polska liczba mnoga "miesiąc" */
  function plMies(n) {
    n = parseInt(n, 10);
    if (n === 1) return "miesiąc";
    var d = n % 10, dd = n % 100;
    if (d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14)) return "miesiące";
    return "miesięcy";
  }

  /* Etykiety tabeli i wykresu (EN -> PL) */
  var TERM_MAP = {
    "Month": "Miesiąc",
    "Principal": "Kapitał",
    "Interest": "Odsetki",
    "Outstanding balance": "Saldo zadłużenia",
    "Monthly payment": "Rata miesięczna",
    "Instalment no.": "Nr raty"
  };

  /* ── Disclaimer: [data-disclaimer] EN -> PL ─────── */
  function translateDisclaimer() {
    var el = document.querySelector("[data-disclaimer]");
    if (!el) return;
    var t = el.textContent || "";
    if (!/If you borrow/i.test(t)) return; /* już PL lub puste */
    var m = t.match(/If you borrow\s*(.+?)\s*over\s*(\d+)\s*months,\s*with an APR of\s*([\d.,]+)\s*%?,\s*your estimated average monthly instalment will be\s*(.+?)\.\s*In total, you will pay\s*(.+?),\s*of which\s*(.+?)\s*is interest and other charges/i);
    if (!m) return;
    var L = eurToZl(m[1].trim()),
        n = m[2],
        apr = m[3].replace(/\./g, ","),
        pmt = eurToZl(m[4].trim()),
        mtic = eurToZl(m[5].trim()),
        custo = eurToZl(m[6].trim());
    el.innerHTML =
      "Jeśli pożyczysz <b>" + L + "</b> na <b>" + n + " " + plMies(n) + "</b>, " +
      "przy <b>RRSO " + apr + "%</b>, Twoja szacunkowa średnia rata miesięczna wyniesie <b>" + pmt + "</b>. " +
      "Łącznie zapłacisz <b>" + mtic + "</b>, z czego <b>" + custo + " to odsetki i inne opłaty</b>.";
  }

  /* ── Nagłówki tabeli ────────────────────────────── */
  function translateTable() {
    document.querySelectorAll(".table-content th").forEach(function (c) {
      var t = (c.textContent || "").trim();
      if (TERM_MAP[t]) c.textContent = TERM_MAP[t];
    });
  }

  /* ── € + słowo euro w pozostałym tekście ────────── */
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

  /* ── Wykres: bezpieczne opakowanie Chart.js ─────── */
  if (window.Chart && !window.__plChartWrapped) {
    var _Chart = window.Chart;
    function mapTerm(s) { return (typeof s === "string" && TERM_MAP[s]) ? TERM_MAP[s] : s; }
    function patch(cfg) {
      try {
        if (cfg && cfg.data && cfg.data.datasets)
          cfg.data.datasets.forEach(function (d) { if (d && d.label) d.label = mapTerm(d.label); });
        var o = cfg && cfg.options;
        if (o && o.scales) ["x", "y"].forEach(function (ax) {
          if (o.scales[ax]) {
            if (o.scales[ax].title && typeof o.scales[ax].title.text === "string")
              o.scales[ax].title.text = mapTerm(o.scales[ax].title.text);
            if (o.scales[ax].ticks && typeof o.scales[ax].ticks.callback === "function") {
              var oc = o.scales[ax].ticks.callback;
              o.scales[ax].ticks.callback = function () { var r = oc.apply(this, arguments); return (typeof r === "string") ? eurToZl(r) : r; };
            }
          }
        });
        if (o && o.plugins) {
          if (o.plugins.title && typeof o.plugins.title.text === "string")
            o.plugins.title.text = mapTerm(o.plugins.title.text);
          var cb = o.plugins.tooltip && o.plugins.tooltip.callbacks;
          if (cb) {
            if (typeof cb.label === "function") { var ol = cb.label; cb.label = function () { var r = ol.apply(this, arguments); return (typeof r === "string") ? eurToZl(r) : r; }; }
            if (typeof cb.title === "function") { var ot = cb.title; cb.title = function () { var r = ot.apply(this, arguments); return (typeof r === "string") ? r.replace(/\bMonth\b/g, "Miesiąc") : r; }; }
          }
        }
      } catch (e) {}
      return cfg;
    }
    function PLChart(ctx, cfg) { return new _Chart(ctx, patch(cfg)); }
    Object.getOwnPropertyNames(_Chart).forEach(function (k) {
      if (k === "length" || k === "name" || k === "prototype") return;
      try { Object.defineProperty(PLChart, k, Object.getOwnPropertyDescriptor(_Chart, k)); } catch (e) {}
    });
    PLChart.prototype = _Chart.prototype;
    window.Chart = PLChart;
    window.__plChartWrapped = true;
  }

  /* ── Pętla ──────────────────────────────────────── */
  var running = false;
  function run() {
    if (running) return;
    running = true;
    try {
      translateDisclaimer();
      translateTable();
      convertTextNodes(document.body);
    } finally { running = false; }
  }
  function start() {
    run();
    setTimeout(run, 300);
    setTimeout(run, 1000);
    var deb;
    new MutationObserver(function () { clearTimeout(deb); deb = setTimeout(run, 80); })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
    document.addEventListener("click", function (e) { if (e.target.closest("#calcular")) setTimeout(run, 250); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

/* ================= NL + PL: extra fixes (Oct 2026) ================= */
/*
  Texts that were still in English on /nl/ and /pl/ after calculating.
  Works on the page after the calculator has drawn it: exact texts,
  sentences split by <b>/<strong>, chart labels (translated on the live
  chart, so it does not matter when Chart.js loads) and, where the
  calculator prints English number format, 1,234.56 -> 1.234,56.
*/
(function () {
  var m = /^\/(nl|pl)(\/|$)/.exec(location.pathname);
  if (!m) return;
  var L = m[1];

  function eachText(root, fn) {
    if (!root) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), n, a = [];
    while ((n = w.nextNode())) {
      var tag = n.parentNode && n.parentNode.nodeName;
      if (tag !== "SCRIPT" && tag !== "STYLE" && tag !== "NOSCRIPT") a.push(n);
    }
    a.forEach(fn);
  }
  /* rules: [[/^...$/, function (match) { return "new text"; }], ...] on whole text nodes */
  function swap(root, rules) {
    eachText(root, function (n) {
      var v = n.nodeValue, t = v.trim();
      if (!t) return;
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i][0].exec(t);
        if (r) {
          var nv = rules[i][1](r);
          if (nv !== t) n.nodeValue = v.replace(t, nv);
          return;
        }
      }
    });
  }
  function exact(map) {
    return Object.keys(map).map(function (k) {
      var re = new RegExp("^" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$");
      return [re, function () { return map[k]; }];
    });
  }
  function fixCharts(map) {
    if (!window.Chart || !window.Chart.instances) return;
    function tr(s) { return (typeof s === "string" && Object.prototype.hasOwnProperty.call(map, s)) ? map[s] : null; }
    Object.keys(window.Chart.instances).forEach(function (k) {
      var c = window.Chart.instances[k], changed = false, v;
      ((c.data && c.data.datasets) || []).forEach(function (d) {
        if ((v = tr(d.label)) !== null) { d.label = v; changed = true; }
      });
      var o = c.options || {};
      if (o.plugins && o.plugins.title && (v = tr(o.plugins.title.text)) !== null) { o.plugins.title.text = v; changed = true; }
      ["x", "y"].forEach(function (ax) {
        var s = o.scales && o.scales[ax] && o.scales[ax].title;
        if (s && (v = tr(s.text)) !== null) { s.text = v; changed = true; }
      });
      if (changed) c.update("none");
    });
  }
  /* English number format -> NL "1.234,56" / PL "1 234,56" (only where the calculator prints English format) */
  function fixNumbers(roots) {
    var thou = L === "pl" ? " " : ".";
    roots.forEach(function (root) {
      eachText(root, function (n) {
        var v = n.nodeValue;
        if (!/\d[.,]\d/.test(v)) return;
        var nv = v.replace(/\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?(?![\d,])|\d+\.\d{1,2}(?![\d.])/g, function (x) {
          var p = x.split(".");
          return p[0].replace(/,/g, thou) + (p.length > 1 ? "," + p[1] : "");
        });
        if (nv !== v) n.nodeValue = nv;
      });
    });
  }
  function resultRoots() {
    return Array.prototype.slice.call(document.querySelectorAll(".all-results_wrapper, .table-content, [id^='lfc-']"));
  }
  function plLata(n) {
    n = parseInt(n, 10);
    if (n === 1) return "rok";
    var d = n % 10, dd = n % 100;
    return (d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14)) ? "lata" : "lat";
  }

  var running = false;
  function run() {
    if (running) return;
    running = true;
    try { apply(); } catch (e) {} finally { running = false; }
  }
  function start() {
    run();
    setTimeout(run, 300);
    setTimeout(run, 1200);
    var deb;
    new MutationObserver(function () { clearTimeout(deb); deb = setTimeout(run, 80); })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("#calcular")) { setTimeout(run, 300); setTimeout(run, 1200); setTimeout(run, 2500); }
    });
  }

  /* The English rich-text glossary (.glossary-rich-text) also renders on /nl/ and /pl/,
     next to the localized glossary: hide it there. EN is not affected. */
  function hideEnglishGlossary() {
    document.querySelectorAll(".glossary-rich-text").forEach(function (rt) {
      var wrap = rt.closest(".glossario-content_wrapper");
      var target = (wrap && !wrap.querySelector(".glossario-content_wrapper")) ? wrap : rt;
      if (target.style.display !== "none") target.style.display = "none";
    });
  }
  function apply() {
    hideEnglishGlossary();
    if (L !== "nl") return;
    swap(document.body, [
      [/^(.*)een hogere rente betekent dat je meer betaalt aan interest\.(.*)$/, function (r) {
        return r[1] + "een hogere rente betekent dat je meer rente betaalt." + r[2];
      }]
    ]);
    fixNumbers(resultRoots());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
