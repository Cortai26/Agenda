/* Agenda Painel — Core: config, auth, helpers */
/* ═══ CONFIG ═══ */
const SUPA='https://acldrisohnjfekjxgmoh.supabase.co';
const ASAAS_FN='https://acldrisohnjfekjxgmoh.supabase.co/functions/v1/asaas-billing';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbGRyaXNvaG5qZmVranhnbW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODA1MzcsImV4cCI6MjA4OTE1NjUzN30.etojz12x1oVNvbW_fPeVpNx2OFuJ72C1YioFBlCLS2Y';
const BASE='https://agendatop.vercel.app';
const SK='cortai_painel_v4';
const ICONES=['📋','⏰','💆','🎨','⚡','💧','✨','👔','💅','🌸','🧴','👁️','🌿','💪','🦷','🐾','🏠','🧘'];
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const SEM=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const WA='<svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';


/* ═══ TOAST ═══ */
var _toastTimer=null;
function toast(msg, tipo){
  tipo=tipo||'ok';
  var el=document.getElementById('toastEl');
  if(!el){el=document.createElement('div');el.id='toastEl';el.className='toast';document.body.appendChild(el);}
  el.textContent=msg;
  el.className='toast '+tipo+' show';
  clearTimeout(_toastTimer);
  _toastTimer=setTimeout(function(){el.classList.remove('show');},2500);
}

/* ═══ HELPERS ═══ */
async function api(path, opts) {
  opts = opts || {};
  var r = await fetch(SUPA+'/rest/v1/'+path, {
    headers: Object.assign({'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':'application/json','Prefer':'return=representation'}, opts.headers||{}),
    method: opts.method||'GET',
    body: opts.body||undefined
  });
  if (!r.ok) throw new Error(await r.text());
  return r.status === 204 ? null : r.json();
}
async function rpc(fn, params) {
  var r = await fetch(SUPA+'/rest/v1/rpc/'+fn, {
    method:'POST',
    headers:{'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':'application/json'},
    body: JSON.stringify(params)
  });
  var txt = await r.text();
  if (!r.ok) { try{var j=JSON.parse(txt);throw new Error(j.message||txt);}catch(e2){if(e2.message!==txt)throw e2;throw new Error(txt);} }
  try{return JSON.parse(txt);}catch(e){return txt;}
}
// S1: rpcRetry — retries on 404 (PostgREST schema cache miss)
async function rpcRetry(fn, params, maxRetries){
  maxRetries=maxRetries||2;
  var lastErr;
  for(var i=0;i<maxRetries;i++){
    try{ return await rpc(fn, params); }
    catch(e){
      lastErr=e;
      if(e.message&&(e.message.includes('404')||e.message.includes('not found')||e.message.includes('Could not find'))){
        await new Promise(function(r){setTimeout(r,600*(i+1));});
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}
function fmt(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function pad(n){return String(n).padStart(2,'0');}
function hoje(){var d=new Date();d.setHours(0,0,0,0);return d;}
function fmtBR(ds){if(!ds)return'—';var p=ds.split('-');return p[2]+'/'+p[1]+'/'+p[0];}
function rBRL(c){return'R$'+Math.round(c/100);}

/* ── formatPrice: pt-BR currency ── */
function formatPrice(centavos){
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(centavos/100);
}

function sforca(v,ids,infoId){
  ids.forEach(function(id){document.getElementById(id).className='sfb';});
  var info=document.getElementById(infoId);
  if(!v.length){info.textContent='Mínimo 6 caracteres';return;}
  var f=0;if(v.length>=6)f++;if(v.length>=8&&/[0-9]/.test(v))f++;if(v.length>=8&&/[^a-zA-Z0-9]/.test(v))f++;
  var cls=['sf-f','sf-m','sf-s'],lbl=['Fraca','Média','Forte 💪'];
  for(var i=0;i<f;i++)document.getElementById(ids[i]).classList.add(cls[f-1]);
  info.textContent=f>0?lbl[f-1]:'';
}

/* ═══ AUTH ═══ */
var S=null, _pw=null;

// S1.3: 72h session + auto-refresh
function salvarSessao(d,pw){
  var e=new Date();e.setHours(e.getHours()+72);
  var payload=Object.assign({},d,{exp:e.toISOString(),_savedAt:new Date().toISOString()});
  if(pw) payload._pw=pw;
  localStorage.setItem(SK,JSON.stringify(payload));
  _pw=pw||null;
}
(function setupAutoRefresh(){
  var _lastActivity=Date.now();
  ['click','keydown','touchstart'].forEach(function(ev){
    document.addEventListener(ev,function(){_lastActivity=Date.now();},{passive:true});
  });
  setInterval(async function(){
    if(Date.now()-_lastActivity>3600000) return;
    var s=carregarSessao(); if(!s||!s.email||!_pw) return;
    try{
      var res=await rpc('verificar_acesso_por_email',{p_email:s.email,p_senha:_pw});
      if(res&&res.ok) salvarSessao(res,_pw);
    }catch(e){ console.warn('[Agenda] session refresh failed',e.message); }
  }, 50*60*1000);
})();

// ── AUTO-RESTORE SESSION ON PAGE LOAD ──
// Runs once when scripts finish loading — restores session from localStorage
// so the user doesn't have to re-login on every page refresh
(function autoRestoreSession(){
  try{
    // NEVER restore old session when arriving from cadastro (?novo=1)
    // A new salon must start with a fresh login, not inherit previous session
    if(new URLSearchParams(location.search).get('novo')==='1'){
      localStorage.removeItem(SK);
      return;
    }
    var s=JSON.parse(localStorage.getItem(SK)||'null');
    if(!s||new Date(s.exp)<new Date()){localStorage.removeItem(SK);return;}
    if(s._pw){_pw=s._pw; delete s._pw;}
    function tryStart(){
      if(document.getElementById('loginWrap')){
        iniciarApp(s);
      } else {
        setTimeout(tryStart,50);
      }
    }
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',function(){iniciarApp(s);},{once:true});
    } else {
      tryStart();
    }
  }catch(e){ console.warn('[session restore]',e); }
})();

function carregarSessao(){
  try{
    var s=JSON.parse(localStorage.getItem(SK)||'null');
    if(!s||new Date(s.exp)<new Date()){localStorage.removeItem(SK);return null;}
    if(s._pw){_pw=s._pw; delete s._pw;}
    return s;
  }catch(e){return null;}
}
function sair(){if(!confirm('Sair do painel?'))return;localStorage.removeItem(SK);_pw=null;location.reload();}

/* ═══ S1.2: getPw via modal (sem prompt()) ═══ */
var _getPwResolve=null, _getPwReject=null;
function _ovSenhaConfirmar(){
  var val=document.getElementById('ovSenhaInput').value;
  var errEl=document.getElementById('ovSenhaErr');
  if(!val){errEl.textContent='Informe a senha.';errEl.style.display='block';document.getElementById('ovSenhaInput').focus();return;}
  errEl.style.display='none';
  document.getElementById('ovSenha').style.display='none';
  document.getElementById('ovSenhaInput').value='';
  if(_getPwResolve){_getPwResolve(val);_getPwResolve=null;_getPwReject=null;}
}
function _ovSenhaCancelar(){
  document.getElementById('ovSenha').style.display='none';
  document.getElementById('ovSenhaInput').value='';
  document.getElementById('ovSenhaErr').style.display='none';
  if(_getPwReject){_getPwReject(null);_getPwResolve=null;_getPwReject=null;}
}
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){var ov=document.getElementById('ovSenha');if(ov&&ov.style.display!=='none')_ovSenhaCancelar();}
});
async function getPw(titulo,desc){
  if(_pw) return _pw;
  return new Promise(function(resolve){
    var ov=document.getElementById('ovSenha');
    if(!ov){resolve(null);return;}
    var titEl=document.getElementById('ovSenhaTit');
    var descEl=document.getElementById('ovSenhaDesc');
    var errEl=document.getElementById('ovSenhaErr');
    var inp=document.getElementById('ovSenhaInput');
    if(titEl) titEl.textContent=titulo||'Confirmar ação';
    if(descEl) descEl.textContent=desc||'Informe sua senha para continuar.';
    if(errEl) errEl.style.display='none';
    if(inp) inp.value='';
    _getPwResolve=function(val){_pw=val;resolve(val);};
    _getPwReject=function(){resolve(null);};
    ov.style.display='flex';
    setTimeout(function(){if(inp)inp.focus();},80);
  });
}

/* LOGIN */
document.getElementById('btnLogin').addEventListener('click', async function(){
  var err=document.getElementById('loginErro'); err.classList.remove('show');
  var email=document.getElementById('loginEmail').value.trim().toLowerCase();
  var pw=document.getElementById('loginSenha').value;
  if(!email){err.textContent='Informe seu e-mail.';err.classList.add('show');return;}
  if(!pw){err.textContent='Informe sua senha.';err.classList.add('show');return;}
  this.disabled=true; this.textContent='Entrando...';
  try{
    var res=await rpcRetry('verificar_acesso_por_email',{p_email:email,p_senha:pw});
    if(res&&res.ok){
      if(res.trial_expirado){
        salvarSessao(res,pw);
        res.status='trial_expirado';
        iniciarApp(res);
        setTimeout(function(){
          var wrap=document.getElementById('appWrap');
          if(wrap) wrap.setAttribute('data-locked','1');
          abrirUpgrade();
        }, 600);
      } else {
        salvarSessao(res,pw); iniciarApp(res);
      }
    } else if(res&&res.erro&&res.erro.includes('configurada')){
      document.getElementById('loginWrap').style.display='none';
      document.getElementById('csNome').textContent=email;
      document.getElementById('btnCriarSenha')._email=email;
      var w=document.getElementById('criarSenhaWrap');
      w.style.display='flex';
      setTimeout(function(){document.getElementById('csSenha').focus();},200);
    } else {
      err.textContent=(res&&res.erro)||'E-mail ou senha incorretos.';
      err.classList.add('show');
    }
  } catch(e){err.textContent='Erro de conexão.';err.classList.add('show');}
  this.disabled=false; this.textContent='Entrar';
});
document.getElementById('loginEmail').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('loginSenha').focus();});
document.getElementById('loginSenha').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('btnLogin').click();});

/* CRIAR SENHA */
document.getElementById('csSenha').addEventListener('input',function(){sforca(this.value,['csB1','csB2','csB3'],'csInfo');});
document.getElementById('btnCriarSenha').addEventListener('click', async function(){
  var err=document.getElementById('csErr'); err.classList.remove('show');
  var slug=this._slug||null;
  var pw=document.getElementById('csSenha').value, pw2=document.getElementById('csSenha2').value;
  if(!pw||pw.length<6){err.textContent='Mínimo 6 caracteres.';err.classList.add('show');return;}
  if(pw!==pw2){err.textContent='Senhas não coincidem.';err.classList.add('show');return;}
  this.disabled=true; this.textContent='Salvando...';
  try{
    var res=await rpc('criar_senha_salao',{p_slug:slug,p_senha_nova:pw});
    if(res&&res.ok){salvarSessao(res,pw);document.getElementById('criarSenhaWrap').style.display='none';iniciarApp(res);}
    else{err.textContent=(res&&res.erro)||'Erro ao criar senha.';err.classList.add('show');}
  }catch(e){err.textContent='Erro de conexão.';err.classList.add('show');}
  this.disabled=false; this.textContent='Criar senha e entrar';
});

/* ESQUECI SENHA */
var _eqSlug=null, _eqSessao=null, _eqPw=null;
function eqSteps(n){
  for(var i=1;i<=3;i++){
    var d=document.getElementById('eqD'+i), l=document.getElementById('eqL'+i);
    if(i<n){d.className='esq-d dn';d.textContent='✓';l.className='esq-l';}
    else if(i===n){d.className='esq-d on';d.textContent=i;l.className='esq-l on';}
    else{d.className='esq-d';d.textContent=i;l.className='esq-l';}
    if(i<3)document.getElementById('eqLn'+i).className='esq-ln'+(i<n?' dn':'');
  }
}
document.addEventListener('DOMContentLoaded', function(){
  var _btnEsqueci = document.getElementById('btnEsqueci');
  var _overlayEsq = document.getElementById('overlayEsq');
  if(_btnEsqueci) _btnEsqueci.addEventListener('click', function(){
    var _e1=document.getElementById('eqErr1'); if(_e1) _e1.classList.remove('show');
    var _et1=document.getElementById('eqEt1'); if(_et1) _et1.style.display='';
    var _et2=document.getElementById('eqEt2'); if(_et2) _et2.style.display='none';
    var _et3=document.getElementById('eqEt3'); if(_et3) _et3.style.display='none';
    if(typeof eqSteps==='function') eqSteps(1);
    if(_overlayEsq) _overlayEsq.classList.add('show');
    setTimeout(function(){var _sl=document.getElementById('eqSlug');if(_sl)_sl.focus();},200);
  });
  if(_overlayEsq) _overlayEsq.addEventListener('click',function(e){if(e.target===this)fecharEsq();});
});
function fecharEsq(){var _o=document.getElementById('overlayEsq');if(_o)_o.classList.remove('show');}


document.getElementById('btnEqV').addEventListener('click', async function(){
  var err=document.getElementById('eqErr1'); err.classList.remove('show');
  var slug=document.getElementById('eqSlug').value.trim().toLowerCase();
  var tel=document.getElementById('eqTel').value.trim();
  if(!slug){err.textContent='Informe seu usuário.';err.classList.add('show');return;}
  if(!tel||tel.replace(/\D/g,'').length<8){err.textContent='Informe o WhatsApp cadastrado.';err.classList.add('show');return;}
  this.disabled=true; this.textContent='Verificando...';
  try{
    var res=await rpc('self_reset_senha',{p_slug:slug,p_telefone:tel});
    if(res&&res.ok){
      _eqSlug=res.slug;
      document.getElementById('eqNome').textContent=res.nome;
      document.getElementById('eqEt1').style.display='none';
      document.getElementById('eqEt2').style.display='';
      eqSteps(2);
      setTimeout(function(){document.getElementById('eqSenha').focus();},150);
    } else {
      err.textContent=(res&&res.erro)||'Dados não encontrados.';
      err.classList.add('show');
    }
  }catch(e){err.textContent='Erro de conexão.';err.classList.add('show');}
  this.disabled=false; this.textContent='Verificar identidade';
});
document.getElementById('eqSlug').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('eqTel').focus();});
document.getElementById('eqTel').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('btnEqV').click();});
document.getElementById('eqSenha').addEventListener('input',function(){sforca(this.value,['eqB1','eqB2','eqB3'],'eqInfo');});
document.getElementById('eqSenha').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('eqSenha2').focus();});
document.getElementById('eqSenha2').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('btnEqS').click();});
document.getElementById('btnEqS').addEventListener('click', async function(){
  var err=document.getElementById('eqErr2'); err.classList.remove('show');
  var pw=document.getElementById('eqSenha').value, pw2=document.getElementById('eqSenha2').value;
  if(!pw||pw.length<6){err.textContent='Mínimo 6 caracteres.';err.classList.add('show');return;}
  if(pw!==pw2){err.textContent='Senhas não coincidem.';err.classList.add('show');return;}
  this.disabled=true; this.textContent='Salvando...';
  try{
    var res=await rpc('criar_senha_salao',{p_slug:_eqSlug,p_senha_nova:pw});
    if(res&&res.ok){
      _eqSessao=res; _eqPw=pw;
      document.getElementById('eqEt2').style.display='none';
      document.getElementById('eqEt3').style.display='';
      eqSteps(3);
    } else {err.textContent=(res&&res.erro)||'Erro ao salvar.';err.classList.add('show');}
  }catch(e){err.textContent='Erro de conexão.';err.classList.add('show');}
  this.disabled=false; this.textContent='Salvar nova senha';
});
document.addEventListener('DOMContentLoaded',function(){
  var _b=document.getElementById('btnEqEntrar');
  if(_b) _b.addEventListener('click',function(){
    if(_eqSessao){salvarSessao(_eqSessao,_eqPw);fecharEsq();iniciarApp(_eqSessao);}
  });
});

/* ═══ APP ═══ */
var _servicos=[], _editSrvId=null, _icoSel='✂️', _srvSelId=null;
var _calAno=new Date().getFullYear(), _calMes=new Date().getMonth();
var _calDados={}, _drillDia=null;

/* ── TEMA DO PAINEL ── */
function setPainelTema(cls){
  var htmlEl=document.documentElement;
  var allThemes=['t-onyx','t-feminine','t-neutral',
    // legacy themes
    't-obsidian','t-azure','t-emerald','t-rose','t-crimson','t-clean','t-verde'];
  allThemes.forEach(function(t){htmlEl.classList.remove(t);});
  // Map legacy → new
  var legacyMap={'t-obsidian':'t-onyx','t-azure':'t-neutral','t-emerald':'t-neutral','t-rose':'t-feminine','t-crimson':'t-feminine','t-indigo':'t-feminine','t-clean':'t-neutral','t-verde':'t-neutral'};
  if(cls && legacyMap[cls]) cls=legacyMap[cls];
  if(cls) htmlEl.classList.add(cls);
  var key=cls?cls.replace('t-',''):'obsidian';
  // Update swatch items in Página tab
  document.querySelectorAll('.theme-swatch-item').forEach(function(el){
    el.classList.toggle('active',el.dataset.theme===cls);
  });
  try{
    localStorage.setItem('cortai_painel_tema',cls||'');
    var _sess=null;
    try{_sess=JSON.parse(localStorage.getItem(SK)||'null');}catch(e){}
    if(_sess&&_sess.slug){
      localStorage.setItem('cortai_tema_ag_'+_sess.slug,cls||'');
      localStorage.setItem('cortai_tema_ag_'+_sess.slug+'_t',Date.now().toString());
    }
  }catch(e){}
}


/* ── Visibilidade de abas por plano ── */
function configurarAbasPorPlano(){
  if(!window.S) return;
  var plano=(S.plano||'').toLowerCase();
  var isBasico=plano==='basico'||plano==='solo';
  var isNegocio=plano==='salao'||plano==='negocio';
  var isPro=plano==='pro'||plano==='equipe';
  var temCampanhas=isPro||isNegocio;
  var temAnalytics=isNegocio;
  ['campanhas','analytics'].forEach(function(aba){
    var vis=aba==='campanhas'?temCampanhas:temAnalytics;
    var sb=document.querySelector('.sb-item[data-tab="'+aba+'"]');
    var bn=document.querySelector('.bnav-item[data-tab="'+aba+'"]');
    if(sb) sb.style.display=vis?'':'none';
    if(bn) bn.style.display=vis?'':'none';
  });
}

function iniciarApp(sessao){
  S=sessao;
  (function(){
    var local=null;
    try{local=localStorage.getItem('cortai_painel_tema');}catch(e){}
    var tpl=sessao.tema&&sessao.tema.template?sessao.tema.template:null;
    // localStorage takes priority (latest user selection); DB is fallback
    var cls=local||(tpl?'t-'+tpl:'');
    if(cls) setPainelTema(cls);
    else setPainelTema('t-onyx');
  })();
  document.getElementById('loginWrap').style.display='none';
  document.getElementById('appWrap').classList.add('show');
  document.getElementById('hdrNome').textContent=sessao.nome;
  // Topbar mobile: nome + avatar iniciais
  var _tbNome=document.getElementById('topbarNomeTopbar');
  if(_tbNome) _tbNome.textContent=sessao.nome;
  // topbar-salon-name in topbar-actions
  var _tbSalon=document.querySelector('.topbar-actions .topbar-salon-name');
  if(_tbSalon) _tbSalon.textContent=sessao.nome;
  var _ini=document.getElementById('topbarIniciais');
  if(_ini){var _w=(sessao.nome||'').trim().split(/\s+/);_ini.textContent=_w.length>1?_w[0][0]+_w[1][0]:(_w[0]||'?')[0].toUpperCase();}
  document.getElementById('btnVerPag').href=BASE+'/agendar.html?slug='+sessao.slug;

  // Demo banner
  if(sessao.slug==='demo'){
    var bd=document.getElementById('bannerDemo');
    if(bd)bd.style.display='flex';
  }

  // S2.1: Trial expirado — trava o painel com paywall melhorado
  var _trialExpirado = sessao.status==='trial_expirado' ||
    (sessao.status==='trial' && sessao.trial_expira &&
     new Date(sessao.trial_expira+'T23:59:59') < new Date());

  if(_trialExpirado){
    var bt=document.getElementById('bannerTrial');
    if(bt){
      bt.style.display='flex'; bt.style.background='#991B1B';
      bt.style.border='none'; bt.style.cursor='pointer';
      bt.onclick=function(){abrirUpgrade();};
      var txt=document.getElementById('bannerTrialTxt');
      if(txt){txt.textContent='Período gratuito encerrado — clique para assinar';txt.style.color='#fff';txt.style.fontWeight='700';}
    }
    var wrap2=document.getElementById('appWrap');
    if(wrap2){
      wrap2.setAttribute('data-locked','1');
      var lockDiv=document.getElementById('trialLockOv');
      if(!lockDiv){
        lockDiv=document.createElement('div');
        lockDiv.id='trialLockOv';
        lockDiv.style.cssText='position:absolute;inset:0;z-index:50;cursor:not-allowed;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;padding:24px;text-align:center';
        // S2.4: Gracious paywall copy
        var lh='<div style="font-size:48px;margin-bottom:4px">🔒</div>';
        lh+='<div style="font-family:var(--font-d);font-size:18px;font-weight:800;color:#fff;margin-bottom:6px">Período gratuito encerrado</div>';
        lh+='<div style="font-size:13px;color:rgba(255,255,255,.85);font-weight:600;max-width:280px;line-height:1.6;margin-bottom:16px">';
        lh+='Seu histórico está preservado. Assine agora para continuar recebendo agendamentos.</div>';
        lh+='<button onclick="abrirUpgrade()" style="background:var(--primary);color:#fff;border:none;border-radius:12px;padding:14px 28px;font-family:var(--font-d);font-size:15px;font-weight:800;cursor:pointer;width:100%;max-width:260px">Assinar — a partir de R$35/mês</button>';
        lockDiv.innerHTML=lh;
        lockDiv.onclick=function(e){if(e.target===this)abrirUpgrade();};
        wrap2.appendChild(lockDiv);
      }
    }
  }

  // Novo cadastro
  if(new URLSearchParams(location.search).get('novo')==='1'){
    document.getElementById('bannerNovo').style.display='block';
    var _fn=(sessao.responsavel||'').split(' ')[0]; document.getElementById('bnovoTit').textContent='Bem-vindo'+(_fn?', '+_fn:'')+'! 👋';
    // S2.2: Onboarding checklist no primeiro acesso
    setTimeout(function(){
      var obKey='cortai_ob_done_'+sessao.id;
      if(!localStorage.getItem(obKey)){
        // S7.4: mostrarOnboarding → renderOnboarding (defined in p-agenda.js)
        if(typeof renderOnboarding==='function') renderOnboarding().catch(function(){});
        else if(typeof tab==='function'){
          tab('servicos',null);
          toast('Configure seus serviços e horário para começar a receber agendamentos!','ok');
        }
      }
    },800);
  }

  // S2.3: Banner trial ativo com alerta de faturamento incompleto
  if(sessao.trial_expira){
    var dias=Math.ceil((new Date(sessao.trial_expira)-new Date())/86400000);
    if(dias>=0){
      document.getElementById('bannerTrial').style.display='flex';
      document.getElementById('bannerTrial').style.cursor='pointer';
      document.getElementById('bannerTrial').onclick=function(){abrirUpgrade();};
      var _msg=dias<=2?'Seu período gratuito termina ':'Período gratuito: ';
      _msg+=dias===0?'hoje! Assine agora.':dias===1?'amanhã! Assine agora.':'em '+dias+' dias.';
      if(dias<=5&&(!sessao.fat_cpf_cnpj||!sessao.fat_nome)){
        _msg+=' — Preencha seus dados de faturamento para assinar!';
        document.getElementById('bannerTrial').style.background='rgba(220,38,38,.15)';
      }
      document.getElementById('bannerTrialTxt').textContent=_msg;
    }
  }

  var fab=document.getElementById('fabBtn');
  if(fab) fab.style.display='flex';
  carregarServicos();
  renderAgenda();
  if(S.plano!=='basico'){
    api('profissionais?salao_id=eq.'+S.id+'&ativo=eq.true&order=ordem').then(function(profs){
      _profs=profs||[];
      _profs.forEach(function(p,i){if(!p.cor)p.cor=PROF_CORES[i%PROF_CORES.length];});
    });
  }
  setTimeout(function(){
    if(typeof pedirPermissaoPush==='function') pedirPermissaoPush(S.slug,_pw||'');
  },500);
  var isBasico=sessao.plano==='basico'||sessao.plano==='trial';
  document.querySelectorAll('.tab-plano-pro').forEach(function(el){
    el.style.display=isBasico?'none':'';
  });
  inicializarAvatar();
  configurarAbasPorPlano();
  // Ensure FAB visible
  var _fab=document.getElementById('fabBtn');
  if(_fab) _fab.style.display='flex';
}

/* TABS */
var _profs=[];
var _profFiltro=null;
var PROF_CORES=['#FF5C1A','#1E6091','#2D6A4F','#C9736F','#6C63FF','#D4AF37','#E67E22','#8E44AD'];
var _drillDia=null;
function profCor(i){return PROF_CORES[i%PROF_CORES.length];}



var _tabOk={agenda:false,clientes:false,servicos:false,equipe:false,pagamentos:false,pagina:false,analytics:false,campanhas:false};
function tab(id,btn){
  var wrap=document.getElementById('appWrap');
  if(wrap&&wrap.getAttribute('data-locked')==='1'){abrirUpgrade();return;}
  document.querySelectorAll('.tnav').forEach(function(b){b.classList.remove('on');});
  if(btn) btn.classList.add('on');
  document.querySelectorAll('.tab-body').forEach(function(t){t.classList.remove('on');});
  document.getElementById('tb-'+id).classList.add('on');
  var fab=document.getElementById('fabBtn');
  if(fab) fab.style.display=(id==='agenda')?'flex':'none';
  if(id==='agenda'&&!_tabOk.agenda) renderAgenda();
  else if(id==='clientes'&&!_tabOk.clientes) renderClientes();
  else if(id==='servicos'&&!_tabOk.servicos) renderServicos();
  else if(id==='equipe'&&!_tabOk.equipe) renderEquipe();
  else if(id==='pagamentos'&&!_tabOk.pagamentos) renderPagamentos();
  else if(id==='pagina'&&!_tabOk.pagina) renderPagina();
  else if(id==='analytics'&&!_tabOk.analytics) renderAnalytics();
  else if(id==='campanhas'&&!_tabOk.campanhas) renderCampanhas();
}
// Alias para tabs usados por p-agenda.js e outros módulos
function navTab(id,btn){tab(id,btn);}

/* ── tabSidebar / tabBottom: conveniência para onclicks no HTML ── */
function tabSidebar(id, btn) {
  tab(id, btn);
  // Sync bottom nav
  document.querySelectorAll('.bnav-item').forEach(function(b){b.classList.remove('on');});
  var bnItem = document.querySelector('.bnav-item[data-tab="'+id+'"]');
  if(bnItem) bnItem.classList.add('on');
}
function tabBottom(id, btn) {
  tab(id, btn);
  // Sync sidebar
  document.querySelectorAll('.sb-item').forEach(function(b){b.classList.remove('on');});
  var sbItem = document.querySelector('.sb-item[data-tab="'+id+'"]');
  if(sbItem) sbItem.classList.add('on');
}

/* ── Avatar dropdown menu ── */
function toggleAvatarMenu(){
  var m=document.getElementById('avatarMenu');
  if(!m) return;
  m.style.display=(m.style.display==='none'||!m.style.display)?'block':'none';
}
function inicializarAvatar(){
  var av=document.getElementById('topbarAvatar');
  if(!av) return;
  av.onclick=function(e){
    e.stopPropagation();
    toggleAvatarMenu();
  };
  document.addEventListener('click',function(e){
    if(!e.target.closest('#topbarAvatar')&&!e.target.closest('#avatarMenu')){
      var m=document.getElementById('avatarMenu');
      if(m) m.style.display='none';
    }
  },{capture:false,passive:true});
}
function irParaAba(id){
  var btn=document.querySelector('.sb-item[data-tab="'+id+'"]')||
          document.querySelector('.bnav-item[data-tab="'+id+'"]');
  tab(id,btn);
  var m=document.getElementById('avatarMenu');
  if(m) m.style.display='none';
}

function _syncNavState(id) {
  document.querySelectorAll('.bnav-item').forEach(function(b){
    b.classList.toggle('on', b.dataset.tab===id);
  });
  document.querySelectorAll('.sb-item').forEach(function(b){
    b.classList.toggle('on', b.dataset.tab===id);
  });
}

function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

/* ═══ HELPERS DE LISTA ═══ */
function profIdx(profId){
  if(!profId||!_profs||!_profs.length) return -1;
  return _profs.findIndex(function(p){return p.id===profId;});
}
function badgeStatus(status){
  var cls=status==='confirmado'?'sc':status==='cancelado'?'sx':status==='concluido'?'sk':'sp';
  var lbl=status==='confirmado'?'confirmado':status==='cancelado'?'cancelado':status==='concluido'?'concluído':'pendente';
  return '<span class="stb '+cls+'">'+lbl+'</span>';
}
function renderListaAgs(ags, podeAcao, origem) {
  if(!ags||ags.length===0){
    return '<div class="empty">Nenhum agendamento hoje<br><span style="font-size:11px;color:var(--CZ)">Quando alguém agendar, aparece aqui</span></div>';
  }
  var ativos=ags.filter(function(a){return a.status!=='cancelado';});
  var html='<div class="lista-hdr"><h3>Agendamentos</h3><span class="tag-c">'+ativos.length+' ativo'+(ativos.length!==1?'s':'')+'</span></div>';
  ags.forEach(function(a){
    var cancelBtn='';
    if(podeAcao&&a.status!=='cancelado'&&a.status!=='concluido'){
      var waLink=typeof gerarLinkWA==='function'?gerarLinkWA(a):null;
      var waBtn=waLink?'<a class="bst bwa" href="'+waLink+'" target="_blank" rel="noopener">'+WA+' Lembrete</a>':'';
      cancelBtn=waBtn+'<button class="bst bcanc" data-id="'+a.id+'" data-orig="'+origem+'" onclick="cancelAg(this.dataset.id,this.dataset.orig)">✕ Cancelar</button>';
    }
    html+=
      '<div class="ag-card">'+
        '<div class="ag-hora">'+a.hora.substring(0,5)+'</div>'+
        '<div class="ag-body">'+
          '<div class="ag-top"><div class="ag-nome">'+esc(a.cliente_nome)+'</div>'+badgeStatus(a.status)+'</div>'+
          '<div class="ag-info"><span class="ag-srv">✂ '+esc(a.servico_nome)+'</span><span class="ag-tel">'+a.cliente_tel+'</span></div>'+
          (cancelBtn?'<div class="ag-acoes">'+cancelBtn+'</div>':'')+
        '</div>'+
        '<div class="ag-preco">'+rBRL(a.servico_preco)+'</div>'+
      '</div>';
  });
  return html;
}

async function confirmAg(id, origem){
  var pw=await getPw(); if(!pw) return;
  try{
    await rpc('confirmar_agendamento_painel',{p_slug:S.slug,p_senha:pw,p_ag_id:id});
    toast('Agendamento confirmado!','ok');
    if(origem==='drill') await renderDrill(_drillDia);
    else { _tabOk.agenda=false; await renderAgenda(); }
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;}
    toast('Erro ao confirmar: '+e.message,'err');
  }
}
async function cancelAg(id, origem){
  if(!confirm('Cancelar este agendamento?'))return;
  var pw=await getPw(); if(!pw) return;
  try{
    await rpc('cancelar_agendamento_painel',{p_slug:S.slug,p_senha:pw,p_ag_id:id});
    toast('Agendamento cancelado','ok');
    if(origem==='drill') await renderDrill(_drillDia);
    else { _tabOk.agenda=false; await renderAgenda(); }
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;}
    toast('Erro ao cancelar: '+e.message,'err');
  }
}
