/*
  Fixes for the term deposit calculator (EU Personal Finance), all languages.
  The localized code embeds cannot be edited through the API, so these
  changes run on the page instead.

  - All: France tax in the tax-rate tooltip, 30% -> 31.4% (PFU on interest
    since 1 Jan 2026: 12.8% income tax + 18.6% social charges, CSG raised to
    10.6% by art. 12 of loi n. 2025-1403 of 30 Dec 2025, LFSS 2026).
  - PL: default gross rate 5 -> 4 (unless opened from a shared link).
  - NL: Dutch number format in the results, chart and legend
    (EUR 10,000.00 -> EUR 10.000,00, 2.50% -> 2,50%) and a smoother summary
    sentence ("..., dan ontvang je naar schatting ...").
*/
(function () {
  "use strict";
  var m = /^\/(nl|pl)(\/|$)/.exec(location.pathname);
  var L = m ? m[1] : "en";

  function eachText(root, fn) {
    if (!root) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), n, a = [];
    while ((n = w.nextNode())) {
      var tag = n.parentNode && n.parentNode.nodeName;
      if (tag !== "SCRIPT" && tag !== "STYLE" && tag !== "NOSCRIPT") a.push(n);
    }
    a.forEach(fn);
  }

  /* ── France tax rate in the tooltip (all languages) ─────────── */
  function fixFranceTooltip() {
    eachText(document.body, function (n) {
      var v = n.nodeValue;
      if (v.indexOf("30%") === -1) return;
      var nv = v
        .replace(/\bFrance 30%/g, "France 31.4%")
        .replace(/\bFrankrijk 30%/g, "Frankrijk 31,4%")
        .replace(/\bFrancja 30%/g, "Francja 31,4%");
      if (nv !== v) n.nodeValue = nv;
    });
  }

  /* ── PL default rate ─────────────────────────────────────────── */
  function plDefaultRate() {
    if (L !== "pl") return;
    if (location.search && /(^|[?&])tanb=/.test(location.search)) return;
    var el = document.querySelector('input[data-type="tanb"]');
    if (el && el.value === "5") el.value = "4";
  }

  /* ── NL number format ────────────────────────────────────────── */
  function nlNumber(s) {
    return s
      /* €10,000.00 / -€30.00 -> € 10.000,00 / -€ 30,00 */
      .replace(/€(\d{1,3}(?:,\d{3})*)\.(\d{2})(?!\d)/g, function (_, i, d) {
        return "€ " + i.replace(/,/g, ".") + "," + d;
      })
      /* 2.50% / 65.3% -> 2,50% / 65,3% */
      .replace(/(\d)\.(\d{1,2})%/g, "$1,$2%");
  }
  function nlFixResults() {
    ["lfc-dp", "lfc-dp-chart"].forEach(function (id) {
      eachText(document.getElementById(id), function (n) {
        var v = n.nodeValue, nv = nlNumber(v);
        if (nv !== v) n.nodeValue = nv;
      });
    });
    var sum = document.getElementById("lfc-dp-summary");
    if (sum) {
      var h = sum.innerHTML;
      var nh = h.replace(
        /<\/strong> wordt uitgekeerd\.( Met herbelegging van de nettorente,)? Ontvang je naar schatting/,
        function (_, r) {
          return "</strong> wordt uitgekeerd, dan ontvang je" +
            (r ? " met herbelegging van de nettorente" : "") + " naar schatting";
        });
      if (nh !== h) sum.innerHTML = nh;
    }
    /* chart tooltip: wrap the label callback once */
    if (window.Chart && window.Chart.instances) {
      Object.keys(window.Chart.instances).forEach(function (k) {
        var c = window.Chart.instances[k];
        var cb = c && c.options && c.options.plugins && c.options.plugins.tooltip &&
                 c.options.plugins.tooltip.callbacks;
        if (!cb || cb.__eupfNl || typeof cb.label !== "function") return;
        var orig = cb.label;
        cb.label = function () {
          var r = orig.apply(this, arguments);
          return typeof r === "string" ? nlNumber(r) : r;
        };
        cb.__eupfNl = true;
      });
    }
  }

  var running = false;
  function run() {
    if (running) return;
    running = true;
    try {
      fixFranceTooltip();
      if (L === "nl") nlFixResults();
    } catch (e) {} finally { running = false; }
  }

  function start() {
    plDefaultRate();
    run();
    setTimeout(run, 300);
    setTimeout(run, 1200);
    var deb;
    new MutationObserver(function () { clearTimeout(deb); deb = setTimeout(run, 60); })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("#calcular")) {
        setTimeout(run, 50); setTimeout(run, 600); setTimeout(run, 1500);
      }
    });
  }

  plDefaultRate();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
