
(function(){
  // Basisobjekt
  var D = window.DASHBOARD_DATA = window.DASHBOARD_DATA || {};

  /* ---------- Kampagnen 2025 (EXAKT deine Namen, mit 3 Placements je Kampagne) ---------- */
  var ALL_2025 = [
    {
      name:"Super Sale", brand:"Redcare", site:"Offsite", model:"CPC", channel:"Search",
      start:"2025-03-01", end:"2025-04-15",
      booking:95000, ad:120000, revenue:270000, orders:2000,
      impressions:7200000, clicks:120000, ctr:120000/7200000, cpc:120000/120000,
      products:[
        { sku:"SS-01", name:"Allergie Antihistamin", units:750, revenue:90000 },
        { sku:"SS-02", name:"Probiotika Forte",      units:650, revenue:85000 },
        { sku:"SS-03", name:"Zink + C Immun",        units:600, revenue:95000 }
      ],
      placements:[
        { strategy:"Upper Funnel", type:"Display",  placement:"Homepage Hero",
          impressions:2700000, clicks:45000, ad:45000, roas:2.2, orders:700, revenue:99000 },
        { strategy:"Mid Funnel",   type:"Search",   placement:"Category / Search",
          impressions:3000000, clicks:50000, ad:50000, roas:2.3, orders:800, revenue:115000 },
        { strategy:"Lower Funnel", type:"PDP",      placement:"PDP Sponsored",
          impressions:1500000, clicks:25000, ad:25000, roas:2.24, orders:500, revenue:56000 }
      ]
    },

    {
      name:"Winter Push", brand:"Redcare", site:"Offsite", model:"CPC", channel:"Search",
      start:"2025-11-15", end:"2025-12-31",
      booking:83000, ad:100000, revenue:270000, orders:1900,
      impressions:6500000, clicks:115000, ctr:115000/6500000, cpc:100000/115000,
      products:[
        { sku:"WP-01", name:"Hustensaft Kids",  units:700, revenue:90000 },
        { sku:"WP-02", name:"Vitamin C 1000",  units:650, revenue:85000 },
        { sku:"WP-03", name:"Nasenspray Mild", units:550, revenue:95000 }
      ],
      placements:[
        { strategy:"Upper Funnel", type:"Display",  placement:"Seasonal HP Banner",
          impressions:2300000, clicks:40000, ad:35000, roas:2.5,   orders:600, revenue:87500 },
        { strategy:"Mid Funnel",   type:"Search",   placement:"Category / Search",
          impressions:2700000, clicks:52000, ad:45000, roas:2.6,   orders:800, revenue:117000 },
        { strategy:"Lower Funnel", type:"PDP",      placement:"PDP Sponsored",
          impressions:1500000, clicks:23000, ad:20000, roas:3.275, orders:500, revenue:65500 } // Summe = 270.000
      ]
    },

    {
      name:"Summer Branding", brand:"Redcare", site:"Onsite", model:"CPM", channel:"Display",
      start:"2025-07-01", end:"2025-08-31",
      booking:72000, ad:80000, revenue:220000, orders:1800,
      impressions:5500000, clicks:100000, ctr:100000/5500000, cpc:80000/100000,
      products:[
        { sku:"SB-01", name:"Sonnencreme LSF 50", units:600, revenue:68000 },
        { sku:"SB-02", name:"After Sun Gel",      units:550, revenue:66000 },
        { sku:"SB-03", name:"Magnesium 400 mg",   units:650, revenue:86000 }
      ],
      placements:[
        { strategy:"Upper Funnel", type:"Display",  placement:"Homepage Hero",
          impressions:2200000, clicks:37000, ad:30000, roas:2.2,   orders:450, revenue:66000 },
        { strategy:"Mid Funnel",   type:"Display",  placement:"Category Teaser",
          impressions:1800000, clicks:35000, ad:28000, roas:2.4,   orders:400, revenue:67200 },
        { strategy:"Lower Funnel", type:"Search",   placement:"Brand Search",
          impressions:1500000, clicks:28000, ad:22000, roas:3.945, orders:350, revenue:86800 } // Summe = 220.000
      ]
    },

    {
      name:"Always-On", brand:"Redcare", site:"Offsite", model:"CPC", channel:"Mixed",
      start:"2025-01-01", end:"2025-12-31",
      booking:102000, ad:90000, revenue:261000, orders:2030,
      impressions:6818580, clicks:158230, ctr:158230/6818580, cpc:90000/158230,
      products:[
        { sku:"AO-01", name:"Hautcreme Sensitive", units:800,  revenue:82000 },
        { sku:"AO-02", name:"Omega-3 Fischöl",     units:750,  revenue:87000 },
        { sku:"AO-03", name:"Zink + C Immun",      units:700,  revenue:92000 }
      ],
      placements:[
        { strategy:"Upper Funnel", type:"Display",  placement:"Always-On Banner",
          impressions:2500000, clicks:50000, ad:30000, roas:2.2, orders:500, revenue:66000 },
        { strategy:"Mid Funnel",   type:"Search",   placement:"Generic Search",
          impressions:2800000, clicks:70000, ad:40000, roas:2.7, orders:700, revenue:108000 },
        { strategy:"Lower Funnel", type:"PDP",      placement:"PDP Sponsored",
          impressions:1518580, clicks:38230, ad:20000, roas:4.35, orders:830, revenue:87000 }
      ]
    }
  ];

  // (optional) 2024 – leer, aber vorhanden für Kompatibilität
  var ALL_2024 = [];

  /* ---------- Rerank / Sales Details / SOV / Funnel ---------- */
  D.rerank_budget = 17500;
  D.rerank = [
    { sku:"SKU-001", item:"Vitamin D 2000 IU", ad:3200,  ecpc:0.22, roas:2.80 },
    { sku:"SKU-006", item:"Allergie Antihistamin", ad:2600, ecpc:0.24, roas:2.60 },
    { sku:"SKU-003", item:"Omega-3 Fischöl", ad:2100, ecpc:0.20, roas:3.10 },
    { sku:"SKU-002", item:"Magnesium 400 mg", ad:2800, ecpc:0.25, roas:2.20 },
    { sku:"SKU-008", item:"Hautcreme Sensitive", ad:2300, ecpc:0.27, roas:1.90 },
    { sku:"SKU-004", item:"Zink + C Immun", ad:1500, ecpc:0.18, roas:2.40 }
  ];
  D.sales_details = [
    { name:"Vitamin D 2000 IU", units:14545, revenue:8960 },
    { name:"Allergie Antihistamin", units:10833, revenue:6760 },
    { name:"Omega-3 Fischöl", units:10500, revenue:6510 },
    { name:"Magnesium 400 mg", units:11200, revenue:6160 },
    { name:"Hautcreme Sensitive", units:4000, revenue:2280 },
    { name:"Zink + C Immun", units:8333, revenue:3600 }
  ];
  D.sov = { total: 0.17 };
  D.funnel = { awareness: 0.30, engagement: 0.40, performance: 0.30 };

// ---- Exporte/Wiring: ALLES verfügbar machen ----
window.ALL_2025 = ALL_2025;
window.ALL_2024 = window.ALL_2024 || [];   // falls noch nicht gesetzt

// Dashboard-Objekt sicherstellen
window.DASHBOARD_DATA = window.DASHBOARD_DATA || {};

// WICHTIG: auch unter DASHBOARD_DATA bereitstellen (einige Funktionen lesen von hier)
window.DASHBOARD_DATA.campaigns_2025 = window.ALL_2025;
window.DASHBOARD_DATA.campaigns_2024 = window.ALL_2024;

// Bequemer Alias (wird im Code teils als D genutzt)
window.D = window.DASHBOARD_DATA;

})();
