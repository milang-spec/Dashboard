// script.js
(function(){
  // -------- Utils --------
  const fmt = new Intl.NumberFormat('de-DE');
  const fmoney = v => fmt.format(Math.round(v)) + " €";
  const fnum   = v => fmt.format(Math.round(v));
  const fperc  = v => (v*100).toFixed(1) + "%";
  const rndChange = () => (Math.random()*0.2 - 0.1); // ±10%
  const changeHTML = c => {
    const arrow = c >= 0 ? '▲' : '▼';
    const color = c >= 0 ? '#16a34a' : '#dc2626';
    return `<div style="font-size:.8rem;color:${color};font-weight:600">${arrow} ${(c*100).toFixed(1)}%</div>`;
  };

  const byFilter = f => {
    if(!f || f==="all") return campaigns;
    if(f==="Onsite"||f==="Offsite") return campaigns.filter(c=>c.type===f);
    if(f==="CPM"||f==="CPC") return campaigns.filter(c=>c.buy===f);
    return campaigns;
  };

  const calcTotals = rows => {
    const t = rows.reduce((a,r)=>({
      ad:a.ad+(r.ad||0), imps:a.imps+(r.imps||0), clicks:a.clicks+(r.clicks||0),
      sales:a.sales+(r.sales||0), revenue:a.revenue+(r.revenue||0)
    }),{ad:0,imps:0,clicks:0,sales:0,revenue:0});
    return {
      ...t,
      ctr: t.imps ? t.clicks/t.imps : 0,
      cpm: t.imps ? (t.ad/(t.imps/1000)) : 0,
      cpc: t.clicks ? (t.ad/t.clicks) : 0,
      roas: t.ad ? (t.revenue/t.ad) : 0
    };
  };

  function monthlyAggregates(filter){
    const base = months.map(m=>({m, ad:0, imps:0, clicks:0, sales:0, revenue:0}));
    const list = byFilter(filter);
    list.forEach(c=>{
      const s=new Date(c.start), e=new Date(c.end), idx=[];
      months.forEach((_,i)=>{
        const d1=new Date(`2025-${String(i+1).padStart(2,'0')}-01`);
        const d2=new Date(`2025-${String(i+1).padStart(2,'0')}-28`);
        if(d2>=s && d1<=e) idx.push(i);
      });
      const n=Math.max(1,idx.length);
      idx.forEach(i=>{
        base[i].ad+=(c.ad||0)/n;
        base[i].imps+=(c.imps||0)/n;
        base[i].clicks+=(c.clicks||0)/n;
        base[i].sales+=(c.sales||0)/n;
        base[i].revenue+=(c.revenue||0)/n;
      });
    });
    return base.map(r=>({...r, ctr:r.imps? r.clicks/r.imps : 0, roas:r.ad? r.revenue/r.ad : 0}));
  }

  // -------- SECTION 1: Performance --------
  function renderTotals(filter){
    const t = calcTotals(byFilter(filter));
    const changes = {
      ad:rndChange(), imps:rndChange(), clicks:rndChange(), ctr:rndChange(),
      sales:rndChange(), revenue:rndChange(), roas:rndChange(), cpm:rndChange(), cpc:rndChange()
    };
    const tiles = [
      ['Ad Spend Total', fmoney(t.ad), changes.ad],
      ['Impressions Total', fnum(t.imps), changes.imps],
      ['Klicks Total', fnum(t.clicks), changes.clicks],
      ['CTR', fperc(t.ctr), changes.ctr],
      ['Media Sales Total', fnum(t.sales), changes.sales],
      ['Media Revenue Total', fmoney(t.revenue), changes.revenue],
      ['ROAS', t.roas.toFixed(2), changes.roas],
      ['CPM', t.cpm.toFixed(2)+' €', changes.cpm],
      ['CPC', t.cpc.toFixed(2)+' €', changes.cpc]
    ];
    const wrap = document.getElementById('kpis-total');
    wrap.innerHTML = tiles.map(([label,val,ch])=>
      `<div class="kpi"><div class="label">${label}</div><div class="value">${val}${changeHTML(ch)}</div></div>`
    ).join('');

    // Badge unten zeigt hier einfach die Revenue-Änderung als Beispiel
    const badge = document.getElementById('vs-last-year');
    if (badge) badge.textContent = (changes.revenue>=0?'+':'') + (changes.revenue*100).toFixed(1) + '%';
  }

  let trendChart;
  function renderTrend(filter){
    const data = monthlyAggregates(filter);
    const labels = data.map(r=>r.m);
    const imps   = data.map(r=>Math.round(r.imps));
    const clicks = data.map(r=>Math.round(r.clicks));
    const ctx = document.getElementById('trendMonthly');
    if(!ctx) return;
    if(trendChart) trendChart.destroy();
    trendChart = new Chart(ctx,{
      type:'line',
      data:{labels, datasets:[
        {label:'Impressions', data:imps, yAxisID:'y'},
        {label:'Klicks', data:clicks, yAxisID:'y1'}
      ]},
      options:{responsive:true, maintainAspectRatio:false,
        scales:{ y:{type:'linear', position:'left', beginAtZero:true},
                 y1:{type:'linear', position:'right', grid:{drawOnChartArea:false}, beginAtZero:true}},
        plugins:{legend:{position:'bottom'}}}
    });
  }

  function renderMonthlyTable(filter){
    const tb = document.getElementById('tbody-months');
    if(!tb) return;
    const data = monthlyAggregates(filter);
    tb.innerHTML='';
    data.forEach(r=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `<td>${r.m}</td><td>${fmoney(r.ad)}</td><td>${fnum(r.imps)}</td><td>${fnum(r.clicks)}</td><td>${fperc(r.ctr)}</td><td>${fnum(r.sales)}</td><td>${fmoney(r.revenue)}</td><td>${r.roas.toFixed(2)}</td>`;
      tb.appendChild(tr);
    });
  }

  // -------- SECTION 2 & 3: Campaigns --------
  function renderCampaignsOverview(filter){
    const list = byFilter(filter==='all'?null:filter);
    const t = calcTotals(list);
    const active = list.filter(c=> new Date(c.end) >= new Date()).length;
    const ended = list.length - active;
    const el = document.getElementById('kpis-campaigns');
    if(!el) return;
    const k = [
      ['Anzahl Kampagnen 2025', list.length],
      ['Aktive Kampagnen', active],
      ['Beendete Kampagnen', ended],
      ['Budget Total', list.reduce((a,c)=>a+c.booking,0).toLocaleString('de-DE')],
      ['Ad Spend Total', fmoney(t.ad)],
      ['% ausgeliefert', ((t.ad/(list.reduce((a,c)=>a+c.booking,0)||1))*100).toFixed(1)+'%']
    ];
    el.innerHTML = k.map(([l,v])=>`<div class="kpi"><div class="label">${l}</div><div class="value">${v}</div></div>`).join('');
  }

  function renderCampaignTable(){
    const tb=document.getElementById('tbody-campaigns');
    if(!tb) return;
    tb.innerHTML='';
    campaigns.forEach(c=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `<td>${c.name}</td><td>${c.brand}</td><td>${c.placement}</td><td>${c.type} / ${c.buy}</td><td>${c.targeting}</td><td>${c.start}</td><td>${c.end}</td><td>${c.booking.toLocaleString('de-DE')}</td><td>${fmoney(c.ad)}</td><td>${c.imps.toLocaleString('de-DE')}</td><td>${c.clicks.toLocaleString('de-DE')}</td><td>${c.sales.toLocaleString('de-DE')}</td><td>${fmoney(c.revenue)}</td>`;
      tb.appendChild(tr);
    });
  }

  // -------- SECTION 4: Re-Rank --------
  function renderRerank(){
    const el=document.getElementById('kpis-rerank');
    const tb=document.getElementById('tbody-rerank');
    if(!el || !tb) return;
    const totals = rerank.reduce((a,r)=>({ad:a.ad+r.ad, sales:a.sales+r.sales, revenue:a.revenue+(r.roas*r.ad)}),{ad:0,sales:0,revenue:0});
    const k = [
      ['Budget Total','—'],
      ['Ad Spend Total', fmoney(totals.ad)],
      ['Klicks', (Math.round(totals.ad/0.2)).toLocaleString('de-DE')],
      ['eCPC', (totals.ad/Math.max(1, Math.round(totals.ad/0.2))).toFixed(2)+' €'],
      ['% ausgeliefert','—'],
      ['Sales', totals.sales.toLocaleString('de-DE')],
      ['Revenue', fmoney(totals.revenue)],
      ['ROAS', (totals.revenue/Math.max(1,totals.ad)).toFixed(2)]
    ];
    el.innerHTML = k.map(([l,v])=>`<div class="kpi"><div class="label">${l}</div><div class="value">${v}</div></div>`).join('');
    tb.innerHTML='';
    rerank.forEach(r=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `<td>${r.camp}</td><td>${r.product}</td><td>${fmoney(r.ad)}</td><td>${r.ecpc.toFixed(2)} €</td><td>${r.start}</td><td>${r.end}</td><td>${r.sales.toLocaleString('de-DE')}</td><td>${r.roas.toFixed(2)}</td>`;
      tb.appendChild(tr);
    });
  }

  // -------- SECTION 5: Item Sales --------
  function renderSales(filter){
    const el=document.getElementById('kpis-sales');
    const tb=document.getElementById('tbody-products');
    if(!el || !tb) return;
    const list = itemSales.filter(i => !filter || filter==='all' ? true : i.channel===filter);
    const totals = list.reduce((a,i)=>({sales:a.sales+i.sales,revenue:a.revenue+i.revenue}),{sales:0,revenue:0});
    el.innerHTML = [
      ['Media Sales Total', totals.sales.toLocaleString('de-DE')],
      ['Media Revenue Total', fmoney(totals.revenue)]
    ].map(([l,v])=>`<div class="kpi"><div class="label">${l}</div><div class="value">${v}</div></div>`).join('');
    tb.innerHTML='';
    list.forEach(r=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `<td>${r.brand}</td><td>${r.product}</td><td>${r.campaign}</td><td>${r.placement}</td><td>${r.sales.toLocaleString('de-DE')}</td><td>${fmoney(r.revenue)}</td>`;
      tb.appendChild(tr);
    });
  }

  // -------- Filters --------
  function wireFilters(){
    document.querySelectorAll('#filters-total .filter').forEach(el=>{
      el.addEventListener('click',()=>{
        document.querySelectorAll('#filters-total .filter').forEach(f=>f.classList.remove('active'));
        el.classList.add('active');
        const f = el.dataset.filter;
        renderTotals(f); renderMonthlyTable(f); renderTrend(f);
      });
    });
    document.querySelectorAll('#filters-campaigns .filter').forEach(el=>{
      el.addEventListener('click',()=>{
        document.querySelectorAll('#filters-campaigns .filter').forEach(f=>f.classList.remove('active'));
        el.classList.add('active');
        renderCampaignsOverview(el.dataset.filter);
      });
    });
    document.querySelectorAll('#filters-sales .filter').forEach(el=>{
      el.addEventListener('click',()=>{
        document.querySelectorAll('#filters-sales .filter').forEach(f=>f.classList.remove('active'));
        el.classList.add('active');
        renderSales(el.dataset.filter);
      });
    });
  }

  // -------- Boot --------
  function boot(){
    if (typeof campaigns === 'undefined') { console.error('data.js nicht geladen'); return; }
    renderTotals('all');
    renderMonthlyTable('all');
    renderTrend('all');
    renderCampaignsOverview('all');
    renderCampaignTable();
    renderRerank();
    renderSales('all');
    wireFilters();
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
