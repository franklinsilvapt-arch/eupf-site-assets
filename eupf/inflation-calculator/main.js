/* Euro inflation calculator (eupersonalfinance.eu/euro-inflation-calculator, /pl, /nl).
   EMBED D v6 - main script. EN: Eurostat HICP 1997+. NL: CBS CPI 1963+. PL: GUS CPI 1995+ (PLN).
   Loaded from a page embed, synchronously, at the same position the inline code used to sit. */
(function () {
  'use strict';

  /* ============ Locale and dictionary ============ */
  /* The Dutch version lives at /nl on the same page tree. Webflow does not localise
     embed contents, and it would never reach strings the script builds at runtime
     anyway, so every string is swapped here instead.
     The glossary is the exception: it has its own Dutch version on the locale, which
     is why no gl_* keys live here. One source of truth per block. */
  /* Polish lives at /pl and uses the national CPI from GUS, in zloty, like Dutch uses CBS. */
  var LANG = (/^\/nl(\/|$)/).test(window.location.pathname) ? 'nl'
    : (/^\/pl(\/|$)/).test(window.location.pathname) ? 'pl' : 'en';

  var DICT = {
    pl: {
      lbl_amount: 'Kwota',
      tip_amount: 'Kwota, kt\u00f3rej si\u0142\u0119 nabywcz\u0105 chcesz sprawdzi\u0107, mierzona oficjaln\u0105 inflacj\u0105 w Polsce (wska\u017anik cen towar\u00f3w i us\u0142ug konsumpcyjnych GUS). Na przyk\u0142ad pensja, oszcz\u0119dno\u015bci albo dawna cena.',
      lbl_start: 'Rok pocz\u0105tkowy',
      tip_start: 'Pierwszy rok okresu. Seria zaczyna si\u0119 w 1995 roku, gdy po denominacji wesz\u0142y do obiegu nowe z\u0142ote (10 000 starych z\u0142otych = 1 nowy z\u0142oty).',
      lbl_end: 'Rok ko\u0144cowy',
      tip_end: 'Ostatni rok okresu. Dla bie\u017c\u0105cego roku kalkulator u\u017cywa warto\u015bci wst\u0119pnej: \u015bredniej z miesi\u0119cy opublikowanych dot\u0105d przez GUS.',
      btn_calc: 'Oblicz',
      cur_label: 'Kwota w',
      row_cumulative: 'Inflacja skumulowana',
      row_avg: '\u015arednia roczna stopa',
      row_loss: 'Utrata si\u0142y nabywczej',
      disclaimer: 'Wyniki s\u0105 orientacyjnymi symulacjami opartymi na wska\u017aniku cen towar\u00f3w i us\u0142ug konsumpcyjnych (CPI) publikowanym przez GUS i nie stanowi\u0105 porady finansowej.',
      lbl_equiv: 'Si\u0142a nabywcza {v} z {y0} r. w {y1} r.:',
      lbl_needed: 'Kwota potrzebna w {y1} r. dla tej samej si\u0142y nabywczej',
      region_ea: 'Polski',
      region_nl: 'Polski',
      summary: 'Wed\u0142ug oficjalnej inflacji w Polsce <strong>{v} z {y0} r.</strong> ma w <strong>{y1} r.</strong> si\u0142\u0119 nabywcz\u0105 zaledwie <strong>{pc}</strong>. Pieni\u0105dze, kt\u00f3re le\u017ca\u0142y bez oprocentowania, straci\u0142y <strong>{loss}</strong> si\u0142y nabywczej w ci\u0105gu {n}, przy skumulowanej inflacji <strong>{cum}</strong>, czyli \u015brednio {avg} rocznie. Aby w {y1} r. kupi\u0107 to, co w {y0} r. kosztowa\u0142o {v}, potrzebujesz <strong>{need}</strong>.',
      sum_prov: ' Bie\u017c\u0105cy rok jest wst\u0119pny: to \u015brednia z miesi\u0119cy opublikowanych dot\u0105d przez GUS.',
      err_amount: 'Wpisz kwot\u0119 wi\u0119ksz\u0105 od 0, na przyk\u0142ad 1000.',
      err_start: 'Rok pocz\u0105tkowy musi mie\u015bci\u0107 si\u0119 mi\u0119dzy {min} a {max}. Zmie\u0144 go i oblicz ponownie.',
      err_end: 'Rok ko\u0144cowy musi mie\u015bci\u0107 si\u0119 mi\u0119dzy {min} a {max}.',
      err_order: 'Rok ko\u0144cowy musi by\u0107 p\u00f3\u017aniejszy ni\u017c rok pocz\u0105tkowy, na przyk\u0142ad od {min} do {max}.',
      err_nodata: 'Brak danych o inflacji za {year} r. Zmie\u0144 okres i oblicz ponownie.',
      aria_avg: 'Co oznacza \u015brednia roczna stopa',
      tip_avg: '\u015arednia geometryczna: sta\u0142a stopa, kt\u00f3ra stosowana co roku daje dok\u0142adnie inflacj\u0119 skumulowan\u0105 z ca\u0142ego okresu.',
      copied: 'Link skopiowany',
      share: 'Udost\u0119pnij wyniki',
      hint_hover: 'Najed\u017a na wykres, aby zobaczy\u0107 warto\u015b\u0107 w ka\u017cdym roku',
      hint_touch: 'Dotknij wykresu, aby zobaczy\u0107 warto\u015b\u0107 w ka\u017cdym roku',
      tt_power: 'Si\u0142a nabywcza',
      tt_infl: 'Inflacja w danym roku',
      chart_title: 'Si\u0142a nabywcza w czasie',
      chart_sub_a: 'Jak warto\u015b\u0107',
      chart_sub_b: 'maleje od',
      chart_sub_c: 'do',
      chart_alt: 'Wykres si\u0142y nabywczej na tle banknotu 10 z\u0142',
      th_year: 'Rok',
      th_infl: 'Inflacja (CPI)',
      th_needed: 'Potrzebna kwota',
      th_power: 'Si\u0142a nabywcza',
      th_cum: 'Skumulowana',
      base_year: 'Rok bazowy',
      prov_note: '* Warto\u015b\u0107 wst\u0119pna dla bie\u017c\u0105cego roku: \u015brednia z miesi\u0119cy opublikowanych dot\u0105d przez GUS.',
      btn_more: 'Poka\u017c wi\u0119cej',
      btn_less: 'Poka\u017c mniej',
      src_line: 'Wska\u017aniki cen towar\u00f3w i us\u0142ug konsumpcyjnych (CPI) - <a href="https://stat.gov.pl/obszary-tematyczne/ceny-handel/wskazniki-cen/wskazniki-cen-towarow-i-uslug-konsumpcyjnych-pot-inflacja-/roczne-wskazniki-cen-towarow-i-uslug-konsumpcyjnych/" target="_blank" rel="noopener" class="blue-link">G\u0142\u00f3wny Urz\u0105d Statystyczny</a>',
      table_disc: 'Dane oparte na rocznych wska\u017anikach cen towar\u00f3w i us\u0142ug konsumpcyjnych (GUS). Wyniki s\u0105 orientacyjnymi symulacjami i nie stanowi\u0105 porady finansowej.'
    },
    nl: {
      lbl_amount: 'Bedrag',
      tip_amount: 'Het bedrag waarvan je de koopkracht wilt bekijken, gemeten aan de offici\u00eble Nederlandse inflatie: de consumentenprijsindex van het CBS. Bijvoorbeeld een salaris, je spaargeld of een oude prijs.',
      lbl_start: 'Beginjaar',
      tip_start: 'Het eerste jaar van de periode. De CBS-reeks begint in 1963, ruim voor de invoering van de euro.',
      lbl_end: 'Eindjaar',
      tip_end: 'Het laatste jaar van de periode. Voor het lopende jaar geldt een voorlopig cijfer, gebaseerd op de maanden die het CBS tot nu toe heeft gepubliceerd.',
      btn_calc: 'Bereken',
      cur_label: 'Bedrag in',

      row_cumulative: 'Cumulatieve inflatie',
      row_avg: 'Gemiddeld jaarlijks percentage',
      row_loss: 'Verlies aan koopkracht',
      disclaimer: 'Deze resultaten zijn indicatieve simulaties op basis van de consumentenprijsindex (CPI) van het CBS en vormen geen financieel advies.',
      lbl_equiv: '{v} uit {y0} is in {y1} nog dit waard:',
      lbl_needed: 'Bedrag dat je in {y1} nodig hebt voor dezelfde koopkracht',
      region_ea: 'Nederlandse',
      region_nl: 'Nederlandse',
      summary: 'Met de offici\u00eble {region} inflatie is <strong>{v} uit {y0}</strong> in <strong>{y1}</strong> nog maar <strong>{pc}</strong> aan koopkracht waard. Geld dat stil bleef staan kromp met <strong>{loss}</strong> in {n} jaar, bij een cumulatieve inflatie van <strong>{cum}</strong>, gemiddeld {avg} per jaar. Om in {y1} te kopen wat {v} in {y0} kocht, heb je <strong>{need}</strong> nodig.',
      sum_prov: ' Het lopende jaar is voorlopig, gebaseerd op de maanden die het CBS tot nu toe heeft gepubliceerd.',
      sum_gulden: '\u0192\u00a0{fl} uit {y0} komt overeen met {eur}, omgerekend tegen de vaste koers van 2,20371 gulden per euro. Daarmee is gerekend. ',

      err_amount: 'Vul een bedrag boven 0 in om te bekijken. Bijvoorbeeld 1.000.',
      err_start: 'Het beginjaar moet tussen {min} en {max} liggen. Pas het aan en bereken opnieuw.',
      err_end: 'Het eindjaar moet tussen {min} en {max} liggen.',
      err_order: 'Het eindjaar moet na het beginjaar komen. Bijvoorbeeld van {min} tot {max}.',
      err_nodata: 'Er zijn geen inflatiecijfers voor {year}. Pas de periode aan en bereken opnieuw.',

      aria_avg: 'Wat het gemiddelde jaarlijkse percentage betekent',
      tip_avg: 'Een meetkundig gemiddelde: het vaste percentage dat, elk jaar toegepast, precies de cumulatieve inflatie van de periode oplevert.',

      copied: 'Link gekopieerd',
      share: 'Deel resultaten',

      hint_hover: 'Beweeg over de grafiek om de waarde per jaar te zien',
      hint_touch: 'Tik op de grafiek om de waarde per jaar te zien',
      tt_power: 'Koopkracht',
      tt_infl: 'Inflatie dat jaar',
      chart_title: 'Koopkracht door de tijd',
      chart_sub_a: 'Hoe de waarde van',
      chart_sub_b: 'krimpt van',
      chart_sub_c: 'tot',
      chart_alt: 'Grafiek van de koopkracht over een biljet van 10 euro',
      th_year: 'Jaar',
      th_infl: 'Inflatie (CPI)',
      th_needed: 'Benodigd bedrag',
      th_power: 'Koopkracht',
      th_cum: 'Cumulatief',
      base_year: 'Basisjaar',
      prov_note: '* Voorlopig cijfer voor het lopende jaar, gebaseerd op de maanden die het CBS tot nu toe heeft gepubliceerd.',
      btn_more: 'Toon meer',
      btn_less: 'Toon minder',
      src_line: 'Consumentenprijsindex (CPI) - <a href="https://www.cbs.nl/nl-nl/cijfers/detail/70936NED" target="_blank" rel="noopener" class="blue-link">CBS StatLine</a>',
      table_disc: 'Cijfers op basis van de jaarmutatie van de consumentenprijsindex (CBS). Deze resultaten zijn indicatieve simulaties en vormen geen financieel advies.'
    }
  };

  function T(key, fallback) {
    var d = DICT[LANG];
    return (d && d[key]) ? d[key] : fallback;
  }
  window.__lfcInfT = T;
  window.__lfcInfLang = LANG;

  function aplicarTraducoes() {
    if (LANG === 'en') return;
    var i, els;
    els = document.querySelectorAll('[data-i18n]');
    for (i = 0; i < els.length; i++) {
      var k = els[i].getAttribute('data-i18n');
      if (DICT[LANG][k]) els[i].textContent = DICT[LANG][k];
    }
    els = document.querySelectorAll('[data-i18n-html]');
    for (i = 0; i < els.length; i++) {
      var kh = els[i].getAttribute('data-i18n-html');
      if (DICT[LANG][kh]) els[i].innerHTML = DICT[LANG][kh];
    }
  }

  /* ============ Highlight row and tooltips ============ */
  (function estilosInjetados() {
    if (document.getElementById('lfc-inf-hero-css')) return;
    var st = document.createElement('style');
    st.id = 'lfc-inf-hero-css';
    st.textContent =
      '.lfc-inf-row-hero{flex-wrap:nowrap!important;align-items:center!important}' +
      '.lfc-inf-hero-label{min-width:0}' +
      '.lfc-inf-hero-value{flex:0 0 auto;white-space:nowrap}' +
      '.lfc-inf-label-info{z-index:1;display:flex;align-items:center;column-gap:.3rem;position:relative}' +
      '.lfc-inf-label-info:hover{z-index:100}' +
      '.lfc-inf-help .help-text_wrapper{opacity:0;transition:opacity .2s}' +
      '.lfc-inf-help:hover .help-text_wrapper,.lfc-inf-help.is-open .help-text_wrapper{opacity:1}' +
      '@media (max-width: 767px){.help-text_wrapper{max-width:calc(100vw - 24px)}}';
    document.head.appendChild(st);
  })();

  function linhaDe(id) {
    var el = document.getElementById(id);
    if (!el || !el.closest) return null;
    var row = el.closest('.resultados_component');
    if (!row) {
      var node = el.parentNode;
      while (node && node.nodeType === 1 && node !== document.body) {
        if (getComputedStyle(node).display === 'flex') { row = node; break; }
        node = node.parentNode;
      }
    }
    return row;
  }

  function ladosDaLinha(row, el) {
    var lados = { valor: null, label: null };
    for (var i = 0; i < row.children.length; i++) {
      if (row.children[i].contains(el)) lados.valor = row.children[i];
      else if (!lados.label) lados.label = row.children[i];
    }
    return lados;
  }

  function ajustarLinhaDestaque() {
    var val = document.getElementById('lfc-inf-equivalente');
    var row = linhaDe('lfc-inf-equivalente');
    if (!val || !row) return;
    row.classList.add('lfc-inf-row-hero');
    var lados = ladosDaLinha(row, val);
    if (lados.label) lados.label.classList.add('lfc-inf-hero-label');
    if (lados.valor) lados.valor.classList.add('lfc-inf-hero-value');
  }

  function ajustarTooltips() {
    var MARGEM = 12;
    var wraps = document.querySelectorAll('.help-icon_wrapper');
    for (var i = 0; i < wraps.length; i++) {
      var bolha = wraps[i].querySelector('.help-text_wrapper');
      var tip = wraps[i].querySelector('.triangle-tip');
      if (!bolha) continue;
      bolha.style.left = '';
      if (tip) tip.style.left = '';
      if (window.innerWidth > 767) continue;

      var icone = wraps[i].getBoundingClientRect();
      var largura = bolha.offsetWidth;
      var centro = icone.left + icone.width / 2;
      var ideal = centro - largura / 2;
      var limite = window.innerWidth - largura - MARGEM;
      var esquerda = Math.max(MARGEM, Math.min(ideal, limite));
      bolha.style.left = (esquerda - icone.left) + 'px';
      if (tip) tip.style.left = (centro - esquerda - 8) + 'px';
    }
  }

  var timerResize = null;
  window.addEventListener('resize', function () {
    clearTimeout(timerResize);
    timerResize = setTimeout(function () { ajustarLinhaDestaque(); ajustarTooltips(); }, 150);
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { aplicarTraducoes(); ajustarTooltips(); });
  } else {
    aplicarTraducoes();
    ajustarTooltips();
  }
  window.addEventListener('load', ajustarTooltips);

  var HELP_SVG =
    '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M6.05967 5.99992C6.21641 5.55436 6.52578 5.17866 6.93298 4.93934C7.34018 4.70002 7.81894 4.61254 ' +
    '8.28446 4.69239C8.74998 4.77224 9.17222 5.01427 9.47639 5.3756C9.78057 5.73694 9.94705 6.19427 9.94634 ' +
    '6.66659C9.94634 7.99992 7.94634 8.66659 7.94634 8.66659M7.99967 11.3333H8.00634M14.6663 7.99992C14.6663 ' +
    '11.6818 11.6816 14.6666 7.99967 14.6666C4.31778 14.6666 1.33301 11.6818 1.33301 7.99992C1.33301 4.31802 ' +
    '4.31778 1.33325 7.99967 1.33325C11.6816 1.33325 14.6663 4.31802 14.6663 7.99992Z" stroke="currentColor" ' +
    'stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function montarTooltipTaxaMedia() {
    if (document.getElementById('lfc-inf-help-media')) return;
    var row = linhaDe('lfc-inf-media');
    if (!row) return;
    var val = document.getElementById('lfc-inf-media');
    var alvo = null;
    for (var i = 0; i < row.children.length; i++) {
      if (!row.children[i].contains(val)) { alvo = row.children[i]; break; }
    }
    if (!alvo) return;

    var help = document.createElement('div');
    help.id = 'lfc-inf-help-media';
    help.className = 'help-icon_wrapper lfc-inf-help';
    help.setAttribute('role', 'button');
    help.setAttribute('tabindex', '0');
    help.setAttribute('aria-label', T('aria_avg', 'What the average annual rate means'));
    help.innerHTML =
      '<div class="help-icon">' + HELP_SVG + '</div>' +
      '<div class="help-text_wrapper"><div class="triangle-tip"></div>' +
        '<div class="text-size-small"><div class="text-weight-medium"></div></div>' +
      '</div>';
    var txt = document.createElement('div');
    txt.textContent = T('tip_avg', 'A geometric mean: the constant rate that, applied every year, produces the cumulative inflation of the period.');
    help.querySelector('.text-weight-medium').appendChild(txt);

    help.addEventListener('click', function (e) { e.stopPropagation(); help.classList.toggle('is-open'); });
    help.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); help.classList.toggle('is-open'); }
    });
    document.addEventListener('click', function () { help.classList.remove('is-open'); });

    alvo.classList.add('lfc-inf-label-info');
    alvo.appendChild(help);
    ajustarTooltips();
  }

  (function esconderResultadosAteCalcular() {
    var wrappers = document.querySelectorAll('.all-results_wrapper');
    for (var i = 0; i < wrappers.length; i++) wrappers[i].style.setProperty('display', 'none', 'important');
  })();

  /* ============ Data ============ */
  /* Two audiences, two indices, on purpose.
     EA: Eurostat HICP, from 1997, the only measure comparable across member states.
     NL: CBS national CPI, from 1963. It is the figure Dutch media quote and it differs
     from the HICP by more than rounding (2022: 10.0 here, 11.6 in the HICP).

     These values are a fallback. The live figures come from the eupf-hicp-data
     repository, refreshed from Eurostat and CBS twice a month. */
  var SERIES = {
    EA: {
      '1997': 1.6, '1998': 1.1, '1999': 1.1, '2000': 2.1, '2001': 2.3, '2002': 2.3, '2003': 2.1,
      '2004': 2.1, '2005': 2.2, '2006': 2.2, '2007': 2.1, '2008': 3.3, '2009': 0.3, '2010': 1.6,
      '2011': 2.7, '2012': 2.5, '2013': 1.4, '2014': 0.4, '2015': 0.2, '2016': 0.2, '2017': 1.5,
      '2018': 1.8, '2019': 1.2, '2020': 0.3, '2021': 2.6, '2022': 8.4, '2023': 5.4, '2024': 2.4,
      '2025': 2.1, '2026': 2.6
    },
    NL: {
      '1963': 3.8, '1964': 5.5, '1965': 5.2, '1966': 5.8, '1967': 3.1, '1968': 3.7, '1969': 7.5,
      '1970': 4.4, '1971': 7.6, '1972': 7.8, '1973': 8.0, '1974': 9.6, '1975': 10.2, '1976': 8.8,
      '1977': 6.7, '1978': 4.1, '1979': 4.2, '1980': 6.5, '1981': 6.7, '1982': 6.0, '1983': 2.8,
      '1984': 3.3, '1985': 2.3, '1986': 0.2, '1987': -0.5, '1988': 0.7, '1989': 1.1, '1990': 2.5,
      '1991': 3.9, '1992': 3.7, '1993': 2.1, '1994': 2.7, '1995': 2.0, '1996': 2.1, '1997': 2.2,
      '1998': 2.0, '1999': 2.2, '2000': 2.6, '2001': 4.5, '2002': 3.4, '2003': 2.1, '2004': 1.2,
      '2005': 1.7, '2006': 1.1, '2007': 1.6, '2008': 2.5, '2009': 1.2, '2010': 1.3, '2011': 2.3,
      '2012': 2.5, '2013': 2.5, '2014': 1.0, '2015': 0.6, '2016': 0.3, '2017': 1.4, '2018': 1.7,
      '2019': 2.6, '2020': 1.3, '2021': 2.7, '2022': 10.0, '2023': 3.8, '2024': 3.3, '2025': 3.3,
      '2026': 2.8
    },
    /* PL: GUS annual CPI (previous year = 100, minus 100), from 1995, the year the new
       zloty replaced the old one (10,000 old = 1 new), so every amount is in today's PLN.
       Source: GUS, "Roczne wskazniki cen towarow i uslug konsumpcyjnych od 1950 roku".
       2026 is provisional: average of the year-on-year readings GUS has published for
       January to September 2026. Not in the eupf-hicp-data feed: update by hand in January. */
    PL: {
      '1995': 27.8, '1996': 19.9, '1997': 14.9, '1998': 11.8, '1999': 7.3, '2000': 10.1,
      '2001': 5.5, '2002': 1.9, '2003': 0.8, '2004': 3.5, '2005': 2.1, '2006': 1.0, '2007': 2.5,
      '2008': 4.2, '2009': 3.5, '2010': 2.6, '2011': 4.3, '2012': 3.7, '2013': 0.9, '2014': 0.0,
      '2015': -0.9, '2016': -0.6, '2017': 2.0, '2018': 1.6, '2019': 2.3, '2020': 3.4, '2021': 5.1,
      '2022': 14.4, '2023': 11.4, '2024': 3.6, '2025': 3.6, '2026': 2.9
    }
  };
  var SERIE_ID = (LANG === 'nl') ? 'NL' : (LANG === 'pl') ? 'PL' : 'EA';
  var HICP = SERIES[SERIE_ID];
  var PROVISORIO = { '2026': true };
  var REGIAO = (SERIE_ID === 'NL') ? T('region_nl', 'Dutch') : T('region_ea', 'euro area');
  var ANO_BASE = (SERIE_ID === 'NL') ? 1963 : (SERIE_ID === 'PL') ? 1995 : 1997;

  /* Guilder: irrevocable conversion rate, and the year cash changed hands. 2002 rather
     than 1999 on purpose, because people remember banknotes, not accounting rates. */
  var NLG_RATE = 2.20371;
  var ANO_EURO = 2002;
  var moeda = 'EUR';

  var REMOTE_URLS = [
    'https://raw.githubusercontent.com/franklinsilvapt-arch/eupf-hicp-data/main/data/hicp-anual.json',
    'https://cdn.jsdelivr.net/gh/franklinsilvapt-arch/eupf-hicp-data@main/data/hicp-anual.json'
  ];

  function aplicarDados(json) {
    if (!json || !json.series || !json.series[SERIE_ID]) return false;
    var mudou = false;
    var serie = json.series[SERIE_ID];
    for (var ano in serie) {
      var v = parseFloat(serie[ano]);
      if (isFinite(v) && HICP[ano] !== v) { HICP[ano] = v; mudou = true; }
    }
    var prov = (json.provisional && json.provisional[SERIE_ID]) || {};
    for (var anoP in prov) {
      if (anoP === 'months') continue;
      var vp = parseFloat(prov[anoP]);
      if (isFinite(vp)) {
        if (HICP[anoP] !== vp) { HICP[anoP] = vp; mudou = true; }
        PROVISORIO[anoP] = true;
      }
    }
    /* A year Eurostat or CBS has since closed stops being provisional, so the asterisk
       and the footnote disappear on their own in January. */
    for (var y in PROVISORIO) {
      if (!(y in prov)) { delete PROVISORIO[y]; mudou = true; }
    }
    return mudou;
  }

  function carregarDadosRemotos() {
    function tentar(i) {
      if (i >= REMOTE_URLS.length) return;
      fetch(REMOTE_URLS[i], { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (json) {
          if (!json) { tentar(i + 1); return; }
          if (aplicarDados(json)) sincronizarDropdowns();
        })
        .catch(function () { tentar(i + 1); });
    }
    try { tentar(0); } catch (e) {}
  }

  function anosDisponiveis() {
    var anos = Object.keys(HICP).map(function (a) { return parseInt(a, 10); });
    anos.sort(function (a, b) { return a - b; });
    return anos;
  }

  /* ============ Year dropdowns ============ */
  var DD = {
    'ano-inicial': { nav: 'lfc-inf-dd-inicial', select: 'lfc-inf-ano-inicial', label: 'lfc-inf-ano-inicial-label', default: ANO_BASE },
    'ano-final': { nav: 'lfc-inf-dd-final', select: 'lfc-inf-ano-final', label: 'lfc-inf-ano-final-label', default: null }
  };

  function popularDropdown(tipo, valorSelecionado) {
    var cfg = DD[tipo];
    var nav = document.getElementById(cfg.nav);
    var sel = document.getElementById(cfg.select);
    var lbl = document.getElementById(cfg.label);
    if (!nav || !sel) return;
    var anos = anosDisponiveis();
    if (valorSelecionado === null || valorSelecionado === undefined) {
      valorSelecionado = cfg.default !== null ? cfg.default : anos[anos.length - 1];
    }
    var optHtml = '';
    var linkHtml = '';
    for (var i = 0; i < anos.length; i++) {
      var a = anos[i];
      var cur = a === valorSelecionado;
      optHtml += '<option value="' + a + '"' + (cur ? ' selected' : '') + '>' + a + '</option>';
      linkHtml += '<a href="#" class="dropdown-calculadora w-dropdown-link' + (cur ? ' w--current' : '') + '" role="option" data-ano="' + a + '">' + a + '</a>';
    }
    sel.innerHTML = optHtml;
    sel.value = String(valorSelecionado);
    var oldLinks = nav.querySelectorAll('a.dropdown-calculadora');
    for (var j = 0; j < oldLinks.length; j++) oldLinks[j].parentNode.removeChild(oldLinks[j]);
    sel.insertAdjacentHTML('afterend', linkHtml);
    if (lbl) lbl.textContent = String(valorSelecionado);
    atualizarMoeda();
  }

  function sincronizarDropdowns() {
    var anos = anosDisponiveis();
    var ultimo = anos[anos.length - 1];
    var selIni = document.getElementById('lfc-inf-ano-inicial');
    var selFim = document.getElementById('lfc-inf-ano-final');
    var valIni = selIni && selIni.value ? parseInt(selIni.value, 10) : DD['ano-inicial'].default;
    var valFim = (selFim && selFim.getAttribute('data-user-edited') && selFim.value)
      ? parseInt(selFim.value, 10) : ultimo;
    if (anos.indexOf(valIni) === -1) valIni = anos[0];
    if (anos.indexOf(valFim) === -1) valFim = ultimo;
    popularDropdown('ano-inicial', valIni);
    popularDropdown('ano-final', valFim);
  }

  function setAno(tipo, ano) {
    var cfg = DD[tipo];
    var sel = document.getElementById(cfg.select);
    var lbl = document.getElementById(cfg.label);
    var nav = document.getElementById(cfg.nav);
    if (sel) sel.value = String(ano);
    if (lbl) lbl.textContent = String(ano);
    if (nav) {
      var links = nav.querySelectorAll('a.dropdown-calculadora');
      for (var i = 0; i < links.length; i++) {
        links[i].classList.toggle('w--current', links[i].getAttribute('data-ano') === String(ano));
      }
    }
    atualizarMoeda();
  }

  /* ============ Currency switch ============ */
  /* Only shown on the Dutch page, and only when the period actually starts before the
     euro. Neutral by design: the visitor says which currency the amount is in, rather
     than the calculator guessing and silently rewriting their number. */
  function atualizarMoeda() {
    var wrap = document.getElementById('lfc-inf-moeda');
    if (!wrap) return;
    var sel = document.getElementById('lfc-inf-ano-inicial');
    var ano = sel && sel.value ? parseInt(sel.value, 10) : ANO_BASE;
    var relevante = (LANG === 'nl') && ano < ANO_EURO;
    wrap.style.display = relevante ? 'flex' : 'none';
    if (!relevante && moeda !== 'EUR') selecionarMoeda('EUR');
  }

  function selecionarMoeda(nova) {
    moeda = nova;
    var btns = document.querySelectorAll('.lfc-inf-moeda-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('is-active', btns[i].getAttribute('data-moeda') === nova);
    }
    var simbolo = document.getElementById('lfc-inf-simbolo');
    if (simbolo) simbolo.textContent = (LANG === 'pl') ? 'z\u0142' : (nova === 'NLG') ? '\u0192' : '\u20ac';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.lfc-inf-moeda-btn') : null;
    if (!btn) return;
    e.preventDefault();
    selecionarMoeda(btn.getAttribute('data-moeda'));
  });

  /* ============ Dropdown housekeeping ============ */
  var mo = null;
  function navsObservados() {
    return ['lfc-inf-dd-inicial', 'lfc-inf-dd-final'].map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);
  }
  function ligarObserver() {
    if (!mo) return;
    navsObservados().forEach(function (nav) { mo.observe(nav, { childList: true }); });
  }
  function normalizarDropdownLinks() {
    var pendentes = [];
    navsObservados().forEach(function (nav) {
      var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
      if (links.length < 2) return;
      var seen = {}, unicos = [], duplicados = [];
      for (var i = 0; i < links.length; i++) {
        var k = links[i].textContent.trim();
        if (seen[k]) duplicados.push(links[i]);
        else { seen[k] = true; unicos.push(links[i]); }
      }
      var ordenados = unicos.slice().sort(function (a, b) {
        return parseInt(a.textContent.trim(), 10) - parseInt(b.textContent.trim(), 10);
      });
      var desordenado = false;
      for (var j = 0; j < unicos.length; j++) {
        if (unicos[j] !== ordenados[j]) { desordenado = true; break; }
      }
      if (duplicados.length || desordenado) pendentes.push({ nav: nav, duplicados: duplicados, ordenados: ordenados });
    });
    if (!pendentes.length) return;
    if (mo) mo.disconnect();
    pendentes.forEach(function (p) {
      p.duplicados.forEach(function (l) { if (l.parentNode) l.parentNode.removeChild(l); });
      p.ordenados.forEach(function (l) { p.nav.appendChild(l); });
    });
    if (mo) { mo.takeRecords(); ligarObserver(); }
  }
  function linkSelecionado(nav) {
    var atual = nav.querySelector('a.dropdown-calculadora.w--current');
    if (atual) return atual;
    var sel = nav.querySelector('select');
    if (!sel) return null;
    var links = nav.querySelectorAll('a.dropdown-calculadora');
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute('data-ano') === String(sel.value)) return links[i];
    }
    return null;
  }
  function centrarNoSelecionado(nav) {
    var atual = linkSelecionado(nav);
    if (!atual || !nav.clientHeight) return;
    var rNav = nav.getBoundingClientRect();
    var rAtual = atual.getBoundingClientRect();
    nav.scrollTop += (rAtual.top - rNav.top) - (nav.clientHeight - rAtual.height) / 2;
  }
  function observarAbertura() {
    navsObservados().forEach(function (nav) {
      if (nav.__lfcCentrar) return;
      nav.__lfcCentrar = true;
      new MutationObserver(function () {
        if (!nav.classList.contains('w--open')) return;
        requestAnimationFrame(function () { centrarNoSelecionado(nav); });
        setTimeout(function () { centrarNoSelecionado(nav); }, 80);
      }).observe(nav, { attributes: true, attributeFilter: ['class'] });
    });
  }
  function iniciarObserver() {
    mo = new MutationObserver(function () { normalizarDropdownLinks(); });
    ligarObserver();
    normalizarDropdownLinks();
    observarAbertura();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarObserver);
  else iniciarObserver();

  /* ============ Number formatting ============ */
  /* English: \u20ac1,234.56. Dutch: \u20ac 1.234,56. Getting this wrong is not cosmetic: a
     Dutch reader would read \u20ac1,234.56 as one euro and change. */
  /* Polish: 1\u00a0234,56\u00a0z\u0142, zloty after the number. */
  var NUM = (LANG === 'nl')
    ? { mil: '.', dec: ',', pre: '\u20ac\u00a0', suf: '' }
    : (LANG === 'pl')
      ? { mil: '\u00a0', dec: ',', pre: '', suf: '\u00a0z\u0142' }
      : { mil: ',', dec: '.', pre: '\u20ac', suf: '' };
  window.__lfcInfNum = NUM;

  function grp(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, NUM.mil); }

  function parseNumber(raw) {
    var s = String(raw).replace(/z\u0142/gi, '').replace(/[\s\u00a0\u20ac\u0192]/g, '');
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
    else if (LANG === 'nl' || LANG === 'pl') s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
    return parseFloat(s) || 0;
  }
  function parseInput(dataType) {
    var el = document.querySelector('[data-type="' + dataType + '"]');
    return el ? parseNumber(el.value) : 0;
  }
  function fmtCurrency(value) {
    if (!isFinite(value)) return '\u2014';
    var parts = Math.abs(value).toFixed(2).split('.');
    return (value < 0 ? '- ' : '') + NUM.pre + grp(parts[0]) + NUM.dec + parts[1] + NUM.suf;
  }
  function fmtCurrencyInt(value) {
    if (!isFinite(value)) return '\u2014';
    return (value < 0 ? '- ' : '') + NUM.pre + grp(String(Math.round(Math.abs(value)))) + NUM.suf;
  }
  function fmtPlain(value) { return grp(String(Math.round(Math.abs(value)))); }
  function fmtPct(value) {
    if (!isFinite(value)) return '\u2014';
    var s = Math.abs(value).toFixed(value >= 1000 ? 0 : 2).replace('.', NUM.dec);
    return (value < 0 ? '- ' : '') + s + '%';
  }
  function setText(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }
  function fill(tpl, vals) {
    return tpl.replace(/\{(\w+)\}/g, function (m, k) {
      return (vals[k] === undefined || vals[k] === null) ? '' : vals[k];
    });
  }

  if (LANG === 'nl' || LANG === 'pl') {
    var campoValor = document.getElementById('lfc-inf-valor');
    if (campoValor && campoValor.value === '1,000') campoValor.value = (LANG === 'nl') ? '1.000' : '1000';
    var simboloPl = document.getElementById('lfc-inf-simbolo');
    if (LANG === 'pl' && simboloPl) simboloPl.textContent = 'z\u0142';
  }

  /* Polish plural for years: 1 rok, 2-4 lata (but 12-14 lat), otherwise lat. */
  function plLata(n) {
    var m10 = n % 10, m100 = n % 100;
    if (n === 1) return '1 rok';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return n + ' lata';
    return n + ' lat';
  }

  /* ============ Calculation ============ */
  function calcular() {
    var introduzido = parseInput('valor');
    if (!(introduzido > 0)) return { error: T('err_amount', 'Enter an amount above \u20ac0 to analyse. For example, \u20ac1,000.') };

    var anoInicial = Math.round(parseInput('ano-inicial'));
    var anoFinal = Math.round(parseInput('ano-final'));
    var anos = anosDisponiveis();
    var min = anos[0], max = anos[anos.length - 1];
    if (anoInicial < min || anoInicial > max) return { error: fill(T('err_start', 'The start year must be between {min} and {max}. Adjust it and calculate again.'), { min: min, max: max }) };
    if (anoFinal < min || anoFinal > max) return { error: fill(T('err_end', 'The end year must be between {min} and {max}.'), { min: min, max: max }) };
    if (anoFinal <= anoInicial) return { error: fill(T('err_order', 'The end year must come after the start year. For example, from {min} to {max}.'), { min: min, max: max }) };

    /* Guilders are converted up front. The ratio would be identical either way, but the
       label would not: every figure downstream is then honestly in euros. */
    var emGulden = (moeda === 'NLG' && anoInicial < ANO_EURO);
    var valor = emGulden ? (introduzido / NLG_RATE) : introduzido;

    var serie = [];
    var fator = 1;
    var temProvisorio = false;
    serie.push({ ano: anoInicial, inflacao: null, fator: 1, valorNecessario: valor, poderCompra: valor, acumulada: 0, provisorio: false });
    for (var ano = anoInicial + 1; ano <= anoFinal; ano++) {
      var i = HICP[String(ano)];
      if (i === undefined || i === null || !isFinite(i)) return { error: fill(T('err_nodata', 'There is no inflation data for {year}. Adjust the period and calculate again.'), { year: ano }) };
      fator = fator * (1 + i / 100);
      var prov = !!PROVISORIO[String(ano)];
      if (prov) temProvisorio = true;
      serie.push({ ano: ano, inflacao: i, fator: fator, valorNecessario: valor * fator, poderCompra: valor / fator, acumulada: (fator - 1) * 100, provisorio: prov });
    }

    var n = anoFinal - anoInicial;
    return {
      mode: 'official', valor: valor, introduzido: introduzido, emGulden: emGulden,
      anoInicial: anoInicial, anoFinal: anoFinal, n: n, fator: fator,
      valorEquivalente: valor * fator, poderCompra: valor / fator,
      acumulada: (fator - 1) * 100, mediaAnual: (Math.pow(fator, 1 / n) - 1) * 100, perda: (1 - 1 / fator) * 100,
      temProvisorio: temProvisorio, serie: serie
    };
  }

  /* ============ Render ============ */
  function mostrarCartoesResultado() {
    var wrappers = document.querySelectorAll('.all-results_wrapper');
    for (var i = 0; i < wrappers.length; i++) wrappers[i].style.removeProperty('display');
    var ad = document.querySelector('.calculator-ad_wrapper');
    var cartoes = document.querySelectorAll('.all-results_wrapper > [results-anchor]');
    if (ad && cartoes.length > 1) {
      if (cartoes[1].previousElementSibling !== ad) cartoes[1].parentNode.insertBefore(ad, cartoes[1]);
      var pub = ad.querySelector('.table-results_wrapper.is-pub');
      if (pub) pub.style.setProperty('margin-top', '0', 'important');
    }
  }

  function mostrarErro(msg) {
    var root = document.getElementById('lfc-inf');
    if (!root) return;
    root.classList.remove('is-hidden');
    mostrarCartoesResultado();
    var err = document.getElementById('lfc-inf-error');
    err.style.display = 'block';
    err.textContent = msg;
    document.getElementById('lfc-inf-results').style.display = 'none';
    document.getElementById('lfc-inf-resumo-wrap').style.display = 'none';
    document.getElementById('lfc-inf-disclaimer').style.display = 'none';
    var tw = document.querySelector('.table-content-watermark_wrapper');
    if (tw) tw.style.display = 'none';
  }

  function render(r) {
    var root = document.getElementById('lfc-inf');
    if (!root) return;
    root.classList.remove('is-hidden');
    mostrarCartoesResultado();
    document.getElementById('lfc-inf-error').style.display = 'none';
    document.getElementById('lfc-inf-results').style.display = 'block';
    document.getElementById('lfc-inf-resumo-wrap').style.display = 'block';
    document.getElementById('lfc-inf-disclaimer').style.display = 'block';

    setText('lfc-inf-lbl-equivalente', fill(T('lbl_equiv', '{v} from {y0} is worth this in {y1}:'), { v: fmtCurrencyInt(r.valor), y0: r.anoInicial, y1: r.anoFinal }));
    setText('lfc-inf-equivalente', fmtCurrency(r.poderCompra));
    ajustarLinhaDestaque();

    setText('lfc-inf-lbl-poder', fill(T('lbl_needed', 'Amount needed in {y1} for the same purchasing power'), { y1: r.anoFinal }));
    setText('lfc-inf-poder', fmtCurrency(r.valorEquivalente));

    setText('lfc-inf-acumulada', fmtPct(r.acumulada));
    setText('lfc-inf-media', fmtPct(r.mediaAnual));
    montarTooltipTaxaMedia();
    setText('lfc-inf-perda', fmtPct(r.perda));

    var resumo = document.getElementById('lfc-inf-resumo');
    if (resumo) {
      var prefixo = r.emGulden
        ? fill(T('sum_gulden', '\u0192 {fl} from {y0} equals {eur} at the fixed rate of 2.20371 guilders per euro. That is what the figures below use. '),
            { fl: fmtPlain(r.introduzido), y0: r.anoInicial, eur: fmtCurrency(r.valor) })
        : '';
      var nota = r.temProvisorio ? T('sum_prov', ' The current year is provisional, based on the months published so far.') : '';
      resumo.innerHTML = prefixo + fill(T('summary',
        'With official {region} inflation, <strong>{v} from {y0}</strong> is worth only <strong>{pc}</strong> in purchasing power by <strong>{y1}</strong>. Money left idle shrank <strong>{loss}</strong> in {n} years, with cumulative inflation of <strong>{cum}</strong>, an average of {avg} a year. To buy in {y1} what {v} bought in {y0}, you would need <strong>{need}</strong>.'),
        {
          region: REGIAO, v: fmtCurrencyInt(r.valor), y0: r.anoInicial, y1: r.anoFinal,
          pc: fmtCurrency(r.poderCompra), loss: fmtPct(r.perda), n: (LANG === 'pl') ? plLata(r.n) : r.n,
          cum: fmtPct(r.acumulada), avg: fmtPct(r.mediaAnual), need: fmtCurrency(r.valorEquivalente)
        }) + nota;
    }
  }

  /* ============ Share URL ============ */
  function buildShareUrl() {
    var p = new URLSearchParams();
    var campo = document.getElementById('lfc-inf-valor');
    p.set('amount', campo ? campo.value : '');
    p.set('start-year', String(Math.round(parseInput('ano-inicial'))));
    p.set('end-year', String(Math.round(parseInput('ano-final'))));
    if (moeda === 'NLG') p.set('currency', 'NLG');
    return window.location.origin + window.location.pathname + '?' + p.toString();
  }

  function copiarLink(url) {
    function feedback() {
      var shareIcons = document.querySelectorAll('[share-icon]');
      var copiedIcons = document.querySelectorAll('[copied-icon]');
      var copiedTexts = document.querySelectorAll('[copied-text]');
      var i;
      for (i = 0; i < shareIcons.length; i++) shareIcons[i].style.display = 'none';
      for (i = 0; i < copiedIcons.length; i++) copiedIcons[i].style.display = 'flex';
      for (i = 0; i < copiedTexts.length; i++) { copiedTexts[i].setAttribute('data-original', copiedTexts[i].textContent); copiedTexts[i].textContent = T('copied', 'Link copied'); }
      setTimeout(function () {
        for (i = 0; i < shareIcons.length; i++) shareIcons[i].style.display = '';
        for (i = 0; i < copiedIcons.length; i++) copiedIcons[i].style.display = 'none';
        for (i = 0; i < copiedTexts.length; i++) copiedTexts[i].textContent = copiedTexts[i].getAttribute('data-original') || T('share', 'Share results');
      }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(feedback).catch(function () { copiarFallback(url); feedback(); });
    } else { copiarFallback(url); feedback(); }
  }
  function copiarFallback(url) {
    var ta = document.createElement('textarea');
    ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function applyUrlParams() {
    var p = new URLSearchParams(window.location.search);
    if (!p.has('amount')) return;
    var v = document.getElementById('lfc-inf-valor');
    if (v) v.value = p.get('amount');
    if (p.has('start-year')) setAno('ano-inicial', parseInt(p.get('start-year'), 10));
    if (p.has('end-year')) {
      setAno('ano-final', parseInt(p.get('end-year'), 10));
      var sf = document.getElementById('lfc-inf-ano-final');
      if (sf) sf.setAttribute('data-user-edited', '1');
    }
    if (p.get('currency') === 'NLG') selecionarMoeda('NLG');
    setTimeout(function () {
      var btn = document.getElementById('calcular');
      if (btn) btn.click();
    }, 300);
  }

  /* ============ Events ============ */
  document.addEventListener('click', function (e) {
    var opt = e.target.closest ? e.target.closest('a.dropdown-calculadora[data-ano], #lfc-inf-dd-inicial a, #lfc-inf-dd-final a') : null;
    if (opt) {
      e.preventDefault();
      var ano = parseInt(opt.getAttribute('data-ano') || opt.textContent.trim(), 10);
      var nav = opt.closest('nav');
      if (nav && nav.id === 'lfc-inf-dd-inicial') setAno('ano-inicial', ano);
      if (nav && nav.id === 'lfc-inf-dd-final') {
        setAno('ano-final', ano);
        var sf = document.getElementById('lfc-inf-ano-final');
        if (sf) sf.setAttribute('data-user-edited', '1');
      }
      fecharDropdown(opt);
      return;
    }
    var btn = e.target.closest ? e.target.closest('#calcular') : null;
    if (btn) {
      e.preventDefault();
      var r = calcular();
      if (r.error) { mostrarErro(r.error); return; }
      render(r);
      window.__lfcInfResults = r;
      document.dispatchEvent(new CustomEvent('lfc-inf:calculated', { detail: r }));
    }
  });

  function fecharDropdown(el) {
    var dd = el.closest('.w-dropdown');
    if (!dd) return;
    var toggle = dd.querySelector('.w-dropdown-toggle');
    var list = dd.querySelector('.w-dropdown-list');
    if (toggle) { toggle.classList.remove('w--open'); toggle.setAttribute('aria-expanded', 'false'); }
    if (list) list.classList.remove('w--open');
    dd.classList.remove('w--open');
  }

  document.addEventListener('click', function (e) {
    var share = e.target.closest ? e.target.closest('[share-url]') : null;
    if (!share) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    copiarLink(buildShareUrl());
  }, true);

  /* Startup */
  popularDropdown('ano-inicial', ANO_BASE);
  popularDropdown('ano-final', null);
  carregarDadosRemotos();
  applyUrlParams();
})();
