/* ===== Sponsored Product Ads (SPA/Rerank) — rein statisch aus data.js =====
   Erwartet in data.js:
     D.rerank_budget : number        // z.B. 225000
     D.rerank : Array<{ sku, name, ad, clicks?, ecpc?, sales?, roas?, revenue? }>
   IDs in index.html:
     #rr-budget #rr-ad #rr-clicks #rr-ecpc #rr-pct #rr-sales #rr-revenue #rr-roas
     Tabelle: #rerankTable (tbody) + #rerankTotalRow
*/

(function (w) {
  'use strict';

  function byId(id){ return document.getElementById(id); }
  function txt(id, s){ const el=byId(id); if(el) el.textContent = s; }

  function asNum(x){ const v = Number(x); return isFinite(v) ? v : 0; }

  // aus einer Zeile alle KPIs berechnen (Clicks/Revenue/Ecpc/Roas ggf. ableiten)
  function normalizeRow(r){
    const out = Object.assign({}, r);
    out.ad      = asNum(out.ad);
    // Clicks ggf. aus Ad/eCPC ableiten
    if (out.clicks == null) {
      out.ecpc = asNum(out.ecpc);
      out.clicks = out.ecpc ? (out.ad / out.ecpc) : 0;
    } else {
      out.clicks = asNum(out.clicks);
    }
    // Revenue ggf. aus Ad*ROAS ableiten
    if (out.revenue == null) {
      out.roas = asNum(out.roas);
      out.revenue = out.roas ? (out.ad * out.roas) : 0;
    } else {
      out.revenue = asNum(out.revenue);
    }
    // eCPC ggf. aus Ad/Clicks ableiten
    if (out.ecpc == null) {
      out.ecpc = out.clicks ? (out.ad / out.clicks) : 0;
    } else {
      out.ecpc = asNum(out.ecpc);
    }
    // ROAS ggf. aus Revenue/Ad ableiten
    if (out.roas == null) {
      out.roas = out.ad ? (out.revenue / out.ad) : 0;
    } else {
      out.roas = asNum(out.roas);
    }
    // Sales als Zahl (falls vorhanden)
    out.sales = asNum(out.sales);
    return out;
  }

  function computeTotals(rows){
    return rows.reduce((t, r) => {
      t.ad      += r.ad;
      t.clicks  += r.clicks;
      t.sales   += r.sales;
      t.revenue += r.revenue;
      return t;
    }, {ad:0, clicks:0, sales:0, revenue:0});
  }

  function renderKPIs(budget, totals){
    txt('rr-budget',  fmtMoney0(budget));
    txt('rr-ad',      fmtMoney0(totals.ad));
    txt('rr-clicks',  fmtNum(Math.round(totals.clicks)));
    txt('rr-ecpc',    fmtMoney2(safeDiv(totals.ad, totals.clicks)));
    txt('rr-pct',     fmtPct1(safeDiv(totals.ad, budget)));
    txt('rr-sales',   fmtNum(Math.round(totals.sales)));
    txt('rr-revenue', fmtMoney0(totals.revenue));
    const roas = safeDiv(totals.revenue, totals.ad);
    txt('rr-roas', roas ? roas.toFixed(2) + '×' : '—');
  }

  function renderTable(rows){
    const tbody = document.querySelector('#rerankTable tbody');
    const trow  = byId('rerankTotalRow');
    if (!tbody || !trow) return;

    const html = rows.map(r => {
      return `<tr>
        <td>${(r.sku||'')}${r.name ? ' — '+r.name : ''}</td>
        <td class="right">${fmtMoney0(r.ad)}</td>
        <td class="right">${fmtNum(Math.round(r.clicks))}</td>
        <td class="right">${fmtMoney2(r.ecpc)}</td>
        <td class="right">${fmtNum(Math.round(r.sales))}</td>
        <td class="right">${fmtMoney0(r.revenue)}</td>
        <td class="right">${(r.roas||0).toFixed(2)}×</td>
      </tr>`;
    }).join('');
    tbody.innerHTML = html;

    const totals = computeTotals(rows);
    const totEcpc = safeDiv(totals.ad, totals.clicks);
    const totRoas = safeDiv(totals.revenue, totals.ad);

    trow.innerHTML = `
      <td><b>Gesamt</b></td>
      <td class="right"><b>${fmtMoney0(totals.ad)}</b></td>
      <td class="right"><b>${fmtNum(Math.round(totals.clicks))}</b></td>
      <td class="right"><b>${fmtMoney2(totEcpc)}</b></td>
      <td class="right"><b>${fmtNum(Math.round(totals.sales))}</b></td>
      <td class="right"><b>${fmtMoney0(totals.revenue)}</b></td>
      <td class="right"><b>${totRoas ? totRoas.toFixed(2)+'×' : '—'}</b></td>
    `;
  }

  // ===== Öffentliche Render-Funktion =====
  function renderRerank(){
    try{
      const D = w.D || w.DASHBOARD_DATA || {};
      const budget = asNum(D.rerank_budget);
      const rowsRaw = Array.isArray(D.rerank) ? D.rerank : [];

      if (!rowsRaw.length){
        __report('rerank', 'Keine D.rerank Daten gefunden.');
        // UI sauber leeren
        ['rr-budget','rr-ad','rr-clicks','rr-ecpc','rr-pct','rr-sales','rr-revenue','rr-roas']
          .forEach(id => txt(id, '—'));
        const tbody = document.querySelector('#rerankTable tbody');
        const trow  = byId('rerankTotalRow');
        if (tbody) tbody.innerHTML = '';
        if (trow)  trow.innerHTML = '<td colspan="7" class="right muted">—</td>';
        return;
      }

      // Normalisieren + Totals
      const rows = rowsRaw.map(normalizeRow);
      const totals = computeTotals(rows);

      renderKPIs(budget, totals);
      renderTable(rows);

      // Debug-Hinweis (hilfreich in der Konsole)
      console.log('[rerank] gerendert:', {budget, rows, totals});
    }catch(e){
      __report('rerank', e);
    }
  }

  // global verfügbar machen – wird in app.js aufgerufen
  w.renderRerank = renderRerank;

})(window);
