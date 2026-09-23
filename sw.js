/*
 * VelaLight Service Worker
 * استراتيجية الكاش:
 * - HTML/CSS/JS: الشبكة أولاً لضمان ظهور التحديثات فورًا.
 * - الصور: الشبكة أولاً مع fallback للكاش عند انقطاع الاتصال، بدون تخزين صور جديدة.
 * - Firebase والطلبات الخارجية: لا يتدخل فيها Service Worker.
 */

const CACHE_NAME = "velalight-v7-pwa";

const APP_SHELL = [
  "/",
  "/index.html",
  "/style.css",
  "/mobile-luxury-fix.css",
  "/app.js",
  "/data.js",
  "/manifest.json",
  "/pwa.css",
  "/pwa.js",
  "/exit-intent.css",
  "/exit-intent.js",
  "/ga4-events.js"
];
const isHttpRequest = request => request.url.startsWith("http://") || request.url.startsWith("https://");
const isSameOrigin = request => new URL(request.url).origin === self.location.origin;
const isFirebaseRequest = url => /firebase|firestore|firebasestorage/i.test(url);
const isImageRequest = request => request.destination === "image" || /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i.test(new URL(request.url).pathname);
const isStaticAsset = request => /\.(css|js|json|html|webmanifest)(\?.*)?$/i.test(new URL(request.url).pathname);

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  const request = event.request;

  // لا نتعامل مع POST أو أي طريقة غير GET.
  if (request.method !== "GET") return;
  if (!isHttpRequest(request)) return;

  const url = request.url;

  // Firebase وFirestore وStorage يجب أن تظل تحت إدارة خدماتها الأصلية.
  if (isFirebaseRequest(url)) return;

  // لا نعترض طلبات CDN أو Google Fonts أو أي نطاق خارجي.
  if (!isSameOrigin(request)) return;

  if (isImageRequest(request)) {
    event.respondWith(networkImageWithOfflineFallback(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkNavigationWithOfflineFallback(request));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(networkAssetWithOfflineFallback(request));
  }
});

async function networkNavigationWithOfflineFallback(request) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (isCacheableResponse(response)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return (await caches.match(request)) || (await caches.match("/index.html"));
  }
}

async function networkAssetWithOfflineFallback(request) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (isCacheableResponse(response)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return caches.match(request);
  }
}

async function networkImageWithOfflineFallback(request) {
  try {
    // لا نحفظ صورًا جديدة داخل Service Worker، حتى لا تبقى الصور القديمة عالقة.
    return await fetch(request, { cache: "no-store" });
  } catch (error) {
    // إذا كانت الصورة موجودة في كاش سابق، نستخدمها فقط كحل للطوارئ.
    return caches.match(request);
  }
}

function isCacheableResponse(response) {
  return Boolean(response && response.status === 200 && response.type === "basic");
}
