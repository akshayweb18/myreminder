// ============================================================
// RemindMe — Service Worker
// ============================================================

const CACHE_NAME = 'remindme-ai-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ============================================================
// Install — Pre-cache static assets
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Some assets might not exist yet, that's OK
      });
    }),
  );
  self.skipWaiting();
});

// ============================================================
// Activate — Clean old caches
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ),
    ),
  );
  self.clients.claim();
});

// ============================================================
// Fetch — Network first for API, Cache first for static
// ============================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and non-http
  if (!url.protocol.startsWith('http')) return;

  // API calls — network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached ?? new Response('Offline', { status: 503 })),
      ),
    );
    return;
  }

  // Next.js static assets — cache first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // HTML pages — network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) =>
            cached ??
            caches.match('/').then(
              (fallback) =>
                fallback ??
                new Response('<h1>Offline</h1>', {
                  headers: { 'Content-Type': 'text/html' },
                }),
            ),
        ),
      ),
  );
});

// ============================================================
// Push Notifications (Future — Firebase)
// ============================================================
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'RemindMe', {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      tag: data.tag ?? 'remindme',
      vibrate: [200, 100, 200, 100, 200],
      data: data.data ?? {},
      actions: [
        { action: 'done', title: '✅ Done' },
        { action: 'snooze', title: '⏰ Snooze' },
        { action: 'open', title: '👁 Open' },
      ],
    }),
  );
});

// ============================================================
// Notification Click
// ============================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'done') {
    // Post message to client to mark as done
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) =>
        client.postMessage({ type: 'REMINDER_DONE', id: data.reminderId }),
      );
    });
  } else if (action === 'snooze') {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) =>
        client.postMessage({ type: 'REMINDER_SNOOZE', id: data.reminderId }),
      );
    });
  } else {
    // Open the app
    event.waitUntil(
      self.clients.openWindow(data.url ?? '/dashboard'),
    );
  }
});

// ============================================================
// Background Sync (Future)
// ============================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reminders') {
    event.waitUntil(syncReminders());
  }
});

async function syncReminders() {
  // Future: sync with backend when online
  console.log('[SW] Background sync triggered');
}
