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
  var voltamSempre=clis.filter(function(c){return c.total_visitas>=3;}).length;
  var ticketMedio=clis.length>0?Math.round(clis.reduce(function(s,c){return s+(c.total_gasto||0);},0)/clis.length):0;

  /* Métricas — inline styles */
  var _CK='background:#fff;border:1px solid rgba(23,19,15,.08);border-radius:18px;padding:20px';
  var _CL='font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#A79C92;margin-bottom:4px';
  var _CN='font-size:36px;font-weight:700;letter-spacing:-.03em;line-height:1.15;color:#17130F;margin:0 0 4px';
  var _CS='font-size:13.5px;color:#8A8078';
  var html=renderProfStrip()+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;padding:26px 26px 0">'+
    '<div style="'+_CK+'"><div style="'+_CL+'">Clientes</div><div style="'+_CN+'">'+clis.length+'</div><div style="'+_CS+'">cadastrados</div></div>'+
    '<div style="'+_CK+'"><div style="'+_CL+'">Ticket médio</div><div style="'+_CN+'">'+formatPrice(ticketMedio)+'</div><div style="'+_CS+'">por cliente</div></div>'+
    '<div style="'+_CK+'"><div style="'+_CL+'">Voltam sempre</div><div style="'+_CN+'">'+voltamSempre+'</div><div style="'+_CS+'">3+ visitas</div></div>'+
    (inativos.length>0?'<div style="background:#17130F;border-radius:18px;padding:20px"><div style="font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:rgba(251,247,241,.5);margin-bottom:4px">Prestes a te esquecer</div><div style="font-size:36px;font-weight:700;letter-spacing:-.03em;line-height:1.15;color:#FBF7F1;margin:0 0 4px">'+inativos.length+'</div><div style="font-size:13.5px;color:rgba(251,247,241,.55)">há 30+ dias sem agendar</div></div>':'')+
    '</div>';

  /* Lista de clientes — table grid */
  var _cliBody=
    '<div style="background:#fff;border:1px solid rgba(23,19,15,.08);border-radius:20px;overflow:hidden;margin:18px 26px 0">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:20px 24px;border-bottom:1px solid rgba(23,19,15,.08)">'+
        '<div style="font-size:17px;font-weight:700;letter-spacing:-.02em;color:#17130F">Clientes</div>'+
        '<span style="font-size:12.5px;font-weight:700;background:#F1E9DE;color:#5C544C;padding:6px 11px;border-radius:999px">'+clis.length+' cadastrado'+(clis.length!==1?'s':'')+'</span>'+
      '</div>';
  if(clis.length===0){
    _cliBody+='<div class="empty">👥<br>Nenhum cliente ainda</div>';
  } else {
    _cliBody+='<div style="display:grid;grid-template-columns:1fr 140px 110px 80px;gap:12px;padding:10px 24px 12px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#A79C92;border-bottom:1px solid rgba(23,19,15,.08)">'+
      '<span>Cliente</span><span>Último atend.</span><span>Total gasto</span><span></span></div>';
    clis.forEach(function(c){
      var ini=esc((c.nome||'?').trim().split(/\s+/).filter(Boolean).map(function(w){return w[0];}).slice(0,2).join('')).toUpperCase();
      var diasAbs=c.ultima_visita?Math.round((new Date()-new Date(c.ultima_visita))/(1000*60*60*24)):999;
      var statusTxt=diasAbs===0?'Hoje':diasAbs===1?'Ontem':c.total_visitas>=3?'Fiel':'Ativo';
      var statusCor=c.total_visitas>=3?'#1E7A46':(diasAbs>60?'#C64C05':'#A79C92');
      _cliBody+=
        '<div style="display:grid;grid-template-columns:1fr 140px 110px 80px;gap:12px;align-items:center;padding:14px 24px;border-bottom:1px solid rgba(23,19,15,.07)">'+
          '<div style="display:flex;align-items:center;gap:12px;min-width:0">'+
            '<div style="width:34px;height:34px;border-radius:50%;background:#F1E9DE;display:grid;place-items:center;font-size:12px;font-weight:700;color:#8A6A48;flex-shrink:0">'+ini+'</div>'+
            '<div style="min-width:0">'+
              '<div style="font-size:14.5px;font-weight:700;color:#17130F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(c.nome)+'</div>'+
              '<div style="font-size:12.5px;color:#8A8078">'+esc(c.telefone||'')+'</div>'+
            '</div>'+
          '</div>'+
          '<span style="font-size:13.5px;color:#5C544C">'+fmtBR(c.ultima_visita)+'</span>'+
          '<span style="font-size:14.5px;font-weight:700;color:#17130F">'+formatPrice(c.total_gasto||0)+'</span>'+
          '<span style="font-size:12.5px;font-weight:700;color:'+statusCor+';text-align:right">'+statusTxt+'</span>'+
        '</div>';
    });
  }
  _cliBody+='</div>';
  html+=_cliBody;

  /* Reconquistar — card design do Painel.dc */
  if(inativos.length>0){
    var _winHtml=
      '<div style="background:#fff;border:1px solid rgba(23,19,15,.08);border-radius:20px;overflow:hidden;margin:18px 26px 0">'+
        '<div style="padding:20px 24px;border-bottom:1px solid rgba(23,19,15,.08)">'+
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:4px">'+
            '<div style="font-size:17px;font-weight:700;letter-spacing:-.02em;color:#17130F">Reconquistar</div>'+
            '<span style="font-size:12.5px;font-weight:700;background:rgba(229,90,12,.1);color:#C64C05;padding:6px 11px;border-radius:999px">'+inativos.length+' cliente'+(inativos.length!==1?'s':'')+'</span>'+
          '</div>'+
          '<div style="font-size:14px;color:#6B625A;line-height:1.5">Juntos, já deixaram dinheiro no caixa e não voltam há mais de 30 dias. Uma mensagem com seu link costuma bastar.</div>'+
        '</div>'+
        '<div style="display:flex;flex-direction:column;padding:0 24px 12px">';
    inativos.slice(0,8).forEach(function(c){
      var tel=c.telefone.replace(/\D/g,'');
      var ini=esc((c.nome||'?').trim().split(/\s+/).filter(Boolean).map(function(w){return w[0];}).slice(0,2).join('')).toUpperCase();
      var msg=encodeURIComponent('Olá '+c.nome.split(' ')[0]+'! 👋\n\nSentimos sua falta aqui na '+S.nome+'!\n\nQue tal agendar? Fica fácil aqui:\n'+BASE+'/agendar.html?slug='+S.slug+'\n\nAté logo! 😊');
      _winHtml+=
        '<div style="display:flex;align-items:center;gap:14px;border:1px solid rgba(23,19,15,.09);border-radius:14px;padding:14px 16px;margin-top:10px">'+
          '<div style="width:38px;height:38px;border-radius:50%;background:#F1E9DE;display:grid;place-items:center;font-size:13px;font-weight:700;color:#8A6A48;flex-shrink:0">'+ini+'</div>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-size:15px;font-weight:700;color:#17130F">'+esc(c.nome)+'</div>'+
            '<div style="font-size:13px;color:#8A8078">há '+c.dias_ausente+' dias sem agendar</div>'+
          '</div>'+
          '<a href="https://wa.me/55'+tel+'?text='+msg+'" target="_blank" rel="noopener" style="border:none;cursor:pointer;background:#17130F;color:#FBF7F1;font-size:13px;font-weight:700;padding:10px 14px;border-radius:9px;white-space:nowrap;text-decoration:none;display:inline-block">Chamar</a>'+
        '</div>';
    });
    _winHtml+='</div></div>';
    html+=_winHtml;
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
    var _CK2='background:#fff;border:1px solid rgba(23,19,15,.08);border-radius:18px;padding:20px';
    var _CL2='font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#A79C92;margin-bottom:4px';
    var _CN2='font-size:36px;font-weight:700;letter-spacing:-.03em;line-height:1.15;color:#17130F;margin:0 0 4px';
    var html=renderProfStrip()+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;padding:26px 26px 0">'+
      '<div style="'+_CK2+'"><div style="'+_CL2+'">Clientes de '+esc(profNome.split(' ')[0])+'</div><div style="'+_CN2+'">'+lista.length+'</div></div>'+
      '<div style="'+_CK2+'"><div style="'+_CL2+'">Receita do mês</div><div style="'+_CN2+'">'+formatPrice(receitaMes)+'</div></div>'+
      (comPct!==null?'<div style="background:rgba(30,122,70,.1);border:1px solid rgba(30,122,70,.12);border-radius:18px;padding:20px"><div style="font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#1E7A46;margin-bottom:4px">Comissão ('+comPct+'%)</div><div style="font-size:36px;font-weight:700;letter-spacing:-.03em;line-height:1.15;color:#1E7A46;margin:0 0 4px">'+formatPrice(Math.round(receitaMes*comPct/100))+'</div></div>':'')+
      '</div>';
    var _cliBody=
      '<div style="background:#fff;border:1px solid rgba(23,19,15,.08);border-radius:20px;overflow:hidden;margin:18px 26px 0">'+
        '<div style="padding:18px 24px;border-bottom:1px solid rgba(23,19,15,.08);font-size:17px;font-weight:700;color:#17130F">Clientes de '+esc(profNome)+'</div>';
    if(!lista.length){
      _cliBody+='<div style="padding:40px 24px;text-align:center;color:#8A8078;font-size:14px">👥 Nenhum atendimento registrado</div>';
    } else {
      lista.forEach(function(c){
        var _ini=esc((c.nome||'?').trim().split(/\s+/).filter(Boolean).map(function(w){return w[0];}).slice(0,2).join('')).toUpperCase();
        _cliBody+=
          '<div style="display:flex;align-items:center;padding:13px 24px;border-bottom:1px solid rgba(23,19,15,.07);gap:12px">'+
            '<div style="width:34px;height:34px;border-radius:50%;background:#F1E9DE;display:grid;place-items:center;font-size:12px;font-weight:700;color:#8A6A48;flex-shrink:0">'+_ini+'</div>'+
            '<div style="flex:1;min-width:0">'+
              '<div style="font-size:14.5px;font-weight:700;color:#17130F">'+esc(c.nome)+'</div>'+
              '<div style="font-size:12.5px;color:#8A8078">'+esc(c.telefone||'')+(c.telefone?' · ':'')+c.visitas+' visita'+(c.visitas!==1?'s':'')+'</div>'+
            '</div>'+
            '<div style="text-align:right;flex-shrink:0">'+
              '<div style="font-size:14.5px;font-weight:700;color:#17130F">'+formatPrice(c.gasto)+'</div>'+
              '<div style="font-size:12px;color:#8A8078">'+fmtBR(c.ultima)+'</div>'+
            '</div>'+
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

