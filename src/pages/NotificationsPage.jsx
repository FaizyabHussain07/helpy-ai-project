import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, limit, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import { Check, Bell } from 'lucide-react';
import { getCachedData, cacheData, showBrowserNotification } from '../lib/notifications';

const CACHE_KEY = 'notifications_data';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastVisible, setLastVisible] = useState(null);

  // Load cached data immediately
  useEffect(() => {
    const cached = getCachedData(CACHE_KEY);
    if (cached) {
      setNotifications(cached.notifications || []);
      setUnreadCount(cached.unreadCount || 0);
      // Still show loading briefly to fetch fresh data
      setLoading(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Optimized query: limit to 50 most recent notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('toUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Check for new notifications and show browser notification
      const currentUnread = notifs.filter(n => !n.read);
      const prevUnread = notifications.filter(n => !n.read);
      
      // If there are new unread notifications
      if (currentUnread.length > prevUnread.length && !loading) {
        const latestNotif = currentUnread[0];
        showBrowserNotification(
          getNotificationTitle(latestNotif.type),
          {
            body: getNotificationBody(latestNotif),
            data: { requestId: latestNotif.requestId, type: latestNotif.type },
            onClick: () => {
              if (latestNotif.requestId) {
                navigate(`/request/${latestNotif.requestId}`);
              }
            }
          }
        );
      }
      
      setNotifications(notifs);
      const unread = currentUnread.length;
      setUnreadCount(unread);
      setLoading(false);
      
      // Cache the data
      cacheData(CACHE_KEY, { notifications: notifs, unreadCount: unread }, CACHE_DURATION);
    });

    return () => unsubscribe();
  }, [user, navigate]);

  // Separate effect for marking as read (debounced)
  useEffect(() => {
    if (!user || notifications.length === 0) return;
    
    const timer = setTimeout(() => {
      markAllAsRead();
    }, 3000);

    return () => clearTimeout(timer);
  }, [notifications]);

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter(n => !n.read);
      
      unreadNotifications.forEach((notif) => {
        const notifRef = doc(db, 'notifications', notif.id);
        batch.update(notifRef, { read: true });
      });

      await batch.commit();
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationText = (notif) => {
    switch (notif.type) {
      case 'new_helper':
        return `"${notif.requestTitle}" has a new helper: ${notif.fromName}`;
      case 'request_solved':
        return `"${notif.requestTitle}" was marked as solved (+10 trust score)`;
      case 'new_message':
        return `New message from ${notif.fromName}`;
      case 'trust_increase':
        return `Your trust score increased!`;
      case 'new_rating':
        return `${notif.fromName} rated you ${notif.rating} stars`;
      default:
        return notif.requestTitle || 'New notification';
    }
  };

  const getNotificationTitle = (type) => {
    const titles = {
      'new_helper': 'New Helper! 🦸',
      'request_solved': 'Request Solved! 🎉',
      'new_message': 'New Message 💬',
      'trust_increase': 'Trust Score Up! ⭐',
      'new_rating': 'New Rating! ⭐'
    };
    return titles[type] || 'New Notification';
  };

  const getNotificationBody = (notif) => {
    switch (notif.type) {
      case 'new_helper':
        return `${notif.fromName} wants to help with "${notif.requestTitle}"`;
      case 'request_solved':
        return `"${notif.requestTitle}" has been marked as solved`;
      case 'new_message':
        return `You have a new message from ${notif.fromName}`;
      case 'new_rating':
        return `${notif.fromName} rated you ${notif.rating} stars`;
      default:
        return getNotificationText(notif);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'new_helper': 'New Helper',
      'request_solved': 'Request Solved',
      'new_message': 'Message',
      'trust_increase': 'Trust Score',
      'new_rating': 'New Rating'
    };
    return labels[type] || 'Notification';
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar notificationCount={unreadCount} />

      <div className="page-container">
        {/* Hero Card */}
        <div className="hero-card">
          <span className="eyebrow eyebrow-muted" style={{ display: 'block', marginBottom: '12px' }}>
            NOTIFICATIONS
          </span>
          <h1 className="hero-title" style={{ marginBottom: '8px' }}>
            Stay updated on requests, helpers, and trust signals.
          </h1>
        </div>

        {/* Single Card */}
        <div className="white-card" style={{ marginTop: '32px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <span className="card-label" style={{ display: 'block', marginBottom: '4px' }}>
                LIVE UPDATES
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
                Notification feed
              </h2>
            </div>
            {unreadCount > 0 && (
              <button 
                className="btn-outline"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={markAllAsRead}
              >
                <Check size={14} style={{ marginRight: '6px' }} />
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: '70px' }} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px' }}>
              <Bell size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-muted)' }}>
                No notifications yet. Start engaging with the community!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {notifications.map((notif, idx) => (
                <div 
                  key={notif.id}
                  onClick={() => notif.requestId && navigate(`/request/${notif.requestId}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px 0',
                    borderBottom: idx < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: notif.requestId ? 'pointer' : 'default',
                    background: notif.read ? 'transparent' : 'var(--teal-light)',
                    margin: '0 -28px',
                    paddingLeft: '28px',
                    paddingRight: '28px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      fontSize: '14px', 
                      fontWeight: notif.read ? 500 : 700,
                      color: 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>
                      {getNotificationText(notif)}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {getTypeLabel(notif.type)} • {formatTime(notif.createdAt)}
                    </p>
                  </div>
                  <span className={`badge ${notif.read ? 'badge-tag' : 'badge-teal'}`} style={{ fontSize: '11px' }}>
                    {notif.read ? 'Read' : 'Unread'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
