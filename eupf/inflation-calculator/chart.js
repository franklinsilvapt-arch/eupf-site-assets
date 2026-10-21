/* Euro inflation calculator (eupersonalfinance.eu/euro-inflation-calculator, /pl, /nl).
   EMBED G v3 - Chart.js chart, 10 euro note and annual table.
   Loaded from a page embed, synchronously, at the same position the inline code used to sit. */
(function () {
  'use strict';

  /* Localised string. The main script (embed D) defines window.__lfcInfT before any
     calculation can happen; the English fallback keeps this embed safe on its own. */
  function T(k, en) {
    var f = window.__lfcInfT;
    return (typeof f === 'function') ? f(k, en) : en;
  }

  /* Number formatting follows the locale, shared with the main script so the chart and
     the results never disagree: \u20ac1,234.56 in English, \u20ac 1.234,56 in Dutch. */
  function NUM() {
    return window.__lfcInfNum || { mil: ',', dec: '.', pre: '\u20ac', suf: '' };
  }
  function SUF() {
    return NUM().suf || '';
  }

  /* Clean 10 euro note (no specimen), stored as base64 in the lf-ipc-data repo.
     Fetched and turned into a data URI: no CORS problems. */
  var NOTE_B64_URL = 'https://raw.githubusercontent.com/franklinsilvapt-arch/lf-ipc-data/main/assets/nota-10-euros.b64';
  var noteImgEl = null;
  var noteImgReady = false;
  var noteImgSrc = '';
  var BADGE_START = '#F1571F';
  var BADGE_END = '#3A2419';
  var LINE_FROM = '#FF5A1F';
  var LINE_TO = '#592604';
  /* The note is 560x296 (the real note measures 127x67mm). This ratio drives the
     chart height: the drawing area adjusts to the note, never the other way round. */
  var NOTE_ASPECT = 560 / 296;
  var GREY_200 = '#EAECF0';
  var GREY_TOP_ALPHA = 0.7;
  var GREY_TOP = 'rgba(234, 236, 240, ' + GREY_TOP_ALPHA + ')';

  var W = 720, H = 380, X_L = 40, X_R = 680, Y_TOP = 46, Y_BOT = 298;

  function grp(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, NUM().mil); }
  function fmtInt(v) { return NUM().pre + grp(String(Math.round(Math.abs(v)))) + SUF(); }
  function fmtBadge(v) {
    if (!isFinite(v)) return '\u2014';
    if (v >= 1000000) return NUM().pre + (v / 1000000).toFixed(1).replace('.', NUM().dec).replace(NUM().dec + '0', '') + 'M' + SUF();
    if (v >= 100000) return NUM().pre + grp(String(Math.round(v / 1000))) + 'k' + SUF();
    return fmtInt(v);
  }
  function fmtShort(v) { return fmtBadge(v); }
  function fmtCur(v) {
    if (!isFinite(v)) return '\u2014';
    var parts = Math.abs(v).toFixed(2).split('.');
    return (v < 0 ? '- ' : '') + NUM().pre + grp(parts[0]) + NUM().dec + parts[1] + SUF();
  }
  function fmtPc(v) {
    if (v === null || v === undefined || !isFinite(v)) return '\u2014';
    return (v < 0 ? '- ' : '') + Math.abs(v).toFixed(1).replace('.', NUM().dec) + '%';
  }
  /* Strips a trailing ",00" or ".00" whichever the locale uses. */
  function semCentimos(txt) {
    var fim = NUM().dec + '00' + SUF();
    return (txt.slice(-fim.length) === fim) ? txt.slice(0, -fim.length) + SUF() : txt;
  }

  function loadChartJS() {
    return new Promise(function (resolve) {
      if (window.Chart) { resolve(); return; }
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  /* ============ Inline dynamic chart ============ */

  /* Draws the note filling the area WITHOUT stretching it: keeps the ratio and crops
     the excess from the centre if there is any. */
  function desenharNota(c, img, x, y, w, h) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    var sx = 0, sy = 0, sw = iw, sh = ih;
    if (iw / ih > w / h) { sw = ih * (w / h); sx = (iw - sw) / 2; }
    else { sh = iw / (w / h); sy = (ih - sh) / 2; }
    c.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function ajustarAltura(chart) {
    var wrap = document.getElementById('lfc-inf-note-inline');
    var area = chart && chart.chartArea;
    if (!wrap || !area || !area.width) return false;
    var alturaCanvas = chart.canvas.clientHeight;
    if (!alturaCanvas) return false;
    var moldura = alturaCanvas - area.height;
    var alvo = Math.round(area.width / NOTE_ASPECT + moldura);
    alvo = Math.max(150, Math.min(560, alvo));
    if (Math.abs(alvo - alturaCanvas) < 2) return false;
    wrap.style.height = alvo + 'px';
    chart.resize();
    return true;
  }

  var ajusteAgendado = false;
  function agendarAjuste(chart, tentativas) {
    if (ajusteAgendado || tentativas <= 0) return;
    ajusteAgendado = true;
    requestAnimationFrame(function () {
      ajusteAgendado = false;
      if (window.__lfcInfChart !== chart) return;
      if (ajustarAltura(chart)) agendarAjuste(chart, tentativas - 1);
    });
  }

  function lineGradient(context) {
    var chart = context.chart;
    var area = chart.chartArea;
    if (!area) return LINE_FROM;
    var g = chart.ctx.createLinearGradient(area.left, 0, area.right, 0);
    g.addColorStop(0, LINE_FROM);
    g.addColorStop(1, LINE_TO);
    return g;
  }

  var noteBgPlugin = {
    id: 'lfcInfNoteBg',
    beforeDatasetsDraw: function (chart) {
      var area = chart.chartArea;
      if (!area) return;
      var c = chart.ctx;
      var meta = chart.getDatasetMeta(1);
      var pts = meta ? meta.data : null;
      c.save();
      if (noteImgEl && noteImgReady) {
        desenharNota(c, noteImgEl, area.left, area.top, area.width, area.height);
      } else {
        c.fillStyle = '#F3D9C4';
        c.fillRect(area.left, area.top, area.width, area.height);
      }
      c.save();
      if (pts && pts.length) {
        c.beginPath();
        c.moveTo(area.left, area.top);
        c.lineTo(area.right, area.top);
        c.lineTo(area.right, pts[pts.length - 1].y);
        for (var i = pts.length - 1; i >= 0; i--) c.lineTo(pts[i].x, pts[i].y);
        c.lineTo(area.left, pts[0].y);
        c.closePath();
        c.clip();
      }
      c.fillStyle = GREY_TOP;
      c.fillRect(area.left, area.top, area.width, area.height);
      c.restore();
      c.restore();
    }
  };

  var lineShadowPlugin = {
    id: 'lfcInfLineShadow',
    beforeDatasetDraw: function (chart, args) {
      if (args.index !== 1) return;
      var c = chart.ctx;
      c.save();
      c.shadowColor = 'rgba(18, 23, 33, 0.38)';
      c.shadowBlur = 8;
      c.shadowOffsetY = 2;
    },
    afterDatasetDraw: function (chart, args) {
      if (args.index === 1) chart.ctx.restore();
    }
  };

  var hoverLinePlugin = {
    id: 'lfcInfHoverLine',
    afterDraw: function (chart) {
      var active = chart.tooltip && chart.tooltip.getActiveElements ? chart.tooltip.getActiveElements() : [];
      if (!active.length) return;
      var area = chart.chartArea;
      var x = active[0].element.x;
      var c = chart.ctx;
      c.save();
      c.strokeStyle = 'rgba(18, 23, 33, 0.35)';
      c.lineWidth = 1;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.moveTo(x, area.top);
      c.lineTo(x, area.bottom);
      c.stroke();
      c.restore();
    }
  };

  var badgePlugin = {
    id: 'lfcInfBadges',
    afterDatasetsDraw: function (chart) {
      var info = chart.$lfcInf;
      var area = chart.chartArea;
      if (!info || !area) return;
      var meta = chart.getDatasetMeta(1);
      var pts = meta ? meta.data : null;
      if (!pts || !pts.length) return;
      var c = chart.ctx;
      var cw = chart.width;
      var ch = chart.height;
      var isMobile = cw < 560;
      var scale = isMobile ? 0.85 : 1;
      var first = pts[0], last = pts[pts.length - 1];
      var sTxt = fmtBadge(info.valor);
      var eTxt = fmtBadge(info.poderCompra);
      var rS = Math.max(22, 10 + sTxt.length * 4.6) * scale;
      var rE = Math.max(19, 9 + eTxt.length * 4.3) * scale;
      var sx = Math.min(Math.max(first.x, rS + 2), cw - rS - 2);
      var sy = Math.min(Math.max(first.y, rS + 2), ch - rS - 2);
      var ex = Math.min(Math.max(last.x, rE + 2), cw - rE - 2);
      var ey = Math.min(Math.max(last.y, rE + 2), ch - rE - 2);
      c.save();
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = BADGE_START;
      c.beginPath(); c.arc(sx, sy, rS, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#FFFFFF';
      c.font = '700 ' + Math.round(14 * scale) + 'px Inter, sans-serif';
      c.fillText(sTxt, sx, sy + 1);
      c.fillStyle = BADGE_END;
      c.beginPath(); c.arc(ex, ey, rE, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#FFFFFF';
      c.font = '700 ' + Math.round(12 * scale) + 'px Inter, sans-serif';
      c.fillText(eTxt, ex, ey + 1);
      c.restore();
    }
  };

  function garantirHint() {
    if (document.getElementById('lfc-inf-chart-hint')) return;
    var wrap = document.getElementById('lfc-inf-note-inline');
    if (!wrap || !wrap.parentNode) return;
    var hint = document.createElement('div');
    hint.id = 'lfc-inf-chart-hint';
    hint.className = 'lfc-inf-chart-hint';
    var touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
    hint.textContent = touch
      ? T('hint_touch', 'Tap the chart to see the value for each year')
      : T('hint_hover', 'Hover over the chart to see the value for each year');
    wrap.parentNode.insertBefore(hint, wrap.nextSibling);
  }

  function renderInlineChart(r) {
    var wrap = document.getElementById('lfc-inf-note-inline');
    if (!wrap) return;
    loadChartJS().then(function () {
      var canvas = wrap.querySelector('canvas');
      if (!canvas) {
        wrap.innerHTML = '<canvas></canvas>';
        canvas = wrap.querySelector('canvas');
      }
      if (window.__lfcInfChart) { window.__lfcInfChart.destroy(); window.__lfcInfChart = null; }
      garantirHint();

      var labels = r.serie.map(function (s) { return s.ano; });
      var data = r.serie.map(function (s) { return Math.round(s.poderCompra * 100) / 100; });
      var infl = r.serie.map(function (s) { return s.inflacao; });
      var many = labels.length > 40;
      var isMobile = window.innerWidth < 768;

      window.__lfcInfChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            { data: data, borderColor: '#FFFFFF', borderWidth: 9, borderCapStyle: 'round', borderJoinStyle: 'round', order: 2, pointRadius: 0, pointHoverRadius: 0, fill: false, tension: 0 },
            { data: data, borderColor: lineGradient, borderWidth: 3, borderCapStyle: 'round', borderJoinStyle: 'round', order: 1, pointRadius: many ? 2.5 : 3.5, pointBackgroundColor: BADGE_START, pointBorderColor: '#FFFFFF', pointBorderWidth: 1.5, pointHoverRadius: 6, pointHoverBackgroundColor: BADGE_START, pointHoverBorderColor: '#FFFFFF', pointHoverBorderWidth: 2, fill: false, tension: 0 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onResize: function (chart) { agendarAjuste(chart, 4); },
          layout: { padding: { top: isMobile ? 40 : 48, right: 14, bottom: 4, left: 0 } },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              filter: function (item) { return item.datasetIndex === 1; },
              backgroundColor: '#121721',
              cornerRadius: 8,
              padding: 12,
              displayColors: false,
              titleFont: { family: 'Inter', size: 11, weight: '600' },
              bodyFont: { family: 'Inter', size: 11, weight: '500' },
              callbacks: {
                title: function (items) { return items.length ? String(items[0].label) : ''; },
                label: function (c) {
                  var lines = [T('tt_power', 'Purchasing power') + ': ' + fmtCur(c.raw)];
                  var iv = infl[c.dataIndex];
                  if (iv !== null && iv !== undefined) lines.push(T('tt_infl', 'Inflation that year') + ': ' + fmtPc(iv));
                  return lines;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: { color: '#4F5969', font: { family: 'Inter', size: 11 }, maxTicksLimit: isMobile ? 6 : 10, maxRotation: 0 }
            },
            y: {
              beginAtZero: true,
              grid: { display: false },
              border: { display: false },
              ticks: { color: '#4F5969', font: { family: 'Inter', size: 11 }, maxTicksLimit: 6, callback: function (v) { return fmtShort(v); } }
            }
          }
        },
        plugins: [noteBgPlugin, lineShadowPlugin, hoverLinePlugin, badgePlugin]
      });
      window.__lfcInfChart.$lfcInf = { valor: r.valor, poderCompra: r.poderCompra };
      agendarAjuste(window.__lfcInfChart, 4);
    });
  }

  /* ============ Static SVG (export/download panel) ============ */
  function fallbackNote() {
    return '' +
      '<rect x="0" y="0" width="' + W + '" height="' + H + '" rx="10" fill="#F6E3D3"/>' +
      '<rect x="0" y="0" width="' + W + '" height="' + H + '" rx="10" fill="url(#lfcInfNoteGrad)"/>' +
      '<circle cx="560" cy="190" r="150" fill="#F1C9A8" opacity="0.55"/>' +
      '<text x="120" y="322" font-family="Georgia, serif" font-size="120" font-weight="700" fill="#2E7D5B" opacity="0.9">10</text>' +
      '<text x="330" y="250" font-family="Inter, sans-serif" font-size="42" font-weight="700" letter-spacing="6" fill="#B85C2E" opacity="0.85">EURO</text>';
  }
  function noteLayer(extraStyle) {
    if (noteImgReady && noteImgSrc) {
      return '<image href="' + noteImgSrc + '" x="0" y="0" width="' + W + '" height="' + H + '" preserveAspectRatio="xMidYMid slice"' + (extraStyle ? ' style="' + extraStyle + '"' : '') + '/>';
    }
    return extraStyle ? '<g style="' + extraStyle + '">' + fallbackNote() + '</g>' : fallbackNote();
  }
  function buildGeometry(r) {
    var serie = r.serie;
    var n = serie.length - 1;
    var lossFinal = 1 - r.poderCompra / r.valor;
    var lossMax = Math.max(Math.abs(lossFinal), 0.12);
    var pts = [];
    for (var i = 0; i < serie.length; i++) {
      var loss = 1 - serie[i].poderCompra / r.valor;
      var x = X_L + (n === 0 ? 0 : (i / n)) * (X_R - X_L);
      var y = Y_TOP + (loss / lossMax) * (Y_BOT - Y_TOP);
      y = Math.max(Y_TOP - 20, Math.min(Y_BOT + 20, y));
      pts.push({ x: x, y: y });
    }
    return pts;
  }
  function pathFrom(points) {
    var d = 'M ' + points[0].x.toFixed(1) + ' ' + points[0].y.toFixed(1);
    for (var i = 1; i < points.length; i++) d += ' L ' + points[i].x.toFixed(1) + ' ' + points[i].y.toFixed(1);
    return d;
  }
  function chartSvg(r, uid) {
    var pts = buildGeometry(r);
    var first = pts[0], last = pts[pts.length - 1];
    var abovePath = 'M 0 0 L ' + W + ' 0 L ' + W + ' ' + last.y.toFixed(1);
    for (var i = pts.length - 1; i >= 0; i--) abovePath += ' L ' + pts[i].x.toFixed(1) + ' ' + pts[i].y.toFixed(1);
    abovePath += ' L 0 ' + first.y.toFixed(1) + ' Z';
    var linePath = 'M 0 ' + first.y.toFixed(1) + ' ' + pathFrom(pts).slice(2) + ' L ' + W + ' ' + last.y.toFixed(1);
    var dots = '';
    for (var d = 0; d < pts.length; d++) {
      dots += '<circle cx="' + pts[d].x.toFixed(1) + '" cy="' + pts[d].y.toFixed(1) + '" r="3.2" fill="' + BADGE_START + '" stroke="#FFFFFF" stroke-width="1.4"/>';
    }
    var startTxt = fmtBadge(r.valor);
    var endTxt = fmtBadge(r.poderCompra);
    var rStart = Math.max(24, 10 + startTxt.length * 4.6);
    var rEnd = Math.max(20, 9 + endTxt.length * 4.3);
    var sx = Math.max(first.x, rStart + 4);
    var sy = Math.max(first.y, rStart + 4);
    var endX = Math.min(last.x, W - rEnd - 4);
    return '' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + T('chart_alt', 'Chart of purchasing power over a 10 euro note') + '">' +
      '<defs>' +
        '<linearGradient id="lfcInfLineGrad' + uid + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + LINE_FROM + '"/><stop offset="1" stop-color="' + LINE_TO + '"/></linearGradient>' +
        '<linearGradient id="lfcInfNoteGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3D9C4"/><stop offset="1" stop-color="#EFC3A2"/></linearGradient>' +
        '<clipPath id="lfcInfAbove' + uid + '"><path d="' + abovePath + '"/></clipPath>' +
        '<clipPath id="lfcInfRound' + uid + '"><rect x="0" y="0" width="' + W + '" height="' + H + '" rx="10"/></clipPath>' +
        '<filter id="lfcInfLineSh' + uid + '" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3.2" flood-color="#121721" flood-opacity="0.38"/></filter>' +
      '</defs>' +
      '<g clip-path="url(#lfcInfRound' + uid + ')">' +
        noteLayer('') +
        '<g clip-path="url(#lfcInfAbove' + uid + ')">' +
          '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="' + GREY_200 + '" fill-opacity="' + GREY_TOP_ALPHA + '"/>' +
        '</g>' +
        '<path d="' + linePath + '" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<path d="' + linePath + '" fill="none" stroke="url(#lfcInfLineGrad' + uid + ')" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="url(#lfcInfLineSh' + uid + ')"/>' +
        dots +
      '</g>' +
      '<circle cx="' + sx + '" cy="' + sy + '" r="' + rStart + '" fill="' + BADGE_START + '"/>' +
      '<text x="' + sx + '" y="' + (sy + 5) + '" text-anchor="middle" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">' + startTxt + '</text>' +
      '<circle cx="' + endX + '" cy="' + last.y + '" r="' + rEnd + '" fill="' + BADGE_END + '"/>' +
      '<text x="' + endX + '" y="' + (last.y + 4.5) + '" text-anchor="middle" font-family="Inter, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">' + endTxt + '</text>' +
      '</svg>';
  }

  function yearsHtml(r) {
    var maxTicks = 10;
    var anos = r.serie.map(function (s) { return s.ano; });
    var step = Math.max(1, Math.ceil((anos.length - 1) / (maxTicks - 1)));
    var html = '';
    for (var t = 0; t < anos.length; t += step) html += '<span>' + anos[t] + '</span>';
    if ((anos.length - 1) % step !== 0) html += '<span>' + anos[anos.length - 1] + '</span>';
    return html;
  }

  function renderChart(r) {
    renderInlineChart(r);
    var exportSvg = document.getElementById('lfc-inf-note-svg');
    if (exportSvg) exportSvg.innerHTML = chartSvg(r, 'B');
    var yearsExport = document.getElementById('lfc-inf-years');
    if (yearsExport) yearsExport.innerHTML = yearsHtml(r);
    var t1 = document.getElementById('lfc-inf-chart-title');
    if (t1) t1.textContent = T('chart_title', 'Purchasing power over time');
    var t2 = document.getElementById('lfc-inf-chart-subtitle');
    if (t2) {
      t2.textContent = T('chart_sub_a', 'How the value of') + ' ' + semCentimos(fmtCur(r.valor)) + ' ' + T('chart_sub_b', 'shrinks from') + ' ' + r.anoInicial + ' ' + T('chart_sub_c', 'to') + ' ' + r.anoFinal;
    }
  }

  /* ============ Annual table ============ */
  var INITIAL_ROWS = 10;
  function renderTable(r) {
    var el = document.getElementById('lfc-inf-table');
    if (!el) return;
    var head = [
      T('th_year', 'Year'),
      T('th_infl', 'Inflation (HICP)'),
      T('th_needed', 'Amount needed'),
      T('th_power', 'Purchasing power'),
      T('th_cum', 'Cumulative')
    ];
    var html = '';
    for (var h = 0; h < head.length; h++) html += '<div class="lfc-inf-th">' + head[h] + '</div>';
    for (var i = 0; i < r.serie.length; i++) {
      var s = r.serie[i];
      var extra = i >= INITIAL_ROWS ? ' data-extra-row' : '';
      var lastRow = i === r.serie.length - 1 ? ' is-last-row' : '';
      var infTxt = s.inflacao === null ? T('base_year', 'Base year') : fmtPc(s.inflacao) + (s.provisorio ? '*' : '');
      html += '<div class="lfc-inf-td is-first' + lastRow + '"' + extra + '>' + s.ano + '</div>';
      html += '<div class="lfc-inf-td' + lastRow + '"' + extra + '>' + infTxt + '</div>';
      html += '<div class="lfc-inf-td' + lastRow + '"' + extra + '>' + fmtCur(s.valorNecessario) + '</div>';
      html += '<div class="lfc-inf-td' + lastRow + '"' + extra + '>' + fmtCur(s.poderCompra) + '</div>';
      html += '<div class="lfc-inf-td' + lastRow + '"' + extra + '>' + fmtPc(s.acumulada) + '</div>';
    }
    el.innerHTML = html;
    el.classList.remove('is-expanded');
    var more = document.getElementById('lfc-inf-more');
    var less = document.getElementById('lfc-inf-less');
    var hasExtra = r.serie.length > INITIAL_ROWS;
    if (more) more.style.display = hasExtra ? 'inline-flex' : 'none';
    if (less) less.style.display = 'none';
    var disc = document.querySelector('.lfc-inf-table-disclaimer');
    if (disc && r.temProvisorio) {
      disc.setAttribute('data-prov', '1');
      if (!disc.querySelector('.lfc-inf-nota-prov')) {
        var notaProv = document.createElement('span');
        notaProv.className = 'lfc-inf-nota-prov';
        notaProv.style.display = 'block';
        notaProv.style.marginTop = '6px';
        notaProv.textContent = T('prov_note', '* Provisional figure for the current year, based on the months Eurostat has published so far.');
        disc.appendChild(notaProv);
      }
    }
  }

  document.addEventListener('click', function (e) {
    var more = e.target.closest ? e.target.closest('#lfc-inf-more') : null;
    var less = e.target.closest ? e.target.closest('#lfc-inf-less') : null;
    if (!more && !less) return;
    e.preventDefault();
    var table = document.getElementById('lfc-inf-table');
    if (more) { table.classList.add('is-expanded'); more.style.display = 'none'; document.getElementById('lfc-inf-less').style.display = 'inline-flex'; }
    if (less) { table.classList.remove('is-expanded'); less.style.display = 'none'; document.getElementById('lfc-inf-more').style.display = 'inline-flex'; }
  });

  /* ============ Downloads ============ */
  function loadHtml2Canvas() {
    return new Promise(function (resolve) {
      if (window.html2canvas) { resolve(); return; }
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }
  function downloadNode(node, filename) {
    loadHtml2Canvas().then(function () {
      window.html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#FFFFFF' }).then(function (canvas) {
        var a = document.createElement('a');
        a.download = filename;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }).catch(function () {});
    });
  }
  document.addEventListener('click', function (e) {
    var lng = window.__lfcInfLang;
    var nome = (lng === 'nl') ? 'inflatie-calculator' : (lng === 'pl') ? 'kalkulator-inflacji' : 'inflation-calculator';
    var sufG = (lng === 'nl') ? '-grafiek.png' : (lng === 'pl') ? '-wykres.png' : '-chart.png';
    var sufT = (lng === 'nl') ? '-tabel.png' : (lng === 'pl') ? '-tabela.png' : '-table.png';
    var gBtn = e.target.closest ? e.target.closest('[download-graph-image-button]') : null;
    if (gBtn) {
      e.preventDefault(); e.stopImmediatePropagation();
      var gNode = document.querySelector('.graph-image-export');
      if (gNode) downloadNode(gNode, nome + sufG);
      return;
    }
    var tBtn = e.target.closest ? e.target.closest('[download-table-image-button]') : null;
    if (tBtn) {
      e.preventDefault(); e.stopImmediatePropagation();
      var tNode = document.querySelector('.table-content-watermark_wrapper');
      if (tNode) downloadNode(tNode, nome + sufT);
    }
  }, true);

  /* Loads the note: fetch base64 -> data URI (no CORS), with a jsDelivr mirror. */
  (function carregarNota() {
    var FONTES = [
      NOTE_B64_URL,
      'https://cdn.jsdelivr.net/gh/franklinsilvapt-arch/lf-ipc-data@main/assets/nota-10-euros.b64'
    ];
    function tentar(i) {
      if (i >= FONTES.length) return;
      fetch(FONTES[i])
        .then(function (r) { return r.ok ? r.text() : null; })
        .then(function (b64) {
          if (!b64) { tentar(i + 1); return; }
          var dataUri = 'data:image/jpeg;base64,' + b64.replace(/\s+/g, '');
          var img = new Image();
          img.onload = function () {
            noteImgEl = img;
            noteImgReady = true;
            noteImgSrc = dataUri;
            if (img.naturalWidth && img.naturalHeight) NOTE_ASPECT = img.naturalWidth / img.naturalHeight;
            if (window.__lfcInfResults) renderChart(window.__lfcInfResults);
          };
          img.onerror = function () { tentar(i + 1); };
          img.src = dataUri;
        })
        .catch(function () { tentar(i + 1); });
    }
    try { tentar(0); } catch (e) {}
  })();

  /* ============ Startup ============ */
  function esconderTabs() {
    var tabs = document.querySelectorAll('[graphic-button], [table-button]');
    for (var i = 0; i < tabs.length; i++) tabs[i].style.display = 'none';
  }
  document.addEventListener('DOMContentLoaded', esconderTabs);
  esconderTabs();

  function onResults(r) {
    renderChart(r);
    renderTable(r);
    var tw = document.querySelector('.table-content-watermark_wrapper');
    if (tw) tw.style.display = 'block';
    esconderTabs();
  }
  document.addEventListener('lfc-inf:calculated', function (e) { onResults(e.detail); });
  if (window.__lfcInfResults) onResults(window.__lfcInfResults);
})();
