/* Agenda Painel — Clientes */
/* ═══ CLIENTES ═══ */
var _cliPage=0, _cliPerPage=50, _cliTotal=0;

async function renderClientes(page){
  page=page||0; _cliPage=page;
  _tabOk.clientes=true;
  var el=document.getElementById('tb-clientes');
  if(page===0) el.innerHTML='<div class="loading">Carregando...</div>';

  // Se filtrado por profissional, exibe clientes desse profissional
  if(_profFiltro && page===0){
    await _renderClientesPorProf(el);
    return;
  }

  var offset=page*_cliPerPage;
  var now=new Date();
  var wd=now.getDay()||7;
  var mon=new Date(now); mon.setDate(now.getDate()-wd+1); mon.setHours(0,0,0,0);
  var weekStart=fmt(mon);
  var monthStart=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-01';
  var todayStr=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
  var profQ=_profFiltro?'&profissional_id=eq.'+_profFiltro:'';
  var results=await Promise.all([
    api('clientes?salao_id=eq.'+S.id+'&order=total_visitas.desc&select=*&limit='+_cliPerPage+'&offset='+offset,
      {headers:{'Prefer':'count=exact'}}),
    page===0?api('rpc/clientes_inativos',{method:'POST',body:JSON.stringify({p_salao_id:S.id,p_dias:30}),headers:{'Prefer':''}}):Promise.resolve([]),
    page===0?api('agendamentos?salao_id=eq.'+S.id+'&data=gte.'+weekStart+'&status=neq.cancelado'+profQ+'&select=servico_preco'):Promise.resolve([]),
    page===0?api('agendamentos?salao_id=eq.'+S.id+'&data=gte.'+monthStart+'&status=neq.cancelado'+profQ+'&select=servico_preco'):Promise.resolve([]),
    page===0?api('agendamentos?salao_id=eq.'+S.id+'&data=eq.'+todayStr+'&status=neq.cancelado'+profQ+'&select=servico_preco'):Promise.resolve([])
  ]);
  var clis=results[0]||[], inativos=results[1]||[];
  var receitaSem=(results[2]||[]).reduce(function(s,a){return s+(a.servico_preco||0);},0);
  var receitaMes=(results[3]||[]).reduce(function(s,a){return s+(a.servico_preco||0);},0);
  var receitaDia=(results[4]||[]).reduce(function(s,a){return s+(a.servico_preco||0);},0);
  /* Métricas — sempre visíveis */
  var html=renderProfStrip()+
    '<div class="metrics">'+
    '<div class="mc"><div class="mc-n">'+clis.length+'</div><div class="mc-l">Clientes</div></div>'+
    '<div class="mc mc-V"><div class="mc-n" style="font-size:clamp(11px,3.5vw,16px)">'+formatPrice(receitaDia)+'</div><div class="mc-l">Receita hoje</div></div>'+
    '<div class="mc mc-A"><div class="mc-n" style="font-size:clamp(11px,3.5vw,16px)">'+formatPrice(receitaSem)+'</div><div class="mc-l">Receita semanal</div></div>'+
    '<div class="mc"><div class="mc-n" style="font-size:clamp(11px,3.5vw,16px)">'+formatPrice(receitaMes)+'</div><div class="mc-l">Receita mensal</div></div>'+
    '</div>';

  /* Lista de clientes — colapsável */
  var _cliBody='<div class="lista"><div class="lista-hdr"><h3>Histórico de clientes</h3></div>';
  if(clis.length===0){
    _cliBody+='<div class="empty">👥<br>Nenhum cliente ainda</div>';
  } else {
    clis.forEach(function(c){
      _cliBody+='<div class="cli-item">'+
        '<div class="cli-av">👤</div>'+
        '<div class="cli-info"><div class="cli-nm">'+esc(c.nome)+'</div><div class="cli-mt">'+c.telefone+' · '+c.total_visitas+' visita'+(c.total_visitas!==1?'s':'')+'</div></div>'+
        '<div class="cli-st"><div class="cli-g">'+formatPrice(c.total_gasto||0)+'</div><div class="cli-u">'+fmtBR(c.ultima_visita)+'</div></div>'+
        '</div>';
    });
  }
  _cliBody+='</div>';
  var _cliLbl='Clientes'+(clis.length?' <span style="background:var(--primary);color:#fff;border-radius:20px;padding:1px 8px;font-size:10px;font-weight:700;margin-left:6px">'+clis.length+'</span>':'');
  var _cliC=localStorage.getItem('sec-clientes-collapsed')!=='0'; // fechado por padrão
  html+=typeof _secGroup==='function'?_secGroup('sec-clientes',_cliLbl,_cliC,_cliBody):_cliBody;

  /* ── INSIGHT: "Prestes a te esquecer" dark card ── */
  if(inativos.length>0){
    var voltamSempre=clis.filter(function(c){return c.total_visitas>=3;}).length;
    html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 16px 12px">'+
      '<div class="mc-dark" style="border-radius:12px;padding:14px 16px">'+
        '<div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#C99A7A;margin-bottom:6px">Sumindo</div>'+
        '<div style="font-size:26px;font-weight:800;color:rgba(251,247,241,.92)">'+inativos.length+'</div>'+
        '<div class="mc-sub">clientes há 30+ dias sem agend.</div>'+
      '</div>'+
      '<div class="mc-dark" style="border-radius:12px;padding:14px 16px">'+
        '<div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#C99A7A;margin-bottom:6px">Voltam sempre</div>'+
        '<div style="font-size:26px;font-weight:800;color:rgba(251,247,241,.92)">'+voltamSempre+'</div>'+
        '<div class="mc-sub">clientes com 3+ visitas</div>'+
      '</div>'+
    '</div>';
  }

  /* Clientes inativos — win-back redesenhado */
  if(inativos.length>0){
    var _inContent='<div class="winback-card">'+
      '<div class="winback-title">Reconquistar</div>'+
      '<div class="winback-headline">'+inativos.length+' cliente'+(inativos.length!==1?'s que sumiu':'s que sumiram')+'</div>'+
      '<div class="winback-sub">Uma mensagem com seu link costuma bastar para trazer de volta.</div>';
    inativos.slice(0,8).forEach(function(c){
      var tel=c.telefone.replace(/\D/g,'');
      var msg=encodeURIComponent('Olá '+c.nome.split(' ')[0]+'! 👋\n\nSentimos sua falta aqui na '+S.nome+'!\n\nQue tal agendar um horário? Fica fácil aqui:\n'+BASE+'/agendar.html?slug='+S.slug+'\n\nAté logo! 😊');
      _inContent+=
        '<div class="winback-item">'+
          '<div class="winback-item-info">'+
            '<div class="winback-item-nome">'+esc(c.nome)+'</div>'+
            '<div class="winback-item-dias">'+c.dias_ausente+' dias sem agendar</div>'+
          '</div>'+
          '<a class="winback-btn" href="https://wa.me/55'+tel+'?text='+msg+'" target="_blank" rel="noopener">'+
            '💬 Chamar'+
          '</a>'+
        '</div>';
    });
    _inContent+='</div>';
    var _inC=localStorage.getItem('sec-inativos-collapsed')!=='0';
    html+=typeof _secGroup==='function'?_secGroup('sec-inativos','Reconquistar clientes',_inC,_inContent):_inContent;
  }
  // S5.4: Show "load more" if there may be more results
  if(clis.length===_cliPerPage){
    html+='<div style="text-align:center;padding:16px">'+
      '<button onclick="renderClientes(_cliPage+1)" style="background:transparent;border:1.5px solid var(--bd);border-radius:10px;padding:10px 24px;font-size:13px;font-weight:700;color:var(--CZ);cursor:pointer">Ver mais clientes...</button>'+
      '</div>';
  }
  if(page===0) el.innerHTML=html;
  else el.innerHTML=el.innerHTML.replace(/<div style="text-align:center[^"]*"[^>]*>.*?<\/div>\s*$/, '')+html;
}

async function _renderClientesPorProf(el){
  var prof=_profs.find(function(p){return p.id===_profFiltro;});
  var profNome=prof?prof.nome:'Profissional';
  try{
    var now=new Date();
    var monthStart=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-01';
    var ags=await api('agendamentos?salao_id=eq.'+S.id+'&profissional_id=eq.'+_profFiltro+'&status=neq.cancelado&select=cliente_nome,cliente_tel,servico_preco,data,servico_nome&order=data.desc&limit=500');
    ags=ags||[];
    // Agrega por cliente (telefone como chave)
    var mapa={};
    ags.forEach(function(a){
      var k=(a.cliente_tel||a.cliente_nome||'').replace(/\D/g,'').slice(-9)||a.cliente_nome;
      if(!k) return;
      if(!mapa[k]) mapa[k]={nome:a.cliente_nome,telefone:a.cliente_tel,visitas:0,gasto:0,ultima:a.data};
      mapa[k].visitas++;
      mapa[k].gasto+=(a.servico_preco||0);
      if(a.data>mapa[k].ultima) mapa[k].ultima=a.data;
    });
    var lista=Object.values(mapa).sort(function(a,b){return b.visitas-a.visitas;});
    var receitaMes=ags.filter(function(a){return a.data>=monthStart;}).reduce(function(s,a){return s+(a.servico_preco||0);},0);
    var comPct=prof&&prof.comissao_pct!=null?prof.comissao_pct:null;
    var html=renderProfStrip()+
      '<div class="metrics">'+
      '<div class="mc"><div class="mc-n">'+lista.length+'</div><div class="mc-l">Clientes de '+esc(profNome.split(' ')[0])+'</div></div>'+
      '<div class="mc mc-V"><div class="mc-n" style="font-size:clamp(11px,3.5vw,16px)">'+formatPrice(receitaMes)+'</div><div class="mc-l">Receita do mês</div></div>'+
      (comPct!==null?'<div class="mc" style="background:var(--VD-bg,rgba(45,106,79,.1))"><div class="mc-n" style="color:var(--VD);font-size:clamp(11px,3.5vw,16px)">'+formatPrice(Math.round(receitaMes*comPct/100))+'</div><div class="mc-l" style="color:var(--VD)">Comissão ('+comPct+'%)</div></div>':'')+
      '</div>';
    var _cliBody='<div class="lista"><div class="lista-hdr"><h3>Clientes de '+esc(profNome)+'</h3><span class="tag-c">'+lista.length+'</span></div>';
    if(!lista.length){
      _cliBody+='<div class="empty">👥<br>Nenhum atendimento registrado</div>';
    } else {
      lista.forEach(function(c){
        _cliBody+='<div class="cli-item">'+
          '<div class="cli-av" style="background:var(--primary-light);color:var(--primary);font-weight:800;font-size:16px">'+esc(c.nome||'?').charAt(0).toUpperCase()+'</div>'+
          '<div class="cli-info"><div class="cli-nm">'+esc(c.nome)+'</div><div class="cli-mt">'+esc(c.telefone||'')+'&nbsp;· '+c.visitas+' visita'+(c.visitas!==1?'s':'')+'</div></div>'+
          '<div class="cli-st"><div class="cli-g">'+formatPrice(c.gasto)+'</div><div class="cli-u">'+fmtBR(c.ultima)+'</div></div>'+
          '</div>';
      });
    }
    _cliBody+='</div>';
    html+=_cliBody;
    el.innerHTML=html;
  }catch(e){
    el.innerHTML=renderProfStrip()+'<div class="empty">Erro ao carregar: '+esc(e.message)+'</div>';
  }
}

