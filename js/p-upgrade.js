/* Agenda Painel — Upgrade de Plano */
/* ═══ UPGRADE ═══ */

var PLANOS_INFO = {
  basico:  {nome:'Solo',     preco:35,  profs:1,   cor:'#6B7280', features:['1 profissional','Agendamento online','Link próprio']},
  pro:     {nome:'Equipe',preco:70, profs:3,   cor:'#3B82F6', features:['Até 3 profissionais','Tudo do Básico','Analytics de conversão','Personalização visual']},
  salao:{nome:'Negócio',      preco:140, profs:999, cor:'#10B981', features:['Profissionais ilimitados','Tudo do Pro','Prioridade no suporte']},
};

var _upModal = null;

function abrirUpgrade(){
  if(_upModal) return;
  var overlay=document.createElement('div');
  overlay.id='upgradeOverlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:flex-end;justify-content:center;padding:0 0 env(safe-area-inset-bottom,0)';

  var modal=document.createElement('div');
  modal.style.cssText='background:var(--surface);border-radius:20px 20px 0 0;padding:24px 20px 36px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto';

  var planoAtual = PLANOS_INFO[S.plano] ? S.plano : null;
  var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">';
  html += '<div style="font-family:var(--font-d);font-size:18px;font-weight:800;color:var(--text)">🚀 Escolha seu plano</div>';
  html += '<button onclick="fecharUpgrade()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-3)">✕</button>';
  html += '</div>';
  html += '<div style="font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:16px;text-align:center">'+(planoAtual?'Plano atual: <b style="color:var(--primary)">'+PLANOS_INFO[planoAtual].nome+'</b>':'Escolha um plano para continuar')+'</div>';

  Object.entries(PLANOS_INFO).forEach(function(kv){
    var id=kv[0], p=kv[1];
    var atual = id===planoAtual;
    html += '<div style="border:2px solid '+(atual?'var(--primary)':'var(--surface-2)')+';border-radius:14px;padding:16px;margin-bottom:12px;background:'+(atual?'rgba(255,92,26,.04)':'var(--surface-2)')+'">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
    html += '<div style="font-family:var(--font-d);font-size:16px;font-weight:800;color:'+p.cor+'">'+p.nome+'</div>';
    html += '<div style="font-size:20px;font-weight:900;color:var(--text);font-family:var(--font-d)">R$ '+p.preco+'<span style="font-size:11px;font-weight:600;color:var(--text-3)">/mês</span></div>';
    html += '</div>';
    html += '<div style="font-size:12px;color:var(--text-3);margin-bottom:12px;font-weight:600">'+p.profs+(p.profs===999?'+ profissionais':p.profs===1?' profissional':' profissionais')+'</div>';
    p.features.forEach(function(f){
      html += '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:4px">✓ '+f+'</div>';
    });
    if(!atual){
      html += '<button onclick="iniciarUpgrade(\''+id+'\')" style="width:100%;margin-top:12px;padding:12px;background:'+p.cor+';color:#fff;border:none;border-radius:10px;font-family:var(--font-d);font-size:14px;font-weight:800;cursor:pointer">Assinar '+p.nome+'</button>';
    } else {
      html += '<div style="text-align:center;margin-top:12px;font-size:12px;font-weight:800;color:var(--primary)">✓ Plano atual</div>';
    }
    html += '</div>';
  });

  modal.innerHTML = html;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  _upModal = overlay;
  overlay.addEventListener('click', function(e){if(e.target===overlay)fecharUpgrade();});
}

function fecharUpgrade(){
  if(_upModal){_upModal.remove();_upModal=null;}
}

function iniciarUpgrade(planoNovo){
  var info = PLANOS_INFO[planoNovo];
  // Preenche com dados de faturamento já cadastrados
  var nomePreench  = (S.fat_nome || S.responsavel || '');
  var emailPreench = (S.fat_email || S.email || '');
  var cpfPreench   = _mascaraCpfCnpj(S.fat_cpf_cnpj || '');

  var overlay2 = document.createElement('div');
  overlay2.id  = 'upgStep2Overlay';
  overlay2.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);z-index:1001;display:flex;align-items:flex-end;justify-content:center;padding:0 0 env(safe-area-inset-bottom,0)';

  overlay2.innerHTML =
    '<div id="upgStep2" style="background:var(--surface);border-radius:20px 20px 0 0;padding:24px 20px 36px;width:100%;max-width:480px;max-height:92vh;overflow-y:auto">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
        '<button onclick="_fecharStep2()" style="background:none;border:none;font-size:15px;cursor:pointer;color:var(--text-3);padding:4px 8px 4px 0">← Voltar</button>' +
        '<button onclick="_fecharStep2()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-3)">✕</button>' +
      '</div>' +
      // Resumo do plano
      '<div style="background:var(--surface-2);border-radius:12px;padding:14px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">' +
        '<div>' +
          '<div style="font-family:var(--font-d);font-size:15px;font-weight:800;color:'+info.cor+'">'+info.nome+'</div>' +
          '<div style="font-size:11px;color:var(--text-3);font-weight:600;margin-top:2px">'+info.profs+(info.profs===999?'+ profissionais':info.profs===1?' profissional':' profissionais')+'</div>' +
        '</div>' +
        '<div style="font-family:var(--font-d);font-size:22px;font-weight:900;color:var(--text)">R$'+info.preco+'<span style="font-size:11px;font-weight:600;color:var(--text-3)">/mês</span></div>' +
      '</div>' +
      // Tipo de cobrança
      '<div style="margin-bottom:18px">' +
        '<div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Tipo de cobrança</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
          '<label id="upgLblAvulso" style="border:2px solid var(--primary);border-radius:12px;padding:12px;cursor:pointer;text-align:center;background:rgba(229,90,12,.06)">' +
            '<input type="radio" name="upgTipo" value="avulso" checked onchange="_upgTipoChange()" style="display:none">' +
            '<div style="font-size:18px;margin-bottom:4px">⚡</div>' +
            '<div style="font-family:var(--font-d);font-size:13px;font-weight:800;color:var(--text)">PIX único</div>' +
            '<div style="font-size:10px;color:var(--text-3);font-weight:600">Escolha quantos meses</div>' +
          '</label>' +
          '<label id="upgLblRecorrente" style="border:2px solid var(--surface-2);border-radius:12px;padding:12px;cursor:pointer;text-align:center">' +
            '<input type="radio" name="upgTipo" value="recorrente" onchange="_upgTipoChange()" style="display:none">' +
            '<div style="font-size:18px;margin-bottom:4px">♻️</div>' +
            '<div style="font-family:var(--font-d);font-size:13px;font-weight:800;color:var(--text)">Recorrente</div>' +
            '<div style="font-size:10px;color:var(--text-3);font-weight:600">Débito mensal automático</div>' +
          '</label>' +
        '</div>' +
      '</div>' +
      // Meses (só para avulso)
      '<div id="upgMesesWrap" style="margin-bottom:18px">' +
        '<div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Período</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px" id="upgMesesGrid">' +
          _mesesBtn(1,'upgM1',true) + _mesesBtn(3,'upgM3',false) + _mesesBtn(6,'upgM6',false) + _mesesBtn(12,'upgM12',false) +
        '</div>' +
      '</div>' +
      // Dados de faturamento
      '<div style="margin-bottom:18px">' +
        '<div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Dados de faturamento</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px">' +
          '<input id="upgNome" type="text" placeholder="Nome completo *" value="'+_escAttr(nomePreench)+'" style="'+_inputStyle()+'">' +
          '<input id="upgCpf" type="tel" placeholder="CPF ou CNPJ *" maxlength="18" value="'+_escAttr(cpfPreench)+'" oninput="_maskCpfInput(this)" style="'+_inputStyle()+'">' +
          '<input id="upgEmail" type="email" placeholder="E-mail" value="'+_escAttr(emailPreench)+'" style="'+_inputStyle()+'">' +
        '</div>' +
      '</div>' +
      '<div id="upgErr" style="color:var(--red,#dc2626);font-size:12px;font-weight:700;margin-bottom:10px;display:none"></div>' +
      '<button id="upgSubmitBtn" onclick="_submeterUpgrade(\''+planoNovo+'\')" style="width:100%;padding:16px;background:var(--primary);color:#fff;border:none;border-radius:12px;font-family:var(--font-d);font-size:15px;font-weight:800;cursor:pointer">Gerar cobrança</button>' +
    '</div>';

  document.body.appendChild(overlay2);
  overlay2.addEventListener('click', function(e){ if(e.target===overlay2) _fecharStep2(); });
  // Focar no primeiro campo vazio
  setTimeout(function(){
    if(!nomePreench) document.getElementById('upgNome')?.focus();
    else if(!cpfPreench) document.getElementById('upgCpf')?.focus();
  }, 100);
}

function _inputStyle(){
  return 'width:100%;padding:12px 14px;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;font-weight:600;font-family:var(--font-b,inherit);box-sizing:border-box';
}
function _escAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }
function _mesesBtn(m, id, ativo){
  var label = m===1?'1 mês':m+' meses';
  var ativeStyle = ativo?'border-color:var(--primary);background:rgba(229,90,12,.06)':'border-color:var(--surface-2)';
  return '<label id="'+id+'" style="border:2px solid;'+ativeStyle+';border-radius:10px;padding:10px 4px;cursor:pointer;text-align:center;transition:border-color .15s">' +
    '<input type="radio" name="upgMeses" value="'+m+'" '+(ativo?'checked':'')+' onchange="_upgMesesChange()" style="display:none">' +
    '<div style="font-family:var(--font-d);font-size:13px;font-weight:800;color:var(--text)">'+label+'</div>' +
    '</label>';
}
function _upgTipoChange(){
  var tipo = document.querySelector('input[name="upgTipo"]:checked')?.value || 'avulso';
  var lA = document.getElementById('upgLblAvulso');
  var lR = document.getElementById('upgLblRecorrente');
  var mW = document.getElementById('upgMesesWrap');
  if(lA){ lA.style.borderColor = tipo==='avulso' ? 'var(--primary)' : 'var(--surface-2)'; lA.style.background = tipo==='avulso' ? 'rgba(229,90,12,.06)' : ''; }
  if(lR){ lR.style.borderColor = tipo==='recorrente' ? 'var(--primary)' : 'var(--surface-2)'; lR.style.background = tipo==='recorrente' ? 'rgba(229,90,12,.06)' : ''; }
  if(mW) mW.style.display = tipo==='recorrente' ? 'none' : '';
  var btn = document.getElementById('upgSubmitBtn');
  if(btn) btn.textContent = tipo==='recorrente' ? 'Ativar cobrança recorrente' : 'Gerar cobrança';
}
function _upgMesesChange(){
  ['upgM1','upgM3','upgM6','upgM12'].forEach(function(id){
    var el = document.getElementById(id);
    if(!el) return;
    var inp = el.querySelector('input');
    var ativo = inp && inp.checked;
    el.style.borderColor = ativo ? 'var(--primary)' : 'var(--surface-2)';
    el.style.background   = ativo ? 'rgba(229,90,12,.06)' : '';
  });
}
function _mascaraCpfCnpj(v){
  var d = (v||'').replace(/\D/g,'');
  if(d.length <= 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4');
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5');
}
function _maskCpfInput(el){
  var d = el.value.replace(/\D/g,'').slice(0,14);
  if(d.length<=11) el.value=d.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
  else el.value=d.replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/(\d{3})\.(\d{4})(\d)/,'$1.$2/$3').replace(/(\d{4})(\d{1,2})$/,'$1-$2');
}
function _fecharStep2(){
  var o = document.getElementById('upgStep2Overlay');
  if(o) o.remove();
}

async function _submeterUpgrade(planoNovo){
  var errEl = document.getElementById('upgErr');
  var btn   = document.getElementById('upgSubmitBtn');
  var nome  = (document.getElementById('upgNome')?.value || '').trim();
  var cpfRaw= (document.getElementById('upgCpf')?.value  || '').replace(/\D/g,'');
  var email = (document.getElementById('upgEmail')?.value|| '').trim();
  var tipo  = document.querySelector('input[name="upgTipo"]:checked')?.value || 'avulso';
  var meses = parseInt(document.querySelector('input[name="upgMeses"]:checked')?.value || '1');

  errEl.style.display = 'none';
  if(!nome){ errEl.textContent='Nome é obrigatório'; errEl.style.display='block'; return; }
  if(cpfRaw.length < 11){ errEl.textContent='CPF ou CNPJ inválido'; errEl.style.display='block'; return; }

  btn.disabled = true; btn.textContent = 'Aguarde...';

  try{
    // Validar no banco
    var val = await rpc('validar_upgrade_plano',{p_slug:S.slug,p_senha:_pw||'',p_plano:planoNovo});
    if(!val||!val.ok){
      errEl.textContent = val?.erro || 'Erro ao validar. Tente novamente.';
      errEl.style.display = 'block';
      btn.disabled=false; btn.textContent='Gerar cobrança';
      return;
    }

    var body = {
      salao_id:  val.salao_id,
      plano:     planoNovo,
      cpf_cnpj:  cpfRaw,
      nome:      nome,
      email:     email || val.email || undefined,
      telefone:  val.telefone || undefined,
    };

    var d;
    if(tipo === 'recorrente'){
      body.action = 'criar_assinatura';
      body.cycle  = 'MONTHLY';
      var r = await fetch(ASAAS_FN,{method:'POST',headers:{'Content-Type':'application/json','apikey':KEY},body:JSON.stringify(body)});
      d = await r.json();
      if(!d||!d.ok){ errEl.textContent='Erro: '+(d?.erro||'Tente novamente'); errEl.style.display='block'; btn.disabled=false; btn.textContent='Ativar cobrança recorrente'; return; }
      _fecharStep2();
      fecharUpgrade();
      toast('♻️ Assinatura recorrente ativada! A cobrança mensal via PIX foi configurada.','ok');
    } else {
      body.action = 'criar_cobranca';
      body.meses  = meses;
      body.tipo   = 'PIX';
      var r2 = await fetch(ASAAS_FN,{method:'POST',headers:{'Content-Type':'application/json','apikey':KEY},body:JSON.stringify(body)});
      d = await r2.json();
      if(!d||!d.ok){ errEl.textContent='Erro: '+(d?.erro||'Tente novamente'); errEl.style.display='block'; btn.disabled=false; btn.textContent='Gerar cobrança'; return; }
      _fecharStep2();
      fecharUpgrade();
      abrirModalPix(d, planoNovo, meses);
    }
  }catch(e){
    errEl.textContent = 'Erro de conexão: '+e.message;
    errEl.style.display = 'block';
    btn.disabled=false; btn.textContent = tipo==='recorrente'?'Ativar cobrança recorrente':'Gerar cobrança';
  }
}

function abrirModalPix(d, plano, meses){
  var info = PLANOS_INFO[plano];
  var valor = 'R$ '+(d.valor/100).toFixed(2);
  var overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1001;display:flex;align-items:center;justify-content:center;padding:20px';
  var modal=document.createElement('div');
  modal.style.cssText='background:var(--surface);border-radius:20px;padding:24px;width:100%;max-width:400px;text-align:center';
  modal.innerHTML=
    '<div style="font-family:var(--font-d);font-size:18px;font-weight:800;color:var(--text);margin-bottom:4px">🎉 Cobrança gerada!</div>'+
    '<div style="font-size:13px;color:var(--text-3);font-weight:700;margin-bottom:20px">Plano '+info.nome+' · '+meses+(meses===1?' mês':' meses')+' · '+valor+'</div>';

  if(d.pix_copia_cola){
    var pixDiv=document.createElement('div');
    pixDiv.style.cssText='background:#f0f8f0;border-radius:10px;padding:14px;font-size:11px;font-weight:700;color:#2D6A4F;word-break:break-all;cursor:pointer;margin-bottom:16px;text-align:left';
    pixDiv.textContent=d.pix_copia_cola.substring(0,100)+'...';
    pixDiv.onclick=function(){
      navigator.clipboard.writeText(d.pix_copia_cola).then(function(){toast('PIX copiado! ✓');});
    };
    modal.appendChild(pixDiv);
    var btnCopy=document.createElement('button');
    btnCopy.style.cssText='width:100%;padding:13px;background:var(--green);color:#fff;border:none;border-radius:10px;font-family:var(--font-d);font-size:14px;font-weight:800;cursor:pointer;margin-bottom:8px';
    btnCopy.textContent='📋 Copiar PIX copia e cola';
    btnCopy.onclick=function(){navigator.clipboard.writeText(d.pix_copia_cola).then(function(){toast('PIX copiado! ✓');});};
    modal.appendChild(btnCopy);
  }

  if(d.link){
    var btnLink=document.createElement('a');
    btnLink.href=d.link;btnLink.target='_blank';
    btnLink.style.cssText='display:block;padding:13px;background:var(--primary);color:#fff;border-radius:10px;font-family:var(--font-d);font-size:14px;font-weight:800;text-decoration:none;margin-bottom:8px';
    btnLink.textContent='🔗 Ver cobrança completa';
    modal.appendChild(btnLink);
  }

  var info2=document.createElement('div');
  info2.style.cssText='font-size:11px;color:var(--text-3);font-weight:600;margin-bottom:16px;line-height:1.6';
  info2.textContent='Após o pagamento ser confirmado, seu plano será atualizado automaticamente.';
  modal.appendChild(info2);

  var btnClose=document.createElement('button');
  btnClose.style.cssText='width:100%;padding:12px;background:var(--surface-2);color:var(--text);border:none;border-radius:10px;font-family:var(--font-d);font-size:14px;font-weight:800;cursor:pointer';
  btnClose.textContent='Fechar';
  btnClose.onclick=function(){overlay.remove();};
  modal.appendChild(btnClose);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
