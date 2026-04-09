// Cortaí — Edge Function: push-notify
// Deploy: Supabase Dashboard > Edge Functions > New Function > "push-notify"
// Ou: supabase functions deploy push-notify

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PUBLIC  = 'BE7yLo8_tT-zgOgyMqcn49YnmK2tVpVxYIV0rCEhqSzZmBPP74nAwl8OejicM2QAOd9hM_XcIu-P-OuGou8QZAE'
const VAPID_PRIVATE = 'WZwB_kTjrxk5ECfULUbfnIqMGWaJgyGudJGjtKBD7c0'
const VAPID_SUBJECT = 'mailto:cortai.contato@gmail.com'

function b64uDecode(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return Uint8Array.from(atob(s), c => c.charCodeAt(0))
}

function b64uEncode(buf: ArrayBuffer | Uint8Array): string {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return btoa(String.fromCharCode(...b))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function buildVapidToken(audience: string): Promise<string> {
  const h = b64uEncode(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const p = b64uEncode(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: VAPID_SUBJECT
  })))
  const unsigned = `${h}.${p}`

  const pub = b64uDecode(VAPID_PUBLIC)
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty:'EC', crv:'P-256', x:b64uEncode(pub.slice(1,33)), y:b64uEncode(pub.slice(33,65)), d:VAPID_PRIVATE, key_ops:['sign'] },
    { name:'ECDSA', namedCurve:'P-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign({ name:'ECDSA', hash:'SHA-256' }, key, new TextEncoder().encode(unsigned))
  return `${unsigned}.${b64uEncode(sig)}`
}

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string): Promise<number> {
  const url   = new URL(sub.endpoint)
  const token = await buildVapidToken(`${url.protocol}//${url.host}`)
  const res   = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${token},k=${VAPID_PUBLIC}`,
      'Content-Type':  'application/json',
      'TTL':           '86400',
    },
    body: payload,
  })
  return res.status
}

Deno.serve(async (req: Request) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return new Response('405', { status: 405 })

  const { salao_id, cliente_nome, data, hora, servico_nome } = await req.json()
  if (!salao_id || !cliente_nome) return new Response('400', { status: 400 })

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: subs } = await sb.from('push_subscriptions').select('endpoint,p256dh,auth').eq('salao_id', salao_id)
  if (!subs?.length) return new Response(JSON.stringify({ ok:true, sent:0 }), { status:200 })

  const [, mes, dia] = (data || '').split('-')
  const df  = dia && mes ? `${dia}/${mes}` : (data || '')
  const hf  = hora ? hora.substring(0, 5) : ''
  const pl  = JSON.stringify({
    title: `📅 Novo agendamento — ${hf}`,
    body:  `${cliente_nome} · ${servico_nome || 'Serviço'} · ${df}`,
    icon:  '/icon-192.png',
    badge: '/icon-96.png',
    tag:   'cortai-ag',
    data:  { url: '/painel.html' }
  })

  let sent = 0
  const del: string[] = []
  for (const s of subs) {
    try {
      const st = await sendPush(s, pl)
      if (st === 201 || st === 200) sent++
      else if (st === 410 || st === 404) del.push(s.endpoint)
    } catch (_) {}
  }

  if (del.length) await sb.from('push_subscriptions').delete().in('endpoint', del).eq('salao_id', salao_id)

  return new Response(JSON.stringify({ ok:true, sent, total:subs.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...cors }
  })
})
