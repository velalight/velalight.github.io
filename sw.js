const CACHE_NAME = 'velalight-v2'; // تم تحديث الإصدار لإجبار المتصفح على مسح الكاش القديم وحل مشكلة ظهور البيانات القديمة
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/mobile-luxury-fix.css',
  '/app.js',
  '/data.js',
  '/RR.jpg'
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
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // تجاهل طلبات الـ API أو Firebase لتجنب المشاكل
  if (e.request.url.includes('firebase') || e.request.url.includes('firestore') || e.request.url.includes('firebasestorage')) {
    return;
  }
  
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // لا تخزن استجابات الخطأ (مثل 404 للصور) في الكاش لمنع تكرار المشكلة
        if (!res || res.status !== 200 || res.type !== 'basic') {
          return res;
        }
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
