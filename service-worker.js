/* DSR Notes - offline app-shell cache
   App files: network-first with cache:'no-cache' (an update shows on the next open - a cheap 304 when nothing
   changed); the saved copy is the offline fallback. vendor/ (the on-device speech runtime, ~22 MB) is
   cache-first: it only changes with a new library version, which gets a new VENDOR name - network-first
   would re-save 22 MB on every visit. Cross-origin traffic (sync, speech models) is never cached here. */
const CACHE = 'dsr-notes-v3e';
const VENDOR = 'dsr-notes-vendor-tjs381';
const OWN = 'dsr-notes-';   // only ever delete THIS app's old caches (never 'transformers-cache' - the speech models)
const SHELL = ['./', './index.html', './manifest.json', './icon.svg', './dsr-speech.js', './speech-worker.js', './dsr-move.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== VENDOR && k.indexOf(OWN) === 0).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.indexOf('/vendor/') >= 0) { e.respondWith(cacheFirst(VENDOR, req).then(withCOI)); return; }
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return withCOI(res);
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => withCOI(hit) || caches.match('./index.html').then(withCOI)))
  );
});

/* cross-origin isolation (-> multi-threaded on-device voice typing). The Pages site sends these headers itself
   (_headers); this covers pages served from the offline cache. "credentialless" keeps cross-origin requests
   (sync, speech-model downloads) working without them needing CORP headers. */
function withCOI(res) {
  if (!res || res.status === 0 || res.type === 'opaque' || res.type === 'opaqueredirect') return res;
  const h = new Headers(res.headers);
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('Cross-Origin-Embedder-Policy', 'credentialless');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
function cacheFirst(name, req) {
  return caches.open(name).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; })));
}
