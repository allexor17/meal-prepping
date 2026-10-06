// La vecchia app del meal prep viveva alla radice del sito e qui registrava il suo service worker.
// Ora vive in /mealprep/ (Schiscia): questo file prende il posto del vecchio, cancella le sue cache e si disattiva.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k.startsWith("mealprep-")).map(k => caches.delete(k)));
    await self.registration.unregister();
    const cs = await self.clients.matchAll({ type: "window" });
    cs.forEach(c => c.navigate(c.url).catch(() => {}));
  })());
});
