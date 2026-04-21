import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Home, Compass, Trophy, MessageSquare, User, Bot, PlusCircle, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ 
  showLinks = true, 
  activeLink = null,
  customLinks = null,
  notificationCount = 0 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const currentPath = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name) => {
    if (!name) return 'avatar-teal';
    const colors = ['avatar-orange', 'avatar-navy', 'avatar-coral', 'avatar-teal'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Role-based navigation links
  const getRoleBasedLinks = () => {
    const role = userData?.role;
    
    // Common links for all authenticated users
    const commonLinks = [
      { path: '/dashboard', label: 'Home', icon: Home },
      { path: '/explore', label: 'Explore', icon: Compass },
    ];
    
    // Need Help (Seeker) specific
    if (role === 'seeker') {
      return [
        ...commonLinks,
        { path: '/create', label: 'New Request', icon: PlusCircle },
      ];
    }
    
    // Can Help (Helper) specific
    if (role === 'helper') {
      return [
        ...commonLinks,
        { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
        { path: '/ai-center', label: 'AI Center', icon: Bot },
      ];
    }
    
    // Both - can access everything
    if (role === 'both') {
      return [
        ...commonLinks,
        { path: '/create', label: 'New Request', icon: PlusCircle },
        { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
        { path: '/ai-center', label: 'AI Center', icon: Bot },
      ];
    }
    
    // Admin or fallback
    return [
      { path: '/dashboard', label: 'Home', icon: Home },
      { path: '/explore', label: 'Explore', icon: Compass },
      { path: '/admin-dashboard', label: 'Admin', icon: User },
    ];
  };

  const links = customLinks || getRoleBasedLinks();

  const isActive = (path) => {
    if (activeLink) return activeLink === path;
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">H</div>
          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
            HelpHub AI
          </span>
        </div>

        {showLinks && (
          <div className="nav-links">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActive(link.path) ? 'nav-link-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="nav-actions">
          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {!user ? (
            <>
              <button 
                className="btn-outline desktop-only"
                onClick={() => navigate('/login')}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Login
              </button>
              <button 
                className="btn-primary desktop-only"
                onClick={() => navigate('/signup')}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              <button 
                className="notification-btn desktop-only"
                onClick={() => navigate('/notifications')}
              >
                <Bell size={18} color="var(--text-secondary)" />
                {notificationCount > 0 && (
                  <span className="notification-badge">{notificationCount}</span>
                )}
              </button>
              
              <div 
                className={`avatar desktop-only ${getAvatarColor(userData?.displayName || user.displayName)}`}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${user.uid}`)}
              >
                {getInitials(userData?.displayName || user.displayName)}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <span style={{ fontWeight: 700, fontSize: '18px' }}>Menu</span>
              <button 
                className="mobile-menu-close"
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {user && (
              <div className="mobile-user-section">
                <div 
                  className={`avatar ${getAvatarColor(userData?.displayName || user.displayName)}`}
                  style={{ width: '56px', height: '56px', fontSize: '18px' }}
                >
                  {getInitials(userData?.displayName || user.displayName)}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '16px' }}>{userData?.displayName || user.displayName}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {userData?.role === 'seeker' ? 'Need Help' : 
                     userData?.role === 'helper' ? 'Can Help' : 
                     userData?.role === 'both' ? 'Helper & Seeker' : 
                     userData?.role || 'Member'}
                  </p>
                </div>
              </div>
            )}

            <div className="mobile-menu-links">
              {showLinks && links.map((link) => {
                const LinkIcon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`mobile-menu-link ${isActive(link.path) ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    <LinkIcon size={20} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              
              {!user && (
                <>
                  <Link
                    to="/login"
                    className="mobile-menu-link"
                    onClick={closeMobileMenu}
                  >
                    <User size={20} />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="mobile-menu-link"
                    onClick={closeMobileMenu}
                  >
                    <PlusCircle size={20} />
                    <span>Sign Up</span>
                  </Link>
                </>
              )}

              {user && (
                <Link
                  to="/notifications"
                  className="mobile-menu-link"
                  onClick={closeMobileMenu}
                >
                  <Bell size={20} />
                  <span>Notifications</span>
                  {notificationCount > 0 && (
                    <span className="mobile-notification-badge">{notificationCount}</span>
                  )}
                </Link>
              )}

              {user && (
                <Link
                  to={`/profile/${user.uid}`}
                  className="mobile-menu-link"
                  onClick={closeMobileMenu}
                >
                  <User size={20} />
                  <span>My Profile</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
