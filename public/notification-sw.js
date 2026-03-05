self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'Voie, Vérité, Vie',
    body: 'Vous avez une nouvelle notification',
    badge: '/logo-3v.png',
    icon: '/logo-3v.png',
    tag: 'default',
    silent: false,
    requireInteraction: true,
    data: {},
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch (_error) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      badge: data.badge,
      icon: data.icon,
      tag: data.tag,
      requireInteraction: data.requireInteraction,
      silent: data.silent ?? false,
      vibrate: data.vibrate || [200, 100, 200],
      data: data.data || data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const payload = event.notification.data || {};
  let urlToOpen = payload.url || '/';

  if (!payload.url && payload.action) {
    switch (payload.action) {
      case 'careme':
        urlToOpen = '/careme-2026';
        break;
      case 'chemin-croix':
        urlToOpen = '/chemin-de-croix';
        break;
      case 'activity':
        urlToOpen = '/activities';
        break;
      case 'bible':
        urlToOpen = '/biblical-reading';
        break;
      case 'gallery':
        urlToOpen = '/gallery';
        break;
      case 'call':
      case 'welcome':
      case 'reminder':
      default:
        urlToOpen = '/';
    }
  }

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            payload: {
              action: payload.action,
              data: payload,
            },
          });
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const notification = event.data.payload;
    self.registration.showNotification(notification.title, {
      body: notification.body,
      badge: notification.badge || '/logo-3v.png',
      icon: notification.icon || '/logo-3v.png',
      tag: notification.tag || `notification-${Date.now()}`,
      requireInteraction: notification.requireInteraction ?? true,
      silent: notification.silent ?? false,
      vibrate: notification.vibrate || [200, 100, 200],
      data: notification.data || {},
    });
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
