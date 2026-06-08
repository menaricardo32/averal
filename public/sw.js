const CACHE_NAME = 'ph-machinery-image-cache-v1';
const MAX_ENTRIES = 100; // Limit cache to 100 images
const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Helper to limit cache size
async function limitCacheSize(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await cache.delete(keys[0]);
    limitCacheSize(cacheName, maxEntries);
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Check if the request is for an image
  const isImage = IMAGE_TYPES.some(type => url.pathname.toLowerCase().endsWith(`.${type}`)) || 
                  event.request.destination === 'image' ||
                  url.origin.includes('firebasestorage.googleapis.com') ||
                  url.origin.includes('picsum.photos');

  if (isImage && event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response but still update it in the background (Stale-While-Revalidate)
          // This ensures the user gets the image instantly but we check for updates
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
                limitCacheSize(CACHE_NAME, MAX_ENTRIES);
              });
            }
          }).catch(() => {
            // Ignore network errors when revalidating
          });
          
          return cachedResponse;
        }

        // Cache First for new images
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
            limitCacheSize(CACHE_NAME, MAX_ENTRIES);
          });

          return response;
        });
      })
    );
  }
});
