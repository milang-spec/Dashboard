/* ========= Daten / State ========= */
var D = window.DASHBOARD_DATA || { campaigns_2025: [], campaigns_2024: [], rerank: [], sales_details: [] };
var ALL_2025 = D.campaigns_2025 || [];
var ALL_2024 = D.campaigns_2024 || [];
var STATE = window.STATE || (window.STATE = { filter:'ALL', expanded: new Set() });
var MONTHS = ['Jan','Feb','Mrz','Apr','Mai','Jun','Jul','Aug'];

/* ========= Filter ========= */
function predicateFor(f){
  switch(f){
    case 'ONSITE': return function(c){return c.site==='Onsite';};
    case 'OFFSITE':return function(c){return c.site==='Offsite';};
    case 'CPM':    return function(c){return c.model==='CPM';};
    case 'CPC':    return function(c){return c.model==='CPC';};
    default:       return function(){return true;};
  }
}
function applyFilter(list,f){ return (list||[]).filter(predicateFor(f)); }

/* ========= Totals inkl. Sales/Revenue aus products ========= */
function sumProducts(c, field){
  if (!c || !c.products) return 0;
  var s=0; for (var i=0;i<c.products.length;i++){ s += (c.products[i][field] || 0); }
  return s;
}
function totals(list){
  list=list||[];
  var acc={impressions:0,clicks:0,ad:0,revenue:0,orders:0,booking:0};
  for (var i=0;i<list.length;i++){
    var c=list[i];
    var orders  = c.products ? sumProducts(c,'units')   : (c.orders   || 0);
    var revenue = c.products ? sumProducts(c,'revenue') : (c.revenue  || 0);
    acc.impressions += (c.impressions||0);
    acc.clicks      += (c.clicks||0);
    acc.ad          += (c.ad||0);
    acc.revenue     +=  revenue;
    acc.orders      +=  orders;
    acc.booking     += (c.booking||0);
  }
  var ctr  = safeDiv(acc.clicks, acc.impressions);
  var roas = safeDiv(acc.revenue, acc.ad);
  var cpm  = safeDiv(acc.ad, acc.impressions/1000);
  var cpc  = safeDiv(acc.ad, acc.clicks);
  var delivered = safeDiv(acc.ad, acc.booking);
  return { impressions:acc.impressions, clicks:acc.clicks, ad:acc.ad, revenue:acc.revenue,
           orders:acc.orders, booking:acc.booking, ctr:ctr, roas:roas, cpm:cpm, cpc:cpc, delivered:delivered };
}
