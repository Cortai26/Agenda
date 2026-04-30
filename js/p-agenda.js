window.MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
window.SEM=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
/* formatPrice is defined in p-core.js */
/* Agenda Painel — Agenda */

/* ── LEMBRETE WHATSAPP ── */
function gerarLinkWA(a) {
  var tel = (a.cliente_tel||'').replace(/\D/g,'');
  if(!tel) return null;
  // Formata a data
  var dp = a.data.split('-');
  var dataFmt = dp[2]+'/'+dp[1]+'/'+dp[0];
  var hora = a.hora.substring(0,5);
  var nome = S && S.nome ? S.nome : 'nosso salão';
  var pixInfo = (S && S.pix_key) ? '\n\n💳 Pix p/ adiantamento: '+S.pix_key : '';
  var msg = encodeURIComponent(
    'Olá, '+a.cliente_nome+'! 👋\n'+
    'Lembrando seu horário amanhã:\n'+
    '📅 '+dataFmt+' às '+hora+'\n'+
    '🗓️ '+a.servico_nome+'\n'+
    '📍 '+nome+
    pixInfo+
    '\n\nAté logo! 😊'
  );
  return 'https://wa.me/55'+tel+'?text='+msg;
}

/* ═══ AGENDA UNIFICADA ═══ */

async function filtrarProf(profId){
  _profFiltro = profId;
  _tabOk.agenda = false; // força rerender
  renderAgenda();
}

var _renderingAgenda=false;
async function renderAgenda(){
  if(_renderingAgenda) return; // prevent concurrent double-render
  _renderingAgenda=true;
  _tabOk.agenda=true;
  _drillDia=null;
  var el=document.getElementById('tb-agenda');
  el.innerHTML='<div class="loading">Carregando...</div>';
  try{
  // Pre-load services for manual booking FAB
  if(!window._servicos||!window._servicos.length){
    try{window._servicos=await api('servicos?salao_id=eq.'+S.id+'&ativo=eq.true&order=ordem')||[];}catch(e){}
  }
  if(S.plano!=='basico' && _profs.length===0){
    var profs=await api('profissionais?salao_id=eq.'+S.id+'&ativo=eq.true&order=ordem');
    _profs=profs||[];
    _profs.forEach(function(p,i){if(!p.cor)p.cor=PROF_CORES[i%PROF_CORES.length];});
  }

  var ds=fmt(hoje());
  var d7=new Date(hoje()); d7.setDate(d7.getDate()+7);
  var ds7=fmt(d7);

  if(!window.S||!window.S.id) throw new Error('Sessão não carregada');

  var results=await Promise.all([
    api('agendamentos?salao_id=eq.'+S.id+'&data=eq.'+ds+(_profFiltro?'&profissional_id=eq.'+_profFiltro:'')+'&order=hora&select=*'),
    api('agendamentos?salao_id=eq.'+S.id+'&select=id,servico_preco,status'),
    api('agendamentos?salao_id=eq.'+S.id+'&data=gt.'+ds+'&data=lte.'+ds7+'&status=neq.cancelado'+(_profFiltro?'&profissional_id=eq.'+_profFiltro:'')+'&order=data,hora&select=*'),
    api('rpc/agendamentos_mes',{method:'POST',body:JSON.stringify({p_salao_id:S.id,p_ano:_calAno,p_mes:_calMes+1}),headers:{'Prefer':''}}).catch(function(){return[];})
  ]);

  var agsHoje=results[0]||[];
  var todos=results[1]||[];
  var proximos=results[2]||[];
  var calDados=results[3]||[];

  // Monta _calDados
  _calDados={};
  calDados.forEach(function(d){_calDados[d.dia]=d;});

  var ativos=agsHoje.filter(function(a){return a.status!=='cancelado';});
  var fat=ativos.reduce(function(s,a){return s+(a.servico_preco||0);},0);
  // ITEM 6: Caixa do dia
  var caixaEl=document.getElementById('caixaDia');
  if(!caixaEl){caixaEl=document.createElement('div');caixaEl.id='caixaDia';caixaEl.className='caixa-dia';}
  caixaEl.innerHTML=
    '<div class="caixa-kpi"><div class="caixa-kpi-n">'+formatPrice(fat)+'</div><div class="caixa-kpi-l">Faturamento</div></div>'+
    '<div class="caixa-kpi"><div class="caixa-kpi-n">'+ativos.length+'</div><div class="caixa-kpi-l">Atendimentos</div></div>'+
    '<div class="caixa-kpi"><div class="caixa-kpi-n">'+agsHoje.filter(function(a){return a.status==='concluido';}).length+'</div><div class="caixa-kpi-l">Concluídos</div></div>'+
    '<div class="caixa-kpi" style="cursor:pointer;background:var(--primary-light)" onclick="abrirWalkin(ds)"><div class="caixa-kpi-n" style="color:var(--primary)">⚡</div><div class="caixa-kpi-l" style="color:var(--primary)">Walk-in</div></div>';

  var html='';

  /* FILTRO DE PROFISSIONAIS */
  if(_profs.length > 1){
    html+='<div class="prof-filter">';
    var allSel=(_profFiltro===null);
    html+='<button class="pfbtn'+(allSel?' on':'')+'" onclick="filtrarProf(null)">'+
      '<div class="pfdot" style="background:'+(allSel?'#fff':'#ccc')+'"></div>Todos</button>';
    _profs.forEach(function(p,i){
      var cor=p.cor||profCor(i);
      var sel=(_profFiltro===p.id);
      html+='<button class="pfbtn'+(sel?' on':'')+'" data-profid="'+p.id+'" onclick="filtrarProf(this.dataset.profid)">'+
        '<div class="pfdot" style="background:'+(sel?'#fff':cor)+';border-color:'+(sel?'#fff':cor)+'"></div>'+
        esc(p.nome)+'</button>';
    });
    html+='</div>';
  }

  /* SEÇÃO HOJE */
  html+='<div class="sec-label">Hoje · '+parseInt(ds.split('-')[2])+' de '+MESES[hoje().getMonth()]+'</div>';
  // Monthly revenue
  var _hoje2=new Date();
  var _y=_hoje2.getFullYear(),_m=_hoje2.getMonth()+1;
  var _d1=_y+'-'+String(_m).padStart(2,'0')+'-01';
  var _dLast=new Date(_y,_m,0).getDate();
  var _dFim=_y+'-'+String(_m).padStart(2,'0')+'-'+String(_dLast).padStart(2,'0');
  var _fatMes=0;
  try{
    var _resMes=await api('agendamentos?salao_id=eq.'+S.id+'&data=gte.'+_d1+'&data=lte.'+_dFim+'&status=neq.cancelado&select=servico_preco');
    _fatMes=(_resMes||[]).reduce(function(a,r){return a+(r.servico_preco||0);},0);
  }catch(e){}
  html+='<div class="metrics">';
  html+='<div class="mc mc-L"><div class="mc-n">'+ativos.length+'</div><div class="mc-l">Hoje</div></div>';
  html+='<div class="mc mc-V"><div class="mc-n">'+formatPrice(fat)+'</div><div class="mc-l">Faturamento hoje</div></div>';
  html+='<div class="mc mc-A mc-mes"><div class="mc-n">'+formatPrice(_fatMes)+'</div><div class="mc-l">Este mês</div></div>';
  html+='</div>';
  html+='<div class="lista">'+renderListaAgs(agsHoje,true,'agenda')+'</div>';

  /* SEÇÃO EM BREVE */
  if(proximos.length>0){
    html+='<div class="sec-label">Em breve · próximos 7 dias</div>';
    html+='<div class="lista"><div class="lista-hdr"><h3>🔜 Em breve</h3><span class="tag-c" style="background:rgba(45,106,79,.1);color:var(--VD)">'+proximos.length+' agendamento'+(proximos.length!==1?'s':'')+'</span></div>';
    proximos.forEach(function(a){
      var dp=a.data.split('-');
      var dataFmt=pad(parseInt(dp[2]))+'/'+pad(parseInt(dp[1]));
      html+=
        '<div class="ag-card ag-card-prox">'+
          '<div class="ag-hora ag-hora-dt">'+
            '<div class="ag-dt-d">'+dataFmt+'</div>'+
            '<div class="ag-dt-h">'+a.hora.substring(0,5)+'</div>'+
          '</div>'+
          '<div class="ag-body">'+
            '<div class="ag-top">'+
              '<div class="ag-nome">'+a.cliente_nome+'</div>'+
              badgeStatus(a.status)+
            '</div>'+
            '<div class="ag-info">'+
              '<span class="ag-srv">✂ '+esc(a.servico_nome)+'</span>'+
              '<span class="ag-tel">'+a.cliente_tel+'</span>'+
            '</div>'+
          '</div>'+
          '<div class="ag-preco">'+formatPrice(a.servico_preco||0)+'</div>'+
        '</div>';
    });
    html+='</div>';
  }


  /* SEÇÃO HISTÓRICO — últimos 30 dias com agendamentos */
  var d30=new Date(hoje()); d30.setDate(d30.getDate()-30);
  var ds30=fmt(d30);
  var passados=[];
  try{ passados=await api('agendamentos?salao_id=eq.'+S.id+'&data=gte.'+ds30+'&data=lt.'+ds+'&status=neq.cancelado&order=data.desc&select=data,cliente_nome,servico_nome,servico_preco,hora')||[]; }catch(e){}
  var diasPassados={};
  passados.forEach(function(a){
    if(!diasPassados[a.data]) diasPassados[a.data]={total:0,fat:0};
    diasPassados[a.data].total++;
    diasPassados[a.data].fat+=(a.servico_preco||0);
  });
  var datasPassadas=Object.keys(diasPassados).sort().reverse();
  if(datasPassadas.length>0){
    var _histCollapsed = localStorage.getItem('historico-collapsed') !== '0';
    var _chevronCls = _histCollapsed ? 'collapsed' : '';
    var _bodyCls    = _histCollapsed ? 'collapsed' : '';
    html+='<div class="section-group" data-section="historico">'+
      '<div class="section-group-header" onclick="toggleSection(\'historico\')">'+
        '<span class="section-group-label">Histórico recente — últimos 30 dias</span>'+
        '<svg class="section-chevron '+_chevronCls+'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>'+
      '</div>'+
      '<div class="section-group-body '+_bodyCls+'">';
    datasPassadas.slice(0,10).forEach(function(data){
      var d=diasPassados[data];
      var partes=data.split('-');
      var dia=parseInt(partes[2]);
      var mesLabel=MESES[parseInt(partes[1])-1].substring(0,3);
      html+='<div class="ag-card" onclick="drillDia(\''+data+'\')" style="cursor:pointer">'+
        '<div class="ag-hora" style="min-width:50px;text-align:center;flex-direction:column;display:flex;align-items:center">'+
          '<div style="font-size:17px;font-weight:800;color:var(--primary)">'+dia+'</div>'+
          '<div style="font-size:9px;text-transform:uppercase;color:var(--text-3)">'+mesLabel+'</div>'+
        '</div>'+
        '<div class="ag-info">'+
          '<div class="ag-nome">'+d.total+' agendamento'+(d.total!==1?'s':'')+'</div>'+
          '<div class="ag-srv">'+formatPrice(d.fat)+' faturado</div>'+
        '</div>'+
        '<div style="font-size:11px;color:var(--text-3);font-weight:700;flex-shrink:0">Ver →</div>'+
      '</div>';
    });
    html+='</div></div>';
  }

  /* SEÇÃO CALENDÁRIO */
  html+='<div class="sec-label">Calendário · '+MESES[_calMes]+' '+_calAno+'</div>';
  html+='<div id="calWrap"></div>';
  html+='<div id="drillWrap"></div>';

  el.innerHTML=html;
  renderCalendar();
  // Onboarding — só na primeira vez ou quando itens faltam
  if(typeof renderOnboarding==='function') renderOnboarding().catch(function(){});
  }catch(e){
    console.error('[renderAgenda]', e);
    el.innerHTML='<div style="padding:24px;background:#1E1B18;border-radius:12px;margin:16px;border:1px solid rgba(255,59,48,.3)">'+
      '<div style="font-size:24px;margin-bottom:8px">⚠️</div>'+
      '<div style="color:#FF6B6B;font-size:14px;font-weight:700;margin-bottom:6px">Erro ao carregar agenda</div>'+
      '<div style="color:#9B9B9B;font-size:12px;word-break:break-all">'+e.message+'</div>'+
      '<button onclick="_tabOk.agenda=false;renderAgenda()" style="margin-top:12px;padding:10px 20px;background:#E55A0C;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px">Tentar novamente</button>'+
    '</div>';
  } finally {
    _renderingAgenda=false; // release guard
  }
}

/* CALENDÁRIO */
async function renderCalendar(){
  var calWrap=document.getElementById('calWrap');
  if(!calWrap) return;
  var hj=fmt(hoje());
  var primeiroDia=new Date(_calAno,_calMes,1).getDay();
  var diasMes=new Date(_calAno,_calMes+1,0).getDate();

  var dias='';
  for(var i=0;i<primeiroDia;i++) dias+='<div class="cal-dia cd-vazio"></div>';
  for(var d=1;d<=diasMes;d++){
    var ds=_calAno+'-'+pad(_calMes+1)+'-'+pad(d);
    var passado=ds<hj, isHoje=ds===hj, isSel=_drillDia===ds;
    var cls='cal-dia';
    if(passado) cls+=' cd-pass';
    if(isHoje)  cls+=' cd-hoje';
    if(isSel)   cls+=' cd-sel';
    var dados=_calDados[ds];
    dias+='<div class="'+cls+'" onclick="drillDia(\''+ds+'\')">'+ 
      '<div class="cd-num">'+d+'</div>'+
      (dados&&dados.total?'<div class="cd-cnt">'+dados.total+'</div>':'')+
      '</div>';
  }

  calWrap.innerHTML=
    '<div class="cal-wrap">'+
    '<div class="cal-hdr">'+
      '<button class="cal-nav-btn" onclick="calNav(-1)" title="Mês anterior">&#8249;</button>'+
      '<button class="cal-mes-btn" onclick="abrirCalModal()" title="Escolher mês e ano">'+
        MESES[_calMes]+' '+_calAno+
      '</button>'+
      '<button class="cal-nav-btn hoje-btn" onclick="calHoje()" title="Hoje">Hoje</button>'+
      '<button class="cal-nav-btn" onclick="calNav(1)" title="Próximo mês">&#8250;</button>'+
    '</div>'+
    '<div class="cal-dias-sem">'+
      SEM.map(function(s){return'<div class="cal-ds">'+s+'</div>';}).join('')+
    '</div>'+
    '<div class="cal-grid">'+dias+'</div>'+
    '</div>';
}



async function _recarregarCalDados(){
  try{
    var dados=await api('rpc/agendamentos_mes',{method:'POST',
      body:JSON.stringify({p_salao_id:S.id,p_ano:_calAno,p_mes:_calMes+1}),
      headers:{'Prefer':''}});
    _calDados={};
    (dados||[]).forEach(function(d){_calDados[d.dia]=d;});
  }catch(e){console.warn('calDados:',e);}
}

async function calSetMes(mes){
  _calMes=mes; _drillDia=null;
  fecharCalModal();
  await _recarregarCalDados();
  renderCalendar();
  var dw=document.getElementById('drillWrap'); if(dw) dw.innerHTML='';
}

async function calSetAno(ano){
  _calAno=ano;
  fecharCalModal();
  await _recarregarCalDados();
  renderCalendar();
  var dw=document.getElementById('drillWrap'); if(dw) dw.innerHTML='';
}

async function calNav(dir){
  _calMes+=dir;
  if(_calMes>11){_calMes=0;_calAno++;}
  if(_calMes<0){_calMes=11;_calAno--;}
  _drillDia=null;
  var dados=await api('rpc/agendamentos_mes',{method:'POST',body:JSON.stringify({p_salao_id:S.id,p_ano:_calAno,p_mes:_calMes+1}),headers:{'Prefer':''}});
  _calDados={};
  (dados||[]).forEach(function(d){_calDados[d.dia]=d;});
  // Atualiza label do calendário
  var lbl=document.querySelector('.sec-label:last-of-type');
  renderCalendar();
  document.getElementById('drillWrap').innerHTML='';
}

async function calHoje(){
  var n=new Date();
  _calAno=n.getFullYear(); _calMes=n.getMonth(); _drillDia=null;
  await _recarregarCalDados();
  renderCalendar();
  var dw=document.getElementById('drillWrap'); if(dw) dw.innerHTML='';
}

async function drillDia(ds){
  _drillDia=ds;
  renderCalendar();
  var dw=document.getElementById('drillWrap');
  if(!dw){
    dw=document.createElement('div');
    dw.id='drillWrap';
    var cw=document.getElementById('calWrap');
    if(cw&&cw.parentNode) cw.parentNode.insertBefore(dw,cw.nextSibling);
    else{var tb=document.getElementById('tb-agenda');if(tb) tb.appendChild(dw);}
  }
  await renderDrill(ds);
  setTimeout(function(){dw.scrollIntoView({behavior:'smooth',block:'start'});},150);
}

async function renderDrill(ds){
  var drillWrap=document.getElementById('drillWrap');
  if(!drillWrap) return;
  drillWrap.innerHTML='<div class="loading">Carregando...</div>';
  var p=ds.split('-');
  var titulo=parseInt(p[2])+' de '+MESES[parseInt(p[1])-1]+' '+p[0];
  var ags=await api('agendamentos?salao_id=eq.'+S.id+'&data=eq.'+ds+'&order=hora&select=*,servicos(duracao)');
  ags=ags||[];
  var ativos=ags.filter(function(a){return a.status!=='cancelado';});
  var fat=ativos.reduce(function(s,a){return s+(a.servico_preco||0);},0);


  // Monta mapa hora->agendamento incluindo slots de duração
  var mapaHora={};
  ags.forEach(function(a){
    var pts=a.hora.substring(0,5).split(':');
    var inicioMin=parseInt(pts[0])*60+parseInt(pts[1]);
    var dur=(a.servicos&&a.servicos.duracao)||30;
    // Slot inicial carrega o objeto do agendamento
    mapaHora[a.hora.substring(0,5)]=a;
    // Slots subsequentes (duração - 30min) apontam para o mesmo agendamento
    for(var off=30;off<dur;off+=30){
      var sm=inicioMin+off;
      var st=pad(Math.floor(sm/60))+':'+pad(sm%60);
      if(!mapaHora[st]) mapaHora[st]={_continuacao:true,status:a.status,id:a.id};
    }
  });

  // Gera slots 09:00-19:00 a cada 30min
  var hojeDs=new Date().toISOString().slice(0,10);
  var isDrillHoje=(ds===hojeDs);
  // Use local date comparison to avoid UTC timezone shifting day
  var _now=new Date();
  var _localDs=_now.getFullYear()+'-'+String(_now.getMonth()+1).padStart(2,'0')+'-'+String(_now.getDate()).padStart(2,'0');
  isDrillHoje=(ds===_localDs);
  var drillAgoraMin=isDrillHoje?(_now.getHours()*60+_now.getMinutes()):0;
  // S4.4: Use salao horario from session (keys: ini/fim per weekday index)
  var _diaIdx=new Date(ds+'T12:00:00').getDay();
  var _horCfg=(S&&S.horario)?S.horario[String(_diaIdx)]:null;
  var _abreMin=9*60, _fechaMin=19*60;
  if(_horCfg===null){_abreMin=0;_fechaMin=0;} // dia fechado
  else if(_horCfg&&_horCfg.ini&&_horCfg.fim){
    var _ap=_horCfg.ini.split(':').map(Number);
    var _fp=_horCfg.fim.split(':').map(Number);
    _abreMin=_ap[0]*60+(_ap[1]||0);
    _fechaMin=_fp[0]*60+(_fp[1]||0);
  }
  var slotsHtml='';
  if(_abreMin===0&&_fechaMin===0){
    slotsHtml='<div style="text-align:center;padding:24px;color:var(--CZ);font-size:13px;font-weight:600">Estabelecimento fechado neste dia.</div>';
  }
  for(var m=_abreMin; m<_fechaMin; m+=30){
    var h=Math.floor(m/60), mn=m%60;
    var t=pad(h)+':'+pad(mn);
    var ag=mapaHora[t];
    var passadoSlot=isDrillHoje && m<drillAgoraMin;
    if(ag && ag._continuacao){
      // Slot de continuação — mostra como ocupado mas sem detalhes
      slotsHtml+=
        '<div class="grade-slot ocupado" style="opacity:.5">'+
        '<div class="gs-hora">'+t+'</div>'+
        '<div class="gs-body"><div class="gs-livre" style="color:var(--L);font-style:normal">Ocupado</div></div>'+
        '</div>';
    } else if(ag){
      var isCancelado=ag.status==='cancelado';
      var cls=isCancelado?'grade-slot cancelado':'grade-slot ocupado';
      var stbCls=ag.status==='confirmado'?'sc':ag.status==='cancelado'?'sx':'sp';
      var stbLbl=ag.status==='confirmado'?'confirmado':ag.status==='cancelado'?'cancelado':'pendente';
      var btns='';
      if(!isCancelado){
        if(ag.status==='pendente'){
          btns='<button class="gs-btn gs-conf" data-id="'+ag.id+'" onclick="confirmAg(this.dataset.id,\'drill\')">✓</button>';
        }
        if(ag.status!=='concluido'){
          btns+='<button class="gs-btn gs-done" data-id="'+ag.id+'" onclick="concluirAg(this.dataset.id)">✔ Concluído</button>';
        }
        btns+='<button class="gs-btn gs-canc" data-id="'+ag.id+'" onclick="cancelAg(this.dataset.id,\'drill\')">✕</button>';
      }
      slotsHtml+=
        '<div class="'+cls+'">'+
        '<div class="gs-hora">'+t+'</div>'+
        '<div class="gs-body">'+
          '<div class="gs-nome">'+esc(ag.cliente_nome)+'</div>'+
          '<div class="gs-srv">✂️ '+esc(ag.servico_nome)+'</div>'+
          '<div class="gs-tel">📱 '+ag.cliente_tel+'</div>'+
        '</div>'+
        '<div class="gs-right">'+
          '<div class="gs-preco">'+formatPrice(ag.servico_preco)+'</div>'+
          (ag.pago_pix?'<span style="font-size:9px;background:#dcfce7;color:#16a34a;border-radius:4px;padding:1px 5px;font-weight:700">PIX✓</span>':'')+
          '<span class="stb '+stbCls+'" style="font-size:9px">'+stbLbl+'</span>'+
          '<div class="gs-acts">'+btns+'</div>'+
        '</div>'+
        '</div>';
    } else {
      if(passadoSlot){
        slotsHtml+=
          '<div class="grade-slot passado" data-ds="'+ds+'" data-hora="'+t+'" onclick="abrirSlotPassado(this.dataset.ds,this.dataset.hora)" style="cursor:pointer;opacity:.7">'+
          '<div class="gs-hora" style="color:#bbb">'+t+'</div>'+
          '<div class="gs-body"><div class="gs-livre" style="color:#bbb;font-size:10px">+ Registrar</div></div>'+
          '</div>';
      } else {
        slotsHtml+=
          '<div class="grade-slot" data-ds="'+ds+'" data-hora="'+t+'" onclick="abrirNovoAg(this.dataset.ds,this.dataset.hora)" style="cursor:pointer">'+
          '<div class="gs-hora">'+t+'</div>'+
          '<div class="gs-body"><div class="gs-livre">Livre</div></div>'+
          '</div>';
      }
    }
  }

  drillWrap.innerHTML=
    '<div class="drill-hdr">'+
      '<button class="drill-back" onclick="voltarCal()">← Voltar</button>'+
      '<button onclick="abrirWalkin(_drillDia)" style="background:var(--primary);color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:800;cursor:pointer">⚡ Atendimento rápido</button>'+
      '<div class="drill-titulo">'+titulo+'</div>'+
    '</div>'+
    '<div class="metrics" style="margin-bottom:12px">'+
      '<div class="mc mc-L"><div class="mc-n">'+ativos.length+'</div><div class="mc-l">Agendados</div></div>'+
      '<div class="mc mc-V"><div class="mc-n">'+formatPrice(fat)+'</div><div class="mc-l">Faturamento</div></div>'+
      '<div class="mc mc-A"><div class="mc-n">'+(Math.max(0,Math.round((_fechaMin-_abreMin)/30)-ativos.length))+'</div><div class="mc-l">Horários disponíveis</div></div>'+
    '</div>'+
    '<div class="lista"><div class="lista-hdr"><h3>Grade do dia</h3>'+
      '<span class="tag-c" style="background:rgba(45,106,79,.1);color:var(--VD)">'+
        (Math.max(0,Math.round((_fechaMin-_abreMin)/30)-ativos.length))+' livre'+((Math.max(0,Math.round((_fechaMin-_abreMin)/30)-ativos.length))!==1?'s':'')+
      '</span></div>'+
    '<div class="grade-wrap">'+slotsHtml+'</div>'+
    '</div>';
}

async function voltarCal(){
  _drillDia=null;
  renderCalendar();
  document.getElementById('drillWrap').innerHTML='';
}
function abrirNovoAg(data, hora){
  abrirManual(data, hora);
}

function abrirSlotPassado(data, hora){
  var msg='⏰ O horário '+hora+' já passou.\n\nDeseja registrar este atendimento no histórico?';
  if(!confirm(msg)) return;
  abrirManual(data, hora, true);
}



/* ═══ ONBOARDING ═══ */
async function calcOnboarding(){
  var servicos=await api('servicos?salao_id=eq.'+S.id+'&ativo=eq.true&select=id').catch(function(){return [];});
  try{
    var sal=await api('saloes?id=eq.'+S.id+'&select=horario,fat_nome,fat_cpf_cnpj,pix_key');
    var sd=sal&&sal[0]?sal[0]:{};
    var h=sd.horario||{};
    var horario=Object.keys(h).some(function(d){return h[d]!==null;});
    return {
      servico: servicos&&servicos.length>0,
      horario: horario,
      faturamento: !!(sd.fat_nome&&sd.fat_cpf_cnpj),
      pix: !!(sd.pix_key)
    };
  }catch(e){
    return {servico:servicos&&servicos.length>0,horario:false,faturamento:false,pix:false};
  }
}

async function renderOnboarding(){
  var el = document.getElementById('onboardingWrap');
  if(!el) return;
  if(localStorage.getItem('cortai_ob_'+S.id)==='done'){ el.style.display='none'; return; }

  var p = await calcOnboarding();
  var total = Object.keys(p).length;
  var feitos = Object.values(p).filter(Boolean).length;
  if(feitos >= total){ el.style.display='none'; localStorage.setItem('cortai_ob_'+S.id,'done'); return; }

  el.style.display = 'block';
  var steps = [
    {key:'servico',    icon:'📋',txt:'Adicione seus serviços',  sub:'Defina o que você oferece e os preços',  aba:'servicos'},
    {key:'horario',    icon:'🕐',txt:'Configure seus horários', sub:'Defina quando você atende',              aba:'pagina'},
    {key:'faturamento',icon:'💳',txt:'Complete seus dados',     sub:'Nome e CPF/CNPJ para cobranças',         aba:'pagina'},
    {key:'pix',        icon:'⚡',txt:'Cadastre sua chave PIX',  sub:'Seus clientes podem pagar antecipado',   aba:'pagina'},
  ];
  var pct = Math.round((feitos/total)*100);
  var html = '<div class="onboarding">';
  html += '<div class="onboarding-tit">'+
    '<span>🚀 Configuração inicial</span>'+
    '<span style="font-size:11px;font-weight:700;opacity:.7">'+feitos+'/'+total+' concluídos</span>'+
  '</div>';
  // Progress bar
  html += '<div style="height:4px;background:rgba(255,255,255,.12);border-radius:2px;margin-bottom:12px;overflow:hidden">'+
    '<div style="height:100%;width:'+pct+'%;background:var(--L,#FF5C1A);border-radius:2px;transition:.4s"></div></div>';
  // ITEM 4: Show 1 pending step at a time + list of completed
  var pending = steps.filter(function(s){ return !p[s.key]; });
  var done_steps = steps.filter(function(s){ return p[s.key]; });
  var current = pending[0];
  html += '<div class="ob-steps">';
  // Done steps (compact)
  done_steps.forEach(function(s){
    html += '<div class="ob-step done" style="opacity:.5;pointer-events:none">'+
      '<div class="ob-check" style="background:var(--VD,#4ade80);border-color:var(--VD,#4ade80);color:#fff">✓</div>'+
      '<div style="flex:1;font-size:11px;font-weight:700">'+s.icon+' '+s.txt+'</div>'+
    '</div>';
  });
  // Current active step (prominent)
  if(current){
    html += '<div class="ob-step" data-aba="'+current.aba+'" onclick="irParaAba(this.dataset.aba)" style="border:2px solid var(--primary,#FF5C1A);border-radius:10px;background:var(--primary-light,rgba(255,92,26,.08));cursor:pointer">'+
      '<div class="ob-check"></div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:13px;font-weight:800;color:var(--primary,#FF5C1A)">'+current.icon+' '+current.txt+'</div>'+
        '<div style="font-size:11px;opacity:.65;margin-top:2px">'+current.sub+'</div>'+
      '</div>'+
      '<div style="font-size:18px;color:var(--primary,#FF5C1A)">→</div>'+
    '</div>';
    // Upcoming steps (muted)
    pending.slice(1).forEach(function(s){
      html += '<div class="ob-step" style="opacity:.35;cursor:default">'+
        '<div class="ob-check"></div>'+
        '<div style="flex:1;font-size:11px;font-weight:700">'+s.icon+' '+s.txt+'</div>'+
      '</div>';
    });
  }
  html += '</div>';
  html += '<div class="ob-dismiss" onclick="dismissOnboarding()">Não mostrar novamente</div>';
  html += '</div>';
  el.innerHTML = html;
}

function irParaAba(aba){
  // Use data-tab attribute — works for both sidebar (.sb-item) and bottom nav (.bnav-item)
  var btn = document.querySelector('[data-tab="'+aba+'"]');
  if(btn){ btn.click(); return; }
  // Fallback: call tabSidebar directly
  if(typeof tabSidebar==='function') tabSidebar(aba, null);
}

function dismissOnboarding(){
  localStorage.setItem('cortai_ob_'+S.id,'done');
  var el=document.getElementById('onboardingWrap');
  if(el) el.style.display='none';
}


/* ═══ ITEM 1: WALK-IN / ATENDIMENTO RÁPIDO ═══ */
function abrirWalkin(ds){
  // Pre-fill today, hora=agora, status=concluido
  var agora = new Date();
  var h = String(agora.getHours()).padStart(2,'0') + ':' + String(agora.getMinutes()).padStart(2,'0');
  if(typeof abrirManual === 'function'){
    abrirManual(ds || agora.toISOString().split('T')[0], h, true);
  }
}

/* ═══ CORREÇÃO 2: Collapsible sections ═══ */
function toggleSection(id){
  var group=document.querySelector('[data-section="'+id+'"]');
  if(!group) return;
  var body=group.querySelector('.section-group-body');
  var chevron=group.querySelector('.section-chevron');
  if(!body) return;
  var isCollapsed=body.classList.toggle('collapsed');
  if(chevron) chevron.classList.toggle('collapsed',isCollapsed);
  try{localStorage.setItem(id+'-collapsed',isCollapsed?'1':'0');}catch(e){}
}

/* ═══════════════════════════════════════
   MODAL: NOVO AGENDAMENTO
═══════════════════════════════════════ */
function _popularSrvOpcoes(srvs){
  var lista=document.getElementById('srvOpLista');
  if(!lista) return;
  lista.innerHTML='';
  if(!srvs||!srvs.length){
    lista.innerHTML='<div style="font-size:13px;color:var(--text-3,var(--CZ));padding:10px 0">Nenhum servi\u00e7o cadastrado.<br>'+
      '<a onclick="tabSidebar(\'servicos\',document.querySelector(\'[data-tab=servicos]\'))" style="color:var(--primary);cursor:pointer;font-weight:700">Cadastrar servi\u00e7os \u2192</a></div>';
    return;
  }
  srvs.forEach(function(s){
    var preco=s.preco||0;
    var precoFmt='R$\u00a0'+(preco/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
    var item=document.createElement('div');
    item.className='srv-op-btn';
    item.dataset.id=s.id;
    item.dataset.nome=s.nome;
    item.dataset.dur=s.duracao||30;
    item.dataset.preco=preco;
    item.innerHTML=
      '<span style="font-size:16px;flex-shrink:0">'+(s.icone||s.ico||'\ud83d\udccb')+'</span>'+
      '<span style="flex:1;font-size:13px;font-weight:700;font-family:var(--font-brand)">'+(s.nome||'')+'</span>'+
      '<span style="font-size:13px;font-weight:700;color:var(--primary);font-family:var(--font-brand)">'+precoFmt+'</span>';
    item.onclick=function(){
      lista.querySelectorAll('.srv-op-btn').forEach(function(b){b.classList.remove('sel');});
      item.classList.add('sel');
    };
    lista.appendChild(item);
  });
}

async function abrirManual(data, hora, isRegistro){
  if(!window.S||!window.S.id){
    if(typeof toast==='function') toast('Aguarde o painel carregar.','err');
    return;
  }
  var ov=document.getElementById('ovManual');
  if(!ov){ console.error('ovManual not found'); return; }

  // Show modal first
  ov.dataset.registro=isRegistro?'1':'';
  ov.style.display='flex';
  ov.classList.add('show');
  document.body.style.overflow='hidden';

  // Title
  var hdr=ov.querySelector('h3');
  if(hdr) hdr.textContent=isRegistro?'\ud83d\udccb Registrar atendimento':'\ud83d\udcc5 Novo agendamento';

  // Clear errors
  var errEl=document.getElementById('manErr');
  if(errEl){errEl.textContent='';errEl.style.display='none';}
  var conflictBox=document.getElementById('conflictBox');
  if(conflictBox) conflictBox.style.display='none';

  // Clear fields
  var nomeEl=document.getElementById('manNome');
  var telEl=document.getElementById('manTel');
  if(nomeEl) nomeEl.value='';
  if(telEl) telEl.value='';

  // Date default = today
  var dataEl=document.getElementById('manData');
  if(dataEl){
    if(data){
      dataEl.value=data;
    } else {
      var hj=new Date();
      dataEl.value=hj.getFullYear()+'-'+String(hj.getMonth()+1).padStart(2,'0')+'-'+String(hj.getDate()).padStart(2,'0');
    }
  }

  // Hours 07:00–21:30
  var horaEl=document.getElementById('manHora');
  if(horaEl){
    horaEl.innerHTML='';
    for(var hh=7;hh<22;hh++){
      for(var mm=0;mm<60;mm+=30){
        var t=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
        var opt=document.createElement('option');
        opt.value=t; opt.textContent=t;
        if(hora&&hora.startsWith(t.substring(0,5))) opt.selected=true;
        horaEl.appendChild(opt);
      }
    }
  }

  // Services — load from cache or fetch
  var lista=document.getElementById('srvOpLista');
  if(lista){
    if(!window._servicos||!window._servicos.length){
      lista.innerHTML='<div class="loading" style="padding:10px">Carregando servi\u00e7os...</div>';
      try{
        window._servicos=await api('servicos?salao_id=eq.'+S.id+'&ativo=eq.true&order=ordem')||[];
      }catch(e){
        lista.innerHTML='<div style="color:var(--error);font-size:13px;padding:10px">Erro ao carregar servi\u00e7os.</div>';
        return;
      }
    }
    _popularSrvOpcoes(window._servicos);
  }

  // Professionals
  var profWrap=document.getElementById('manProfWrap');
  var profSel=document.getElementById('manProf');
  if(profWrap&&profSel){
    var temProfs=window._profs&&window._profs.length>0;
    profWrap.style.display=temProfs?'':'none';
    if(temProfs){
      profSel.innerHTML='<option value="">— Qualquer dispon\u00edvel —</option>';
      window._profs.forEach(function(p){
        var o=document.createElement('option');
        o.value=p.id;o.textContent=p.nome;profSel.appendChild(o);
      });
    }
  }
}

function fecharManual(){
  var ov=document.getElementById('ovManual');
  if(ov){
    ov.classList.remove('show');
    ov.style.display='none';
  }
  document.body.style.overflow='';
}

async function salvarManual(){
  var errEl=document.getElementById('manErr');
  var btn=document.getElementById('btnSvMan');
  if(errEl){errEl.textContent='';errEl.style.display='none';}

  var srvSel=document.querySelector('#srvOpLista .srv-op-btn.sel');
  var data=document.getElementById('manData')?.value;
  var hora=document.getElementById('manHora')?.value;
  var nome=document.getElementById('manNome')?.value.trim();
  var tel=(document.getElementById('manTel')?.value||'').replace(/\D/g,'');
  var ov=document.getElementById('ovManual');
  var isRegistro=ov&&ov.dataset.registro==='1';

  if(!srvSel){if(errEl){errEl.textContent='Selecione um servi\u00e7o';errEl.style.display='block';}return;}
  if(!data){if(errEl){errEl.textContent='Informe a data';errEl.style.display='block';}return;}
  if(!hora){if(errEl){errEl.textContent='Informe o hor\u00e1rio';errEl.style.display='block';}return;}
  if(!nome){if(errEl){errEl.textContent='Informe o nome do cliente';errEl.style.display='block';}return;}

  var conflictBox=document.getElementById('conflictBox');
  if(conflictBox) conflictBox.style.display='none';

  try{
    var existing=await api('agendamentos?salao_id=eq.'+S.id+'&data=eq.'+data+'&hora=eq.'+hora+':00&status=neq.cancelado&select=id');
    if(existing&&existing.length>0){
      if(conflictBox) conflictBox.style.display='block';
      return;
    }
  }catch(e){}

  if(btn){btn.disabled=true;btn.textContent='Salvando...';}

  var profSelEl=document.getElementById('manProf');
  var profId=(profSelEl&&profSelEl.value)?profSelEl.value:null;

  try{
    await rpc('criar_agendamento',{
      p_slug:S.slug,
      p_servico_id:srvSel.dataset.id,
      p_data:data,
      p_hora:hora+':00',
      p_cliente_nome:nome,
      p_cliente_tel:tel||'00000000000',
      p_profissional_id:profId,
    });
    fecharManual();
    if(typeof toast==='function') toast('\u2713 Agendamento salvo!','ok');
    await _recarregarCalDados();
    renderCalendar();
    if(window._drillDia) await renderDrill(window._drillDia);
    if(typeof renderAgenda==='function'){ _tabOk.agenda=false; renderAgenda(); }
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='\u2713 Confirmar agendamento';}
    if(errEl){errEl.textContent='Erro: '+e.message;errEl.style.display='block';}
  }
}

function abrirCalModal(){
  // Remove existing modal if any
  var old=document.getElementById('calModalOv'); if(old) old.remove();

  var anoAtual=new Date().getFullYear();
  // Build month buttons
  var meses=['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
             'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var mesHtml=meses.map(function(m,i){
    var sel=i===_calMes;
    return '<button class="cpm-btn'+(sel?' sel':'')+'" onclick="calSetMes('+i+')">'+m+'</button>';
  }).join('');

  // Build year buttons: current-6 to current+6
  var anoHtml='';
  for(var y=anoAtual-6;y<=anoAtual+6;y++){
    var sel=y===_calAno;
    anoHtml+='<button class="cpa-btn'+(sel?' sel':'')+'" id="cpabtn'+y+'" onclick="calSetAno('+y+')">'+y+'</button>';
  }

  var ov=document.createElement('div');
  ov.id='calModalOv';
  ov.innerHTML=
    '<div class="cal-modal-box">'+
      '<div class="cal-modal-hdr">'+
        '<span class="cal-modal-tit">Mês e ano</span>'+
        '<button class="cal-modal-close" onclick="fecharCalModal()">✕</button>'+
      '</div>'+
      '<div class="cal-modal-label">Mês</div>'+
      '<div class="cal-modal-meses">'+mesHtml+'</div>'+
      '<div class="cal-modal-label" style="margin-top:12px">Ano</div>'+
      '<div class="cal-modal-anos">'+anoHtml+'</div>'+
    '</div>';
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)fecharCalModal();});
  // Scroll selected year into view
  setTimeout(function(){var btn=document.getElementById('cpabtn'+_calAno);if(btn)btn.scrollIntoView({block:'center',inline:'center'});},50);
}

function fecharCalModal(){
  var ov=document.getElementById('calModalOv'); if(ov) ov.remove();
}
