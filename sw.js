// ✅ قمنا بتغيير الرقم إلى v3 لإجبار المتصفح على حذف النسخة القديمة
const CACHE_NAME = 'revision-ba-v3';
const assetsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // تفعيل التحديث فوراً
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(assetsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  // حذف الملفات القديمة (v1)
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // حاول الجلب من الشبكة أولاً للحصول على أحدث نسخة (Network First)
        return fetch(event.request).catch(() => response);
      })
  );
});
