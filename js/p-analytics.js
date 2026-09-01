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

    // Period selector — pill style
    html+='<div id="periodoSelector" style="display:flex;gap:4px;background:#fff;border:1px solid rgba(23,19,15,.1);border-radius:999px;padding:5px;width:fit-content;margin-bottom:20px"></div>';

    // KPIs — grid cream style
    var taxa=Math.round(data.taxa_conclusao||0);
    html+='<div class="metrics">';
    html+='<div class="mc"><div class="mc-l">Agendamentos</div><div class="mc-n">'+(data.total_agendamentos||0)+'</div></div>';
    html+='<div class="mc"><div class="mc-l">Faturamento</div><div class="mc-n">'+formatPrice(data.faturamento_total||0)+'</div></div>';
    html+='<div class="mc"><div class="mc-l">Clientes novos</div><div class="mc-n">'+(data.novos_clientes||0)+'</div></div>';
    html+='<div class="mc"><div class="mc-l">Taxa de conclusão</div><div class="mc-n" style="color:'+(taxa>=54?'#1E7A46':'#17130F')+'">'+taxa+'%</div></div>';
    html+='</div>';

    // Serviços mais pedidos
    if(data.servicos_top&&data.servicos_top.length>0){
      html+='<div style="background:#fff;border:1px solid rgba(23,19,15,.08);border-radius:20px;overflow:hidden;margin-top:18px">'+
        '<div style="padding:20px 24px;border-bottom:1px solid rgba(23,19,15,.08);font-size:17px;font-weight:700;letter-spacing:-.02em;color:#17130F">Serviços mais pedidos</div>';
      data.servicos_top.forEach(function(s){
        html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(23,19,15,.07)">'+
          '<div>'+
            '<div style="font-size:15px;font-weight:700;color:#17130F">'+esc(s.nome||s.servico_nome||'—')+'</div>'+
            '<div style="font-size:12.5px;color:#8A8078">'+(s.total||s.quantidade||0)+' atendimentos</div>'+
          '</div>'+
          '<span style="font-size:15.5px;font-weight:700;color:#E55A0C">'+formatPrice(s.faturamento||0)+'</span>'+
        '</div>';
      });
      html+='</div></div>';
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
      html+='<div style="background:#fff;border:1px solid rgba(23,19,15,.08);border-radius:20px;overflow:hidden;margin-top:18px">'+
        '<div style="padding:20px 24px;border-bottom:1px solid rgba(23,19,15,.08);font-size:17px;font-weight:700;letter-spacing:-.02em;color:#17130F">Origem das visitas</div>'+
        '<div style="padding:14px 24px">';
      Object.entries(data.por_fonte).sort(function(a,b){return b[1]-a[1];}).forEach(function(kv){
        var fonte=kv[0], cnt=kv[1];
        var pct=totalF>0?Math.round(cnt/totalF*100):0;
        var cfg=fonteConf[fonte]||{label:fonte,icon:'?'};
        html+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'+
          '<div style="font-size:16px;width:22px;text-align:center">'+cfg.icon+'</div>'+
          '<div style="flex:1">'+
            '<div style="display:flex;justify-content:space-between;margin-bottom:4px">'+
              '<span style="font-size:14px;font-weight:700;color:#17130F">'+cfg.label+'</span>'+
              '<span style="font-size:14px;font-weight:700;color:#E55A0C">'+cnt+' <span style="font-size:11.5px;color:#8A8078">('+pct+'%)</span></span>'+
            '</div>'+
            '<div style="height:4px;background:rgba(23,19,15,.08);border-radius:2px">'+
              '<div style="height:4px;background:#E55A0C;border-radius:2px;width:'+pct+'%;transition:width .4s"></div>'+
            '</div>'+
          '</div>'+
        '</div>';
      });
      html+='</div></div>';
    }

    /* ── GRID: gráfico semana + diagnóstico lado a lado ── */
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px;margin-top:18px">';

    /* Gráfico por dia da semana */
    if(data.por_dia&&Array.isArray(data.por_dia)&&data.por_dia.length>0){
      var semLabels=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
      var counts=[0,0,0,0,0,0,0];
      data.por_dia.forEach(function(d){
        var dt=new Date(d.data+'T12:00:00');
        counts[dt.getDay()]+=(d.total||d.count||1);
      });
      var maxC=Math.max.apply(null,counts)||1;
      var topIdx=counts.indexOf(maxC);
      var lowIdx=counts.indexOf(Math.min.apply(null,counts.filter(function(c){return c>0;}))||0);
      var bars='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:10px;align-items:end;height:160px">';
      counts.forEach(function(c,i){
        var isPeak=i===topIdx;
        var pct=Math.round((c/maxC)*100);
        bars+='<div style="display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;gap:6px">'+
          '<div style="font-size:10px;color:#8A8078;font-weight:600">'+(c||'')+'</div>'+
          '<div style="width:100%;border-radius:8px 8px 3px 3px;background:'+(isPeak?'#E55A0C':'rgba(23,19,15,.12)')+';height:'+pct+'%;min-height:4px;transition:height .5s '+(i*.05)+'s"></div>'+
          '<div style="font-size:12px;font-weight:700;color:#8A8078">'+semLabels[i]+'</div>'+
        '</div>';
      });
      bars+='</div>';
      html+='<div style="background:#fff;border:1px solid rgba(23,19,15,.08);border-radius:20px;padding:24px">'+
        '<div style="font-size:17px;font-weight:700;letter-spacing:-.02em;color:#17130F">Ocupação por dia da semana</div>'+
        '<div style="font-size:13.5px;color:#8A8078;margin:4px 0 20px">'+semLabels[topIdx]+' é seu dia mais cheio.</div>'+
        bars+
      '</div>';
    }

    /* Diagnóstico — dark card com CTA */
    var benchmark=54;
    var diff=taxa-benchmark;
    var projetado=data.faturamento_total&&_analyticsDias>0?Math.round(data.faturamento_total/(_analyticsDias/30)):0;
    html+='<div style="background:#17130F;color:#FBF7F1;border-radius:20px;padding:24px;display:flex;flex-direction:column">'+
      '<div style="font-size:11.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#C99A7A;margin-bottom:10px">→ Diagnóstico</div>'+
      '<div style="font-size:23px;font-weight:700;letter-spacing:-.025em;line-height:1.2;margin-bottom:12px">'+
        'Sua agenda está <span style="font-family:Newsreader,serif;font-style:italic;font-weight:400;color:#F79355">'+taxa+'% cheia.</span>'+
      '</div>'+
      '<div style="font-size:15px;line-height:1.55;color:#C4B8AC;flex:1">'+
        'Com a ocupação média do seu segmento ('+benchmark+'%), '+
        (projetado>0?'seu faturamento no mês seria de <b style="color:#FBF7F1">'+formatPrice(projetado)+'</b>. ':'')+
        'A diferença não está no preço, está nos horários vazios.'+
      '</div>'+
      '<div style="margin-top:20px;display:flex;flex-direction:column;gap:9px">'+
        '<button onclick="copiarLink()" style="border:none;cursor:pointer;background:#E55A0C;color:#fff;font-size:14.5px;font-weight:700;padding:14px;border-radius:11px;font-family:inherit">Divulgar meu link agora</button>'+
        '<button onclick="irSecao(\'campanhas\')" style="border:1.5px solid rgba(251,247,241,.25);cursor:pointer;background:transparent;color:#FBF7F1;font-size:14.5px;font-weight:700;padding:14px;border-radius:11px;font-family:inherit">Criar promoção</button>'+
      '</div>'+
    '</div>';

    html+='</div>'; // grid

    html+='</div>'; // wrap
    el.innerHTML=html;

    // Period selector — pill style
    var sel=document.getElementById('periodoSelector');
    if(sel){
      [7,30,90].forEach(function(d){
        var isActive=d===_analyticsDias;
        var btn=document.createElement('button');
        btn.textContent=d+' dias';
        btn.style.cssText='border:none;cursor:pointer;border-radius:999px;padding:9px 16px;font-size:13.5px;font-weight:700;font-family:inherit;transition:.15s;background:'+(isActive?'#17130F':'transparent')+';color:'+(isActive?'#FBF7F1':'#6B625A');
        btn.onclick=function(){mudarPeriodo(d);};
        sel.appendChild(btn);
      });
    }

  }catch(e){
    el.innerHTML='<div class="empty" style="color:var(--error)">Erro ao carregar analytics: '+esc(e.message)+'</div>';
    console.error('[renderAnalytics]',e);
  }
}

function mudarPeriodo(dias){
  _analyticsDias=dias;
  _tabOk.analytics=false;
  renderAnalytics();
}

/* ═══ CAMPANHAS ═══ */
var _campCustom=[];
(function(){try{var s=localStorage.getItem('agenda_camp_custom');if(s)_campCustom=JSON.parse(s)||[];}catch(e){}}());

function renderCampanhas(){
  _tabOk.campanhas=true;
  var el=document.getElementById('tb-campanhas');
  if(!el) return;
  var html='<div class="wrap">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'+
    '<div style="font-family:var(--font-brand);font-size:20px;font-weight:800;color:var(--text)">📣 Campanhas</div>'+
    '<button onclick="abrirNovaCampanha()" style="padding:7px 14px;background:var(--primary);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">+ Nova</button>'+
    '</div>'+
    '<div style="font-size:13px;color:var(--text-2);margin-bottom:20px">Edite as mensagens abaixo e envie pelo WhatsApp ou Email. Use {nome}, {salao} e {link} como variáveis.</div>'+
    _templateCampanha('Clientes inativos','Clientes que não agendam há mais de 30 dias','cliente_inativo')+
    _templateCampanha('Lembrete de retorno','Clientes que costumam voltar mas ainda não agendaram','lembrete_retorno')+
    _templateCampanha('Promoção especial','Envie uma oferta para toda sua base de clientes','promocao')+
    _templateCampanha('Aniversariantes do mês','Clientes que fazem aniversário este mês','aniversario');
  _campCustom.forEach(function(c){
    html+=_templateCampanha(c.titulo,c.desc,c.tipo);
  });
  html+='</div>';
  el.innerHTML=html;
}

function _templateCampanha(titulo,desc,tipo){
  var txt=_campTemplates[tipo]||'{link}';
  var isCustom=tipo.startsWith('custom_');
  return '<div style="background:var(--bg-card);border-radius:var(--r-lg);padding:16px;margin-bottom:12px;border:1px solid var(--sep)">'+
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px">'+
    '<div style="font-family:var(--font-brand);font-size:15px;font-weight:700;color:var(--text)">'+esc(titulo)+'</div>'+
    (isCustom?'<button onclick="_excluirCampCustom(\''+tipo+'\')" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:14px;padding:0 0 0 8px" title="Excluir">🗑️</button>':'')+
    '</div>'+
    '<div style="font-size:12px;color:var(--text-2);margin-bottom:10px">'+esc(desc)+'</div>'+
    '<div style="margin-bottom:12px">'+
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:5px">Mensagem · edite abaixo</div>'+
      '<textarea id="camp-txt-'+tipo+'" rows="3" oninput="_campSalvar(\''+tipo+'\',this.value)" '+
        'style="width:100%;font-size:13px;color:var(--text);background:var(--bg-card-2);border:1px solid var(--sep);border-radius:var(--r-sm);padding:10px 12px;resize:vertical;font-family:var(--font-body);line-height:1.55;outline:none">'+escHtmlCamp(txt)+'</textarea>'+
      '<div style="font-size:10px;color:var(--text-3);margin-top:4px">Variáveis: <code>{nome}</code> · <code>{salao}</code> · <code>{link}</code></div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">'+
      '<button onclick="campCopiar(\''+tipo+'\')" style="padding:9px 4px;background:var(--bg-card-2);border:1px solid var(--sep);border-radius:var(--r-sm);color:var(--text-2);font-size:12px;font-weight:700;cursor:pointer">📋 Copiar</button>'+
      '<button onclick="campWhatsApp(\''+tipo+'\')" style="padding:9px 4px;background:#25D366;border:none;border-radius:var(--r-sm);color:#fff;font-size:12px;font-weight:700;cursor:pointer">💬 WhatsApp</button>'+
      '<button onclick="campEmail(\''+tipo+'\')" style="padding:9px 4px;background:#1a73e8;border:none;border-radius:var(--r-sm);color:#fff;font-size:12px;font-weight:700;cursor:pointer">📧 Email</button>'+
    '</div>'+
  '</div>';
}

function _campSalvar(tipo,valor){
  _campTemplates[tipo]=valor;
  // Persiste customizações no localStorage
  try{
    var key='agenda_camp_tpl_'+tipo;
    localStorage.setItem(key,valor);
  }catch(e){}
}

// Restaura templates customizados do localStorage ao iniciar
(function(){
  try{
    var tipos=['cliente_inativo','lembrete_retorno','promocao','aniversario'];
    tipos.forEach(function(t){
      var v=localStorage.getItem('agenda_camp_tpl_'+t);
      if(v) _campTemplates[t]=v;
    });
    // Restaura nomes de campanhas customizadas
    _campCustom.forEach(function(c){
      var v=localStorage.getItem('agenda_camp_tpl_'+c.tipo);
      if(v) _campTemplates[c.tipo]=v;
    });
  }catch(e){}
}());

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
  // Lê do textarea se existir (para capturar edições em tempo real)
  var ta=document.getElementById('camp-txt-'+tipo);
  if(ta) _campTemplates[tipo]=ta.value;
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

function _campSyncTa(tipo){
  var ta=document.getElementById('camp-txt-'+tipo);
  if(ta) _campTemplates[tipo]=ta.value;
}

async function campWhatsApp(tipo){
  _campSyncTa(tipo);
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
  _campSyncTa(tipo);
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

/* ── Nova campanha ── */
function abrirNovaCampanha(){
  var modal=document.createElement('div');
  modal.id='ovNovaCamp';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:flex-end;justify-content:center';
  var inner=document.createElement('div');
  inner.style.cssText='background:var(--surface,#fff);border-radius:20px 20px 0 0;padding:20px 16px 32px;width:100%;max-width:480px;max-height:80vh;overflow-y:auto';
  inner.innerHTML=
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'+
    '<div style="font-size:16px;font-weight:800;color:var(--text)">Nova campanha</div>'+
    '<button onclick="document.getElementById(\'ovNovaCamp\').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text-3)">✕</button></div>'+
    '<div style="margin-bottom:12px"><label style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3)">Título</label>'+
    '<input id="ncTitulo" type="text" placeholder="Ex: Promoção de fim de semana" maxlength="60" '+
    'style="width:100%;margin-top:5px;padding:10px 12px;border-radius:8px;border:1px solid var(--sep);background:var(--bg-card-2);font-size:14px;color:var(--text);font-family:var(--font-body);outline:none"></div>'+
    '<div style="margin-bottom:12px"><label style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3)">Descrição curta</label>'+
    '<input id="ncDesc" type="text" placeholder="Para quem é este envio?" maxlength="80" '+
    'style="width:100%;margin-top:5px;padding:10px 12px;border-radius:8px;border:1px solid var(--sep);background:var(--bg-card-2);font-size:14px;color:var(--text);font-family:var(--font-body);outline:none"></div>'+
    '<div style="margin-bottom:16px"><label style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3)">Mensagem</label>'+
    '<textarea id="ncMsg" rows="4" placeholder="Olá {nome}! Temos uma novidade no {salao}. Acesse: {link}" '+
    'style="width:100%;margin-top:5px;padding:10px 12px;border-radius:8px;border:1px solid var(--sep);background:var(--bg-card-2);font-size:13px;color:var(--text);font-family:var(--font-body);resize:vertical;outline:none;line-height:1.55"></textarea>'+
    '<div style="font-size:10px;color:var(--text-3);margin-top:4px">Use {nome}, {salao} e {link} como variáveis.</div></div>'+
    '<button onclick="salvarNovaCampanha()" style="width:100%;padding:13px;background:var(--primary);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">Criar campanha</button>';
  modal.appendChild(inner);
  document.body.appendChild(modal);
  modal.onclick=function(e){if(e.target===modal)modal.remove();};
  setTimeout(function(){document.getElementById('ncTitulo').focus();},200);
}

function salvarNovaCampanha(){
  var titulo=(document.getElementById('ncTitulo')||{}).value||'';
  var desc=(document.getElementById('ncDesc')||{}).value||'';
  var msg=(document.getElementById('ncMsg')||{}).value||'';
  if(!titulo.trim()){toast('Informe o título da campanha','err');return;}
  if(!msg.trim()){toast('Informe a mensagem da campanha','err');return;}
  var tipo='custom_'+Date.now();
  _campCustom.push({titulo:titulo.trim(),desc:desc.trim(),tipo:tipo});
  _campTemplates[tipo]=msg.trim();
  try{
    localStorage.setItem('agenda_camp_custom',JSON.stringify(_campCustom));
    localStorage.setItem('agenda_camp_tpl_'+tipo,msg.trim());
  }catch(e){}
  document.getElementById('ovNovaCamp').remove();
  _tabOk.campanhas=false;
  renderCampanhas();
  toast('Campanha criada!','ok');
}

function _excluirCampCustom(tipo){
  _campCustom=_campCustom.filter(function(c){return c.tipo!==tipo;});
  delete _campTemplates[tipo];
  try{
    localStorage.setItem('agenda_camp_custom',JSON.stringify(_campCustom));
    localStorage.removeItem('agenda_camp_tpl_'+tipo);
  }catch(e){}
  _tabOk.campanhas=false;
  renderCampanhas();
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
