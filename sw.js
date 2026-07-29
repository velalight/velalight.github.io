// Service Worker بسيط لـ VelaLight
// بيسمح بتثبيت الموقع كتطبيق (PWA) ويعمل كاش خفيف للصفحة الرئيسية

const CACHE_NAME = "velalight-cache-v1";
const FILES_TO_CACHE = [
  "/",
  "/index.html"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(FILES_TO_CACHE);
    }).catch(function(){})
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event){
  event.respondWith(
    caches.match(event.request).then(function(response){
      return response || fetch(event.request).catch(function(){
        return caches.match("/index.html");
      });
    })
  );
});
