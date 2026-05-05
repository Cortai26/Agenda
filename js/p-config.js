/* ═══ p-config.js — Aba Minha Página + Pagamentos ═══ */

var _pgtoState = {dinheiro:true, pix:true, cartao:false, pixKey:'', pixTipo:'telefone', mostrarSinal:false, sinalObrig:false, sinalPct:30, cancelMin:120};

var HORARIO_PADRAO = {
  '0':null,
  '1':{ini:'09:00',fim:'19:00'},
  '2':{ini:'09:00',fim:'19:00'},
  '3':{ini:'09:00',fim:'19:00'},
  '4':{ini:'09:00',fim:'19:00'},
  '5':{ini:'09:00',fim:'19:00'},
  '6':{ini:'09:00',fim:'14:00'}
};
var DIAS_SEMANA = ['Domingo','Segunda','Ter\u00e7a','Quarta','Quinta','Sexta','S\u00e1bado'];

/* ─── PUSH ─── */
async function atualizarStatusPush(){
  var el=document.getElementById('pushStatusTxt');
  if(!el) return;
  var isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(!isStandalone){
    el.innerHTML='<strong style="color:var(--AM)">\u26a0\ufe0f Abra pelo \u00edcone instalado na tela inicial</strong><br><span style="font-size:11px">Push s\u00f3 funciona no app instalado. Safari: Compartilhar \u2192 Adicionar \u00e0 Tela de In\u00edcio.</span>';
    return;
  }
  if(!('Notification' in window)){el.innerHTML='\u274c N\u00e3o suportado neste navegador.';return;}
  var perm=Notification.permission;
  if(perm==='denied'){el.innerHTML='\ud83d\udeab Permiss\u00e3o bloqueada. Ajustes \u2192 Notifica\u00e7\u00f5es \u2192 Safari \u2192 habilite.';return;}
  if(perm==='default'){
    el.innerHTML='\u23f3 Toque para ativar notifica\u00e7\u00f5es.<br><button class="btn-add" style="margin-top:8px;width:100%;justify-content:center" onclick="ativarNotificacoes()">\uD83D\uDD14 Ativar notifica\u00e7\u00f5es</button>';
    return;
  }
  try{
    var sw=await navigator.serviceWorker.ready;
    var sub=await sw.pushManager.getSubscription();
    if(sub){el.innerHTML='\u2705 <strong style="color:#4ADE80">Notifica\u00e7\u00f5es ativas!</strong> Voc\u00ea receber\u00e1 avisos de novos agendamentos.';}
    else{
      el.innerHTML='\u26a0\ufe0f Permiss\u00e3o OK mas n\u00e3o registrado. <button class="btn-add" style="margin-top:8px;width:100%;justify-content:center" onclick="registrarPush(S.slug,_pw||\'\')">Registrar agora</button>';
      await registrarPush(S.slug,_pw||'');
    }
  }catch(e){el.innerHTML='\u274c Erro: '+e.message;}
}

async function testarPush(btn){
  if(!btn) btn=document.querySelector('[onclick*="testarPush"]');
  if(btn){btn.disabled=true;btn.textContent='Enviando...';}
  try{
    var r=await fetch('https://acldrisohnjfekjxgmoh.supabase.co/functions/v1/push-notify',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({salao_id:S.id,cliente_nome:'Teste Push',data:new Date().toISOString().slice(0,10),hora:'00:00:00',servico_nome:'Notifica\u00e7\u00e3o de teste'})
    });
    var d=await r.json();
    if(btn){
      if(d.sent>0){btn.textContent='\u2705 Enviado!';btn.style.background='#2D6A4F';}
      else{btn.textContent='\u26a0\ufe0f Sem subscribers (abra pelo \u00edcone instalado)';btn.style.background='var(--AM)';}
    }
  }catch(e){if(btn){btn.textContent='\u274c Erro: '+e.message;btn.style.background='var(--VM)';}}
  setTimeout(function(){if(btn){btn.disabled=false;btn.textContent='\ud83e\uddea Enviar notifica\u00e7\u00e3o de teste';btn.style.background='';}},4000);
}

/* ─── HORÁRIO ─── */
function renderHorario(horarioAtual){
  var h=horarioAtual||HORARIO_PADRAO;
  var html='<div class="perfil-tit sec-collapse" onclick="if(typeof toggleSec===\'function\')toggleSec(this)">\ud83d\udd50 Hor\u00e1rio de funcionamento</div><div class="sec-body">';
  html+='<div style="font-size:12px;color:var(--CZ);font-weight:600;margin-bottom:14px;line-height:1.5">Configure os dias e hor\u00e1rios que voc\u00ea atende. O link de agendamento bloquear\u00e1 automaticamente hor\u00e1rios fora deste per\u00edodo.</div>';
  html+='<div id="horarioGrid" style="display:flex;flex-direction:column;gap:10px">';
  for(var d=0;d<7;d++){
    var aberto=h[d+'']!==null&&h[d+'']!==undefined;
    var ini=(h[d+'']&&h[d+''].ini)?h[d+''].ini:'09:00';
    var fim=(h[d+'']&&h[d+''].fim)?h[d+''].fim:'19:00';
    html+='<div class="horario-row" data-dia="'+d+'" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--s2);border-radius:10px;border:1px solid var(--bd)">';
    html+='<div style="min-width:64px;font-size:13px;font-weight:800;color:var(--MR)">'+DIAS_SEMANA[d].substring(0,3)+'</div>';
    html+='<button class="btn-toggle-dia toggle '+(aberto?'on':'')+'" data-dia="'+d+'" onclick="toggleDia(this)" style="flex-shrink:0"></button>';
    html+='<div class="horario-horas" style="display:flex;align-items:center;gap:8px;flex:1;opacity:'+(aberto?'1':'.3')+';pointer-events:'+(aberto?'auto':'none')+'">';
    html+='<input type="time" class="fi" value="'+ini+'" data-dia="'+d+'" data-tipo="ini" style="flex:1;padding:7px 8px;font-size:13px">';
    html+='<span style="font-size:12px;color:var(--CZ);font-weight:700">at\u00e9</span>';
    html+='<input type="time" class="fi" value="'+fim+'" data-dia="'+d+'" data-tipo="fim" style="flex:1;padding:7px 8px;font-size:13px">';
    html+='</div>';
    html+='<div class="hr-fechado" style="font-size:11px;color:var(--CZ);font-weight:700;display:'+(aberto?'none':'block')+'">Fechado</div>';
    html+='</div>';
  }
  html+='</div>';
  html+='<button class="btn-add" onclick="salvarHorario()" style="width:100%;justify-content:center;padding:12px;margin-top:14px">Salvar hor\u00e1rio</button>';
  return html;
}

function toggleDia(btn){
  var aberto=btn.classList.contains('on');
  btn.classList.toggle('on');
  var row=btn.closest('.horario-row');
  var horas=row.querySelector('.horario-horas');
  var fechado=row.querySelector('.hr-fechado');
  if(aberto){
    if(horas){horas.style.opacity='.3';horas.style.pointerEvents='none';}
    if(fechado)fechado.style.display='block';
  } else {
    if(horas){horas.style.opacity='';horas.style.pointerEvents='';}
    if(fechado)fechado.style.display='none';
  }
}

function atualizarHora(input){}

async function salvarHorario(){
  var btn=document.querySelector('[onclick="salvarHorario()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var pw=await getPw();
  if(!pw){if(btn){btn.disabled=false;btn.textContent='Salvar hor\u00e1rio';}return;}
  var horario={};
  document.querySelectorAll('.horario-row').forEach(function(row){
    var dia=row.dataset.dia;
    var aberto=row.querySelector('.btn-toggle-dia').classList.contains('on');
    if(!aberto){horario[dia]=null;return;}
    var ini=row.querySelector('[data-tipo="ini"]').value||'09:00';
    var fim=row.querySelector('[data-tipo="fim"]').value||'19:00';
    horario[dia]={ini:ini,fim:fim};
  });
  try{
    var ok=await rpc('salvar_horario',{p_slug:S.slug,p_senha:pw,p_horario:horario});
    if(btn){btn.disabled=false;btn.textContent='Salvar hor\u00e1rio';}
    if(ok){toast('\u2713 Hor\u00e1rio salvo!','ok');S._horario=horario;}
    else{toast('Erro ao salvar hor\u00e1rio','err');}
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='Salvar hor\u00e1rio';}
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;toast('Senha incorreta','err');}
    else{toast('Erro: '+e.message,'err');}
  }
}

/* ─── MINHA PÁGINA ─── */
async function renderPagina(){
  _tabOk.pagina=true;
  var container=document.getElementById('tb-pagina');
  if(!container) return;
  container.innerHTML='';

  /* ── 1. Theme picker ── */
  var temaDiv=document.createElement('div');
  temaDiv.id='temaWrap';
  temaDiv.style.marginBottom='8px';
  container.appendChild(temaDiv);
  setTimeout(function(){if(typeof renderTema==='function')renderTema();},50);

  /* ── 2. Link público ── */
  if(S&&S.slug){
    var url=BASE+'/agendar.html?slug='+S.slug;
    var linkBox=document.createElement('div');
    linkBox.style.cssText='background:var(--bg-card);border-radius:var(--r-lg);padding:14px 16px;margin-bottom:12px;border:1px solid var(--sep)';
    linkBox.innerHTML='<div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--text-3);text-transform:uppercase;margin-bottom:8px">Seu link de agendamento</div>'+
      '<div style="display:flex;align-items:center;gap:8px;background:var(--bg-card-2);border-radius:var(--r-sm);padding:10px 12px">'+
        '<div style="flex:1;font-size:12px;color:var(--text-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+url+'</div>'+
        '<a href="'+url+'" target="_blank" style="flex-shrink:0;color:var(--primary);font-size:12px;font-weight:700;text-decoration:none">Abrir ↗</a>'+
      '</div>';
    container.appendChild(linkBox);
  }

  /* ── 3. Seções — cada uma é filho direto do container ── */
  var secoes=[
    {id:'dados-estab',    icon:'✏️', label:'Perfil público',          html:_htmlPerfil()},
    {id:'faturamento',    icon:'💰', label:'Dados de faturamento',    html:_htmlFaturamento()},
    {id:'horarios',       icon:'🕐', label:'Horário de funcionamento', html:'<div id="horarioWrap" style="padding:12px 16px"><div class="loading">Carregando...</div></div>'},
    {id:'bloqueios',      icon:'🚫', label:'Bloqueios de agenda',     html:null, async:true, asyncFn:'_renderBloqueios'},
    {id:'lembrete',       icon:'⏰', label:'Lembrete de retorno',     html:_htmlLembrete()},
    {id:'push',           icon:'🔔', label:'Notificações push',       html:'<div style="padding:12px 16px"><div id="pushStatusTxt" style="font-size:13px;color:var(--CZ);margin-bottom:12px">Verificando...</div><button class="btn-add" style="width:100%;justify-content:center;padding:11px" onclick="testarPush(this)">🔔 Ativar notificações</button></div>'},
    {id:'financeiro',     icon:'💳', label:'Financeiro',              html:'<div id="financeiroWrap" style="padding:12px 16px"><div class="loading">Carregando...</div></div>'},
  ];

  secoes.forEach(function(s){
    /* createElement garante que cada grupo é filho direto — sem aninhamento */
    var grupo=document.createElement('div');
    grupo.className='section-group';
    grupo.dataset.section=s.id;
    grupo.style.cssText='background:var(--bg-card);border-radius:var(--r-lg);margin:0 0 10px;overflow:hidden;border:1px solid var(--sep)';

    var header=document.createElement('div');
    header.className='section-group-header';
    header.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer;user-select:none';
    header.innerHTML='<span style="display:flex;align-items:center;gap:8px;font-family:var(--font-body);font-size:15px;font-weight:600;color:var(--text)"><span>'+s.icon+'</span>'+s.label+'</span>'+
      '<svg class="section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:var(--text-3);transition:transform .24s;flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>';
    header.onclick=function(){_toggleSecao(s.id);};

    var body=document.createElement('div');
    body.id='secbody-'+s.id;
    body.style.cssText='max-height:0;opacity:0;overflow:hidden;transition:max-height .32s ease,opacity .24s ease;padding:0';

    if(s.async){
      body.innerHTML='<div style="padding:12px 16px"><div class="loading">Carregando...</div></div>';
      (function(b){
        _renderBloqueios().then(function(html){b.innerHTML='<div style="padding:0">'+html+'</div>';});
      })(body);
    } else {
      body.innerHTML='<div style="padding:0">'+(s.html||'')+'</div>';
    }

    grupo.appendChild(header);
    grupo.appendChild(body);
    container.appendChild(grupo);
  });

  /* ── 4. Async loading of horário, financeiro, push ── */
  setTimeout(async function(){
    try{
      if(!S._tema){
        var td=await api('saloes?slug=eq.'+S.slug+'&select=tema');
        if(td&&td[0]&&td[0].tema) S._tema=td[0].tema;
      }
      if(typeof renderTema==='function') renderTema();
    }catch(e){}
    try{
      var hw=document.getElementById('horarioWrap');
      if(hw) hw.innerHTML=renderHorario(S.horario||null);
    }catch(e){}
    try{atualizarStatusPush();}catch(e){}
    try{
      var fw=document.getElementById('financeiroWrap');
      if(fw) renderFinanceiro(fw);
    }catch(e){}
  },300);
}

function _toggleSecao(id){
  var body=document.getElementById('secbody-'+id);
  if(!body) return;
  var grupo=body.parentElement;
  var chevron=grupo?grupo.querySelector('.section-chevron'):null;
  var isOpen=body.style.maxHeight&&body.style.maxHeight!=='0px';
  if(isOpen){
    body.style.maxHeight='0px';
    body.style.opacity='0';
    body.style.padding='0';
    if(chevron) chevron.style.transform='rotate(0deg)';
  } else {
    body.style.maxHeight=body.scrollHeight+500+'px';
    body.style.opacity='1';
    body.style.padding='';
    if(chevron) chevron.style.transform='rotate(90deg)';
  }
}

/* ── Section content builders ── */
function _htmlPerfil(){
  return '<div style="padding:12px 16px">'+
    '<div class="fg"><label class="fl">Descrição</label>'+
    '<textarea class="fi" id="pfDesc" rows="3" style="resize:none;height:80px" placeholder="Sobre seu negócio...">'+esc(S.descricao||'')+'</textarea></div>'+
    '<div class="fg"><label class="fl">Endereço</label><input class="fi" type="text" id="pfEnd" value="'+esc(S.endereco||'')+'" placeholder="Rua, número, bairro"></div>'+
    '<div class="two"><div class="fg"><label class="fl">CEP</label><input class="fi" type="text" id="pfCep" value="'+esc(S.cep||'')+'" placeholder="00000-000"></div>'+
    '<div class="fg"><label class="fl">Cancelamento mínimo</label><select class="fi-sel" id="pfCancel">'+
    '<option value="0"'+(S.cancelamento_min===0?' selected':'')+'>Qualquer hora</option>'+
    '<option value="60"'+(S.cancelamento_min===60?' selected':'')+'>1 hora antes</option>'+
    '<option value="120"'+(!S.cancelamento_min||S.cancelamento_min===120?' selected':'')+'>2 horas antes</option>'+
    '<option value="1440"'+(S.cancelamento_min===1440?' selected':'')+'>1 dia antes</option>'+
    '</select></div></div>'+
    '<button class="btn-sv" onclick="salvarPerfil()" style="margin-top:8px;background:var(--primary)!important;color:#fff!important">Salvar perfil</button>'+
    '</div>';
}

function _htmlFaturamento(){
  return '<div style="padding:12px 16px">'+
    '<div class="fg"><label class="fl">Nome completo *</label><input class="fi" type="text" id="fatNome" value="'+esc(S.fat_nome||'')+'"></div>'+
    '<div class="two"><div class="fg"><label class="fl">CPF / CNPJ *</label><input class="fi" type="text" id="fatCpf" oninput="fmtCpfCnpj(this)" value="'+esc(S.fat_cpf_cnpj||'')+'"></div>'+
    '<div class="fg"><label class="fl">Email cobranças</label><input class="fi" type="email" id="fatEmail" value="'+esc(S.fat_email||'')+'"></div></div>'+
    '<button class="btn-sv" onclick="salvarFaturamento()" style="margin-top:8px;background:var(--primary)!important;color:#fff!important">Salvar</button>'+
    '</div>';
}

function _htmlLembrete(){
  var ativo=S.lembrete_retorno_ativo||false;
  var dias=S.lembrete_retorno_dias||30;
  return '<div style="padding:12px 16px">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid var(--sep)">'+
      '<div><div style="font-size:14px;font-weight:700;color:var(--text)">Ativar lembrete de retorno</div>'+
      '<div style="font-size:12px;color:var(--text-2);margin-top:3px">Envia lembrete para clientes sem agendar há X dias</div></div>'+
      '<label class="tog"><input type="checkbox" id="lembreToggle" '+(ativo?'checked':'')+' onchange="_salvarLembrete()"><span class="tog-sl"></span></label>'+
    '</div>'+
    '<div class="fg"><label class="fl">Dias sem agendamento para disparar</label>'+
    '<input class="fi" type="number" id="lembreDias" value="'+dias+'" min="7" max="365" style="width:120px" onchange="_salvarLembrete()"></div>'+
    '<div style="font-size:11px;color:var(--text-3);margin-top:8px">⚠️ Envio via WhatsApp em breve.</div>'+
    '</div>';
}

async function _renderBloqueios(){
  try{
    var bloqueios=await api('bloqueios_agenda?salao_id=eq.'+S.id+'&order=data_inicio&limit=50')||[];
    var html='';
    if(!bloqueios.length){
      html='<div style="padding:16px;font-size:13px;color:var(--text-2)">Nenhum bloqueio cadastrado.<br>'+
        '<small>Use bloqueios para marcar férias, folgas ou feriados.</small></div>';
    } else {
      html=bloqueios.map(function(b){
        var ini=b.data_inicio?new Date(b.data_inicio+'T12:00:00').toLocaleDateString('pt-BR'):'—';
        var fim=b.data_fim?new Date(b.data_fim+'T12:00:00').toLocaleDateString('pt-BR'):ini;
        return '<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--sep)">'+
          '<div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--text)">'+(b.motivo||'Bloqueio')+'</div>'+
          '<div style="font-size:12px;color:var(--text-2)">'+ini+(fim!==ini?' → '+fim:'')+'</div></div>'+
          '<button onclick="_excluirBloqueio('+b.id+')" style="background:var(--error-bg,rgba(255,59,48,.1));color:var(--error,#FF3B30);border:none;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:700;cursor:pointer">\xd7</button>'+
          '</div>';
      }).join('');
    }
    html+='<div style="padding:12px 16px">'+
      '<button onclick="_abrirNovoBloqueio()" style="width:100%;padding:12px;background:var(--primary);color:#fff;border:none;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer">+ Adicionar bloqueio</button>'+
      '</div>';
    return html;
  }catch(e){
    console.warn('_renderBloqueios:',e.message);
    return '<div style="padding:16px;font-size:13px;color:var(--text-2)">Erro ao carregar bloqueios. Tente novamente.</div>'+
      '<div style="padding:0 16px 12px"><button onclick="_abrirNovoBloqueio()" style="width:100%;padding:12px;background:var(--primary);color:#fff;border:none;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer">+ Adicionar bloqueio</button></div>';
  }
}

var _bloqExcluirId = null;
async function _excluirBloqueio(id){
  _bloqExcluirId = id;
  var btn = document.getElementById('btnConfExcluirBloq');
  btn.onclick = async function(){
    btn.disabled = true; btn.textContent = 'Removendo...';
    try{
      await api('bloqueios_agenda?id=eq.'+_bloqExcluirId,{method:'DELETE'});
      if(typeof toast==='function') toast('Bloqueio removido','ok');
      document.getElementById('ovExcluirBloq').classList.remove('show');
      _tabOk.pagina=false; renderPagina();
    }catch(e){if(typeof toast==='function') toast('Erro: '+e.message,'err');}
    btn.disabled = false; btn.textContent = 'Remover';
  };
  document.getElementById('ovExcluirBloq').classList.add('show');
}

async function _salvarLembrete(){
  try{
    var toggle=document.getElementById('lembreToggle');
    var diasEl=document.getElementById('lembreDias');
    var ativo=toggle?toggle.checked:false;
    var dias=parseInt(diasEl?diasEl.value:30)||30;
    var SUPA=window.SUPA_URL||window.supabaseUrl||'https://acldrisohnjfekjxgmoh.supabase.co';
    var KEY=window.SUPA_KEY||window.supabaseKey||window.ANON_KEY||'';
    await fetch(SUPA+'/rest/v1/saloes?id=eq.'+S.id,{
      method:'PATCH',
      headers:{'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':'application/json','Prefer':'return=minimal'},
      body:JSON.stringify({lembrete_retorno_ativo:ativo,lembrete_retorno_dias:dias})
    });
    S.lembrete_retorno_ativo=ativo;
    S.lembrete_retorno_dias=dias;
    if(typeof salvarSessao==='function') salvarSessao(S);
    if(typeof toast==='function') toast('\u2713 Lembrete salvo!','ok');
  }catch(e){if(typeof toast==='function') toast('Erro ao salvar.','err');}
}

function fecharBloqueio(){
  document.getElementById('ovBloqueio').classList.remove('show');
}

async function _abrirNovoBloqueio(){
  var hoje = new Date().toISOString().slice(0,10);
  document.getElementById('bloqIni').value = hoje;
  document.getElementById('bloqFim').value = '';
  document.getElementById('bloqMotivo').value = '';
  document.getElementById('bloqErr').style.display = 'none';
  document.getElementById('ovBloqueio').classList.add('show');
}

async function confirmarBloqueio(){
  var ini = document.getElementById('bloqIni').value;
  var fim = document.getElementById('bloqFim').value;
  var motivo = document.getElementById('bloqMotivo').value;
  var errEl = document.getElementById('bloqErr');

  if(!ini||!/^\d{4}-\d{2}-\d{2}$/.test(ini)){
    errEl.textContent = 'Data início inválida.';
    errEl.style.display = 'block';
    return;
  }
  
  var btn = document.querySelector('#ovBloqueio .btn-sv');
  btn.disabled = true; btn.textContent = 'Bloqueando...';
  
  try{
    await api('bloqueios_agenda',{method:'POST',body:JSON.stringify({
      salao_id:S.id,data_inicio:ini,data_fim:fim||ini,motivo:motivo||null
    })});
    if(typeof toast==='function') toast('\u2713 Bloqueio adicionado!','ok');
    fecharBloqueio();
    _tabOk.pagina=false; renderPagina();
  }catch(e){
    errEl.textContent = 'Erro: ' + e.message;
    errEl.style.display = 'block';
  }
  btn.disabled = false; btn.textContent = 'Bloquear';
}

function toggleSecao(id){
  var body=document.getElementById('body-'+id);
  if(!body) return;
  var header=body.previousElementSibling;
  var chevron=header?header.querySelector('.section-chevron'):null;
  var isOpen=body.style.maxHeight&&body.style.maxHeight!=='0px';
  if(isOpen){
    body.style.maxHeight='0px';
    body.style.opacity='0';
    body.style.padding='0 16px';
    if(chevron) chevron.style.transform='rotate(0deg)';
  } else {
    body.style.maxHeight=body.scrollHeight+500+'px';
    body.style.opacity='1';
    body.style.padding='12px 16px 16px';
    if(chevron) chevron.style.transform='rotate(90deg)';
  }
}

/* ─── SALVAR PERFIL ─── */
async function salvarPerfil(){
  var btn=document.querySelector('[onclick="salvarPerfil()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var desc=document.getElementById('pfDesc')?document.getElementById('pfDesc').value.trim():'';
  var end=document.getElementById('pfEnd')?document.getElementById('pfEnd').value.trim():'';
  var cancelEl=document.getElementById('pfCancel');
  var cancel=cancelEl?parseInt(cancelEl.value):120;
  var pw=await getPw();
  if(!pw){if(btn){btn.disabled=false;btn.textContent='Salvar perfil';}return;}
  try{
    var cepEl=document.getElementById('pfCep');
    var cep=cepEl?cepEl.value.replace(/\D/g,'')||null:null;
    var lat=cepEl&&cepEl._lat?cepEl._lat:null;
    var lng=cepEl&&cepEl._lng?cepEl._lng:null;
    var raio=document.getElementById('pfRaio')?parseInt(document.getElementById('pfRaio').value):3000;
    var ind=document.getElementById('tgIndicacao')?document.getElementById('tgIndicacao').classList.contains('on'):false;
    await rpc('salvar_perfil_salao',{
      p_slug:S.slug,p_senha:pw,
      p_descricao:desc||null,p_endereco:end||null,p_cancelamento_min:cancel,
      p_cep:cep||null,p_lat:lat,p_lng:lng,
      p_aceita_indicacao:ind,p_raio_indicacao:raio
    });
    if(btn){btn.disabled=false;btn.textContent='Salvar perfil';}
    toast('\u2713 Perfil salvo com sucesso!','ok');
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='Salvar perfil';}
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;toast('Senha incorreta. Tente novamente.','err');}
    else{toast('Erro: '+e.message,'err');}
  }
}

/* ─── HELPERS FATURAMENTO ─── */
function fmtCpfCnpj(el){
  var v=el.value.replace(/\D/g,'');
  if(v.length<=11){
    v=v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
  } else {
    v=v.slice(0,14).replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2');
  }
  el.value=v;
}

function fmtCep(el){
  var v=el.value.replace(/\D/g,'').slice(0,8);
  el.value=v.length>5?v.replace(/(\d{5})(\d{1,3})/,'$1-$2'):v;
}

async function preencherEndFat(cep){
  var c=cep.replace(/\D/g,'');
  if(c.length!==8) return;
  try{
    var r=await fetch('https://viacep.com.br/ws/'+c+'/json/');
    var d=await r.json();
    if(d.erro) return;
    var set=function(id,val){var el=document.getElementById(id);if(el&&!el.value)el.value=val||'';};
    set('fatRua',d.logradouro);set('fatBairro',d.bairro);set('fatCidade',d.localidade);
    var est=document.getElementById('fatEstado');if(est&&!est.value)est.value=d.uf||'';
  }catch(_){}
}

/* ─── SALVAR FATURAMENTO ─── */
async function salvarFaturamento(){
  var btn=document.querySelector('[onclick="salvarFaturamento()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var g=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
  var fatNome=g('fatNome');
  var fatCpfRaw=g('fatCpf').replace(/\D/g,'');
  if(!fatNome){if(btn){btn.disabled=false;btn.textContent='Salvar dados de faturamento';}toast('Nome do respons\u00e1vel \u00e9 obrigat\u00f3rio','err');return;}
  if(!fatCpfRaw||fatCpfRaw.length<11){if(btn){btn.disabled=false;btn.textContent='Salvar dados de faturamento';}toast('CPF ou CNPJ \u00e9 obrigat\u00f3rio','err');return;}
  var pw=await getPw();
  if(!pw){if(btn){btn.disabled=false;btn.textContent='Salvar dados de faturamento';}return;}
  try{
    await rpc('salvar_perfil_salao',{
      p_slug:S.slug,p_senha:pw,
      p_descricao:null,p_endereco:null,p_cancelamento_min:120,
      p_fat_nome:fatNome||null,p_fat_cpf_cnpj:fatCpfRaw||null,
      p_fat_email:g('fatEmail')||null,p_fat_empresa:g('fatEmp')||null,
      p_fat_celular:g('fatCel')||null,p_fat_fone:g('fatFone')||null,
      p_fat_cep:g('fatCep').replace(/\D/g,'')||null,p_fat_rua:g('fatRua')||null,
      p_fat_numero:g('fatNum')||null,p_fat_complemento:g('fatComp')||null,
      p_fat_bairro:g('fatBairro')||null,p_fat_cidade:g('fatCidade')||null,
      p_fat_estado:g('fatEstado')||null,p_fat_emails_extra:g('fatEmailsExtra')||null,
      p_fat_obs:g('fatObs')||null,p_fat_boleto_correios:false,
    });
    if(btn){btn.disabled=false;btn.textContent='Salvar dados de faturamento';}
    toast('\u2713 Dados de faturamento salvos!','ok');
    try{fetch(ASAAS_FN,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'criar_cliente_asaas',salao_id:S.id,cpf_cnpj:fatCpfRaw,nome:fatNome,email:g('fatEmail')||null,telefone:g('fatCel')||null})});}catch(_){}
    var fwEl=document.getElementById('financeiroWrap');if(fwEl)renderFinanceiro(fwEl);
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='Salvar dados de faturamento';}
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;toast('Senha incorreta. Tente novamente.','err');}
    else{toast('Erro: '+e.message,'err');}
  }
}

/* ─── FINANCEIRO AGENDA ─── */
async function renderFinanceiro(el){
  if(!el||!S||!S.id) return;
  try{
    var dados=await rpc('listar_cobrancas_salao',{p_salao_id:S.id});
    var sub=await api('saloes?slug=eq.'+S.slug+'&select=asaas_subscription_id,metodo_assinatura,assinatura_status');
    var ss=sub&&sub[0]?sub[0]:{};
    var metodo=ss.metodo_assinatura||'';
    var statusLabel={'ACTIVE':'\u2705 Ativa','INACTIVE':'\u23f8 Inativa','OVERDUE':'\u26a0\ufe0f Em atraso','PENDING':'\ud83d\udd50 Aguardando'}[ss.assinatura_status]||'\u2014';
    var statusColor={'ACTIVE':'#4ADE80','OVERDUE':'#F87171','PENDING':'#FBBF24','INACTIVE':'#6B7280'}[ss.assinatura_status]||'var(--CZ)';
    var metodoLabel={'PIX':'\ud83d\udc9a PIX','BOLETO':'\ud83c\udfe6 Boleto','CREDIT_CARD':'\ud83d\udcb3 Cart\u00e3o'}[metodo]||'';
    var html='<div class="perfil-card"><div class="perfil-tit">\ud83d\udcb0 Financeiro Agenda</div>';
    html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--s2);border-radius:10px;margin-bottom:12px">';
    html+='<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--CZ)">Assinatura</div><div style="font-size:13px;font-weight:800;color:'+statusColor+'">'+statusLabel+'</div></div>';
    if(metodoLabel)html+='<div style="text-align:right"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--CZ)">M\u00e9todo</div><div style="font-size:12px;font-weight:700;color:var(--MR)">'+metodoLabel+'</div></div>';
    html+='</div>';
    var list=dados&&dados.length?dados.slice(0,6):[];
    if(list.length){
      html+='<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--CZ);margin-bottom:8px">\u00daltimas faturas</div>';
      list.forEach(function(c){
        var venc=c.vencimento?(function(){var p=c.vencimento.split('-');return p[2]+'/'+p[1]+'/'+p[0];})():'\u2014';
        var stMap={RECEIVED:'\u2705 Pago',CONFIRMED:'\u2705 Pago',PENDING:'\ud83d\udd50 Pendente',OVERDUE:'\u26a0\ufe0f Vencida',CANCELLED:'\u2715 Cancelada'};
        var stColor={RECEIVED:'#4ADE80',CONFIRMED:'#4ADE80',PENDING:'#FBBF24',OVERDUE:'#F87171',CANCELLED:'#6B7280'};
        var st=stMap[c.status]||c.status||'\u2014';
        var stClr=stColor[c.status]||'var(--CZ)';
        var val='R$'+((c.valor||0)/100).toFixed(2);
        var tipoIco={'PIX':'\u26a1','BOLETO':'\ud83c\udfe6','CREDIT_CARD':'\ud83d\udcb3'}[c.tipo]||'';
        html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--s2);border-radius:8px;margin-bottom:6px">';
        html+='<div><div style="font-size:12px;font-weight:700;color:var(--MR)">'+tipoIco+' '+val+'</div><div style="font-size:11px;color:var(--CZ)">Venc: '+venc+'</div></div>';
        html+='<div style="text-align:right"><div style="font-size:12px;font-weight:700;color:'+stClr+'">'+st+'</div>';
        if((c.status==='PENDING'||c.status==='OVERDUE')&&c.pix_copia_cola&&metodo==='PIX'){
          html+='<button onclick="copiarPixPainel(\''+c.pix_copia_cola.replace(/[\'`]/g,'')+'\',this)" style="margin-top:4px;padding:4px 10px;background:var(--primary);border:none;border-radius:6px;color:#fff;font-size:11px;font-weight:700;cursor:pointer">\u26a1 Copiar PIX</button>';
        }
        if((c.status==='PENDING'||c.status==='OVERDUE')&&c.link_pagamento&&metodo!=='PIX'){
          var lblLink={'BOLETO':'\ud83c\udfe6 Ver boleto','CREDIT_CARD':'\ud83d\udcb3 Pagar'}[metodo]||'Ver fatura';
          html+='<a href="'+c.link_pagamento+'" target="_blank" style="display:block;margin-top:4px;padding:4px 10px;background:var(--primary);border-radius:6px;color:#fff;font-size:11px;font-weight:700;text-decoration:none">'+lblLink+'</a>';
        }
        html+='</div></div>';
      });
    } else {
      html+='<div style="font-size:13px;color:var(--CZ);text-align:center;padding:12px">Nenhuma fatura encontrada.</div>';
    }
    html+='<button onclick="_tabOk.pagamentos=false;navTab(\'pagamentos\',null)" style="width:100%;padding:10px;background:none;border:1px solid var(--bd);border-radius:10px;color:var(--CZ);font-size:12px;font-weight:700;cursor:pointer;margin-top:10px">Gerenciar assinatura \u2192</button>';
    html+='</div>';
    el.innerHTML=html;
  }catch(e){el.innerHTML='<div class="perfil-card"><div style="color:var(--CZ);font-size:12px">Financeiro indispon\u00edvel.</div></div>';}
}

function copiarPixPainel(pix,btn){
  navigator.clipboard.writeText(pix).then(function(){
    var orig=btn.textContent;btn.textContent='\u2713 Copiado!';btn.style.background='#4ADE80';
    setTimeout(function(){btn.textContent=orig;btn.style.background='';},2000);
  }).catch(function(){toast('Copie manualmente: '+pix,'ok');});
}

/* ─── PAGAMENTOS (aba) ─── */
async function renderPagamentos(){
  _tabOk.pagamentos=true;
  var el=document.getElementById('tb-pagamentos');
  el.innerHTML='<div class="loading">Carregando...</div>';

  // Public fields via direct API
  var dadosPgto=await api('saloes?slug=eq.'+S.slug+'&select=pix_key,pix_tipo,aceita_dinheiro,aceita_pix,aceita_cartao,asaas_subscription_id,metodo_assinatura,assinatura_status,plano,sinal_percentual,sinal_obrigatorio,cancelamento_min,mostrar_sinal');
  var d=dadosPgto&&dadosPgto[0]?dadosPgto[0]:{};
  // Private fields via RPC
  try{
    var pwPgto=_pw||'';
    if(pwPgto){
      var privPgto=await rpc('obter_dados_privados_salao',{p_slug:S.slug,p_senha:pwPgto});
      if(privPgto) d=Object.assign({},d,privPgto);
    }
  }catch(_e2){}
  _pgtoState.dinheiro=d.aceita_dinheiro!==false;
  _pgtoState.pix=d.aceita_pix!==false;
  _pgtoState.cartao=!!d.aceita_cartao;
  _pgtoState.pixKey=d.pix_key||'';
  _pgtoState.pixTipo=d.pix_tipo||'telefone';
  _pgtoState.mostrarSinal=!!d.mostrar_sinal;
  _pgtoState.sinalObrig=!!d.sinal_obrigatorio;
  _pgtoState.sinalPct=d.sinal_percentual||30;
  _pgtoState.cancelMin=d.cancelamento_min||120;

  var cobrancasPendentes=[];
  try{cobrancasPendentes=await rpc('listar_cobrancas_salao',{p_salao_id:S.id});}catch(_){}
  var primeiraPendente=cobrancasPendentes.filter(function(c){return c.status==='PENDING'||c.status==='OVERDUE';}).shift();

  var plInfo=({basico:{nome:'B\u00e1sico',cor:'#6B7280',val:'R$35'},pro:{nome:'Equipe',cor:'#3B82F6',val:'R$70'},salao:{nome:'Negócio',cor:'#10B981',val:'R$140'}})[S.plano]||{nome:S.plano,cor:'#ccc',val:'?'};
  var hasAssinatura=!!(d.asaas_subscription_id);
  var statusColor={'ACTIVE':'#4ADE80','INACTIVE':'#6B7280','OVERDUE':'#F87171','PENDING':'#FBBF24'}[d.assinatura_status]||'#6B7280';
  var statusLabel={'ACTIVE':'Ativa \u2713','INACTIVE':'Inativa','OVERDUE':'Em atraso \u26a0\ufe0f','PENDING':'Aguardando pagamento','SEM_ASSINATURA':'Sem assinatura'}[d.assinatura_status||'SEM_ASSINATURA']||d.assinatura_status;
  var metodoLabel={'PIX':'\ud83d\udc9a PIX','BOLETO':'\ud83c\udfe6 Boleto','CREDIT_CARD':'\ud83d\udcb3 Cart\u00e3o de Cr\u00e9dito'}[d.metodo_assinatura]||'\u2014';

  var html='';

  html+='<div class="pgto-card" style="margin-bottom:14px">'+
    '<div class="pgto-tit">\ud83d\udccb Assinatura Agenda</div>'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'+
      '<div>'+
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--CZ)">Plano atual</div>'+
        '<div style="font-family:Syne,sans-serif;font-size:20px;font-weight:800;color:'+plInfo.cor+'">'+plInfo.nome+'</div>'+
        '<div style="font-size:12px;color:var(--CZ);font-weight:600">'+plInfo.val+'/m\u00eas</div>'+
      '</div>'+
      '<div style="text-align:right">'+
        '<div style="font-size:11px;color:var(--CZ);font-weight:700">Status</div>'+
        '<div style="font-size:13px;font-weight:800;color:'+statusColor+'">'+statusLabel+'</div>'+
        (hasAssinatura?'<div style="font-size:11px;color:var(--CZ);margin-top:2px">'+metodoLabel+'</div>':'')+
      '</div>'+
    '</div>';

  if(S.status==='trial'){
    var diasTrial=S.trial_expira?Math.max(0,Math.round((new Date(S.trial_expira)-new Date())/(1000*60*60*24))):0;
    html+='<div style="background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.3);border-radius:10px;padding:10px 12px;font-size:12px;font-weight:700;color:#FBBF24;margin-bottom:12px">\u23f3 Trial: '+diasTrial+' dia'+(diasTrial!==1?'s':'')+' restante'+(diasTrial!==1?'s':'')+'</div>';
  }
  if(hasAssinatura){
    html+='<button onclick="cancelarAssinatura()" style="width:100%;padding:10px;background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.3);border-radius:10px;color:#F87171;font-size:12px;font-weight:700;cursor:pointer">\u2715 Cancelar assinatura</button>';
  }
  html+='</div>';

  if(primeiraPendente&&hasAssinatura){
    var pp=primeiraPendente;
    var ppVal='R$'+((pp.valor||0)/100).toFixed(2);
    var ppVenc=pp.vencimento?(function(){var p=pp.vencimento.split('-');return p[2]+'/'+p[1]+'/'+p[0];})():'\u2014';
    var isVencida=pp.status==='OVERDUE';
    html+='<div class="pgto-card" style="margin-bottom:14px;border:2px solid '+(isVencida?'rgba(248,113,113,.4)':'rgba(251,191,36,.4)')+'">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+
        '<div style="font-size:18px">'+(isVencida?'\u26a0\ufe0f':'\ud83d\udcb3')+'</div>'+
        '<div><div style="font-size:13px;font-weight:800;color:var(--MR)">'+(isVencida?'Fatura vencida':'Pagamento pendente')+'</div>'+
        '<div style="font-size:11px;color:var(--CZ)">'+ppVal+' \u2022 Venc. '+ppVenc+'</div></div>'+
      '</div>';
    if(pp.tipo==='PIX'&&pp.pix_copia_cola){
      html+='<button onclick="copiarPixPainel(\''+pp.pix_copia_cola.replace(/[\'`]/g,'')+'\',this)" style="width:100%;padding:11px;background:var(--primary);border:none;border-radius:10px;color:#fff;font-weight:800;font-size:13px;cursor:pointer;margin-bottom:8px">\u26a1 Copiar c\u00f3digo PIX</button>';
      if(pp.link_pagamento)html+='<a href="'+pp.link_pagamento+'" target="_blank" style="display:block;text-align:center;font-size:12px;color:var(--CZ);text-decoration:underline">Ver cobran\u00e7a completa</a>';
    } else if(pp.link_pagamento){
      var lblLink={'BOLETO':'\ud83c\udfe6 Abrir boleto','CREDIT_CARD':'\ud83d\udcb3 Pagar com cart\u00e3o'}[pp.tipo]||'Ver cobran\u00e7a';
      html+='<a href="'+pp.link_pagamento+'" target="_blank" style="display:block;text-align:center;padding:11px;background:var(--primary);border-radius:10px;color:#fff;font-weight:800;font-size:13px;text-decoration:none">'+lblLink+'</a>';
    }
    html+='</div>';
  }

  html+='<div class="pgto-card" style="margin-bottom:14px">'+
    '<div class="pgto-tit">'+(hasAssinatura?'\ud83d\udd04 Alterar forma de pagamento':'\ud83d\ude80 Ativar assinatura recorrente')+'</div>'+
    '<div style="font-size:12px;color:var(--CZ);font-weight:600;margin-bottom:14px;line-height:1.5">Escolha como pagar o plano Agenda todo m\u00eas. A cobran\u00e7a acontece automaticamente no dia 10.</div>'+
    '<div style="margin-bottom:14px">'+
      '<label class="fl">Forma de pagamento</label>'+
      '<div style="display:flex;flex-direction:column;gap:8px">'+
        _metodoBtn('PIX','\u26a1 PIX','C\u00f3digo gerado no vencimento',d.metodo_assinatura==='PIX'&&hasAssinatura)+
        _metodoBtn('BOLETO','\ud83c\udfe6 Boleto Banc\u00e1rio','Enviado por email 5 dias antes do vencimento',d.metodo_assinatura==='BOLETO'&&hasAssinatura)+
        _metodoBtn('CREDIT_CARD','\ud83d\udcb3 Cart\u00e3o de Cr\u00e9dito','D\u00e9bito autom\u00e1tico — n\u00e3o precisa fazer nada todo m\u00eas',d.metodo_assinatura==='CREDIT_CARD'&&hasAssinatura)+
      '</div>'+
    '</div>'+
    '<div style="background:var(--s2);border-radius:10px;padding:12px;margin-bottom:14px;font-size:12px;color:var(--CZ);line-height:1.6">'+
      '\ud83d\udccb <strong>Faturamento:</strong> '+(d.fat_nome||'n\u00e3o informado')+
      (d.fat_cpf_cnpj?' \u00b7 CPF/CNPJ: '+d.fat_cpf_cnpj:' <span style="color:#F87171">\u2014 sem CPF/CNPJ</span>')+
      '<br><span style="font-size:11px">Edite em <strong>P\u00e1gina \u2192 Dados de Faturamento</strong></span>'+
    '</div>'+
    '<div id="assinaturaErr" style="color:#F87171;font-size:12px;margin-bottom:8px;display:none"></div>'+
    '<button id="btnAssinar" onclick="confirmarAssinatura()" style="width:100%;padding:12px;background:var(--L);border:none;border-radius:10px;color:#fff;font-family:Syne,sans-serif;font-size:14px;font-weight:800;cursor:pointer">'+
      (hasAssinatura?'Alterar m\u00e9todo de pagamento':'Assinar agora \u2192')+
    '</button>'+
  '</div>';

  html+='<div class="pgto-card">';
  el.innerHTML=html;
  var lastCard=el.querySelector('.pgto-card:last-of-type');
  if(lastCard) buildPagamentosUI(lastCard);
}

function _metodoBtn(val,label,sub,selected){
  var border=selected?'2px solid var(--L)':'2px solid var(--bd,rgba(0,0,0,.1))';
  var checked=selected?' checked':'';
  return '<label style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--s2);border:'+border+';border-radius:10px;cursor:pointer;transition:.2s">'+
    '<input type="radio" name="metodoAssinatura" value="'+val+'"'+checked+' style="width:18px;height:18px;accent-color:var(--L);flex-shrink:0">'+
    '<div><div style="font-size:13px;font-weight:700;color:var(--MR)">'+label+'</div>'+
    '<div style="font-size:11px;color:var(--CZ)">'+sub+'</div></div></label>';
}

async function confirmarAssinatura(){
  var errEl=document.getElementById('assinaturaErr');
  var btn=document.getElementById('btnAssinar');
  var metodoEl=document.querySelector('input[name="metodoAssinatura"]:checked');
  if(!metodoEl){if(errEl){errEl.textContent='Selecione uma forma de pagamento';errEl.style.display='block';}return;}
  var tipo=metodoEl.value;
  var dados=await api('saloes?slug=eq.'+S.slug+'&select=fat_nome,fat_cpf_cnpj,fat_email,fat_celular');
  var fat=dados&&dados[0]?dados[0]:{};
  if(!fat.fat_cpf_cnpj){if(errEl){errEl.textContent='Preencha o CPF/CNPJ em P\u00e1gina \u2192 Dados de Faturamento';errEl.style.display='block';}return;}
  if(!fat.fat_nome){if(errEl){errEl.textContent='Preencha o nome em P\u00e1gina \u2192 Dados de Faturamento';errEl.style.display='block';}return;}
  if(errEl) errEl.style.display='none';
  if(btn){btn.disabled=true;btn.textContent='Processando...';}
  try{
    var r=await fetch(ASAAS_FN,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'criar_assinatura',salao_id:S.id,plano:S.plano,tipo:tipo,
        cpf_cnpj:fat.fat_cpf_cnpj.replace(/\D/g,''),nome:fat.fat_nome,
        email:fat.fat_email||S.email||null,telefone:fat.fat_celular||S.telefone||null})
    });
    var d=await r.json();
    if(d&&d.ok){mostrarPagamentoInline(tipo,d.link,d.pix_copia_cola,d.valor,d.nextDue);}
    else{
      if(errEl){errEl.textContent='Erro: '+(d.erro||d.error||JSON.stringify(d));errEl.style.display='block';}
      if(btn){btn.disabled=false;btn.textContent='Assinar agora \u2192';}
    }
  }catch(e){
    if(errEl){errEl.textContent='Erro de conex\u00e3o: '+e.message;errEl.style.display='block';}
    if(btn){btn.disabled=false;btn.textContent='Assinar agora \u2192';}
  }
}

function mostrarPagamentoInline(tipo,link,pixCopiaeCola,valor,nextDue){
  var el=document.getElementById('tb-pagamentos');
  if(!el) return;
  var val=valor?(valor/100).toFixed(2):'\u2014';
  var vencFmt=nextDue?(function(){var p=nextDue.split('-');return p[2]+'/'+p[1]+'/'+p[0];})():'\u2014';
  var html='<div class="pgto-card">';
  html+='<div style="font-size:32px;text-align:center;margin-bottom:8px">\u2705</div>';
  html+='<div style="font-size:16px;font-weight:800;color:var(--MR);text-align:center;margin-bottom:4px">Assinatura ativada!</div>';
  html+='<div style="font-size:12px;color:var(--CZ);text-align:center;margin-bottom:20px">Cobran\u00e7a todo dia 10 \u00b7 R$'+val+' \u00b7 1\u00aa parcela vence em '+vencFmt+'</div>';

  if(tipo==='PIX'&&pixCopiaeCola){
    html+='<div style="background:var(--s2);border-radius:12px;padding:14px;margin-bottom:14px">';
    html+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--CZ);margin-bottom:8px">\u26a1 PIX Copia e Cola \u2014 primeira parcela</div>';
    html+='<div style="font-size:11px;color:var(--MR);word-break:break-all;line-height:1.6;font-family:monospace;background:var(--bg);border-radius:8px;padding:10px;margin-bottom:10px">'+pixCopiaeCola+'</div>';
    html+='<button onclick="copiarPixPainel(\''+pixCopiaeCola.replace(/[\'`]/g,'')+'\',this)" style="width:100%;padding:11px;background:var(--primary);border:none;border-radius:10px;color:#fff;font-weight:800;font-size:13px;cursor:pointer">\u26a1 Copiar c\u00f3digo PIX</button>';
    html+='</div>';
    if(link)html+='<a href="'+link+'" target="_blank" style="display:block;text-align:center;font-size:12px;color:var(--CZ);text-decoration:underline;margin-bottom:12px">Ou acesse o link da cobran\u00e7a</a>';
  } else if(tipo==='BOLETO'&&link){
    html+='<div style="background:var(--s2);border-radius:12px;padding:14px;margin-bottom:14px">';
    html+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--CZ);margin-bottom:10px">\ud83c\udfe6 Boleto \u2014 primeira parcela</div>';
    html+='<div style="font-size:12px;color:var(--CZ);margin-bottom:12px;line-height:1.5">Seu boleto est\u00e1 pronto. Clique para abrir e pagar pelo app do banco ou casa lot\u00e9rica. O Asaas tamb\u00e9m envia por email.</div>';
    html+='<a href="'+link+'" target="_blank" style="display:block;text-align:center;padding:12px;background:var(--primary);border-radius:10px;color:#fff;font-weight:800;font-size:14px;text-decoration:none">\ud83c\udfe6 Abrir boleto</a>';
    html+='</div>';
  } else if(tipo==='CREDIT_CARD'&&link){
    html+='<div style="background:var(--s2);border-radius:12px;padding:14px;margin-bottom:14px">';
    html+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--CZ);margin-bottom:10px">\ud83d\udcb3 Cart\u00e3o de Cr\u00e9dito</div>';
    html+='<div style="font-size:12px;color:var(--CZ);margin-bottom:12px;line-height:1.5">Cadastre seu cart\u00e3o abaixo. Ap\u00f3s o cadastro, as cobran\u00e7as mensais acontecem automaticamente \u2014 sem nenhuma a\u00e7\u00e3o sua todo m\u00eas.</div>';
    html+='<a href="'+link+'" target="_blank" style="display:block;text-align:center;padding:13px;background:var(--L);border-radius:10px;color:#fff;font-weight:800;font-size:15px;text-decoration:none">\ud83d\udcb3 Cadastrar cart\u00e3o agora</a>';
    html+='<div style="font-size:11px;color:var(--CZ);text-align:center;margin-top:8px">\ud83d\udd12 Ambiente seguro Asaas \u2022 SSL criptografado</div>';
    html+='</div>';
  } else if(link){
    html+='<a href="'+link+'" target="_blank" style="display:block;text-align:center;padding:12px;background:var(--primary);border-radius:10px;color:#fff;font-weight:800;font-size:14px;text-decoration:none;margin-bottom:12px">Pagar primeira cobran\u00e7a</a>';
  }

  html+='<button onclick="_tabOk.pagamentos=false;renderPagamentos();" style="width:100%;padding:10px;background:none;border:1px solid var(--bd);border-radius:10px;color:var(--CZ);font-size:12px;font-weight:700;cursor:pointer">Ver detalhes da assinatura</button>';
  html+='</div>';
  el.innerHTML=html;
}

async function cancelarAssinatura(){
  if(!confirm('Cancelar assinatura? Seu acesso ao plano ser\u00e1 encerrado no final do per\u00edodo atual.')) return;
  try{
    var r=await fetch(ASAAS_FN,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'cancelar_assinatura',salao_id:S.id})});
    var d=await r.json();
    if(d&&d.ok){toast('Assinatura cancelada.','ok');_tabOk.pagamentos=false;renderPagamentos();}
    else{toast('Erro ao cancelar: '+(d.erro||'tente novamente'),'err');}
  }catch(e){toast('Erro: '+e.message,'err');}
}

/* ─── PAGAMENTOS DOS CLIENTES ─── */
function buildPagamentosUI(el){
  var html=
    '<div class="pgto-tit">\ud83d\udcb3 Formas de pagamento aceitas</div>'+
    '<div class="pgto-row">'+
      '<div class="pgto-lbl">\ud83d\udcb5 Dinheiro</div>'+
      '<button class="pgto-toggle '+(_pgtoState.dinheiro?'on':'')+'" id="tgDinheiro" data-tipo="dinheiro" onclick="togglePgto(this.dataset.tipo)"></button>'+
    '</div>'+
    '<div class="pgto-row">'+
      '<div class="pgto-lbl">\ud83d\udcf2 Pix</div>'+
      '<button class="pgto-toggle '+(_pgtoState.pix?'on':'')+'" id="tgPix" data-tipo="pix" onclick="togglePgto(this.dataset.tipo)"></button>'+
    '</div>'+
    '<div id="pixSection" style="'+(_pgtoState.pix?'':'display:none')+'">'+
    '<div class="fg" style="margin:8px 0 0"><label class="fl">Tipo de chave PIX</label><select class="fi" id="pixTipoSel">'+
    ['telefone','email','cpf','cnpj','aleatoria'].map(function(t){
      var lbl={telefone:'Telefone',email:'E-mail',cpf:'CPF',cnpj:'CNPJ',aleatoria:'Chave aleat\u00f3ria'}[t];
      return '<option value="'+t+'"'+(_pgtoState.pixTipo===t?' selected':'')+'>'+lbl+'</option>';
    }).join('')+
    '</select></div>'+
    '<div class="fg"><label class="fl">Chave PIX</label>'+
    '<input class="fi" type="text" id="pixKeyInput" placeholder="Sua chave PIX" value="'+(_pgtoState.pixKey||'')+'"></div>'+
    '<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--bd)">'+
    '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--CZ);margin-bottom:10px">Sinal no agendamento</div>'+
    '<div class="pgto-row" style="padding:0 0 10px">'+
      '<div><div style="font-size:13px;font-weight:700;color:var(--MR)">Solicitar sinal via PIX</div>'+
      '<div style="font-size:11px;color:var(--CZ);margin-top:2px">Exibe opção de pré-pagamento parcial para o cliente</div></div>'+
      '<button class="pgto-toggle '+(_pgtoState.mostrarSinal?'on':'')+'" id="tgMostrarSinal" onclick="toggleMostrarSinal(this)"></button>'+
    '</div>'+
    '<div id="sinalOpcoes" style="'+(_pgtoState.mostrarSinal?'':'display:none')+'">'+
    '<div class="pgto-row" style="padding:0 0 8px">'+
      '<div style="font-size:12px;font-weight:600;color:var(--MR)">Percentual do sinal</div>'+
      '<div style="display:flex;align-items:center;gap:8px">'+
      '<input type="range" id="sliderSinal" min="10" max="50" step="5" value="'+_pgtoState.sinalPct+'"'+
      ' oninput="document.getElementById(\'lblSinal\').textContent=this.value+\'%\'"'+
      ' style="width:90px;accent-color:var(--L)">'+
      '<span id="lblSinal" style="font-weight:700;color:var(--L);min-width:32px">'+_pgtoState.sinalPct+'%</span>'+
      '</div></div>'+
    '<div class="pgto-row" style="padding:0 0 8px">'+
      '<div style="font-size:12px;font-weight:600;color:var(--MR)">Cancelamento gratuito até</div>'+
      '<select id="selCancelMin" style="padding:6px 10px;border-radius:8px;background:var(--s2);color:var(--MR);border:1px solid var(--bd);font-size:12px">'+
      '<option value="60"'+(_pgtoState.cancelMin===60?' selected':'')+'>1 hora</option>'+
      '<option value="120"'+(_pgtoState.cancelMin===120?' selected':'')+'>2 horas</option>'+
      '<option value="240"'+(_pgtoState.cancelMin===240?' selected':'')+'>4 horas</option>'+
      '<option value="480"'+(_pgtoState.cancelMin===480?' selected':'')+'>8 horas</option>'+
      '<option value="1440"'+(_pgtoState.cancelMin===1440?' selected':'')+'>24 horas</option>'+
      '</select></div>'+
    '<div class="pgto-row" style="padding:0 0 4px;margin-top:4px;border-top:1px solid var(--bd);padding-top:10px">'+
      '<div><div style="font-size:12px;font-weight:700;color:var(--MR)">Tornar obrigatório</div>'+
      '<div style="font-size:11px;color:var(--CZ);margin-top:1px">Bloqueia confirmação sem pagamento do sinal</div></div>'+
      '<button class="pgto-toggle '+(_pgtoState.sinalObrig?'on':'')+'" id="tgSinalObrig" onclick="toggleSinalObrig(this)"></button>'+
    '</div>'+
    '</div>'+
    '</div>'+
    '</div>'+
    '<div class="pgto-row">'+
      '<div class="pgto-lbl">\ud83d\udcb3 Cart\u00e3o</div>'+
      '<button class="pgto-toggle '+(_pgtoState.cartao?'on':'')+'" id="tgCartao" data-tipo="cartao" onclick="togglePgto(this.dataset.tipo)"></button>'+
    '</div>'+
    '<button class="btn-add" style="width:100%;justify-content:center;margin-top:12px;padding:11px" onclick="salvarPagamentos()">Salvar formas de pagamento</button>';
  el.innerHTML=html;
}

function togglePgto(tipo){
  _pgtoState[tipo]=!_pgtoState[tipo];
  var btn=document.getElementById('tg'+tipo.charAt(0).toUpperCase()+tipo.slice(1));
  if(btn) btn.className='pgto-toggle'+(_pgtoState[tipo]?' on':'');
  var pixSec=document.getElementById('pixSection');
  if(pixSec) pixSec.style.display=_pgtoState.pix?'':'none';
}

function toggleMostrarSinal(btn){
  btn.classList.toggle('on');
  var op=document.getElementById('sinalOpcoes');
  if(op) op.style.display=btn.classList.contains('on')?'':'none';
}
function toggleSinalObrig(btn){
  btn.classList.toggle('on');
}

async function salvarPagamentos(){
  var pw=await getPw(); if(!pw)return;
  var pixKey=document.getElementById('pixKeyInput')?document.getElementById('pixKeyInput').value.trim():'';
  var pixTipo=document.getElementById('pixTipoSel')?document.getElementById('pixTipoSel').value:'telefone';
  try{
    await rpc('salvar_pagamentos',{p_slug:S.slug,p_senha:pw,p_aceita_dinheiro:_pgtoState.dinheiro,p_aceita_pix:_pgtoState.pix,p_aceita_cartao:_pgtoState.cartao,p_pix_key:pixKey||null,p_pix_tipo:pixTipo});
    toast('\u2713 Formas de pagamento salvas!','ok');
    // Salvar campos de sinal separadamente
    var mostrarSinal=document.getElementById('tgMostrarSinal')?document.getElementById('tgMostrarSinal').classList.contains('on'):false;
    var sinalObrig=document.getElementById('tgSinalObrig')?document.getElementById('tgSinalObrig').classList.contains('on'):false;
    var sinalPct=document.getElementById('sliderSinal')?parseInt(document.getElementById('sliderSinal').value):30;
    var cancelMin=document.getElementById('selCancelMin')?parseInt(document.getElementById('selCancelMin').value):120;
    await api('saloes?id=eq.'+S.id,{
      method:'PATCH',
      headers:{'Prefer':'return=minimal'},
      body:JSON.stringify({mostrar_sinal:mostrarSinal,sinal_obrigatorio:sinalObrig,sinal_percentual:sinalPct,cancelamento_min:cancelMin})
    }).catch(function(){});
    _pgtoState.mostrarSinal=mostrarSinal;
    _pgtoState.sinalObrig=sinalObrig;
    _pgtoState.sinalPct=sinalPct;
    _pgtoState.cancelMin=cancelMin;
    S.sinal_obrigatorio=sinalObrig;
    S.sinal_percentual=sinalPct;
    S.cancelamento_min=cancelMin;
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;}
    toast('Erro ao salvar','err');
  }
}

/* ─── HELPERS ─── */
function cpLink(){
  var url=BASE+'/agendar.html?slug='+S.slug;
  navigator.clipboard.writeText(url).then(function(){
    var el=document.getElementById('cpAg');
    if(el){el.textContent='Copiado!';setTimeout(function(){el.textContent='Copiar';},2000);}
    toast('Link copiado! \u2713','ok');
  });
}

function formatarCep(el){
  var v=el.value.replace(/\D/g,'').slice(0,8);
  el.value=v.length>5?v.replace(/(\d{5})(\d{1,3})/,'$1-$2'):v;
}

async function geocodificarCep(cep){
  var c=cep.replace(/\D/g,'');
  if(c.length!==8) return;
  try{
    var r=await fetch('https://viacep.com.br/ws/'+c+'/json/');
    var d=await r.json();
    if(d.erro) return;
    var endEl=document.getElementById('pfEnd');
    if(endEl&&!endEl.value&&d.logradouro) endEl.value=d.logradouro+(d.bairro?', '+d.bairro:'')+(d.localidade?', '+d.localidade:'');
  }catch(_){}
}

function toggleIndicacao(){
  var btn=document.getElementById('tgIndicacao');
  if(!btn) return;
  btn.classList.toggle('on');
  var wrap=document.getElementById('pfRaioWrap');
  if(wrap) wrap.style.display=btn.classList.contains('on')?'':'none';
}


/* ═══ S6.2: BLOQUEIOS DE AGENDA ═══ */
var _bloqueios = [];

async function renderBloqueios() {
  var el = document.getElementById('bloqueiosLista') ||
             document.getElementById('body-bloqueios');
  if(!el) return;
  try{
    var hoje = new Date();
    var dIni = hoje.getFullYear()+'-'+String(hoje.getMonth()+1).padStart(2,'0')+'-01';
    var dFim = new Date(hoje.getFullYear(), hoje.getMonth()+3, 0);
    var dFimStr = dFim.getFullYear()+'-'+String(dFim.getMonth()+1).padStart(2,'0')+'-'+String(dFim.getDate()).padStart(2,'0');
    _bloqueios = await rpc('listar_bloqueios',{p_slug:S.slug,p_data_ini:dIni,p_data_fim:dFimStr})||[];
  }catch(e){ _bloqueios=[]; }

  if(!_bloqueios.length){
    el.innerHTML='<div style="font-size:12px;color:var(--CZ);padding:8px 0">Nenhum bloqueio cadastrado.</div>';
    return;
  }
  var html='';
  _bloqueios.forEach(function(b){
    var label = b.data_ini===b.data_fim ? fmtBR(b.data_ini) : fmtBR(b.data_ini)+' até '+fmtBR(b.data_fim);
    html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--s2);border-radius:8px;margin-bottom:6px">'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:13px;font-weight:800;color:var(--MR)">🚫 '+label+'</div>'+
        (b.motivo?'<div style="font-size:11px;color:var(--CZ);margin-top:2px">'+esc(b.motivo)+'</div>':'')+
      '</div>'+
      '<button data-bid="'+b.id+'" onclick="excluirBloqueio(this.dataset.bid)" style="background:none;border:none;color:var(--red,#ef4444);cursor:pointer;font-size:18px;padding:4px;line-height:1">×</button>'+
    '</div>';
  });
  el.innerHTML=html;
}

async function adicionarBloqueio(){
  var ini = (document.getElementById('blkIni')||{}).value;
  var fim = (document.getElementById('blkFim')||{}).value || ini;
  var motivo = (document.getElementById('blkMotivo')||{}).value.trim()||null;
  if(!ini){toast('Informe a data de início.','err');return;}
  var pw = await getPw('Confirmar bloqueio','Informe sua senha para bloquear esta data.'); if(!pw) return;
  try{
    await rpc('criar_bloqueio',{p_slug:S.slug,p_senha:pw,p_data_ini:ini,p_data_fim:fim,p_motivo:motivo});
    document.getElementById('blkIni').value='';
    document.getElementById('blkFim').value='';
    document.getElementById('blkMotivo').value='';
    toast('Bloqueio adicionado!','ok');
    renderBloqueios();
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;}
    toast('Erro: '+e.message,'err');
  }
}

async function excluirBloqueio(id){
  if(!confirm('Remover este bloqueio?')) return;
  var pw = await getPw(); if(!pw) return;
  try{
    await rpc('excluir_bloqueio',{p_slug:S.slug,p_senha:pw,p_bloqueio_id:id});
    toast('Bloqueio removido.','ok');
    renderBloqueios();
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;}
    toast('Erro: '+e.message,'err');
  }
}

async function salvarRetorno(dias){
  try{
    var pw=_pw||'';
    // Salvar mesmo sem senha via PATCH direto
    if(!pw){
      api('saloes?id=eq.'+S.id,{method:'PATCH',
        body:JSON.stringify({lembrete_retorno_dias:parseInt(dias,10)})
      }).then(function(){toast('✓ Lembrete de retorno salvo!','ok');})
        .catch(function(e){toast('Erro ao salvar.','err');});
      return;
    }
    rpc('salvar_perfil_salao',{p_slug:S.slug,p_senha:pw,
      p_dados:{intervalo_retorno_dias:parseInt(dias,10)}})
    .then(function(){toast('✓ Lembrete de retorno salvo!','ok');})
    .catch(function(e){toast('Erro: '+e.message,'err');});
  }catch(e){ toast('Erro ao salvar','err'); }
}
