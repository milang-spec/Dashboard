/* rerank.js – Sponsored Product Ads (SPA) overview
   Robust gegen fehlende Felder, ergänzt Sales aus Always-On, berechnet Revenue/eCPC falls nötig. */

(function () {
  'use strict';

  const D = window.DASHBOARD_DATA || window.D || {};

  function fmtMoney(n){ return (n||0).toLocaleString('de-DE') + ' €'; }
  function fmtNum(n){    return (n||0).toLocaleString('de-DE'); }
  function safe(n){      return isFinite(n) ? n : 0; }

  function deriveAlwaysOnSalesBySku() {
    // Suche die Kampagne "Always-On" und mappe SKU->Units
    const camps = D.campaigns || [];
    const camp = camps.find(c => (c.name||'').toLowerCase() === 'always-on');
    const map = {};
    if (camp && Array.isArray(camp.products)) {
      camp.products.forEach(p => { map[p.sku] = p.units || p.sales || 0; });
    }
    return map;
  }

  function getSpaRows() {
    // Datenquelle: D.rerank (erwartete Felder: sku, name, ad, clicks, ecpc, sales, roas, revenue?)
    const src = Array.isArray(D.rerank) ? JSON.parse(JSON.stringify(D.rerank)) : [];
    if (!src.length) return [];

    // Falls Sales fehlen: aus Always-On ableiten
    const aoSales = deriveAlwaysOnSalesBySku();

    src.forEach(r => {
      r.ad     = safe(r.ad);
      r.clicks = safe(r.clicks);
      r.ecpc   = (r.ecpc!=null) ? safe(r.ecpc) : (r.clicks ? r.ad / r.clicks : 0);
      // Sales: bevorzugt aus Datensatz; sonst Always-On; sonst 0
      r.sales  = (r.sales!=null) ? safe(r.sales) : safe(aoSales[r.sku] || 0);
      // Revenue: bevorzugt aus Datensatz; sonst ad*roas
      if (r.revenue==null) r.revenue = safe(r.ad) * safe(r.roas);
      r.revenue = safe(r.revenue);
      // ROAS: falls nicht gesetzt, aus revenue/ad ableiten
      if (r.roas==null) r.roas = r.ad ? (r.revenue / r.ad) : 0;
      r.roas = safe(r.roas);
    });

    return src;
  }

  function totals(rows){
    return rows.reduce((t,r)=>{
      t.ad      += r.ad;
      t.clicks  += r.clicks;
      t.sales   += r.sales;
      t.revenue += r.revenue;
      return t;
    }, {ad:0, clicks:0, sales:0, revenue:0});
  }

  function renderMetricCard(parent, label, valueHtml){
    const c = document.createElement('div');
    c.className = 'kpi';
    c.innerHTML = `<div class="label">${label}</div><div class="value">${valueHtml}</div>`;
    parent.appendChild(c);
  }

  function renderTable(parent, rows, t){
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap spa-table';

    const tbl = document.createElement('table');
    tbl.className = 'table';

    tbl.innerHTML = `
      <thead>
        <tr>
          <th class="left">SKU / Item</th>
          <th class="right">Ad Spend</th>
          <th class="right">Klicks</th>
          <th class="right">eCPC</th>
          <th class="right">Sales</th>
          <th class="right">Revenue</th>
          <th class="right">ROAS</th>
        </tr>
      </thead>
      <tbody></tbody>
      <tfoot>
        <tr>
          <td class="left"><b>Gesamt</b></td>
          <td class="right"><b>${fmtMoney(t.ad)}</b></td>
          <td class="right"><b>${fmtNum(t.clicks)}</b></td>
          <td class="right"><b>${(t.clicks? (t.ad/t.clicks):0).toLocaleString('de-DE',{minimumFractionDigits:2, maximumFractionDigits:2})} €</b></td>
          <td class="right"><b>${fmtNum(t.sales)}</b></td>
          <td class="right"><b>${fmtMoney(t.revenue)}</b></td>
          <td class="right"><b>${(t.ad? (t.revenue/t.ad):0).toFixed(2)}×</b></td>
        </tr>
      </tfoot>
    `;

    const tb = tbl.querySelector('tbody');
    tb.innerHTML = rows.map(r => `
      <tr>
        <td class="left">${r.sku} — ${r.name}</td>
        <td class="right">${fmtMoney(r.ad)}</td>
        <td class="right">${fmtNum(r.clicks)}</td>
        <td class="right">${r.ecpc.toLocaleString('de-DE',{minimumFractionDigits:2, maximumFractionDigits:2})} €</td>
        <td class="right">${fmtNum(r.sales)}</td>
        <td class="right">${fmtMoney(r.revenue)}</td>
        <td class="right">${r.roas.toFixed(2)}×</td>
      </tr>
    `).join('');

    wrap.appendChild(tbl);
    parent.appendChild(wrap);
  }

  // Haupt-Renderer
  window.renderRerankOverview = function renderRerankOverview(){
    const host = document.getElementById('panel-rerank');
    if (!host) return;

    // Container leeren
    host.innerHTML = '';
    const card = document.createElement('section');
    card.className = 'card';
    card.innerHTML = `<h3>Sponsored Product Ads</h3>`;
    host.appendChild(card);

    const rows = getSpaRows();
    if (!rows.length){
      const p = document.createElement('p');
      p.style.opacity = .8;
      p.textContent = 'Keine Daten für Sponsored Product Ads gefunden.';
      card.appendChild(p);
      return;
    }

    const t = totals(rows);

    const grid = document.createElement('div');
    grid.className = 'kpi-grid';
    card.appendChild(grid);

    // Budget aus Campaign "Always-On", falls vorhanden – sonst Ad-Summe als Platzhalter
    let budget = 0;
    const camps = D.campaigns || [];
    const ao = camps.find(c => (c.name||'').toLowerCase()==='always-on');
    if (ao){
      // Budget gesamt + Anteil Placement "Sponsored Product Ads", falls hinterlegt
      if (typeof ao.budget_total === 'number') {
        // Optional: falls Placement-Budget existiert, nimm dieses
        const pla = (ao.placements||[]).find(p => (p.placement||'').toLowerCase().includes('sponsored product'));
        budget = pla && typeof pla.budget==='number' ? pla.budget : ao.budget_total;
      }
    }
    if (!budget) budget = t.ad; // Fallback

    // Cards
    renderMetricCard(grid, 'Budget Total', fmtMoney(budget));
    renderMetricCard(grid, 'Ad Spend Total', fmtMoney(t.ad));
    renderMetricCard(grid, 'Klicks Total', fmtNum(t.clicks));
    renderMetricCard(grid, 'eCPC', (t.clicks? (t.ad/t.clicks):0).toLocaleString('de-DE',{minimumFractionDigits:2, maximumFractionDigits:2}) + ' €');
    renderMetricCard(grid, '% Spend', Math.round(100 * (t.ad/(budget||1))) + '%');
    renderMetricCard(grid, 'Sales', fmtNum(t.sales));
    renderMetricCard(grid, 'Revenue', fmtMoney(t.revenue));
    renderMetricCard(grid, 'ROAS', (t.ad? (t.revenue/t.ad):0).toFixed(2) + '×');

    // Tabelle
    renderTable(card, rows, t);
  };

})();
