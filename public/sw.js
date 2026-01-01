// Service Worker para PWA - Chama o Músico
const CACHE_NAME = "chama-o-musico-v1";
const STATIC_ASSETS = ["/", "/dashboard", "/logo.png", "/manifest.json"];

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Instalando...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Cache aberto");
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.error("[Service Worker] Erro ao fazer cache:", err);
      }),
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Ativando...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Removendo cache antigo:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  return self.clients.claim();
});

// Interceptar requisições para cache
self.addEventListener("fetch", (event) => {
  // Para PWA, não vamos fazer cache agressivo
  // Apenas servir do cache em caso de offline
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache apenas para assets estáticos
        if (
          event.request.destination === "image" ||
          event.request.destination === "script" ||
          event.request.destination === "style"
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback para cache em caso de offline
        return caches.match(event.request);
      }),
  );
});

// Listener para notificações push
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push recebido:", event);

  let notificationData = {
    title: "Chama o Músico",
    body: "Você tem uma nova notificação",
    icon: "/logo.png",
    badge: "/logo.png",
    tag: "default",
    requireInteraction: false,
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || payload.message || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || payload.type || notificationData.tag,
        requireInteraction: payload.requireInteraction || false,
        data: payload.data || {},
        actions: payload.actions || [],
        vibrate: payload.vibrate || [200, 100, 200],
        timestamp: Date.now(),
      };
    } catch (err) {
      console.error("[Service Worker] Erro ao parsear payload:", err);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const notificationPromise = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: notificationData.actions,
      vibrate: notificationData.vibrate,
      timestamp: notificationData.timestamp,
    },
  );

  event.waitUntil(notificationPromise);
});

// Listener para clique em notificações
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notificação clicada:", event);

  event.notification.close();

  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Se já tem uma janela aberta, focar nela
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Se não tem, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Listener para ações de notificação (botões)
self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notificação fechada:", event);
});
