/* Agenda Painel — Analytics */
var _analyticsDias=30;
var _campClis=[];

async function renderAnalytics(){
  _tabOk.analytics=true;
  var el=document.getElementById('tb-analytics');
  if(!el) return;
  el.innerHTML='<div class="loading">Carregando analytics...</div>';
  try{
    var hoje=new Date();
    var d0=new Date(hoje.getTime()-_analyticsDias*86400000);
    var d0s=d0.getFullYear()+'-'+String(d0.getMonth()+1).padStart(2,'0')+'-'+String(d0.getDate()).padStart(2,'0');
    var d1s=hoje.getFullYear()+'-'+String(hoje.getMonth()+1).padStart(2,'0')+'-'+String(hoje.getDate()).padStart(2,'0');

    var data=await rpc('get_analytics',{p_salao_id:S.id,p_inicio:d0s,p_fim:d1s});
    if(!data){el.innerHTML='<div class="empty">Sem dados para este período.</div>';return;}

    var html='<div class="wrap">';

    // Period selector
    html+='<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap" id="periodoSelector"></div>';

    // KPIs
    html+='<div class="analytics-grid">';
    html+='<div class="akpi"><div class="akpi-n">'+(data.total_agendamentos||0)+'</div><div class="akpi-l">Agendamentos</div></div>';
    html+='<div class="akpi"><div class="akpi-n">'+formatPrice(data.faturamento_total||0)+'</div><div class="akpi-l">Faturamento</div></div>';
    html+='<div class="akpi"><div class="akpi-n">'+(data.novos_clientes||0)+'</div><div class="akpi-l">Clientes novos</div></div>';
    html+='<div class="akpi"><div class="akpi-n">'+Math.round(data.taxa_conclusao||0)+'%</div><div class="akpi-l">Taxa conclusão</div></div>';
    html+='</div>';

    // Ticket médio
    if(data.ticket_medio){
      html+='<div class="speech-box">🎯 Ticket médio: <strong>'+formatPrice(data.ticket_medio)+'</strong></div>';
    }

    // Serviços mais pedidos
    if(data.servicos_top&&data.servicos_top.length>0){
      html+='<div class="lista" style="margin-bottom:12px">';
      html+='<div class="lista-hdr"><h3>✂️ Serviços mais pedidos</h3></div>';
      data.servicos_top.forEach(function(s){
        html+='<div class="ag-card" style="flex-direction:column;gap:4px">'+
          '<div style="display:flex;justify-content:space-between;width:100%">'+
          '<span style="font-size:13px;font-weight:700;color:var(--text)">'+esc(s.nome||s.servico_nome||'—')+'</span>'+
          '<span style="font-size:13px;font-weight:800;color:var(--primary)">'+formatPrice(s.faturamento||0)+'</span>'+
          '</div>'+
          '<div style="font-size:11px;color:var(--text-3)">'+(s.total||s.quantidade||0)+' atendimentos</div>'+
          '</div>';
      });
      html+='</div>';
    }

    // Origem das visitas
    if(data.por_fonte&&Object.keys(data.por_fonte).length>0){
      var totalF=Object.values(data.por_fonte).reduce(function(a,b){return a+b;},0);
      var fonteConf={
        direct:{label:'Acesso direto',icon:'🔗'},
        whatsapp:{label:'WhatsApp',icon:'💬'},
        instagram:{label:'Instagram',icon:'📸'},
        prof_link:{label:'Link profissional',icon:'✂️'},
        outros:{label:'Outros',icon:'🌐'}
      };
      html+='<div class="lista" style="margin-bottom:12px">';
      html+='<div class="lista-hdr"><h3>🔗 Origem das visitas</h3></div>';
      html+='<div style="padding:4px 16px 14px">';
      Object.entries(data.por_fonte).sort(function(a,b){return b[1]-a[1];}).forEach(function(kv){
        var fonte=kv[0], cnt=kv[1];
        var pct=totalF>0?Math.round(cnt/totalF*100):0;
        var cfg=fonteConf[fonte]||{label:fonte,icon:'?'};
        html+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">'+
          '<div style="font-size:16px;width:22px;text-align:center">'+cfg.icon+'</div>'+
          '<div style="flex:1"><div style="display:flex;justify-content:space-between;margin-bottom:3px">'+
          '<span style="font-size:13px;font-weight:700;color:var(--text)">'+cfg.label+'</span>'+
          '<span style="font-size:13px;font-weight:800;color:var(--primary)">'+cnt+' <span style="font-size:11px;color:var(--text-3)">('+pct+'%)</span></span>'+
          '</div><div style="height:4px;background:var(--sep);border-radius:2px">'+
          '<div style="height:4px;background:var(--primary);border-radius:2px;width:'+pct+'%"></div></div></div></div>';
      });
      html+='</div></div>';
    }

    html+='</div>'; // wrap
    el.innerHTML=html;

    // Period selector buttons
    var sel=document.getElementById('periodoSelector');
    if(sel){
      [7,15,30,60].forEach(function(d){
        var btn=document.createElement('button');
        btn.textContent=d+'d';
        btn.style.cssText='padding:5px 10px;border-radius:8px;border:1px solid var(--sep);font-size:12px;font-weight:700;cursor:pointer;background:'+(d===_analyticsDias?'var(--primary)':'var(--surface-2)')+';color:'+(d===_analyticsDias?'#fff':'var(--text-2)')+'';
        btn.onclick=function(){mudarPeriodo(d);};
        sel.appendChild(btn);
      });
    }

  }catch(e){
    el.innerHTML='<div class="empty" style="color:var(--error)">Erro ao carregar analytics: '+e.message+'</div>';
    console.error('[renderAnalytics]',e);
  }
}

function mudarPeriodo(dias){
  _analyticsDias=dias;
  _tabOk.analytics=false;
  renderAnalytics();
}

/* ═══ CAMPANHAS ═══ */
function renderCampanhas(){
  _tabOk.campanhas=true;
  var el=document.getElementById('tb-campanhas');
  if(!el) return;
  el.innerHTML=
    '<div class="wrap">'+
    '<div style="font-family:var(--font-brand);font-size:20px;font-weight:800;color:var(--text);margin-bottom:4px">📣 Campanhas</div>'+
    '<div style="font-size:13px;color:var(--text-2);margin-bottom:20px">Envie mensagens de reengajamento pelo WhatsApp ou Email para sua base de clientes.</div>'+
    _templateCampanha('Clientes inativos','Clientes que não agendam há mais de 30 dias','cliente_inativo','Olá {nome}! 😊 Sentimos sua falta no {salao}. Que tal marcar um horário? Acesse: {link}')+
    _templateCampanha('Lembrete de retorno','Clientes que costumam voltar mas ainda não agendaram','lembrete_retorno','Oi {nome}! Tá na hora de cuidar de você! 💆 Agende agora em {salao}: {link}')+
    _templateCampanha('Promoção especial','Envie uma oferta para toda sua base de clientes','promocao','{nome}, temos uma novidade especial para você! Confira: {link}')+
    _templateCampanha('Aniversariantes do mês','Clientes que fazem aniversário este mês','aniversario','Feliz aniversário, {nome}! 🎂 Ganhe um desconto especial no seu próximo atendimento em {salao}: {link}')+
    '</div>';
}

function _templateCampanha(titulo,desc,tipo,template){
  var link='https://agendatop.vercel.app/agendar.html?slug='+(S?S.slug:'');
  var preview=template
    .replace('{nome}','Cliente')
    .replace('{salao}',S?S.nome:'seu negócio')
    .replace('{link}',link);
  return '<div style="background:var(--bg-card);border-radius:var(--r-lg);padding:16px;margin-bottom:12px;border:1px solid var(--sep)">'+
    '<div style="font-family:var(--font-brand);font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px">'+titulo+'</div>'+
    '<div style="font-size:12px;color:var(--text-2);margin-bottom:12px">'+desc+'</div>'+
    '<div style="background:var(--bg-card-2);border-radius:var(--r-sm);padding:12px;margin-bottom:12px">'+
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:6px">Prévia</div>'+
      '<div style="font-size:13px;color:var(--text);line-height:1.5">'+escHtmlCamp(preview)+'</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">'+
      '<button onclick="campCopiar(\''+tipo+'\')" style="padding:9px 4px;background:var(--bg-card-2);border:1px solid var(--sep);border-radius:var(--r-sm);color:var(--text-2);font-size:12px;font-weight:700;cursor:pointer">📋 Copiar</button>'+
      '<button onclick="campWhatsApp(\''+tipo+'\')" style="padding:9px 4px;background:#25D366;border:none;border-radius:var(--r-sm);color:#fff;font-size:12px;font-weight:700;cursor:pointer">💬 WhatsApp</button>'+
      '<button onclick="campEmail(\''+tipo+'\')" style="padding:9px 4px;background:#1a73e8;border:none;border-radius:var(--r-sm);color:#fff;font-size:12px;font-weight:700;cursor:pointer">📧 Email</button>'+
    '</div>'+
  '</div>';
}

function escHtmlCamp(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

var _campTemplates={
  cliente_inativo:'Olá {nome}! 😊 Sentimos sua falta no {salao}. Que tal marcar um horário? Acesse: {link}',
  lembrete_retorno:'Oi {nome}! Tá na hora de cuidar de você! 💆 Agende agora em {salao}: {link}',
  promocao:'{nome}, temos uma novidade especial para você no {salao}! Confira: {link}',
  aniversario:'Feliz aniversário, {nome}! 🎂 Ganhe um desconto especial no seu próximo atendimento em {salao}: {link}'
};

function _campMsg(tipo,nome){
  var link='https://agendatop.vercel.app/agendar.html?slug='+(S?S.slug:'');
  return (_campTemplates[tipo]||'{link}')
    .replace(/{nome}/g,nome||'Cliente')
    .replace(/{salao}/g,S?S.nome:'nosso estabelecimento')
    .replace(/{link}/g,link);
}

function campCopiar(tipo){
  var texto=_campMsg(tipo,'Cliente');
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(texto).then(function(){toast('Mensagem copiada!','ok');}).catch(function(){_campFallbackCopy(texto);});
  }else{_campFallbackCopy(texto);}
}

function _campFallbackCopy(texto){
  var ta=document.createElement('textarea');
  ta.value=texto;ta.style.cssText='position:fixed;opacity:0;pointer-events:none';
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');toast('Mensagem copiada!','ok');}catch(e){toast('Não foi possível copiar','err');}
  document.body.removeChild(ta);
}

async function campWhatsApp(tipo){
  var btn=event&&event.target;
  if(btn){btn.disabled=true;btn.textContent='⏳';}
  try{
    var clis=await _campCarregarClis(tipo);
    if(!clis.length){toast('Nenhum cliente com telefone cadastrado','err');return;}
    _campAbrirModal('wa',tipo,clis);
  }catch(e){toast('Erro ao carregar clientes','err');}
  finally{if(btn){btn.disabled=false;btn.textContent='💬 WhatsApp';}}
}

async function campEmail(tipo){
  var btn=event&&event.target;
  if(btn){btn.disabled=true;btn.textContent='⏳';}
  try{
    var clis=await _campCarregarClis(tipo);
    var comEmail=clis.filter(function(c){return c.email;});
    if(!comEmail.length){toast('Nenhum cliente com email cadastrado','err');return;}
    _campAbrirModal('email',tipo,comEmail);
  }catch(e){toast('Erro ao carregar clientes','err');}
  finally{if(btn){btn.disabled=false;btn.textContent='📧 Email';}}
}

async function _campCarregarClis(tipo){
  var usaInativos=tipo==='cliente_inativo'||tipo==='lembrete_retorno';
  if(usaInativos){
    var r=await rpc('clientes_inativos',{p_salao_id:S.id,p_dias:30});
    return (r||[]).map(function(c){return {nome:c.nome,telefone:c.telefone,email:c.email||''};});
  }
  var r=await api('clientes?salao_id=eq.'+S.id+'&select=nome,telefone,email&order=total_visitas.desc&limit=200');
  return r||[];
}

function _campAbrirModal(canal,tipo,clis){
  var items=clis.slice(0,100).map(function(c){
    var nome=c.nome||'Cliente';
    var msg=_campMsg(tipo,nome.split(' ')[0]);
    if(canal==='wa'){
      var tel=(c.telefone||'').replace(/\D/g,'');
      if(tel.length===11) tel='55'+tel;
      var url='https://wa.me/'+tel+'?text='+encodeURIComponent(msg);
      return '<a href="'+url+'" target="_blank" rel="noopener" '+
        'style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(37,211,102,.08);'+
        'border-radius:10px;margin-bottom:8px;text-decoration:none;border:1px solid rgba(37,211,102,.2)">'+
        '<span style="font-size:20px">💬</span>'+
        '<div style="flex:1"><div style="font-weight:700;font-size:13px;color:var(--text)">'+esc(nome)+'</div>'+
        '<div style="font-size:11px;color:var(--text-3)">'+esc(c.telefone||'')+'</div></div>'+
        '<span style="font-size:11px;color:#25D366;font-weight:700">Enviar</span></a>';
    }else{
      var link='https://agendatop.vercel.app/agendar.html?slug='+(S?S.slug:'');
      var assuntos={
        cliente_inativo:'Sentimos sua falta! Que tal agendar?',
        lembrete_retorno:'Está na hora de cuidar de você! 💆',
        promocao:'Novidade especial para você!',
        aniversario:'Feliz aniversário! 🎂 Desconto especial'
      };
      var mailUrl='mailto:'+encodeURIComponent(c.email)+'?subject='+encodeURIComponent(assuntos[tipo]||'Mensagem de '+( S?S.nome:''))+'&body='+encodeURIComponent(msg);
      return '<a href="'+mailUrl+'" '+
        'style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(26,115,232,.08);'+
        'border-radius:10px;margin-bottom:8px;text-decoration:none;border:1px solid rgba(26,115,232,.2)">'+
        '<span style="font-size:20px">📧</span>'+
        '<div style="flex:1"><div style="font-weight:700;font-size:13px;color:var(--text)">'+esc(nome)+'</div>'+
        '<div style="font-size:11px;color:var(--text-3)">'+esc(c.email)+'</div></div>'+
        '<span style="font-size:11px;color:#1a73e8;font-weight:700">Enviar</span></a>';
    }
  }).join('');

  var titulo=canal==='wa'?'💬 WhatsApp ('+clis.length+')':'📧 Email ('+clis.length+')';
  var subtit=canal==='wa'?'Clique em cada contato para abrir o WhatsApp.':'Clique em cada contato para abrir seu app de email.';
  var modal=document.createElement('div');
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:flex-end;justify-content:center';
  var inner=document.createElement('div');
  inner.style.cssText='background:var(--surface,#fff);border-radius:20px 20px 0 0;padding:20px 16px 32px;width:100%;max-width:480px;max-height:80vh;overflow-y:auto';
  inner.innerHTML=
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'+
    '<div style="font-size:16px;font-weight:800;color:var(--text)">'+titulo+'</div>'+
    '<button id="campModalClose" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text-3)">✕</button></div>'+
    '<p style="font-size:12px;color:var(--text-3);margin-bottom:14px">'+subtit+'</p>'+
    items;
  modal.appendChild(inner);
  document.body.appendChild(modal);
  document.getElementById('campModalClose').onclick=function(){modal.remove();};
  modal.onclick=function(e){if(e.target===modal)modal.remove();};
}

async function exportarRelatorio(){
  try{
    var btn=document.querySelector('[onclick="exportarRelatorio()"]');
    if(btn){btn.disabled=true;btn.textContent='Gerando...';}
    var hoje=new Date();
    var d90=new Date(hoje.getTime()-90*86400000);
    var d90s=d90.getFullYear()+'-'+String(d90.getMonth()+1).padStart(2,'0')+'-'+String(d90.getDate()).padStart(2,'0');
    var ags=await api('agendamentos?salao_id=eq.'+S.id+'&data=gte.'+d90s+
      '&order=data.desc,hora.desc&select=data,hora,cliente_nome,cliente_tel,servico_nome,servico_preco,status&limit=2000');
    ags=ags||[];
    var header=['Data','Hora','Cliente','Telefone','Serviço','Valor (R$)','Status'];
    var rows=[header];
    ags.forEach(function(a){
      rows.push([fmtBR(a.data),a.hora?a.hora.substring(0,5):'',a.cliente_nome||'',a.cliente_tel||'',
        a.servico_nome||'',((a.servico_preco||0)/100).toFixed(2).replace('.',','),a.status||'']);
    });
    var csv=rows.map(function(r){return r.map(function(v){return '"'+(v+'').replace(/"/g,'""')+'"';}).join(',');}).join('\n');
    var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url; a.download='relatorio-agenda-90d.csv'; a.click();
    URL.revokeObjectURL(url);
    if(btn){btn.disabled=false;btn.textContent='📥 Exportar relatório CSV';}
    toast('Relatório exportado!','ok');
  }catch(e){toast('Erro ao exportar: '+e.message,'err');}
}
