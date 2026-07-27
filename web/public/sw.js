const SHELL_CACHE = 'starter-shell-v1'
const DATA_CACHE = 'starter-data-v1'

const OFFLINE_API = /^\/api\/(projects|auth\/(me|config))/

const NETWORK_ONLY_API = /^\/api\/(explore|public|nutritionists|diet-requests|diet-offers|reviews|users)/

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const [cache, response] = await Promise.all([caches.open(SHELL_CACHE), fetch('/')])

            if (!response.ok) throw new Error(`shell precache failed: ${response.status}`)
            await cache.put('/', response.clone())
            const html = await response.text()
            const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+|\/icons\/[^"]+|\/manifest\.webmanifest)"/g)]
                .map((match) => match[1])
            await cache.addAll([...new Set(assets)])
            await self.skipWaiting()
        })()
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys.flatMap((key) => (key !== SHELL_CACHE && key !== DATA_CACHE ? [caches.delete(key)] : []))
                )
            )
            .then(() => self.clients.claim())
    )
})

self.addEventListener('fetch', (event) => {
    const request = event.request
    if (request.method !== 'GET') return
    const url = new URL(request.url)
    if (url.origin !== self.location.origin) return

    if (NETWORK_ONLY_API.test(url.pathname)) return

    if (OFFLINE_API.test(url.pathname)) {
        if (/^\/api\/recipes\/[^/]+\/photo/.test(url.pathname)) {
            event.respondWith(networkFirst(request, DATA_CACHE).then((response) => response ?? photoPlaceholder()))
            return
        }
        event.respondWith(networkFirst(request, DATA_CACHE))
        return
    }
    if (url.pathname.startsWith('/api/')) return

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone()
                    caches.open(SHELL_CACHE).then((cache) => cache.put('/', copy))
                    return response
                })
                .catch(() => caches.match('/'))
        )
        return
    }

    event.respondWith(
        caches.match(request).then(
            (cached) =>
                cached ||
                fetch(request).then((response) => {
                    if (response.ok) {
                        const copy = response.clone()
                        caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy))
                    }
                    return response
                })
        )
    )
})

const networkFirst = (request, cacheName) =>
    fetch(request)
        .then((response) => {
            if (response.ok) {
                const copy = response.clone()
                caches.open(cacheName).then((cache) => cache.put(request, copy))
            }
            return response
        })
        .catch(() => caches.match(request))

const PHOTO_PLACEHOLDER_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
    '<rect width="800" height="450" fill="#f0e9dc"/>' +
    '<g stroke="#b8ae9f" stroke-width="10" stroke-linecap="round" fill="none">' +
    '<circle cx="400" cy="205" r="70"/>' +
    '<path d="M330 300h140"/>' +
    '</g>' +
    '<text x="400" y="360" text-anchor="middle" font-family="system-ui, sans-serif" font-size="26" fill="#8a8378">' +
    'Фотографијата не е достапна офлајн</text>' +
    '</svg>'

const photoPlaceholder = () =>
    new Response(PHOTO_PLACEHOLDER_SVG, {
        headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'no-store' },
    })

self.addEventListener('push', (event) => {
    let payload = { title: 'JADI.mk', link: '/' }
    try {
        payload = { ...payload, ...event.data.json() }
    } catch {
    }
    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: 'JADI.mk',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            data: { link: payload.link },
        })
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const link = (event.notification.data && event.notification.data.link) || '/'
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
            for (const client of windows) {
                if ('focus' in client) {
                    client.navigate(link)
                    return client.focus()
                }
            }
            return self.clients.openWindow(link)
        })
    )
})
