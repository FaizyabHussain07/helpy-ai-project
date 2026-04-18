import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Avatar from '../components/ui/Avatar';
import { Save, LogOut } from 'lucide-react';

const ProfilePage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { user, userData: currentUserData } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit form state
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editInterests, setEditInterests] = useState('');

  const isOwnProfile = user?.uid === uid;

  useEffect(() => {
    fetchProfile();
  }, [uid]);

  const fetchProfile = async () => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        setProfileData(data);
        
        // Initialize edit form
        setEditName(data.displayName || '');
        setEditLocation(data.location || '');
        setEditSkills(data.skills?.join(', ') || '');
        setEditInterests(data.interests?.join(', ') || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isOwnProfile) return;
    
    setSaving(true);
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        displayName: editName,
        location: editLocation,
        skills: editSkills.split(',').map(s => s.trim()).filter(s => s),
        interests: editInterests.split(',').map(s => s.trim()).filter(s => s),
        updatedAt: serverTimestamp()
      });
      
      setProfileData({
        ...profileData,
        displayName: editName,
        location: editLocation,
        skills: editSkills.split(',').map(s => s.trim()).filter(s => s),
        interests: editInterests.split(',').map(s => s.trim()).filter(s => s)
      });
      
      setEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <div className="page-container" style={{ textAlign: 'center', padding: '48px' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <div className="page-container">
          <div className="white-card" style={{ padding: '48px', textAlign: 'center' }}>
            <p>Profile not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div className="page-container">
        {/* Hero Card */}
        <div className="hero-card">
          <span className="eyebrow eyebrow-muted" style={{ display: 'block', marginBottom: '12px' }}>
            PROFILE
          </span>
          <h1 className="hero-title" style={{ marginBottom: '8px' }}>
            {profileData.displayName}
          </h1>
          <p className="hero-subtitle">
            {(profileData.role === 'both' ? 'Helper & Seeker' : profileData.role === 'helper' ? 'Helper' : 'Seeker')}
            {profileData.location && ` • ${profileData.location}`}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '60% 35%', gap: '5%', marginTop: '32px' }}>
          {/* Left - Public Profile */}
          <div className="white-card" style={{ padding: '28px' }}>
            <span className="card-label" style={{ display: 'block', marginBottom: '4px' }}>
              PUBLIC PROFILE
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>
              Skills and reputation
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Trust score
                </span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--teal)' }}>
                  {profileData.trustScore || 50}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${profileData.trustScore || 50}%` }}
                />
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '16px 0',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Contributions
              </span>
              <span style={{ fontSize: '18px', fontWeight: 800 }}>
                {profileData.contributions || 0}
              </span>
            </div>

            <div style={{ marginTop: '24px', marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: 600, 
                marginBottom: '12px',
                color: 'var(--text-muted)'
              }}>
                SKILLS
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profileData.skills?.length > 0 ? (
                  profileData.skills.map((skill, idx) => (
                    <span key={idx} className="badge badge-teal">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    No skills listed yet
                  </span>
                )}
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: 600, 
                marginBottom: '12px',
                color: 'var(--text-muted)'
              }}>
                BADGES
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profileData.badges?.length > 0 ? (
                  profileData.badges.map((badge, idx) => (
                    <span key={idx} className="badge badge-tag">
                      {badge}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    No badges earned yet
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right - Edit Profile (only for own profile) */}
          {isOwnProfile && (
            <div className="white-card" style={{ padding: '28px', height: 'fit-content' }}>
              <span className="card-label" style={{ display: 'block', marginBottom: '4px' }}>
                EDIT PROFILE
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>
                Update your identity
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    marginBottom: '8px',
                    color: 'var(--text-secondary)'
                  }}>
                    Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div>
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
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="City or Remote"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: 'var(--text-secondary)'
                }}>
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  placeholder="React, Python, Design..."
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
                  Interests (comma separated)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={editInterests}
                  onChange={(e) => setEditInterests(e.target.value)}
                  placeholder="Career growth, Web dev..."
                />
              </div>

              <button 
                className="btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save profile'}
              </button>

              <button 
                className="btn-outline"
                style={{ 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  color: 'var(--badge-high-text)',
                  borderColor: 'var(--badge-high-text)'
                }}
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
