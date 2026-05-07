/* Agenda Painel — Clientes */
/* ═══ CLIENTES ═══ */
var _cliPage=0, _cliPerPage=50, _cliTotal=0;

async function renderClientes(page){
  page=page||0; _cliPage=page;
  _tabOk.clientes=true;
  var el=document.getElementById('tb-clientes');
  if(page===0) el.innerHTML='<div class="loading">Carregando...</div>';
  // S5.4: paginated — limit 50 per page, count total
  var offset=page*_cliPerPage;
  var results=await Promise.all([
    api('clientes?salao_id=eq.'+S.id+'&order=total_visitas.desc&select=*&limit='+_cliPerPage+'&offset='+offset,
      {headers:{'Prefer':'count=exact'}}),
    page===0?api('agendamentos?salao_id=eq.'+S.id+'&select=id&limit=1',{headers:{'Prefer':'count=exact'}}):Promise.resolve(null),
    page===0?api('rpc/clientes_inativos',{method:'POST',body:JSON.stringify({p_salao_id:S.id,p_dias:30}),headers:{'Prefer':''}}):Promise.resolve([])
  ]);
  var clis=results[0]||[], todos=results[1]||[], inativos=results[2]||[];
  var totalGasto=clis.reduce(function(s,c){return s+(c.total_gasto||0);},0);
  /* Métricas — sempre visíveis */
  var html=
    '<div class="metrics">'+
    '<div class="mc"><div class="mc-n">'+clis.length+'</div><div class="mc-l">Clientes</div></div>'+
    '<div class="mc mc-V"><div class="mc-n" style="font-size:clamp(12px,4vw,18px)">'+formatPrice(totalGasto)+'</div><div class="mc-l">Receita total</div></div>'+
    '<div class="mc mc-A"><div class="mc-n">'+todos.length+'</div><div class="mc-l">Agendamentos</div></div>'+
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
  var _cliC=localStorage.getItem('sec-clientes-collapsed')==='1';
  html+=typeof _secGroup==='function'?_secGroup('sec-clientes',_cliLbl,_cliC,_cliBody):_cliBody;

  /* Clientes inativos — colapsável */
  var _inBody='<div style="padding:0 16px 10px;font-size:12px;color:var(--text-2)">Sem agendamento há mais de 30 dias. Um WhatsApp pode trazer eles de volta! 💬</div>';
  if(inativos.length===0){
    _inBody+='<div class="empty" style="color:var(--VD)">🎉 Todos agendaram recentemente!</div>';
  } else {
    inativos.forEach(function(c){
      var tel=c.telefone.replace(/\D/g,'');
      var msg=encodeURIComponent('Oi '+c.nome.split(' ')[0]+'! 🤙\nTô com horário disponível na '+S.nome+'.\nQuer marcar? '+BASE+'/agendar.html?slug='+S.slug);
      _inBody+='<div class="ri">'+
        '<div class="ri-av">😴</div>'+
        '<div class="ri-info"><div class="ri-nm">'+esc(c.nome)+'</div><div class="ri-mt">'+c.telefone+' · última: '+fmtBR(c.ultima_visita)+'</div></div>'+
        '<div class="ri-d"><div class="ri-dn">'+c.dias_ausente+'</div><div class="ri-dl">dias</div></div>'+
        '<button class="btn-wa" onclick="window.open(\'https://wa.me/55'+tel+'?text='+msg+'\',\'_blank\')">'+WA+' WhatsApp</button>'+
        '</div>';
    });
  }
  var _inLbl='🔔 Sem agendar há +30 dias'+(inativos.length>0?' <span style="background:rgba(245,158,11,.15);color:var(--AM);border-radius:20px;padding:1px 8px;font-size:10px;font-weight:700;margin-left:6px">'+inativos.length+'</span>':'');
  var _inC=localStorage.getItem('sec-inativos-collapsed')==='1';
  html+=typeof _secGroup==='function'?_secGroup('sec-inativos',_inLbl,_inC,_inBody):_inBody;
  // S5.4: Show "load more" if there may be more results
  if(clis.length===_cliPerPage){
    html+='<div style="text-align:center;padding:16px">'+
      '<button onclick="renderClientes(_cliPage+1)" style="background:transparent;border:1.5px solid var(--bd);border-radius:10px;padding:10px 24px;font-size:13px;font-weight:700;color:var(--CZ);cursor:pointer">Ver mais clientes...</button>'+
      '</div>';
  }
  if(page===0) el.innerHTML=html;
  else el.innerHTML=el.innerHTML.replace(/<div style="text-align:center[^"]*"[^>]*>.*?<\/div>\s*$/, '')+html;
}

