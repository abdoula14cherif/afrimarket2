// ============================================================
// AfriMarket — Service Worker v3
// Cache + Push Notifications complètes
// ============================================================

const CACHE_NAME   = 'afrimarket-v3';
const CACHE_STATIC = 'afrimarket-static-v3';

const STATIC_FILES = [
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap'
];

// ── INSTALL ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache =>
      cache.addAll(STATIC_FILES.map(url => new Request(url, { cache: 'reload' })))
        .catch(err => console.warn('[SW] Cache partiel:', err))
    )
  );
  self.skipWaiting();
});

// ── ACTIVATE ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_STATIC && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.hostname.includes('supabase.co')) return;
  if (event.request.method !== 'GET') return;

  if (['style','script','font','image'].includes(event.request.destination)) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_STATIC).then(c => c.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }

  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_STATIC).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request).then(c => c || caches.match('/offline.html')))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ── MESSAGE DEPUIS LA PAGE → Afficher notification système ──
self.addEventListener('message', event => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge, tag, url, vibrate } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'AfriMarket', {
        body:    body    || '',
        icon:    icon    || '/icons/icon-192.png',
        badge:   badge   || '/icons/icon-96.png',
        tag:     tag     || 'afrimarket-notif',
        vibrate: vibrate || [100, 50, 100],
        data:    { url: url || '/dashboard.html' },
        actions: [
          { action: 'open',  title: 'Voir' },
          { action: 'close', title: 'Fermer' }
        ]
      })
    );
  }

  if (event.data.type === 'PING') {
    event.source && event.source.postMessage({ type: 'PONG' });
  }
});

// ── PUSH DEPUIS SERVEUR (VAPID) ──
self.addEventListener('push', event => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); }
  catch(e) { data = { title: 'AfriMarket', message: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || 'AfriMarket', {
      body:    data.message || 'Nouvelle notification',
      icon:    data.icon    || '/icons/icon-192.png',
      badge:              '/icons/icon-96.png',
      vibrate: [100, 50, 100],
      tag:     data.tag    || 'afrimarket-push',
      data:    { url: data.url || '/dashboard.html' },
      actions: [
        { action: 'open',  title: 'Voir' },
        { action: 'close', title: 'Fermer' }
      ]
    })
  );
});

// ── CLIC SUR NOTIFICATION ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/dashboard.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(url.split('?')[0]) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
