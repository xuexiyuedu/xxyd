const CACHE_NAME = "knowledge-reader-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard/files",
  "/dashboard/notes",
  "/dashboard/stats",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// 安装时缓存核心静态资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch(() => {})
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 网络优先，失败回退缓存
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // 跳过非 GET 请求和 chrome-extension
  if (request.method !== "GET" || request.url.startsWith("chrome-extension://")) {
    return;
  }

  // 对导航请求：网络优先，失败回退缓存（确保始终尝试获取最新页面）
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功拿到响应，缓存一份
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match("/"))  // 离线时回退到缓存首页
    );
    return;
  }

  // 静态资源：缓存优先
  if (request.destination === "style" || request.destination === "script" || request.destination === "font") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // 其他请求：网络优先
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
