// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config - same as main app
firebase.initializeApp({
  apiKey: self.VITE_FIREBASE_API_KEY || "",
  authDomain: self.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: self.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: self.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: self.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: self.VITE_FIREBASE_APP_ID || ""
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.type || 'default',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'View'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'open' || !action) {
    // Open the app and navigate to relevant page
    let url = '/';
    
    if (data?.requestId) {
      url = `/request/${data.requestId}`;
    } else if (data?.type === 'new_helper') {
      url = '/notifications';
    }

    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // If a window client is already open, focus it
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Handle push events (fallback for non-Firebase push)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: data.tag || 'default',
      data: data.data,
      requireInteraction: true
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});
