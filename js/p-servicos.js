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
function renderServicos(){
  _tabOk.servicos=true;
  var el=document.getElementById('tb-servicos');
  var ativos=_servicos.filter(function(s){return s.ativo;}).length;
  var html='<div class="srv-hdr"><h3>Meus Serviços</h3><button class="btn-add" onclick="abrirSrv()">+ Adicionar</button></div>';
  html+='<div class="srv-info-txt">Serviços <strong>ativos</strong> aparecem na sua página. Use ⚪/🟢 para mostrar ou ocultar.</div>';
  html+='<div style="font-size:11px;color:var(--text-3);font-weight:700;margin-bottom:10px;text-align:center">'+ativos+' de '+_servicos.length+' visível'+(ativos!==1?'s':'')+'</div>';
  html+='<div class="lista">';
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
        '</div></div>';
    });
  }
  html+='</div>';
  el.innerHTML=html;
}
async function abrirSrv(id){
  id=id||null; _editSrvId=id;
  var s=id?_servicos.find(function(x){return x.id===id;}):null;
  document.getElementById('srvTit').textContent=id?'Editar Serviço':'Novo Serviço';
  document.getElementById('srvNome').value=s?s.nome:'';
  document.getElementById('srvDesc').value=s&&s.descricao?s.descricao:'';
  document.getElementById('srvPreco').value=s?s.preco/100:'';
  document.getElementById('srvDur').value=s?s.duracao:30;
  var errEl=document.getElementById('srvErr');
  if(errEl){errEl.style.display='none';errEl.classList.remove('show');}
  _icoSel=s?s.icone:'📋'; buildIcones();
  document.getElementById('ovSrv').classList.add('show');
  setTimeout(function(){document.getElementById('srvNome').focus();},300);
}
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
    if(_editSrvId){
      var atual=_servicos.find(function(s){return s.id===_editSrvId;});
      await rpc('atualizar_servico',{p_slug:S.slug,p_senha:pw,p_servico_id:_editSrvId,p_icone:_icoSel,p_nome:nome,p_descricao:desc||null,p_preco:precoCentavos,p_duracao:dur,p_ativo:atual?atual.ativo:true});
    } else {
      await rpc('adicionar_servico',{p_slug:S.slug,p_senha:pw,p_icone:_icoSel,p_nome:nome,p_descricao:desc||null,p_preco:precoCentavos,p_duracao:dur,p_ordem:_servicos.length+1});
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


