/*
  Translations for the fire calculator (EU Personal Finance).
  Loaded on every language version of the page, with the same footer code.
  Each block below checks the page language itself and does nothing on other
  languages. The code was moved here unchanged from the localized page footers
  in Webflow (NL/PL), so the result is the same as before.
*/

/* ======================== PL ======================== */
/*
  PL — Kalkulator FIRE: zamiana € na zł
  ------------------------------------------------------------
  Strona jest już po polsku; jedyne euro to wartości liczone przez
  zewnętrzny calculadora-fire.js (np. "350.340,00€"). Ten skrypt
  zamienia € na zł z polskim formatem (350 340,00 zł), tylko /pl/.

  Dotyczy: wartość FIRE, prefiks € w polach formularza, oś/tooltip wykresu.

  GDZIE: Page settings > Custom code > "Before </body> tag", NA KOŃCU.
*/
(function () {
  if (!/^\/pl(\/|$)/.test(location.pathname)) return;
  var ZL = "zł";

  function reNum(num) { return num.replace(/\./g, " "); } /* kropki tysięcy -> spacja */
  function eurToZl(s) {
    if (!s || s.indexOf("€") === -1) return s;
    /* sufiks: 350.340,00€ -> 350 340,00 zł */
    s = s.replace(/(\d[\d.]*(?:,\d{1,2})?)\s*€/g, function (_, num) { return reNum(num) + " " + ZL; });
    /* prefiks: €350.340,00 -> 350 340,00 zł */
    s = s.replace(/€\s*(\d[\d.]*(?:,\d{1,2})?)/g, function (_, num) { return reNum(num) + " " + ZL; });
    s = s.replace(/€/g, ZL); /* samodzielne € */
    return s;
  }
  function wordEuro(s) { return s ? s.replace(/\beuro\b/gi, "złotych") : s; }

  function convert(root) {
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

  /* ── Wykres: bezpieczne opakowanie Chart.js (€ w osi/tooltipie -> zł) ── */
  if (window.Chart && !window.__plChartWrapped) {
    var _Chart = window.Chart;
    function wrapCb(obj, key) {
      if (obj && typeof obj[key] === "function") {
        var orig = obj[key];
        obj[key] = function () { var r = orig.apply(this, arguments); return (typeof r === "string") ? eurToZl(r) : r; };
      }
    }
    function patch(cfg) {
      try {
        var o = cfg && cfg.options;
        if (o && o.scales) ["x", "y"].forEach(function (ax) {
          if (o.scales[ax] && o.scales[ax].ticks) wrapCb(o.scales[ax].ticks, "callback");
        });
        if (o && o.plugins && o.plugins.tooltip && o.plugins.tooltip.callbacks) {
          ["label", "title", "afterLabel"].forEach(function (k) { wrapCb(o.plugins.tooltip.callbacks, k); });
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

  var running = false;
  function run() { if (running) return; running = true; try { convert(document.body); } finally { running = false; } }
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
      /* Tooltip title: calculadora-fire.js returns "1 year" / "N years". */
      var cb = o.plugins && o.plugins.tooltip && o.plugins.tooltip.callbacks;
      if (cb && typeof cb.title === "function" && !cb.title.__lfI18n) {
        var origTitle = cb.title;
        var newTitle = function () {
          var r = origTitle.apply(this, arguments);
          var y = (typeof r === "string") ? /^(\d+) years?$/.exec(r.trim()) : null;
          if (!y) return r;
          return (L === "pl") ? y[1] + " " + plLata(y[1]) : y[1] + " jaar";
        };
        newTitle.__lfI18n = true;
        cb.title = newTitle;
        changed = true;
      }
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

  var P = L === "pl";
  function apply() {
    swap(document.querySelector("[retirement-age]"), [
      [/^(\d+) years old$/, function (r) { return P ? r[1] + " " + plLata(r[1]) : r[1] + " jaar"; }]
    ]);
    swap(document.querySelector("[retirement-time-left]"), [
      [/^You are (-?\d+) years away from your early retirement, at (\d+) years old\.$/, function (r) {
        return P
          ? "Wcześniejsza emerytura za " + r[1] + " " + plLata(r[1]) + ", w wieku " + r[2] + " lat."
          : "Over " + r[1] + " jaar kun je met vroegpensioen, op " + r[2] + "-jarige leeftijd.";
      }]
    ]);
    fixCharts(P ? {
      "Accumulated interest": "Skumulowane odsetki",
      "Total investments": "Łączne wpłaty",
      "Final balance": "Saldo końcowe",
      "Years": "Lata"
    } : {
      "Accumulated interest": "Gecumuleerde rente",
      "Total investments": "Totale investeringen",
      "Final balance": "Eindsaldo",
      "Years": "Jaren"
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
