import { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import Navbar from '../components/layout/Navbar';
import { generateCommunityTrends, generateAISummary } from '../lib/groq';
import { TrendingUp, AlertCircle, Users, Sparkles } from 'lucide-react';

const AICenterPage = () => {
  const [trends, setTrends] = useState([]);
  const [stats, setStats] = useState({
    trendPulse: 'Web Development',
    urgentCount: 0,
    mentorPool: 0
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiSummaries, setAiSummaries] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all requests
      const requestsQuery = query(collection(db, 'requests'));
      const snapshot = await getDocs(requestsQuery);
      const allRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setRequests(allRequests);

      // Calculate stats
      const urgentRequests = allRequests.filter(r => r.urgency === 'High' && r.status === 'open');
      
      // Count mentors (users with contributions > 0)
      const usersQuery = query(collection(db, 'users'), where('contributions', '>', 0));
      const usersSnapshot = await getDocs(usersQuery);

      // Find most common category
      const categoryCounts = {};
      allRequests.forEach(r => {
        categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
      });
      const topCategory = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Web Development';

      setStats({
        trendPulse: topCategory,
        urgentCount: urgentRequests.length,
        mentorPool: usersSnapshot.size
      });

      // Get AI trends
      const titles = allRequests.map(r => r.title);
      const trendsResult = await generateCommunityTrends(titles);
      setTrends(trendsResult?.trends || []);

      // Sort requests by urgency for recommendations
      const sortedRequests = [...allRequests].sort((a, b) => {
        const urgencyOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0);
      });
      setRequests(sortedRequests);

    } catch (err) {
      console.error('Error fetching AI center data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgency) => {
    const classes = {
      'High': 'badge-high',
      'Medium': 'badge-medium',
      'Low': 'badge-low'
    };
    return classes[urgency] || 'badge-low';
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div className="page-container">
        {/* Hero Card */}
        <div className="hero-card">
          <span className="eyebrow eyebrow-muted" style={{ display: 'block', marginBottom: '12px' }}>
            AI CENTER
          </span>
          <h1 className="hero-title" style={{ marginBottom: '8px' }}>
            See what the platform intelligence is noticing.
          </h1>
          <p className="hero-subtitle">
            AI-like insights summarize demand trends, helper readiness, urgency signals, and request recommendations.
          </p>
        </div>

        {/* Stats Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '20px',
          marginTop: '32px'
        }}>
          <div className="white-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--teal-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={20} color="var(--teal)" />
              </div>
              <span className="card-label" style={{ margin: 0 }}>TREND PULSE</span>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              {stats.trendPulse}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Most common support area based on active community requests.
            </p>
          </div>

          <div className="white-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--badge-high-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle size={20} color="var(--badge-high-text)" />
              </div>
              <span className="card-label" style={{ margin: 0 }}>URGENCY WATCH</span>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: 'var(--badge-high-text)' }}>
              {stats.urgentCount}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Requests currently flagged high priority by the urgency detector.
            </p>
          </div>

          <div className="white-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--badge-solved-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={20} color="var(--badge-solved-text)" />
              </div>
              <span className="card-label" style={{ margin: 0 }}>MENTOR POOL</span>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: 'var(--badge-solved-text)' }}>
              {stats.mentorPool}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Trusted helpers with strong response history actively helping.
            </p>
          </div>
        </div>

        {/* AI Recommendations */}
        <div style={{ marginTop: '48px' }}>
          <div style={{ marginBottom: '24px' }}>
            <span className="eyebrow eyebrow-teal" style={{ display: 'block', marginBottom: '8px' }}>
              AI RECOMMENDATIONS
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>
              Requests needing attention
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ height: '100px' }} />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="white-card" style={{ padding: '48px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  No requests available for analysis.
                </p>
              </div>
            ) : (
              requests.filter(r => r.status === 'open').map((request, idx) => (
                <div 
                  key={request.id}
                  className="white-card"
                  style={{ 
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <span className={`badge ${getUrgencyBadge(request.urgency)}`}>
                        {request.urgency}
                      </span>
                      <span className="badge badge-tag">{request.category}</span>
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                      {request.title}
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      by {request.authorName} • {request.authorLocation || 'Remote'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-teal">
                      {request.helperCount || 0} helpers
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICenterPage;
