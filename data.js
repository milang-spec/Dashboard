window.DASHBOARD_DATA = {
  campaigns: [
    {
      name: "New Year Boost",
      channel: "Search",
      buy: "Direct",
      start: "2025-01-01",
      end:   "2025-02-15",
      booking: 60000,
      ad:      54000,
      revenue: 162000,
      orders:  1350
    },
    {
      name: "Spring Awareness",
      channel: "Display",
      buy: "Programmatic",
      start: "2025-02-20",
      end:   "2025-03-31",
      booking: 50000,
      ad:      44000,
      revenue: 99000,
      orders:  620
    },
    {
      name: "Easter Drive",
      channel: "Paid Social",
      buy: "Direct",
      start: "2025-03-20",
      end:   "2025-04-30",
      booking: 80000,
      ad:      76000,
      revenue: 209000,
      orders:  1580
    },
    {
      name: "Early Summer Sale",
      channel: "Search",
      buy: "Direct",
      start: "2025-05-01",
      end:   "2025-06-15",
      booking: 70000,
      ad:      63000,
      revenue: 176000,
      orders:  1280
    },
    {
      name: "Prime Push",
      channel: "Affiliate",
      buy: "Network",
      start: "2025-06-20",
      end:   "2025-07-20",
      booking: 90000,
      ad:      84000,
      revenue: 210000,
      orders:  1700
    },
    {
      name: "Back to Routine",
      channel: "Paid Social",
      buy: "Programmatic",
      start: "2025-07-25",
      end:   "2025-08-31",
      booking: 75000,
      ad:      69000,
      revenue: 165000,
      orders:  1200
    }
  ],

  // Re-Rank: korrekte Klicks = ad/ecpc; revenue = roas*ad
  rerank: [
    { sku: "SKU-001", item: "Vitamin D 2000 IU",     ad: 3200,  ecpc: 0.22, roas: 2.8, sales: 0 }, // sales optional
    { sku: "SKU-002", item: "Magnesium 400 mg",      ad: 2800,  ecpc: 0.25, roas: 2.2, sales: 0 },
    { sku: "SKU-003", item: "Omega-3 Fischöl",       ad: 2100,  ecpc: 0.20, roas: 3.1, sales: 0 },
    { sku: "SKU-004", item: "Zink + C Immune",       ad: 1500,  ecpc: 0.18, roas: 2.4, sales: 0 },
    { sku: "SKU-005", item: "Hautcreme Sensitive",   ad: 1200,  ecpc: 0.30, roas: 1.9, sales: 0 },
    { sku: "SKU-006", item: "Allergie Antihistamin", ad: 2600,  ecpc: 0.24, roas: 2.6, sales: 0 },
    { sku: "SKU-007", item: "Probiotika Forte",      ad: 1800,  ecpc: 0.21, roas: 2.0, sales: 0 },
    { sku: "SKU-008", item: "Schmerzgel 5%",         ad: 2300,  ecpc: 0.27, roas: 2.3, sales: 0 }
  ]
};
