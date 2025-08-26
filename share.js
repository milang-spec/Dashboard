(function () {
  // --- kleine Utils wie in sales.js ---
  function fmtPct0(v){ return ((Number(v)||0)*100).toFixed(0).replace('.', ',') + '%'; }

  // robustes Param-lesen (scope kommt von index: share.html?scope=ALL/ONSITE/…)
  function getParam(name){
    var m = new RegExp('[?&]'+name+'=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }
  var scope = getParam('scope') || 'ALL';

  // Datenquelle(n) tolerant lesen
  var D  = window.DASHBOARD_DATA || {};
  var src =
      D.sov_categories ||
      D.sov_cats       ||
      D.sov_details    ||
      []; // falls leer, bleibt Tabelle leer (keine Fehler)

  // Optional: nach scope filtern – z.B. später, wenn du SoV pro Scope pflegst
  // (derzeit neutral; der Link aus dem Dashboard übergibt scope bereits)
  function byScope(row){ return true; }
  var rows = (src || []).filter(byScope).slice();

  // Sortierung: SoV absteigend
  rows.sort(function(a,b){ return (b.sov||0) - (a.sov||0); });

  // Render
  var tbody = document.querySelector('#sovTable tbody');
  var tfoot = document.getElementById('sovTotalRow');

  if (tbody){
    if (!rows.length){
      tbody.innerHTML = '<tr><td colspan="4" style="opacity:.7">Keine Daten vorhanden</td></tr>';
    } else {
      var html = '';
      var sumSov = 0, sumMS = 0, cnt=0;

      for (var i=0;i<rows.length;i++){
        var r = rows[i] || {};
        var cat = r.category || r.kategorie || '';
        var br  = r.brand    || '';
        var sov = Number(r.sov)||0;
        var ms  = Number(r.market_share||0);

        sumSov += sov; sumMS += ms; cnt++;

        html += '<tr>'+
          '<td>'+cat+'</td>'+
          '<td>'+br+'</td>'+
          '<td class="right">'+fmtPct0(sov)+'</td>'+
          '<td class="right">'+fmtPct0(ms)+'</td>'+
        '</tr>';
      }
      tbody.innerHTML = html;

      // Gesamtzeile als Durchschnitt (kannst du bei Bedarf in Summe ändern)
      if (tfoot){
        var avgSov = cnt ? sumSov/cnt : 0;
        var avgMS  = cnt ? sumMS/cnt  : 0;
        tfoot.innerHTML =
          '<td colspan="2"><b>Gesamt</b></td>'+
          '<td class="right"><b>'+fmtPct0(avgSov)+'</b></td>'+
          '<td class="right"><b>'+fmtPct0(avgMS)+'</b></td>';
      }
    }
  }
})();
