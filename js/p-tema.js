function renderTema(){
  var el=document.getElementById('temaWrap');
  if(!el) return;
  var cls='';
  try{ cls=localStorage.getItem('cortai_painel_tema')||''; }catch(e){}
  if(!cls && S._tema && S._tema.template) cls='t-'+S._tema.template;
  if(!cls) cls='t-onyx';
  // Map old theme names to admin themes
  var _legMap={'t-obsidian':'t-onyx','t-azure':'t-neutral','t-emerald':'t-neutral','t-rose':'t-feminine','t-crimson':'t-feminine','t-indigo':'t-feminine','t-clean':'t-neutral','t-verde':'t-neutral'};
  if(_legMap[cls]) cls=_legMap[cls];

  var opcoes=[
    {cls:'t-onyx',     label:'Onyx',     sub:'Dark elegante',  color:'#1A1A1A', accent:'#E55A0C', border:'rgba(255,255,255,.2)'},
    {cls:'t-feminine', label:'Feminine', sub:'Rosa · estética',color:'#FFF1F3', accent:'#D81B60', border:'rgba(216,27,96,.3)'},
    {cls:'t-neutral',  label:'Neutral',  sub:'Bege · clean',   color:'#F5F0E8', accent:'#E55A0C', border:'rgba(200,180,160,.4)'},
    {cls:'t-clinic',   label:'Clinic',   sub:'Azul · saúde',   color:'#E8F1F8', accent:'#2C6FAA', border:'rgba(44,111,170,.3)'},
  ];

  var html='<div class="perfil-tit sec-collapse" onclick="if(typeof toggleSec===\'function\')toggleSec(this)">Tema visual</div><div class="sec-body">';
  html+='<div style="font-size:12px;color:var(--text-2,var(--CZ));font-weight:600;margin-bottom:14px;line-height:1.5">Escolha o visual do painel e da página de agendamento.</div>';
  html+='<div class="theme-picker-row">';

  opcoes.forEach(function(o){
    var ativo=cls===o.cls;
    var onclick='aplicarTemaSimples(\''+o.cls+'\')';
    var activeStyle=ativo?'outline:3px solid '+o.accent+';outline-offset:3px;transform:scale(1.08)':'';
    html+='<div class="theme-swatch-item'+(ativo?' active':'')+'\" data-theme="'+o.cls+'" onclick="'+onclick+'" style="flex-shrink:0">';
    html+='<div class="swatch-circle" style="background:'+o.color+';border:1.5px solid '+o.border+';display:flex;align-items:center;justify-content:center;'+activeStyle+'">';
    html+='<div style="width:18px;height:18px;border-radius:50%;background:'+o.accent+'"></div>';
    html+='</div>';
    html+='<span style="font-weight:'+(ativo?'700':'500')+'">'+o.label+'</span>';
    html+='</div>';
  });

  html+='</div></div>';
  el.innerHTML=html;
}

function renderFonte(){
  var el=document.getElementById('temaWrap');
  if(!el) return;
  var atual=S._fonte||'sans';
  var html='<div class="perfil-tit sec-collapse" onclick="if(typeof toggleSec===\'function\')toggleSec(this)" style="margin-top:8px">Fonte da página</div><div class="sec-body">';
  html+='<div style="font-size:12px;color:var(--text-2,var(--CZ));font-weight:600;margin-bottom:14px;line-height:1.5">Escolha a tipografia exibida na sua página de agendamento.</div>';
  html+='<div style="display:flex;gap:10px">';
  html+='<button onclick="aplicarFonteEdt(\'sans\')" style="flex:1;padding:12px;border-radius:8px;border:2px solid '+(atual==='sans'?'var(--brand)':'var(--sep)')+';background:'+(atual==='sans'?'var(--brand-dim)':'transparent')+';cursor:pointer;text-align:center">';
  html+='<div style="font-family:\'Manrope\',sans-serif;font-size:15px;font-weight:700;color:var(--text)">Manrope</div>';
  html+='<div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-top:3px">Moderno</div>';
  html+='</button>';
  html+='<button onclick="aplicarFonteEdt(\'serif\')" style="flex:1;padding:12px;border-radius:8px;border:2px solid '+(atual==='serif'?'var(--brand)':'var(--sep)')+';background:'+(atual==='serif'?'var(--brand-dim)':'transparent')+';cursor:pointer;text-align:center">';
  html+='<div style="font-family:\'Cormorant Garamond\',Georgia,serif;font-style:italic;font-size:17px;font-weight:600;color:var(--text)">Cormorant</div>';
  html+='<div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-top:3px">Editorial</div>';
  html+='</button>';
  html+='</div></div>';
  el.innerHTML=el.innerHTML+html;
}

function aplicarFonteEdt(f){
  S._fonte=f;
  api('saloes?slug=eq.'+S.slug,{method:'PATCH',headers:{'Prefer':'return=minimal'},body:JSON.stringify({fonte:f})}).catch(function(){});
  renderTema();
  renderFonte();
}

function aplicarFonteAgendar(f){
  var html=document.documentElement;
  html.classList.remove('fonte-serif','fonte-sans');
  html.classList.add('fonte-'+(f||'sans'));
}

function aplicarTemaSimples(cls){
  if(typeof setPainelTema==='function') setPainelTema(cls);
  var tpl=cls.replace('t-','');
  var temaObj={template:tpl,id:tpl,cores:{}};
  S._tema=temaObj;
  rpc('salvar_tema_salao',{p_slug:S.slug,p_senha:_pw||'',p_tema:temaObj}).then(function(){
    renderTema(); renderFonte();
  }).catch(function(){ renderTema(); renderFonte(); });
}
