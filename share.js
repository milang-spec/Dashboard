(function () {
  // Helfer (kommen aus utils.js, nur falls jemand direkt testet)
  function pct(v){ return ((v||0)*100).toFixed(0).replace('.',',') + '%'; }

  var D = window.DASHBOARD_DATA || {};
  var data = D.sov_categories || D.sov_cats || D.sov_details || [];

  var table = document.getElementById('sovTable');
  if(!table){ return; }

  var hasMarket = (table.querySelectorAll('thead th').length >= 4);
  var tbody = table.querySelector('tbody');
  var tfootRow = document.getElementById('sovTotalRow');

  // Render rows
  var rows = [];
  var sumSov = 0, sumMs = 0, n = 0;
  for (var i=0; i<data.length; i++){
    var r = data[i];
    var sov = Number(r.sov)||0;
    var ms  = Number(r.market_share)||0;
    sumSov += sov;
    sumMs  += ms;
    n++;

    rows.push(
      '<tr>' +
        '<td>' + (r.category || '') + '</td>' +
        '<td>' + (r.brand || '') + '</td>' +
        '<td class="right">' + pct(sov) + '</td>' +
        (hasMarket ? '<td class="right">' + pct(ms)  + '</td>' : '') +
      '</tr>'
    );
  }
  tbody.innerHTML = rows.join('');

  // Totals (einfaches Mittel)
  var avgSov = n ? sumSov / n : 0;
  var avgMs  = n ? sumMs  / n : 0;

  if (tfootRow){
    var cells = tfootRow.querySelectorAll('td');
    // cells: [Gesamt, (leer), SoV, Market]
    if (cells[2]) cells[2].innerHTML = '<b>' + pct(avgSov) + '</b>';
    if (hasMarket && cells[3]) cells[3].innerHTML = '<b>' + pct(avgMs) + '</b>';
    if (!hasMarket && cells.length >= 4 && cells[3]) cells[3].innerHTML = '';
  }

  // Back-Link: Scope beibehalten (wie sales)
  var u = new URL(location.href);
  var scope = u.searchParams.get('scope') || 'ALL';
  var back = document.getElementById('backLink');
  if (back) back.href = 'index.html?scope=' + encodeURIComponent(scope);
})();
