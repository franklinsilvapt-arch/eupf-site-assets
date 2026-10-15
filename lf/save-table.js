document.addEventListener("DOMContentLoaded", function () {
  // Loads html2canvas only on first use when the page does not already have it.
  function ensureHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (window.__h2cPromise) return window.__h2cPromise;
    window.__h2cPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      s.onload = function () {
        resolve(window.html2canvas);
      };
      s.onerror = function () {
        window.__h2cPromise = null;
        reject(new Error("html2canvas failed to load"));
      };
      document.head.appendChild(s);
    });
    return window.__h2cPromise;
  }

  // iPhone Safari only allows a download while it is still tied to the user's
  // tap. html2canvas takes hundreds of milliseconds to draw the table, which
  // always falls outside that window, so the download never worked on iPhone.
  // The image is now built when the "..." menu opens, and the click is instant.
  // Same file in eupf/ and lf/.
  var TABLE_SELECTOR = ".table-content-watermark_wrapper";
  var PADDING = 30;
  var cachedUrl = null;
  var pending = null;

  function invalidate() {
    cachedUrl = null;
    pending = null;
  }

  function buildImage() {
    var target = document.querySelector(TABLE_SELECTOR);
    if (!target) return Promise.reject(new Error("Div not found: " + TABLE_SELECTOR));

    var h2cReady = ensureHtml2Canvas();

    // Render an off-screen clone: no need to switch tabs or touch what the
    // person is looking at to build the image.
    var wrapper = document.createElement("div");
    wrapper.style.cssText =
      "position:absolute;left:-9999px;top:0;padding:" +
      PADDING +
      "px;background:#fff;box-sizing:border-box;";
    var clone = target.cloneNode(true);
    clone.style.display = "block";
    clone.style.maxHeight = "none";
    clone.style.overflow = "visible";
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    function cleanup() {
      if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    }

    return Promise.resolve()
      .then(function () {
        return document.fonts && document.fonts.ready;
      })
      .then(function () {
        return new Promise(function (r) {
          requestAnimationFrame(function () {
            requestAnimationFrame(r);
          });
        });
      })
      .then(function () {
        return h2cReady;
      })
      .then(function (html2canvas) {
        var rect = wrapper.getBoundingClientRect();
        var maxDim = 16384; // safe-ish browser limit
        var scale = Math.min(
          2, // don't force 4x for very tall content
          maxDim / Math.max(rect.width, 1),
          maxDim / Math.max(rect.height, 1)
        );
        return html2canvas(wrapper, {
          backgroundColor: "#fff",
          useCORS: true,
          willReadFrequently: true,
          scale: scale,
        });
      })
      .then(function (canvas) {
        var url = canvas.toDataURL("image/png");
        cleanup();
        return url;
      })
      .catch(function (err) {
        cleanup();
        throw err;
      });
  }

  function warm() {
    if (cachedUrl || pending) return pending;
    pending = buildImage()
      .then(function (url) {
        cachedUrl = url;
        return url;
      })
      .catch(function (err) {
        pending = null;
        throw err;
      });
    return pending;
  }

  function triggerDownload(url, filename) {
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    // The link must be in the document: Safari ignores clicks on detached elements.
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const tableButton = document.querySelector("[download-table-image-button]");
  function fileName() {
    var path = window.location.pathname;
    var names = [
      ["sp-500-historical", "SP500-historical-returns"],
      ["sp500", "SP500"],
      ["mortgage-calculator", "mortgage-payment-calculator"],
      ["personal-loan", "personal-loan"],
      ["savings-calculator", "savings"],
      ["early-loan-repayment", "early-loan-repayment"],
    ];
    var hit = names.find(function (n) { return path.indexOf(n[0]) !== -1; });
    return "simulationEU-table-" + (hit ? hit[1] : "compound-interest") + ".png";
  }

  if (tableButton) {
    // The image is stale as soon as the numbers change.
    document.addEventListener("input", invalidate, true);
    document.addEventListener("change", invalidate, true);
    document.addEventListener(
      "click",
      function (e) {
        if (e.target && e.target.closest && e.target.closest("#calcular")) invalidate();
      },
      true
    );

    // Build it when the "..." menu opens: that gives the time the click does not have.
    var dropdown = tableButton.closest(".w-dropdown");
    var toggle = dropdown && dropdown.querySelector(".w-dropdown-toggle");
    if (toggle) {
      toggle.addEventListener("pointerdown", function () {
        warm().catch(function () {});
      });
    }
    tableButton.addEventListener("pointerenter", function () {
      warm().catch(function () {});
    });

    // Listen on window in the capture phase: savings and early-loan have an
    // inline embed that catches this click on document (capture) and stops it.
    window.addEventListener(
      "click",
      function (e) {
        var btn = e.target && e.target.closest && e.target.closest("[download-table-image-button]");
        if (!btn) return;
        // No table block on this page: leave the click to the page's own code.
        if (!document.querySelector(TABLE_SELECTOR)) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        // The click no longer reaches Webflow, so close the "..." menu here.
        var dd = btn.closest(".w-dropdown");
        if (dd && window.jQuery) window.jQuery(dd).triggerHandler("w-close");
        $("[table-button]").click();

        if (cachedUrl) {
          // Fast path: nothing asynchronous between the tap and the download.
          triggerDownload(cachedUrl, fileName());
          return;
        }

        // No image ready (desktop, or menu opened by keyboard): the old
        // behaviour still works.
        warm()
          .then(function (url) {
            triggerDownload(url, fileName());
          })
          .catch(function (err) {
            console.error(err);
          });
      },
      true
    );
  }
});
