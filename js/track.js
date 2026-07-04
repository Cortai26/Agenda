/* Agenda — tracking de eventos (funil de agendamento)
   Regra: best-effort. NUNCA bloqueia o fluxo principal. */
(function(){
  var SESSION_ID=(function(){
    try{
      var k='_ag_sid';
      var v=sessionStorage.getItem(k);
      if(!v){ v=Date.now().toString(36)+Math.random().toString(36).slice(2); sessionStorage.setItem(k,v); }
      return v;
    }catch(e){ return Math.random().toString(36).slice(2); }
  })();

  function getSlug(){
    try{
      return new URLSearchParams(window.location.search).get('slug')||
        window.location.pathname.split('/').filter(Boolean).pop()||
        window.SLUG||(window.salao&&window.salao.slug)||null;
    }catch(e){ return null; }
  }

  function send(tipo, props){
    try{
      var url=window._supabaseUrl||'https://acldrisohnjfekjxgmoh.supabase.co';
      var key=window._supabaseKey||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbGRyaXNvaG5qZmVranhnbW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODA1MzcsImV4cCI6MjA4OTE1NjUzN30.etojz12x1oVNvbW_fPeVpNx2OFuJ72C1YioFBlCLS2Y';
      fetch(url+'/rest/v1/eventos',{
        method:'POST',
        headers:{'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json','Prefer':'return=minimal'},
        body:JSON.stringify({
          tipo:tipo,
          salao_id:window._agSalaoId||null,
          slug:getSlug(),
          sessao_id:SESSION_ID,
          pagina:window.location.pathname,
          propriedades:Object.assign({viewport:window.innerWidth+'x'+window.innerHeight},props||{})
        })
      }).catch(function(e){ console.warn('[track] fetch falhou:',e.message); });
    }catch(e){ console.warn('[track] erro:',e.message); }
  }

  /* API principal: trackEvento('tipo', {props}) */
  window.trackEvento=function(tipo, props){ send(tipo, props); };

  /* Compat retroativo: track('tipo', {props}, salaoId) */
  window.track=function(tipo, props, salaoId){
    if(salaoId&&!window._agSalaoId) window._agSalaoId=salaoId;
    send(tipo, props);
  };

  /* Pageview automático */
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){ send('page_view',{}); });
  } else {
    send('page_view',{});
  }
})();
