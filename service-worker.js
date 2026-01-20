const CACHE_NAME = "pace-speed-ios-v5"; // 每次更新功能就 +1
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png"
];

// 安裝：預快取
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
});

// 啟用：清掉舊快取
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

// 抓取：HTML network-first（確保更新會生效）
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // 只處理同網域
  if (url.origin !== location.origin) return;

  // HTML（含根目錄）採 network-first
  const isHTML =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // 其他資源採 cache-first
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

