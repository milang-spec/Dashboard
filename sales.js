(function () {
  // ---------- Helpers ----------
  function fmtMoney0(n){ return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}); }
  function fmtNum(n){ return (n||0).toLocaleString('de-DE'); }
  function q(sel){ return document.querySelector(sel); }
  function getParam(name){
    var m = new RegExp('[?&]'+name+'=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }

  // ---------- Data ----------
  var D    = window.DASHBOARD_DATA || {};
  var ALL  = D.campaigns_2025 || window.ALL_2025 || [];

  // ---------- DOM ----------
  var selCamp     = q('#salesCampaign');
  var selPlac     = q('#salesPlacement');
  var tbody       = q('#salesTBody');
  var sumSalesEl  = q('#sumSales');
  var sumRevenueEl= q('#sumRevenue');
  var kpiSalesEl  = q('#kpiSales');
  var kpiRevEl    = q('#kpiRevenue');

  // ---------- Aggregation ----------
  function aggregateProducts(campaigns){
    var map = {}; // key by sku|name
    campaigns.forEach(function(c){
      (c.products||[]).forEach(function(p){
        var key = (p.sku || p.name || '').toLowerCase();
        if(!map[key]) map[key] = { sku:p.sku||'', name:p.name||'', units:0, revenue:0 };
        map[key].units   += (p.units||0);
        map[key].revenue += (p.revenue||0);
      });
    });
    var arr = Object.keys(map).map(function(k){ return map[k]; });
    // sort by revenue desc
    arr.sort(function(a,b){ return (b.revenue||0) - (a.revenue||0); });
    return arr;
  }

  function scaleProducts(base, shareUnits, shareRevenue){
    var out = (base||[]).map(function(p){
      var units = Math.round((p.units||0)   * shareUnits);
      var rev   = Math.round((p.revenue||0) * shareRevenue);
      return { sku:p.sku||'', name:p.name||'', units:units, revenue:rev };
    });
    out.sort(function(a,b){ return (b.revenue||0) - (a.revenue||0); });
    return out;
  }

  // ---------- Dropdowns ----------
  function fillCampaigns(){
    var opts = [{value:'ALL', label:'Alle Kampagnen'}];
    ALL.forEach(function(c){ opts.push({value:c.name, label:c.name}); });
    selCamp.innerHTML = opts.map(function(o){
      return '<option value="'+o.value+'">'+o.label+'</option>';
    }).join('');
  }

  function placementsOfCampaign(cName){
    var c = ALL.find(function(x){ return x.name===cName; });
    var list = ((c && c.placements)||[]).map(function(p){ return p.placement||''; });
    // uniq + nonempty
    var seen={}, uniq=list.filter(function(x){ if(!x||seen[x]) return false; seen[x]=1; return true; });
    return uniq;
  }

  function fillPlacements(){
    var cVal = selCamp.value || 'ALL';
    var opts = [{value:'ALL', label:'Alle Placements'}];
    if (cVal!=='ALL'){
      placementsOfCampaign(cVal).forEach(function(pl){
        opts.push({value:pl, label:pl});
      });
    }
    selPlac.innerHTML = opts.map(function(o){
      return '<option value="'+o.value+'">'+o.label+'</option>';
    }).join('');
  }

  // ---------- Render ----------
  function render(){
    var campValue = selCamp.value || 'ALL';
    var placValue = selPlac.value || 'ALL';

    var campaigns = (campValue==='ALL') ? ALL : ALL.filter(function(c){ return c.name===campValue; });

    var rows = [];
    var sumSales=0, sumRev=0;

    if (campValue==='ALL' && placValue==='ALL'){
      // Alle Kampagnen, alle Placements -> echte Aggregation
      rows = aggregateProducts(campaigns);
      rows.forEach(function(r){ sumSales+=(r.units||0); sumRev+=(r.revenue||0); });
    }
    else if (campValue!=='ALL' && placValue==='ALL'){
      // Eine Kampagne komplett
      var c = campaigns[0];
      rows = (c && c.products) ? c.products.slice(0) : [];
      rows.sort(function(a,b){ return (b.revenue||0)-(a.revenue||0); });
      rows.forEach(function(r){ sumSales+=(r.units||0); sumRev+=(r.revenue||0); });
    }
    else {
      // Eine Kampagne + ein Placement
      var c0 = campaigns[0];
      var placement = c0 && (c0.placements||[]).find(function(p){ return (p.placement||'')===placValue; });

      if (c0 && placement){
        // Anteil des Placements an Kampagnen-Sales/Revenue
        var campUnits = (c0.placements||[]).reduce(function(acc,p){ return acc + (p.orders||0); },0) || 1;
        var campRev   = (c0.placements||[]).reduce(function(acc,p){ return acc + (p.revenue||0);},0) || 1;

        var shareUnits   = (placement.orders||0)/campUnits;
        var shareRevenue = (placement.revenue||0)/campRev;

        var base = (c0.products||[]).length ? c0.products : [];
        rows = scaleProducts(base, shareUnits, shareRevenue);
        rows.forEach(function(r){ sumSales+=(r.units||0); sumRev+=(r.revenue||0); });
      }
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

    // Totals (Fußzeile)
    sumSalesEl.textContent   = fmtNum(Math.round(sumSales));
    sumRevenueEl.textContent = fmtMoney0(Math.round(sumRev));

    // KPI-Karten oben
    if (kpiSalesEl)  kpiSalesEl.textContent  = fmtNum(Math.round(sumSales));
    if (kpiRevEl)    kpiRevEl.textContent    = fmtMoney0(Math.round(sumRev));
  }

  // ---------- Deep-Link / Boot ----------
  fillCampaigns();

  // Falls per URL nur placement gesetzt ist: passende Kampagne auto-wählen
  var urlCampaign  = getParam('campaign');
  var urlPlacement = getParam('placement');

  if (urlCampaign){
    selCamp.value = urlCampaign;
  }
  else if (urlPlacement){
    // Kampagne finden, die das Placement hat
    var hit = ALL.find(function(c){
      return (c.placements||[]).some(function(p){ return (p.placement||'')===urlPlacement; });
    });
    if (hit) selCamp.value = hit.name;
  }

  fillPlacements();
  if (urlPlacement){
    // nur setzen, wenn im DropDown vorhanden
    var exists = Array.prototype.some.call(selPlac.options, function(o){ return o.value===urlPlacement; });
    if (exists) selPlac.value = urlPlacement;
  }

  selCamp.addEventListener('change', function(){
    fillPlacements();           // Reset der Placements, wenn Kampagne wechselt
    selPlac.value = 'ALL';
    render();
  });
  selPlac.addEventListener('change', render);

  // Initial
  render();
})();
