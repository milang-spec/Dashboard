/* ========= Re-Rank (Sponsored Product Ads) ========= */
function renderRerankOverview(rerankList, salesDetails){
  rerankList = rerankList || [];
  salesDetails = salesDetails || [];

  var totalAd=0,totalClicks=0,totalRevenue=0;
  for (var i=0;i<rerankList.length;i++){
    var r=rerankList[i], clicks = r.ecpc>0 ? (r.ad/r.ecpc) : 0;
    totalAd += (r.ad||0); totalClicks += clicks; totalRevenue += (r.roas||0)*(r.ad||0);
  }
  var ecpcWeighted = safeDiv(totalAd, totalClicks);
  var roasWeighted = safeDiv(totalRevenue, totalAd);

  var budgetTotal = (typeof (window.DASHBOARD_DATA||{}).rerank_budget === 'number')
    ? (window.DASHBOARD_DATA||{}).rerank_budget : totalAd;
  var pctSpend = budgetTotal ? Math.min(1, totalAd / budgetTotal) : 0;

  var unitsByName = {}; for (var s=0; s<salesDetails.length; s++){
    unitsByName[String(salesDetails[s].name||'').toLowerCase()] = (unitsByName[String(salesDetails[s].name||'').toLowerCase()]||0) + (salesDetails[s].units||0);
  }
  var salesUnits=0;
  for (var j=0;j<rerankList.length;j++){
    var key=String(rerankList[j].item||'').toLowerCase();
    salesUnits+=(unitsByName[key]||0);
  }

  var el;
  el=document.getElementById('rr-budget');   if(el) el.textContent=fmtMoney0(budgetTotal);
  el=document.getElementById('rr-ad');       if(el) el.textContent=fmtMoney0(totalAd);
  el=document.getElementById('rr-clicks');   if(el) el.textContent=fmtNum(Math.round(totalClicks));
  el=document.getElementById('rr-ecpc');     if(el) el.textContent=fmtMoney2(ecpcWeighted);
  el=document.getElementById('rr-pct');      if(el) el.textContent=((pctSpend*100)||0).toFixed(0)+'%';
  el=document.getElementById('rr-sales');    if(el) el.textContent=salesUnits?fmtNum(salesUnits):'—';
  el=document.getElementById('rr-revenue');  if(el) el.textContent=fmtMoney0(totalRevenue);
  el=document.getElementById('rr-roas');     if(el) el.textContent=(roasWeighted||0).toFixed(2)+'×';
}

function renderRerank(list){
  list = list || [];
  var tbody = document.querySelector('#rerankTable tbody'); if(!tbody) return;
  tbody.innerHTML = '';

  var unitsByName = {};
  var sales = ((window.DASHBOARD_DATA||{}).sales_details)||[];
  for (var i=0;i<sales.length;i++){
    var nm = String(sales[i].name||'').toLowerCase();
    unitsByName[nm] = (unitsByName[nm]||0) + (sales[i].units||0);
  }

  var totals = { ad:0, clicks:0, units:0, revenue:0 };
  var rows = [];
  for (var j=0;j<list.length;j++){
    var r = list[j];
    var clicks = r.ecpc>0 ? (r.ad/r.ecpc) : 0;
    var revenue = (r.roas||0)*(r.ad||0);
    var units = unitsByName[String(r.item||'').toLowerCase()] || 0;

    rows.push({ sku:r.sku, item:r.item, ad:(r.ad||0), ecpc:(r.ecpc||0), roas:(r.roas||0),
                clicks:clicks, revenue:revenue, units:units });

    totals.ad += (r.ad||0);
    totals.clicks += clicks;
    totals.units += units;
    totals.revenue += revenue;
  }
  rows.sort(function(a,b){ return (b.revenue||0)-(a.revenue||0); });

  for (var k=0;k<rows.length;k++){
    var x = rows[k];
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>'+x.sku+' — '+x.item+'</td>'+
      '<td class="right">'+fmtMoney0(x.ad)+'</td>'+
      '<td class="right">'+fmtNum(Math.round(x.clicks))+'</td>'+
      '<td class="right">'+fmtMoney2(x.ecpc)+'</td>'+
      '<td class="right">'+fmtNum(Math.round(x.units))+'</td>'+
      '<td class="right">'+fmtMoney0(x.revenue)+'</td>'+
      '<td class="right">'+(x.roas||0).toFixed(2)+'×</td>';
    tbody.appendChild(tr);
  }

  var tfoot = document.getElementById('rerankTotalRow');
  if (tfoot){
    var roasTotal = safeDiv(totals.revenue, totals.ad);
    var ecpcTot = safeDiv(totals.ad, totals.clicks);
    tfoot.innerHTML =
      '<td><b>Gesamt</b></td>'+
      '<td class="right"><b>'+fmtMoney0(totals.ad)+'</b></td>'+
      '<td class="right"><b>'+fmtNum(Math.round(totals.clicks))+'</b></td>'+
      '<td class="right"><b>'+fmtMoney2(ecpcTot)+'</b></td>'+
      '<td class="right"><b>'+fmtNum(Math.round(totals.units))+'</b></td>'+
      '<td class="right"><b>'+fmtMoney0(totals.revenue)+'</b></td>'+
      '<td class="right"><b>'+(roasTotal||0).toFixed(2)+'×</b></td>';
  }
}
