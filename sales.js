(function(){
  const D = window.DASHBOARD_DATA || {};
  const list = (D.sales_details || []).slice().sort((a,b)=> b.revenue - a.revenue);

  // Summary
  const totalRev = list.reduce((s,x)=>s+x.revenue,0);
  const totalUnits = list.reduce((s,x)=>s+x.units,0);
  const avg = list.length ? totalRev/list.length : 0;
  const top = list[0];

  const fmtMoney0 = n => n.toLocaleString('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0});
  const fmtNum    = n => n.toLocaleString('de-DE');

  document.getElementById('sd-revenue').textContent = fmtMoney0(totalRev);
  document.getElementById('sd-units').textContent   = fmtNum(totalUnits);
  document.getElementById('sd-avg').textContent     = fmtMoney0(avg);
  document.getElementById('sd-top').textContent     = `${top?.sku||'—'}`;

  // Tabelle
  const tbody = document.querySelector('#salesTable tbody');
  tbody.innerHTML = '';
  list.forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.sku}</td>
      <td>${p.name}</td>
      <td class="right">${fmtNum(p.units)}</td>
      <td class="right">${fmtMoney0(p.revenue)}</td>
    `;
    tbody.appendChild(tr);
  });
})();
