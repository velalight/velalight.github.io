const CACHE_NAME = 'velalight-v5-final'; // هذا الرقم يضمن مسح أي كاش قديم عالق لمرة واحدة وأخيرة
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
            .map(k => caches.delete(k)) // مسح كل الكاش القديم نهائياً
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // 1. تجاهل طلبات Firebase تماماً
  if (e.request.url.includes('firebase') || e.request.url.includes('firestore') || e.request.url.includes('firebasestorage')) {
    return;
  }
  
  // 2. الحل الجذري: منع تخزين أو قراءة أي صورة من الكاش نهائياً
  if (e.request.destination === 'image' || e.request.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }) // يجبر المتصفح على جلب الصورة الجديدة من السيرفر دائماً
    );
    return;
  }

  // 3. تخزين ملفات الموقع الأساسية (HTML, CSS, JS) فقط للسرعة
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
