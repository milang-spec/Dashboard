/* ========================= data.js (bereinigt) ========================= */
(function () {
  // Basisobjekt
  var D = window.DASHBOARD_DATA || {};

  /* ---------- Kampagnen 2025 (deine Namen, 3 Placements je Kampagne) ---------- */
  var ALL_2025 = [
    {
      name:"Super Sale", brand:"Redcare", site:"Offsite", model:"CPC", channel:"Search",
      start:"2025-06-01", end:"2025-09-15",
      booking:140000, ad:120000, revenue:270000, orders:2000,
      impressions:7200000, clicks:120000, ctr:120000/7200000, cpc:120000/120000,
      products:[
        { sku:"SS-01", name:"Allergie Antihistamin", units:750, revenue:90000 },
        { sku:"SS-02", name:"Probiotika Forte",      units:650, revenue:85000 },
        { sku:"SS-03", name:"Zink + C Immun",        units:600, revenue:95000 }
      ],
      placements:[
        { strategy:"Upper Funnel", type:"Display", placement:"Homepage Hero", channel:"Display",
          impressions:2700000, clicks:45000, ad:45000, roas:2.2, orders:700, revenue:99000 },
        { strategy:"Mid Funnel",   type:"Search",  placement:"Category / Search", channel:"Search",
          impressions:3000000, clicks:50000, ad:50000, roas:2.3, orders:800, revenue:115000 },
        { strategy:"Lower Funnel", type:"PDP",     placement:"PDP Sponsored", channel:"Search",
          impressions:1500000, clicks:25000, ad:25000, roas:2.24, orders:500, revenue:56000 }
      ]
    },
    {
      name:"Winter Push", brand:"Redcare", site:"Offsite", model:"CPC", channel:"Search",
      start:"2025-11-15", end:"2025-12-31",
      booking:123000, ad:100000, revenue:270000, orders:1900,
      impressions:6500000, clicks:115000, ctr:115000/6500000, cpc:100000/115000,
      products:[
        { sku:"WP-01", name:"Hustensaft Kids",  units:700, revenue:90000 },
        { sku:"WP-02", name:"Vitamin C 1000",  units:650, revenue:85000 },
        { sku:"WP-03", name:"Nasenspray Mild", units:550, revenue:95000 }
      ],
      placements:[
        { strategy:"Upper Funnel", type:"Display", placement:"Seasonal HP Banner", channel:"Display",
          impressions:2300000, clicks:40000, ad:35000, roas:2.5,   orders:600, revenue:87500 },
        { strategy:"Mid Funnel",   type:"Search",  placement:"Category / Search", channel:"Search",
          impressions:2700000, clicks:52000, ad:45000, roas:2.6,   orders:800, revenue:117000 },
        { strategy:"Lower Funnel", type:"PDP",     placement:"PDP Sponsored",     channel:"Search",
          impressions:1500000, clicks:23000, ad:20000, roas:3.275, orders:500, revenue:65500 } // Summe = 270.000
      ]
    },
    {
      name:"Summer Branding", brand:"Redcare", site:"Onsite", model:"CPM", channel:"Display",
      start:"2025-07-01", end:"2025-08-31",
      booking:106000, ad:80000, revenue:220000, orders:1800,
      impressions:5500000, clicks:100000, ctr:100000/5500000, cpc:80000/100000,
      products:[
        { sku:"SB-01", name:"Sonnencreme LSF 50", units:600, revenue:68000 },
        { sku:"SB-02", name:"After Sun Gel",      units:550, revenue:66000 },
        { sku:"SB-03", name:"Magnesium 400 mg",   units:650, revenue:86000 }
      ],
      placements:[
        { strategy:"Upper Funnel", type:"Display", placement:"Homepage Hero", channel:"Display",
          impressions:2200000, clicks:37000, ad:30000, roas:2.2,   orders:450, revenue:66000 },
        { strategy:"Mid Funnel",   type:"Display", placement:"Category Teaser", channel:"Display",
          impressions:1800000, clicks:35000, ad:28000, roas:2.4,   orders:400, revenue:67200 },
        { strategy:"Lower Funnel", type:"Search",  placement:"Brand Search", channel:"Search",
          impressions:1500000, clicks:28000, ad:22000, roas:3.945, orders:350, revenue:86800 } // Summe = 220.000
      ]
    },
    {
      name:"Always-On", brand:"Redcare", site:"Offsite", model:"CPC", channel:"Mixed",
      start:"2025-01-01", end:"2025-12-31",
      booking:151000, ad:90000, revenue:261000, orders:2030,
      impressions:6818580, clicks:158230, ctr:158230/6818580, cpc:90000/158230,
      products:[
        { sku:"AO-01", name:"Hautcreme Sensitive", units:800,  revenue:82000 },
        { sku:"AO-02", name:"Omega-3 Fischöl",     units:750,  revenue:87000 },
        { sku:"AO-03", name:"Zink + C Immun",      units:700,  revenue:92000 }
      ],
      placements:[
        { strategy:"Upper Funnel", type:"Display", placement:"Always-On Banner", channel:"Display",
          impressions:2500000, clicks:50000, ad:30000, roas:2.2, orders:500, revenue:66000 },
        { strategy:"Mid Funnel",   type:"Search",  placement:"Generic Search", channel:"Search",
          impressions:2800000, clicks:70000, ad:40000, roas:2.7, orders:700, revenue:108000 },
        { strategy:"Lower Funnel", type:"PDP",     placement:"PDP Sponsored", channel:"Search",
          impressions:1518580, clicks:38230, ad:20000, roas:4.35, orders:830, revenue:87000 }
      ]
    }
  ];

  /* ---------- (optional) 2024 – wird gleich ggf. automatisch erzeugt ---------- */
  var ALL_2024 = window.ALL_2024 || [];

  /* ---------- Rerank / Sales Details / SOV / Funnel ---------- */
  D.rerank_budget = 17500;
  D.rerank = [
    { sku:"SKU-001", item:"Vitamin D 2000 IU", ad:3200, ecpc:0.22, roas:2.80 },
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
  D.sov = D.sov || { total: 0.17 };
  D.funnel = D.funnel || { awareness: 0.30, engagement: 0.40, performance: 0.30 };

  /* ---------- LY (2024) automatisch aus 2025 ableiten, falls leer ---------- */
  if (!Array.isArray(ALL_2024) || !ALL_2024.length) {
    function y24(d){ return (d||'').replace('2025','2024'); }
    var fAd=0.92, fRev=0.90, fImp=0.95, fClk=0.93, fOrd=0.92;

    ALL_2024 = ALL_2025.map(function(c){
      var imp = Math.round((c.impressions||0)*fImp);
      var clk = Math.round((c.clicks||0)*fClk);
      var ad  = Math.round((c.ad||0)*fAd);
      return {
        name: c.name, brand:c.brand, site:c.site, model:c.model, channel:c.channel,
        start: y24(c.start), end: y24(c.end),
        booking: Math.round((c.booking||0)*fAd),
        ad: ad,
        revenue: Math.round((c.revenue||0)*fRev),
        orders: Math.round((c.orders||0)*fOrd),
        impressions: imp,
        clicks: clk,
        ctr: imp ? clk/imp : (c.ctr||0),
        cpc: clk ? ad/clk : (c.cpc||0),
        products: (c.products||[]).slice(0),
        placements: (c.placements||[]).map(function(p){
          return {
            strategy:p.strategy, type:p.type, placement:p.placement,
            channel:p.channel, site:p.site || c.site,
            start: p.start ? y24(p.start) : undefined,
            end:   p.end   ? y24(p.end)   : undefined,
            impressions: Math.round((p.impressions||0)*fImp),
            clicks:      Math.round((p.clicks||0)*fClk),
            ad:          Math.round((p.ad||0)*fAd),
            roas: p.roas,
            orders: Math.round((p.orders||0)*fOrd),
            revenue: (typeof p.revenue==='number') ? Math.round(p.revenue*fRev) : undefined
          };
        })
      };
    });
  }

  /* ---------- SoV-Details (für share.html etc.) ---------- */
  var sovCats = D.sov_categories || [
    { category:'Wundheilung', sov:0.25, market_share:0.20, brand:'Redcare' },
    { category:'Magen/Darm',  sov:0.10, market_share:0.12, brand:'Redcare' },
    { category:'Allergie',    sov:0.22, market_share:0.18, brand:'Redcare' },
    { category:'Immunsystem', sov:0.19, market_share:0.17, brand:'Redcare' }
  ];
  D.sov_categories = sovCats;
  D.sov_cats    = D.sov_cats    || sovCats;  // Aliase
  D.sov_details = D.sov_details || sovCats;

  /* ---------- Exporte/Wiring ---------- */
  window.ALL_2025 = ALL_2025;
  window.ALL_2024 = ALL_2024;
  window.DASHBOARD_DATA = D;

  // Manche Funktionen lesen hier:
  D.campaigns_2025 = ALL_2025;
  D.campaigns_2024 = ALL_2024;
  window.D = D; // Alias

})();  // <— eine IIFE, sauber geschlossen
