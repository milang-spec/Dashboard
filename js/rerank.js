/* rerank.js – SPA (Sponsored Product Ads) block
   - liest D.rerank
   - richtet Sales + Revenue auf Always-On / Sponsored Product Ads aus
   - rendert Kacheln + Tabelle
*/

// ===== kleine Utils =====
function n(v){ return Number(v) || 0; }
function fmtInt(x){ return (Math.round(n(x))).toLocaleString('de-DE'); }
function fmtMoney0(x){ return (n(x)||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}); }
function sel(q){ return document.querySelector(q); }
function setText(q, val){ var el=sel(q); if(el) el.textContent = val; }

// Ordne SPA-Totals aus Always-On zu
function getAlwaysOnSpaTotals() {
  const data = (window.DASHBOARD_DATA||{});
  const camps = data.campaigns || [];
  const c = camps.find(x => (x.name||'').toLowerCase()==='always-on');
  if(!c) return null;

  // nimm das Placement „Sponsored Product Ads“, andernfalls die Kampagnen-Totals
  const p = (c.placements||[]).find(p => (p.placement||'').toLowerCase()==='sponsored product ads');
  return {
    orders : n(p ? p.orders   : c.orders),
    revenue: n(p ? p.revenue  : c.revenue),
    ad     : n(p ? p.ad       : c.ad),
    clicks : n(p ? p.clicks   : c.clicks),
    budget : n(p ? p.budget   : c.budget)
  };
}

// skaliert die Zeilen (sales, revenue) auf Soll-Totals
function scaleRowsToTotals(rows, targetSales, targetRevenue){
  let sumSales = rows.reduce((a,r)=>a+n(r.sales),0);
  let sumRev   = rows.reduce((a,r)=>a+n(r.revenue),0);

  if (targetSales && sumSales>0 && Math.abs(targetSales - sumSales) > 1){
    const k = targetSales / sumSales;
    rows.forEach(r => r.sales = Math.round(n(r.sales) * k));
    sumSales = rows.reduce((a,r)=>a+n(r.sales),0);
  }
  if (targetRevenue && sumRev>0 && Math.abs(targetRevenue - sumRev) > 1){
    const k2 = targetRevenue / sumRev;
    rows.forEach(r => r.revenue = Math.round(n(r.revenue) * k2));
  }
  return rows;
}

function buildSpaRows(){
  const base = (window.DASHBOARD_DATA && window.DASHBOARD_DATA.rerank) || [];
  const rows = base.map(x => {
    const r = {
      sku:   x.sku || '',
      name:  x.name || x.item || '',
      ad:    n(x.ad),
      clicks:n(x.clicks),
      ecpc:  n(x.ecpc),
      sales: n(x.sales),
      revenue: n(x.revenue),
      roas:  n(x.roas)
    };
    // ableiten: eCPC, Revenue, ROAS
    if (!r.ecpc && r.clicks) r.ecpc = r.ad / r.clicks;
    if (!r.revenue && r.roas) r.revenue = r.ad * r.roas;
    if (!r.roas && r.ad)      r.roas = r.revenue / r.ad;
    return r;
  });

  // Soll-Totals (Always-On → Sponsored Product Ads) holen und ggf. ausrichten
  const want = getAlwaysOnSpaTotals();
  if (want){
    scaleRowsToTotals(rows, n(want.orders), n(want.revenue));
  }
  return rows;
}

function renderSpa(){
  const rows = buildSpaRows();

  // Totals aus Zeilen berechnen
  const sumAd   = rows.reduce((a,r)=>a+n(r.ad),0);
  const sumClk  = rows.reduce((a,r)=>a+n(r.clicks),0);
  const sumSales= rows.reduce((a,r)=>a+n(r.sales),0);
  const sumRev  = rows.reduce((a,r)=>a+n(r.revenue),0);
  const ecpc    = sumClk ? (sumAd/sumClk) : 0;
  const roas    = sumAd ? (sumRev/sumAd) : 0;

  // Falls Always-On Budget/Ad/Clicks gepflegt sind, in die Kacheln übernehmen (optional)
  const want = getAlwaysOnSpaTotals();

  // ===== Kacheln =====
  setText('#spaBudget',      fmtMoney0(want && want.budget ? want.budget : sumAd)); // Budget (falls gepflegt)
  setText('#spaAd',          fmtMoney0(sumAd));
  setText('#spaClicks',      fmtInt(sumClk));
  setText('#spaECPC',        (ecpc||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}));
  setText('#spaSales',       fmtInt(sumSales));
  setText('#spaRevenue',     fmtMoney0(sumRev));
  setText('#spaROAS',        (roas||0).toFixed(2)+'×');

  // ===== Tabelle =====
  const tbody = sel('#spaTableBody');
  if (tbody){
    tbody.innerHTML = rows.map(r => (
      `<tr>
        <td>${(r.sku||'')+' — '+(r.name||'')}</td>
        <td class="right">${fmtMoney0(r.ad)}</td>
        <td class="right">${fmtInt(r.clicks)}</td>
        <td class="right">${(n(r.ecpc)||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td class="right">${fmtInt(r.sales)}</td>
        <td class="right">${fmtMoney0(r.revenue)}</td>
        <td class="right">${(r.ad? (r.revenue/r.ad):0).toFixed(2)}×</td>
      </tr>`
    )).join('');

    // Fußzeile „Gesamt“
    const tfoot = sel('#spaTableFoot');
    if (tfoot){
      tfoot.innerHTML =
        `<td><b>Gesamt</b></td>
         <td class="right"><b>${fmtMoney0(sumAd)}</b></td>
         <td class="right"><b>${fmtInt(sumClk)}</b></td>
         <td class="right"><b>${(ecpc||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2})}</b></td>
         <td class="right"><b>${fmtInt(sumSales)}</b></td>
         <td class="right"><b>${fmtMoney0(sumRev)}</b></td>
         <td class="right"><b>${(roas||0).toFixed(2)}×</b></td>`;
    }
  }
}

// Auto-Boot
document.addEventListener('DOMContentLoaded', function(){
  try { renderSpa(); } catch(e){ console.error('SPA render error', e); }
});
