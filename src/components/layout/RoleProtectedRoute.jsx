import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RoleProtectedRoute = ({ 
  children, 
  requireOnboarding = true,
  requireNeedHelp = false,
  requireCanHelp = false,
  requireAdmin = false,
  requireBoth = false
}) => {
  const { user, userData, loading, isNeedHelp, isCanHelp, isAdmin, hasBothRoles } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Loading...
        </p>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check onboarding status
  const onboardingDone = userData?.onboardingDone === true;
  
  if (requireOnboarding && !onboardingDone && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If onboarding is done and trying to access onboarding page, redirect to dashboard
  if (onboardingDone && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  // Role-based access checks
  if (requireAdmin && !isAdmin) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '48px' }}>
        <div className="white-card" style={{ padding: '48px', maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px', color: 'var(--coral)' }}>
            Admin Access Required
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            You need admin privileges to access this page.
          </p>
          <button 
            className="btn-primary"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (requireNeedHelp && !isNeedHelp && !isAdmin) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '48px' }}>
        <div className="white-card" style={{ padding: '48px', maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px', color: 'var(--coral)' }}>
            Need Help Role Required
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            This feature is only available for users who need help. 
            Update your role in your profile settings.
          </p>
          <button 
            className="btn-primary"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (requireCanHelp && !isCanHelp && !isAdmin) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '48px' }}>
        <div className="white-card" style={{ padding: '48px', maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px', color: 'var(--coral)' }}>
            Can Help Role Required
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            This feature is only available for users who can help others.
            Update your role in your profile settings.
          </p>
          <button 
            className="btn-primary"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (requireBoth && !hasBothRoles && !isAdmin) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '48px' }}>
        <div className="white-card" style={{ padding: '48px', maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px', color: 'var(--coral)' }}>
            Both Roles Required
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            This feature requires you to have both "Need Help" and "Can Help" roles.
            Update your role in your profile settings.
          </p>
          <button 
            className="btn-primary"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleProtectedRoute;
