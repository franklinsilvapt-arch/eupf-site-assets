/* Download chart image
   The chart block (.graph-image-export) used to go through html2canvas. On
   iPhone Safari html2canvas never finishes when the target contains a
   <canvas> (the Chart.js chart): the promise stays pending forever, with no
   error, so the download never happened. Safari also only allows a download
   while it is still tied to the user's tap.

   The block is now composed by hand on a canvas, from the positions measured
   in the DOM: backgrounds, the Chart.js canvas, SVG icons/watermark and text.
   It takes a few milliseconds and runs inside the click.
   Same file in eupf/ and lf/. */
document.addEventListener("DOMContentLoaded", function () {
  // Chart blocks this script knows how to draw. The term deposit calculator
  // has its own donut block (#lfc-dp-chart) instead of .graph-image-export.
  const EXPORT_SELECTOR = ".graph-image-export, #lfc-dp-chart";
  const S = 2; // 2x so the image is not blurry
  const PAD = 30 * S;
  const svgCache = new Map();

  function fileName() {
    const path = window.location.pathname;
    const names = [
      ["fire-calculator", "FIRE"],
      ["sp-500-historical", "SP500-historical-returns"],
      ["sp500", "SP500"],
      ["mortgage-calculator", "mortgage-payment-calculator"],
      ["personal-loan", "personal-loan"],
      ["savings-calculator", "savings"],
      ["early-loan-repayment", "early-loan-repayment"],
      ["term-deposit", "term-deposit"],
    ];
    const hit = names.find(function (n) { return path.includes(n[0]); });
    return "simulationEU-chart-" + (hit ? hit[1] : "compound-interest") + ".png";
  }

  // The link must be in the document: Safari ignores clicks on detached elements.
  function triggerDownload(url, filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // A serialized SVG loses the colours that came from CSS: copy the computed
  // fill/stroke of every shape into the clone, or it comes out invisible.
  function svgToImage(svg) {
    return new Promise(function (resolve) {
      const clone = svg.cloneNode(true);
      const src = svg.querySelectorAll("*");
      const dst = clone.querySelectorAll("*");
      for (let i = 0; i < src.length; i++) {
        const cs = getComputedStyle(src[i]);
        if (cs.fill) dst[i].setAttribute("fill", cs.fill);
        if (cs.stroke && cs.stroke !== "none") dst[i].setAttribute("stroke", cs.stroke);
      }
      // The watermark (Figma export) has a <foreignObject> blur layer, which
      // taints the canvas and blocks the export. It adds nothing visible here.
      clone.querySelectorAll("foreignObject").forEach(function (fo) { fo.remove(); });
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.removeAttribute("style");
      const vb = (clone.getAttribute("viewBox") || "").split(/[\s,]+/);
      if (vb.length === 4) {
        clone.setAttribute("width", vb[2]);
        clone.setAttribute("height", vb[3]);
      }
      const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  // SVGs are preloaded so the composition itself can be synchronous on click.
  function preloadSvgs() {
    const root = document.querySelector(EXPORT_SELECTOR);
    if (!root) return Promise.resolve();
    const svgs = Array.prototype.slice.call(root.querySelectorAll("svg"));
    return Promise.all(
      svgs.map(function (svg) {
        return svgToImage(svg).then(function (img) { svgCache.set(svg, img); });
      })
    );
  }

  function composeExport() {
    const root = document.querySelector(EXPORT_SELECTOR);
    if (!root) return null;
    const R = root.getBoundingClientRect();
    if (!R.width || !R.height) return null;

    const cv = document.createElement("canvas");
    cv.width = Math.round(R.width * S) + PAD * 2;
    cv.height = Math.round(R.height * S) + PAD * 2;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cv.width, cv.height);

    const px = (v) => v * S;
    const X = (b) => PAD + px(b.left - R.left);
    const Y = (b) => PAD + px(b.top - R.top);

    function roundRect(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    }

    // 1) backgrounds, charts and icons
    root.querySelectorAll("*").forEach(function (el) {
      const b = el.getBoundingClientRect();
      if (b.width < 1 || b.height < 1) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || +cs.opacity === 0) return;
      const tag = el.tagName.toLowerCase();

      if (tag === "canvas") {
        ctx.drawImage(el, X(b), Y(b), px(b.width), px(b.height));
        return;
      }
      if (tag === "svg") {
        const img = svgCache.get(el);
        if (img) ctx.drawImage(img, X(b), Y(b), px(b.width), px(b.height));
        return;
      }
      if (el.closest("svg")) return;
      const bg = cs.backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        ctx.fillStyle = bg;
        roundRect(X(b), Y(b), px(b.width), px(b.height), px(parseFloat(cs.borderRadius) || 0));
      }
    });

    // 2) text, node by node (axis titles and legends are HTML on some pages)
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    let node;
    while ((node = walker.nextNode())) {
      const txt = node.nodeValue.replace(/\s+/g, " ").trim();
      if (!txt) continue;
      const parent = node.parentElement;
      if (!parent || parent.closest("svg, script, style")) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const b = range.getBoundingClientRect();
      if (b.width < 1 || b.height < 1) continue;
      const cs = getComputedStyle(parent);
      if (cs.visibility === "hidden" || +cs.opacity === 0) continue;
      ctx.fillStyle = cs.color;
      ctx.font =
        cs.fontStyle + " " + cs.fontWeight + " " + px(parseFloat(cs.fontSize)) + "px " + cs.fontFamily;
      ctx.fillText(txt, X(b), Y(b) + px(b.height) / 2);
    }

    try {
      return cv.toDataURL("image/png", 1.0);
    } catch (err) {
      console.error("Chart export failed:", err);
      return null;
    }
  }

  // The click no longer reaches Webflow, so close the "..." menu here.
  function closeMenu(btn) {
    const dd = btn.closest(".w-dropdown");
    if (dd && window.jQuery) window.jQuery(dd).triggerHandler("w-close");
  }

  const graphButton = document.querySelector("[download-graph-image-button]");
  if (!graphButton) return;

  preloadSvgs();
  document.addEventListener(
    "click",
    function (e) {
      if (e.target && e.target.closest && e.target.closest("#calcular")) preloadSvgs();
    },
    true
  );

  // Listen on window in the capture phase: savings and early-loan have an
  // inline embed that catches this click on document (capture) and stops it,
  // and its html2canvas version has the same iPhone problem.
  window.addEventListener(
    "click",
    function (e) {
      const btn = e.target && e.target.closest && e.target.closest("[download-graph-image-button]");
      if (!btn) return;
      // No chart block we can draw on this page: leave the click to the
      // page's own code instead of swallowing it.
      if (!document.querySelector(EXPORT_SELECTOR)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      closeMenu(btn);

      const root = document.querySelector(EXPORT_SELECTOR);
      const wasHidden = root && !root.getBoundingClientRect().width;

      // Show the chart tab first (the toggle is synchronous).
      const toggleBtn = document.querySelector("[graphic-button]");
      if (toggleBtn) toggleBtn.click();

      if (!wasHidden) {
        const url = composeExport();
        if (url) triggerDownload(url, fileName());
        return;
      }

      // The chart was on a hidden tab: give Chart.js two frames to repaint.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          const url = composeExport();
          if (url) triggerDownload(url, fileName());
        });
      });
    },
    true
  );
});
