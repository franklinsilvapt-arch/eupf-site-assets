/*
  Translations for the mortgage calculator (EU Personal Finance).
  Loaded on every language version of the page, with the same footer code.
  Each block below checks the page language itself and does nothing on other
  languages. The code was moved here unchanged from the localized page footers
  in Webflow (NL/PL), so the result is the same as before.
*/

/* ======================== NL ======================== */
/*
  Mortgage calculator — NL override.
  De rekenlogica zit in een EXTERN bestand (mortgage.js) dat niet in
  Webflow te bewerken is. Dit script laat dat bestand met rust en
  vertaalt de Engelse teksten NADAT ze verschijnen.

  PLAATSEN: Page settings > Custom code > "Before </body> tag",
  ONDER de regel <script src="...mortgage.js"></script> plakken.
  Draait alleen op /nl/. Chart.js staat al in de <head>, dus het
  ombouwen van de grafiek werkt meteen.

  Dekt: grafiek (labels Interest/Principal, titel "Monthly payment",
  x-as "Instalment no.", tooltip "Month X"), tabelkoppen en de
  dynamische disclaimerzin.
*/
(function () {
  if (!/^\/nl(\/|$)/.test(location.pathname)) return;

  /* ── 1) Grafiek: Chart.js inpakken zodat config-teksten NL worden ── */
  var CHART_TERMS = {
    "Interest": "Rente",
    "Principal": "Aflossing",
    "Monthly payment": "Maandlast",
    "Instalment no.": "Termijn nr."
  };
  function trTerm(s) {
    return (typeof s === "string" && CHART_TERMS[s] != null) ? CHART_TERMS[s] : s;
  }
  function rewriteChartConfig(cfg) {
    try {
      if (cfg && cfg.data && Array.isArray(cfg.data.datasets)) {
        cfg.data.datasets.forEach(function (d) { if (d && d.label) d.label = trTerm(d.label); });
      }
      var opt = cfg && cfg.options ? cfg.options : null;
      if (opt && opt.plugins) {
        if (opt.plugins.title && typeof opt.plugins.title.text === "string") {
          opt.plugins.title.text = trTerm(opt.plugins.title.text);
        }
        var tt = opt.plugins.tooltip;
        if (tt && tt.callbacks && typeof tt.callbacks.title === "function") {
          var origTitle = tt.callbacks.title;
          tt.callbacks.title = function () {
            var r = origTitle.apply(this, arguments);
            return (typeof r === "string") ? r.replace(/\bMonth\b/g, "Maand") : r;
          };
        }
      }
      if (opt && opt.scales) {
        ["x", "y"].forEach(function (ax) {
          if (opt.scales[ax] && opt.scales[ax].title && typeof opt.scales[ax].title.text === "string") {
            opt.scales[ax].title.text = trTerm(opt.scales[ax].title.text);
          }
        });
      }
    } catch (e) { /* stil falen, grafiek nooit breken */ }
    return cfg;
  }
  if (window.Chart) {
    var _Chart = window.Chart;
    var Wrapped = function (ctx, cfg) { return new _Chart(ctx, rewriteChartConfig(cfg)); };
    Wrapped.prototype = _Chart.prototype;
    Object.keys(_Chart).forEach(function (k) { try { Wrapped[k] = _Chart[k]; } catch (e) {} });
    window.Chart = Wrapped;
  }

  /* ── 2) Tabelkoppen + disclaimer vertalen (na render) ── */
  var TH = {
    "Month": "Maand",
    "Principal": "Aflossing",
    "Interest": "Rente",
    "Outstanding balance": "Openstaand saldo",
    "Monthly payment": "Maandlast",
    "Capital": "Aflossing",
    "Amortisation": "Aflossing",
    "Instalment": "Maandlast"
  };
  function translateDom() {
    document.querySelectorAll(".table-content th").forEach(function (th) {
      var t = (th.textContent || "").trim();
      if (TH[t]) th.textContent = TH[t];
    });
    var disc = document.querySelector("[data-disclaimer]");
    if (disc) {
      var h = disc.innerHTML;
      if (/If you borrow|APR of|monthly instalment|In total, you will pay|interest and other charges/.test(h)) {
        h = h
          .replace("If you borrow ", "Als je ")
          .replace(/ over <b>\s*([^<]*?)\s*months<\/b>/i, " leent over <b>$1 maanden</b>")
          .replace("with an <b>APR of", "tegen een <b>JKP van")
          .replace("your estimated average monthly instalment will be", "is je geschatte gemiddelde maandlast")
          .replace("In total, you will pay", "In totaal betaal je")
          .replace(/of which <b>\s*([^<]*?)\s*is interest and other charges<\/b>/i, "waarvan <b>$1 aan rente en overige kosten</b>");
        disc.innerHTML = h;
      }
    }
  }

  var obs = new MutationObserver(function () { translateDom(); });
  obs.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("click", function (e) {
    if (e.target.closest("#calcular")) setTimeout(translateDom, 250);
  });
  translateDom();
})();

/* ======================== PL ======================== */
/*
  PL — Kalkulator kredytu hipotecznego: lokalizacja runtime
  ------------------------------------------------------------
  Logika liczenia jest w ZEWNĘTRZNYM mortgage.js (€ jako PREFIKS,
  format europejski: €199.455,20). Ten skrypt naprawia wynik w
  przeglądarce, tylko na /pl/:

   • € (i ewentualne "zł" jako prefiks) -> "199 455,20 zł"
   • disclaimer ("If you take out a loan of…") -> polski (RRSO)
   • nagłówki tabeli -> polski
   • wykres (Chart.js): serie/oś/tooltip/€ -> polski

  GDZIE: Page settings > Custom code > "Before </body> tag",
  NA KOŃCU, PONIŻEJ <script src="...mortgage.js">.
  WAŻNE: jeśli wkleiłeś tu wcześniej skrypt z kredytu gotówkowego,
  USUŃ go — ten go zastępuje.
*/
(function () {
  if (!/^\/pl(\/|$)/.test(location.pathname)) return;
  var ZL = "zł";

  /* "199.455,20" -> "199 455,20" (kropki tysięcy -> spacja nierozdzielająca) */
  function reNum(num) { return num.replace(/\./g, " "); }

  /* € lub "zł" jako PREFIKS + liczba (format EU) -> "liczba zł" */
  function fmtMoney(s) {
    if (!s || (s.indexOf("€") === -1 && s.indexOf("zł") === -1)) return s;
    s = s.replace(/(?:€|zł)\s*(\d[\d.]*(?:,\d{1,2})?)/g, function (_, num) { return reNum(num) + " " + ZL; });
    s = s.replace(/€/g, ZL);
    return s;
  }
  /* luźna liczba w formacie EU (199.455,20) -> 199 455,20 */
  function reformatPlain(s) {
    return s.replace(/\d{1,3}(?:\.\d{3})+,\d{1,2}/g, function (m) { return m.replace(/\./g, " "); });
  }
  function wordEuro(s) { return s ? s.replace(/\beuro\b/gi, "złotych") : s; }

  function plLata(n) {
    n = parseInt(n, 10);
    if (n === 1) return "rok";
    var d = n % 10, dd = n % 100;
    if (d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14)) return "lata";
    return "lat";
  }

  var TERM_MAP = {
    "Month": "Miesiąc", "Principal": "Kapitał", "Interest": "Odsetki",
    "Outstanding balance": "Saldo zadłużenia", "Monthly payment": "Rata miesięczna",
    "Instalment no.": "Nr raty"
  };

  /* ── Disclaimer kredytu hipotecznego EN -> PL ───── */
  function money(x) { return fmtMoney(x.trim()); }
  function translateDisclaimer() {
    var el = document.querySelector("[data-disclaimer]");
    if (!el) return;
    var t = el.textContent || "";
    if (!/If you take out a loan of/i.test(t)) return;
    var m = t.match(/If you take out a loan of\s*(.+?),\s*over\s*(\d+)\s*years,\s*at an (?:interest rate|APR) of\s*([\d.,]+\s*%?),\s*including insurance, fees, and taxes,\s*you will have an average monthly payment of\s*(.+?)\.\s*In total, you will pay\s*(.+?),\s*of which\s*(.+?)\s*corresponds to interest and other costs/i);
    if (!m) return;
    var loan = money(m[1]), yrs = parseInt(m[2], 10), rate = m[3].replace(/\s+/g, ""),
        pmt = money(m[4]), total = money(m[5]), inter = money(m[6]);
    if (rate.indexOf("%") === -1) rate += "%";
    el.innerHTML =
      "Jeśli zaciągniesz kredyt w wysokości <b>" + loan + "</b> na <b>" + yrs + " " + plLata(yrs) + "</b>, " +
      "przy RRSO <b>" + rate + "</b>, wraz z ubezpieczeniami, opłatami i podatkami, " +
      "Twoja średnia rata miesięczna wyniesie <b>" + pmt + "</b>. " +
      "Łącznie zapłacisz <b>" + total + "</b>, z czego <b>" + inter + "</b> stanowią odsetki i inne koszty. " +
      "RRSO to wskaźnik odzwierciedlający całkowity koszt kredytu, uwzględniający wszystkie powiązane opłaty.";
  }

  function translateTable() {
    document.querySelectorAll(".table-content th").forEach(function (c) {
      var t = (c.textContent || "").trim();
      if (TERM_MAP[t]) c.textContent = TERM_MAP[t];
    });
  }

  function convertTextNodes(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var n, nodes = [];
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var v = node.nodeValue, nv = v;
      if (v.indexOf("€") !== -1 || v.indexOf("zł") !== -1) nv = fmtMoney(nv);
      if (/\d\.\d{3},\d/.test(nv)) nv = reformatPlain(nv);
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
              o.scales[ax].ticks.callback = function () { var r = oc.apply(this, arguments); return (typeof r === "string") ? fmtMoney(r) : r; };
            }
          }
        });
        if (o && o.plugins) {
          if (o.plugins.title && typeof o.plugins.title.text === "string")
            o.plugins.title.text = mapTerm(o.plugins.title.text);
          var cb = o.plugins.tooltip && o.plugins.tooltip.callbacks;
          if (cb) {
            if (typeof cb.label === "function") { var ol = cb.label; cb.label = function () { var r = ol.apply(this, arguments); return (typeof r === "string") ? fmtMoney(r) : r; }; }
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

  var running = false;
  function run() {
    if (running) return;
    running = true;
    try { translateDisclaimer(); translateTable(); convertTextNodes(document.body); }
    finally { running = false; }
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

  var P = L === "pl";
  var TH = exact(P ? { "Principal repayment": "Spłata kapitału", "Other costs": "Inne koszty" }
                   : { "Principal repayment": "Aflossing", "Other costs": "Overige kosten" });
  function nlDisclaimer() {
    var el = document.querySelector("[data-disclaimer]");
    if (!el) return;
    var t = (el.textContent || "").replace(/\s+/g, " ");
    var r = t.match(/If you take out a loan of (.+?), over (\d+) years, at an (?:interest rate|APR) of ([\d.,]+ ?%?), .*?monthly payment of (.+?)\. (?:In total, you will pay|In totaal betaal je) (.+?), of which (.+?) corresponds to interest/);
    if (!r) return;
    el.innerHTML =
      "Als je een <b>lening van " + r[1] + "</b> afsluit over <b>" + r[2] + " jaar</b>, tegen een <b>JKP van " + r[3] +
      "</b>, inclusief verzekeringen, kosten en belastingen, betaal je gemiddeld <b>" + r[4] + " per maand</b>. " +
      "In totaal betaal je <b>" + r[5] + "</b>, waarvan <b>" + r[6] + " aan rente en overige kosten</b>. " +
      "Het <b>JKP</b> is de indicator die de totale kosten van het krediet weergeeft, inclusief alle bijbehorende kosten.";
  }
  function apply() {
    Array.prototype.forEach.call(document.querySelectorAll(".table-content"), function (t) { swap(t, TH); });
    if (!P) nlDisclaimer();
    fixCharts(P ? {
      "Principal repayment": "Spłata kapitału",
      "Loan monthly payments": "Miesięczne raty kredytu",
      "Payment number": "Nr raty"
    } : {
      "Principal repayment": "Aflossing",
      "Interest": "Rente",
      "Loan monthly payments": "Maandlasten van de lening",
      "Payment number": "Termijn nr."
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
