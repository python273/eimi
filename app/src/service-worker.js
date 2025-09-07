const CACHE_NAME = 'eimi-cache-v1'
// This placeholder will be replaced by the vite plugin with the list of files to cache.
const FILES_TO_CACHE = self.__FILES_TO_CACHE

self.addEventListener('install', event => {
  console.log('SW: install')
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE.concat(['/', '/favicon.png'])))
  )
})

self.addEventListener('activate', event => {
  console.log('SW: activate')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url)

  if (
    event.request.method !== 'GET' ||
    requestUrl.pathname.startsWith('/proxy/') ||
    requestUrl.origin !== self.origin
  ) {
    return // Bypass the cache and let the browser handle the request.
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('SW: serving from cache:', event.request.url)
        }
        return response || fetch(event.request)
      })
  )
})
