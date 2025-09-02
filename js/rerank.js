// js/rerank.js — robuste SPA-Render-Logik, kompatibel zu deinem Markup
(function (w) {
  'use strict';

  // ----------------------------- Helpers -----------------------------
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const esc = s => (s||'').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' }[c]));

  // Fallbacks, falls utils.js mal nicht geladen wäre
  const F = {
    money0 : w.fmtMoney0 || (x => (x||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0})),
    money2 : w.fmtMoney2 || (x => (x||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:2})),
    num    : w.fmtNum    || (x => (x||0).toLocaleString('de-DE')),
    pct1   : w.fmtPct1   || (x => ((x||0)*100).toFixed(1)+'%'),
    div    : w.safeDiv   || ((a,b)=> b ? a/b : 0),
    log    : (msg,err)=> (w.__report ? w.__report(msg,err) : console.warn('[SPA]',msg,err||'')),
  };

  // Kachel-Wert-Knoten via ID, data-spa oder Label-Text finden
  function findValueNode(host, idOrData, labelText){
    const id = typeof idOrData==='string' ? idOrData : '';
    // 1) per ID
    let node = id ? host.querySelector('#'+id) : null;
    if (node) return node;
    // 2) per data-spa
    node = host.querySelector('[data-spa="'+idOrData+'"]');
    if (node) return node;
    // 3) per Label-Text (robust gegen fehlende IDs)
    if (labelText){
      const cards = $$('.kpi, .stat, .metric, .card', host);
      for (const c of cards){
        const lbl = $('.label, .title, h4, h3, .kpi-title', c);
        const val = $('.value, .kpi-value, .number, .stat-value', c);
        if (lbl && val){
          const t = lbl.textContent.trim().toLowerCase();
          if (t === labelText.trim().toLowerCase()) return val;
        }
      }
    }
    return null;
  }

  // Tabelle (tbody) tolerant finden
  function findSpaTbody(host){
    return (
      host.querySelector('#spaTBody') ||
      host.querySelector('#spaTable tbody') ||
      host.querySelector('table[data-spa="table"] tbody') ||
      host.querySelector('table tbody')
    );
  }

  // Wenn überhaupt nichts vorhanden ist, NICHT aggressiv neues Markup bauen,
  // um dein Design nicht zu „zerschießen“. Dann nur warnen:
  function ensureMarkup(host){
    const hasAnyKpi =
      findValueNode(host,'spaBudget','Budget Total') ||
      findValueNode(host,'spaSpend','Ad Spend Total') ||
      findValueNode(host,'spaClicks','Klicks Total') ||
      findValueNode(host,'spaECPC','eCPC') ||
      findValueNode(host,'spaSales','Sales') ||
      findValueNode(host,'spaRevenue','Revenue') ||
      findValueNode(host,'spaROAS','ROAS');

    const hasTable = findSpaTbody(host);

    if (!hasAnyKpi || !hasTable){
      F.log('SPA-Markup nicht gefunden. Bitte prüfe IDs oder Labels im #panel-rerank. Ich rendere nur Daten, baue aber kein neues UI.');
    }
    return true;
  }

  // ----------------------------- Daten holen -----------------------------
  function pickSpa(data){
    data = data || w.DASHBOARD_DATA || {};
    const camps = data.campaigns || [];

    // Always-On Kampagne
    const camp = camps.find(c => /always[-\s]?on/i.test(c?.name||'')) || null;

    // Placement „Sponsored Product Ads“
    let spa = null;
    if (camp){
      spa = (camp.placements||[]).find(p =>
        /sponsored product ads/i.test(
          String(p?.placement||p?.name||p?.type||'')
        )
      ) || null;
    }

    // Falls Placement mal nicht im campaigns-Block liegt: sales_details als Fallback
    let saleRec = null;
    if (!spa && Array.isArray(data.sales_details)){
      saleRec = data.sales_details.find(r =>
        /always[-\s]?on/i.test(r?.campaign||'') &&
        /sponsored product ads/i.test(r?.placement||'')
      ) || null;
    }

    // Produkte (SKU-Liste)
    let products = [];
    if (spa?.products?.length)       products = spa.products;
    else if (camp?.products?.length) products = camp.products;
    else if (saleRec?.products)      products = saleRec.products;

    products = (products||[]).map(p => ({
      sku     : p.sku || p.SKU || p.id || '',
      name    : p.name || p.item || p.title || '',
      units   : Number(p.units || p.sales || 0),
      revenue : Number(p.revenue || p.turnover || p.rev || 0)
    }));

    // Kennzahlen
    const budget  = Number(spa?.booking ?? camp?.booking ?? saleRec?.budget ?? 0);
    const spend   = Number(spa?.ad      ?? camp?.ad      ?? saleRec?.spend  ?? 0);
    const clicks  = Number(spa?.clicks  ?? camp?.clicks  ?? saleRec?.clicks ?? 0);

    let orders    = Number(spa?.orders  ?? camp?.orders  ?? saleRec?.sales  ?? 0);
    let revenue   = Number(spa?.revenue ?? camp?.revenue ?? saleRec?.revenue?? 0);

    // Robustheit: Falls Orders/Revenue auf Kampagne/Placement fehlen → aus Produkten summieren
    if (!orders)  orders  = products.reduce((a,b)=>a+(b.units||0),0);
    if (!revenue) revenue = products.reduce((a,b)=>a+(b.revenue||0),0);

    return { camp, spa, saleRec, products, budget, spend, clicks, orders, revenue };
  }

  // ----------------------------- Render -----------------------------
  function renderSpa(){
    const host = $('#panel-rerank');
    if (!host){ F.log('#panel-rerank fehlt'); return; }

    ensureMarkup(host);

    const data = pickSpa(w.DASHBOARD_DATA);
    if (!data.camp && !data.spa && !data.saleRec){
      F.log('Keine Always-On / Sponsored Product Ads Daten gefunden.');
      return;
    }

    const { products, budget, spend, clicks, orders, revenue } = data;
    const ecpc = F.div(spend, clicks);
    const roas = F.div(revenue, spend);

    // KPI-Kacheln: tolerant über ID, data-Attr oder Label-Text
    const nodes = {
      budget  : findValueNode(host, 'spaBudget',  'Budget Total'),
      spend   : findValueNode(host, 'spaSpend',   'Ad Spend Total'),
      clicks  : findValueNode(host, 'spaClicks',  'Klicks Total'),
      ecpc    : findValueNode(host, 'spaECPC',    'eCPC'),
      sales   : findValueNode(host, 'spaSales',   'Sales'),
      revenue : findValueNode(host, 'spaRevenue', 'Revenue'),
      roas    : findValueNode(host, 'spaROAS',    'ROAS')
    };

    if (nodes.budget)  nodes.budget.textContent  = F.money0(budget);
    if (nodes.spend)   nodes.spend.textContent   = F.money0(spend);
    if (nodes.clicks)  nodes.clicks.textContent  = F.num(Math.round(clicks));
    if (nodes.ecpc)    nodes.ecpc.textContent    = F.money2(ecpc);
    if (nodes.sales)   nodes.sales.textContent   = F.num(Math.round(orders));    // **8.500**
    if (nodes.revenue) nodes.revenue.textContent = F.money0(revenue);           // **600.000 €**
    if (nodes.roas)    nodes.roas.textContent    = (roas||0).toFixed(2)+'×';

    // Tabelle (bestehendes Markup nutzen)
    const tBody = findSpaTbody(host);
    if (!tBody){ F.log('SPA Tabelle (tbody) nicht gefunden – nur Kacheln befüllt.'); return; }

    // Spend & Clicks proportional zur Revenue verteilen → Summen exakt, Sales/Revenue 1:1 zu sales.html
    const sumRev = products.reduce((a,b)=>a+(b.revenue||0),0) || 1;

    const rows = (products||[]).map(p => {
      const share  = (p.revenue||0) / sumRev;
      const rSpend = share * spend;
      const rClk   = share * clicks;
      const rECPC  = F.div(rSpend, rClk);
      const rROAS  = F.div(p.revenue, rSpend);
      return {
        sku: p.sku, name: p.name,
        spend: rSpend, clicks: rClk, ecpc: rECPC,
        sales: p.units, revenue: p.revenue, roas: rROAS
      };
    });

    tBody.innerHTML = rows.map(r => `
      <tr>
        <td>${esc(r.sku)} — ${esc(r.name)}</td>
        <td class="right">${F.money0(r.spend)}</td>
        <td class="right">${F.num(Math.round(r.clicks))}</td>
        <td class="right">${F.money2(r.ecpc)}</td>
        <td class="right">${F.num(r.sales)}</td>
        <td class="right">${F.money0(r.revenue)}</td>
        <td class="right">${(r.roas||0).toFixed(2)}×</td>
      </tr>
    `).join('');

    // Summenzeile (falls vorhanden)
    const elSpend   = host.querySelector('#spaSumSpend,   tfoot th.right:nth-child(2)');
    const elClicks  = host.querySelector('#spaSumClicks,  tfoot th.right:nth-child(3)');
    const elECPC    = host.querySelector('#spaSumECPC,    tfoot th.right:nth-child(4)');
    const elSales   = host.querySelector('#spaSumSales,   tfoot th.right:nth-child(5)');
    const elRevenue = host.querySelector('#spaSumRevenue, tfoot th.right:nth-child(6)');
    const elROAS    = host.querySelector('#spaSumROAS,    tfoot th.right:nth-child(7)');

    if (elSpend)   elSpend.textContent   = F.money0(spend);
    if (elClicks)  elClicks.textContent  = F.num(Math.round(clicks));
    if (elECPC)    elECPC.textContent    = F.money2(ecpc);
    if (elSales)   elSales.textContent   = F.num(Math.round(orders));
    if (elRevenue) elRevenue.textContent = F.money0(revenue);
    if (elROAS)    elROAS.textContent    = (roas||0).toFixed(2)+'×';
  }

  // öffentliche Funktionen – werden in app.js aufgerufen
  w.renderRerankOverview = function(){ renderSpa(); };
  w.renderRerank         = function(){ renderSpa(); };

})(window);
