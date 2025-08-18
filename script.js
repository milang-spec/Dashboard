/* ========= Utils ========= */
const fmtMoney0 = n => n.toLocaleString('de-DE', { style:'currency', currency:'EUR', maximumFractionDigits:0 });
const fmtMoney1 = n => n.toLocaleString('de-DE', { style:'currency', currency:'EUR', minimumFractionDigits:2, maximumFractionDigits:2 });
const fmtNum = n => n.toLocaleString('de-DE');

/* ========= Bühne skalieren (Fixed Base) ========= */
const BASE = { w:1920, h:1080 };
function fitStage() {
  const stage = document.getElementById('stage');
  const s = Math.min(window.innerWidth / BASE.w, window.innerHeight / BASE.h);
  stage.style.transform = `scale(${s})`;
  const x = (window.innerWidth - BASE.w * s) / 2;
  const y = (window.innerHeight - BASE.h * s) / 2;
  stage.style.left = `${x}px`;
  stage.style.top  = `${y}px`;
}
window.addEventListener('resize', fitStage);

/* ========= Daten ========= */
const data = window.DASHBOARD_DATA || { campaigns: [], rerank: [] };
const YEAR = 2025, LAST_MONTH = 8;
const MONTHS = ['Jan','Feb','Mrz','Apr','Mai','Jun','Jul','Aug'];
const MONTH_KEYS = Array.from({length: LAST_MONTH}, (_,i)=>`${YEAR}-${String(i+1).padStart(2,'0')}`);

function parseISO(d){ return new Date(d + 'T00:00:00'); }
function monthKey(dt){ return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`; }

/* Kampagnen gleichmäßig über beteiligte Monate (Jan–Aug) verteilen */
function aggregateMonthly(campaigns){
  const agg = Object.fromEntries(MONTH_KEYS.map(m => [m, { ad:0, revenue:0, orders:0 }]));
  campaigns.forEach(c => {
    const start = parseISO(c.start);
    const end   = parseISO(c.end);
    const months = [];
    let cur = new Date(start); cur.setDate(1);
    while (cur <= end) { const mk = monthKey(cur);
      if (cur.getFullYear()===YEAR && (cur.getMonth()+1)<=LAST_MONTH) months.push(mk);
      cur.setMonth(cur.getMonth()+1); cur.setDate(1);
    }
    if (!months.length) return;
    const share = 1 / months.length;
    months.forEach(mk => {
      agg[mk].ad      += c.ad      * share;
      agg[mk].revenue += c.revenue * share;
      agg[mk].orders  += c.orders  * share;
    });
  });
  return agg;
}

/* ========= Top-Totals (für KPIs & Gesamtzeile) ========= */
function calcTotals(campaigns){
  return campaigns.reduce((a,c)=>({
    booking: a.booking + c.booking,
    ad: a.ad + c.ad,
    revenue: a.revenue + c.revenue,
    orders: a.orders + c.orders
  }), {booking:0, ad:0, revenue:0, orders:0});
}

/* ========= Render: KPIs ========= */
function renderKPIs(totals){
  const roas = totals.ad ? (totals.revenue / totals.ad) : 0;
  const kpis = document.getElementById('kpis');
  kpis.innerHTML = '';
  [
    { label:'Revenue', value: fmtMoney0(totals.revenue) },
    { label:'Ad Spend', value: fmtMoney0(totals.ad) },
    { label:'ROAS', value: roas.toFixed(2) + '×' },
    { label:'Orders', value: fmtNum(Math.round(totals.orders)) }
  ].forEach(k => {
    const el = document.createElement('div');
    el.className = 'kpi';
    el.innerHTML = `<div class="label">${k.label}</div><div class="value">${k.value}</div>`;
    kpis.appendChild(el);
  });
}

/* ========= Render: Trend Chart & Monatstabelle ========= */
let trendChart;
function renderTrend(monthAgg){
  const ctx = document.getElementById('trendChart').getContext('2d');
  const labels = MONTHS;
  const ad = MONTH_KEYS.map(m => Math.round(monthAgg[m].ad));
  const rev = MONTH_KEYS.map(m => Math.round(monthAgg[m].revenue));

  if (trendChart) trendChart.destroy();
  Chart.defaults.font.size = 22;

  trendChart = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[
      { label:'Revenue', data:rev },
      { label:'Ad Spend', data:ad }
    ]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ labels:{ font:{ size:22 } } },
        title:{ display:true, text:'Revenue vs. Ad Spend', font:{ size:36 } },
        tooltip:{ enabled:true }
      },
      scales:{
        x:{ ticks:{ font:{ size:20 } } },
        y:{ beginAtZero:true, ticks:{ font:{ size:20 }, callback:v=>fmtMoney0(v) } }
      }
    }
  });

  // Monatstabelle
  const tbody = document.querySelector('#monthTable tbody');
  tbody.innerHTML = '';
  MONTH_KEYS.forEach((mk, i) => {
    const m = monthAgg[mk];
    const roas = m.ad ? m.revenue / m.ad : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${MONTHS[i]}</td>
      <td class="right">${fmtMoney0(m.revenue)}</td>
      <td class="right">${fmtMoney0(m.ad)}</td>
      <td class="right">${roas.toFixed(2)}×</td>
      <td class="right">${fmtNum(Math.round(m.orders))}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ========= Campaign Performance ========= */
function initCampaignDropdown(campaigns){
  const sel = document.getElementById('campaignSelect');
  const names = [...new Set(campaigns.map(c => c.name))].sort();
  sel.innerHTML = `<option value="__ALL__">Alle Kampagnen</option>` + names.map(n => `<option value="${encodeURIComponent(n)}">${n}</option>`).join('');
  sel.addEventListener('change', () => renderCampaignTable(campaigns));
}

function renderCampaignTable(allCampaigns){
  const sel = document.getElementById('campaignSelect');
  const val = sel.value;
  const rows = document.querySelector('#campaignTable tbody');
  rows.innerHTML = '';

  const filtered = (val === '__ALL__') ? allCampaigns : allCampaigns.filter(c => c.name === decodeURIComponent(val));
  const list = [...filtered].sort((a,b)=> b.ad - a.ad);

  list.forEach(c => {
    const delivered = c.booking ? (c.ad / c.booking) : 0;
    const roas = c.ad ? (c.revenue / c.ad) : 0;
    const tr = document.createElement('tr');
    const flight = `${c.start.slice(8,10)}.${c.start.slice(5,7)}.${c.start.slice(0,4)}–${c.end.slice(8,10)}.${c.end.slice(5,7)}.${c.end.slice(0,4)}`;
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${flight}</td>
      <td class="right">${fmtMoney0(c.booking)}</td>
      <td class="right">${fmtMoney0(c.ad)}</td>
      <td class="right">${(delivered*100).toFixed(0)}%</td>
      <td class="right">${fmtMoney0(c.revenue)}</td>
      <td class="right">${roas.toFixed(2)}×</td>
      <td class="right">${fmtNum(c.orders)}</td>
    `;
    rows.appendChild(tr);
  });

  // Gesamtzeile (immer ALLE Kampagnen, wie oben in den KPIs)
  const grand = calcTotals(allCampaigns);
  const grandRoas = grand.ad ? grand.revenue / grand.ad : 0;
  const grandDelivered = grand.booking ? grand.ad / grand.booking : 0;
  const trow = document.getElementById('campaignGrandRow');
  trow.innerHTML = `
    <td>Gesamt (Alle)</td>
    <td>—</td>
    <td class="right">${fmtMoney0(grand.booking)}</td>
    <td class="right">${fmtMoney0(grand.ad)}</td>
    <td class="right">${(grandDelivered*100).toFixed(0)}%</td>
    <td class="right">${fmtMoney0(grand.revenue)}</td>
    <td class="right">${grandRoas.toFixed(2)}×</td>
    <td class="right">${fmtNum(Math.round(grand.orders))}</td>
  `;
}

/* ========= Re-Rank ========= */
function renderRerank(rerank){
  const totals = rerank.reduce((a,r)=>({
    ad: a.ad + r.ad,
    clicks: a.clicks + (r.ecpc>0 ? (r.ad / r.ecpc) : 0),
    revenue: a.revenue + (r.roas * r.ad)
  }), {ad:0, clicks:0, revenue:0});

  const ecpc = totals.clicks ? (totals.ad / totals.clicks) : 0;
  const roas = totals.ad ? (totals.revenue / totals.ad) : 0;

  const kpis = document.getElementById('rerank-kpis');
  kpis.innerHTML = '';
  [
    { label:'Ad Spend', value: fmtMoney0(totals.ad) },
    { label:'Klicks',   value: fmtNum(Math.round(totals.clicks)) },
    { label:'eCPC',     value: fmtMoney1(ecpc) },
    { label:'Revenue',  value: fmtMoney0(totals.revenue) },
    { label:'ROAS',     value: roas.toFixed(2) + '×' }
  ].forEach(k => {
    const el = document.createElement('div');
    el.className = 'kpi';
    el.innerHTML = `<div class="label">${k.label}</div><div class="value">${k.value}</div>`;
    kpis.appendChild(el);
  });

  const rows = document.querySelector('#rerankTable tbody');
  rows.innerHTML = '';
  const sorted = [...rerank].map(r => ({
    ...r,
    clicks: (r.ecpc>0 ? (r.ad / r.ecpc) : 0),
    revenue: r.roas * r.ad
  })).sort((a,b)=> b.revenue - a.revenue);

  sorted.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.sku} — ${r.item}</td>
      <td class="right">${fmtMoney0(r.ad)}</td>
      <td class="right">${fmtNum(Math.round(r.clicks))}</td>
      <td class="right">${fmtMoney1(r.ecpc)}</td>
      <td class="right">${fmtMoney0(r.revenue)}</td>
      <td class="right">${(r.roas).toFixed(2)}×</td>
    `;
    rows.appendChild(tr);
  });
}

/* ========= Boot ========= */
document.addEventListener('DOMContentLoaded', () => {
  fitStage();

  const campaigns = data.campaigns.map(c => ({ ...c, roas: (c.ad ? c.revenue / c.ad : 0) }));
  const totals = calcTotals(campaigns);
  const monthAgg = aggregateMonthly(campaigns);

  renderKPIs(totals);
  renderTrend(monthAgg);
  initCampaignDropdown(campaigns);
  renderCampaignTable(campaigns);
  renderRerank(data.rerank);
});
