/* ========= Stage / Layout ========= */
var BASE = { w:1920, h:1080 };

function fitStageFixed(){
  var stage=document.getElementById('stage'); if(!stage) return;
  var s=Math.min(window.innerWidth/BASE.w, window.innerHeight/BASE.h);
  stage.style.transform='scale('+s+')';
  stage.style.left=((window.innerWidth-BASE.w*s)/2)+'px';
  stage.style.top =((window.innerHeight-BASE.h*s)/2)+'px';
}

function applyLayoutConfig(){
  var cfg=window.DASHBOARD_LAYOUT||{mode:'scroll',columns:12,gap:32,order:[]};
  var board=document.getElementById('board'); if(!board) return;

  document.documentElement.style.setProperty('--cols', String(cfg.columns||3));
  document.documentElement.style.setProperty('--gap', (cfg.gap||18)+'px');
  board.style.gap=(cfg.gap||18)+'px';

  var ord = cfg.order || [];
  for (var i=0;i<ord.length;i++){
    var it = ord[i];
    var el=document.getElementById(it.id); if(!el) continue;
    var span=Math.max(1, Math.min(it.span||1, cfg.columns||3));
    el.style.gridColumn='span '+span;
    board.appendChild(el);
  }

  var stage=document.getElementById('stage');
  if((cfg.mode||'fixed-scale')==='scroll'){
    document.body.style.overflow='auto';
    stage.style.position='relative';
    stage.style.transform='none';
    stage.style.left=stage.style.top='';
    stage.style.width='100%';
    stage.style.height='auto';
    stage.style.setProperty('--chart-h','360px');
    window.removeEventListener('resize', fitStageFixed);
  }else{
    document.body.style.overflow='hidden';
    stage.style.position='absolute';
    stage.style.width=BASE.w+'px';
    stage.style.height=BASE.h+'px';
    fitStageFixed();
    window.addEventListener('resize', fitStageFixed);
  }
}
