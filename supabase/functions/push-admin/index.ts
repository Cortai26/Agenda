import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// web-push via npm (Deno suporta npm: specifier)
import webpush from 'npm:web-push@3.6.7'

serve(async (req) => {
  try {
    const payload = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Buscar todas as subscrições do admin
    const { data: subs, error } = await supabase
      .from('admin_push_subscriptions')
      .select('endpoint, p256dh, auth')

    if (error) {
      console.error('[push-admin] erro ao buscar subs:', error.message)
      return new Response('db error', { status: 500 })
    }

    if (!subs || subs.length === 0) {
      return new Response('no subscribers', { status: 200 })
    }

    const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')!
    const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!

    webpush.setVapidDetails(
      'mailto:cortai.contato@gmail.com',
      VAPID_PUBLIC,
      VAPID_PRIVATE
    )

    let mensagem = ''
    if (payload.tipo === 'novo_agendamento') {
      mensagem = `📅 ${payload.salao_nome}: ${payload.cliente_nome} agendou ${payload.servico_nome} para ${payload.data} às ${(payload.hora||'').slice(0,5)}`
    } else if (payload.tipo === 'novo_salao') {
      mensagem = `🏪 Novo salão cadastrado: ${payload.salao_nome} (${payload.salao_slug}) — plano ${payload.plano}`
    } else {
      mensagem = payload.mensagem || 'Nova notificação do Agenda'
    }

    const notifPayload = JSON.stringify({
      title: '🔔 Agenda Admin',
      body:  mensagem,
      icon:  '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      data:  payload
    })

    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notifPayload
        )
      )
    )

    // Remover subscrições expiradas (410 Gone)
    const expired = results
      .map((r, i) => r.status === 'rejected' && r.reason?.statusCode === 410 ? subs[i].endpoint : null)
      .filter(Boolean)

    if (expired.length > 0) {
      await supabase.from('admin_push_subscriptions').delete().in('endpoint', expired)
    }

    const sent = results.filter(r => r.status === 'fulfilled').length
    return new Response(JSON.stringify({ sent, total: subs.length }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (e) {
    console.error('[push-admin] erro:', e)
    return new Response('error: ' + e.message, { status: 500 })
  }
})
