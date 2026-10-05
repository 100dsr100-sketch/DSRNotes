/* DSR Notes — offline app-shell cache */
const CACHE = 'dsr-notes-v3c';
const OWN = 'dsr-notes-';   // only ever delete THIS app's old caches – every DSR app shares the github.io origin's cache storage
const SHELL = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k.indexOf(OWN) === 0).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // v1g: the app page itself comes from the network first, so an update shows up straight away
  // (cache-first kept the phone on the old version until it was reopened, sometimes twice)
  const url = new URL(req.url);
  if (url.origin === location.origin && (req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname))) {
    e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req).then(h => h || caches.match('./index.html'))));
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && new URL(req.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
