// Service worker بسيط - يمنع ظهور 404 في الكونسول
// ممكن تضيفي عليه كاش للصور والملفات لاحقًا لو عاوزة الموقع يشتغل أوفلاين
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
