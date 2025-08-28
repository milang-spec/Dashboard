/* data.js — vNEW: budget + placements nur aus Excel-Kombis
   Gesamtziele 2025 (Jan–Aug):
   Budget 520.000 €, Ad 390.000 €, Impr. 18.000.000, Klicks 365.000, Sales 12.500, Revenue 810.000 €
*/
(function(){
  var D = window.DASHBOARD_DATA = window.DASHBOARD_DATA || {};

  /* =========================
     Kampagnen 2025 (nur Excel-Kombis):
     - Awareness / Onsite / Display_Ads / App Hero Banner
     - Mid Funnel / Search / Search / Category / Search
     - Lower Funnel / Search / PDP / PDP Sponsored
     - Always-On (ein Placement): Lower Funnel / Search / PDP / Sponsored Product Ads
     ========================= */

  var ALL_2025 = [
    {
      name: "Super Sale",
      brand: "Redcare",
      // Gesamtwerte Kampagne (müssen mit Summe Placements matchen)
      budget: 140000,
      ad:     120000,
      impressions: 6000000,
      clicks:      120000,
      orders:      4200,
      revenue:     270000,
      // Zeitraum (wichtig für Monatsverteilung)
      start: "2025-06-01",
      end:   "2025-09-15",

      // Produkte (SKU-01…); Summe = orders/revenue der Kampagne
      products: [
        { sku:"SKU-01", name:"Zink + C Immun",       units: 900,  revenue:  54000 },
        { sku:"SKU-02", name:"Nasenspray Mild",      units: 850,  revenue:  54000 },
        { sku:"SKU-03", name:"Allergie Antihistamin",units: 800,  revenue:  49500 },
        { sku:"SKU-04", name:"Magnesium 400 mg",     units: 750,  revenue:  49500 },
        { sku:"SKU-05", name:"Probiotika Forte",     units: 450,  revenue:  31500 },
        { sku:"SKU-06", name:"Omega-3 Fischöl",      units: 350,  revenue:  31500 }
      ],

      // Placements (nur Excel-Kombis!)
      placements: [
        {
          strategy:  "Awareness",
          site:      "Onsite",
          channel:   "Display_Ads",
          type:      "Display_Ads",
          placement: "App Hero Banner",
          budget:    80000,
          ad:        72000,
          impressions: 3200000,
          clicks:      44000,
          orders:      800,
          revenue:     75000
        },
        {
          strategy:  "Mid Funnel",
          site:      "Offsite",
          channel:   "Search",
          type:      "Search",
          placement: "Category / Search",
          budget:    38000,
          ad:        30000,
          impressions: 1900000,
          clicks:      52000,
          orders:      1800,
          revenue:     115000
        },
        {
          strategy:  "Lower Funnel",
          site:      "Offsite",
          channel:   "Search",
          type:      "PDP",
          placement: "PDP Sponsored",
          budget:    22000,
          ad:        18000,
          impressions: 900000,
          clicks:      24000,
          orders:      1600,
          revenue:     80000
        }
      ]
    },

    {
      name: "Winter Push",
      brand: "Redcare",
      budget: 120000,
      ad:     100000,
      impressions: 5000000,
      clicks:      115000,
      orders:      3800,
      revenue:     270000,
      start: "2025-11-15",
      end:   "2025-12-31",

      products: [
        { sku:"SKU-01", name:"Zink + C Immun",       units: 800,  revenue:  51000 },
        { sku:"SKU-02", name:"Nasenspray Mild",      units: 780,  revenue:  51000 },
        { sku:"SKU-03", name:"Allergie Antihistamin",units: 700,  revenue:  45000 },
        { sku:"SKU-04", name:"Magnesium 400 mg",     units: 680,  revenue:  45000 },
        { sku:"SKU-05", name:"Probiotika Forte",     units: 440,  revenue:  39000 },
        { sku:"SKU-06", name:"Omega-3 Fischöl",      units: 400,  revenue:  39000 }
      ],

      placements: [
        {
          strategy:  "Awareness",
          site:      "Onsite",
          channel:   "Display_Ads",
          type:      "Display_Ads",
          placement: "App Hero Banner",
          budget:    70000,
          ad:        60000,
          impressions: 2300000,
          clicks:      40000,
          orders:      1000,
          revenue:     85000
        },
        {
          strategy:  "Mid Funnel",
          site:      "Offsite",
          channel:   "Search",
          type:      "Search",
          placement: "Category / Search",
          budget:    32000,
          ad:        25000,
          impressions: 1900000,
          clicks:      52000,
          orders:      1600,
          revenue:     110000
        },
        {
          strategy:  "Lower Funnel",
          site:      "Offsite",
          channel:   "Search",
          type:      "PDP",
          placement: "PDP Sponsored",
          budget:    18000,
          ad:        15000,
          impressions: 800000,
          clicks:      23000,
          orders:      1200,
          revenue:     75000
        }
      ]
    },

    {
      name: "Summer Branding",
      brand: "Redcare",
      budget: 110000,
      ad:      80000,
      impressions: 4000000,
      clicks:      100000,
      orders:      3000,
      revenue:     180000,
      start: "2025-07-01",
      end:   "2025-08-31",

      products: [
        { sku:"SKU-01", name:"Zink + C Immun",       units: 700,  revenue:  42000 },
        { sku:"SKU-02", name:"Nasenspray Mild",      units: 650,  revenue:  42000 },
        { sku:"SKU-03", name:"Allergie Antihistamin",units: 600,  revenue:  36000 },
        { sku:"SKU-04", name:"Magnesium 400 mg",     units: 550,  revenue:  30000 },
        { sku:"SKU-05", name:"Probiotika Forte",     units: 300,  revenue:  18000 },
        { sku:"SKU-06", name:"Omega-3 Fischöl",      units: 200,  revenue:  12000 }
      ],

      placements: [
        {
          strategy:  "Awareness",
          site:      "Onsite",
          channel:   "Display_Ads",
          type:      "Display_Ads",
          placement: "App Hero Banner",
          budget:    82000,
          ad:        60000,
          impressions: 2200000,
          clicks:      37000,
          orders:      900,
          revenue:     66000
        },
        {
          strategy:  "Mid Funnel",
          site:      "Offsite",
          channel:   "Search",
          type:      "Search",
          placement: "Category / Search",
          budget:    16000,
          ad:        12000,
          impressions: 1100000,
          clicks:      35000,
          orders:      1100,
          revenue:     67000
        },
        {
          strategy:  "Lower Funnel",
          site:      "Offsite",
          channel:   "Search",
          type:      "PDP",
          placement: "PDP Sponsored",
          budget:    12000,
          ad:         8000,
          impressions: 700000,
          clicks:      28000,
          orders:      1000,
          revenue:     47000
        }
      ]
    },

    {
      name: "Always-On",
      brand: "Redcare",
      // Nur EIN Placement (Zeile 9 sinngemäß): Sponsored Product Ads
      budget: 150000,
      ad:      90000,
      impressions: 3000000,
      clicks:      30000,
      orders:      1500,
      revenue:      90000,
      start: "2025-01-01",
      end:   "2025-12-31",

      products: [
        { sku:"SKU-01", name:"Zink + C Immun",       units: 350,  revenue:  21000 },
        { sku:"SKU-02", name:"Nasenspray Mild",      units: 300,  revenue:  18000 },
        { sku:"SKU-03", name:"Allergie Antihistamin",units: 280,  revenue:  16800 },
        { sku:"SKU-04", name:"Magnesium 400 mg",     units: 260,  revenue:  15600 },
        { sku:"SKU-05", name:"Probiotika Forte",     units: 160,  revenue:   9600 },
        { sku:"SKU-06", name:"Omega-3 Fischöl",      units: 150,  revenue:   9000 }
      ],

      placements: [
        {
          strategy:  "Lower Funnel",
          site:      "Offsite",
          channel:   "Search",
          type:      "PDP",
          placement: "Sponsored Product Ads",
          budget:    150000,
          ad:         90000,
          impressions: 3000000,
          clicks:      30000,
          orders:      1500,
          revenue:     90000
        }
      ]
    }
  ];

  /* ========= Kontrolle Gesamt-Summen (sollten 520k/390k/18M/365k/12.5k/810k ergeben) ========= */
  function sum(list, key){
    return list.reduce((a,c)=>a+(+c[key]||0),0);
  }
  (function checkTotals(){
    var ad  = sum(ALL_2025,'ad');
    var bud = sum(ALL_2025,'budget');
    var imp = sum(ALL_2025,'impressions');
    var clk = sum(ALL_2025,'clicks');
    var ord = sum(ALL_2025,'orders');
    var rev = sum(ALL_2025,'revenue');
    // Wenn nötig, hier warnen – in der UI wird nichts gebremst.
    console.log('[DATA] Totals 2025 — Budget:',bud,'Ad:',ad,'Imp:',imp,'Clk:',clk,'Sales:',ord,'Rev:',rev);
  })();

  /* ========== 2024 automatisch ableiten (leichte Reduktion) ========== */
  if (!window.ALL_2024 || !window.ALL_2024.length){
    function y24(d){ return (d||'').replace('2025','2024'); }
    var fAd=0.92, fRev=0.90, fImp=0.95, fClk=0.93, fOrd=0.92;

    window.ALL_2024 = ALL_2025.map(function(c){
      return {
        name: c.name, brand:c.brand,
        budget: Math.round((c.budget||0)*fAd),
        ad:     Math.round((c.ad||0)*fAd),
        impressions: Math.round((c.impressions||0)*fImp),
        clicks:      Math.round((c.clicks||0)*fClk),
        orders:      Math.round((c.orders||0)*fOrd),
        revenue:     Math.round((c.revenue||0)*fRev),
        start: y24(c.start), end: y24(c.end),
        products: (c.products||[]).map(function(p){
          return {
            sku:p.sku, name:p.name,
            units:  Math.round((p.units||0)*fOrd),
            revenue:Math.round((p.revenue||0)*fRev)
          };
        }),
        placements: (c.placements||[]).map(function(p){
          return {
            strategy:p.strategy, site:p.site, channel:p.channel, type:p.type, placement:p.placement,
            budget: Math.round((p.budget||0)*fAd),
            ad:     Math.round((p.ad||0)*fAd),
            impressions: Math.round((p.impressions||0)*fImp),
            clicks:      Math.round((p.clicks||0)*fClk),
            orders:      Math.round((p.orders||0)*fOrd),
            revenue:     Math.round((p.revenue||0)*fRev)
          };
        })
      };
    });
  }

  /* ===== Sponsored Product Ads – Widget unten (Budget = Always-On Budget) ===== */
  D.rerank_budget = 150000; // entspricht Always-On budget
  D.rerank = [
    { sku:"SKU-01", item:"Zink + C Immun",       ad:32000, ecpc:0.22, roas:3.8 },
    { sku:"SKU-02", item:"Nasenspray Mild",      ad:28000, ecpc:0.24, roas:3.6 },
    { sku:"SKU-03", item:"Allergie Antihistamin",ad:24000, ecpc:0.20, roas:4.1 },
    { sku:"SKU-04", item:"Magnesium 400 mg",     ad:22000, ecpc:0.25, roas:3.5 },
    { sku:"SKU-05", item:"Probiotika Forte",     ad:22000, ecpc:0.27, roas:3.2 },
    { sku:"SKU-06", item:"Omega-3 Fischöl",      ad:22000, ecpc:0.18, roas:4.0 }
  ];

  // (optionales) Sales-Detail-Sample – wird in sales.html aus Kampagnen aggregiert;
  // hier lassen wir ein kleines Set für evtl. zusätzliche Kacheln stehen.
  D.sales_details = [
    { name:"Zink + C Immun", units:1800, revenue:117000 },
    { name:"Nasenspray Mild", units:1780, revenue:117000 },
    { name:"Allergie Antihistamin", units:1680, revenue:100800 },
    { name:"Magnesium 400 mg", units:1650, revenue: 95100 },
    { name:"Probiotika Forte", units: 950, revenue: 59100 },
    { name:"Omega-3 Fischöl", units: 700, revenue: 52500 }
  ];

  /* ===== SoV & Funnel ===== */
  D.sov = { total: 0.17 }; // 17 %
  var sovCats = [
    { category:'Wundheilung', sov:0.25, market_share:0.20, brand:'Redcare' },
    { category:'Magen/Darm',  sov:0.10, market_share:0.12, brand:'Redcare' },
    { category:'Allergie',    sov:0.22, market_share:0.18, brand:'Redcare' },
    { category:'Immunsystem', sov:0.19, market_share:0.17, brand:'Redcare' }
  ];
  D.sov_categories = sovCats;
  D.sov_cats    = D.sov_cats    || sovCats;
  D.sov_details = D.sov_details || sovCats;

  D.funnel = { awareness: 0.30, engagement: 0.40, performance: 0.30 };

  /* ===== Exporte/Wiring ===== */
  window.ALL_2025 = ALL_2025;
  window.ALL_2024 = window.ALL_2024 || [];
  window.DASHBOARD_DATA.campaigns_2025 = window.ALL_2025;
  window.DASHBOARD_DATA.campaigns_2024 = window.ALL_2024;
  window.D = window.DASHBOARD_DATA;
})();
