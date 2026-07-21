import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import Dashboard from './pages/Dashboard';
import SavedPage from './pages/SavedPage';
import TrackBookingPage from './pages/TrackBookingPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/landing" />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/track/:bookingId" element={<TrackBookingPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
