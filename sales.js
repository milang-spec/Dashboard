// js/sales.js
(function(){
  // ---------- Helpers ----------
  function by(arr, key){ return (arr||[]).map(x=>x && x[key]).filter(Boolean); }
  function uniq(arr){ return Array.from(new Set(arr)); }
  function fmtNum(n){ return (n||0).toLocaleString('de-DE'); }
  function fmtMoney0(n){ return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}); }

  // Produkte gleicher SKU/Name zusammenziehen
  function aggregateProducts(campaigns){
    const map = new Map(); // key = sku||name (lower)
    (campaigns||[]).forEach(c=>{
      (c.products||[]).forEach(p=>{
        const key = (p.sku||p.name||'').toLowerCase();
        if(!map.has(key)) map.set(key, { sku:p.sku||'', name:p.name||'', units:0, revenue:0 });
        const tgt = map.get(key);
        tgt.units   += +p.units   || 0;
        tgt.revenue += +p.revenue || 0;
      });
    });
    return Array.from(map.values()).sort((a,b)=> (b.revenue||0)-(a.revenue||0));
  }

  // Produkte proportional skalieren (für einzelnes Placement)
  function scaleProducts(base, shareUnits, shareRevenue){
    return (base||[]).map(p=>{
      return {
        sku: p.sku||'',
        name: p.name||'',
        units: Math.round((+p.units||0)   * (shareUnits||0)),
        revenue: Math.round((+p.revenue||0) * (shareRevenue||0))
      };
    });
  }

  // ---------- DOM ----------
  const selCamp     = document.getElementById('salesCampaign');
  const selPlac     = document.getElementById('salesPlacement');
  const kpiSalesEl  = document.getElementById('sd-sales');
  const kpiRevEl    = document.getElementById('sd-revenue');
  const tbody       = document.getElementById('salesTBody');
  const sumSalesEl  = document.getElementById('sumSales');
  const sumRevEl    = document.getElementById('sumRevenue');

  // ---------- Data ----------
  const D   = window.DASHBOARD_DATA || {};
  const ALL = D.campaigns_2025 || [];   // <- alle Kampagnen 2025

  // ---------- Init Filters ----------
  function fillCampaigns(){
    const opts = ['ALL'].concat(uniq(by(ALL,'name')));
    selCamp.innerHTML = opts.map(v=>{
      return `<option value="${v}">${v==='ALL'?'Alle Kampagnen':v}</option>`;
    }).join('');
  }

  function fillPlacements(campaignName){
    // Wenn "ALL", erlauben wir "Alle Placements" und deaktivieren die Auswahl (optional)
    if(!campaignName || campaignName==='ALL'){
      selPlac.innerHTML = `<option value="ALL">Alle Placements</option>`;
      selPlac.disabled = true; // UX: erst aktiv, wenn Kampagne gewählt wurde
      selPlac.value = 'ALL';
      return;
    }
    selPlac.disabled = false;
    const c = ALL.find(x=>x.name===campaignName);
    const list = c ? uniq((c.placements||[]).map(p=>p.placement||'').filter(Boolean)) : [];
    const html = [`<option value="ALL">Alle Placements</option>`]
      .concat(list.map(p=>`<option value="${p}">${p}</option>`)).join('');
    selPlac.innerHTML = html;
    selPlac.value = 'ALL';
  }

  // ---------- Render ----------
  function render(){
    const campValue = selCamp.value || 'ALL';
    const placValue = selPlac.value || 'ALL';

    const selectedCamps = (campValue==='ALL') ? ALL : ALL.filter(c=>c.name===campValue);

    let rows = [];
    let sumSales = 0, sumRev = 0;

    if (campValue==='ALL' && placValue==='ALL'){
      // 1) Alle Kampagnen, alle Placements -> echte Aggregation
      rows = aggregateProducts(selectedCamps);
    } else if (campValue!=='ALL' && placValue==='ALL'){
      // 2) Nur eine Kampagne, alle Placements -> direkte Kampagnen-Produkte
      const c = selectedCamps[0];
      rows = (c && c.products) ? c.products.slice(0) : [];
    } else {
      // 3) Eine Kampagne + ein Placement -> Produkte proportional skalieren
      const c = selectedCamps[0];
      const placement = c && (c.placements||[]).find(p => (p.placement||'')===placValue);
      if (c && placement){
        const campUnits = (c.placements||[]).reduce((acc,p)=>acc+(+p.orders||0),0) || 1;
        const campRev   = (c.placements||[]).reduce((acc,p)=>acc+(+p.revenue||0),0) || 1;
        const shareUnits   = (+placement.orders||0)/campUnits;
        const shareRevenue = (+placement.revenue||0)/campRev;

        const base = (c.products||[]); // falls leer -> bleibt leer
        rows = scaleProducts(base, shareUnits, shareRevenue);
      } else {
        rows = []; // kein passendes Placement
      }
    }

    // Summen berechnen
    rows.forEach(r=>{ sumSales += (+r.units||0); sumRev += (+r.revenue||0); });

    // KPIs
    kpiSalesEl.textContent = fmtNum(Math.round(sumSales));
    kpiRevEl.textContent   = fmtMoney0(Math.round(sumRev));

    // Tabelle
    tbody.innerHTML = rows.map(p=>(
      `<tr>
        <td>${p.sku||''}</td>
        <td>${p.name||''}</td>
        <td class="right">${fmtNum(+p.units||0)}</td>
        <td class="right">${fmtMoney0(+p.revenue||0)}</td>
      </tr>`
    )).join('');

    // Fußzeile
    sumSalesEl.textContent = fmtNum(Math.round(sumSales));
    sumRevEl.textContent   = fmtMoney0(Math.round(sumRev));
  }

  // ---------- Boot ----------
  function boot(){
    // Wenn keine Daten -> früh raus
    if(!ALL.length){
      kpiSalesEl.textContent = '0';
      kpiRevEl.textContent   = fmtMoney0(0);
      tbody.innerHTML = '';
      sumSalesEl.textContent = '0';
      sumRevEl.textContent   = fmtMoney0(0);
      return;
    }

    fillCampaigns();
    fillPlacements('ALL'); // initial

    // Deep-Linking: ?campaign=...&placement=...
    const url = new URL(location.href);
    const qCampaign  = url.searchParams.get('campaign');
    const qPlacement = url.searchParams.get('placement');

    if (qCampaign && uniq(by(ALL,'name')).includes(qCampaign)){
      selCamp.value = qCampaign;
      fillPlacements(qCampaign);
      if (qPlacement){
        // Placement nur setzen, wenn es zur Kampagne gehört
        const c = ALL.find(x=>x.name===qCampaign);
        const list = c ? (c.placements||[]).map(p=>p.placement||'') : [];
        if (list.includes(qPlacement)) selPlac.value = qPlacement;
      }
    }

    render();

    selCamp.addEventListener('change', function(){
      fillPlacements(this.value);
      render();
    });
    selPlac.addEventListener('change', render);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
