// ===== AfriMarket Service Worker =====
const CACHE_NAME = 'afrimarket-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard.html',
  '/index.html',
  '/profil.html',
  '/messages.html',
  '/favoris.html',
  '/historique.html',
  '/pricing.html',
  '/gagner.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ── INSTALL : mise en cache des assets statiques ──
self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // On ignore les erreurs individuelles (fichiers optionnels)
      return Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE : supprimer les anciens caches ──
self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH : stratégie Network First avec fallback cache ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et externes (Supabase, Google Fonts…)
  if (request.method !== 'GET') return;
  if (!url.origin.includes(self.location.origin)) return;

  // Pour les pages HTML : Network First
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('/dashboard.html')))
    );
    return;
  }

  // Pour les assets statiques : Cache First
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

// ── PUSH NOTIFICATIONS (optionnel) ──
self.addEventListener('push', event => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch(e) { data = { title: 'AfriMarket', body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || 'AfriMarket', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/dashboard.html' },
      actions: [
        { action: 'open', title: 'Ouvrir' },
        { action: 'close', title: 'Fermer' }
      ]
    })
  );
});

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard.html';
  if (event.action === 'close') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
