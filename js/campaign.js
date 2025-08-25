/* ========= Campaign Overview & Table ========= */
function renderCampaignOverview(all){
  all=all||[]; var t=totals(all), now=new Date(), active=0, ended=0;
  for (var i=0;i<all.length;i++){
    var cs=all[i];
    if(new Date(cs.start)<=now && now<=new Date(cs.end)) active++;
    if(new Date(cs.end)< now) ended++;
  }
  var el;
  el=document.getElementById('ov-count-total'); if(el) el.textContent=fmtNum(all.length);
  el=document.getElementById('ov-count-active'); if(el) el.textContent=fmtNum(active);
  el=document.getElementById('ov-count-ended'); if(el) el.textContent=fmtNum(ended);
  el=document.getElementById('ov-booking'); if(el) el.textContent=fmtMoney0(t.booking);
  el=document.getElementById('ov-ad'); if(el) el.textContent=fmtMoney0(t.ad);
  el=document.getElementById('ov-delivered'); if(el) el.textContent=(t.delivered*100).toFixed(0)+'%';
}

function fmtPeriod(s, e){
  if(!s || !e) return '';
  return s.slice(8,10)+'.'+s.slice(5,7)+'.'+s.slice(0,4)+'–'+
         e.slice(8,10)+'.'+e.slice(5,7)+'.'+e.slice(0,4);
}

function renderCampaignTable(list, allList){
  list    = list    || [];
  allList = allList || [];
  renderCampaignTable._last = { list:list, allList:allList };

  var tbody = document.querySelector('#campaignTable tbody');
  if(!tbody) return;
  tbody.innerHTML = '';

  var expandedMode = (STATE.expanded && STATE.expanded.size > 0);
  var table = document.getElementById('campaignTable');
  if (table) table.classList.toggle('expanded', expandedMode);

  var rows = list.slice().sort(function(a,b){ return (b.ad||0)-(a.ad||0); });

  for (var i=0; i<rows.length; i++){
    var c = rows[i] || {};
    var cid = 'camp_'+i;
    var hasPlacements = Array.isArray(c.placements) && c.placements.length>0;
    var isOpen = expandedMode && STATE.expanded.has(cid);
    var ctrC  = (c.impressions ? (c.clicks||0)/(c.impressions||1) : null);
    var roasC = (c.ad ? (c.revenue||0)/(c.ad||1) : null);

    var tr = document.createElement('tr');
    tr.className = 'parent';
    tr.setAttribute('data-cid', cid);

    if (!expandedMode){
      tr.innerHTML =
        '<td class="expcol">' + (hasPlacements
            ? '<button class="expander" aria-expanded="false" data-target="'+cid+'">+</button>'
            : '') + '</td>' +
        '<td>' + (c.name || '') + '</td>' +
        '<td>' + (c.brand || '') + '</td>' +
        '<td>' + fmtPeriod(c.start, c.end) + '</td>' +
        '<td class="right">' + (c.ad != null ? fmtMoney0(c.ad) : '') + '</td>' +
        '<td class="right">' + (c.impressions != null ? fmtNum(Math.round(c.impressions)) : '') + '</td>' +
        '<td class="right">' + (c.clicks != null ? fmtNum(Math.round(c.clicks)) : '') + '</td>' +
        '<td class="right">' + (ctrC != null ? fmtPct1(ctrC) : '') + '</td>' +
        '<td class="right">' +
          (c.orders != null
            ? '<a class="link-cell" href="sales.html?campaign=' + encodeURIComponent(c.name) + '">' +
                fmtNum(Math.round(c.orders)) +
              '</a>'
            : ''
          ) +
        '</td>' +
        '<td class="right">' + (c.revenue != null ? fmtMoney0(c.revenue) : '') + '</td>' +
        '<td class="right">' + (roasC != null ? roasC.toFixed(2) + '×' : '') + '</td>';
    } else {
      tr.innerHTML =
        '<td class="expcol">' + (hasPlacements
            ? '<button class="expander" aria-expanded="'+(isOpen?'true':'false')+'" data-target="'+cid+'">'+(isOpen?'–':'+')+'</button>'
            : '') + '</td>' +
        '<td>' + (c.name || '') + '</td>' +
        '<td>' + (c.brand || '') + '</td>' +
        '<td>' + fmtPeriod(c.start, c.end) + '</td>' +
        '<td></td><td></td><td></td><td></td>' + // Strategy / Channel / Type / Placement (nur Subrows)
        '<td class="right">' + (c.ad != null ? fmtMoney0(c.ad) : '') + '</td>' +
        '<td class="right">' + (c.impressions != null ? fmtNum(Math.round(c.impressions)) : '') + '</td>' +
        '<td class="right">' + (c.clicks != null ? fmtNum(Math.round(c.clicks)) : '') + '</td>' +
        '<td class="right">' + (ctrC != null ? fmtPct1(ctrC) : '') + '</td>' +
        '<td class="right">' +
          (c.orders != null
            ? '<a class="link-cell" href="sales.html?campaign=' + encodeURIComponent(c.name) + '">' +
                fmtNum(Math.round(c.orders)) +
              '</a>'
            : ''
          ) +
        '</td>' +
        '<td class="right">' + (c.revenue != null ? fmtMoney0(c.revenue) : '') + '</td>' +
        '<td class="right">' + (roasC != null ? roasC.toFixed(2) + '×' : '') + '</td>';
    }
    tbody.appendChild(tr);

    if (expandedMode && hasPlacements){
      for (var j = 0; j < c.placements.length; j++){
        var p = c.placements[j] || {};
        var revP  = (typeof p.revenue === 'number') ? p.revenue : ((p.ad || 0) * (p.roas || 0));
        var ctrP  = (p.impressions ? (p.clicks || 0) / (p.impressions || 1) : null);
        var roasP = (p.ad ? (revP || 0) / (p.ad || 1) : (typeof p.roas === 'number' ? p.roas : null));

        var sub = document.createElement('tr');
        sub.className = 'subrow child-of-' + cid + (isOpen ? '' : ' hidden');
        sub.innerHTML =
          '<td></td>' +
          '<td class="indent">↳ ' + (p.placement || p.name || '') + '</td>' +
          '<td></td>' +
          '<td>' + (p.start && p.end ? fmtPeriod(p.start, p.end) : '') + '</td>' +
          '<td>' + (p.strategy || '') + '</td>' +
          '<td>' + (p.channel  || '') + '</td>' +
          '<td>' + (p.type     || '') + '</td>' +
          '<td>' + (p.placement|| '') + '</td>' +
          '<td class="right">' + (p.ad != null ? fmtMoney0(p.ad) : '') + '</td>' +
          '<td class="right">' + (p.impressions != null ? fmtNum(Math.round(p.impressions)) : '') + '</td>' +
          '<td class="right">' + (p.clicks != null ? fmtNum(Math.round(p.clicks)) : '') + '</td>' +
          '<td class="right">' + (ctrP != null ? fmtPct1(ctrP) : '') + '</td>' +
          '<td class="right">' +
            (p.orders != null
              ? '<a class="link-cell" href="sales.html?campaign=' + encodeURIComponent(c.name) +
                '&placement=' + encodeURIComponent(p.placement || '') + '">' +
                  fmtNum(Math.round(p.orders)) +
                '</a>'
              : ''
            ) +
          '</td>' +
          '<td class="right">' + (revP != null ? fmtMoney0(revP) : '') + '</td>' +
          '<td class="right">' + (roasP != null ? roasP.toFixed(2) + '×' : '') + '</td>';
        tbody.appendChild(sub);
      }
    }
  }

  if (!tbody.__boundExpander){
    tbody.addEventListener('click', function(e){
      var btn = e.target.closest('.expander'); if(!btn) return;
      var cid = btn.getAttribute('data-target'); if(!cid) return;

      if (!(STATE.expanded && STATE.expanded.size > 0)){
        STATE.expanded = new Set([cid]);
        renderCampaignTable(renderCampaignTable._last.list, renderCampaignTable._last.allList);
        return;
      }
      if (STATE.expanded.has(cid)) STATE.expanded.delete(cid);
      else STATE.expanded.add(cid);

      if (STATE.expanded.size === 0){
        renderCampaignTable(renderCampaignTable._last.list, renderCampaignTable._last.allList);
      } else {
        renderCampaignTable(renderCampaignTable._last.list, renderCampaignTable._last.allList);
      }
    });
    tbody.__boundExpander = true;
  }

  var sum = totals(allList && allList.length ? allList : list);
  var roasSum = (sum.ad ? (sum.revenue||0)/(sum.ad||1) : (sum.roas||0));
  var r2 = document.getElementById('campaignGrandRow');
  if (r2){
    var cells = ['<td></td><td><b>Gesamt (Alle)</b></td><td></td><td></td>'];
    if (expandedMode) cells.push('<td></td><td></td><td></td><td></td>');
    r2.innerHTML =
      cells.join('')+
      '<td class="right">'+fmtMoney0(sum.ad||0)+'</td>'+
      '<td class="right">'+fmtNum(Math.round(sum.impressions||0))+'</td>'+
      '<td class="right">'+fmtNum(Math.round(sum.clicks||0))+'</td>'+
      '<td class="right">'+fmtPct1(sum.ctr||0)+'</td>'+
      '<td class="right">'+fmtNum(Math.round(sum.orders||0))+'</td>'+
      '<td class="right">'+fmtMoney0(sum.revenue||0)+'</td>'+
      '<td class="right">'+(roasSum||0).toFixed(2)+'×</td>';
  }
}

/* ========= Filter-Chips ========= */
function bindChips(){
  var bar=document.getElementById('filterChips'); if(!bar) return;
  bar.addEventListener('click',function(e){
    var t=e.target; while(t && (!t.className || t.className.indexOf('chip')===-1)) t=t.parentNode;
    if(!t) return;
    var chips=bar.querySelectorAll('.chip');
    for (var i=0;i<chips.length;i++) chips[i].classList.remove('active');
    t.classList.add('active');
    STATE.filter=t.getAttribute('data-filter');
    renderAll();
  });
}
