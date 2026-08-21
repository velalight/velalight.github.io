const CACHE_NAME = 'velalight-v4'; // ترقية الإصدار لحذف كل شيء قديم فوراً
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/mobile-luxury-fix.css',
  '/app.js',
  '/data.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k)) // حذف كل الكاش القديم (v3 وأقل) فوراً
      )
    ).then(() => self.clients.claim()) // إجبار كل التبويبات المفتوحة على استخدام هذا الكود الجديد فوراً
  );
});

self.addEventListener('fetch', e => {
  // 1. تجاهل Firebase تماماً
  if (e.request.url.includes('firebase') || e.request.url.includes('firestore') || e.request.url.includes('firebasestorage')) {
    return;
  }
  
  // 2. ☢️ الحل النووي للصور: منع المتصفح من قراءة أو حفظ الصور في الكاش
  if (e.request.destination === 'image' || e.request.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }) // no-store تمنع المتصفح من لمس الكاش نهائياً للصور
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request)) // فقط إذا انقطع الإنترنت تماماً نستخدم الكاش كملاذ أخير
    );
    return;
  }

  // 3. باقي الملفات (JS, CSS, HTML)
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
