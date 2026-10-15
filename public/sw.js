const CACHE_NAME = 'taklif-man-v4'

const APP_SHELL = [
  '/',
  '/register',
  '/homework',
  '/tomorrow-homework',
  '/task-requests',
  '/group-chat',
  '/support',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL)
    })
  )

  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  /*
   * درخواست‌های API و Supabase نباید از کش سرو شوند.
   * این بخش برای چت، درخواست تکالیف و ارتباط با مدیریت
   * بسیار مهم است تا اطلاعات قدیمی نمایش داده نشود.
   */
  const url = new URL(event.request.url)

  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co')
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        /*
         * فقط پاسخ‌های موفق را در کش قرار می‌دهیم.
         */
        if (
          response.ok &&
          response.type !== 'opaque'
        ) {
          const responseClone = response.clone()

          caches
            .open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone)
            })
        }

        return response
      })
      .catch(() => {
        return caches.match(event.request)
      })
  )
})