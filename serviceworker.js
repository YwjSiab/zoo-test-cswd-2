// Define the cache name for versioning
const CACHE_NAME = "ntc-zoo-cache-v1";

// List of essential files to pre-cache for offline use
const FILES_TO_CACHE = [
  "/Sprint-C3-Zoo/",
  "/Sprint-C3-Zoo/index.html",
  "/Sprint-C3-Zoo/zoo.js",
  "/Sprint-C3-Zoo/manifest.json",
  "/Sprint-C3-Zoo/icon-192.png",
  "/Sprint-C3-Zoo/icon-512.png"
];
// Install event – cache app shell
self.addEventListener("install", (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

// Fetch event – serve from cache, then fallback to network
self.addEventListener("fetch", (evt) => {
  evt.respondWith(
    caches.match(evt.request).then((cachedRes) => {
      // Return cached response if found
      if (cachedRes) return cachedRes;

      // Otherwise fetch from the network
      return fetch(evt.request).then((networkRes) => {
        // Clone the response only once
        const resClone = networkRes.clone();

        // If the request is for an image, cache it dynamically
        if (evt.request.destination === "image") {
          caches.open("image-cache").then((cache) => {
            cache.put(evt.request, resClone);
          });
        }
        
        // Return original response to page
        return networkRes;
      }).catch((err) => {
        console.error("Fetch failed:", err);
        return new Response("Offline and resource not cached", { status: 503 });
      });
    })
  );
});