import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleProtectedRoute from './components/layout/RoleProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import ExplorePage from './pages/ExplorePage';
import CreateRequestPage from './pages/CreateRequestPage';
import RequestDetailPage from './pages/RequestDetailPage';
import MessagesPage from './pages/MessagesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AICenterPage from './pages/AICenterPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';

// Public Route - redirects to dashboard if logged in
const PublicRoute = ({ children }) => {
  const { user, loading, isOnboardingComplete } = useAuth();

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
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Loading...
        </p>
      </div>
    );
  }

  if (user) {
    return <Navigate to={isOnboardingComplete ? '/dashboard' : '/onboarding'} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
      
      {/* Protected Routes */}
      <Route path="/onboarding" element={
        <ProtectedRoute requireOnboarding={false}>
          <OnboardingPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/admin-dashboard" element={
        <RoleProtectedRoute requireAdmin={true}>
          <AdminDashboard />
        </RoleProtectedRoute>
      } />
      <Route path="/explore" element={
        <ProtectedRoute>
          <ExplorePage />
        </ProtectedRoute>
      } />
      <Route path="/create" element={
        <RoleProtectedRoute requireNeedHelp={true}>
          <CreateRequestPage />
        </RoleProtectedRoute>
      } />
      <Route path="/request/:id" element={
        <ProtectedRoute>
          <RequestDetailPage />
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute>
          <MessagesPage />
        </ProtectedRoute>
      } />
      <Route path="/messages/:conversationId" element={
        <ProtectedRoute>
          <MessagesPage />
        </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <RoleProtectedRoute requireCanHelp={true}>
          <LeaderboardPage />
        </RoleProtectedRoute>
      } />
      <Route path="/ai-center" element={
        <RoleProtectedRoute requireCanHelp={true}>
          <AICenterPage />
        </RoleProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
      } />
      <Route path="/profile/:uid" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
