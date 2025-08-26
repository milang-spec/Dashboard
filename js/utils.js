// js/utils.js
(function (w) {
  'use strict';

  /* ========= Utils ========= */
  function fmtMoney0(n){
    return (Number(n)||0).toLocaleString('de-DE',{
      style:'currency', currency:'EUR', maximumFractionDigits:0
    });
  }
  function fmtMoney2(n){
    return (Number(n)||0).toLocaleString('de-DE',{
      style:'currency', currency:'EUR', minimumFractionDigits:2, maximumFractionDigits:2
    });
  }
  function fmtPct1(v){
    if (v==null || !isFinite(v)) return '—';
    return (v*100).toFixed(1).replace('.', ',') + '%';
  }
  function fmtNum(n){ return (Number(n)||0).toLocaleString('de-DE'); }
  function safeDiv(a,b){ a=Number(a)||0; b=Number(b)||0; return b ? (a/b) : 0; }

  // Kompakte Schreibweisen (nur dort nutzen, wo gewünscht)
  function fmtCompactDE(n, decimals=1){
    const v = Number(n)||0, a=Math.abs(v);
    if (a >= 1e9) return (v/1e9).toFixed(decimals).replace('.', ',') + ' Mrd';
    if (a >= 1e6) return (v/1e6).toFixed(decimals).replace('.', ',') + ' Mio';
    return Math.round(v).toLocaleString('de-DE');
  }
  function fmtMoneyCompactDE(n, decimals=1){
    const v = Number(n)||0, a=Math.abs(v);
    if (a >= 1e9) return (v/1e9).toFixed(decimals).replace('.', ',') + ' Mrd €';
    if (a >= 1e6) return (v/1e6).toFixed(decimals).replace('.', ',') + ' Mio €';
    return fmtMoney0(v);
  }

  /* ========= Fehler-Overlay + Guards ========= */
  function __report(where, err){
    try{
      const msg = (err && err.message) ? err.message : String(err);
      console.error('[Dashboard]', where, err);
      const d=document.createElement('div');
      d.style.cssText='position:fixed;left:8px;bottom:120px;z-index:99999;background:#520;color:#fff;padding:6px 10px;border-radius:6px;font:12px monospace';
      d.textContent='Fehler in '+where+': '+msg;
      document.body.appendChild(d);
    }catch(_){}
  }
  function __guard(where, fn){
    try { return fn && fn(); }
    catch(e){ __report(where, e); throw e; }
  }
  w.addEventListener('error', function (e) {
    try{
      const msg = (e && e.message) ? e.message : String(e);
      const box = document.createElement('div');
      box.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:99999;background:#300;color:#fff;padding:6px 10px;border-radius:6px;font:12px monospace';
      box.textContent = 'JS error: ' + msg;
      document.body.appendChild(box);
    }catch(_){}
  });

  /* ========= LY-Helfer (ohne export!) ========= */
  function lyPercent(cur, ly, overridePct=null){
    if (overridePct != null) return overridePct;   // manuelle Vorgabe
    if (ly == null || ly === 0) return null;
    return (Number(cur||0) - Number(ly||0)) / Math.abs(ly);
  }
  function renderLyDelta(el, pct){
    if (!el) return;
    if (pct == null){ el.innerHTML = '–'; return; }
    const up = pct >= 0;
    const val = Math.abs(pct*100).toFixed(1).replace('.', ',');
    el.innerHTML = `<span class="${up?'up':'down'}">${up?'▲':'▼'} ${val}% <span class="muted">vs LY</span></span>`;
  }

  // === Exporte nach window (global verfügbar) ===
  Object.assign(w, {
    fmtMoney0, fmtMoney2, fmtNum, fmtPct1, safeDiv,
    fmtCompactDE, fmtMoneyCompactDE,
    __report, __guard,
    lyPercent, renderLyDelta
  });
})(window);
