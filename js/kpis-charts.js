/* kpis-charts.js
   Rendert: KPI-Kacheln, Trend-Chart, Monats-Tabelle, SoV- und Funnel-KPI.
   Voraussetzungen:
   - utils.js vor dieser Datei laden (fmtMoney0, fmtMoney2, fmtPct1, fmtNum, fmtCompactDE, fmtMoneyCompactDE, safeDiv)
   - Chart.js optional für renderTrend()
*/

/* ========= KPIs ========= */
var KPI_DEF = [
  { key:'ad',          label:'Ad Spend Total',     fmt: fmtMoney0,                   better:'higher' },
  { key:'impressions', label:'Impressions Total',  fmt: function(v){ return fmtCompactDE(v,1); }, better:'higher' },
  { key:'clicks',      label:'Klicks Total',       fmt: fmtNum,                      better:'higher' },
  { key:'ctr',         label:'CTR',                fmt: function(v){ return fmtPct1(v); }, better:'higher' },
  { key:'orders',      label:'Media Sales Total',  fmt: fmtNum,                      better:'higher' },
  { key:'revenue',     label:'Media Revenue Total',fmt: function(v){ return fmtMoneyCompactDE(v,1); }, better:'higher' },
  { key:'roas',        label:'ROAS',               fmt: function(v){ return (v||0).toFixed(2)+'×'; }, better:'higher' },
  { key:'cpm',         label:'CPM',                fmt: fmtMoney2,                   better:'lower' },
  { key:'cpc',         label:'CPC',                fmt: fmtMoney2,                   better:'lower' }
];

function deltaInfo(cur, ly, better){
  if(!isFinite(ly) || ly === 0) return { cls:'neutral', txt:'—', arrow:'' };
  var diff = (cur - ly) / Math.abs(ly);
  var good = (better === 'higher') ? diff > 0 : diff < 0;
  var bad  = (better === 'higher') ? diff < 0 : diff > 0;
  return { cls: good ? 'up' : (bad ? 'down' : 'neutral'),
           txt: (diff*100).toFixed(1)+'%',
           arrow: good ? '▲' : '▼' };
}

function renderKPIs(curTotals, lyTotals){
  var grid = document.getElementById('kpiGrid'); if (!grid) return;
  grid.innerHTML = '';
  for (var i=0;i<KPI_DEF.length;i++){
    var def = KPI_DEF[i];
    var cur = curTotals[def.key] || 0;
    var ly  = lyTotals[def.key]  || 0;
    var d   = deltaInfo(cur, ly, def.better);

    var div = document.createElement('div');
    var isSalesPair = (def.key === 'orders' || def.key === 'revenue');
    div.className = 'kpi' + (isSalesPair ? ' sales-pair' : '');
    div.setAttribute('data-key', def.key);
    div.innerHTML =
      '<div class="label">'+def.label+'</div>'+
      '<div class="value">'+def.fmt(cur)+'</div>'+
      '<div class="delta '+d.cls+'"><span class="arrow">'+d.arrow+
      '</span><span>'+d.txt+'</span> <span class="muted">vs LY</span></div>';

    // Klick auf Sales/Revenue führt zu sales.html (mit aktuellem Scope)
    if (isSalesPair){
      div.style.cursor = 'pointer';
      div.title = 'Details nach Produkt ansehen';
      div.addEventListener('click', function(){
        var url = 'sales.html?scope='+encodeURIComponent(STATE.filter);
        window.location.href = url;
      });
    }
    grid.appendChild(div);
  }
}

/* ========= Chart & Monats-Tabelle ========= */
var trendChart = null;

function autoSizeChart(){
  var cfg   = window.DASHBOARD_LAYOUT || {};
  var panel = document.getElementById('panel-kpi'); if (!panel) return;

  if (cfg.mode === 'scroll'){
    panel.style.setProperty('--chart-h','360px');
    return;
  }
  var header      = panel.querySelector('.header');
  var kpiGrid     = panel.querySelector('#kpiGrid');
  var chartHeader = panel.querySelector('.chart-header');
  var used = (header?header.offsetHeight:0) +
             (kpiGrid?kpiGrid.offsetHeight:0) +
             (chartHeader?chartHeader.offsetHeight:0) + 44;
  var free = Math.max(200, Math.min(480, panel.clientHeight - used));
  panel.style.setProperty('--chart-h', free+'px');
}

function renderTrend(list){
  if (!window.Chart) return; // Chart optional
  list = list || [];

  var labels = MONTHS.slice(0, 8);
  var ad  = [0,0,0,0,0,0,0,0];
  var rev = [0,0,0,0,0,0,0,0];

  for (var i=0; i<list.length; i++){
    var c = list[i];
    var s = new Date(c.start + 'T00:00:00');
    var e = new Date(c.end   + 'T00:00:00');

    var months = [];
    var cur = new Date(s); cur.setDate(1);
    while (cur <= e){
      var m = cur.getMonth(), y = cur.getFullYear();
      if (y === 2025 && m <= 7) months.push(m);
      cur.setMonth(cur.getMonth()+1); cur.setDate(1);
    }
    var share = months.length ? 1 / months.length : 0;
    for (var j=0;j<months.length;j++){
      var idx = months[j];
      ad[idx]  += (c.ad || 0)      * share;
      rev[idx] += (c.revenue || 0) * share;
    }
  }

  var canvas = document.getElementById('trendChart'); if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (trendChart && trendChart.destroy) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label:'Ad Spend',      data: ad,  backgroundColor:'rgba(255,199,177,0.85)', borderColor:'#FFC7B1', borderWidth:1 },
        { label:'Media Revenue', data: rev, backgroundColor:'rgba(192,155,191,0.85)', borderColor:'#C09BBF', borderWidth:1 }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{ font:{ size:18 } } }, title:{ display:false } },
      layout:{ padding:{ top:4, right:8, bottom:18, left:8 } },
      scales:{
        x:{ ticks:{ font:{ size:16 } } },
        y:{ beginAtZero:true, ticks:{ font:{ size:16 }, callback:function(v){ return fmtMoney0(v); } } }
      }
    }
  });
}

// Leicht unterschiedliche Verteilungen pro KPI
// (mehr in Jan–März & Jun–Aug, weniger in Apr–Mai)
var MP_W_IMP = [0.168,0.158,0.150,0.092,0.084,0.115,0.117,0.116]; // Impressions
var MP_W_CLK = [0.173,0.152,0.145,0.095,0.085,0.110,0.122,0.118]; // Clicks
var MP_W_AD  = [0.167,0.156,0.150,0.092,0.082,0.115,0.118,0.120]; // Ad Spend
var MP_W_REV = [0.168,0.156,0.150,0.092,0.083,0.115,0.122,0.114]; // Revenue
var MP_W_ORD = [0.168,0.156,0.150,0.092,0.083,0.116,0.120,0.115]; // Sales

// SoV-Faktoren um den globalen SoV – Mittelwert ≈ 1
var MP_W_SOV = [1.14,1.06,1.02,0.86,0.85,0.96,1.03,0.98];

/* ========= Monthly Breakdown (gewichtet + mit Jitter) ========= */
// Gewichte: Jan–März & Jun–Aug höher, Apr–Mai niedriger; Summe = 1.00
const MP_WEIGHTS = [0.17, 0.16, 0.14, 0.09, 0.08, 0.12, 0.12, 0.12]; // Jan..Aug
const MP_JITTER  = 0.08; // ±8% pro Monat, damit nicht jeder Monat gleich aussieht

function normalizeWeights(base, jitter){
  // w' = max(0, w * (1 + rand(-j..+j))), danach normalisieren auf 1.0
  var w = base.map(function(x){
    var f = 1 + (Math.random()*2 - 1) * (jitter||0);
    return Math.max(0, x * f);
  });
  var s = w.reduce((a,b)=>a+b,0) || 1;
  return w.map(x => x/s);
}

// Verteilung eines Totals auf 8 Monate – mit exakter Restsumme im letzten Monat
function distribute(total, weights, intRounding){
  var out = new Array(8).fill(0);
  var acc = 0;
  for (var i=0;i<7;i++){
    var v = total * weights[i];
    out[i] = intRounding ? Math.round(v) : v;
    acc += out[i];
  }
  out[7] = intRounding ? Math.round(total - acc) : (total - acc);
  return out;
}

// Robuste Totals (falls keine globale totals()-Funktion verfügbar ist)
function getGrandTotalsFromList(list){
  if (typeof totals === 'function') return totals(list||[]);
  var g = { impressions:0, clicks:0, ad:0, revenue:0, orders:0 };
  (list||[]).forEach(function(c){
    g.impressions += +c.impressions || 0;
    g.clicks      += +c.clicks      || 0;
    g.ad          += +c.ad          || 0;

    var rev = (typeof c.revenue === 'number') ? c.revenue : 0;
    var ord = (typeof c.orders  === 'number') ? c.orders  : 0;
    if ((!rev || !ord) && Array.isArray(c.products)){
      var r=0, u=0;
      c.products.forEach(function(p){ r += +p.revenue||0; u += +p.units||0; });
      if (!rev) rev = r;
      if (!ord) ord = u;
    }
    g.revenue += rev || 0;
    g.orders  += ord || 0;
  });
  // abgeleitete Kennzahlen berechnet später pro Monat
  return g;
}

function monthlyBreakdown(list, grandTotalsOptional){
  // Totals holen (wie bisher)
  var G = grandTotalsOptional || getGrandTotalsFromList(list||[]);

  // pro KPI unterschiedliche, leicht gejitterte Gewichte
  var impW = normalizeWeights(MP_W_IMP, MP_JITTER);
  var clkW = normalizeWeights(MP_W_CLK, MP_JITTER);
  var adW  = normalizeWeights(MP_W_AD,  MP_JITTER);
  var revW = normalizeWeights(MP_W_REV, MP_JITTER);
  var ordW = normalizeWeights(MP_W_ORD, MP_JITTER);

  // Verteilung
  var imp = distribute(G.impressions||0, impW, true);
  var clk = distribute(G.clicks     ||0, clkW, true);
  var ad  = distribute(G.ad         ||0, adW , false);
  var rev = distribute(G.revenue    ||0, revW, false);
  var ord = distribute(G.orders     ||0, ordW, true);

  // Abgeleitete KPIs je Monat
  var months = [];
  for (var i=0;i<8;i++){
    var m = {
      impressions: imp[i],
      clicks:      clk[i],
      ad:          ad[i],
      revenue:     rev[i],
      orders:      ord[i]
    };
    m.ctr  = safeDiv(m.clicks, m.impressions);
    m.cpc  = safeDiv(m.ad,     m.clicks);
    m.cpm  = safeDiv(m.ad,     (m.impressions||0)/1000);
    m.roas = safeDiv(m.revenue,m.ad);
    months.push(m);
  }

  // SoV je Monat leicht variieren, Mittelwert = globaler SoV
  var globalSov = (window.DASHBOARD_DATA && window.DASHBOARD_DATA.sov
                   ? window.DASHBOARD_DATA.sov.total : 0.17);
  var avg = MP_W_SOV.reduce(function(a,b){return a+b;},0)/MP_W_SOV.length;
  for (var j=0;j<8;j++){
    months[j].sov = globalSov * (MP_W_SOV[j]/avg);
  }

  return months;
}

function renderMonthlyTable(monthsData, grandTotals){
  var tbody = document.querySelector('#monthlyTable tbody'); if (!tbody) return;
  var labels = MONTHS.slice(0,8);

  var rowsHtml = '';
  for (var i=0;i<8;i++){
    var m = monthsData[i];
    rowsHtml += '<tr>'+
      '<td>'+labels[i]+'</td>'+
      '<td class="right">'+fmtMoney0(m.ad)+'</td>'+                       // <-- Ad Spend direkt nach Monat
      '<td class="right">'+fmtNum(Math.round(m.impressions))+'</td>'+
      '<td class="right">'+fmtNum(Math.round(m.clicks))+'</td>'+
      '<td class="right">'+fmtPct1(m.ctr)+'</td>'+
      '<td class="right">'+fmtMoney2(m.cpc)+'</td>'+
      '<td class="right">'+fmtMoney2(m.cpm)+'</td>'+
      '<td class="right">'+fmtNum(Math.round(m.orders))+'</td>'+
      '<td class="right">'+fmtMoney0(m.revenue)+'</td>'+
      '<td class="right">'+(m.roas||0).toFixed(2)+'×</td>'+
      '<td class="right">'+(m.sov!=null ? ((m.sov*100).toFixed(0)+'%') : '—')+'</td>'+
    '</tr>';
  }
  tbody.innerHTML = rowsHtml;

  // Totals aus Monaten oder grandTotals
  var G = grandTotals || monthsData.reduce(function(acc,m){
    acc.impressions += (m.impressions||0);
    acc.clicks      += (m.clicks||0);
    acc.ad          += (m.ad||0);
    acc.revenue     += (m.revenue||0);
    acc.orders      += (m.orders||0);
    return acc;
  }, {impressions:0, clicks:0, ad:0, revenue:0, orders:0});

  var tr = document.getElementById('monthlyTotalRow');
  if (tr){
    var ctrTot  = safeDiv(G.clicks, G.impressions);
    var cpcTot  = safeDiv(G.ad,     G.clicks);
    var cpmTot  = safeDiv(G.ad,     (G.impressions||0)/1000);
    var roasTot = safeDiv(G.revenue,G.ad);
    var sovTot  = (window.DASHBOARD_DATA && window.DASHBOARD_DATA.sov
                   ? window.DASHBOARD_DATA.sov.total : null);

    tr.innerHTML =
      '<td><b>Summe</b></td>'+
      '<td class="right"><b>'+fmtMoney0(G.ad)+'</b></td>'+
      '<td class="right"><b>'+fmtNum(Math.round(G.impressions))+'</b></td>'+
      '<td class="right"><b>'+fmtNum(Math.round(G.clicks))+'</b></td>'+
      '<td class="right"><b>'+fmtPct1(ctrTot)+'</b></td>'+
      '<td class="right"><b>'+fmtMoney2(cpcTot)+'</b></td>'+
      '<td class="right"><b>'+fmtMoney2(cpmTot)+'</b></td>'+
      '<td class="right"><b>'+fmtNum(Math.round(G.orders))+'</b></td>'+
      '<td class="right"><b>'+fmtMoney0(G.revenue)+'</b></td>'+
      '<td class="right"><b>'+roasTot.toFixed(2)+'×</b></td>'+
      '<td class="right"><b>'+(sovTot!=null? ((sovTot*100).toFixed(0)+'%') : '—')+'</b></td>';
  }
}


/* === SoV-KPI + Funnel === */
function renderSOVandFunnel(){
  var box = document.getElementById('kpiGrid'); if (!box) return;

  var sov = (window.DASHBOARD_DATA && window.DASHBOARD_DATA.sov) ? window.DASHBOARD_DATA.sov.total : null;
  if (sov != null){
    var k = document.createElement('div');
    k.className = 'kpi kpi-sov';
    k.innerHTML =
      '<div class="label">Share of Voice</div>'+
      '<div class="value">'+ ((sov*100).toFixed(0)) + '%</div>'+
      '<div class="delta neutral"><span class="arrow"></span><span>Details</span></div>';
    k.addEventListener('click', function(){
      var url = 'share.html?scope='+encodeURIComponent(STATE.filter);
      window.location.href = url;
    });
    box.appendChild(k);
  }

  var f = (window.DASHBOARD_DATA && window.DASHBOARD_DATA.funnel) ? window.DASHBOARD_DATA.funnel : null;
  if (f){
    var aw = Math.max(0, Math.min(1, f.awareness || 0));
    var en = Math.max(0, Math.min(1, f.engagement|| 0));
    var pe = Math.max(0, Math.min(1, f.performance||0));
    var sum = aw + en + pe || 1;
    aw/=sum; en/=sum; pe/=sum;

    var c = document.createElement('div');
    c.className = 'kpi kpi-funnel';
    c.innerHTML =
      '<div class="label">Funnel Mix</div>'+
      '<div class="segment">'+
        '<div class="segment-labels">Awareness<span class="sep">/</span>Engagement<span class="sep">/</span>Performance</div>'+
        '<div class="segment-bar">'+
          '<div class="segment-chunk segment-aw" style="width:'+(aw*100).toFixed(0)+'%">'+(aw*100).toFixed(0)+'%</div>'+
          '<div class="segment-chunk segment-en" style="width:'+(en*100).toFixed(0)+'%">'+(en*100).toFixed(0)+'%</div>'+
          '<div class="segment-chunk segment-pe" style="width:'+(pe*100).toFixed(0)+'%">'+(pe*100).toFixed(0)+'%</div>'+
        '</div>'+
      '</div>';
    box.appendChild(c);
  }
}

/* Optional: im globalen Namespace verfügbar machen */
try{
  Object.assign(window, {
    renderKPIs,
    autoSizeChart,
    renderTrend,
    monthlyBreakdown,
    renderMonthlyTable,
    renderSOVandFunnel
  });
}catch(_){}
