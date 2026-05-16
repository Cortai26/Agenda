/* ═══ PRESETS DE SERVIÇOS POR CATEGORIA ═══ */
var SERVICO_PRESETS = {
  barbearia: {
    label:'💈 Barbearia / Salão',
    servicos:[
      {icone:'💈',nome:'Corte de cabelo',preco:3500,dur:30},
      {icone:'🪒',nome:'Barba',preco:2500,dur:20},
      {icone:'✂️',nome:'Corte + Barba',preco:5500,dur:50},
      {icone:'🎨',nome:'Coloração',preco:8000,dur:90},
      {icone:'💆',nome:'Hidratação',preco:4500,dur:40},
      {icone:'👑',nome:'Pacote completo',preco:9000,dur:80},
    ]
  },
  estetica: {
    label:'💅 Estética / Maquiagem',
    servicos:[
      {icone:'💅',nome:'Manicure',preco:3500,dur:45},
      {icone:'🦶',nome:'Pedicure',preco:4000,dur:50},
      {icone:'💅',nome:'Manicure + Pedicure',preco:7000,dur:90},
      {icone:'✨',nome:'Maquiagem social',preco:12000,dur:60},
      {icone:'👰',nome:'Maquiagem noiva',preco:35000,dur:120},
      {icone:'💆',nome:'Limpeza de pele',preco:8000,dur:60},
      {icone:'🌸',nome:'Depilação',preco:5000,dur:45},
      {icone:'👁️',nome:'Design de sobrancelha',preco:3500,dur:30},
      {icone:'🧴',nome:'Extensão de cílios',preco:15000,dur:90},
    ]
  },
  saude: {
    label:'🦷 Saúde / Clínica',
    servicos:[
      {icone:'🦷',nome:'Consulta odontológica',preco:20000,dur:60},
      {icone:'🪥',nome:'Limpeza dental',preco:25000,dur:60},
      {icone:'🦷',nome:'Restauração',preco:30000,dur:60},
      {icone:'✨',nome:'Clareamento dental',preco:80000,dur:90},
      {icone:'🩺',nome:'Consulta médica',preco:25000,dur:30},
      {icone:'💉',nome:'Aplicação de botox',preco:60000,dur:45},
      {icone:'🏥',nome:'Avaliação',preco:15000,dur:30},
    ]
  },
  domestico: {
    label:'🏠 Serviços Domésticos',
    servicos:[
      {icone:'🧹',nome:'Faxina completa',preco:20000,dur:240},
      {icone:'🧺',nome:'Passagem de roupa',preco:5000,dur:120},
      {icone:'🍳',nome:'Cozinheira do dia',preco:18000,dur:360},
      {icone:'🧼',nome:'Limpeza pós-obra',preco:35000,dur:480},
      {icone:'👶',nome:'Babá por hora',preco:2500,dur:60},
      {icone:'🌱',nome:'Jardinagem',preco:8000,dur:180},
      {icone:'🐕',nome:'Pet sitter',preco:8000,dur:480},
    ]
  },
  bem_estar: {
    label:'🧘 Bem-estar / Terapias',
    servicos:[
      {icone:'💆',nome:'Massagem relaxante',preco:12000,dur:60},
      {icone:'💆',nome:'Massagem terapêutica',preco:15000,dur:60},
      {icone:'🧘',nome:'Sessão de yoga',preco:8000,dur:60},
      {icone:'🌿',nome:'Acupuntura',preco:15000,dur:50},
      {icone:'💧',nome:'Drenagem linfática',preco:12000,dur:60},
      {icone:'⚡',nome:'Eletroestimulação',preco:10000,dur:45},
      {icone:'🧖',nome:'Spa facial',preco:20000,dur:90},
    ]
  },
  pet: {
    label:'🐾 Pet Shop / Veterinário',
    servicos:[
      {icone:'🛁',nome:'Banho e tosa',preco:8000,dur:120},
      {icone:'✂️',nome:'Tosa higiênica',preco:4500,dur:60},
      {icone:'🦷',nome:'Limpeza dental pet',preco:15000,dur:60},
      {icone:'💉',nome:'Vacinação',preco:8000,dur:20},
      {icone:'🩺',nome:'Consulta veterinária',preco:20000,dur:30},
    ]
  },
  personal: {
    label:'💪 Personal / Treinador',
    servicos:[
      {icone:'💪',nome:'Treino personal (1h)',preco:15000,dur:60},
      {icone:'🏃',nome:'Avaliação física',preco:10000,dur:60},
      {icone:'📋',nome:'Montagem de treino',preco:8000,dur:45},
      {icone:'🧘',nome:'Pilates',preco:10000,dur:50},
      {icone:'🤸',nome:'Aula de dança',preco:8000,dur:60},
    ]
  },
  dentista: {
    label:'🦷 Dentista / Odontologia',
    servicos:[
      {icone:'🦷',nome:'Consulta avaliativa',preco:20000,dur:30},
      {icone:'🪥',nome:'Limpeza e profilaxia',preco:25000,dur:60},
      {icone:'✨',nome:'Clareamento dental',preco:80000,dur:90},
      {icone:'🦷',nome:'Restauração',preco:30000,dur:60},
      {icone:'😁',nome:'Aparelho ortodôntico',preco:250000,dur:60},
      {icone:'🏥',nome:'Extração',preco:35000,dur:45},
    ]
  },
  cuidador: {
    label:'🧓 Cuidador de Idosos',
    servicos:[
      {icone:'🧓',nome:'Cuidado diurno (4h)',preco:20000,dur:240},
      {icone:'🧓',nome:'Cuidado diurno (8h)',preco:35000,dur:480},
      {icone:'🌙',nome:'Cuidado noturno',preco:30000,dur:720},
      {icone:'💊',nome:'Acompanhamento médico',preco:15000,dur:120},
      {icone:'🏃',nome:'Fisioterapia domiciliar',preco:18000,dur:60},
      {icone:'📋',nome:'Avaliação inicial',preco:10000,dur:60},
    ]
  },
  limpeza: {
    label:'🧹 Limpeza / Faxina',
    servicos:[
      {icone:'🧹',nome:'Faxina residencial',preco:20000,dur:240},
      {icone:'🧹',nome:'Faxina completa',preco:35000,dur:480},
      {icone:'🧽',nome:'Limpeza pós-obra',preco:45000,dur:480},
      {icone:'🧺',nome:'Lavanderia / Roupa',preco:8000,dur:120},
      {icone:'🌱',nome:'Jardinagem',preco:10000,dur:180},
      {icone:'🪟',nome:'Limpeza de vidros',preco:15000,dur:120},
    ]
  }
};

function fecharPresets(){var m=document.getElementById('presetModal');if(m)m.style.display='none';}
function abrirPresets(){
  var ov=document.getElementById('presetModal');
  if(ov){ ov.style.display='flex'; return; }
  // Create modal on demand
  ov=document.createElement('div');
  ov.id='presetModal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:600;display:flex;align-items:flex-end;justify-content:center';
  var inner='<div style="background:var(--BG-card,var(--surface,#fff));border-radius:20px 20px 0 0;padding:20px;width:100%;max-width:480px;max-height:80vh;overflow-y:auto">';
  inner+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">';
  inner+='<div style="font-family:var(--font-d,sans-serif);font-size:17px;font-weight:800;color:var(--MR,#1a1008)">🚀 Adicionar serviços prontos</div>';
  inner+='<button onclick="fecharPresets()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--CZ)">×</button>';
  inner+='</div>';
  inner+='<div style="font-size:12px;color:var(--CZ);margin-bottom:16px">Selecione uma categoria para adicionar serviços pré-configurados.</div>';

  Object.keys(SERVICO_PRESETS).forEach(function(key){
    var cat=SERVICO_PRESETS[key];
    inner+='<div style="margin-bottom:12px;border:1.5px solid var(--bd,#e5e2dc);border-radius:12px;overflow:hidden">';
    inner+='<div style="padding:12px 14px;font-size:13px;font-weight:800;color:var(--MR);background:var(--s2,#f5f4f2)">'+cat.label+'</div>';
    inner+='<div style="padding:8px 14px 12px;display:flex;flex-wrap:wrap;gap:6px">';
    cat.servicos.forEach(function(s,si){
      var dKey='data-cat="'+key+'" data-idx="'+si+'"';
      inner+='<button '+dKey+' onclick="var b=this;adicionarPreset(b.dataset.cat,parseInt(b.dataset.idx))" ';
      inner+='style="background:var(--primary-light,rgba(255,92,26,.08));border:1px solid var(--primary-shadow,rgba(255,92,26,.2));';
      inner+='border-radius:20px;padding:5px 10px;font-size:12px;font-weight:700;cursor:pointer;color:var(--L,#FF5C1A)">';
      inner+=s.icone+' '+s.nome+'</button>';
    });
    inner+='</div></div>';
  });

  inner+='</div>';
  ov.innerHTML=inner;
  ov.onclick=function(e){if(e.target===this)this.style.display='none';};
  document.body.appendChild(ov);
}

async function adicionarPreset(catKey, idx){
  var cat=SERVICO_PRESETS[catKey];
  var preset=cat.servicos[idx];
  if(!preset) return;
  var pw=await getPw('Adicionar serviço','Confirme sua senha para adicionar: '+preset.icone+' '+preset.nome);
  if(!pw) return;
  try{
    await rpc('adicionar_servico',{p_slug:S.slug,p_senha:pw,
      p_nome:preset.nome,p_preco:preset.preco,
      p_duracao:preset.dur,p_icone:preset.icone,
      p_descricao:null,p_ordem:99});
    toast('✓ '+preset.icone+' '+preset.nome+' adicionado!','ok');
    document.getElementById('presetModal').style.display='none';
    _tabOk.servicos=false; renderServicos();
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;}
    toast('Erro: '+e.message,'err');
  }
}

/* Agenda Painel — Serviços */
/* ═══ SERVIÇOS ═══ */
async function carregarServicos(){
  try{
    var r=await rpc('listar_servicos_dono',{p_slug:S.slug,p_senha:_pw||''});
    _servicos=Array.isArray(r)?r:[];
  }catch(e){
    try{_servicos=await api('servicos?salao_id=eq.'+S.id+'&order=ordem')||[];}catch(e2){_servicos=[];}
  }
}
async function renderServicos(){
  _tabOk.servicos=true;
  var el=document.getElementById('tb-servicos');
  var strip=renderProfStrip();

  if(_profFiltro){
    // ── MODO PROFISSIONAL: todos os serviços com toggle ON/OFF para esse prof ──
    var prof=_profs.find(function(p){return p.id===_profFiltro;});
    var profNome=prof?prof.nome:'Profissional';
    var psMap={};
    var prMap={};
    try{
      var psRows=await api('profissional_servicos?profissional_id=eq.'+_profFiltro+'&select=servico_id,ativo,preco_override');
      if(Array.isArray(psRows)){
        psRows.forEach(function(r){
          psMap[r.servico_id]=r.ativo!==false;
          if(r.preco_override!=null) prMap[r.servico_id]=r.preco_override;
        });
      }
    }catch(e){}

    var html=strip+
      '<div class="srv-hdr"><h3>Serviços de '+esc(profNome.split(' ')[0])+'</h3></div>'+
      '<div style="font-size:12px;color:var(--text-3);margin-bottom:12px;line-height:1.5">'+
        'Ative os serviços que este profissional realiza. O preço individual pode ser ajustado.'+
      '</div>'+
      '<div class="lista">';

    var ativoCount=0;
    _servicos.forEach(function(s){
      var habilitado=psMap[s.id]!==false;
      if(habilitado) ativoCount++;
      var precoEfetivo=prMap[s.id]!=null?prMap[s.id]:s.preco;
      var precoLabel=formatPrice(precoEfetivo)+(prMap[s.id]!=null?' <span style="font-size:9px;color:var(--text-3);font-weight:600">personalizado</span>':'');
      html+='<div class="srv-card'+(habilitado?'':' inativo')+'">'+
        '<div class="srv-ico">'+s.icone+'</div>'+
        '<div class="srv-dados">'+
          '<div class="srv-nm">'+esc(s.nome)+'</div>'+
          '<div class="srv-mt">⏱ '+s.duracao+' min</div>'+
        '</div>'+
        '<div class="srv-pr" style="cursor:pointer" onclick="editarPrecoProf(\''+_profFiltro+'\',\''+s.id+'\','+precoEfetivo+',\''+esc(s.nome)+'\')" title="Ajustar preço">'+precoLabel+'</div>'+
        '<div class="srv-ctrl">'+
          '<button class="toggle '+(habilitado?'on':'')+'" onclick="toggleProfServico(\''+_profFiltro+'\',\''+s.id+'\','+habilitado+')"></button>'+
        '</div>'+
      '</div>';
    });

    html+='</div>';
    html+='<div style="font-size:11px;color:var(--text-3);font-weight:700;margin-top:8px;text-align:center">'+
      ativoCount+' de '+_servicos.length+' habilitado'+(ativoCount!==1?'s':'')+'</div>';
    el.innerHTML=html;
    return;
  }

  // ── MODO ESTABELECIMENTO: lista padrão ──
  var ativos=_servicos.filter(function(s){return s.ativo;}).length;
  var html=strip+
    '<div class="srv-hdr"><h3>Meus Serviços</h3><button class="btn-add" onclick="abrirSrv()">+ Adicionar</button></div>'+
    '<div class="srv-info-txt">Serviços <strong>ativos</strong> aparecem na sua página. Use o botão para mostrar ou ocultar.</div>'+
    '<div style="font-size:11px;color:var(--text-3);font-weight:700;margin-bottom:10px;text-align:center">'+ativos+' de '+_servicos.length+' visível'+(ativos!==1?'s':'')+'</div>'+
    '<div class="lista">';

  if(_servicos.length===0){
    html+='<div class="srv-empty">Nenhum serviço ainda.<br><strong>Toque em "+ Adicionar" para começar!</strong></div>';
  } else {
    _servicos.forEach(function(s){
      html+='<div class="srv-card'+(s.ativo?'':' inativo')+'">'+
        '<div class="srv-ico">'+s.icone+'</div>'+
        '<div class="srv-dados"><div class="srv-nm">'+esc(s.nome)+(s.ativo?'':'<span class="toculto">oculto</span>')+'</div>'+
        '<div class="srv-mt">⏱ '+s.duracao+' min'+(s.descricao?' · '+esc(s.descricao):'')+'</div></div>'+
        '<div class="srv-pr">'+formatPrice(s.preco)+'</div>'+
        '<div class="srv-ctrl">'+
          '<button class="bsrv bedit" onclick="abrirSrv(\''+s.id+'\')">✏️</button>'+
          '<button class="bsrv bdel" onclick="excluirSrv(\''+s.id+'\')">🗑️</button>'+
          '<button class="toggle '+(s.ativo?'on':'')+'" onclick="toggleSrv(\''+s.id+'\')"></button>'+
        '</div>'+
      '</div>';
    });
  }
  html+='</div>';
  el.innerHTML=html;
}

async function toggleProfServico(profId, svcId, atualAtivo){
  var pw=await getPw('Serviços do profissional','Confirme sua senha para alterar o serviço.');
  if(!pw) return;
  try{
    var novoAtivo=!atualAtivo;
    await api('profissional_servicos',{
      method:'POST',
      headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({profissional_id:profId,servico_id:svcId,ativo:novoAtivo})
    });
    toast(novoAtivo?'✓ Serviço habilitado':'✓ Serviço desabilitado','ok');
    _tabOk.servicos=false; renderServicos();
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;}
    toast('Erro: '+e.message,'err');
  }
}

async function editarPrecoProf(profId, svcId, precoAtual, svcNome){
  var atual=(precoAtual/100).toFixed(2).replace('.',',');
  var input=prompt('Preço de '+svcNome+' para este profissional (deixe vazio para usar o padrão):', atual);
  if(input===null) return;
  var pw=await getPw('Preço personalizado','Confirme sua senha.');
  if(!pw) return;
  try{
    var novoPreco=null;
    if(input.trim()!==''){
      novoPreco=Math.round(parseFloat(input.replace(',','.'))*100);
      if(isNaN(novoPreco)||novoPreco<=0){toast('Preço inválido.','err');return;}
    }
    await api('profissional_servicos',{
      method:'POST',
      headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({profissional_id:profId,servico_id:svcId,preco_override:novoPreco})
    });
    toast('✓ Preço atualizado','ok');
    _tabOk.servicos=false; renderServicos();
  }catch(e){
    if(e.message&&e.message.includes('Acesso negado')){_pw=null;}
    toast('Erro: '+e.message,'err');
  }
}
var _tipoServico='atendimento';

async function abrirSrv(id){
  id=id||null; _editSrvId=id;
  var s=id?_servicos.find(function(x){return x.id===id;}):null;
  _tipoServico=(s&&s.tipo==='evento')?'evento':'atendimento';
  document.getElementById('srvTit').textContent=id?'Editar Serviço':'Novo Serviço';
  document.getElementById('srvNome').value=s?s.nome:'';
  document.getElementById('srvDesc').value=s&&s.descricao?s.descricao:'';
  document.getElementById('srvPreco').value=s?s.preco/100:'';
  document.getElementById('srvDur').value=s?s.duracao:30;
  var errEl=document.getElementById('srvErr');
  if(errEl){errEl.style.display='none';errEl.classList.remove('show');}
  _icoSel=s?s.icone:'📋'; buildIcones();
  _renderTipoServico(s);
  document.getElementById('ovSrv').classList.add('show');
  setTimeout(function(){document.getElementById('srvNome').focus();},300);
}

function _renderTipoServico(s){
  var wrap=document.getElementById('srvTipoWrap');
  if(!wrap) return;
  var isEv=_tipoServico==='evento';
  wrap.innerHTML=
    '<div style="padding:0 16px 12px">'+
    '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-3);margin-bottom:8px">Tipo</div>'+
    '<div style="display:flex;gap:8px;background:var(--surface-2);border-radius:10px;padding:4px;margin-bottom:12px">'+
      '<button onclick="setTipoServico(\'atendimento\')" style="flex:1;padding:8px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:700;background:'+(isEv?'transparent':'var(--primary)')+';color:'+(isEv?'var(--text-3)':'#fff')+'">🗓️ Atendimento</button>'+
      '<button onclick="setTipoServico(\'evento\')" style="flex:1;padding:8px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:700;background:'+(isEv?'var(--primary)':'transparent')+';color:'+(isEv?'#fff':'var(--text-3)')+'">🎟️ Evento</button>'+
    '</div>'+
    '<div id="srvEventoCampos" style="display:'+(isEv?'block':'none')+'">'+
      '<div class="two" style="padding:0">'+
        '<div class="fg"><label class="fl">Data do evento</label><input class="fi" type="date" id="eventoData" value="'+(s&&s.evento_data?s.evento_data:'')+'"></div>'+
        '<div class="fg"><label class="fl">Horário</label><input class="fi" type="time" id="eventoHora" value="'+(s&&s.evento_hora?s.evento_hora.substring(0,5):'')+'"></div>'+
      '</div>'+
      '<div class="two" style="padding:0">'+
        '<div class="fg"><label class="fl">Vagas máx.</label><input class="fi" type="number" id="eventoVagas" value="'+(s&&s.vagas_max?s.vagas_max:10)+'" min="1" max="9999" style="width:80px"></div>'+
        '<div class="fg"><label class="fl">Local</label><input class="fi" type="text" id="eventoLocal" value="'+(s&&s.evento_local?s.evento_local:'')+'" placeholder="Endereço ou online"></div>'+
      '</div>'+
    '</div>'+
    '</div>';
}

function setTipoServico(tipo){
  _tipoServico=tipo;
  var campos=document.getElementById('srvEventoCampos');
  if(campos) campos.style.display=tipo==='evento'?'block':'none';
  var btns=document.querySelectorAll('#srvTipoWrap button');
  if(btns.length>=2){
    btns[0].style.background=tipo==='atendimento'?'var(--primary)':'transparent';
    btns[0].style.color=tipo==='atendimento'?'#fff':'var(--text-3)';
    btns[1].style.background=tipo==='evento'?'var(--primary)':'transparent';
    btns[1].style.color=tipo==='evento'?'#fff':'var(--text-3)';
  }
}
window.setTipoServico=setTipoServico;
async function fecharSrv(){document.getElementById('ovSrv').classList.remove('show');_editSrvId=null;}
async function buildIcones(){
  var icEl = document.getElementById('iconGrid');
  if(!icEl) return;
  icEl.innerHTML=ICONES.map(function(ic){
    return '<button type="button" class="ico-btn'+(ic===_icoSel?' sel':'')+'" onclick="selIco(\''+ic+'\')">'+ic+'</button>';
  }).join('');
  icEl.style.display = 'grid';
}
async function selIco(ic){_icoSel=ic;buildIcones();}

async function salvarServico(){
  console.log('[salvarServico] iniciado');
  var btn=document.getElementById('btnSvSrv'), err=document.getElementById('srvErr');
  if(!err||!btn){console.error('[salvarServico] elementos não encontrados');return;}
  err.style.display='none'; err.classList.remove('show');
  var nome=document.getElementById('srvNome').value.trim();
  var precoVal=document.getElementById('srvPreco').value.trim();
  var preco=parseFloat(precoVal);
  var dur=parseInt(document.getElementById('srvDur').value);
  var desc=document.getElementById('srvDesc').value.trim();
  if(!nome){err.textContent='Informe o nome.';err.style.display='block';return;}
  if(!precoVal||isNaN(preco)||preco<=0){err.textContent='Preço inválido.';err.style.display='block';return;}
  if(isNaN(dur)||dur<10){err.textContent='Duração mínima: 10 min.';err.style.display='block';return;}
  console.log('[salvarServico] validação OK, pedindo senha...');
  var pw=await getPw();
  if(!pw){console.warn('[salvarServico] senha cancelada');return;}
  console.log('[salvarServico] senha obtida, salvando...');
  btn.disabled=true; btn.textContent='Salvando...';
  try{
    if(!_icoSel) _icoSel = '📋';
    var precoCentavos = Math.round(preco*100);
    var extraEvento = {};
    if(_tipoServico==='evento'){
      extraEvento={
        tipo:'evento',
        evento_data:document.getElementById('eventoData')?document.getElementById('eventoData').value||null:null,
        evento_hora:document.getElementById('eventoHora')?document.getElementById('eventoHora').value||null:null,
        vagas_max:document.getElementById('eventoVagas')?parseInt(document.getElementById('eventoVagas').value)||10:10,
        evento_local:document.getElementById('eventoLocal')?document.getElementById('eventoLocal').value.trim()||null:null,
      };
    } else {
      extraEvento={tipo:'atendimento'};
    }
    if(_editSrvId){
      var atual=_servicos.find(function(s){return s.id===_editSrvId;});
      await rpc('atualizar_servico',{p_slug:S.slug,p_senha:pw,p_servico_id:_editSrvId,p_icone:_icoSel,p_nome:nome,p_descricao:desc||null,p_preco:precoCentavos,p_duracao:dur,p_ativo:atual?atual.ativo:true,...extraEvento});
    } else {
      await rpc('adicionar_servico',{p_slug:S.slug,p_senha:pw,p_icone:_icoSel,p_nome:nome,p_descricao:desc||null,p_preco:precoCentavos,p_duracao:dur,p_ordem:_servicos.length+1,...extraEvento});
    }
    console.log('[salvarServico] sucesso!');
    fecharSrv(); await carregarServicos(); _tabOk.servicos=false; renderServicos(); toast('✓ Serviço salvo!','ok');
  }catch(e){
    console.error('[salvarServico] erro:', e);
    if(e.message && e.message.includes('Acesso negado')){_pw=null;err.textContent='Senha incorreta.';}
    else err.textContent='Erro: '+(e.message || 'Desconhecido');
    err.style.display='block';
  }
  btn.disabled=false; btn.textContent='Salvar';
}
async function toggleSrv(id){
  var pw=await getPw(); if(!pw)return;
  try{await rpc('toggle_servico',{p_slug:S.slug,p_senha:pw,p_servico_id:id});await carregarServicos();_tabOk.servicos=false;renderServicos();}
  catch(e){if(e.message.includes('Acesso negado')){_pw=null;}alert('Erro: '+e.message);}
}
async function excluirSrv(id){
  var srv=_servicos.find(function(s){return s.id===id;});
  if(!confirm('Excluir "'+(srv?srv.nome:'serviço')+'"?'))return;
  var pw=await getPw(); if(!pw)return;
  try{await rpc('excluir_servico',{p_slug:S.slug,p_senha:pw,p_servico_id:id});await carregarServicos();_tabOk.servicos=false;renderServicos();}
  catch(e){if(e.message.includes('Acesso negado')){_pw=null;}alert('Erro: '+e.message);}
}
document.addEventListener('DOMContentLoaded', function(){
  var _ovSrv=document.getElementById('ovSrv');
  if(_ovSrv) _ovSrv.addEventListener('click',function(e){if(e.target===this)fecharSrv();});
});


