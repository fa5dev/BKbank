const CACHE_NAME = 'bk-bank-v3';
const BACKUP_CACHE = 'bk-backups-v1';

// Базовый путь приложения
const BASE_PATH = '/BKbank';

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/css/style.css`,
  `${BASE_PATH}/manifest.json`,
];

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('📱 BK-Bank SW: Установка');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Кеширование ресурсов:', urlsToCache);
        return cache.addAll(urlsToCache).catch(err => {
          console.error('❌ Ошибка кеширования:', err);
        });
      })
  );
});

// Активация
self.addEventListener('activate', event => {
  console.log('✅ BK-Bank SW: Активирован');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== BACKUP_CACHE) {
            console.log('🗑️ Удаление старого кеша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват запросов
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Не кешируем API запросы
  if (url.pathname.includes('/api/')) {
    return fetch(event.request);
  }
  
  // Для навигации всегда пробуем сеть
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(`${BASE_PATH}/index.html`);
      })
    );
    return;
  }
  
  // Для остальных запросов - кеш с обновлением
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // Кешируем новые GET запросы
        if (event.request.method === 'GET' && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(error => {
        console.log('🌐 Ошибка сети, используем кеш:', error);
      });
      
      // Возвращаем из кеша или ждем сеть
      return cachedResponse || fetchPromise;
    })
  );
});

// Обработка сообщений от страницы
self.addEventListener('message', event => {
  console.log('📨 SW: Получено сообщение', event.data);
  
  if (event.data && event.data.type === 'BACKUP_CREATED') {
    // Уведомление о создании бэкапа
    self.registration.showNotification('💾 BK-Bank Бэкап', {
      body: '✅ Бэкап успешно создан! Файл защищен паролем.',
      icon: `${BASE_PATH}/assets/images/logo.png`,
      badge: `${BASE_PATH}/assets/images/logo.png`,
      vibrate: [200, 100, 200],
      tag: 'backup-created',
      renotify: true,
      requireInteraction: false,
      actions: [
        {
          action: 'download',
          title: '📥 Скачать бэкап'
        },
        {
          action: 'close',
          title: '✕ Закрыть'
        }
      ],
      data: {
        url: `${BASE_PATH}/?action=backup`,
        timestamp: Date.now()
      }
    });
  }
  
  if (event.data && event.data.type === 'BACKUP_RESTORED') {
    self.registration.showNotification('🔄 BK-Bank', {
      body: '✅ Данные успешно восстановлены из бэкапа!',
      icon: `${BASE_PATH}/assets/images/logo.png`,
      badge: `${BASE_PATH}/assets/images/logo.png`,
      vibrate: [200, 100, 200],
      tag: 'backup-restored'
    });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Ответ на сообщение
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({
      type: 'MESSAGE_RECEIVED',
      originalType: event.data.type
    });
  }
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', event => {
  console.log('🔔 Клик по уведомлению:', event.action);
  event.notification.close();
  
  if (event.action === 'download') {
    // Открываем страницу бэкапов с флагом скачивания
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Проверяем, есть ли уже открытое окно
        for (const client of clientList) {
          if (client.url.includes(BASE_PATH) && 'focus' in client) {
            return client.focus();
          }
        }
        // Открываем новое окно
        return clients.openWindow(`${BASE_PATH}/?action=backup&download=true`);
      })
    );
  } else {
    // Открываем главную страницу
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(BASE_PATH) && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(BASE_PATH);
      })
    );
  }
});

// Обработка push-уведомлений (если понадобится)
self.addEventListener('push', event => {
  console.log('📨 Push уведомление получено');
  
  let data = {
    title: 'BK-Bank',
    body: 'Новое уведомление',
    icon: `${BASE_PATH}/assets/images/logo.png`
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.icon,
      vibrate: [200, 100, 200],
      data: {
        url: data.url || BASE_PATH
      }
    })
  );
});

// Обработка синхронизации в фоне
self.addEventListener('sync', event => {
  console.log('🔄 Фоновая синхронизация:', event.tag);
  
  if (event.tag === 'sync-backups') {
    event.waitUntil(
      // Здесь можно добавить логику синхронизации
      Promise.resolve()
    );
  }
});

// Периодическая синхронизация (если поддерживается)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-backups') {
    console.log('🔍 Периодическая проверка бэкапов');
    event.waitUntil(
      // Проверка статуса бэкапов
      Promise.resolve()
    );
  }
});

// Обработка ошибок
self.addEventListener('error', event => {
  console.error('❌ Ошибка в Service Worker:', event.error);
});

// Сообщение о готовности
console.log('🚀 BK-Bank Service Worker загружен и готов к работе!');
