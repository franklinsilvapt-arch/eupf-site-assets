/*
  Personal loan calculator (EU Personal Finance), moved from the page footer in Webflow.
  Same file on every language version of the page; texts are picked by <html lang>.
*/
(function () {
  // Texts per page language. Polish uses the English texts here and is
  // translated afterwards by eupf/i18n/personal-loan.js, as before.
  var NL = /^nl/i.test(document.documentElement.getAttribute("lang") || "");
  var T = NL ? {
    month: "Maand", principal: "Aflossing", interest: "Rente", balance: "Openstaand saldo",
    payment: "Maandlast", instalmentNo: "Termijn nr."
  } : {
    month: "Month", principal: "Principal", interest: "Interest", balance: "Outstanding balance",
    payment: "Monthly payment", instalmentNo: "Instalment no."
  };
  let loanChart = null;
  let chartJsLoaded = false;
  let amortTable = [];

  function loadChartJS() {
    return new Promise(function (resolve) {
      if (window.Chart) { resolve(); return; }
      if (chartJsLoaded) { resolve(); return; }
      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js";
      script.onload = function () { chartJsLoaded = true; resolve(); };
      document.head.appendChild(script);
    });
  }

  function roundTo2(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  // EN/PL: 10,888.24€ (PL is converted to zł later by eupf/i18n/personal-loan.js).
  // NL: € 10.888,24 (Dutch format), also used in the chart tooltip and y-axis.
  function formatEuro(value) {
    value = Number(value) || 0;
    if (NL) {
      var nlParts = Math.abs(value).toFixed(2).split(".");
      nlParts[0] = nlParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return (value < 0 ? "- " : "") + "€ " + nlParts.join(",");
    }
    var parts = value.toFixed(2).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".") + "€";
  }

  function toNumber(val) {
    if (val == null) return 0;
    var s = String(val).trim();
    if (s.includes(",") && s.includes("."))
      return parseFloat(s.replace(/\./g, "").replace(",", "."));
    if (s.includes(",")) return parseFloat(s.replace(",", "."));
    return parseFloat(s) || 0;
  }

  function renderTable(rows, limit) {
    var data = limit ? rows.slice(0, limit) : rows;
    var tableContent = "";
    data.forEach(function (row) {
      tableContent +=
        "<tr>" +
        "<td>" + row.mes + "</td>" +
        "<td>" + formatEuro(row.amortizacao) + "</td>" +
        "<td>" + formatEuro(row.juros) + "</td>" +
        "<td>" + formatEuro(row.capitalEmDivida) + "</td>" +
        "<td>" + formatEuro(row.pagamentoMensal) + "</td>" +
        "</tr>";
    });
    document.querySelector(".table-content").innerHTML =
      "<table>" +
      "<thead><tr>" +
      "<th>" + T.month + "</th>" +
      "<th>" + T.principal + "</th>" +
      "<th>" + T.interest + "</th>" +
      "<th>" + T.balance + "</th>" +
      "<th>" + T.payment + "</th>" +
      "</tr></thead>" +
      "<tbody>" + tableContent + "</tbody>" +
      "</table>";
  }

  $(document).ready(function () {

    // ------ CALCULATE ------
    $("#calcular").on("click", function (e) {
      e.preventDefault();
      $(".all-results_wrapper").css("display", "flex");

      // INPUTS
      var L = roundTo2(
        Number($('[data-type="montante-emprestimo"]').val().replace(/\./g, ""))
      );
      var n = parseInt($('[data-type="period-meses"]').val(), 10);
      var TAEG = toNumber($('[data-type="taeg"]').val()) / 100;

      // CALCULATIONS
      var i = Math.pow(1 + TAEG, 1 / 12) - 1;
      var PMT = roundTo2(
        i === 0 ? L / n : (L * i) / (1 - Math.pow(1 + i, -n))
      );
      var MTIC = roundTo2(PMT * n);
      var CustoTotal = roundTo2(MTIC - L);

      // AMORTISATION TABLE
      amortTable = [];
      var juros = [];
      var amortizacao = [];
      var saldo = L;
      for (var k = 0; k < n; k++) {
        var jurosMes = roundTo2(saldo * i);
        var amortMes = roundTo2(PMT - jurosMes);
        saldo = roundTo2(saldo - amortMes);
        juros.push(jurosMes);
        amortizacao.push(amortMes);
        amortTable.push({
          mes: k + 1,
          juros: jurosMes,
          amortizacao: amortMes,
          capitalEmDivida: saldo,
          pagamentoMensal: PMT,
        });
      }

      // RESULTS
      document.querySelector("[pagamento-mensal-medio-value]").textContent = formatEuro(PMT);
      document.querySelector("[custo-total-emprestimo-value]").textContent = formatEuro(CustoTotal);
      document.querySelector("[mtic-value]").textContent = formatEuro(MTIC);

      // ✅ CHANGED: percentage now uses dot as decimal separator (e.g. 5.25%)
      var taegDisplay = toNumber($('[data-type="taeg"]').val()).toFixed(2) + "%";
      if (NL) taegDisplay = taegDisplay.replace(".", ",");

      // DISCLAIMER
      document.querySelector("[data-disclaimer]").innerHTML =
        (NL
          ? "Als je <b>" + formatEuro(L) + "</b> leent over <b>" + n +
            " maanden</b>, tegen een <b>JKP van " + taegDisplay +
            "</b>, is je geschatte gemiddelde maandlast <b>" + formatEuro(PMT) +
            "</b>. In totaal betaal je <b>" + formatEuro(MTIC) +
            "</b>, waarvan <b>" + formatEuro(CustoTotal) + " aan rente en overige kosten</b>."
          : "If you borrow <b>" + formatEuro(L) + "</b> over <b>" + n +
            " months</b>, with an <b>APR of " + taegDisplay +
            "</b>, your estimated average monthly instalment will be <b>" + formatEuro(PMT) +
            "</b>. In total, you will pay <b>" + formatEuro(MTIC) +
            "</b>, of which <b>" + formatEuro(CustoTotal) + " is interest and other charges</b>.");

      // TABLE
      renderTable(amortTable, 30);
      if (amortTable.length > 30) {
        $("#table-load-more-button").css("display", "flex");
      } else {
        $("#table-load-more-button").hide();
      }
      $("#table-hide-more-button").hide();

      // CHART
      loadChartJS().then(function () {
        var canvas = document.querySelector(".graph-canvas");
        if (!canvas) return;
        if (loanChart) loanChart.destroy();
        var labels = Array.from({ length: n }, function (_, k) { return k + 1; });
        loanChart = new Chart(canvas.getContext("2d"), {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: T.interest,
                data: juros,
                backgroundColor: "#FF8A1F",
                borderSkipped: false,
                barPercentage: 0.9,
                categoryPercentage: 0.8,
                stack: "total",
              },
              {
                label: T.principal,
                data: amortizacao,
                backgroundColor: "#2F6DF6",
                borderSkipped: false,
                barPercentage: 0.9,
                categoryPercentage: 0.8,
                stack: "total",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              tooltip: {
                displayColors: true,
                backgroundColor: "#121721",
                cornerRadius: 8,
                padding: 12,
                titleFont: { family: "Inter", size: 11, weight: "500" },
                bodyFont: { family: "Inter", size: 11, weight: "500" },
                callbacks: {
                  title: function (t) { return T.month + " " + t[0].label; },
                  label: function (c) {
                    return c.dataset.label + ": " + formatEuro(c.raw ?? c.parsed?.y);
                  },
                  labelColor: function (c) {
                    return {
                      backgroundColor: c.dataset.backgroundColor,
                      borderColor: c.dataset.backgroundColor,
                      borderWidth: 0,
                      borderRadius: 50,
                    };
                  },
                },
                usePointStyle: true,
                bodySpacing: 5,
                boxPadding: 3,
              },
              legend: {
                position: "bottom",
                labels: {
                  usePointStyle: true,
                  pointStyle: "circle",
                  padding: 20,
                  color: "#3A4454",
                  font: { family: "Inter", size: 12, weight: "500", letterSpacing: "-0.0125em" },
                },
              },
              title: {
                display: true,
                text: T.payment,
                align: "start",
                color: "#3A4454",
                font: { family: "Inter", size: 11, weight: "500", letterSpacing: "-0.0125em" },
                padding: { top: 0, bottom: 25 },
              },
            },
            scales: {
              x: {
                stacked: true,
                grid: { display: false },
                title: {
                  display: true,
                  text: T.instalmentNo,
                  align: "end",
                  color: "#3A4454",
                  font: { family: "Inter", size: 11, weight: "500", letterSpacing: "-0.0125em" },
                  padding: { top: 10 },
                },
                ticks: {
                  color: "#4F5969",
                  font: { family: "Inter", size: 10, weight: "500", letterSpacing: "-0.0125em" },
                },
              },
              y: {
                stacked: true,
                grid: { color: "#E5E7EB", drawBorder: false },
                ticks: {
                  color: "#4F5969",
                  font: { family: "Inter", size: 10, weight: "500", letterSpacing: "-0.0125em" },
                  callback: function (value) { return formatEuro(value); },
                },
              },
            },
          },
        });
      });
    });

    // ------ SHOW ALL MONTHS ------
    $("#table-load-more-button").on("click", function (e) {
      e.preventDefault();
      renderTable(amortTable, null);
      $("#table-load-more-button").hide();
      $("#table-hide-more-button").css("display", "flex");
    });

    // ------ SHOW LESS ------
    $("#table-hide-more-button").on("click", function (e) {
      e.preventDefault();
      renderTable(amortTable, 30);
      $("#table-load-more-button").css("display", "flex");
      $("#table-hide-more-button").hide();
      gsap.to(window, {
        duration: 1,
        scrollTo: { y: ".table-content", offsetY: 100 },
        ease: "power1.inOut",
      });
    });
  });
})();
