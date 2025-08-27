(function () {
  // --- kleine Helfer ---
  function getParam(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }
  function setSelectValue(sel, val) {
    if (!sel) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === val) { sel.selectedIndex = i; return; }
    }
  }

  // Scope aus URL (ONSITE/OFFSITE/CPM/CPC/ALL)
  var D = window.DASHBOARD_DATA || {};
  var scope = getParam('scope') || 'ALL';

  function predicateFor(filter) {
    switch (filter) {
      case 'ONSITE': return function (c) { return c.site === 'Onsite'; };
      case 'OFFSITE': return function (c) { return c.site === 'Offsite'; };
      case 'CPM': return function (c) { return c.model === 'CPM'; };
      case 'CPC': return function (c) { return c.model === 'CPC'; };
      default: return function () { return true; };
    }
  }

  var campaigns = (D.campaigns_2025 || []).filter(predicateFor(scope));

  // DOM
  var selCampaign  = document.getElementById('salesCampaign');
  var selPlacement = document.getElementById('salesPlacement');
  var tbody        = document.querySelector('#salesTable tbody');
  var sumSalesEl   = document.getElementById('sumSales');
  var sumRevEl     = document.getElementById('sumRevenue');

  // Dropdowns füllen
  function fillCampaignOptions() {
    var opts = [{ value: 'ALL', label: 'Alle Kampagnen' }]
      .concat(campaigns.map(function (c) { return { value: c.name, label: c.name }; }));
    selCampaign.innerHTML = opts.map(function (o) {
      return '<option value="' + o.value + '">' + o.label + '</option>';
    }).join('');
  }

  function fillPlacementOptions(campName) {
    if (campName && campName !== 'ALL') {
      var c = campaigns.find(function (x) { return x.name === campName; });
      var places = (c && c.placements) || [];
      var opts = [{ value: 'ALL', label: 'Alle Placements' }]
        .concat(places.map(function (p) {
          var label = p.placement || p.name || '';
          return { value: label, label: label };
        }));
      selPlacement.innerHTML = opts.map(function (o) {
        return '<option value="' + o.value + '">' + o.label + '</option>';
      }).join('');
      selPlacement.disabled = false;
    } else {
      selPlacement.innerHTML = '<option value="ALL">Alle Placements</option>';
      selPlacement.disabled = true;
    }
  }

  // Produkte sammeln und ggf. nach Placement skalieren
  function productsForCampaign(c, placementName) {
    var out = [];
    var prods = c.products || [];
    if (!prods.length) return out;

    if (placementName && placementName !== 'ALL') {
      var pObj = (c.placements || []).find(function (p) {
        return (p.placement || p.name) === placementName;
      });
      if (pObj) {
        // Skalierungsfaktoren (robust gegen 0)
        var unitsFactor = safeDiv((pObj.orders || 0), (c.orders || 0));
        var revFactor   = safeDiv((pObj.revenue || 0), (c.revenue || 0));
        for (var i = 0; i < prods.length; i++) {
          var pr = prods[i];
          out.push({
            sku: pr.sku || '',
            name: pr.name || '',
            units: Math.round((pr.units || 0) * unitsFactor),
            revenue: Math.round((pr.revenue || 0) * revFactor)
          });
        }
        return out;
      }
    }

    // Ohne Placement Filter: volle Kampagnenprodukte
    for (var j = 0; j < prods.length; j++) {
      var pr2 = prods[j];
      out.push({
        sku: pr2.sku || '',
        name: pr2.name || '',
        units: (pr2.units || 0),
        revenue: (pr2.revenue || 0)
      });
    }
    return out;
  }

  function aggregateProducts(selCampaigns, placementName) {
    var map = {};
    for (var i = 0; i < selCampaigns.length; i++) {
      var c = selCampaigns[i];
      var arr = productsForCampaign(c, placementName);
      for (var k = 0; k < arr.length; k++) {
        var p = arr[k];
        var key = (p.sku || p.name || '').toLowerCase();
        if (!map[key]) map[key] = { sku: p.sku || '', name: p.name || '', units: 0, revenue: 0 };
        map[key].units   += (p.units || 0);
        map[key].revenue += (p.revenue || 0);
      }
    }
    var out = Object.keys(map).map(function (k) { return map[k]; });
    out.sort(function (a, b) { return (b.revenue || 0) - (a.revenue || 0); });
    return out;
  }

  function updateUrl(cName, pName) {
    var params = new URLSearchParams(location.search);
    params.set('scope', scope);
    if (cName && cName !== 'ALL') params.set('campaign', cName); else params.delete('campaign');
    if (pName && pName !== 'ALL' && cName !== 'ALL') params.set('placement', pName); else params.delete('placement');
    history.replaceState(null, '', location.pathname + '?' + params.toString());
  }

  function render() {
    var cName = selCampaign.value;
    var pName = selPlacement.value;

    var selected = (cName === 'ALL') ? campaigns : campaigns.filter(function (c) { return c.name === cName; });
    var rows = aggregateProducts(selected, (cName === 'ALL') ? 'ALL' : pName);

    var html = '', tUnits = 0, tRevenue = 0;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      tUnits += (r.units || 0);
      tRevenue += (r.revenue || 0);
      html += '<tr>' +
        '<td>' + (r.sku || '') + '</td>' +
        '<td>' + (r.name || '') + '</td>' +
        '<td class="right">' + fmtNum(r.units || 0) + '</td>' +
        '<td class="right">' + fmtMoney0(r.revenue || 0) + '</td>' +
      '</tr>';
    }
    tbody.innerHTML = html;
    sumSalesEl.textContent = fmtNum(tUnits);
    sumRevEl.textContent   = fmtMoney0(tRevenue);
    updateUrl(cName, pName);
  }

  // Init
  fillCampaignOptions();

  var initialCampaign  = getParam('campaign')  || 'ALL';
  var initialPlacement = getParam('placement') || 'ALL';
  setSelectValue(selCampaign, initialCampaign);
  fillPlacementOptions(initialCampaign);
  setSelectValue(selPlacement, initialPlacement);

  render();

  selCampaign.addEventListener('change', function () {
    fillPlacementOptions(this.value);
    render();
  });
  selPlacement.addEventListener('change', render);
})();
