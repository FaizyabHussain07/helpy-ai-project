import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, Users, Shield, Award } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

const LandingPage = () => {
  const navigate = useNavigate();

  const publicNavLinks = [
    { path: '/', label: 'Home' },
    { path: '/explore', label: 'Explore' },
    { path: '/leaderboard', label: 'Leaderboard' },
  ];

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
          {publicNavLinks.map((link) => (
            <a
              key={link.path}
              href={link.path}
              className={`nav-link ${link.path === '/' ? 'nav-link-active' : ''}`}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="nav-actions">
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Live community signals
          </span>
          <button 
            className="btn-primary"
            onClick={() => navigate('/login')}
          >
            Join the platform
          </button>
        </div>
      </nav>

      <div className="page-container">
        {/* SECTION 1 — Hero */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '24px' }}>
          {/* LEFT COL */}
          <div>
            <span className="eyebrow eyebrow-teal" style={{ marginBottom: '16px', display: 'block' }}>
              SMIT GRAND CODING NIGHT 2026
            </span>
            <h1 style={{ 
              fontSize: 'clamp(32px, 4vw, 52px)', 
              fontWeight: 800, 
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: '20px'
            }}>
              Find help faster.<br/>
              Become help that<br/>
              matters.
            </h1>
            <p style={{ 
              fontSize: '15px', 
              color: 'var(--text-secondary)', 
              lineHeight: 1.7,
              marginBottom: '28px',
              maxWidth: '440px'
            }}>
              HelpHub AI is a community-powered support network where students, mentors, and helpers connect to solve real problems together.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
              <button className="btn-outline" onClick={() => navigate('/explore')}>
                Open product demo
              </button>
              <button className="btn-primary" onClick={() => navigate('/create')}>
                Post a request
              </button>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="stat-card" style={{ flex: 1, padding: '20px' }}>
                <div className="stat-label">MEMBERS</div>
                <div className="stat-value">384+</div>
                <div className="stat-desc">Students, mentors, and helpers in the loop.</div>
              </div>
              <div className="stat-card" style={{ flex: 1, padding: '20px' }}>
                <div className="stat-label">REQUESTS</div>
                <div className="stat-value">72+</div>
                <div className="stat-desc">Support posts shared across learning journeys.</div>
              </div>
              <div className="stat-card" style={{ flex: 1, padding: '20px' }}>
                <div className="stat-label">SOLVED</div>
                <div className="stat-value">69+</div>
                <div className="stat-desc">Problems resolved through fast community action.</div>
              </div>
            </div>
          </div>

          {/* RIGHT COL - Dark Card */}
          <div 
            className="hero-card" 
            style={{ 
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Amber decorative circle */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              opacity: 0.8
            }} />

            <span className="eyebrow eyebrow-muted" style={{ marginBottom: '12px' }}>
              LIVE PRODUCT FEEL
            </span>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: 700, 
              color: 'white',
              marginBottom: '12px',
              lineHeight: 1.3
            }}>
              More than a form.<br/>More like an ecosystem.
            </h2>
            <p style={{ 
              fontSize: '14px', 
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '28px',
              lineHeight: 1.6
            }}>
              A platform that understands your needs before you finish typing, connecting you with helpers who genuinely care about your success.
            </p>

            {/* Feature Sub-cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Sparkles size={20} color="var(--teal)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    AI request intelligence
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Auto-categorization, urgency detection, and smart matching
                  </div>
                </div>
              </div>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Shield size={20} color="var(--teal)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    Community trust graph
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Badges, helper rankings, trust score boosts
                  </div>
                </div>
              </div>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Award size={20} color="var(--teal)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    100%
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Top trust score currently active across the sample mentor network
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 — Core Flow */}
        <div style={{ marginTop: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <span className="eyebrow eyebrow-teal" style={{ display: 'block', marginBottom: '8px' }}>
                CORE FLOW
              </span>
              <h2 style={{ fontSize: '28px', fontWeight: 800 }}>
                From struggling alone to solving together
              </h2>
            </div>
            <button className="btn-outline" onClick={() => navigate('/login')}>
              Try onboarding AI →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div className="white-card" style={{ padding: '28px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--teal-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--teal)' }}>1</span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Ask for help clearly
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Create structured requests with category, urgency, and AI suggestions to get noticed by the right people.
              </p>
            </div>
            <div className="white-card" style={{ padding: '28px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--teal-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--teal)' }}>2</span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Discover the right people
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Use the explore feed, helper lists, and smart notifications to connect with those who can truly help.
              </p>
            </div>
            <div className="white-card" style={{ padding: '28px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--teal-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--teal)' }}>3</span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Track real contribution
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Build trust scores, earn badges, and see your solved requests create visible impact.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3 — Featured Requests */}
        <div style={{ marginTop: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <span className="eyebrow eyebrow-teal" style={{ display: 'block', marginBottom: '8px' }}>
                FEATURED REQUESTS
              </span>
              <h2 style={{ fontSize: '28px', fontWeight: 800 }}>
                Community problems currently in motion
              </h2>
            </div>
            <button className="btn-outline" onClick={() => navigate('/explore')}>
              View full feed →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {/* Demo Request 1 */}
            <div className="request-card">
              <div className="request-card-badges">
                <span className="badge badge-high">High</span>
                <span className="badge badge-solved">Solved</span>
                <span className="badge badge-tag">Web Dev</span>
              </div>
              <h3 className="request-card-title">Need help making my portfolio responsive</h3>
              <p className="request-card-desc">
                Before demo day I need to make sure my portfolio works on mobile devices. Currently having issues with CSS grid layouts.
              </p>
              <div className="request-card-tags">
                <span className="badge badge-tag" style={{ fontSize: '11px', padding: '4px 10px' }}>HTML/CSS</span>
                <span className="badge badge-tag" style={{ fontSize: '11px', padding: '4px 10px' }}>Responsive</span>
                <span className="badge badge-tag" style={{ fontSize: '11px', padding: '4px 10px' }}>Portfolio</span>
              </div>
              <div className="request-card-footer">
                <span className="request-card-author">Sara Noor • Remote • 2 helpers interested</span>
              </div>
            </div>

            {/* Demo Request 2 */}
            <div className="request-card">
              <div className="request-card-badges">
                <span className="badge badge-medium">Medium</span>
                <span className="badge badge-open">Open</span>
                <span className="badge badge-tag">Design</span>
              </div>
              <h3 className="request-card-title">Looking for Figma feedback on volunteer event poster</h3>
              <p className="request-card-desc">
                Created a poster for our upcoming coding workshop. Need feedback on typography and color choices before printing.
              </p>
              <div className="request-card-tags">
                <span className="badge badge-tag" style={{ fontSize: '11px', padding: '4px 10px' }}>Figma</span>
                <span className="badge badge-tag" style={{ fontSize: '11px', padding: '4px 10px' }}>Poster</span>
                <span className="badge badge-tag" style={{ fontSize: '11px', padding: '4px 10px' }}>Design Review</span>
              </div>
              <div className="request-card-footer">
                <span className="request-card-author">Ayesha Khan • Karachi • Be the first to help</span>
              </div>
            </div>

            {/* Demo Request 3 */}
            <div className="request-card">
              <div className="request-card-badges">
                <span className="badge badge-low">Low</span>
                <span className="badge badge-solved">Solved</span>
                <span className="badge badge-tag">Career</span>
              </div>
              <h3 className="request-card-title">Need mock interview support for internship applications</h3>
              <p className="request-card-desc">
                Preparing for frontend developer internship interviews. Looking for someone to do mock technical interviews with me.
              </p>
              <div className="request-card-tags">
                <span className="badge badge-tag" style={{ fontSize: '11px', padding: '4px 10px' }}>Interview Prep</span>
                <span className="badge badge-tag" style={{ fontSize: '11px', padding: '4px 10px' }}>Career</span>
                <span className="badge badge-tag" style={{ fontSize: '11px', padding: '4px 10px' }}>Frontend</span>
              </div>
              <div className="request-card-footer">
                <span className="request-card-author">Sara Noor • Remote • 1 helper interested</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ 
          marginTop: '80px', 
          padding: '32px 0',
          borderTop: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            HelpHub AI is built as a premium-feel, multi-page community support product using Vite, React, Firebase.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
