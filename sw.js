const CACHE_NAME = 'gradebox-pwa-v3';
const LOCAL_URLS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => { 
        return cache.addAll(LOCAL_URLS); 
    })
  );
});

self.addEventListener('fetch', event => {
  // Abaikan request API ke Google Apps Script dan Dropbox agar selalu fresh & tidak CORS error
  if (event.request.url.includes('script.google.com') || 
      event.request.url.includes('script.googleusercontent.com') || 
      event.request.url.includes('dropbox')) {
     return;
  }
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(event.request).then(networkResponse => {
            // Jangan cache jika gagal (kecuali response 'opaque' dari CDN)
            if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
                return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
            });
            return networkResponse;
        }).catch(() => {
            // Aplikasi sedang Offline, biarkan berlanjut (SW akan mencari cache lokal)
        });
    })
  );
});