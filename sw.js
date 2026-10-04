/*
 * VelaLight Service Worker (v9 — Performance Optimized)
 * ═══════════════════════════════════════════════════════════
 * استراتيجيات الكاش:
 * - HTML (navigation): Network-First → آخر نسخة دايماً
 * - CSS/JS/JSON: Stale-While-Revalidate → سريع + يحدّث في الخلفية
 * - الصور: Cache-First → سريع جداً، مع حد أقصى للمساحة
 * - Google Fonts: Cache-First → ما يحمّل مرتين
 * - Firebase/External CDN: يمر مباشرة (مايتدخلش)
 * ═══════════════════════════════════════════════════════════
 */

const CACHE_VERSION = "v9";
const STATIC_CACHE  = `velalight-static-${CACHE_VERSION}`;
const HTML_CACHE    = `velalight-html-${CACHE_VERSION}`;
const IMAGE_CACHE   = `velalight-images-${CACHE_VERSION}`;
const FONT_CACHE    = `velalight-fonts-${CACHE_VERSION}`;

/* ─── حدود الكاش ─── */
const MAX_IMAGE_ENTRIES = 150;   // حد أقصى لعدد الصور المحفوظة
const MAX_STATIC_ENTRIES = 60;   // حد أقصى لملفات CSS/JS

/* ─── الملفات الأساسية (App Shell) ─── */
const APP_SHELL = [
  "/",
  "/index.html",
  "/products.html",
  "/style.css",
  "/mobile-luxury-fix.css",
  "/pwa.css",
  "/search.css",
  "/exit-intent.css",
  "/app.js",
  "/data.js",
  "/bottom-nav.js",
  "/search.js",
  "/ga4-events.js",
  "/pwa.js",
  "/seo.js",
  "/auth.js",
  "/manifest.json",
  "/heart2.jpg"
];

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */
const isHttpRequest   = req => req.url.startsWith("http://") || req.url.startsWith("https://");
const isSameOrigin    = req => new URL(req.url).origin === self.location.origin;
const isFirebaseReq   = url => /firebase|firestore|firebasestorage|googleapis/i.test(url);
const isGoogleFonts   = url => /fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(url);
const isImageReq      = req => req.destination === "image" ||
                              /\.(avif|gif|jpe?g|png|svg|webp|ico)(\?.*)?$/i.test(new URL(req.url).pathname);
const isStaticAsset   = req => /\.(css|js|json|webmanifest)(\?.*)?$/i.test(new URL(req.url).pathname);
const isHTMLRequest   = req => req.mode === "navigate" ||
                              (req.method === "GET" && (req.headers.get("accept") || "").includes("text/html"));

const isCacheableResponse = res => Boolean(res && res.status === 200 && (res.type === "basic" || res.type === "cors" || res.type === "default"));

/* ═══════════════════════════════════════════════════════════
   Trim — تحديد حجم الكاش
   ═══════════════════════════════════════════════════════════ */
async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    /* احذف أقدم entries */
    const toDelete = keys.length - maxEntries;
    for (let i = 0; i < toDelete; i++) {
      await cache.delete(keys[i]);
    }
  } catch (err) {
    console.warn("⚠️ trimCache failed:", err);
  }
}

/* ═══════════════════════════════════════════════════════════
   Install — تحميل الـ App Shell
   ═══════════════════════════════════════════════════════════ */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(APP_SHELL).catch(err => {
        console.warn("⚠️ App shell partial failure:", err);
      }))
      .then(() => self.skipWaiting())
  );
});

/* ═══════════════════════════════════════════════════════════
   Activate — تنظيف الكاشات القديمة + إشعار العملاء
   ═══════════════════════════════════════════════════════════ */
self.addEventListener("activate", event => {
  const validCaches = [STATIC_CACHE, HTML_CACHE, IMAGE_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => !validCaches.includes(key))
          .map(key => {
            console.log("🗑️ Deleting old cache:", key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
      .then(async () => {
        /* أبلغ كل التابات المفتوحة إن فيه نسخة جديدة */
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach(client => {
          client.postMessage({ type: "SW_UPDATED", version: CACHE_VERSION });
        });
      })
  );
});

/* ═══════════════════════════════════════════════════════════
   Message — للتحديث الفوري
   ═══════════════════════════════════════════════════════════ */
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* ═══════════════════════════════════════════════════════════
   Fetch — توزيع الطلبات
   ═══════════════════════════════════════════════════════════ */
self.addEventListener("fetch", event => {
  const req = event.request;

  /* تجاهل غير GET */
  if (req.method !== "GET") return;
  if (!isHttpRequest(req)) return;

  const url = req.url;

  /* Firebase و Google APIs → يمر مباشرة */
  if (isFirebaseReq(url)) return;

  /* Google Fonts → Cache-First */
  if (isGoogleFonts(url)) {
    event.respondWith(cacheFirst(req, FONT_CACHE));
    return;
  }

  /* نطاقات خارجية (CDN) */
  if (!isSameOrigin(req)) {
    if (isImageReq(req)) {
      event.respondWith(cacheFirst(req, IMAGE_CACHE));
    } else if (isStaticAsset(req)) {
      event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
    }
    return;
  }

  /* صور → Cache-First */
  if (isImageReq(req)) {
    event.respondWith(cacheFirst(req, IMAGE_CACHE));
    return;
  }

  /* HTML navigation → Network-First */
  if (isHTMLRequest(req)) {
    event.respondWith(networkFirstHTML(req));
    return;
  }

  /* CSS/JS/JSON → Stale-While-Revalidate */
  if (isStaticAsset(req)) {
    event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
    return;
  }
});

/* ═══════════════════════════════════════════════════════════
   Strategies
   ═══════════════════════════════════════════════════════════ */

/* ─── 1. Network-First (HTML) ─── */
async function networkFirstHTML(request) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (isCacheableResponse(response)) {
      const cache = await caches.open(HTML_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return (await caches.match("/index.html")) || Response.error();
  }
}

/* ─── 2. Stale-While-Revalidate (CSS/JS) ─── */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(response => {
      if (isCacheableResponse(response)) {
        cache.put(request, response.clone());
        /* حد أقصى للملفات الثابتة */
        trimCache(cacheName, MAX_STATIC_ENTRIES);
      }
      return response;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || Response.error();
}

/* ─── 3. Cache-First (Images & Fonts) ─── */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      cache.put(request, response.clone());
      /* حد أقصى للصور */
      if (cacheName === IMAGE_CACHE) {
        trimCache(cacheName, MAX_IMAGE_ENTRIES);
      }
    }
    return response;
  } catch (error) {
    /* fallback placeholder للصور */
    if (request.destination === "image") {
      return new Response(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
          <rect fill="#f5efe5" width="400" height="400"/>
          <text x="200" y="200" text-anchor="middle" dominant-baseline="middle"
                font-family="serif" font-size="32" fill="#d9ab5f">✦</text>
        </svg>`,
        { headers: { "Content-Type": "image/svg+xml" } }
      );
    }
    return Response.error();
  }
}
