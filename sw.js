const CACHE_NAME = 'revision-ba-v1';
const assetsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// تثبيت التطبيق وتخزين الملفات
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(assetsToCache);
      })
  );
});

// تشغيل التطبيق (جلب الملفات من الذاكرة إذا أمكن)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});