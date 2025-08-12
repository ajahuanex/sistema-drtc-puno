// Service Worker para Sistema DRTC Puno
const CACHE_NAME = 'drtc-puno-v1.0.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Recursos estáticos para cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icons/favicon.ico',
  '/assets/icons/apple-touch-icon.png',
  '/assets/icons/favicon-32x32.png',
  '/assets/icons/favicon-16x16.png'
];

// Recursos dinámicos para cache
const DYNAMIC_ASSETS = [
  '/api/config/critical',
  '/api/common/tiposDocumento',
  '/api/common/estadosEmpresa',
  '/api/common/configuracionGeneral'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Cacheando recursos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Recursos estáticos cacheados');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error cacheando recursos estáticos:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Eliminando cache obsoleto:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activado');
        return self.clients.claim();
      })
  );
});

// Interceptar peticiones fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Estrategia de cache: Cache First para recursos estáticos
  if (request.method === 'GET' && isStaticAsset(request.url)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            console.log('📦 Sirviendo desde cache estático:', request.url);
            return response;
          }
          
          return fetch(request)
            .then((fetchResponse) => {
              // Cachear la respuesta para futuras peticiones
              if (fetchResponse.ok) {
                const responseClone = fetchResponse.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return fetchResponse;
            });
        })
        .catch(() => {
          // Fallback a cache si no hay conexión
          return caches.match('/index.html');
        })
    );
  }
  
  // Estrategia de cache: Network First para APIs
  else if (request.method === 'GET' && isApiRequest(request.url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            // Cachear respuesta de API
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback a cache si no hay conexión
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('📦 Sirviendo API desde cache:', request.url);
                return cachedResponse;
              }
              
              // Respuesta de fallback
              return new Response(
                JSON.stringify({ 
                  error: 'Sin conexión', 
                  message: 'Los datos se obtienen del cache local' 
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
  }
  
  // Estrategia por defecto: Network First
  else {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Fallback a cache si no hay conexión
          return caches.match(request);
        })
    );
  }
});

// Función para determinar si es un recurso estático
function isStaticAsset(url) {
  const staticExtensions = ['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ico'];
  return staticExtensions.some(ext => url.includes(ext)) || 
         url.includes('/assets/') || 
         url === '/' || 
         url.endsWith('/');
}

// Función para determinar si es una petición a la API
function isApiRequest(url) {
  return url.includes('/api/') || url.includes('/graphql');
}

// Manejo de mensajes del cliente
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_INFO':
      event.ports[0].postMessage({
        type: 'CACHE_INFO',
        payload: {
          staticCache: STATIC_CACHE,
          dynamicCache: DYNAMIC_CACHE,
          staticAssets: STATIC_ASSETS.length,
          dynamicAssets: DYNAMIC_ASSETS.length
        }
      });
      break;
      
    case 'CLEAR_CACHE':
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        })
        .then(() => {
          event.ports[0].postMessage({
            type: 'CACHE_CLEARED',
            payload: { success: true }
          });
        })
        .catch((error) => {
          event.ports[0].postMessage({
            type: 'CACHE_CLEARED',
            payload: { success: false, error: error.message }
          });
        });
      break;
      
    default:
      console.log('📨 Mensaje no manejado:', type);
  }
});

// Manejo de sincronización en background
self.addEventListener('sync', (event) => {
  console.log('🔄 Sincronización en background:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Realizar sincronización de datos
      syncData()
        .then(() => {
          console.log('✅ Sincronización completada');
        })
        .catch((error) => {
          console.error('❌ Error en sincronización:', error);
        })
    );
  }
});

// Función para sincronizar datos
async function syncData() {
  try {
    // Obtener datos pendientes del IndexedDB
    const pendingData = await getPendingData();
    
    if (pendingData.length > 0) {
      console.log('📤 Sincronizando datos pendientes:', pendingData.length);
      
      // Enviar datos al servidor
      for (const data of pendingData) {
        await sendDataToServer(data);
        await markDataAsSynced(data.id);
      }
    }
  } catch (error) {
    console.error('❌ Error en sincronización de datos:', error);
    throw error;
  }
}

// Función para obtener datos pendientes (simulada)
async function getPendingData() {
  // En una implementación real, esto vendría del IndexedDB
  return [];
}

// Función para enviar datos al servidor (simulada)
async function sendDataToServer(data) {
  // En una implementación real, esto haría una petición HTTP
  console.log('📤 Enviando datos al servidor:', data);
}

// Función para marcar datos como sincronizados (simulada)
async function markDataAsSynced(id) {
  // En una implementación real, esto actualizaría el IndexedDB
  console.log('✅ Datos marcados como sincronizados:', id);
}

// Manejo de notificaciones push
self.addEventListener('push', (event) => {
  console.log('🔔 Notificación push recibida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación del sistema',
    icon: '/assets/icons/notification-icon.png',
    badge: '/assets/icons/badge-icon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver',
        icon: '/assets/icons/action-icon.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/assets/icons/close-icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Sistema DRTC Puno', options)
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notificación clickeada:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Abrir la aplicación
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('🚀 Service Worker cargado para Sistema DRTC Puno'); 