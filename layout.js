// layout.js (neu)
window.DASHBOARD_LAYOUT = {
  mode: 'scroll',   // Seite darf scrollen
  columns: 12,      // 12er Grid
  gap: 18,          // Abstand zwischen Cards
  order: [
    { id: 'panel-hero',    span: 12 }, // Header (Logo + Titel)
    { id: 'panel-monthly', span: 12 }, // Monthly Performance
    { id: 'panel-camp',    span: 12 }, // Campaign Performance
    { id: 'panel-rerank',  span: 12 }  // Sponsored Product Ads
  ]
};
