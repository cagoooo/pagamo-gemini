/* 註冊 Service Worker＋「有新版本」提示列
 * 兩個偵測來源共用同一個提示列：① 新的 SW 進入等待 ② version.json 版本比目前頁面新。
 * 只在「真的比較新」時提示；按下按鈕的當下才查 waiting（不吃舊的參考）。
 * 本機開發（localhost）預設不註冊並清掉殘留 SW；網址加 ?sw=1 才啟用。網址加 ?swdemo=1 可預覽提示列樣式。 */
(function () {
  if (!('serviceWorker' in navigator)) return;
  var meta = document.querySelector('meta[name="build-version"]');
  var PAGE_VERSION = meta ? meta.content : '0.0.0';
  var qs = location.search;
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (isLocal && !/[?&]sw=1/.test(qs)) {
    navigator.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { r.unregister(); }); });
    if (/[?&]swdemo=1/.test(qs)) document.addEventListener('DOMContentLoaded', function () { showBar('9.9.9'); });
    return;
  }

  var ACK_KEY = 'pgm-sw-ack';
  var reg = null, latest = null, updating = false;
  var hadController = !!navigator.serviceWorker.controller;

  function newer(a, b) {
    var x = String(a || '').split('.').map(Number), y = String(b || '').split('.').map(Number);
    for (var i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); }
    return false;
  }
  function acked(v) { try { return sessionStorage.getItem(ACK_KEY) === v; } catch (e) { return false; } }
  function ack(v) { try { sessionStorage.setItem(ACK_KEY, v); } catch (e) {} }

  function offer(v) {
    if (!v || !newer(v, PAGE_VERSION) || acked(v)) return;
    if (!latest || newer(v, latest)) latest = v;
    showBar(latest);
  }

  function hardReload() {
    var u = new URL(location.href);
    u.searchParams.set('v', latest || String(Date.now()));
    location.replace(u.toString());
  }

  function applyUpdate() {
    if (updating) return;
    updating = true;
    if (latest) ack(latest);
    var go = document.getElementById('sw-go');
    if (go) { go.disabled = true; go.textContent = '更新中…'; }
    var w = reg && reg.waiting;
    if (w) {
      w.postMessage({ type: 'SKIP_WAITING' });   // → 接管 → controllerchange → 重新載入
      setTimeout(hardReload, 8000);              // 保底：8 秒沒換手就用帶版本號的網址重開
    } else {
      hardReload();
    }
  }

  function showBar(v) {
    if (document.getElementById('sw-update-bar')) {
      var t = document.getElementById('sw-ver'); if (t && v) t.textContent = 'v' + v;
      return;
    }
    var css = document.createElement('style');
    css.textContent =
      '#sw-update-bar{position:fixed;z-index:9999;left:50%;top:max(14px,env(safe-area-inset-top));transform:translateX(-50%);' +
      'width:max-content;max-width:calc(100vw - 24px);display:flex;align-items:center;gap:12px;padding:10px 12px 10px 18px;' +
      'background:var(--card,#fff);color:var(--ink,#1f2937);border:1px solid var(--line,#e2e8f0);border-radius:999px;' +
      'box-shadow:0 14px 34px -10px rgba(0,0,0,.45);font-size:var(--fs-sm,15px);animation:swIn .35s ease-out}' +
      '#sw-update-bar::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:2px;pointer-events:none;' +
      'background:linear-gradient(90deg,#2563eb,#7c3aed,#fbbf24);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);' +
      '-webkit-mask-composite:xor;mask-composite:exclude}' +
      '#sw-update-bar .sw-msg{display:flex;flex-direction:column;line-height:1.35}#sw-update-bar .sw-msg strong{font-weight:800}' +
      '#sw-update-bar .sw-sub{display:none;color:var(--muted,#475569);font-size:.9em}' +
      '#sw-ver{margin-left:6px;font-size:.85em;color:var(--muted,#475569);font-weight:600}' +
      '#sw-go{border:0;border-radius:999px;padding:9px 18px;font:inherit;font-weight:800;cursor:pointer;color:#fff;' +
      'background:linear-gradient(135deg,#2563eb,#7c3aed);min-height:40px}' +
      '#sw-x{border:0;background:transparent;color:var(--muted,#475569);font:inherit;font-size:1.1em;cursor:pointer;width:40px;height:40px;border-radius:50%}' +
      '#sw-update-bar button:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}' +
      '#sw-go:disabled{opacity:.7;cursor:wait}' +
      '@keyframes swIn{from{opacity:0;transform:translate(-50%,-12px)}to{opacity:1;transform:translate(-50%,0)}}' +
      '@media (max-width:560px){#sw-update-bar{left:12px;right:12px;top:auto;bottom:max(12px,env(safe-area-inset-bottom));transform:none;' +
      'width:auto;display:grid;grid-template-columns:1fr auto;grid-template-areas:"msg x" "go go";gap:10px;padding:14px;border-radius:18px;animation:none}' +
      '#sw-update-bar .sw-msg{grid-area:msg}#sw-update-bar .sw-sub{display:block}#sw-x{grid-area:x;width:44px;height:44px}' +
      '#sw-go{grid-area:go;width:100%;min-height:48px;border-radius:14px}}' +
      '@media (prefers-reduced-motion:reduce){#sw-update-bar{animation:none}}';
    document.head.appendChild(css);
    var bar = document.createElement('div');
    bar.id = 'sw-update-bar';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.innerHTML = '<span class="sw-msg"><strong>✨ 題組下載器有新版本<span id="sw-ver"></span></strong>' +
      '<span class="sw-sub">重新整理就能使用最新功能</span></span>' +
      '<button id="sw-go" type="button">重新整理載入</button>' +
      '<button id="sw-x" type="button" aria-label="稍後再說">✕</button>';
    document.body.appendChild(bar);
    if (v) document.getElementById('sw-ver').textContent = 'v' + v;
    document.getElementById('sw-go').onclick = applyUpdate;
    document.getElementById('sw-x').onclick = function () { if (latest) ack(latest); bar.remove(); };
  }

  // 問等待中的 SW 是哪一版，比目前頁面新才提示
  function checkWaiting() {
    var w = reg && reg.waiting;
    if (!w || !navigator.serviceWorker.controller) return;
    var ch = new MessageChannel(), done = false;
    ch.port1.onmessage = function (e) { done = true; offer(e.data && e.data.version); };
    w.postMessage({ type: 'GET_VERSION' }, [ch.port2]);
    setTimeout(function () { if (!done) checkVer(); }, 2000);
  }

  function checkVer() {
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.version && newer(d.version, PAGE_VERSION) && !acked(d.version)) {
          if (reg) reg.update().catch(function () {});   // 先讓新版 SW 下載，按下時 waiting 已就緒
          offer(d.version);
        }
      }).catch(function () {});
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (r) {
      reg = r;
      checkWaiting();
      r.addEventListener('updatefound', function () {
        var nw = r.installing; if (!nw) return;
        nw.addEventListener('statechange', function () { if (nw.state === 'installed') checkWaiting(); });
      });
      setInterval(function () { r.update().catch(function () {}); }, 60 * 60 * 1000);
    }).catch(function () {});
    setTimeout(checkVer, 5000);
  });

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController) { hadController = true; return; }   // 第一次安裝接管頁面，不重新整理
    if (!updating) return;                                   // 只有使用者按了更新才重新整理
    location.reload();
  });

  ['focus', 'online'].forEach(function (ev) { window.addEventListener(ev, checkVer); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') checkVer(); });
  setInterval(checkVer, 10 * 60 * 1000);
})();
