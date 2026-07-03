/* Agenda — tracking de eventos (funil de cadastro/onboarding/painel) */
(function(){
  var SUPA_URL='https://acldrisohnjfekjxgmoh.supabase.co';
  var SUPA_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbGRyaXNvaG5qZmVranhnbW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODA1MzcsImV4cCI6MjA4OTE1NjUzN30.etojz12x1oVNvbW_fPeVpNx2OFuJ72C1YioFBlCLS2Y';

  function sessaoId(){
    try{
      var k='ag_sid';
      var v=localStorage.getItem(k);
      if(!v){ v=Date.now().toString(36)+Math.random().toString(36).slice(2); localStorage.setItem(k,v); }
      return v;
    }catch(e){ return null; }
  }

  window.track=function(tipo, propriedades, saloId){
    try{
      var slug=null;
      try{ slug=new URLSearchParams(location.search).get('slug')||window.SLUG||(window.salao&&window.salao.slug)||(window.S&&window.S.slug)||null; }catch(e){}
      fetch(SUPA_URL+'/rest/v1/eventos',{
        method:'POST',
        headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},
        body:JSON.stringify({
          tipo:tipo,
          salao_id:saloId||null,
          slug:slug,
          propriedades:propriedades||{},
          sessao_id:sessaoId(),
          pagina:location.pathname
        })
      }).catch(function(){});
    }catch(e){}
  };
})();
