/* ══════════════════════════════════════════════
   Agenda — Service Worker v5.0
   Cache offline + Push Notifications (RFC 8291)
══════════════════════════════════════════════ */

const CACHE = 'agenda-v6'

const PRECACHE = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

/* ── INSTALL ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

/* ── ACTIVATE ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

/* ── FETCH ── */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  const ok = url.origin === self.location.origin
    || url.hostname.endsWith('fonts.googleapis.com')
    || url.hostname.endsWith('fonts.gstatic.com')
  if (!ok) return

  // HTML: sempre do servidor, nunca do cache
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    )
    return
  }

  // Assets versionados com ?v=: cache-first
  if (url.search.includes('v=')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    )
    return
  }

  // Resto: network-first com fallback no cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})

/* ── PUSH ── */
self.addEventListener('push', e => {
  console.log('[SW] Push recebido:', e.data ? 'com dados' : 'sem dados')

  let data = {}
  if (e.data) {
    try {
      data = e.data.json()
      console.log('[SW] Push data:', JSON.stringify(data))
    } catch(err) {
      // Tenta como texto
      const txt = e.data.text()
      console.log('[SW] Push texto:', txt)
      try { data = JSON.parse(txt) } catch(_) { data = { title: txt } }
    }
  }

  const title   = data.title  || '📅 Agenda'
  const options = {
    body:               data.body  || 'Novo agendamento recebido',
    icon:               '/icon-192.png',
    badge:              '/icon-192.png',
    tag:                'agenda-ag',
    renotify:           true,
    requireInteraction: false,
    data:               { url: '/painel.html' }
  }

  console.log('[SW] Exibindo notificação:', title)
  e.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[SW] Notificação exibida ✓'))
      .catch(err => console.error('[SW] Erro ao exibir:', err))
  )
})

/* ── NOTIFICATIONCLICK ── */
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/painel.html'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes('painel.html'))
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
