import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Avatar from '../components/ui/Avatar';
import { Star, Award, TrendingUp } from 'lucide-react';

const LeaderboardPage = () => {
  const { userData } = useAuth();
  const [topHelpers, setTopHelpers] = useState([]);
  const [activeTab, setActiveTab] = useState('contributions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopHelpers();
  }, [activeTab]);

  const fetchTopHelpers = async () => {
    setLoading(true);
    try {
      // Query for helpers and both roles, ordered by different metrics based on tab
      let orderField = 'contributions';
      if (activeTab === 'rating') orderField = 'rating';
      if (activeTab === 'trust') orderField = 'trustScore';
      
      const usersQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['helper', 'both']),
        orderBy(orderField, 'desc'),
        limit(15)
      );
      
      const snapshot = await getDocs(usersQuery);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTopHelpers(users);
    } catch (err) {
      console.error('Error fetching top helpers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColorClass = (name) => {
    if (!name) return 'avatar-teal';
    if (name.includes('Ayesha')) return 'avatar-orange';
    if (name.includes('Hassan')) return 'avatar-navy';
    if (name.includes('Sara')) return 'avatar-coral';
    const colors = ['avatar-orange', 'avatar-navy', 'avatar-coral', 'avatar-teal'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const getRankIcon = (idx) => {
    if (idx === 0) return <Award size={20} color="#fbbf24" />;
    if (idx === 1) return <Award size={20} color="#9ca3af" />;
    if (idx === 2) return <Award size={20} color="#b45309" />;
    return <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</span>;
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div className="page-container">
        {/* Hero Card */}
        <div className="hero-card">
          <span className="eyebrow eyebrow-muted" style={{ display: 'block', marginBottom: '12px' }}>
            LEADERBOARD
          </span>
          <h1 className="hero-title" style={{ marginBottom: '8px' }}>
            Recognize the people who keep the community moving.
          </h1>
          <p className="hero-subtitle">
            Trust score, contribution count, and badges create visible momentum for reliable helpers.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '60% 38%', gap: '2%', marginTop: '32px' }}>
          {/* Left - Top Helpers */}
          <div className="white-card" style={{ padding: '28px' }}>
            <span className="card-label" style={{ display: 'block', marginBottom: '4px' }}>
              CAN HELP LEADERS
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>
              Community Helpers Rankings
            </h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {[
                { id: 'contributions', label: 'Contributions', icon: TrendingUp },
                { id: 'rating', label: 'Top Rated', icon: Star },
                { id: 'trust', label: 'Trust Score', icon: Award }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    background: activeTab === tab.id ? 'var(--teal)' : 'var(--teal-light)',
                    color: activeTab === tab.id ? 'white' : 'var(--teal)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton" style={{ height: '70px' }} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {topHelpers.map((helper, idx) => (
                  <div 
                    key={helper.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px 0',
                      borderBottom: idx < topHelpers.length - 1 ? '1px solid var(--border)' : 'none',
                      background: helper.id === userData?.uid ? 'var(--teal-light)' : 'transparent',
                      margin: '0 -16px',
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      borderRadius: helper.id === userData?.uid ? '12px' : '0'
                    }}
                  >
                    <div style={{ width: '36px', display: 'flex', justifyContent: 'center' }}>
                      {getRankIcon(idx)}
                    </div>
                    
                    <Avatar name={helper.displayName} size={48} />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: '15px', fontWeight: 700 }}>{helper.displayName}</p>
                        {helper.rating > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Star size={12} fill="#fbbf24" color="#fbbf24" />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {helper.rating.toFixed(1)}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              ({helper.ratingCount || 0})
                            </span>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {helper.skills?.slice(0, 3).join(' • ') || 'Helper'}
                      </p>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-teal" style={{ fontSize: '11px', marginBottom: '4px', display: 'inline-block' }}>
                        {helper.contributions || 0} helped
                      </span>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Trust {helper.trustScore || 50}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right - Stats & Info */}
          <div className="white-card" style={{ padding: '28px', height: 'fit-content' }}>
            <span className="card-label" style={{ display: 'block', marginBottom: '4px' }}>
              HOW RANKING WORKS
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>
              Ranking Criteria
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'var(--teal-light)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <TrendingUp size={20} color="var(--teal)" />
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>Contributions</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Number of requests successfully completed and marked as solved by seekers.
                </p>
              </div>

              <div style={{ padding: '16px', background: '#fef3d8', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <Star size={20} color="#9a6800" />
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>Ratings</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Average rating from seekers who received help. Higher ratings improve your visibility.
                </p>
              </div>

              <div style={{ padding: '16px', background: '#dbeafe', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <Award size={20} color="#1e40af" />
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>Trust Score</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Based on your activity, response time, and community engagement. Starts at 50%.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Only users with "Can Help" or "Both" roles appear on this leaderboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
