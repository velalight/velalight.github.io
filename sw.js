const CACHE_NAME = 'velalight-v3'; // تم ترقية الإصدار لإجبار المتصفح على مسح الكاش التالف القديم تماماً
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/mobile-luxury-fix.css',
  '/app.js',
  '/data.js'
  // ⚠️ هام: تمت إزالة الصور (مثل RR.jpg) من هذه القائمة لمنع Service Worker من احتكارها وعرض نسخ قديمة
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting()) // تفعيل النسخة الجديدة فوراً
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k)) // مسح جميع نسخ الكاش القديمة فوراً لمنع التعارض
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // 1. تجاهل طلبات Firebase و API تماماً للحفاظ على استقرار البيانات الحية
  if (e.request.url.includes('firebase') || e.request.url.includes('firestore') || e.request.url.includes('firebasestorage')) {
    return;
  }
  
  // 2. استراتيجية "الشبكة أولاً" (Network First) مع إجبار المتصفح على التحقق من التحديثات
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }) // هذا السطر هو "السحر" الذي يمنع عرض الصور القديمة
      .then(res => {
        // التأكد من أن الاستجابة صحيحة (200 OK) قبل محاولة تخزينها
        if (!res || res.status !== 200 || res.type !== 'basic') {
          return res;
        }
        // استنساخ الاستجابة لتخزينها في الكاش للاستخدام عند انقطاع الإنترنت
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => {
        // 3. في حالة انقطاع الإنترنت تماماً، نرجع للنسخة المحفوظة كحل أخير (Offline Fallback)
        return caches.match(e.request);
      })
  );
});
