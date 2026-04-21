import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Eye, EyeOff } from 'lucide-react';

const AuthPage = ({ defaultTab = 'login' }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('seeker');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const userDoc = await doc(db, 'users', result.user.uid);
      
      // Check onboarding status - will be handled by ProtectedRoute
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      
      await updateProfile(result.user, {
        displayName: signupName
      });

      // Create user document
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: signupEmail,
        displayName: signupName,
        photoURL: result.user.photoURL || null,
        role: signupRole,
        skills: [],
        interests: [],
        location: '',
        bio: '',
        trustScore: 50,
        badges: [],
        contributions: 0,
        onboardingDone: false,
        createdAt: serverTimestamp()
      });

      navigate('/onboarding');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Public Navbar */}
      <nav className="navbar">
        <div className="nav-logo">
          <div className="logo-icon">H</div>
          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
            HelpHub AI
          </span>
        </div>
        <div className="nav-links">
          <a href="/" className="nav-link">Home</a>
          <a href="/explore" className="nav-link">Explore</a>
          <a href="/leaderboard" className="nav-link">Leaderboard</a>
        </div>
        <div className="nav-actions">
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Community Access
          </span>
        </div>
      </nav>

      <div className="page-container">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '45% 50%', 
          gap: '5%',
          minHeight: 'calc(100vh - 200px)',
          alignItems: 'center'
        }}>
          {/* LEFT - Dark Card */}
          <div className="hero-card">
            <span className="eyebrow eyebrow-muted" style={{ display: 'block', marginBottom: '16px' }}>
              COMMUNITY ACCESS
            </span>
            <h1 className="hero-title" style={{ marginBottom: '16px' }}>
              Enter the support network.
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '32px',
              lineHeight: 1.7
            }}>
              HelpHub AI connects students, mentors, and helpers in a trusted ecosystem where problems get solved and skills get shared.
            </p>

            {/* Feature bullets */}
            <div style={{ marginBottom: '32px' }}>
              {[
                'AI-powered request intelligence',
                'Trust score and badge system',
                'Direct messaging with helpers'
              ].map((feature, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  marginBottom: '12px',
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'white'
                  }} />
                  {feature}
                </div>
              ))}
            </div>

            {/* Role chips */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span className="badge" style={{ 
                background: 'rgba(255,255,255,0.12)', 
                color: 'white',
                fontSize: '12px'
              }}>
                Need Help
              </span>
              <span className="badge" style={{ 
                background: 'rgba(255,255,255,0.12)', 
                color: 'white',
                fontSize: '12px'
              }}>
                Can Help
              </span>
              <span className="badge" style={{ 
                background: 'rgba(255,255,255,0.12)', 
                color: 'white',
                fontSize: '12px'
              }}>
                Both
              </span>
            </div>
          </div>

          {/* RIGHT - White Card */}
          <div className="white-card" style={{ padding: '48px' }}>
            <span className="eyebrow eyebrow-teal" style={{ display: 'block', marginBottom: '8px' }}>
              LOGIN / SIGNUP
            </span>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '32px' }}>
              Authenticate your community profile
            </h2>

            {/* Tabs */}
            <div className="tab-pills" style={{ marginBottom: '32px' }}>
              <button 
                className={`tab-pill ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Login
              </button>
              <button 
                className={`tab-pill ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => setActiveTab('signup')}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div style={{ 
                padding: '12px 16px', 
                background: 'var(--badge-high-bg)', 
                color: 'var(--badge-high-text)',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    marginBottom: '8px',
                    color: 'var(--text-secondary)'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
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
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ width: '100%' }}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Continue to dashboard'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    marginBottom: '8px',
                    color: 'var(--text-secondary)'
                  }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="John Doe"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    marginBottom: '8px',
                    color: 'var(--text-secondary)'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    marginBottom: '8px',
                    color: 'var(--text-secondary)'
                  }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    marginBottom: '12px',
                    color: 'var(--text-secondary)'
                  }}>
                    I want to...
                  </label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'seeker', label: 'Need Help' },
                      { id: 'helper', label: 'Can Help' },
                      { id: 'both', label: 'Both' }
                    ].map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        className={`tab-pill ${signupRole === role.id ? 'active' : ''}`}
                        onClick={() => setSignupRole(role.id)}
                        style={{
                          padding: '10px 20px',
                          fontSize: '14px'
                        }}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ width: '100%' }}
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
