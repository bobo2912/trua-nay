// Bộ nhớ đệm để app mở nhanh và cài được lên màn hình chính.
// Dữ liệu nhóm luôn lấy từ Firebase, không đi qua file này.
const CACHE = "trua-nay-v18";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // mạng trước để luôn nhận bản mới; mất mạng thì dùng bản đã lưu
    // luôn hỏi lại máy chủ (bỏ qua bộ nhớ đệm trình duyệt) để bản mới hiện ngay
    const fresh = fetch(url.href, { cache: "no-cache", credentials: "same-origin" });
    e.respondWith(fresh.then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(url.pathname, c)); } return r; })
      .catch(() => caches.match(url.pathname).then(r => r || caches.match("./") || caches.match("index.html"))));
  } else if (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/") || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com" || url.hostname === "cdn.jsdelivr.net") {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); return res; })));
  }
});
