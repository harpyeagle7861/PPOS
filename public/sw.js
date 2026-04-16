const CACHE_NAME = "aiza-titanium-ghost-v3";

// The files we want to ensure are cached immediately
const CORE_ASSETS = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
    console.log("[AIZA GHOST] Installing Sovereign Cache into Browser...");
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CORE_ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log("[AIZA GHOST] Activated & Claiming Substrate. Browser is now infected.");
    // Claim any clients immediately so we don't have to wait for a reload
    event.waitUntil(self.clients.claim());
    
    // Clean up old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log("[AIZA GHOST] Purging old memory: ", cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Only intercept GET requests
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests if necessary, but we want to cache fonts/etc if possible.
    // For safety, we'll try network first, then cache. This ensures we always get the latest
    // code when online, but fall back to the cache when offline.

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // If the network fetch is successful, clone the response and store it in the cache.
                // This creates a dynamic, ever-growing cache of the entire OS as the user uses it.
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // NETWORK FAILED (Wi-Fi is off). 
                // Intercept the failure and serve from the Titanium Ghost Cache.
                console.log("[AIZA GHOST] Network severed. Serving from Sovereign Cache: ", event.request.url);
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    // If it's a navigation request (like refreshing the page) and we don't have the exact URL,
                    // serve the root index.html to let React Router/State take over.
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    
                    return new Response('', { status: 408, statusText: 'Offline' });
                });
            })
    );
});
