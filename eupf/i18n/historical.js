/*
  Translations for the S&P 500 historical returns calculator (EU Personal Finance).
  Loaded on every language version of the page, with the same footer code.
  Does nothing on the English page.
*/
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

  var P = L === "pl";
  var MIESIAC = { "styczeń": "styczniu", "luty": "lutym", "marzec": "marcu", "kwiecień": "kwietniu", "maj": "maju", "czerwiec": "czerwcu",
    "lipiec": "lipcu", "sierpień": "sierpniu", "wrzesień": "wrześniu", "październik": "październiku", "listopad": "listopadzie", "grudzień": "grudniu" };
  var SUMMARY = [
    [/^If you had invested$/, function () { return "Inwestycja w wysokości"; }],
    [/^in the S&P 500 in$/, function () { return "w S&P 500 dokonana w"; }],
    [/^, your investment would be worth$/, function () { return " byłaby warta"; }],
    [/^in$/, function () { return "w"; }],
    [/^, a total return of$/, function () { return ", co oznacza całkowity zwrot"; }],
    [/^, which translates to an average annual return of$/, function () { return ", czyli średni roczny zwrot"; }],
    [/^(\S+) (\d{4})$/, function (r) { return (MIESIAC[r[1]] || r[1]) + " " + r[2]; }]
  ];
  /* Validation messages are hardcoded in English in the PL embed. */
  var ERRORS_PL = [
    [/^Enter an investment amount greater than zero\.$/, function () { return "Wpisz kwotę inwestycji większą od zera."; }],
    [/^The start date is outside the available history \((.+) to (.+)\)\.$/, function (r) { return "Data początkowa wykracza poza dostępną historię (od " + r[1] + " do " + r[2] + ")."; }],
    [/^The latest date available in the history is (.+)\. Pick an end date on or before that\.$/, function (r) { return "Najpóźniejsza data dostępna w historii to " + r[1] + ". Wybierz datę końcową nie późniejszą niż ta."; }],
    [/^The end date must be after the start date\.$/, function () { return "Data końcowa musi być późniejsza niż data początkowa."; }]
  ];
  function apply() {
    if (P) {
      swap(document.getElementById("lfc-sp-error"), ERRORS_PL);
      swap(document.getElementById("lfc-sp-resumo-texto"), SUMMARY);
      fixCharts({ "Investment value": "Wartość inwestycji" });
    }
    fixNumbers(resultRoots());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

/* ================= All languages: default end date (Oct 2026) ================= */
/*
  The calculator selects the latest month of the dataset as the default end date,
  but the visible dropdown labels keep the text typed in the Designer (EN said
  "August 2026", PL and NL "December 2024"), so the page showed one date and
  calculated another. This copies the selected option into each label once the
  options exist, so the default always follows the data.
*/
(function () {
  var KEYS = ["mes-inicio", "ano-inicio", "mes-fim", "ano-fim"];
  function sync() {
    var done = true;
    KEYS.forEach(function (k) {
      var sel = document.querySelector('select[data-type="' + k + '"]');
      var disp = document.querySelector('[data-dd-display="' + k + '"]');
      if (!sel || !disp) return;
      var opt = sel.options && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
      if (!opt) { done = false; return; }
      var txt = (opt.textContent || "").trim();
      if (txt && disp.textContent.trim() !== txt) disp.textContent = txt;
    });
    return done;
  }
  var tries = 0;
  function loop() {
    var ok = sync();
    if (!ok && ++tries < 50) setTimeout(loop, 100);
  }
  function start() { loop(); setTimeout(sync, 1500); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
