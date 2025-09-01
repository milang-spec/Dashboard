/* ========= Helpers ========= */

/**
 * Liest die Always-On-Kampagne und skaliert deren Produkt-Sales/Revenue
 * auf das Placement "Sponsored Product Ads". Wenn Always-On nur dieses eine
 * Placement hat, werden die Kampagnenprodukte 1:1 übernommen.
 * @returns {null|{rows:Array<{sku,name,units,revenue}>, sales:number, revenue:number}}
 */
function computeSpaFromAlwaysOn() {
  var D = window.DASHBOARD_DATA || {};
  var camps = Array.isArray(D.campaigns) ? D.campaigns : [];

  // 1) Always-On finden
  var camp = camps.find(function (c) {
    return /always[-\s]?on/i.test(String(c && c.name || ''));
  });
  if (!camp) return null;

  // 2) SPA-Placement lokalisieren
  var spa = (camp.placements || []).find(function (p) {
    var nm = String(p && (p.placement || p.name) || '');
    return /sponsored\s*product\s*ads/i.test(nm);
  });

  // 3) Basis-Produkte der Kampagne
  var base = Array.isArray(camp.products) ? camp.products : [];
  if (!base.length) return null;

  // Hilfsfunktionen
  function toNum(x){ return +x || 0; }

  // 4) Wenn mehrere Placements: nach Orders/Revenue-Share auf SPA runterskalieren
  var rows = base.map(function (p) {
    return {
      sku:   p.sku,
      name:  p.name,
      units: toNum(p.units),      // „Sales“ je SKU in der Kampagne
      revenue: toNum(p.revenue)
    };
  });

  var totalUnits, totalRevenue;

  if (spa && (camp.placements || []).length > 1) {
    var campUnits = (camp.placements || []).reduce(function (a, pl) { return a + toNum(pl.orders); }, 0) || 1;
    var campRev   = (camp.placements || []).reduce(function (a, pl) { return a + toNum(pl.revenue);}, 0) || 1;

    var uShare = toNum(spa.orders)  / campUnits;
    var rShare = toNum(spa.revenue) / campRev;

    rows = rows.map(function (r) {
      return {
        sku: r.sku,
        name: r.name,
        units: Math.round(r.units * uShare),
        revenue: Math.round(r.revenue * rShare)
      };
    });

    totalUnits   = Math.round(toNum(spa.orders)  || rows.reduce(function(a,x){return a+toNum(x.units);},0));
    totalRevenue = Math.round(toNum(spa.revenue) || rows.reduce(function(a,x){return a+toNum(x.revenue);},0));
  } else {
    // Nur SPA vorhanden → 1:1 Always-On
    totalUnits   = rows.reduce(function (a,x){ return a + toNum(x.units); }, 0);
    totalRevenue = rows.reduce(function (a,x){ return a + toNum(x.revenue); }, 0);
  }

  return { rows: rows, sales: totalUnits, revenue: totalRevenue };
}


/* ========= Re-Rank (Sponsored Product Ads) ========= */
/* Nutzt bevorzugt die SPA-Vorkalkulation aus Always-On. Fallbacks bleiben. */

/**
 * Kacheln oberhalb der Tabelle
 * @param {Array} rerankList – D.rerank.items
 * @param {Array} salesDetails – optional (historisch); wird übersteuert, wenn SPA-Vorkalkulation vorhanden
 */
function renderRerankOverview(rerankList, salesDetails){
  rerankList   = Array.isArray(rerankList) ? rerankList : [];
  salesDetails = Array.isArray(salesDetails) ? salesDetails : [];

  // Aggregationen für eCPC/ROAS (gewichtete Mittel)
  var totalAd = 0, totalClicks = 0, totalRevenueModel = 0;
  for (var i = 0; i < rerankList.length; i++){
    var r = rerankList[i] || {};
    var clicks = (r.ecpc > 0) ? ( (r.ad||0) / r.ecpc ) : 0;
    totalAd            += (r.ad || 0);
    totalClicks        += clicks;
    totalRevenueModel  += (r.roas || 0) * (r.ad || 0);
  }
  var ecpcWeighted = (totalClicks>0) ? (totalAd / totalClicks) : 0;

  // Bevorzugt: SPA-Vorkalkulation aus Always-On
  var spa = computeSpaFromAlwaysOn();

  var salesUnits   = 0;
  var revenueFinal = 0;
  var roasFinal    = 0;

  if (spa) {
    salesUnits   = spa.sales || 0;
    revenueFinal = spa.revenue || 0;
    roasFinal    = totalAd ? (revenueFinal / totalAd) : 0;
  } else if (salesDetails.length) {
    // Historische Variante: units aus salesDetails, revenue aus Modell
    for (var s = 0; s < salesDetails.length; s++){
      salesUnits += (+salesDetails[s].units || 0);
    }
    revenueFinal = totalRevenueModel;
    roasFinal    = totalAd ? (revenueFinal / totalAd) : 0;
  } else {
    // Fallback: alles aus Modell
    for (var k = 0; k < rerankList.length; k++){
      salesUnits += (+rerankList[k].sales || 0);
    }
    revenueFinal = totalRevenueModel;
    roasFinal    = totalAd ? (revenueFinal / totalAd) : 0;
  }

  // Budget/Spend/Clicks bleiben wie gehabt
  var D = window.DASHBOARD_DATA || {};
  var budgetTotal = (typeof D.rerank_budget === 'number') ? D.rerank_budget : totalAd;
  var pctSpend    = budgetTotal ? Math.min(1, totalAd / budgetTotal) : 0;

  var el;
  el = document.getElementById('rr-budget');  if (el) el.textContent = fmtMoney0(budgetTotal);
  el = document.getElementById('rr-ad');      if (el) el.textContent = fmtMoney0(totalAd);
  el = document.getElementById('rr-clicks');  if (el) el.textContent = fmtNum(Math.round(totalClicks));
  el = document.getElementById('rr-ecpc');    if (el) el.textContent = fmtMoney2(ecpcWeighted);
  el = document.getElementById('rr-pct');     if (el) el.textContent = ((pctSpend * 100) || 0).toFixed(0) + '%';

  // <- hier nun aus SPA-Vorkalkulation (oder Fallbacks)
  el = document.getElementById('rr-sales');   if (el) el.textContent = salesUnits ? fmtNum(salesUnits) : '—';
  el = document.getElementById('rr-revenue'); if (el) el.textContent = fmtMoney0(revenueFinal);
  el = document.getElementById('rr-roas');    if (el) el.textContent = (roasFinal || 0).toFixed(2) + '×';
}


/**
 * Tabelle
 * @param {Array} list – D.rerank.items
 */
function renderRerank(list){
  list = Array.isArray(list) ? list : [];
  var tbody = document.querySelector('#rerankTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  // 1) Bevorzugt SPA-Vorkalkulation je SKU/Item
  var spa = computeSpaFromAlwaysOn();
  var unitsByName = {};
  var revenueByName = {};

  if (spa) {
    for (var a = 0; a < spa.rows.length; a++){
      var r1 = spa.rows[a];
      var key = String(r1.name || '').toLowerCase().trim();
      unitsByName[key]   = (unitsByName[key]   || 0) + (+r1.units   || 0);
      revenueByName[key] = (revenueByName[key] || 0) + (+r1.revenue || 0);
    }
  } else if (Array.isArray((window.DASHBOARD_DATA||{}).sales_details) &&
             (window.DASHBOARD_DATA.sales_details.length > 0)) {
    // 2) Historisch: aus sales_details
    var sd = window.DASHBOARD_DATA.sales_details;
    for (var i = 0; i < sd.length; i++){
      var nm = String(sd[i].name || '').toLowerCase().trim();
      unitsByName[nm]   = (unitsByName[nm]   || 0) + (+sd[i].units   || 0);
      revenueByName[nm] = (revenueByName[nm] || 0) + (+sd[i].revenue || 0);
    }
  } else {
    // 3) Fallback: Werte aus der ReRank-Liste selbst
    for (var f = 0; f < list.length; f++){
      var key = String(list[f].item || '').toLowerCase().trim();
      unitsByName[key]   = (unitsByName[key]   || 0) + (+list[f].sales   || 0);
      revenueByName[key] = (revenueByName[key] || 0) + ( (+list[f].roas||0) * (+list[f].ad||0) );
    }
  }

  // 4) Zeilen mit konsistenten Sales/Revenue füllen
  var totals = { ad:0, clicks:0, units:0, revenue:0 };
  var rows = [];

  for (var j = 0; j < list.length; j++){
    var r = list[j] || {};
    var clicks  = (r.ecpc > 0) ? ( (r.ad||0) / r.ecpc ) : 0;

    var key = String(r.item || '').toLowerCase().trim();
    var units   = unitsByName[key]   || 0;
    var revenue = revenueByName[key] || ( (r.roas||0) * (r.ad||0) );

    rows.push({
      sku: r.sku,
      item: r.item,
      ad: (+r.ad || 0),
      ecpc: (+r.ecpc || 0),
      roas: (+r.roas || 0),
      clicks: clicks,
      units: units,
      revenue: revenue
    });

    totals.ad      += (+r.ad || 0);
    totals.clicks  += clicks;
    totals.units   += units;
    totals.revenue += revenue;
  }

  // nach Revenue absteigend
  rows.sort(function(a, b){ return (b.revenue || 0) - (a.revenue || 0); });

  // render
  for (var k = 0; k < rows.length; k++){
    var x = rows[k];
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>'+x.sku+' — '+x.item+'</td>' +
      '<td class="right">'+fmtMoney0(x.ad)+'</td>' +
      '<td class="right">'+fmtNum(Math.round(x.clicks))+'</td>' +
      '<td class="right">'+fmtMoney2(x.ecpc)+'</td>' +
      '<td class="right">'+fmtNum(Math.round(x.units))+'</td>' +
      '<td class="right">'+fmtMoney0(x.revenue)+'</td>' +
      '<td class="right">'+(x.roas || 0).toFixed(2)+'×</td>';
    tbody.appendChild(tr);
  }

  // Fußzeile
  var tfoot = document.getElementById('rerankTotalRow');
  if (tfoot){
    var roasTotal = totals.ad ? (totals.revenue / totals.ad) : 0;
    var ecpcTot   = totals.clicks ? (totals.ad / totals.clicks) : 0;
    tfoot.innerHTML =
      '<td><b>Gesamt</b></td>' +
      '<td class="right"><b>'+fmtMoney0(totals.ad)+'</b></td>' +
      '<td class="right"><b>'+fmtNum(Math.round(totals.clicks))+'</b></td>' +
      '<td class="right"><b>'+fmtMoney2(ecpcTot)+'</b></td>' +
      '<td class="right"><b>'+fmtNum(Math.round(totals.units))+'</b></td>' +
      '<td class="right"><b>'+fmtMoney0(totals.revenue)+'</b></td>' +
      '<td class="right"><b>'+roasTotal.toFixed(2)+'×</b></td>';
  }
}
