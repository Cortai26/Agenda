/* Agenda Painel — Push Notifications SW */

/* ═══ PWA PUSH NOTIFICATIONS ═══ */
const VAPID_PUBLIC='BE7yLo8_tT-zgOgyMqcn49YnmK2tVpVxYIV0rCEhqSzZmBPP74nAwl8OejicM2QAOd9hM_XcIu-P-OuGou8QZAE';

function b64uToUint8(b64u){
  var b=b64u.replace(/-/g,'+').replace(/_/g,'/');
  while(b.length%4)b+='=';
  return Uint8Array.from(atob(b),function(c){return c.charCodeAt(0);});
}

async function registrarPush(slug, senha){
  if(!('PushManager' in window)) return;
  try{
    const sw = await navigator.serviceWorker.ready;
    // Cancela subscription antiga se existir (garante chaves frescas)
    const oldSub = await sw.pushManager.getSubscription();
    if(oldSub) await oldSub.unsubscribe();

    const sub = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: b64uToUint8(VAPID_PUBLIC)
    });
    const j = sub.toJSON();

    if(S && S.id){
      const ok = await rpc('salvar_push_subscription_id',{
        p_salao_id: S.id,
        p_endpoint: j.endpoint,
        p_p256dh:   j.keys.p256dh,
        p_auth:     j.keys.auth
      });
      if(ok){
        toast('✅ Notificações ativadas!','ok');
      } else {
        console.error('[Push] Falha ao salvar no banco');
      }
    }
  }catch(e){
    console.error('[Push] Erro ao registrar:', e.message);
    toast('Erro ao registrar push: '+e.message,'err');
  }
}

async function pedirPermissaoPush(slug, senha){
  if(!('Notification' in window)||!('PushManager' in window)) return;
  if(Notification.permission==='granted'){
    await registrarPush(slug, senha); return;
  }
  if(Notification.permission==='denied') return;
  // Não usa setTimeout — iOS exige gesto direto para requestPermission
  // Esta função é chamada no load (sem gesto), então só registra se já tiver permissão
  // Para pedir permissão via botão, usa ativarNotificacoes()
}

// Chamada DIRETAMENTE pelo botão (gesto do usuário garantido)
async function ativarNotificacoes(){
  if(!('Notification' in window)){
    toast('Notificações não suportadas neste dispositivo','err'); return;
  }
  try{
    const perm = await Notification.requestPermission();
    if(perm==='granted'){
      await registrarPush(S.slug, _pw||'');
      setTimeout(atualizarStatusPush, 1000);
    } else {
      toast('Permissão negada — verifique as configurações do iPhone','err');
    }
  }catch(e){
    toast('Erro ao pedir permissão: '+e.message,'err');
  }
}

// Registra SW
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').catch(function(){});
}
