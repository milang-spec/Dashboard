/* =================== rerank.js (SPA: Always-On / Sponsored Product Ads) =================== */

/* --- sanfte Fallbacks, falls deine utils schon vorhanden sind --- */
(function(){
  if (typeof window.findOne !== 'function') {
    window.findOne = function(sel){ return document.querySelector(sel); };
  }
  if (typeof window.setText !== 'function') {
    window.setText = function(el, txt){ if(el){ el.textContent = txt; } };
  }
  if (typeof window.fmtMoney0 !== 'function') {
    window.fmtMoney0 = function(v){ return (v||0).toLocaleString('de-DE') + ' €'; };
  }
  if (typeof window.fmtMoney2 !== 'function') {
    window.fmtMoney2 = function(v){ return (v||0).toLocaleString('de-DE', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' €'; };
  }
  if (typeof window.fmtNum !== 'function') {
    window.fmtNum = function(v){ return (v||0).toLocaleString('de-DE'); };
  }
  if (typeof window.__report !== 'function') {
    window.__report = function(where, err){ console && console.error && console.error('[Dashboard] '+where, err); };
  }
})();

/* --------------------------- Helpers --------------------------- */

function _norm(s){
  return (s||'')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_\-]+/g,'')
    .replace(/\s+/g,'');
}
function _sum(arr, key){
  return (arr||[]).reduce((a,b)=> a + (Number(b?.[key])||0), 0);
}

/** Suche die Always-On / SPA-Kombi in window.DASHBOARD_DATA oder window.ALL */
function pickSpa(D){
  D = D || window.DASHBOARD_DATA || {};
  const all =
    D.ALL ||
    D.campaigns ||
    window.ALL ||
    [];

  // 1) Always-On finden (robust gegen Varianten/Bindestrich/Unterstrich)
  let camp = all.find(c => {
    const n = _norm(c?.name||'');
    return n.includes('alwayson') || n.includes('always on');
  });

  if (!camp) {
    __report('SPA pick', 'Keine Kampagne "Always-On" gefunden.');
    return {camp:null, spa:null, budget:0, spend:0, clicks:0, orders:0, revenue:0};
  }

  // 2) SPA-Placement finden: by placement/type
  const placs = camp.placements || [];
  let spa = placs.find(p => {
    const pl = _norm(p?.placement||'');
    const ty = _norm(p?.type||'');
    return pl.includes('sponsoredproductads') || pl === 'spa' || ty.includes('sponsoredproductads');
  });

  // Notfall: durchsuche alle Kampagnen, falls im Always-On kein passender placement gefunden
  if (!spa){
    outer:
    for (const c of all){
      for (const p of (c.placements||[])){
        const pl = _norm(p?.placement||'');
        const ty = _norm(p?.type||'');
        if (pl.includes('sponsoredproductads') || pl === 'spa' || ty.includes('sponsoredproductads')){
          camp = c; spa = p; break outer;
        }
      }
    }
  }

  if (!spa){
    __report('SPA pick', 'Kein Placement "Sponsored Product Ads" gefunden.');
  }

  // Zahlen robust lesen (Budget kann booking heißen)
  const budget = Number(spa?.booking ?? camp.booking ?? camp.budget ?? 0);
  const spend  = Number(spa?.ad      ?? camp.ad      ?? 0);
  const clicks = Number(spa?.clicks  ?? camp.clicks  ?? 0);
  const orders = Number(spa?.orders  ?? camp.orders  ?? 0);
  const revenue= Number(spa?.revenue ?? camp.revenue ?? 0);

  return { camp, spa, budget, spend, clicks, orders, revenue };
}

/** sales.js-Äquivalent: Produkte skalieren, falls Placement keine eigene Liste hat */
function scaleProducts(list, shareUnits, shareRevenue){
  return (list||[]).map(p => ({
    sku     : p.sku || p.SKU || p.id || '',
    name    : p.name || p.item || p.title || '',
    units   : Math.round((Number(p.units||p.sales||0)) * (shareUnits||0)),
    revenue : Math.round((Number(p.revenue||0)) * (shareRevenue||0))
  }));
}

function deriveSpaProductsWithScaling(camp, spa){
  // 1) Placement hat eigene Produkte → direkt nutzen
  if (spa?.products?.length) {
    return spa.products.map(p => ({
      sku     : p.sku || p.SKU || p.id || '',
      name    : p.name || p.item || p.title || '',
      units   : Number(p.units || p.sales || 0),
      revenue : Number(p.revenue || 0)
    }));
  }

  // 2) Sonst Kampagnenliste (falls vorhanden) proportional runterskalieren
  const base = (camp?.products || []).map(p => ({
    sku     : p.sku || p.SKU || p.id || '',
    name    : p.name || p.item || p.title || '',
    units   : Number(p.units || p.sales || 0),
    revenue : Number(p.revenue || 0)
  }));
  if (!base.length) return [];

  const totU = _sum(camp?.placements, 'orders')  || 1;
  const totR = _sum(camp?.placements, 'revenue') || 1;
  const shareU = (Number(spa?.orders)||0)   / totU;
  const shareR = (Number(spa?.revenue)||0)  / totR;

  return scaleProducts(base, shareU, shareR);
}

/* --------------------------- Renderers --------------------------- */

/**
 * Kacheln + Tabelle im "Sponsored Product Ads"-Block (Overview-Panel)
 * App ruft diese Funktion auf mit renderRerankOverview((D||{}).rerank||[], (D||{}).sales_details||[])
 * Die Parameter werden hier nicht benötigt; wir lesen direkt aus window.DASHBOARD_DATA,
 * lassen sie aber in der Signatur, damit app.js unverändert bleiben kann.
 */
function renderRerankOverview(/*rerankArray, salesDetails*/){
  try{
    const pick = pickSpa(window.DASHBOARD_DATA);
    if (!pick || !pick.camp || !pick.spa){
      __report('rerank overview', 'Keine Always-On / Sponsored Product Ads Daten gefunden.');
      return;
    }

    // Produkte wie in sales.js ableiten
    const products = deriveSpaProductsWithScaling(pick.camp, pick.spa);

    // Totals aus Produkten
    const totalUnits   = products.reduce((a,b)=>a+(b.units||0), 0);
    const totalRevenue = products.reduce((a,b)=>a+(b.revenue||0), 0);
    const eCPC         = pick.clicks ? (pick.spend / pick.clicks) : 0;
    const roas         = pick.spend ? (totalRevenue / pick.spend) : 0;

    // Kacheln
    setText(findOne('#spaBudget'),  fmtMoney0(pick.budget));
    setText(findOne('#spaSpend'),   fmtMoney0(pick.spend));
    setText(findOne('#spaClicks'),  fmtNum(pick.clicks));
    setText(findOne('#spaECPC'),    fmtMoney2(eCPC));
    setText(findOne('#spaSales'),   fmtNum(totalUnits));
    setText(findOne('#spaRevenue'), fmtMoney0(totalRevenue));
    setText(findOne('#spaROAS'),    roas.toFixed(2)+'×');

    // Tabelle
    const tbody = findOne('#spaTBody') || findOne('#spaTable tbody');
    if (tbody){
      tbody.innerHTML = products.map(p => `
        <tr>
          <td>${p.sku ? (String(p.sku).toUpperCase()) : ''}</td>
          <td>${p.name||''}</td>
          <td class="right">${fmtNum(p.units)}</td>
          <td class="right">${fmtMoney0(p.revenue)}</td>
        </tr>
      `).join('');

      // Fußzeile, falls vorhanden
      const sumRow = findOne('#spaSumRow');
      if (sumRow){
        sumRow.innerHTML =
          `<td><b>Gesamt</b></td>
           <td></td>
           <td class="right"><b>${fmtNum(totalUnits)}</b></td>
           <td class="right"><b>${fmtMoney0(totalRevenue)}</b></td>`;
      }
    }
  }catch(e){
    __report('rerank overview', e);
  }
}

/**
 * Tabellen-Renderer (falls du noch eine separate Rerank-Tabelle nutzt).
 * Hier verwenden wir dieselbe Logik, um Konsistenz zu wahren.
 */
function renderRerank(/*rerankList*/){
  try{
    // identisch zur Overview-Logik
    const pick = pickSpa(window.DASHBOARD_DATA);
    if (!pick || !pick.camp || !pick.spa){
      __report('rerank table', 'Keine Always-On / Sponsored Product Ads Daten gefunden.');
      return;
    }

    const products = deriveSpaProductsWithScaling(pick.camp, pick.spa);
    const tbody = findOne('#spaTBody') || findOne('#spaTable tbody');
    if (!tbody) return;

    const totalUnits   = products.reduce((a,b)=>a+(b.units||0), 0);
    const totalRevenue = products.reduce((a,b)=>a+(b.revenue||0), 0);

    tbody.innerHTML = products.map(p => `
      <tr>
        <td>${p.sku ? (String(p.sku).toUpperCase()) : ''}</td>
        <td>${p.name||''}</td>
        <td class="right">${fmtNum(p.units)}</td>
        <td class="right">${fmtMoney0(p.revenue)}</td>
      </tr>
    `).join('');

    const sumRow = findOne('#spaSumRow');
    if (sumRow){
      sumRow.innerHTML =
        `<td><b>Gesamt</b></td>
         <td></td>
         <td class="right"><b>${fmtNum(totalUnits)}</b></td>
         <td class="right"><b>${fmtMoney0(totalRevenue)}</b></td>`;
    }
  }catch(e){
    __report('rerank table', e);
  }
}

/* Expose globals (für app.js) */
window.renderRerankOverview = renderRerankOverview;
window.renderRerank         = renderRerank;
