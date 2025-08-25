/* ========= Utils ========= */
function fmtMoney0(n){ return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}); }
function fmtMoney2(n){ return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtPct1(n){ return ((n||0)*100).toFixed(1)+'%'; }
function fmtNum(n){ return (n||0).toLocaleString('de-DE'); }
function safeDiv(a,b){ return b ? (a/b) : 0; }

/* ========= Sichtbares Fehler-Overlay + Guards ========= */
function __report(where, err){
  try{
    var msg = (err && err.message) ? err.message : String(err);
    console.error('[Dashboard]', where, err);
    var d=document.createElement('div');
    d.style='position:fixed;left:8px;bottom:120px;z-index:99999;background:#520;color:#fff;padding:6px 10px;border-radius:6px;font:12px monospace';
    d.textContent='Fehler in '+where+': '+msg;
    document.body.appendChild(d);
  }catch(_){}
}
function __guard(where, fn){
  try { return fn(); } catch(e){ __report(where, e); throw e; }
}
window.addEventListener('error', function (e) {
  try{
    var msg = (e && e.message) ? e.message : String(e);
    var box = document.createElement('div');
    box.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:99999;background:#300;color:#fff;padding:6px 10px;border-radius:6px;font:12px monospace';
    box.textContent = 'JS error: ' + msg;
    document.body.appendChild(box);
  }catch(_){}
});

/* ========= Stage / Layout ========= */
var BASE = { w:1920, h:1080 };
function fitStageFixed(){
  var stage=document.getElementById('stage'); if(!stage) return;
  var s=Math.min(window.innerWidth/BASE.w, window.innerHeight/BASE.h);
  stage.style.transform='scale('+s+')';
  stage.style.left=((window.innerWidth-BASE.w*s)/2)+'px';
  stage.style.top =((window.innerHeight-BASE.h*s)/2)+'px';
}
function applyLayoutConfig(){
  var cfg=window.DASHBOARD_LAYOUT||{mode:'scroll',columns:12,gap:18,order:[]};
  var board=document.getElementById('board'); if(!board) return;

  document.documentElement.style.setProperty('--cols', String(cfg.columns||3));
  document.documentElement.style.setProperty('--gap', (cfg.gap||18)+'px');
  board.style.gap=(cfg.gap||18)+'px';

  var ord = cfg.order || [];
  for (var i=0;i<ord.length;i++){
    var it = ord[i];
    var el=document.getElementById(it.id); if(!el) continue;
    var span=Math.max(1, Math.min(it.span||1, cfg.columns||3));
    el.style.gridColumn='span '+span;
    board.appendChild(el);
  }

  var stage=document.getElementById('stage');
  if((cfg.mode||'fixed-scale')==='scroll'){
    document.body.style.overflow='auto';
    stage.style.position='relative';
    stage.style.transform='none';
    stage.style.left=stage.style.top='';
    stage.style.width='100%';
    stage.style.height='auto';
    stage.style.setProperty('--chart-h','360px');
    window.removeEventListener('resize', fitStageFixed);
  }else{
    document.body.style.overflow='hidden';
    stage.style.position='absolute';
    stage.style.width=BASE.w+'px';
    stage.style.height=BASE.h+'px';
    fitStageFixed();
    window.addEventListener('resize', fitStageFixed);
  }
}

/* ========= Daten / State ========= */
var D = window.DASHBOARD_DATA || { campaigns_2025: [], campaigns_2024: [], rerank: [], sales_details: [] };
var ALL_2025 = D.campaigns_2025 || [];
var ALL_2024 = D.campaigns_2024 || [];
var STATE={ filter:'ALL' };
var MONTHS=['Jan','Feb','Mrz','Apr','Mai','Jun','Jul','Aug'];

/* ========= Filter ========= */
function predicateFor(f){
  switch(f){
    case 'ONSITE': return function(c){return c.site==='Onsite';};
    case 'OFFSITE':return function(c){return c.site==='Offsite';};
    case 'CPM':    return function(c){return c.model==='CPM';};
    case 'CPC':    return function(c){return c.model==='CPC';};
    default:       return function(){return true;};
  }
}
function applyFilter(list,f){ return (list||[]).filter(predicateFor(f)); }

/* ========= Totals: Sales/Revenue aus products ========= */
function sumProducts(c, field){
  if (!c || !c.products) return 0;
  var s=0; for (var i=0;i<c.products.length;i++){ s += (c.products[i][field] || 0); }
  return s;
}
function totals(list){
  list=list||[];
  var acc={impressions:0,clicks:0,ad:0,revenue:0,orders:0,booking:0};
  for (var i=0;i<list.length;i++){
    var c=list[i];
    var orders  = c.products ? sumProducts(c,'units')   : (c.orders   || 0);
    var revenue = c.products ? sumProducts(c,'revenue') : (c.revenue  || 0);
    acc.impressions += (c.impressions||0);
    acc.clicks      += (c.clicks||0);
    acc.ad          += (c.ad||0);
    acc.revenue     +=  revenue;
    acc.orders      +=  orders;
    acc.booking     += (c.booking||0);
  }
  var ctr  = safeDiv(acc.clicks, acc.impressions);
  var roas = safeDiv(acc.revenue, acc.ad);
  var cpm  = safeDiv(acc.ad, acc.impressions/1000);
  var cpc  = safeDiv(acc.ad, acc.clicks);
  var delivered = safeDiv(acc.ad, acc.booking);
  return { impressions:acc.impressions, clicks:acc.clicks, ad:acc.ad, revenue:acc.revenue,
           orders:acc.orders, booking:acc.booking, ctr:ctr, roas:roas, cpm:cpm, cpc:cpc, delivered:delivered };
}

/* ========= KPIs (Sales/Revenue klickbar) ========= */
var KPI_DEF=[
  {key:'ad',label:'Ad Spend Total',fmt:fmtMoney0,better:'higher'},
  {key:'impressions',label:'Impressions Total',fmt:fmtNum,better:'higher'},
  {key:'clicks',label:'Klicks Total',fmt:fmtNum,better:'higher'},
  {key:'ctr',label:'CTR',fmt:function(v){return fmtPct1(v);},better:'higher'},
  {key:'orders',label:'Media Sales Total',fmt:fmtNum,better:'higher'},
  {key:'revenue',label:'Media Revenue Total',fmt:fmtMoney0,better:'higher'},
  {key:'roas',label:'ROAS',fmt:function(v){return (v||0).toFixed(2)+'×';},better:'higher'},
  {key:'cpm',label:'CPM',fmt:fmtMoney2,better:'lower'},
  {key:'cpc',label:'CPC',fmt:fmtMoney2,better:'lower'}
];
function deltaInfo(cur,ly,better){
  if(!isFinite(ly)||ly===0) return {cls:'neutral',txt:'—',arrow:''};
  var diff=(cur-ly)/Math.abs(ly);
  var good=better==='higher'? diff>0 : diff<0;
  var bad =better==='higher'? diff<0 : diff>0;
  return {cls:good?'up':bad?'down':'neutral', txt:(diff*100).toFixed(1)+'%', arrow:good?'▲':'▼'};
}
function renderKPIs(curTotals, lyTotals){
  var grid=document.getElementById('kpiGrid'); if(!grid) return;
  grid.innerHTML='';
  for (var i=0;i<KPI_DEF.length;i++){
    var def=KPI_DEF[i];
    var cur=curTotals[def.key]||0, ly=lyTotals[def.key]||0, d=deltaInfo(cur,ly,def.better);
    var div=document.createElement('div');
    var isSalesPair = (def.key==='orders'||def.key==='revenue');
    div.className='kpi' + (isSalesPair ? ' sales-pair' : '');
    div.setAttribute('data-key', def.key);
    div.innerHTML='<div class="label">'+def.label+'</div>'+
      '<div class="value">'+def.fmt(cur)+'</div>'+
      '<div class="delta '+d.cls+'"><span class="arrow">'+d.arrow+'</span><span>'+d.txt+
      '</span> <span style="opacity:.7">vs LY</span></div>';
    if (isSalesPair){
      div.style.cursor='pointer';
      div.title='Details nach Produkt ansehen';
      div.addEventListener('click', (function(){
        return function(){
          var url='sales.html?scope='+encodeURIComponent(STATE.filter);
          window.location.href=url;
        };
      })());
    }
    grid.appendChild(div);
  }
}

/* ========= Chart ========= */
var trendChart=null;
function autoSizeChart(){
  var cfg=window.DASHBOARD_LAYOUT||{};
  var panel=document.getElementById('panel-kpi'); if(!panel) return;
  if(cfg.mode==='scroll'){ panel.style.setProperty('--chart-h','360px'); return; }
  var header = panel.querySelector('.header');
  var kpiGrid = panel.querySelector('#kpiGrid');
  var chartHeader = panel.querySelector('.chart-header');
  var used=(header?header.offsetHeight:0)+(kpiGrid?kpiGrid.offsetHeight:0)+(chartHeader?chartHeader.offsetHeight:0)+44;
  var free=Math.max(200, Math.min(480, panel.clientHeight-used));
  panel.style.setProperty('--chart-h', free+'px');
}
// === REPLACE: renderTrend ===
var trendChart = null;
function renderTrend(list){
  if (!window.Chart) return;              // Chart.js nicht geladen? => still
  list = list || [];

  // 8 Monate (Jan–Aug)
  var labels = MONTHS.slice(0, 8);
  var ad  = [0,0,0,0,0,0,0,0];
  var rev = [0,0,0,0,0,0,0,0];

  // Kampagnen monatsweise verteilen (gleichmäßig über die beteiligten Monate)
  for (var i=0; i<list.length; i++){
    var c = list[i];
    var s = new Date(c.start + 'T00:00:00');
    var e = new Date(c.end   + 'T00:00:00');

    var months = [];
    var cur = new Date(s); cur.setDate(1);
    while (cur <= e){
      var m = cur.getMonth();
      var y = cur.getFullYear();
      if (y === 2025 && m <= 7) months.push(m);
      cur.setMonth(cur.getMonth() + 1);
      cur.setDate(1);
    }

    var share = months.length ? 1 / months.length : 0;
    for (var j=0; j<months.length; j++){
      var idx = months[j];
      ad[idx]  += (c.ad || 0)       * share;
      rev[idx] += (c.revenue || 0)  * share;
    }
  }

  var canvas = document.getElementById('trendChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  if (trendChart && trendChart.destroy) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Ad Spend',
          data: ad,
          backgroundColor: 'rgba(255,199,177,0.85)', // Peach #FFC7B1
          borderColor:     '#FFC7B1',
          borderWidth: 1
        },
        {
          label: 'Media Revenue',
          data: rev,
          backgroundColor: 'rgba(192,155,191,0.85)', // Mauve #C09BBF
          borderColor:     '#C09BBF',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { size: 18 } } },
        title:  { display: false }
      },
      layout: { padding: { top: 4, right: 8, bottom: 18, left: 8 } },
      scales: {
        x: { ticks: { font: { size: 16 } } },
        y: {
          beginAtZero: true,
          ticks: {
            font: { size: 16 },
            callback: function(v){ return fmtMoney0(v); }
          }
        }
      }
    }
  });
}

// Verteile Kampagnen (gefilterte Liste) gleichmäßig auf beteiligte Monate (Jan–Aug 2025)
function monthlyBreakdown(list){
  var months = []; for (var i=0; i<8; i++) months.push({impressions:0, clicks:0, ad:0, revenue:0, orders:0});
  list = list || [];

  function sumProducts(c, field){
    if (!c || !c.products) return 0;
    var s=0; for (var i=0;i<c.products.length;i++) s += (c.products[i][field]||0);
    return s;
  }

  for (var i=0; i<list.length; i++){
    var c = list[i];
    var s = new Date(c.start+'T00:00:00');
    var e = new Date(c.end+'T00:00:00');

    var spans=[], cur=new Date(s); cur.setDate(1);
    while(cur<=e){
      var m=cur.getMonth(), y=cur.getFullYear();
      if (y===2025 && m<=7) spans.push(m); // Jan(0)..Aug(7) 2025
      cur.setMonth(cur.getMonth()+1); cur.setDate(1);
    }
    var share = spans.length ? 1/spans.length : 0;

    var rev = c.products ? sumProducts(c,'revenue') : (c.revenue||0);
    var ord = c.products ? sumProducts(c,'units')   : (c.orders ||0);

    for (var j=0;j<spans.length;j++){
      var idx = spans[j];
      months[idx].impressions += (c.impressions||0)*share;
      months[idx].clicks      += (c.clicks||0)*share;
      months[idx].ad          += (c.ad||0)*share;
      months[idx].revenue     +=  rev*share;
      months[idx].orders      +=  ord*share;
    }
  }

  // abgeleitete Kennzahlen je Monat
  for (var k=0;k<8;k++){
    var m = months[k];
    m.ctr  = safeDiv(m.clicks, m.impressions);
    m.cpc  = safeDiv(m.ad, m.clicks);
    m.cpm  = safeDiv(m.ad, m.impressions/1000);
    m.roas = safeDiv(m.revenue, m.ad);
  }
  return months;
}


/* === SoV-KPI + Funnel-Segmentbar === */
function renderSOVandFunnel(){
  var box = document.getElementById('kpiGrid');
  if (!box) return;

  // SoV-KPI
  var sov = (window.DASHBOARD_DATA && window.DASHBOARD_DATA.sov) ? window.DASHBOARD_DATA.sov.total : null;
  if (sov != null) {
    var k = document.createElement('div');
    k.className = 'kpi kpi-sov';
    k.innerHTML =
      '<div class="label">Share of Voice</div>' +
      '<div class="value">'+ ((sov*100).toFixed(0)) + '%</div>' +
      '<div class="delta neutral"><span class="arrow"></span><span>Details</span></div>';
    k.addEventListener('click', function(){
      var url='share.html?scope='+encodeURIComponent(STATE.filter);
      window.location.href = url;
    });
    box.appendChild(k);
  }

// Funnel-Segmentbar
var f = (window.DASHBOARD_DATA && window.DASHBOARD_DATA.funnel) ? window.DASHBOARD_DATA.funnel : null;
if (f) {
  var aw = Math.max(0, Math.min(1, f.awareness||0));
  var en = Math.max(0, Math.min(1, f.engagement||0));
  var pe = Math.max(0, Math.min(1, f.performance||0));
  var sum = aw+en+pe || 1;
  aw/=sum; en/=sum; pe/=sum;

  var c = document.createElement('div');
  c.className = 'kpi kpi-funnel'; // <-- breiter (span 2)
  c.innerHTML =
    '<div class="label">Funnel Mix</div>' +
    '<div class="segment">' +
      '<div class="segment-labels">Awareness<span class="sep">/</span>Engagement<span class="sep">/</span>Performance</div>' +
      '<div class="segment-bar">' +
        '<div class="segment-chunk segment-aw" style="width:'+(aw*100).toFixed(0)+'%">'+ (aw*100).toFixed(0)+'%</div>' +
        '<div class="segment-chunk segment-en" style="width:'+(en*100).toFixed(0)+'%">'+ (en*100).toFixed(0)+'%</div>' +
        '<div class="segment-chunk segment-pe" style="width:'+(pe*100).toFixed(0)+'%">'+ (pe*100).toFixed(0)+'%</div>' +
      '</div>' +
    '</div>';
  box.appendChild(c);
}}


/* ========= Campaign Overview/Table ========= */
function renderCampaignOverview(all){
  all=all||[]; var t=totals(all), now=new Date(), active=0, ended=0;
  for (var i=0;i<all.length;i++){
    var cs=all[i];
    if(new Date(cs.start)<=now && now<=new Date(cs.end)) active++;
    if(new Date(cs.end)< now) ended++;
  }
  var el;
  el=document.getElementById('ov-count-total'); if(el) el.textContent=fmtNum(all.length);
  el=document.getElementById('ov-count-active'); if(el) el.textContent=fmtNum(active);
  el=document.getElementById('ov-count-ended'); if(el) el.textContent=fmtNum(ended);
  el=document.getElementById('ov-booking'); if(el) el.textContent=fmtMoney0(t.booking);
  el=document.getElementById('ov-ad'); if(el) el.textContent=fmtMoney0(t.ad);
  el=document.getElementById('ov-delivered'); if(el) el.textContent=(t.delivered*100).toFixed(0)+'%';
}
function renderCampaignTable(list, allList){
  list = list || []; allList = allList || [];
  var tbody = document.querySelector('#campaignTable tbody'); if(!tbody) return;
  tbody.innerHTML = '';

  // sortieren (Beispiel: nach Ad Spend)
  var sorted = list.slice().sort(function(a,b){ return (b.ad||0)-(a.ad||0); });

  for (var i=0; i<sorted.length; i++){
    var c = sorted[i];
    var roas = safeDiv(c.revenue, c.ad);
    var flight = c.start.slice(8,10)+'.'+c.start.slice(5,7)+'.'+c.start.slice(0,4)+'–'+
                 c.end.slice(8,10)+'.'+c.end.slice(5,7)+'.'+c.end.slice(0,4);

    var cid = 'camp_' + i;
    var hasPlacements = Array.isArray(c.placements) && c.placements.length > 0;

    // === Kampagnenzeile
    var tr = document.createElement('tr');
    tr.className = 'parent';
    tr.setAttribute('data-cid', cid);
    tr.innerHTML =
      '<td class="expcol">'+ (hasPlacements
         ? '<button class="expander" aria-expanded="false" data-target="'+cid+'">+</button>'
         : '') + '</td>'+
      '<td>'+ (c.name||'—') +'</td>'+
      '<td>'+ (c.brand||'—') +'</td>'+           // Brand auf Kampagnen-Ebene
      '<td>'+ (c.site||'—') +'</td>'+
      '<td>'+ (c.model||'—') +'</td>'+
      '<td>'+ flight +'</td>'+
      '<td>—</td>'+                             // Strategy nur auf Platzierungs-Ebene
      '<td>—</td>'+                             // Type nur auf Platzierungs-Ebene
      '<td class="right">'+fmtNum(Math.round(c.impressions||0))+'</td>'+
      '<td class="right">'+fmtNum(Math.round(c.clicks||0))+'</td>'+
      '<td class="right">'+fmtPct1(safeDiv(c.clicks,c.impressions))+'</td>'+
      '<td class="right">'+fmtMoney0(c.ad||0)+'</td>'+
      '<td class="right">'+fmtMoney0(c.revenue||0)+'</td>'+
      '<td class="right">'+(roas||0).toFixed(2)+'×</td>'+
      '<td class="right">'+fmtNum(Math.round(c.orders||0))+'</td>';
    tbody.appendChild(tr);

    // === Platzierungen (falls vorhanden)
    if (hasPlacements){
      for (var j=0; j<c.placements.length; j++){
        var p = c.placements[j] || {};
        var rev = (typeof p.revenue === 'number') ? p.revenue : (p.ad||0)*(p.roas||0);
        var sub = document.createElement('tr');
        sub.className = 'subrow hidden child-of-'+cid;
        sub.innerHTML =
          '<td></td>'+ // kein Expander
          '<td class="indent">↳ '+ (p.placement||'Placement') +'</td>'+
          '<td>—</td>'+                                    // Brand bleibt oben
          '<td>—</td>'+                                    // Site optional
          '<td>—</td>'+                                    // Model optional
          '<td>—</td>'+                                    // Flight nicht auf Platzierung
          '<td>'+ (p.strategy||'—') +'</td>'+
          '<td>'+ (p.type||'—') +'</td>'+
          '<td class="right">'+fmtNum(Math.round(p.impressions||0))+'</td>'+
          '<td class="right">'+fmtNum(Math.round(p.clicks||0))+'</td>'+
          '<td class="right">'+fmtPct1(safeDiv(p.clicks,p.impressions))+'</td>'+
          '<td class="right">'+fmtMoney0(p.ad||0)+'</td>'+
          '<td class="right">'+fmtMoney0(rev||0)+'</td>'+
          '<td class="right">'+(p.roas||safeDiv(rev,p.ad)||0).toFixed(2)+'×</td>'+
          '<td class="right">'+fmtNum(Math.round(p.orders||0))+'</td>';
        tbody.appendChild(sub);
      }
    }
  }

  // Toggle einmalig binden (Event-Delegation)
  if (!tbody.__boundExpander){
    tbody.addEventListener('click', function(e){
      var btn = e.target.closest('.expander'); if(!btn) return;
      var cid = btn.getAttribute('data-target'); if(!cid) return;
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      btn.textContent = open ? '+' : '–';
      var rows = tbody.querySelectorAll('.child-of-'+cid);
      for (var r=0; r<rows.length; r++){
        rows[r].classList.toggle('hidden', open);
      }
    });
    tbody.__boundExpander = true;
  }

  // Summenzeilen (angepasst auf neue Spaltenzahl)
  var sumF = totals(list), sumA = totals(allList);
  var r1 = document.getElementById('campaignFilterRow'),
      r2 = document.getElementById('campaignGrandRow');

  var prefixCells = '<td></td><td><b>'; // expcol + Campaign Titel öffnet
  var midCells    = '</b></td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td>';

  if(r1) r1.innerHTML =
    prefixCells+'Summe (Filter)'+midCells+
    '<td class="right">'+fmtNum(Math.round(sumF.impressions))+'</td>'+
    '<td class="right">'+fmtNum(Math.round(sumF.clicks))+'</td>'+
    '<td class="right">'+fmtPct1(sumF.ctr)+'</td>'+
    '<td class="right">'+fmtMoney0(sumF.ad)+'</td>'+
    '<td class="right">'+fmtMoney0(sumF.revenue)+'</td>'+
    '<td class="right">'+(sumF.roas||0).toFixed(2)+'×</td>'+
    '<td class="right">'+fmtNum(Math.round(sumF.orders))+'</td>';

  if(r2) r2.innerHTML =
    prefixCells+'Gesamt (Alle)'+midCells+
    '<td class="right">'+fmtNum(Math.round(sumA.impressions))+'</td>'+
    '<td class="right">'+fmtNum(Math.round(sumA.clicks))+'</td>'+
    '<td class="right">'+fmtPct1(sumA.ctr)+'</td>'+
    '<td class="right">'+fmtMoney0(sumA.ad)+'</td>'+
    '<td class="right">'+fmtMoney0(sumA.revenue)+'</td>'+
    '<td class="right">'+(sumA.roas||0).toFixed(2)+'×</td>'+
    '<td class="right">'+fmtNum(Math.round(sumA.orders))+'</td>';
}


/* ========= Re-Rank ========= */
function renderRerankOverview(rerankList, salesDetails){
  rerankList = rerankList || [];
  salesDetails = salesDetails || [];

  // Summen
  var totalAd = 0, totalClicks = 0, totalRevenue = 0;
  for (var i=0;i<rerankList.length;i++){
    var r = rerankList[i];
    var clicks = r.ecpc > 0 ? (r.ad / r.ecpc) : 0;
    totalAd      += (r.ad || 0);
    totalClicks  += clicks;
    totalRevenue += (r.roas || 0) * (r.ad || 0);
  }
  var ecpcWeighted = safeDiv(totalAd, totalClicks);
  var roasWeighted = safeDiv(totalRevenue, totalAd);

  // Budget aus data.js (Fallback: = Spend). Alternativ: Summe von r.budget, wenn gepflegt
  var D = (window.DASHBOARD_DATA || {});
  var budgetTotal = (typeof D.rerank_budget === 'number')
      ? D.rerank_budget
      : totalAd;
  // Falls Du pro SKU Budget pflegen willst:
  // var budgetTotal = rerankList.reduce((s,r)=>s+(r.budget||0),0) || totalAd;

  var pctSpend = budgetTotal ? Math.min(1, totalAd / budgetTotal) : 0;

  // Sales gesamt (über Namen matchen)
  var nameToUnits = {};
  for (var s=0; s<salesDetails.length; s++){
    var n = String(salesDetails[s].name||'').toLowerCase();
    nameToUnits[n] = (nameToUnits[n]||0) + (salesDetails[s].units||0);
  }
  var salesUnits = 0;
  for (var j=0;j<rerankList.length;j++){
    var key = String(rerankList[j].item||'').toLowerCase();
    salesUnits += (nameToUnits[key]||0);
  }

  // Write
  var el;
  el=document.getElementById('rr-budget');   if(el) el.textContent=fmtMoney0(budgetTotal);
  el=document.getElementById('rr-ad');       if(el) el.textContent=fmtMoney0(totalAd);
  el=document.getElementById('rr-clicks');   if(el) el.textContent=fmtNum(Math.round(totalClicks));
  el=document.getElementById('rr-ecpc');     if(el) el.textContent=fmtMoney2(ecpcWeighted);
  el=document.getElementById('rr-pct');      if(el) el.textContent=((pctSpend*100)||0).toFixed(0)+'%';
  el=document.getElementById('rr-sales');    if(el) el.textContent=salesUnits?fmtNum(salesUnits):'—';
  el=document.getElementById('rr-revenue');  if(el) el.textContent=fmtMoney0(totalRevenue);
  el=document.getElementById('rr-roas');     if(el) el.textContent=(roasWeighted||0).toFixed(2)+'×';
}

function renderRerank(list){
  list = list || [];
  var tbody = document.querySelector('#rerankTable tbody'); if(!tbody) return;
  tbody.innerHTML = '';

  // Map Sales (units) per Productname
  var unitsByName = {};
  var sales = ((window.DASHBOARD_DATA||{}).sales_details)||[];
  for (var i=0;i<sales.length;i++){
    var nm = String(sales[i].name||'').toLowerCase();
    unitsByName[nm] = (unitsByName[nm]||0) + (sales[i].units||0);
  }

  // Rows + Totals
  var totals = { ad:0, clicks:0, units:0, revenue:0 };
  var rows = [];
  for (var j=0;j<list.length;j++){
    var r = list[j];
    var clicks = r.ecpc>0 ? (r.ad/r.ecpc) : 0;
    var revenue = (r.roas||0)*(r.ad||0);
    var units = unitsByName[String(r.item||'').toLowerCase()] || 0;

    rows.push({
      sku:r.sku, item:r.item, ad:(r.ad||0),
      ecpc:(r.ecpc||0), roas:(r.roas||0),
      clicks: clicks, revenue: revenue, units: units
    });

    totals.ad += (r.ad||0);
    totals.clicks += clicks;
    totals.units += units;
    totals.revenue += revenue;
  }
  rows.sort(function(a,b){ return (b.revenue||0)-(a.revenue||0); });

  for (var k=0;k<rows.length;k++){
    var x = rows[k];
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>'+x.sku+' — '+x.item+'</td>'+
      '<td class="right">'+fmtMoney0(x.ad)+'</td>'+
      '<td class="right">'+fmtNum(Math.round(x.clicks))+'</td>'+
      '<td class="right">'+fmtMoney2(x.ecpc)+'</td>'+
      '<td class="right">'+fmtNum(Math.round(x.units))+'</td>'+
      '<td class="right">'+fmtMoney0(x.revenue)+'</td>'+
      '<td class="right">'+(x.roas||0).toFixed(2)+'×</td>';
    tbody.appendChild(tr);
  }

  var tfoot = document.getElementById('rerankTotalRow');
  if (tfoot){
    var roasTotal = safeDiv(totals.revenue, totals.ad);
    var ecpcTot = safeDiv(totals.ad, totals.clicks);
    tfoot.innerHTML =
      '<td><b>Gesamt</b></td>'+
      '<td class="right"><b>'+fmtMoney0(totals.ad)+'</b></td>'+
      '<td class="right"><b>'+fmtNum(Math.round(totals.clicks))+'</b></td>'+
      '<td class="right"><b>'+fmtMoney2(ecpcTot)+'</b></td>'+
      '<td class="right"><b>'+fmtNum(Math.round(totals.units))+'</b></td>'+
      '<td class="right"><b>'+fmtMoney0(totals.revenue)+'</b></td>'+
      '<td class="right"><b>'+(roasTotal||0).toFixed(2)+'×</b></td>';
  }
}


function renderMonthlyTable(monthsData, grandTotals){
  var tbody = document.querySelector('#monthlyTable tbody');
  if (!tbody) return;
  var sovVal = (window.DASHBOARD_DATA && window.DASHBOARD_DATA.sov) ? window.DASHBOARD_DATA.sov.total : null;

  var labels = MONTHS.slice(0,8); // Jan..Aug

  var rowsHtml = '';
  for (var i=0;i<8;i++){
    var m = monthsData[i];
    rowsHtml += '<tr>' +
      '<td>'+labels[i]+'</td>' +
      '<td class="right">'+fmtNum(Math.round(m.impressions))+'</td>' +
      '<td class="right">'+fmtNum(Math.round(m.clicks))+'</td>' +
      '<td class="right">'+fmtPct1(m.ctr)+'</td>' +
      '<td class="right">'+fmtMoney0(m.ad)+'</td>' +
      '<td class="right">'+fmtMoney2(m.cpc)+'</td>' +
      '<td class="right">'+fmtMoney2(m.cpm)+'</td>' +
      '<td class="right">'+fmtNum(Math.round(m.orders))+'</td>' +
      '<td class="right">'+fmtMoney0(m.revenue)+'</td>' +
      '<td class="right">'+(m.roas||0).toFixed(2)+'×</td>' +
      '<td class="right">'+(sovVal!=null? ((sovVal*100).toFixed(0)+'%') : '—')+'</td>' +
    '</tr>';
  }
  tbody.innerHTML = rowsHtml;

  // Summe-Zeile (soll den KPI-Totals entsprechen)
  var tr = document.getElementById('monthlyTotalRow');
  if (tr && grandTotals){
    tr.innerHTML =
      '<td><b>Summe</b></td>' +
      '<td class="right"><b>'+fmtNum(Math.round(grandTotals.impressions))+'</b></td>' +
      '<td class="right"><b>'+fmtNum(Math.round(grandTotals.clicks))+'</b></td>' +
      '<td class="right"><b>'+fmtPct1(grandTotals.ctr)+'</b></td>' +
      '<td class="right"><b>'+fmtMoney0(grandTotals.ad)+'</b></td>' +
      '<td class="right"><b>'+fmtMoney2(grandTotals.cpc)+'</b></td>' +
      '<td class="right"><b>'+fmtMoney2(grandTotals.cpm)+'</b></td>' +
      '<td class="right"><b>'+fmtNum(Math.round(grandTotals.orders))+'</b></td>' +
      '<td class="right"><b>'+fmtMoney0(grandTotals.revenue)+'</b></td>' +
      '<td class="right"><b>'+(grandTotals.roas||0).toFixed(2)+'×</b></td>' +
      '<td class="right"><b>'+(sovVal!=null? ((sovVal*100).toFixed(0)+'%') : '—')+'</b></td>';
  }
}


/* ========= Interaktion ========= */
function bindChips(){
  var bar=document.getElementById('filterChips'); if(!bar) return;
  bar.addEventListener('click',function(e){
    var t=e.target; while(t && (!t.className || t.className.indexOf('chip')===-1)) t=t.parentNode;
    if(!t) return;
    var chips=bar.querySelectorAll('.chip');
    for (var i=0;i<chips.length;i++) chips[i].classList.remove('active');
    t.classList.add('active');
    STATE.filter=t.getAttribute('data-filter');
    renderAll();
  });
}

/* ========= Render All ========= */
function renderAll(){
  var list25  = __guard('filter 2025',  function(){ return applyFilter(ALL_2025, STATE.filter); });
  var monthly = __guard('monthly breakdown', function(){ return monthlyBreakdown(list25); });
  var list24  = __guard('filter 2024',  function(){ return applyFilter(ALL_2024, STATE.filter); });
  var t25     = __guard('totals 2025',  function(){ return totals(list25); });
  var t24     = __guard('totals 2024',  function(){ return totals(list24); });

  __guard('renderKPIs',         function(){ renderKPIs(t25, t24); });
  __guard('renderSOVandFunnel', function(){ renderSOVandFunnel(); });

  __guard('autoSizeChart',      function(){ autoSizeChart(); });
  __guard('renderTrend',        function(){ renderTrend(list25); });

  __guard('monthly table',      function(){ renderMonthlyTable(monthly, t25); });

  __guard('overview campaigns', function(){ renderCampaignOverview(ALL_2025); });
  __guard('table campaigns',    function(){ renderCampaignTable(list25, ALL_2025); });
  __guard('rerank overview',    function(){ renderRerankOverview((D||{}).rerank||[], (D||{}).sales_details||[]); });
  __guard('rerank table',       function(){ renderRerank((D||{}).rerank||[]); });

  window.__appRendered = true;
}


/* ========= Boot ========= */
window.addEventListener('resize',function(){
  var cfg=window.DASHBOARD_LAYOUT||{};
  if(cfg.mode!=='scroll'){ fitStageFixed(); autoSizeChart(); if(window.trendChart && trendChart.resize) trendChart.resize(); }
});
document.addEventListener('DOMContentLoaded',function(){
  try{
    applyLayoutConfig();
    bindChips();
    renderAll();
  }catch(e){ __report('BOOT', e); }
});
