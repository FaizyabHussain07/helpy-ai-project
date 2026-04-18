import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import RequestCard from '../components/cards/RequestCard';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { generateDashboardInsights } from '../lib/groq';
import { PlusCircle, Compass, Trophy, RefreshCw } from 'lucide-react';
import { getCachedData, cacheData } from '../lib/notifications';

const CACHE_KEY = 'dashboard_data';
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    myRequests: 0,
    helped: userData?.contributions || 0,
    trustScore: userData?.trustScore || 0,
    communityToday: 0
  });
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [notificationCount] = useState(0);

  // Load cached data immediately
  useEffect(() => {
    const cached = getCachedData(CACHE_KEY);
    if (cached) {
      setRequests(cached.requests || []);
      setStats(cached.stats || {
        myRequests: 0,
        helped: userData?.contributions || 0,
        trustScore: userData?.trustScore || 0,
        communityToday: 0
      });
      setInsights(cached.insights || []);
      setLoading(false);
      setInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let unsubscribe = null;

    const setupRealtimeUpdates = () => {
      // Real-time updates for recent requests only
      const recentRequestsQuery = query(
        collection(db, 'requests'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      unsubscribe = onSnapshot(recentRequestsQuery, (snapshot) => {
        const recentRequests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRequests(recentRequests);
        setLoading(false);
        
        // Cache the data
        cacheData(CACHE_KEY, { 
          requests: recentRequests, 
          stats, 
          insights 
        }, CACHE_DURATION);
      }, (error) => {
        console.error('Error in real-time updates:', error);
        setLoading(false);
      });
    };

    // Fetch stats once (cached per session)
    const fetchStats = async () => {
      try {
        // Fetch my requests count
        const myRequestsQuery = query(
          collection(db, 'requests'),
          where('authorId', '==', user.uid)
        );
        const myRequestsSnapshot = await getDocs(myRequestsQuery);
        const myRequestsCount = myRequestsSnapshot.size;

        // Count today's requests - simplified
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);
        const todayQuery = query(
          collection(db, 'requests'),
          where('createdAt', '>=', todayTimestamp)
        );
        const todaySnapshot = await getDocs(todayQuery);

        const newStats = {
          myRequests: myRequestsCount,
          helped: userData?.contributions || 0,
          trustScore: userData?.trustScore || 0,
          communityToday: todaySnapshot.size
        };
        
        setStats(newStats);
        
        // Update cache
        const cached = getCachedData(CACHE_KEY);
        cacheData(CACHE_KEY, { 
          requests: cached?.requests || [], 
          stats: newStats, 
          insights: cached?.insights || [] 
        }, CACHE_DURATION);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    setupRealtimeUpdates();
    fetchStats();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, userData]);

  const fetchInsights = async (titles) => {
    if (!titles || titles.length === 0) return;
    
    setInsightsLoading(true);
    try {
      const result = await generateDashboardInsights(titles);
      const newInsights = result?.insights || [];
      setInsights(newInsights);
      
      // Cache insights
      const cached = getCachedData(CACHE_KEY);
      cacheData(CACHE_KEY, { 
        requests: cached?.requests || [], 
        stats: cached?.stats || stats, 
        insights: newInsights 
      }, CACHE_DURATION);
    } catch (err) {
      console.error('Error fetching insights:', err);
    } finally {
      setInsightsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleBadge = () => {
    const role = userData?.role || 'seeker';
    if (role === 'both') return 'Helper & Seeker';
    if (role === 'helper') return 'Can Help';
    if (role === 'seeker') return 'Need Help';
    return role;
  };

  const getWelcomeMessage = () => {
    const role = userData?.role;
    if (role === 'seeker') return 'Post requests and get help from the community.';
    if (role === 'helper') return 'Help others and build your reputation in the community.';
    if (role === 'both') return 'Give and receive help in our community.';
    return 'Welcome to HelpHub AI.';
  };

  const isNeedHelp = userData?.role === 'seeker' || userData?.role === 'both';
  const isCanHelp = userData?.role === 'helper' || userData?.role === 'both';

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar notificationCount={notificationCount} />

      <div className="page-container">
        {/* Hero Card */}
        <div className="hero-card">
          <span className="eyebrow eyebrow-muted" style={{ display: 'block', marginBottom: '12px' }}>
            DASHBOARD
          </span>
          <h1 className="hero-title" style={{ marginBottom: '8px' }}>
            {getGreeting()}, {userData?.displayName || user?.displayName || 'there'}.
          </h1>
          <p className="hero-subtitle">
            <span className="badge badge-teal" style={{ marginRight: '8px' }}>
              {getRoleBadge()}
            </span>
            {userData?.location || 'Remote'}
          </p>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '12px' }}>
            {getWelcomeMessage()}
          </p>
        </div>

        {/* Stats Row - Role Based */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isCanHelp && isNeedHelp 
            ? 'repeat(4, 1fr)' 
            : 'repeat(3, 1fr)', 
          gap: '20px',
          marginTop: '24px'
        }}>
          {/* My Requests - Show for Seekers and Both */}
          {(isNeedHelp) && (
            <div className="stat-card">
              <div className="stat-label">MY REQUESTS</div>
              <div className="stat-value">{stats.myRequests}</div>
              <div className="stat-desc">
                {stats.myRequests === 0 ? 'No active requests' : 'Active help requests'}
              </div>
            </div>
          )}
          
          {/* Helped - Show for Helpers and Both */}
          {(isCanHelp) && (
            <div className="stat-card">
              <div className="stat-label">HELPED</div>
              <div className="stat-value">{stats.helped}</div>
              <div className="stat-desc">
                {stats.helped === 0 ? 'Start helping others' : 'People you\'ve helped'}
              </div>
            </div>
          )}
          
          {/* Trust Score - Show for Helpers and Both */}
          {(isCanHelp) && (
            <div className="stat-card">
              <div className="stat-label">TRUST SCORE</div>
              <div className="stat-value">{stats.trustScore}%</div>
              <div className="stat-desc">
                {stats.trustScore >= 80 ? 'Excellent reputation' : 'Building trust'}
              </div>
            </div>
          )}
          
          {/* Rating - Show for Helpers and Both with rating */}
          {(isCanHelp && userData?.rating > 0) && (
            <div className="stat-card">
              <div className="stat-label">RATING</div>
              <div className="stat-value">{userData?.rating?.toFixed(1) || '0.0'}</div>
              <div className="stat-desc">
                {userData?.ratingCount || 0} reviews
              </div>
            </div>
          )}
          
          {/* Community Today - Show for everyone */}
          <div className="stat-card">
            <div className="stat-label">COMMUNITY TODAY</div>
            <div className="stat-value">{stats.communityToday}</div>
            <div className="stat-desc">
              New requests today
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '32px' }}>
          {/* Recent Requests */}
          <div className="white-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <span className="card-label" style={{ display: 'block', marginBottom: '4px' }}>
                  RECENT REQUESTS
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Latest community activity</h2>
              </div>
              <button 
                className="btn-outline"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => navigate('/explore')}
              >
                View all →
              </button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3].map((i) => (
                  <SkeletonLoader key={i} height="120px" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  No requests yet. Be the first to post!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {requests.map((request) => (
                  <RequestCard 
                    key={request.id} 
                    request={request}
                    onClick={() => navigate(`/request/${request.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* AI Insights */}
            <div className="white-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <span className="card-label" style={{ display: 'block', marginBottom: '4px' }}>
                    AI INSIGHTS
                  </span>
                  <h2 style={{ fontSize: '18px', fontWeight: 800 }}>What the platform is noticing</h2>
                </div>
                <button 
                  className="btn-outline"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => fetchInsights(requests.map(r => r.title))}
                  disabled={insightsLoading}
                >
                  <RefreshCw size={14} style={{ marginRight: '4px' }} />
                  Refresh
                </button>
              </div>

              {insightsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <SkeletonLoader height="60px" />
                  <SkeletonLoader height="60px" />
                </div>
              ) : insights.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {insights.map((insight, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '16px',
                        background: 'var(--surface2)',
                        borderRadius: '12px'
                      }}
                    >
                      <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                        {insight.title}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {insight.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  No insights available yet.
                </p>
              )}
            </div>

            {/* Quick Actions - Role Based */}
            <div className="white-card" style={{ padding: '28px' }}>
              <span className="card-label" style={{ display: 'block', marginBottom: '16px' }}>
                QUICK ACTIONS
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Post Request - Need Help & Both */}
                {isNeedHelp && (
                  <button 
                    className="btn-primary"
                    onClick={() => navigate('/create')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <PlusCircle size={18} />
                    Post a Request
                  </button>
                )}
                
                {/* Explore - Everyone */}
                <button 
                  className={isNeedHelp ? 'btn-outline' : 'btn-primary'}
                  onClick={() => navigate('/explore')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Compass size={18} />
                  Explore Requests
                </button>
                
                {/* Leaderboard - Can Help & Both */}
                {isCanHelp && (
                  <button 
                    className="btn-outline"
                    onClick={() => navigate('/leaderboard')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Trophy size={18} />
                    View Leaderboard
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
