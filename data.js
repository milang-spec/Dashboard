(function(){
  var D = window.DASHBOARD_DATA = window.DASHBOARD_DATA || {};

  // ===== Totals (Jan–Aug 2026) =====
  // Ad: 390k, Impr: 18.0M, Clicks: 365k, Sales: 12.5k, Revenue: 810k
  // Budget gesamt (neu): 520k
  var ALL_2025 = [
    {
      name: "Super Sale",
      brand: "Vitamini",
      site: "Onsite",
      model: "CPM",
      start: "2026-06-01", end: "2026-09-15",

      // Budget & Performance (Kampagnen-Ebene)
      booking: 145000,   // Budget
      ad: 100000,        // Ad Spend
      impressions: 6500000,
      clicks: 120000,
      orders: 2000,
      revenue: 60000,

     placements: [
  {
    // Awareness | Onsite | Display_Ads | Homepage Hero Banner
    strategy: "Awareness", channel: "Onsite", type: "Display_Ads",
    placement: "Homepage Hero Banner",
    booking: 55000, ad: 40000,
    start: "2026-06-01", end: "2026-06-30",
    impressions: 2600000, clicks: 45000, orders: 700, revenue: 21000
  },
  {
    // Awareness | Onsite | Display_Ads | Header Banner
    strategy: "Awareness", channel: "Onsite", type: "Display_Ads",
    placement: "Header Banner",
    booking: 45000, ad: 30000,
    start: "2026-07-01", end: "2026-07-31",
    impressions: 2000000, clicks: 40000, orders: 650, revenue: 19500
  },
  {
    // Performance | Onsite | Search_Ads | Search Hero Banner
    strategy: "Performance", channel: "Onsite", type: "Search_Ads",
    placement: "Search Hero Banner",
    booking: 45000, ad: 30000,
    start: "2026-08-01", end: "2026-09-15",
    impressions: 1900000, clicks: 35000, orders: 650, revenue: 19500
  }
],


      // Produkte (für sales.html; Summe ~ 2 000 Units, ~ 60k €)
      products: [
        { sku:"SKU-01", name:"Zink + C Immun",        units:600,  revenue:18000 },
        { sku:"SKU-02", name:"Nasenspray Mild",       units:400,  revenue:12000 },
        { sku:"SKU-03", name:"Allergie Antihistamin", units:380,  revenue:11000 },
        { sku:"SKU-04", name:"Magnesium 400 mg",      units:320,  revenue: 9000 },
        { sku:"SKU-05", name:"Probiotika Forte",      units:300,  revenue:10000 }
      ]
    },

    {
      name: "Winter Push",
      brand: "Grippi",
      site: "Offsite",
      model: "CPC",
      start: "2026-01-15", end: "2026-03-31",

      booking: 100000,
      ad: 97500,
      impressions: 3000000,
      clicks: 45000,
      orders: 1000,
      revenue: 100000,

     placements: [
  {
    // Awareness | Offsite | Programmatic_Ads | Display & Social
    strategy: "Awareness", channel: "Offsite", type: "Programmatic_Ads",
    placement: "Display & Social",
    booking: 33000, ad: 32500,
    start: "2026-01-15", end: "2026-02-10",
    impressions: 1200000, clicks: 16000, orders: 250, revenue: 25000
  },
  {
    // Performance | Offsite | Search_Ads | Paid Shopping Ad Google
    strategy: "Performance", channel: "Offsite", type: "Search_Ads",
    placement: "Paid Shopping Ad Google",
    booking: 42000, ad: 42500,
    start: "2026-02-01", end: "2026-03-15",
    impressions: 1100000, clicks: 20000, orders: 500, revenue: 55000
  },
  {
    // Engagement | CRM | CRM_Media | App Push Notification
    strategy: "Engagement", channel: "CRM", type: "CRM_Media",
    placement: "App Push Notification",
    booking: 25000, ad: 22500,
    start: "2026-02-20", end: "2026-03-10",
    impressions: 700000, clicks: 9000, orders: 250, revenue: 20000
  }
],


      products: [
        { sku:"SKU-06", name:"Vitamin C 1000",        units:350, revenue:35000 },
        { sku:"SKU-07", name:"Hustensaft Kids",       units:300, revenue:30000 },
        { sku:"SKU-08", name:"Omega-3 Fischöl",       units:200, revenue:20000 },
        { sku:"SKU-09", name:"Hautcreme Sensitive",   units:150, revenue:15000 }
      ]
    },

    {
      name: "Summer Branding",
      brand: "SunPower",
      site: "Onsite",
      model: "CPM",
      start: "2026-07-01", end: "2026-08-31",

      booking: 50000,
      ad: 42500,
      impressions: 3000000,
      clicks: 40000,
      orders: 1000,
      revenue: 50000,

    placements: [
  {
    // Awareness | Onsite | Display_Ads | Onsite Display Booster
    strategy: "Awareness", channel: "Onsite", type: "Display_Ads",
    placement: "Onsite Display Booster",
    booking: 18000, ad: 15000,
    start: "2026-07-01", end: "2026-07-20",
    impressions: 1100000, clicks: 15000, orders: 350, revenue: 17500
  },
  {
    // Awareness | Onsite | Display_Ads | App Hero Banner
    strategy: "Awareness", channel: "Onsite", type: "Display_Ads",
    placement: "App Hero Banner",
    booking: 17000, ad: 15000,
    start: "2026-07-21", end: "2026-08-10",
    impressions: 1000000, clicks: 13000, orders: 325, revenue: 16000
  },
  {
    // Awareness | Onsite | Display_Ads | Homepage Hero Banner
    strategy: "Awareness", channel: "Onsite", type: "Display_Ads",
    placement: "Homepage Hero Banner",
    booking: 15000, ad: 12500,
    start: "2026-08-11", end: "2026-08-31",
    impressions: 900000, clicks: 12000, orders: 325, revenue: 16500
  }
],


      products: [
        { sku:"SKU-10", name:"Sonnencreme LSF50",     units:420, revenue:21000 },
        { sku:"SKU-11", name:"After Sun Gel",        units:350, revenue:17000 },
        { sku:"SKU-12", name:"Zink + C Immun",       units:230, revenue:12000 }
      ]
    },

    {
      name: "Always-On",
      brand: "Multibrand",
      site: "Onsite",
      model: "CPC",
      start: "2026-01-01", end: "2026-12-31",

      booking: 225000,
      ad: 150000,
      impressions: 5500000,
      clicks: 160000,
      orders: 8500,
      revenue: 600000, // ROAS ~ 4

    placements: [
  {
    // Performance | Onsite | Sponsored Product Ads
    strategy: "Performance", channel: "Onsite", type: "Sponsored Product Ads",
    placement: "Sponsored Product Ads",
    booking: 225000, ad: 150000,
    start: "2026-01-01", end: "2026-12-31",
    impressions: 5500000, clicks: 160000, orders: 8500, revenue: 600000
  }
],
  // Die gleichen Produkte wie in sales.html (SKU-01..)
      products: [
        { sku:"SKU-01", name:"Zink + C Immun",        units:2100, revenue:125000 },
        { sku:"SKU-02", name:"Nasenspray Mild",       units:1900, revenue:105000 },
        { sku:"SKU-03", name:"Allergie Antihistamin", units:1700, revenue:100000 },
        { sku:"SKU-04", name:"Magnesium 400 mg",      units:1000, revenue: 90000 },
        { sku:"SKU-05", name:"Probiotika Forte",      units:1000, revenue: 95000 },
        { sku:"SKU-06", name:"Vitamin C 1000",        units:800, revenue: 85000 }
      ]
    }
  ];

// ------------------- SPA / rerank -------------------
D.rerank = [
  { sku:'SKU-01', name:'Zink + C Immun',     ad:32000, clicks:35556, ecpc:0.90, sales:2100, roas:4.00 }, // 128,000 €
  { sku:'SKU-02', name:'Nasenspray Mild',    ad:28000, clicks:37333, ecpc:0.75, sales:1900, roas:3.90 }, // 109,200 €
  { sku:'SKU-04', name:'Magnesium 400 mg',   ad:26000, clicks:21667, ecpc:1.20, sales:1700, roas:4.10 }, // 106,600 €
  { sku:'SKU-03', name:'Allergie Antihistamin', ad:24000, clicks:21818, ecpc:1.10, sales:1000, roas:4.10 }, // 98,400 €
  { sku:'SKU-06', name:'Vitamin C 1000',     ad:20000, clicks:25000, ecpc:0.80, sales:1000, roas:4.00 }, // 80,000 €
  { sku:'SKU-05', name:'Probiotika Forte',   ad:20000, clicks:12500, ecpc:1.60, sales: 800, roas:3.89 }  // 77,800 €
];
// Summe Ad = 150.000 €, Sales = 8.500, Revenue ≈ 600.000 €, ROAS gesamt ≈ 4,00×

  
  // ---- 2024 automatisch ableiten (einfache ~-10% Kopie) ----
  var fAd=0.92, fRev=0.90, fImp=0.95, fClk=0.93, fOrd=0.92;
  var ALL_2024 = ALL_2025.map(function(c){
    function y24(d){ return (d||'').replace('2025','2024'); }
    return {
      name:c.name, brand:c.brand, site:c.site, model:c.model,
      start:y24(c.start), end:y24(c.end),
      booking: Math.round((c.booking||0)*fAd),
      ad:       Math.round((c.ad||0)*fAd),
      impressions: Math.round((c.impressions||0)*fImp),
      clicks:      Math.round((c.clicks||0)*fClk),
      orders:      Math.round((c.orders||0)*fOrd),
      revenue:     Math.round((c.revenue||0)*fRev),
      products: (c.products||[]).map(function(p){
        return { sku:p.sku, name:p.name,
          units: Math.round((p.units||0)*fOrd),
          revenue: Math.round((p.revenue||0)*fRev) };
      }),
      placements: (c.placements||[]).map(function(p){
        return {
          strategy:p.strategy, channel:p.channel, type:p.type, placement:p.placement,
          ad: Math.round((p.ad||0)*fAd),
          impressions: Math.round((p.impressions||0)*fImp),
          clicks: Math.round((p.clicks||0)*fClk),
          orders: Math.round((p.orders||0)*fOrd),
          revenue: Math.round((p.revenue||0)*fRev)
        };
      })
    };
  });

 /* ---------- Sponsored Product Ads (Rerank/SPA Panel) ---------- */
/* Budget (Plan) fürs Widget */
D.rerank_budget = 225000; // 225.000 € Budget

/* Einzel-Items. Summe ad = 150.000 €. eCPC 0,60–2,00 €, ROAS ~3.6–4.2, Sales realistisch. */
D.rerank = [
  { sku:"SKU-01", item:"Zink + C Immun",         ad:32000, ecpc:0.90, roas:4.00, sales:900  },
  { sku:"SKU-02", item:"Nasenspray Mild",        ad:28000, ecpc:0.75, roas:3.90, sales:820  },
  { sku:"SKU-03", item:"Allergie Antihistamin",  ad:26000, ecpc:1.20, roas:3.80, sales:680  },
  { sku:"SKU-04", item:"Magnesium 400 mg",       ad:24000, ecpc:1.10, roas:4.20, sales:620  },
  { sku:"SKU-05", item:"Probiotika Forte",       ad:20000, ecpc:1.60, roas:3.60, sales:420  },
  { sku:"SKU-06", item:"Vitamin C 1000",         ad:20000, ecpc:0.80, roas:3.70, sales:360  }
];

/* HINWEIS: Klicks & Revenue werden im Widget aus obigen Werten berechnet:
   clicks  = ad / ecpc
   revenue = ad * roas
   Totals: Ad = 150.000 €, Clicks ≈ 154k, Revenue ≈ 582.800 € → ROAS ~ 3,89
*/


  // ---- Funnel mix (Anteil Awareness / Engagement / Performance) ----
D.funnel = { awareness: 0.30, engagement: 0.40, performance: 0.30 };

  /* === Harmonisierung: Produkte auf Kampagnen-Orders/Revenue skalieren === */
(function(){
  var list = window.ALL_2025 || [];
  list.forEach(function(c){
    var prods = c.products || [];
    if (!prods.length) return;

    // Units -> Orders
    var wantU = Math.round(c.orders || 0);
    var curU  = prods.reduce(function(s,p){ return s + (p.units||0); }, 0);
    if (wantU > 0 && curU !== wantU){
      if (curU <= 0){
        var per = Math.floor(wantU/prods.length), rem = wantU - per*prods.length;
        prods.forEach(function(p,i){ p.units = per + (i<rem?1:0); });
      } else {
        var rU = wantU/curU, acc=0;
        prods.forEach(function(p){ p.units = Math.floor((p.units||0)*rU); acc+=p.units; });
        for (var i=0; i<prods.length && acc<wantU; i++,acc++) prods[i].units++;
      }
    }

    // Revenue -> Kampagnenrevenue
    var wantR = Math.round(c.revenue || 0);
    var curR  = prods.reduce(function(s,p){ return s + (p.revenue||0); }, 0);
    if (wantR > 0 && curR !== wantR){
      if (curR <= 0){
        var perR = Math.floor(wantR/prods.length), remR = wantR - perR*prods.length;
        prods.forEach(function(p,i){ p.revenue = perR + (i<remR?1:0); });
      } else {
        var rR = wantR/curR, accR=0;
        prods.forEach(function(p){ p.revenue = Math.floor((p.revenue||0)*rR); accR+=p.revenue; });
        for (var j=0; j<prods.length && accR<wantR; j++,accR++) prods[j].revenue++;
      }
    }
  });
})();



  D.sov = { total: 0.17 };
  var sovCats = [
    { category:'Vitamine', sov:0.25, market_share:0.20, brand:'Vitamini' },
    { category:'Grippe',  sov:0.10, market_share:0.12, brand:'Grippi' },
    { category:'Sonnenschutz', sov:0.22, market_share:0.18, brand:'SunPower' },
    { category:'Immunsystem', sov:0.19, market_share:0.17, brand:'IngwerZink' }
  ];
  D.sov_categories = sovCats;
  D.sov_cats = sovCats;
  D.sov_details = sovCats;

  // ===== Exporte / Wiring =====
  window.ALL_2025 = ALL_2025;
  window.ALL_2024 = ALL_2024;

  window.DASHBOARD_DATA.campaigns_2025 = ALL_2025;
  window.DASHBOARD_DATA.campaigns_2024 = ALL_2024;
  window.D = window.DASHBOARD_DATA;
})();
