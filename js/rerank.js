// js/rerank.js — Rendert Sponsored Product Ads (Always-On) anhand der data.js

(function () {
  // ===== Helpers (mit Fallbacks, falls utils.js nicht alles liefert) =====
  const $ = (s) => document.querySelector(s);
  const fmtNum    = window.fmtNum    || (n => Intl.NumberFormat('de-DE').format(Math.round(n||0)));
  const fmtMoney0 = window.fmtMoney0 || (n => Intl.NumberFormat('de-DE',
                             {style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0));
  const fmtMoney2 = window.fmtMoney2 || (n => Intl.NumberFormat('de-DE',
                             {style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0));
  const fmtPct0   = (v) => `${Math.round((v||0)*100)}%`;
  const log       = (...a) => (window.__report ? __report('[rerank]', a.join(' ')) : console.log('[rerank]', ...a));
  const safeTxt   = (t) => String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');

  function setTxt(id, val){
    const n = typeof id === 'string' ? document.getElementById(id) : id;
    if (n) n.textContent = val;
  }

  // ===== Daten aus data.js holen =====
  function getAlwaysOnSPA() {
    const D   = window.DASHBOARD_DATA || {};
    const ALL = D.ALL || window.ALL || [];
    // Kampagne "Always-On"
    const camp = ALL.find(c => c && c.name === 'Always-On');
    if (!camp) { log('Keine Kampagne "Always-On" gefunden.'); return null; }
    // Placement "Sponsored Product Ads" (exakt, wie in data.js)
    const spa = (camp.placements || []).find(p =>
      p?.type === 'Sponsored Product Ads' || p?.placement === 'Sponsored Product Ads'
    );
    if (!spa) { log('Kein Placement "Sponsored Product Ads" innerhalb Always-On gefunden.'); return null; }
    return { camp, spa };
  }

  // ===== KPI-Kacheln =====
  function renderRerankOverview() {
    const pair = getAlwaysOnSPA(); if (!pair) return;
    const { camp, spa } = pair;

    const budget  = Number(spa.booking ?? camp.booking ?? 0);
    const spend   = Number(spa.ad      ?? camp.ad      ?? 0);
    const clicks  = Number(spa.clicks  ?? camp.clicks  ?? 0);
    const sales   = Number(spa.orders  ?? camp.orders  ?? 0);
    const revenue = Number(spa.revenue ?? camp.revenue ?? 0);

    const ecpc = clicks ? (spend / clicks) : 0;
    const roas = spend  ? (revenue / spend) : 0;
    const pct  = budget ? (spend / budget) : 0;

    setTxt('rr-budget',  fmtMoney0(budget));
    setTxt('rr-ad',      fmtMoney0(spend));
    setTxt('rr-clicks',  fmtNum(clicks));
    setTxt('rr-ecpc',    fmtMoney2(ecpc));
    setTxt('rr-pct',     fmtPct0(pct));
    setTxt('rr-sales',   fmtNum(sales));
    setTxt('rr-revenue', fmtMoney0(revenue));
    setTxt('rr-roas',    (roas||0).toFixed(2) + '×');

    log('KPI ok', { budget, spend, clicks, sales, revenue, roas: roas.toFixed(2) });
  }

  // ===== Tabelle (SKU-Liste) =====
  function renderRerankTable() {
    const pair = getAlwaysOnSPA(); if (!pair) return;
    const { camp, spa } = pair;

    const table = $('#rerankTable');
    const tbody = table && table.querySelector('tbody');
    if (!tbody) return;

    const spend   = Number(spa.ad      ?? camp.ad      ?? 0);
    const clicks  = Number(spa.clicks  ?? camp.clicks  ?? 0);
    const revenue = Number(spa.revenue ?? camp.revenue ?? 0);

    const prods = Array.isArray(camp.products) ? camp.products : [];
    const sumRev   = prods.reduce((a,p)=>a+Number(p.revenue||0),0) || 1;

    // Proportionale Verteilung von Ad/Clicks nach Revenue-Anteil
    const rows = prods.map(p => {
      const r = Number(p.revenue||0);
      const share = r / sumRev;
      const ad_i   = share * spend;
      const clk_i  = share * clicks;
      const ecpc_i = clk_i ? ad_i/clk_i : 0;
      const roas_i = ad_i  ? r/ad_i     : 0;

      return {
        sku:  p.sku || '',
        name: p.name || '',
        ad:   ad_i,
        clicks: clk_i,
        ecpc: ecpc_i,
        sales: Number(p.units||0),
        revenue: r,
        roas: roas_i
      };
    });

    // Render Rows
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${safeTxt(`${r.sku} — ${r.name}`)}</td>
        <td class="right">${fmtMoney0(r.ad)}</td>
        <td class="right">${fmtNum(r.clicks)}</td>
        <td class="right">${fmtMoney2(r.ecpc)}</td>
        <td class="right">${fmtNum(r.sales)}</td>
        <td class="right">${fmtMoney0(r.revenue)}</td>
        <td class="right">${(r.roas||0).toFixed(2)}×</td>
      </tr>
    `).join('');

    // Summenzeile
    const trow = $('#rerankTotalRow');
    if (trow) {
      const sumAd   = rows.reduce((a,r)=>a+r.ad,0);
      const sumClk  = rows.reduce((a,r)=>a+r.clicks,0);
      const sumEcpc = sumClk ? (sumAd/sumClk) : 0;
      const sumSales= rows.reduce((a,r)=>a+r.sales,0);
      const sumRev2 = rows.reduce((a,r)=>a+r.revenue,0);
      const sumRoas = sumAd ? (sumRev2/sumAd) : 0;

      trow.innerHTML = `
        <td><b>Gesamt</b></td>
        <td class="right"><b>${fmtMoney0(sumAd)}</b></td>
        <td class="right"><b>${fmtNum(sumClk)}</b></td>
        <td class="right"><b>${fmtMoney2(sumEcpc)}</b></td>
        <td class="right"><b>${fmtNum(sumSales)}</b></td>
        <td class="right"><b>${fmtMoney0(sumRev2)}</b></td>
        <td class="right"><b>${(sumRoas||0).toFixed(2)}×</b></td>
      `;
    }

    log('Table ok', { rows: rows.length });
  }

  // ===== Export & Autorun =====
  window.renderRerankOverview = renderRerankOverview;
  window.renderRerank         = renderRerankTable;

  if (document.getElementById('panel-rerank')) {
    try { renderRerankOverview(); renderRerankTable(); }
    catch(e){ (window.__report||console.error)('[rerank boot]', e); }
  }
})();
