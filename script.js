/* ========= Utils ========= */
function fmtMoney0(n){ return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}); }
function fmtMoney2(n){ return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtPct1(n){ return ((n||0)*100).toFixed(1)+'%'; }
function fmtNum(n){ return (n||0).toLocaleString('de-DE'); }
function safeDiv(a,b){ return b ? (a/b) : 0; }

/* ========= Fehler-Overlay (hilft sofort beim Debuggen) ========= */
window.addEventListener('error', function (e) {
  try{
    const msg = (e && e.message) ? e.message : String(e);
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:99999;background:#300;color:#fff;padding:6px 10px;border-radius:6px;font:12px/1.4 monospace';
    box.textContent = 'JS Error: ' + msg;
    document.body.appendChild(box);
  }catch(_){}
});

/* ========= Stage / Layout Mode ========= */
var BASE = { w:1920, h:1080 };
function fitStageFixed() {
  var stage = document.getElementById('stage');
  if (!stage) return;
  var s = Math.min(window.innerWidth/BASE.w, window.innerHeight/BASE.h);
  stage.style.transform = 'scale('+s+')';
  stage.style.left = ((window.innerWidth - BASE.w*s)/2)+'px';
  stage.style.top  = ((window.innerHeight - BASE.h*s)/2)+'px';
}
function applyLayoutConfig() {
  var cfg = window.DASHBOARD_LAYOUT || { mode:'scroll', columns:12, gap:18, order:[] };
  var board = document.getElementById('board');
  if (!board) return;

  document.documentElement.style.setProperty('--cols', String(cfg.columns || 3));
  document.documentElement.style.setProperty('--gap', (cfg.gap || 18) + 'px');
  board.style.gap = (cfg.gap || 18) + 'px';

  // Reihenfolge/Spans
  (cfg.order || []).forEach(function(item){
    var el = document.getElementById(item.id);
    if (!el) return;
    var span = Math.max(1, Math.min(item.span || 1, cfg.columns || 3));
    el.style.gridColumn = 'span ' + span;
    board.appendChild(el);
  });

  var stage = document.getElementById('stage');
  if ((cfg.mode || 'fixed-scale') === 'scroll') {
    document.body.style.overflow = 'auto';
    stage.style.position = 'relative';
    stage.style.transform = 'none';
    stage.style.left = stage.style.top = '';
    stage.style.width = '100%';
    stage.style.height = 'auto';
    stage.style.setProperty('--chart-h', '360px');
    window.removeEventListener('resize', fitStageFixed);
  } else {
    document.body.style.overflow = 'hidden';
    stage.style.position = 'absolute';
    stage.style.width = BASE.w + 'px';
    stage.style.height = BASE.h + 'px';
    fitStageFixed();
    window.addEventListener('resize', fitStageFixed);
  }
}

/* ========= Daten / State ========= */
var D = window.DASHBOARD_DATA || { campaigns_2025: [], campaigns_2024: [], rerank: [], sales_details: [] };
var ALL_2025 = D.campaigns_2025 || [];
var ALL_2024 = D.campaigns_2024 || [];

var STATE = { filter: 'ALL' }; // ALL | ONSITE | OFFSITE | CPM | CPC
var MONTHS = ['Jan','Feb','Mrz','Apr','Mai','Jun','Jul','Aug'];

/* ========= Filterung ========= */
function predicateFor(filter){
  switch(filter){
    case 'ONSITE': return function(c){ return c.site === 'Onsite'; };
    case 'OFFSITE': return function(c){ return c.site === 'Offsite'; };
    case 'CPM': return function(c){ return c.model === 'CPM'; };
    case 'CPC': return function(c){ return c.model === 'CPC'; };
    default: return function(){ return true; };
  }
}
function applyFilter(list, filter){ return (list||[]).filter(predicateFor(filter)); }

/* ========= Totals ========= */
function totals(list){
  list = list || [];
  var t = list.reduce(function(a,c){
    return {
      impressions: a.impressions + (c.impressions||0),
      clicks:      a.clicks      + (c.clicks||0),
      ad:          a.ad          + (c.ad||0),
      revenue:     a.revenue     + (c.revenue||0),
      orders:      a.orders      + (c.orders||0),
      booking:     a.booking     + (c.booking||0)
    };
  }, {impressions:0, clicks:0, ad:0, revenue:0, orders:0, booking:0});
  var ctr  = safeDiv(t.clicks, t.impressions);
  var roas = safeDiv(t.revenue, t.ad);
  var cpm  = safeDiv(t.ad, t.impressions/1000);
  var cpc  = safeDiv(t.ad, t.clicks);
  var delivered = safeDiv(t.ad, t.booking);
  return { impressions:t.impressions, clicks:t.clicks, ad:t.ad, revenue:t.revenue, orders:t.orders, booking:t.booking,
           ctr:ctr, roas:roas, cpm:cpm, cpc:cpc, delivered:delivered };
}

/* ========= KPI-Karten mit YoY ========= */
var KPI_DEF = [
  { key:'ad',          label:'Ad Spend Total',       fmt:fmtMoney0,           better:'higher' },
  { key:'impressions', label:'Impressions Total',    fmt:fmtNum,              better:'higher' },
  { key:'clicks',      label:'Klicks Total',         fmt:fmtNum,              better:'higher' },
  { key:'ctr',         label:'CTR',                  fmt:function(v){return fmtPct1(v);}, better:'higher' },
  { key:'orders',      label:'Media Sales Total',    fmt:fmtNum,              better:'higher' },   // Sales-Paar (1)
  { key:'revenue',     label:'Media Revenue Total',  fmt:fmtMoney0,           better:'higher' },   // Sales-Paar (2)
  { key:'roas',        label:'ROAS',                 fmt:function(v){return (v||0).toFixed(2)+'×';}, better:'higher' },
  { key:'cpm',         label:'CPM',                  fmt:fmtMoney2,           better:'lower' },
  { key:'cpc',         label:'CPC',                  fmt:fmtMoney2,           better:'lower' }
];
function deltaInfo(cur, ly, better){
  if (!isFinite(ly) || ly === 0) return { cls:'neutral', txt:'—', arrow:'' };
  var diff = (cur - ly) / Math.abs(ly);
  var good = better === 'higher' ? diff > 0 : diff < 0;
  var bad  = better === 'higher' ? diff < 0 : diff > 0;
  return { cls: good ? 'up' : bad ? 'down' : 'neutral', txt: (diff*100).toFixed(1) + '%', arrow: good ? '▲' : bad ? '▼' : '•' };
}
function renderKPIs(curTotals, lyTotals){
  var grid = document.getElementById('kpiGrid');
  if (!grid) return;
  grid.innerHTML = '';
  KPI_DEF.forEach(function(def, idx){
    var cur = curTotals[def.key] || 0;
    var ly  = lyTotals[def.key]  || 0;
    var d   = deltaInfo(cur, ly, def.better);
    var div = document.createElement('div');
    div.className = 'kpi';
    if (def.key === 'orders' || def.key === 'revenue') div.className += ' sales-pair';
    div.innerHTML =
      '<div class="label">'+def.label+'</div>' +
      '<div class="value">'+def.fmt(cur)+'</div>' +
      '<div class="delta '+d.cls+'"><span class="arrow">'+d.arrow+'</span><span>'+d.txt+
      '</span> <span style="opacity:.7">vs LY</span></div>';
    grid.appendChild(div);
  });
}

/* CTA „Sales Details“ direkt unter dem KPI-Grid */
function renderSalesCTA(){
  var body = document.querySelector('#panel-kpi .kpi-body');
  if (!body) return;
  var chartSec = body.querySelector('.chart-section');
  var cta = document.getElementById('salesCta');
  if (!cta) {
    cta = document.createElement('div');
    cta.id = 'salesCta';
    cta.className = 'sales-cta';
    body.insertBefore(cta, chartSec); // unter KPI-Grid
  }
  var link = 'sales.html?filter=' + encodeURIComponent(STATE.filter);
  cta.innerHTML = '<a class="sales-btn" href="'+link+'">Sales Details</a>';
}

/* ========= Chart-Höhe dynamisch ========= */
function autoSizeChart() {
  var cfg = window.DASHBOARD_LAYOUT || {};
  var panel = document.getElementById('panel-kpi');
  if (!panel) return;

  if (cfg.mode === 'scroll') {
    panel.style.setProperty('--chart-h','360px');
    return;
  }
  var header = panel.querySelector('.header');
  var kpiGrid = panel.querySelector('#kpiGrid');
  var chartHeader = panel.querySelector('.chart-header');
  var paddingY = 32;  // Card padding top+bottom
  var gaps = 12 + 8;  // kpi-body gap + chart-section gap
  var used = (header ? header.offsetHeight : 0) +
             (kpiGrid ? kpiGrid.offsetHeight : 0) +
             (chartHeader ? chartHeader.offsetHeight : 0) +
             paddingY + gaps;
  var free = panel.clientHeight - used;
  free = Math.max(200, Math.min(480, free));
  panel.style.setProperty('--chart-h', String(Math.round(free))+'px');
}

/* ========= Trend-Chart ========= */
var trendChart = null;
function renderTrend(list){
  if (!window.Chart) return; // falls CDN nicht geladen ist
  list = list || [];
  var monthTotals = [];
  for (var i=0;i<8;i++) monthTotals.push({ad:0,revenue:0});

  list.forEach(function(c){
    var s = new Date(c.start+'T00:00:00'), e = new Date(c.end+'T00:00:00');
    var months = [], cur = new Date(s); cur.setDate(1);
    while (cur <= e){
      var m = cur.getMonth(), y = cur.getFullYear();
      if (y===2025 && m<=7) months.push(m);
      cur.setMonth(cur.getMonth()+1); cur.setDate(1);
    }
    var share = months.length ? 1/months.length : 0;
    months.forEach(function(m){ monthTotals[m].ad += c.ad*share; monthTotals[m].revenue += c.revenue*share; });
  });

  var ctx = document.getElementById('trendChart').getContext('2d');
  if (trendChart && trendChart.destroy) trendChart.destroy();
  Chart.defaults.font.size = 18;

  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: 'Ad Spend',
          data: monthTotals.map(function(m){return m.ad;}),
          backgroundColor: 'rgba(255,199,177,0.85)',  // Peach #FFC7B1
          borderColor:     '#FFC7B1',
          borderWidth: 1
        },
        {
          label: 'Media Revenue',
          data: monthTotals.map(function(m){return m.revenue;}),
          backgroundColor: 'rgba(192,155,191,0.85)',  // Mauve #C09BBF
          borderColor:     '#C09BBF',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive:true,
      maintainAspectRatio:false,
      layout:{ padding:{ top:4, right:8, bottom:18, left:8 } },
      plugins:{ legend:{ labels:{ font:{ size:18 } } }, title:{ display:false } },
      scales:{
        x:{ ticks:{ font:{ size:16 } } },
        y:{ beginAtZero:true, ticks:{ font:{ size:16 }, callback:function(v){ return fmtMoney0(v); } } }
      }
    }
  });
}

/* ========= Campaign Overview (visuell) ========= */
function renderCampaignOverview(all){
  all = all || [];
  var t = totals(all);
  var now = new Date();
  var active = all.filter(function(c){ return new Date(c.start) <= now && now <= new Date(c.end); }).length;
  var ended  = all.filter(function(c){ return new Date(c.end) <  now; }).length;

  var el;
  el = document.getElementById('ov-count-total'); if (el) el.textContent = fmtNum(all.length);
  el = document.getElementById('ov-count-active'); if (el) el.textContent = fmtNum(active);
  el = document.getElementById('ov-count-ended'); if (el) el.textContent = fmtNum(ended);

  el = document.getElementById('ov-booking');  if (el) el.textContent = fmtMoney0(t.booking);
  el = document.getElementById('ov-ad');       if (el) el.textContent = fmtMoney0(t.ad);
  el = document.getElementById('ov-delivered');if (el) el.textContent = (t.delivered*100).toFixed(0) + '%';
}

/* ========= Campaign Table ========= */
function renderCampaignTable(list, allList){
  list = list || []; allList = allList || [];
  var tbody = document.querySelector('#campaignTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  var sorted = list.slice().sort(function(a,b){ return (b.ad||0) - (a.ad||0); });

  sorted.forEach(function(c){
    var roas = safeDiv(c.revenue, c.ad);
    var flight = c.start.slice(8,10)+'.'+c.start.slice(5,7)+'.'+c.start.slice(0,4)+'–'+
                 c.end.slice(8,10)+'.'+c.end.slice(5,7)+'.'+c.end.slice(0,4);
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>'+c.name+'</td>' +
      '<td>'+c.site+'</td>' +
      '<td>'+c.model+'</td>' +
      '<td>'+flight+'</td>' +
      '<td class="right">'+fmtNum(Math.round(c.impressions||0))+'</td>' +
      '<td class="right">'+fmtNum(Math.round(c.clicks||0))+'</td>' +
      '<td class="right">'+fmtPct1(safeDiv(c.clicks, c.impressions))+'</td>' +
      '<td class="right">'+fmtMoney0(c.ad)+'</td>' +
      '<td class="right">'+fmtMoney0(c.revenue)+'</td>' +
      '<td class="right">'+(roas||0).toFixed(2)+'×</td>' +
      '<td class="right">'+fmtNum(c.orders||0)+'</td>';
    tbody.appendChild(tr);
  });

  var sumF = totals(list);
  var sumA = totals(allList);
  var row;

  row = document.getElementById('campaignFilterRow');
  if (row) row.innerHTML =
    '<td>Summe (Filter)</td><td>—</td><td>—</td><td>—</td>' +
    '<td class="right">'+fmtNum(Math.round(sumF.impressions))+'</td>' +
    '<td class="right">'+fmtNum(Math.round(sumF.clicks))+'</td>' +
    '<td class="right">'+fmtPct1(sumF.ctr)+'</td>' +
    '<td class="right">'+fmtMoney0(sumF.ad)+'</td>' +
    '<td class="right">'+fmtMoney0(sumF.revenue)+'</td>' +
    '<td class="right">'+(sumF.roas||0).toFixed(2)+'×</td>' +
    '<td class="right">'+fmtNum(Math.round(sumF.orders))+'</td>';

  row = document.getElementById('campaignGrandRow');
  if (row) row.innerHTML =
    '<td>Gesamt (Alle)</td><td>—</td><td>—</td><td>—</td>' +
    '<td class="right">'+fmtNum(Math.round(sumA.impressions))+'</td>' +
    '<td class="right">'+fmtNum(Math.round(sumA.clicks))+'</td>' +
    '<td class="right">'+fmtPct1(sumA.ctr)+'</td>' +
    '<td class="right">'+fmtMoney0(sumA.ad)+'</td>' +
    '<td class="right">'+fmtMoney0(sumA.revenue)+'</td>' +
    '<td class="right">'+(sumA.roas||0).toFixed(2)+'×</td>' +
    '<td class="right">'+fmtNum(Math.round(sumA.orders))+'</td>';
}

/* ========= Re-Rank ========= */
function renderRerank(list){
  list = list || [];
  var tbody = document.querySelector('#rerankTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  var rows = list.map(function(r){
    return { sku:r.sku, item:r.item, ad:r.ad, ecpc:r.ecpc, roas:r.roas,
             clicks: r.ecpc>0 ? (r.ad / r.ecpc) : 0,
             revenue: r.roas * r.ad };
  }).sort(function(a,b){ return (b.revenue||0) - (a.revenue||0); });

  rows.forEach(function(r){
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>'+r.sku+' — '+r.item+'</td>' +
      '<td class="right">'+fmtMoney0(r.ad)+'</td>' +
      '<td class="right">'+fmtNum(Math.round(r.clicks))+'</td>' +
      '<td class="right">'+fmtMoney2(r.ecpc)+'</td>' +
      '<td class="right">'+fmtMoney0(r.revenue)+'</td>' +
      '<td class="right">'+(r.roas||0).toFixed(2)+'×</td>';
    tbody.appendChild(tr);
  });
}

/* ========= Interaktion ========= */
function bindChips(){
  var bar = document.getElementById('filterChips');
  if (!bar) return;
  bar.addEventListener('click', function(e){
    var chip = e.target.closest ? e.target.closest('.chip') : null;
    if (!chip) return;
    var all = bar.querySelectorAll('.chip');
    for (var i=0;i<all.length;i++) all[i].classList.remove('active');
    chip.classList.add('active');
    STATE.filter = chip.getAttribute('data-filter');
    renderAll();
  });
}

/* ========= Render All ========= */
function renderAll(){
  var list25 = applyFilter(ALL_2025, STATE.filter);
  var list24 = applyFilter(ALL_2024, STATE.filter);
  var t25 = totals(list25);
  var t24 = totals(list24);

  renderKPIs(t25, t24);
  renderSalesCTA();
  autoSizeChart();
  renderTrend(list25);
  renderCampaignOverview(ALL_2025);
  renderCampaignTable(list25, ALL_2025);
}

/* ========= Boot ========= */
window.addEventListener('resize', function(){
  var cfg = window.DASHBOARD_LAYOUT || {};
  if (cfg.mode !== 'scroll') {
    fitStageFixed();
    autoSizeChart();
    if (trendChart && trendChart.resize) trendChart.resize();
  }
});

document.addEventListener('DOMContentLoaded', function(){
  applyLayoutConfig();                 // scroll vs fixed + Grid/Order
  bindChips();
  renderRerank((D || {}).rerank || []);
  renderAll();
});
