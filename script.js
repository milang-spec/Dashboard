/* ========= Utils ========= */
const fmtMoney0 = n => n.toLocaleString('de-DE', { style:'currency', currency:'EUR', maximumFractionDigits:0 });
const fmtMoney2 = n => n.toLocaleString('de-DE', { style:'currency', currency:'EUR', minimumFractionDigits:2, maximumFractionDigits:2 });
const fmtPct1   = n => (n*100).toFixed(1) + '%';
const fmtNum    = n => n.toLocaleString('de-DE');
const safeDiv   = (a,b) => (b ? (a/b) : 0);

/* ========= Fixed-Scale Bühne ========= */
const BASE = { w:1920, h:1080 };
function fitStage(){
  const stage = document.getElementById('stage');
  const s = Math.min(window.innerWidth/BASE.w, window.innerHeight/BASE.h);
  stage.style.transform = `scale(${s})`;
  stage.style.left = `${(window.innerWidth - BASE.w*s)/2}px`;
  stage.style.top  = `${(window.innerHeight - BASE.h*s)/2}px`;
}
window.addEventListener('resize', fitStage);

/* ========= Daten / State ========= */
const D = window.DASHBOARD_DATA;
const ALL_2025 = D.campaigns_2025;
const ALL_2024 = D.campaigns_2024;

const STATE = { filter: 'ALL' }; // ALL | ONSITE | OFFSITE | CPM | CPC
const MONTHS = ['Jan','Feb','Mrz','Apr','Mai','Jun','Jul','Aug'];

/* ========= Filterung ========= */
function predicateFor(filter){
  switch(filter){
    case 'ONSITE': return c => c.site === 'Onsite';
    case 'OFFSITE': return c => c.site === 'Offsite';
    case 'CPM': return c => c.model === 'CPM';
    case 'CPC': return c => c.model === 'CPC';
    default: return () => true;
  }
}
function applyFilter(list, filter){ return list.filter(predicateFor(filter)); }

/* ========= Totals / Aggregation ========= */
function totals(list){
  const t = list.reduce((a,c)=>({
    impressions: a.impressions + (c.impressions||0),
    clicks:      a.clicks      + (c.clicks||0),
    ad:          a.ad          + (c.ad||0),
    revenue:     a.revenue     + (c.revenue||0),
    orders:      a.orders      + (c.orders||0)
  }), {impressions:0, clicks:0, ad:0, revenue:0, orders:0});
  const ctr  = safeDiv(t.clicks, t.impressions);
  const roas = safeDiv(t.revenue, t.ad);
  const cpm  = safeDiv(t.ad, t.impressions/1000);
  const cpc  = safeDiv(t.ad, t.clicks);
  return { ...t, ctr, roas, cpm, cpc };
}

/* ========= KPI-Karten mit YoY ========= */
const KPI_DEF = [
  { key:'ad',        label:'Ad Spend Total',  fmt:fmtMoney0, better:'higher' },
  { key:'impressions', label:'Impressions Total', fmt:fmtNum, better:'higher' },
  { key:'clicks',    label:'Klicks Total',   fmt:fmtNum,    better:'higher' },
  { key:'ctr',       label:'CTR',            fmt:v=>fmtPct1(v), better:'higher' },
  { key:'orders',    label:'Media Sales Total', fmt:fmtNum,  better:'higher' },
  { key:'revenue',   label:'Media Revenue Total', fmt:fmtMoney0, better:'higher' },
  { key:'roas',      label:'ROAS',           fmt:v=>v.toFixed(2)+'×', better:'higher' },
  { key:'cpm',       label:'CPM',            fmt:fmtMoney2, better:'lower' },
  { key:'cpc',       label:'CPC',            fmt:fmtMoney2, better:'lower' }
];

function deltaInfo(cur, ly, better){
  if (!isFinite(ly) || ly === 0) return { cls:'neutral', txt:'—', arrow:'' };
  const diff = (cur - ly) / Math.abs(ly);
  const good = better === 'higher' ? diff > 0 : diff < 0;
  const bad  = better === 'higher' ? diff < 0 : diff > 0;
  const cls  = good ? 'up' : bad ? 'down' : 'neutral';
  const arrow = good ? '▲' : bad ? '▼' : '•';
  return { cls, txt: (diff*100).toFixed(1) + '%', arrow };
}

function renderKPIs(curTotals, lyTotals){
  const grid = document.getElementById('kpiGrid');
  grid.innerHTML = '';
  KPI_DEF.forEach(def => {
    const cur = curTotals[def.key] || 0;
    const ly  = lyTotals[def.key]  || 0;
    const d   = deltaInfo(cur, ly, def.better);
    const div = document.createElement('div');
    div.className = 'kpi';
    div.innerHTML = `
      <div class="label">${def.label}</div>
      <div class="value">${def.fmt(cur)}</div>
      <div class="delta ${d.cls}"><span class="arrow">${d.arrow}</span><span>${d.txt}</span> <span style="opacity:.7">vs LY</span></div>
    `;
    grid.appendChild(div);
  });
}

/* ========= Trend-Chart ========= */
let trendChart;
function renderTrend(list){
  // Aggregate pro Monat nach Flight-Overlap (gleichmäßige Verteilung)
  const monthTotals = Array.from({length:8}, ()=>({ad:0,revenue:0}));
  list.forEach(c => {
    const s = new Date(c.start + 'T00:00:00'), e = new Date(c.end + 'T00:00:00');
    const months = [];
    let cur = new Date(s); cur.setDate(1);
    while (cur <= e){
      const m = cur.getMonth(); const y = cur.getFullYear();
      if (y===2025 && m<=7) months.push(m);  // Jan..Aug index 0..7
      cur.setMonth(cur.getMonth()+1); cur.setDate(1);
    }
    const share = months.length ? 1/months.length : 0;
    months.forEach(m => { monthTotals[m].ad += c.ad*share; monthTotals[m].revenue += c.revenue*share; });
  });

  const ctx = document.getElementById('trendChart').getContext('2d');
  if (trendChart) trendChart.destroy();
  Chart.defaults.font.size = 18;

  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        { label:'Revenue', data: monthTotals.map(m=>m.revenue) },
        { label:'Ad Spend', data: monthTotals.map(m=>m.ad) }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ labels:{ font:{ size:18 } } },
        title:{ display:true, text:'Revenue vs. Ad Spend', font:{ size:28 } },
        tooltip:{ enabled:true }
      },
      scales:{
        x:{ ticks:{ font:{ size:16 } } },
        y:{ beginAtZero:true, ticks:{ font:{ size:16 }, callback:v=>fmtMoney0(v) } }
      }
    }
  });
}

/* ========= Campaign Table ========= */
function renderCampaignTable(list, allList){
  const tbody = document.querySelector('#campaignTable tbody');
  tbody.innerHTML = '';
  const sorted = [...list].sort((a,b)=> b.ad - a.ad);

  sorted.forEach(c => {
    const roas = safeDiv(c.revenue, c.ad);
    const tr = document.createElement('tr');
    const flight = `${c.start.slice(8,10)}.${c.start.slice(5,7)}.${c.start.slice(0,4)}–${c.end.slice(8,10)}.${c.end.slice(5,7)}.${c.end.slice(0,4)}`;
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${c.site}</td>
      <td>${c.model}</td>
      <td>${flight}</td>
      <td class="right">${fmtNum(Math.round(c.impressions))}</td>
      <td class="right">${fmtNum(Math.round(c.clicks))}</td>
      <td class="right">${fmtPct1(safeDiv(c.clicks, c.impressions))}</td>
      <td class="right">${fmtMoney0(c.ad)}</td>
      <td class="right">${fmtMoney0(c.revenue)}</td>
      <td class="right">${roas.toFixed(2)}×</td>
      <td class="right">${fmtNum(c.orders)}</td>
    `;
    tbody.appendChild(tr);
  });

  // Fußzeilen: Summe(Filter) & Gesamt(Alle)
  const sumF = totals(list);
  const sumA = totals(allList);
  document.getElementById('campaignFilterRow').innerHTML = `
    <td>Summe (Filter)</td><td>—</td><td>—</td><td>—</td>
    <td class="right">${fmtNum(Math.round(sumF.impressions))}</td>
    <td class="right">${fmtNum(Math.round(sumF.clicks))}</td>
    <td class="right">${fmtPct1(sumF.ctr)}</td>
    <td class="right">${fmtMoney0(sumF.ad)}</td>
    <td class="right">${fmtMoney0(sumF.revenue)}</td>
    <td class="right">${sumF.roas.toFixed(2)}×</td>
    <td class="right">${fmtNum(Math.round(sumF.orders))}</td>
  `;
  document.getElementById('campaignGrandRow').innerHTML = `
    <td>Gesamt (Alle)</td><td>—</td><td>—</td><td>—</td>
    <td class="right">${fmtNum(Math.round(sumA.impressions))}</td>
    <td class="right">${fmtNum(Math.round(sumA.clicks))}</td>
    <td class="right">${fmtPct1(sumA.ctr)}</td>
    <td class="right">${fmtMoney0(sumA.ad)}</td>
    <td class="right">${fmtMoney0(sumA.revenue)}</td>
    <td class="right">${sumA.roas.toFixed(2)}×</td>
    <td class="right">${fmtNum(Math.round(sumA.orders))}</td>
  `;
}

/* ========= Re-Rank ========= */
function renderRerank(list){
  const tbody = document.querySelector('#rerankTable tbody');
  tbody.innerHTML = '';
  const rows = [...list].map(r => ({
    ...r,
    clicks: r.ecpc>0 ? (r.ad / r.ecpc) : 0,
    revenue: r.roas * r.ad
  })).sort((a,b)=> b.revenue - a.revenue);

  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.sku} — ${r.item}</td>
      <td class="right">${fmtMoney0(r.ad)}</td>
      <td class="right">${fmtNum(Math.round(r.clicks))}</td>
      <td class="right">${fmtMoney2(r.ecpc)}</td>
      <td class="right">${fmtMoney0(r.revenue)}</td>
      <td class="right">${r.roas.toFixed(2)}×</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ========= Interaktion ========= */
function bindChips(){
  const bar = document.getElementById('filterChips');
  bar.addEventListener('click', (e)=>{
    const chip = e.target.closest('.chip');
    if(!chip) return;
    bar.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    STATE.filter = chip.dataset.filter;
    renderAll();
  });
}

/* ========= Render All ========= */
let trendChartOnce;
function renderAll(){
  const list25 = applyFilter(ALL_2025, STATE.filter);
  const list24 = applyFilter(ALL_2024, STATE.filter);
  const t25 = totals(list25);
  const t24 = totals(list24);

  renderKPIs(t25, t24);
  renderTrend(list25);
  renderCampaignTable(list25, ALL_2025);
  if (!trendChartOnce) trendChartOnce = true;
}

/* ========= Boot ========= */
document.addEventListener('DOMContentLoaded', () => {
  fitStage();
  bindChips();
  renderRerank(D.rerank);
  renderAll();
});
