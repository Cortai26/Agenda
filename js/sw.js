/* ══════════════════════════════════════════════
   Cortaí — Service Worker v3.1
   Cache offline + Push Notifications (RFC 8291)
══════════════════════════════════════════════ */

const CACHE = 'cortai-v4'

/* Never cache admin.html — always fetch fresh from network */
const NO_CACHE = ['/admin.html']

const PRECACHE = [
  '/painel.html',
  '/agendar.html',
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

  // Never cache admin.html — always network
  if (NO_CACHE.some(p => url.pathname === p || url.pathname.startsWith(p + '?'))) {
    e.respondWith(fetch(e.request))
    return
  }

  const ok = url.origin === self.location.origin
    || url.hostname.endsWith('fonts.googleapis.com')
    || url.hostname.endsWith('fonts.gstatic.com')
  if (!ok) return

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
      const txt = e.data.text()
      try { data = JSON.parse(txt) } catch(_) { data = { title: txt } }
    }
  }

  const title   = data.title  || '📅 Cortaí'
  const options = {
    body:               data.body  || 'Novo agendamento recebido',
    icon:               '/icon-192.png',
    badge:              '/icon-96.png',
    tag:                'cortai-ag',
    renotify:           true,
    requireInteraction: false,
    data:               { url: '/painel.html' }
  }

  e.waitUntil(self.registration.showNotification(title, options))
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
