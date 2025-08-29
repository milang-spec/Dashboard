function renderAll(){
  var list25 = __guard('filter 2025', function(){ return applyFilter(ALL_2025, STATE.filter); });
  var list24 = __guard('filter 2024', function(){ return applyFilter(ALL_2024, STATE.filter); });
  var t25    = __guard('totals 2025', function(){ return totals(list25); });
  var t24    = __guard('totals 2024', function(){ return totals(list24); });

  __guard('renderKPIs',         function(){ renderKPIs(t25, t24); });
  __guard('renderSOVandFunnel', function(){ renderSOVandFunnel(); });
  __guard('autoSizeChart',      function(){ autoSizeChart(); });
  __guard('renderTrend',        function(){ renderTrend(list25); });
  var months = monthlyBreakdown(list25, t25);   
__guard('monthly table',      function(){ renderMonthlyTable(months, t25); });
  __guard('overview campaigns', function(){ renderCampaignOverview(ALL_2025); });

  // HIER WICHTIG: nur den NEUEN Call stehen lassen:
  __guard('table campaigns',    function(){ renderCampaignTable(list25, ALL_2025); });

  __guard('rerank overview',    function(){ renderRerankOverview((D||{}).rerank||[], (D||{}).sales_details||[]); });
  __guard('rerank table',       function(){ renderRerank((D||{}).rerank||[]); });

  window.__appRendered = true;
}


/* ========= Boot ========= */
window.addEventListener('resize',function(){
  var cfg=window.DASHBOARD_LAYOUT||{};
  if(cfg.mode!=='scroll'){ fitStageFixed(); autoSizeChart(); if(window.trendChart && trendChart.resize) trendChart.resize(); }
});
document.addEventListener('DOMContentLoaded',function(){
  try{
    applyLayoutConfig();
    bindChips();
    renderAll();
  }catch(e){ __report('BOOT', e); }
});
