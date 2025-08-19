(function(){
  // Utils
  function fmtMoney0(n){ return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}); }
  function fmtNum(n){ return (n||0).toLocaleString('de-DE'); }
  function getParam(name){
    var m = new RegExp('[?&]'+name+'=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }

  var D = window.DASHBOARD_DATA || {};
  var scope = getParam('scope') || 'ALL';

  // gleicher Scope-Filter wie im Dashboard
  function predicateFor(filter){
    switch(filter){
      case 'ONSITE': return function(c){ return c.site === 'Onsite'; };
      case 'OFFSITE':return function(c){ return c.site === 'Offsite'; };
      case 'CPM':    return function(c){ return c.model === 'CPM'; };
      case 'CPC':    return function(c){ return c.model === 'CPC'; };
      default:       return function(){ return true; };
    }
  }

  // Wir zeigen standardmäßig 2025 (Jan–Aug)
  var all = (D.campaigns_2025 || []).filter(predicateFor(scope));

  var select = document.getElementById('salesCampaign');
  var tbody  = document.querySelector('#salesTable tbody');

  // Dropdown füllen
  var options = [{value:'ALL', label:'Alle Kampagnen'}]
    .concat(all.map(function(c){ return {value:c.name, label:c.name}; }));
  select.innerHTML = options.map(function(o){ return '<option value="'+o.value+'">'+o.label+'</option>'; }).join('');

  // Hilfsfunktionen
  function collectProducts(campaigns){
    var map = {}; // key: sku||name
    campaigns.forEach(function(c){
      (c.products || []).forEach(function(p){
        var key = (p.sku || p.name || '').toLowerCase();
        if(!map[key]) map[key] = { sku: p.sku || '', name: p.name, units: 0, revenue: 0 };
        map[key].units   += (p.units   || 0);
        map[key].revenue += (p.revenue || 0);
      });
    });
    var arr = Object.keys(map).map(function(k){ return map[k]; });
    arr.sort(function(a,b){ return (b.revenue||0) - (a.revenue||0); });
    return arr;
  }
  function totalsFrom(campaigns){
    var u=0,r=0;
    campaigns.forEach(function(c){
      (c.products||[]).forEach(function(p){ u+=(p.units||0); r+=(p.revenue||0); });
    });
    return {units:u, revenue:r};
  }

  function render(selection){
    var selCamps = selection==='ALL' ? all : all.filter(function(c){ return c.name===selection; });
    var list = collectProducts(selCamps);
    // Summary
    var t = totalsFrom(selCamps);
    document.getElementById('sd-sales').textContent    = fmtNum(t.units);
    document.getElementById('sd-revenue').textContent  = fmtMoney0(t.revenue);
    // Tabelle
    tbody.innerHTML = list.map(function(p){
      return '<tr><td>'+(p.sku||'')+'</td><td>'+p.name+'</td>'+
             '<td class="right">'+fmtNum(p.units)+'</td>'+
             '<td class="right">'+fmtMoney0(p.revenue)+'</td></tr>';
    }).join('');
  }

  select.addEventListener('change', function(e){ render(e.target.value); });
  render('ALL');
})();
