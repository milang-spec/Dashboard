/* ========= Utils ========= */
const fmtMoney0 = n => n.toLocaleString('de-DE', { style:'currency', currency:'EUR', maximumFractionDigits:0 });
const fmtMoney1 = n => n.toLocaleString('de-DE', { style:'currency', currency:'EUR', maximumFractionDigits:1 });
const fmtNum = n => n.toLocaleString('de-DE');
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

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

/* ========= Datenzugriff ========= */
const data = window.DASHBOARD_DATA || { campaigns: [], rerank: [] };

/* Months Jan..Aug 2025 Keys */
const YEAR = 2025, LAST_MONTH = 8;
const MONTH_KEYS = Array.from({length: LAST_MONTH}, (_,i)=>`${YEAR}-${String(i+1).padStart(2,'0')}`);

function parseISO(d){ return new Date(d + 'T00:00:00'); }
function monthKey(dt){ return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`; }

/* Verteile Kampagnenwerte gleichmäßig auf überlappte Monate Jan..Aug 2025 */
function aggregateMonthly(campaigns){
  const agg = Object.fromEntries(MONTH_KEYS.map(m => [m, { ad:0, revenue:0, orders:0 }]));
  campaigns.forEach(c => {
    const start = parseISO(c.start);
    const end   = parseISO(c.end);
    const rangeMonths = [];
    let cur = new Date(start);
    cur.setDate(1);
    while (cur <= end) {
      const mk = monthKey(cur);
      if (cur.getFullYear() === YEAR && cur.getMonth()+1 <= LAST_MONTH) {
        rangeMonths.push(mk);
      }
      // next month
      cur.setMonth(cur.getMonth()+1);
      cur.setDate(1);
    }
    if (rangeMonths.length === 0) return;
    const share = 1 / rangeMonths.length;
    rangeMonths.forEach(mk => {
      agg[mk].ad      += c.ad      * share;
      agg[mk].revenue += c.revenue * share;
      agg[mk].orders  += c.orders  * share;
    });
  });
  return agg;
}

/* ========= Render: KPIs ========= */
function renderKPIs(campaigns){
  const totals = campaigns.reduce((a,c)=>({
    ad: a.ad + c.ad,
    revenue: a.revenue + c.revenue,
    orders: a.orders + c.orders
  }), {ad:0,revenue:0,orders:0});
  const roas = totals.ad ? (totals.revenue / totals.ad) : 0;

  const kpis = document.getElementById('kpis');
  kpis.innerHTML = '';
  const items = [
    { label:'Revenue', value: fmtMoney0(totals.revenue) },
    { label:'Ad Spend', value: fmtMoney0(totals.ad) },
    { label:'ROAS', value: (roas.toFixed(2) + '×') },
    { label:'Orders', value: fmtNum(Math.round(totals.orders)) }
  ];
  items.forEach(k => {
    const el = document.createElement('div');
    el.className = 'kpi';
    el.innerHTML = `<div class="label">${k.label}</div><div class="value">${k.value}</div>`;
    kpis.appendChild(el);
  });
}

/* ========= Render: Trend Chart ========= */
let trendChart;
function renderTrendChart(monthAgg){
  const ctx = document.getElementById('trendChart').getContext('2d');
  const labels = MONTH_KEYS.map(m => {
    const [,mm] = m.split('-');
    const mon = ['Jan','Feb','Mrz','Apr','Mai','Jun','Jul','Aug'][Number(mm)-1];
    return mon;
  });
  const ad = MONTH_KEYS.map(m => Math.round(monthAgg[m].ad));
  const rev = MONTH_KEYS.map(m => Math.round(monthAgg[m].revenue));

  if (trendChart) trendChart.destroy();

  // Globale Schriftgrößen für TV
  Chart.defaults.font.size = 24;

  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Revenue', data: rev },
        { label: 'Ad Spend', data: ad }
      ]
    },
    options: {
      responsive:true,
      maintainAspectRatio:false,
      plugins: {
        legend: { labels: { font:{ size:24 } } },
        title:  { display:true, text:'Revenue vs. Ad Spend', font:{ size:40 } },
        tooltip:{ enabled:true }
      },
      scales: {
        x: { ticks: { font:{ size:24 } } },
        y: {
          ticks: {
            font:{ size:24 },
            callback: v => fmtMoney0(v)
          },
          beginAtZero:true
        }
      }
    }
  });
}

/* ========= Render: Campaign Performance (mit Dropdown) ========= */
function initCampaignDropdown(campaigns){
  const sel = document.getElementById('campaignSelect');
  const names = [...new Set(campaigns.map(c => c.name))].sort();
  sel.innerHTML = `<option value="__ALL__">Alle Kampagnen</option>` + names.map(n => `<option value="${encodeURIComponent(n)}">${n}</option>`).join('');
  sel.addEventListener('change', () => renderCampaignTable(campaigns));
}

function renderCampaignTable(campaigns){
  const sel = document.getElementById('campaignSelect');
  const val = sel.value;
  const rows = document.querySelector('#campaignTable tbody');
  rows.innerHTML = '';

  const filtered = (val === '__ALL__')
    ? campaigns
    : campaigns.filter(c => c.name === decodeURIComponent(val));

  // Sortierung: Ad Spend absteigend
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

  // Summenzeile (bei Filter: Summe des Filters)
  if (list.length > 1) {
    const tot = list.reduce((a,c)=>({
      booking: a.booking + c.booking,
      ad: a.ad + c.ad,
      revenue: a.revenue + c.revenue,
      orders: a.orders + c.orders
    }), {booking:0, ad:0, revenue:0, orders:0});
    const roas = tot.ad ? tot.revenue / tot.ad : 0;
    const delivered = tot.booking ? tot.ad / tot.booking : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>Summe</strong></td>
      <td>—</td>
      <td class="right"><strong>${fmtMoney0(tot.booking)}</strong></td>
      <td class="right"><strong>${fmtMoney0(tot.ad)}</strong></td>
      <td class="right"><strong>${(delivered*100).toFixed(0)}%</strong></td>
      <td class="right"><strong>${fmtMoney0(tot.revenue)}</strong></td>
      <td class="right"><strong>${roas.toFixed(2)}×</strong></td>
      <td class="right"><strong>${fmtNum(tot.orders)}</strong></td>
    `;
    rows.appendChild(tr);
  }
}

/* ========= Render: Re-Rank ========= */
function renderRerank(rerank){
  // Totals mit korrekter Klick-Berechnung pro Zeile
  const totals = rerank.reduce((a,r)=>({
    ad: a.ad + r.ad,
    clicks: a.clicks + (r.ecpc > 0 ? (r.ad / r.ecpc) : 0),
    revenue: a.revenue + (r.roas * r.ad)
  }), {ad:0, clicks:0, revenue:0});

  const ecpc = totals.clicks ? (totals.ad / totals.clicks) : 0;
  const roas = totals.ad ? (totals.revenue / totals.ad) : 0;

  // KPI-Block
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

  // Tabelle: Top-Items nach Revenue
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

  const campaigns = data.campaigns.map(c => ({
    ...c,
    // Falls roas fehlt/inkonsistent, robust berechnen
    roas: (c.ad ? c.revenue / c.ad : 0)
  }));

  const monthAgg = aggregateMonthly(campaigns);
  renderKPIs(campaigns);
  renderTrendChart(monthAgg);
  initCampaignDropdown(campaigns);
  renderCampaignTable(campaigns);
  renderRerank(data.rerank);
});
