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
    {cls:'t-onyx',     label:'Onyx',     sub:'Dark elegante',    color:'#212121', border:'rgba(255,255,255,.2)'},
    {cls:'t-feminine', label:'Feminine', sub:'Rosa · estética',  color:'#FFE4EC', border:'rgba(200,100,120,.3)'},
    {cls:'t-neutral',  label:'Neutral',  sub:'Bege · clean',     color:'#F5F0E8', border:'rgba(200,180,160,.4)'},
    {cls:'t-clinic',   label:'Clinic',   sub:'Azul · saúde',     color:'#F4F8FB', border:'rgba(44,111,170,.3)'},
  ];

  var html='<div class="perfil-tit sec-collapse" onclick="if(typeof toggleSec===\'function\')toggleSec(this)">Tema visual</div><div class="sec-body">';
  html+='<div style="font-size:12px;color:var(--text-2,var(--CZ));font-weight:600;margin-bottom:14px;line-height:1.5">Escolha o visual do painel e da página de agendamento.</div>';
  html+='<div class="theme-picker-row">';

  opcoes.forEach(function(o){
    var ativo=cls===o.cls;
    var onclick='aplicarTemaSimples(\''+o.cls+'\')';
    var borderStyle=o.border?'border:1px solid '+o.border:'';
    html+='<div class="theme-swatch-item'+(ativo?' active':'')+'\" data-theme="'+o.cls+'" onclick="'+onclick+'" style="flex-shrink:0">';
    html+='<div class="swatch-circle" style="background:'+o.color+';'+borderStyle+'"></div>';
    html+='<span>'+o.label.toUpperCase()+'</span>';
    html+='</div>';
  });

  html+='</div></div>';
  el.innerHTML=html;
}

function aplicarTemaSimples(cls){
  if(typeof setPainelTema==='function') setPainelTema(cls);
  var tpl=cls.replace('t-','');
  var temaObj={template:tpl,id:tpl,cores:{}};
  S._tema=temaObj;
  rpc('salvar_tema_salao',{p_slug:S.slug,p_senha:_pw||'',p_tema:temaObj}).then(function(){
    toast('\u2713 Tema salvo!','ok'); renderTema();
  }).catch(function(){ toast('\u2713 Tema aplicado','ok'); renderTema(); });
}
