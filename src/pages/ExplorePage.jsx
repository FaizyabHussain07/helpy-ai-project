import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { db } from '../config/firebase';
import Navbar from '../components/layout/Navbar';
import RequestCard from '../components/cards/RequestCard';
import SkeletonLoader from '../components/ui/SkeletonLoader';

const ExplorePage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [notificationCount] = useState(0);

  // Filters
  const [category, setCategory] = useState('all');
  const [urgency, setUrgency] = useState('all');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');

  const categories = ['all', 'Web Development', 'Design', 'Career', 'Study', 'Other'];
  const urgencies = ['all', 'High', 'Medium', 'Low'];

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, category, urgency, skills, location]);

  const fetchRequests = async (isLoadMore = false) => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'requests'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      if (isLoadMore && lastDoc) {
        q = query(
          collection(db, 'requests'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(10)
        );
      }

      const snapshot = await getDocs(q);
      const newRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (isLoadMore) {
        setRequests(prev => [...prev, ...newRequests]);
      } else {
        setRequests(newRequests);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 10);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    if (category !== 'all') {
      filtered = filtered.filter(r => r.category === category);
    }

    if (urgency !== 'all') {
      filtered = filtered.filter(r => r.urgency === urgency);
    }

    if (skills.trim()) {
      const skillTerms = skills.toLowerCase().split(',').map(s => s.trim());
      filtered = filtered.filter(r => 
        skillTerms.some(term => 
          r.tags?.some(tag => tag.toLowerCase().includes(term)) ||
          r.title.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term)
        )
      );
    }

    if (location.trim()) {
      const locTerm = location.toLowerCase();
      filtered = filtered.filter(r => 
        r.authorLocation?.toLowerCase().includes(locTerm)
      );
    }

    setFilteredRequests(filtered);
  };

  const clearFilters = () => {
    setCategory('all');
    setUrgency('all');
    setSkills('');
    setLocation('');
  };

  const hasActiveFilters = category !== 'all' || urgency !== 'all' || skills || location;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar notificationCount={notificationCount} />

      <div className="page-container">
        {/* Hero Card */}
        <div className="hero-card">
          <span className="eyebrow eyebrow-muted" style={{ display: 'block', marginBottom: '12px' }}>
            EXPLORE / FEED
          </span>
          <h1 className="hero-title" style={{ marginBottom: '8px' }}>
            Browse help requests with filterable community context.
          </h1>
          <p className="hero-subtitle">
            Filter by category, urgency, skills, and location to find the perfect match.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '30% 70%', gap: '24px', marginTop: '32px' }}>
          {/* Left - Filters */}
          <div className="white-card" style={{ padding: '28px', height: 'fit-content' }}>
            <span className="card-label" style={{ display: 'block', marginBottom: '4px' }}>
              FILTERS
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>
              Refine the feed
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: 'var(--text-secondary)'
              }}>
                Category
              </label>
              <select 
                className="select-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: 'var(--text-secondary)'
              }}>
                Urgency
              </label>
              <select 
                className="select-field"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
              >
                {urgencies.map(u => (
                  <option key={u} value={u}>
                    {u === 'all' ? 'All urgency levels' : u}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: 'var(--text-secondary)'
              }}>
                Skills
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="React, Figma, Git/GitHub"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: 'var(--text-secondary)'
              }}>
                Location
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Karachi, Lahore, Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {hasActiveFilters && (
              <button 
                className="btn-outline"
                style={{ width: '100%', fontSize: '13px' }}
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Right - Request List */}
          <div>
            {loading && requests.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonLoader key={i} height="140px" />
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="white-card" style={{ padding: '48px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  No requests match your filters
                </p>
                {hasActiveFilters && (
                  <button 
                    className="btn-outline"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredRequests.map((request) => (
                    <RequestCard 
                      key={request.id} 
                      request={request}
                      onClick={() => navigate(`/request/${request.id}`)}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <button 
                      className="btn-outline"
                      onClick={() => fetchRequests(true)}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
