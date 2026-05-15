/* ═══ p-config.js — Configurações do Painel ═══ */

var _pgtoState={dinheiro:true,pix:true,cartao:false,debito:false,pixKey:'',pixTipo:'telefone',mostrarSinal:false,sinalObrig:false,sinalPct:30,cancelMin:120};

var HORARIO_PADRAO={'0':null,'1':{ini:'09:00',fim:'19:00'},'2':{ini:'09:00',fim:'19:00'},'3':{ini:'09:00',fim:'19:00'},'4':{ini:'09:00',fim:'19:00'},'5':{ini:'09:00',fim:'19:00'},'6':{ini:'09:00',fim:'14:00'}};
var DIAS_SEMANA=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

/* ─── PUSH ─── */
async function atualizarStatusPush(){
  var el=document.getElementById('pushStatusTxt');
  if(!el) return;
  var isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(!isStandalone){
    el.innerHTML='<strong style="color:var(--AM)">⚠️ Abra pelo ícone instalado na tela inicial</strong><br><span style="font-size:11px">Push só funciona no app instalado. Safari: Compartilhar → Adicionar à Tela de Início.</span>';
    return;
  }
  if(!('Notification' in window)){el.innerHTML='❌ Não suportado neste navegador.';return;}
  var perm=Notification.permission;
  if(perm==='denied'){el.innerHTML='🚫 Permissão bloqueada. Ajustes → Notificações → Safari → habilite.';return;}
  if(perm==='default'){
    el.innerHTML='⏳ Toque para ativar notificações.<br><button class="btn-add" style="margin-top:8px;width:100%;justify-content:center" onclick="ativarNotificacoes()">🔔 Ativar notificações</button>';
    return;
  }
  try{
    var sw=await navigator.serviceWorker.ready;
    var sub=await sw.pushManager.getSubscription();
    if(sub){el.innerHTML='✅ <strong style="color:#4ADE80">Notificações ativas!</strong> Você receberá avisos de novos agendamentos.';}
    else{
      el.innerHTML='⚠️ Permissão OK mas não registrado. <button class="btn-add" style="margin-top:8px;width:100%;justify-content:center" onclick="registrarPush(S.slug,_pw||\'\')">Registrar agora</button>';
    }
  }catch(e){el.innerHTML='❌ Erro: '+e.message;}
}

async function testarPush(btn){
  if(!btn) btn=document.querySelector('[onclick*="testarPush"]');
  if(btn){btn.disabled=true;btn.textContent='Enviando...';}
  try{
    var r=await fetch('https://acldrisohnjfekjxgmoh.supabase.co/functions/v1/push-notify',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({salao_id:S.id,cliente_nome:'Teste Push',data:new Date().toISOString().slice(0,10),hora:'00:00:00',servico_nome:'Notificação de teste'})
    });
    var d=await r.json();
    if(btn){
      if(d.sent>0){btn.textContent='✅ Enviado!';btn.style.background='#2D6A4F';}
      else{btn.textContent='⚠️ Sem subscribers';btn.style.background='var(--AM)';}
    }
  }catch(e){if(btn){btn.textContent='❌ Erro: '+e.message;btn.style.background='var(--VM)';}}
  setTimeout(function(){if(btn){btn.disabled=false;btn.textContent='🧪 Enviar notificação de teste';btn.style.background='';}},4000);
}

/* ─── HORÁRIO ─── */
function renderHorario(horarioAtual,noBtn){
  var h=horarioAtual||HORARIO_PADRAO;
  var html='<div id="horarioGrid" style="display:flex;flex-direction:column;gap:10px">';
  for(var d=0;d<7;d++){
    var aberto=h[d+'']!==null&&h[d+'']!==undefined;
    var ini=(h[d+'']&&h[d+''].ini)?h[d+''].ini:'09:00';
    var fim=(h[d+'']&&h[d+''].fim)?h[d+''].fim:'19:00';
    html+='<div class="horario-row" data-dia="'+d+'" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--s2);border-radius:10px;border:1px solid var(--bd)">';
    html+='<div style="min-width:64px;font-size:13px;font-weight:800;color:var(--MR)">'+DIAS_SEMANA[d].substring(0,3)+'</div>';
    html+='<button class="btn-toggle-dia toggle '+(aberto?'on':'')+'" data-dia="'+d+'" onclick="toggleDia(this)" style="flex-shrink:0"></button>';
    html+='<div class="horario-horas" style="display:flex;align-items:center;gap:8px;flex:1;opacity:'+(aberto?'1':'.3')+';pointer-events:'+(aberto?'auto':'none')+'">';
    html+='<input type="time" class="fi" value="'+ini+'" data-dia="'+d+'" data-tipo="ini" style="flex:1;padding:7px 8px;font-size:13px">';
    html+='<span style="font-size:12px;color:var(--CZ);font-weight:700">até</span>';
    html+='<input type="time" class="fi" value="'+fim+'" data-dia="'+d+'" data-tipo="fim" style="flex:1;padding:7px 8px;font-size:13px">';
    html+='</div>';
    html+='<div class="hr-fechado" style="font-size:11px;color:var(--CZ);font-weight:700;display:'+(aberto?'none':'block')+'">Fechado</div>';
    html+='</div>';
  }
  html+='</div>';
  if(!noBtn) html+='<button class="btn-add" onclick="salvarHorario()" style="width:100%;justify-content:center;padding:12px;margin-top:14px">Salvar horário</button>';
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
  }else{
    if(horas){horas.style.opacity='';horas.style.pointerEvents='';}
    if(fechado)fechado.style.display='none';
  }
}

function atualizarHora(input){}

async function salvarHorario(){
  var btn=document.querySelector('[onclick="salvarHorario()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var pw=await getPw();
  if(!pw){if(btn){btn.disabled=false;btn.textContent='Salvar horário';}return;}
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
    if(btn){btn.disabled=false;btn.textContent='Salvar horário';}
    if(ok){toast('✓ Horário salvo!','ok');S._horario=horario;}
    else{toast('Erro ao salvar horário','err');}
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='Salvar horário';}
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;toast('Senha incorreta','err');}
    else{toast('Erro: '+e.message,'err');}
  }
}

/* ─── HELPERS ─── */
function fmtCpfCnpj(el){
  var v=el.value.replace(/\D/g,'');
  if(v.length<=11){v=v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');}
  else{v=v.slice(0,14).replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2');}
  el.value=v;
}

function fmtCep(el){
  var v=el.value.replace(/\D/g,'').slice(0,8);
  el.value=v.length>5?v.replace(/(\d{5})(\d{1,3})/,'$1-$2'):v;
}

function fmtTel(el){
  var v=el.value.replace(/\D/g,'').slice(0,11);
  if(v.length>10){v=v.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3');}
  else if(v.length>6){v=v.replace(/(\d{2})(\d{4,5})(\d{0,4})/,'($1) $2-$3');}
  else if(v.length>2){v=v.replace(/(\d{2})(\d+)/,'($1) $2');}
  el.value=v;
}

async function viaCEP(cepId,campos){
  var cepEl=document.getElementById(cepId);
  if(!cepEl) return;
  var c=cepEl.value.replace(/\D/g,'');
  if(c.length!==8) return;
  try{
    var r=await fetch('https://viacep.com.br/ws/'+c+'/json/');
    var d=await r.json();
    if(d.erro) return;
    Object.keys(campos).forEach(function(id){
      var el=document.getElementById(id);
      if(el&&!el.value) el.value=d[campos[id]]||'';
    });
  }catch(_){}
}

async function _patch(data){
  return api('saloes?id=eq.'+S.id,{method:'PATCH',headers:{'Prefer':'return=minimal'},body:JSON.stringify(data)});
}

/* ─── SECTION TOGGLE ─── */
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
  }else{
    body.style.maxHeight=body.scrollHeight+600+'px';
    body.style.opacity='1';
    body.style.padding='';
    if(chevron) chevron.style.transform='rotate(90deg)';
  }
}

/* ─── SECTION BUILDERS ─── */
function _htmlPerfil(d){
  var cats=[
    {v:'barbearia',l:'Barbearia'},
    {v:'salao',l:'Salão de beleza'},
    {v:'estetica',l:'Estética'},
    {v:'manicure',l:'Manicure / Nail Designer'},
    {v:'clinica',l:'Clínica de estética'},
    {v:'tatuagem',l:'Tatuagem'},
    {v:'sobrancelha',l:'Design de sobrancelha'},
    {v:'dentista',l:'Dentista / Odontologia'},
    {v:'cuidador',l:'Cuidador de idosos'},
    {v:'limpeza',l:'Limpeza / Faxina'},
    {v:'personal',l:'Personal Trainer'},
    {v:'fisio',l:'Fisioterapia'},
    {v:'nutri',l:'Nutrição / Alimentação'},
    {v:'pet',l:'Pet shop / Veterinário'},
    {v:'massagem',l:'Massagem / SPA'},
    {v:'outros',l:'Outro'},
  ];
  var cat=d.categoria||'';
  var capaUrl=d.foto_capa_url||'';
  var perfilUrl=d.foto_url||'';
  return '<div style="padding:12px 16px">'+
    '<div style="margin-bottom:16px">'+
    '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--CZ);margin-bottom:8px">Foto de capa</div>'+
    '<div style="width:100%;height:76px;background:var(--s2);border:1.5px dashed var(--bd);border-radius:10px;overflow:hidden;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative" onclick="document.getElementById(\'inputFotoCapa\').click()">'+
    (capaUrl?'<img src="'+capaUrl+'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:9px">':'')+
    '<span style="font-size:12px;color:var(--CZ);z-index:1;background:rgba(0,0,0,.45);padding:3px 10px;border-radius:6px">'+(capaUrl?'✎ Alterar capa':'📷 Adicionar capa')+'</span>'+
    '</div>'+
    '<input type="file" id="inputFotoCapa" accept="image/*" style="display:none" onchange="uploadFoto(this,\'capa\')">'+
    '<div style="display:flex;align-items:center;gap:12px;margin-top:12px">'+
    '<div style="width:56px;height:56px;background:var(--s2);border:1.5px dashed var(--bd);border-radius:50%;overflow:hidden;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0" onclick="document.getElementById(\'inputFotoPerfil\').click()">'+
    (perfilUrl?'<img src="'+perfilUrl+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:20px">📷</span>')+
    '</div>'+
    '<div style="font-size:12px;color:var(--CZ)"><div style="font-weight:700;color:var(--text);margin-bottom:2px">Foto de perfil</div>Toque no círculo para alterar</div>'+
    '</div>'+
    '<input type="file" id="inputFotoPerfil" accept="image/*" style="display:none" onchange="uploadFoto(this,\'perfil\')">'+
    '</div>'+
    '<div class="fg"><label class="fl">Nome do estabelecimento</label>'+
    '<input class="fi" type="text" id="pfNome" value="'+esc(d.nome||S.nome||'')+'" placeholder="Nome do seu negócio"></div>'+
    '<div class="fg"><label class="fl">Link (slug)</label>'+
    '<div style="display:flex;gap:8px;align-items:center">'+
    '<input class="fi" type="text" id="pfSlug" value="'+esc(S.slug||'')+'" readonly style="flex:1;background:var(--s2);color:var(--CZ)">'+
    '<button onclick="navigator.clipboard.writeText(document.getElementById(\'pfSlug\').value).then(function(){toast(\'✓ Copiado!\',\'ok\')})" style="padding:8px 12px;background:var(--s2);border:1px solid var(--bd);border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;color:var(--MR)">Copiar</button>'+
    '</div></div>'+
    '<div class="fg"><label class="fl">Responsável</label>'+
    '<input class="fi" type="text" id="pfResp" value="'+esc(d.responsavel||'')+'" placeholder="Nome do responsável"></div>'+
    '<div class="fg"><label class="fl">Descrição</label>'+
    '<textarea class="fi" id="pfDesc" rows="3" style="resize:none;height:80px" placeholder="Sobre seu negócio...">'+esc(d.descricao||S.descricao||'')+'</textarea></div>'+
    '<div class="fg"><label class="fl">Categoria</label>'+
    '<select class="fi-sel" id="pfCat">'+
    cats.map(function(o){return '<option value="'+o.v+'"'+(cat===o.v?' selected':'')+'>'+o.l+'</option>';}).join('')+
    '</select></div>'+
    '<div class="fg"><label class="fl">Instagram</label>'+
    '<input class="fi" type="text" id="pfInsta" value="'+esc(d.instagram_url||'')+'" placeholder="https://instagram.com/seu_perfil"></div>'+
    '<div class="fg"><label class="fl">WhatsApp (apenas dígitos, ex: 5511999999999)</label>'+
    '<input class="fi" type="text" id="pfWhats" value="'+esc(d.whatsapp_url||'')+'" placeholder="5511999999999"></div>'+
    '<div class="fg"><label class="fl">TikTok</label>'+
    '<input class="fi" type="text" id="pfTiktok" value="'+esc(d.tiktok_url||'')+'" placeholder="https://tiktok.com/@perfil"></div>'+
    '<div class="fg"><label class="fl">Facebook</label>'+
    '<input class="fi" type="text" id="pfFb" value="'+esc(d.facebook_url||'')+'" placeholder="https://facebook.com/pagina"></div>'+
    '<div class="fg"><label class="fl">Website</label>'+
    '<input class="fi" type="text" id="pfSite" value="'+esc(d.website_url||'')+'" placeholder="https://seusite.com.br"></div>'+
    '<div class="fg"><label class="fl">Vídeo YouTube</label>'+
    '<input class="fi" type="text" id="pfVideo" value="'+esc(d.video_url||'')+'" placeholder="https://youtu.be/..."></div>'+
    '<div class="fg"><label class="fl">Tag destaque</label>'+
    '<input class="fi" type="text" id="pfTag" value="'+esc(d.tag_destaque||'')+'" placeholder="Em alta, Mais procurado..."></div>'+
    '<div class="fg"><label class="fl">Ano de fundação</label>'+
    '<input class="fi" type="text" id="pfFundado" value="'+esc(d.fundado_em||'')+'" placeholder="2020"></div>'+
    '<button class="btn-sv" onclick="salvarPerfil()" style="margin-top:8px;background:var(--primary)!important;color:#fff!important">Salvar perfil</button>'+
    '</div>';
}

function _htmlLocalizacao(d){
  return '<div style="padding:12px 16px">'+
    '<div class="fg"><label class="fl">Telefone</label>'+
    '<input class="fi" type="tel" id="locTel" value="'+esc(d.telefone||'')+'" oninput="fmtTel(this)" placeholder="(11) 99999-9999"></div>'+
    '<div class="two">'+
    '<div class="fg"><label class="fl">CEP</label>'+
    '<input class="fi" type="text" id="locCep" value="'+esc(d.cep||'')+'" oninput="fmtCep(this)" onblur="viaCEP(\'locCep\',{locEnd:\'logradouro\',locBairro:\'bairro\',locCidade:\'localidade\'})" placeholder="00000-000"></div>'+
    '<div class="fg"><label class="fl">Número</label>'+
    '<input class="fi" type="text" id="locNum" value="'+esc(d.numero||'')+'" placeholder="123"></div>'+
    '</div>'+
    '<div class="fg"><label class="fl">Endereço</label>'+
    '<input class="fi" type="text" id="locEnd" value="'+esc(d.endereco||'')+'" placeholder="Rua, avenida..."></div>'+
    '<div class="two">'+
    '<div class="fg"><label class="fl">Bairro</label>'+
    '<input class="fi" type="text" id="locBairro" value="'+esc(d.bairro||'')+'" placeholder="Bairro"></div>'+
    '<div class="fg"><label class="fl">Cidade</label>'+
    '<input class="fi" type="text" id="locCidade" value="'+esc(d.cidade||'')+'" placeholder="Cidade"></div>'+
    '</div>'+
    '<div class="fg"><label class="fl">Complemento</label>'+
    '<input class="fi" type="text" id="locComp" value="'+esc(d.complemento||'')+'" placeholder="Sala, andar..."></div>'+
    '<button class="btn-sv" onclick="salvarLocalizacao()" style="margin-top:8px;background:var(--primary)!important;color:#fff!important">Salvar localização</button>'+
    '</div>';
}

function _htmlAgenda(d){
  var h=d.horario||S.horario||S._horario||HORARIO_PADRAO;
  var html='<div style="padding:12px 16px">';
  html+=renderHorario(h,true);
  html+='<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--sep)">';
  html+='<div class="two">';
  html+='<div class="fg"><label class="fl">Intervalo entre horários</label><select class="fi-sel" id="cfgSlots">';
  [15,30,45,60].forEach(function(v){html+='<option value="'+v+'"'+((d.intervalo_slots||30)===v?' selected':'')+'>'+v+' min</option>';});
  html+='</select></div>';
  html+='<div class="fg"><label class="fl">Máx. agendamentos/dia</label>'+
    '<input class="fi" type="number" id="cfgMaxAg" value="'+(d.max_ag_dia||20)+'" min="1" max="200"></div>';
  html+='</div>';
  html+='<div class="fg"><label class="fl">Cancelamento mínimo</label><select class="fi-sel" id="cfgCancel">';
  [{v:0,l:'Qualquer hora'},{v:60,l:'1 hora antes'},{v:120,l:'2 horas antes'},{v:1440,l:'1 dia antes'}].forEach(function(o){
    html+='<option value="'+o.v+'"'+((d.cancelamento_min||120)===o.v?' selected':'')+'>'+o.l+'</option>';
  });
  html+='</select></div>';
  html+='</div>';
  html+='<button class="btn-sv" onclick="salvarAgenda()" style="margin-top:8px;background:var(--primary)!important;color:#fff!important">Salvar agenda</button>';
  html+='</div>';
  return html;
}

function _htmlPagamentosClientes(d){
  _pgtoState.dinheiro=d.aceita_dinheiro!==false;
  _pgtoState.pix=d.aceita_pix!==false;
  _pgtoState.cartao=!!d.aceita_cartao;
  _pgtoState.debito=!!d.aceita_debito;
  _pgtoState.pixKey=d.pix_key||'';
  _pgtoState.pixTipo=d.pix_tipo||'telefone';
  return '<div style="padding:12px 16px">'+
    '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--CZ);margin-bottom:10px">Métodos aceitos</div>'+
    _formaRow('cartao','💳 Cartão de crédito','Visa, Master, Elo e outros',_pgtoState.cartao)+
    _formaRow('debito','💳 Cartão de débito','Débito à vista',_pgtoState.debito)+
    _formaRow('dinheiro','💵 Dinheiro','Pagamento em espécie',_pgtoState.dinheiro)+
    '<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--sep)">'+
    '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--CZ);margin-bottom:10px">📲 PIX</div>'+
    '<div class="pgto-row" style="margin-bottom:10px"><div class="pgto-lbl">Aceitar PIX</div>'+
    '<button class="pgto-toggle '+(_pgtoState.pix?'on':'')+'" id="tg-pix" onclick="_togglePgtoForma(\'pix\')"></button></div>'+
    '<div id="pixSection" style="'+(!_pgtoState.pix?'display:none':'')+'">'+
    '<div class="fg"><label class="fl">Tipo de chave</label><select class="fi-sel" id="pixTipoSel">'+
    ['telefone','email','cpf','cnpj','aleatoria'].map(function(t){
      var lbl={telefone:'Telefone',email:'E-mail',cpf:'CPF',cnpj:'CNPJ',aleatoria:'Chave aleatória'}[t];
      return '<option value="'+t+'"'+(_pgtoState.pixTipo===t?' selected':'')+'>'+lbl+'</option>';
    }).join('')+'</select></div>'+
    '<div class="fg"><label class="fl">Chave PIX</label>'+
    '<input class="fi" type="text" id="pixKeyInput" placeholder="Sua chave PIX" value="'+esc(_pgtoState.pixKey)+'"></div>'+
    '<button class="btn-sv" onclick="salvarPagamentosClientes()" style="margin-top:8px;background:var(--primary)!important;color:#fff!important">Salvar chave PIX</button>'+
    '</div>'+
    '</div>'+
    '</div>';
}

function _formaRow(tipo,label,sub,ativo){
  return '<div class="pgto-row" style="padding:10px 0;border-bottom:1px solid var(--sep)">'+
    '<div><div class="pgto-lbl">'+label+'</div>'+
    (sub?'<div style="font-size:11px;color:var(--CZ);margin-top:1px">'+sub+'</div>':'')+
    '</div>'+
    '<button class="pgto-toggle '+(ativo?'on':'')+'" id="tg-'+tipo+'" onclick="_togglePgtoForma(\''+tipo+'\')"></button>'+
    '</div>';
}

function _htmlSinalPix(d){
  var temPix=!!(d.pix_key);
  if(!temPix){
    return '<div style="padding:16px;text-align:center;color:var(--CZ);font-size:13px">'+
      '⚠️ Configure uma chave PIX na seção <strong>Formas de pagamento</strong> para ativar o sinal antecipado.'+
      '</div>';
  }
  var mostrar=!!d.mostrar_sinal;
  var pct=d.sinal_percentual||30;
  var obrig=!!d.sinal_obrigatorio;
  return '<div style="padding:12px 16px">'+
    '<div class="pgto-row" style="padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid var(--sep)">'+
    '<div><div style="font-size:14px;font-weight:700;color:var(--text)">Solicitar sinal no agendamento</div>'+
    '<div style="font-size:12px;color:var(--text-2);margin-top:2px">Exibe opção de pré-pagamento para o cliente</div></div>'+
    '<button class="pgto-toggle '+(mostrar?'on':'')+'" id="tgMostrarSinal" onclick="toggleMostrarSinal(this)"></button>'+
    '</div>'+
    '<div id="sinalOpcoes" style="'+(!mostrar?'display:none':'')+'">'+
    '<div class="pgto-row" style="padding:0 0 10px">'+
    '<div style="font-size:13px;font-weight:600;color:var(--MR)">Percentual do sinal</div>'+
    '<div style="display:flex;align-items:center;gap:8px">'+
    '<input type="range" id="sliderSinal" min="10" max="50" step="5" value="'+pct+'"'+
    ' oninput="document.getElementById(\'lblSinal\').textContent=this.value+\'%\'"'+
    ' style="width:90px;accent-color:var(--L)">'+
    '<span id="lblSinal" style="font-weight:700;color:var(--L);min-width:32px">'+pct+'%</span>'+
    '</div></div>'+
    '<div class="pgto-row" style="padding-top:10px;border-top:1px solid var(--sep)">'+
    '<div><div style="font-size:13px;font-weight:700;color:var(--MR)">Tornar obrigatório</div>'+
    '<div style="font-size:11px;color:var(--CZ);margin-top:1px">Bloqueia confirmação sem pagamento do sinal</div></div>'+
    '<button class="pgto-toggle '+(obrig?'on':'')+'" id="tgSinalObrig" onclick="toggleSinalObrig(this)"></button>'+
    '</div>'+
    '</div>'+
    '<button class="btn-sv" onclick="salvarSinalPix()" style="margin-top:12px;background:var(--primary)!important;color:#fff!important">Salvar sinal</button>'+
    '</div>';
}

function _htmlNotifPush(d){
  var notifNovo=d.notif_novo_ag!==false;
  return '<div style="padding:12px 16px">'+
    '<div id="pushStatusTxt" style="font-size:13px;color:var(--CZ);margin-bottom:10px">Verificando...</div>'+
    '<button class="btn-add" style="width:100%;justify-content:center;padding:11px;margin-bottom:16px" onclick="testarPush(this)">🧪 Enviar notificação de teste</button>'+
    '<div class="pgto-row" style="padding-top:12px;border-top:1px solid var(--sep)">'+
    '<div><div style="font-size:14px;font-weight:700;color:var(--text)">Notificar novo agendamento</div>'+
    '<div style="font-size:12px;color:var(--text-2)">Push ao receber novo agendamento</div></div>'+
    '<button class="pgto-toggle '+(notifNovo?'on':'')+'" id="tgNotifNovo" onclick="salvarNotifNovo(this)"></button>'+
    '</div>'+
    '</div>';
}

function _htmlLembreteRetorno(d){
  var lembreAtivo=!!d.lembrete_retorno_ativo;
  var lembreDias=d.lembrete_retorno_dias||30;
  var lembreMsg=d.lembrete_retorno_msg||'';
  return '<div style="padding:12px 16px">'+
    '<div class="pgto-row" style="margin-bottom:14px">'+
    '<div><div style="font-size:14px;font-weight:700;color:var(--text)">Ativar lembrete</div>'+
    '<div style="font-size:12px;color:var(--text-2)">Alerta para clientes sem agendar há X dias</div></div>'+
    '<button class="pgto-toggle '+(lembreAtivo?'on':'')+'" id="tgLembrete" onclick="this.classList.toggle(\'on\')"></button>'+
    '</div>'+
    '<div class="fg"><label class="fl">Dias sem agendamento</label>'+
    '<input class="fi" type="number" id="lembreDias" value="'+lembreDias+'" min="7" max="365" style="width:100px"></div>'+
    '<div class="fg"><label class="fl">Mensagem personalizada</label>'+
    '<textarea class="fi" id="lembreMsg" rows="2" style="resize:none;height:60px" placeholder="Ex: Sentimos sua falta!">'+esc(lembreMsg)+'</textarea></div>'+
    '<button class="btn-sv" onclick="salvarLembreteRetorno()" style="margin-top:8px;background:var(--primary)!important;color:#fff!important">Salvar lembrete</button>'+
    '</div>';
}

function _htmlMarketplace(d){
  var pub=!!d.publico_marketplace;
  var ind=!!d.aceita_indicacao;
  return '<div style="padding:12px 16px">'+
    '<div class="pgto-row" style="margin-bottom:12px">'+
    '<div><div style="font-size:14px;font-weight:700;color:var(--text)">Aparecer no marketplace</div>'+
    '<div style="font-size:12px;color:var(--text-2)">Clientes descobrem seu negócio pelo catálogo</div></div>'+
    '<button class="pgto-toggle '+(pub?'on':'')+'" id="tgMarketplace" onclick="this.classList.toggle(\'on\')"></button>'+
    '</div>'+
    '<div class="pgto-row">'+
    '<div><div style="font-size:14px;font-weight:700;color:var(--text)">Aceitar indicações</div>'+
    '<div style="font-size:12px;color:var(--text-2)">Receber indicações de outros estabelecimentos</div></div>'+
    '<button class="pgto-toggle '+(ind?'on':'')+'" id="tgIndicacao" onclick="this.classList.toggle(\'on\')"></button>'+
    '</div>'+
    '<button class="btn-sv" onclick="salvarMarketplace()" style="margin-top:12px;background:var(--primary)!important;color:#fff!important">Salvar marketplace</button>'+
    '</div>';
}

function _htmlFaturamento(d){
  return '<div style="padding:12px 16px">'+
    '<div class="two">'+
    '<div class="fg"><label class="fl">Nome completo *</label><input class="fi" type="text" id="fatNome" value="'+esc(d.fat_nome||S.fat_nome||'')+'"></div>'+
    '<div class="fg"><label class="fl">CPF / CNPJ *</label><input class="fi" type="text" id="fatCpf" oninput="fmtCpfCnpj(this)" value="'+esc(d.fat_cpf_cnpj||S.fat_cpf_cnpj||'')+'"></div>'+
    '</div>'+
    '<div class="two">'+
    '<div class="fg"><label class="fl">Email cobranças</label><input class="fi" type="email" id="fatEmail" value="'+esc(d.fat_email||'')+'"></div>'+
    '<div class="fg"><label class="fl">Celular</label><input class="fi" type="tel" id="fatCel" oninput="fmtTel(this)" value="'+esc(d.fat_celular||'')+'"></div>'+
    '</div>'+
    '<div class="fg"><label class="fl">Empresa / Razão social</label><input class="fi" type="text" id="fatEmp" value="'+esc(d.fat_empresa||'')+'"></div>'+
    '<div style="padding-top:12px;margin-top:4px;border-top:1px solid var(--sep)">'+
    '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--CZ);margin-bottom:10px">Endereço de faturamento</div>'+
    '<div class="two">'+
    '<div class="fg"><label class="fl">CEP</label>'+
    '<input class="fi" type="text" id="fatCep" value="'+esc(d.fat_cep||'')+'" oninput="fmtCep(this)" onblur="viaCEP(\'fatCep\',{fatRua:\'logradouro\',fatBairro:\'bairro\',fatCidade:\'localidade\',fatEstado:\'uf\'})" placeholder="00000-000"></div>'+
    '<div class="fg"><label class="fl">Número</label><input class="fi" type="text" id="fatNum" value="'+esc(d.fat_numero||'')+'"></div>'+
    '</div>'+
    '<div class="fg"><label class="fl">Rua</label><input class="fi" type="text" id="fatRua" value="'+esc(d.fat_rua||'')+'"></div>'+
    '<div class="two">'+
    '<div class="fg"><label class="fl">Bairro</label><input class="fi" type="text" id="fatBairro" value="'+esc(d.fat_bairro||'')+'"></div>'+
    '<div class="fg"><label class="fl">Cidade</label><input class="fi" type="text" id="fatCidade" value="'+esc(d.fat_cidade||'')+'"></div>'+
    '</div>'+
    '<div class="two">'+
    '<div class="fg"><label class="fl">Estado (UF)</label><input class="fi" type="text" id="fatEstado" value="'+esc(d.fat_estado||'')+'" maxlength="2" style="text-transform:uppercase"></div>'+
    '<div class="fg"><label class="fl">Complemento</label><input class="fi" type="text" id="fatComp" value="'+esc(d.fat_complemento||'')+'"></div>'+
    '</div>'+
    '</div>'+
    '<button class="btn-sv" onclick="salvarFaturamento()" style="margin-top:8px;background:var(--primary)!important;color:#fff!important">Salvar dados de faturamento</button>'+
    '</div>';
}

function _htmlLink(){
  var url=BASE+'/agendar.html?slug='+S.slug;
  var waMsg=encodeURIComponent('Agende comigo aqui: '+url);
  var qr='https://api.qrserver.com/v1/create-qr-code/?size=180x180&data='+encodeURIComponent(url);
  return '<div style="padding:12px 16px">'+
    '<div style="background:var(--s2);border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:12px;color:var(--MR);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+url+'</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">'+
    '<button onclick="cpLink()" style="flex:1;min-width:80px;padding:10px 12px;background:var(--primary);border:none;border-radius:10px;color:#fff;font-weight:700;font-size:13px;cursor:pointer">📋 Copiar</button>'+
    '<a href="'+url+'" target="_blank" rel="noopener" style="flex:1;min-width:80px;text-align:center;padding:10px 12px;background:var(--s2);border:1px solid var(--bd);border-radius:10px;color:var(--MR);font-weight:700;font-size:13px;text-decoration:none">Abrir ↗</a>'+
    '<a href="https://wa.me/?text='+waMsg+'" target="_blank" rel="noopener" style="flex:1;min-width:80px;text-align:center;padding:10px 12px;background:#25D366;border:none;border-radius:10px;color:#fff;font-weight:700;font-size:13px;text-decoration:none">WhatsApp</a>'+
    '</div>'+
    '<div style="text-align:center">'+
    '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--CZ);margin-bottom:10px">QR Code</div>'+
    '<img src="'+qr+'" width="180" height="180" alt="QR Code" style="border-radius:12px;border:1px solid var(--bd)">'+
    '</div>'+
    '</div>';
}

/* ─── RENDER PAGINA ─── */
async function renderPagina(){
  _tabOk.pagina=true;
  var container=document.getElementById('tb-pagina');
  if(!container) return;
  container.innerHTML='<div class="loading">Carregando configurações...</div>';

  var d={};
  try{
    var rows=await api('saloes?slug=eq.'+S.slug+'&select=nome,slug,responsavel,descricao,categoria,instagram_url,website_url,whatsapp_url,tiktok_url,facebook_url,video_url,tag_destaque,fundado_em,foto_url,foto_capa_url,galeria_fotos,diferenciais,faq,produtos,telefone,endereco,cep,cidade,bairro,numero,complemento,horario,intervalo_slots,max_ag_dia,cancelamento_min,aceita_dinheiro,aceita_pix,aceita_cartao,aceita_debito,pix_key,pix_tipo,mostrar_sinal,sinal_percentual,sinal_obrigatorio,notif_novo_ag,lembrete_retorno_ativo,lembrete_retorno_dias,lembrete_retorno_msg,publico_marketplace,aceita_indicacao,fat_nome,fat_cpf_cnpj,fat_email,fat_empresa,fat_celular,fat_cep,fat_rua,fat_numero,fat_complemento,fat_bairro,fat_cidade,fat_estado,tema');
    d=rows&&rows[0]?rows[0]:{};
    if(d.tema&&!S._tema) S._tema=d.tema;
    if(d.horario&&!S.horario) S.horario=d.horario;
  }catch(e){ d={}; }

  try{
    if(_pw){
      var priv=await rpc('obter_dados_privados_salao',{p_slug:S.slug,p_senha:_pw});
      if(priv) d=Object.assign({},d,priv);
    }
  }catch(_e){}

  container.innerHTML='';

  var secoes=[
    {id:'tema',        icon:'🎨', label:'Aparência',                   html:'<div id="temaWrap" style="padding:0 16px 12px"></div>'},
    {id:'perfil',      icon:'📋', label:'Perfil público',              html:_htmlPerfil(d)},
    {id:'galeria',     icon:'📸', label:'Galeria de fotos',            html:_htmlGaleria(d)},
    {id:'diferenciais',icon:'✨', label:'Diferenciais',                html:_htmlDiferenciais(d)},
    {id:'faq',         icon:'❓', label:'FAQ (Perguntas frequentes)',  html:_htmlFaq(d)},
    {id:'produtos',    icon:'🛍️', label:'Produtos',                    html:_htmlProdutos(d)},
    {id:'localizacao', icon:'📍', label:'Localização',                 html:_htmlLocalizacao(d)},
    {id:'agenda',      icon:'🕐', label:'Agenda e horários',           html:_htmlAgenda(d)},
    {id:'pgto-cli',    icon:'💳', label:'Formas de pagamento',         html:_htmlPagamentosClientes(d)},
    {id:'sinal',       icon:'📲', label:'Sinal antecipado',            html:_htmlSinalPix(d)},
    {id:'faturamento', icon:'💰', label:'Dados de faturamento',        html:_htmlFaturamento(d)},
    {id:'bloqueios',   icon:'🔒', label:'Bloqueios de agenda',         html:null,async:true},
    {id:'notif-push',  icon:'🔔', label:'Notificações push',           html:_htmlNotifPush(d)},
    {id:'lembrete',    icon:'⏰', label:'Lembrete de retorno',         html:_htmlLembreteRetorno(d)},
    {id:'marketplace', icon:'🌐', label:'Marketplace',                 html:_htmlMarketplace(d)},
    {id:'link',        icon:'🔗', label:'Link de agendamento',         html:_htmlLink()},
  ];

  secoes.forEach(function(s){
    var grupo=document.createElement('div');
    grupo.className='section-group';
    grupo.dataset.section=s.id;
    grupo.style.cssText='background:var(--bg-card);border-radius:var(--r-lg);margin:0 0 10px;overflow:hidden;border:1px solid var(--sep)';

    var header=document.createElement('div');
    header.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer;user-select:none';
    header.innerHTML='<span style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:var(--text)"><span>'+s.icon+'</span>'+s.label+'</span>'+
      '<svg class="section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:var(--text-3);transition:transform .24s;flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>';
    header.onclick=function(){_toggleSecao(s.id);};

    var body=document.createElement('div');
    body.id='secbody-'+s.id;
    body.style.cssText='max-height:0;opacity:0;overflow:hidden;transition:max-height .32s ease,opacity .24s ease';

    if(s.async){
      body.innerHTML='<div style="padding:12px 16px"><div class="loading">Carregando...</div></div>';
      (function(b){
        _renderBloqueios().then(function(html){b.innerHTML=html;});
      })(body);
    }else{
      body.innerHTML=s.html||'';
    }

    grupo.appendChild(header);
    grupo.appendChild(body);
    container.appendChild(grupo);
  });

  setTimeout(function(){
    if(typeof renderTema==='function') renderTema();
    atualizarStatusPush();
  },100);
}

/* ─── SAVE: PERFIL ─── */
async function salvarPerfil(){
  var btn=document.querySelector('[onclick="salvarPerfil()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var g=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
  try{
    await _patch({
      nome:g('pfNome')||null,
      responsavel:g('pfResp')||null,
      descricao:g('pfDesc')||null,
      categoria:document.getElementById('pfCat')?document.getElementById('pfCat').value||null:null,
      instagram_url:g('pfInsta')||null,
      whatsapp_url:g('pfWhats')||null,
      tiktok_url:g('pfTiktok')||null,
      facebook_url:g('pfFb')||null,
      website_url:g('pfSite')||null,
      video_url:g('pfVideo')||null,
      tag_destaque:g('pfTag')||null,
      fundado_em:g('pfFundado')||null
    });
    if(g('pfNome')) S.nome=g('pfNome');
    toast('✓ Perfil salvo!','ok');
  }catch(e){toast('Erro ao salvar: '+e.message,'err');}
  if(btn){btn.disabled=false;btn.textContent='Salvar perfil';}
}

/* ─── UPLOAD FOTO ─── */
async function uploadFoto(input, tipo){
  var file=input&&input.files&&input.files[0];
  if(!file) return;
  var inputId=tipo==='capa'?'inputFotoCapa':'inputFotoPerfil';
  var area=document.getElementById(inputId)&&document.getElementById(inputId).previousElementSibling;
  if(area) area.style.opacity='.5';
  var ext=(file.name||'img').split('.').pop().toLowerCase()||'jpg';
  if(!['jpg','jpeg','png','webp'].includes(ext)) ext='jpg';
  var path=S.id+'/'+tipo+'.'+ext;
  try{
    var r=await fetch(SUPA+'/storage/v1/object/fotos-estabelecimentos/'+path,{
      method:'POST',
      headers:{'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':file.type||'image/jpeg','x-upsert':'true'},
      body:file
    });
    if(!r.ok){var etxt=await r.text();throw new Error(etxt);}
    var publicUrl=SUPA+'/storage/v1/object/public/fotos-estabelecimentos/'+path;
    var pw=await getPw();
    if(!pw){if(area) area.style.opacity='';toast('Senha necessária para salvar','err');return;}
    var ok=await rpc('salvar_foto_salao',{p_slug:S.slug,p_senha:pw,p_tipo:tipo,p_url:publicUrl});
    if(!ok){if(area) area.style.opacity='';toast('Senha incorreta','err');return;}
    if(tipo==='capa') S.foto_capa_url=publicUrl;
    else S.foto_url=publicUrl;
    toast('✓ Foto salva!','ok');
    var secBody=document.getElementById('secbody-perfil');
    if(secBody) secBody.innerHTML=_htmlPerfil(Object.assign({},S,{foto_capa_url:S.foto_capa_url,foto_url:S.foto_url}));
  }catch(e){
    if(area) area.style.opacity='';
    toast('Erro no upload: '+e.message,'err');
  }
}

/* ─── SAVE: LOCALIZAÇÃO ─── */
async function salvarLocalizacao(){
  var btn=document.querySelector('[onclick="salvarLocalizacao()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var g=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
  try{
    await _patch({
      telefone:g('locTel')||null,
      endereco:g('locEnd')||null,
      cep:g('locCep').replace(/\D/g,'')||null,
      cidade:g('locCidade')||null,
      bairro:g('locBairro')||null,
      numero:g('locNum')||null,
      complemento:g('locComp')||null
    });
    S.telefone=g('locTel');
    toast('✓ Localização salva!','ok');
  }catch(e){toast('Erro ao salvar: '+e.message,'err');}
  if(btn){btn.disabled=false;btn.textContent='Salvar localização';}
}

/* ─── SAVE: AGENDA ─── */
async function salvarAgenda(){
  var btn=document.querySelector('[onclick="salvarAgenda()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var pw=await getPw();
  if(!pw){if(btn){btn.disabled=false;btn.textContent='Salvar agenda';}return;}
  var horario={};
  document.querySelectorAll('.horario-row').forEach(function(row){
    var dia=row.dataset.dia;
    var aberto=row.querySelector('.btn-toggle-dia').classList.contains('on');
    if(!aberto){horario[dia]=null;return;}
    var ini=row.querySelector('[data-tipo="ini"]').value||'09:00';
    var fim=row.querySelector('[data-tipo="fim"]').value||'19:00';
    horario[dia]={ini:ini,fim:fim};
  });
  var slots=document.getElementById('cfgSlots')?parseInt(document.getElementById('cfgSlots').value):30;
  var maxAg=document.getElementById('cfgMaxAg')?parseInt(document.getElementById('cfgMaxAg').value):20;
  var cancel=document.getElementById('cfgCancel')?parseInt(document.getElementById('cfgCancel').value):120;
  try{
    await rpc('salvar_horario',{p_slug:S.slug,p_senha:pw,p_horario:horario});
    await _patch({intervalo_slots:slots,max_ag_dia:maxAg,cancelamento_min:cancel});
    S._horario=horario;S.cancelamento_min=cancel;
    toast('✓ Agenda salva!','ok');
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;toast('Senha incorreta','err');}
    else{toast('Erro: '+e.message,'err');}
  }
  if(btn){btn.disabled=false;btn.textContent='Salvar agenda';}
}

/* ─── SAVE: PAGAMENTOS CLIENTES ─── */
async function salvarFormasPagamento(){
  await _patch({aceita_dinheiro:_pgtoState.dinheiro,aceita_cartao:_pgtoState.cartao,aceita_debito:_pgtoState.debito,aceita_pix:_pgtoState.pix});
}

async function _togglePgtoForma(tipo){
  var btn=document.getElementById('tg-'+tipo);
  var wasOn=!!_pgtoState[tipo];
  _pgtoState[tipo]=!wasOn;
  if(btn) btn.className='pgto-toggle'+(_pgtoState[tipo]?' on':'');
  if(tipo==='pix'){var pixSec=document.getElementById('pixSection');if(pixSec) pixSec.style.display=_pgtoState.pix?'':'none';}
  try{
    await salvarFormasPagamento();
  }catch(e){
    _pgtoState[tipo]=wasOn;
    if(btn) btn.className='pgto-toggle'+(wasOn?' on':'');
    if(tipo==='pix'){var pixSec2=document.getElementById('pixSection');if(pixSec2) pixSec2.style.display=wasOn?'':'none';}
    toast('Erro ao salvar','err');
  }
}

async function salvarPagamentosClientes(){
  var btn=document.querySelector('[onclick="salvarPagamentosClientes()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var pw=await getPw();
  if(!pw){if(btn){btn.disabled=false;btn.textContent='Salvar chave PIX';}return;}
  var pixKey=document.getElementById('pixKeyInput')?document.getElementById('pixKeyInput').value.trim():'';
  var pixTipo=document.getElementById('pixTipoSel')?document.getElementById('pixTipoSel').value:'telefone';
  try{
    await rpc('salvar_pagamento_salao',{p_slug:S.slug,p_senha:pw,p_dinheiro:_pgtoState.dinheiro,p_pix:_pgtoState.pix,p_cartao:_pgtoState.cartao,p_debito:_pgtoState.debito,p_pix_key:pixKey||null,p_pix_tipo:pixTipo});
    _pgtoState.pixKey=pixKey;_pgtoState.pixTipo=pixTipo;
    toast('✓ Chave PIX salva!','ok');
    var sinalBody=document.getElementById('secbody-sinal');
    if(sinalBody) sinalBody.innerHTML=_htmlSinalPix({pix_key:pixKey,mostrar_sinal:_pgtoState.mostrarSinal,sinal_percentual:_pgtoState.sinalPct,sinal_obrigatorio:_pgtoState.sinalObrig});
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;toast('Senha incorreta','err');}
    else{toast('Erro: '+e.message,'err');}
  }
  if(btn){btn.disabled=false;btn.textContent='Salvar chave PIX';}
}

/* ─── SAVE: SINAL PIX ─── */
async function salvarSinalPix(){
  var btn=document.querySelector('[onclick="salvarSinalPix()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var mostrar=document.getElementById('tgMostrarSinal')?document.getElementById('tgMostrarSinal').classList.contains('on'):false;
  var obrig=document.getElementById('tgSinalObrig')?document.getElementById('tgSinalObrig').classList.contains('on'):false;
  var pct=document.getElementById('sliderSinal')?parseInt(document.getElementById('sliderSinal').value):30;
  try{
    await _patch({mostrar_sinal:mostrar,sinal_obrigatorio:obrig,sinal_percentual:pct});
    S.mostrar_sinal=mostrar;S.sinal_obrigatorio=obrig;S.sinal_percentual=pct;
    toast('✓ Sinal salvo!','ok');
  }catch(e){toast('Erro: '+e.message,'err');}
  if(btn){btn.disabled=false;btn.textContent='Salvar sinal';}
}

/* ─── SAVE: NOTIFICAÇÕES PUSH ─── */
async function salvarNotifNovo(btn){
  var wasOn=btn.classList.contains('on');
  btn.classList.toggle('on');
  try{
    await _patch({notif_novo_ag:!wasOn});
  }catch(e){
    btn.classList.toggle('on');
    toast('Erro ao salvar','err');
  }
}

/* ─── SAVE: LEMBRETE DE RETORNO ─── */
async function salvarLembreteRetorno(){
  var btn=document.querySelector('[onclick="salvarLembreteRetorno()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var lembreAtivo=document.getElementById('tgLembrete')?document.getElementById('tgLembrete').classList.contains('on'):false;
  var lembreDias=document.getElementById('lembreDias')?parseInt(document.getElementById('lembreDias').value)||30:30;
  var lembreMsg=document.getElementById('lembreMsg')?document.getElementById('lembreMsg').value.trim():'';
  try{
    await _patch({lembrete_retorno_ativo:lembreAtivo,lembrete_retorno_dias:lembreDias,lembrete_retorno_msg:lembreMsg||null});
    S.lembrete_retorno_ativo=lembreAtivo;S.lembrete_retorno_dias=lembreDias;
    toast('✓ Lembrete salvo!','ok');
  }catch(e){toast('Erro: '+e.message,'err');}
  if(btn){btn.disabled=false;btn.textContent='Salvar lembrete';}
}

/* ─── SAVE: MARKETPLACE ─── */
async function salvarMarketplace(){
  var btn=document.querySelector('[onclick="salvarMarketplace()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var pub=document.getElementById('tgMarketplace')?document.getElementById('tgMarketplace').classList.contains('on'):false;
  var ind=document.getElementById('tgIndicacao')?document.getElementById('tgIndicacao').classList.contains('on'):false;
  try{
    await _patch({publico_marketplace:pub,aceita_indicacao:ind});
    toast('✓ Marketplace salvo!','ok');
  }catch(e){toast('Erro: '+e.message,'err');}
  if(btn){btn.disabled=false;btn.textContent='Salvar marketplace';}
}

/* ─── SAVE: FATURAMENTO ─── */
async function salvarFaturamento(){
  var btn=document.querySelector('[onclick="salvarFaturamento()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var g=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
  var fatNome=g('fatNome');
  var fatCpfRaw=g('fatCpf').replace(/\D/g,'');
  if(!fatNome){if(btn){btn.disabled=false;btn.textContent='Salvar dados de faturamento';}toast('Nome do responsável é obrigatório','err');return;}
  if(!fatCpfRaw||fatCpfRaw.length<11){if(btn){btn.disabled=false;btn.textContent='Salvar dados de faturamento';}toast('CPF ou CNPJ é obrigatório','err');return;}
  var pw=await getPw();
  if(!pw){if(btn){btn.disabled=false;btn.textContent='Salvar dados de faturamento';}return;}
  try{
    await rpc('salvar_perfil_salao',{
      p_slug:S.slug,p_senha:pw,
      p_descricao:null,p_endereco:null,p_cancelamento_min:S.cancelamento_min||120,
      p_fat_nome:fatNome||null,p_fat_cpf_cnpj:fatCpfRaw||null,
      p_fat_email:g('fatEmail')||null,p_fat_empresa:g('fatEmp')||null,
      p_fat_celular:g('fatCel')||null,p_fat_fone:null,
      p_fat_cep:g('fatCep').replace(/\D/g,'')||null,p_fat_rua:g('fatRua')||null,
      p_fat_numero:g('fatNum')||null,p_fat_complemento:g('fatComp')||null,
      p_fat_bairro:g('fatBairro')||null,p_fat_cidade:g('fatCidade')||null,
      p_fat_estado:g('fatEstado')||null,p_fat_emails_extra:null,
      p_fat_obs:null,p_fat_boleto_correios:false,
    });
    if(btn){btn.disabled=false;btn.textContent='Salvar dados de faturamento';}
    toast('✓ Dados de faturamento salvos!','ok');
    try{fetch(ASAAS_FN,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'criar_cliente_asaas',salao_id:S.id,cpf_cnpj:fatCpfRaw,nome:fatNome,email:g('fatEmail')||null,telefone:g('fatCel')||null})});}catch(_){}
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='Salvar dados de faturamento';}
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;toast('Senha incorreta','err');}
    else{toast('Erro: '+e.message,'err');}
  }
}

/* ─── HELPERS FATURAMENTO ─── */
function fmtCpfCnpjOld(el){ fmtCpfCnpj(el); }

async function preencherEndFat(cep){
  await viaCEP('fatCep',{fatRua:'logradouro',fatBairro:'bairro',fatCidade:'localidade',fatEstado:'uf'});
}

/* ─── BLOQUEIOS (config tab inline) ─── */
async function _renderBloqueios(){
  try{
    var hoje=new Date();
    var dIni=hoje.getFullYear()+'-'+String(hoje.getMonth()+1).padStart(2,'0')+'-'+String(hoje.getDate()).padStart(2,'0');
    var dFim=(hoje.getFullYear()+2)+'-12-31';
    var bloqueios=await rpc('listar_bloqueios',{p_slug:S.slug,p_data_ini:dIni,p_data_fim:dFim})||[];
    var html='';
    if(!bloqueios.length){
      html='<div style="padding:16px;font-size:13px;color:var(--text-2)">Nenhum bloqueio cadastrado.<br>'+
        '<small>Use bloqueios para marcar férias, folgas ou feriados.</small></div>';
    }else{
      html=bloqueios.map(function(b){
        var ini=b.data_ini?new Date(b.data_ini+'T12:00:00').toLocaleDateString('pt-BR'):'—';
        var fim=b.data_fim?new Date(b.data_fim+'T12:00:00').toLocaleDateString('pt-BR'):ini;
        return '<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--sep)">'+
          '<div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--text)">'+(b.motivo||'Bloqueio')+'</div>'+
          '<div style="font-size:12px;color:var(--text-2)">'+ini+(fim!==ini?' → '+fim:'')+'</div></div>'+
          '<button onclick="_excluirBloqueio(\''+b.id+'\')" style="background:var(--error-bg,rgba(255,59,48,.1));color:var(--error,#FF3B30);border:none;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:700;cursor:pointer">\xd7</button>'+
          '</div>';
      }).join('');
    }
    html+='<div style="padding:12px 16px">'+
      '<button onclick="_abrirNovoBloqueio()" style="width:100%;padding:12px;background:var(--primary);color:#fff;border:none;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer">+ Adicionar bloqueio</button>'+
      '</div>';
    return html;
  }catch(e){
    return '<div style="padding:16px;font-size:13px;color:var(--text-2)">Erro ao carregar bloqueios.</div>'+
      '<div style="padding:0 16px 12px"><button onclick="_abrirNovoBloqueio()" style="width:100%;padding:12px;background:var(--primary);color:#fff;border:none;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer">+ Adicionar bloqueio</button></div>';
  }
}

var _bloqExcluirId=null;
async function _excluirBloqueio(id){
  _bloqExcluirId=id;
  var ovEl=document.getElementById('ovExcluirBloq');
  if(!ovEl) return;
  var btn=document.getElementById('btnConfExcluirBloq');
  if(btn){
    btn.onclick=async function(){
      btn.disabled=true;btn.textContent='Removendo...';
      var pw=await getPw();
      if(!pw){btn.disabled=false;btn.textContent='Remover';return;}
      try{
        await rpc('excluir_bloqueio',{p_slug:S.slug,p_senha:pw,p_bloqueio_id:_bloqExcluirId});
        if(typeof toast==='function') toast('Bloqueio removido','ok');
        ovEl.classList.remove('show');
        _tabOk.pagina=false;renderPagina();
      }catch(e){
        if(e.message&&e.message.includes('Acesso negado')){_pw=null;}
        if(typeof toast==='function') toast('Erro: '+e.message,'err');
      }
      btn.disabled=false;btn.textContent='Remover';
    };
  }
  ovEl.classList.add('show');
}

function fecharBloqueio(){
  var ov=document.getElementById('ovBloqueio');
  if(ov) ov.classList.remove('show');
}

async function _abrirNovoBloqueio(){
  var hoje=new Date().toISOString().slice(0,10);
  var ini=document.getElementById('bloqIni');if(ini) ini.value=hoje;
  var fim=document.getElementById('bloqFim');if(fim) fim.value='';
  var mot=document.getElementById('bloqMotivo');if(mot) mot.value='';
  var err=document.getElementById('bloqErr');if(err) err.style.display='none';
  var ov=document.getElementById('ovBloqueio');if(ov) ov.classList.add('show');
}

async function confirmarBloqueio(){
  var ini=document.getElementById('bloqIni').value;
  var fim=document.getElementById('bloqFim').value;
  var motivo=document.getElementById('bloqMotivo').value;
  var errEl=document.getElementById('bloqErr');
  if(!ini||!/^\d{4}-\d{2}-\d{2}$/.test(ini)){
    errEl.textContent='Data início inválida.';errEl.style.display='block';return;
  }
  var pw=await getPw();
  if(!pw) return;
  var btn=document.querySelector('#ovBloqueio .btn-sv');
  btn.disabled=true;btn.textContent='Bloqueando...';
  try{
    await rpc('criar_bloqueio',{p_slug:S.slug,p_senha:pw,p_data_ini:ini,p_data_fim:fim||ini,p_motivo:motivo||null});
    if(typeof toast==='function') toast('✓ Bloqueio adicionado!','ok');
    fecharBloqueio();
    _tabOk.pagina=false;renderPagina();
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;}
    errEl.textContent='Erro: '+e.message;errEl.style.display='block';
  }
  btn.disabled=false;btn.textContent='Bloquear';
}

/* ─── BLOQUEIOS (standalone renderBloqueios) ─── */
var _bloqueios=[];

async function renderBloqueios(){
  var el=document.getElementById('bloqueiosLista')||document.getElementById('body-bloqueios');
  if(!el) return;
  try{
    var hoje=new Date();
    var dIni=hoje.getFullYear()+'-'+String(hoje.getMonth()+1).padStart(2,'0')+'-01';
    var dFim=new Date(hoje.getFullYear(),hoje.getMonth()+3,0);
    var dFimStr=dFim.getFullYear()+'-'+String(dFim.getMonth()+1).padStart(2,'0')+'-'+String(dFim.getDate()).padStart(2,'0');
    _bloqueios=await rpc('listar_bloqueios',{p_slug:S.slug,p_data_ini:dIni,p_data_fim:dFimStr})||[];
  }catch(e){_bloqueios=[];}
  if(!_bloqueios.length){
    el.innerHTML='<div style="font-size:12px;color:var(--CZ);padding:8px 0">Nenhum bloqueio cadastrado.</div>';
    return;
  }
  var html='';
  _bloqueios.forEach(function(b){
    var label=b.data_ini===b.data_fim?fmtBR(b.data_ini):fmtBR(b.data_ini)+' até '+fmtBR(b.data_fim);
    html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--s2);border-radius:8px;margin-bottom:6px">'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:13px;font-weight:800;color:var(--MR)">🚫 '+label+'</div>'+
        (b.motivo?'<div style="font-size:11px;color:var(--CZ);margin-top:2px">'+esc(b.motivo)+'</div>':'')+
      '</div>'+
      '<button data-bid="'+b.id+'" onclick="excluirBloqueio(this.dataset.bid)" style="background:none;border:none;color:var(--red,#ef4444);cursor:pointer;font-size:18px;padding:4px;line-height:1">\xd7</button>'+
    '</div>';
  });
  el.innerHTML=html;
}

async function adicionarBloqueio(){
  var ini=(document.getElementById('blkIni')||{}).value;
  var fim=(document.getElementById('blkFim')||{}).value||ini;
  var motivo=(document.getElementById('blkMotivo')||{}).value.trim()||null;
  if(!ini){toast('Informe a data de início.','err');return;}
  var pw=await getPw('Confirmar bloqueio','Informe sua senha para bloquear esta data.');if(!pw) return;
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
  var pw=await getPw();if(!pw) return;
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
    api('saloes?id=eq.'+S.id,{method:'PATCH',body:JSON.stringify({lembrete_retorno_dias:parseInt(dias,10)})})
      .then(function(){toast('✓ Lembrete de retorno salvo!','ok');})
      .catch(function(){toast('Erro ao salvar.','err');});
  }catch(e){toast('Erro ao salvar','err');}
}

/* ─── FINANCEIRO ─── */
async function renderFinanceiro(el){
  if(!el||!S||!S.id) return;
  try{
    var dados=await rpc('listar_cobrancas_salao',{p_salao_id:S.id});
    var sub=await api('saloes?slug=eq.'+S.slug+'&select=asaas_subscription_id,metodo_assinatura,assinatura_status');
    var ss=sub&&sub[0]?sub[0]:{};
    var metodo=ss.metodo_assinatura||'';
    var statusLabel={'ACTIVE':'✅ Ativa','INACTIVE':'⏸ Inativa','OVERDUE':'⚠️ Em atraso','PENDING':'🕐 Aguardando'}[ss.assinatura_status]||'—';
    var statusColor={'ACTIVE':'#4ADE80','OVERDUE':'#F87171','PENDING':'#FBBF24','INACTIVE':'#6B7280'}[ss.assinatura_status]||'var(--CZ)';
    var metodoLabel={'PIX':'💚 PIX','BOLETO':'🏦 Boleto','CREDIT_CARD':'💳 Cartão'}[metodo]||'';
    var html='<div class="perfil-card"><div class="perfil-tit">💰 Financeiro Agenda</div>';
    html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--s2);border-radius:10px;margin-bottom:12px">';
    html+='<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--CZ)">Assinatura</div><div style="font-size:13px;font-weight:800;color:'+statusColor+'">'+statusLabel+'</div></div>';
    if(metodoLabel)html+='<div style="text-align:right"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--CZ)">Método</div><div style="font-size:12px;font-weight:700;color:var(--MR)">'+metodoLabel+'</div></div>';
    html+='</div>';
    var list=dados&&dados.length?dados.slice(0,6):[];
    if(list.length){
      html+='<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--CZ);margin-bottom:8px">Últimas faturas</div>';
      list.forEach(function(c){
        var venc=c.vencimento?(function(){var p=c.vencimento.split('-');return p[2]+'/'+p[1]+'/'+p[0];})():'—';
        var stMap={RECEIVED:'✅ Pago',CONFIRMED:'✅ Pago',PENDING:'🕐 Pendente',OVERDUE:'⚠️ Vencida',CANCELLED:'✕ Cancelada'};
        var stColor={RECEIVED:'#4ADE80',CONFIRMED:'#4ADE80',PENDING:'#FBBF24',OVERDUE:'#F87171',CANCELLED:'#6B7280'};
        var st=stMap[c.status]||c.status||'—';
        var stClr=stColor[c.status]||'var(--CZ)';
        var val='R$'+((c.valor||0)/100).toFixed(2);
        var tipoIco={'PIX':'⚡','BOLETO':'🏦','CREDIT_CARD':'💳'}[c.tipo]||'';
        html+='<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--s2);border-radius:8px;margin-bottom:6px">';
        html+='<div><div style="font-size:12px;font-weight:700;color:var(--MR)">'+tipoIco+' '+val+'</div><div style="font-size:11px;color:var(--CZ)">Venc: '+venc+'</div></div>';
        html+='<div style="text-align:right"><div style="font-size:12px;font-weight:700;color:'+stClr+'">'+st+'</div>';
        if((c.status==='PENDING'||c.status==='OVERDUE')&&c.pix_copia_cola&&metodo==='PIX'){
          html+='<button onclick="copiarPixPainel(\''+c.pix_copia_cola.replace(/[\'`]/g,'')+'\',this)" style="margin-top:4px;padding:4px 10px;background:var(--primary);border:none;border-radius:6px;color:#fff;font-size:11px;font-weight:700;cursor:pointer">⚡ Copiar PIX</button>';
        }
        if((c.status==='PENDING'||c.status==='OVERDUE')&&c.link_pagamento&&metodo!=='PIX'){
          var lblLink={'BOLETO':'🏦 Ver boleto','CREDIT_CARD':'💳 Pagar'}[metodo]||'Ver fatura';
          html+='<a href="'+c.link_pagamento+'" target="_blank" style="display:block;margin-top:4px;padding:4px 10px;background:var(--primary);border-radius:6px;color:#fff;font-size:11px;font-weight:700;text-decoration:none">'+lblLink+'</a>';
        }
        html+='</div></div>';
      });
    }else{
      html+='<div style="font-size:13px;color:var(--CZ);text-align:center;padding:12px">Nenhuma fatura encontrada.</div>';
    }
    html+='<button onclick="_tabOk.pagamentos=false;navTab(\'pagamentos\',null)" style="width:100%;padding:10px;background:none;border:1px solid var(--bd);border-radius:10px;color:var(--CZ);font-size:12px;font-weight:700;cursor:pointer;margin-top:10px">Gerenciar assinatura →</button>';
    html+='</div>';
    el.innerHTML=html;
  }catch(e){el.innerHTML='<div class="perfil-card"><div style="color:var(--CZ);font-size:12px">Financeiro indisponível.</div></div>';}
}

function copiarPixPainel(pix,btn){
  navigator.clipboard.writeText(pix).then(function(){
    var orig=btn.textContent;btn.textContent='✓ Copiado!';btn.style.background='#4ADE80';
    setTimeout(function(){btn.textContent=orig;btn.style.background='';},2000);
  }).catch(function(){toast('Copie manualmente: '+pix,'ok');});
}

function cpLink(){
  var url=BASE+'/agendar.html?slug='+S.slug;
  navigator.clipboard.writeText(url).then(function(){
    var el=document.getElementById('cpAg');
    if(el){el.textContent='Copiado!';setTimeout(function(){el.textContent='Copiar';},2000);}
    toast('Link copiado! ✓','ok');
  });
}

/* ─── PAGAMENTOS (aba separada) ─── */
async function renderPagamentos(){
  _tabOk.pagamentos=true;
  var el=document.getElementById('tb-pagamentos');
  el.innerHTML='<div class="loading">Carregando...</div>';

  var dadosPgto=await api('saloes?slug=eq.'+S.slug+'&select=pix_key,pix_tipo,aceita_dinheiro,aceita_pix,aceita_cartao,aceita_debito,asaas_subscription_id,metodo_assinatura,assinatura_status,plano,sinal_percentual,sinal_obrigatorio,cancelamento_min,mostrar_sinal');
  var d=dadosPgto&&dadosPgto[0]?dadosPgto[0]:{};
  try{
    if(_pw){
      var privPgto=await rpc('obter_dados_privados_salao',{p_slug:S.slug,p_senha:_pw});
      if(privPgto) d=Object.assign({},d,privPgto);
    }
  }catch(_e2){}
  _pgtoState.dinheiro=d.aceita_dinheiro!==false;
  _pgtoState.pix=d.aceita_pix!==false;
  _pgtoState.cartao=!!d.aceita_cartao;
  _pgtoState.debito=!!d.aceita_debito;
  _pgtoState.pixKey=d.pix_key||'';
  _pgtoState.pixTipo=d.pix_tipo||'telefone';
  _pgtoState.mostrarSinal=!!d.mostrar_sinal;
  _pgtoState.sinalObrig=!!d.sinal_obrigatorio;
  _pgtoState.sinalPct=d.sinal_percentual||30;
  _pgtoState.cancelMin=d.cancelamento_min||120;

  var cobrancasPendentes=[];
  try{cobrancasPendentes=await rpc('listar_cobrancas_salao',{p_salao_id:S.id});}catch(_){}
  var primeiraPendente=cobrancasPendentes.filter(function(c){return c.status==='PENDING'||c.status==='OVERDUE';}).shift();

  var plInfo=({basico:{nome:'Básico',cor:'#6B7280',val:'R$35'},pro:{nome:'Equipe',cor:'#3B82F6',val:'R$70'},salao:{nome:'Negócio',cor:'#10B981',val:'R$140'}})[S.plano]||{nome:S.plano,cor:'#ccc',val:'?'};
  var hasAssinatura=!!(d.asaas_subscription_id);
  var statusColor={'ACTIVE':'#4ADE80','INACTIVE':'#6B7280','OVERDUE':'#F87171','PENDING':'#FBBF24'}[d.assinatura_status]||'#6B7280';
  var statusLabel={'ACTIVE':'Ativa ✓','INACTIVE':'Inativa','OVERDUE':'Em atraso ⚠️','PENDING':'Aguardando pagamento','SEM_ASSINATURA':'Sem assinatura'}[d.assinatura_status||'SEM_ASSINATURA']||d.assinatura_status;
  var metodoLabel={'PIX':'💚 PIX','BOLETO':'🏦 Boleto','CREDIT_CARD':'💳 Cartão de Crédito'}[d.metodo_assinatura]||'—';

  var html='';
  html+='<div class="pgto-card" style="margin-bottom:14px">'+
    '<div class="pgto-tit">📋 Assinatura Agenda</div>'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'+
      '<div>'+
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--CZ)">Plano atual</div>'+
        '<div style="font-family:Syne,sans-serif;font-size:20px;font-weight:800;color:'+plInfo.cor+'">'+plInfo.nome+'</div>'+
        '<div style="font-size:12px;color:var(--CZ);font-weight:600">'+plInfo.val+'/mês</div>'+
      '</div>'+
      '<div style="text-align:right">'+
        '<div style="font-size:11px;color:var(--CZ);font-weight:700">Status</div>'+
        '<div style="font-size:13px;font-weight:800;color:'+statusColor+'">'+statusLabel+'</div>'+
        (hasAssinatura?'<div style="font-size:11px;color:var(--CZ);margin-top:2px">'+metodoLabel+'</div>':'')+
      '</div>'+
    '</div>';

  if(S.status==='trial'){
    var diasTrial=S.trial_expira?Math.max(0,Math.round((new Date(S.trial_expira)-new Date())/(1000*60*60*24))):0;
    html+='<div style="background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.3);border-radius:10px;padding:10px 12px;font-size:12px;font-weight:700;color:#FBBF24;margin-bottom:12px">⏳ Trial: '+diasTrial+' dia'+(diasTrial!==1?'s':'')+' restante'+(diasTrial!==1?'s':'')+'</div>';
  }
  if(hasAssinatura){
    html+='<button onclick="cancelarAssinatura()" style="width:100%;padding:10px;background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.3);border-radius:10px;color:#F87171;font-size:12px;font-weight:700;cursor:pointer">✕ Cancelar assinatura</button>';
  }
  html+='</div>';

  if(primeiraPendente&&hasAssinatura){
    var pp=primeiraPendente;
    var ppVal='R$'+((pp.valor||0)/100).toFixed(2);
    var ppVenc=pp.vencimento?(function(){var p=pp.vencimento.split('-');return p[2]+'/'+p[1]+'/'+p[0];})():'—';
    var isVencida=pp.status==='OVERDUE';
    html+='<div class="pgto-card" style="margin-bottom:14px;border:2px solid '+(isVencida?'rgba(248,113,113,.4)':'rgba(251,191,36,.4)')+'">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+
        '<div style="font-size:18px">'+(isVencida?'⚠️':'💳')+'</div>'+
        '<div><div style="font-size:13px;font-weight:800;color:var(--MR)">'+(isVencida?'Fatura vencida':'Pagamento pendente')+'</div>'+
        '<div style="font-size:11px;color:var(--CZ)">'+ppVal+' • Venc. '+ppVenc+'</div></div>'+
      '</div>';
    if(pp.tipo==='PIX'&&pp.pix_copia_cola){
      html+='<button onclick="copiarPixPainel(\''+pp.pix_copia_cola.replace(/[\'`]/g,'')+'\',this)" style="width:100%;padding:11px;background:var(--primary);border:none;border-radius:10px;color:#fff;font-weight:800;font-size:13px;cursor:pointer;margin-bottom:8px">⚡ Copiar código PIX</button>';
      if(pp.link_pagamento)html+='<a href="'+pp.link_pagamento+'" target="_blank" style="display:block;text-align:center;font-size:12px;color:var(--CZ);text-decoration:underline">Ver cobrança completa</a>';
    }else if(pp.link_pagamento){
      var lblLink={'BOLETO':'🏦 Abrir boleto','CREDIT_CARD':'💳 Pagar com cartão'}[pp.tipo]||'Ver cobrança';
      html+='<a href="'+pp.link_pagamento+'" target="_blank" style="display:block;text-align:center;padding:11px;background:var(--primary);border-radius:10px;color:#fff;font-weight:800;font-size:13px;text-decoration:none">'+lblLink+'</a>';
    }
    html+='</div>';
  }

  html+='<div class="pgto-card" style="margin-bottom:14px">'+
    '<div class="pgto-tit">'+(hasAssinatura?'🔄 Alterar forma de pagamento':'🚀 Ativar assinatura recorrente')+'</div>'+
    '<div style="font-size:12px;color:var(--CZ);font-weight:600;margin-bottom:14px;line-height:1.5">Escolha como pagar o plano Agenda todo mês. A cobrança acontece automaticamente no dia 10.</div>'+
    '<div style="margin-bottom:14px">'+
      '<label class="fl">Forma de pagamento</label>'+
      '<div style="display:flex;flex-direction:column;gap:8px">'+
        _metodoBtn('PIX','⚡ PIX','Código gerado no vencimento',d.metodo_assinatura==='PIX'&&hasAssinatura)+
        _metodoBtn('BOLETO','🏦 Boleto Bancário','Enviado por email 5 dias antes do vencimento',d.metodo_assinatura==='BOLETO'&&hasAssinatura)+
        _metodoBtn('CREDIT_CARD','💳 Cartão de Crédito','Débito automático — não precisa fazer nada todo mês',d.metodo_assinatura==='CREDIT_CARD'&&hasAssinatura)+
      '</div>'+
    '</div>'+
    '<div style="background:var(--s2);border-radius:10px;padding:12px;margin-bottom:14px;font-size:12px;color:var(--CZ);line-height:1.6">'+
      '📋 <strong>Faturamento:</strong> '+(d.fat_nome||'não informado')+
      (d.fat_cpf_cnpj?' · CPF/CNPJ: '+d.fat_cpf_cnpj:' <span style="color:#F87171">— sem CPF/CNPJ</span>')+
      '<br><span style="font-size:11px">Edite em <strong>Configurações → Dados de faturamento</strong></span>'+
    '</div>'+
    '<div id="assinaturaErr" style="color:#F87171;font-size:12px;margin-bottom:8px;display:none"></div>'+
    '<button id="btnAssinar" onclick="confirmarAssinatura()" style="width:100%;padding:12px;background:var(--L);border:none;border-radius:10px;color:#fff;font-family:Syne,sans-serif;font-size:14px;font-weight:800;cursor:pointer">'+
      (hasAssinatura?'Alterar método de pagamento':'Assinar agora →')+
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
  if(!fat.fat_cpf_cnpj){if(errEl){errEl.textContent='Preencha o CPF/CNPJ em Configurações → Dados de Faturamento';errEl.style.display='block';}return;}
  if(!fat.fat_nome){if(errEl){errEl.textContent='Preencha o nome em Configurações → Dados de Faturamento';errEl.style.display='block';}return;}
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
      if(btn){btn.disabled=false;btn.textContent='Assinar agora →';}
    }
  }catch(e){
    if(errEl){errEl.textContent='Erro de conexão: '+e.message;errEl.style.display='block';}
    if(btn){btn.disabled=false;btn.textContent='Assinar agora →';}
  }
}

function mostrarPagamentoInline(tipo,link,pixCopiaeCola,valor,nextDue){
  var el=document.getElementById('tb-pagamentos');
  if(!el) return;
  var val=valor?(valor/100).toFixed(2):'—';
  var vencFmt=nextDue?(function(){var p=nextDue.split('-');return p[2]+'/'+p[1]+'/'+p[0];})():'—';
  var html='<div class="pgto-card">';
  html+='<div style="font-size:32px;text-align:center;margin-bottom:8px">✅</div>';
  html+='<div style="font-size:16px;font-weight:800;color:var(--MR);text-align:center;margin-bottom:4px">Assinatura ativada!</div>';
  html+='<div style="font-size:12px;color:var(--CZ);text-align:center;margin-bottom:20px">Cobrança todo dia 10 · R$'+val+' · 1ª parcela vence em '+vencFmt+'</div>';
  if(tipo==='PIX'&&pixCopiaeCola){
    html+='<div style="background:var(--s2);border-radius:12px;padding:14px;margin-bottom:14px">';
    html+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--CZ);margin-bottom:8px">⚡ PIX Copia e Cola — primeira parcela</div>';
    html+='<div style="font-size:11px;color:var(--MR);word-break:break-all;line-height:1.6;font-family:monospace;background:var(--bg);border-radius:8px;padding:10px;margin-bottom:10px">'+pixCopiaeCola+'</div>';
    html+='<button onclick="copiarPixPainel(\''+pixCopiaeCola.replace(/[\'`]/g,'')+'\',this)" style="width:100%;padding:11px;background:var(--primary);border:none;border-radius:10px;color:#fff;font-weight:800;font-size:13px;cursor:pointer">⚡ Copiar código PIX</button>';
    html+='</div>';
    if(link)html+='<a href="'+link+'" target="_blank" style="display:block;text-align:center;font-size:12px;color:var(--CZ);text-decoration:underline;margin-bottom:12px">Ou acesse o link da cobrança</a>';
  }else if(tipo==='BOLETO'&&link){
    html+='<div style="background:var(--s2);border-radius:12px;padding:14px;margin-bottom:14px">';
    html+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--CZ);margin-bottom:10px">🏦 Boleto — primeira parcela</div>';
    html+='<div style="font-size:12px;color:var(--CZ);margin-bottom:12px;line-height:1.5">Seu boleto está pronto. Clique para abrir e pagar pelo app do banco ou casa lotérica.</div>';
    html+='<a href="'+link+'" target="_blank" style="display:block;text-align:center;padding:12px;background:var(--primary);border-radius:10px;color:#fff;font-weight:800;font-size:14px;text-decoration:none">🏦 Abrir boleto</a>';
    html+='</div>';
  }else if(tipo==='CREDIT_CARD'&&link){
    html+='<div style="background:var(--s2);border-radius:12px;padding:14px;margin-bottom:14px">';
    html+='<div style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--CZ);margin-bottom:10px">💳 Cartão de Crédito</div>';
    html+='<div style="font-size:12px;color:var(--CZ);margin-bottom:12px;line-height:1.5">Cadastre seu cartão abaixo. As cobranças mensais acontecem automaticamente.</div>';
    html+='<a href="'+link+'" target="_blank" style="display:block;text-align:center;padding:13px;background:var(--L);border-radius:10px;color:#fff;font-weight:800;font-size:15px;text-decoration:none">💳 Cadastrar cartão agora</a>';
    html+='<div style="font-size:11px;color:var(--CZ);text-align:center;margin-top:8px">🔒 Ambiente seguro Asaas • SSL criptografado</div>';
    html+='</div>';
  }else if(link){
    html+='<a href="'+link+'" target="_blank" style="display:block;text-align:center;padding:12px;background:var(--primary);border-radius:10px;color:#fff;font-weight:800;font-size:14px;text-decoration:none;margin-bottom:12px">Pagar primeira cobrança</a>';
  }
  html+='<button onclick="_tabOk.pagamentos=false;renderPagamentos();" style="width:100%;padding:10px;background:none;border:1px solid var(--bd);border-radius:10px;color:var(--CZ);font-size:12px;font-weight:700;cursor:pointer">Ver detalhes da assinatura</button>';
  html+='</div>';
  el.innerHTML=html;
}

var _cancelAssinaturaStep=false;
async function cancelarAssinatura(){
  if(!_cancelAssinaturaStep){
    _cancelAssinaturaStep=true;
    var btn=document.querySelector('[onclick="cancelarAssinatura()"]');
    if(btn){
      var orig=btn.textContent;
      btn.textContent='Confirmar cancelamento?';
      btn.style.background='rgba(248,113,113,.3)';
      setTimeout(function(){
        _cancelAssinaturaStep=false;
        if(btn){btn.textContent=orig;btn.style.background='';}
      },4000);
    }
    return;
  }
  _cancelAssinaturaStep=false;
  try{
    var r=await fetch(ASAAS_FN,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'cancelar_assinatura',salao_id:S.id})});
    var d=await r.json();
    if(d&&d.ok){toast('Assinatura cancelada.','ok');_tabOk.pagamentos=false;renderPagamentos();}
    else{toast('Erro ao cancelar: '+(d.erro||'tente novamente'),'err');}
  }catch(e){toast('Erro: '+e.message,'err');}
}

function buildPagamentosUI(el){
  var html=
    '<div class="pgto-tit">💳 Formas de pagamento aceitas</div>'+
    '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--CZ);margin-bottom:10px">Métodos aceitos</div>'+
    _formaRow('cartao','💳 Cartão de crédito','Visa, Master, Elo e outros',_pgtoState.cartao)+
    _formaRow('debito','💳 Cartão de débito','Débito à vista',_pgtoState.debito)+
    _formaRow('dinheiro','💵 Dinheiro','Pagamento em espécie',_pgtoState.dinheiro)+
    '<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--bd)">'+
    '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--CZ);margin-bottom:10px">📲 PIX</div>'+
    '<div class="pgto-row" style="margin-bottom:10px"><div class="pgto-lbl">Aceitar PIX</div>'+
    '<button class="pgto-toggle '+(_pgtoState.pix?'on':'')+'" id="tg-pix" onclick="_togglePgtoForma(\'pix\')"></button></div>'+
    '<div id="pixSection" style="'+(_pgtoState.pix?'':'display:none')+'">'+
    '<div class="fg" style="margin:8px 0 0"><label class="fl">Tipo de chave PIX</label><select class="fi" id="pixTipoSel">'+
    ['telefone','email','cpf','cnpj','aleatoria'].map(function(t){
      var lbl={telefone:'Telefone',email:'E-mail',cpf:'CPF',cnpj:'CNPJ',aleatoria:'Chave aleatória'}[t];
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
    '<div class="pgto-row" style="padding-top:10px;border-top:1px solid var(--bd)">'+
      '<div><div style="font-size:12px;font-weight:700;color:var(--MR)">Tornar obrigatório</div>'+
      '<div style="font-size:11px;color:var(--CZ);margin-top:1px">Bloqueia confirmação sem pagamento do sinal</div></div>'+
      '<button class="pgto-toggle '+(_pgtoState.sinalObrig?'on':'')+'" id="tgSinalObrig" onclick="toggleSinalObrig(this)"></button>'+
    '</div>'+
    '</div>'+
    '</div>'+
    '</div>'+
    '<button class="btn-add" style="width:100%;justify-content:center;margin-top:12px;padding:11px" onclick="salvarPagamentos()">Salvar chave PIX</button>';
  el.innerHTML=html;
}


/* ─── GALERIA ─── */
function _htmlGaleria(d){
  var fotos=(d.galeria_fotos||[]);
  var fotosHtml=fotos.map(function(url,i){
    return '<div style="position:relative;aspect-ratio:1;overflow:hidden;border-radius:10px;background:var(--s2)">'+
      '<img src="'+url+'" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy">'+
      '<button onclick="removerFotoGaleria('+i+')" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.6);border:none;border-radius:50%;width:26px;height:26px;color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>'+
    '</div>';
  }).join('');
  return '<div style="padding:14px 16px">'+
    '<div style="font-size:12px;color:var(--CZ);margin-bottom:12px">Adicione até 8 fotos do seu espaço, serviços e trabalhos.</div>'+
    (fotos.length?'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">'+fotosHtml+'</div>':'')+
    (fotos.length<8?'<label style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--s2);border:1.5px dashed var(--bd);border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;color:var(--CZ)">'+
      '<input type="file" accept="image/*" multiple style="display:none" onchange="adicionarFotosGaleria(this)">'+
      '📷 Adicionar fotos</label>':'')+
  '</div>';
}

async function adicionarFotosGaleria(input){
  var files=Array.from(input.files||[]);
  if(!files.length) return;
  var fotos=(S.galeria_fotos||[]).slice();
  var slots=8-fotos.length;
  if(slots<=0){toast('Limite de 8 fotos atingido','warn');return;}
  files=files.slice(0,slots);
  var lbl=input.closest('label');
  if(lbl) lbl.style.opacity='.5';
  try{
    for(var j=0;j<files.length;j++){
      var file=files[j];
      var ext=(file.name||'img').split('.').pop().toLowerCase()||'jpg';
      if(!['jpg','jpeg','png','webp'].includes(ext)) ext='jpg';
      var path=S.id+'/galeria_'+Date.now()+'_'+j+'.'+ext;
      var r=await fetch(SUPA+'/storage/v1/object/fotos-estabelecimentos/'+path,{
        method:'POST',
        headers:{'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':file.type||'image/jpeg','x-upsert':'true'},
        body:file
      });
      if(!r.ok) throw new Error(await r.text());
      fotos.push(SUPA+'/storage/v1/object/public/fotos-estabelecimentos/'+path);
    }
    var pw=await getPw();
    if(!pw){if(lbl)lbl.style.opacity='';toast('Senha necessária','err');return;}
    var ok=await rpc('salvar_json_salao',{p_slug:S.slug,p_senha:pw,p_campo:'galeria_fotos',p_valor:fotos});
    if(!ok){if(lbl)lbl.style.opacity='';toast('Senha incorreta','err');return;}
    S.galeria_fotos=fotos;
    toast('✓ Galeria salva!','ok');
    var secBody=document.getElementById('secbody-galeria');
    if(secBody) secBody.innerHTML=_htmlGaleria(Object.assign({},S));
  }catch(e){
    if(lbl) lbl.style.opacity='';
    toast('Erro no upload: '+e.message,'err');
  }
}

async function removerFotoGaleria(idx){
  var fotos=(S.galeria_fotos||[]).slice();
  fotos.splice(idx,1);
  var pw=await getPw();
  if(!pw){toast('Senha necessária','err');return;}
  try{
    await rpc('salvar_json_salao',{p_slug:S.slug,p_senha:pw,p_campo:'galeria_fotos',p_valor:fotos});
    S.galeria_fotos=fotos;
    toast('Foto removida','ok');
    var secBody=document.getElementById('secbody-galeria');
    if(secBody) secBody.innerHTML=_htmlGaleria(Object.assign({},S));
  }catch(e){toast('Erro ao remover: '+e.message,'err');}
}

/* ─── DIFERENCIAIS ─── */
function _htmlDiferenciais(d){
  var difs=d.diferenciais||[];
  var rows=difs.map(function(df,i){
    return '<div style="display:flex;gap:8px;padding:10px 0;border-bottom:1px solid var(--bd);align-items:flex-start">'+
      '<input class="fi" value="'+esc(df.icone||'⭐')+'" id="dif-ico-'+i+'" style="width:48px;padding:7px;text-align:center;font-size:18px;flex-shrink:0">'+
      '<div style="flex:1;display:flex;flex-direction:column;gap:5px">'+
        '<input class="fi" value="'+esc(df.titulo||'')+'" id="dif-titulo-'+i+'" placeholder="Título">'+
        '<input class="fi" value="'+esc(df.descricao||'')+'" id="dif-desc-'+i+'" placeholder="Descrição curta">'+
      '</div>'+
      '<button onclick="removerDif('+i+')" style="background:var(--red-bg);border:none;border-radius:6px;padding:6px 8px;color:var(--red);font-size:14px;cursor:pointer;flex-shrink:0">✕</button>'+
    '</div>';
  }).join('');
  return '<div style="padding:14px 16px">'+
    '<div style="font-size:12px;color:var(--CZ);margin-bottom:12px">Até 4 diferenciais exibidos no site do seu negócio.</div>'+
    '<div id="difList">'+rows+'</div>'+
    (difs.length<4?'<button class="btn-add" onclick="adicionarDif()" style="margin-top:10px">+ Adicionar diferencial</button>':'')+
    '<button class="btn-add" onclick="salvarDiferenciais()" style="width:100%;justify-content:center;margin-top:12px;padding:11px">Salvar diferenciais</button>'+
  '</div>';
}

function adicionarDif(){
  var list=document.getElementById('difList');if(!list) return;
  var i=list.querySelectorAll('[id^="dif-ico-"]').length;
  var div=document.createElement('div');
  div.style.cssText='display:flex;gap:8px;padding:10px 0;border-bottom:1px solid var(--bd);align-items:flex-start';
  div.innerHTML='<input class="fi" id="dif-ico-'+i+'" value="⭐" style="width:48px;padding:7px;text-align:center;font-size:18px;flex-shrink:0">'+
    '<div style="flex:1;display:flex;flex-direction:column;gap:5px">'+
      '<input class="fi" id="dif-titulo-'+i+'" placeholder="Título">'+
      '<input class="fi" id="dif-desc-'+i+'" placeholder="Descrição curta">'+
    '</div>'+
    '<button onclick="removerDif('+i+')" style="background:var(--red-bg);border:none;border-radius:6px;padding:6px 8px;color:var(--red);font-size:14px;cursor:pointer;flex-shrink:0">✕</button>';
  list.appendChild(div);
}

function _lerDifsDOM(){
  var difs=[]; var i=0;
  while(document.getElementById('dif-ico-'+i)){
    difs.push({icone:document.getElementById('dif-ico-'+i).value,titulo:document.getElementById('dif-titulo-'+i).value,descricao:document.getElementById('dif-desc-'+i).value});
    i++;
  }
  return difs;
}

function removerDif(idx){
  var difs=_lerDifsDOM(); difs.splice(idx,1);
  var list=document.getElementById('difList');if(!list) return;
  list.innerHTML=difs.map(function(df,i){
    return '<div style="display:flex;gap:8px;padding:10px 0;border-bottom:1px solid var(--bd);align-items:flex-start">'+
      '<input class="fi" value="'+esc(df.icone||'⭐')+'" id="dif-ico-'+i+'" style="width:48px;padding:7px;text-align:center;font-size:18px;flex-shrink:0">'+
      '<div style="flex:1;display:flex;flex-direction:column;gap:5px">'+
        '<input class="fi" value="'+esc(df.titulo||'')+'" id="dif-titulo-'+i+'" placeholder="Título">'+
        '<input class="fi" value="'+esc(df.descricao||'')+'" id="dif-desc-'+i+'" placeholder="Descrição curta">'+
      '</div>'+
      '<button onclick="removerDif('+i+')" style="background:var(--red-bg);border:none;border-radius:6px;padding:6px 8px;color:var(--red);font-size:14px;cursor:pointer;flex-shrink:0">✕</button>'+
    '</div>';
  }).join('');
}

async function salvarDiferenciais(){
  var btn=document.querySelector('[onclick="salvarDiferenciais()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var difs=_lerDifsDOM().filter(function(d){return d.titulo.trim();});
  var pw=await getPw();
  if(!pw){if(btn){btn.disabled=false;btn.textContent='Salvar diferenciais';}return;}
  try{
    await rpc('salvar_json_salao',{p_slug:S.slug,p_senha:pw,p_campo:'diferenciais',p_valor:difs});
    S.diferenciais=difs;
    toast('✓ Diferenciais salvos!','ok');
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;}
    toast('Erro ao salvar','err');
  }
  if(btn){btn.disabled=false;btn.textContent='Salvar diferenciais';}
}

/* ─── FAQ ─── */
function _htmlFaq(d){
  var faq=d.faq||[];
  var rows=faq.map(function(f,i){
    return '<div id="faq-row-'+i+'" style="padding:10px 0;border-bottom:1px solid var(--bd)">'+
      '<div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:6px">'+
        '<div style="flex:1"><input class="fi" id="faq-q-'+i+'" value="'+esc(f.pergunta||'')+'" placeholder="Pergunta"></div>'+
        '<button onclick="removerFaq('+i+')" style="background:var(--red-bg);border:none;border-radius:6px;padding:6px 8px;color:var(--red);font-size:14px;cursor:pointer;flex-shrink:0">✕</button>'+
      '</div>'+
      '<textarea class="fi" id="faq-a-'+i+'" rows="2" placeholder="Resposta" style="width:100%;resize:vertical">'+esc(f.resposta||'')+'</textarea>'+
    '</div>';
  }).join('');
  var sugestoes=['Como funciona o agendamento?','Posso cancelar meu horário?','Quais formas de pagamento?','Quanto tempo antes devo chegar?'];
  var sugestoesHtml=sugestoes.filter(function(s){return !faq.some(function(f){return (f.pergunta||'').toLowerCase()===s.toLowerCase();});})
    .map(function(s){return '<button onclick="usarSugestaoFaq(this)" data-q="'+esc(s)+'" style="padding:5px 10px;background:var(--s2);border:1px solid var(--bd);border-radius:6px;font-size:11px;cursor:pointer;color:var(--CZ)">'+esc(s)+'</button>';}).join('');
  return '<div style="padding:14px 16px">'+
    '<div style="font-size:12px;color:var(--CZ);margin-bottom:12px">Responda as dúvidas mais comuns dos seus clientes.</div>'+
    '<div id="faqList">'+rows+'</div>'+
    '<button class="btn-add" onclick="adicionarFaq()" style="margin-top:10px">+ Adicionar pergunta</button>'+
    (sugestoesHtml?'<div style="margin-top:12px;padding:10px;background:var(--s2);border-radius:10px"><div style="font-size:11px;color:var(--CZ);font-weight:700;margin-bottom:8px">Sugestões:</div><div style="display:flex;flex-wrap:wrap;gap:6px">'+sugestoesHtml+'</div></div>':'')+
    '<button class="btn-add" onclick="salvarFaq()" style="width:100%;justify-content:center;margin-top:12px;padding:11px">Salvar FAQ</button>'+
  '</div>';
}

function adicionarFaq(){
  var list=document.getElementById('faqList');if(!list) return;
  var i=list.querySelectorAll('[id^="faq-q-"]').length;
  var div=document.createElement('div');div.id='faq-row-'+i;
  div.style.cssText='padding:10px 0;border-bottom:1px solid var(--bd)';
  div.innerHTML='<div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:6px">'+
    '<div style="flex:1"><input class="fi" id="faq-q-'+i+'" placeholder="Pergunta"></div>'+
    '<button onclick="removerFaq('+i+')" style="background:var(--red-bg);border:none;border-radius:6px;padding:6px 8px;color:var(--red);font-size:14px;cursor:pointer;flex-shrink:0">✕</button>'+
    '</div>'+
    '<textarea class="fi" id="faq-a-'+i+'" rows="2" placeholder="Resposta" style="width:100%;resize:vertical"></textarea>';
  list.appendChild(div);
}

function usarSugestaoFaq(btn){
  adicionarFaq();
  var list=document.getElementById('faqList');if(!list) return;
  var inputs=list.querySelectorAll('[id^="faq-q-"]');
  var last=inputs[inputs.length-1];
  if(last) last.value=btn.dataset.q||'';
}

function _lerFaqDOM(){
  var faq=[]; var i=0;
  while(document.getElementById('faq-q-'+i)){
    faq.push({pergunta:document.getElementById('faq-q-'+i).value,resposta:(document.getElementById('faq-a-'+i)||{value:''}).value});
    i++;
  }
  return faq;
}

function removerFaq(idx){
  var faq=_lerFaqDOM(); faq.splice(idx,1);
  var list=document.getElementById('faqList');if(!list) return;
  list.innerHTML=faq.map(function(f,i){
    return '<div id="faq-row-'+i+'" style="padding:10px 0;border-bottom:1px solid var(--bd)">'+
      '<div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:6px">'+
        '<div style="flex:1"><input class="fi" id="faq-q-'+i+'" value="'+esc(f.pergunta)+'" placeholder="Pergunta"></div>'+
        '<button onclick="removerFaq('+i+')" style="background:var(--red-bg);border:none;border-radius:6px;padding:6px 8px;color:var(--red);font-size:14px;cursor:pointer;flex-shrink:0">✕</button>'+
      '</div>'+
      '<textarea class="fi" id="faq-a-'+i+'" rows="2" placeholder="Resposta" style="width:100%;resize:vertical">'+esc(f.resposta)+'</textarea>'+
    '</div>';
  }).join('');
}

async function salvarFaq(){
  var btn=document.querySelector('[onclick="salvarFaq()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var faq=_lerFaqDOM().filter(function(f){return f.pergunta.trim();});
  var pw=await getPw();
  if(!pw){if(btn){btn.disabled=false;btn.textContent='Salvar FAQ';}return;}
  try{
    await rpc('salvar_json_salao',{p_slug:S.slug,p_senha:pw,p_campo:'faq',p_valor:faq});
    S.faq=faq;
    toast('✓ FAQ salvo!','ok');
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;}
    toast('Erro ao salvar','err');
  }
  if(btn){btn.disabled=false;btn.textContent='Salvar FAQ';}
}

// ═══ PRODUTOS ═══
function _htmlProdutos(d){
  var prods=d.produtos||[];
  var items=prods.map(function(p,i){return _htmlProdItem(p,i);}).join('');
  return '<div style="padding:14px 16px">'+
    '<p style="font-size:13px;color:var(--tx2);margin-bottom:14px">Cadastre produtos vendidos no seu estabelecimento. Clientes podem adicionar ao carrinho e pagar na hora.</p>'+
    '<div id="prodList">'+items+'</div>'+
    '<button onclick="adicionarProduto()" class="btn-add" style="width:100%;margin-top:8px;justify-content:center;padding:10px">+ Adicionar produto</button>'+
    '<div style="margin-top:10px"><button onclick="salvarProdutos()" class="btn-sv">Salvar produtos</button></div>'+
  '</div>';
}

function _htmlProdItem(p, i){
  var fotoHtml=p.foto_url
    ? '<img src="'+esc(p.foto_url)+'" style="width:72px;height:72px;border-radius:10px;object-fit:cover;display:block">'
    : '<div style="font-size:11px;font-weight:600;color:var(--CZ);text-align:center;line-height:1.3;padding:4px">Clique para<br>adicionar<br>foto</div>';
  return '<div id="prod-item-'+i+'" style="border:1.5px solid var(--bd);border-radius:12px;overflow:hidden;margin-bottom:10px">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--s2);border-bottom:1px solid var(--bd)">'+
      '<span style="font-size:12px;font-weight:700;color:var(--tx2)">Produto '+(i+1)+'</span>'+
      '<button onclick="removerProduto('+i+')" class="bsrv" style="font-size:11px;font-weight:700;color:var(--red);border-color:rgba(248,113,113,.25);padding:4px 10px">Remover</button>'+
    '</div>'+
    '<div style="display:flex;gap:12px;padding:14px">'+
      '<div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:4px">'+
        '<div id="prod-foto-prev-'+i+'" onclick="document.getElementById(\'prod-file-'+i+'\').click()" '+
          'style="width:72px;height:72px;border-radius:10px;background:var(--s2);border:1.5px dashed var(--bd);cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center">'+
          fotoHtml+
        '</div>'+
        '<span style="font-size:10px;color:var(--CZ)">JPG / PNG / WebP</span>'+
        '<input type="file" id="prod-file-'+i+'" accept="image/*" style="display:none" onchange="uploadFotoProduto(this,'+i+')">'+
        '<input type="hidden" id="prod-foto-url-'+i+'" data-campo="foto_url" value="'+esc(p.foto_url||'')+'">'+
      '</div>'+
      '<div style="flex:1;display:flex;flex-direction:column;gap:8px">'+
        '<input class="fi" id="prod-nome-'+i+'" data-campo="nome" placeholder="Nome do produto *" value="'+esc(p.nome||'')+'">'+
        '<input class="fi" id="prod-preco-'+i+'" data-campo="preco" type="number" step="0.01" min="0" placeholder="Preço (R$)" value="'+(p.preco?(p.preco/100).toFixed(2):'')+'" style="width:100%">'+
        '<textarea class="fi" id="prod-desc-'+i+'" data-campo="descricao" placeholder="Descrição breve" rows="2" style="resize:none">'+esc(p.descricao||'')+'</textarea>'+
      '</div>'+
    '</div>'+
  '</div>';
}

async function uploadFotoProduto(input, idx){
  var file=input.files&&input.files[0];
  if(!file) return;
  var prev=document.getElementById('prod-foto-prev-'+idx);
  if(prev) prev.style.opacity='.5';
  var ext=(file.name||'img').split('.').pop().toLowerCase()||'jpg';
  if(!['jpg','jpeg','png','webp'].includes(ext)) ext='jpg';
  var path=S.id+'/produto_'+idx+'_'+Date.now()+'.'+ext;
  try{
    var r=await fetch(SUPA+'/storage/v1/object/fotos-estabelecimentos/'+path,{
      method:'POST',
      headers:{'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':file.type||'image/jpeg','x-upsert':'true'},
      body:file
    });
    if(!r.ok) throw new Error(await r.text());
    var publicUrl=SUPA+'/storage/v1/object/public/fotos-estabelecimentos/'+path;
    if(prev){
      prev.style.opacity='';
      prev.innerHTML='<img src="'+publicUrl+'" style="width:72px;height:72px;border-radius:10px;object-fit:cover;display:block">';
    }
    var hidden=document.getElementById('prod-foto-url-'+idx);
    if(hidden) hidden.value=publicUrl;
    toast('✓ Foto carregada!','ok');
  }catch(e){
    if(prev) prev.style.opacity='';
    toast('Erro no upload: '+e.message,'err');
  }
}

function adicionarProduto(){
  var list=document.getElementById('prodList');
  if(!list) return;
  var i=list.querySelectorAll('[id^="prod-item-"]').length;
  var div=document.createElement('div');
  div.innerHTML=_htmlProdItem({icone:'📦',nome:'',descricao:'',preco:0,foto_url:''},i);
  list.appendChild(div.firstChild);
}

function removerProduto(idx){
  var el=document.getElementById('prod-item-'+idx);
  if(el) el.remove();
  _reindexarProdutos();
}

function _reindexarProdutos(){
  var list=document.getElementById('prodList');
  if(!list) return;
  var items=list.querySelectorAll('[id^="prod-item-"]');
  var dados=[];
  items.forEach(function(item){
    var g=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
    var oldIdx=item.id.replace('prod-item-','');
    var precoVal=g('prod-preco-'+oldIdx);
    dados.push({
      icone:'',
      nome:g('prod-nome-'+oldIdx),
      descricao:g('prod-desc-'+oldIdx),
      preco:precoVal?Math.round(parseFloat(precoVal.replace(',','.'))*100):0,
      foto_url:g('prod-foto-url-'+oldIdx)||''
    });
  });
  list.innerHTML=dados.map(function(p,i){return _htmlProdItem(p,i);}).join('');
}

function _lerProdutosDOM(){
  var list=document.getElementById('prodList');
  if(!list) return [];
  var prods=[];
  list.querySelectorAll('[id^="prod-item-"]').forEach(function(item){
    var i=item.id.replace('prod-item-','');
    var g=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
    var nome=g('prod-nome-'+i);
    if(!nome) return;
    var precoVal=g('prod-preco-'+i);
    var preco=precoVal?Math.round(parseFloat(precoVal.replace(',','.'))*100):0;
    prods.push({
      id:nome.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'')+'_'+Date.now(),
      icone:'',
      nome:nome,
      descricao:g('prod-desc-'+i),
      preco:preco,
      foto_url:g('prod-foto-url-'+i)||null
    });
  });
  return prods;
}

async function salvarProdutos(){
  var btn=document.querySelector('[onclick="salvarProdutos()"]');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}
  var produtos=_lerProdutosDOM();
  var pw=await getPw();
  if(!pw){if(btn){btn.disabled=false;btn.textContent='Salvar produtos';}return;}
  try{
    await rpc('salvar_json_salao',{p_slug:S.slug,p_senha:pw,p_campo:'produtos',p_valor:produtos});
    S.produtos=produtos;
    toast('✓ Produtos salvos!','ok');
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;}
    toast('Erro ao salvar','err');
  }
  if(btn){btn.disabled=false;btn.textContent='Salvar produtos';}
}

function toggleMostrarSinal(btn){
  btn.classList.toggle('on');
  var op=document.getElementById('sinalOpcoes');
  if(op) op.style.display=btn.classList.contains('on')?'':'none';
}

function toggleSinalObrig(btn){btn.classList.toggle('on');}

async function salvarPagamentos(){
  var pw=await getPw();if(!pw) return;
  var pixKey=document.getElementById('pixKeyInput')?document.getElementById('pixKeyInput').value.trim():'';
  var pixTipo=document.getElementById('pixTipoSel')?document.getElementById('pixTipoSel').value:'telefone';
  try{
    await rpc('salvar_pagamento_salao',{p_slug:S.slug,p_senha:pw,p_dinheiro:_pgtoState.dinheiro,p_pix:_pgtoState.pix,p_cartao:_pgtoState.cartao,p_debito:_pgtoState.debito,p_pix_key:pixKey||null,p_pix_tipo:pixTipo});
    toast('✓ Formas de pagamento salvas!','ok');
    var mostrarSinal=document.getElementById('tgMostrarSinal')?document.getElementById('tgMostrarSinal').classList.contains('on'):false;
    var sinalObrig=document.getElementById('tgSinalObrig')?document.getElementById('tgSinalObrig').classList.contains('on'):false;
    var sinalPct=document.getElementById('sliderSinal')?parseInt(document.getElementById('sliderSinal').value):30;
    var cancelMin=document.getElementById('selCancelMin')?parseInt(document.getElementById('selCancelMin').value):120;
    await _patch({mostrar_sinal:mostrarSinal,sinal_obrigatorio:sinalObrig,sinal_percentual:sinalPct,cancelamento_min:cancelMin}).catch(function(){});
    _pgtoState.mostrarSinal=mostrarSinal;_pgtoState.sinalObrig=sinalObrig;_pgtoState.sinalPct=sinalPct;_pgtoState.cancelMin=cancelMin;
    S.sinal_obrigatorio=sinalObrig;S.sinal_percentual=sinalPct;S.cancelamento_min=cancelMin;
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;}
    toast('Erro ao salvar','err');
  }
}
