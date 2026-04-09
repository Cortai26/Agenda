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

  var planoAtual = S.plano||'basico';
  var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">';
  html += '<div style="font-family:var(--font-d);font-size:18px;font-weight:800;color:var(--text)">🚀 Escolha seu plano</div>';
  html += '<button onclick="fecharUpgrade()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-3)">✕</button>';
  html += '</div>';
  html += '<div style="font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:16px;text-align:center">Plano atual: <b style="color:var(--primary)">'+PLANOS_INFO[planoAtual].nome+'</b></div>';

  Object.entries(PLANOS_INFO).forEach(function(kv){
    var id=kv[0], p=kv[1];
    var atual = id===planoAtual;
    html += '<div style="border:2px solid '+(atual?'var(--primary)':'var(--surface-2)')+';border-radius:14px;padding:16px;margin-bottom:12px;background:'+(atual?'rgba(255,92,26,.04)':'#fff')+'">';
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

async function iniciarUpgrade(planoNovo){
  // Pede CPF/CNPJ
  var cpf = prompt('Para gerar a cobrança, informe seu CPF ou CNPJ (só números):');
  if(!cpf||cpf.replace(/\D/g,'').length<11){toast('CPF/CNPJ inválido','erro');return;}

  // Pede quantidade de meses
  var mesesOpts = ['1 mês','3 meses','6 meses','12 meses'];
  var mesesNum  = [1,3,6,12];
  var escolha = 0;
  // Usa confirm como fallback simples
  var meses=1;
  var opcao = prompt('Quantos meses?\n1 = 1 mês\n2 = 3 meses\n3 = 6 meses\n4 = 12 meses\n\nDigite o número:');
  if(opcao==='2') meses=3;
  else if(opcao==='3') meses=6;
  else if(opcao==='4') meses=12;

  fecharUpgrade();

  toast('Gerando cobrança...','ok');

  // Valida no banco primeiro
  var val = await rpc('validar_upgrade_plano',{p_slug:S.slug,p_senha:_pw||'',p_plano:planoNovo});
  if(!val||!val.ok){toast(val?.erro||'Erro ao validar plano','erro');return;}

  // Chama edge function de billing
  var tipo = 'PIX';
  try{
    var r = await fetch('https://acldrisohnjfekjxgmoh.supabase.co/functions/v1/asaas-billing',{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbGRyaXNvaG5qZmVranhnbW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODA1MzcsImV4cCI6MjA4OTE1NjUzN30.etojz12x1oVNvbW_fPeVpNx2OFuJ72C1YioFBlCLS2Y'},
      body:JSON.stringify({
        action:'criar_cobranca',
        salao_id:val.salao_id,
        plano:planoNovo,
        meses:meses,
        tipo:tipo,
        cpf_cnpj:cpf.replace(/\D/g,''),
        nome:val.nome,
        email:val.email||undefined,
        telefone:val.telefone||undefined
      })
    });
    var d=await r.json();
    if(!d.ok){toast('Erro ao gerar cobrança: '+(d.erro||''),'erro');return;}

    // Exibe modal de sucesso com PIX
    abrirModalPix(d, planoNovo, meses);
  }catch(e){
    toast('Erro de conexão','erro');
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
