(function () {
  // --- helpers ---
  function fmtMoney0(n){ return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}); }
  function fmtNum(n){ return (n||0).toLocaleString('de-DE'); }
  function getParam(name){
    var m = new RegExp('[?&]'+name+'=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }
  function prettifySku(raw, idx){
    // prefer SKU-xxx if already present
    if(/^sku-\d{3}$/i.test(String(raw||''))) return String(raw).toUpperCase();
    // try to take a trailing number from raw ("SS-03" -> 3)
    var m = String(raw||'').match(/\d+/g);
    var num = m ? parseInt(m[m.length-1],10) : (idx+1);
    return "SKU-" + String(num).padStart(3,'0');
  }

  // --- read global data prepared by data.js ---
  var D = window.DASHBOARD_DATA || {};
  var campaigns = (D.campaigns_2025 || []).slice();

  // --- scope from dashboard chips (ALL/ONSITE/OFFSITE/CPM/CPC) ---
  var scope = getParam('scope') || 'ALL';
  function predicateFor(filter){
    switch(filter){
      case 'ONSITE': return function(c){ return (c.site||'').toLowerCase()==='onsite'; };
      case 'OFFSITE':return function(c){ return (c.site||'').toLowerCase()==='offsite'; };
      case 'CPM':    return function(c){ return (c.model||'').toUpperCase()==='CPM'; };
      case 'CPC':    return function(c){ return (c.model||'').toUpperCase()==='CPC'; };
      default:       return function(){ return true; };
    }
  }
  campaigns = campaigns.filter(predicateFor(scope));

  // --- DOM refs ---
  var selCamp = document.getElementById('salesFilterCampaign');
  var selPlac = document.getElementById('salesFilterPlacement');
  var kpiSales = document.getElementById('kpi-sales');
  var kpiRev   = document.getElementById('kpi-revenue');
  var tbody    = document.getElementById('salesTBody');
  var sumSales = document.getElementById('sumSales');
  var sumRev   = document.getElementById('sumRevenue');

  // --- build campaign dropdown ---
  var campOpts = [{value:'ALL', label:'Alle Kampagnen'}]
    .concat(campaigns.map(function(c){ return {value:c.name, label:c.name}; }));
  selCamp.innerHTML = campOpts.map(function(o){
    return '<option value="'+o.value+'">'+o.label+'</option>';
  }).join('');

  // --- build placement dropdown (depends on selected campaign) ---
  function updatePlacementOptions(){
    var camp = selCamp.value;
    var placements = [];
    if(camp==='ALL'){
      campaigns.forEach(function(c){
        (c.placements||[]).forEach(function(p){
          var key = (p.placement||'')+'@@'+c.name; // keep duplicates separated by campaign
          placements.push({ value:key, label:p.placement+' — '+c.name, placement:p.placement, campaign:c.name });
        });
      });
    } else {
      var c = campaigns.find(function(x){return x.name===camp;});
      (c && c.placements || []).forEach(function(p){
        placements.push({ value:(p.placement||''), label:(p.placement||'') });
      });
    }
    placements.unshift({value:'ALL', label:'Alle Placements'});

    selPlac.innerHTML = placements.map(function(o){
      return '<option value="'+o.value+'">'+o.label+'</option>';
    }).join('');
  }

  // --- collect & aggregate products according to current filters ---
  function collect(selectionCamp, selectionPlac){
    var list = [];
    var map = {}; // key by sku+name for stable sums
    var rowIdx = 0;

    campaigns.forEach(function(c){
      if(selectionCamp!=='ALL' && c.name!==selectionCamp) return;

      var products = c.products||[];
      var placements = c.placements||[];

      // when a placement is chosen:
      if(selectionPlac && selectionPlac!=='ALL'){
        var placName = selectionCamp==='ALL'
          ? (selectionPlac.split('@@')[0]||'')
          : selectionPlac;

        // optional: filter products by placement if you later store per-placement product splits
        // For now we use full campaign products (as your data has products per campaign).
      }

      products.forEach(function(p){
        var key = (String(p.sku||'')+'|'+String(p.name||'')).toLowerCase();
        if(!map[key]){
          map[key] = {
            skuRaw:p.sku, name:p.name, units:0, revenue:0, row:rowIdx++
          };
        }
        map[key].units   += (p.units||0);
        map[key].revenue += (p.revenue||0);
      });
    });

    Object.keys(map).forEach(function(k){ list.push(map[k]); });
    // sort by revenue desc
    list.sort(function(a,b){ return (b.revenue||0)-(a.revenue||0); });

    // assign pretty SKU codes
    list.forEach(function(r,i){ r.sku = prettifySku(r.skuRaw, i); });

    return list;
  }

  function render(){
    var camp = selCamp.value;
    var plac = selPlac.value;

    var rows = collect(camp, plac);
    var u=0, r=0;

    tbody.innerHTML = rows.map(function(p){
      u += (p.units||0);
      r += (p.revenue||0);
      return (
        '<tr>'+
          '<td>'+ (p.sku||'') +'</td>'+
          '<td>'+ (p.name||'') +'</td>'+
          '<td class="right">'+ fmtNum(p.units||0) +'</td>'+
          '<td class="right">'+ fmtMoney0(p.revenue||0) +'</td>'+
        '</tr>'
      );
    }).join('');

    kpiSales.textContent = fmtNum(u);
    kpiRev.textContent   = fmtMoney0(r);
    sumSales.textContent = fmtNum(u);
    sumRev.textContent   = fmtMoney0(r);
  }

  // --- preselect from dashboard deep-link ---
  var preCamp = getParam('campaign') || 'ALL';
  var prePlac = getParam('placement') || 'ALL';
  if (campOpts.some(function(o){return o.value===preCamp;})){
    selCamp.value = preCamp;
  }

  updatePlacementOptions();
  // Try to select placement if present
  var hasPlac = false;
  for (var i=0;i<selPlac.options.length;i++){
    if(selPlac.options[i].value===prePlac || selPlac.options[i].text===prePlac){
      selPlac.selectedIndex = i; hasPlac = true; break;
    }
  }
  if(!hasPlac){ selPlac.value = 'ALL'; }

  // events
  selCamp.addEventListener('change', function(){
    updatePlacementOptions();
    render();
  });
  selPlac.addEventListener('change', render);

  // initial
  render();
})();
