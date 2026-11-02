/* Offline support: pages are network-first (always fresh when online),
   static files are cache-first (instant repeat visits). Same-origin only. */
const VERSION = "br-v48";
const CORE = ["./", "index.html", "styles.css", "app.js", "starmap.js", "rain.js", "data.js", "assets/images/img-opt.js",
  "assets/images/favicon.svg", "assets/images/brandon-art-base.webp", "assets/images/brandon-art-dark.webp", "assets/images/brandon-art-light.webp", "assets/images/brandon-art-glow-dark.webp", "assets/images/brandon-art-glow-light.webp", "assets/images/headshot.webp", "manifest.webmanifest"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.mode === "navigate" || /\.(html|js|css|webmanifest)$/.test(url.pathname)) {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(VERSION).then((ca) => ca.put(req, c)); return r; })
      .catch(() => caches.match(req).then((m) => m || caches.match("index.html"))));
  } else {
    e.respondWith(caches.match(req).then((m) => m || fetch(req).then((r) => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then((ca) => ca.put(req, c)); } return r; })));
  }
});
