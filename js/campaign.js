/* ========= Campaign Overview & Table ========= */
function renderCampaignOverview(all){
  all=all||[]; var t=totals(all), now=new Date(), active=0, ended=0;
  for (var i=0;i<all.length;i++){
    var cs=all[i];
    if(new Date(cs.start)<=now && now<=new Date(cs.end)) active++;
    if(new Date(cs.end)< now) ended++;
  }
  var el;
  el=document.getElementById('ov-count-total');   if(el) el.textContent=fmtNum(all.length);
  el=document.getElementById('ov-count-active');  if(el) el.textContent=fmtNum(active);
  el=document.getElementById('ov-count-ended');   if(el) el.textContent=fmtNum(ended);
  el=document.getElementById('ov-booking');       if(el) el.textContent=fmtMoney0(t.booking);
  el=document.getElementById('ov-ad');            if(el) el.textContent=fmtMoney0(t.ad);
  el=document.getElementById('ov-delivered');     if(el) el.textContent=(t.delivered*100).toFixed(0)+'%';
}

function fmtPeriod(s, e){
  if(!s || !e) return '';
  return s.slice(8,10)+'.'+s.slice(5,7)+'.'+s.slice(0,4)+'–'+
         e.slice(8,10)+'.'+e.slice(5,7)+'.'+e.slice(0,4);
}

/* ===== Helper ===== */
function getBooking(x){
  // Bevorzuge "booking" (Budget); fallback "budget"
  return (x && (x.booking!=null ? x.booking : x.budget));
}
function linkToSales(campaignName, placementName, val){
  var qs = 'campaign=' + encodeURIComponent(campaignName||'');
  if (placementName) qs += '&placement=' + encodeURIComponent(placementName||'');
  return '<a class="link-cell" href="sales.html?' + qs + '">'+ fmtNum(Math.round(val||0)) +'</a>';
}

/* ========= Campaign Table Renderer (neu) ========= */
function renderCampaignTable(list, allList){
  list    = list    || [];
  allList = allList || [];
  renderCampaignTable._last = { list:list, allList:allList };

  var table = document.getElementById('campaignTable');
  var tbody = document.querySelector('#campaignTable tbody');
  if(!table || !tbody) return;
  tbody.innerHTML = '';

  var expandedMode = (STATE.expanded && STATE.expanded.size > 0);
  table.classList.toggle('expanded', expandedMode);
  if (typeof window.setPlacementHeadersExpanded === 'function'){
    window.setPlacementHeadersExpanded(expandedMode);
  }

  // Sortierung
  var rows = list.slice().sort(function(a,b){ return (b.ad||0)-(a.ad||0); });

  for (var i=0; i<rows.length; i++){
    var c = rows[i] || {};
    var cid = 'camp_'+i;
    var hasPlacements = Array.isArray(c.placements) && c.placements.length>0;
    var isOpen = expandedMode && STATE.expanded.has(cid);

    var ctrC  = (c.impressions ? (c.clicks||0)/(c.impressions||1) : null);
    var roasC = (c.ad ? (c.revenue||0)/(c.ad||1) : null);

    // ===== Parent-Row =====
    var tr = document.createElement('tr');
    tr.className = 'parent';
    tr.setAttribute('data-cid', cid);

    if (!expandedMode){
      // Collapsed
      tr.innerHTML =
        '<td class="expcol">' + (hasPlacements
            ? '<button class="expander" aria-expanded="false" data-target="'+cid+'">+</button>'
            : '') + '</td>' +
        '<td>' + (c.name || '') + '</td>' +
        '<td>' + (c.brand || '') + '</td>' +
        '<td>' + fmtPeriod(c.start, c.end) + '</td>' +

        // NEU: Budget vor Ad Spend
        '<td class="right">' + (getBooking(c)!=null ? fmtMoney0(getBooking(c)) : '') + '</td>' +
        '<td class="right">' + (c.ad != null ? fmtMoney0(c.ad) : '') + '</td>' +

        '<td class="right">' + (c.impressions != null ? fmtNum(Math.round(c.impressions)) : '') + '</td>' +
        '<td class="right">' + (c.clicks != null ? fmtNum(Math.round(c.clicks)) : '') + '</td>' +
        '<td class="right">' + (ctrC != null ? fmtPct1(ctrC) : '') + '</td>' +
        '<td class="right">' +
          (c.orders != null ? linkToSales(c.name, null, c.orders) : '') +
        '</td>' +
        '<td class="right">' + (c.revenue != null ? fmtMoney0(c.revenue) : '') + '</td>' +
        '<td class="right">' + (roasC != null ? roasC.toFixed(2) + '×' : '') + '</td>';
    } else {
      // Expanded: 4 Placement-Spalten zwischen Period und KPIs
      tr.innerHTML =
        '<td class="expcol">' + (hasPlacements
            ? '<button class="expander" aria-expanded="'+(isOpen?'true':'false')+'" data-target="'+cid+'">'+(isOpen?'–':'+')+'</button>'
            : '') + '</td>' +
        '<td>' + (c.name || '') + '</td>' +
        '<td>' + (c.brand || '') + '</td>' +
        '<td>' + fmtPeriod(c.start, c.end) + '</td>' +
        '<td></td><td></td><td></td><td></td>' +

        // NEU: Budget vor Ad Spend
        '<td class="right">' + (getBooking(c)!=null ? fmtMoney0(getBooking(c)) : '') + '</td>' +
        '<td class="right">' + (c.ad != null ? fmtMoney0(c.ad) : '') + '</td>' +

        '<td class="right">' + (c.impressions != null ? fmtNum(Math.round(c.impressions)) : '') + '</td>' +
        '<td class="right">' + (c.clicks != null ? fmtNum(Math.round(c.clicks)) : '') + '</td>' +
        '<td class="right">' + (ctrC != null ? fmtPct1(ctrC) : '') + '</td>' +
        '<td class="right">' +
          (c.orders != null ? linkToSales(c.name, null, c.orders) : '') +
        '</td>' +
        '<td class="right">' + (c.revenue != null ? fmtMoney0(c.revenue) : '') + '</td>' +
        '<td class="right">' + (roasC != null ? roasC.toFixed(2) + '×' : '') + '</td>';
    }
    tbody.appendChild(tr);

    // ===== Subrows (Placements) =====
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
          // WICHTIG: KEIN Placement-Text mehr in der „Campaign“-Spalte
          '<td class="indent"></td>' +
          '<td></td>' +
          '<td>' + (p.start && p.end ? fmtPeriod(p.start, p.end) : '') + '</td>' +

          // Strategy/Channel/Type/Placement
          '<td>' + (p.strategy || '') + '</td>' +
          '<td>' + (p.channel  || '') + '</td>' +
          '<td>' + (p.type     || '') + '</td>' +
          '<td>' + (p.placement|| '') + '</td>' +

          // NEU: Budget vor Ad Spend
          '<td class="right">' + (getBooking(p)!=null ? fmtMoney0(getBooking(p)) : '') + '</td>' +
          '<td class="right">' + (p.ad != null ? fmtMoney0(p.ad) : '') + '</td>' +

          '<td class="right">' + (p.impressions != null ? fmtNum(Math.round(p.impressions)) : '') + '</td>' +
          '<td class="right">' + (p.clicks != null ? fmtNum(Math.round(p.clicks)) : '') + '</td>' +
          '<td class="right">' + (ctrP != null ? fmtPct1(ctrP) : '') + '</td>' +
          '<td class="right">' +
            (p.orders != null
              ? linkToSales(c.name, p.placement, p.orders)
              : ''
            ) +
          '</td>' +
          '<td class="right">' + (revP != null ? fmtMoney0(revP) : '') + '</td>' +
          '<td class="right">' + (roasP != null ? roasP.toFixed(2) + '×' : '') + '</td>';
        tbody.appendChild(sub);
      }
    }
  }

  // ===== Gesamtzeile =====
  var r2 = document.getElementById('campaignGrandRow');
  if (r2){
    var sum = totals(allList && allList.length ? allList : list);
    var roasSum = (sum.ad ? (sum.revenue||0)/(sum.ad||1) : (sum.roas||0));

    var cells = ['<td></td><td><b>Gesamt (Alle)</b></td><td></td><td></td>'];
    if (expandedMode) cells.push('<td></td><td></td><td></td><td></td>');
    r2.innerHTML =
      cells.join('')+
      '<td class="right"><b>'+fmtMoney0(sum.booking||0)+'</b></td>'+
      '<td class="right"><b>'+fmtMoney0(sum.ad||0)+'</b></td>'+
      '<td class="right"><b>'+fmtNum(Math.round(sum.impressions||0))+'</b></td>'+
      '<td class="right"><b>'+fmtNum(Math.round(sum.clicks||0))+'</b></td>'+
      '<td class="right"><b>'+fmtPct1(sum.ctr||0)+'</b></td>'+
      '<td class="right"><b>'+fmtNum(Math.round(sum.orders||0))+'</b></td>'+
      '<td class="right"><b>'+fmtMoney0(sum.revenue||0)+'</b></td>'+
      '<td class="right"><b>'+(roasSum||0).toFixed(2)+'×</b></td>';
  }

  // ===== Expand/Collapse-Handler =====
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

      renderCampaignTable(renderCampaignTable._last.list, renderCampaignTable._last.allList);
    });
    tbody.__boundExpander = true;
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
