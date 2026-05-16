/* Agenda Painel — Equipe */
var _profissionais=[], _editProfId=null;
var LIMITE_PLANO={trial:1,basico:1,pro:3,salao:999};

async function renderEquipe(){
  _tabOk.equipe=true;
  var el=document.getElementById('tb-equipe');
  el.innerHTML='<div class="loading">Carregando...</div>';
  var pw=_pw||'';
  try{ _profissionais=await rpc('listar_profissionais',{p_slug:S.slug,p_senha:pw})||[]; }
  catch(e){ _profissionais=[]; }
  var limite=LIMITE_PLANO[S.plano]||1;
  var planoNome={trial:'Trial',basico:'Básico',pro:'Profissional',salao:'Salão'}[S.plano]||S.plano;
  var ativos=_profissionais.filter(function(p){return p.ativo;}).length;
  var isBasico=(S.plano==='basico'||S.plano==='trial');

  var html=
    '<div class="srv-hdr"><h3>'+(isBasico?'Meu Perfil':'Minha Equipe')+'</h3>'+
    (!isBasico&&ativos<limite?'<button class="btn-add" onclick="abrirProf()">+ Adicionar</button>':
     !isBasico?'<span style="font-size:11px;color:var(--CZ);font-weight:700">Limite atingido</span>':'')+
    '</div>';

  if(isBasico){
    html+='<div class="eq-info" style="margin-bottom:12px">Adicione sua foto — ela aparece para os clientes na página de agendamento.</div>';
  } else {
    html+='<div class="eq-limite">Plano '+planoNome+' · '+ativos+' de '+(limite>=999?'ilimitado':limite)+' profissional'+(limite!==1?'is':'')+' ativo'+(ativos!==1?'s':'')+'</div>';
  }

  if(!_profissionais.length){
    if(isBasico){
      html+='<div class="srv-empty"><button class="btn-add" style="width:100%;justify-content:center;padding:14px;font-size:14px" onclick="abrirProf()">📷 Cadastrar meu perfil e foto</button></div>';
    } else {
      html+='<div class="srv-empty">Nenhum profissional cadastrado.<br><strong>Adicione o primeiro membro da equipe!</strong></div>';
    }
  } else {
    _profissionais.forEach(function(p){
      var fotoThumb=p.foto_url
        ? '<img src="'+p.foto_url+'" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--bd)">'
        : '<div class="eq-av" style="font-size:24px">'+(p.ativo?'👤':'😴')+'</div>';
      html+=
        '<div class="eq-card">'+
        '<div style="flex-shrink:0">'+fotoThumb+'</div>'+
        '<div class="eq-info-d">'+
          '<div class="eq-nm">'+esc(p.nome)+(p.ativo?'':'<span class="eq-badge-inativo" style="margin-left:6px">inativo</span>')+'</div>'+
          '<div class="eq-sp">'+esc(p.especialidade||'Profissional')+'</div>'+
        '</div>'+
        '<div class="eq-ctrl">'+
          (isBasico?
            '<button class="bsrv bedit" data-id="'+p.id+'" onclick="abrirProf(this.dataset.id)" style="padding:8px 14px;font-size:12px;font-weight:700">📷 Editar foto</button>':
            ((!isBasico&&S.plano!=='trial'?'<button class="bsrv" data-id="'+p.id+'" onclick="copiarLinkProf(this.dataset.id)" title="Copiar link" style="background:rgba(45,106,79,.12);color:var(--VD)">🔗</button>':'')+
            '<button class="bsrv bedit" data-id="'+p.id+'" onclick="abrirProf(this.dataset.id)">✏️</button>'+
            '<button class="bsrv bdel" data-id="'+p.id+'" onclick="excluirProf(this.dataset.id)">🗑️</button>'+
            '<button class="toggle '+(p.ativo?'on':'')+'" data-id="'+p.id+'" onclick="toggleProf(this.dataset.id)"></button>')
          )+
        '</div></div>';
    });
  }
  el.innerHTML=html;
}

async function abrirProf(id){
  id=id||null;
  if(!id && typeof verificarLimite==='function' && !verificarLimite('profissional_extra')) return;
  _editProfId=id; _fotoFile=null; _fotoUrlOriginal=null;
  var p=id?_profissionais.find(function(x){return x.id===id;}):null;
  var isBasico=(S.plano==='basico'||S.plano==='trial');
  var titulo=isBasico?'Meu Perfil':(id?'Editar Profissional':'Novo Profissional');

  // Load linked services for this profissional
  var profServicosAtivos={};
  if(id){
    try{
      var ps=await api('profissional_servicos?profissional_id=eq.'+id+'&select=servico_id,ativo');
      if(Array.isArray(ps)) ps.forEach(function(r){ profServicosAtivos[r.servico_id]=r.ativo!==false; });
    }catch(e){}
  }

  var comissaoVal=p&&p.comissao_pct!=null?p.comissao_pct:50;
  var html=
    '<div class="mhdr"><h3>'+titulo+'</h3><button class="mclose" onclick="fecharProf()">✕</button></div>'+
    '<div class="merr" id="profErr"></div>'+
    '<div class="fg"><label class="fl">Nome *</label><input class="fi" type="text" id="profNome" placeholder="Nome do profissional" value="'+esc(p?p.nome:'')+'" maxlength="60"></div>'+
    '<div class="fg"><label class="fl">Especialidade</label><input class="fi" type="text" id="profEsp" placeholder="Ex: Barbeiro, Cabeleireiro" value="'+esc(p&&p.especialidade?p.especialidade:'')+'" maxlength="60"></div>'+
    (!isBasico?'<div class="fg"><label class="fl">Comissão (%)</label><input class="fi" type="number" id="profComissao" min="0" max="100" step="1" value="'+comissaoVal+'" style="width:120px"></div>':'')+
    '<div class="fg">'+
      '<label class="fl">Foto do profissional</label>'+
      '<div class="foto-wrap">'+
        '<div class="foto-preview" id="fotoPreview" style="'+(p&&p.foto_url?'background-image:url('+p.foto_url+');background-size:cover;background-position:center':'')+'">'+(p&&p.foto_url?'':'<span style="font-size:24px">👤</span>')+'</div>'+
        '<div class="foto-btns">'+
          '<label class="btn-foto" for="fotoInput">📷 Escolher foto</label>'+
          '<input type="file" id="fotoInput" accept="image/jpeg,image/jpg,image/png,image/webp" style="display:none" onchange="previewFoto(this)">'+
          (p&&p.foto_url?'<button class="btn-foto btn-foto-del" onclick="removerFoto()">🗑️ Remover</button>':'')+
        '</div>'+
      '</div>'+
    '</div>';

  // Service toggles (only when editing existing profissional in non-basico plan)
  if(id && !isBasico && typeof _servicos!=='undefined' && _servicos.length){
    html+='<div class="fg"><label class="fl">Serviços disponíveis</label>'+
      '<div style="display:flex;flex-direction:column;gap:6px;margin-top:4px">';
    _servicos.forEach(function(s){
      var ativo=profServicosAtivos.hasOwnProperty(s.id)?profServicosAtivos[s.id]:true;
      html+='<label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:7px;background:var(--bg-card);border:1px solid var(--sep);cursor:pointer">'+
        '<input type="checkbox" data-srv="'+s.id+'" '+(ativo?'checked':'')+' onchange="toggleProfServico(\''+id+'\',\''+s.id+'\',this.checked)" style="width:16px;height:16px;accent-color:var(--brand)">'+
        '<span style="font-size:13px;font-weight:600;color:var(--text)">'+esc(s.nome)+'</span>'+
        '</label>';
    });
    html+='</div></div>';
  }

  html+='<button class="btn-sv" onclick="salvarProf()">Salvar</button>';
  var ov=document.getElementById('ovSrv');
  ov.querySelector('.modal').innerHTML=html;
  ov.classList.add('show');
}

async function fecharProf(){document.getElementById('ovSrv').classList.remove('show');}

async function toggleProfServico(profId, servicoId, ativo){
  try{
    await api('profissional_servicos',{
      method:'POST',
      headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({profissional_id:profId,servico_id:servicoId,ativo:ativo})
    });
  }catch(e){ toast('Erro ao salvar serviço: '+e.message,'err'); }
}

/* ─── FOTO ─── */
var _fotoFile=null;
var _fotoUrlOriginal=null;

function previewFoto(input){
  var file=input.files[0];
  if(!file) return;
  if(file.size>5*1024*1024){alert('Foto deve ter menos de 5MB');input.value='';return;}
  _fotoFile=file;
  var reader=new FileReader();
  reader.onload=function(e){
    var prev=document.getElementById('fotoPreview');
    if(prev){prev.style.backgroundImage='url('+e.target.result+')';prev.style.backgroundSize='cover';prev.style.backgroundPosition='center';prev.innerHTML='';}
  };
  reader.readAsDataURL(file);
}

function removerFoto(){
  _fotoFile=null; _fotoUrlOriginal='__remover__';
  var prev=document.getElementById('fotoPreview');
  if(prev){prev.style.backgroundImage='none';prev.innerHTML='<span style="font-size:24px">👤</span>';}
}

async function _uploadFotoProf(salaoId,profId){
  if(!_fotoFile) return _fotoUrlOriginal==='__remover__'?null:undefined;
  var ext=(_fotoFile.name||'img').split('.').pop().toLowerCase()||'jpg';
  if(!['jpg','jpeg','png','webp'].includes(ext)) ext='jpg';
  var path=salaoId+'/prof_'+profId+'_'+Date.now()+'.'+ext;
  try{
    var r=await fetch(SUPA+'/storage/v1/object/fotos-estabelecimentos/'+path,{
      method:'POST',
      headers:{
        'apikey':KEY,
        'Authorization':'Bearer '+KEY,
        'Content-Type':_fotoFile.type||'image/jpeg',
        'x-upsert':'true'
      },
      body:_fotoFile
    });
    if(!r.ok){var err=await r.text();console.error('[foto-prof] upload failed',err);toast('Erro no upload da foto','err');return undefined;}
    return SUPA+'/storage/v1/object/public/fotos-estabelecimentos/'+path;
  }catch(e){console.error('[foto-prof] upload error',e);toast('Erro no upload: '+e.message,'err');return undefined;}
}

/* ─── SALVAR PROFISSIONAL ─── */
async function salvarProf(){
  var nome=(document.getElementById('profNome')||{}).value||'';
  var esp=(document.getElementById('profEsp')||{}).value||'';
  var errEl=document.getElementById('profErr');
  if(!nome.trim()){if(errEl){errEl.textContent='Informe o nome.';errEl.style.display='block';}return;}
  var pw=await getPw(); if(!pw)return;
  var btn=document.querySelector('.btn-sv');
  if(btn){btn.disabled=true;btn.textContent='Salvando...';}

  var comissaoEl=document.getElementById('profComissao');
  var comissaoPct=comissaoEl?parseFloat(comissaoEl.value)||null:null;

  try{
    if(_editProfId){
      // Upload foto se mudou
      var fotoUrl=await _uploadFotoProf(S.id,_editProfId);
      var upd={nome:nome.trim(),especialidade:esp.trim()||null};
      if(comissaoPct!=null) upd.comissao_pct=comissaoPct;
      if(fotoUrl!==undefined) upd.foto_url=fotoUrl;
      await rpc('atualizar_profissional',{p_slug:S.slug,p_senha:pw,p_prof_id:_editProfId,p_dados:upd});
      var idx=_profissionais.findIndex(function(x){return x.id===_editProfId;});
      if(idx>=0) _profissionais[idx]=Object.assign(_profissionais[idx],upd);
    } else {
      // Novo profissional: cria primeiro, depois faz upload com o id gerado
      var novo=await rpc('criar_profissional',{p_slug:S.slug,p_senha:pw,p_nome:nome.trim(),p_especialidade:esp.trim()||null});
      if(novo&&novo.id){
        var fotoUrlNovo=await _uploadFotoProf(S.id,novo.id);
        if(fotoUrlNovo!==undefined){
          await rpc('atualizar_profissional',{p_slug:S.slug,p_senha:pw,p_prof_id:novo.id,p_dados:{foto_url:fotoUrlNovo}});
          novo.foto_url=fotoUrlNovo;
        }
        _profissionais.push(novo);
      }
    }
    fecharProf();
    toast('\u2713 Salvo!','ok');
    _tabOk.equipe=false;
    renderEquipe();
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='Salvar';}
    if(errEl){
      errEl.textContent=e.message&&e.message.includes('Acesso negado')?'Senha incorreta':('Erro: '+e.message);
      errEl.style.display='block';
    }
    if(e.message&&e.message.includes('Acesso negado')) _pw=null;
  }
}

/* ─── TOGGLE ATIVO ─── */
async function toggleProf(id){
  var p=_profissionais.find(function(x){return x.id===id;});
  if(!p) return;
  var pw=await getPw(); if(!pw)return;
  try{
    await rpc('atualizar_profissional',{p_slug:S.slug,p_senha:pw,p_prof_id:id,p_dados:{ativo:!p.ativo}});
    p.ativo=!p.ativo;
    _tabOk.equipe=false; renderEquipe();
  }catch(e){toast('Erro: '+e.message,'err');}
}

/* ─── EXCLUIR ─── */
async function excluirProf(id){
  if(!confirm('Excluir profissional? Esta ação não pode ser desfeita.')) return;
  var pw=await getPw(); if(!pw)return;
  try{
    await rpc('excluir_profissional',{p_slug:S.slug,p_senha:pw,p_prof_id:id});
    _profissionais=_profissionais.filter(function(x){return x.id!==id;});
    _tabOk.equipe=false; renderEquipe();
    toast('\u2713 Profissional excluído','ok');
  }catch(e){toast('Erro: '+e.message,'err');}
}

/* ─── COPIAR LINK ─── */
function copiarLinkProf(id){
  var url=BASE+'/agendar.html?slug='+S.slug+'&prof='+id;
  navigator.clipboard.writeText(url).then(function(){toast('Link copiado! \u2713','ok');});
}
