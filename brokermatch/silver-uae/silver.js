/* =====================================================================
   BrokerMatch - "Silver rate today in the UAE" tool (external bundle)
   Injects CSS + HTML into #bmc-silver and fetches silver-data.json.
   Same mechanism as the gold page (pedrofintech/lf-site-assets/gold-uae).
   Data: brokermatch/silver-uae/silver-data.json, refreshed by .github/workflows/silver-uae.yml
   Page: https://www.brokermatch.ae/silver-rate-today-uae
   ===================================================================== */
(function(){
  "use strict";
  if (window.__bmcSilverLoaded) { return; }
  window.__bmcSilverLoaded = 1;

  var DATA_URL = "https://raw.githubusercontent.com/franklinsilvapt-arch/eupf-site-assets/main/brokermatch/silver-uae/silver-data.json";
  var SPOT_URL = "https://api.gold-api.com/price/XAG";
  var PEG = 3.6725, OZ = 31.1034768, TOLA = 11.6638;
  var PURS = ["999","925","900"];
  var PURITY = { "999":0.999, "925":0.925, "900":0.900 };
  var AR = /^ar/i.test(document.documentElement.getAttribute('lang')||'') || /^\/ar(\/|$)/.test(location.pathname);
  var PLABEL = AR ? { "999":"فضة 999", "925":"فضة 925", "900":"فضة 900" } : { "999":"999 silver", "925":"925 silver", "900":"900 silver" };
  var PNOTE  = AR ? { "999":"فضة خالصة (سبائك)", "925":"فضة استرليني (مجوهرات)", "900":"فضة العملات" } : { "999":"Fine silver (bars)", "925":"Sterling (jewellery)", "900":"Coin silver" };
  function L(en, ar){ return AR ? ar : en; }

  var CSS = `/* ===================== BMC-SILVER - styles ===================== */
#bmc-silver{ font-family:inherit; color:#202432; -webkit-font-smoothing:antialiased; }
#bmc-silver *{ box-sizing:border-box; }
#bmc-silver a{ text-decoration:none; }

.bmc-silver-cardtitle{ font-size:18px; font-weight:500; letter-spacing:-0.2px; line-height:28px; color:#202432; }
.bmc-silver-topdivider{ width:100%; height:1px; background:#E9ECF1; margin:14px 0 24px; }

.bmc-silver-hero-label{ font-weight:700; font-size:13px; letter-spacing:0.05em; text-transform:uppercase; color:#4F5969; }
.bmc-silver-hero-row{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-top:10px; }
.bmc-silver-hero-val{ font-weight:700; font-size:56px; line-height:1; letter-spacing:-0.02em; color:#202432; font-variant-numeric:tabular-nums; }
.bmc-silver-hero-usd{ margin-top:8px; font-weight:600; font-size:24px; line-height:1.2; color:#4F5969; font-variant-numeric:tabular-nums; }
.bmc-silver-hero-usd strong{ color:#202432; font-weight:700; }
.bmc-silver-refline{ margin:14px 0 0; font-size:14px; line-height:1.55; color:#4F5969; font-weight:500; max-width:820px; }
.bmc-silver-refline strong{ color:#202432; }
.bmc-silver-chip{ display:inline-flex; align-items:center; gap:4px; font-size:13px; font-weight:600; padding:5px 11px; border-radius:999px; font-variant-numeric:tabular-nums; white-space:nowrap; }
.bmc-silver-chip.is-up{ color:#067647; background:#ECFDF3; }
.bmc-silver-chip.is-down{ color:#B42318; background:#FEF3F2; }
.bmc-silver-chip.is-flat{ color:#4F5969; background:#F2F4F7; }

.bmc-silver-note{ font-size:13px; line-height:1.55; color:#98A2B3; margin:16px 0 0; max-width:820px; }
.bmc-silver-note a, .bmc-silver-link{ color:var(--colors--accent-blue,#2E90FA); text-decoration:underline !important; }

.bmc-silver-block{ margin-top:48px; }
.bmc-silver-block-head{ display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:14px; margin-bottom:18px; }
.bmc-silver-eyebrow{ font-weight:700; font-size:13px; letter-spacing:0.06em; text-transform:uppercase; color:#0E7A46; }
.bmc-silver-h2{ font-family:inherit; font-weight:700; font-size:30px; line-height:1.15; letter-spacing:-0.02em; color:#202432; margin:6px 0 0; }
.bmc-silver-sub{ font-size:15px; line-height:1.6; color:#4F5969; margin:8px 0 0; max-width:620px; }

.bmc-silver-switches{ display:flex; gap:8px; flex-wrap:wrap; }
.bmc-silver-ranges{ display:flex; gap:4px; background:#F2F4F7; border:1px solid #EAECF0; border-radius:12px; padding:4px; }
.bmc-silver-ranges button{ border:0; background:transparent; font-family:inherit; font-size:13px; font-weight:600; color:#4F5969; padding:7px 14px; border-radius:9px; cursor:pointer; letter-spacing:-0.1px; }
.bmc-silver-ranges button.is-active{ background:#fff; color:#202432; box-shadow:0 1px 2px rgba(18,23,33,0.10); }

.bmc-silver-table-wrap{ border:1px solid #E9ECF1; border-radius:12px; overflow:hidden; overflow-x:auto; }
.bmc-silver-table{ width:100%; border-collapse:collapse; font-size:14px; }
.bmc-silver-table thead tr{ background:#FCFCFD; border-bottom:1px solid #EAECF0; }
.bmc-silver-table th{ text-align:right; padding:13px 16px; font-weight:600; font-size:12px; letter-spacing:0.04em; text-transform:uppercase; color:#4F5969; white-space:nowrap; }
.bmc-silver-table th.is-left{ text-align:left; padding-left:24px; }
.bmc-silver-table th.is-last{ padding-right:24px; }
.bmc-silver-table td{ padding:12px 16px; text-align:right; font-variant-numeric:tabular-nums; color:#394455; border-bottom:1px solid #F2F4F7; white-space:nowrap; }
.bmc-silver-table td.is-left{ text-align:left; padding-left:24px; }
.bmc-silver-table td.is-last{ padding-right:24px; }
.bmc-silver-table th small{ display:block; font-size:11px; letter-spacing:0; text-transform:none; color:#98A2B3; font-weight:500; margin-top:2px; }
.bmc-silver-short{ display:none; }
.bmc-silver-table td small{ display:block; font-size:12px; color:#98A2B3; font-weight:500; }
.bmc-silver-table tr.is-hl td{ background:#F2FBF6; font-weight:700; color:#202432; }
.bmc-silver-table tr:last-child td{ border-bottom:0; }
.bmc-silver-up{ color:#067647; } .bmc-silver-down{ color:#B42318; }

.bmc-silver-stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
.bmc-silver-stat{ background:#fff; border:1px solid #E9ECF1; border-radius:12px; padding:16px; box-shadow:0 1px 3px rgba(18,23,33,0.06); }
.bmc-silver-stat-l{ display:block; font-size:12px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:#4F5969; }
.bmc-silver-stat-v{ display:block; margin-top:8px; font-size:22px; font-weight:700; letter-spacing:-0.02em; color:#202432; font-variant-numeric:tabular-nums; }

.bmc-silver-chartcard{ background:#fff; border:1px solid #E9ECF1; border-radius:12px; padding:22px 22px 14px; box-shadow:0 1px 3px rgba(18,23,33,0.06); }
.bmc-silver-chart-top{ display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; margin-bottom:10px; font-size:13px; font-weight:600; color:#4F5969; }
.bmc-silver-canvas-wrap{ position:relative; height:320px; }

.bmc-silver-sim-grid{ display:grid; grid-template-columns:1.1fr 0.9fr; gap:20px; align-items:stretch; }
.bmc-silver-sim-inputs{ background:#fff; border:1px solid #E9ECF1; border-radius:16px; padding:26px 24px; box-shadow:0 1px 3px rgba(18,23,33,0.06); display:flex; flex-direction:column; gap:18px; }
.bmc-silver-sim-field > label, .bmc-silver-sim-field > span{ display:block; font-size:13px; font-weight:600; color:#4F5969; margin-bottom:8px; }
.bmc-silver-sim-field input{ width:100%; background:#fff; border:1px solid #D0D5DD; border-radius:12px; padding:13px 15px; color:#202432; font-size:16px; font-weight:600; outline:none; font-variant-numeric:tabular-nums; font-family:inherit; }
.bmc-silver-sim-field input:focus{ border-color:var(--colors--accent-blue,#2E90FA); }
.bmc-silver-pills{ display:flex; gap:8px; flex-wrap:wrap; }
.bmc-silver-pills button{ flex:1; min-width:56px; background:#F2F4F7; border:1px solid #EAECF0; color:#4F5969; font-family:inherit; font-size:14px; font-weight:600; padding:12px 8px; border-radius:12px; cursor:pointer; }
.bmc-silver-pills button.is-active{ background:rgba(14,122,70,.06); border-color:#0E7A46; color:#0E7A46; }
.bmc-silver-sim-result{ background:#121721; border-radius:16px; padding:26px 24px; display:flex; flex-direction:column; gap:16px; color:#fff; }
.bmc-silver-sim-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:14px; }
.bmc-silver-sim-row span:first-child{ color:rgba(255,255,255,0.6); }
.bmc-silver-sim-row span:last-child{ font-weight:600; color:#fff; font-variant-numeric:tabular-nums; text-align:right; }
.bmc-silver-sim-main{ border-top:1px solid #2B3140; padding-top:16px; }
.bmc-silver-sim-main-label{ display:block; font-size:13px; color:rgba(255,255,255,0.6); margin-bottom:4px; }
.bmc-silver-sim-main-val{ font-family:inherit; font-weight:700; font-size:40px; line-height:1; color:#fff; font-variant-numeric:tabular-nums; letter-spacing:-0.02em; }
.bmc-silver-sim-tip{ background:rgba(247,144,9,0.14); border:1px solid rgba(254,200,75,0.25); border-radius:12px; padding:12px 14px; font-size:13px; line-height:1.45; color:#FEC84B; }
.bmc-silver-sim-tip strong{ color:#fff; }
.bmc-silver-foot{ font-size:12px; line-height:1.55; color:#98A2B3; margin:22px 0 0; }
.bmc-silver-morebtn{ display:inline-flex; align-items:center; gap:8px; margin-top:14px; font-size:14px; font-weight:600; color:#4F5969; border:1px solid #D0D5DD; border-radius:10px; padding:9px 16px; cursor:pointer; background:#fff; font-family:inherit; }
.bmc-silver-table tr[data-extra]{ display:none; }
.bmc-silver-table tr[data-extra].is-shown{ display:table-row; }

/* FAQ under the tool (native Webflow elements, styled here like the EIBOR page) */
#bmc-silver[dir="rtl"] .bmc-silver-table th, #bmc-silver[dir="rtl"] .bmc-silver-table td{ text-align:left; }
#bmc-silver[dir="rtl"] .bmc-silver-table td{ direction:ltr; }
#bmc-silver[dir="rtl"] .bmc-silver-table td.is-left{ direction:rtl; }
#bmc-silver[dir="rtl"] .bmc-silver-table th.is-left, #bmc-silver[dir="rtl"] .bmc-silver-table td.is-left{ text-align:right; padding-left:16px; padding-right:24px; }
#bmc-silver[dir="rtl"] .bmc-silver-table th.is-last, #bmc-silver[dir="rtl"] .bmc-silver-table td.is-last{ padding-right:16px; padding-left:24px; }
#bmc-silver[dir="rtl"] .bmc-silver-sim-row span:last-child{ text-align:left; }
#bmc-silver[dir="rtl"] .bmc-silver-hero-label, #bmc-silver[dir="rtl"] .bmc-silver-eyebrow{ letter-spacing:0; }
#bmc-silver[dir="rtl"] .bmc-silver-table th{ letter-spacing:0; }
#bm-silver-faq > div{ margin-bottom:2.25rem; }
#bm-silver-faq > div:last-child{ margin-bottom:0; }
#bm-silver-faq h3{ font-size:1.25rem; font-weight:400; line-height:1.4; margin:0 0 .6rem; color:inherit; }
#bm-silver-faq p{ margin:0; color:#6b7280; line-height:1.65; font-size:1rem; }

@media (max-width:991px){
  .bmc-silver-stats{ grid-template-columns:repeat(2,1fr); }
}
@media (max-width:767px){
  .bmc-silver-hero-val{ font-size:44px; }
  .bmc-silver-hero-usd{ font-size:20px; }
  .bmc-silver-h2{ font-size:25px; }
  .bmc-silver-sim-grid{ grid-template-columns:1fr; gap:22px; }
  .bmc-silver-sim-main-val{ font-size:34px; }
  .bmc-silver-canvas-wrap{ height:260px; }
  .bmc-silver-table th, .bmc-silver-table td{ padding:11px 10px; }
  .bmc-silver-table th.is-left, .bmc-silver-table td.is-left{ padding-left:14px; }
  .bmc-silver-table th.is-last, .bmc-silver-table td.is-last{ padding-right:14px; }
  .bmc-silver-stat-v{ font-size:17px; }
  .bmc-silver-stat-l{ font-size:11px; }
}
@media (max-width:479px){
  .bmc-silver-hero-val{ font-size:38px; }
  .bmc-silver-hero-usd{ font-size:18px; }
  .bmc-silver-long{ display:none; } .bmc-silver-short{ display:inline; }
  .bmc-silver-table{ font-size:13px; }
  .bmc-silver-table th, .bmc-silver-table td{ padding:10px 7px; }
  .bmc-silver-table th.is-left, .bmc-silver-table td.is-left{ padding-left:12px; }
  .bmc-silver-table th.is-last, .bmc-silver-table td.is-last{ padding-right:12px; }
  .bmc-silver-table td small{ font-size:11px; }
  .bmc-silver-table td.is-left{ white-space:normal; min-width:64px; }
  .bmc-silver-stat{ padding:13px; }
}`;

  var HTML = `<div class="bmc-silver-cardtitle">Silver rate today in the UAE (updated several times a day)</div>
  <div class="bmc-silver-topdivider"></div>

  <span class="bmc-silver-hero-label">999 silver rate in the UAE today, per gram</span>
  <div class="bmc-silver-hero-row">
    <span class="bmc-silver-hero-val" id="bmc-silver-hero-val">-</span>
    <span id="bmc-silver-hero-chip"></span>
  </div>
  <div class="bmc-silver-hero-usd" id="bmc-silver-hero-usd"></div>
  <p class="bmc-silver-refline" id="bmc-silver-refline">Spot price of fine silver on the international market.</p>

  <div class="bmc-silver-block">
    <div class="bmc-silver-block-head">
      <div>
        <span class="bmc-silver-eyebrow">By purity</span>
        <h2 class="bmc-silver-h2">Silver rate in the UAE today: 999, 925 and 900</h2>
      </div>
      <div class="bmc-silver-switches">
        <div class="bmc-silver-ranges" id="bmc-silver-cur"><button data-v="AED" class="is-active">AED</button><button data-v="USD">USD</button></div>
        <div class="bmc-silver-ranges" id="bmc-silver-unit"><button data-v="g" class="is-active">Gram</button><button data-v="tola">Tola</button><button data-v="kg">Kg</button></div>
      </div>
    </div>
    <div class="bmc-silver-table-wrap">
      <table class="bmc-silver-table">
        <thead><tr><th class="is-left">Purity</th><th id="bmc-silver-th-today">Today</th><th id="bmc-silver-th-prev">Previous day</th><th class="is-last">Change</th></tr></thead>
        <tbody id="bmc-silver-pur-tbody"></tbody>
      </table>
    </div>
    <p class="bmc-silver-note">Value of the pure silver in each grade at the spot price. Bars, coins and jewellery sold in shops cost more: dealers add a premium and jewellers add making charges, plus 5% VAT on anything below 99% purity. One tola is 11.66 grams. US dollar values use the official peg of AED 3.6725.</p>
  </div>

  <div class="bmc-silver-block">
    <div class="bmc-silver-block-head">
      <div>
        <span class="bmc-silver-eyebrow">International market</span>
        <h2 class="bmc-silver-h2">Spot silver price in AED and USD</h2>
      </div>
    </div>
    <div class="bmc-silver-stats">
      <div class="bmc-silver-stat"><span class="bmc-silver-stat-l">Per ounce (USD)</span><span class="bmc-silver-stat-v" id="bmc-silver-s-oz">-</span></div>
      <div class="bmc-silver-stat"><span class="bmc-silver-stat-l">Per ounce (AED)</span><span class="bmc-silver-stat-v" id="bmc-silver-s-ozaed">-</span></div>
      <div class="bmc-silver-stat"><span class="bmc-silver-stat-l">Per kg (AED)</span><span class="bmc-silver-stat-v" id="bmc-silver-s-kg">-</span></div>
      <div class="bmc-silver-stat"><span class="bmc-silver-stat-l">Per tola (AED)</span><span class="bmc-silver-stat-v" id="bmc-silver-s-tola">-</span></div>
    </div>
    <p class="bmc-silver-note" id="bmc-silver-spot-note">Spot price of fine silver, converted at the AED peg.</p>
  </div>

  <div class="bmc-silver-block">
    <div class="bmc-silver-block-head">
      <div>
        <span class="bmc-silver-eyebrow">Chart</span>
        <h2 class="bmc-silver-h2">999 silver price per gram in AED</h2>
      </div>
      <div class="bmc-silver-ranges" id="bmc-silver-ranges">
        <button data-range="21">1M</button>
        <button data-range="63">3M</button>
        <button data-range="365" class="is-active">1Y</button>
      </div>
    </div>
    <div class="bmc-silver-chartcard">
      <div class="bmc-silver-chart-top" id="bmc-silver-chart-top"></div>
      <div class="bmc-silver-canvas-wrap"><canvas id="bmc-silver-canvas"></canvas></div>
    </div>
    <p class="bmc-silver-note">Daily closing price of COMEX silver futures, per gram of fine silver, converted to dirhams at the peg. It can differ slightly from the live spot price above.</p>
  </div>

  <div class="bmc-silver-block">
    <span class="bmc-silver-eyebrow">Calculator</span>
    <h2 class="bmc-silver-h2">How much is your silver worth?</h2>
    <p class="bmc-silver-sub">Pick the purity, enter the weight and see the value of the silver it contains at today's spot price.</p>
    <div class="bmc-silver-sim-grid" style="margin-top:24px">
      <div class="bmc-silver-sim-inputs">
        <div class="bmc-silver-sim-field">
          <span>Purity</span>
          <div class="bmc-silver-pills" id="bmc-silver-p"><button data-p="999" class="is-active">999</button><button data-p="925">925</button><button data-p="900">900</button></div>
        </div>
        <div class="bmc-silver-sim-field">
          <label for="bmc-silver-w">Weight</label>
          <input id="bmc-silver-w" type="text" inputmode="decimal" value="1">
        </div>
        <div class="bmc-silver-sim-field">
          <span>Unit</span>
          <div class="bmc-silver-pills" id="bmc-silver-u"><button data-u="g">Grams</button><button data-u="tola">Tola</button><button data-u="oz">Ounces</button><button data-u="kg" class="is-active">Kg</button></div>
        </div>
      </div>
      <div class="bmc-silver-sim-result">
        <div class="bmc-silver-sim-row"><span>Weight in grams</span><span id="bmc-silver-r-grams">-</span></div>
        <div class="bmc-silver-sim-row"><span>Equivalent in 999 silver</span><span id="bmc-silver-r-pure">-</span></div>
        <div class="bmc-silver-sim-main">
          <span class="bmc-silver-sim-main-label">Value at today's spot price</span>
          <span class="bmc-silver-sim-main-val" id="bmc-silver-r-aed">-</span>
        </div>
        <div class="bmc-silver-sim-row"><span>In US dollars</span><span id="bmc-silver-r-usd">-</span></div>
        <div class="bmc-silver-sim-tip">Selling silver? Dealers usually pay <strong>below spot</strong> and sell above it. Get two or three quotes.</div>
      </div>
    </div>
    <p class="bmc-silver-foot">Indicative values of the silver content only, before dealer premiums, making charges and VAT. This tool is for information only and is not financial advice.</p>
  </div>

  <div class="bmc-silver-block" id="bmc-silver-hist-block">
    <div class="bmc-silver-block-head">
      <div>
        <span class="bmc-silver-eyebrow">History</span>
        <h2 class="bmc-silver-h2">Silver rates in the last days</h2>
      </div>
    </div>
    <div class="bmc-silver-table-wrap">
      <table class="bmc-silver-table">
        <thead><tr><th class="is-left">Date</th><th>999<small>AED/g</small></th><th>925<small>AED/g</small></th><th class="is-last">999<small>AED/kg</small></th></tr></thead>
        <tbody id="bmc-silver-hist-tbody"></tbody>
      </table>
    </div>
    <button type="button" id="bmc-silver-more" class="bmc-silver-morebtn">Show more days</button>
    <p class="bmc-silver-note">Daily closing price of COMEX silver futures converted to AED. Markets are closed at weekends.</p>
  </div>`;

  var HTML_AR = `<div class="bmc-silver-cardtitle">سعر الفضة اليوم في الإمارات (يُحدَّث عدة مرات يوميًا)</div>
  <div class="bmc-silver-topdivider"></div>

  <span class="bmc-silver-hero-label">سعر غرام الفضة عيار 999 في الإمارات اليوم</span>
  <div class="bmc-silver-hero-row">
    <span class="bmc-silver-hero-val" id="bmc-silver-hero-val">-</span>
    <span id="bmc-silver-hero-chip"></span>
  </div>
  <div class="bmc-silver-hero-usd" id="bmc-silver-hero-usd"></div>
  <p class="bmc-silver-refline" id="bmc-silver-refline">السعر الفوري للفضة الخالصة في السوق العالمية.</p>

  <div class="bmc-silver-block">
    <div class="bmc-silver-block-head">
      <div>
        <span class="bmc-silver-eyebrow">حسب العيار</span>
        <h2 class="bmc-silver-h2">سعر الفضة في الإمارات اليوم: عيار 999 و925 و900</h2>
      </div>
      <div class="bmc-silver-switches">
        <div class="bmc-silver-ranges" id="bmc-silver-cur"><button data-v="AED" class="is-active">درهم</button><button data-v="USD">دولار</button></div>
        <div class="bmc-silver-ranges" id="bmc-silver-unit"><button data-v="g" class="is-active">غرام</button><button data-v="tola">تولة</button><button data-v="kg">كيلو</button></div>
      </div>
    </div>
    <div class="bmc-silver-table-wrap">
      <table class="bmc-silver-table">
        <thead><tr><th class="is-left">العيار</th><th id="bmc-silver-th-today">اليوم</th><th id="bmc-silver-th-prev">اليوم السابق</th><th class="is-last">التغيّر</th></tr></thead>
        <tbody id="bmc-silver-pur-tbody"></tbody>
      </table>
    </div>
    <p class="bmc-silver-note">قيمة الفضة الخالصة في كل عيار بالسعر الفوري. وتكلّف السبائك والعملات والمجوهرات المبيعة في المحلات أكثر من ذلك: إذ يضيف التجار علاوة ويضيف الصاغة رسوم المصنعية، إضافة إلى ضريبة القيمة المضافة بنسبة 5% على كل ما تقل نقاوته عن 99%. والتولة تساوي 11.66 غرامًا. وتُحتسب القيم بالدولار وفق سعر الربط الرسمي البالغ 3.6725 درهم.</p>
  </div>

  <div class="bmc-silver-block">
    <div class="bmc-silver-block-head">
      <div>
        <span class="bmc-silver-eyebrow">السوق العالمية</span>
        <h2 class="bmc-silver-h2">السعر الفوري للفضة بالدرهم والدولار</h2>
      </div>
    </div>
    <div class="bmc-silver-stats">
      <div class="bmc-silver-stat"><span class="bmc-silver-stat-l">للأونصة (دولار)</span><span class="bmc-silver-stat-v" id="bmc-silver-s-oz">-</span></div>
      <div class="bmc-silver-stat"><span class="bmc-silver-stat-l">للأونصة (درهم)</span><span class="bmc-silver-stat-v" id="bmc-silver-s-ozaed">-</span></div>
      <div class="bmc-silver-stat"><span class="bmc-silver-stat-l">للكيلو (درهم)</span><span class="bmc-silver-stat-v" id="bmc-silver-s-kg">-</span></div>
      <div class="bmc-silver-stat"><span class="bmc-silver-stat-l">للتولة (درهم)</span><span class="bmc-silver-stat-v" id="bmc-silver-s-tola">-</span></div>
    </div>
    <p class="bmc-silver-note" id="bmc-silver-spot-note">السعر الفوري للفضة الخالصة، محوّلًا بسعر ربط الدرهم.</p>
  </div>

  <div class="bmc-silver-block">
    <div class="bmc-silver-block-head">
      <div>
        <span class="bmc-silver-eyebrow">الرسم البياني</span>
        <h2 class="bmc-silver-h2">سعر غرام الفضة عيار 999 بالدرهم</h2>
      </div>
      <div class="bmc-silver-ranges" id="bmc-silver-ranges">
        <button data-range="21">شهر</button>
        <button data-range="63">3 أشهر</button>
        <button data-range="365" class="is-active">سنة</button>
      </div>
    </div>
    <div class="bmc-silver-chartcard">
      <div class="bmc-silver-chart-top" id="bmc-silver-chart-top"></div>
      <div class="bmc-silver-canvas-wrap"><canvas id="bmc-silver-canvas"></canvas></div>
    </div>
    <p class="bmc-silver-note">سعر الإغلاق اليومي للعقود الآجلة للفضة في بورصة COMEX، لغرام الفضة الخالصة، محوّلًا إلى الدرهم بسعر الربط. وقد يختلف قليلًا عن السعر الفوري أعلاه.</p>
  </div>

  <div class="bmc-silver-block">
    <span class="bmc-silver-eyebrow">الحاسبة</span>
    <h2 class="bmc-silver-h2">كم تساوي فضتك؟</h2>
    <p class="bmc-silver-sub">اختر العيار وأدخل الوزن لترى قيمة الفضة التي تحتويها بالسعر الفوري اليوم.</p>
    <div class="bmc-silver-sim-grid" style="margin-top:24px">
      <div class="bmc-silver-sim-inputs">
        <div class="bmc-silver-sim-field">
          <span>العيار</span>
          <div class="bmc-silver-pills" id="bmc-silver-p"><button data-p="999" class="is-active">999</button><button data-p="925">925</button><button data-p="900">900</button></div>
        </div>
        <div class="bmc-silver-sim-field">
          <label for="bmc-silver-w">الوزن</label>
          <input id="bmc-silver-w" type="text" inputmode="decimal" value="1">
        </div>
        <div class="bmc-silver-sim-field">
          <span>الوحدة</span>
          <div class="bmc-silver-pills" id="bmc-silver-u"><button data-u="g">غرام</button><button data-u="tola">تولة</button><button data-u="oz">أونصة</button><button data-u="kg" class="is-active">كيلو</button></div>
        </div>
      </div>
      <div class="bmc-silver-sim-result">
        <div class="bmc-silver-sim-row"><span>الوزن بالغرام</span><span id="bmc-silver-r-grams">-</span></div>
        <div class="bmc-silver-sim-row"><span>ما يعادله من الفضة عيار 999</span><span id="bmc-silver-r-pure">-</span></div>
        <div class="bmc-silver-sim-main">
          <span class="bmc-silver-sim-main-label">القيمة بالسعر الفوري اليوم</span>
          <span class="bmc-silver-sim-main-val" id="bmc-silver-r-aed">-</span>
        </div>
        <div class="bmc-silver-sim-row"><span>بالدولار الأمريكي</span><span id="bmc-silver-r-usd">-</span></div>
        <div class="bmc-silver-sim-tip">هل تبيع فضة؟ يدفع التجار عادةً <strong>أقل من السعر الفوري</strong> ويبيعون بأعلى منه. اطلب عرضين أو ثلاثة.</div>
      </div>
    </div>
    <p class="bmc-silver-foot">قيم استرشادية لمحتوى الفضة فقط، قبل علاوة التاجر ورسوم المصنعية والضريبة. هذه الأداة للمعلومات فقط وليست نصيحة مالية.</p>
  </div>

  <div class="bmc-silver-block" id="bmc-silver-hist-block">
    <div class="bmc-silver-block-head">
      <div>
        <span class="bmc-silver-eyebrow">السجل</span>
        <h2 class="bmc-silver-h2">أسعار الفضة في الأيام الأخيرة</h2>
      </div>
    </div>
    <div class="bmc-silver-table-wrap">
      <table class="bmc-silver-table">
        <thead><tr><th class="is-left">التاريخ</th><th>999<small>درهم/غ</small></th><th>925<small>درهم/غ</small></th><th class="is-last">999<small>درهم/كغ</small></th></tr></thead>
        <tbody id="bmc-silver-hist-tbody"></tbody>
      </table>
    </div>
    <button type="button" id="bmc-silver-more" class="bmc-silver-morebtn">عرض أيام أكثر</button>
    <p class="bmc-silver-note">سعر الإغلاق اليومي للعقود الآجلة للفضة في بورصة COMEX محوّلًا إلى الدرهم. والأسواق مغلقة في عطلة نهاية الأسبوع.</p>
  </div>`;

  /* ---------------- Helpers ---------------- */
  function isNum(v){ return typeof v==='number' && isFinite(v); }
  function group(n){ return n.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fmt(v, dec){
    if(!isNum(v)) return '-';
    dec = dec==null ? 2 : dec;
    var s = Math.abs(v).toFixed(dec).split('.');
    return (v<0?'-':'') + group(s[0]) + (s[1] ? '.'+s[1] : '');
  }
  function money(v, cur, dec){
    if(!isNum(v)) return '-';
    return AR ? fmt(v, dec)+' '+(cur==='USD'?'دولار':'درهم') : cur+' '+fmt(v, dec);
  }
  function parseNum(str){ return parseFloat(String(str==null?'':str).replace(/[,\s]/g,'')) || 0; }
  function dmy(iso){ var p=String(iso||'').split('-'); return p.length===3 ? p[2]+'/'+p[1]+'/'+p[0] : iso; }
  function uaeNow(d){ return new Date((d||new Date()).getTime()+4*3600e3); }

  function run(DATA){
    var spot = DATA.spot || {};
    var spotUsdOz = spot.usdOz, spotAt = spot.at;
    var HIST = (DATA.history||[]).filter(function(r){ return isNum(r.g); });
    var today = uaeNow().toISOString().slice(0,10);
    var prevRow = null;
    for(var i=HIST.length-1;i>=0;i--){ if(HIST[i].d<today){ prevRow=HIST[i]; break; } }
    if(!prevRow && DATA.prev && isNum(DATA.prev.aedG)) prevRow={ d:DATA.prev.date, g:DATA.prev.aedG };
    var cur='AED', unit='g';

    function gAed(){ return isNum(spotUsdOz) ? spotUsdOz*PEG/OZ : null; }
    function unitMult(u){ return u==='tola' ? TOLA : u==='kg' ? 1000 : 1; }
    function conv(aed){ return cur==='USD' ? aed/PEG : aed; }
    var set=function(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; };

    function renderHero(){
      var g=gAed();
      set('bmc-silver-hero-val', money(g,'AED'));
      var usdEl=document.getElementById('bmc-silver-hero-usd');
      if(usdEl) usdEl.innerHTML = isNum(g) ? '<strong>'+money(g/PEG,'USD')+'</strong> '+L('per gram','للغرام')+' &middot; <strong>'+money(g*1000,'AED',0)+'</strong> '+L('per kg','للكيلو') : '';
      var chipEl=document.getElementById('bmc-silver-hero-chip');
      if(chipEl){
        if(prevRow && isNum(g)){
          var d=g-prevRow.g, pct=d/prevRow.g*100;
          var cls=d>0.0005?'is-up':d<-0.0005?'is-down':'is-flat';
          var arrow=d>0.0005?'&#9650;':d<-0.0005?'&#9660;':'&#8226;';
          chipEl.innerHTML='<span class="bmc-silver-chip '+cls+'">'+arrow+' '+(AR
            ? fmt(Math.abs(d))+' درهم ('+fmt(Math.abs(pct))+'%) '+(d>0.0005?'ارتفاعًا':d<-0.0005?'انخفاضًا':'دون تغيير')+' مقارنة بإغلاق '+dmy(prevRow.d)
            : (d>0?'+':d<0?'-':'')+'AED '+fmt(Math.abs(d))+' ('+(pct>0?'+':pct<0?'-':'')+fmt(Math.abs(pct))+'%) vs '+dmy(prevRow.d)+' close')+'</span>';
        } else chipEl.innerHTML='';
      }
      var ref=document.getElementById('bmc-silver-refline');
      if(ref){
        var t='';
        if(spotAt){ var dd=new Date(spotAt); if(!isNaN(dd)){ var u=uaeNow(dd); t=('0'+u.getUTCHours()).slice(-2)+':'+('0'+u.getUTCMinutes()).slice(-2)+(AR?' بتوقيت الإمارات يوم ':' UAE time on ')+dmy(u.toISOString().slice(0,10)); } }
        ref.innerHTML = AR
          ? 'السعر الفوري للفضة الخالصة (999) في السوق العالمية، محوّلًا إلى الدرهم بسعر الربط الثابت البالغ 3.6725 درهم للدولار. آخر تحديث في الساعة <strong>'+(t||'-')+'</strong>. ولا يوجد في الإمارات سعر تجزئة رسمي للفضة، لذا يعتمد التجار على هذا السعر ويضيفون علاوتهم.'
            + (spot.stale ? ' <span class="bmc-silver-down">تعذّر تأكيد آخر تحديث.</span>' : '')
          : 'Spot price of fine silver (999) on the international market, converted to dirhams at the fixed peg of AED 3.6725 per USD. Updated at <strong>'+(t||'-')+'</strong>. There is no official retail silver rate in the UAE, so dealers price from this figure and add their premium.'
            + (spot.stale ? ' <span class="bmc-silver-down">The latest update could not be confirmed.</span>' : '');
      }
    }

    function renderPur(){
      var tb=document.getElementById('bmc-silver-pur-tbody'); if(!tb) return;
      var m=unitMult(unit), g=gAed(), pg=prevRow?prevRow.g:null, html='';
      var tag=AR ? (cur==='USD'?'دولار':'درهم')+(unit==='tola'?'/تولة':unit==='kg'?'/كغ':'/غ') : cur+(unit==='tola'?'/tola':unit==='kg'?'/kg':'/g');
      var dec=unit==='kg'?0:2;
      var th1=document.getElementById('bmc-silver-th-today'), th2=document.getElementById('bmc-silver-th-prev');
      if(th1) th1.innerHTML=L('Today','اليوم')+'<small>'+tag+'</small>';
      if(th2) th2.innerHTML=AR ? 'أمس<small>'+tag+'</small>' : '<span class="bmc-silver-long">Previous day</span><span class="bmc-silver-short">Prev. day</span><small>'+tag+'</small>';
      PURS.forEach(function(p){
        var f=PURITY[p]/0.999;
        var t=isNum(g)?conv(g*f)*m:null, q=isNum(pg)?conv(pg*f)*m:null;
        var d=(t!=null&&q!=null)?t-q:null;
        var dTxt=d==null?'-':'<span class="'+(d>0.00001?'bmc-silver-up':d<-0.00001?'bmc-silver-down':'')+'">'+(d>0?'+':d<0?'-':'')+fmt(Math.abs(d),dec)+'</span>';
        html+='<tr'+(p==='999'?' class="is-hl"':'')+'><td class="is-left">'+PLABEL[p]+'<small>'+PNOTE[p]+'</small></td><td>'+fmt(t,dec)+'</td><td>'+fmt(q,dec)+'</td><td class="is-last">'+dTxt+'</td></tr>';
      });
      tb.innerHTML=html;
    }

    function renderSpot(){
      var g=gAed();
      set('bmc-silver-s-oz', money(spotUsdOz,'USD'));
      set('bmc-silver-s-ozaed', money(isNum(spotUsdOz)?spotUsdOz*PEG:null,'AED'));
      set('bmc-silver-s-kg', money(isNum(g)?g*1000:null,'AED',0));
      set('bmc-silver-s-tola', money(isNum(g)?g*TOLA:null,'AED'));
      var n=document.getElementById('bmc-silver-spot-note');
      if(n){
        n.innerHTML=L('Spot price of fine silver on the international market, converted at the official peg of AED 3.6725 per US dollar. One troy ounce is 31.10 grams.',
          'السعر الفوري للفضة الخالصة في السوق العالمية، محوّلًا بسعر الربط الرسمي البالغ 3.6725 درهم للدولار الأمريكي. والأونصة تساوي 31.10 غرامًا.');
      }
      renderHero(); renderPur(); renderSim();
    }

    var chart=null, range=365;
    function loadChartJS(cb){
      if(window.Chart){ cb(); return; }
      var s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js'; s.onload=cb; document.head.appendChild(s);
    }
    function sliceRange(){
      if(!HIST.length) return [];
      var last=new Date(HIST[HIST.length-1].d), from=new Date(last.getTime()-(range===21?31:range===63?92:366)*864e5);
      return HIST.filter(function(r){ return new Date(r.d)>=from; });
    }
    function drawChart(){
      var rows=sliceRange(); if(rows.length<2) return;
      var first=rows[0].g, lastv=rows[rows.length-1].g, ch=(lastv/first-1)*100;
      var top=document.getElementById('bmc-silver-chart-top');
      var chTxt=(ch>=0?'+':'-')+fmt(Math.abs(ch),1)+'%';
      if(top) top.innerHTML=AR
        ? '<span>'+fmt(lastv)+' درهم للغرام في '+dmy(rows[rows.length-1].d)+'</span><span class="'+(ch>=0?'bmc-silver-up':'bmc-silver-down')+'"><span dir="ltr">'+chTxt+'</span> في هذه الفترة</span>'
        : '<span>AED '+fmt(lastv)+' per gram on '+dmy(rows[rows.length-1].d)+'</span><span class="'+(ch>=0?'bmc-silver-up':'bmc-silver-down')+'">'+chTxt+' in this period</span>';
      var accent=(getComputedStyle(document.documentElement).getPropertyValue('--colors--accent-blue')||'').trim()||'#2E90FA';
      var cfg={ type:'line',
        data:{ labels:rows.map(function(r){ var p=r.d.split('-'); return p[2]+'/'+p[1]+'/'+p[0].slice(2); }),
          datasets:[{ label:'999 silver per gram (AED)', data:rows.map(function(r){return r.g;}), borderColor:accent, backgroundColor:accent, borderWidth:2, pointRadius:0, pointHoverRadius:4, tension:0.2, fill:false }] },
        options:{ responsive:true, maintainAspectRatio:false, animation:false, interaction:{ mode:'index', intersect:false },
          plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#121721', borderRadius:8, padding:10, titleColor:'#fff', bodyColor:'#E9ECF1', displayColors:false,
            callbacks:{ label:function(c){ return AR ? fmt(c.parsed.y)+' درهم للغرام' : 'AED '+fmt(c.parsed.y)+' per gram'; } } } },
          scales:{ x:{ reverse:AR, grid:{display:false}, ticks:{ color:'#4F5969', font:{family:'Inter',size:11}, maxRotation:0, autoSkip:true, maxTicksLimit:7 } },
                   y:{ position:AR?'right':'left', grid:{color:'#E9ECF1'}, ticks:{ color:'#4F5969', font:{family:'Inter',size:11}, callback:function(v){ return fmt(v,2); } } } } } };
      if(chart){ chart.data=cfg.data; chart.options=cfg.options; chart.update(); }
      else { chart=new Chart(document.getElementById('bmc-silver-canvas').getContext('2d'), cfg); }
    }

    var simP='999', simU='kg';
    function renderSim(){
      var w=parseNum(document.getElementById('bmc-silver-w').value);
      var grams=w*(simU==='tola'?TOLA:simU==='oz'?OZ:simU==='kg'?1000:1);
      var pure=grams*PURITY[simP]/0.999, g=gAed();
      var val=isNum(g)?pure*g:null;
      set('bmc-silver-r-grams', fmt(grams, grams%1?2:0)+L(' g',' غ'));
      set('bmc-silver-r-pure', fmt(pure, pure%1?2:0)+L(' g',' غ'));
      set('bmc-silver-r-aed', money(val,'AED'));
      set('bmc-silver-r-usd', money(isNum(val)?val/PEG:null,'USD'));
    }

    function renderHist(){
      var rows=HIST.slice(-60).reverse();
      var block=document.getElementById('bmc-silver-hist-block');
      if(rows.length<2){ if(block) block.style.display='none'; return; }
      var tb=document.getElementById('bmc-silver-hist-tbody'), html='';
      rows.forEach(function(r,i){
        var f=0.925/0.999;
        html+='<tr'+(i===0?' class="is-hl"':'')+(i>=10?' data-extra="1"':'')+'><td class="is-left">'+dmy(r.d)+'</td><td>'+fmt(r.g)+'</td><td>'+fmt(r.g*f)+'</td><td class="is-last">'+fmt(r.g*1000,0)+'</td></tr>';
      });
      tb.innerHTML=html;
      var more=document.getElementById('bmc-silver-more');
      var extras=tb.querySelectorAll('tr[data-extra]');
      if(!extras.length){ more.style.display='none'; return; }
      more.addEventListener('click',function(){
        var open=!!tb.querySelector('tr[data-extra].is-shown');
        extras.forEach(function(t){ t.classList.toggle('is-shown', !open); });
        more.textContent=open?L('Show more days','عرض أيام أكثر'):L('Show fewer days','عرض أيام أقل');
      });
    }

    function pills(id, attr, cb){
      var box=document.getElementById(id); if(!box) return;
      box.addEventListener('click',function(e){
        var b=e.target.closest('button'); if(!b) return;
        box.querySelectorAll('button').forEach(function(x){ x.classList.remove('is-active'); });
        b.classList.add('is-active'); cb(b.getAttribute(attr));
      });
    }
    pills('bmc-silver-cur','data-v',function(v){ cur=v; renderPur(); });
    pills('bmc-silver-unit','data-v',function(v){ unit=v; renderPur(); });
    pills('bmc-silver-ranges','data-range',function(v){ range=+v; if(window.Chart) drawChart(); });
    pills('bmc-silver-p','data-p',function(v){ simP=v; renderSim(); });
    pills('bmc-silver-u','data-u',function(v){ simU=v; renderSim(); });
    var wEl=document.getElementById('bmc-silver-w'); if(wEl) wEl.addEventListener('input', renderSim);

    renderSpot(); renderHist();
    loadChartJS(drawChart);

    fetch(SPOT_URL,{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(j){
      var p=parseFloat(j && j.price);
      if(isFinite(p) && p>5 && p<500){ spotUsdOz=p; spotAt=j.updatedAt||new Date().toISOString(); renderSpot(); }
    }).catch(function(){});
  }

  var FAQ_AR = `<div><h3>كم سعر غرام الفضة في الإمارات اليوم؟</h3><p>يعرض الجدول في أعلى هذه الصفحة سعر غرام الفضة في الإمارات اليوم لعيارات 999 و925 و900، بالدرهم والدولار، إلى جانب سعر إغلاق اليوم السابق. وتتبع الأسعار السعر الفوري العالمي وتُحدَّث عدة مرات يوميًا.</p></div><div><h3>كم سعر كيلو الفضة اليوم؟</h3><p>اختر «كيلو» في جدول العيارات، أو استخدم الحاسبة بوزن كيلوغرام واحد. وتساوي سبيكة الكيلو من الفضة عيار 999 ألف ضعف سعر الغرام بالسعر الفوري. ويبيع التجار سبائك الكيلو بعلاوة فوق هذا الرقم ويشترونها بأقل منه.</p></div><div><h3>ما الفرق بين الفضة عيار 999 وعيار 925؟</h3><p>يدل الرقم على عدد الأجزاء من الفضة الخالصة في كل ألف جزء. فعيار 999 (الفضة الخالصة) نقاوته 99.9% ويُستخدم في السبائك والعملات الاستثمارية. أما عيار 925 (الفضة الإسترليني) فيحتوي على 92.5% فضة ممزوجة بالنحاس أو معادن أخرى لتصبح أصلب، وهو المعيار في المجوهرات وأدوات المائدة. وعيار 900 هو عيار كثير من العملات الفضية القديمة.</p></div><div><h3>هل تُفرض ضريبة القيمة المضافة على الفضة في الإمارات؟</h3><p>يتوقف ذلك على المنتج. فالفضة الاستثمارية بنقاوة 99% أو أكثر، وبشكل يُتداول في أسواق السبائك العالمية (السبائك والعملات الاستثمارية)، تخضع لنسبة الصفر، فلا تُدفع عليها ضريبة. أما المجوهرات الفضية والفضة الإسترليني وغيرها مما تقل نقاوته عن ذلك فتخضع للنسبة الأساسية البالغة 5%. وترد هذه القاعدة في المادة 36 من اللائحة التنفيذية لضريبة القيمة المضافة التي تنشرها <a href="https://tax.gov.ae/ar/taxes/vat.aspx" rel="noopener" class="blue-link">الهيئة الاتحادية للضرائب</a>. واستخدم <a href="/ar/vat-calculator-uae" class="blue-link">حاسبة ضريبة القيمة المضافة</a> لدينا لإضافة نسبة 5% أو إزالتها.</p></div><div><h3>لماذا تبيع المحلات الفضة بأعلى من السعر الفوري؟</h3><p>السعر الفوري هو سعر الجملة للفضة الخالصة في السوق العالمية. ويضيف المكررون والتجار والصاغة علاوة تغطي السك والشحن والتخزين وهامش الربح، كما يضيف الصاغة رسوم المصنعية. وتكون العلاوة على العملات والسبائك الصغيرة أعلى كنسبة مئوية منها على سبائك الكيلو.</p></div><div><h3>كم غرامًا في التولة وفي الأونصة؟</h3><p>التولة تساوي 11.6638 غرامًا، وهي وحدة تقليدية من جنوب آسيا لا تزال محلات كثيرة في الإمارات تستخدمها. والأونصة، وهي الوحدة المستخدمة في الأسواق العالمية، تساوي 31.1035 غرامًا. ويمكن لجدول العيارات أعلاه عرض الأسعار للغرام أو التولة أو الكيلو بنقرة واحدة.</p></div><div><h3>لماذا يتغير سعر الفضة كل يوم؟</h3><p>تُتداول الفضة حول العالم بالدولار الأمريكي للأونصة، ويتحرك سعرها مع الدولار وأسعار الفائدة وطلب المستثمرين، وكذلك مع الطلب الصناعي، إذ يذهب جزء كبير من الفضة إلى الألواح الشمسية والإلكترونيات وغيرها من الاستخدامات الصناعية. ولأن الدرهم مربوط بالدولار عند 3.6725، فإن سعر الفضة بالدرهم يتبع سعرها بالدولار.</p></div><div><h3>هل الفضة استثمار جيد؟</h3><p>قد تضيف الفضة تنويعًا إلى المحفظة، لكنها لا تدفع فوائد ولا توزيعات، ويتقلب سعرها أكثر بكثير من الذهب. كما أن شراء الفضة المادية وبيعها مكلف بسبب فرق السعر لدى التجار. قارنها مع <a href="/ar/gold-rate-today-uae" class="blue-link">سعر الذهب في الإمارات</a> قبل أن تقرر. والأسعار في هذه الصفحة للمعلومات فقط وليست نصيحة مالية.</p></div>`;

  function injectCSS(){
    if(!document.getElementById('bmc-silver-style')){
      var st=document.createElement('style'); st.id='bmc-silver-style'; st.textContent=CSS;
      (document.head||document.documentElement).appendChild(st);
    }
  }

  function boot(DATA){
    injectCSS();
    var root=document.getElementById('bmc-silver'); if(!root) return;
    root.innerHTML=AR ? HTML_AR : HTML;
    if(AR){
      root.setAttribute('dir','rtl');
      var fq=document.getElementById('bm-silver-faq');
      if(fq){ fq.innerHTML=FAQ_AR; fq.setAttribute('dir','rtl'); }
    }
    run(DATA);
  }

  function start(){
    injectCSS();
    var u=DATA_URL+'?d='+new Date().toISOString().slice(0,13);
    fetch(u,{cache:'no-store'})
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(boot)
      .catch(function(err){
        console.error('[silver] failed to load data', err);
        var root=document.getElementById('bmc-silver');
        if(root){ root.innerHTML='<p style="font:inherit;color:#98A2B3;margin:0;">'+L('Could not load the silver rates. Please try again in a moment.','تعذّر تحميل أسعار الفضة. يُرجى المحاولة مرة أخرى بعد قليل.')+'</p>'; }
      });
  }

  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', start); } else { start(); }
})();
