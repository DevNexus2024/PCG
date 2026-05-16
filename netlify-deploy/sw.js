// Service Worker for The Pizza Club and Grill PWA
const CACHE_NAME = 'pizza-club-v1.0.0';
const RUNTIME_CACHE = 'pizza-club-runtime-v1.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/menu.html',
    '/login.html',
    '/signup.html',
    '/delivery.html',
    '/payment.html',
    '/order-tracking.html',
    '/css/style.css',
    '/css/auth.css',
    '/css/admin.css',
    '/css/windows-gui.css',
    '/js/menu.js',
    '/js/auth.js',
    '/js/delivery.js',
    '/js/payment.js',
    '/js/firebase.js',
    '/js/desktop-mode.js',
    '/js/pwa-install.js',
    '/images/images_(1).jpeg',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('📦 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ Opened cache');
                return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'no-cache' })));
            })
            .then(() => {
                console.log('✅ Static assets cached');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('❌ Cache installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim(); // Take control immediately
            })
    );
});

// Fetch event - serve from cache with network timeout for mobile data
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip Firebase and external API requests (always fetch fresh)
    if (event.request.url.includes('firebaseio.com') || 
        event.request.url.includes('googleapis.com') ||
        event.request.url.includes('flutterwave.com')) {
        return;
    }

    // For CDN resources (Font Awesome, etc), use cache-first with longer timeout
    if (event.request.url.includes('cdnjs.cloudflare.com') ||
        event.request.url.includes('gstatic.com')) {
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If not cached, fetch with timeout
                    return fetchWithTimeout(event.request, 5000);
                })
        );
        return;
    }

    // For app resources, use stale-while-revalidate for speed
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Always return cache immediately if available
                const fetchPromise = fetchWithTimeout(event.request, 3000)
                    .then((response) => {
                        // Update cache in background
                        if (response && response.status === 200) {
                            const responseToCache = response.clone();
                            caches.open(RUNTIME_CACHE).then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        }
                        return response;
                    })
                    .catch(() => cachedResponse || caches.match('/index.html'));

                // Return cached response immediately, or wait for network
                return cachedResponse || fetchPromise;
            })
    );
});

// Fetch with timeout - better for slow mobile connections
function fetchWithTimeout(request, timeout = 3000) {
    return Promise.race([
        fetch(request),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), timeout)
        )
    ]).catch((error) => {
        console.warn('⚠️ Fetch timeout or failed:', request.url);
        throw error;
    });
}

// Handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_CLEAR') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

// Background sync for offline orders (future enhancement)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrders());
    }
});

async function syncOrders() {
    // Placeholder for syncing offline orders
    console.log('🔄 Syncing offline orders...');
}

// Push notification support (future enhancement)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Pizza Club Notification';
    const options = {
        body: data.body || 'You have a new notification',
        icon: '/images/icons/icon-192x192.png',
        badge: '/images/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: data.url || '/',
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'close', title: 'Close' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow(event.notification.data)
        );
    }
});
