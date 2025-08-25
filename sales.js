(function () {
  // ---------- Utils ----------
  function fmtMoney0(n) {
    return (n || 0).toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    });
  }
  function fmtNum(n) { return (n || 0).toLocaleString('de-DE'); }
  function getParam(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }
  function byIdAny(ids) {
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el) return el;
    }
    return null;
  }

  // ---------- Daten / Scope ----------
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

  // Standard: 2025 (Jan–Aug), gefiltert nach scope
  var all = (D.campaigns_2025 || []).filter(predicateFor(scope));

  // Optionales Produkt→Placement-Mapping (wenn vorhanden → echter Placement-Filter)
  var PLMAP = D.product_placement_map || null;

  // ---------- DOM Targets (alte & neue IDs werden unterstützt) ----------
  var selCampaign = byIdAny(['salesFilterCampaign', 'salesCampaign']);
  var selPlacement = byIdAny(['salesFilterPlacement']); // nur neue HTML hat den expliziten Placement-Select
  var tableBody =
    (function () {
      var t = document.querySelector('#salesTable tbody');
      if (t) return t;
      return byIdAny(['salesTBody']);
    })();

  // KPIs: alt (sd-*) ODER neu (kpi-*)
  var kpiSales = byIdAny(['kpi-sales', 'sd-sales']);
  var kpiRevenue = byIdAny(['kpi-revenue', 'sd-revenue']);

  // ---------- Hilfsfunktionen ----------
  function listProductsForCampaigns(campaigns) {
    var map = {}; // key: sku || name
    campaigns.forEach(function (c) {
      (c.products || []).forEach(function (p) {
        var key = (p.sku || p.name || '').toLowerCase();
        if (!map[key]) map[key] = { sku: p.sku || '', name: p.name, units: 0, revenue: 0 };
        map[key].units += (p.units || 0);
        map[key].revenue += (p.revenue || 0);
      });
    });
    var arr = Object.keys(map).map(function (k) { return map[k]; });
    arr.sort(function (a, b) { return (b.revenue || 0) - (a.revenue || 0); });
    return arr;
  }

  function totalsFromCampaigns(campaigns) {
    var u = 0, r = 0;
    campaigns.forEach(function (c) {
      (c.products || []).forEach(function (p) {
        u += (p.units || 0);
        r += (p.revenue || 0);
      });
    });
    return { units: u, revenue: r };
  }

  function campaignByName(name) {
    return all.find(function (c) { return c.name === name; });
  }

  function productNamesForCampaign(name) {
    var c = campaignByName(name);
    return c ? (c.products || []).map(function (p) { return p.name; }) : [];
  }

  function placementsForCampaign(name) {
    // Alle Placements (Union) für gewählte Kampagne; bei leerer Kampagne: alle Placements
    if (!name) {
      var setAll = new Set();
      all.forEach(function (c) { (c.placements || []).forEach(function (p) { if (p.placement) setAll.add(p.placement); }); });
      return Array.from(setAll).sort();
    }
    var c = campaignByName(name);
    if (!c) return [];
    var set = new Set((c.placements || []).map(function (p) { return p.placement || ''; }));
    set.delete('');
    return Array.from(set).sort();
  }

  function productMatchesPlacement(prodName, placement) {
    if (!placement) return true; // kein Placement ausgewählt
    if (PLMAP && PLMAP[prodName]) {
      var v = PLMAP[prodName];
      return Array.isArray(v) ? v.includes(placement) : (v === placement);
    }
    // kein Mapping → wir können nicht wirklich einschränken
    return true;
  }

  // ---------- UI aufbauen ----------
  function buildCampaignOptions(preSelected) {
    if (!selCampaign) return;

    var options = [{ value: 'ALL', label: 'Alle Kampagnen' }].concat(
      all.map(function (c) { return { value: c.name, label: c.name }; })
    );
    selCampaign.innerHTML = options
      .map(function (o) { return '<option value="' + o.value + '">' + o.label + '</option>'; })
      .join('');

    if (preSelected && all.some(function (c) { return c.name === preSelected; })) {
      selCampaign.value = preSelected;
    } else {
      selCampaign.value = selCampaign.value || 'ALL';
    }
  }

  function buildPlacementOptions(campaignName, prePlacement) {
    if (!selPlacement) return; // alte HTML hat keinen Placement-Select

    var plist = placementsForCampaign(campaignName === 'ALL' ? '' : campaignName);
    selPlacement.innerHTML =
      '<option value="">Alle Placements</option>' +
      plist.map(function (p) { return '<option>' + p + '</option>'; }).join('');

    if (prePlacement && plist.includes(prePlacement)) {
      selPlacement.value = prePlacement;
    } else {
      selPlacement.value = '';
    }
  }

  // ---------- Render ----------
  function render() {
    var selection = selCampaign ? selCampaign.value : 'ALL';
    var placement = selPlacement ? selPlacement.value : '';

    var selCamps = (selection === 'ALL')
      ? all
      : all.filter(function (c) { return c.name === selection; });

    // Produktliste auf Kampagnenbasis
    var list = listProductsForCampaigns(selCamps);

    // Wenn Kampagne gesetzt → auf deren Produkte einschränken (Safety, falls SALES_DETAILS genutzt würden)
    if (selection !== 'ALL') {
      var prodSet = new Set(productNamesForCampaign(selection));
      list = list.filter(function (p) { return prodSet.has(p.name); });
    }

    // ECHTER Placement-Filter nur, wenn Mapping existiert
    if (placement) {
      list = list.filter(function (p) { return productMatchesPlacement(p.name, placement); });
    }

    // KPIs (Totals immer aus Kampagnenprodukten, nicht aus list, damit konsistent)
    var totals = totalsFromCampaigns(selCamps);
    if (kpiSales) kpiSales.textContent = fmtNum(totals.units);
    if (kpiRevenue) kpiRevenue.textContent = fmtMoney0(totals.revenue);

    // Tabelle
    if (!tableBody) return;
    tableBody.innerHTML = list.map(function (p) {
      return '<tr>' +
        '<td>' + (p.sku || '') + '</td>' +
        '<td>' + (p.name || '') + '</td>' +
        '<td class="col-sales">' + fmtNum(p.units) + '</td>' +
        '<td class="col-revenue">' + fmtMoney0(p.revenue) + '</td>' +
        '</tr>';
    }).join('');
  }

  // ---------- Boot ----------
  document.addEventListener('DOMContentLoaded', function () {
    var preCampaign = getParam('campaign');   // aus Link vom Campaign-Table
    var prePlacement = getParam('placement'); // dito

    buildCampaignOptions(preCampaign || 'ALL');
    buildPlacementOptions((selCampaign ? selCampaign.value : 'ALL'), prePlacement);

    if (selCampaign) {
      selCampaign.addEventListener('change', function (e) {
        buildPlacementOptions(e.target.value, '');
        render();
      });
    }
    if (selPlacement) {
      selPlacement.addEventListener('change', render);
    }

    render();
  });
})();
