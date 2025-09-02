// rerank.js  — Sponsored Product Ads (= Always-On / SPA) endgültiger Renderer
(function () {
  // ---------- Helpers ----------
  function fmtNum(n) { return (n || 0).toLocaleString('de-DE'); }
  function fmtMoney0(n) { return (n || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }); }
  function fmtMoney2(n) { return (n || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function findOne() {
    // akzeptiert mehrere Selektoren/IDs; nimmt den ersten, der existiert
    for (var i = 0; i < arguments.length; i++) {
      var sel = arguments[i];
      var el = document.getElementById(sel) || document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  // ---------- Datenmodell aus data.js gewinnen ----------
  function computeSPA() {
    var D = window.DASHBOARD_DATA || {};
    var CAMPS = D.campaigns_2025 || D.campaigns || [];
    var camp = CAMPS.find(function (c) { return c && c.name === 'Always-On'; });
    if (!camp) return null;

    // Das Placement „Sponsored Product Ads“
    var pla = (camp.placements || []).find(function (p) {
      return (p.placement || '').toLowerCase() === 'sponsored product ads';
    }) || (camp.placements || [])[0];

    // Totals: bevorzugt Placement-Werte; sonst Kampagne
    var totals = {
      budget: +(pla && pla.booking) || +(camp.booking || 0),
      spend: +(pla && pla.ad) || +(camp.ad || 0),
      clicks: +(pla && pla.clicks) || +(camp.clicks || 0),
      sales: +(pla && pla.orders) || +(camp.orders || 0),
      revenue: +(pla && pla.revenue) || +(camp.revenue || 0)
    };
    totals.ecpc = totals.clicks ? totals.spend / totals.clicks : 0;
    totals.roas = totals.spend ? totals.revenue / totals.spend : 0;

    // Produkte: wir nehmen die Kampagnen-Produkte (die entsprechen bei Always-On genau SPA)
    var base = (camp.products || []).slice();
    // Falls nötig proportional auf exakte totals skalieren (Rundung gleicht letzter Eintrag aus)
    var sumU = base.reduce(function (a, b) { return a + (+b.units || 0); }, 0);
    var sumR = base.reduce(function (a, b) { return a + (+b.revenue || 0); }, 0);
    var fU = sumU ? (totals.sales / sumU) : 0;
    var fR = sumR ? (totals.revenue / sumR) : 0;

    var rows = base.map(function (p) {
      return {
        sku: p.sku || '',
        name: p.name || '',
        units: Math.round((+p.units || 0) * fU),
        revenue: Math.round((+p.revenue || 0) * fR)
      };
    });

    // Rundungsdifferenzen auf dem letzten Eintrag ausgleichen
    function fix(field, target) {
      var cur = rows.reduce(function (a, b) { return a + (+b[field] || 0); }, 0);
      var diff = target - cur;
      if (rows.length && diff) rows[rows.length - 1][field] += diff;
    }
    fix('units', totals.sales);
    fix('revenue', totals.revenue);

    // Für Tabelle benötigen wir Spend/Clicks/eCPC/ROAS je SKU -> über Revenue-Anteil verteilen
    var totalRev = rows.reduce(function (a, b) { return a + (+b.revenue || 0); }, 0) || 1;
    rows = rows.map(function (r) {
      var share = (+r.revenue || 0) / totalRev;
      var spend = Math.round(totals.spend * share);
      var clicks = Math.round(totals.ecpc ? (spend / totals.ecpc) : 0);
      var ecpc = clicks ? (spend / clicks) : 0;
      var roas = spend ? (r.revenue / spend) : 0;
      return {
        sku: r.sku,
        name: r.name,
        spend: spend,
        clicks: clicks,
        ecpc: ecpc,
        units: r.units,
        revenue: r.revenue,
        roas: roas
      };
    });

    // Auch hier Summen 100% korrekt ziehen
    function fixRows(field, target) {
      var cur = rows.reduce(function (a, b) { return a + (+b[field] || 0); }, 0);
      var diff = target - cur;
      if (rows.length && diff) rows[rows.length - 1][field] += diff;
    }
    fixRows('spend', totals.spend);
    fixRows('clicks', totals.clicks);

    return { totals: totals, rows: rows };
  }

  // ---------- Rendering in bestehendes Markup ----------
  function renderRerank() {
    var model = computeSPA();
    if (!model) return;

    // KPI-Kacheln füllen (flexibel: probiert verschiedene IDs/Klassen)
    var t = model.totals;
    var el;
    if ((el = findOne('spaBudget', '.spa-budget'))) el.textContent = fmtMoney0(t.budget);
    if ((el = findOne('spaSpend', '.spa-spend'))) el.textContent = fmtMoney0(t.spend);
    if ((el = findOne('spaClicks', '.spa-clicks'))) el.textContent = fmtNum(t.clicks);
    if ((el = findOne('spaECPC', '.spa-ecpc'))) el.textContent = fmtMoney2(t.ecpc);
    if ((el = findOne('spaSales', '.spa-sales'))) el.textContent = fmtNum(t.sales);
    if ((el = findOne('spaRevenue', '.spa-revenue'))) el.textContent = fmtMoney0(t.revenue);
    if ((el = findOne('spaROAS', '.spa-roas'))) el.textContent = t.roas.toFixed(2) + '×';

    // Tabelle
    var tbody =
      document.getElementById('spaTBody') ||
      document.querySelector('#spaTable tbody, .spa-table tbody');

    if (tbody) {
      tbody.innerHTML = model.rows.map(function (r) {
        return '<tr>' +
          '<td> ' + (r.sku || '') + ' — ' + (r.name || '') + '</td>' +
          '<td class="right">' + fmtMoney0(r.spend) + '</td>' +
          '<td class="right">' + fmtNum(r.clicks) + '</td>' +
          '<td class="right">' + fmtMoney2(r.ecpc) + '</td>' +
          '<td class="right">' + fmtNum(r.units) + '</td>' +
          '<td class="right">' + fmtMoney0(r.revenue) + '</td>' +
          '<td class="right">' + (r.roas ? r.roas.toFixed(2) + '×' : '—') + '</td>' +
          '</tr>';
      }).join('');
    }

    // Fußzeile (falls vorhanden)
    var tfoot =
      document.getElementById('spaTFoot') ||
      document.querySelector('#spaTable tfoot tr, .spa-table tfoot tr');

    if (tfoot) {
      var cells = tfoot.querySelectorAll('td');
      // Layout: 0=Gesamt, 1(Spend),2(Clicks),3(eCPC),4(Sales),5(Revenue),6(ROAS)
      if (cells[1]) cells[1].textContent = fmtMoney0(t.spend);
      if (cells[2]) cells[2].textContent = fmtNum(t.clicks);
      if (cells[3]) cells[3].textContent = fmtMoney2(t.ecpc);
      if (cells[4]) cells[4].textContent = fmtNum(t.sales);
      if (cells[5]) cells[5].textContent = fmtMoney0(t.revenue);
      if (cells[6]) cells[6].textContent = t.roas.toFixed(2) + '×';
    }
  }

  // nach außen verfügbar machen, damit app.js sicher aufrufen kann
  window.renderRerank = renderRerank;
})();
