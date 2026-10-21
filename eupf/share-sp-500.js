document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("#wf-form-Form");
  const inputs = form.querySelectorAll("input, select");
  const calcularButton = document.querySelector("#calcular");

  const paramMap = {
    "initial-investment": "ii",
    "monthly-investment": "mi",
    "period-years": "py",
    yield: "y",
  };

  const reverseParamMap = Object.fromEntries(
    Object.entries(paramMap).map(([longName, shortName]) => [
      shortName,
      longName,
    ])
  );

  const params = new URLSearchParams(window.location.search);
  let hasParams = false;

  inputs.forEach((input) => {
    const longName = input.getAttribute("data-type") || input.name;
    const shortName = paramMap[longName];
    const paramValue = params.get(shortName) || params.get(longName);

    if (paramValue !== null) {
      if (input.type === "checkbox") {
        input.checked = paramValue === "1";
      } else {
        input.value = decodeURIComponent(paramValue);
      }
      hasParams = true;
    }
  });

  if (hasParams && calcularButton) {
    setTimeout(() => {
      calcularButton.click();
    }, 500);
  }

  function generateShareableURL() {
    const newParams = new URLSearchParams();

    inputs.forEach((input) => {
      const longName = input.getAttribute("data-type") || input.name;
      const shortName = paramMap[longName] || longName;

      if (input.type === "checkbox") {
        if (input.checked) {
          newParams.set(shortName, "1");
        }
      } else if (input.value.trim() !== "") {
        newParams.set(shortName, encodeURIComponent(input.value));
      }
    });

    const newUrl = `${window.location.origin}${
      window.location.pathname
    }?${newParams.toString()}`;
    navigator.clipboard.writeText(newUrl).then(() => {
      const copiedText = document.querySelector("[copied-text]");
      const copiedIcon = document.querySelector("[copied-icon]");
      const shareIcon = document.querySelector("[share-icon]");

      // Page language: /nl and /pl get their own label; the original button text
      // (already translated by the locale) is restored afterwards.
      const lang = (document.documentElement.getAttribute("lang") || "en").slice(0, 2).toLowerCase();
      const copiedLabel = { nl: "Gekopieerd!", pl: "Skopiowano!" }[lang] || "Copied!";
      const originalLabel = copiedText ? copiedText.getAttribute("data-original") : "";

      if (copiedText) copiedText.textContent = copiedLabel;
      if (copiedIcon) copiedIcon.style.display = "block";
      if (shareIcon) shareIcon.style.display = "none";

      setTimeout(() => {
        if (copiedText) copiedText.textContent = originalLabel || "Share results";
        if (copiedIcon) copiedIcon.style.display = "none";
        if (shareIcon) shareIcon.style.display = "block";
      }, 1600); // just after copy-results-button-click.js resets its own English label at 1500 ms
    });
  }

  setTimeout(() => {
    // Remember the localized button label before any click changes it.
    const labelEl = document.querySelector("[copied-text]");
    if (labelEl && !labelEl.hasAttribute("data-original")) {
      labelEl.setAttribute("data-original", labelEl.textContent);
    }
    const shareUrlButton = document.querySelector("[share-url]");
    if (shareUrlButton) {
      shareUrlButton.addEventListener("click", (e) => {
        e.preventDefault();
        generateShareableURL();
      });
    }
  }, 100);
});
