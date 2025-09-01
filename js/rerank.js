/* js/rerank.js */
(function (w) {
  'use strict';

  // ---------- kleine Helfer ----------
  const N = v => Number(v) || 0;
  const Q = sel => document.querySelector(sel);
  const setText = (selList, text) => {
    (Array.isArray(selList) ? selList : [selList])
      .filter(Boolean)
      .forEach(sel => {
        const el = typeof sel === 'string' ? Q(sel) : sel;
        if (el) el.textContent = text;
      });
  };

  // Finde Always-On → Sponsored Product Ads in den Kampagnen
  function findSpaPlacementFromCampaigns() {
    const D = w.D || {};
    const campaigns = D.campaigns || [];
    const camp = campaigns.find(c =>
      /always[- ]on/i.test(c.name || c.campaign || '')
    );
    if (!camp) return null;

    const p = (camp.placements || []).find(x =>
      /sponsored\s*product\s*ads/i.test(
        (x.placement || x.name || x.title || '') + ' ' + (x.type || '')
      )
    );
    if (!p) return null;

    return {
      budget: N(p.budget),
      ad: N(p.ad || p.ad_spend),
      clicks: N(p.clicks),
      sales: N(p.sales || p.orders || p.units),
      revenue: N(p.revenue),
      ecpc: (N(p.ad || p.ad_spend) && N(p.clicks))
        ? (N(p.ad || p.ad_spend) / Math.max(1, N(p.clicks)))
        : 0,
      roas: (N(p.ad || p.ad_spend))
        ? (N(p.revenue) / Math.max(1, N(p.ad || p.ad_spend)))
        : 0
    };
  }

  // Fallback: aus sales_details (falls du das lieber nutzt)
  function fallbackSpaFromSalesDetails(salesDetails) {
    const rows = Array.isArray(salesDetails) ? salesDetails : [];
    // sehr defensiv – filter auf „Always-On“ + „Sponsored Product Ads“ wenn Felder vorhanden
    const items = rows.filter(r => {
      const c = (r.campaign || r.camp || '').toLowerCase();
      const p = (r.placement || r.place || '').toLowerCase();
      return c.includes('always') && c.includes('on') &&
             p.includes('sponsored') && p.includes('product');
    });
    const sales = items.reduce((a, r) => a + N(r.units || r.sales), 0);
    const revenue = items.reduce((a, r) => a + N(r.revenue), 0);
    return { sales, revenue };
  }

  // ---------- OVERVIEW: Kacheln oberhalb der Tabelle ----------
  function renderRerankOverview(rerank, salesDetails) {
    // Container prüfen – wenn nicht vorhanden, still raus
    const box = document.getElementById('spaOverview')
            || document.querySelector('.spa-overview')
            || document.getElementById('rerankOverview');
    if (!box) return;

    // Datenquelle: bevorzugt Kampagnen → SPA-Placement
    let spa = findSpaPlacementFromCampaigns();
    if (!spa) {
      const fb = fallbackSpaFromSalesDetails(salesDetails || []);
      spa = {
        budget: 0, ad: 0, clicks: 0,
        sales: fb.sales, revenue: fb.revenue,
        ecpc: 0, roas: 0
      };
    }

    // Werte ins UI schreiben (mehrere mögliche Targets unterstützt)
    setText(['#spaBudgetVal',  Q('#spaBudget .value')],    fmtMoney0(spa.budget));
    setText(['#spaAdVal',      Q('#spaAd .value')],        fmtMoney0(spa.ad));
    setText(['#spaClicksVal',  Q('#spaClicks .value')],    fmtNum(spa.clicks));
    setText(['#spaECPCVal',    Q('#spaECPC .value')],      fmtMoney2(spa.ecpc));
    setText(['#spaROASVal',    Q('#spaROAS .value')],      (spa.roas||0).toFixed(2)+'×');
    setText(['#spaSalesVal',   Q('#spaSales .value')],     fmtNum(spa.sales));
    setText(['#spaRevenueVal', Q('#spaRevenue .value')],   fmtMoney0(spa.revenue));
  }

  // ---------- TABELLE: SPA Produkte (unten) ----------
  function renderRerank(rerank) {
    // erwartet ein Array von SKU-Zeilen; wenn keins, nichts tun
    const tbody = document.querySelector('#spaTable tbody');
    if (!tbody) return;

    const rows = Array.isArray(rerank) ? rerank : [];
    if (!rows.length) return;

    // Render
    let sumAd=0, sumClicks=0, sumSales=0, sumRev=0;
    const html = rows.map(r => {
      const ad     = N(r.ad || r.ad_spend);
      const clicks = N(r.clicks);
      const sales  = N(r.sales || r.units);
      const rev    = N(r.revenue);
      const ecpc   = clicks ? ad / clicks : 0;
      const roas   = ad ? rev / ad : 0;

      sumAd += ad; sumClicks += clicks; sumSales += sales; sumRev += rev;

      return (
        '<tr>' +
          '<td>' + (r.sku || '') + ' — ' + (r.name || r.item || '') + '</td>' +
          '<td class="right">' + fmtMoney0(ad)      + '</td>' +
          '<td class="right">' + fmtNum(clicks)     + '</td>' +
          '<td class="right">' + fmtMoney2(ecpc)    + '</td>' +
          '<td class="right">' + fmtNum(sales)      + '</td>' +
          '<td class="right">' + fmtMoney0(rev)     + '</td>' +
          '<td class="right">' + (roas||0).toFixed(2) + '×</td>' +
        '</tr>'
      );
    }).join('');

    tbody.innerHTML = html;

    // Summenzeile, falls vorhanden
    const sumRow = document.querySelector('#spaTable tfoot tr');
    if (sumRow) {
      sumRow.innerHTML =
        '<td><b>Gesamt</b></td>' +
        '<td class="right"><b>'+fmtMoney0(sumAd)+'</b></td>' +
        '<td class="right"><b>'+fmtNum(sumClicks)+'</b></td>' +
        '<td class="right"><b>'+fmtMoney2(sumClicks? (sumAd/sumClicks):0)+'</b></td>' +
        '<td class="right"><b>'+fmtNum(sumSales)+'</b></td>' +
        '<td class="right"><b>'+fmtMoney0(sumRev)+'</b></td>' +
        '<td class="right"><b>'+(sumAd? (sumRev/sumAd):0).toFixed(2)+'×</b></td>';
    }
  }

  // ---- als globale Funktionen bereitstellen (wichtig für app.js) ----
  w.renderRerankOverview = renderRerankOverview;
  w.renderRerank = renderRerank;
})(window);
