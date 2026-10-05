// Salva l'app sul telefono per usarla offline. Cambia VERSION a ogni aggiornamento.
const VERSION = "mealprep-v10";
const CORE = ["./", "./index.html", "./style.css", "./data.js", "./prices.js", "./app.js", "./extras.js", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // File dell'app: prima la rete (così arrivano gli aggiornamenti), se offline la copia salvata
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html"))));
    return;
  }
  // Font di Google: prima la copia salvata
  if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; })));
  }
});
