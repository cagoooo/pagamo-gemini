/* PaGamO 題組下載器 Service Worker
 * 新版不自動接管：先進入「等待」，由頁面上的「有新版本」提示列讓使用者決定何時重新整理。
 * 版本號由 scripts/bump-version.ps1 同步（version.json、index.html、sw.js 三處）。 */
const BUILD_VERSION = '1.5.4';
const PREFIX = 'pagamo-gemini-';            // github.io 同網域有很多專案，只動自己前綴的快取
const CACHE = PREFIX + BUILD_VERSION;
const V = '?v=' + BUILD_VERSION;
const PRECACHE = ['./', './pagamo.js' + V, './sw-register.js' + V, './favicon.svg' + V, './favicon.ico' + V,
  './apple-touch-icon.png' + V, './manifest.webmanifest' + V,
  './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) =>
    Promise.allSettled(PRECACHE.map((u) => c.add(new Request(u, { cache: 'reload' }))))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (!e.data) return;
  if (e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data.type === 'GET_VERSION' && e.ports[0]) e.ports[0].postMessage({ version: BUILD_VERSION });
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url; try { url = new URL(req.url); } catch (err) { return; }
  // PaGamO 官方範本、Excel 工具（cdnjs）等外部檔案不經 SW，永遠拿最新
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/version.json')) {
    e.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(req)));
    return;
  }
  // 網頁本身：網路優先（不吃 GitHub Pages 10 分鐘快取），離線才用留存的
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)); }
      return res;
    }).catch(() => caches.match('./')));
    return;
  }
  // 其他同源檔案（網址帶版本號）：有留存就用，沒有再抓
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }))));
});
