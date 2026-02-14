// ============================================
// SERVICE WORKER POUR NOTIFICATIONS FIREBASE
// ============================================

importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBn7VIddclO7KtrXb5sibCr9SjVLjOy-qI",
  authDomain: "theo1d.firebaseapp.com",
  projectId: "theo1d",
  storageBucket: "theo1d.firebasestorage.app",
  messagingSenderId: "269629842962",
  appId: "1:269629842962:web:a80a12b04448fe1e595acb",
  measurementId: "G-TNSG1XFMDZ"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ============================================
// GESTION DES NOTIFICATIONS EN ARRIÈRE-PLAN
// ============================================

// Recevoir les notifications quand l'app est fermée
messaging.onBackgroundMessage((payload) => {
  console.log('📱 [Service Worker] Notification reçue en arrière-plan:', payload);
  
  // Extraire les données
  const { title, body } = payload.notification || {};
  const data = payload.data || {};
  
  // Déterminer l'icône selon le type
  let icon = 'icon-192x192.png';
  if (data.type === 'grades') icon = 'icon-192x192.png';
  else if (data.type === 'incidents') icon = 'icon-192x192.png';
  else if (data.type === 'homework') icon = 'icon-192x192.png';
  else if (data.type === 'presence') icon = 'icon-192x192.png';
  else if (data.type === 'communiques') icon = 'icon-192x192.png';
  
  // Options de la notification
  const notificationOptions = {
    body: body || 'Nouvelle notification',
    icon: icon,
    badge: '/icon-72x72.png',
    tag: data.type || 'general',
    data: data,
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Ouvrir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };
  
  // Afficher la notification
  return self.registration.showNotification(
    title || 'Espace Parent - CS la Colombe',
    notificationOptions
  );
});

// ============================================
// GESTION DES CLIKS SUR LES NOTIFICATIONS
// ============================================

self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [Service Worker] Notification cliquée:', event.notification);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  notification.close();
  
  // Ouvrir l'application
  if (action === 'open' || action === '') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Si une fenêtre est déjà ouverte, la focus
          for (const client of clientList) {
            if (client.url.includes('index.html') && 'focus' in client) {
              // Naviguer vers la page spécifique
              client.postMessage({
                type: 'NAVIGATE',
                page: data.page || 'dashboard',
                childId: data.childId,
                childName: data.childName
              });
              return client.focus();
            }
          }
          
          // Sinon, ouvrir une nouvelle fenêtre
          if (clients.openWindow) {
            let url = 'index.html';
            if (data.page) {
              url += `?page=${data.page}`;
              if (data.childId) url += `&child=${data.childId}`;
            }
            return clients.openWindow(url);
          }
        })
    );
  }
});

// ============================================
// GESTION DES MESSAGES DE L'APPLICATION
// ============================================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_BADGE') {
    // Mettre à jour le badge de l'application
    if ('setAppBadge' in self.navigator) {
      self.navigator.setAppBadge(event.data.data.count).catch(() => {});
    }
  }
});

// ============================================
// MISE EN CACHE POUR OFFLINE (OPTIONNEL)
// ============================================

const CACHE_NAME = 'parent-app-v1';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'icon-192x192.png',
  'icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
