import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// BROWSER NOTIFICATION SERVICE
// ============================================

const NOTIFICATION_CACHE_KEY = 'notifications_cache';
const NOTIFICATION_TIMESTAMP_KEY = 'notifications_last_fetch';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
};

/**
 * Check if notification permission is granted
 */
export const hasNotificationPermission = () => {
  return Notification.permission === 'granted';
};

/**
 * Show a browser notification
 */
export const showBrowserNotification = (title, options = {}) => {
  if (!hasNotificationPermission()) {
    console.log('Notification permission not granted');
    return;
  }

  const defaultOptions = {
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'helpy-notification',
    requireInteraction: false,
    ...options
  };

  try {
    const notification = new Notification(title, defaultOptions);
    
    notification.onclick = () => {
      window.focus();
      if (options.onClick) {
        options.onClick();
      }
      notification.close();
    };

    // Auto close after 5 seconds if not requiring interaction
    if (!defaultOptions.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }

    return notification;
  } catch (err) {
    console.error('Error showing notification:', err);
  }
};

/**
 * Show notification for new request (for helpers)
 */
export const notifyNewRequest = (request) => {
  showBrowserNotification(
    'New Help Request!',
    {
      body: `${request.title} - ${request.category}`,
      tag: `request-${request.id}`,
      data: { requestId: request.id, type: 'new_request' },
      onClick: () => {
        window.location.href = `/request/${request.id}`;
      }
    }
  );
};

/**
 * Show notification for new helper
 */
export const notifyNewHelper = (helper, request) => {
  showBrowserNotification(
    'Someone wants to help!',
    {
      body: `${helper.name} offered to help with "${request.title}"`,
      tag: `helper-${request.id}`,
      data: { requestId: request.id, type: 'new_helper' },
      onClick: () => {
        window.location.href = `/request/${request.id}`;
      }
    }
  );
};

/**
 * Show notification for request solved
 */
export const notifyRequestSolved = (request) => {
  showBrowserNotification(
    'Request Solved! 🎉',
    {
      body: `"${request.title}" has been marked as solved`,
      tag: `solved-${request.id}`,
      data: { requestId: request.id, type: 'request_solved' },
      onClick: () => {
        window.location.href = `/request/${request.id}`;
      }
    }
  );
};

/**
 * Show notification for new rating
 */
export const notifyNewRating = (rating, fromName) => {
  showBrowserNotification(
    'New Rating Received! ⭐',
    {
      body: `${fromName} rated you ${rating} stars`,
      tag: 'new-rating',
      data: { type: 'new_rating' },
      onClick: () => {
        window.location.href = '/dashboard';
      }
    }
  );
};

// ============================================
// CACHING UTILITIES
// ============================================

/**
 * Cache data to localStorage
 */
export const cacheData = (key, data, ttl = CACHE_DURATION) => {
  try {
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (err) {
    console.error('Error caching data:', err);
  }
};

/**
 * Get cached data from localStorage
 */
export const getCachedData = (key) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsed = JSON.parse(item);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - parsed.timestamp > parsed.ttl) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (err) {
    console.error('Error reading cached data:', err);
    return null;
  }
};

/**
 * Clear cache for a specific key
 */
export const clearCache = (key) => {
  localStorage.removeItem(key);
};

/**
 * Clear all notification cache
 */
export const clearAllNotificationCache = () => {
  localStorage.removeItem(NOTIFICATION_CACHE_KEY);
  localStorage.removeItem(NOTIFICATION_TIMESTAMP_KEY);
};

// ============================================
// BACKGROUND SYNC
// ============================================

/**
 * Register for background sync (for offline support)
 */
export const registerBackgroundSync = async (tag) => {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    return true;
  } catch (err) {
    console.error('Background sync registration failed:', err);
    return false;
  }
};

/**
 * Request persistent notification permission (keeps service worker alive)
 */
export const requestPersistentNotification = async () => {
  if (!navigator.permissions) return false;

  try {
    const result = await navigator.permissions.query({ name: 'notifications' });
    
    if (result.state === 'granted') {
      return true;
    }
    
    // Try to request permission again
    return await requestNotificationPermission();
  } catch (err) {
    console.error('Error checking notification permission:', err);
    return false;
  }
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPushNotifications = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Request new subscription
      // Note: Get this from Firebase Console > Project Settings > Cloud Messaging
      const vapidPublicKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
      
      // Skip if VAPID key is not configured (placeholder or empty)
      if (!vapidPublicKey || vapidPublicKey.includes('YOUR_') || vapidPublicKey.length < 20) {
        console.log('Push notifications skipped: VAPID key not configured');
        return null;
      }
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      console.log('Push subscription created:', subscription);
    }

    return subscription;
  } catch (err) {
    console.error('Error subscribing to push:', err);
    return null;
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPushNotifications = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications');
    }
  } catch (err) {
    console.error('Error unsubscribing:', err);
  }
};

// Helper function for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
