/* ========= Utils ========= */
function fmtMoney0(n){ return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}); }
function fmtMoney2(n){ return (n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtPct1(n){ return ((n||0)*100).toFixed(1)+'%'; }
function fmtNum(n){ return (n||0).toLocaleString('de-DE'); }
function safeDiv(a,b){ return b ? (a/b) : 0; }

/* ========= Sichtbares Fehler-Overlay + Guards ========= */
function __report(where, err){
  try{
    var msg = (err && err.message) ? err.message : String(err);
    console.error('[Dashboard]', where, err);
    var d=document.createElement('div');
    d.style='position:fixed;left:8px;bottom:120px;z-index:99999;background:#520;color:#fff;padding:6px 10px;border-radius:6px;font:12px monospace';
    d.textContent='Fehler in '+where+': '+msg;
    document.body.appendChild(d);
  }catch(_){}
}
function __guard(where, fn){
  try { return fn(); } catch(e){ __report(where, e); throw e; }
}
window.addEventListener('error', function (e) {
  try{
    var msg = (e && e.message) ? e.message : String(e);
    var box = document.createElement('div');
    box.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:99999;background:#300;color:#fff;padding:6px 10px;border-radius:6px;font:12px monospace';
    box.textContent = 'JS error: ' + msg;
    document.body.appendChild(box);
  }catch(_){}
});

// --- Compact number format (de-DE) ---
function fmtCompactDE(n, decimals = 1) {
  n = Number(n) || 0;
  if (Math.abs(n) >= 1e9) {
    return (n / 1e9).toLocaleString('de-DE', {
      minimumFractionDigits: decimals, maximumFractionDigits: decimals
    }) + ' Mrd.';
  }
  if (Math.abs(n) >= 1e6) {
    return (n / 1e6).toLocaleString('de-DE', {
      minimumFractionDigits: decimals, maximumFractionDigits: decimals
    }) + ' Mio';
  }
  return n.toLocaleString('de-DE');
}

function fmtMoneyCompactDE(n, decimals = 1) {
  n = Number(n) || 0;
  if (Math.abs(n) >= 1e9) {
    return (n / 1e9).toLocaleString('de-DE', {
      minimumFractionDigits: decimals, maximumFractionDigits: decimals
    }) + ' Mrd. €';
  }
  if (Math.abs(n) >= 1e6) {
    return (n / 1e6).toLocaleString('de-DE', {
      minimumFractionDigits: decimals, maximumFractionDigits: decimals
    }) + ' Mio €';
  }
  // Fallback auf normales €-Format ohne Kompakt-Schreibweise
  return fmtMoney0(n);
}


/* ===== LY helpers ===== */
export function lyPercent(cur, ly, overridePct = null) {
  if (overridePct != null) return overridePct;  // manuelle Vorgabe überschreibt
  if (ly == null || ly === 0) return null;
  return (cur - ly) / Math.abs(ly);
}

export function renderLyDelta(el, pct) {
  if (!el) return;
  if (pct == null) { el.innerHTML = '–'; return; }
  const up = pct >= 0;
  const val = Math.abs(pct * 100).toFixed(1).replace('.', ',');
  el.innerHTML = `<span class="${up?'up':'down'}">${up?'▲':'▼'} ${val}% <span class="muted">vs LY</span></span>`;
}

// utils.js – ganz unten
window.fmtMoney0 = fmtMoney0;
window.fmtMoney2 = fmtMoney2;
window.fmtNum = fmtNum;
window.fmtPct1 = fmtPct1;
window.safeDiv = safeDiv;
window.fmtCompactDE = fmtCompactDE;
window.fmtMoneyCompactDE = fmtMoneyCompactDE;

