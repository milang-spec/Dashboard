// Dashboard/js/sales.js
(function(){
  /* ---------- lokale Utils (unabhängig von utils.js) ---------- */
  function fmtMoney0(n){ return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}); }
  function fmtNum(n){ return (n||0).toLocaleString('de-DE'); }

  function getParam(name){
    var m = new RegExp('[?&]'+name+'=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }

  /* ---------- Daten holen ---------- */
  var D    = window.DASHBOARD_DATA || {};
  var ALL  = (D.campaigns_2025 && D.campaigns_2025.length) ? D.campaigns_2025
           : (window.ALL_2025 || []);

  // Fallback: nichts? -> leeres Array.
  ALL = Array.isArray(ALL) ? ALL : [];

  /* ---------- DOM ---------- */
  var selCamp = document.getElementById('salesCampaign');
  var selPlac = document.getElementById('salesPlacement');
  var tbody   = document.getElementById('salesTBody');
  var sumSalesEl   = document.getElementById('sumSales');
  var sumRevenueEl = document.getElementById('sumRevenue');

  if(!selCamp || !selPlac || !tbody) return;

  /* ---------- Filter-Optionen befüllen ---------- */
  function uniquePlacements(campaign){
    // Entweder alle Placements einer Kampagne oder global (über alle)
    var list = [];
    var src = campaign ? (campaign.placements||[]) : ALL.reduce(function(acc,c){ return acc.concat(c.placements||[]); },[]);
    src.forEach(function(p){
      var name = p && p.placement ? p.placement : '';
      if(name && list.indexOf(name)===-1) list.push(name);
    });
    list.sort();
    return list;
  }

  function fillCampaigns(){
    var opts = [{value:'ALL', label:'Alle Kampagnen'}]
      .concat(ALL.map(function(c){ return {value:c.name, label:c.name}; }));
    selCamp.innerHTML = opts.map(function(o){
      return '<option value="'+o.value+'">'+o.label+'</option>';
    }).join('');
  }

  function fillPlacements(campName){
    var c = ALL.find(function(x){return x.name===campName;});
    var list = uniquePlacements(campName==='ALL'?null:c);
    var opts = [{value:'ALL', label:'Alle Placements'}]
      .concat(list.map(function(p){return {value:p, label:p};}));
    selPlac.innerHTML = opts.map(function(o){
      return '<option value="'+o.value+'">'+o.label+'</option>';
    }).join('');
  }

  /* ---------- Produktliste berechnen ---------- */
  function aggregateProducts(campaigns){
    // Aggregiert über mehrere Kampagnen
    var map={}; // key: sku||name (toLowerCase)
    campaigns.forEach(function(c){
      (c.products||[]).forEach(function(p){
        var key = (p.sku||p.name||'').toLowerCase();
        if(!map[key]) map[key]={ sku:p.sku||'', name:p.name||'', units:0, revenue:0 };
        map[key].units   += (p.units||0);
        map[key].revenue += (p.revenue||0);
      });
    });
    return Object.keys(map).map(function(k){return map[k];})
      .sort(function(a,b){ return (b.revenue||0)-(a.revenue||0); });
  }

  function scaleProducts(products, shareUnits, shareRevenue){
    // verteilt Produkte proportional (z.B. für ein einzelnes Placement)
    var list = (products||[]).map(function(p){
      return {
        sku: p.sku||'',
        name:p.name||'',
        units: Math.round((p.units||0)   * shareUnits),
        revenue: Math.round((p.revenue||0)* shareRevenue)
      };
    });
    // Korrekturen, damit Rundungsfehler klein bleiben:
    return list;
  }

 function render(){
  var campValue = selCamp.value || 'ALL';
  var placValue = selPlac.value || 'ALL';

  // DOM-Refs für KPIs + Fußzeile (idempotent; falls schon global vorhanden, kein Problem)
  var kpiSalesEl    = document.getElementById('kpiSales');
  var kpiRevenueEl  = document.getElementById('kpiRevenue');
  var sumSalesEl    = document.getElementById('sumSales');
  var sumRevenueEl  = document.getElementById('sumRevenue');

  var campaigns = (campValue === 'ALL')
    ? ALL
    : ALL.filter(function(c){ return c.name === campValue; });

  var rows = [];
  var sumSales = 0, sumRev = 0;

  if (campValue === 'ALL' && placValue === 'ALL') {
    // Alle Kampagnen, alle Placements -> echte Aggregation der Kampagnen-Produkte
    rows = aggregateProducts(campaigns);
    rows.forEach(function(r){
      sumSales += (r.units || 0);
      sumRev   += (r.revenue || 0);
    });
  }
  else if (campValue !== 'ALL' && placValue === 'ALL') {
    // Eine Kampagne komplett (direkt Kampagnen-Produkte)
    var c = campaigns[0];
    rows = (c && c.products) ? c.products.slice(0) : [];
    rows.forEach(function(r){
      sumSales += (r.units || 0);
      sumRev   += (r.revenue || 0);
    });
  }
  else {
    // Eine Kampagne + ein Placement
    var c = campaigns[0];
    var placement = c && (c.placements||[]).find(function(p){
      return (p.placement || '') === placValue;
    });

    if (c && placement){
      // Anteil des Placements an Kampagnen-Sales/Revenue
      var campUnits = (c.placements||[]).reduce(function(acc,p){ return acc + (p.orders||0); }, 0) || 1;
      var campRev   = (c.placements||[]).reduce(function(acc,p){ return acc + (p.revenue||0);}, 0) || 1;

      var shareUnits   = (placement.orders   || 0) / campUnits;
      var shareRevenue = (placement.revenue  || 0) / campRev;

      // Falls es keine Kampagnen-Produkte gibt, nichts zeigen
      var base = (c.products || []).length ? c.products : [];
      rows = scaleProducts(base, shareUnits, shareRevenue);
      rows.forEach(function(r){
        sumSales += (r.units || 0);
        sumRev   += (r.revenue || 0);
      });
    }
  }

  // ==== Tabelle rendern ====
  tbody.innerHTML = rows.map(function(p){
    return '<tr>' +
      '<td>' + (p.sku || '') + '</td>' +
      '<td>' + (p.name || '') + '</td>' +
      '<td class="right">' + fmtNum(p.units || 0) + '</td>' +
      '<td class="right">' + fmtMoney0(p.revenue || 0) + '</td>' +
    '</tr>';
  }).join('');

  // ==== Totals (unten in Fußzeile) ====
  var totalUnits = Math.round(sumSales);
  var totalRev   = Math.round(sumRev);

  if (sumSalesEl)   sumSalesEl.textContent   = fmtNum(totalUnits);
  if (sumRevenueEl) sumRevenueEl.textContent = fmtMoney0(totalRev);

  // ==== KPIs (oben in den Karten) ====
  if (kpiSalesEl)   kpiSalesEl.textContent   = fmtNum(totalUnits);
  if (kpiRevenueEl) kpiRevenueEl.textContent = fmtMoney0(totalRev);
}

  /* ---------- Init ---------- */
  fillCampaigns();

  // URL-Voreinstellung übernehmen
  var qCampaign  = getParam('campaign') || 'ALL';
  var qPlacement = getParam('placement') || 'ALL';

  // Kampagne setzen + Placements nachziehen
  selCamp.value = (qCampaign && ALL.some(function(c){return c.name===qCampaign;})) ? qCampaign : 'ALL';
  fillPlacements(selCamp.value);
  selPlac.value = (qPlacement && uniquePlacements(selCamp.value==='ALL'?null:ALL.find(function(x){return x.name===selCamp.value;})).indexOf(qPlacement)>-1)
                    ? qPlacement : 'ALL';

  // Events
  selCamp.addEventListener('change', function(){
    fillPlacements(selCamp.value);
    selPlac.value = 'ALL';
    render();
  });
  selPlac.addEventListener('change', render);

  // Erstes Rendern
  render();
})();
