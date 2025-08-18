/* layout.js
   Steuerung von:
   - mode: 'scroll' | 'fixed-scale'
   - columns: Anzahl Grid-Spalten (z. B. 2, 3, 4, 6, 12)
   - gap: Grid-Abstand in px
   - order: Reihenfolge + Spaltenbreite (span) pro Panel
*/
window.DASHBOARD_LAYOUT = {
  mode: 'scroll',     // <<< beim TV später auf 'fixed-scale' umstellen
  columns: 12,        // 12er Grid gibt viel Flexibilität
  gap: 18,
  order: [
    { id: 'panel-kpi',    span: 12 }, // volle Breite
    { id: 'panel-camp',   span: 8  }, // 2/3
    { id: 'panel-rerank', span: 4  }  // 1/3
  ]
};

/* Beispiele:
   - Zwei Panels nebeneinander:   columns: 2, order: [{id:'panel-kpi',span:2}, {id:'panel-camp',span:1}, {id:'panel-rerank',span:1}]
   - Drei Spalten:                columns: 3, order: [{id:'panel-kpi',span:3}, {id:'panel-camp',span:2}, {id:'panel-rerank',span:1}]
*/
