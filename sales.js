// sales.js – vollständiger Ersatz
(function () {
  /* ---------- lokale Helpers (unabhängig von utils.js) ---------- */
  function fmtMoney0(n){ return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}); }
  function fmtNum(n){ return (n||0).toLocaleString('de-DE'); }
  function getParam(name){
    var m = new RegExp('[?&]'+name+'=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }
  function q(sel){ return document.querySelector(sel); }

  /* ---------- Datenquellen ---------- */
  var D   = window.DASHBOARD_DATA || {};
  var ALL = (D.campaigns_2025 && D.campaigns_2025.length) ? D.campaigns_2025 : (window.ALL_2025 || []);
  ALL = Array.isArray(ALL) ? ALL : [];

  /* ---------- DOM ---------- */
  var selCamp      = q('#salesCampaign');
  var selPlac      = q('#salesPlacement');
  var tbody        = q('#salesTBody');
  var sumSalesEl   = q('#sumSales');
  var sumRevenueEl = q('#sumRevenue');
  var kpiSalesEl   = q('#kpiSales');
  var kpiRevEl     = q('#kpiRevenue');

  if (!selCamp || !selPlac || !tbody) return;

  /* ---------- Aggregation ---------- */
  function aggregateProducts(campaigns){
    var map = {};
    campaigns.forEach(function(c){
      (c.products||[]).forEach(function(p){
        var key = (p.sku || p.name || '').toLowerCase();
        if(!map[key]) map[key] = { sku:p.sku||'', name:p.name||'', units:0, revenue:0 };
        map[key].units   += (p.units||0);
        map[key].revenue += (p.revenue||0);
      });
    });
    var arr = Object.keys(map).map(function(k){ return map[k]; });
    arr.sort(function(a,b){ return (b.revenue||0) - (a.revenue||0); });
    return arr;
  }

  function scaleProducts(base, shareUnits, shareRevenue){
    var out = (base||[]).map(function(p){
      return {
        sku: p.sku||'',
        name: p.name||'',
        units: Math.round((p.units||0)   * (shareUnits||0)),
        revenue: Math.round((p.revenue||0) * (shareRevenue||0))
      };
    });
    out.sort(function(a,b){ return (b.revenue||0) - (a.revenue||0); });
    return out;
  }

  // ALL + Placement: über ALLE Kampagnen anteilig skalieren und anschließend aggregieren
  function aggregateAcrossCampaignsForPlacement(campaigns, placementName){
    var map = {}; // key: sku/name
    for (var i=0;i<campaigns.length;i++){
      var c = campaigns[i];
      if (!c || !(c.products||[]).length) continue;

      var p = (c.placements||[]).find(function(px){ return (px.placement||'')===placementName; });
      if (!p) continue;

      var campUnits = (c.placements||[]).reduce(function(acc,pp){ return acc + (pp.orders||0); }, 0) || 1;
      var campRev   = (c.placements||[]).reduce(function(acc,pp){ return acc + (pp.revenue||0);}, 0) || 1;

      var shareUnits   = (p.orders||0)/campUnits;
      var shareRevenue = (p.revenue||0)/campRev;

      (c.products||[]).forEach(function(pr){
        var key = (pr.sku || pr.name || '').toLowerCase();
        if(!map[key]) map[key] = { sku: pr.sku||'', name: pr.name||'', units:0, revenue:0 };
        map[key].units   += Math.round((pr.units||0)   * shareUnits);
        map[key].revenue += Math.round((pr.revenue||0) * shareRevenue);
      });
    }
    var arr = Object.keys(map).map(function(k){ return map[k]; });
    arr.sort(function(a,b){ return (b.revenue||0) - (a.revenue||0); });
    return arr;
  }

  /* ---------- Dropdowns ---------- */
  function uniquePlacementsAll(){
    var seen = {};
    var list = [];
    for (var i=0;i<ALL.length;i++){
      var pls = ALL[i].placements || [];
      for (var j=0;j<pls.length;j++){
        var name = pls[j].placement || '';
        if (name && !seen[name]) { seen[name]=1; list.push(name); }
      }
    }
    list.sort();
    return list;
  }

  function placementsOfCampaign(cName){
    var c = ALL.find(function(x){ return x.name===cName; });
    var seen={}, list=[];
    (c && c.placements || []).forEach(function(p){
      var name = p.placement || '';
      if (name && !seen[name]) { seen[name]=1; list.push(name); }
    });
    list.sort();
    return list;
  }

  function fillCampaigns(){
    var opts = [{value:'ALL', label:'Alle Kampagnen'}];
    for (var i=0;i<ALL.length;i++){
      opts.push({value:ALL[i].name, label:ALL[i].name});
    }
    selCamp.innerHTML = opts.map(function(o){
      return '<option value="'+o.value+'">'+o.label+'</option>';
    }).join('');
  }

  function fillPlacements(campVal){
    var list = (campVal==='ALL') ? uniquePlacementsAll() : placementsOfCampaign(campVal);
    var opts = [{value:'ALL', label:'Alle Placements'}];
    for (var i=0;i<list.length;i++) opts.push({value:list[i], label:list[i]});
    selPlac.innerHTML = opts.map(function(o){
      return '<option value="'+o.value+'">'+o.label+'</option>';
    }).join('');
    selPlac.disabled = false; // auch bei ALL aktiv
  }

  /* ---------- Render ---------- */
  function render(){
    var campValue = selCamp.value || 'ALL';
    var placValue = selPlac.value || 'ALL';

    var campaigns = (campValue==='ALL') ? ALL : ALL.filter(function(c){ return c.name===campValue; });

    var rows = [];
    var sumSales=0, sumRev=0;

    if (campValue==='ALL' && placValue==='ALL'){
      rows = aggregateProducts(campaigns);
    }
    else if (campValue!=='ALL' && placValue==='ALL'){
      var c = campaigns[0];
      rows = (c && c.products) ? c.products.slice(0) : [];
      rows.sort(function(a,b){ return (b.revenue||0)-(a.revenue||0); });
    }
    else if (campValue!=='ALL' && placValue!=='ALL'){
      var c0 = campaigns[0];
      var p  = c0 && (c0.placements||[]).find(function(x){ return (x.placement||'')===placValue; });
      if (c0 && p){
        var campUnits = (c0.placements||[]).reduce(function(acc,pp){ return acc + (pp.orders||0); }, 0) || 1;
        var campRev   = (c0.placements||[]).reduce(function(acc,pp){ return acc + (pp.revenue||0);}, 0) || 1;
        var shareUnits   = (p.orders||0)/campUnits;
        var shareRevenue = (p.revenue||0)/campRev;
        rows = scaleProducts((c0.products||[]), shareUnits, shareRevenue);
      }
    }
    else if (campValue==='ALL' && placValue!=='ALL'){
      // NEU: über alle Kampagnen nur dieses Placement aggregieren
      rows = aggregateAcrossCampaignsForPlacement(campaigns, placValue);
    }

    for (var r=0;r<rows.length;r++){
      sumSales += (rows[r].units||0);
      sumRev   += (rows[r].revenue||0);
    }

    // Tabelle
    tbody.innerHTML = rows.map(function(p){
      return '<tr>' +
        '<td>'+(p.sku||'')+'</td>' +
        '<td>'+(p.name||'')+'</td>' +
        '<td class="right">'+fmtNum(p.units||0)+'</td>' +
        '<td class="right">'+fmtMoney0(p.revenue||0)+'</td>' +
      '</tr>';
    }).join('');

    // Totals unten
    if (sumSalesEl)   sumSalesEl.textContent   = fmtNum(Math.round(sumSales));
    if (sumRevenueEl) sumRevenueEl.textContent = fmtMoney0(Math.round(sumRev));

    // KPIs oben
    if (kpiSalesEl) kpiSalesEl.textContent = fmtNum(Math.round(sumSales));
    if (kpiRevEl)   kpiRevEl.textContent   = fmtMoney0(Math.round(sumRev));
  }

  /* ---------- Init & Events ---------- */
  fillCampaigns();

  // Deep-Link: ?campaign=... & ?placement=...
  var qCamp = getParam('campaign') || 'ALL';
  var qPlac = getParam('placement') || 'ALL';

  // Kampagne setzen
  if (qCamp!=='ALL' && ALL.some(function(c){ return c.name===qCamp; })) {
    selCamp.value = qCamp;
  } else {
    selCamp.value = 'ALL';
  }

  // Placements zur aktuellen Kampagne/ALL laden
  fillPlacements(selCamp.value);

  // Placement setzen (nur falls vorhanden)
  var hasPlac = false;
  for (var i=0;i<selPlac.options.length;i++){
    if (selPlac.options[i].value === qPlac){ hasPlac = true; break; }
  }
  selPlac.value = hasPlac ? qPlac : 'ALL';

  // Events
  selCamp.addEventListener('change', function(){
    var keep = selPlac.value;
    fillPlacements(selCamp.value);
    // wenn altes Placement in neuer Liste nicht existiert -> ALL
    var ok=false;
    for (var j=0;j<selPlac.options.length;j++){
      if (selPlac.options[j].value===keep){ ok=true; break; }
    }
    selPlac.value = ok ? keep : 'ALL';
    render();
  });
  selPlac.addEventListener('change', render);

  // Erstes Rendern
  render();
})();
