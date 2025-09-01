/* ========= Re-Rank (Sponsored Product Ads) ========= */
/* Nutzt sales_details (sales.html) – fällt sonst auf D.rerank.sales zurück. */

function renderRerankOverview(rerankList, salesDetails){
  rerankList   = rerankList   || [];
  salesDetails = salesDetails || [];

  // Aggregationen für eCPC/ROAS (gewichtete Mittel)
  var totalAd = 0, totalClicks = 0, totalRevenue = 0;
  for (var i = 0; i < rerankList.length; i++){
    var r = rerankList[i];
    var clicks = r.ecpc > 0 ? (r.ad / r.ecpc) : 0;
    totalAd      += (r.ad || 0);
    totalClicks  += clicks;
    totalRevenue += (r.roas || 0) * (r.ad || 0);
  }
  var ecpcWeighted = safeDiv(totalAd, totalClicks);
  var roasWeighted = safeDiv(totalRevenue, totalAd);

  // Sales-Ermittlung
  var salesUnits = 0;
  if (Array.isArray(salesDetails) && salesDetails.length){
    // Map: Name -> Units aus sales.html
    var unitsByName = {};
    for (var s = 0; s < salesDetails.length; s++){
      var nm = String(salesDetails[s].name || '').toLowerCase();
      unitsByName[nm] = (unitsByName[nm] || 0) + (salesDetails[s].units || 0);
    }
    for (var j = 0; j < rerankList.length; j++){
      var key = String(rerankList[j].item || '').toLowerCase();
      salesUnits += (unitsByName[key] || 0);
    }
  } else {
    // Fallback: direkt aus D.rerank.sales summieren
    for (var k = 0; k < rerankList.length; k++){
      salesUnits += (rerankList[k].sales || 0);
    }
  }

  // Kacheln füllen
  var el;
  var data = (window.DASHBOARD_DATA || {});
  var budgetTotal = (typeof data.rerank_budget === 'number') ? data.rerank_budget : totalAd;
  var pctSpend = budgetTotal ? Math.min(1, totalAd / budgetTotal) : 0;

  el = document.getElementById('rr-budget');  if (el) el.textContent = fmtMoney0(budgetTotal);
  el = document.getElementById('rr-ad');      if (el) el.textContent = fmtMoney0(totalAd);
  el = document.getElementById('rr-clicks');  if (el) el.textContent = fmtNum(Math.round(totalClicks));
  el = document.getElementById('rr-ecpc');    if (el) el.textContent = fmtMoney2(ecpcWeighted);
  el = document.getElementById('rr-pct');     if (el) el.textContent = ((pctSpend * 100) || 0).toFixed(0) + '%';
  el = document.getElementById('rr-sales');   if (el) el.textContent = salesUnits ? fmtNum(salesUnits) : '—';
  el = document.getElementById('rr-revenue'); if (el) el.textContent = fmtMoney0(totalRevenue);
  el = document.getElementById('rr-roas');    if (el) el.textContent = (roasWeighted || 0).toFixed(2) + '×';
}


function renderRerank(list){
  list = list || [];
  var tbody = document.querySelector('#rerankTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Sales-Quelle bestimmen: sales_details (falls vorhanden) oder Fallback auf list.sales
  var unitsByName = {};
  var hasSalesDetails = Array.isArray((window.DASHBOARD_DATA||{}).sales_details) &&
                        (window.DASHBOARD_DATA.sales_details.length > 0);

  if (hasSalesDetails){
    var sd = window.DASHBOARD_DATA.sales_details;
    for (var i = 0; i < sd.length; i++){
      var nm = String(sd[i].name || '').toLowerCase();
      unitsByName[nm] = (unitsByName[nm] || 0) + (sd[i].units || 0);
    }
  } else {
    // Fallback: Map aus den gelieferten ReRank-Items
    for (var f = 0; f < list.length; f++){
      var key = String(list[f].item || '').toLowerCase();
      unitsByName[key] = (unitsByName[key] || 0) + (list[f].sales || 0);
    }
  }

  // Zeilen aufbereiten + Totals
  var totals = { ad:0, clicks:0, units:0, revenue:0 };
  var rows = [];
  for (var j = 0; j < list.length; j++){
    var r = list[j];
    var clicks  = r.ecpc > 0 ? (r.ad / r.ecpc) : 0;
    var revenue = (r.roas || 0) * (r.ad || 0);
    var key     = String(r.item || '').toLowerCase();
    var units   = unitsByName[key] || 0;       // funktioniert mit beiden Quellen

    rows.push({
      sku: r.sku,
      item: r.item,
      ad: (r.ad || 0),
      ecpc: (r.ecpc || 0),
      roas: (r.roas || 0),
      clicks: clicks,
      revenue: revenue,
      units: units
    });

    totals.ad      += (r.ad || 0);
    totals.clicks  += clicks;
    totals.units   += units;
    totals.revenue += revenue;
  }

  // nach Revenue absteigend
  rows.sort(function(a, b){ return (b.revenue || 0) - (a.revenue || 0); });

  // Tabelle rendern
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
    var roasTotal = safeDiv(totals.revenue, totals.ad);
    var ecpcTot   = safeDiv(totals.ad, totals.clicks);
    tfoot.innerHTML =
      '<td><b>Gesamt</b></td>' +
      '<td class="right"><b>'+fmtMoney0(totals.ad)+'</b></td>' +
      '<td class="right"><b>'+fmtNum(Math.round(totals.clicks))+'</b></td>' +
      '<td class="right"><b>'+fmtMoney2(ecpcTot)+'</b></td>' +
      '<td class="right"><b>'+fmtNum(Math.round(totals.units))+'</b></td>' +
      '<td class="right"><b>'+fmtMoney0(totals.revenue)+'</b></td>' +
      '<td class="right"><b>'+(roasTotal || 0).toFixed(2)+'×</b></td>';
  }
}
