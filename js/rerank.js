/* ======================= js/rerank.js ======================= */
/* Sponsored Product Ads (Always-On / Sponsored Product Ads)  */
/* Arbeitet mit IDs aus index.html: rr-*, #rerankTable, #rerankTotalRow */

(function () {
  /* ---------- kleine Helfer & Fallback-Formatter ---------- */
  var D = (window.DASHBOARD_DATA || {});
  var fmtNum      = window.fmtNum      || (n => (n||0).toLocaleString('de-DE'));
  var fmtMoney0   = window.fmtMoney0   || (n => fmtNum(Math.round(n)) + ' €');
  var fmtMoney2   = window.fmtMoney2   || (n => (n||0).toLocaleString('de-DE', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' €');
  var fmtPct1     = window.fmtPct1     || (x => ((x||0)*100).toFixed(1) + '%');

  function by(arr, fn){ return (arr||[]).filter(Boolean).filter(fn); }
  function sum(arr, sel){ var s=0; for (var i=0;i<(arr||[]).length;i++) s+= (sel? sel(arr[i]) : arr[i])||0; return s; }
  function safeDiv(a,b){ return b ? (a/b) : 0; }

  /* ---------- Datenzugriff: Always-On + SPA-Placement ---------- */
  function getSpaBundle() {
    var camps = D.campaigns || D.ALL || [];
    // Always-On (Name kann abweichen → wir nehmen das Placement als harte Bedingung)
    var camp = (camps||[]).find(c =>
      (c && (c.name||'').toLowerCase().indexOf('always') >= 0) ||
      by(c && c.placements, p => (p.placement||'').toLowerCase() === 'sponsored product ads').length
    );

    if (!camp) return null;

    // bevorzugt das konkrete Placement (Sponsored Product Ads)
    var spa = (camp.placements||[]).find(p => (p.placement||'').toLowerCase() === 'sponsored product ads') || null;

    // Fallback: totals von Kampagne, falls Placement fehlt
    var totals = {
      booking : (spa && spa.booking)  || camp.booking  || 0,
      ad      : (spa && spa.ad)       || camp.ad       || 0,
      clicks  : (spa && spa.clicks)   || camp.clicks   || 0,
      orders  : (spa && spa.orders)   || camp.orders   || 0,      // = Sales
      revenue : (spa && spa.revenue)  || camp.revenue  || 0
    };

    return {
      camp: camp,
      spa : spa,
      totals: totals,
      products: (camp.products||[]).slice()   // Produkte liegen auf Kampagnen-Ebene
    };
  }

  /* ---------- KPI-Block befüllen ---------- */
  function renderRerankOverview(){
    var box = document.getElementById('panel-rerank');
    if (!box) return;

    var B = getSpaBundle();
    if (!B){ return; }

    var T = B.totals;

    var budget  = T.booking || 0;
    var ad      = T.ad      || 0;
    var clicks  = T.clicks  || 0;
    var orders  = T.orders  || 0;
    var revenue = T.revenue || 0;

    var ecpc    = safeDiv(ad, clicks);
    var pct     = safeDiv(ad, Math.max(1, budget));
    var roas    = safeDiv(revenue, Math.max(1, ad));

    // KPI IDs (siehe index.html)
    var $ = id => document.getElementById(id);
    if ($('rr-budget'))   $('rr-budget').textContent   = fmtMoney0(budget);
    if ($('rr-ad'))       $('rr-ad').textContent       = fmtMoney0(ad);
    if ($('rr-clicks'))   $('rr-clicks').textContent   = fmtNum(Math.round(clicks));
    if ($('rr-ecpc'))     $('rr-ecpc').textContent     = fmtMoney2(ecpc);
    if ($('rr-pct'))      $('rr-pct').textContent      = (pct*100).toFixed(0) + '%';
    if ($('rr-sales'))    $('rr-sales').textContent    = fmtNum(Math.round(orders));
    if ($('rr-revenue'))  $('rr-revenue').textContent  = fmtMoney0(revenue);
    if ($('rr-roas'))     $('rr-roas').textContent     = (roas||0).toFixed(2) + '×';
  }

  /* ---------- Tabelle befüllen ---------- */
  function renderRerank(){
    var wrap = document.getElementById('rerankTable');
    if (!wrap) return;

    var B = getSpaBundle();
    if (!B){ return; }

    var T  = B.totals;
    var adTot      = T.ad      || 0;
    var clicksTot  = T.clicks  || 0;
    var ordersTot  = T.orders  || 0;
    var revenueTot = T.revenue || 0;

    var products = (B.products||[]).map(function(p){
      return {
        sku     : p.sku || '',
        name    : p.name || '',
        units   : +p.units   || 0,
        revenue : +p.revenue || 0,
        // falls einzelne Ads/Clicks am Produkt hinterlegt sind, verwenden
        ad      : +p.ad      || 0,
        clicks  : +p.clicks  || 0
      };
    });

    // Wenn keine per-Produkt Ads/Clicks existieren → proportional verteilen
    var hasPerAd    = products.some(p => p.ad     > 0);
    var hasPerClick = products.some(p => p.clicks > 0);

    if (!hasPerAd || !hasPerClick){
      var weightSum = sum(products, p => (p.revenue || p.units || 1));
      if (weightSum <= 0) weightSum = products.length || 1;

      // Rohzuweisung
      products.forEach(function(p){
        var w = (p.revenue || p.units || 1) / weightSum;
        if (!hasPerAd)    p.ad     = adTot     * w;
        if (!hasPerClick) p.clicks = clicksTot * w;
      });

      // Summentreue (Rundungen ausgleichen)
      var corrAd     = Math.round(adTot     - sum(products, p => Math.round(p.ad)));
      var corrClicks = Math.round(clicksTot - sum(products, p => Math.round(p.clicks)));
      if (products.length){
        products[products.length-1].ad     = Math.round(products[products.length-1].ad)     + corrAd;
        products[products.length-1].clicks = Math.round(products[products.length-1].clicks) + corrClicks;
      }
    }

    // Render
    var tbody = wrap.querySelector('tbody');
    var tfoot = document.getElementById('rerankTotalRow');
    if (!tbody || !tfoot) return;

    var rowsHtml = '';
    var sAd=0, sClicks=0, sSales=0, sRev=0;

    products.forEach(function(p){
      var ad      = Math.round(p.ad||0);
      var clicks  = Math.round(p.clicks||0);
      var sales   = Math.round(p.units||0);
      var revenue = Math.round(p.revenue||0);
      var ecpc    = safeDiv(ad, clicks);
      var roas    = safeDiv(revenue, Math.max(1, ad));

      sAd     += ad;
      sClicks += clicks;
      sSales  += sales;
      sRev    += revenue;

      rowsHtml += '<tr>'+
        '<td>' + (p.sku ? (p.sku + ' — ') : '') + (p.name||'') + '</td>'+
        '<td class="right">'+ fmtMoney0(ad)        +'</td>'+
        '<td class="right">'+ fmtNum(clicks)       +'</td>'+
        '<td class="right">'+ fmtMoney2(ecpc)      +'</td>'+
        '<td class="right">'+ fmtNum(sales)        +'</td>'+
        '<td class="right">'+ fmtMoney0(revenue)   +'</td>'+
        '<td class="right">'+ (roas||0).toFixed(2) +'×</td>'+
      '</tr>';
    });

    tbody.innerHTML = rowsHtml;

    // Total-Zeile (Totals aus T nutzen – die sind maßgeblich)
    var roasTot = safeDiv(revenueTot, Math.max(1, adTot));
    var ecpcTot = safeDiv(adTot, Math.max(1, clicksTot));
    tfoot.innerHTML =
      '<td><b>Gesamt</b></td>'+
      '<td class="right"><b>'+ fmtMoney0(adTot)     +'</b></td>'+
      '<td class="right"><b>'+ fmtNum(clicksTot)    +'</b></td>'+
      '<td class="right"><b>'+ fmtMoney2(ecpcTot)   +'</b></td>'+
      '<td class="right"><b>'+ fmtNum(ordersTot)    +'</b></td>'+
      '<td class="right"><b>'+ fmtMoney0(revenueTot)+'</b></td>'+
      '<td class="right"><b>'+ (roasTot||0).toFixed(2)+'×</b></td>';
  }

  /* ---------- Export ins globale Scope (app.js ruft das auf) ---------- */
  window.renderRerankOverview = renderRerankOverview;
  window.renderRerank         = renderRerank;
})();
