/* ========= Re-Rank (Sponsored Product Ads) ========= */

/* -- kleine Helper -- */
function _normName(s){
  // robustes, akzentfreies, lower-case Matching ohne Sonderzeichen
  s = String(s||'').toLowerCase()
       .replace(/—|–|-/g,' ')           // lange/kurze Striche → Space
       .replace(/[()]/g,' ')            // Klammern raus
       .replace(/\s+/g,' ')             // mehrfach-Space → 1 Space
       .trim();

  // diakritika entfernen (soweit unterstützt)
  try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g,''); } catch(_){}
  return s;
}
function _normSku(s){
  return String(s||'').trim().toUpperCase();
}
function _buildSalesMaps(salesDetails){
  var bySku = Object.create(null);
  var byName = Object.create(null);
  for (var i=0;i<(salesDetails||[]).length;i++){
    var row = salesDetails[i]||{};
    var units = +row.units || 0;

    var sku = _normSku(row.sku);
    if (sku) bySku[sku] = (bySku[sku]||0) + units;

    var nm  = _normName(row.name);
    if (nm) byName[nm] = (byName[nm]||0) + units;
  }
  return { bySku, byName };
}
function _unitsForItem(r, maps){
  // 1) versuchen über SKU
  var sku = _normSku(r.sku);
  if (sku && maps.bySku[sku] != null) return maps.bySku[sku];

  // 2) Fallback: über normalisierten Item-Namen
  var nm = _normName(r.item);
  return maps.byName[nm] || 0;
}

/* -- Overview-Kacheln (Top der SPA-Section) -- */
function renderRerankOverview(rerankList, salesDetails){
  rerankList   = rerankList   || [];
  salesDetails = salesDetails || [];

  // eCPC/ROAS als gewichtete Mittel
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

  // Budget-Kachel (falls gesetzt, sonst = AdSpend)
  var data = (window.DASHBOARD_DATA || {});
  var budgetTotal = (typeof data.rerank_budget === 'number') ? data.rerank_budget : totalAd;
  var pctSpend = budgetTotal ? Math.min(1, totalAd / budgetTotal) : 0;

  // Sales-Maps bauen (robust: SKU & Name)
  var maps = _buildSalesMaps(salesDetails);

  // Sales-Units über alle Items aufaddieren
  var salesUnits = 0;
  for (var j=0;j<rerankList.length;j++){
    salesUnits += _unitsForItem(rerankList[j], maps);
  }

  // Kacheln füllen
  var el;
  el = document.getElementById('rr-budget');  if (el) el.textContent = fmtMoney0(budgetTotal);
  el = document.getElementById('rr-ad');      if (el) el.textContent = fmtMoney0(totalAd);
  el = document.getElementById('rr-clicks');  if (el) el.textContent = fmtNum(Math.round(totalClicks));
  el = document.getElementById('rr-ecpc');    if (el) el.textContent = fmtMoney2(ecpcWeighted);
  el = document.getElementById('rr-pct');     if (el) el.textContent = ((pctSpend * 100) || 0).toFixed(0) + '%';
  el = document.getElementById('rr-sales');   if (el) el.textContent = salesUnits ? fmtNum(salesUnits) : '—';
  el = document.getElementById('rr-revenue'); if (el) el.textContent = fmtMoney0(totalRevenue);
  el = document.getElementById('rr-roas');    if (el) el.textContent = (roasWeighted || 0).toFixed(2) + '×';
}

/* -- Tabellen-Rendering -- */
function renderRerank(list){
  list = list || [];
  var tbody = document.querySelector('#rerankTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Sales-Maps aus den globalen sales_details (data.js)
  var D = (window.DASHBOARD_DATA || {});
  var maps = _buildSalesMaps(D.sales_details || []);

  // Zeilen + Totals
  var totals = { ad:0, clicks:0, units:0, revenue:0 };
  var rows = [];
  for (var j=0;j<list.length;j++){
    var r = list[j];
    var clicks  = r.ecpc > 0 ? (r.ad / r.ecpc) : 0;
    var revenue = (r.roas || 0) * (r.ad || 0);
    var units   = _unitsForItem(r, maps);

    rows.push({
      sku: r.sku,
      item: r.item,
      ad: +r.ad || 0,
      ecpc: +r.ecpc || 0,
      roas: +r.roas || 0,
      clicks: clicks,
      revenue: revenue,
      units: units
    });

    totals.ad      += (+r.ad || 0);
    totals.clicks  += clicks;
    totals.units   += units;
    totals.revenue += revenue;
  }

  // nach Revenue absteigend
  rows.sort(function(a,b){ return (b.revenue||0) - (a.revenue||0); });

  // Tabelle füllen
  for (var k=0;k<rows.length;k++){
    var x = rows[k];
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>'+x.sku+' — '+x.item+'</td>' +
      '<td class="right">'+fmtMoney0(x.ad)+'</td>' +
      '<td class="right">'+fmtNum(Math.round(x.clicks))+'</td>' +
      '<td class="right">'+fmtMoney2(x.ecpc)+'</td>' +
      '<td class="right">'+fmtNum(Math.round(x.units))+'</td>' +
      '<td class="right">'+fmtMoney0(x.revenue)+'</td>' +
      '<td class="right">'+(x.roas||0).toFixed(2)+'×</td>';
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
      '<td class="right"><b>'+(roasTotal||0).toFixed(2)+'×</b></td>';
  }
}

/* Export optional ins Window (falls woanders benötigt) */
window.renderRerankOverview = renderRerankOverview;
window.renderRerank         = renderRerank;
