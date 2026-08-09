// VelaLight Service Worker - Safe No-Cache Version

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys.map((key) => caches.delete(key))
        );
      } catch (e) {
        console.warn("Service worker cache cleanup error:", e);
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", () => {
  // لا نتدخل في الطلبات حاليًا حتى لا يتم تخزين نسخة قديمة من الموقع.
});