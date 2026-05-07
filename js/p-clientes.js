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
  var _cliC=localStorage.getItem('sec-clientes-collapsed')!=='0'; // fechado por padrão
  html+=typeof _secGroup==='function'?_secGroup('sec-clientes',_cliLbl,_cliC,_cliBody):_cliBody;

  /* Clientes inativos — colapsável, fechado por padrão */
  var _inBody='<div class="ri-hint">💬 Um WhatsApp pode trazer eles de volta!</div>';
  if(inativos.length===0){
    _inBody+='<div class="empty" style="color:var(--VD);padding:20px 16px">🎉 Todos agendaram recentemente!</div>';
  } else {
    inativos.forEach(function(c){
      var tel=c.telefone.replace(/\D/g,'');
      var msg=encodeURIComponent('Oi '+c.nome.split(' ')[0]+'! 🤙\nTô com horário disponível na '+S.nome+'.\nQuer marcar? '+BASE+'/agendar.html?slug='+S.slug);
      _inBody+=
        '<div class="ri-card">'+
          '<div class="ri-av">'+esc(c.nome).charAt(0).toUpperCase()+'</div>'+
          '<div class="ri-info">'+
            '<div class="ri-nm">'+esc(c.nome)+'</div>'+
            '<div class="ri-mt">'+c.telefone+' · última visita: '+fmtBR(c.ultima_visita)+'</div>'+
          '</div>'+
          '<div class="ri-badge">'+c.dias_ausente+'<span>dias</span></div>'+
          '<a class="ri-wa" href="https://wa.me/55'+tel+'?text='+msg+'" target="_blank" rel="noopener">'+
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'+
            ' Chamar'+
          '</a>'+
        '</div>';
    });
  }
  var _inLbl='Reconquistar clientes'+(inativos.length>0?' <span style="background:rgba(245,158,11,.15);color:var(--AM);border-radius:20px;padding:1px 8px;font-size:10px;font-weight:700;margin-left:6px">'+inativos.length+'</span>':'');
  var _inC=localStorage.getItem('sec-inativos-collapsed')!=='0'; // fechado por padrão
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

